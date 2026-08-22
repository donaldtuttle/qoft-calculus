import { run } from "../src/engine.ts";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const A = run(64, "0x51e1d");
const B = run(64, "0x51e1d");

assert(A.hashes.length === 65, "hash count");
assert(A.hashes.every((h, i) => h === B.hashes[i]), "determinism: same seed => identical hashes");
assert(A.frames.length === 64, "one Ψmeta per tick");
assert(A.frames.every((f, i) => f.step === i && f.tags.includes("tick")), "tick tags");

// Λψ is not guaranteed under default periodic at τ=0.78.
// Collapse assertions run under a drive that actually fires.
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

const off = run(64, "0x51e1d", {
  stimulus: "basin",
  ablations: { collapse: false, memory: false, summarize: false, omega: false },
});
assert(off.events.length === 0, "collapse ablation");

console.log("ok", {
  ticks: A.frames.length,
  collapses: C.events.length,
  lastRho: A.frames.at(-1)?.rho,
  lastEntropy: A.frames.at(-1)?.entropy,
  lastHash: A.hashes.at(-1),
});
