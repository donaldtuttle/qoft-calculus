# QOSMOS R¹² Simulator

An original interactive visualizer for the repository's existing **Public
Typed Realization A**. It imports `../../src/engine.ts` directly; it does not
copy or claim trajectory parity with the separately deployed Grok workbench.

Two views ship from the same tested session adapter:

- `index.html` — the full responsive simulator;
- `probe.html` — a compact radar/telemetry probe derived from the useful
  standalone presentation concept, now wired to `QosmosSession → xiStep` with
  no inline engine or fallback dynamics.

Live: [full simulator](https://donaldtuttle.github.io/qoft-calculus/simulator/) · [compact probe](https://donaldtuttle.github.io/qoft-calculus/simulator/probe.html)

## Run locally

Requires Node 22.12.0 or newer (the minimum supported by the pinned Vite 8
toolchain).

```bash
cd apps/simulator
npm ci
npm run check
npm run dev
```

Open the development URL for the full simulator, or append `/probe.html` for
the compact probe. The production build emits both entry points.

## Boundary

The canonical target is the typed spine:

```text
ψ ∈ Ψ
Ψᴽ ⊆ Ψ
Γ(ψ; ctx) ∈ G
⊕ : Ψᴽ × G → Ψ
Ξ(ψ) = ψᴽ ⊕ Γ(ψ; ctx)
```

The numerical dynamics, twelve latent values, coherence score, six basins,
thresholds, memory mesh, and charts are realization-specific. A passing check
establishes deterministic behavior and implementation invariants for this
engine only. It is not evidence of physics, quantum behavior, consciousness,
or universal observer dynamics.

## Input semantics

The field-stage click queues the engine's existing `pulse` stimulus for exactly
one tick and then restores the selected persistent stimulus. Click position is
visual feedback only; it does not mutate ψ or introduce a second engine path.
This keeps every committed transition inside `xiStep`.

In the compact probe, activating Φ while paused immediately commits that one
pulse tick; during playback it is consumed by the next scheduled tick. The full
simulator always leaves a paused pulse pending until Step or Play.

Configuration and ablation edits start a fresh fixed-config run so exports stay
replayable. Runs stop at 16,384 ticks, while ordinary rendering reads only the
most recent 256 frames. Full trace cloning occurs only for an explicit export
or verification request. State hashes are deterministic diagnostics, not
cryptographic signatures.

The compact probe's chained `trace` digest is also a non-cryptographic,
probe-local replay helper. Its pinned 64-tick reference is a software fixture
for Public Typed Realization A—not a canonical QOFT field or scientific result.
