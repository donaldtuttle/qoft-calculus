# Changelog

## Unreleased repository changes

The kernel, Public Typed Realization A interfaces, Memory Weather, hosting, and
the React viewport use independent version axes. Repository integration does
not promote one track into another.

### Kernel v1.1 DEVELOP candidate

- published the portable `qoft-qosmos` Kernel v1.1 candidate beside the root
  v1.0 contract;
- disabled implicit invocation and marked formal adoption pending;
- preserved the boundary between root `SKILL.md`, Public Typed Realization A,
  the Grok Typed Realization B workbench, and the candidate skill.

### Public Typed Realization A interfaces

- added `apps/simulator`, an original responsive browser visualizer that wraps
  Public Typed Realization A without modifying the core engine;
- added an `xiStep`-only session adapter, recorded one-tick Φ pulse scheduling,
  bounded event history, trace export, and browser-safe implementation checks;
- added simulator tests and a dedicated CI build workflow;
- added a compact `probe.html` entry point wired directly to the existing
  Realization A session/`xiStep` path, with no silent fallback;
- added a pinned 64-tick reference, probe-local trace digest, direct
  session-versus-`xiStep` parity coverage, and fail-closed trace export.

### Memory Weather v0.1.1

- added `apps/memory-weather` as a separate DEVELOP typed realization;
- declared its `⟦·⟧MW` simulation interpretation, environment-indexed fusion
  bridge, pre-predicate Ψmeta assessment, and scheduler-level Π↺ binding;
- added projection provenance, a preregistered simultaneous-versus-staged
  routing experiment, a dependency-free offline build, and 32 deterministic
  regression tests;
- added a dedicated Memory Weather CI workflow without changing `src/engine.ts`,
  root `SKILL.md`, or the r2.2 candidate files.

### Hosting

- published the exact manifest-covered Memory Weather artifact, the full
  Public A simulator, the compact no-fallback probe, and the React Memory
  Weather viewport as distinct routes in one GitHub Pages artifact;
- added a mobile-friendly app launcher and deterministic route/asset checks;
- retained `/` and `/memory-weather.html` as compatibility redirects to the
  exact manifest-covered artifact at `/memory-weather/`;
- kept hosting strictly separate from realization identity: this packaging
  changes no engine, trajectory contract, realization version, or canon status;
- recorded the hosted QOSMOS R¹² probe at https://qosmos-r-12.grok.me
  (named-spine Realization A radar + operator guide at `/guide`); this is a
  Grok-hosted instrument, not a replacement for `apps/simulator` or the
  Realization B workbench, and no trajectory-equivalence claim is made against
  `src/engine.ts`.

### Memory Weather Lab

- added `apps/memory-weather-lab`, a React + Vite viewport of Memory Weather
  v0.1.1 that copies the sibling engine factory bodies into ESM wrappers;
- pinned lab replay to `mw-fnv64:e199888bbf930070`, isolated the published demo
  from transient UI ablations, and added vendor-drift, accessibility, keyboard,
  focus/navigation, notation, and calculated contrast contracts.

### Governance and reproducibility

- recorded root `SKILL.md` v1.0's contradictory pre/post-collapse `Ψmeta`
  instructions and Public Typed Realization A's disclosed selection of the
  post-collapse branch;
- changed `fetch-skill.sh` to fail closed against the reviewed SHA-256 pin while
  preserving the root skill's no-argument refresh command and adding `--check`;
- added portable SHA-256 selection, public file-mode preservation, and offline
  contract tests for approved, drifted, and unapproved skill refreshes;
- removed the retired Memory Weather development-branch workflow trigger and
  pinned release coordinates to immutable commits.

This work does not adopt the v1.1 candidate or change core engine behavior.

## 1.0.2 - 2026-08-23

- committed `package-lock.json` and moved CI to `npm ci`;
- replaced placeholder coverage with deterministic, ownership, ablation,
  hysteresis, and configuration tests;
- rejected NaN, non-finite values, and non-integer count fields;
- hardened `fetch-skill.sh` with UTF-8, frontmatter, closed-set, hash, and atomic
  replacement checks;
- evaluated `Ωµ` once per tick and passed the result into flux sampling;
- documented that Public Typed Realization A and the deployed workbench are
  separate realizations.

Reference commit:

```text
183dacd5393f36559b22e11867fc9479b748fea5
```

## 1.0.0 - 2026-08-22

- published the public Glyphogenic Calculus contract;
- added the R¹² TypeScript reference engine and deterministic test harness;
- separated the public engine from the live workbench;
- licensed the repository under MPL-2.0.
