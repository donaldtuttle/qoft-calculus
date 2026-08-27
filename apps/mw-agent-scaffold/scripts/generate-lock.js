"use strict";

const fs = require("fs");
const path = require("path");
const M = require("../../memory-weather/src/math.js");
const { LOCK, PATHS } = require("../src/config.js");
const { contentHash, sha256File } = require("../src/hashes.js");
const { bound12, project, keyedEmbed } = require("../src/encode.js");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const seeds = [];
for (let i = 0; i < LOCK.seedCount; i += 1) {
  seeds.push(M.keyedUint(0x0a11, "trial-seed", i, 0));
}

const matrix = [];
for (let row = 0; row < LOCK.outDim; row += 1) {
  const raw = Array.from({ length: LOCK.embedDim }, (_, col) =>
    M.keyedGaussian(LOCK.projectionSeed, "P-row", row, col)
  );
  matrix.push(M.normalize(raw, 1));
}

const table = {
  probe: keyedEmbed(LOCK.embedSeed, "token:probe")
};
for (let cueId = 0; cueId < LOCK.actionCount; cueId += 1) {
  table[`cue:${cueId}`] = keyedEmbed(LOCK.embedSeed, `token:cue:${cueId}`);
}

const prototypes = [];
for (let cueId = 0; cueId < LOCK.actionCount; cueId += 1) {
  prototypes.push(project(table[`cue:${cueId}`], matrix));
}

const embedModelId = "mw-agent-fixture-embed/0.1";
const projectionDoc = {
  schema: "mw-agent-projection/0.1",
  embed_model_id: embedModelId,
  embed_dim: LOCK.embedDim,
  out_dim: LOCK.outDim,
  seed: LOCK.projectionSeed,
  matrix,
  matrix_hash: contentHash(matrix),
  bound: { componentLimit: LOCK.componentLimit, radialLimit: LOCK.radialLimit }
};
const embedDoc = {
  schema: "mw-agent-embed/0.1",
  embed_model_id: embedModelId,
  embed_dim: LOCK.embedDim,
  seed: LOCK.embedSeed,
  table,
  table_hash: contentHash(table)
};
const readoutDoc = {
  schema: "mw-agent-readout/0.1",
  policyId: LOCK.policyId,
  prototypes,
  readout_hash: contentHash(prototypes)
};
const seedDoc = {
  schema: "mw-agent-seeds/0.1",
  generator: "keyedUint(0x0a11, trial-seed, i, 0)",
  count: LOCK.seedCount,
  seeds
};

writeJson(PATHS.projection, projectionDoc);
writeJson(PATHS.embed, embedDoc);
writeJson(PATHS.readout, readoutDoc);
writeJson(PATHS.seeds, seedDoc);

const lockDoc = {
  ...LOCK,
  embed_model_id: embedModelId,
  projection_hash: projectionDoc.matrix_hash,
  embed_hash: embedDoc.table_hash,
  readout_hash: readoutDoc.readout_hash,
  seeds_hash: contentHash(seeds),
  engine_file_sha256: sha256File(PATHS.engine),
  generated: true,
  primary_experiment_armed: false
};
writeJson(PATHS.lock, lockDoc);

console.log(JSON.stringify({
  projection_hash: projectionDoc.matrix_hash,
  embed_hash: embedDoc.table_hash,
  readout_hash: readoutDoc.readout_hash,
  seeds_hash: lockDoc.seeds_hash,
  engine_file_sha256: lockDoc.engine_file_sha256
}, null, 2));
