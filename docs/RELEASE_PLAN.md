# qoft-calculus GitHub Release Plan

This plan lists proposed tag coordinates. It does not imply that a tag or
GitHub Release already exists. The root contract, candidate kernel, realization
engines, and viewports use independent version axes.

## Immutable release coordinates

### Core `v1.0.2`

**Target commit:** `183dacd5393f36559b22e11867fc9479b748fea5`

Includes the stable root `SKILL.md` v1.0 contract, Public Typed Realization A,
deterministic integrity tests, and lockfile-backed CI. It does not include the
portable Kernel v1.1 candidate.

Suggested release title:

```text
qoft-calculus v1.0.2 - deterministic R¹² reference realization
```

### Candidate `qoft-qosmos-v1.1.0-develop.1`

**Target commit:** `99363f8621a9876a9bba5920156a009bdb938109`

Includes the portable `qoft-qosmos` Kernel v1.1 DEVELOP candidate beside the
stable root contract. Implicit invocation remains disabled. Mark this release
as a pre-release; it does not supersede or formally adopt the candidate.

Suggested release title:

```text
qoft-qosmos v1.1.0-develop.1 - portable kernel candidate
```

### Memory Weather `memory-weather-v0.1.1`

**Target commit:** `577658930d0c48a01f83d0fc273edfe17a8c4d3f`

Includes the dependency-free Memory Weather v0.1.1 DEVELOP realization,
projection-provenance catalog, preregistered routing experiment, committed
offline artifact, and 32 deterministic tests. It does not make Memory Weather
canonical or trajectory-equivalent to Public A or Grok Typed Realization B.

Suggested release title:

```text
Memory Weather v0.1.1 - typed-realization research instrument
```

## Repository app integration baseline

**Baseline commit:** `8af561ffb68f65cd78f23e1c5449b294d5f02d3b`

This immutable integration point contains:

- the Memory Weather Pages workflow merged at
  `1715f5b7f4a6a9fe1d8842884cbe8b2f4e28f20c`;
- the React Memory Weather Lab merged at
  `6db6e0168e40ba7f8de6d16e2f212c5d8522e310`;
- the compact Public A probe merged at
  `8af561ffb68f65cd78f23e1c5449b294d5f02d3b`.

This baseline is a repository integration coordinate, not a shared semantic
version for those independently versioned apps.

## Hosting status

The Pages workflow is present, but repository Pages is not enabled. An owner
must select **Settings → Pages → Build and deployment → Source: GitHub Actions**
and rerun the workflow. Add a live demo URL and repository homepage only after
the deployment succeeds.

## Release checklist

1. Select exactly one component and immutable target commit.
2. Run that component's locked install, typecheck, tests, and production build.
3. Confirm the governing skill version and closed operator set.
4. Confirm realization provenance and whether Grok Typed Realization B source is
   included or excluded.
5. State the evidence boundary and strongest ordinary baseline.
6. Record deterministic fixtures, expected hashes, and a concrete falsifier.
7. Confirm DEVELOP candidates remain explicitly labeled and invocation policy is
   unchanged.
8. Create the tag and GitHub Release from the same reviewed commit.

## Version rule

Do not place the core `v1.0.2` tag on a candidate-bearing repository head.
Do not use one repository-wide version to imply that the kernel, Public A,
Memory Weather, its React viewport, and hosting share a release lifecycle.
