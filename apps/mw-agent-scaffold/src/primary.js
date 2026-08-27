"use strict";

const fs = require("fs");
const { PATHS } = require("./config.js");
const { sha256File, contentHash } = require("./hashes.js");
const { runMatrix } = require("./harness.js");

const EXPECTED = Object.freeze({
  seedCount: 20,
  episodesPerSeed: 8,
  primaryDistractors: 4,
  emaFamily: Object.freeze([0.1, 0.24, 0.4, 0.7]),
  gateMode: "every_turn",
  memory: "off",
  projection: "mw-fnv64:99b2347bba8d1c23",
  embed: "mw-fnv64:46023442e5d5d650",
  readout: "mw-fnv64:9a15a71e331c5fc7",
  seeds: "mw-fnv64:7bbb7bc888692c53",
  engineSha256: "e559a8c187dd05403468d06520980dcd579179af31720ca26c7328a6801b1825"
});

function numbersEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((value, i) => Number(value) === Number(b[i]));
}

function assertPrimaryPreconditions(options = {}, lockOverride = null) {
  if (options.authorizePrimary !== true) {
    throw new Error("PRIMARY_DENIED: missing explicit authorization");
  }
  const lock = lockOverride || JSON.parse(fs.readFileSync(PATHS.lock, "utf8"));
  if (lock.primary_experiment_armed !== true) {
    throw new Error("PRIMARY_DENIED: primary_experiment_armed is not true");
  }
  const seedDoc = JSON.parse(fs.readFileSync(PATHS.seeds, "utf8"));
  const projection = JSON.parse(fs.readFileSync(PATHS.projection, "utf8"));
  const embed = JSON.parse(fs.readFileSync(PATHS.embed, "utf8"));
  const readout = JSON.parse(fs.readFileSync(PATHS.readout, "utf8"));

  const failures = [];
  if (seedDoc.seeds.length !== EXPECTED.seedCount) failures.push("seed count");
  if (contentHash(seedDoc.seeds) !== EXPECTED.seeds) failures.push("seeds hash");
  if (lock.episodesPerSeed !== EXPECTED.episodesPerSeed) failures.push("episodesPerSeed");
  if (lock.primaryDistractors !== EXPECTED.primaryDistractors) failures.push("distractor depth");
  if (!numbersEqual(lock.emaFamily, EXPECTED.emaFamily)) failures.push("EMA family");
  if (lock.gateMode !== EXPECTED.gateMode) failures.push("gateMode");
  if (lock.memory !== EXPECTED.memory) failures.push("memory");
  if (sha256File(PATHS.engine) !== EXPECTED.engineSha256) failures.push("engine sha256");
  if (contentHash(projection.matrix) !== EXPECTED.projection) failures.push("projection hash");
  if (contentHash(embed.table) !== EXPECTED.embed) failures.push("embed hash");
  if (contentHash(readout.prototypes) !== EXPECTED.readout) failures.push("readout hash");
  if (lock.projection_hash !== EXPECTED.projection) failures.push("lock projection_hash");
  if (lock.embed_hash !== EXPECTED.embed) failures.push("lock embed_hash");
  if (lock.readout_hash !== EXPECTED.readout) failures.push("lock readout_hash");
  if (lock.seeds_hash !== EXPECTED.seeds) failures.push("lock seeds_hash");
  if (failures.length) {
    throw new Error(`PRIMARY_DENIED: lock mismatch (${failures.join(", ")})`);
  }
  return { lock, seeds: seedDoc.seeds.slice() };
}

function runPrimary(options = {}) {
  const checked = assertPrimaryPreconditions(options);
  return runMatrix({
    seeds: checked.seeds,
    episodes: EXPECTED.episodesPerSeed,
    distractors: EXPECTED.primaryDistractors,
    includeAttribution: true
  });
}

function main(argv) {
  const authorizePrimary = argv.includes("--authorize-primary");
  const result = runPrimary({ authorizePrimary });
  const text = `${JSON.stringify(result, null, 2)}\n`;
  process.stdout.write(text);
  return result;
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  EXPECTED,
  assertPrimaryPreconditions,
  runPrimary,
  main
};
