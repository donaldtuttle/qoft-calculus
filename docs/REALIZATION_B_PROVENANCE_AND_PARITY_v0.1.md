# REALIZATION B PROVENANCE AND PARITY v0.1

Date: 2026-08-28
Status: DEVELOP / forensic record
Canonical weight: None
Scope: Public Typed Realization A versus the currently deployed Grok Typed Realization B workbench

## Executive ruling

Public Typed Realization A preserves the lagged-reflexive collapse architecture of the currently deployed Grok Typed Realization B, but it does not preserve B's full state machine and is not trajectory-equivalent to B.

The shared architectural rule is:

```text
Πᴽ owns selfModel updates through a lagged EMA.
Λψ changes ψ but does not write selfModel / ψᴽ.
The next Ξ tick therefore reconciles a post-collapse ψ against a still-lagged ψᴽ.
```

This produces post-Λψ recoil in both realizations. The recoil is therefore not a reconstruction-only artifact.

## Provenance boundary

This record applies to the current live B workbench recovered from:

```text
https://glyphogenic-calculus.grok.me
```

Pinned live assets reported during the 2026-08-28 forensic session:

```text
routes-Be1slIcX.js
bytes:   123683
sha256:  b0c8587857ce5f83d34e6543c7d7c4315b9766729a6aad43512b3b54e4d8e92b

index-DHIz4nZl.js
bytes:   385407
sha256:  cfd14a31c0fca31db20a85e76addcb560fa6489a47f930ca4fa1e4fb50ba8126

retrieved: 2026-08-28T12:40:53Z
last-modified reported: 2026-08-28 12:37:04 GMT
```

Historical pre-bundle Grok source remains UNKNOWN. This record must not be used to claim parity with unrecovered earlier Grok implementations.

## Public A engine pin

The Public A comparison used the current engine blob:

```text
e492c1d51ff5f8bf4ee1b7a4ff5a1135440ce6d5
```

For that build, `collapseMix = 0.82` is hardcoded in the collapse path rather than serialized as an `EngineConfig` field.

## Shared ownership mechanism

Both current Public A and live B implement the following ownership pattern:

```text
selfModel₀ := ψ₀

Πᴽ:
  selfModel ← (1 − β)·selfModel + β·ψ.latent
  β = 0.1

Λψ:
  changes ψ
  does not write selfModel
```

Both also use:

```text
collapseMix  = 0.82
collapseDwell = 2
collapseHold  = 6
```

The cold-start zero-prior defect previously observed in Public A reconstruction was repaired by warm-starting `selfModel` from `ψ₀`. That initialization repair is distinct from a runtime hard rebase after Λψ.

## Telemetry evidence

### Live B, first Λψ

Protocol:

```text
seed         = 0x51e1d
stimulus     = periodic
gammaScale   = 0.32
tau          = 0.78
reflexRate   = 0.1
dwell        = 2
hold         = 6
collapseMix  = 0.82
```

Observed:

| tick | role | stateNorm | reflexNorm | ρ | note |
|---:|---|---:|---:|---:|---|
| 4 | pre | 0.592084 | 0.583972 | 0.781940 | aligned |
| 5 | Λψ | 1.029077 | 0.584665 | 0.902632 | closure |
| 6 | next | 0.619668 | 0.612632 | 0.814783 | recoil |

The isolated B runner also matched the bundle's reported 8-tick hash fixture for seed `0x51e1d`:

```text
d9c6546f
303a39ce
7e62d814
dd119e92
d29beb14
cefbd37d
a13bce3b
78876f2b
```

### Public A, first Λψ at shared gammaScale 0.32

Observed:

| tick | role | stateNorm | reflexNorm | ρ | note |
|---:|---|---:|---:|---:|---|
| 29 | pre | 0.911167 | 0.936740 | 0.770754 | aligned |
| 30 | Λψ | 1.394060 | 0.934169 | 0.820000 | tension |
| 31 | next | 0.895749 | 0.914713 | 0.795850 | recoil |

The ownership signature matches B: ψ jumps, ψᴽ remains lagged, and the next tick recoils.

## 4096-transition comparison

| property | Public A | Live B | classification |
|---|---|---|---|
| warm selfModel IC | yes | yes | MATCH |
| lagged Πᴽ EMA β=0.1 | yes | yes | MATCH |
| Λψ writes selfModel | no | no | MATCH |
| collapseMix / dwell / hold counts | 0.82 / 2 / 6 | 0.82 / 2 / 6 | MATCH |
| post-Λψ recoil | yes | yes | MATCH |
| initial ‖ψ₀‖ | 1.0548 | 0.5910 | DIFFERENT |
| first-tick ρ | 0.5677 | 0.6636 | DIFFERENT |
| first Λψ | t=30 tension | t=5 closure | DIFFERENT |
| collapses / 4096 | 191 | 94 | DIFFERENT |
| median interval | 23 | 39 | DIFFERENT |
| median collapse ‖ψ‖ | 1.477 | 1.024 | DIFFERENT |
| median next/collapse norm | 0.599 | 0.413 | FUNCTIONALLY SIMILAR |
| median next reflexConf | 0.579 | 0.598 | FUNCTIONALLY SIMILAR |
| collapse target | raw basin | basin × 1.15 | DIFFERENT |
| snap coherence | max(ρ, 0.82) | ρ + 0.12 | DIFFERENT |
| basin atlas | six fixed public vectors | six generated unit basins | DIFFERENT |
| flux / Ωµ / hold algebra | A-specific | B-specific | DIFFERENT |
| hashes / trajectory | A-specific | B fixture-verified | DIFFERENT |
| pre-bundle Grok source | UNKNOWN | UNKNOWN | UNKNOWN |

## Interpretation boundary

Supported:

```text
Public A preserved B's lagged Πᴽ / Λψ ownership architecture.
Post-collapse recoil is intentional behavior in both tested realizations.
```

Not supported:

```text
Public A reproduces B trajectories.
Public A is implementation-identical to B.
The shared recoil rule is required by QOFT canon.
The shared recoil has cognitive, neural, quantum, or physical significance.
```

## Hard-rebase variants

A hard rebase such as:

```text
selfModel := ψ_collapsed
```

is not a repair to either current Public A or current live B. It is a separate realization intervention. Earlier counterfactual testing materially changed the collapse statistics and therefore changed the dynamical system.

## Recommended next experiment

Hold the lagged ownership rule fixed and ablate the surrounding A/B differences one at a time:

```text
initial amplitude
basin atlas
B target inflation ×1.15
post-collapse coherence law
Φ drive
Ωµ behavior
hold algebra
```

The target question is which surrounding mechanisms explain the large trajectory split while preserving the shared reflexive-lag architecture.

## Close

Public A preserved Grok B's lagged-reflexive collapse architecture and did not preserve Grok B's machine.
