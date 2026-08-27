"use strict";

const Engine = require("../../../memory-weather/src/engine.js");

function auditFrom(state) {
  const frame = state.frames[state.frames.length - 1];
  const recall = frame && frame.applied_recall;
  return {
    rho: frame ? frame.rho : state.psi.coherence,
    gamma_mag: frame ? frame.gamma_mag : 0,
    basin_id: state.psi.basinId == null ? null : state.psi.basinId,
    collapse: frame ? Boolean(frame.collapse_triggered) : false,
    theta_refs: recall
      ? [{ id: recall.packetId || recall.memoryId, similarity: recall.similarity }]
      : []
  };
}

function make(seed, extraAblations, id) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError("MW substrate seed must be an unsigned 32-bit integer");
  }
  const ablations = { coupling: false, ...extraAblations };
  let state = Engine.createState({ seed, stimulusAmplitude: 1, ablations });
  return {
    id,
    condition: "MW",
    reset() {
      state = Engine.createState({ seed, stimulusAmplitude: 1, ablations });
    },
    update(u) {
      Engine.step(state, { forcingVector: u.slice(), stimulusAmplitude: 1 });
      return { carrier: state.psi.latent.slice(), audit: auditFrom(state) };
    },
    digest() {
      return Engine.stateDigest(state);
    },
    snapshot() {
      return { digest: Engine.stateDigest(state), psiHash: state.currentHash, step: state.ctx.step };
    }
  };
}

function createMw(seed) {
  return make(seed, {}, "MW");
}

function createMwAblated(seed, ablations) {
  const keys = Object.keys(ablations).sort().join(",");
  return make(seed, ablations, `MW_ABLATED:${keys}`);
}

module.exports = {
  createMw,
  createMwAblated,
  ENGINE_VERSION: Engine.ENGINE_VERSION,
  ENGINE_ID: Engine.ENGINE_ID
};
