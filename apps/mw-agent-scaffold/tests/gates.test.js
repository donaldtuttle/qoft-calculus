"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createGate } = require("../src/gates.js");

test("every_turn is always open", () => {
  const gate = createGate("every_turn");
  assert.equal(gate.decide(0, false).open, true);
  assert.equal(gate.decide(7, true).open, true);
});

test("fixed_cooldown uses period K", () => {
  const gate = createGate("fixed_cooldown", { period: 7 });
  assert.equal(gate.decide(0, false).open, true);
  assert.equal(gate.decide(1, true).open, false);
  assert.equal(gate.decide(7, false).open, true);
});

test("lambda_commit opens only on collapse flag", () => {
  const gate = createGate("lambda_commit");
  assert.equal(gate.decide(3, false).open, false);
  assert.equal(gate.decide(3, true).open, true);
});
