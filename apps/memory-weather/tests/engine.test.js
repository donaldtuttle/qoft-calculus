"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Engine = require("../src/engine.js");
const M = require("../src/math.js");

function runScenario(seed, ticks = 180) {
  const state = Engine.createState({ seed, summarizeEvery: 8 });
  const digests = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    if (tick === 7) Engine.inscribeMemory(state, "observer field", 1.15);
    if (tick === 19) Engine.inscribeMemory(state, "memory front", 0.8);
    if (tick === 28) Engine.queueRecall(state, "observer field");
    if (tick === 51) Engine.requestCollapse(state);
    Engine.step(state, { stimulusMode: tick < 60 ? "periodic" : "pulse", stimulusAmplitude: 0.82 });
    digests.push(Engine.stateDigest(state));
  }
  return { state, digests };
}

test("same seed, config, and input sequence is deterministic", () => {
  const a = runScenario(4276993775, 256);
  const b = runScenario(4276993775, 256);
  assert.deepEqual(a.digests, b.digests);
  assert.deepEqual(a.state.events, b.state.events);
  assert.deepEqual(a.state.frames, b.state.frames);
  assert.equal(a.state.currentHash, b.state.currentHash);
});

test("different seeds diverge", () => {
  const a = runScenario(101, 32);
  const b = runScenario(102, 32);
  assert.notEqual(a.state.currentHash, b.state.currentHash);
});

test("one Ψmeta frame is committed per tick with required fields and tags", () => {
  const state = Engine.createState({ seed: 44 });
  const returnedFrames = [];
  for (let i = 0; i < 80; i += 1) returnedFrames.push(Engine.step(state).frame);
  assert.equal(state.frames.length, 80);
  for (let i = 0; i < state.frames.length; i += 1) {
    const frame = state.frames[i];
    for (const key of ["run_id", "step", "phase", "rho", "gamma_mag", "reflex_conf", "entropy", "drift", "stable", "collapse_would_trigger", "collapse_eligible", "collapse_triggered", "collapse_reason", "tags"]) {
      assert.ok(Object.hasOwn(frame, key), `missing ${key}`);
    }
    assert.strictEqual(frame, returnedFrames[i]);
    assert.equal(frame.step, i);
    assert.ok(frame.tags.includes("tick"));
    assert.ok(frame.tags.includes(`phase:${frame.phase}`));
    assert.equal(frame.tags.filter((tag) => tag === "collapse").length, frame.collapse_triggered ? 1 : 0);
  }
});

test("every Λψ invocation emits a matching pre/post integrity event", () => {
  const state = Engine.createState({ seed: 9 });
  Engine.requestCollapse(state);
  const result = Engine.step(state);
  const events = result.events.filter((event) => event.kind === "collapse");
  assert.equal(events.length, 1);
  assert.equal(result.frame.collapse_triggered, true);
  assert.equal(events[0].preHash, result.frame.psi_hash_pre_collapse);
  assert.equal(events[0].postHash, Engine.psiHash(state.psi));
  assert.notEqual(events[0].preHash, events[0].postHash);
  assert.ok(result.frame.tags.includes("collapse"));
});

test("checkpoint hydration reproduces uninterrupted continuation", () => {
  const original = Engine.createState({ seed: 2303, summarizeEvery: 5 });
  for (let i = 0; i < 64; i += 1) {
    if (i === 12) Engine.inscribeMemory(original, "restart continuity", 1);
    if (i === 24) Engine.queueRecall(original, "restart continuity");
    Engine.step(original, { stimulusMode: "pulse" });
  }
  const resumed = Engine.hydrate(Engine.serialize(original));
  for (let i = 0; i < 90; i += 1) {
    Engine.step(original, { stimulusMode: "basin", selectedBasin: 4 });
    Engine.step(resumed, { stimulusMode: "basin", selectedBasin: 4 });
    assert.equal(Engine.stateDigest(original), Engine.stateDigest(resumed));
  }
});

test("ablation substitutions are explicit and isolated", () => {
  const state = Engine.createState({
    seed: 77,
    summarizeEvery: 2,
    ablations: { collapse: false, memoryWrite: false, thetaReplay: false, summarize: false, omega: false, reflexAdaptation: false }
  });
  const selfModel = [...state.selfModel];
  const write = Engine.inscribeMemory(state, "blocked", 1);
  assert.equal(write.status, "ablated");
  Engine.requestCollapse(state);
  for (let i = 0; i < 24; i += 1) Engine.step(state);
  assert.equal(state.lastFlux.omega.amp, 0);
  assert.equal(state.counters.collapse, 0);
  assert.equal(state.frames[0].collapse_would_trigger, true);
  assert.equal(state.mesh.length, 0);
  assert.equal(state.memories.length, 0);
  assert.equal(state.ctx.pendingRecall, null);
  assert.deepEqual(state.selfModel, selfModel);
});

test("Σ◯ mesh is deterministic and bounded by meshCap", () => {
  const state = Engine.createState({ seed: 11, summarizeEvery: 2, meshCap: 3 });
  for (let i = 0; i < 20; i += 1) Engine.step(state);
  assert.equal(state.mesh.length, 3);
  assert.equal(state.counters.summaries, 10);
  for (const node of state.mesh) {
    assert.equal(node.latent.length, 12);
    assert.ok(node.sourceHash.startsWith("mw-fnv64:"));
  }
});

test("manual inscription and Θλ replay remain distinct mechanisms", () => {
  const state = Engine.createState({ seed: 121, recallThreshold: -1 });
  const write = Engine.inscribeMemory(state, "projection provenance", 1.2);
  assert.equal(write.event.kind, "memory-write");
  assert.equal(write.event.operator, undefined);
  assert.match(write.event.note, /not an alias for Σ◯/);
  const packet = Engine.queueRecall(state, "projection provenance");
  assert.equal(packet.operator, "Θλ");
  Engine.step(state);
  assert.equal(state.lastFlux.recall.packetId, packet.packetId);
  assert.equal(state.counters.recallApplied, 1);
});

test("Θλ, nonzero Ωµ, and observer coupling compose in the same tick", () => {
  const state = Engine.createState({ seed: 491, recallThreshold: -1, omegaAmp: 0.055 });
  Engine.inscribeMemory(state, "composite influence packet", 1);
  const packet = Engine.queueRecall(state, "composite influence packet");
  const couplingVector = Array.from({ length: Engine.DIMENSION }, (_, i) => (i % 2 === 0 ? 0.04 : -0.025));
  const result = Engine.step(state, {
    stimulusMode: "quiet",
    couplingVector,
    couplingSourceHash: "mw-fnv64:frozen-observer-b"
  });

  assert.ok(packet);
  assert.equal(state.lastFlux.recall.applied, true);
  assert.equal(state.lastFlux.recall.packetId, packet.packetId);
  assert.equal(state.lastFlux.omega.enabled, true);
  assert.ok(state.lastFlux.omega.amp > 0);
  assert.ok(M.norm(state.lastFlux.omega.vec) > 0);
  assert.equal(state.lastFlux.coupling.applied, true);
  assert.ok(state.lastFlux.coupling.magnitude > 0);
  assert.equal(result.frame.scalars.recallSimilarity, packet.similarity);
  assert.equal(result.frame.scalars.omegaAmp, state.lastFlux.omega.amp);
  assert.equal(result.frame.scalars.couplingMagnitude, state.lastFlux.coupling.magnitude);
});

test("Γ rho gate uses the prior committed coherence", () => {
  const state = Engine.createState({ seed: 492, collapseThreshold: 1 });
  const priorRho = state.psi.coherence;
  const result = Engine.step(state, { stimulusMode: "disrupt", stimulusAmplitude: 1.1 });

  assert.equal(state.lastGamma.rhoGate, 0.2 + 0.8 * priorRho);
  assert.equal(state.psi.coherence, result.frame.rho);
  assert.notEqual(result.frame.rho, priorRho);
});

test("scheduled Σ◯ summarizes committed state with and without Λψ", () => {
  const ordinary = Engine.createState({
    seed: 493,
    summarizeEvery: 1,
    ablations: { collapse: false }
  });
  const ordinaryResult = Engine.step(ordinary, { stimulusMode: "quiet" });
  assert.deepEqual(ordinaryResult.events.map((event) => event.kind), ["summary"]);
  assert.equal(ordinary.mesh.length, 1);
  assert.ok(M.distance(ordinary.mesh[0].latent, ordinary.psi.latent) < 1e-12);
  assert.equal(ordinary.mesh[0].sourceHash, M.contentHash([ordinary.trace[0].psiHash]));
  assert.deepEqual(ordinary.mesh[0].sourceSteps, [0, 0]);

  const collapsed = Engine.createState({ seed: 494, summarizeEvery: 1 });
  Engine.requestCollapse(collapsed);
  const collapsedResult = Engine.step(collapsed, { stimulusMode: "quiet" });
  assert.deepEqual(collapsedResult.events.slice(0, 2).map((event) => event.kind), ["collapse", "summary"]);
  assert.equal(collapsed.mesh.length, 1);
  assert.equal(collapsed.trace[0].collapse, true);
  assert.equal(collapsed.trace[0].psiHash, Engine.psiHash(collapsed.psi));
  assert.ok(M.distance(collapsed.mesh[0].latent, collapsed.psi.latent) < 1e-12);
  assert.equal(collapsed.mesh[0].sourceHash, M.contentHash([collapsed.trace[0].psiHash]));
  assert.deepEqual(collapsed.mesh[0].sourceSteps, [0, 0]);
});

test("fusion factorization projects the same Psi as fuse", () => {
  const state = Engine.createState({ seed: 495 });
  const omega = Engine.omegaSample(state);
  const flux = Engine.sampleFlux(state, omega);
  const gamma = Engine.gradientOf(state, flux);
  const psiReflex = { latent: [...state.selfModel] };
  const directFusion = Engine.fuse(state, psiReflex, gamma, flux);
  const factoredFusion = Engine.decode(
    Engine.mergeR(Engine.repReflex(psiReflex), Engine.repGamma(gamma), state.psi.coherence),
    state,
    flux
  );

  assert.deepEqual(factoredFusion, directFusion);
  assert.strictEqual(Engine.projectPsi(directFusion), directFusion.psi);
  assert.deepEqual(Engine.projectPsi(factoredFusion), directFusion.psi);
  assert.throws(() => Engine.projectPsi({}), /Fusion record/);
});

test("pre-predicate Ψmeta assessment is finalized and committed once", () => {
  const state = Engine.createState({ seed: 496 });
  Engine.requestCollapse(state);
  const result = Engine.step(state, { stimulusMode: "quiet" });

  assert.equal(state.frames.length, 1);
  assert.strictEqual(state.frames[0], result.frame);
  assert.equal(result.frame.collapse_would_trigger, true);
  assert.equal(result.frame.collapse_eligible, true);
  assert.equal(result.frame.collapse_triggered, true);
  assert.equal(result.frame.collapse_reason, "manual-request");
  assert.equal(result.frame.scalars.dwell, state.config.collapseDwell);
  assert.equal(result.frame.tags.filter((tag) => tag === "collapse").length, 1);
});

test("R12 bounds and configuration validation reject invalid state", () => {
  assert.throws(() => Engine.createState({ seed: -1 }), /seed/);
  assert.throws(() => Engine.createState({ dimension: 11 }), /dimension/);
  assert.throws(() => Engine.createState({ collapseThreshold: Number.NaN }), /finite/);
  assert.throws(() => Engine.createState({ collapseDwell: 1.2 }), /integer/);
  const state = Engine.createState({ seed: 2, stimulusAmplitude: 4 });
  for (let i = 0; i < 200; i += 1) Engine.step(state, { stimulusMode: "disrupt" });
  assert.ok(M.norm(state.psi.latent) <= state.config.radialLimit + 1e-10);
  assert.ok(state.psi.latent.every((value) => Math.abs(value) <= state.config.componentLimit + 1e-10));
});

test("multi-observer coupling uses frozen inputs and is processing-order invariant", () => {
  const makePair = () => [
    Engine.createState({ config: { seed: 601, summarizeEvery: 4 }, observerId: "observer-a" }),
    Engine.createState({ config: { seed: 602, summarizeEvery: 4 }, observerId: "observer-b" })
  ];
  const ab = makePair();
  const ba = makePair();
  for (let i = 0; i < 96; i += 1) {
    const observation = { stimulusMode: i % 2 ? "pulse" : "periodic", selectedBasin: i % 6 };
    const resultAB = Engine.stepCoupledPair(ab[0], ab[1], observation, observation, { strength: 0.17, order: "ab" });
    const resultBA = Engine.stepCoupledPair(ba[0], ba[1], observation, observation, { strength: 0.17, order: "ba" });
    assert.equal(resultAB.coupling.updatePolicy, "frozen snapshot; simultaneous double-buffered inputs");
    assert.equal(Engine.stateDigest(ab[0]), Engine.stateDigest(ba[0]));
    assert.equal(Engine.stateDigest(ab[1]), Engine.stateDigest(ba[1]));
  }
});

test("replay hydration rejects malformed, out-of-bounds, or mismatched runtime data", () => {
  const state = Engine.createState({ seed: 811 });
  Engine.step(state);
  const replay = Engine.serialize(state);

  const badLatent = structuredClone(replay);
  badLatent.state.psi.latent[0] = 99;
  badLatent.state.currentHash = Engine.psiHash(badLatent.state.psi);
  assert.throws(() => Engine.hydrate(badLatent), /component bounds/);

  const badTrace = structuredClone(replay);
  badTrace.state.trace[0].gamma = [1, 2];
  assert.throws(() => Engine.hydrate(badTrace), /length 12/);

  const badIdentity = structuredClone(replay);
  badIdentity.state.engineId = "untrusted-engine";
  assert.throws(() => Engine.hydrate(badIdentity), /identity mismatch/);
});
