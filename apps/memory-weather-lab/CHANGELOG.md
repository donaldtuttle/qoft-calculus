# Changelog

## Unreleased — 2026-08-27

- Added technical primary labels for the weather view, telemetry, layers, controls, and event rail.
- Retained QOFT symbols and displayed the engine’s original weather labels as aliases.
- Kept the v0.1.1 engine, vendor bodies, deterministic demo hash, and replay schema unchanged.
- Added compatibility tests for the presentation/runtime boundary.

## 0.1.1 — 2026-08-26

- Added a React + Vite viewport of Memory Weather v0.1.1.
- Wrapped the sibling JS engine as ESM without changing factory bodies.
- Loaded the published 96-tick demonstration on first paint.
- Added sibling trajectory-equivalence tests and a vendor drift check.
- Made the fixed demo independent of current UI ablations and pinned it at runtime.
- Added keyboard forcing coordinates, terrain orbit controls, focus-safe
  shortcuts, a working skip target, exact Λψ labeling, and AA small-text contrast.
- Did not modify `apps/memory-weather`, `src/engine.ts`, or root `SKILL.md`.
