"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { PATHS } = require("../src/config.js");
const { sha256File } = require("../src/hashes.js");

test("MANIFEST.sha256 matches current committed-path bytes", () => {
  const lines = fs.readFileSync(PATHS.manifest, "utf8").trim().split("\n");
  assert.ok(lines.length >= 20);
  for (const line of lines) {
    const [digest, rel] = line.split(/\s+/, 2);
    const abs = path.join(PATHS.root, rel);
    assert.equal(sha256File(abs), digest, rel);
  }
});
