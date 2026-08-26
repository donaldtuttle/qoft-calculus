#!/bin/sh
# Refresh only from the approved public skill; --check never writes.
# Usage: sh scripts/fetch-skill.sh [--check|--apply]
set -eu

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET="$REPO_ROOT/SKILL.md"
URL=${QOFT_SKILL_URL:-https://glyphogenic-calculus.grok.me/SKILL.md}
EXPECTED_SHA256='fedda471e07a876bdb72cb2424986ae3eec6d002d003a680b231ea8cbd246fbb'
CLOSED_LINE='Ξ, Πᴽ, Γ, ⊕, Λψ, Σ◯, Θλ, Ωµ, Π↺, Ψmeta, Φ, ρ.'
MODE=apply

usage() {
  echo "usage: sh scripts/fetch-skill.sh [--check|--apply]" >&2
}

if [ "$#" -gt 1 ]; then
  usage
  exit 64
fi

case "${1:-}" in
  "") MODE=apply ;;
  --check) MODE=check ;;
  --apply) MODE=apply ;;
  *) usage; exit 64 ;;
esac

# Create temp on the same filesystem as TARGET so mv is atomic.
TMP=$(mktemp "${TARGET}.tmp.XXXXXX")
cleanup() { rm -f "$TMP"; }
trap cleanup 0 HUP INT TERM

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$1" | awk '{print $NF}'
  else
    echo "ERROR: no SHA-256 tool found (sha256sum, shasum, or openssl)" >&2
    exit 1
  fi
}

echo "fetching $URL ..."
if ! HTTP_CODE=$(curl -fsSL -w "%{http_code}" -o "$TMP" "$URL"); then
  echo "ERROR: fetch failed for $URL" >&2
  exit 1
fi

case "$URL" in
  https://*) EXPECTED_HTTP_CODE=200 ;;
  file://*) EXPECTED_HTTP_CODE=000 ;; # deterministic local contract tests
  *)
    echo "ERROR: URL must use https:// or file://" >&2
    exit 1
    ;;
esac

if [ "$HTTP_CODE" != "$EXPECTED_HTTP_CODE" ]; then
  echo "ERROR: HTTP $HTTP_CODE from $URL" >&2
  exit 1
fi

SIZE=$(wc -c < "$TMP" | tr -d ' ')
if [ "$SIZE" -lt 500 ]; then
  echo "ERROR: response too small ($SIZE bytes)" >&2
  exit 1
fi

if command -v iconv >/dev/null 2>&1; then
  if ! iconv -f UTF-8 -t UTF-8 "$TMP" >/dev/null 2>&1; then
    echo "ERROR: content is not valid UTF-8" >&2
    exit 1
  fi
fi

if ! head -n 1 "$TMP" | grep -q '^---$'; then
  echo "ERROR: missing YAML frontmatter start" >&2
  exit 1
fi
if ! grep -q '^name: qoft-calculus$' "$TMP"; then
  echo "ERROR: missing or incorrect name: frontmatter field" >&2
  exit 1
fi
if ! grep -q '^Allowed operator glyphs (closed set):$' "$TMP"; then
  echo "ERROR: missing closed-set section header" >&2
  exit 1
fi
if ! grep -Fqx "$CLOSED_LINE" "$TMP"; then
  if ! grep -E "^Ξ, Πᴽ, Γ, ⊕, Λψ, Σ◯, Θλ, Ωµ, Π↺, Ψmeta, Φ, ρ\.?[[:space:]]*$" "$TMP" >/dev/null; then
    echo "ERROR: exact closed-set line not found" >&2
    exit 1
  fi
fi
if grep -q "Ωµ’s" "$TMP"; then
  echo "ERROR: garbled Ωµ attribution present — refusing to continue" >&2
  exit 1
fi

NEW_HASH=$(sha256_file "$TMP")
echo "downloaded SHA-256: $NEW_HASH"
echo "approved   SHA-256: $EXPECTED_SHA256"

if [ "$NEW_HASH" != "$EXPECTED_SHA256" ]; then
  echo "ERROR: unapproved skill hash; update the pin only through review" >&2
  exit 3
fi

if [ -f "$TARGET" ]; then
  OLD_HASH=$(sha256_file "$TARGET")
  echo "repository SHA-256: $OLD_HASH"
  if [ "$NEW_HASH" = "$OLD_HASH" ]; then
    echo "approved skill present; no drift"
    exit 0
  fi
  echo "repository drift detected"
else
  echo "repository skill is missing"
fi

if [ "$MODE" = check ]; then
  echo "check-only: not overwriting; rerun with --apply after review" >&2
  exit 2
fi

chmod 0644 "$TMP"
mv -f "$TMP" "$TARGET"
trap - 0 HUP INT TERM
echo "wrote approved skill to $TARGET"
