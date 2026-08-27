"use strict";

const { createEncoder } = require("./encode.js");
const { view, policyInput } = require("./packet.js");
const { createGate } = require("./gates.js");
const { createEpisode, reward, envHash } = require("./env/delayed_cue_bandit.js");
const { contentHash } = require("./hashes.js");
const { LOCK } = require("./config.js");

function runEpisode(substrate, policy, encoder, seed, episodeIndex, distractors, gateMode) {
  const episode = createEpisode(seed, episodeIndex, distractors);
  const gate = createGate(gateMode);
  substrate.reset();
  const turns = [];
  let probeCorrect = null;
  let probeReward = null;

  for (const obs of episode.turns) {
    const encoded = encoder.encode(obs);
    const updated = substrate.update(encoded.u);
    const collapseFlag = Boolean(updated.audit.collapse);
    const gateState = gate.decide(obs.turn, collapseFlag);
    const packetWrap = view(substrate.condition, obs.turn, updated.carrier, updated.audit, gateState);
    const input = policyInput(obs, updated.carrier);
    const action = gateState.open ? policy.decide(input) : 0;
    const r = reward(obs, action, episode.cueId);
    if (obs.kind === "probe") {
      probeReward = r;
      probeCorrect = r === 1;
    }
    turns.push({
      schema: "mw-agent-turn/0.1",
      condition: substrate.condition,
      seed,
      episodeIndex,
      turn: obs.turn,
      obs_hash: contentHash({ kind: obs.kind, token: obs.token, cueId: obs.cueId, turn: obs.turn }),
      embed_hash: encoded.embedHash,
      u_hash: encoded.uHash,
      substrate_digest: substrate.digest(),
      packet: packetWrap.packet,
      packet_hash: packetWrap.packetHash,
      policy_input: input,
      action,
      action_hash: contentHash(action),
      reward: r,
      env_hash: envHash(episode),
      gate_mode: gateMode
    });
  }

  return {
    schema: "mw-agent-trial-episode/0.1",
    condition: substrate.condition,
    seed,
    episodeIndex,
    distractors,
    cueId: episode.cueId,
    probe_correct: probeCorrect,
    probe_reward: probeReward,
    turns
  };
}

function runTrial(substrate, policy, encoder, seed, options = {}) {
  const episodes = options.episodes == null ? LOCK.episodesPerSeed : options.episodes;
  const distractors = options.distractors == null ? LOCK.primaryDistractors : options.distractors;
  const gateMode = options.gateMode || LOCK.gateMode;
  const results = [];
  for (let episodeIndex = 0; episodeIndex < episodes; episodeIndex += 1) {
    results.push(runEpisode(substrate, policy, encoder, seed, episodeIndex, distractors, gateMode));
  }
  const hits = results.filter((item) => item.probe_correct).length;
  return {
    schema: "mw-agent-trial/0.1",
    condition: substrate.condition,
    substrateId: substrate.id,
    seed,
    task: LOCK.task,
    distractors,
    episodes,
    probe_accuracy: hits / results.length,
    mean_reward: results.reduce((sum, item) => sum + (item.probe_reward || 0), 0) / results.length,
    episodes_detail: results
  };
}

module.exports = { runEpisode, runTrial };
