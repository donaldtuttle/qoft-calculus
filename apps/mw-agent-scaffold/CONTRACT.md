# Wrapper contract v0.1.0 — accepted amendments

Status: DEVELOP scaffold
Engine: Memory Weather v0.1.1, file SHA-256 pinned in `fixtures/LOCK.json`
Branch target: `feature/mw-agent-scaffold-a`

## Question

Does this recursive state update cause an otherwise identical policy
to behave measurably better than the best simple persistent-state control?

Task: delayed-cue bandit, probe accuracy at distractor depth 4.

## Shared pipe

```
obs → pinned embed table / keyed distract embed
    → frozen P (12 × 32)
    → bound R12
    → substrate.update(u)
    → policy(obs, carrier[12])
    → env
```

Encoder and P are hashed in fixtures. `textVector` is not used.

## Policy

Stub cosine readout against frozen cue prototypes.
Same policy object for every condition.
Primary input: observation + carrier[12].
STATELESS carrier = zero[12].
Audit packet fields are not policy inputs.

## Injection

MW: `Engine.step(state, { forcingVector: u, stimulusAmplitude: 1 })`.
Reward and outcome are not passed into the engine.

## EMA family (preregistered)

`alpha in {0.10, 0.24, 0.40, 0.70}`

Compare MW to the best of these on the locked seed list.
Winner-curse on the control is accepted; it makes a MW claim harder.

## Seeds

20 unsigned seeds in `fixtures/seeds.json`.
Primary cell: 8 episodes per seed, distractor depth 4, gate `every_turn`,
memory off.

## Verdicts

1. Substrate inertness: MW fails
   mean(MW - bestEMA) >= 0.05 AND paired 95% CI lower bound > 0.
2. Operator attribution: run MW with collapse, thetaReplay, and omega
   off. If a MW advantage dies under that ablation, attribute the gap
   to those operators. If it survives, do not attribute it to them.

## Replay

Hash carrier / engine digest every turn. Recompute from the observation
sequence without the policy.

## Hold

Do not run the primary 20-seed cell until tests, manifest, projection
hash, seeds, metrics, and this gate are reviewed.
Do not train a readout.
Do not enable coupling.
Keep `every_turn` as the primary gate.
