"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const FORBIDDEN_STRINGS = Object.freeze([
  "consciousness",
  "interiority",
  "temperament",
  "autonomous agent",
  "entanglement",
  "insight basin"
]);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "tests") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(js|md|json)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

test("wrapper docs and source do not use forbidden claim language", () => {
  const root = path.join(__dirname, "..");
  const files = walk(root);
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8").toLowerCase();
    for (const phrase of FORBIDDEN_STRINGS) {
      if (text.includes(phrase)) hits.push(`${file}: ${phrase}`);
    }
  }
  assert.deepEqual(hits, []);
});
