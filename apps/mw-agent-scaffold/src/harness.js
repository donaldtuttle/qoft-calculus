"use strict";

const { LOCK } = require("./config.js");
const { createEncoder } = require("./encode.js");
const { createStubPolicy } = require("./policy/stub.js");
const { createMw, createMwAblated } = require("./substrates/mw.js");
const { createEma, createStateless } = require("./substrates/ema.js");
const { runTrial } = require("./runner.js");
const { bestEma, substrateInertness, operatorAttribution } = require("./verdicts.js");

function loadSeeds(seedFile) {
  const data = require(seedFile);
  return data.seeds;
}

function runConditionFactory(factory, policy, encoder, seeds, options) {
  const bySeed = {};
  const trials = [];
  for (const seed of seeds) {
    const substrate = factory(seed);
    const trial = runTrial(substrate, policy, encoder, seed, options);
    bySeed[String(seed)] = trial.probe_accuracy;
    trials.push({
      seed,
      condition: trial.condition,
      substrateId: trial.substrateId,
      probe_accuracy: trial.probe_accuracy,
      mean_reward: trial.mean_reward
    });
  }
  return { bySeed, trials };
}

function runMatrix(options = {}) {
  const encoder = createEncoder();
  const policy = createStubPolicy();
  const seeds = options.seeds;
  if (!Array.isArray(seeds) || !seeds.length) throw new Error("seeds must be locked and provided");
  const trialOpts = {
    episodes: options.episodes == null ? LOCK.episodesPerSeed : options.episodes,
    distractors: options.distractors == null ? LOCK.primaryDistractors : options.distractors,
    gateMode: LOCK.gateMode
  };

  const mw = runConditionFactory((seed) => createMw(seed), policy, encoder, seeds, trialOpts);
  const stateless = runConditionFactory(() => createStateless(), policy, encoder, seeds, trialOpts);
  const ema = {};
  for (const alpha of LOCK.emaFamily) {
    ema[String(alpha)] = runConditionFactory(
      () => createEma(alpha),
      policy, encoder, seeds, trialOpts
    );
  }
  const emaMeans = {};
  for (const alpha of LOCK.emaFamily) emaMeans[String(alpha)] = ema[String(alpha)].bySeed;
  const best = bestEma(emaMeans);
  const bestBySeed = ema[String(best.alpha)].bySeed;
  const inert = substrateInertness(mw.bySeed, bestBySeed, seeds);

  let attribution = null;
  if (options.includeAttribution) {
    const ablated = runConditionFactory(
      (seed) => createMwAblated(seed, { collapse: false, thetaReplay: false, omega: false }),
      policy, encoder, seeds, trialOpts
    );
    attribution = operatorAttribution(mw.bySeed, ablated.bySeed, bestBySeed, seeds);
  }

  return {
    schema: "mw-agent-matrix/0.1",
    locked: true,
    policyId: policy.id,
    encoderId: encoder.encoderId,
    projectionHash: encoder.projectionHash,
    seeds,
    trialOpts,
    mw: mw.trials,
    ema: Object.fromEntries(LOCK.emaFamily.map((alpha) => [String(alpha), ema[String(alpha)].trials])),
    stateless: stateless.trials,
    bestEma: best,
    substrate: inert,
    operators: attribution,
    note: "Not the primary experiment unless seeds==LOCK.seedCount and flag primary=true"
  };
}

module.exports = { runMatrix, loadSeeds };
