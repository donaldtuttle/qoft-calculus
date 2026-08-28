/**
 * QOSMOS workbench v1 engine — INSTANTIATION, not canon law.
 * Closed operator set only. ⊕ and ∇Φ formulas are labeled proxies.
 * RNG: Mulberry32 from ctx.seed. Never Math.random in ticks.
 *
 * Public Typed Realization A (R¹²).
 * The live Glyphogenic Calculus workbench is a separate Typed Realization B.
 * They share SKILL.md contract but are not trajectory-equivalent under the same seed.
 */

export type Vec = number[];

export type Psi = {
  id: string;
  t: number;
  latent: Vec;
  coherence: number;
  fluxEnergy: number;
  basinId?: number;
};

export type PsiReflex = { latent: Vec; selfModel: Vec; confidence: number };
export type FluxSample = { fieldId: string; data: Vec; timestamp: number; energy: number };
export type Gamma = { vec: Vec; magnitude: number; basis: string };
export type Fusion = { psi: Psi; mix: number; gate: number; clamped: boolean };

export type OmegaMuResult = {
  amp: number;
  kind: string;
  active: boolean;
  raisedBecauseStuck: boolean;
  noise: Vec;
};

export type PsiMetaFrame = {
  runId: string;
  step: number;
  phase: number;
  rho: number;
  phiEnergy: number;
  gammaMag: number;
  reflexConf: number;
  entropy: number;
  drift: number;
  stable: boolean;
  collapseTriggered: boolean;
  tags: string[];
  scalars: Record<string, number>;
};

export type CollapseEvent = {
  step: number;
  reason: string;
  preHash: string;
  postHash: string;
  energyDrop: number;
  basinId: number;
  rho: number;
};

export type MeshNode = { id: number; latent: Vec; rho: number; step: number };
export type RecallPacket = { latent: Vec; similarity: number; nodeId: number };

export type Stimulus = "quiet" | "align" | "disrupt" | "pulse" | "periodic" | "basin";

export type Ablations = {
  collapse: boolean;
  memory: boolean;
  summarize: boolean;
  omega: boolean;
};

export type EngineConfig = {
  D: number;
  reflexRate: number;
  gammaScale: number;
  tau: number;
  dwell: number;
  hold: number;
  hysteresis: number;
  summarizeEvery: number;
  meshCap: number;
  omegaAmp: number;
  stimulus: Stimulus;
  ablations: Ablations;
};

export type Ctx = {
  runId: string;
  seed: number;
  step: number;
  phase: number;
  config: EngineConfig;
  selfModel: Vec;
  selfModelInitialized: boolean;
  priorRho: number;
  priorGamma: Vec;
  dwellCount: number;
  holdLeft: number;
  mesh: MeshNode[];
  nextMeshId: number;
  stateHistory: { latent: Vec; rho: number; step: number }[];
  trace: PsiMetaFrame[];
};

export const BASINS: { label: string; latent: Vec }[] = [
  { label: "closure", latent: [1.2, 0.4, 0.1, 0, 0.2, 0, 0, 0.1, 0, 0, 0, 0] },
  { label: "insight", latent: [0.3, 1.3, 0.2, 0.4, 0, 0.1, 0, 0, 0.2, 0, 0, 0] },
  { label: "identity", latent: [0.8, 0.8, 1.0, 0.1, 0, 0, 0.2, 0, 0, 0.1, 0, 0] },
  { label: "tension", latent: [-0.9, 0.6, 0.3, 1.1, 0.2, 0, 0, 0.3, 0, 0, 0.1, 0] },
  { label: "recall", latent: [0.2, -0.4, 0.7, 0, 1.0, 0.3, 0.1, 0, 0, 0, 0.2, 0] },
  { label: "threshold", latent: [0, 0.2, -0.3, 0.5, 0.1, 1.2, 0.4, 0.1, 0, 0, 0, 0.2] },
];

export const DEFAULT_CONFIG: EngineConfig = {
  D: 12,
  reflexRate: 0.1,
  gammaScale: 0.32,
  tau: 0.78,
  dwell: 2,
  hold: 6,
  hysteresis: 0.08,
  summarizeEvery: 12,
  meshCap: 48,
  omegaAmp: 0.055,
  stimulus: "periodic",
  ablations: { collapse: true, memory: true, summarize: true, omega: true },
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
function zeros(n: number): Vec { return Array(n).fill(0); }
function add(a: Vec, b: Vec): Vec { return a.map((v, i) => v + b[i]); }
function sub(a: Vec, b: Vec): Vec { return a.map((v, i) => v - b[i]); }
function scale(a: Vec, s: number): Vec { return a.map((v) => v * s); }
function norm(a: Vec): number { return Math.sqrt(a.reduce((s, v) => s + v * v, 0)); }

function boundVec(a: Vec): { v: Vec; clamped: boolean } {
  let clamped = false;
  let v = a.map((x) => {
    const y = clamp(x, -2, 2);
    if (y !== x) clamped = true;
    return y;
  });
  const n = norm(v);
  if (n > 2) { v = scale(v, 2 / n); clamped = true; }
  return { v, clamped };
}

export function hashPsi(psi: Psi): string {
  const parts = psi.latent.map((x) => x.toFixed(6)).join(",");
  const basin = psi.basinId ?? -1;
  const raw = `${psi.id}|${psi.t}|${parts}|${psi.coherence.toFixed(6)}|${psi.fluxEnergy.toFixed(6)}|${basin}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function seedToInt(seed: string | number): number {
  if (typeof seed === "number") return seed >>> 0;
  let h = 0;
  const s = seed.replace(/^0x/i, "");
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

function isInt(n: number): boolean { return Number.isInteger(n); }

function validateConfig(cfg: EngineConfig): void {
  if (cfg.D !== 12) throw new Error(`R¹² realization requires D === 12 (got D=${cfg.D}). Basins are fixed at twelve dimensions.`);
  if (!Number.isFinite(cfg.reflexRate) || cfg.reflexRate < 0 || cfg.reflexRate > 1) throw new Error(`reflexRate must be finite in [0,1], got ${cfg.reflexRate}`);
  if (!Number.isFinite(cfg.tau) || cfg.tau < 0 || cfg.tau > 1) throw new Error(`tau must be finite in [0,1], got ${cfg.tau}`);
  if (!Number.isFinite(cfg.dwell) || !isInt(cfg.dwell) || cfg.dwell < 1) throw new Error(`dwell must be integer >= 1, got ${cfg.dwell}`);
  if (!Number.isFinite(cfg.hold) || !isInt(cfg.hold) || cfg.hold < 0) throw new Error(`hold must be integer >= 0, got ${cfg.hold}`);
  if (!Number.isFinite(cfg.hysteresis) || cfg.hysteresis < 0) throw new Error(`hysteresis must be finite >= 0, got ${cfg.hysteresis}`);
  if (!Number.isFinite(cfg.summarizeEvery) || !isInt(cfg.summarizeEvery) || cfg.summarizeEvery < 1) throw new Error(`summarizeEvery must be integer >= 1, got ${cfg.summarizeEvery}`);
  if (!Number.isFinite(cfg.meshCap) || !isInt(cfg.meshCap) || cfg.meshCap < 1) throw new Error(`meshCap must be integer >= 1, got ${cfg.meshCap}`);
  if (!Number.isFinite(cfg.omegaAmp) || cfg.omegaAmp < 0) throw new Error(`omegaAmp must be non-negative finite, got ${cfg.omegaAmp}`);
  if (!Number.isFinite(cfg.gammaScale)) throw new Error(`gammaScale must be finite`);
}

export function initCtx(runId: string, seed: string | number, config: Partial<EngineConfig> = {}): Ctx {
  const cfg: EngineConfig = { ...DEFAULT_CONFIG, ...config, ablations: { ...DEFAULT_CONFIG.ablations, ...(config.ablations ?? {}) } };
  validateConfig(cfg);
  return {
    runId, seed: seedToInt(seed), step: 0, phase: 0, config: cfg,
    selfModel: zeros(cfg.D), selfModelInitialized: false, priorRho: 0.42, priorGamma: zeros(cfg.D),
    dwellCount: 0, holdLeft: 0, mesh: [], nextMeshId: 0, stateHistory: [], trace: [],
  };
}

export function initPsi(id: string, seed: number, D = 12): Psi {
  if (D !== 12) throw new Error(`R¹² realization requires D === 12 (got D=${D})`);
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const latent = Array.from({ length: D }, () => (rng() * 2 - 1) * 0.6);
  return { id, t: 0, latent: boundVec(latent).v, coherence: 0.42, fluxEnergy: 0 };
}

/**
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
  const b = ctx.config.reflexRate;
  ctx.selfModel = add(scale(ctx.selfModel, 1 - b), scale(psi.latent, b));
  const conf = Math.exp(-norm(sub(psi.latent, ctx.selfModel)));
  return { latent: ctx.selfModel.slice(), selfModel: ctx.selfModel.slice(), confidence: conf };
}

function stimulusVec(stim: Stimulus, t: number, D: number, rng: () => number): Vec {
  const v = zeros(D);
  const w = (t % 64) / 64;
  if (stim === "quiet") return v;
  if (stim === "align") { for (let i = 0; i < D; i++) v[i] = 0.15 * Math.cos((t + i) * 0.11); }
  else if (stim === "disrupt") { for (let i = 0; i < D; i++) v[i] = (rng() * 2 - 1) * 0.55; }
  else if (stim === "pulse") { const p = t % 16 < 2 ? 0.7 : 0.05; for (let i = 0; i < D; i++) v[i] = p * Math.sin(i + t * 0.2); }
  else if (stim === "periodic") { for (let i = 0; i < D; i++) v[i] = 0.22 * Math.sin(t * 0.17 + i * 0.5); }
  else if (stim === "basin") { const b = BASINS[t % BASINS.length].latent; for (let i = 0; i < D; i++) v[i] = 0.35 * (b[i] ?? 0); }
  return scale(v, 0.4 + 0.6 * w);
}

export function omegaMu(psi: Psi, ctx: Ctx): OmegaMuResult {
  const rng = mulberry32((ctx.seed ^ (ctx.step * 2654435761) ^ 0xa5a5a5a5) >>> 0);
  const stuck = psi.coherence > 0.85 && norm(ctx.priorGamma) < 0.05;
  const raisedBecauseStuck = stuck;
  const amp = ctx.config.omegaAmp * (stuck ? 2.2 : 1);
  const active = ctx.config.ablations.omega && amp > 0;
  if (!active) return { amp: 0, kind: "inactive", active: false, raisedBecauseStuck, noise: zeros(ctx.config.D) };
  const noise = Array.from({ length: ctx.config.D }, () => gaussian(rng) * amp);
  return { amp, kind: "gaussian", active: true, raisedBecauseStuck, noise };
}

export function sampleFlux(psi: Psi, ctx: Ctx, recall?: RecallPacket, omega?: OmegaMuResult): FluxSample {
  const rng = mulberry32((ctx.seed ^ (ctx.step * 2654435761)) >>> 0);
  let data = stimulusVec(ctx.config.stimulus, ctx.step, ctx.config.D, rng);
  const om = omega ?? omegaMu(psi, ctx);
  if (om.active) data = add(data, om.noise);
  if (recall && ctx.config.ablations.memory) data = add(data, scale(recall.latent, 0.25 * recall.similarity));
  return { fieldId: ctx.config.stimulus, data, timestamp: ctx.step, energy: norm(data) };
}

export function gradient(psi: Psi, flux: FluxSample, ctx: Ctx): Gamma {
  const dPhi = sub(flux.data, psi.latent);
  const g = 0.2 + 0.8 * psi.coherence;
  let vec = scale(dPhi, ctx.config.gammaScale * g);
  const mag = norm(vec);
  if (mag > 1.4) vec = scale(vec, 1.4 / mag);
  return { vec, magnitude: norm(vec), basis: "dPhi_proxy" };
}

export function fuse(reflex: PsiReflex, gamma: Gamma, psi: Psi, ctx: Ctx): Fusion {
  const rho = psi.coherence;
  const mix = clamp(0.35 + 0.5 * rho, 0.2, 0.9);
  const gate = clamp(0.15 + 0.7 * (1 - 0.45 * rho), 0.1, 1);
  const raw = add(reflex.latent, scale(gamma.vec, gate * (1 - mix)));
  const { v, clamped } = boundVec(raw);
  return { psi: { ...psi, t: psi.t + 1, latent: v }, mix, gate, clamped };
}

function alignment(a: Vec, b: Vec): number {
  const na = norm(a), nb = norm(b);
  if (na < 1e-9 || nb < 1e-9) return 0;
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  return clamp((dot / (na * nb) + 1) / 2, 0, 1);
}

export function rhoOf(psi: Psi, flux: FluxSample, gamma: Gamma, prior: number): number {
  const align = alignment(psi.latent, flux.data);
  const calm = 1 / (1 + flux.energy);
  const focus = 1 / (1 + gamma.magnitude);
  const raw = 0.5 * align + 0.25 * calm + 0.15 * focus + 0.1 * prior;
  return clamp(0.65 * raw + 0.35 * prior, 0, 1);
}

export function entropyOf(latent: Vec): number {
  const bins = Array(8).fill(1e-9);
  for (const x of latent) {
    const i = clamp(Math.floor(((x + 2) / 4) * 8), 0, 7);
    bins[i] += Math.abs(x) + 0.05;
  }
  const z = bins.reduce((s, v) => s + v, 0);
  let h = 0;
  for (const b of bins) { const p = b / z; h -= p * Math.log2(p); }
  return h / 3;
}

export function collapsePredicate(rho: number, ctx: Ctx): boolean {
  if (!ctx.config.ablations.collapse) return false;
  if (ctx.holdLeft > 0) return false;
  const floor = ctx.config.tau - ctx.config.hysteresis;
  if (rho >= ctx.config.tau) ctx.dwellCount += 1;
  else if (rho < floor) ctx.dwellCount = 0;
  return ctx.dwellCount >= ctx.config.dwell;
}

function nearestBasin(latent: Vec): number {
  let best = 0, bestD = Infinity;
  BASINS.forEach((b, i) => {
    const d = norm(sub(latent, b.latent));
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export function collapse(psi: Psi, ctx: Ctx): { psi: Psi; event: CollapseEvent } {
  const pre = hashPsi(psi);
  const id = nearestBasin(psi.latent);
  const target = BASINS[id].latent;
  const mixed = add(scale(psi.latent, 0.18), scale(target, 0.82));
  const next: Psi = { ...psi, latent: boundVec(mixed).v, basinId: id, coherence: Math.max(psi.coherence, 0.82) };
  ctx.holdLeft = ctx.config.hold + 1;
  ctx.dwellCount = 0;
  return {
    psi: next,
    event: {
      step: ctx.step, reason: `basin:${BASINS[id].label}`,
      preHash: pre, postHash: hashPsi(next),
      energyDrop: Math.max(0, norm(psi.latent) - norm(next.latent)),
      basinId: id, rho: next.coherence,
    },
  };
}

export function summarize(ctx: Ctx): MeshNode | undefined {
  if (!ctx.config.ablations.summarize) return;
  if (ctx.step === 0 || ctx.step % ctx.config.summarizeEvery !== 0) return;
  const window = ctx.stateHistory.slice(-ctx.config.summarizeEvery);
  if (!window.length) return;
  const D = ctx.config.D;
  const pooled = zeros(D);
  let rhoSum = 0;
  for (const s of window) {
    for (let i = 0; i < D; i++) pooled[i] += s.latent[i];
    rhoSum += s.rho;
  }
  const n = window.length;
  for (let i = 0; i < D; i++) pooled[i] /= n;
  const node: MeshNode = { id: ctx.nextMeshId++, latent: pooled, rho: rhoSum / n, step: ctx.step };
  ctx.mesh.push(node);
  if (ctx.mesh.length > ctx.config.meshCap) ctx.mesh.shift();
  return node;
}

export function recall(psi: Psi, ctx: Ctx): RecallPacket | undefined {
  if (!ctx.config.ablations.memory || !ctx.mesh.length) return;
  let best: RecallPacket | undefined;
  for (const n of ctx.mesh) {
    const sim = alignment(psi.latent, n.latent);
    if (sim >= 0.15 && (!best || sim > best.similarity)) best = { latent: n.latent, similarity: sim, nodeId: n.id };
  }
  return best;
}

export function xiStep(psi: Psi, ctx: Ctx): { psi_next: Psi; frame: PsiMetaFrame; events: CollapseEvent[] } {
  ctx.step = psi.t;
  if (ctx.holdLeft > 0) ctx.holdLeft -= 1;

  const reflex = projectReflex(psi, ctx);
  const rec = recall(psi, ctx);
  const omega = omegaMu(psi, ctx); // single evaluation per tick
  const flux = sampleFlux(psi, ctx, rec, omega);
  const gamma = gradient(psi, flux, ctx);
  const fused = fuse(reflex, gamma, psi, ctx);
  let next = fused.psi;
  next.fluxEnergy = flux.energy;
  next.coherence = rhoOf(next, flux, gamma, ctx.priorRho);

  const drift = norm(sub(gamma.vec, ctx.priorGamma));
  const events: CollapseEvent[] = [];
  let collapsed = false;

  if (collapsePredicate(next.coherence, ctx)) {
    const c = collapse(next, ctx);
    next = c.psi;
    events.push(c.event);
    collapsed = true;
  }

  const ent = entropyOf(next.latent);
  const tags = ["tick", `phase:${ctx.phase}`];
  if (collapsed) tags.push("collapse");
  if (omega.active) tags.push("omega");
  if (omega.raisedBecauseStuck) tags.push("omega_raised");

  const frame: PsiMetaFrame = {
    runId: ctx.runId, step: ctx.step, phase: ctx.phase,
    rho: next.coherence, phiEnergy: flux.energy, gammaMag: gamma.magnitude,
    reflexConf: reflex.confidence, entropy: ent, drift,
    stable: next.coherence > 0.7 && drift < 0.12,
    collapseTriggered: collapsed, tags,
    scalars: {
      mix: fused.mix, gate: fused.gate, dGamma: drift,
      stateNorm: norm(next.latent), reflexNorm: norm(reflex.latent), deltaPsi: norm(sub(next.latent, psi.latent)),
      omegaAmp: omega.amp, omegaActive: omega.active ? 1 : 0, omegaRaised: omega.raisedBecauseStuck ? 1 : 0,
    },
  };

  ctx.trace.push(frame);
  ctx.stateHistory.push({ latent: next.latent.slice(), rho: next.coherence, step: ctx.step });
  if (ctx.stateHistory.length > Math.max(ctx.config.summarizeEvery * 2, 64)) ctx.stateHistory.shift();
  summarize(ctx);

  ctx.priorRho = next.coherence;
  ctx.priorGamma = gamma.vec.slice();
  ctx.phase = (ctx.phase + 1) % 8;
  return { psi_next: next, frame, events };
}

export function run(n: number, seed: string | number, config: Partial<EngineConfig> = {}) {
  const ctx = initCtx("run", seed, config);
  let psi = initPsi("ψ", ctx.seed, ctx.config.D);
  warmStartSelfModel(psi, ctx);
  const frames: PsiMetaFrame[] = [];
  const events: CollapseEvent[] = [];
  const hashes: string[] = [hashPsi(psi)];
  for (let i = 0; i < n; i++) {
    const out = xiStep(psi, ctx);
    psi = out.psi_next;
    frames.push(out.frame);
    events.push(...out.events);
    hashes.push(hashPsi(psi));
  }
  return { psi, ctx, frames, events, hashes };
}

export { hashPsi as hashPsiFull };
