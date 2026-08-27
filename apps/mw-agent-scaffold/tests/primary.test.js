"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { PATHS } = require("../src/config.js");
const { assertPrimaryPreconditions, EXPECTED } = require("../src/primary.js");
const { tCriticalTwoSided95, pairedInterval } = require("../src/verdicts.js");

test("sealed primary cell cannot be repeated", () => {
  assert.throws(
    () => assertPrimaryPreconditions({ authorizePrimary: true }),
    /sealed/
  );
});

test("primary runner denies missing authorization when seal bypassed", () => {
  assert.throws(
    () => assertPrimaryPreconditions({ authorizePrimary: false, allowSealedReplay: true }),
    /PRIMARY_DENIED: missing explicit authorization/
  );
});

test("primary runner denies unarmed lock even with authorization", () => {
  const lock = JSON.parse(fs.readFileSync(PATHS.lock, "utf8"));
  lock.primary_experiment_armed = false;
  assert.throws(
    () => assertPrimaryPreconditions({ authorizePrimary: true, allowSealedReplay: true }, lock),
    /PRIMARY_DENIED: primary_experiment_armed is not true/
  );
});

test("locked preconditions match expected constants", () => {
  const lock = JSON.parse(fs.readFileSync(PATHS.lock, "utf8"));
  const seeds = JSON.parse(fs.readFileSync(PATHS.seeds, "utf8"));
  assert.equal(seeds.seeds.length, EXPECTED.seedCount);
  assert.equal(lock.episodesPerSeed, 8);
  assert.equal(lock.primaryDistractors, 4);
  assert.deepEqual(lock.emaFamily.map(Number), [0.1, 0.24, 0.4, 0.7]);
  assert.equal(lock.gateMode, "every_turn");
  assert.equal(lock.memory, "off");
});

test("primary interval is paired t 95 with df=n-1", () => {
  assert.equal(tCriticalTwoSided95(19), 2.093024054408263);
  const interval = pairedInterval([0.1, 0.2, 0.0, 0.15]);
  assert.equal(interval.intervalKind, "paired_t_95");
  assert.equal(interval.df, 3);
  assert.ok(interval.tCrit > 1.96);
});
