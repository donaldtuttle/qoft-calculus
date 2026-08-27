import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = resolve(repositoryRoot, "_site");

const requiredFiles = [
  "index.html",
  "memory-weather.html",
  "site-manifest.json",
  "apps/index.html",
  "memory-weather/index.html",
  "docs/REALIZATION_CONTRACT.md",
  "simulator/index.html",
  "simulator/probe.html",
  "memory-weather-lab/index.html",
];

for (const path of requiredFiles) {
  const absolute = resolve(siteRoot, path);
  if (!existsSync(absolute) || statSync(absolute).size === 0) {
    throw new Error(`Missing or empty Pages output: ${path}`);
  }
}

const manifest = JSON.parse(readFileSync(resolve(siteRoot, "site-manifest.json"), "utf8"));
const expectedManifest = {
  schemaVersion: "qoft-pages-site/v1",
  hostingOnly: true,
  routes: [
    {
      path: "/",
      source: "apps/pages-root.html",
      identity: "Compatibility redirect to /memory-weather/; no engine",
    },
    {
      path: "/memory-weather.html",
      source: "apps/pages-root.html",
      identity: "Compatibility redirect to /memory-weather/; no engine",
    },
    {
      path: "/memory-weather/",
      source: "apps/memory-weather/dist/memory-weather.html",
      identity: "Memory Weather v0.1.1 DEVELOP typed realization",
    },
    {
      path: "/simulator/",
      source: "apps/simulator/dist/index.html",
      identity: "Public Typed Realization A simulator",
    },
    {
      path: "/simulator/probe.html",
      source: "apps/simulator/dist/probe.html",
      identity: "Public Typed Realization A compact probe; fallback disabled",
    },
    {
      path: "/memory-weather-lab/",
      source: "apps/memory-weather-lab/dist/index.html",
      identity: "React viewport of Memory Weather v0.1.1",
    },
    {
      path: "/apps/",
      source: "apps/index.html",
      identity: "Hosting launcher; no engine",
    },
  ],
};
if (JSON.stringify(manifest) !== JSON.stringify(expectedManifest)) {
  throw new Error("Pages site manifest does not declare the reviewed route contract");
}

const rootHtml = readFileSync(resolve(siteRoot, "index.html"), "utf8");
const aliasHtml = readFileSync(resolve(siteRoot, "memory-weather.html"), "utf8");
const sourceRootHtml = readFileSync(resolve(repositoryRoot, "apps/pages-root.html"), "utf8");
if (rootHtml !== sourceRootHtml || aliasHtml !== sourceRootHtml) {
  throw new Error("Root and compatibility alias must exactly match the reviewed Memory Weather redirect");
}
const redirectFragments = [
  '<meta http-equiv="refresh" content="0; url=./memory-weather/">',
  'new URL("./memory-weather/", window.location.href)',
  'target.search = window.location.search;',
  'target.hash = window.location.hash;',
  'window.location.replace(target);',
  '<a href="./memory-weather/">QOSMOS Memory Weather</a>',
];
for (const fragment of redirectFragments) {
  if (!sourceRootHtml.includes(fragment)) {
    throw new Error(`Memory Weather redirect source is missing its reviewed contract: ${fragment}`);
  }
}
if (sourceRootHtml.split("./memory-weather/").length - 1 !== 3) {
  throw new Error("Memory Weather redirect source must declare exactly three matching route targets");
}

const sourceMemoryWeather = readFileSync(
  resolve(repositoryRoot, "apps/memory-weather/dist/memory-weather.html"),
);
const deployedMemoryWeather = readFileSync(resolve(siteRoot, "memory-weather/index.html"));
if (!sourceMemoryWeather.equals(deployedMemoryWeather)) {
  throw new Error("Deployed Memory Weather bytes differ from the manifest-covered standalone artifact");
}

const memoryWeatherManifest = readFileSync(
  resolve(repositoryRoot, "apps/memory-weather/MANIFEST.sha256"),
  "utf8",
);
const memoryWeatherPin = memoryWeatherManifest.match(
  /^([0-9a-f]{64})  dist\/memory-weather\.html$/m,
)?.[1];
const deployedMemoryWeatherHash = createHash("sha256").update(deployedMemoryWeather).digest("hex");
if (!memoryWeatherPin || deployedMemoryWeatherHash !== memoryWeatherPin) {
  throw new Error("Deployed Memory Weather bytes do not match MANIFEST.sha256");
}

const launcher = readFileSync(resolve(siteRoot, "apps/index.html"), "utf8");
const sourceLauncher = readFileSync(resolve(repositoryRoot, "apps/index.html"), "utf8");
if (launcher !== sourceLauncher) throw new Error("Deployed app launcher differs from its reviewed source");
for (const requiredLink of [
  "../memory-weather/",
  "../simulator/",
  "../simulator/probe.html",
  "../memory-weather-lab/",
]) {
  if (!launcher.includes(`href="${requiredLink}"`)) {
    throw new Error(`App launcher is missing ${requiredLink}`);
  }
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = resolve(directory, entry.name);
    if (lstatSync(absolute).isSymbolicLink()) {
      throw new Error(`Pages artifact must not contain a symlink: ${relative(siteRoot, absolute)}`);
    }
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const allowedExternalReferences = new Map([
  ["index.html", new Set([
    "https://donaldtuttle.github.io/qoft-calculus/memory-weather/",
  ])],
  ["memory-weather.html", new Set([
    "https://donaldtuttle.github.io/qoft-calculus/memory-weather/",
  ])],
  ["apps/index.html", new Set([
    "https://github.com/donaldtuttle/qoft-calculus/tree/main/apps/",
  ])],
  ["memory-weather-lab/index.html", new Set([
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap",
  ])],
]);

const referencedLocalFiles = new Set();

function assertLocalReference(owner, rawReference) {
  const ownerName = relative(siteRoot, owner);
  if (rawReference.startsWith("#")) return;
  if (/^[a-z][a-z0-9+.-]*:/i.test(rawReference) || rawReference.startsWith("//")) {
    if (!allowedExternalReferences.get(ownerName)?.has(rawReference)) {
      throw new Error(`Unapproved external reference ${rawReference} in ${ownerName}`);
    }
    return;
  }
  const reference = rawReference.split("#", 1)[0].split("?", 1)[0];
  if (!reference) return;
  if (reference.startsWith("/")) {
    throw new Error(`Root-absolute URL ${reference} is not repository-subpath safe in ${relative(siteRoot, owner)}`);
  }

  let target = resolve(dirname(owner), reference);
  if (reference.endsWith("/") || (existsSync(target) && statSync(target).isDirectory())) {
    target = resolve(target, "index.html");
  }
  const siteRelative = relative(siteRoot, target);
  if (siteRelative === ".." || siteRelative.startsWith(`..${sep}`) || !existsSync(target)) {
    throw new Error(`Broken local reference ${rawReference} in ${relative(siteRoot, owner)}`);
  }
  referencedLocalFiles.add(target);
  return target;
}

const files = walk(siteRoot);
const htmlFiles = files.filter((path) => extname(path) === ".html");
const cssFiles = files.filter((path) => extname(path) === ".css");
const referencesByPage = new Map();

function assertCopiedTree(sourceRoot, deployedRoot, label) {
  const sourceFiles = walk(sourceRoot).map((file) => relative(sourceRoot, file)).sort();
  const deployedFiles = walk(deployedRoot).map((file) => relative(deployedRoot, file)).sort();
  if (JSON.stringify(sourceFiles) !== JSON.stringify(deployedFiles)) {
    throw new Error(`${label} deployed file set differs from its fresh production build`);
  }
  for (const path of sourceFiles) {
    const source = readFileSync(resolve(sourceRoot, path));
    const deployed = readFileSync(resolve(deployedRoot, path));
    if (!source.equals(deployed)) {
      throw new Error(`${label} deployed bytes differ from its fresh production build: ${path}`);
    }
  }
}

assertCopiedTree(
  resolve(repositoryRoot, "apps/simulator/dist"),
  resolve(siteRoot, "simulator"),
  "Simulator",
);
assertCopiedTree(
  resolve(repositoryRoot, "apps/memory-weather-lab/dist"),
  resolve(siteRoot, "memory-weather-lab"),
  "Memory Weather Lab",
);

const sourceContract = readFileSync(
  resolve(repositoryRoot, "apps/memory-weather/docs/REALIZATION_CONTRACT.md"),
);
const deployedContract = readFileSync(resolve(siteRoot, "docs/REALIZATION_CONTRACT.md"));
if (!sourceContract.equals(deployedContract)) {
  throw new Error("Deployed Memory Weather contract differs from its reviewed source");
}

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, "utf8");
  if (/<base\b/i.test(html)) {
    throw new Error(`Base URLs are not allowed in ${relative(siteRoot, htmlFile)}`);
  }
  const references = [];
  for (const tagMatch of html.matchAll(/<[a-z][^>]*>/gi)) {
    for (const match of tagMatch[0].matchAll(
      /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
    )) {
      const reference = match[1] ?? match[2] ?? match[3] ?? "";
      const target = assertLocalReference(htmlFile, reference);
      if (target) references.push(target);
    }
  }
  for (const styleMatch of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const urlMatch of styleMatch[1].matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      const target = assertLocalReference(htmlFile, urlMatch[1]);
      if (target) references.push(target);
    }
  }
  referencesByPage.set(relative(siteRoot, htmlFile), references);
}

for (const cssFile of cssFiles) {
  const css = readFileSync(cssFile, "utf8");
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    assertLocalReference(cssFile, match[1]);
  }
}

function requireBuiltAsset(page, extension) {
  const references = referencesByPage.get(page) ?? [];
  if (!references.some((path) => path.endsWith(extension))) {
    throw new Error(`${page} does not reference a built ${extension} asset`);
  }
}

requireBuiltAsset("simulator/index.html", ".js");
requireBuiltAsset("simulator/index.html", ".css");
requireBuiltAsset("simulator/probe.html", ".js");
requireBuiltAsset("memory-weather-lab/index.html", ".js");
requireBuiltAsset("memory-weather-lab/index.html", ".css");

const requiredSet = new Set(requiredFiles);
for (const file of files) {
  const name = relative(siteRoot, file);
  if (requiredSet.has(name)) continue;
  const isBuiltAsset = name.startsWith(`simulator${sep}assets${sep}`)
    || name.startsWith(`memory-weather-lab${sep}assets${sep}`);
  if (!isBuiltAsset) throw new Error(`Unexpected file in Pages artifact: ${name}`);
  if (file.endsWith(".js") || file.endsWith(".css")) {
    if (!referencedLocalFiles.has(file)) throw new Error(`Orphan or stale built asset: ${name}`);
  } else if (file.endsWith(".js.map")) {
    const bundle = file.slice(0, -4);
    if (!existsSync(bundle) || !referencedLocalFiles.has(bundle)) {
      throw new Error(`Orphan or stale source map: ${name}`);
    }
  } else {
    throw new Error(`Unexpected built asset type: ${name}`);
  }
}

const simulatorScanned = files
  .filter((file) => relative(siteRoot, file).startsWith("simulator/")
    && [".html", ".js", ".map"].includes(extname(file)))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const forbiddenSimulatorPatterns = [
  [/C\s*[—-]\s*standalone fallback/iu, "Realization C fallback label"],
  [/FALLBACK ENGINE/iu, "inline fallback engine block"],
  [/\bbindRealEngine\b/u, "legacy dynamic engine seam"],
  [/\breturn\s+Fallback\b/u, "fallback return path"],
  [/\bengine\s*:\s*["']inline["']/iu, "inline engine metadata"],
  [/\b(?:fNewSession|fStep|fView)\b/u, "stand-in engine function"],
];
for (const [pattern, label] of forbiddenSimulatorPatterns) {
  if (pattern.test(simulatorScanned)) throw new Error(`Simulator contains forbidden ${label}`);
}
if (/fallback\s*[:=]\s*(?:true|!0)\b/iu.test(simulatorScanned)) {
  throw new Error("Simulator contains an enabled fallback flag");
}

const simulatorJavaScript = files
  .filter((file) => relative(siteRoot, file).startsWith("simulator/") && extname(file) === ".js")
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
if (!simulatorJavaScript.includes("QosmosSession.step/tick → xiStep")) {
  throw new Error("Simulator build is missing the wired Realization A transition marker");
}

console.log(`ok - ${expectedManifest.routes.length} Pages routes declared`);
console.log(`ok - ${htmlFiles.length} HTML files and ${cssFiles.length} CSS files have resolvable local references`);
console.log(`ok - ${files.length} artifact files are closed, source-matched, Memory Weather manifest-pinned, and fallback-free`);
