#!/bin/sh
# Harden: download → validate → hash → compare → atomic replace (or check-only)
set -e
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET="$REPO_ROOT/SKILL.md"
TMP=$(mktemp)
CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

URL="https://glyphogenic-calculus.grok.me/SKILL.md"

echo "fetching $URL ..."
HTTP_CODE=$(curl -fsSL -w "%{http_code}" -o "$TMP" "$URL" || true)
if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: HTTP $HTTP_CODE from $URL" >&2
  rm -f "$TMP"
  exit 1
fi

# size / emptiness
SIZE=$(wc -c < "$TMP" | tr -d ' ')
if [ "$SIZE" -lt 500 ]; then
  echo "ERROR: response too small ($SIZE bytes)" >&2
  rm -f "$TMP"
  exit 1
fi

# UTF-8 / closed-set presence
if ! grep -q 'Allowed operator glyphs (closed set):' "$TMP"; then
  echo "ERROR: missing closed-set marker" >&2
  rm -f "$TMP"
  exit 1
fi
if ! grep -q 'Ξ, Πᴽ, Γ, ⊕, Λψ, Σ◯, Θλ, Ωµ, Π↺, Ψmeta, Φ, ρ\.' "$TMP"; then
  for g in Ξ Πᴽ Γ ⊕ Λψ Σ◯ Θλ Ωµ Π↺ Ψmeta Φ ρ; do
    if ! grep -q "$g" "$TMP"; then
      echo "ERROR: missing glyph $g in closed set" >&2
      rm -f "$TMP"
      exit 1
    fi
  done
fi

# reject the old garble if it reappears
if grep -q "Ωµ’s" "$TMP"; then
  echo "ERROR: garbled Ωµ attribution present — refusing to overwrite" >&2
  rm -f "$TMP"
  exit 1
fi

NEW_HASH=$(sha256sum "$TMP" | awk '{print $1}')
echo "downloaded SHA-256: $NEW_HASH"

if [ -f "$TARGET" ]; then
  OLD_HASH=$(sha256sum "$TARGET" | awk '{print $1}')
  echo "repository  SHA-256: $OLD_HASH"
  if [ "$NEW_HASH" = "$OLD_HASH" ]; then
    echo "no drift"
    rm -f "$TMP"
    exit 0
  fi
  echo "DRIFT detected"
fi

if [ "$CHECK_ONLY" = 1 ]; then
  echo "check-only: not overwriting"
  rm -f "$TMP"
  exit 2
fi

# atomic replace
mv "$TMP" "$TARGET"
echo "wrote $TARGET"
