/**
 * DOM-free session adapter for Public Typed Realization A (R¹²).
 *
 * This file adds scheduling and serialization around the frozen engine. It does
 * not define QOFT operators. Every actual state transition is delegated to
 * xiStep, preserving the root SKILL.md v1.0 tick contract.
 */

import {
  DEFAULT_CONFIG,
  hashPsi,
  initCtx,
  initPsi,
  warmStartSelfModel,
  xiStep,
  type Ablations,
  type CollapseEvent,
  type Ctx,
  type EngineConfig,
  type MeshNode,
  type Psi,
  type PsiMetaFrame,
  type Stimulus,
} from "../../../src/engine.ts";

export const SESSION_SCHEMA_VERSION = "qoft-simulator-session/v1" as const;
export const SESSION_REALIZATION = "Public Typed Realization A (R¹²)" as const;
export const SESSION_CLAIM_BOUNDARY = "Operational R¹² software realization only; no physical, quantum, neural, consciousness, or universal-observer claim." as const;
export const SESSION_PROVENANCE = {
  enginePath: "src/engine.ts",
  engineGitBlob: "e492c1d51ff5f8bf4ee1b7a4ff5a1135440ce6d5",
  rootSkillPath: "SKILL.md",
  rootSkillGitBlob: "8281e74ed18f121246833012cccbc2f052d13e98",
  stampedGenealogySha256: "6cf7ec4cbed5d3da747d80bfb4c60ea8e7466475b7b9cc003dabe7e06c9d6ea0",
} as const;
Object.freeze(SESSION_PROVENANCE);
export const PERSISTENT_STIMULI = Object.freeze(["quiet", "align", "disrupt", "periodic", "basin"] as const);

export type PersistentStimulus = (typeof PERSISTENT_STIMULI)[number];
export type Seed = string | number;

export type EngineConfigInput = Partial<Omit<EngineConfig, "ablations">> & {
  ablations?: Partial<Ablations>;
};

export type LiveConfigPatch = Partial<Pick<
  EngineConfig,
  | "reflexRate"
  | "gammaScale"
  | "tau"
  | "dwell"
  | "hold"
  | "hysteresis"
  | "summarizeEvery"
  | "meshCap"
  | "omegaAmp"
>>;

export type SessionOptions = {
  runId?: string;
  psiId?: string;
  seed?: Seed;
  config?: EngineConfigInput;
  eventHistoryLimit?: number;
  maxTicks?: number;
  playing?: boolean;
};

export type SessionResetOptions = {
  seed?: Seed;
  playing?: boolean;
};

export type SessionStep = {
  stimulus: Stimulus;
  pulse: boolean;
  psi: Psi;
  psiHash: string;
  frame: PsiMetaFrame;
  events: CollapseEvent[];
};

export type SessionEventHistory = {
  limit: number;
  total: number;
  truncated: boolean;
  events: CollapseEvent[];
};

export type SessionStateSample = {
  latent: number[];
  rho: number;
  step: number;
};

export type SessionSnapshot = {
  schemaVersion: typeof SESSION_SCHEMA_VERSION;
  realization: typeof SESSION_REALIZATION;
  runId: string;
  psiId: string;
  seedInput: Seed;
  seed: number;
  playing: boolean;
  maxTicks: number;
  pulsePending: boolean;
  persistentStimulus: PersistentStimulus;
  config: EngineConfig;
  psi: Psi;
  psiHash: string;
  latestFrame: PsiMetaFrame | null;
  recentFrames: PsiMetaFrame[];
  frameCount: number;
  pulseCount: number;
  selfModel: number[];
  priorGamma: number[];
  stateHistory: SessionStateSample[];
  mesh: MeshNode[];
  eventHistory: SessionEventHistory;
};

export type SessionExport = SessionSnapshot & {
  claimBoundary: typeof SESSION_CLAIM_BOUNDARY;
  provenance: typeof SESSION_PROVENANCE;
  frames: PsiMetaFrame[];
  hashes: string[];
  stimulusSchedule: Stimulus[];
  eventCounts: number[];
  pulseSteps: number[];
};

const DEFAULT_EVENT_HISTORY_LIMIT = 128;
const MAX_TICKS_LIMIT = 16_384;
const DEFAULT_MAX_TICKS = MAX_TICKS_LIMIT;
const RECENT_FRAME_LIMIT = 256;
const EXPORTED_STATE_HISTORY_LIMIT = 256;
const ABLATION_KEYS = ["collapse", "memory", "summarize", "omega"] as const;
const CONFIG_KEYS = [
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
] as const;
const LIVE_CONFIG_KEYS = [
  "reflexRate",
  "gammaScale",
  "tau",
  "dwell",
  "hold",
  "hysteresis",
  "summarizeEvery",
  "meshCap",
  "omegaAmp",
] as const;

function assertPersistentStimulus(value: unknown): asserts value is PersistentStimulus {
  if (!PERSISTENT_STIMULI.includes(value as PersistentStimulus)) {
    throw new Error(
      `Persistent stimulus must be one of ${PERSISTENT_STIMULI.join(", ")}; use queuePulse() for a one-tick pulse.`,
    );
  }
}

function assertEventHistoryLimit(value: number): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    throw new Error(`eventHistoryLimit must be an integer >= 1, got ${value}`);
  }
}

function assertMaxTicks(value: number): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1 || value > MAX_TICKS_LIMIT) {
    throw new Error(`maxTicks must be an integer in [1, ${MAX_TICKS_LIMIT}], got ${value}`);
  }
}

function assertSeed(value: Seed): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Numeric seed must be finite, got ${value}`);
    return;
  }
  if (value.length > 128) throw new Error("String seed must be at most 128 characters");
}

function assertIdentifier(name: string, value: string, maxLength: number): void {
  if (value.length < 1 || value.length > maxLength) {
    throw new Error(`${name} must contain 1 to ${maxLength} characters`);
  }
}

function cloneAblations(value: Ablations): Ablations {
  return { ...value };
}

function cloneConfig(value: EngineConfig): EngineConfig {
  return { ...value, ablations: cloneAblations(value.ablations) };
}

function clonePsi(value: Psi): Psi {
  return { ...value, latent: value.latent.slice() };
}

function cloneFrame(value: PsiMetaFrame): PsiMetaFrame {
  return { ...value, tags: value.tags.slice(), scalars: { ...value.scalars } };
}

function cloneEvent(value: CollapseEvent): CollapseEvent {
  return { ...value };
}

function cloneMeshNode(value: MeshNode): MeshNode {
  return { ...value, latent: value.latent.slice() };
}

function normalizeConfig(input: EngineConfigInput = {}): EngineConfig {
  const allowed = new Set<string>(CONFIG_KEYS);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new Error(`Unknown engine config key: ${key}`);
  }
  const persistentStimulus = input.stimulus ?? DEFAULT_CONFIG.stimulus;
  assertPersistentStimulus(persistentStimulus);
  validateAblationPatch(input.ablations ?? {});
  return {
    ...DEFAULT_CONFIG,
    ...input,
    stimulus: persistentStimulus,
    ablations: { ...DEFAULT_CONFIG.ablations, ...(input.ablations ?? {}) },
  };
}

function validateFullConfig(seed: Seed, config: EngineConfig): EngineConfig {
  // initCtx is the engine-owned validation boundary. The temporary context is
  // discarded; only its normalized, validated configuration is retained.
  return cloneConfig(initCtx("session-config-validation", seed, cloneConfig(config)).config);
}

function validateAblationPatch(patch: Partial<Ablations>): void {
  const allowed = new Set<string>(ABLATION_KEYS);
  for (const [key, value] of Object.entries(patch)) {
    if (!allowed.has(key)) throw new Error(`Unknown ablation: ${key}`);
    if (typeof value !== "boolean") throw new Error(`Ablation ${key} must be boolean`);
  }
}

function validateLiveConfigPatch(patch: LiveConfigPatch): void {
  const allowed = new Set<string>(LIVE_CONFIG_KEYS);
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) throw new Error(`Config ${key} is not live-editable`);
  }
}

export class QosmosSession {
  private readonly runId: string;
  private readonly psiId: string;
  private readonly eventHistoryLimit: number;
  private readonly maxTicks: number;
  private seedInput: Seed;
  private ctx: Ctx;
  private psi: Psi;
  private playingState: boolean;
  private pulseQueued = false;
  private persistentFlux: PersistentStimulus;
  private retainedEvents: CollapseEvent[] = [];
  private totalEvents = 0;
  private hashes: string[] = [];
  private stimulusSchedule: Stimulus[] = [];
  private eventCounts: number[] = [];
  private pulseSteps: number[] = [];

  constructor(options: SessionOptions = {}) {
    this.runId = options.runId ?? "qosmos-simulator";
    this.psiId = options.psiId ?? "ψ";
    this.seedInput = options.seed ?? "0x51e1d";
    this.eventHistoryLimit = options.eventHistoryLimit ?? DEFAULT_EVENT_HISTORY_LIMIT;
    this.maxTicks = options.maxTicks ?? DEFAULT_MAX_TICKS;
    this.playingState = options.playing ?? false;

    assertEventHistoryLimit(this.eventHistoryLimit);
    assertMaxTicks(this.maxTicks);
    assertSeed(this.seedInput);
    assertIdentifier("runId", this.runId, 128);
    assertIdentifier("psiId", this.psiId, 64);
    const config = normalizeConfig(options.config);
    this.persistentFlux = config.stimulus as PersistentStimulus;
    this.ctx = initCtx(this.runId, this.seedInput, config);
    this.psi = initPsi(this.psiId, this.ctx.seed, this.ctx.config.D);
    warmStartSelfModel(this.psi, this.ctx);
    this.hashes = [hashPsi(this.psi)];
  }

  play(): SessionSnapshot {
    this.playingState = this.ctx.trace.length < this.maxTicks;
    return this.snapshot();
  }

  pause(): SessionSnapshot {
    this.playingState = false;
    return this.snapshot();
  }

  togglePlaying(): SessionSnapshot {
    this.playingState = !this.playingState && this.ctx.trace.length < this.maxTicks;
    return this.snapshot();
  }

  /** Advance one tick only while the session is playing. */
  tick(): SessionStep | null {
    if (!this.playingState) return null;
    if (this.ctx.trace.length >= this.maxTicks) {
      this.playingState = false;
      return null;
    }
    return this.step();
  }

  /** Advance exactly one engine tick, even when paused. */
  step(): SessionStep {
    if (this.ctx.trace.length >= this.maxTicks) {
      this.playingState = false;
      throw new Error(`Session reached its ${this.maxTicks}-tick safety limit; export or reset before continuing.`);
    }
    const pulse = this.pulseQueued;
    const stimulus: Stimulus = pulse ? "pulse" : this.persistentFlux;

    this.ctx.config.stimulus = stimulus;
    let output: ReturnType<typeof xiStep>;
    try {
      output = xiStep(this.psi, this.ctx);
    } finally {
      // Pulse is a session-level one-shot schedule, never a persistent engine
      // configuration. Restoration also occurs if xiStep unexpectedly throws.
      this.ctx.config.stimulus = this.persistentFlux;
    }

    this.psi = output.psi_next;
    if (pulse) {
      this.pulseQueued = false;
      this.pulseSteps.push(output.frame.step);
    }

    const psiHash = hashPsi(this.psi);
    this.hashes.push(psiHash);
    this.stimulusSchedule.push(stimulus);
    this.eventCounts.push(output.events.length);
    this.totalEvents += output.events.length;
    this.retainedEvents.push(...output.events.map(cloneEvent));
    if (this.retainedEvents.length > this.eventHistoryLimit) {
      this.retainedEvents.splice(0, this.retainedEvents.length - this.eventHistoryLimit);
    }
    if (this.ctx.trace.length >= this.maxTicks) this.playingState = false;

    return {
      stimulus,
      pulse,
      psi: clonePsi(this.psi),
      psiHash,
      frame: cloneFrame(output.frame),
      events: output.events.map(cloneEvent),
    };
  }

  stepMany(count: number): SessionStep[] {
    if (!Number.isFinite(count) || !Number.isInteger(count) || count < 0) {
      throw new Error(`step count must be an integer >= 0, got ${count}`);
    }
    const remaining = this.maxTicks - this.ctx.trace.length;
    if (count > remaining) {
      throw new Error(`step count ${count} exceeds the ${remaining} ticks remaining in this session`);
    }
    return Array.from({ length: count }, () => this.step());
  }

  /** Coalesce clicks until the next actual tick, then apply pulse for one tick. */
  queuePulse(): SessionSnapshot {
    if (this.ctx.trace.length >= this.maxTicks) {
      throw new Error(`Session reached its ${this.maxTicks}-tick safety limit; reset before queuing another pulse.`);
    }
    this.pulseQueued = true;
    return this.snapshot();
  }

  setFluxMode(mode: PersistentStimulus): SessionSnapshot {
    assertPersistentStimulus(mode);
    this.persistentFlux = mode;
    this.ctx.config.stimulus = mode;
    return this.snapshot();
  }

  updateConfig(patch: LiveConfigPatch): SessionSnapshot {
    validateLiveConfigPatch(patch);
    const candidate: EngineConfig = {
      ...this.ctx.config,
      ...patch,
      stimulus: this.persistentFlux,
      ablations: cloneAblations(this.ctx.config.ablations),
    };
    const validated = validateFullConfig(this.seedInput, candidate);
    const mustRestart = this.ctx.trace.length > 0;
    this.ctx.config = validated;

    // The export format records one fixed configuration per run. If any tick
    // has committed, changing that configuration starts a fresh replayable run.
    return mustRestart ? this.reset() : this.snapshot();
  }

  setAblations(patch: Partial<Ablations>): SessionSnapshot {
    validateAblationPatch(patch);
    const candidate: EngineConfig = {
      ...this.ctx.config,
      stimulus: this.persistentFlux,
      ablations: { ...this.ctx.config.ablations, ...patch },
    };
    const mustRestart = this.ctx.trace.length > 0;
    this.ctx.config = validateFullConfig(this.seedInput, candidate);
    return mustRestart ? this.reset() : this.snapshot();
  }

  /**
   * Restart from the seed while preserving the current config and flux
   * mode. Pending pulse and all run-local history are cleared.
   */
  reset(options: SessionResetOptions = {}): SessionSnapshot {
    const config = cloneConfig(this.ctx.config);
    const nextSeed = options.seed ?? this.seedInput;
    assertSeed(nextSeed);
    this.seedInput = nextSeed;
    this.playingState = options.playing ?? this.playingState;
    config.stimulus = this.persistentFlux;

    this.ctx = initCtx(this.runId, this.seedInput, config);
    this.psi = initPsi(this.psiId, this.ctx.seed, this.ctx.config.D);
    warmStartSelfModel(this.psi, this.ctx);
    this.pulseQueued = false;
    this.retainedEvents = [];
    this.totalEvents = 0;
    this.hashes = [hashPsi(this.psi)];
    this.stimulusSchedule = [];
    this.eventCounts = [];
    this.pulseSteps = [];
    return this.snapshot();
  }

  snapshot(): SessionSnapshot {
    const latest = this.ctx.trace.at(-1);
    return {
      schemaVersion: SESSION_SCHEMA_VERSION,
      realization: SESSION_REALIZATION,
      runId: this.runId,
      psiId: this.psiId,
      seedInput: this.seedInput,
      seed: this.ctx.seed,
      playing: this.playingState,
      maxTicks: this.maxTicks,
      pulsePending: this.pulseQueued,
      persistentStimulus: this.persistentFlux,
      config: cloneConfig(this.ctx.config),
      psi: clonePsi(this.psi),
      psiHash: hashPsi(this.psi),
      latestFrame: latest ? cloneFrame(latest) : null,
      recentFrames: this.ctx.trace.slice(-RECENT_FRAME_LIMIT).map(cloneFrame),
      frameCount: this.ctx.trace.length,
      pulseCount: this.pulseSteps.length,
      selfModel: this.ctx.selfModel.slice(),
      priorGamma: this.ctx.priorGamma.slice(),
      stateHistory: this.ctx.stateHistory.slice(-EXPORTED_STATE_HISTORY_LIMIT).map((sample) => ({
        latent: sample.latent.slice(),
        rho: sample.rho,
        step: sample.step,
      })),
      mesh: this.ctx.mesh.map(cloneMeshNode),
      eventHistory: {
        limit: this.eventHistoryLimit,
        total: this.totalEvents,
        truncated: this.totalEvents > this.retainedEvents.length,
        events: this.retainedEvents.map(cloneEvent),
      },
    };
  }

  exportData(): SessionExport {
    return {
      ...this.snapshot(),
      claimBoundary: SESSION_CLAIM_BOUNDARY,
      provenance: { ...SESSION_PROVENANCE },
      frames: this.ctx.trace.map(cloneFrame),
      hashes: this.hashes.slice(),
      stimulusSchedule: this.stimulusSchedule.slice(),
      eventCounts: this.eventCounts.slice(),
      pulseSteps: this.pulseSteps.slice(),
    };
  }
}

export function createSession(options: SessionOptions = {}): QosmosSession {
  return new QosmosSession(options);
}
