"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const replay = require("../examples/fixed-seed-demo.json");
const Engine = require("../src/engine.js");
const Projection = require("../src/projection.js");
const Field = require("../src/field.js");

test("fixed-seed demonstration is a valid reproducible replay", () => {
  const state = Engine.hydrate(replay);
  assert.equal(state.ctx.step, 96);
  assert.equal(state.currentHash, "mw-fnv64:e199888bbf930070");
  assert.equal(state.events.length, 13);
  assert.equal(state.mesh.length, 8);
  const projection = Projection.createProjection({
    seed: replay.projection.seed,
    matrix3: replay.projection.matrix3,
    anchor: replay.projection.anchor
  });
  assert.equal(projection.matrixHash, replay.projection.matrix_hash);
  const field = Field.buildField(state, projection, replay.field.spec);
  assert.equal(field.dataHash, replay.field.dataHash);
  assert.equal(replay.provenance.length, 11);
});
