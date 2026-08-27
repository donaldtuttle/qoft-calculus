"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { sha256File } = require("../src/hashes.js");
const { PATHS, LOCK } = require("../src/config.js");
const { createEncoder } = require("../src/encode.js");
const { createMw } = require("../src/substrates/mw.js");
const { createEma, createStateless } = require("../src/substrates/ema.js");
const Engine = require("../../memory-weather/src/engine.js");

test("engine pin is unchanged", () => {
  assert.equal(Engine.ENGINE_VERSION, "0.1.1");
  assert.equal(sha256File(PATHS.engine), LOCK.engineSha256);
});

test("same u sequence is deterministic for MW and EMA", () => {
  const encoder = createEncoder();
  const u = encoder.encode({ kind: "cue", cueId: 0, turn: 0, token: "cue:0", embedSeed: 1 }).u;
  const mwA = createMw(11);
  const mwB = createMw(11);
  const emaA = createEma(0.24);
  const emaB = createEma(0.24);
  mwA.update(u); mwB.update(u);
  emaA.update(u); emaB.update(u);
  assert.equal(mwA.digest(), mwB.digest());
  assert.equal(emaA.digest(), emaB.digest());
});

test("STATELESS carrier is zero[12]", () => {
  const s = createStateless();
  const out = s.update(Array(12).fill(1));
  assert.deepEqual(out.carrier, Array(12).fill(0));
});

test("MW observation uses forcingVector only; reward is not passed", () => {
  const src = fs.readFileSync(require("path").join(__dirname, "..", "src", "substrates", "mw.js"), "utf8");
  assert.match(src, /forcingVector/);
  assert.equal(src.includes("reward"), false);
});
