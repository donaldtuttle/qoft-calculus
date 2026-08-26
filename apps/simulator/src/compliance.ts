/**
 * Browser-safe structural and deterministic replay checks for exported sessions.
 *
 * These checks validate the Public Typed Realization A trace contract. They do
 * not establish a physical claim or promote the DEVELOP Kernel v1.1 profile.
 */

import {
  hashPsi,
  initCtx,
  type CollapseEvent,
  type PsiMetaFrame,
} from "../../../src/engine.ts";
import {
  createSession,
  PERSISTENT_STIMULI,
  SESSION_CLAIM_BOUNDARY,
  SESSION_PROVENANCE,
  SESSION_REALIZATION,
  SESSION_SCHEMA_VERSION,
  type SessionExport,
} from "./session.ts";

export type ComplianceCheck = {
  id: string;
  name: string;
  status: "pass" | "fail" | "not-tested";
  pass: boolean;
  passed: boolean;
  detail: string;
};

export type ComplianceReport = {
  pass: boolean;
  compliant: boolean;
  checks: ComplianceCheck[];
  failures: ComplianceCheck[];
};

const STIMULI = new Set<string>([...PERSISTENT_STIMULI, "pulse"]);
const REQUIRED_SCALARS = ["mix", "gate", "dGamma", "omegaAmp", "omegaActive", "omegaRaised"];
const ENGINE_CONFIG_KEYS = [
  "D",
  "reflexRate",
  "gammaScale",
  "tau",
  "dwell",
  "hold",
  "hysteresis",
  "summarizeEvery",
  "meshCap",
  "omegaAmp",
  "stimulus",
  "ablations",
].sort();
const ABLATION_CONFIG_KEYS = ["collapse", "memory", "omega", "summarize"];
const CHECK_NAMES: Record<string, string> = {
  identity: "Realization identity",
  seed: "Deterministic seed",
  config: "Engine configuration",
  "state-vectors": "R¹² state vectors",
  "trace-cardinality": "One frame per tick",
  "trace-order": "Ψmeta trace order",
  telemetry: "Operator telemetry",
  "pulse-schedule": "One-shot pulse schedule",
  "collapse-alignment": "Collapse alignment",
  "event-history": "Event history integrity",
  "hash-chain": "Diagnostic state hashes",
  "latest-frame": "Latest engine state",
  mesh: "Σ◯ mesh integrity",
  "replay-consistency": "Full deterministic replay",
};

function sameNumbers(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function vectorNorm(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function isFiniteVector(vector: number[], dimension = 12): boolean {
  return vector.length === dimension && vector.every(Number.isFinite);
}

function isBoundedLatent(vector: number[]): boolean {
  return isFiniteVector(vector)
    && vector.every((value) => value >= -2 && value <= 2)
    && vectorNorm(vector) <= 2 + 1e-12;
}

function frameIsFinite(frame: PsiMetaFrame): boolean {
  return [
    frame.step,
    frame.phase,
    frame.rho,
    frame.phiEnergy,
    frame.gammaMag,
    frame.reflexConf,
    frame.entropy,
    frame.drift,
  ].every(Number.isFinite);
}

function eventIsIntegral(event: CollapseEvent): boolean {
  return Number.isInteger(event.step)
    && event.step >= 0
    && Number.isInteger(event.basinId)
    && event.basinId >= 0
    && event.basinId < 6
    && Number.isFinite(event.energyDrop)
    && event.energyDrop >= 0
    && Number.isFinite(event.rho)
    && event.rho >= 0
    && event.rho <= 1
    && event.preHash.length > 0
    && event.postHash.length > 0
    && event.preHash !== event.postHash
    && event.reason.startsWith("basin:");
}

export function evaluateSessionCompliance(data: SessionExport): ComplianceReport {
  const checks: ComplianceCheck[] = [];
  const add = (id: string, passed: boolean, detail: string): void => {
    checks.push({
      id,
      name: CHECK_NAMES[id] ?? id,
      status: passed ? "pass" : "fail",
      pass: passed,
      passed,
      detail,
    });
  };

  add(
    "identity",
    data.schemaVersion === SESSION_SCHEMA_VERSION
      && data.realization === SESSION_REALIZATION
      && data.claimBoundary === SESSION_CLAIM_BOUNDARY
      && typeof data.runId === "string"
      && data.runId.length >= 1
      && data.runId.length <= 128
      && typeof data.psiId === "string"
      && data.psiId.length >= 1
      && data.psiId.length <= 64
      && sameJson(data.provenance, SESSION_PROVENANCE),
    "Export identifies the session schema, Public Typed Realization A, source pins, and claim boundary.",
  );

  add(
    "seed",
    Number.isInteger(data.seed)
      && data.seed >= 0
      && data.seed <= 0xffffffff
      && ((typeof data.seedInput === "number" && Number.isFinite(data.seedInput))
        || (typeof data.seedInput === "string" && data.seedInput.length <= 128)),
    "The source seed is JSON-safe and the normalized deterministic seed is a uint32 value.",
  );

  let configValid = true;
  try {
    initCtx("compliance", data.seedInput, data.config);
  } catch {
    configValid = false;
  }
  const ablationsValid = sameJson(Object.keys(data.config.ablations).sort(), ABLATION_CONFIG_KEYS)
    && Object.values(data.config.ablations).every((value) => typeof value === "boolean");
  const configKeysValid = sameJson(Object.keys(data.config).sort(), ENGINE_CONFIG_KEYS);
  add(
    "config",
    configValid
      && configKeysValid
      && data.config.D === 12
      && ablationsValid
      && Number.isInteger(data.maxTicks)
      && data.maxTicks >= 1
      && data.maxTicks <= 16_384
      && PERSISTENT_STIMULI.includes(data.persistentStimulus)
      && data.config.stimulus === data.persistentStimulus,
    "Engine config is valid, R¹²-locked, bounded by maxTicks, and restored to a persistent non-pulse stimulus.",
  );

  const vectors = [
    data.psi.latent,
    data.selfModel,
    data.priorGamma,
    ...data.stateHistory.map((sample) => sample.latent),
    ...data.mesh.map((node) => node.latent),
  ];
  const stateHistoryOrdered = data.stateHistory.every((sample, index) => {
    const previous = data.stateHistory[index - 1];
    return Number.isInteger(sample.step)
      && sample.step >= 0
      && Number.isFinite(sample.rho)
      && sample.rho >= 0
      && sample.rho <= 1
      && (previous === undefined || sample.step === previous.step + 1);
  });
  add(
    "state-vectors",
    vectors.every((vector) => isFiniteVector(vector))
      && isBoundedLatent(data.psi.latent)
      && data.stateHistory.every((sample) => isBoundedLatent(sample.latent))
      && stateHistoryOrdered
      && data.stateHistory.length <= 256,
    "Current Ψ, self-model, Γ, state trail, and mesh vectors are finite R¹² values; Ψ samples are bounded.",
  );

  const frameCount = data.frames.length;
  add(
    "trace-cardinality",
    data.frameCount === frameCount
      && frameCount <= data.maxTicks
      && data.psi.t === frameCount
      && data.hashes.length === frameCount + 1
      && data.stimulusSchedule.length === frameCount
      && data.eventCounts.length === frameCount
      && sameJson(data.recentFrames, data.frames.slice(-256)),
    "There is exactly one Ψmeta frame, stimulus record, and event count per engine tick.",
  );

  const framesOrdered = data.frames.every((frame, index) => {
    const phaseTag = `phase:${frame.phase}`;
    return frame.step === index
      && frame.phase === index % 8
      && frame.runId === data.runId
      && frame.tags.includes("tick")
      && frame.tags.includes(phaseTag)
      && frame.tags.filter((tag) => tag.startsWith("phase:")).length === 1
      && frameIsFinite(frame)
      && frame.rho >= 0
      && frame.rho <= 1
      && typeof frame.stable === "boolean"
      && typeof frame.collapseTriggered === "boolean";
  });
  add(
    "trace-order",
    framesOrdered,
    "Ψmeta frames have ordered steps, modulo-eight phases, required tags, and finite diagnostics.",
  );

  const telemetryComplete = data.frames.every((frame) => REQUIRED_SCALARS.every(
    (name) => Object.hasOwn(frame.scalars, name) && Number.isFinite(frame.scalars[name]),
  ));
  add(
    "telemetry",
    telemetryComplete,
    "Every frame logs fusion, Γ drift, and Ωµ telemetry required by this realization.",
  );

  const schedulesValid = data.stimulusSchedule.every((stimulus) => STIMULI.has(stimulus));
  const scheduledPulseSteps = data.stimulusSchedule
    .map((stimulus, index) => stimulus === "pulse" ? index : -1)
    .filter((index) => index >= 0);
  add(
    "pulse-schedule",
    schedulesValid
      && sameNumbers(data.pulseSteps, scheduledPulseSteps)
      && data.pulseCount === data.pulseSteps.length
      && new Set(data.pulseSteps).size === data.pulseSteps.length,
    "Each queued one-shot pulse occupies exactly one recorded tick and persistent mode is tracked separately.",
  );

  const eventCountsValid = data.eventCounts.every((count) => Number.isInteger(count) && count >= 0 && count <= 1);
  const eventsAligned = data.frames.every((frame, index) => {
    const collapsed = (data.eventCounts[index] ?? 0) === 1;
    return frame.collapseTriggered === collapsed && frame.tags.includes("collapse") === collapsed;
  });
  const collapseSteps = data.eventCounts
    .map((count, index) => count === 1 ? index : -1)
    .filter((index) => index >= 0);
  add(
    "collapse-alignment",
    eventCountsValid
      && eventsAligned
      && data.eventHistory.total === data.eventCounts.reduce((sum, count) => sum + count, 0),
    "CollapseEvent counts, collapseTriggered, and collapse tags align one-to-one by tick.",
  );

  const history = data.eventHistory;
  const expectedHistorySteps = collapseSteps.slice(-history.limit);
  const actualHistorySteps = history.events.map((event) => event.step);
  const historyValid = Number.isInteger(history.limit)
    && history.limit >= 1
    && history.events.length === Math.min(history.limit, history.total)
    && history.truncated === (history.total > history.events.length)
    && sameNumbers(actualHistorySteps, expectedHistorySteps)
    && history.events.every((event) => eventIsIntegral(event)
      && event.postHash === data.hashes[event.step + 1]);
  add(
    "event-history",
    historyValid,
    "Retained collapse history is ordered, capped, and linked to the diagnostic post-state hash for each event tick.",
  );

  const hashesValid = data.hashes.every((value) => /^[0-9a-f]{8}$/.test(value))
    && data.hashes.at(-1) === data.psiHash
    && hashPsi(data.psi) === data.psiHash;
  add(
    "hash-chain",
    hashesValid,
    "The non-cryptographic diagnostic hash sequence terminates at the hash of the exported current Ψ state.",
  );

  const latest = data.frames.at(-1);
  const latestMatches = latest === undefined
    ? data.latestFrame === null
    : data.latestFrame !== null
      && JSON.stringify(latest) === JSON.stringify(data.latestFrame);
  add(
    "latest-frame",
    latestMatches
      && (latest === undefined
        ? vectorNorm(data.priorGamma) === 0
        : Math.abs(vectorNorm(data.priorGamma) - latest.gammaMag) <= 1e-12)
      && (data.stateHistory.length === 0
        ? frameCount === 0
        : data.stateHistory.at(-1)?.step === frameCount - 1),
    "The snapshot latestFrame, actual Γ vector, and state trail terminate at the final engine tick.",
  );

  const meshIds = data.mesh.map((node) => node.id);
  add(
    "mesh",
    data.mesh.length <= data.config.meshCap
      && meshIds.every((id) => Number.isInteger(id) && id >= 0)
      && new Set(meshIds).size === meshIds.length
      && data.mesh.every((node) => Number.isFinite(node.rho) && node.rho >= 0 && node.rho <= 1),
    "Σ◯ mesh capacity, IDs, and coherence values are internally consistent.",
  );

  let replayMatches = false;
  try {
    replayMatches = sameJson(replaySessionExport(data), data);
  } catch {
    replayMatches = false;
  }
  add(
    "replay-consistency",
    replayMatches,
    "Seed, fixed configuration, per-tick stimulus schedule, frames, events, memory, and every diagnostic hash reproduce exactly.",
  );

  const failures = checks.filter((check) => check.status === "fail");
  const compliant = failures.length === 0;
  return { pass: compliant, compliant, checks, failures };
}

export function assertSessionCompliance(data: SessionExport): ComplianceReport {
  const report = evaluateSessionCompliance(data);
  if (!report.compliant) {
    const ids = report.failures.map((failure) => failure.id).join(", ");
    throw new Error(`Session export failed compliance checks: ${ids}`);
  }
  return report;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function replaySessionExport(data: SessionExport): SessionExport {
  const replay = createSession({
    runId: data.runId,
    psiId: data.psiId,
    seed: data.seedInput,
    config: data.config,
    eventHistoryLimit: data.eventHistory.limit,
    maxTicks: data.maxTicks,
  });

  for (const stimulus of data.stimulusSchedule) {
    if (stimulus === "pulse") replay.queuePulse();
    else replay.setFluxMode(stimulus);
    replay.step();
  }

  replay.setFluxMode(data.persistentStimulus);
  if (data.pulsePending) replay.queuePulse();
  if (data.playing) replay.play();
  else replay.pause();
  return replay.exportData();
}

/**
 * Rerun deterministic implementation checks in either Node or the browser.
 * This is a software-conformance check for Realization A, not a scientific
 * validation of QOFT.
 */
export function runImplementationVerification(current: SessionExport): ComplianceReport {
  const checks: ComplianceCheck[] = [];
  const add = (id: string, name: string, outcome: boolean | "not-tested", detail: string): void => {
    const status = outcome === "not-tested" ? outcome : outcome ? "pass" : "fail";
    const passed = status === "pass";
    checks.push({ id, name, status, pass: passed, passed, detail });
  };

  const structural = evaluateSessionCompliance(current);
  add(
    "current-export",
    "Current export replay",
    structural.compliant,
    structural.compliant
      ? `${structural.checks.length} structural and replay checks passed for the current session.`
      : `Failed: ${structural.failures.map((failure) => failure.id).join(", ")}.`,
  );

  const deterministicOptions = {
    seed: "0x51e1d",
    config: { stimulus: "disrupt" as const, tau: 0.72, summarizeEvery: 4, omegaAmp: 0.08 },
  };
  const deterministicA = createSession(deterministicOptions);
  const deterministicB = createSession(deterministicOptions);
  deterministicA.stepMany(128);
  deterministicB.stepMany(128);
  const da = deterministicA.exportData();
  const db = deterministicB.exportData();
  const deterministic = sameJson(da.hashes, db.hashes)
    && sameJson(da.frames, db.frames)
    && sameJson(da.eventCounts, db.eventCounts);
  add(
    "determinism",
    "Same-seed determinism",
    deterministic,
    deterministic
      ? `128 ticks matched hash-for-hash; final ${da.psiHash}.`
      : "Equal seed, config, and schedule produced unequal traces.",
  );

  const differentSeed = createSession({ ...deterministicOptions, seed: "0xdead" });
  differentSeed.stepMany(128);
  const diverges = differentSeed.exportData().hashes.some((hash, index) => hash !== da.hashes[index]);
  add(
    "seed-divergence",
    "Different-seed divergence",
    diverges,
    diverges ? "A changed seed altered the trajectory." : "The changed seed did not alter any tested hash.",
  );

  const pulseExercise = () => {
    const session = createSession({ seed: "pulse-check", config: { stimulus: "align" } });
    session.stepMany(2);
    session.queuePulse();
    session.step();
    session.step();
    session.queuePulse();
    session.stepMany(3);
    return session.exportData();
  };
  const pa = pulseExercise();
  const pb = pulseExercise();
  const pulsePass = sameJson(pa.hashes, pb.hashes)
    && sameJson(pa.stimulusSchedule, ["align", "align", "pulse", "align", "pulse", "align", "align"])
    && sameJson(pa.pulseSteps, [2, 4]);
  add(
    "pulse-replay",
    "One-shot Φ replay",
    pulsePass,
    pulsePass ? "Two queued pulses occupied exactly ticks 2 and 4 and replayed identically." : "Pulse timing or replay diverged.",
  );

  const collapse = createSession({
    seed: "collapse-check",
    config: { stimulus: "basin", tau: 0, dwell: 1, hold: 0, hysteresis: 0, omegaAmp: 0 },
  });
  collapse.stepMany(16);
  const ce = collapse.exportData();
  const collapsePass = ce.eventHistory.total === 16
    && ce.frames.every((frame) => frame.collapseTriggered && frame.tags.includes("collapse"))
    && ce.eventHistory.events.every((event) => event.preHash !== event.postHash);
  add(
    "collapse-integrity",
    "Λψ event integrity",
    collapsePass,
    collapsePass ? "Forced reachability produced one valid pre/post-hash event per tick." : "Forced collapse did not align with frames and events.",
  );

  const ablated = createSession({
    seed: "ablation-check",
    config: {
      stimulus: "basin",
      tau: 0,
      dwell: 1,
      hold: 0,
      summarizeEvery: 2,
      omegaAmp: 0.2,
      ablations: { collapse: false, memory: false, summarize: false, omega: false },
    },
  });
  ablated.stepMany(20);
  const ae = ablated.exportData();
  const ablationPass = ae.eventHistory.total === 0
    && ae.mesh.length === 0
    && ae.frames.every((frame) => frame.scalars.omegaActive === 0 && !frame.tags.includes("omega"));
  add(
    "ablations",
    "Ablation silence checks",
    ablationPass,
    ablationPass ? "Λψ, Σ◯, and Ωµ stayed silent while ablated; Θλ had no mesh to recall." : "At least one disabled path remained active.",
  );

  const memoryBase = {
    seed: "memory-check",
    config: {
      stimulus: "basin" as const,
      summarizeEvery: 2,
      omegaAmp: 0,
      ablations: { collapse: false, summarize: true, omega: false },
    },
  };
  const memoryOn = createSession({
    ...memoryBase,
    config: { ...memoryBase.config, ablations: { ...memoryBase.config.ablations, memory: true } },
  });
  const memoryOff = createSession({
    ...memoryBase,
    config: { ...memoryBase.config, ablations: { ...memoryBase.config.ablations, memory: false } },
  });
  memoryOn.stepMany(24);
  memoryOff.stepMany(24);
  const memoryA = memoryOn.exportData();
  const memoryB = memoryOff.exportData();
  const memoryActive = memoryA.mesh.length > 0
    && memoryB.mesh.length > 0
    && memoryA.hashes.some((hash, index) => hash !== memoryB.hashes[index]);
  add(
    "memory-ablation",
    "Θλ activation contrast",
    memoryActive ? true : "not-tested",
    memoryActive ? "Seed-matched runs diverged after mesh recall became available." : "Recall did not activate; classify this condition MECHANISM_NOT_TESTED.",
  );

  let invalidRejected = false;
  try {
    createSession({ config: { D: 13 } });
  } catch {
    invalidRejected = true;
  }
  add(
    "invalid-config",
    "R¹² configuration guard",
    invalidRejected,
    invalidRejected ? "D = 13 was rejected before execution." : "The engine accepted a non-R¹² configuration.",
  );

  const failures = checks.filter((check) => check.status === "fail");
  const compliant = failures.length === 0;
  return { pass: compliant, compliant, checks, failures };
}
