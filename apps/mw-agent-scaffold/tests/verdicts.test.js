"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { substrateInertness, operatorAttribution } = require("../src/verdicts.js");

test("inertness requires mean>=0.05 and CI lower bound > 0", () => {
  const seeds = [1, 2, 3, 4, 5, 6];
  const mw = { 1: 0.8, 2: 0.8, 3: 0.75, 4: 0.8, 5: 0.85, 6: 0.8 };
  const ema = { 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 6: 0.5 };
  const result = substrateInertness(mw, ema, seeds);
  assert.equal(result.verdict, "MW_ADVANTAGE");
  assert.ok(result.interval.mean >= 0.05);
  assert.ok(result.interval.ciLo > 0);
});

test("small noisy gap is inert", () => {
  const seeds = [1, 2, 3, 4];
  const mw = { 1: 0.5, 2: 0.6, 3: 0.4, 4: 0.55 };
  const ema = { 1: 0.5, 2: 0.55, 3: 0.45, 4: 0.5 };
  const result = substrateInertness(mw, ema, seeds);
  assert.equal(result.verdict, "SUBSTRATE_INERT");
});

test("operator attribution distinguishes surviving gaps", () => {
  const seeds = [1, 2, 3, 4, 5, 6];
  const mw = { 1: 0.9, 2: 0.9, 3: 0.85, 4: 0.9, 5: 0.9, 6: 0.85 };
  const ema = { 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 6: 0.5 };
  const dead = { 1: 0.5, 2: 0.5, 3: 0.52, 4: 0.48, 5: 0.5, 6: 0.5 };
  const alive = { 1: 0.88, 2: 0.9, 3: 0.86, 4: 0.89, 5: 0.9, 6: 0.84 };
  assert.equal(operatorAttribution(mw, dead, ema, seeds).verdict, "OPERATORS_ACCOUNT_FOR_GAP");
  assert.equal(operatorAttribution(mw, alive, ema, seeds).verdict, "GAP_SURVIVES_OPERATOR_ABLATION");
});
