# qoft-calculus GitHub Release Plan

The repository contains a stable public contract and a newer DEVELOP candidate.
Their tags must preserve that distinction.

## Recommended releases

### `v1.0.2`

**Target commit:** `183dacd5393f36559b22e11867fc9479b748fea5`

Purpose:

- stable Public Typed Realization A;
- root `SKILL.md` v1.0 contract;
- deterministic engine and expanded integrity tests;
- lockfile-backed `npm ci` workflow;
- no bundled Kernel v1.1 candidate.

Suggested release title:

```text
qoft-calculus v1.0.2 - deterministic R¹² reference realization
```

### `v1.1.0-develop.1`

**Target:** current documentation head after this PR

Purpose:

- preserves the stable root v1.0 contract and engine;
- publishes the portable `qoft-qosmos` Kernel v1.1 DEVELOP candidate beside it;
- keeps candidate implicit invocation disabled;
- does not supersede or formally adopt the candidate.

Suggested prerelease title:

```text
qoft-calculus v1.1.0-develop.1 - portable Kernel v1.1 candidate
```

Mark this release as **pre-release** while adoption remains pending.

## Release checklist

1. Confirm the exact target commit.
2. Run `npm ci`.
3. Run `npm run typecheck`.
4. Run `npm test`.
5. Confirm the root `SKILL.md` version and closed operator set.
6. Confirm candidate invocation remains disabled for a DEVELOP release.
7. State whether the live workbench source is included or excluded.
8. State the realization and claim boundaries.
9. Create the tag and GitHub Release from the same commit.

## Version rule

Do not place the stable `v1.0.2` tag on a candidate-bearing head. The tag must
resolve to the exact stable source and contract it names. The current head may
receive only a clearly marked DEVELOP prerelease until the candidate passes its
formal adoption gate.
