import {
  hashPsi,
  initCtx,
  initPsi,
  xiStep,
  type CollapseEvent,
  type EngineConfig,
  type PsiMetaFrame,
  type Stimulus,
} from "../../../src/engine.ts";
import { assertSessionCompliance } from "../src/compliance.ts";
import {
  PROBE_EMPTY_DIGEST,
  PROBE_REFERENCE_64,
  PROBE_RUNTIME,
  appendProbeDigest,
  createProbeSession,
  digestProbeExport,
  probeHoldTicks,
  runProbeReference64,
} from "../src/probe-runtime.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function deepEqual(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message}: ${a} !== ${b}`);
}

function throws(fn: () => unknown, message: string): void {
  let didThrow = false;
  try { fn(); } catch { didThrow = true; }
  assert(didThrow, message);
}

function test(name: string, fn: () => void): void {
  fn();
  console.log(`ok - ${name}`);
}

test("compact probe declares the real engine seam and no fallback", () => {
  equal(PROBE_RUNTIME.realization, "Public Typed Realization A (R¹²)", "realization identity");
  equal(PROBE_RUNTIME.transitionPath, "QosmosSession.step/tick → xiStep", "transition path");
  equal(PROBE_RUNTIME.fallback, false, "fallback disabled");
  equal(PROBE_RUNTIME.engineGitBlob, "4836eae32544d2b021f39151830d76e489a727e6", "engine pin");
});

test("64-tick reference matches the root Realization A pin", () => {
  const first = runProbeReference64();
  const second = runProbeReference64();
  equal(first.data.psiHash, PROBE_REFERENCE_64.expectedFinalHash, "reference terminal hash");
  equal(first.data.frameCount, 64, "reference frame count");
  equal(first.data.eventHistory.total, 0, "default reference collapse count");
  equal(first.matchesPin, true, "reference pin status");
  deepEqual(first.data.hashes, second.data.hashes, "reference hash replay");
  equal(first.digest, second.digest, "reference digest replay");
  equal(first.digest, digestProbeExport(first.data), "reference export digest");
  assertSessionCompliance(first.data);
});

test("probe session matches direct xiStep over a mixed 64-tick schedule", () => {
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
  } satisfies Partial<EngineConfig>;
  const pulseSteps = new Set([12, 37]);
  const persistentAt = (step: number): Exclude<Stimulus, "pulse"> => {
    if (step < 10) return "periodic";
    if (step < 20) return "align";
    if (step < 30) return "disrupt";
    if (step < 40) return "quiet";
    if (step < 55) return "basin";
    return "periodic";
  };

  const probe = createProbeSession({ runId, psiId, seed, config });
  const directCtx = initCtx(runId, seed, config);
  let directPsi = initPsi(psiId, directCtx.seed, directCtx.config.D);
  const directHashes = [hashPsi(directPsi)];
  const directFrames: PsiMetaFrame[] = [];
  const directEvents: CollapseEvent[] = [];
  const directEventCounts: number[] = [];

  for (let step = 0; step < 64; step += 1) {
    const persistent = persistentAt(step);
    const stimulus: Stimulus = pulseSteps.has(step) ? "pulse" : persistent;

    probe.setFluxMode(persistent);
    if (stimulus === "pulse") probe.queuePulse();
    probe.step();

    directCtx.config.stimulus = stimulus;
    const output = xiStep(directPsi, directCtx);
    directPsi = output.psi_next;
    directHashes.push(hashPsi(directPsi));
    directFrames.push(output.frame);
    directEvents.push(...output.events);
    directEventCounts.push(output.events.length);
  }
  directCtx.config.stimulus = persistentAt(63);

  const data = probe.exportData();
  deepEqual(data.hashes, directHashes, "direct/session hashes");
  deepEqual(data.frames, directFrames, "direct/session frames");
  deepEqual(data.eventCounts, directEventCounts, "direct/session event counts");
  deepEqual(data.eventHistory.events, directEvents, "direct/session collapse events");
  deepEqual(data.psi, directPsi, "direct/session final psi");
  deepEqual(data.selfModel, directCtx.selfModel, "direct/session self-model");
  deepEqual(data.priorGamma, directCtx.priorGamma, "direct/session Gamma");
  deepEqual(data.stateHistory, directCtx.stateHistory, "direct/session state history");
  deepEqual(data.mesh, directCtx.mesh, "direct/session mesh");
  deepEqual(data.pulseSteps, [12, 37], "mixed-schedule pulse ticks");
  equal(data.psiHash, "322442ef", "mixed-schedule terminal pin");
  equal(data.eventHistory.total, 6, "mixed-schedule collapse count");
  equal(data.mesh.length, 15, "mixed-schedule mesh count");
  assertSessionCompliance(data);
});

test("probe digest and user-facing hold countdown are deterministic", () => {
  const session = createProbeSession({
    seed: "probe-hold",
    config: { stimulus: "basin", tau: 0, dwell: 1, hold: 6, hysteresis: 0, omegaAmp: 0 },
  });
  let digest = PROBE_EMPTY_DIGEST as string;
  const collapsed = session.step();
  digest = appendProbeDigest(digest, collapsed.psiHash);
  equal(collapsed.events.length, 1, "forced initial collapse");
  equal(probeHoldTicks(session.snapshot()), 6, "six full post-collapse ticks remain");

  for (let index = 0; index < 6; index += 1) {
    const step = session.step();
    digest = appendProbeDigest(digest, step.psiHash);
  }
  equal(probeHoldTicks(session.snapshot()), 0, "hold countdown expires after six ticks");
  equal(digest, digestProbeExport(session.exportData()), "incremental/export digest parity");
  throws(() => appendProbeDigest("invalid", collapsed.psiHash), "invalid previous digest rejected");
  throws(() => appendProbeDigest(PROBE_EMPTY_DIGEST, "DEADBEEF"), "non-lowercase psi hash rejected");
});

console.log("compact probe tests complete");
