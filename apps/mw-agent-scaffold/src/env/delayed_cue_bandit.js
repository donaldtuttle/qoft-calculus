"use strict";

const M = require("../../../memory-weather/src/math.js");
const { LOCK } = require("../config.js");
const { contentHash } = require("../hashes.js");

function createEpisode(seed, episodeIndex, distractors) {
  const cueId = M.keyedUint(seed, "cue-id", episodeIndex, 0) % LOCK.actionCount;
  const turns = [];
  turns.push({
    kind: "cue",
    cueId,
    turn: 0,
    token: `cue:${cueId}`,
    embedSeed: seed
  });
  for (let i = 0; i < distractors; i += 1) {
    turns.push({
      kind: "distract",
      cueId: null,
      turn: i + 1,
      token: String(M.keyedUint(seed, "distract-token", episodeIndex, i)),
      embedSeed: seed
    });
  }
  turns.push({
    kind: "probe",
    cueId: null,
    turn: distractors + 1,
    token: "probe",
    embedSeed: seed
  });
  return { cueId, turns, distractors, seed, episodeIndex };
}

function reward(obs, action, cueId) {
  if (obs.kind !== "probe") return null;
  return action === cueId ? 1 : 0;
}

function envHash(episode) {
  return contentHash({
    seed: episode.seed,
    episodeIndex: episode.episodeIndex,
    distractors: episode.distractors,
    cueId: episode.cueId,
    kinds: episode.turns.map((turn) => turn.kind)
  });
}

module.exports = { createEpisode, reward, envHash };
