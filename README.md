# qoft-calculus

[![CI](https://github.com/donaldtuttle/qoft-calculus/actions/workflows/ci.yml/badge.svg)](https://github.com/donaldtuttle/qoft-calculus/actions/workflows/ci.yml)
![Node 22.12+](https://img.shields.io/badge/Node-22.12%2B-339933?logo=nodedotjs&logoColor=white)
![Package 1.0.2](https://img.shields.io/badge/package-1.0.2-2563EB)
![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-6B7280)

> **The contract names the operators. The engine shows what they actually do.**

`qoft-calculus` is a deterministic TypeScript reference engine and agent-facing contract for studying typed recursive state updates. It is for developers and researchers who want an inspectable implementation, ablations, and reproducible traces, not evidence that QOFT describes physics, consciousness, or neural dynamics.

## What you can do here

- run one concrete 12-dimensional realization with a fixed seed;
- explore that realization in an interactive browser simulator;
- run the separate Memory Weather v0.1.1 observer-field viewport offline;
- run the React Memory Weather lab, a viewport of that same engine;
- inspect every tick, diagnostic frame, collapse event, memory update, and regime change;
- disable individual mechanisms and test whether behavior changes;
- verify self-model ownership, hysteresis, deterministic noise, and configuration rejection;
- load the public agent contract without silently mixing it with the newer DEVELOP candidate;
- compare the reference engine with the separately deployed interactive workbench.

## Run it in sixty seconds

Node 22.12+:

```bash
npm ci
npm run typecheck
npm test
npm run run
```

The test suite pins deterministic behavior, operator ownership, hysteresis, configuration validation, and individual ablations. A passing run establishes conformance for this implementation only.

Interactive simulator:

```bash
cd apps/simulator
npm ci
npm run check
npm run dev
```

The simulator provides play/pause/step/reseed controls, flux modes, one-tick
field pulses, independent mechanism ablations, live R¹²/ρ/Γ/Φ telemetry,
collapse hashes, the Σ◯ memory mesh, trace export, and browser-safe
determinism/integrity checks. See
[`apps/simulator/REALIZATION.md`](apps/simulator/REALIZATION.md) for the exact
canonical-target/runtime boundary.

The same build includes `probe.html`, a compact radar and parity view wired to
the identical `QosmosSession → xiStep` path. It fails closed if the engine cannot
initialize and contains no synthetic fallback realization.

Memory Weather viewport:

```bash
cd apps/memory-weather
npm run verify
python3 -m http.server 8000
```

Then open `http://localhost:8000`, or open the dependency-free
`apps/memory-weather/dist/memory-weather.html` directly. Memory Weather is a
separate DEVELOP typed realization with its own JavaScript engine, projection
provenance, staged-routing experiment, and deterministic replay fixtures. It
does not replace the original simulator or the root TypeScript engine.

React Memory Weather lab (same engine, same hashes):

```bash
cd apps/memory-weather-lab
npm ci
npm run verify
npm run dev
```

This is a Vite + React viewport of `apps/memory-weather`. It does not replace
the vanilla HTML instrument. See
[`apps/memory-weather-lab/REALIZATION.md`](apps/memory-weather-lab/REALIZATION.md).


## The model in plain English

Each tick behaves like a small, inspectable state machine:

```text
current state
    ↓
bounded self-model
    ↓
contextual flux + optional seeded modulation
    ↓
proposal for change
    ↓
typed fusion into a provisional next state
    ↓
diagnostics + optional thresholded projection
    ↓
memory, consolidation, and recurrence
```

The invariant is:

```text
Ξ(ψ) = ψᴽ ⊕ Γ(ψ)
```

`ψᴽ` is the bounded reflexive projection, `Γ(ψ)` is the update carrier, and `⊕` is typed fusion. The `+` symbol found in older writing is a historical synonym for `⊕`, never arithmetic addition.

The equation's early public form and subsequent type refinement are documented in [`QOFT_Scaffold_Public`](https://github.com/donaldtuttle/QOFT_Scaffold_Public/blob/main/CALCULUS_EVOLUTION.md). That scaffold is a historical genealogy artifact, not an authority surface for either skill version or a conformant implementation of Public Typed Realization A.

## Repository map

| Path | Role |
|---|---|
| [`SKILL.md`](SKILL.md) | Authoritative public v1.0 operator contract and firewall |
| [`src/engine.ts`](src/engine.ts) | Public Typed Realization A, locked to R¹² |
| [`tests/determinism.ts`](tests/determinism.ts) | Determinism, ownership, ablation, hysteresis, and validation suite |
| [`apps/simulator`](apps/simulator) | Original interactive visualizer around Public Typed Realization A |
| [`apps/memory-weather`](apps/memory-weather) | Memory Weather v0.1.1 DEVELOP typed realization and auditable viewport |
| [`apps/memory-weather-lab`](apps/memory-weather-lab) | React viewport of Memory Weather v0.1.1; same engine, not a replacement |
| [`scripts/fetch-skill.sh`](scripts/fetch-skill.sh) | Download, validate, hash, and atomically replace the public skill |
| [`skills/qoft-qosmos/SKILL.md`](skills/qoft-qosmos/SKILL.md) | Kernel v1.1 DEVELOP candidate, pending adoption |
| [`docs/agent-skill.md`](docs/agent-skill.md) | Authority and version boundary between the two skill surfaces |
| [`docs/RELEASE_PLAN.md`](docs/RELEASE_PLAN.md) | Stable and DEVELOP tag coordinates |
| [`CHANGELOG.md`](CHANGELOG.md) | Versioned implementation and documentation history |

## Public engine, repository apps, and Grok workbench

```text
root SKILL.md v1.0
    ↓ public operator contract / firewall
src/engine.ts ── apps/simulator
Public Typed Realization A

apps/memory-weather
Memory Weather v0.1.1 DEVELOP typed realization

apps/memory-weather-lab
React viewport of that same v0.1.1 engine

separate deployed Grok workbench
Typed Realization B
```

The repository simulator is a new interface around `src/engine.ts` and therefore
uses Realization A trajectories. The Grok workbench remains separate Typed
Realization B; the two realizations are **not trajectory-equivalent under the
same seed**.

Memory Weather has its own declared interpretation map into `Ψsim`, explicit
projection provenance, and realization-local fusion policy. Its structural
compatibility with the r2.2 type spine is not a claim of trajectory equivalence
with either Public Typed Realization A or the Grok workbench, and it carries no
canonical weight. `apps/memory-weather-lab` is a React shell over that same
Memory Weather engine; it is trajectory-equivalent with `apps/memory-weather`
under identical seed/config/input, and it is not Realization B.


Default seed `0x51e1d` in periodic mode:

| Tick | Live app ρ | Public engine ρ |
|---:|---:|---:|
| `1` | `0.664` | about `0.60` |
| `5` | `Λψ → closure` | still rising |

Do not assume `src/engine.ts` is the deployed workbench source unless that exact source is published and hash-verified.

Live workbench: <https://glyphogenic-calculus.grok.me>  
Public skill endpoint: <https://glyphogenic-calculus.grok.me/SKILL.md>

## Agent skill versions

The root [`SKILL.md`](SKILL.md) remains the authoritative v1.0 contract used by Public Typed Realization A and by `scripts/fetch-skill.sh`.

The portable [`qoft-qosmos`](skills/qoft-qosmos/SKILL.md) skill packages a **Kernel v1.1 DEVELOP candidate** with focused references. Its implicit invocation is disabled and formal adoption is pending. It preserves:

```text
Ξ(ψ) = ψᴽ ⊕ Γ(ψ; ctx)
⊕ : Ψᴽ × G → Ψ
```

The two skill files are versioned independently. Publishing the candidate beside v1.0 does not silently merge, supersede, adopt, or promote it.

## Closed operator set

```text
Ξ  Πᴽ  Γ  ⊕  Λψ  Σ◯  Θλ  Ωµ  Π↺  Ψmeta  Φ  ρ
```

Do not add glyphs to this realization. Compose the existing set or declare a local helper without promoting it into the operator alphabet.

## Reference tick

```text
ψᴽ = Πᴽ(ψ)
Φ  = sampleFlux(Θλ(ψ))          // includes Ωµ Gaussian when active
Γ  = gradient(Φ, ρ)
ψ̃ = fuse(ψᴽ, Γ)                 // ⊕
if ρ ≥ τ for dwell ticks: ψ ← Λψ(ψ̃)
emit Ψmeta                      // after Λψ; entropy from final ψ
maybe Σ◯                         // mean-pool stateHistory window
phase ← (phase + 1) mod 8
```

`Λψ` must not write `Πᴽ` or `selfModel`. `Πᴽ` is the only licensed self-model writer.

## Typed Realization A details

- state dimension `D` is locked to `12`; other dimensions are rejected;
- the local `∇Φ` proxy is `Φ − ψ`;
- `⊕` uses the mix/gate formula declared in the root skill;
- `Ωµ` is seeded Gaussian modulation generated once per tick with Box-Muller and logged;
- the six local basins are closure, insight, identity, tension, recall, and threshold;
- `hold = 6` means six full post-snap suppression ticks, with the next eligible collapse at `+7`;
- mesh IDs are monotonic and remain unique past capacity;
- `Σ◯` mean-pools latent state history rather than only a self-model snapshot;
- configuration validation rejects NaN, non-finite values, and non-integer count fields.

Determinism uses the default periodic drive. Collapse reachability, integrity, and mechanism ablations use basin drive.

## Scope

This repository is an operational model of typed observer-state recursion. It does not claim physical equivalence to quantum collapse, light transport, neuroscience, or consciousness.

## License

This repository is licensed under the **Mozilla Public License 2.0**.

- Modified MPL-covered QOFT source files must remain available under MPL-2.0.
- Larger applications may remain proprietary, provided the MPL-covered files and notices are preserved as required by the license.

See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).

Copyright 2026 Donald Tuttle.
