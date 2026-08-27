"use strict";

const fs = require("fs");
const M = require("../../../memory-weather/src/math.js");
const { PATHS, LOCK } = require("../config.js");

function loadReadout(filePath = PATHS.readout) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function createStubPolicy(readout) {
  const spec = readout || loadReadout();
  if (spec.policyId !== LOCK.policyId) throw new Error("readout policyId mismatch");
  const prototypes = spec.prototypes;
  if (prototypes.length !== LOCK.actionCount) throw new Error("prototype count mismatch");

  function decide(input) {
    if (!input || !input.carrier || input.carrier.length !== 12) {
      throw new TypeError("stub policy requires carrier[12]");
    }
    if (input.obs && input.obs.kind !== "probe") return 0;
    let best = 0;
    let bestScore = -Infinity;
    for (let k = 0; k < prototypes.length; k += 1) {
      const score = M.cosine(input.carrier, prototypes[k]);
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    }
    return best;
  }

  return {
    id: spec.policyId,
    decide,
    prototypes,
    readoutHash: spec.readout_hash
  };
}

module.exports = { createStubPolicy, loadReadout };
