# MW Agent Scaffold A v0.1.0

DEVELOP experimental wrapper around Memory Weather v0.1.1.

This package does not change `apps/memory-weather` engine behavior.
It is a harness for one question:

Does the MW R12 update improve delayed-cue probe accuracy over the
best preregistered EMA control when the policy sees only
`observation + carrier[12]`?

Claim boundary: persistent task-relevant state under distraction.
Not a general-intelligence result.

## Conditions

- MW — stock engine, observation injected as `forcingVector`
- EMA_CONTROL — `x ← bound((1-α)x + α u)` for α in `{0.10, 0.24, 0.40, 0.70}`
- STATELESS — carrier is zero[12]

Primary policy input is condition-blind. MW audit fields are logs only.

## Lock before any primary run

```
npm run lock
npm test
npm run manifest
```

Primary experiment stays disarmed until `fixtures/LOCK.json`
`primary_experiment_armed` is flipped after review of hashes, seeds,
metrics, and the decision gate.

## Decision gate

Paired per-seed probe accuracy at distractor depth 4.

MW minus best EMA must satisfy:

- mean difference ≥ 0.05
- paired 95% CI lower bound > 0

Two verdicts:

- substrate inertness — MW fails that gate against best EMA
- operator attribution — whether disabling collapse / theta / omega removes a gap
