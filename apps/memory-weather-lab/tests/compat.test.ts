import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import EngineJs from "../src/vendor/engine.js";
import FieldJs from "../src/vendor/field.js";
import ProjectionJs from "../src/vendor/projection.js";

const Engine: any = EngineJs;
const Field: any = FieldJs;
const Projection: any = ProjectionJs;
const siblingRequire = createRequire(fileURLToPath(import.meta.url));
const SiblingEngine: any = siblingRequire("../../memory-weather/src/engine.js");

function playDemo(api: any) {
  const state = api.createState({ seed: 12062026 });
  api.inscribeMemory(state, "observer field", 1.15);
  api.inscribeMemory(state, "projection provenance", 0.95);
  api.inscribeMemory(state, "memory front", 0.78);
  for (let tick = 0; tick < 96; tick += 1) {
    if (tick === 22) api.queueRecall(state, "projection provenance");
    if (tick === 51) api.requestCollapse(state);
    api.step(state, {
      stimulusMode: tick < 36 ? "periodic" : tick < 70 ? "pulse" : "basin",
      stimulusAmplitude: 0.82,
      selectedBasin: 4,
    });
  }
  return state;
}

test("fixed-seed demonstration matches the published v0.1.1 hash", () => {
  const state = playDemo(Engine);
  assert.equal(state.ctx.step, 96);
  assert.equal(state.currentHash, "mw-fnv64:e199888bbf930070");
  assert.equal(state.events.length, 13);
  assert.equal(state.engineVersion, "0.1.1");
});

test("React lab vendor stays trajectory-equivalent with apps/memory-weather", () => {
  const lab = playDemo(Engine);
  const sibling = playDemo(SiblingEngine);
  assert.equal(lab.currentHash, sibling.currentHash);
  assert.equal(lab.currentHash, "mw-fnv64:e199888bbf930070");
  assert.deepEqual(
    lab.events.map((event: { kind: string; step: number }) => [event.kind, event.step]),
    sibling.events.map((event: { kind: string; step: number }) => [event.kind, event.step]),
  );
});

test("Ψmeta assessment is constructed before the collapse predicate", () => {
  const state = Engine.createState({ seed: 496 });
  Engine.requestCollapse(state);
  const result = Engine.step(state, { stimulusMode: "quiet" });
  assert.equal(state.frames.length, 1);
  assert.equal(result.frame.collapse_triggered, true);
  assert.equal(result.frame.psi_hash_pre_collapse, result.events[0].preHash);
  assert.ok(Engine.projectPsi);
});

test("projection provenance catalog covers every scientific feature", () => {
  const state = Engine.createState({ seed: 48 });
  Engine.step(state);
  const projection = Projection.createProjection();
  const catalog = Projection.featureCatalog(projection, state, { size: 45 });
  assert.ok(Object.keys(catalog).length >= 10);
  const field = Field.buildField(state, projection, { size: 21 });
  assert.equal(field.coordinates.length, 21 * 21);
});
