# qoft-calculus

**Glyphogenic Calculus v1.0** — QOSMOS workbench

```
Ξ(ψ) = ψᴽ ⊕ Γ(ψ)
```

`+` in older writing is typed fusion `⊕`. Not arithmetic.

## Live

Workbench: https://glyphogenic-calculus.grok.me  
Skill endpoint: https://glyphogenic-calculus.grok.me/SKILL.md

## What this repo is

Public v1.0 surface for the calculus:

| Path | Role |
|---|---|
| `SKILL.md` | Canonical skill / firewall / tick contract |
| `src/engine.ts` | Labeled QOSMOS workbench v1 engine (R¹² latent) |
| `tests/determinism.ts` | Same seed ⇒ identical hashes |

The live site is the interactive polar field. This repo is the skill plus a contract-faithful engine you can run without the UI.

## Operators (closed set)

Ξ  Πᴽ  Γ  ⊕  Λψ  Σ◯  Θλ  Ωµ  Π↺  Ψmeta  Φ  ρ

Do not add glyphs. Compose the existing set.

## Tick

```
ψᴽ = Πᴽ(ψ)
Φ  = sampleFlux(Θλ(ψ))
Γ  = gradient(Φ, ρ)
ψ̃ = fuse(ψᴽ, Γ)            // ⊕
if ρ ≥ τ for dwell ticks: ψ ← Λψ(ψ̃)
emit Ψmeta
maybe Σ◯
phase ← (phase + 1) mod 8
```

## Instantiation notes

`src/engine.ts` implements SKILL.md Section 4. That section is **not** canon law.

- ∇Φ proxy: `Φ − ψ`
- ⊕ mix/gate formula as written in the skill
- six basins: closure, insight, identity, tension, recall, threshold
- entropy is a required telemetry field; the bin formula in code is an instantiation

## Run

Node 22+:

```
npm test
```

## Scope

Operational model of observer-field recursion. Not a claim of physical equivalence to quantum collapse, light transport, or neuroscience.
