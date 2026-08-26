#!/bin/sh
set -eu

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
SOURCE_ROOT=${QOFT_TEST_SOURCE_ROOT:-$REPO_ROOT}
SOURCE_SKILL="$SOURCE_ROOT/SKILL.md"
EXPECTED_SHA256='fedda471e07a876bdb72cb2424986ae3eec6d002d003a680b231ea8cbd246fbb'
TMP_ROOT=$(mktemp -d "${TMPDIR:-$REPO_ROOT}/qoft-fetch-test.XXXXXX")
trap 'rm -rf "$TMP_ROOT"' 0 HUP INT TERM

mkdir -p "$TMP_ROOT/scripts"
cp "$REPO_ROOT/scripts/fetch-skill.sh" "$TMP_ROOT/scripts/fetch-skill.sh"
cp "$SOURCE_SKILL" "$TMP_ROOT/SKILL.md"
SOURCE_URL="file://$SOURCE_SKILL"

assert_status() {
  expected=$1
  actual=$2
  label=$3
  if [ "$actual" -ne "$expected" ]; then
    echo "FAIL: $label returned $actual, expected $expected" >&2
    cat "$TMP_ROOT/output.log" >&2
    exit 1
  fi
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$1" | awk '{print $NF}'
  else
    echo "FAIL: no SHA-256 tool found" >&2
    exit 1
  fi
}

assert_public_mode() {
  file=$1
  mode=$(LC_ALL=C ls -ld "$file" | cut -c 2-10)
  if [ "$mode" != "rw-r--r--" ]; then
    echo "FAIL: $file mode is $mode, expected rw-r--r--" >&2
    exit 1
  fi
}

# The no-argument command preserves the frozen root skill's refresh contract.
QOFT_SKILL_URL="$SOURCE_URL" sh "$TMP_ROOT/scripts/fetch-skill.sh" >"$TMP_ROOT/output.log" 2>&1

# Check-only mode reports approved-source/local-target drift without writing.
printf '\n# local target drift\n' >> "$TMP_ROOT/SKILL.md"
DRIFT_HASH=$(sha256_file "$TMP_ROOT/SKILL.md")
set +e
QOFT_SKILL_URL="$SOURCE_URL" sh "$TMP_ROOT/scripts/fetch-skill.sh" --check >"$TMP_ROOT/output.log" 2>&1
STATUS=$?
set -e
assert_status 2 "$STATUS" "check-only drift"
[ "$(sha256_file "$TMP_ROOT/SKILL.md")" = "$DRIFT_HASH" ]

# Default refresh may restore only the pinned source and must keep public mode.
QOFT_SKILL_URL="$SOURCE_URL" sh "$TMP_ROOT/scripts/fetch-skill.sh" >"$TMP_ROOT/output.log" 2>&1
[ "$(sha256_file "$TMP_ROOT/SKILL.md")" = "$EXPECTED_SHA256" ]
assert_public_mode "$TMP_ROOT/SKILL.md"

# Explicit apply is equivalent and preserves mode.
printf '\n# second local target drift\n' >> "$TMP_ROOT/SKILL.md"
QOFT_SKILL_URL="$SOURCE_URL" sh "$TMP_ROOT/scripts/fetch-skill.sh" --apply >"$TMP_ROOT/output.log" 2>&1
[ "$(sha256_file "$TMP_ROOT/SKILL.md")" = "$EXPECTED_SHA256" ]
assert_public_mode "$TMP_ROOT/SKILL.md"

# Structurally valid but unapproved content is rejected even with --apply.
cp "$SOURCE_SKILL" "$TMP_ROOT/unapproved.md"
printf '\n<!-- unapproved drift -->\n' >> "$TMP_ROOT/unapproved.md"
BEFORE_HASH=$(sha256_file "$TMP_ROOT/SKILL.md")
set +e
QOFT_SKILL_URL="file://$TMP_ROOT/unapproved.md" sh "$TMP_ROOT/scripts/fetch-skill.sh" --apply >"$TMP_ROOT/output.log" 2>&1
STATUS=$?
set -e
assert_status 3 "$STATUS" "unapproved source"
[ "$(sha256_file "$TMP_ROOT/SKILL.md")" = "$BEFORE_HASH" ]

set +e
sh "$TMP_ROOT/scripts/fetch-skill.sh" --unknown >"$TMP_ROOT/output.log" 2>&1
STATUS=$?
set -e
assert_status 64 "$STATUS" "unknown option"

echo "fetch-skill contract tests: PASS"
