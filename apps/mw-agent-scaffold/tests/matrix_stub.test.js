"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runMatrix } = require("../src/harness.js");
const { LOCK } = require("../src/config.js");

test("smoke matrix runs locked stub policy without arming primary experiment", () => {
  const result = runMatrix({
    seeds: [17, 23],
    episodes: 2,
    distractors: 2,
    includeAttribution: false
  });
  assert.equal(result.policyId, LOCK.policyId);
  assert.equal(result.mw.length, 2);
  assert.equal(result.stateless.length, 2);
  assert.ok(LOCK.emaFamily.includes(result.bestEma.alpha));
  assert.ok(["MW_ADVANTAGE", "SUBSTRATE_INERT"].includes(result.substrate.verdict));
  assert.equal(result.note.includes("Not the primary experiment"), true);
});
