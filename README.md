# qoft-calculus

**Glyphogenic Calculus v1.0** — public Typed Realization A (R¹²)

```
Ξ(ψ) = ψᴽ ⊕ Γ(ψ)
```

`+` in older writing is typed fusion `⊕`. Not arithmetic.

## Live vs this repository

```
SKILL.md
    ↓ shared operator contract / firewall
src/engine.ts                 deployed Grok workbench
Public Typed Realization A    Typed Realization B
(R¹² reference engine)        (interactive polar field)
```

They share the SKILL.md contract but are **not** trajectory-equivalent under the same seed.

Default seed `0x51e1d` (periodic):

| tick | Live app ρ | Public engine ρ |
|------|------------|-----------------|
| 1    | 0.664      | ~0.60           |
| 5    | Λψ → closure | still rising  |

Do **not** assume `src/engine.ts` is the source deployed by the live workbench unless the exact deployed source is published here and verified.

Live workbench: https://glyphogenic-calculus.grok.me  
Skill endpoint: https://glyphogenic-calculus.grok.me/SKILL.md

## What this repo is

| Path | Role |
|---|---|
| `SKILL.md` | Canonical skill / firewall / tick contract |
| `src/engine.ts` | Labeled public R¹² Typed Realization A |
| `tests/determinism.ts` | Contract + determinism + ablation suite |
| `scripts/fetch-skill.sh` | Hardened download → validate → atomic replace |

## Operators (closed set)

Ξ  Πᴽ  Γ  ⊕  Λψ  Σ◯  Θλ  Ωµ  Π↺  Ψmeta  Φ  ρ

Do not add glyphs. Compose the existing set.

## Tick

```
ψᴽ = Πᴽ(ψ)
Φ  = sampleFlux(Θλ(ψ))          // includes Ωµ Gaussian when active
Γ  = gradient(Φ, ρ)
ψ̃ = fuse(ψᴽ, Γ)                 // ⊕
if ρ ≥ τ for dwell ticks (hysteresis): ψ ← Λψ(ψ̃)
emit Ψmeta                       // after Λψ; entropy from final ψ
maybe Σ◯                         // mean-pool stateHistory window
phase ← (phase + 1) mod 8
```

Λψ must not write Πᴽ / selfModel. Πᴽ is the only licensed selfModel writer.

## Instantiation notes (Realization A)

- D is locked to 12 (R¹²). Other values are rejected.
- ∇Φ proxy: `Φ − ψ`
- ⊕ mix/gate formula as written in the skill
- Ωµ: seeded Gaussian (Box–Muller), logged every tick
- six basins: closure, insight, identity, tension, recall, threshold
- hold = 6 means six full post-snap suppression ticks (next eligible at +7)
- mesh IDs are monotonic (`nextMeshId`), unique past capacity
- Σ◯ mean-pools latent history, not only a selfModel snapshot

## Run

Node 22+:

```
npm install
npm run typecheck
npm test
```

Determinism uses default periodic. Collapse reachability / integrity / ablation use **basin** drive.

## Scope

Operational model of observer-field recursion. Not a claim of physical equivalence to quantum collapse, light transport, or neuroscience.

## License note

NOTICE establishes attribution. No LICENSE file is present; reuse rights are an owner decision. The owner has indicated MPL-2.0 intent for modified QOFT source files (improvements remain public; larger applications may stay proprietary).

Copyright 2026 Donald Tuttle.
