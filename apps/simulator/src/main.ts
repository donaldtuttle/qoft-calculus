import "./styles.css";

import { BASINS, type Ablations, type EngineConfig, type PsiMetaFrame, type Vec } from "../../../src/engine.ts";
import { runImplementationVerification, type ComplianceReport } from "./compliance.ts";
import {
  createSession,
  PERSISTENT_STIMULI,
  type LiveConfigPatch,
  type PersistentStimulus,
  type QosmosSession,
  type SessionSnapshot,
  type SessionStep,
} from "./session.ts";
import { FieldVisualizer } from "./visualizer.ts";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app root");

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">Ξ</div>
        <div>
          <div class="eyebrow">QOFT · QOSMOS · Public Typed Realization A</div>
          <h1>R¹² Observer Field Simulator</h1>
        </div>
      </div>
      <div class="header-equation" aria-label="Xi of psi equals psi reflex fused with Gamma of psi">
        Ξ(ψ) = ψᴽ ⊕ Γ(ψ; ctx)
      </div>
      <div class="status-strip" aria-label="Simulation status">
        <div class="status-chip"><span>tick</span><strong id="status-tick">0</strong></div>
        <div class="status-chip"><span>phase</span><strong id="status-phase">0</strong></div>
        <div class="status-chip" id="status-mode"><span>engine</span><strong>paused</strong></div>
        <div class="status-chip"><span>hash</span><strong id="status-hash">—</strong></div>
      </div>
    </header>

    <div class="workspace">
      <main class="primary">
        <nav class="tabs" role="tablist" aria-label="Simulator views">
          <button class="tab" role="tab" id="tab-field" aria-controls="view-field" aria-selected="true" data-view="field">Field</button>
          <button class="tab" role="tab" id="tab-trace" aria-controls="view-trace" aria-selected="false" tabindex="-1" data-view="trace">Trace + memory</button>
          <button class="tab" role="tab" id="tab-operators" aria-controls="view-operators" aria-selected="false" tabindex="-1" data-view="operators">Operators + scope</button>
          <button class="tab" role="tab" id="tab-verify" aria-controls="view-verify" aria-selected="false" tabindex="-1" data-view="verify">Verification</button>
        </nav>

        <section class="view" id="view-field" role="tabpanel" aria-labelledby="tab-field" data-panel="field">
          <div class="field-layout">
            <article class="card stage-card">
              <header class="stage-head">
                <div>
                  <div class="section-kicker">Observer field ψ · fixed 12-axis projection</div>
                  <h2 id="stage-title">Latent state at t = 0</h2>
                </div>
                <div class="legend" aria-label="Field legend">
                  <span class="legend-item legend-field">ψ state</span>
                  <span class="legend-item legend-reflex">ψᴽ self-model</span>
                  <span class="legend-item legend-gamma">Γ direction</span>
                </div>
              </header>
              <canvas
                id="field-canvas"
                role="button"
                tabindex="0"
                aria-describedby="inject-hint"
                aria-label="Twelve-axis observer field. Activate to queue one pulse stimulus."
              ></canvas>
              <div class="inject-hint" id="inject-hint">Click or press Enter to queue a one-tick Φ pulse</div>
            </article>

            <div class="side-stack">
              <article class="card metric-card">
                <div class="metric-top">
                  <span class="metric-label">ρ coherence</span>
                  <strong class="metric-value" id="rho-value">0.000</strong>
                </div>
                <svg class="sparkline" id="rho-spark" viewBox="0 0 200 42" preserveAspectRatio="none" aria-hidden="true">
                  <path class="area"></path><path class="line"></path>
                </svg>
              </article>
              <article class="card metric-card">
                <div class="metric-top">
                  <span class="metric-label">‖Γ‖ gradient</span>
                  <strong class="metric-value" id="gamma-value">0.000</strong>
                </div>
                <svg class="sparkline" id="gamma-spark" viewBox="0 0 200 42" preserveAspectRatio="none" aria-hidden="true">
                  <path class="area"></path><path class="line"></path>
                </svg>
              </article>
              <article class="card metric-card">
                <div class="metric-top">
                  <span class="metric-label">entropy</span>
                  <strong class="metric-value" id="entropy-value">0.000</strong>
                </div>
                <svg class="sparkline" id="entropy-spark" viewBox="0 0 200 42" preserveAspectRatio="none" aria-hidden="true">
                  <path class="area"></path><path class="line"></path>
                </svg>
              </article>
              <article class="card metric-card">
                <div class="metric-top">
                  <span class="metric-label">Φ energy</span>
                  <strong class="metric-value" id="flux-value">0.000</strong>
                </div>
                <svg class="sparkline" id="flux-spark" viewBox="0 0 200 42" preserveAspectRatio="none" aria-hidden="true">
                  <path class="area"></path><path class="line"></path>
                </svg>
              </article>
              <article class="card state-card">
                <div class="metric-top">
                  <span class="metric-label">R¹² latent channels</span>
                  <span class="control-value" id="basin-value">basin —</span>
                </div>
                <div class="state-grid" id="latent-grid"></div>
              </article>
            </div>
          </div>
        </section>

        <section class="view" id="view-trace" role="tabpanel" aria-labelledby="tab-trace" data-panel="trace" hidden>
          <header class="section-heading">
            <div>
              <div class="section-kicker">Engine-derived telemetry only</div>
              <h2>Trace, collapse events, and semantic mesh</h2>
              <p class="section-note">Every plotted point comes from a committed Ψmeta frame. Collapse markers resolve to emitted pre/post-hash events.</p>
            </div>
          </header>
          <div class="trace-grid">
            <article class="card chart-card">
              <div class="metric-top"><span class="metric-label">Last 256 committed ticks</span><span class="control-value" id="trace-count">0 frames</span></div>
              <div class="chart-legend">
                <span style="color: var(--cyan)">ρ coherence</span>
                <span style="color: var(--gold)">‖Γ‖</span>
                <span style="color: var(--coral)">Φ energy</span>
                <span style="color: var(--blue)">entropy</span>
              </div>
              <svg class="trace-chart" id="trace-chart" viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label="Telemetry time series" aria-describedby="trace-summary"></svg>
              <p class="visually-hidden" id="trace-summary">No committed telemetry frames.</p>
            </article>
            <article class="card event-card">
              <div class="metric-top"><span class="metric-label">Λψ collapse ledger</span><span class="control-value" id="event-count">0 events</span></div>
              <ul class="event-list" id="event-list"></ul>
            </article>
            <article class="card mesh-card">
              <div class="metric-top"><span class="metric-label">Σ◯ semantic mesh</span><span class="control-value" id="mesh-count">0 nodes</span></div>
              <ul class="mesh-list" id="mesh-list"></ul>
            </article>
            <article class="card state-card">
              <div class="metric-top"><span class="metric-label">Current run recipe</span><span class="control-value" id="pulse-count">0 pulses</span></div>
              <div class="type-spine" id="run-recipe">seed = 0x51e1d\nstimulus = periodic\nframes = 0</div>
            </article>
          </div>
        </section>

        <section class="view" id="view-operators" role="tabpanel" aria-labelledby="tab-operators" data-panel="operators" hidden>
          <header class="section-heading">
            <div>
              <div class="section-kicker">Target contract versus numerical realization</div>
              <h2>Typed operator boundary</h2>
              <p class="section-note">The stamped r2.2 genealogy supports this type spine. The complete D-Π-01 corpus is not bundled here, so this is a targeted implementation crosswalk—not a complete canon audit.</p>
            </div>
          </header>
          <div class="operator-grid">
            <article class="card operator-card">
              <div class="metric-label">Canonical target</div>
              <pre class="type-spine">ψ ∈ Ψ
Ψᴽ ⊆ Ψ
ψᴽ = Πᴽ(ψ; ctx, m) ∈ Ψᴽ
Γ(ψ; ctx) ∈ G
⊕ : Ψᴽ × G → Ψ
Ξ(ψ) = ψᴽ ⊕ Γ(ψ; ctx) ∈ Ψ</pre>
              <div class="operator-list">
                <div class="operator-item"><strong>Πᴽ</strong><code>Ψ → Ψᴽ</code><p>Builds the bounded, lagged self-model. It is the sole writer of selfModel in this engine.</p></div>
                <div class="operator-item"><strong>Γ</strong><code>Ψ × Ctx → G</code><p>Returns an R¹² update carrier from the declared Φ − ψ proxy. Γ does not lift itself into Ψ.</p></div>
                <div class="operator-item"><strong>⊕</strong><code>Ψᴽ × G → Ψ</code><p>Typed fusion. Vector arithmetic occurs only inside this declared representation map.</p></div>
                <div class="operator-item"><strong>Λψ</strong><code>Ψ → Ψ</code><p>Optional projection toward one of six fixed basins. Every firing emits a CollapseEvent.</p></div>
                <div class="operator-item"><strong>Θλ</strong><code>Ψ × Μ → Ψ × Μ</code><p>Nearest-node recall biases a later Φ/Γ path when the memory ablation is enabled.</p></div>
                <div class="operator-item"><strong>Ψmeta</strong><code>Ψ × Ctx → ℝᵏ</code><p>One diagnostics frame per tick. It is telemetry, not awareness or consciousness.</p></div>
              </div>
            </article>
            <article class="card scope-card">
              <div class="metric-label">This implementation</div>
              <h2>Public Typed Realization A · R¹²</h2>
              <p>The numerical model uses a 12-value bounded latent state, an EMA self-model, a declared gradient proxy, seeded Gaussian Ωµ modulation, six fixed basins, and a bounded semantic mesh.</p>
              <ul>
                <li>External ⊕ remains typed fusion; it is not ordinary addition.</li>
                <li>τ = 0.78 and the six basin vectors are realization defaults, not universal constants.</li>
                <li>κ curvature and holographic field memory remain undefined or unimplemented here.</li>
                <li>The strongest ordinary baseline is a seeded bounded attractor system with threshold events and associative memory.</li>
              </ul>
              <div class="boundary-callout"><strong>Claim firewall.</strong> Interesting trajectories, collapse events, or memory effects establish behavior of this software model only. They do not demonstrate quantum physics, phenomenal consciousness, observer-caused collapse, or universal cognition.</div>
            </article>
          </div>
        </section>

        <section class="view" id="view-verify" role="tabpanel" aria-labelledby="tab-verify" data-panel="verify" hidden>
          <header class="section-heading">
            <div>
              <div class="section-kicker">Executable implementation checks</div>
              <h2>Determinism and invariant verification</h2>
              <p class="section-note">Checks rerun the browser-safe engine locally. Passing means this realization is repeatable under the tested conditions; it does not validate QOFT scientifically.</p>
            </div>
            <button class="primary-button" id="run-checks-button">Run checks</button>
          </header>
          <div class="verify-grid">
            <article class="card checks-card">
              <div class="metric-top"><span class="metric-label">Check results</span><span class="control-value" id="check-overall">not run</span></div>
              <ul class="check-list" id="check-list"><li class="empty-state">Run the checks to compare deterministic replays, collapse integrity, trace alignment, pulse scheduling, and ablations.</li></ul>
            </article>
            <article class="card scope-card">
              <div class="metric-label">Current-run evidence</div>
              <div class="verification-summary">
                <div class="summary-cell"><span class="table-label">frames</span><strong id="summary-frames">0</strong></div>
                <div class="summary-cell"><span class="table-label">events</span><strong id="summary-events">0</strong></div>
                <div class="summary-cell"><span class="table-label">mesh</span><strong id="summary-mesh">0</strong></div>
              </div>
              <div class="boundary-callout">Primary falsifier: identical seed, configuration, and input schedule produce different hashes. A causal ablation also fails its claim if the supposedly disabled path remains active.</div>
            </article>
          </div>
        </section>
      </main>

      <aside class="control-panel" id="control-panel" aria-label="Simulation controls">
        <header class="panel-heading">
          <div><div class="section-kicker">Π↺ recurrence controls</div><h2>Run console</h2></div>
          <div class="icon-actions">
            <button class="icon-button" id="play-button" title="Play or pause (Space)" aria-label="Play simulation">Play</button>
            <button class="icon-button" id="step-button" title="Step one tick (Right arrow)" aria-label="Step one tick">+1</button>
            <button class="icon-button" id="reset-button" title="Reset this seed (R)" aria-label="Reset simulation">Reset</button>
          </div>
        </header>
        <button class="secondary-button mobile-controls-toggle" id="controls-toggle" aria-expanded="false" aria-controls="parameter-sections">Show parameters</button>

        <section class="control-section">
          <div class="control-value-row"><span class="control-label">Seed</span><span class="control-value" id="normalized-seed">—</span></div>
          <div class="seed-row">
            <input class="text-input" id="seed-input" value="0x51e1d" maxlength="128" aria-label="Simulation seed" spellcheck="false" />
            <button class="icon-button" id="new-seed-button" title="Generate a new seed" aria-label="Generate a new seed">New</button>
          </div>
          <div class="control-value-row" style="margin-top: 13px"><span class="control-label">Tick interval</span><span class="control-value" id="interval-value">180 ms</span></div>
          <input class="range" id="interval-range" type="range" min="50" max="800" step="10" value="180" aria-label="Tick interval in milliseconds" />
        </section>

        <div id="parameter-sections" class="parameter-sections">
        <section class="control-section">
          <div class="control-label">Flux Φ</div>
          <div class="mode-grid" id="mode-grid">
            ${PERSISTENT_STIMULI.map((mode) => `<button class="mode-button" data-mode="${mode}" aria-pressed="${mode === "periodic"}">${mode}</button>`).join("")}
          </div>
        </section>

        <section class="control-section">
          <div class="control-value-row"><label class="control-label" for="tau-range">Collapse τ</label><span class="control-value" id="tau-value">0.78</span></div>
          <input class="range" id="tau-range" type="range" min="0.40" max="0.99" step="0.01" value="0.78" />
          <div class="control-value-row" style="margin-top: 12px"><label class="control-label" for="gamma-range">Γ scale</label><span class="control-value" id="gamma-scale-value">0.32</span></div>
          <input class="range" id="gamma-range" type="range" min="0.05" max="0.80" step="0.01" value="0.32" />
          <div class="control-value-row" style="margin-top: 12px"><label class="control-label" for="omega-range">Ωµ amplitude</label><span class="control-value" id="omega-value">0.055</span></div>
          <input class="range" id="omega-range" type="range" min="0" max="0.20" step="0.005" value="0.055" />
        </section>

        <section class="control-section">
          <div class="control-label">Mechanism ablations</div>
          <div class="switch-list">
            <label class="switch-row"><span>Λψ collapse<small>threshold projection + event</small></span><input class="switch" type="checkbox" data-ablation="collapse" checked /></label>
            <label class="switch-row"><span>Θλ memory<small>nearest mesh recall bias</small></span><input class="switch" type="checkbox" data-ablation="memory" checked /></label>
            <label class="switch-row"><span>Σ◯ summarize<small>mean-pooled mesh nodes</small></span><input class="switch" type="checkbox" data-ablation="summarize" checked /></label>
            <label class="switch-row"><span>Ωµ modulation<small>seeded Gaussian flux sample</small></span><input class="switch" type="checkbox" data-ablation="omega" checked /></label>
          </div>
        </section>

        <section class="control-section">
          <div class="action-row">
            <button class="primary-button" id="pulse-button">Queue Φ pulse</button>
            <button class="secondary-button" id="export-button">Export trace JSON</button>
          </div>
        </section>
        </div>
      </aside>
    </div>

    <footer class="footer-boundary">Typed Realization / R¹² software model. No physical, quantum, neural, or consciousness claim is implied.</footer>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
`;

function required<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing UI element: ${selector}`);
  return node;
}

const canvas = required<HTMLCanvasElement>("#field-canvas");
const visualizer = new FieldVisualizer(canvas);
const runNonce = new Uint32Array(2);
crypto.getRandomValues(runNonce);
const runId = `qosmos-ui-${[...runNonce].map((value) => value.toString(16).padStart(8, "0")).join("")}`;
let session: QosmosSession = createSession({ runId, seed: "0x51e1d" });
let intervalMs = 180;
let timer: number | undefined;
let toastTimer: number | undefined;

const text = (selector: string, value: string | number): void => {
  required<HTMLElement>(selector).textContent = String(value);
};

function format(value: number | undefined, digits = 3): string {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : "—";
}

function safeBasinLabel(snapshot: SessionSnapshot): string {
  const id = snapshot.psi.basinId;
  return id === undefined ? "—" : (BASINS[id]?.label ?? `#${id}`);
}

function showToast(message: string): void {
  const toast = required<HTMLElement>("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  if (toastTimer !== undefined) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function valuesPath(values: number[], width: number, height: number, fixedMax?: number): string {
  if (!values.length) return "";
  const min = fixedMax === undefined ? Math.min(...values) : 0;
  const max = fixedMax ?? Math.max(...values);
  const range = Math.max(max - min, 1e-9);
  return values.map((value, index) => {
    const x = values.length === 1 ? width : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function updateSparkline(selector: string, values: number[], fixedMax?: number): void {
  const svg = required<SVGSVGElement>(selector);
  const line = svg.querySelector<SVGPathElement>(".line");
  const area = svg.querySelector<SVGPathElement>(".area");
  if (!line || !area) return;
  const path = valuesPath(values, 200, 42, fixedMax);
  line.setAttribute("d", path);
  area.setAttribute("d", path ? `${path} L200,42 L0,42 Z` : "");
}

function updateLatentGrid(latent: Vec): void {
  const grid = required<HTMLElement>("#latent-grid");
  if (grid.childElementCount !== latent.length) {
    grid.replaceChildren(...latent.map((_, index) => {
      const cell = document.createElement("div");
      cell.className = "latent-cell";
      cell.innerHTML = `<span>ψ${String(index + 1).padStart(2, "0")}</span><span class="fill"></span><strong></strong>`;
      return cell;
    }));
  }
  [...grid.children].forEach((child, index) => {
    const cell = child as HTMLElement;
    const value = latent[index] ?? 0;
    cell.style.setProperty("--level", `${Math.round(((value + 2) / 4) * 100)}%`);
    const strong = cell.querySelector("strong");
    if (strong) strong.textContent = value.toFixed(2);
  });
}

function svgElement<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function updateTraceChart(frames: PsiMetaFrame[], totalFrameCount: number): void {
  const svg = required<SVGSVGElement>("#trace-chart");
  const recent = frames;
  svg.replaceChildren();
  for (let y = 0; y <= 4; y += 1) {
    svg.append(svgElement("line", { x1: "0", x2: "1000", y1: String(y * 55), y2: String(y * 55), class: "grid-line" }));
  }
  const series: Array<{ values: number[]; color: string; dash?: string; max?: number }> = [
    { values: recent.map((frame) => frame.rho), color: "#58d7ca", max: 1 },
    { values: recent.map((frame) => frame.gammaMag), color: "#f5c978", dash: "10 4", max: 1.4 },
    { values: recent.map((frame) => frame.phiEnergy), color: "#ff7d8b", dash: "2 5" },
    { values: recent.map((frame) => frame.entropy), color: "#76a9ff", dash: "12 4 2 4", max: 1 },
  ];
  for (const item of series) {
    svg.append(svgElement("path", {
      d: valuesPath(item.values, 1000, 220, item.max),
      class: "series",
      stroke: item.color,
      ...(item.dash ? { "stroke-dasharray": item.dash } : {}),
    }));
  }
  recent.forEach((frame, index) => {
    if (!frame.collapseTriggered) return;
    const x = recent.length === 1 ? 1000 : (index / (recent.length - 1)) * 1000;
    svg.append(svgElement("line", { x1: String(x), x2: String(x), y1: "0", y2: "220", stroke: "#ffe2a9", "stroke-width": "1", "stroke-dasharray": "4 4", opacity: "0.72" }));
  });
  text("#trace-count", `${totalFrameCount} frame${totalFrameCount === 1 ? "" : "s"}`);
  const latest = recent.at(-1);
  text(
    "#trace-summary",
    latest
      ? `The chart shows ${recent.length} most recent of ${totalFrameCount} committed frames. Latest values: coherence ${format(latest.rho)}, Gamma magnitude ${format(latest.gammaMag)}, Phi energy ${format(latest.phiEnergy)}, entropy ${format(latest.entropy)}. The four series also use distinct line patterns.`
      : "No committed telemetry frames.",
  );
}

function updateEvents(snapshot: SessionSnapshot): void {
  const list = required<HTMLUListElement>("#event-list");
  const eventHistory = snapshot.eventHistory;
  text("#event-count", `${eventHistory.total} event${eventHistory.total === 1 ? "" : "s"}`);
  if (!eventHistory.events.length) {
    list.innerHTML = '<li class="empty-state">No Λψ event yet. Basin drive or a lower τ makes the realization-specific predicate easier to reach.</li>';
    return;
  }
  list.replaceChildren(...eventHistory.events.slice().reverse().map((event) => {
    const item = document.createElement("li");
    item.className = "event-item";
    const label = BASINS[event.basinId]?.label ?? `basin ${event.basinId}`;
    item.innerHTML = `<header><span>t=${event.step} · ${label}</span><span class="event-delta">Δ ${format(event.energyDrop)}</span></header><p>${event.reason}<br>${event.preHash} → ${event.postHash}</p>`;
    return item;
  }));
}

function updateMesh(snapshot: SessionSnapshot): void {
  const list = required<HTMLUListElement>("#mesh-list");
  text("#mesh-count", `${snapshot.mesh.length} node${snapshot.mesh.length === 1 ? "" : "s"}`);
  if (!snapshot.mesh.length) {
    list.innerHTML = `<li class="empty-state">Σ◯ summarizes every ${snapshot.config.summarizeEvery} ticks when enabled.</li>`;
    return;
  }
  list.replaceChildren(...snapshot.mesh.slice().reverse().map((node) => {
    const item = document.createElement("li");
    item.className = "mesh-item";
    item.innerHTML = `<header><span>μ-${node.id}</span><span>t=${node.step}</span></header><p>ρ̄ ${format(node.rho)} · R¹² mean-pooled trace window</p>`;
    return item;
  }));
}

function updateTransport(snapshot: SessionSnapshot): void {
  const play = required<HTMLButtonElement>("#play-button");
  play.textContent = snapshot.playing ? "Pause" : "Play";
  play.setAttribute("aria-label", snapshot.playing ? "Pause simulation" : "Play simulation");
  play.classList.toggle("is-running", snapshot.playing);
  const atLimit = snapshot.frameCount >= snapshot.maxTicks;
  required<HTMLButtonElement>("#pulse-button").disabled = atLimit;
  canvas.setAttribute("aria-disabled", String(atLimit));
  text("#status-tick", snapshot.psi.t);
  text("#status-phase", snapshot.latestFrame?.phase ?? 0);
  text("#status-hash", snapshot.psiHash.slice(0, 8));
  const status = required<HTMLElement>("#status-mode");
  const state = snapshot.latestFrame?.collapseTriggered ? "Λψ" : snapshot.playing ? "live" : "paused";
  status.querySelector("strong")!.textContent = state;
  status.classList.toggle("live", snapshot.playing && !snapshot.latestFrame?.collapseTriggered);
  status.classList.toggle("collapse", Boolean(snapshot.latestFrame?.collapseTriggered));
  text("#normalized-seed", `u32 ${snapshot.seed}`);
  text("#inject-hint", snapshot.pulsePending ? "Φ pulse queued for the next committed tick" : "Click or press Enter to queue a one-tick Φ pulse");
}

function updateModeButtons(snapshot: SessionSnapshot): void {
  document.querySelectorAll<HTMLButtonElement>(".mode-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === snapshot.persistentStimulus));
  });
}

function updateControls(snapshot: SessionSnapshot): void {
  const controls: Array<[string, number, string, number]> = [
    ["#tau-range", snapshot.config.tau, "#tau-value", 2],
    ["#gamma-range", snapshot.config.gammaScale, "#gamma-scale-value", 2],
    ["#omega-range", snapshot.config.omegaAmp, "#omega-value", 3],
  ];
  for (const [inputSelector, value, outputSelector, digits] of controls) {
    required<HTMLInputElement>(inputSelector).value = String(value);
    text(outputSelector, value.toFixed(digits));
  }
  document.querySelectorAll<HTMLInputElement>("[data-ablation]").forEach((input) => {
    const key = input.dataset.ablation as keyof Ablations;
    input.checked = snapshot.config.ablations[key];
  });
}

function refresh(lastStep?: SessionStep): void {
  const snapshot = session.snapshot();
  const frames = snapshot.recentFrames;
  const latest = snapshot.latestFrame;

  updateTransport(snapshot);
  updateModeButtons(snapshot);
  updateControls(snapshot);
  text("#stage-title", `Latent state at t = ${snapshot.psi.t}`);
  text("#rho-value", format(latest?.rho ?? snapshot.psi.coherence));
  text("#gamma-value", format(latest?.gammaMag));
  text("#entropy-value", format(latest?.entropy));
  text("#flux-value", format(latest?.phiEnergy ?? snapshot.psi.fluxEnergy));
  text("#basin-value", `basin ${safeBasinLabel(snapshot)}`);
  text("#pulse-count", `${snapshot.pulseCount} pulse${snapshot.pulseCount === 1 ? "" : "s"}`);
  text("#summary-frames", snapshot.frameCount);
  text("#summary-events", snapshot.eventHistory.total);
  text("#summary-mesh", snapshot.mesh.length);
  text("#run-recipe", `seed = ${String(snapshot.seedInput)}\nu32 = ${snapshot.seed}\nstimulus = ${snapshot.persistentStimulus}\nframes = ${snapshot.frameCount}\npulses = ${snapshot.pulseCount}\nτ = ${snapshot.config.tau.toFixed(2)}`);

  const recent = frames.slice(-64);
  updateSparkline("#rho-spark", recent.map((frame) => frame.rho), 1);
  updateSparkline("#gamma-spark", recent.map((frame) => frame.gammaMag), 1.4);
  updateSparkline("#entropy-spark", recent.map((frame) => frame.entropy), 1);
  updateSparkline("#flux-spark", recent.map((frame) => frame.phiEnergy));
  updateLatentGrid(snapshot.psi.latent);
  updateTraceChart(frames, snapshot.frameCount);
  updateEvents(snapshot);
  updateMesh(snapshot);

  const priorGamma = snapshot.priorGamma ?? Array(12).fill(0);
  visualizer.update({
    latent: snapshot.psi.latent,
    selfModel: snapshot.selfModel,
    gamma: priorGamma,
    trail: snapshot.stateHistory.slice(-64).map((sample) => sample.latent),
    rho: latest?.rho ?? snapshot.psi.coherence,
    phase: latest?.phase ?? 0,
    step: snapshot.psi.t,
    fluxEnergy: latest?.phiEnergy ?? snapshot.psi.fluxEnergy,
    collapsed: Boolean(lastStep?.events.length),
  });
  canvas.setAttribute("aria-label", `Twelve-axis observer field at tick ${snapshot.psi.t}; coherence ${format(latest?.rho ?? snapshot.psi.coherence)}; ${snapshot.pulsePending ? "pulse queued" : "activate to queue a pulse"}.`);
}

function stopTimer(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}

function syncTimer(): void {
  stopTimer();
  if (!session.snapshot().playing) return;
  timer = window.setInterval(() => {
    const step = session.tick();
    if (step) refresh(step);
    const after = session.snapshot();
    if (!after.playing) {
      stopTimer();
      if (after.frameCount >= after.maxTicks) {
        showToast(`Reached the ${after.maxTicks}-tick safety limit. Export or reset to continue.`);
      }
    }
  }, intervalMs);
}

function resetSession(seed?: string | number, playing?: boolean): void {
  try {
    session.reset({ seed, playing });
    refresh();
    syncTimer();
  } catch (error) {
    required<HTMLInputElement>("#seed-input").value = String(session.snapshot().seedInput);
    showToast(error instanceof Error ? error.message : "The session could not be reset.");
  }
}

function applyConfigAndRestart(patch: LiveConfigPatch): void {
  const wasPlaying = session.snapshot().playing;
  session.pause();
  session.updateConfig(patch);
  if (wasPlaying) session.play();
  refresh();
  syncTimer();
  showToast("Configuration changed; a fresh deterministic run was started.");
}

function setAblationAndRestart(key: keyof Ablations, enabled: boolean): void {
  const wasPlaying = session.snapshot().playing;
  session.pause();
  session.setAblations({ [key]: enabled });
  if (wasPlaying) session.play();
  refresh();
  syncTimer();
  showToast(`${key} ${enabled ? "enabled" : "ablated"}; a fresh run was started.`);
}

function queuePulse(clientX?: number, clientY?: number): void {
  try {
    session.queuePulse();
    if (clientX !== undefined && clientY !== undefined) visualizer.markPulse(clientX, clientY);
    refresh();
    showToast("One-tick Φ pulse queued. It will be consumed by the next committed step.");
  } catch (error) {
    refresh();
    showToast(error instanceof Error ? error.message : "The pulse could not be queued.");
  }
}

function selectView(view: string): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
    const selected = tab.dataset.view === view;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll<HTMLElement>(".view").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== view;
  });
  if (view === "field") window.requestAnimationFrame(() => refresh());
}

function renderCompliance(report: ComplianceReport): void {
  const list = required<HTMLUListElement>("#check-list");
  list.replaceChildren(...report.checks.map((check) => {
    const item = document.createElement("li");
    item.className = "check-item";
    item.dataset.status = check.status;
    item.innerHTML = `<header><span>${check.name}</span><span class="check-status">${check.status.replace("-", " ")}</span></header><p>${check.detail}</p>`;
    return item;
  }));
  const passed = report.checks.filter((check) => check.status === "pass").length;
  const notTested = report.checks.filter((check) => check.status === "not-tested").length;
  text("#check-overall", `${passed}/${report.checks.length} pass${notTested ? ` · ${notTested} not tested` : ""}`);
}

function stepOnce(): void {
  try {
    refresh(session.step());
    if (!session.snapshot().playing) syncTimer();
  } catch (error) {
    refresh();
    syncTimer();
    showToast(error instanceof Error ? error.message : "The session could not advance.");
  }
}

document.querySelectorAll<HTMLButtonElement>(".tab").forEach((button) => {
  button.addEventListener("click", () => selectView(button.dataset.view ?? "field"));
  button.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const tabs = [...document.querySelectorAll<HTMLButtonElement>(".tab")];
    const current = tabs.indexOf(button);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(current + direction + tabs.length) % tabs.length];
    if (!next) return;
    selectView(next.dataset.view ?? "field");
    next.focus();
  });
});

required<HTMLButtonElement>("#controls-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const panel = required<HTMLElement>("#control-panel");
  const expanded = !panel.classList.contains("expanded");
  panel.classList.toggle("expanded", expanded);
  button.setAttribute("aria-expanded", String(expanded));
  button.textContent = expanded ? "Hide parameters" : "Show parameters";
});

required<HTMLButtonElement>("#play-button").addEventListener("click", () => {
  session.togglePlaying();
  refresh();
  syncTimer();
});

required<HTMLButtonElement>("#step-button").addEventListener("click", stepOnce);
required<HTMLButtonElement>("#reset-button").addEventListener("click", () => resetSession(required<HTMLInputElement>("#seed-input").value));
required<HTMLButtonElement>("#new-seed-button").addEventListener("click", () => {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const seed = `0x${random[0].toString(16).padStart(8, "0")}`;
  required<HTMLInputElement>("#seed-input").value = seed;
  resetSession(seed);
});

required<HTMLInputElement>("#seed-input").addEventListener("change", (event) => resetSession((event.currentTarget as HTMLInputElement).value));
required<HTMLInputElement>("#interval-range").addEventListener("input", (event) => {
  intervalMs = Number((event.currentTarget as HTMLInputElement).value);
  text("#interval-value", `${intervalMs} ms`);
  syncTimer();
});

document.querySelectorAll<HTMLButtonElement>(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    session.setFluxMode(button.dataset.mode as PersistentStimulus);
    refresh();
  });
});

const configRanges: Array<{ input: string; output: string; key: keyof Pick<EngineConfig, "tau" | "gammaScale" | "omegaAmp">; digits: number }> = [
  { input: "#tau-range", output: "#tau-value", key: "tau", digits: 2 },
  { input: "#gamma-range", output: "#gamma-scale-value", key: "gammaScale", digits: 2 },
  { input: "#omega-range", output: "#omega-value", key: "omegaAmp", digits: 3 },
];

for (const item of configRanges) {
  const input = required<HTMLInputElement>(item.input);
  input.addEventListener("input", () => text(item.output, Number(input.value).toFixed(item.digits)));
  input.addEventListener("change", () => applyConfigAndRestart({ [item.key]: Number(input.value) }));
}

document.querySelectorAll<HTMLInputElement>("[data-ablation]").forEach((input) => {
  input.addEventListener("change", () => setAblationAndRestart(input.dataset.ablation as keyof Ablations, input.checked));
});

canvas.addEventListener("click", (event) => queuePulse(event.clientX, event.clientY));
canvas.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    queuePulse(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
});
required<HTMLButtonElement>("#pulse-button").addEventListener("click", () => queuePulse());

required<HTMLButtonElement>("#export-button").addEventListener("click", () => {
  const data = session.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `qosmos-r12-${String(data.seedInput).replace(/[^a-z0-9_-]+/gi, "_")}-${data.frameCount}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("Trace export created from the current deterministic session.");
});

required<HTMLButtonElement>("#run-checks-button").addEventListener("click", () => {
  const button = required<HTMLButtonElement>("#run-checks-button");
  button.disabled = true;
  button.textContent = "Checking…";
  window.setTimeout(() => {
    try {
      renderCompliance(runImplementationVerification(session.exportData()));
      selectView("verify");
    } finally {
      button.disabled = false;
      button.textContent = "Run checks";
    }
  }, 20);
});

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  const target = event.target as HTMLElement | null;
  if (target?.matches("input, textarea, select, button")) return;
  if (event.code === "Space") {
    event.preventDefault();
    session.togglePlaying();
    refresh();
    syncTimer();
  } else if (event.code === "ArrowRight") {
    event.preventDefault();
    stepOnce();
  } else if (event.key.toLowerCase() === "r") {
    resetSession();
  }
});

window.addEventListener("beforeunload", () => {
  stopTimer();
  visualizer.destroy();
});

refresh();
