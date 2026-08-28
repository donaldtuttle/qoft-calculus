# Memory Weather terminology

**Status:** Presentation-layer clarification for Memory Weather v0.1.1  
**Canonical effect:** None  
**Runtime effect:** None

Memory Weather is a visual instrument for **memory-conditioned state dynamics**.
It follows an evolving 12-dimensional simulated state as contextual input,
reflexive state estimation, memory recall, bounded modulation, and commitment
events alter its trajectory.

“Weather” is visual shorthand for the current dynamical regime. It does not
describe what the system *is*. It describes how measured conditions change over
time. The analogy is not a claim that the simulation has moods, models literal
meteorology, or represents biological consciousness.

## Reading rule

The interface uses three layers:

```text
symbol → technical label → plain explanation
                     ↘ optional weather alias
```

Symbols remain visible because they preserve correspondence with the QOFT
operator contract. Technical English is primary so a new reader does not have
to decode the glyphs before using the instrument.

## Operator vocabulary

| Symbol | Primary interface label | Memory Weather meaning |
|---|---|---|
| `ψ` | Current state | The present 12-value simulated latent state. |
| `ψᴽ` | Reflexive state estimate | A bounded internal estimate used to preserve state continuity. |
| `Πᴽ` | Reflexive projection | Produces the reflexive estimate from current state and realization context. |
| `Φ` | Contextual forcing | The combined input acting on the update, including stimulus, recall, modulation, and optional coupling. |
| `ρ` | Coherence measure | A realization-local measure used in gating and commitment readiness. |
| `Γ` | Context-conditioned update | The proposed direction of change; the interface reports its magnitude as `‖Γ‖`. |
| `⊕` | State integration | The declared fusion mechanism that produces a valid next simulation state. |
| `Ξ` | State-transition step | Executes one complete update cycle. |
| `Λψ` | Commitment projection | Applies and records a selected-state projection when the realization’s rules permit it. |
| `Θλ` | Memory recall and replay | Retrieves a memory packet and allows it to influence a later update. |
| `Σ◯` | Trace summarization | In this realization, summarizes recent activity into bounded memory structure. |
| `Ωµ` | Bounded modulation | In this realization, supplies deterministic, logged variation. |
| `Π↺` | Recurrence schedule | Repeats the state-transition step under the application schedule. |
| `Ψmeta` | Diagnostic telemetry | Records coherence, drift, entropy, update magnitude, commitment status, and related measurements. |

`Σ◯` and `Ωµ` are explicitly realization-specific descriptions. They do not
resolve their broader framework overloads.

## Regime labels

Runtime weather IDs and source labels remain unchanged for replay compatibility.
The interface adds a technical primary label and retains the original label as
a weather alias.

| Runtime ID | Primary label | Weather alias | Measured interpretation |
|---|---|---|---|
| `initial` | No measured regime | Unformed field | No committed simulation tick is available. |
| `stable-high` | Coherent low-update regime | Stable high | Coherence `ρ` is high while update magnitude `‖Γ‖` is low. |
| `shear-front` | High-drive regime | Shear front | Contextual forcing `Φ` and update magnitude `‖Γ‖` are elevated. |
| `memory-front` | Recall-influenced regime | Memory front | An applied memory replay packet `Θλ` is influencing the update. |
| `collapse-watch` | Commitment condition active | Collapse watch | The readiness condition is active; dwell or hold rules may still prevent commitment. |
| `collapse-clearing` | Commitment event registered | Collapse clearing | A commitment projection `Λψ` was applied and recorded on the tick. |
| `variable` | Mixed dynamical regime | Variable field | No specialized deterministic regime rule matched the current telemetry. |

A “watch” therefore does not mean a commitment is guaranteed. The telemetry
separately records whether commitment would trigger, is eligible, and actually
occurred.

## Compatibility boundary

This clarification intentionally preserves:

- engine version `0.1.1`
- runtime regime IDs, labels, and rationales
- replay and telemetry schema fields
- thresholds and mechanism order
- deterministic state hashes
- fixed-seed demonstration inputs and expected state hash

Only visible labels, explanations, accessibility text, documentation, and UI
messages change.
