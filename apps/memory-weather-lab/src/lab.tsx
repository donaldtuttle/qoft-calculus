import { useEffect, type ChangeEvent } from "react";
import { Viewport } from "./viewport";
import {
  ABLATION_KEYS,
  Engine,
  SCALAR_OPTIONS,
  STIMULUS_MODES,
  format,
  latestFrame,
  shortHash,
  sim,
  useLab,
  type Layers,
  type ScalarMode,
  type ViewMode,
} from "./store";

const LAYER_LABELS: { id: keyof Layers; label: string }[] = [
  { id: "scalar", label: "Scalar field" },
  { id: "vectors", label: "Γ vectors" },
  { id: "streamlines", label: "Streamlines" },
  { id: "trace", label: "ψ trace" },
  { id: "reflex", label: "ψᴽ separation" },
  { id: "basins", label: "Basins" },
  { id: "collapse", label: "Λψ contour" },
  { id: "memory", label: "Θλ links" },
  { id: "events", label: "Events" },
  { id: "grid", label: "Grid" },
];

function Meter({
  label,
  value,
  scale,
}: {
  label: string;
  value: number;
  scale: number;
}) {
  const width = Math.max(0, Math.min(1, value / scale)) * 100;
  return (
    <article className="meter">
      <span>{label}</span>
      <strong>{format(value)}</strong>
      <i>
        <b style={{ width: `${width}%` }} />
      </i>
    </article>
  );
}

function Heading({
  eyebrow,
  title,
  badge,
  badgeClass,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
  badgeClass?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {badge ? <span className={`source-badge ${badgeClass ?? ""}`}>{badge}</span> : null}
    </div>
  );
}

function Provenance() {
  const featureId = useLab((s) => s.featureId);
  const setFeatureId = useLab((s) => s.setFeatureId);
  useLab((s) => s.rev);
  const records = Object.values(sim.catalog) as {
    feature_id: string;
    label: string;
    evidence_class: string;
    canonical_refs: string[];
    runtime_paths: string[];
    transform_chain: string[];
    projection_hash: string;
    discarded_information: string;
    permitted_interpretation: string;
    forbidden_extrapolation: string;
  }[];
  const record = (sim.catalog[featureId] || records[0]) as (typeof records)[0] | undefined;
  const rows: [string, string][] = record
    ? [
        ["Evidence", record.evidence_class],
        [
          "Canonical target",
          record.canonical_refs?.length ? record.canonical_refs.join(" → ") : "None — realization-local",
        ],
        ["Runtime source", record.runtime_paths.join(" → ")],
        ["Transform", record.transform_chain.join(" → ")],
        ["Projection", shortHash(record.projection_hash)],
        ["Discarded", record.discarded_information],
        ["Permitted", record.permitted_interpretation],
        ["Forbidden", record.forbidden_extrapolation],
      ]
    : [];
  if (sim.selectedEvent) {
    rows.push(["Selected event", JSON.stringify(sim.selectedEvent)]);
  }

  return (
    <section className="inspector-section">
      <Heading eyebrow="Evidence chain" title="Projection provenance" badge="auditable" />
      <label className="select-row">
        Feature
        <select value={record?.feature_id ?? ""} onChange={(event) => setFeatureId(event.target.value)}>
          {records.map((item) => (
            <option key={item.feature_id} value={item.feature_id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <div className="provenance-card">
        <dl style={{ margin: 0 }}>
          {rows.map(([term, detail]) => (
            <div className="prov-row" key={term}>
              <dt>{term}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Lab() {
  const running = useLab((s) => s.running);
  const setRunning = useLab((s) => s.setRunning);
  const speed = useLab((s) => s.speed);
  const setSpeed = useLab((s) => s.setSpeed);
  const view = useLab((s) => s.view);
  const setView = useLab((s) => s.setView);
  const scalarMode = useLab((s) => s.scalarMode);
  const setScalarMode = useLab((s) => s.setScalarMode);
  const layers = useLab((s) => s.layers);
  const setLayer = useLab((s) => s.setLayer);
  const fps = useLab((s) => s.fps);
  const liveMessage = useLab((s) => s.liveMessage);
  const stepOnce = useLab((s) => s.stepOnce);
  const resetEngine = useLab((s) => s.resetEngine);
  const rev = useLab((s) => s.rev);

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => {
      stepOnce();
    }, speed);
    return () => window.clearTimeout(id);
  }, [running, speed, rev, stepOnce]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = document.activeElement && (document.activeElement as HTMLElement).tagName;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag || "")) return;
      if (event.code === "Space") {
        event.preventDefault();
        setRunning(!useLab.getState().running);
      } else if (event.key === ".") stepOnce();
      else if (event.key.toLowerCase() === "r") resetEngine();
      else if (event.key === "1") setView("weather");
      else if (event.key === "2") setView("field");
      else if (event.key === "3") setView("terrain");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetEngine, setRunning, setView, stepOnce]);

  const frame = latestFrame();
  const weather = frame ? frame.weather : { label: "Unformed field", rationale: "No committed tick yet" };
  const rho = frame ? frame.rho : sim.state.psi.coherence;
  const phi = frame ? frame.phi_energy : 0;
  const gamma = frame ? frame.gamma_mag : 0;
  const reflex = frame ? frame.reflex_conf : 1;

  return (
    <div className="shell">
      <a className="skip-link" href="#viewport">
        Skip to viewport
      </a>
      <header className="topbar">
        <div className="brand" aria-label="QOSMOS Memory Weather">
          <span className="brand-mark" aria-hidden="true">
            Ξ
          </span>
          <span>
            <strong>Memory Weather</strong>
            <small>QOSMOS R¹² observer-field lab</small>
          </span>
        </div>
        <div className="status-strip">
          <span className="status-chip develop">DEVELOP</span>
          <span className="status-chip">v0.1.1 typed realization</span>
          <span className={`status-chip live${running ? " running" : ""}`}>{running ? "running" : "paused"}</span>
        </div>
        <div className="transport" aria-label="Simulation transport">
          <button className="primary" type="button" aria-pressed={running} onClick={() => setRunning(!running)}>
            <span aria-hidden="true">{running ? "Ⅱ" : "▶"}</span> {running ? "Pause" : "Run"}
          </button>
          <button type="button" onClick={() => stepOnce()}>
            <span aria-hidden="true">›</span> Step
          </button>
          <button type="button" onClick={resetEngine}>
            <span aria-hidden="true">↺</span> Reset
          </button>
          <label className="compact-control">
            Speed
            <select value={String(speed)} onChange={(event) => setSpeed(Number(event.target.value))}>
              <option value="180">slow</option>
              <option value="80">normal</option>
              <option value="28">fast</option>
            </select>
          </label>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel left-panel" aria-label="Layers and simulation controls">
          <section>
            <Heading eyebrow="Live telemetry" title="Ψmeta" badge="direct" badgeClass="direct" />
            <div className="meter-grid">
              <Meter label="Coherence ρ" value={rho} scale={1} />
              <Meter label="Flux energy Φ" value={phi} scale={2} />
              <Meter label="Gradient ‖Γ‖" value={gamma} scale={sim.state.config.gammaCap} />
              <Meter label="Reflex confidence" value={reflex} scale={1} />
            </div>
            <div className="weather-callout">
              <span className="weather-symbol" aria-hidden="true">
                ◌
              </span>
              <div>
                <strong>{weather.label}</strong>
                <small>{weather.rationale}</small>
              </div>
              <span className="source-badge interpretive">metaphor</span>
            </div>
          </section>

          <section>
            <Heading eyebrow="Viewport" title="Layer rack" />
            <label className="select-row">
              Scalar channel
              <select
                value={scalarMode}
                onChange={(event) => setScalarMode(event.target.value as ScalarMode)}
              >
                {SCALAR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="toggle-grid">
              {LAYER_LABELS.map((layer) => (
                <label key={layer.id}>
                  <input
                    type="checkbox"
                    checked={layers[layer.id]}
                    onChange={(event) => setLayer(layer.id, event.target.checked)}
                  />
                  <span>{layer.label}</span>
                </label>
              ))}
            </div>
          </section>

          <ForcingControls />
          <PeerControls />

          <section>
            <details>
              <summary>Mechanism ablations</summary>
              <Ablations />
            </details>
          </section>
        </aside>

        <section className="center-stage">
          <div className="viewport-toolbar">
            <div className="segmented" role="group" aria-label="Viewport mode">
              {(
                [
                  ["weather", "Memory Weather"],
                  ["field", "2D Field"],
                  ["terrain", "3D Terrain"],
                ] as [ViewMode, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={view === id ? "active" : ""}
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="viewport-meta">
              <span>{view === "terrain" ? "fixed 3×12 projection" : "fixed 2×12 projection"}</span>
              <span>{fps} fps</span>
            </div>
          </div>
          <Viewport />
          <div className="repro-bar" aria-label="Reproducibility identifiers">
            <span>
              <small>tick</small>
              <b>{sim.state.ctx.step}</b>
            </span>
            <span>
              <small>phase</small>
              <b>{sim.state.ctx.phase}</b>
            </span>
            <span>
              <small>ψ hash</small>
              <b>{shortHash(sim.state.currentHash)}</b>
            </span>
            <span>
              <small>projection</small>
              <b>{shortHash(sim.projection.matrixHash)}</b>
            </span>
            <span>
              <small>field</small>
              <b>{shortHash(sim.field.dataHash)}</b>
            </span>
          </div>
          <EventRail />
        </section>

        <aside className="panel right-panel" aria-label="Memory and provenance inspector">
          <MemoryPanel />
          <Provenance />
          <ReplayPanel />
          <section className="scope-card">
            <span className="eyebrow">Scope firewall</span>
            <p>
              This is a deterministic hybrid state-space and associative-memory realization. The viewport is not
              evidence of physics, quantum behavior, or consciousness.
            </p>
            <a href="https://github.com/donaldtuttle/qoft-calculus/blob/main/apps/memory-weather/docs/REALIZATION_CONTRACT.md">Read the exact contract</a>
          </section>
        </aside>
      </main>

      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>
      <Toast />
    </div>
  );
}

function ForcingControls() {
  const stimulusMode = useLab((s) => s.stimulusMode);
  const setStimulusMode = useLab((s) => s.setStimulusMode);
  const amplitude = useLab((s) => s.amplitude);
  const setAmplitude = useLab((s) => s.setAmplitude);
  const selectedBasin = useLab((s) => s.selectedBasin);
  const setSelectedBasin = useLab((s) => s.setSelectedBasin);

  return (
    <section>
      <Heading eyebrow="Observation" title="Φ forcing" />
      <label className="select-row">
        Preset
        <select value={stimulusMode} onChange={(event) => setStimulusMode(event.target.value)}>
          {STIMULUS_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="range-row">
        <span>
          Amplitude <output>{amplitude.toFixed(2)}</output>
        </span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={amplitude}
          onChange={(event) => setAmplitude(Number(event.target.value))}
        />
      </label>
      <label className="select-row">
        Basin target
        <select value={String(selectedBasin)} onChange={(event) => setSelectedBasin(Number(event.target.value))}>
          {Engine.BASINS.map((basin: { id: number; label: string }) => (
            <option key={basin.id} value={basin.id}>
              {basin.label}
            </option>
          ))}
        </select>
      </label>
      <p className="fine-print">
        Click the 2D viewport to supply an explicit forcing target. Ten hidden components receive no invented
        information.
      </p>
    </section>
  );
}

function PeerControls() {
  const peerEnabled = useLab((s) => s.peerEnabled);
  const setPeerEnabled = useLab((s) => s.setPeerEnabled);
  const coupling = useLab((s) => s.coupling);
  const setCoupling = useLab((s) => s.setCoupling);
  return (
    <section>
      <Heading eyebrow="DEVELOP extension" title="Multi-observer projection" badge="local" badgeClass="derived" />
      <label className="switch-row">
        <input type="checkbox" checked={peerEnabled} onChange={(event) => setPeerEnabled(event.target.checked)} />
        <span>Enable observer B</span>
      </label>
      <label className="range-row">
        <span>
          Coupling <output>{coupling.toFixed(2)}</output>
        </span>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={coupling}
          onChange={(event) => setCoupling(Number(event.target.value))}
        />
      </label>
      <p className="fine-print">
        Each observer keeps its own Πᴽ, Γ, ρ, memory, Λψ policy, and telemetry. Coupling uses a frozen prior-state
        snapshot so processing order cannot steer the result.
      </p>
    </section>
  );
}

function Ablations() {
  const ablations = useLab((s) => s.ablations);
  const setAblation = useLab((s) => s.setAblation);
  return (
    <div className="toggle-grid ablations">
      {ABLATION_KEYS.map(([key, label]) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={Boolean(ablations[key])}
            onChange={(event) => setAblation(key, event.target.checked)}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

function EventRail() {
  useLab((s) => s.rev);
  const selectEvent = useLab((s) => s.selectEvent);
  const events = sim.state.events as {
    eventId: string;
    kind: string;
    basinLabel?: string;
    label?: string;
    toBasinLabel?: string;
    step: number;
    rho?: number;
    postHash?: string;
    sourceStateHash?: string;
    sourceHash?: string;
  }[];

  return (
    <section className="event-rail" aria-labelledby="eventTitle">
      <div className="section-heading rail-heading">
        <div>
          <span className="eyebrow">Committed artifacts</span>
          <h2 id="eventTitle">Event rail</h2>
        </div>
        <div className="rail-counts">
          <span>{sim.state.counters.collapse} Λψ</span>
          <span>{sim.state.counters.memoryWrites} writes</span>
          <span>{sim.state.counters.summaries} Σ◯</span>
        </div>
      </div>
      <div className="timeline">
        {events.length === 0 ? (
          <p className="empty-state">Run the engine or inscribe a memory to create auditable events.</p>
        ) : (
          events.slice(-48).map((event) => (
            <button
              key={event.eventId}
              type="button"
              className={`event-card ${event.kind}`}
              onClick={() => selectEvent(event)}
            >
              <strong>{eventTitle(event)}</strong>
              <small>{eventMeta(event)}</small>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function eventTitle(event: { kind: string; basinLabel?: string; label?: string; toBasinLabel?: string }) {
  if (event.kind === "collapse") return `Λψ · ${event.basinLabel}`;
  if (event.kind === "memory-write") return `Write · ${event.label}`;
  if (event.kind === "summary") return "Σ◯ · mesh node";
  if (event.kind === "basin-transition") return `Basin · ${event.toBasinLabel}`;
  return event.kind;
}

function eventMeta(event: {
  kind: string;
  step: number;
  rho?: number;
  postHash?: string;
  sourceStateHash?: string;
  sourceHash?: string;
}) {
  if (event.kind === "collapse") return `t${event.step} · ρ ${format(event.rho ?? 0, 2)} · ${shortHash(event.postHash)}`;
  if (event.kind === "memory-write") return `t${event.step} · ${shortHash(event.sourceStateHash)}`;
  if (event.kind === "summary") return `t${event.step} · ${shortHash(event.sourceHash)}`;
  return `t${event.step} · direct event`;
}

function MemoryPanel() {
  useLab((s) => s.rev);
  const memoryLabel = useLab((s) => s.memoryLabel);
  const setMemoryLabel = useLab((s) => s.setMemoryLabel);
  const memoryWeight = useLab((s) => s.memoryWeight);
  const setMemoryWeight = useLab((s) => s.setMemoryWeight);
  const inscribe = useLab((s) => s.inscribe);
  const recall = useLab((s) => s.recall);
  const requestCollapse = useLab((s) => s.requestCollapse);
  const memories = [...sim.state.memories].reverse() as {
    memoryId: string;
    label: string;
    weight: number;
    createdStep: number;
    sourceStateHash: string;
  }[];

  return (
    <section>
      <Heading eyebrow="Local artifacts" title="Memory" badge="realization" badgeClass="derived" />
      <label className="sr-only" htmlFor="memoryInput">
        Memory label or recall query
      </label>
      <input
        id="memoryInput"
        type="text"
        maxLength={120}
        value={memoryLabel}
        placeholder="Memory label or recall query"
        autoComplete="off"
        onChange={(event) => setMemoryLabel(event.target.value)}
      />
      <label className="range-row">
        <span>
          Event weight <output>{memoryWeight.toFixed(2)}</output>
        </span>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.05"
          value={memoryWeight}
          onChange={(event) => setMemoryWeight(Number(event.target.value))}
        />
      </label>
      <div className="button-row">
        <button className="primary" type="button" onClick={inscribe}>
          Inscribe memory
        </button>
        <button type="button" onClick={recall}>
          Recall Θλ
        </button>
      </div>
      <button className="full-width warning" type="button" onClick={requestCollapse}>
        Request Λψ on next tick
      </button>
      <ul className="memory-list">
        {memories.length === 0 ? (
          <li className="empty-state">No inscriptions yet. Σ◯ summaries remain a separate mechanism.</li>
        ) : (
          memories.map((memory) => (
            <li key={memory.memoryId}>
              <strong>{memory.label}</strong>
              <b>w {memory.weight.toFixed(2)}</b>
              <small>
                t{memory.createdStep} · {memory.memoryId.split(":").pop()} · {shortHash(memory.sourceStateHash)}
              </small>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function ReplayPanel() {
  const seed = useLab((s) => s.seed);
  const setSeed = useLab((s) => s.setSeed);
  const exportReplay = useLab((s) => s.exportReplay);
  const exportCsv = useLab((s) => s.exportCsv);
  const loadDemo = useLab((s) => s.loadDemo);
  const importReplay = useLab((s) => s.importReplay);
  const toastMessage = useLab((s) => s.toastMessage);

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    try {
      if (file) await importReplay(file);
    } catch (error) {
      toastMessage(`Import rejected: ${error instanceof Error ? error.message : "invalid replay"}`);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section>
      <Heading eyebrow="Replay" title="Seed & files" />
      <label className="select-row">
        Seed
        <input
          type="number"
          min={0}
          max={4294967295}
          step={1}
          value={seed}
          onChange={(event) => setSeed(Number(event.target.value))}
        />
      </label>
      <div className="button-row">
        <button type="button" onClick={exportReplay}>
          Export replay
        </button>
        <button type="button" onClick={exportCsv}>
          Telemetry CSV
        </button>
      </div>
      <button className="full-width" type="button" onClick={loadDemo}>
        Load fixed-seed demo
      </button>
      <input id="importFile" type="file" accept="application/json,.json" hidden onChange={onImport} />
      <button className="full-width" type="button" onClick={() => document.getElementById("importFile")?.click()}>
        Import replay JSON
      </button>
      <p className="fine-print">Files stay local. Imported text is parsed as data and never executed.</p>
    </section>
  );
}

function Toast() {
  const toast = useLab((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => useLab.setState({ toast: null }), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <div id="toast" role="status" aria-live="polite">
      {toast}
    </div>
  );
}
