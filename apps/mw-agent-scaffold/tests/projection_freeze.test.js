"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { PATHS } = require("../src/config.js");
const { contentHash } = require("../src/hashes.js");

test("checked-in projection hash matches matrix", () => {
  const doc = JSON.parse(fs.readFileSync(PATHS.projection, "utf8"));
  assert.equal(doc.matrix_hash, contentHash(doc.matrix));
  assert.equal(doc.out_dim, 12);
  assert.equal(doc.matrix.length, 12);
});

test("mutating a copy changes the hash", () => {
  const doc = JSON.parse(fs.readFileSync(PATHS.projection, "utf8"));
  const copy = JSON.parse(JSON.stringify(doc.matrix));
  copy[0][0] += 0.01;
  assert.notEqual(contentHash(copy), doc.matrix_hash);
});
