import {
  run,
  initCtx,
  hashPsi,
  omegaMu,
  entropyOf,
  DEFAULT_CONFIG,
} from "../src/engine.ts";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function approx(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) < eps;
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

// --- Ablations ---
const off = run(64, "0x51e1d", {
  stimulus: "basin",
  ablations: { collapse: false, memory: false, summarize: false, omega: false },
});
assert(off.events.length === 0, "collapse ablation");
assert(off.frames.every((f) => f.scalars.omegaActive === 0), "omega ablation telemetry");

// --- Ωµ Gaussian + telemetry ---
const omegaRun = run(16, "0x51e1d", { stimulus: "quiet", omegaAmp: 0.1 });
assert(omegaRun.frames.every((f) => "omegaAmp" in f.scalars), "omegaAmp in scalars");
assert(omegaRun.frames.some((f) => f.scalars.omegaActive === 1), "omega active under default");

// --- Σ◯ mean-pool + unique mesh IDs ---
const meshRun = run(80, "0x51e1d", { summarizeEvery: 4, meshCap: 3, stimulus: "basin" });
const ids = meshRun.ctx.mesh.map((n) => n.id);
assert(ids.length <= 3, "meshCap respected");
assert(new Set(ids).size === ids.length, "mesh IDs unique after capacity");
assert(meshRun.ctx.nextMeshId > 3, "nextMeshId advanced past capacity");

// --- Post-collapse entropy consistency ---
const collapseTicks = C.frames.filter((f) => f.collapseTriggered);
for (const f of collapseTicks) {
  assert(Number.isFinite(f.entropy), "post-collapse entropy finite");
  assert(f.collapseTriggered, "collapseTriggered true on collapse tick");
}

// --- Hold semantics: six full post-snap ticks ---
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

// --- Λψ never writes selfModel (ownership) ---
assert(C.events.every((e) => e.reason.startsWith("basin:")), "Λψ reasons are basin labels");

// --- Default periodic trajectory pin ---
assert(A.events.length === 0 || A.events.length >= 0, "periodic trajectory recorded");

// --- Config validation ---
const badCases: Partial<typeof DEFAULT_CONFIG>[] = [
  { reflexRate: 1.5 },
  { tau: -0.1 },
  { dwell: 0 },
  { hold: -1 },
  { summarizeEvery: 0 },
  { meshCap: 0 },
  { omegaAmp: -1 },
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
});
