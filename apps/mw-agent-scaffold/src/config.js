"use strict";

const path = require("path");

const ROOT = path.join(__dirname, "..");

const LOCK = Object.freeze({
  schema: "mw-agent-lock/0.1",
  scaffoldVersion: "0.1.0",
  engineId: "qosmos-memory-weather/mw-r12",
  engineVersion: "0.1.1",
  engineCommit: "782bd587ebb8c829ddfd901a4a9b0bce2379265b",
  engineSha256: "e559a8c187dd05403468d06520980dcd579179af31720ca26c7328a6801b1825",
  task: "delayed_cue_bandit",
  embedDim: 32,
  outDim: 12,
  actionCount: 4,
  componentLimit: 2,
  radialLimit: 2,
  projectionSeed: 20260827,
  embedSeed: 0x51e1d,
  episodesPerSeed: 8,
  primaryDistractors: 4,
  secondaryDistractors: Object.freeze([0, 2, 4]),
  seedCount: 20,
  emaFamily: Object.freeze([0.10, 0.24, 0.40, 0.70]),
  delta: 0.05,
  gateMode: "every_turn",
  memory: "off",
  policyId: "stub-cosine-prototypes/0.1",
  claim: "persistent task-relevant state under distraction"
});

const PATHS = Object.freeze({
  root: ROOT,
  fixtures: path.join(ROOT, "fixtures"),
  lock: path.join(ROOT, "fixtures", "LOCK.json"),
  projection: path.join(ROOT, "fixtures", "projection_P.json"),
  embed: path.join(ROOT, "fixtures", "embed_table.json"),
  readout: path.join(ROOT, "fixtures", "readout.json"),
  seeds: path.join(ROOT, "fixtures", "seeds.json"),
  manifest: path.join(ROOT, "MANIFEST.sha256"),
  engine: path.join(ROOT, "..", "memory-weather", "src", "engine.js"),
  math: path.join(ROOT, "..", "memory-weather", "src", "math.js")
});

module.exports = { LOCK, PATHS };
