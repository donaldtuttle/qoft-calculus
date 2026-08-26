import type { Ablations, EngineConfig, PsiMetaFrame } from "../../../src/engine.ts";
import { assertSessionCompliance } from "./compliance.ts";
import {
  PERSISTENT_STIMULI,
  type LiveConfigPatch,
  type PersistentStimulus,
  type QosmosSession,
  type SessionSnapshot,
  type SessionStep,
} from "./session.ts";
import {
  PROBE_EMPTY_DIGEST,
  PROBE_REFERENCE_64,
  PROBE_RUNTIME,
  appendProbeDigest,
  createProbeSession,
  digestProbeExport,
  probeHoldTicks,
  runProbeReference64,
  verifyProbeSession,
} from "./probe-runtime.ts";

const D = 12;
const CX = 170;
const CY = 118;
const R = 92;

function required<T extends Element>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing compact probe element: #${id}`);
  return node as unknown as T;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function format(value: number | undefined, digits = 3): string {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : "—";
}

function radarPoints(vector: readonly number[]): string {
  return vector.map((value, index) => {
    const angle = (index / D) * Math.PI * 2 - Math.PI / 2;
    const radius = clamp((value + 2) / 4, 0, 1) * R;
    return `${(CX + Math.cos(angle) * radius).toFixed(1)},${(CY + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
}

function drawRadarGrid(): void {
  const grid = required<SVGGElement>("grid");
  const labels = required<SVGGElement>("axis-labels");
  const gridNodes: SVGElement[] = [];
  const labelNodes: SVGElement[] = [];

  for (const fraction of [0.25, 0.5, 0.75, 1]) {
    gridNodes.push(svgElement("circle", {
      cx: String(CX),
      cy: String(CY),
      r: (R * fraction).toFixed(1),
      fill: "none",
      stroke: "#1d3038",
    }));
  }

  for (let index = 0; index < D; index += 1) {
    const angle = (index / D) * Math.PI * 2 - Math.PI / 2;
    gridNodes.push(svgElement("line", {
      x1: String(CX),
      y1: String(CY),
      x2: (CX + Math.cos(angle) * R).toFixed(1),
      y2: (CY + Math.sin(angle) * R).toFixed(1),
      stroke: "#1d3038",
    }));
    const label = svgElement("text", {
      x: (CX + Math.cos(angle) * (R + 16)).toFixed(1),
      y: (CY + Math.sin(angle) * (R + 16) + 4).toFixed(1),
      "text-anchor": "middle",
      "font-size": "11",
      fill: "#4d6570",
    });
    label.textContent = String(index + 1);
    labelNodes.push(label);
  }

  grid.replaceChildren(...gridNodes);
  labels.replaceChildren(...labelNodes);
}

function sparkPoints(frames: readonly PsiMetaFrame[], field: "rho" | "entropy"): string {
  return frames.map((frame, index) => {
    const x = frames.length < 2 ? 2 : (index / (frames.length - 1)) * 336 + 2;
    const y = 70 - clamp(frame[field], 0, 1) * 64;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function disableEngineControls(message: string): void {
  document.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>("button, input, select")
    .forEach((control) => { control.disabled = true; });
  const stage = required<SVGSVGElement>("stage");
  stage.setAttribute("aria-disabled", "true");
  stage.removeAttribute("tabindex");
  required<HTMLElement>("badge").textContent = "engine: unavailable";
  required<HTMLElement>("engine-path").textContent = "No fallback was started.";
  required<HTMLElement>("summary").textContent = message;
  required<HTMLElement>("out").textContent = message;
}

function boot(): void {
  let session: QosmosSession;
  try {
    const nonce = new Uint32Array(2);
    crypto.getRandomValues(nonce);
    const runId = `qosmos-probe-${[...nonce].map((value) => value.toString(16).padStart(8, "0")).join("")}`;
    session = createProbeSession({ runId, seed: PROBE_REFERENCE_64.seed });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown engine initialization error";
    disableEngineControls(`Engine unavailable: ${detail}`);
    return;
  }

  const badge = required<HTMLElement>("badge");
  badge.textContent = `engine: ${PROBE_RUNTIME.realization}`;
  badge.title = PROBE_RUNTIME.realization;
  required<HTMLElement>("engine-path").textContent = `${PROBE_RUNTIME.transitionPath} · blob ${PROBE_RUNTIME.engineGitBlob.slice(0, 12)} · fallback disabled`;

  const modeSelect = required<HTMLSelectElement>("mode");
  modeSelect.replaceChildren(...PERSISTENT_STIMULI.map((mode) => {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = mode;
    return option;
  }));

  let timer: number | undefined;
  let traceDigest = PROBE_EMPTY_DIGEST as string;

  function report(message: string): void {
    required<HTMLElement>("out").textContent = message;
  }

  function stopTimer(): void {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  }

  function drawEvents(snapshot: SessionSnapshot): void {
    const container = required<HTMLElement>("events");
    const events = snapshot.eventHistory.events.slice(-6).reverse();
    if (!events.length) {
      const empty = document.createElement("span");
      empty.className = "lab";
      empty.textContent = "no collapse yet";
      container.replaceChildren(empty);
      return;
    }
    container.replaceChildren(...events.map((event) => {
      const row = document.createElement("div");
      row.className = "ev mono";
      row.textContent = `t${event.step} · ${event.reason} · ρ ${event.rho.toFixed(3)} · ${event.preHash} → ${event.postHash}`;
      return row;
    }));
  }

  function draw(): void {
    const snapshot = session.snapshot();
    const latest = snapshot.latestFrame;
    const rho = latest?.rho ?? snapshot.psi.coherence;
    const holdTicks = probeHoldTicks(snapshot);
    const regime = latest?.collapseTriggered
      ? "Λψ"
      : holdTicks > 0
        ? `hold ${holdTicks}`
        : rho >= snapshot.config.tau
          ? "near-Λψ"
          : "drift";

    required<SVGPolygonElement>("p-psi").setAttribute("points", radarPoints(snapshot.psi.latent));
    required<SVGPolygonElement>("p-self").setAttribute("points", radarPoints(snapshot.selfModel));

    const gammaNodes = snapshot.priorGamma.map((component, index) => {
      const angle = (index / D) * Math.PI * 2 - Math.PI / 2;
      const startRadius = clamp((snapshot.psi.latent[index]! + 2) / 4, 0, 1) * R;
      const endRadius = clamp(startRadius + component * 32, 0, R + 12);
      return svgElement("line", {
        x1: (CX + Math.cos(angle) * startRadius).toFixed(1),
        y1: (CY + Math.sin(angle) * startRadius).toFixed(1),
        x2: (CX + Math.cos(angle) * endRadius).toFixed(1),
        y2: (CY + Math.sin(angle) * endRadius).toFixed(1),
        stroke: "#ff7a45",
        "stroke-width": "2",
        "stroke-linecap": "round",
      });
    });
    required<SVGGElement>("p-gamma").replaceChildren(...gammaNodes);

    required<HTMLElement>("tick").textContent = String(snapshot.psi.t);
    required<HTMLElement>("hash").textContent = snapshot.psiHash;
    required<HTMLElement>("digest").textContent = traceDigest;
    required<HTMLElement>("rho").textContent = rho.toFixed(3);
    required<HTMLElement>("entropy").textContent = format(latest?.entropy);
    required<HTMLElement>("gamma").textContent = format(latest?.gammaMag);
    required<HTMLElement>("mesh").textContent = `${snapshot.mesh.length} · ${regime}`;

    const frames = snapshot.recentFrames;
    required<SVGPolylineElement>("rho-line").setAttribute("points", sparkPoints(frames, "rho"));
    required<SVGPolylineElement>("entropy-line").setAttribute("points", sparkPoints(frames, "entropy"));
    const tauY = 70 - snapshot.config.tau * 64;
    const tauLine = required<SVGLineElement>("tau-line");
    tauLine.setAttribute("y1", String(tauY));
    tauLine.setAttribute("y2", String(tauY));

    const sparkDescription = latest
      ? `${frames.length} recent frames. Latest coherence ${rho.toFixed(3)}, entropy ${latest.entropy.toFixed(3)}, threshold ${snapshot.config.tau.toFixed(2)}.`
      : "Awaiting the first committed tick.";
    required<SVGDescElement>("spark-desc").textContent = sparkDescription;
    required<HTMLElement>("summary").textContent = latest
      ? `Tick ${snapshot.psi.t}: ρ ${rho.toFixed(3)}, H ${latest.entropy.toFixed(3)}, ‖Γ‖ ${latest.gammaMag.toFixed(3)}, Φ ${latest.phiEnergy.toFixed(3)}, ${snapshot.eventHistory.total} Λψ events, ${snapshot.mesh.length} Σ◯ nodes, ${regime}.`
      : "Awaiting first committed tick.";

    drawEvents(snapshot);

    const atLimit = snapshot.frameCount >= snapshot.maxTicks;
    const play = required<HTMLButtonElement>("play");
    play.textContent = snapshot.playing ? "pause" : "run";
    play.disabled = atLimit;
    required<HTMLButtonElement>("step").disabled = atLimit;
    required<HTMLButtonElement>("pulse").disabled = atLimit;
    required<SVGSVGElement>("stage").setAttribute("aria-disabled", String(atLimit));
    required<SVGSVGElement>("stage").setAttribute(
      "aria-label",
      `Twelve-axis observer field at tick ${snapshot.psi.t}; coherence ${rho.toFixed(3)}; ${snapshot.pulsePending ? "Phi pulse queued" : "activate for one Phi pulse"}.`,
    );

    required<HTMLInputElement>("tau").value = String(snapshot.config.tau);
    required<HTMLOutputElement>("tau-out").textContent = snapshot.config.tau.toFixed(2);
    required<HTMLInputElement>("gamma-scale").value = String(snapshot.config.gammaScale);
    required<HTMLOutputElement>("gamma-out").textContent = snapshot.config.gammaScale.toFixed(2);
    required<HTMLInputElement>("omega").value = String(snapshot.config.omegaAmp);
    required<HTMLOutputElement>("omega-out").textContent = snapshot.config.omegaAmp.toFixed(3);
    modeSelect.value = snapshot.persistentStimulus;
    document.querySelectorAll<HTMLInputElement>("[data-ablation]").forEach((input) => {
      const key = input.dataset.ablation as keyof Ablations;
      input.checked = !snapshot.config.ablations[key];
    });
  }

  function commit(step: SessionStep): void {
    traceDigest = appendProbeDigest(traceDigest, step.psiHash);
    draw();
  }

  function handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : "The probe operation failed.";
    report(message);
    required<HTMLElement>("summary").textContent = message;
    draw();
  }

  function syncTimer(): void {
    stopTimer();
    if (!session.snapshot().playing) return;
    const ticksPerSecond = Number(required<HTMLInputElement>("speed").value);
    timer = window.setInterval(() => {
      try {
        const step = session.tick();
        if (step) commit(step);
        if (!session.snapshot().playing) stopTimer();
      } catch (error) {
        session.pause();
        stopTimer();
        handleError(error);
      }
    }, 1000 / ticksPerSecond);
  }

  function togglePlay(): void {
    session.togglePlaying();
    draw();
    syncTimer();
  }

  function stepOnce(): void {
    session.pause();
    stopTimer();
    try {
      commit(session.step());
    } catch (error) {
      handleError(error);
    }
  }

  function queuePulse(): void {
    try {
      session.queuePulse();
      if (session.snapshot().playing) draw();
      else commit(session.step());
    } catch (error) {
      handleError(error);
    }
  }

  function applyConfig(patch: LiveConfigPatch): void {
    const wasPlaying = session.snapshot().playing;
    session.pause();
    stopTimer();
    try {
      session.updateConfig(patch);
      traceDigest = PROBE_EMPTY_DIGEST;
      if (wasPlaying) session.play();
      report("Configuration changed; a fresh fixed-config run was started.");
      draw();
      syncTimer();
    } catch (error) {
      handleError(error);
    }
  }

  function applyAblation(key: keyof Ablations, off: boolean): void {
    const wasPlaying = session.snapshot().playing;
    session.pause();
    stopTimer();
    try {
      session.setAblations({ [key]: !off });
      traceDigest = PROBE_EMPTY_DIGEST;
      if (wasPlaying) session.play();
      report(`${key} ${off ? "ablated" : "enabled"}; a fresh fixed-config run was started.`);
      draw();
      syncTimer();
    } catch (error) {
      handleError(error);
    }
  }

  required<HTMLButtonElement>("play").addEventListener("click", togglePlay);
  required<HTMLButtonElement>("step").addEventListener("click", stepOnce);
  required<HTMLButtonElement>("pulse").addEventListener("click", queuePulse);
  required<HTMLButtonElement>("reseed").addEventListener("click", () => {
    const seed = new Uint32Array(1);
    crypto.getRandomValues(seed);
    const wasPlaying = session.snapshot().playing;
    session.pause();
    stopTimer();
    session.reset({ seed: `0x${seed[0]!.toString(16).padStart(8, "0")}`, playing: wasPlaying });
    traceDigest = PROBE_EMPTY_DIGEST;
    report("New cryptographic UI seed selected; run-local state and history were cleared.");
    draw();
    syncTimer();
  });

  const ranges: Array<{
    input: string;
    output: string;
    key: keyof Pick<EngineConfig, "tau" | "gammaScale" | "omegaAmp">;
    digits: number;
  }> = [
    { input: "tau", output: "tau-out", key: "tau", digits: 2 },
    { input: "gamma-scale", output: "gamma-out", key: "gammaScale", digits: 2 },
    { input: "omega", output: "omega-out", key: "omegaAmp", digits: 3 },
  ];
  for (const range of ranges) {
    const input = required<HTMLInputElement>(range.input);
    input.addEventListener("input", () => {
      required<HTMLOutputElement>(range.output).textContent = Number(input.value).toFixed(range.digits);
    });
    input.addEventListener("change", () => applyConfig({ [range.key]: Number(input.value) }));
  }

  required<HTMLInputElement>("speed").addEventListener("input", (event) => {
    const value = (event.currentTarget as HTMLInputElement).value;
    required<HTMLOutputElement>("speed-out").textContent = value;
    syncTimer();
  });

  modeSelect.addEventListener("change", () => {
    try {
      session.setFluxMode(modeSelect.value as PersistentStimulus);
      report(`${modeSelect.value} will drive the next committed tick and is recorded in the replay schedule.`);
      draw();
    } catch (error) {
      handleError(error);
    }
  });

  document.querySelectorAll<HTMLInputElement>("[data-ablation]").forEach((input) => {
    input.addEventListener("change", () => applyAblation(input.dataset.ablation as keyof Ablations, input.checked));
  });

  const stage = required<SVGSVGElement>("stage");
  stage.addEventListener("click", queuePulse);
  stage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      queuePulse();
    }
  });

  required<HTMLButtonElement>("verify").addEventListener("click", () => {
    session.pause();
    stopTimer();
    try {
      const verification = verifyProbeSession(session);
      const passed = verification.checks.filter((check) => check.status === "pass").length;
      const notTested = verification.checks.filter((check) => check.status === "not-tested").length;
      report(`current-run deterministic replay\nengine  ${PROBE_RUNTIME.realization}\nchecks  ${passed}/${verification.checks.length} pass${notTested ? ` · ${notTested} not tested` : ""}\nhash    ${session.snapshot().psiHash}\ntrace   ${traceDigest}\nresult  ${verification.compliant ? "PASS" : "FAIL"}${verification.failures.length ? `\nfailed  ${verification.failures.map((failure) => failure.id).join(", ")}` : ""}`);
      draw();
    } catch (error) {
      handleError(error);
    }
  });

  required<HTMLButtonElement>("reference").addEventListener("click", () => {
    session.pause();
    stopTimer();
    try {
      const reference = runProbeReference64();
      report(`64-tick Public Typed Realization A reference\nseed     ${PROBE_REFERENCE_64.seed}\nstimulus ${PROBE_REFERENCE_64.stimulus}\nfinal    ${reference.data.psiHash}\nexpected ${PROBE_REFERENCE_64.expectedFinalHash}\ntrace    ${reference.digest}\nreplay   ${reference.compliance.compliant ? "PASS" : "FAIL"}\npin      ${reference.matchesPin ? "PASS" : "FAIL"}\n\nThis pins this software realization only; the trace digest is probe-local.`);
      draw();
    } catch (error) {
      handleError(error);
    }
  });

  required<HTMLButtonElement>("export").addEventListener("click", () => {
    session.pause();
    stopTimer();
    try {
      const data = session.exportData();
      assertSessionCompliance(data);
      const recomputedDigest = digestProbeExport(data);
      if (recomputedDigest !== traceDigest) {
        throw new Error(`Probe digest mismatch: rendered ${traceDigest}, replayed ${recomputedDigest}`);
      }
      const trace = {
        ...data,
        compactProbe: {
          runtime: PROBE_RUNTIME,
          traceDigest,
          digestScope: "committed post-tick psi hashes; probe-local non-cryptographic helper",
        },
      };
      const blob = new Blob([JSON.stringify(trace, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qosmos-r12-probe-${String(data.seedInput).replace(/[^a-z0-9_-]+/gi, "_")}-t${data.frameCount}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      report(`exported ${link.download}\nreplay PASS · hash ${data.psiHash} · trace ${traceDigest}`);
      draw();
    } catch (error) {
      handleError(error);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target?.matches("input, textarea, select, button") || target?.isContentEditable) return;
    const key = event.key.toLowerCase();
    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    } else if (key === "s") {
      event.preventDefault();
      stepOnce();
    } else if (key === "p") {
      event.preventDefault();
      queuePulse();
    }
  });

  window.addEventListener("beforeunload", stopTimer);
  drawRadarGrid();
  draw();
}

boot();
