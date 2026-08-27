"use strict";

const { LOCK } = require("./config.js");

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function pairedDiffs(mwBySeed, controlBySeed, seeds) {
  return seeds.map((seed) => {
    const key = String(seed);
    if (!(key in mwBySeed) || !(key in controlBySeed)) {
      throw new Error(`missing seed ${seed} in paired comparison`);
    }
    return mwBySeed[key] - controlBySeed[key];
  });
}

function pairedInterval(diffs) {
  const n = diffs.length;
  const m = mean(diffs);
  if (n < 2) return { n, mean: m, se: null, ciLo: null, ciHi: null };
  const variance = diffs.reduce((acc, d) => acc + (d - m) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  return {
    n,
    mean: m,
    se,
    ciLo: m - 1.96 * se,
    ciHi: m + 1.96 * se
  };
}

function bestEma(emaAccuracies) {
  let bestAlpha = LOCK.emaFamily[0];
  let bestMean = -Infinity;
  for (const alpha of LOCK.emaFamily) {
    const values = Object.values(emaAccuracies[String(alpha)] || {});
    if (!values.length) continue;
    const m = mean(values);
    if (m > bestMean) {
      bestMean = m;
      bestAlpha = alpha;
    }
  }
  return { alpha: bestAlpha, mean: bestMean };
}

function substrateInertness(mwBySeed, bestEmaBySeed, seeds) {
  const diffs = pairedDiffs(mwBySeed, bestEmaBySeed, seeds);
  const interval = pairedInterval(diffs);
  const advantage = interval.mean >= LOCK.delta && interval.ciLo != null && interval.ciLo > 0;
  return {
    verdict: advantage ? "MW_ADVANTAGE" : "SUBSTRATE_INERT",
    primaryGate: {
      meanDiff: interval.mean,
      delta: LOCK.delta,
      ciLo: interval.ciLo,
      ciHi: interval.ciHi,
      requireMean: LOCK.delta,
      requireCiLoPositive: true
    },
    diffs,
    interval
  };
}

function operatorAttribution(mwBySeed, ablatedBySeed, bestEmaBySeed, seeds) {
  const full = substrateInertness(mwBySeed, bestEmaBySeed, seeds);
  const ablated = substrateInertness(ablatedBySeed, bestEmaBySeed, seeds);
  const removed = full.verdict === "MW_ADVANTAGE" && ablated.verdict === "SUBSTRATE_INERT";
  return {
    verdict: full.verdict !== "MW_ADVANTAGE"
      ? "NO_ADVANTAGE_TO_ATTRIBUTE"
      : removed
        ? "OPERATORS_ACCOUNT_FOR_GAP"
        : "GAP_SURVIVES_OPERATOR_ABLATION",
    full,
    ablated
  };
}

module.exports = {
  mean,
  pairedDiffs,
  pairedInterval,
  bestEma,
  substrateInertness,
  operatorAttribution
};
