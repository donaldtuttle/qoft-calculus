#!/bin/sh
# Harden: download → UTF-8 / frontmatter / closed-set validate → SHA-256 → compare → same-FS atomic replace
# Usage: sh scripts/fetch-skill.sh [--check]
set -e
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET="$REPO_ROOT/SKILL.md"
# Create temp on the same filesystem as TARGET so mv is atomic
TMP=$(mktemp "${TARGET}.tmp.XXXXXX")
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

URL="https://glyphogenic-calculus.grok.me/SKILL.md"
CLOSED_LINE='Ξ, Πᴽ, Γ, ⊕, Λψ, Σ◯, Θλ, Ωµ, Π↺, Ψmeta, Φ, ρ.'

cleanup() { rm -f "$TMP"; }
trap cleanup EXIT

echo "fetching $URL ..."
HTTP_CODE=$(curl -fsSL -w "%{http_code}" -o "$TMP" "$URL" || true)
if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: HTTP $HTTP_CODE from $URL" >&2
  exit 1
fi

SIZE=$(wc -c < "$TMP" | tr -d ' ')
if [ "$SIZE" -lt 500 ]; then
  echo "ERROR: response too small ($SIZE bytes)" >&2
  exit 1
fi

# UTF-8 validation (reject if iconv cannot round-trip)
if command -v iconv >/dev/null 2>&1; then
  if ! iconv -f UTF-8 -t UTF-8 "$TMP" >/dev/null 2>&1; then
    echo "ERROR: content is not valid UTF-8" >&2
    exit 1
  fi
fi

# Minimal frontmatter / YAML structure
if ! head -1 "$TMP" | grep -q '^---$'; then
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

# Exact closed-set line (not merely individual glyphs scattered in the file)
if ! grep -Fqx "$CLOSED_LINE" "$TMP"; then
  if ! grep -E "^Ξ, Πᴽ, Γ, ⊕, Λψ, Σ◯, Θλ, Ωµ, Π↺, Ψmeta, Φ, ρ\.?[[:space:]]*$" "$TMP" >/dev/null; then
    echo "ERROR: exact closed-set line not found" >&2
    exit 1
  fi
fi

# Reject the known garble
if grep -q "Ωµ’s" "$TMP"; then
  echo "ERROR: garbled Ωµ attribution present — refusing to overwrite" >&2
  exit 1
fi

NEW_HASH=$(sha256sum "$TMP" | awk '{print $1}')
echo "downloaded SHA-256: $NEW_HASH"

if [ -f "$TARGET" ]; then
  OLD_HASH=$(sha256sum "$TARGET" | awk '{print $1}')
  echo "repository  SHA-256: $OLD_HASH"
  if [ "$NEW_HASH" = "$OLD_HASH" ]; then
    echo "no drift"
    exit 0
  fi
  echo "DRIFT detected"
fi

if [ "$CHECK_ONLY" = 1 ]; then
  echo "check-only: not overwriting"
  exit 2
fi

# Atomic replace on same filesystem
mv -f "$TMP" "$TARGET"
trap - EXIT
echo "wrote $TARGET"
