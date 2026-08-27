# MW Agent Scaffold Architecture A v0.1

Classification: Typed Realization / Experimental Prediction
LOCKED_EXECUTED commit: dc325ae72287312dd967d63a3ad5a69df1225573

PRIMARY_GATE: FAIL
LOCKED_VERDICT: SUBSTRATE_INERT
OBSERVED_DIRECTION: MW_DISADVANTAGE
OPERATOR_ATTRIBUTION: NO_ADVANTAGE_TO_ATTRIBUTE
ARCHITECTURE_B: NOT_JUSTIFIED
PROMOTION: BLOCKED
DISPOSITION: CLOSE / PRESERVE / NO RETUNING

## Locked cell

- 20 seeds, 8 episodes, distractor depth 4
- gateMode every_turn, memory off
- EMA family 0.10, 0.24, 0.40, 0.70
- paired t 95%, df=19, tCrit=2.093024054408263
- result SHA-256: 785e07c0453f386e261f58353febc34fa11f34d57846acf8ba1a45f3235a1dbb

## Locked numbers

Best EMA α 0.10 mean 0.50625
MW minus best EMA −0.2875
paired 95% CI [−0.38068, −0.19432]
Ablated MW minus best EMA −0.28125

## Forensic note

The saved primary JSON has seed-level accuracies only.
Turn geometry is a deterministic reconstruction of the same locked seeds.
Replay probe accuracies matched the locked file on every condition.

## Where cue separability is first lost

On MW, mean correct-cue readout margin is already negative on the cue turn
(turn 0, margin −0.068, readout acc 0.456).

After the first distractor, MW readout acc is chance (~0.23) and stays there.
EMA α=0.10 is still separable after four distractors (readout acc 0.519 at turn 4).

The frozen readout never had a clean MW cue encoding to protect.
MW vs ablated-MW trajectory distance stays ~0.03 across turns.
No component saturation. Carrier norms stay ~0.46–0.48.
