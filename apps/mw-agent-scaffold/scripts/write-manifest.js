"use strict";

const fs = require("fs");
const path = require("path");
const { PATHS } = require("../src/config.js");
const { sha256File } = require("../src/hashes.js");

const files = [
  "src/config.js",
  "src/encode.js",
  "src/packet.js",
  "src/gates.js",
  "src/hashes.js",
  "src/index.js",
  "src/runner.js",
  "src/harness.js",
  "src/verdicts.js",
  "src/substrates/mw.js",
  "src/substrates/ema.js",
  "src/policy/stub.js",
  "src/policy/prompt.js",
  "src/env/delayed_cue_bandit.js",
  "fixtures/LOCK.json",
  "fixtures/projection_P.json",
  "fixtures/embed_table.json",
  "fixtures/readout.json",
  "fixtures/seeds.json",
  "../memory-weather/src/engine.js",
  "../memory-weather/src/math.js"
];

const lines = files.map((rel) => {
  const abs = path.join(PATHS.root, rel);
  return `${sha256File(abs)}  ${rel}`;
});
fs.writeFileSync(PATHS.manifest, `${lines.join("\n")}\n`);
console.log(PATHS.manifest);
console.log(lines.join("\n"));
