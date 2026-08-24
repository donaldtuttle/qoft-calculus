# QOSMOS tick contract (Kernel v1.1)

**Status:** DEVELOP candidate profile pending formal adoption. The repository
root `SKILL.md` v1.0 remains authoritative for Public Typed Realization A.

One unified policy. There is no “emit Ψmeta during Assess” path in kernel.

Every Ξ_step wrapper, in order:

1. Observe — ingest Oₜ and any prior-tick recall evidence into explicit ctx;
   if Ωµ is scheduled, apply Ωµ : Ψ → Ψ with a seeded, logged sample
2. Project — ψᴽ = Πᴽ(ψ, ctx, M)
3. Flux — φ = Φ(ψ, ctx); derive ctxφ = ctx with `{ flux: φ, memory_view: M }`
4. Gradient — γ = Γ(ψ, ctxφ); sampled φ and prior ρ are explicit ctxφ fields
5. Fuse — ψ̃ = ψᴽ ⊕ γ            // typed fusion, not arithmetic
6. Assess — ρ' = ρ(ψ̃, ctxφ)     // measurement only; do not emit Ψmeta here
7. Collapse — if predicate: ψ = Λψ(ψ̃), emit CollapseEvent (pre/post hashes, reason); else ψ = ψ̃
8. Meta — compute Ψmeta(ψ, ctxφ) ∈ ℝᵏ, then emit one Ψmeta_post frame whose
   `scalars` field carries that vector; this occurs after Λψ?
9. Commit — trace frame; optional `mesh = Σ◯(ψ, M, evidence, ctxφ)`; a
   scheduled Θλ returns the next `(ψ, M)` pair and optional recall evidence
10. Loop — outer Π↺ schedules the next bound Ψ→Ψ tick application.
    `advancePhase` is only a realization-local scheduler helper; it is not Π↺

Compact:

    Observe → Πᴽ → Φ → Γ → ⊕ → ρ_assess → Λψ? → Ψmeta_post → Σ◯/Θλ → Π↺

## Ψmeta slots (not new glyphs)

| Slot | When | Who owns it | Required in kernel? |
|---|---|---|---|
| Ψmeta_pre | before Λψ | HME overlay, realization-local | no |
| Ψmeta_post | after Λψ? | QOFT/QOSMOS kernel | yes, exactly one per tick |

Ψmeta_pre and Ψmeta_post are named emission slots of the Ψmeta operator. They do not expand the closed glyph set.

HME pairing: HME may emit Ψmeta_pre for diagnostics. If compatibility with this
candidate contract is required, an adapter must also emit Ψmeta_post after Λψ.
Finalizing the HME pre record after the decision does not make it a kernel post
record. See companion skill `hme`.

Required Ψmeta_post fields every tick:

run_id, step, phase, rho, gamma_mag, reflex_conf, entropy, drift, stable, collapse_triggered, tags

Tags always include `tick` and `phase:<int>`; add `collapse` if Λψ fired.

Serialized contract fields use snake_case. Language-local types below use these
camelCase aliases: `run_id` ↔ `runId`, `phi_energy` ↔ `phiEnergy`,
`gamma_mag` ↔ `gammaMag`, `reflex_conf` ↔ `reflexConf`, and
`collapse_triggered` ↔ `collapseTriggered`.

Invariants:

- ctx explicit; no hidden global state
- RNG from ctx/seed only; log seed + step
- Λψ must emit CollapseEvent
- Λψ must not write Πᴽ / self_model
- stochastic Ωµ logged per tick
- ablation toggles for Θλ, Σ◯, Ωµ, Λψ
- exactly one kernel Ψmeta_post per tick; never two kernel frames

Determinism test: same seed + config ⇒ identical ψ hashes for N ticks.

## Code contract (language-agnostic)

The operator API below matches the Section 2 type spine. A language may expose
ASCII-named wrappers, but wrappers are not glyphs and must identify which
operator result they carry. Evidence and telemetry sidecars do not change an
operator's declared output type.

```
type Vec = number[]          // length D; Realization A locks D=12
type Psi = { id, t, latent: Vec, coherence, fluxEnergy, basinId? }
type Memory = implementation-defined explicit memory state
type Evidence = implementation-defined event/trace evidence
type Context = explicit tick context; may contain flux, rhoPrior, memoryView,
               recallEvidence, omegaSample, seed, and step
type PsiReflex = { latent: Vec, selfModel: Vec, confidence }
type FluxSample = { fieldId, data: Vec, timestamp, energy }
type Gamma = { vec: Vec, magnitude, basis }
type PsiMetaFrame = {
  runId, step, phase, rho, phiEnergy, gammaMag, reflexConf,
  entropy, drift, stable, collapseTriggered, tags, scalars: number[],
  slot: "pre" | "post"
}
type CollapseEvent = {
  step, reason, preHash, postHash, energyDrop, basinId, rho
}
type RecallEvidence = implementation-defined recall packet
type OmegaSample = { amp, kind }

// Operator API — these signatures match Section 2.
Ξ(psi, ctx, memory) -> Psi
Πᴽ(psi, ctx, memory) -> PsiReflex
Φ(psi, ctx) -> FluxSample
Γ(psi, ctxWithFlux) -> Gamma
Fuse(psiReflex, gamma) -> Psi             // realizes ⊕ : Ψᴽ × G → Ψ
Λψ(psi) -> Psi
Σ◯(psi, memory, evidence, ctx) -> MeshNode
Θλ(psi, memory) -> { psiNext: Psi, memoryNext: Memory }
Ωµ(psi) -> Psi
Π↺(step: Psi -> Psi, schedule) -> (Psi -> Psi)
Ψmeta(psi, ctx) -> number[]                   // ℝᵏ
ρ(psi, ctx) -> number

// Realization-local wrappers/helpers — not additional operators.
xiStep(psi, ctx, memory) -> {
  psiNext: Psi, memoryNext: Memory, frame: PsiMetaFrame, events
}                                           // psiNext carries Ξ output
applyCollapse(psi, ctx) -> {
  psiNext: Psi, event: CollapseEvent
}                                           // psiNext carries Λψ output
mnemonicLoopWithEvidence(psi, memory) -> {
  psiNext: Psi, memoryNext: Memory, packet?: RecallEvidence
}                                           // first two fields carry Θλ output
emitMetaFrame(psi, ctx) -> PsiMetaFrame      // frame.scalars carries Ψmeta output
sampleOmega(t, ctx, priorMeta) -> OmegaSample
applyOmega(psi, sample) -> Psi               // realizes Ωµ with sample bound
collapsePredicate(psi, rho, ctx) -> boolean
advancePhase(frame, ctx) -> phase             // scheduler helper for Π↺
```

Tick body (must match the numbered order above):

```
if omegaScheduled:
    omega = sampleOmega(t, ctx, priorMeta)
    ψ = applyOmega(ψ, omega)                // Ωµ; sample is seeded + logged
ψᴽ = Πᴽ(ψ, ctx, memory)
φ = Φ(ψ, ctx)
ctxφ = ctx with { flux: φ, memoryView: memory }
γ = Γ(ψ, ctxφ)
ψ̃ = Fuse(ψᴽ, γ)                            // ⊕
ρ' = ρ(ψ̃, ctxφ)                            // assess — no Ψmeta yet
event = undefined
if collapsePredicate(ψ̃, ρ', ctxφ):
    { psiNext: ψ, event } = applyCollapse(ψ̃, ctxφ)
else:
    ψ = ψ̃
meta = emitMetaFrame(
    ψ, ctxφ with { slot: "post", collapseEvent: event }
)                                             // meta.scalars = Ψmeta(ψ, ctxφ)
append TraceFrame
if summarizeScheduled:
    mesh = Σ◯(ψ, memory, evidence, ctxφ)
if recallScheduled:
    { psiNext: ψ, memoryNext: memory, packet } =
        mnemonicLoopWithEvidence(ψ, memory)
phase = advancePhase(meta, ctxφ)
return { psi, memory, meta, event, phase }
```

Outer recurrence (not part of the tick body):

```
boundStep = bind explicit nextCtx and nextMemory around xiStep, then project
            each wrapper result to result.psiNext, yielding Psi -> Psi
run = Π↺(boundStep, schedule)
```
