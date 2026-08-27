"use strict";

const M = require("../../../memory-weather/src/math.js");
const { LOCK } = require("../config.js");
const { contentHash } = require("../hashes.js");
const { ZERO12 } = require("../packet.js");

function createEma(alpha, dimension = LOCK.outDim) {
  if (!LOCK.emaFamily.includes(alpha)) {
    throw new RangeError(`alpha ${alpha} is not in the preregistered EMA family`);
  }
  let x = Array(dimension).fill(0);
  let t = 0;
  return {
    id: `EMA_CONTROL:${alpha}`,
    condition: "EMA_CONTROL",
    alpha,
    reset() {
      x = Array(dimension).fill(0);
      t = 0;
    },
    update(u) {
      x = M.boundVector(
        x.map((value, i) => (1 - alpha) * value + alpha * u[i]),
        LOCK.componentLimit,
        LOCK.radialLimit
      );
      t += 1;
      return {
        carrier: x.slice(),
        audit: {
          rho: null,
          gamma_mag: null,
          basin_id: null,
          collapse: null,
          theta_refs: []
        }
      };
    },
    digest() {
      return contentHash({ x, t, alpha });
    },
    snapshot() {
      return { x: x.slice(), t, alpha };
    }
  };
}

function createStateless() {
  let t = 0;
  return {
    id: "STATELESS",
    condition: "STATELESS",
    reset() { t = 0; },
    update() {
      t += 1;
      return {
        carrier: ZERO12.slice(),
        audit: {
          rho: null,
          gamma_mag: null,
          basin_id: null,
          collapse: null,
          theta_refs: []
        }
      };
    },
    digest() {
      return contentHash({ condition: "STATELESS", t });
    },
    snapshot() {
      return { x: ZERO12.slice(), t };
    }
  };
}

module.exports = { createEma, createStateless };
