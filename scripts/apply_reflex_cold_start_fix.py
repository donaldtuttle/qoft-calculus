from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"{path}: expected exactly one replacement target, found {count}\n"
            f"TARGET:\n{old}"
        )
    target.write_text(text.replace(old, new), encoding="utf-8")


def node_json(source: str) -> dict[str, object]:
    completed = subprocess.run(
        ["node", "--experimental-strip-types", "--input-type=module"],
        cwd=ROOT,
        input=source,
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(completed.stdout.strip())


def apply_source_patch() -> None:
    replace(
        "src/engine.ts",
        "  selfModel: Vec;\n  priorRho: number;",
        "  selfModel: Vec;\n  selfModelInitialized: boolean;\n  priorRho: number;",
    )
    replace(
        "src/engine.ts",
        "    selfModel: zeros(cfg.D), priorRho: 0.42, priorGamma: zeros(cfg.D),",
        "    selfModel: zeros(cfg.D), selfModelInitialized: false, priorRho: 0.42, priorGamma: zeros(cfg.D),",
    )
    replace(
        "src/engine.ts",
        "export function projectReflex(psi: Psi, ctx: Ctx): PsiReflex {\n  const b = ctx.config.reflexRate;",
        """/**
 * Realization-local initial condition for the lagged reflexive cache.
 * This does not invoke Πᴽ or consume a tick; it prevents an absent prior
 * observation from being represented as a twelve-dimensional zero state.
 */
export function warmStartSelfModel(psi: Psi, ctx: Ctx): void {
  if (psi.latent.length !== ctx.config.D || psi.latent.some((value) => !Number.isFinite(value))) {
    throw new Error(`self-model warm start requires ${ctx.config.D} finite latent components`);
  }
  ctx.selfModel = psi.latent.slice();
  ctx.selfModelInitialized = true;
}

export function projectReflex(psi: Psi, ctx: Ctx): PsiReflex {
  if (!ctx.selfModelInitialized) warmStartSelfModel(psi, ctx);
  const b = ctx.config.reflexRate;""",
    )
    replace(
        "src/engine.ts",
        "      mix: fused.mix, gate: fused.gate, dGamma: drift,\n      omegaAmp: omega.amp, omegaActive: omega.active ? 1 : 0, omegaRaised: omega.raisedBecauseStuck ? 1 : 0,",
        """      mix: fused.mix, gate: fused.gate, dGamma: drift,
      stateNorm: norm(next.latent), reflexNorm: norm(reflex.latent), deltaPsi: norm(sub(next.latent, psi.latent)),
      omegaAmp: omega.amp, omegaActive: omega.active ? 1 : 0, omegaRaised: omega.raisedBecauseStuck ? 1 : 0,""",
    )
    replace(
        "src/engine.ts",
        "  let psi = initPsi(\"ψ\", ctx.seed, ctx.config.D);\n  const frames: PsiMetaFrame[] = [];",
        "  let psi = initPsi(\"ψ\", ctx.seed, ctx.config.D);\n  warmStartSelfModel(psi, ctx);\n  const frames: PsiMetaFrame[] = [];",
    )

    replace(
        "apps/simulator/src/session.ts",
        "  initPsi,\n  xiStep,",
        "  initPsi,\n  warmStartSelfModel,\n  xiStep,",
    )
    replace(
        "apps/simulator/src/session.ts",
        "    this.psi = initPsi(this.psiId, this.ctx.seed, this.ctx.config.D);\n    this.hashes = [hashPsi(this.psi)];",
        "    this.psi = initPsi(this.psiId, this.ctx.seed, this.ctx.config.D);\n    warmStartSelfModel(this.psi, this.ctx);\n    this.hashes = [hashPsi(this.psi)];",
    )
    replace(
        "apps/simulator/src/session.ts",
        "    this.psi = initPsi(this.psiId, this.ctx.seed, this.ctx.config.D);\n    this.pulseQueued = false;",
        "    this.psi = initPsi(this.psiId, this.ctx.seed, this.ctx.config.D);\n    warmStartSelfModel(this.psi, this.ctx);\n    this.pulseQueued = false;",
    )

    replace(
        "apps/simulator/src/visualizer.ts",
        "const LATENT_LIMIT = 2;",
        """const LATENT_LIMIT = 2;
const RADAR_INNER_RADIUS = 0.16;
const RADAR_SPAN = 0.8;
export const ZERO_BASELINE_RADIUS = RADAR_INNER_RADIUS + RADAR_SPAN / 2;

export function radarRadius(value: number): number {
  return RADAR_INNER_RADIUS
    + RADAR_SPAN * ((clamp(value, -LATENT_LIMIT, LATENT_LIMIT) + LATENT_LIMIT) / (2 * LATENT_LIMIT));
}""",
    )
    replace(
        "apps/simulator/src/visualizer.ts",
        "    const normalized = 0.16 + 0.8 * ((clamp(value, -LATENT_LIMIT, LATENT_LIMIT) + LATENT_LIMIT) / (2 * LATENT_LIMIT));",
        "    const normalized = radarRadius(value);",
    )
    replace(
        "apps/simulator/src/visualizer.ts",
        """    for (const trailVector of state.trail.slice(-28)) {
      const point = projectVector(trailVector, radius);""",
        """    // Signed radar geometry places zero at mid-radius. Draw that baseline
    // explicitly so contraction toward zero cannot masquerade as a new attractor.
    const zeroBaseline = radarPoints(Array.from({ length: axisCount }, () => 0), radius);
    polygon(ctx, zeroBaseline);
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = \"rgba(196, 218, 222, 0.30)\";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = \"9px ui-monospace, SFMono-Regular, Menlo, monospace\";
    ctx.textAlign = \"left\";
    ctx.fillStyle = \"rgba(196, 218, 222, 0.52)\";
    ctx.fillText(\"0 baseline\", radius * ZERO_BASELINE_RADIUS + 6, -7);
    ctx.textAlign = \"center\";

    for (const trailVector of state.trail.slice(-28)) {
      const point = projectVector(trailVector, radius);""",
    )

    replace(
        "tests/determinism.ts",
        """function vecClose(a: number[], b: number[], eps = 1e-9): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < eps);
}""",
        """function vecClose(a: number[], b: number[], eps = 1e-9): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < eps);
}

function vecNorm(a: number[]): number {
  return Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
}""",
    )
    replace(
        "tests/determinism.ts",
        """// --- Default periodic trajectory pin (Realization A) ---
assert(A.events.length === 0, \"default periodic 0x51e1d produces zero collapses\");""",
        """// --- Default periodic trajectory pin (Realization A) ---
assert(A.events.length === 1, \"warm-started periodic 0x51e1d produces one collapse\");

// --- Cold-start continuity ---
const initial = run(0, \"0x51e1d\");
assert(vecClose(initial.ctx.selfModel, initial.psi.latent), \"run warm-starts selfModel from ψ₀\");
const first = run(1, \"0x51e1d\");
const firstRatio = vecNorm(first.psi.latent) / vecNorm(initial.psi.latent);
assert(firstRatio > 0.8, `first tick must preserve state scale, got ratio ${firstRatio}`);
assert(first.frames[0]?.reflexConf === 1, \"first reflexive projection begins at ψ₀\");
assert(Math.abs((first.frames[0]?.scalars.stateNorm ?? NaN) - vecNorm(first.psi.latent)) < 1e-12, \"stateNorm telemetry matches ψ₁\");
assert(Number.isFinite(first.frames[0]?.scalars.reflexNorm), \"reflexNorm telemetry finite\");
assert(Number.isFinite(first.frames[0]?.scalars.deltaPsi), \"deltaPsi telemetry finite\");""",
    )

    replace(
        "apps/simulator/tests/session.ts",
        """function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}""",
        """function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function vecNorm(values: number[]): number {
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}""",
    )
    replace(
        "apps/simulator/tests/session.ts",
        "test(\"same seed and schedule replay exactly\", () => {",
        """test(\"reflexive state warm-starts from ψ₀ without a zero-prior implosion\", () => {
  const session = createSession({ seed: \"0x51e1d\", config: { stimulus: \"periodic\" } });
  const initial = session.snapshot();
  deepEqual(initial.selfModel, initial.psi.latent, \"initial selfModel equals ψ₀\");
  const initialNorm = vecNorm(initial.psi.latent);

  const first = session.step();
  const firstNorm = vecNorm(first.psi.latent);
  assert(firstNorm / initialNorm > 0.8, `first tick preserves state scale: ${firstNorm / initialNorm}`);
  equal(first.frame.reflexConf, 1, \"first reflexive confidence\");
  assert(Math.abs(first.frame.scalars.stateNorm - firstNorm) < 1e-12, \"stateNorm telemetry\");
  assert(Number.isFinite(first.frame.scalars.reflexNorm), \"reflexNorm telemetry\");
  assert(Number.isFinite(first.frame.scalars.deltaPsi), \"deltaPsi telemetry\");

  session.reset({ playing: false });
  const reset = session.snapshot();
  deepEqual(reset.selfModel, reset.psi.latent, \"reset warm-starts selfModel\");
});

test(\"same seed and schedule replay exactly\", () => {""",
    )

    replace(
        "apps/simulator/tests/probe.ts",
        "} from \"../src/probe-runtime.ts\";",
        "} from \"../src/probe-runtime.ts\";\nimport { ZERO_BASELINE_RADIUS, radarRadius } from \"../src/visualizer.ts\";",
    )
    replace(
        "apps/simulator/tests/probe.ts",
        "test(\"64-tick reference matches the root Realization A pin\", () => {",
        """test(\"signed radar exposes its zero baseline\", () => {
  equal(ZERO_BASELINE_RADIUS, 0.56, \"zero baseline radius\");
  equal(radarRadius(0), ZERO_BASELINE_RADIUS, \"zero maps to the declared baseline\");
  assert(radarRadius(-1) < ZERO_BASELINE_RADIUS, \"negative components render inward\");
  assert(radarRadius(1) > ZERO_BASELINE_RADIUS, \"positive components render outward\");
});

test(\"64-tick reference matches the root Realization A pin\", () => {""",
    )

    replace(
        "apps/simulator/REALIZATION.md",
        """The compact probe additionally presents a chained FNV trace digest over the
post-tick ψ hashes. This digest is a local UI/parity helper, not a QOFT operator,
canonical field, or cryptographic authenticity claim. Its 64-tick default
fixture must terminate at the root-engine pin `3ad463b1`.""",
        """The compact probe additionally presents a chained FNV trace digest over the
post-tick ψ hashes. This digest is a local UI/parity helper, not a QOFT operator,
canonical field, or cryptographic authenticity claim. Its 64-tick default
fixture must terminate at the current root-engine pin recorded in
`probe-runtime.ts`.""",
    )
    replace(
        "apps/simulator/REALIZATION.md",
        """```text
selfModel ← (1 − β)·selfModel + β·ψ.latent
β = 0.1""",
        """```text
selfModel₀ := ψ₀.latent
selfModel ← (1 − β)·selfModel + β·ψ.latent
β = 0.1""",
    )
    replace(
        "apps/simulator/REALIZATION.md",
        """Changing τ, Γ scale, Ωµ amplitude, or an ablation starts a new run. Playback
speed is presentation-only and does not start a new run.""",
        """Changing τ, Γ scale, Ωµ amplitude, or an ablation starts a new run. Playback
speed is presentation-only and does not start a new run.

At creation and reset, this realization initializes the lagged `selfModel` cache
from `ψ₀` before the first Πᴽ update. This is a runtime initial-condition policy,
not a canonical redefinition. It prevents an absent prior observation from being
encoded as a zero vector and erasing most of the seeded state on tick one.

The radar is signed: zero lies at `0.56R`, negative components render inward,
and positive components render outward. The canvas draws and labels that zero
polygon explicitly so a near-zero state cannot be mistaken for sudden geometric
organization.""",
    )

    replace(
        "apps/simulator/README.md",
        """Configuration and ablation edits start a fresh fixed-config run so exports stay
replayable. Runs stop at 16,384 ticks, while ordinary rendering reads only the
most recent 256 frames.""",
        """Configuration and ablation edits start a fresh fixed-config run so exports stay
replayable. Session creation and reset warm-start the lagged self-model from ψ₀,
so the first tick evolves the seeded shape instead of contracting toward an
implicit zero prior. The signed radar marks its `0.56R` zero baseline; negative
components render inward and positive components outward.

Runs stop at 16,384 ticks, while ordinary rendering reads only the
most recent 256 frames.""",
    )

    replace(
        "CHANGELOG.md",
        """- added a pinned 64-tick reference, probe-local trace digest, direct
  session-versus-`xiStep` parity coverage, and fail-closed trace export.""",
        """- added a pinned 64-tick reference, probe-local trace digest, direct
  session-versus-`xiStep` parity coverage, and fail-closed trace export;
- warm-started the realization-local reflexive cache from ψ₀, exposed state,
  reflexive, and Δψ norms in telemetry, and marked the signed radar's `0.56R`
  zero baseline so near-zero contraction is not rendered as spontaneous order.""",
    )


def recompute_pins() -> None:
    default = node_json(
        """
import { run } from "./src/engine.ts";
const result = run(64, "0x51e1d");
console.log(JSON.stringify({ hash: result.hashes.at(-1), events: result.events.length }));
"""
    )
    mixed = node_json(
        """
import { createSession } from "./apps/simulator/src/session.ts";
const runId = "probe-parity-v1";
const psiId = "ψ";
const seed = "probe-parity-v1";
const config = {
  stimulus: "periodic",
  tau: 0.68,
  dwell: 2,
  hold: 6,
  hysteresis: 0.08,
  summarizeEvery: 4,
  meshCap: 16,
  omegaAmp: 0.055,
};
const pulseSteps = new Set([12, 37]);
const persistentAt = (step) => {
  if (step < 10) return "periodic";
  if (step < 20) return "align";
  if (step < 30) return "disrupt";
  if (step < 40) return "quiet";
  if (step < 55) return "basin";
  return "periodic";
};
const session = createSession({ runId, psiId, seed, config });
for (let step = 0; step < 64; step += 1) {
  const persistent = persistentAt(step);
  session.setFluxMode(persistent);
  if (pulseSteps.has(step)) session.queuePulse();
  session.step();
}
const data = session.exportData();
console.log(JSON.stringify({ hash: data.psiHash, events: data.eventHistory.total, mesh: data.mesh.length }));
"""
    )
    engine_blob = subprocess.run(
        ["git", "hash-object", "src/engine.ts"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    ).stdout.strip()

    expected_default = {"hash": "fbc08652", "events": 1}
    expected_mixed = {"hash": "0132b0a2", "events": 7, "mesh": 15}
    if default != expected_default:
        raise SystemExit(f"unexpected default fixture: {default}")
    if mixed != expected_mixed:
        raise SystemExit(f"unexpected mixed fixture: {mixed}")

    replace(
        "apps/simulator/src/probe-runtime.ts",
        'expectedFinalHash: "3ad463b1"',
        f'expectedFinalHash: "{default["hash"]}"',
    )
    replace(
        "apps/simulator/tests/probe.ts",
        'equal(first.data.eventHistory.total, 0, "default reference collapse count");',
        f'equal(first.data.eventHistory.total, {default["events"]}, "default reference collapse count");',
    )
    replace(
        "apps/simulator/tests/probe.ts",
        'equal(data.psiHash, "322442ef", "mixed-schedule terminal pin");',
        f'equal(data.psiHash, "{mixed["hash"]}", "mixed-schedule terminal pin");',
    )
    replace(
        "apps/simulator/tests/probe.ts",
        'equal(data.eventHistory.total, 6, "mixed-schedule collapse count");',
        f'equal(data.eventHistory.total, {mixed["events"]}, "mixed-schedule collapse count");',
    )

    old_blob = "4836eae32544d2b021f39151830d76e489a727e6"
    for path in (
        "apps/simulator/src/session.ts",
        "apps/simulator/tests/session.ts",
        "apps/simulator/tests/probe.ts",
    ):
        replace(path, old_blob, engine_blob)

    print(f"default fixture: {json.dumps(default, sort_keys=True)}")
    print(f"mixed fixture:   {json.dumps(mixed, sort_keys=True)}")
    print(f"engine blob:     {engine_blob}")


def main() -> None:
    os.chdir(ROOT)
    apply_source_patch()
    recompute_pins()


if __name__ == "__main__":
    main()
