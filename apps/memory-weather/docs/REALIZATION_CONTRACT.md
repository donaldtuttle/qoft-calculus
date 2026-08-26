# QOSMOS Memory Weather realization contract

## Status and authority boundary

**Classification:** Typed Realization / DEVELOP / experimental visualization instrument.

The stamped r2.2 genealogy and the matching supplied QOT replacement copies fix the abstract type spine below. They do not fix a unique numerical algebra for `⊕`, a unique R¹² state meaning, or this engine's dynamics. The exact historical D-Π-01 baseline bytes and installation state remain unverified. The supplied Typed Realization Registry and Concept Bridge Ledger are DEVELOP crosswalks with no canonical weight.

## Abstract canon

```text
ψ ∈ Ψ
Ψᴽ ⊆ Ψ
ιᴽ : Ψᴽ ↪ Ψ
ψᴽ = Πᴽ(ψ; ctx, M) ∈ Ψᴽ
Γ(ψ; ctx) = γ ∈ G
⊕ : Ψᴽ × G → Ψ
Ξ_{ctx,M}(ψ)
  = Πᴽ(ψ; ctx, M) ⊕ Γ(ψ; ctx)
  ∈ Ψ
```

`⊕` is external typed fusion. It is not arithmetic addition, and its abstract contract leaves the internal fusion mechanism open.

## Memory Weather interpretation

Memory Weather interprets the canonical types; it does not redefine them:

```text
⟦Ψ⟧MW  = Ψsim
⟦Ψᴽ⟧MW = Ψᴽsim ⊆ Ψsim
⟦G⟧MW  = GR12
```

Both `ψᴽ ∈ Ψᴽsim` and the fused `ψ̃ ∈ Ψsim` are simulated runtime states. This realization declares no interpretation map from `Ψsim` to a biological state space. That absence is the simulation firewall; it is not a theorem that no such map could ever be proposed.

The statement `ψᴽ ≠ ψ` is not imposed as a universal invariant. Because `Ψᴽ ⊆ Ψ`, equality between particular values is type-admissible. Memory Weather makes no general fixed-point existence, uniqueness, convergence, or stability claim.

## Runtime realization

| Abstract target | Runtime face | Conformance and boundary |
|---|---|---|
| `Ψ` | `Psi { latent[12], coherence, fluxEnergy, id, t }` | Interpreted as bounded `Ψsim`; no universal or biological meaning asserted. |
| `Πᴽ` | `reflexProject(state)` | Candidate realization binding from full runtime state to `PsiReflex`; this binding is realization-local. |
| `Φ` | `sampleFlux(state, omega)` | Composite bounded forcing from observation/base stimulus, Ωµ sample, applied pending Θλ bias, and optional coupling. These are not one-hot branches. |
| `Γ` | `gradientOf(state, flux)` | Returns a capped `GR12` update object. Extra runtime values are treated as enriched `ctx`, preserving abstract `Γ : Ψ × Ctx → G`. |
| `⊕` | `repReflex`, `repGamma`, `mergeR`, `decode`, `projectPsi`, `fuse` | Environment-indexed typed realization described below; structurally compatible, not proven equivalent to every open property of canonical `⊕`. |
| `ρ` | `coherenceOf(state, candidate, flux, gamma)` | Bounded realization-local scalar over the fused candidate, using previous committed coherence in its policy. |
| `Ψmeta` | `makeMetaFrame(...)` then `finalizeMetaFrame(...)` | One frame object per tick: decision-relevant pre-predicate assessment, then predicate-result finalization. No awareness inference. |
| `Λψ` | `collapse(state, candidate, rho, reason)` | Optional nearest-basin commit after dwell/hold/ablation eligibility; emits candidate pre-hash and committed post-hash. |
| `Σ◯` | `summarize(state)` | Scheduled mean-pooling of a committed trace window into a bounded mesh node; not required on every collapse. |
| `Θλ` | `selectRecall(state)` / pending recall application | A packet selected after the current commit may bias a later tick. A link is rendered only when a packet was actually applied. |
| `Ωµ` | `omegaSample(state)` | Seed-and-step keyed Gaussian modulation logged each tick; no quantum claim. |
| `Π↺` | `scheduleRun → executeStep → Engine.step` | Candidate scheduler-level recurrence annotation. `phase++` and `step++` are helpers, not Π↺ themselves; no explicit Π↺ event is emitted. |

Optional multi-observer mode runs two independent states. Frozen prior-state snapshots produce symmetric bounded coupling vectors that enter each observer's explicit Φ context before independent ticks. Processing order is therefore observationally irrelevant. This is a DEVELOP extension, not a canonical re-entanglement rule.

## Composite Φ construction

Let `B` denote the existing `boundVector(componentLimit, radialLimit)` operation. The implemented forcing is:

```text
θₜ = applied pending Θλ recall bias, or 0
kₜ = enabled observer-coupling vector, or 0
ωₜ = logged Ωµ sample
bₜ = explicit or preset observation stimulus

Φₜ.data = B(bₜ + ωₜ + θₜ + kₜ)
```

The plus signs in this equation describe realization-local R¹² vector arithmetic inside `sampleFlux`; they do not redefine canonical `⊕`. Same-tick provenance may therefore show Θλ and Ωµ as simultaneously active. Strict exclusive routing is rejected as a description of this runtime.

## Environment-indexed fusion factorization

For tick `t`, define the realized environment:

```text
Eₜ := (sₜ, ρₜ, Φₜ)

repᴽ : Ψᴽsim → R
repG : GR12 → R
mergeRᴱᵗ : R × R → R
decodeFusionᴱᵗ : R → Fusion
projectPsi : Fusion → Ψsim

decodeᴱᵗ := projectPsi ∘ decodeFusionᴱᵗ : R → Ψsim
```

The candidate next state is:

```text
ψ̃ₜ₊₁ = projectPsi(
  decodeFusionᴱᵗ(
    mergeRᴱᵗ(
      repᴽ(ψᴽₜ),
      repG(γₜ)
    )
  )
)
```

In source, `mergeR` consumes prior committed `ρₜ`; `decode` also consumes `state` and `flux`; and `fuse` returns a `Fusion` record containing `psi`, `mix`, `gate`, and `clamped`. Currying those environmental values yields the displayed binary/unary maps. It does not prove that this family realizes every property left open by abstract `⊕`.

Current conformance claim:

```text
DEVELOP / structurally compatible typed realization
```

Forbidden stronger claim:

```text
proven equivalent implementation of canonical ⊕
```

## Exact tick and Ψmeta semantics

The conformance refactor preserves exactly one `Ψmeta` frame object per tick and makes its two moments explicit:

```text
update explicit context
→ ωₜ = omegaSample(sₜ)
→ ψᴽₜ = reflexProject(sₜ)
→ Φₜ = sampleFlux(sₜ, ωₜ)
→ γₜ = gradientOf(sₜ, Φₜ) ∈ GR12
→ Fusionₜ = fuse(sₜ, ψᴽₜ, γₜ, Φₜ)
→ ψ̃ₜ₊₁ = projectPsi(Fusionₜ) ∈ Ψsim
→ ρₜ₊₁ = coherenceOf(...)
→ metaₜ = makeMetaFrame(..., ρₜ₊₁)       [assessment]
→ Pₜ = collapsePredicate(sₜ, metaₜ, forcedₜ) [decision]
→ finalizeMetaFrame(metaₜ, Pₜ)               [audit result]
→ optional Λψ(ψ̃ₜ₊₁)
→ commit the candidate or collapsed state
→ append the same finalized frame once and append committed trace
→ optional scheduled Σ◯ over committed trace
→ select a Θλ packet for a later tick
→ advance phase/step helpers
```

`makeMetaFrame` creates the decision-relevant assessment before the predicate. `collapsePredicate` consumes that exact frame. `finalizeMetaFrame` writes `collapse_would_trigger`, `collapse_eligible`, `collapse_triggered`, `collapse_reason`, `scalars.dwell`, and `scalars.holdRemaining`, and adds the `collapse` tag only when triggered. The same object is then appended once.

The assessment's `psi_hash_pre_collapse` identifies the fused candidate. After the optional Λψ operation, `psi_hash` identifies the committed state. Thus pre-collapse diagnostics and post-decision integrity remain distinguishable.

The superseded implementation order was:

```text
ρ → Predicate → makeMetaFrame(..., Predicate) → optional Λψ
```

That older frame was a post-predicate diagnostic record. It is retained here only as regression context and must not be described as the current decision topology.

## Σ◯ and Π↺ boundaries

`Σ◯` fires on its configured summary schedule after the committed state is appended to the trace. A summary on a collapse tick may therefore include the collapsed state, but `Λψ → Σ◯` is not an unconditional runtime law.

`Π↺` is not bound to either counter increment. The declared candidate annotation is the outer recurrence controller:

```text
Π↺ realization annotation: scheduleRun → executeStep → Engine.step
```

This is a realization annotation, not a claim that the browser timer exhausts the abstract meaning of canonical recurrence.

## State and artifacts

- Canonical-like state changed: the runtime `Psi` carrier only.
- Side artifacts: frames, trace samples, memory records, mesh nodes, collapse events, memory-write events, basin-transition events, and provenance records.
- `ιᴽ` remains implicit and emits no telemetry.
- Manual memory inscription is a local UI/runtime action, not a new glyph and not an alias for `Σ◯`.

## Supported claims

- Same seed, configuration, and input sequence reproduce rounded `ψ` hashes and event order in this implementation.
- The current decision path constructs `Ψmeta` assessment before evaluating the collapse predicate and appends one finalized frame per tick.
- Every rendered scientific layer declares its runtime source and projection loss.
- Ablations change only the named realization mechanisms.
- Strict one-hot routing is not the implemented Φ topology.

## Forbidden extrapolations

- No physical, quantum, neurological, biological, phenomenal-awareness, or universal-observer claim.
- No claim that the absence of a declared `Ψsim → biological state` map proves such a map impossible.
- No universal meaning for R¹², the threshold, basin geometry, field potential, or weather labels.
- No claim that a smooth heatmap is direct telemetry; it is a declared model evaluation or reconstruction.
- No claim that structural type compatibility proves semantic, algebraic, or scientific equivalence to canonical `⊕`.
- No claim that passing tests validates QOFT as science.

## Baseline, falsifiers, and next experiment

The strongest ordinary baseline is a bounded nonlinear state-space simulation with additive/composite forcing, seeded stochastic modulation, delayed memory bias, coherence-dependent state update, hysteretic/dwell event gating, scheduled trace pooling, and nearest-neighbor recall. QOFT adds value only if its typed operator separation improves intervention clarity, cross-realization transfer, prediction, or auditability beyond a matched baseline.

This realization fails its own contract if identical replay inputs diverge; if a visible layer lacks provenance; if Θλ is shown without an applied packet; if Λψ lacks pre/post hashes; if an ablated mechanism still changes state; if more or fewer than one finalized `Ψmeta` frame is appended per tick; if the predicate does not consume the assessment created for that tick; or if export/re-import changes continuation.

The rejected one-hot alternative and the still-open, order-sensitive staged alternatives are specified in [ALT_STAGED_ROUTING_EXPERIMENT.md](ALT_STAGED_ROUTING_EXPERIMENT.md).
