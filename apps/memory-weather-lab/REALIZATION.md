# Memory Weather Lab realization note

**Classification:** DEVELOP / viewport of Memory Weather v0.1.1.

This directory does not declare a new interpretation map. It hosts the existing
`⟦·⟧MW` realization in a React shell.

```text
canonical target     unchanged (r2.2 type spine)
runtime engine       apps/memory-weather v0.1.1
this app             scheduleRun → executeStep → Engine.step
                     plus canvas/DOM chrome
```

## Presentation vocabulary

The React shell uses technical English as the primary interface label while
retaining QOFT symbols and the engine’s original weather labels as aliases. The
mapping is presentation-only and is documented in
[`apps/memory-weather/docs/TERMINOLOGY.md`](../memory-weather/docs/TERMINOLOGY.md).
It does not alter runtime weather records, hashes, schemas, thresholds, or
operator behavior.

## What this is

- A second UI over the same `Psi` / `Πᴽ` / `Φ` / `Γ` / `⊕` / `Ψmeta` / `Λψ` /
  `Σ◯` / `Θλ` / `Ωµ` runtime as `apps/memory-weather`.
- Trajectory-equivalent with that sibling under identical seed, config, and
  inputs. The published demo hash is `mw-fnv64:e199888bbf930070`.

## What this is not

- Not a replacement of `apps/memory-weather` (the vanilla HTML file remains the
  dependency-free offline instrument).
- Not Public Typed Realization A (`src/engine.ts` / `apps/simulator`).
- Not Typed Realization B (the separately deployed Grok glyphogenic workbench).
- Not a biological, physical, quantum, or consciousness model.

## Falsifiers

Reject this viewport if:

- `npm run sync-engine:check` reports vendor drift from `apps/memory-weather/src`;
- the fixed-seed demo hash diverges from the sibling;
- a rendered scientific layer is added without projection provenance in the
  sibling catalog.

See [apps/memory-weather/docs/REALIZATION_CONTRACT.md](../memory-weather/docs/REALIZATION_CONTRACT.md).
