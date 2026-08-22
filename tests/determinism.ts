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
assert(A.events.every((e) => e.preHash && e.postHash && e.preHash !== e.postHash), "collapse event integrity");

const off = run(32, "0x51e1d", { ablations: { collapse: false, memory: false, summarize: false, omega: false } });
assert(off.events.length === 0, "collapse ablation");

console.log("ok", {
  ticks: A.frames.length,
  collapses: A.events.length,
  lastRho: A.frames.at(-1)?.rho,
  lastEntropy: A.frames.at(-1)?.entropy,
  lastHash: A.hashes.at(-1),
});
