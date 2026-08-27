"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { createEncoder } = require("../src/encode.js");
const { PATHS } = require("../src/config.js");

test("default encoder does not reference textVector", () => {
  const source = fs.readFileSync(pathJoin(), "utf8");
  assert.equal(source.includes("textVector"), false);
});

function pathJoin() {
  return require("path").join(__dirname, "..", "src", "encode.js");
}

test("encoder and projection hashes are stable", () => {
  const a = createEncoder();
  const b = createEncoder();
  assert.equal(a.projectionHash, b.projectionHash);
  assert.equal(a.encoderId, b.encoderId);
  const cue = a.encode({ kind: "cue", cueId: 1, turn: 0, token: "cue:1", embedSeed: 1 });
  assert.equal(cue.u.length, 12);
  assert.ok(cue.u.every((value) => Math.abs(value) <= 2 + 1e-12));
});

test("lock files pin hashes", () => {
  const lock = JSON.parse(fs.readFileSync(PATHS.lock, "utf8"));
  const encoder = createEncoder();
  assert.equal(encoder.projectionHash, lock.projection_hash);
  assert.equal(encoder.embedTable.table_hash, lock.embed_hash);
});
