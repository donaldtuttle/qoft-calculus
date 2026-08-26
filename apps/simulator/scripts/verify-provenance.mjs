import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const simulatorRoot = process.cwd();
const repositoryRoot = resolve(simulatorRoot, "../..");
const sessionSource = readFileSync(resolve(simulatorRoot, "src/session.ts"), "utf8");

function gitBlob(path) {
  const bytes = readFileSync(resolve(repositoryRoot, path));
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

function declaredPin(name) {
  const match = sessionSource.match(new RegExp(`${name}: "([0-9a-f]{40})"`));
  if (!match) throw new Error(`Missing 40-character ${name} provenance pin in src/session.ts`);
  return match[1];
}

const targets = [
  ["engineGitBlob", "src/engine.ts"],
  ["rootSkillGitBlob", "SKILL.md"],
];

for (const [name, path] of targets) {
  const declared = declaredPin(name);
  const actual = gitBlob(path);
  if (declared !== actual) {
    throw new Error(`${name} drifted: declared ${declared}, actual ${actual} for ${path}`);
  }
  console.log(`ok - ${path} provenance ${actual}`);
}
