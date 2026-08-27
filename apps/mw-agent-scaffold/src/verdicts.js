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

// Two-sided 95% Student-t critical values. Ruling made pre-execution:
// n=20 uses df=19, t=2.093. The previous 1.96 factor was a z approximation
// and is no longer used for the primary gate.
const T_CRIT_95 = Object.freeze({
  1: 12.706204736432096,
  2: 4.302652729749462,
  3: 3.182446305283708,
  4: 2.7764451051977934,
  5: 2.570581835636314,
  6: 2.4469118511449796,
  7: 2.364624251649617,
  8: 2.306004135204166,
  9: 2.262157162798205,
  10: 2.2281388519862735,
  11: 2.20098516009164,
  12: 2.178812829667228,
  13: 2.160368656462791,
  14: 2.144786687917803,
  15: 2.131449545559323,
  16: 2.1199052992212533,
  17: 2.1098155778333126,
  18: 2.100922040241039,
  19: 2.093024054408263,
  20: 2.085963447265858,
  24: 2.0638985617701447,
  30: 2.042272456301238
});

function tCriticalTwoSided95(df) {
  if (df < 1) throw new RangeError("t interval requires df >= 1");
  if (T_CRIT_95[df] != null) return T_CRIT_95[df];
  return 1.959963984540054;
}

function pairedInterval(diffs) {
  const n = diffs.length;
  const m = mean(diffs);
  if (n < 2) {
    return {
      n,
      mean: m,
      se: null,
      df: null,
      tCrit: null,
      intervalKind: "paired_t_95",
      ciLo: null,
      ciHi: null
    };
  }
  const variance = diffs.reduce((acc, d) => acc + (d - m) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  const df = n - 1;
  const tCrit = tCriticalTwoSided95(df);
  return {
    n,
    mean: m,
    se,
    df,
    tCrit,
    intervalKind: "paired_t_95",
    ciLo: m - tCrit * se,
    ciHi: m + tCrit * se
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
  tCriticalTwoSided95,
  bestEma,
  substrateInertness,
  operatorAttribution
};
