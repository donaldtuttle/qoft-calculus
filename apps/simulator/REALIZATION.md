# Simulator realization record

## Classification

**Typed Realization / interactive visualizer / Public Typed Realization A / R¹²**

This application is an interface around [`../../src/engine.ts`](../../src/engine.ts).
It does not implement or claim trajectory equivalence with the separately
deployed Grok workbench (Typed Realization B).

The build exposes a full dashboard at `index.html` and a compact radar probe at
`probe.html`. Both use the same `QosmosSession` adapter and `xiStep` transition
path. The compact page has no copied numerical model, dynamic engine seam, or
fallback realization; initialization failure stops the page instead of
producing synthetic frames.

## Authority and evidence boundary

The targeted type spine is:

```text
ψ ∈ Ψ
Ψᴽ ⊆ Ψ
ιᴽ : Ψᴽ ↪ Ψ
ψᴽ = Πᴽ(ψ; ctx, m) ∈ Ψᴽ
Γ(ψ; ctx) ∈ G
⊕ : Ψᴽ × G → Ψ
Ξ(ψ) = ψᴽ ⊕ Γ(ψ; ctx) ∈ Ψ
```

The repository root `SKILL.md` v1.0 governs Public Typed Realization A. The
supplied stamped genealogy `GENEALOGY_psi_R001_r2_2.md`, SHA-256
`6cf7ec4cbed5d3da747d80bfb4c60ea8e7466475b7b9cc003dabe7e06c9d6ea0`,
supports the r2.2 typing, Γ/lift boundary, and open fusion mechanism. The full
D-Π-01 eight-file corpus is not present here, so this is a targeted
type-boundary audit rather than complete canon or full tick-contract
conformance.

The Typed Realization Registry is a DEVELOP crosswalk and has no canonical
weight.

## Runtime crosswalk

| Target | Runtime name | Representation and boundary |
|---|---|---|
| `Πᴽ` | `projectReflex` | EMA self-model in R¹²; only writer of `selfModel` |
| `Φ` | `sampleFlux` | selected stimulus plus optional Ωµ and Θλ bias |
| `Γ` | `gradient` | local `Φ − ψ` proxy in R¹², norm capped at `1.4` |
| `⊕` | `fuse` | declared gated vector merge inside representation space |
| `ρ` | `rhoOf` | realization-local scalar in `[0,1]` |
| `Λψ` | `collapse` | projection toward nearest fixed basin, plus event sidecar |
| `Σ◯` | `summarize` | mean-pooled state-history node |
| `Θλ` | `recall` | nearest eligible mesh node biases a later flux sample |
| `Ωµ` | `omegaMu` | seeded Gaussian modulation, evaluated once per tick |
| `Π↺` | `run` / UI scheduler | recurrence; UI timing never enters engine state |
| `Ψmeta` | `PsiMetaFrame` | one post-transition diagnostics frame per committed tick |

`CollapseEvent`, `PsiMetaFrame`, UI state, and trace export are side artifacts;
they do not change canonical operator codomains.

## Actual tick

The simulator does not duplicate the engine. Every transition calls `xiStep`:

```text
Πᴽ project
→ Θλ recall lookup
→ Ωµ seeded modulation
→ Φ sample
→ Γ proxy
→ ⊕ fusion
→ ρ assessment
→ optional Λψ + CollapseEvent
→ one Ψmeta frame
→ state-history commit
→ optional Σ◯
→ phase advance modulo eight
```

This is runtime truth for Public Typed Realization A, but it is not full v1.0
tick-contract conformance. Root `SKILL.md` §§3 and 5 specify `Ψmeta` assessment
before the collapse predicate, while this engine constructs the committed frame
after optional `Λψ`. Root Section 1 also places `Σ◯` before `Λψ`, creating a
separate source-contract order ambiguity. The repository records both facts
without silently changing the frozen skill or engine; correction requires a
versioned governance decision and new deterministic fixtures.

The UI field click does not mutate ψ. It queues the engine's existing `pulse`
stimulus for exactly one committed tick and restores the selected persistent
stimulus immediately afterward. The export records the applied stimulus at
every step, so the input schedule is replayable.

The compact probe deliberately commits a one-tick pulse immediately when
paused, matching its small step-oriented interaction. During playback the pulse
waits for the next scheduled tick. The full dashboard keeps paused pulses queued
until the user explicitly advances. Both paths still call `queuePulse()` and
commit only through `QosmosSession.step()` or `tick()`.

Changing τ, Γ scale, Ωµ amplitude, or an ablation starts a new run. Playback
speed is presentation-only and does not start a new run.

Interactive runs stop at 16,384 committed ticks. The dashboard renders a
bounded 256-frame window; the full trace is cloned only when the user exports
or explicitly runs verification. Current-export verification reconstructs the
session from its seed, fixed configuration, and per-tick stimulus schedule,
then compares every frame, event, state sample, memory node, and hash.

The compact probe additionally presents a chained FNV trace digest over the
post-tick ψ hashes. This digest is a local UI/parity helper, not a QOFT operator,
canonical field, or cryptographic authenticity claim. Its 64-tick default
fixture must terminate at the root-engine pin `3ad463b1`.

## Local equations and constants

These are implementation choices, not canon law:

```text
selfModel ← (1 − β)·selfModel + β·ψ.latent
β = 0.1

∇Φ_proxy = Φ − ψ
g(ρ) = 0.2 + 0.8ρ
Γ.vec = normClamp(gammaScale·g(ρ)·∇Φ_proxy, 1.4)

mix = clamp(0.35 + 0.5ρ, 0.2, 0.9)
gate = clamp(0.15 + 0.7(1 − 0.45ρ), 0.1, 1)
ψ′ = bound(ψᴽ + gate·(1 − mix)·Γ.vec)
```

Defaults: `D=12`, `τ=0.78`, `dwell=2`, `hold=6`,
`summarizeEvery=12`, `meshCap=48`, and `omegaAmp=0.055`.

## Supported conclusion

A passing core and simulator suite supports deterministic, inspectable behavior
of Public Typed Realization A under the tested seeds, configurations, and input
schedules.

The eight-character state hashes are deterministic FNV diagnostics, not
cryptographic authenticity proofs. CI currently checks replay in Node; exact
cross-browser floating-point parity remains unverified.

## Forbidden extrapolation

The simulator does not establish QOFT as physics, quantum behavior, phenomenal
consciousness, observer-caused physical collapse, neuroscience, or a universal
cognitive architecture. `Ψmeta` is telemetry.

## Baseline and falsifier

The strongest ordinary alternative is a seeded bounded attractor system with
an EMA state estimate, gated updates, threshold events, and associative memory.
QOFT-specific structure adds computational value only if its typed separation
improves auditability, intervention, prediction, or transfer beyond that
baseline.

Primary falsifier: identical seed, configuration, and input schedule produce
different hashes. Additional failure conditions include an ablation leaving its
target path active or a visual point that cannot be traced to an engine frame,
state, memory node, or event.
