"use strict";

const fs = require("fs");
const M = require("../../memory-weather/src/math.js");
const { LOCK, PATHS } = require("./config.js");
const { contentHash } = require("./hashes.js");

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function bound12(vec) {
  return M.boundVector(vec, LOCK.componentLimit, LOCK.radialLimit);
}

function project(embed, matrix) {
  if (embed.length !== LOCK.embedDim) throw new TypeError("embed dim mismatch");
  if (matrix.length !== LOCK.outDim || matrix[0].length !== LOCK.embedDim) {
    throw new TypeError("projection shape mismatch");
  }
  return bound12(M.matrixVector(matrix, embed));
}

function keyedEmbed(seed, stream, dim = LOCK.embedDim) {
  const raw = Array.from({ length: dim }, (_, i) =>
    M.keyedGaussian(seed, stream, 0, i)
  );
  return M.normalize(raw, 1);
}

function createEncoder(lockFiles = PATHS) {
  const projection = loadJson(lockFiles.projection);
  const embedTable = loadJson(lockFiles.embed);
  if (projection.matrix_hash !== contentHash(projection.matrix)) {
    throw new Error("projection matrix hash mismatch");
  }
  if (embedTable.table_hash !== contentHash(embedTable.table)) {
    throw new Error("embed table hash mismatch");
  }
  if (projection.embed_model_id !== embedTable.embed_model_id) {
    throw new Error("encoder / projection model id mismatch");
  }

  function embedObservation(obs) {
    if (obs.kind === "cue") {
      const row = embedTable.table[`cue:${obs.cueId}`];
      if (!row) throw new RangeError(`missing cue embedding ${obs.cueId}`);
      return row.slice();
    }
    if (obs.kind === "probe") return embedTable.table.probe.slice();
    if (obs.kind === "distract") {
      return keyedEmbed(obs.embedSeed, `distract:${obs.turn}:${obs.token}`);
    }
    throw new RangeError(`unsupported observation kind ${obs.kind}`);
  }

  function encode(obs) {
    const embed = embedObservation(obs);
    const u = project(embed, projection.matrix);
    return {
      embed,
      u,
      embedHash: contentHash(embed),
      uHash: contentHash(u),
      encoderId: embedTable.embed_model_id,
      projectionHash: projection.matrix_hash
    };
  }

  return {
    encode,
    embedObservation,
    projection,
    embedTable,
    encoderId: embedTable.embed_model_id,
    projectionHash: projection.matrix_hash
  };
}

module.exports = { bound12, project, keyedEmbed, createEncoder };
