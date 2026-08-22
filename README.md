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

## Related stack

```
qosmos-core          private canon (specs, contracts, appendices)
      ↑ defines
qosmos-kernel        public minimal contract-enforced runtime
      ↑ hosts
qoft-calculus        this repo — workbench skill + labeled engine
      ↑ demos
live workbench       https://glyphogenic-calculus.grok.me
```

Dependency rule: `qosmos-core` may depend on `qosmos-kernel`. Kernel never depends on core.

| Repo | Visibility | Role |
|---|---|---|
| [qosmos-core](https://github.com/donaldtuttle/qosmos-core) | private | Canonical spec + private implementation scaffold |
| [qosmos-kernel](https://github.com/donaldtuttle/qosmos-kernel) | public | Minimal typed runtime; fails fast on contract breaks |
| [XiSymbolic_Equation_QOFT_SAL](https://github.com/donaldtuttle/XiSymbolic_Equation_QOFT_SAL) | public | Equation disclosure + QOFT-SAL attribution |
| [QOFT_Scaffold_Public](https://github.com/donaldtuttle/QOFT_Scaffold_Public) | public | Shell, glyph seed stub, slot interface (no core) |

This repo is a labeled instantiation of the skill’s workbench contract, not the full private core.

## Operators (closed set)

Ξ  Πᴽ  Γ  ⊕  Λψ  Σ◯  Θλ  Ωµ  Π↺  Ψmeta  Φ  ρ

Do not add glyphs. Compose the existing set.

## Tick

```
ψᴽ = Πᴽ(ψ)
Φ  = sampleFlux(Θλ(ψ))
Γ  = gradient(Φ, ρ)
ψ̃ = fuse(ψᴽ, Γ)            // ⊕
if ρ ≥ τ for dwell ticks (hysteresis band): ψ ← Λψ(ψ̃)
emit Ψmeta                 // after Λψ
maybe Σ◯
phase ← (phase + 1) mod 8
```

Λψ must not write Πᴽ.

## Instantiation notes

`src/engine.ts` implements SKILL.md Section 4. That section is **not** canon law.

- ∇Φ proxy: `Φ − ψ`
- ⊕ mix/gate formula as written in the skill
- six basins: closure, insight, identity, tension, recall, threshold
- entropy is a required telemetry field; the bin formula in code is an instantiation
- hysteresis (default 0.08) holds the ρ streak through `[τ−h, τ)`; hold (default 6) is post-snap anti-chatter
- Λψ does **not** write Πᴽ. self-model updates only in `projectReflex()`

## Run

Node 22+:

```
npm test
```

Determinism uses default periodic. Collapse reachability / integrity / ablation use **basin** drive — default periodic at τ=0.78 often never snaps.

## Scope

Operational model of observer-field recursion. Not a claim of physical equivalence to quantum collapse, light transport, or neuroscience.
