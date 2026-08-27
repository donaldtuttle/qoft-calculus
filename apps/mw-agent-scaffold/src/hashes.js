"use strict";

const crypto = require("crypto");
const fs = require("fs");
const M = require("../../memory-weather/src/math.js");

function contentHash(value) {
  return M.contentHash(value);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex");
}

module.exports = { contentHash, sha256File, sha256Text };
