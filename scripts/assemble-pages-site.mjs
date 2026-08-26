import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = resolve(repositoryRoot, "_site");

if (relative(repositoryRoot, siteRoot) !== "_site") {
  throw new Error(`Refusing to replace unexpected Pages output path: ${siteRoot}`);
}

const sources = {
  rootRedirect: resolve(repositoryRoot, "apps/pages-root.html"),
  memoryWeather: resolve(repositoryRoot, "apps/memory-weather/dist/memory-weather.html"),
  memoryWeatherContract: resolve(repositoryRoot, "apps/memory-weather/docs/REALIZATION_CONTRACT.md"),
  simulator: resolve(repositoryRoot, "apps/simulator/dist"),
  memoryWeatherLab: resolve(repositoryRoot, "apps/memory-weather-lab/dist"),
  launcher: resolve(repositoryRoot, "apps/index.html"),
};

for (const [name, source] of Object.entries(sources)) {
  if (!existsSync(source)) {
    throw new Error(`Missing ${name} Pages input: ${relative(repositoryRoot, source)}`);
  }
}

rmSync(siteRoot, { recursive: true, force: true });
mkdirSync(resolve(siteRoot, "memory-weather"), { recursive: true });
mkdirSync(resolve(siteRoot, "docs"), { recursive: true });
mkdirSync(resolve(siteRoot, "simulator"), { recursive: true });
mkdirSync(resolve(siteRoot, "memory-weather-lab"), { recursive: true });
mkdirSync(resolve(siteRoot, "apps"), { recursive: true });

copyFileSync(sources.rootRedirect, resolve(siteRoot, "index.html"));
copyFileSync(sources.rootRedirect, resolve(siteRoot, "memory-weather.html"));
copyFileSync(sources.memoryWeather, resolve(siteRoot, "memory-weather/index.html"));
copyFileSync(sources.memoryWeatherContract, resolve(siteRoot, "docs/REALIZATION_CONTRACT.md"));
cpSync(sources.simulator, resolve(siteRoot, "simulator"), { recursive: true });
cpSync(sources.memoryWeatherLab, resolve(siteRoot, "memory-weather-lab"), { recursive: true });
copyFileSync(sources.launcher, resolve(siteRoot, "apps/index.html"));

const manifest = {
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

writeFileSync(resolve(siteRoot, "site-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log("Assembled Pages app suite:");
for (const route of manifest.routes) console.log(`- ${route.path} — ${route.identity}`);
