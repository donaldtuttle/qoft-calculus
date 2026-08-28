import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function write(relative, content) {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
}

function replaceExact(relative, from, to, expected = 1) {
  let source = read(relative);
  const count = source.split(from).length - 1;
  if (count !== expected) {
    throw new Error(`${relative}: expected ${expected} occurrence(s), found ${count}: ${from.slice(0, 120)}`);
  }
  source = source.split(from).join(to);
  write(relative, source);
}

function replaceMany(relative, replacements) {
  let source = read(relative);
  for (const [from, to, expected = 1] of replacements) {
    const count = source.split(from).length - 1;
    if (count !== expected) {
      throw new Error(`${relative}: expected ${expected} occurrence(s), found ${count}: ${from.slice(0, 120)}`);
    }
    source = source.split(from).join(to);
  }
  write(relative, source);
}

const standaloneHtml = "apps/memory-weather/index.html";
replaceMany(standaloneHtml, [
  [
    '<meta name="description" content="Deterministic R12 QOSMOS observer-field simulation with projection provenance.">',
    '<meta name="description" content="Deterministic R12 state-dynamics instrument with memory-conditioned updates, auditable telemetry, and projection provenance.">'
  ],
  [
    "<small>QOSMOS R¹² observer-field lab</small>",
    "<small>R¹² state-dynamics instrument</small>"
  ],
  [
    '<span class="status-chip">typed realization</span>',
    '<span class="status-chip">v0.1.1 engine · clarified labels</span>'
  ],
  [
    '<div><span class="eyebrow">Live telemetry</span><h2>Ψmeta</h2></div>',
    '<div><span class="eyebrow">Live measurements</span><h2>Diagnostic telemetry Ψmeta</h2></div>'
  ],
  ["<span>Coherence ρ</span>", "<span>Coherence measure ρ</span>"],
  ["<span>Flux energy Φ</span>", "<span>Contextual forcing Φ</span>"],
  ["<span>Gradient ‖Γ‖</span>", "<span>Update magnitude ‖Γ‖</span>"],
  ["<span>Reflex confidence</span>", "<span>Reflexive-state alignment</span>"],
  [
    '<div><strong id="weatherLabel">Unformed field</strong><small id="weatherRationale">No committed tick yet</small></div>\n            <span class="source-badge interpretive">metaphor</span>',
    '<div>\n              <strong id="weatherLabel">No measured regime</strong>\n              <small id="weatherRationale">No committed simulation tick is available yet.</small>\n              <small class="weather-alias" id="weatherAlias">Weather alias: Unformed field</small>\n            </div>\n            <span class="source-badge derived">regime view</span>'
  ],
  [
    '<div class="section-heading"><div><span class="eyebrow">Viewport</span><h2>Layer rack</h2></div></div>',
    '<div class="section-heading"><div><span class="eyebrow">Viewport</span><h2>Measured layers</h2></div></div>'
  ],
  ['<option value="weather">Weather composite</option>', '<option value="weather">Regime composite</option>'],
  ['<option value="rho">ρ coherence</option>', '<option value="rho">Coherence measure ρ</option>'],
  ['<option value="fronts">Field fronts</option>', '<option value="fronts">Update fronts Γ</option>'],
  ['<option value="theta">Θλ influence</option>', '<option value="theta">Memory influence Θλ</option>'],
  ['<option value="lambda">Λψ readiness</option>', '<option value="lambda">Commitment readiness Λψ</option>'],
  ['<option value="separation">ψ ↔ ψᴽ separation</option>', '<option value="separation">Reflexive separation ψ ↔ ψᴽ</option>'],
  ['<span>Scalar field</span>', '<span>Scalar regime map</span>'],
  ['<span>Γ vectors</span>', '<span>Update vectors Γ</span>'],
  ['<span>ψ trace</span>', '<span>State trace ψ</span>'],
  ['<span>ψᴽ separation</span>', '<span>Reflexive separation ψ ↔ ψᴽ</span>'],
  ['<span>Basins</span>', '<span>Attractor regions</span>'],
  ['<span>Λψ contour</span>', '<span>Commitment boundary Λψ</span>'],
  ['<span>Θλ links</span>', '<span>Memory replay links Θλ</span>'],
  ['<span>Events</span>', '<span>Recorded events</span>'],
  ['<span>Grid</span>', '<span>Projection grid</span>'],
  [
    '<div class="section-heading"><div><span class="eyebrow">Observation</span><h2>Φ forcing</h2></div></div>',
    '<div class="section-heading"><div><span class="eyebrow">Observation</span><h2>Contextual forcing Φ</h2></div></div>'
  ],
  ["Basin target", "Attractor target"],
  [
    '<div class="section-heading"><div><span class="eyebrow">DEVELOP extension</span><h2>Multi-observer projection</h2></div><span class="source-badge derived">local</span></div>',
    '<div class="section-heading"><div><span class="eyebrow">DEVELOP extension</span><h2>Multi-observer coupling</h2></div><span class="source-badge derived">local</span></div>'
  ],
  ['<span>Λψ collapse</span>', '<span>Commitment projection Λψ</span>'],
  ['<span>Memory write</span>', '<span>Memory writing</span>'],
  ['<span>Θλ replay</span>', '<span>Memory replay Θλ</span>'],
  ['<span>Σ◯ summary</span>', '<span>Trace summarization Σ◯</span>'],
  ['<span>Ωµ modulation</span>', '<span>Bounded modulation Ωµ</span>'],
  ['<span>ρ gate</span>', '<span>Coherence gate ρ</span>'],
  ['<span>Πᴽ adaptation</span>', '<span>Reflexive adaptation Πᴽ</span>'],
  ['data-view="weather" aria-pressed="true">Memory Weather</button>', 'data-view="weather" aria-pressed="true">Regime Map</button>'],
  [
    'aria-label="Memory Weather viewport. The field has not run yet."',
    'aria-label="Memory Weather regime viewport. No measured simulation tick is available yet."'
  ],
  ['<span id="collapseCount">0 Λψ</span>', '<span id="collapseCount">0 commitments Λψ</span>'],
  ['<span id="memoryCount">0 writes</span>', '<span id="memoryCount">0 memory records</span>'],
  ['<span id="summaryCount">0 Σ◯</span>', '<span id="summaryCount">0 summaries Σ◯</span>'],
  ['<button id="inscribeBtn" class="primary" type="button">Inscribe memory</button>', '<button id="inscribeBtn" class="primary" type="button">Record memory</button>'],
  ['<button id="recallBtn" type="button">Recall Θλ</button>', '<button id="recallBtn" type="button">Queue memory replay Θλ</button>'],
  ['<button id="collapseBtn" class="full-width warning" type="button">Request Λψ on next tick</button>', '<button id="collapseBtn" class="full-width warning" type="button">Request commitment projection Λψ</button>']
]);

for (const cssFile of ["apps/memory-weather/styles.css", "apps/memory-weather-lab/src/styles.css"]) {
  replaceExact(
    cssFile,
    ".weather-callout small { margin-top: 0.12rem; font-size: 0.64rem; line-height: 1.25; }\n",
    ".weather-callout small { margin-top: 0.12rem; font-size: 0.64rem; line-height: 1.25; }\n.weather-callout .weather-alias { color: var(--dim); font-size: 0.59rem; letter-spacing: 0.02em; }\n"
  );
}

const weatherPresentationJs = `  const WEATHER_PRESENTATION = Object.freeze({
    initial: {
      label: "No measured regime",
      rationale: "No committed simulation tick is available yet."
    },
    "collapse-clearing": {
      label: "Commitment event registered",
      rationale: "A commitment projection Λψ was applied and recorded on this tick."
    },
    "stable-high": {
      label: "Coherent low-update regime",
      rationale: "Coherence ρ is high while update magnitude ‖Γ‖ remains low."
    },
    "shear-front": {
      label: "High-drive regime",
      rationale: "Contextual forcing Φ and update magnitude ‖Γ‖ are elevated."
    },
    "collapse-watch": {
      label: "Commitment condition active",
      rationale: "The Λψ readiness condition is active; dwell or hold rules may still prevent commitment."
    },
    "memory-front": {
      label: "Recall-influenced regime",
      rationale: "A memory replay packet Θλ is influencing the current update."
    },
    variable: {
      label: "Mixed dynamical regime",
      rationale: "No specialized deterministic regime rule matched the current telemetry."
    }
  });

  const FEATURE_LABELS = Object.freeze({
    "weather-composite": "Regime composite",
    "attractor-potential": "Attractor potential",
    "rho-field": "Coherence field ρ",
    "gamma-vectors": "Context-conditioned update Γ",
    "memory-influence": "Memory influence Θλ",
    "collapse-surface": "Commitment readiness Λψ",
    "psi-reflex": "Reflexive separation ψ ↔ ψᴽ",
    "event-markers": "Recorded events",
    "multi-observer-coupling": "Multi-observer coupling"
  });

  function presentWeather(weather) {
    const source = weather || {
      id: "initial",
      label: "Unformed field",
      rationale: "No committed tick yet"
    };
    const presentation = WEATHER_PRESENTATION[source.id] || {
      label: source.label || "Measured regime",
      rationale: source.rationale || "Derived from the current telemetry."
    };
    return {
      ...presentation,
      alias: source.label || source.id || "Unformed field"
    };
  }

`;
replaceExact(
  "apps/memory-weather/src/app.js",
  '  const M = window.MWMath;\n\n',
  `  const M = window.MWMath;\n\n${weatherPresentationJs}`
);

replaceMany("apps/memory-weather/src/app.js", [
  [
    '      const message = `Λψ committed at tick ${result.frame.step}, basin ${event ? event.basinLabel : "unknown"}.`;',
    '      const message = `Commitment projection Λψ registered at tick ${result.frame.step}, attractor region ${event ? event.basinLabel : "unknown"}.`;'
  ],
  [
    '    const weather = frame ? frame.weather : { label: "Unformed field", rationale: "No committed tick yet" };\n    setText("weatherLabel", weather.label);\n    setText("weatherRationale", weather.rationale);',
    '    const sourceWeather = frame ? frame.weather : { id: "initial", label: "Unformed field", rationale: "No committed tick yet" };\n    const weather = presentWeather(sourceWeather);\n    setText("weatherLabel", weather.label);\n    setText("weatherRationale", weather.rationale);\n    setText("weatherAlias", `Weather alias: ${weather.alias}`);'
  ],
  ['setText("collapseCount", `${state.counters.collapse} Λψ`);', 'setText("collapseCount", `${state.counters.collapse} commitments Λψ`);'],
  ['setText("memoryCount", `${state.counters.memoryWrites} writes`);', 'setText("memoryCount", `${state.counters.memoryWrites} memory records`);'],
  ['setText("summaryCount", `${state.counters.summaries} Σ◯`);', 'setText("summaryCount", `${state.counters.summaries} summaries Σ◯`);'],
  [
    'canvas.setAttribute("aria-label", `${weather.label}. Tick ${state.ctx.step}. Coherence ${format(state.psi.coherence, 2)}. ${state.events.length} committed events. ${state.memories.length} memory inscriptions.${peerState ? ` Observer B coherence ${format(peerState.psi.coherence, 2)}.` : ""}`);',
    'canvas.setAttribute("aria-label", `${weather.label}, weather alias ${weather.alias}. Tick ${state.ctx.step}. Coherence ${format(state.psi.coherence, 2)}. ${state.events.length} recorded events. ${state.memories.length} memory records.${peerState ? ` Observer B coherence ${format(peerState.psi.coherence, 2)}.` : ""}`);'
  ],
  ['option.textContent = record.label;', 'option.textContent = FEATURE_LABELS[record.feature_id] || record.label;'],
  ['empty.textContent = "No inscriptions yet. Σ◯ summaries remain a separate mechanism.";', 'empty.textContent = "No memory records yet. Trace summaries Σ◯ remain a separate mechanism.";'],
  ['if (event.kind === "collapse") return `Λψ · ${event.basinLabel}`;', 'if (event.kind === "collapse") return `Commitment Λψ · ${event.basinLabel}`;'],
  ['if (event.kind === "memory-write") return `Write · ${event.label}`;', 'if (event.kind === "memory-write") return `Memory record · ${event.label}`;'],
  ['if (event.kind === "summary") return "Σ◯ · mesh node";', 'if (event.kind === "summary") return "Summary Σ◯ · mesh node";'],
  ['if (event.kind === "basin-transition") return `Basin · ${event.toBasinLabel}`;', 'if (event.kind === "basin-transition") return `Attractor region · ${event.toBasinLabel}`;'],
  [
    'readout.textContent = `forcing target (${point.x.toFixed(2)}, ${point.y.toFixed(2)}) · ρ ${sample.coherence.toFixed(3)} · Λ margin ${sample.collapseMargin.toFixed(3)} · next tick`;',
    'readout.textContent = `forcing target (${point.x.toFixed(2)}, ${point.y.toFixed(2)}) · coherence ρ ${sample.coherence.toFixed(3)} · commitment margin Λψ ${sample.collapseMargin.toFixed(3)} · next tick`;'
  ],
  ['showToast(`Inscribed “${result.memory.label}” as a local memory artifact.`);', 'showToast(`Recorded “${result.memory.label}” as a local memory artifact.`);'],
  ['showToast(packet ? `Θλ queued “${packet.label}” at similarity ${packet.similarity.toFixed(3)}.` : "No eligible Θλ recall packet.");', 'showToast(packet ? `Memory replay Θλ queued “${packet.label}” at similarity ${packet.similarity.toFixed(3)}.` : "No eligible memory replay Θλ packet.");'],
  ['showToast("Λψ requested. The next explicit Ξ tick will assess and commit it.");', 'showToast("Commitment projection Λψ requested. The next state-transition tick Ξ will assess and, if eligible, register it.");']
]);

const labPresentationTs = `type WeatherPresentation = {
  label: string;
  rationale: string;
  alias: string;
};

const WEATHER_PRESENTATION: Record<string, Omit<WeatherPresentation, "alias">> = {
  initial: {
    label: "No measured regime",
    rationale: "No committed simulation tick is available yet.",
  },
  "collapse-clearing": {
    label: "Commitment event registered",
    rationale: "A commitment projection Λψ was applied and recorded on this tick.",
  },
  "stable-high": {
    label: "Coherent low-update regime",
    rationale: "Coherence ρ is high while update magnitude ‖Γ‖ remains low.",
  },
  "shear-front": {
    label: "High-drive regime",
    rationale: "Contextual forcing Φ and update magnitude ‖Γ‖ are elevated.",
  },
  "collapse-watch": {
    label: "Commitment condition active",
    rationale: "The Λψ readiness condition is active; dwell or hold rules may still prevent commitment.",
  },
  "memory-front": {
    label: "Recall-influenced regime",
    rationale: "A memory replay packet Θλ is influencing the current update.",
  },
  variable: {
    label: "Mixed dynamical regime",
    rationale: "No specialized deterministic regime rule matched the current telemetry.",
  },
};

const FEATURE_LABELS: Record<string, string> = {
  "weather-composite": "Regime composite",
  "attractor-potential": "Attractor potential",
  "rho-field": "Coherence field ρ",
  "gamma-vectors": "Context-conditioned update Γ",
  "memory-influence": "Memory influence Θλ",
  "collapse-surface": "Commitment readiness Λψ",
  "psi-reflex": "Reflexive separation ψ ↔ ψᴽ",
  "event-markers": "Recorded events",
  "multi-observer-coupling": "Multi-observer coupling",
};

function presentWeather(
  weather: { id?: string; label?: string; rationale?: string } | null,
): WeatherPresentation {
  const source = weather ?? {
    id: "initial",
    label: "Unformed field",
    rationale: "No committed tick yet",
  };
  const presentation = WEATHER_PRESENTATION[source.id ?? ""] ?? {
    label: source.label ?? "Measured regime",
    rationale: source.rationale ?? "Derived from the current telemetry.",
  };
  return {
    ...presentation,
    alias: source.label ?? source.id ?? "Unformed field",
  };
}

`;
replaceExact(
  "apps/memory-weather-lab/src/lab.tsx",
  'const LAYER_LABELS: { id: keyof Layers; label: string }[] = [\n',
  `${labPresentationTs}const LAYER_LABELS: { id: keyof Layers; label: string }[] = [\n`
);

replaceMany("apps/memory-weather-lab/src/lab.tsx", [
  ['{ id: "scalar", label: "Scalar field" }', '{ id: "scalar", label: "Scalar regime map" }'],
  ['{ id: "vectors", label: "Γ vectors" }', '{ id: "vectors", label: "Update vectors Γ" }'],
  ['{ id: "trace", label: "ψ trace" }', '{ id: "trace", label: "State trace ψ" }'],
  ['{ id: "reflex", label: "ψᴽ separation" }', '{ id: "reflex", label: "Reflexive separation ψ ↔ ψᴽ" }'],
  ['{ id: "basins", label: "Basins" }', '{ id: "basins", label: "Attractor regions" }'],
  ['{ id: "collapse", label: "Λψ contour" }', '{ id: "collapse", label: "Commitment boundary Λψ" }'],
  ['{ id: "memory", label: "Θλ links" }', '{ id: "memory", label: "Memory replay links Θλ" }'],
  ['{ id: "events", label: "Events" }', '{ id: "events", label: "Recorded events" }'],
  ['{ id: "grid", label: "Grid" }', '{ id: "grid", label: "Projection grid" }'],
  ['{item.label}', '{FEATURE_LABELS[item.feature_id] ?? item.label}'],
  [
    'const weather = frame ? frame.weather : { label: "Unformed field", rationale: "No committed tick yet" };',
    'const weather = presentWeather(frame ? frame.weather : { id: "initial", label: "Unformed field", rationale: "No committed tick yet" });'
  ],
  ["<small>QOSMOS R¹² observer-field lab</small>", "<small>R¹² state-dynamics instrument</small>"],
  ['<span className="status-chip">v0.1.1 typed realization</span>', '<span className="status-chip">v0.1.1 engine · clarified labels</span>'],
  ['<Heading eyebrow="Live telemetry" title="Ψmeta" badge="direct" badgeClass="direct" />', '<Heading eyebrow="Live measurements" title="Diagnostic telemetry Ψmeta" badge="direct" badgeClass="direct" />'],
  ['<Meter label="Coherence ρ" value={rho} scale={1} />', '<Meter label="Coherence measure ρ" value={rho} scale={1} />'],
  ['<Meter label="Flux energy Φ" value={phi} scale={2} />', '<Meter label="Contextual forcing Φ" value={phi} scale={2} />'],
  ['<Meter label="Gradient ‖Γ‖" value={gamma} scale={sim.state.config.gammaCap} />', '<Meter label="Update magnitude ‖Γ‖" value={gamma} scale={sim.state.config.gammaCap} />'],
  ['<Meter label="Reflex confidence" value={reflex} scale={1} />', '<Meter label="Reflexive-state alignment" value={reflex} scale={1} />'],
  [
    '<small>{weather.rationale}</small>\n              </div>\n              <span className="source-badge interpretive">metaphor</span>',
    '<small>{weather.rationale}</small>\n                <small className="weather-alias">Weather alias: {weather.alias}</small>\n              </div>\n              <span className="source-badge derived">regime view</span>'
  ],
  ['<Heading eyebrow="Viewport" title="Layer rack" />', '<Heading eyebrow="Viewport" title="Measured layers" />'],
  ['["weather", "Memory Weather"]', '["weather", "Regime Map"]'],
  ['<Heading eyebrow="Observation" title="Φ forcing" />', '<Heading eyebrow="Observation" title="Contextual forcing Φ" />'],
  ["Basin target", "Attractor target"],
  ['<Heading eyebrow="DEVELOP extension" title="Multi-observer projection" badge="local" badgeClass="derived" />', '<Heading eyebrow="DEVELOP extension" title="Multi-observer coupling" badge="local" badgeClass="derived" />'],
  ['<span>{sim.state.counters.collapse} Λψ</span>', '<span>{sim.state.counters.collapse} commitments Λψ</span>'],
  ['<span>{sim.state.counters.memoryWrites} writes</span>', '<span>{sim.state.counters.memoryWrites} memory records</span>'],
  ['<span>{sim.state.counters.summaries} Σ◯</span>', '<span>{sim.state.counters.summaries} summaries Σ◯</span>'],
  ['if (event.kind === "collapse") return `Λψ · ${event.basinLabel}`;', 'if (event.kind === "collapse") return `Commitment Λψ · ${event.basinLabel}`;'],
  ['if (event.kind === "memory-write") return `Write · ${event.label}`;', 'if (event.kind === "memory-write") return `Memory record · ${event.label}`;'],
  ['if (event.kind === "summary") return "Σ◯ · mesh node";', 'if (event.kind === "summary") return "Summary Σ◯ · mesh node";'],
  ['if (event.kind === "basin-transition") return `Basin · ${event.toBasinLabel}`;', 'if (event.kind === "basin-transition") return `Attractor region · ${event.toBasinLabel}`;'],
  ["Inscribe memory", "Record memory"],
  ["Recall Θλ", "Queue memory replay Θλ"],
  ["Request Λψ on next tick", "Request commitment projection Λψ"],
  ["No inscriptions yet. Σ◯ summaries remain a separate mechanism.", "No memory records yet. Trace summaries Σ◯ remain a separate mechanism."]
]);

replaceMany("apps/memory-weather-lab/src/store.ts", [
  ['["collapse", "Λψ collapse"]', '["collapse", "Commitment projection Λψ"]'],
  ['["memoryWrite", "Memory write"]', '["memoryWrite", "Memory writing"]'],
  ['["thetaReplay", "Θλ replay"]', '["thetaReplay", "Memory replay Θλ"]'],
  ['["summarize", "Σ◯ summary"]', '["summarize", "Trace summarization Σ◯"]'],
  ['["omega", "Ωµ modulation"]', '["omega", "Bounded modulation Ωµ"]'],
  ['["rhoGate", "ρ gate"]', '["rhoGate", "Coherence gate ρ"]'],
  ['["reflexAdaptation", "Πᴽ adaptation"]', '["reflexAdaptation", "Reflexive adaptation Πᴽ"]'],
  ['{ value: "weather", label: "Weather composite" }', '{ value: "weather", label: "Regime composite" }'],
  ['{ value: "rho", label: "ρ coherence" }', '{ value: "rho", label: "Coherence measure ρ" }'],
  ['{ value: "fronts", label: "Field fronts" }', '{ value: "fronts", label: "Update fronts Γ" }'],
  ['{ value: "theta", label: "Θλ influence" }', '{ value: "theta", label: "Memory influence Θλ" }'],
  ['{ value: "lambda", label: "Λψ readiness" }', '{ value: "lambda", label: "Commitment readiness Λψ" }'],
  ['{ value: "separation", label: "ψ ↔ ψᴽ separation" }', '{ value: "separation", label: "Reflexive separation ψ ↔ ψᴽ" }'],
  ['liveMessage: "Memory Weather v0.1.1 ready."', 'liveMessage: "Memory Weather v0.1.1 state-dynamics instrument ready."'],
  [
    'const message = `Λψ committed at tick ${result.frame.step}, basin ${event ? event.basinLabel : "unknown"}.`;',
    'const message = `Commitment projection Λψ registered at tick ${result.frame.step}, attractor region ${event ? event.basinLabel : "unknown"}.`;'
  ],
  ['toast: `Inscribed “${result.memory.label}” as a local memory artifact.`,', 'toast: `Recorded “${result.memory.label}” as a local memory artifact.`,'],
  ['? `Θλ queued “${packet.label}” at similarity ${packet.similarity.toFixed(3)}.`', '? `Memory replay Θλ queued “${packet.label}” at similarity ${packet.similarity.toFixed(3)}.`'],
  [': "No eligible Θλ recall packet.",', ': "No eligible memory replay Θλ packet.",'],
  ['get().toastMessage("Λψ requested. The next explicit Ξ tick will assess and commit it.");', 'get().toastMessage("Commitment projection Λψ requested. The next state-transition tick Ξ will assess and, if eligible, register it.");']
]);

replaceMany("apps/memory-weather-lab/src/viewport.tsx", [
  [
    'aria-label="Memory Weather viewport; keyboard forcing is available in the X and Y controls"',
    'aria-label="Memory Weather regime viewport; keyboard forcing is available in the X and Y controls"'
  ],
  [
    'forcing target ({selectedPoint.x.toFixed(2)}, {selectedPoint.y.toFixed(2)}) · ρ{" "}\n          {format(sample.coherence)} · Λψ readiness margin {format(sample.collapseMargin)} · next tick',
    'forcing target ({selectedPoint.x.toFixed(2)}, {selectedPoint.y.toFixed(2)}) · coherence ρ{" "}\n          {format(sample.coherence)} · commitment margin Λψ {format(sample.collapseMargin)} · next tick'
  ]
]);

replaceMany("apps/memory-weather-lab/index.html", [
  [
    '<meta name="description" content="React viewport of QOSMOS Memory Weather v0.1.1. Deterministic R¹² observer-field lab with projection provenance." />',
    '<meta name="description" content="React viewport of Memory Weather v0.1.1, a deterministic R¹² state-dynamics instrument with auditable telemetry and projection provenance." />'
  ],
  ["<title>Memory Weather Lab</title>", "<title>Memory Weather · State-Dynamics Lab</title>"]
]);

replaceExact(
  "apps/memory-weather/tests/static.test.js",
  'test("all static buttons declare their button type", () => {\n  const buttons = Array.from(html.matchAll(/<button\\b[^>]*>/g), (match) => match[0]);\n  assert.ok(buttons.length >= 12);\n  for (const button of buttons) assert.match(button, /\\btype="button"/);\n});\n',
  'test("all static buttons declare their button type", () => {\n  const buttons = Array.from(html.matchAll(/<button\\b[^>]*>/g), (match) => match[0]);\n  assert.ok(buttons.length >= 12);\n  for (const button of buttons) assert.match(button, /\\btype="button"/);\n});\n\ntest("presentation labels explain glyphs without rewriting runtime weather records", () => {\n  assert.match(html, /Diagnostic telemetry Ψmeta/);\n  assert.match(html, /Contextual forcing Φ/);\n  assert.match(html, /Weather alias: Unformed field/);\n  assert.match(html, /Commitment projection Λψ/);\n  assert.match(app, /const WEATHER_PRESENTATION/);\n  assert.match(app, /High-drive regime/);\n  assert.match(engine, /id: "shear-front", label: "Shear front"/);\n  assert.doesNotMatch(engine, /High-drive regime/);\n});\n'
);

replaceExact(
  "apps/memory-weather-lab/tests/compat.test.ts",
  '  assert.match(viewportSource, /Λψ readiness margin/);',
  '  assert.match(viewportSource, /commitment margin Λψ/);'
);
replaceExact(
  "apps/memory-weather-lab/tests/compat.test.ts",
  '\nfunction contrastRatio(foreground: string, background: string) {\n',
  `\ntest("clarified UI labels preserve glyphs and leave runtime weather IDs untouched", () => {
  const labSource = readFileSync(new URL("../src/lab.tsx", import.meta.url), "utf8");
  const storeSource = readFileSync(new URL("../src/store.ts", import.meta.url), "utf8");
  const siblingEngineSource = readFileSync(
    new URL("../../memory-weather/src/engine.js", import.meta.url),
    "utf8",
  );
  assert.match(labSource, /Diagnostic telemetry Ψmeta/);
  assert.match(labSource, /High-drive regime/);
  assert.match(labSource, /Weather alias:/);
  assert.match(storeSource, /Commitment projection Λψ/);
  assert.match(storeSource, /Memory replay Θλ/);
  assert.match(siblingEngineSource, /id: "shear-front", label: "Shear front"/);
  assert.doesNotMatch(siblingEngineSource, /High-drive regime/);
});

function contrastRatio(foreground: string, background: string) {
`
);

const terminology = `# Memory Weather terminology

**Status:** Presentation-layer clarification for Memory Weather v0.1.1  
**Canonical effect:** None  
**Runtime effect:** None

Memory Weather is a visual instrument for **memory-conditioned state dynamics**.
It follows an evolving 12-dimensional simulated state as contextual input,
reflexive state estimation, memory recall, bounded modulation, and commitment
events alter its trajectory.

“Weather” is visual shorthand for the current dynamical regime. It does not
describe what the system *is*. It describes how measured conditions change over
time. The analogy is not a claim that the simulation has moods, models literal
meteorology, or represents biological consciousness.

## Reading rule

The interface uses three layers:

\`\`\`text
symbol → technical label → plain explanation
                     ↘ optional weather alias
\`\`\`

Symbols remain visible because they preserve correspondence with the QOFT
operator contract. Technical English is primary so a new reader does not have
to decode the glyphs before using the instrument.

## Operator vocabulary

| Symbol | Primary interface label | Memory Weather meaning |
|---|---|---|
| \`ψ\` | Current state | The present 12-value simulated latent state. |
| \`ψᴽ\` | Reflexive state estimate | A bounded internal estimate used to preserve state continuity. |
| \`Πᴽ\` | Reflexive projection | Produces the reflexive estimate from current state and realization context. |
| \`Φ\` | Contextual forcing | The combined input acting on the update, including stimulus, recall, modulation, and optional coupling. |
| \`ρ\` | Coherence measure | A realization-local measure used in gating and commitment readiness. |
| \`Γ\` | Context-conditioned update | The proposed direction of change; the interface reports its magnitude as \`‖Γ‖\`. |
| \`⊕\` | State integration | The declared fusion mechanism that produces a valid next simulation state. |
| \`Ξ\` | State-transition step | Executes one complete update cycle. |
| \`Λψ\` | Commitment projection | Applies and records a selected-state projection when the realization’s rules permit it. |
| \`Θλ\` | Memory recall and replay | Retrieves a memory packet and allows it to influence a later update. |
| \`Σ◯\` | Trace summarization | In this realization, summarizes recent activity into bounded memory structure. |
| \`Ωµ\` | Bounded modulation | In this realization, supplies deterministic, logged variation. |
| \`Π↺\` | Recurrence schedule | Repeats the state-transition step under the application schedule. |
| \`Ψmeta\` | Diagnostic telemetry | Records coherence, drift, entropy, update magnitude, commitment status, and related measurements. |

\`Σ◯\` and \`Ωµ\` are explicitly realization-specific descriptions. They do not
resolve their broader framework overloads.

## Regime labels

Runtime weather IDs and source labels remain unchanged for replay compatibility.
The interface adds a technical primary label and retains the original label as
a weather alias.

| Runtime ID | Primary label | Weather alias | Measured interpretation |
|---|---|---|---|
| \`initial\` | No measured regime | Unformed field | No committed simulation tick is available. |
| \`stable-high\` | Coherent low-update regime | Stable high | Coherence \`ρ\` is high while update magnitude \`‖Γ‖\` is low. |
| \`shear-front\` | High-drive regime | Shear front | Contextual forcing \`Φ\` and update magnitude \`‖Γ‖\` are elevated. |
| \`memory-front\` | Recall-influenced regime | Memory front | An applied memory replay packet \`Θλ\` is influencing the update. |
| \`collapse-watch\` | Commitment condition active | Collapse watch | The readiness condition is active; dwell or hold rules may still prevent commitment. |
| \`collapse-clearing\` | Commitment event registered | Collapse clearing | A commitment projection \`Λψ\` was applied and recorded on the tick. |
| \`variable\` | Mixed dynamical regime | Variable field | No specialized deterministic regime rule matched the current telemetry. |

A “watch” therefore does not mean a commitment is guaranteed. The telemetry
separately records whether commitment would trigger, is eligible, and actually
occurred.

## Compatibility boundary

This clarification intentionally preserves:

- engine version \`0.1.1\`
- runtime regime IDs, labels, and rationales
- replay and telemetry schema fields
- thresholds and mechanism order
- deterministic state hashes
- fixed-seed demonstration inputs and expected state hash

Only visible labels, explanations, accessibility text, documentation, and UI
messages change.
`;
write("apps/memory-weather/docs/TERMINOLOGY.md", terminology);

replaceExact(
  "apps/memory-weather/README.md",
  'A deterministic, dependency-free R¹² observer-field simulation with an auditable scientific viewport. It preserves the visual intuition of “memory weather” while replacing legacy W-space, glyph-mass, and symbolic-gravity claims with declared typed quantities and projection provenance.\n',
  'A deterministic, dependency-free R¹² state-dynamics simulation with an auditable scientific viewport. Memory Weather is a visual instrument for memory-conditioned state dynamics: contextual input, reflexive state estimation, memory replay, bounded modulation, and commitment events alter a 12-dimensional simulated trajectory.\n\n“Weather” is presentation shorthand for the current measured regime. It describes how recorded conditions change over time, not what the system fundamentally is. Technical labels are primary; original weather terms remain visible as aliases.\n'
);
replaceMany("apps/memory-weather/README.md", [
  [
    'Use **Load fixed-seed demo** for a 96-tick replay with three inscriptions, Θλ recall, Σ◯ summaries, and an integrity-bearing Λψ event.',
    'Use **Load fixed-seed demo** for a 96-tick replay with three memory records, memory replay Θλ, trace summaries Σ◯, and an integrity-bearing commitment event Λψ.'
  ],
  [
    '- Fixed-seed Ωµ modulation with every sample logged.',
    '- Bounded modulation Ωµ with every deterministic sample logged.'
  ],
  [
    '- Dwell- and hold-gated Λψ collapse with pre/post hashes.',
    '- Dwell- and hold-gated commitment projection Λψ with pre/post hashes.'
  ],
  [
    '- Σ◯ trace summarization and bounded mesh memory.',
    '- Trace summarization Σ◯ and bounded mesh memory.'
  ],
  [
    '- Θλ recall packets that only render as influence when actually applied.',
    '- Memory replay packets Θλ that only render as influence when actually applied.'
  ],
  [
    '- Memory Weather composite, scalar heatmap, vectors, streamlines, traces, basins, trigger contours, events, and 3D terrain.',
    '- Regime composite, scalar heatmap, update vectors, streamlines, state traces, attractor regions, commitment boundaries, recorded events, and 3D terrain.'
  ],
  [
    '- **Inscribe** creates a local memory record; it does not redefine Σ◯.',
    '- **Record memory** creates a local memory artifact; it does not redefine trace summarization Σ◯.'
  ],
  [
    '- **Recall Θλ** applies the best eligible memory packet on following ticks.',
    '- **Queue memory replay Θλ** applies the best eligible memory packet on following ticks.'
  ],
  [
    '- **Force Λψ** emits the same integrity-bearing event as predicate-triggered collapse.',
    '- **Request commitment projection Λψ** emits the same integrity-bearing event as predicate-triggered commitment.'
  ],
  [
    'Keyboard: `Space` run/pause, `.` single step, `R` reset, `1` weather, `2` field, `3` terrain.',
    'Keyboard: `Space` run/pause, `.` single step, `R` reset, `1` regime map, `2` field, `3` terrain.'
  ],
  [
    'See [docs/REALIZATION_CONTRACT.md](docs/REALIZATION_CONTRACT.md),',
    'See the [terminology guide](docs/TERMINOLOGY.md), [docs/REALIZATION_CONTRACT.md](docs/REALIZATION_CONTRACT.md),'
  ]
]);

replaceExact(
  "apps/memory-weather/CHANGELOG.md",
  "# Changelog\n\n",
  "# Changelog\n\n## Unreleased — 2026-08-27\n\n- Reframed “weather” as a presentation-layer regime analogy rather than an ontology.\n- Added technical primary labels while preserving QOFT symbols and original weather aliases.\n- Added newcomer-facing definitions for ψ, ψᴽ, Πᴽ, Φ, ρ, Γ, ⊕, Ξ, Λψ, Θλ, Σ◯, Ωµ, Π↺, and Ψmeta.\n- Preserved runtime weather IDs, source labels, schema fields, thresholds, engine behavior, and fixed-seed state hashes.\n- Added static tests enforcing the presentation/runtime boundary.\n\n"
);

replaceExact(
  "apps/memory-weather-lab/README.md",
  'A React viewport of **Memory Weather v0.1.1**. It renders the same deterministic\nR¹² observer-field engine as [`apps/memory-weather`](../memory-weather), with the\nsame published demo hash.\n',
  'A React viewport of **Memory Weather v0.1.1**. It renders the same deterministic\nR¹² state-dynamics engine as [`apps/memory-weather`](../memory-weather), with the\nsame published demo hash. Technical labels are primary, QOFT symbols remain\nvisible, and original weather terms are retained as presentation aliases.\n'
);
replaceMany("apps/memory-weather-lab/README.md", [
  [
    'Transport, layers, inscription, Θλ recall, Λψ, observer B, and replay',
    'Transport, measured layers, memory recording, memory replay Θλ, commitment projection Λψ, observer B, and replay'
  ],
  [
    'Operator contract, projection provenance, and the staged-routing experiment\nremain in [`apps/memory-weather/docs`](../memory-weather/docs).',
    'Operator contract, projection provenance, terminology, and the staged-routing experiment\nremain in [`apps/memory-weather/docs`](../memory-weather/docs). Start with the\n[terminology guide](../memory-weather/docs/TERMINOLOGY.md).'
  ]
]);

replaceExact(
  "apps/memory-weather-lab/REALIZATION.md",
  '## What this is\n',
  '## Presentation vocabulary\n\nThe React shell uses technical English as the primary interface label while\nretaining QOFT symbols and the engine’s original weather labels as aliases. The\nmapping is presentation-only and is documented in\n[`apps/memory-weather/docs/TERMINOLOGY.md`](../memory-weather/docs/TERMINOLOGY.md).\nIt does not alter runtime weather records, hashes, schemas, thresholds, or\noperator behavior.\n\n## What this is\n'
);

replaceExact(
  "apps/memory-weather-lab/CHANGELOG.md",
  "# Changelog\n\n",
  "# Changelog\n\n## Unreleased — 2026-08-27\n\n- Added technical primary labels for the weather view, telemetry, layers, controls, and event rail.\n- Retained QOFT symbols and displayed the engine’s original weather labels as aliases.\n- Kept the v0.1.1 engine, vendor bodies, deterministic demo hash, and replay schema unchanged.\n- Added compatibility tests for the presentation/runtime boundary.\n\n"
);

replaceMany("README.md", [
  [
    '| **Memory Weather** | v0.1.1 DEVELOP typed realization |',
    '| **Memory Weather** | v0.1.1 DEVELOP typed realization; clarified regime labels |'
  ],
  [
    '- run the separate Memory Weather v0.1.1 observer-field viewport offline;',
    '- run the separate Memory Weather v0.1.1 state-dynamics viewport offline;'
  ],
  [
    'It\ndoes not replace the original simulator or the root TypeScript engine.',
    'Its “weather” vocabulary is a presentation-layer regime analogy with technical\nprimary labels and preserved aliases. See\n[`apps/memory-weather/docs/TERMINOLOGY.md`](apps/memory-weather/docs/TERMINOLOGY.md).\nIt does not replace the original simulator or the root TypeScript engine.'
  ]
]);

process.stdout.write("Applied Memory Weather terminology clarification.\n");
