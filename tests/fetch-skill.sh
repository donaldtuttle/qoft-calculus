#!/bin/sh
set -eu

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
SOURCE_ROOT=${QOFT_TEST_SOURCE_ROOT:-$REPO_ROOT}
SOURCE_SKILL="$SOURCE_ROOT/SKILL.md"
EXPECTED_SHA256='fedda471e07a876bdb72cb2424986ae3eec6d002d003a680b231ea8cbd246fbb'
TMP_ROOT=$(mktemp -d "${TMPDIR:-$REPO_ROOT}/qoft-fetch-test.XXXXXX")
trap 'rm -rf "$TMP_ROOT"' EXIT HUP INT TERM

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

# Default mode is check-only and succeeds when both source and target are pinned.
QOFT_SKILL_URL="$SOURCE_URL" sh "$TMP_ROOT/scripts/fetch-skill.sh" >"$TMP_ROOT/output.log" 2>&1

# Approved source plus local target drift must fail closed without writing.
printf '\n# local target drift\n' >> "$TMP_ROOT/SKILL.md"
DRIFT_HASH=$(sha256sum "$TMP_ROOT/SKILL.md" | awk '{print $1}')
set +e
QOFT_SKILL_URL="$SOURCE_URL" sh "$TMP_ROOT/scripts/fetch-skill.sh" >"$TMP_ROOT/output.log" 2>&1
STATUS=$?
set -e
assert_status 2 "$STATUS" "default drift check"
[ "$(sha256sum "$TMP_ROOT/SKILL.md" | awk '{print $1}')" = "$DRIFT_HASH" ]

# Explicit apply may restore only the pinned source.
QOFT_SKILL_URL="$SOURCE_URL" sh "$TMP_ROOT/scripts/fetch-skill.sh" --apply >"$TMP_ROOT/output.log" 2>&1
[ "$(sha256sum "$TMP_ROOT/SKILL.md" | awk '{print $1}')" = "$EXPECTED_SHA256" ]

# Structurally valid but unapproved content is rejected even with --apply.
cp "$SOURCE_SKILL" "$TMP_ROOT/unapproved.md"
printf '\n<!-- unapproved drift -->\n' >> "$TMP_ROOT/unapproved.md"
BEFORE_HASH=$(sha256sum "$TMP_ROOT/SKILL.md" | awk '{print $1}')
set +e
QOFT_SKILL_URL="file://$TMP_ROOT/unapproved.md" sh "$TMP_ROOT/scripts/fetch-skill.sh" --apply >"$TMP_ROOT/output.log" 2>&1
STATUS=$?
set -e
assert_status 3 "$STATUS" "unapproved source"
[ "$(sha256sum "$TMP_ROOT/SKILL.md" | awk '{print $1}')" = "$BEFORE_HASH" ]

set +e
sh "$TMP_ROOT/scripts/fetch-skill.sh" --unknown >"$TMP_ROOT/output.log" 2>&1
STATUS=$?
set -e
assert_status 64 "$STATUS" "unknown option"

echo "fetch-skill contract tests: PASS"
