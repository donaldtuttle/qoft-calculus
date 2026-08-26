# Changelog

## Unreleased - v1.1.0 DEVELOP candidate

- published the portable `qoft-qosmos` Kernel v1.1 candidate beside the root
  v1.0 contract;
- disabled implicit invocation and marked formal adoption pending;
- added a plain-language repository front door, use-case map, credibility-scan
  badges, changelog, and release plan;
- preserved the boundaries among root `SKILL.md`, Public Typed Realization A,
  the deployed live workbench, and the candidate skill.
- added `apps/simulator`, an original responsive browser visualizer that wraps
  Public Typed Realization A without modifying the core engine;
- added an `xiStep`-only session adapter, recorded one-tick Φ pulse scheduling,
  bounded event history, trace export, and browser-safe implementation checks;
- added simulator tests and a dedicated CI build workflow.
- added a compact `probe.html` entry point wired directly to the existing
  Realization A session/`xiStep` path, with no silent fallback;
- added a pinned 64-tick reference, probe-local trace digest, direct
  session-versus-`xiStep` parity coverage, and fail-closed trace export.
- added `apps/memory-weather` v0.1.1 on the retained simulator development
  branch as a separate DEVELOP typed realization;
- declared its `⟦·⟧MW` simulation interpretation, environment-indexed fusion
  bridge, pre-predicate Ψmeta assessment, and scheduler-level Π↺ binding;
- added projection provenance, a preregistered simultaneous-versus-staged
  routing experiment, a dependency-free offline build, and 32 deterministic
  regression tests;
- added a dedicated Memory Weather CI workflow without changing `src/engine.ts`,
  root `SKILL.md`, or the r2.2 candidate files.
- added `apps/memory-weather-lab`, a React + Vite viewport of Memory Weather
  v0.1.1 that copies the sibling engine factory bodies into ESM wrappers;
- pinned lab replay to the published demo hash `mw-fnv64:e199888bbf930070` and
  added a vendor-drift check so the vanilla HTML instrument stays the source of
  truth.

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
