import {
  run,
  initCtx,
  initPsi,
  hashPsi,
  omegaMu,
  entropyOf,
  projectReflex,
  xiStep,
  DEFAULT_CONFIG,
  type Ctx,
  type Psi,
} from "../src/engine.ts";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function vecClose(a: number[], b: number[], eps = 1e-9): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < eps);
}

// --- Core determinism ---
const A = run(64, "0x51e1d");
const B = run(64, "0x51e1d");
assert(A.hashes.length === 65, "hash count");
assert(A.hashes.every((h, i) => h === B.hashes[i]), "determinism: same seed => identical hashes");
assert(A.frames.length === 64, "one Ψmeta per tick");
assert(A.frames.every((f, i) => f.step === i && f.tags.includes("tick")), "tick tags");

// Different seed must diverge
const D = run(32, "0xdead");
assert(D.hashes.some((h, i) => h !== A.hashes[i]), "different seeds diverge");

// --- Default periodic trajectory pin (Realization A) ---
assert(A.events.length === 0, "default periodic 0x51e1d produces zero collapses");

// --- R¹² enforcement ---
let rejected = false;
try {
  run(4, "0x51e1d", { D: 13 });
} catch (e: any) {
  rejected = /D === 12/.test(String(e.message));
}
assert(rejected, "D=13 must be rejected before execution");

// --- Collapse under basin drive ---
const C = run(64, "0x51e1d", { stimulus: "basin" });
assert(C.events.length > 0, "collapse reachability: basin drive must fire Λψ");
assert(
  C.events.every((e) => e.preHash && e.postHash && e.preHash !== e.postHash),
  "collapse event integrity",
);
assert(
  C.frames.filter((f) => f.collapseTriggered).length === C.events.length,
  "one CollapseEvent per collapse tick",
);

// --- Ablations (individual) ---
const noCollapse = run(32, "0x51e1d", {
  stimulus: "basin",
  ablations: { collapse: false, memory: true, summarize: true, omega: true },
});
assert(noCollapse.events.length === 0, "collapse ablation alone");

const noOmega = run(16, "0x51e1d", {
  stimulus: "quiet",
  omegaAmp: 0.2,
  ablations: { collapse: true, memory: true, summarize: true, omega: false },
});
assert(noOmega.frames.every((f) => f.scalars.omegaActive === 0), "omega ablation telemetry");
assert(noOmega.frames.every((f) => !f.tags.includes("omega")), "omega ablation tags");

const noSum = run(40, "0x51e1d", {
  summarizeEvery: 4,
  meshCap: 10,
  ablations: { collapse: true, memory: true, summarize: false, omega: true },
});
assert(noSum.ctx.mesh.length === 0, "summarize ablation leaves mesh empty");

const noMem = run(40, "0x51e1d", {
  summarizeEvery: 4,
  meshCap: 10,
  stimulus: "basin",
  ablations: { collapse: true, memory: false, summarize: true, omega: true },
});
assert(noMem.ctx.mesh.length > 0, "summarize still runs when memory ablated");

// --- Ωµ Gaussian + telemetry + determinism of samples ---
const omegaRun = run(8, "0x51e1d", { stimulus: "quiet", omegaAmp: 0.1 });
assert(omegaRun.frames.every((f) => "omegaAmp" in f.scalars), "omegaAmp in scalars");
assert(omegaRun.frames.some((f) => f.scalars.omegaActive === 1), "omega active under default");

const ctx0 = initCtx("pin", "0x51e1d", { stimulus: "quiet", omegaAmp: 0.1 });
const psi0 = initPsi("ψ", ctx0.seed, 12);
const om0 = omegaMu(psi0, ctx0);
assert(om0.active && om0.kind === "gaussian", "omega kind gaussian");
assert(om0.noise.length === 12, "omega noise dim");
const om0b = omegaMu(psi0, ctx0);
assert(vecClose(om0.noise, om0b.noise), "omegaMu deterministic for same seed/step");

// --- Σ◯ mean-pool + unique mesh IDs ---
const meshRun = run(80, "0x51e1d", { summarizeEvery: 4, meshCap: 3, stimulus: "basin" });
const ids = meshRun.ctx.mesh.map((n) => n.id);
assert(ids.length <= 3, "meshCap respected");
assert(new Set(ids).size === ids.length, "mesh IDs unique after capacity");
assert(meshRun.ctx.nextMeshId > 3, "nextMeshId advanced past capacity");
const node = meshRun.ctx.mesh[0];
assert(node && node.latent.every((x) => Number.isFinite(x)), "Σ◯ node latent finite");
assert(Number.isFinite(node.rho), "Σ◯ node rho finite");

// --- Post-collapse entropy ---
for (const f of C.frames.filter((x) => x.collapseTriggered)) {
  assert(Number.isFinite(f.entropy), "post-collapse entropy finite");
  assert(f.collapseTriggered, "collapseTriggered true");
}

// --- Hold semantics ---
const holdRun = run(30, "0x51e1d", {
  stimulus: "basin",
  tau: 0,
  dwell: 1,
  hold: 6,
  hysteresis: 0,
});
const steps = holdRun.events.map((e) => e.step);
if (steps.length >= 2) {
  const gaps = steps.slice(1).map((s, i) => s - steps[i]);
  assert(gaps.every((g) => g === 7), `hold gaps should be 7 (six post-snap), got ${gaps}`);
}

// --- Hysteresis boundary ---
const hyst = run(20, "0x51e1d", {
  stimulus: "quiet",
  tau: 0.99,
  dwell: 2,
  hysteresis: 0.1,
});
assert(hyst.events.length === 0, "high-tau quiet does not collapse");

// --- Λψ does not write selfModel ---
const ownCtx = initCtx("own", "0x51e1d", { stimulus: "basin", tau: 0, dwell: 1, hold: 0 });
const ownPsi = initPsi("ψ", ownCtx.seed, 12);
const out1 = xiStep(ownPsi, ownCtx);
assert(out1.events.length === 1, "ownership test produced a collapse");
assert(
  !vecClose(ownCtx.selfModel, out1.psi_next.latent),
  "selfModel is not equal to collapsed latent (Λψ did not write it)",
);

// --- Config validation: NaN / non-integer rejection ---
const badCases: any[] = [
  { reflexRate: 1.5 },
  { tau: -0.1 },
  { dwell: 0 },
  { dwell: NaN },
  { dwell: 1.5 },
  { hold: -1 },
  { hold: NaN },
  { hysteresis: NaN },
  { summarizeEvery: 0 },
  { summarizeEvery: NaN },
  { meshCap: 0 },
  { meshCap: NaN },
  { omegaAmp: -1 },
  { omegaAmp: NaN },
];
for (const bad of badCases) {
  let threw = false;
  try {
    run(2, "0x51e1d", bad);
  } catch {
    threw = true;
  }
  assert(threw, `invalid config should reject: ${JSON.stringify(bad)}`);
}

console.log("ok", {
  ticks: A.frames.length,
  collapses: C.events.length,
  meshIds: ids,
  holdSteps: steps.slice(0, 4),
  lastRho: A.frames.at(-1)?.rho,
  lastEntropy: A.frames.at(-1)?.entropy,
  lastHash: A.hashes.at(-1),
  omegaNoise0: om0.noise[0].toFixed(6),
});
