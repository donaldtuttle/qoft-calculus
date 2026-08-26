# ALT-SR: composite versus staged routing experiment

## Registration status

**Classification:** DEVELOP / Alternative Realization / preregistered experiment design.

**Canonical effect:** None. This experiment compares realization-local Φ construction policies. It does not alter `Πᴽ`, `Γ`, typed `⊕`, or any stamped r2.2 contract.

**Current-runtime disposition:** Strict exclusive one-hot routing is rejected as a description of Memory Weather. The current runtime can apply a pending Θλ packet and an enabled nonzero Ωµ sample during the same tick. Order-sensitive staged routing remains open and testable.

## Question

Does applying `boundVector` between the Θλ and Ωµ contributions produce reproducible state or event differences relative to the current simultaneous composite policy, especially when a component or radial bound activates?

This is a comparison of three deterministic simulation policies, not a test of consciousness or physics.

## Fixed notation

For each tick, let:

```text
b = base observation/stimulus vector
θ = applied pending Θλ recall-bias vector
ω = logged Ωµ vector
k = optional frozen-snapshot observer-coupling vector
B(v) = boundVector(v, componentLimit, radialLimit)
A(v, x) = B(v + x)
```

`B` first clamps every component to `[-componentLimit, componentLimit]`, then scales the vector down if its Euclidean norm exceeds `radialLimit`.

## Frozen candidate policies

The policies are:

```text
H0 COMPOSITE (current runtime)
  Φ₀ = B(b + θ + ω + k)

H1 THETA-FIRST
  Φ₁ = B(B(b + θ) + ω + k)

H2 OMEGA-FIRST
  Φ₂ = B(B(b + ω) + θ + k)
```

The term “first” refers only to placement before the intermediate bound. Neither staged variant is implemented in the production engine at registration time.

Coupling is added at the final stage in all three policies so that observer coupling does not become an additional order factor. A separate robustness run may stage coupling, but it must not be pooled into the primary result.

## Why the models can differ

When neither the inner nor outer bound changes its input, all three policies reduce to the same vector sum. When a bound activates, in general:

```text
B(a + b) ≠ B(B(a) + b)
```

A fixed 12-dimensional route-level witness must be run before the dynamical suite. With omitted coordinates set to zero and both limits equal to `2`:

```text
b = [2, 0, ...]
θ = [0, 2, ...]
ω = [0, -1, ...]
k = [0, 0, ...]
```

The test passes only if `H0`, `H1`, and `H2` produce pairwise different vectors at tolerance `1e-12`. This witness establishes that the route implementations are mechanically distinguishable; it is not an efficacy result.

## Preregistered deterministic suite

### Seeds and shared configuration

Use 64 unsigned 32-bit seeds:

```text
seed[i] = (0x00051e1d + i · 0x9e3779b1) mod 2³²
for i = 0..63
```

For each seed, create one checkpoint and deep-clone it into `H0`, `H1`, and `H2`. All configuration, observations, memories, counters, initial state, and keyed random samples must be identical across the three arms. Only the Φ routing policy may differ.

Primary configuration:

```text
dimension          = 12
componentLimit     = 2
radialLimit        = 2
omega              = enabled
omegaAmp           = 0.055
thetaReplay        = enabled
memoryBias         = 0.18
coupling           = disabled
collapse           = enabled
collapseThreshold  = 0.78
collapseDwell      = 2
collapseHold       = 6
summarizeEvery     = 12
stimulusMode       = disrupt
stimulusAmplitude  = 4
```

Before the measured window, inscribe the same deterministic memory record in every arm and advance the common ancestor until `pendingRecall != null`. Begin the paired comparison only from a serialized checkpoint for which the first measured tick passes every activation check below. Run 96 measured ticks with the same observation sequence in each arm.

### Required activation checks

A seed contributes to the primary analysis only when all conditions hold for at least one paired measured tick:

```text
flux.recall.applied = true
flux.omega.enabled = true
flux.omega.amp > 0
the exact θ and ω input vectors match across H0/H1/H2
an intermediate bound changes its input in H1 or H2
all three arms begin that tick from the same checkpoint hash
```

Record separately whether component clamping, radial scaling, or both activated. Do not infer channel activity from the final bounded vector; use provenance fields and captured pre-bound vectors.

If fewer than 32 of the 64 seeds pass activation, the primary dynamical result is **invalid due to insufficient activated coverage**. It is not evidence for or against staged routing. Increase only the preregistered stimulus schedule in a newly versioned protocol.

## Controls

Run these paired controls with the same seed list and observation schedule:

1. **Linear-region control:** set `stimulusAmplitude` low enough that no bound activates. Expected: `H0 = H1 = H2` within `1e-12` for Φ and identical continuation hashes.
2. **Θλ-off control:** set `thetaReplay = false`. Expected: the Θ-first distinction disappears; no arm may report `recall.applied`.
3. **Ωµ-off control:** set `omega = false`. Expected: the Ω-first distinction disappears; `omega.amp = 0`.
4. **High-limit control:** increase both bounds enough that no bound activates while retaining the same raw inputs. Expected: policy differences disappear.
5. **Collapse-off diagnostic:** set `collapse = false` to distinguish direct routing divergence from later Λψ amplification.
6. **Coupling robustness run:** repeat the primary suite with fixed symmetric coupling enabled, reporting it separately.

A failed negative control invalidates the affected comparison and requires an implementation audit.

## Recorded outputs

For every arm, seed, and tick, record:

- raw `b`, `θ`, `ω`, and `k` vectors plus their source identifiers;
- every intermediate pre-bound and post-bound vector;
- component-clamp and radial-scale activation flags;
- final `Φ.data`, `Φ.energy`, `Γ.vec`, `Γ.magnitude`, candidate `ρ`, and pre-collapse candidate hash;
- predicate readiness, eligibility, dwell, hold, and trigger decision;
- committed state hash, Λψ event timing/reason/basin, Σ◯ node hashes, and selected/applied Θλ packet IDs;
- complete replay configuration and policy identifier.

## Primary and secondary metrics

Primary mechanistic metric:

```text
max_t ||Φ_Hi(t) - Φ_Hj(t)||∞
```

reported for all three policy pairs and stratified by bound activation type.

Primary dynamical metric:

```text
RMS_t ||ψ_Hi(t) - ψ_Hj(t)||₂
```

over the 96 measured ticks, paired by seed.

Secondary metrics:

- first tick of committed-state hash divergence;
- integrated absolute `ρ` difference;
- Λψ event-count, timing, and basin disagreement;
- Σ◯ summary-hash disagreement;
- Θλ packet identity and recall-similarity disagreement;
- fraction of divergence occurring before versus after the first Λψ event.

Report every seed and the paired distributions. Do not select only visually dramatic trajectories.

## Decision and kill criteria

1. **Mechanism-valid:** the fixed route witness is pairwise distinct; all negative controls behave as predicted; and at least 32 seeds meet primary activation requirements.
2. **Staging has an operational signature:** at least one activated primary tick has pairwise `Φ` difference greater than `1e-12`, and that difference replays exactly from the same checkpoint.
3. **No detected staged effect in the tested region:** all activated primary ticks and complete continuations are identical within `1e-12` and have identical hashes/events across all qualifying seeds.
4. **Kill criterion:** if criterion 3 holds after criterion 1 is satisfied, reject `ALT-SR` as a distinct operational realization under this registered domain. Do not rescue it with an unregistered metric, seed subset, or altered threshold.
5. **Invalid rather than negative:** activation failure, provenance mismatch, nondeterministic replay, or a failed negative control invalidates the experiment.

No outcome establishes that one policy is cognitively, physically, or scientifically superior. A later efficacy claim requires an independently preregistered external prediction task and an ordinary matched baseline.

## Ordinary baseline

The comparison baseline is a bounded nonlinear state-space model with the same R¹² state, deterministic input schedule, seeded noise, delayed associative-memory bias, coherence-dependent update, dwell/hold event gate, scheduled pooling, and nearest-neighbor recall, described without QOFT glyph semantics. Parameter count, random streams, bounds, checkpoints, and output metrics must match the corresponding Memory Weather arm.

The typed decomposition has demonstrated added value only if it improves a separately defined, held-out measure such as intervention localization, audit accuracy, cross-realization transfer, or prediction. Visual distinctness alone is not added value.

## Forbidden extrapolations

- No change to abstract canon or glyph definitions.
- No biological, neurological, consciousness, physical, or quantum inference.
- No claim that noncommutativity of the staged numerical policy proves noncommutativity of canonical `⊕`.
- No claim that a more stable, coherent, colorful, or collapse-rich trajectory is inherently better.
- No post hoc seed removal, threshold adjustment, metric substitution, or pooling of primary and robustness runs.
- No conversion of a simulation-internal difference into an empirical-world claim without a separate bridge model and evidence.
