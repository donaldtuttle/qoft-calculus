# QOSMOS Memory Weather

A deterministic, dependency-free R¹² observer-field simulation with an auditable scientific viewport. It preserves the visual intuition of “memory weather” while replacing legacy W-space, glyph-mass, and symbolic-gravity claims with declared typed quantities and projection provenance.

> **Status:** DEVELOP · Typed Realization · operational simulation, not a claim of physics or consciousness.

This app lives beside—not inside—the repository's original Realization A
simulator. It does not replace `apps/simulator`, the root `src/engine.ts`, the
stable root skill, or the r2.2 DEVELOP candidate.

## Run it

The easiest path is to open `dist/memory-weather.html`. It is a complete offline build with no server, account, package install, or network request.

Use **Load fixed-seed demo** for a 96-tick replay with three inscriptions, Θλ recall, Σ◯ summaries, and an integrity-bearing Λψ event. The same replay is checked in at `examples/fixed-seed-demo.json`.

For source-mode development:

```bash
cd apps/memory-weather
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## What is implemented

- Simulated R¹² observer state `ψ`, reflexive projection `ψᴽ`, semantic flux `Φ`, gradient object `Γ`, coherence `ρ`, and typed fusion `⊕`.
- Fixed-seed Ωµ modulation with every sample logged.
- Dwell- and hold-gated Λψ collapse with pre/post hashes.
- Σ◯ trace summarization and bounded mesh memory.
- Θλ recall packets that only render as influence when actually applied.
- Fixed, versioned 2×12 and 3×12 projections with a matrix hash.
- Memory Weather composite, scalar heatmap, vectors, streamlines, traces, basins, trigger contours, events, and 3D terrain.
- A provenance inspector answering source quantity, transform, discarded information, and direct/derived status.
- Optional two-observer projection with independent Πᴽ/Γ/ρ/memory/Λψ state and frozen-snapshot symmetric coupling.
- Exact replay JSON import/export and telemetry CSV export.

## Controls

- **Run / Pause / Step** invokes the deterministic tick. The repeating `scheduleRun → executeStep → Engine.step` control loop is the realization-level candidate binding for Π↺; `phase` and `step` increments are recurrence helpers, not Π↺ by themselves.
- Click the 2D field to supply a realization-local R¹² forcing target through the declared inverse projection.
- **Inscribe** creates a local memory record; it does not redefine Σ◯.
- **Recall Θλ** applies the best eligible memory packet on following ticks.
- **Force Λψ** emits the same integrity-bearing event as predicate-triggered collapse.
- Toggle Memory, Σ◯, Ωµ, and Λψ independently for ablation.
- Select any layer or event to inspect its projection provenance.

Keyboard: `Space` run/pause, `.` single step, `R` reset, `1` weather, `2` field, `3` terrain. Shortcuts are ignored while editing text.

## Reproducibility

```bash
npm test
npm run verify
```

Same seed + config + inputs yields identical rounded ψ hashes and event order. Rendering may drop visual frames under load; simulation ticks are never inferred from animation time.

## Scientific scope

The abstract canonical target is:

```text
ψ ∈ Ψ
Ψᴽ ⊆ Ψ
ψᴽ = Πᴽ(ψ; ctx, M) ∈ Ψᴽ
Γ(ψ; ctx) ∈ G
⊕ : Ψᴽ × G → Ψ
Ξ(ψ) = ψᴽ ⊕ Γ(ψ; ctx)
```

Memory Weather interprets those abstract types rather than redefining them:

```text
⟦Ψ⟧MW  = Ψsim
⟦Ψᴽ⟧MW = Ψᴽsim ⊆ Ψsim
⟦G⟧MW  = GR12
```

This realization declares no interpretation map from `Ψsim` to a biological state space. Both the projected state and the fused full state remain simulation states. This is the scope firewall; it is not a claim that such a map is impossible in principle.

The exact fusion algebra, gradient proxy, R¹² coordinates, basins, thresholds, field kernel, text encoder, projection matrices, “weather” labels, and multi-observer coupling are realization-local. The implementation is a **structurally compatible typed realization** of the r2.2 spine, not a proven equivalent implementation of every property left open by canonical `⊕`. Passing tests establishes implementation behavior only.

See [docs/REALIZATION_CONTRACT.md](docs/REALIZATION_CONTRACT.md), [docs/PROJECTION_PROVENANCE.md](docs/PROJECTION_PROVENANCE.md), [docs/SOURCE_EVIDENCE.md](docs/SOURCE_EVIDENCE.md), and the preregistered [composite-versus-staged routing experiment](docs/ALT_STAGED_ROUTING_EXPERIMENT.md).

The exact remapping of historical W-space-era visual terms is recorded in [docs/LEGACY_VISUAL_CROSSWALK.md](docs/LEGACY_VISUAL_CROSSWALK.md).

## Repository integration

- Repository: `donaldtuttle/qoft-calculus`
- Integrated on `main` via [PR #4](https://github.com/donaldtuttle/qoft-calculus/pull/4), merge commit `577658930d0c48a01f83d0fc273edfe17a8c4d3f`
- App path: `apps/memory-weather`
- License: MPL-2.0 under the repository's root `LICENSE`
- CI: `.github/workflows/memory-weather.yml`

No supplied executable bytecode is imported or required.
