// @ts-nocheck
/* ESM wrapper around apps/memory-weather/src/engine.js. Factory body is copied from the sibling file. */
import M from "./math.js";
const api = (function (M) {
  "use strict";

  const DIMENSION = 12;
  const ENGINE_ID = "qosmos-memory-weather/mw-r12";
  const ENGINE_VERSION = "0.1.1";
  const SCHEMA_VERSION = "mw-replay/0.1";
  const ZERO = Object.freeze(Array(DIMENSION).fill(0));

  const BASIN_SOURCE = [
    [1.0, 0.7, 0.2, -0.1, 0.4, -0.2, 0.8, 0.1, -0.3, 0.5, 0.2, -0.4],
    [-0.3, 1.0, 0.5, 0.4, -0.6, 0.1, -0.2, 0.8, 0.2, -0.5, 0.3, 0.6],
    [0.2, -0.4, 1.0, 0.6, 0.1, 0.7, -0.5, -0.2, 0.8, 0.2, -0.6, 0.1],
    [-0.8, 0.1, -0.2, 1.0, 0.5, -0.4, 0.3, -0.6, 0.1, 0.7, 0.4, -0.2],
    [0.6, -0.5, 0.3, -0.2, 1.0, 0.4, 0.1, 0.7, -0.6, 0.2, 0.5, -0.3],
    [-0.2, 0.6, -0.7, 0.3, -0.1, 1.0, 0.5, 0.2, 0.4, -0.6, 0.1, 0.8]
  ];
  const BASIN_LABELS = ["closure", "insight", "identity", "tension", "recall", "threshold"];
  const BASINS = Object.freeze(BASIN_SOURCE.map((latent, id) => Object.freeze({
    id,
    label: BASIN_LABELS[id],
    latent: Object.freeze(M.normalize(latent, 1.55))
  })));

  const DEFAULT_CONFIG = Object.freeze({
    seed: 12062026,
    dimension: DIMENSION,
    componentLimit: 2,
    radialLimit: 2,
    reflexRate: 0.1,
    gammaScale: 0.92,
    gammaCap: 1.4,
    coherenceEma: 0.24,
    collapseThreshold: 0.78,
    collapseDwell: 2,
    collapseHold: 6,
    collapseMix: 0.82,
    summarizeEvery: 12,
    meshCap: 48,
    traceCap: 720,
    frameCap: 720,
    eventCap: 360,
    omegaAmp: 0.055,
    memoryBias: 0.18,
    recallThreshold: 0.15,
    couplingStrength: 0.14,
    stimulusMode: "periodic",
    stimulusAmplitude: 0.82,
    selectedBasin: 1,
    ablations: Object.freeze({
      collapse: true,
      memoryWrite: true,
      thetaReplay: true,
      summarize: true,
      omega: true,
      rhoGate: true,
      reflexAdaptation: true,
      coupling: true
    })
  });

  const NUMERIC_RANGES = {
    componentLimit: [0.1, 20],
    radialLimit: [0.1, 20],
    reflexRate: [0, 1],
    gammaScale: [0, 10],
    gammaCap: [0.01, 20],
    coherenceEma: [0, 1],
    collapseThreshold: [0, 1],
    collapseMix: [0, 1],
    omegaAmp: [0, 1],
    memoryBias: [0, 2],
    recallThreshold: [-1, 1],
    couplingStrength: [0, 1],
    stimulusAmplitude: [0, 4]
  };
  const INTEGER_RANGES = {
    collapseDwell: [1, 1000],
    collapseHold: [0, 10000],
    summarizeEvery: [1, 10000],
    meshCap: [1, 10000],
    traceCap: [24, 100000],
    frameCap: [24, 100000],
    eventCap: [24, 100000],
    selectedBasin: [0, BASINS.length - 1]
  };
  const STIMULUS_MODES = new Set(["quiet", "align", "disrupt", "pulse", "periodic", "basin"]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createConfig(overrides = {}) {
    const config = {
      ...clone(DEFAULT_CONFIG),
      ...clone(overrides),
      ablations: { ...DEFAULT_CONFIG.ablations, ...(overrides.ablations || {}) }
    };
    if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffffffff) {
      throw new RangeError("seed must be an unsigned 32-bit integer");
    }
    if (config.dimension !== DIMENSION) throw new RangeError(`dimension must remain ${DIMENSION}`);
    for (const [key, [lo, hi]] of Object.entries(NUMERIC_RANGES)) {
      const value = M.assertFinite(config[key], key);
      if (value < lo || value > hi) throw new RangeError(`${key} must be in [${lo}, ${hi}]`);
    }
    for (const [key, [lo, hi]] of Object.entries(INTEGER_RANGES)) {
      const value = config[key];
      if (!Number.isInteger(value) || value < lo || value > hi) {
        throw new RangeError(`${key} must be an integer in [${lo}, ${hi}]`);
      }
    }
    if (!STIMULUS_MODES.has(config.stimulusMode)) throw new RangeError("unsupported stimulusMode");
    for (const [key, value] of Object.entries(config.ablations)) {
      if (typeof value !== "boolean") throw new TypeError(`ablations.${key} must be boolean`);
    }
    return config;
  }

  function runIdFor(config, observerId = "observer-a") {
    const digest = M.contentHash({ seed: config.seed, observerId, engine: ENGINE_VERSION }).split(":")[1];
    return `mw-${digest.slice(0, 10)}`;
  }

  function initialLatent(config, observerId) {
    const observerOffset = M.fnv1a32(observerId);
    const vector = Array.from({ length: DIMENSION }, (_, i) =>
      0.18 * M.keyedGaussian(config.seed ^ observerOffset, "initial-state", 0, i)
    );
    return M.boundVector(vector, config.componentLimit, Math.min(0.72, config.radialLimit));
  }

  function psiHash(psi) {
    return M.contentHash({
      id: psi.id,
      t: psi.t,
      latent: psi.latent,
      coherence: psi.coherence,
      fluxEnergy: psi.fluxEnergy,
      basinId: psi.basinId == null ? null : psi.basinId
    });
  }

  function createState(overrides = {}) {
    const config = createConfig(overrides.config || overrides);
    const observerId = overrides.observerId || "observer-a";
    const latent = initialLatent(config, observerId);
    const runId = runIdFor(config, observerId);
    const psi = {
      id: `${observerId}:0`,
      observerId,
      t: 0,
      latent,
      coherence: 0.42,
      fluxEnergy: 0,
      basinId: null
    };
    return {
      schemaVersion: SCHEMA_VERSION,
      engineId: ENGINE_ID,
      engineVersion: ENGINE_VERSION,
      runId,
      config,
      psi,
      selfModel: latent.map((value) => value * 0.88),
      lastReflex: null,
      lastGamma: { vec: [...ZERO], magnitude: 0, basis: "R12Gradient" },
      lastFlux: { fieldId: "initial", data: [...ZERO], timestamp: 0, energy: 0, omega: null, recall: null },
      ctx: {
        step: 0,
        phase: 0,
        collapseDwellCount: 0,
        holdRemaining: 0,
        forceCollapse: false,
        forcingVector: null,
        forcingLabel: null,
        couplingVector: null,
        couplingSourceHash: null,
        pendingRecall: null,
        recallQuery: "",
        selectedBasin: config.selectedBasin,
        stimulusMode: config.stimulusMode,
        stimulusAmplitude: config.stimulusAmplitude
      },
      frames: [],
      trace: [],
      events: [],
      mesh: [],
      memories: [],
      counters: {
        collapse: 0,
        summaries: 0,
        memoryWrites: 0,
        recallApplied: 0,
        recallEligible: 0,
        wouldCollapse: 0
      },
      currentHash: psiHash(psi)
    };
  }

  function appendBounded(target, value, cap) {
    target.push(value);
    if (target.length > cap) target.splice(0, target.length - cap);
  }

  function nearestBasin(latent) {
    let best = BASINS[0];
    let bestDistance = Infinity;
    for (const basin of BASINS) {
      const distance = M.distance(latent, basin.latent);
      if (distance < bestDistance) {
        best = basin;
        bestDistance = distance;
      }
    }
    return { basin: best, distance: bestDistance };
  }

  function omegaSample(state) {
    const enabled = state.config.ablations.omega;
    const lastFrame = state.frames[state.frames.length - 1];
    const stuckBoost = lastFrame && lastFrame.rho > 0.84 && lastFrame.drift < 0.012 ? 1.55 : 1;
    const amp = enabled ? state.config.omegaAmp * stuckBoost : 0;
    const vec = Array.from({ length: DIMENSION }, (_, i) =>
      amp * M.keyedGaussian(state.config.seed, `${state.psi.observerId}:omega`, state.ctx.step, i)
    );
    return {
      enabled,
      stream: `${state.psi.observerId}:omega`,
      seed: state.config.seed,
      step: state.ctx.step,
      amp,
      kind: enabled ? (stuckBoost > 1 ? "stuck-boost" : "bounded-gaussian") : "ablated-zero",
      vec
    };
  }

  function reflexProject(state) {
    const beta = state.config.ablations.reflexAdaptation ? state.config.reflexRate : 0;
    const proposalSelfModel = M.boundVector(
      M.mix(state.selfModel, state.psi.latent, beta),
      state.config.componentLimit,
      state.config.radialLimit
    );
    return {
      latent: [...proposalSelfModel],
      selfModel: [...proposalSelfModel],
      proposalSelfModel,
      confidence: Math.exp(-M.distance(state.psi.latent, proposalSelfModel)),
      basis: "PsiReflexR12"
    };
  }

  function stimulusVector(state) {
    const { seed } = state.config;
    const { step, stimulusMode: mode, stimulusAmplitude: amplitude } = state.ctx;
    if (state.ctx.forcingVector) return M.scale(state.ctx.forcingVector, amplitude);
    if (mode === "quiet") return [...ZERO];
    if (mode === "align") {
      const target = nearestBasin(state.psi.latent).basin.latent;
      return M.scale(target, amplitude);
    }
    if (mode === "basin") return M.scale(BASINS[state.ctx.selectedBasin].latent, amplitude);
    if (mode === "disrupt") {
      return M.normalize(Array.from({ length: DIMENSION }, (_, i) =>
        M.keyedGaussian(seed, `${state.psi.observerId}:disrupt`, step, i)
      ), amplitude);
    }
    if (mode === "pulse") {
      const out = Array(DIMENSION).fill(0);
      const axis = Math.floor(step / 18) % DIMENSION;
      out[axis] = amplitude * (Math.sin(step * 0.33) >= 0 ? 1 : -1);
      out[(axis + 5) % DIMENSION] = 0.35 * amplitude * Math.cos(step * 0.21);
      return out;
    }
    return Array.from({ length: DIMENSION }, (_, i) =>
      amplitude * (0.54 * Math.sin(step * 0.071 + i * 0.63) + 0.24 * Math.cos(step * 0.043 - i * 0.37))
    );
  }

  function sampleFlux(state, omega) {
    const base = stimulusVector(state);
    const recall = state.config.ablations.thetaReplay ? state.ctx.pendingRecall : null;
    const recallBias = recall ? M.scale(recall.latent, state.config.memoryBias * recall.similarity) : [...ZERO];
    const coupling = state.config.ablations.coupling && state.ctx.couplingVector ? state.ctx.couplingVector : ZERO;
    const data = M.boundVector(
      M.add(M.add(M.add(base, omega.vec), recallBias), coupling),
      state.config.componentLimit,
      state.config.radialLimit
    );
    const energy = M.norm(data);
    return {
      fieldId: `${state.runId}:phi:${state.ctx.step}`,
      data,
      timestamp: state.ctx.step,
      energy,
      source: state.ctx.forcingVector ? "explicit-projected-forcing" : `preset:${state.ctx.stimulusMode}`,
      omega,
      recall: recall ? {
        packetId: recall.packetId,
        memoryId: recall.memoryId,
        similarity: recall.similarity,
        applied: true
      } : null,
      coupling: state.config.ablations.coupling && state.ctx.couplingVector ? {
        sourceHash: state.ctx.couplingSourceHash,
        magnitude: M.norm(state.ctx.couplingVector),
        applied: true,
        classification: "DEVELOP multi-observer coupling"
      } : null
    };
  }

  function gradientOf(state, flux) {
    const gate = state.config.ablations.rhoGate ? 0.2 + 0.8 * state.psi.coherence : 0.6;
    let vec = M.scale(M.sub(flux.data, state.psi.latent), state.config.gammaScale * gate);
    const magnitude = M.norm(vec);
    if (magnitude > state.config.gammaCap) vec = M.scale(vec, state.config.gammaCap / magnitude);
    return {
      vec,
      magnitude: M.norm(vec),
      basis: "R12Gradient",
      proxy: "Phi.data - Psi.latent",
      rhoGate: gate
    };
  }

  // Declared ⊕ realization: external typed fusion is implemented only through
  // repᴽ, repG, mergeR, decode, and projectPsi. Arithmetic occurs inside mergeR.
  function repReflex(psiReflex) {
    return { kind: "FusionCarrierR12/reflex", vec: [...psiReflex.latent] };
  }

  function repGamma(gamma) {
    return { kind: "FusionCarrierR12/gradient", vec: [...gamma.vec] };
  }

  function mergeR(reflexCarrier, gammaCarrier, rho) {
    const mix = M.clamp(0.35 + 0.5 * rho, 0.2, 0.9);
    const gate = M.clamp(0.15 + 0.7 * (1 - 0.45 * rho), 0.1, 1);
    return {
      kind: "FusionCarrierR12/merged",
      vec: reflexCarrier.vec.map((value, i) => value + gate * (1 - mix) * gammaCarrier.vec[i]),
      mix,
      gate
    };
  }

  function decode(merged, state, flux) {
    const raw = merged.vec;
    const latent = M.boundVector(raw, state.config.componentLimit, state.config.radialLimit);
    return {
      psi: {
        id: `${state.psi.observerId}:${state.ctx.step + 1}`,
        observerId: state.psi.observerId,
        t: state.ctx.step + 1,
        latent,
        coherence: state.psi.coherence,
        fluxEnergy: flux.energy,
        basinId: state.psi.basinId
      },
      mix: merged.mix,
      gate: merged.gate,
      clamped: M.distance(raw, latent) > 1e-10
    };
  }

  // decode returns the realization-local Fusion record. This explicit projection
  // is the final Fusion -> Psi_sim leg of the environment-indexed factorization.
  function projectPsi(fusion) {
    if (!fusion || !fusion.psi || !Array.isArray(fusion.psi.latent)) {
      throw new TypeError("projectPsi expects a Fusion record with psi");
    }
    return fusion.psi;
  }

  function fuse(state, psiReflex, gamma, flux) {
    return decode(mergeR(repReflex(psiReflex), repGamma(gamma), state.psi.coherence), state, flux);
  }

  function coherenceOf(state, candidate, flux, gamma) {
    const alignment = (M.cosine(candidate.latent, flux.data) + 1) / 2;
    const calm = Math.exp(-0.7 * flux.energy);
    const focus = Math.exp(-0.9 * gamma.magnitude);
    const raw = 0.5 * alignment + 0.25 * calm + 0.15 * focus + 0.1 * state.psi.coherence;
    return M.clamp((1 - state.config.coherenceEma) * state.psi.coherence + state.config.coherenceEma * raw, 0, 1);
  }

  function collapsePredicate(state, assessment, forced) {
    if (
      !assessment ||
      assessment.run_id !== state.runId ||
      assessment.observer_id !== state.psi.observerId ||
      assessment.step !== state.ctx.step ||
      assessment.phase !== state.ctx.phase
    ) {
      throw new TypeError("collapsePredicate expects the current PsiMeta assessment");
    }
    const rho = M.assertFinite(assessment.rho, "assessment.rho");
    const wouldTrigger = forced || rho >= state.config.collapseThreshold;
    let dwell = wouldTrigger ? state.ctx.collapseDwellCount + 1 : 0;
    if (forced) dwell = state.config.collapseDwell;
    const eligible = state.ctx.holdRemaining === 0 && dwell >= state.config.collapseDwell;
    return {
      wouldTrigger,
      eligible,
      triggered: state.config.ablations.collapse && eligible,
      dwell,
      holdRemaining: state.ctx.holdRemaining,
      reason: forced ? "manual-request" : "rho-dwell"
    };
  }

  function collapse(state, candidate, rho, reason) {
    const preHash = psiHash(candidate);
    const nearest = nearestBasin(candidate.latent);
    const beforeEnergy = M.norm(candidate.latent);
    const latent = M.boundVector(
      M.mix(candidate.latent, nearest.basin.latent, state.config.collapseMix),
      state.config.componentLimit,
      state.config.radialLimit
    );
    const psi = { ...candidate, latent, basinId: nearest.basin.id };
    const postHash = psiHash(psi);
    const event = {
      eventId: `${state.runId}:collapse:${state.ctx.step}:${state.counters.collapse}`,
      kind: "collapse",
      operator: "Λψ",
      step: state.ctx.step,
      reason,
      preHash,
      postHash,
      energyDrop: beforeEnergy - M.norm(latent),
      basinId: nearest.basin.id,
      basinLabel: nearest.basin.label,
      rho,
      sourceStatus: "direct-event"
    };
    return { psi, event };
  }

  function makeMetaFrame(state, psiReflex, flux, gamma, fusion, rho) {
    const candidatePsi = projectPsi(fusion);
    const drift = M.distance(candidatePsi.latent, state.psi.latent);
    const dGamma = M.distance(gamma.vec, state.lastGamma.vec);
    return {
      run_id: state.runId,
      observer_id: state.psi.observerId,
      step: state.ctx.step,
      phase: state.ctx.phase,
      rho,
      phi_energy: flux.energy,
      gamma_mag: gamma.magnitude,
      reflex_conf: psiReflex.confidence,
      entropy: M.entropyProxy(candidatePsi.latent),
      drift,
      stable: drift < 0.025 && gamma.magnitude < 0.08,
      tags: ["tick", `phase:${state.ctx.phase}`],
      scalars: {
        dGamma,
        mix: fusion.mix,
        gate: fusion.gate,
        omegaAmp: flux.omega.amp,
        recallSimilarity: flux.recall ? flux.recall.similarity : 0,
        couplingMagnitude: flux.coupling ? flux.coupling.magnitude : 0
      },
      psi_hash_pre_collapse: psiHash({ ...candidatePsi, coherence: rho }),
      sourceStatus: "direct-telemetry"
    };
  }

  function finalizeMetaFrame(frame, predicate) {
    frame.collapse_would_trigger = predicate.wouldTrigger;
    frame.collapse_eligible = predicate.eligible;
    frame.collapse_triggered = predicate.triggered;
    frame.collapse_reason = predicate.reason;
    frame.scalars.dwell = predicate.dwell;
    frame.scalars.holdRemaining = predicate.holdRemaining;
    if (predicate.triggered) frame.tags.push("collapse");
    return frame;
  }

  function summarize(state) {
    const window = state.trace.slice(-state.config.summarizeEvery);
    if (!window.length) return null;
    const latent = M.boundVector(
      M.mean(window.map((frame) => frame.latent), DIMENSION),
      state.config.componentLimit,
      state.config.radialLimit
    );
    const node = {
      nodeId: `${state.runId}:mesh:${state.counters.summaries}`,
      operator: "Σ◯",
      createdStep: state.ctx.step,
      sourceSteps: [window[0].step, window[window.length - 1].step],
      latent,
      weight: window.reduce((sum, frame) => sum + frame.rho, 0) / window.length,
      sourceHash: M.contentHash(window.map((frame) => frame.psiHash)),
      sourceStatus: "direct-artifact"
    };
    state.counters.summaries += 1;
    appendBounded(state.mesh, node, state.config.meshCap);
    return node;
  }

  function recallCandidates(state) {
    const memory = state.memories.map((item) => ({
      memoryId: item.memoryId,
      label: item.label,
      latent: item.latent,
      weight: item.weight,
      kind: "inscription"
    }));
    const mesh = state.mesh.map((item) => ({
      memoryId: item.nodeId,
      label: `Σ◯ ${item.sourceSteps[0]}–${item.sourceSteps[1]}`,
      latent: item.latent,
      weight: item.weight,
      kind: "mesh"
    }));
    return memory.concat(mesh);
  }

  function selectRecall(state) {
    if (!state.config.ablations.thetaReplay) return null;
    const candidates = recallCandidates(state);
    if (!candidates.length) return null;
    const query = state.ctx.recallQuery
      ? M.textVector(state.ctx.recallQuery, DIMENSION, 1.2)
      : state.psi.latent;
    let best = null;
    for (const candidate of candidates) {
      const similarity = M.cosine(query, candidate.latent);
      if (!best || similarity > best.similarity) best = { ...candidate, similarity };
    }
    if (!best || best.similarity < state.config.recallThreshold) return null;
    state.counters.recallEligible += 1;
    return {
      packetId: `${state.runId}:recall:${state.ctx.step}:${best.memoryId}`,
      operator: "Θλ",
      memoryId: best.memoryId,
      label: best.label,
      kind: best.kind,
      similarity: best.similarity,
      latent: [...best.latent],
      query: state.ctx.recallQuery || null,
      appliesAtStep: state.ctx.step + 1,
      sourceStatus: "direct-artifact"
    };
  }

  function weatherClass(frame) {
    if (!frame) return { id: "initial", label: "Unformed field", rationale: "No committed tick yet" };
    if (frame.collapse_triggered) return { id: "collapse-clearing", label: "Collapse clearing", rationale: "Λψ event committed this tick" };
    if (frame.rho >= 0.72 && frame.gamma_mag < 0.18) return { id: "stable-high", label: "Stable high", rationale: "High ρ with low Γ magnitude" };
    if (frame.phi_energy > 1.15 && frame.gamma_mag > 0.42) return { id: "shear-front", label: "Shear front", rationale: "High Φ energy and Γ magnitude" };
    if (frame.collapse_would_trigger) return { id: "collapse-watch", label: "Collapse watch", rationale: "Readiness predicate is active" };
    if (frame.scalars.recallSimilarity > 0) return { id: "memory-front", label: "Memory front", rationale: "Applied Θλ packet contributes to Φ" };
    return { id: "variable", label: "Variable field", rationale: "No specialized deterministic rule matched" };
  }

  function addEvent(state, event) {
    appendBounded(state.events, event, state.config.eventCap);
  }

  function step(state, observation = {}) {
    validateStateShape(state);
    if (observation.stimulusMode != null) {
      if (!STIMULUS_MODES.has(observation.stimulusMode)) throw new RangeError("unsupported stimulusMode");
      state.ctx.stimulusMode = observation.stimulusMode;
    }
    if (observation.stimulusAmplitude != null) {
      const value = M.assertFinite(observation.stimulusAmplitude, "stimulusAmplitude");
      state.ctx.stimulusAmplitude = M.clamp(value, 0, 4);
    }
    if (observation.selectedBasin != null) {
      if (!Number.isInteger(observation.selectedBasin) || observation.selectedBasin < 0 || observation.selectedBasin >= BASINS.length) {
        throw new RangeError("selectedBasin is invalid");
      }
      state.ctx.selectedBasin = observation.selectedBasin;
    }
    if (observation.forcingVector !== undefined) {
      state.ctx.forcingVector = observation.forcingVector == null
        ? null
        : [...M.assertVec(observation.forcingVector, DIMENSION, "forcingVector")];
      state.ctx.forcingLabel = observation.forcingLabel || null;
    }
    if (observation.couplingVector !== undefined) {
      state.ctx.couplingVector = observation.couplingVector == null
        ? null
        : [...M.assertVec(observation.couplingVector, DIMENSION, "couplingVector")];
      state.ctx.couplingSourceHash = observation.couplingSourceHash || null;
    }

    const previousBasinId = state.psi.basinId;
    const forced = state.ctx.forceCollapse;
    state.ctx.forceCollapse = false;
    const omega = omegaSample(state);
    const psiReflex = reflexProject(state);
    const flux = sampleFlux(state, omega);
    const gamma = gradientOf(state, flux);
    const fusion = fuse(state, psiReflex, gamma, flux);
    const candidatePsi = projectPsi(fusion);
    const rho = coherenceOf(state, candidatePsi, flux, gamma);
    candidatePsi.coherence = rho;
    const frame = makeMetaFrame(state, psiReflex, flux, gamma, fusion, rho);
    const predicate = collapsePredicate(state, frame, forced);
    finalizeMetaFrame(frame, predicate);
    const tickEvents = [];
    let committedPsi = candidatePsi;

    if (predicate.wouldTrigger) state.counters.wouldCollapse += 1;
    if (predicate.triggered) {
      const result = collapse(state, candidatePsi, rho, predicate.reason);
      committedPsi = result.psi;
      tickEvents.push(result.event);
      state.counters.collapse += 1;
      state.ctx.holdRemaining = state.config.collapseHold;
      state.ctx.collapseDwellCount = 0;
    } else {
      state.ctx.collapseDwellCount = predicate.dwell;
      state.ctx.holdRemaining = Math.max(0, state.ctx.holdRemaining - 1);
    }

    state.psi = committedPsi;
    state.selfModel = [...psiReflex.proposalSelfModel];
    state.lastReflex = psiReflex;
    state.lastGamma = gamma;
    state.lastFlux = flux;
    state.currentHash = psiHash(state.psi);
    frame.psi_hash = state.currentHash;
    frame.weather = weatherClass(frame);
    frame.applied_recall = flux.recall;
    appendBounded(state.frames, frame, state.config.frameCap);
    appendBounded(state.trace, {
      step: frame.step,
      phase: frame.phase,
      latent: [...state.psi.latent],
      reflexLatent: [...psiReflex.latent],
      gamma: [...gamma.vec],
      flux: [...flux.data],
      rho,
      psiHash: state.currentHash,
      collapse: frame.collapse_triggered,
      basinId: state.psi.basinId,
      recallPacketId: flux.recall ? flux.recall.packetId : null
    }, state.config.traceCap);

    if (flux.recall) state.counters.recallApplied += 1;
    if (state.config.ablations.summarize && (state.ctx.step + 1) % state.config.summarizeEvery === 0) {
      const node = summarize(state);
      if (node) tickEvents.push({
        eventId: `${state.runId}:summary:${state.ctx.step}:${node.nodeId}`,
        kind: "summary",
        operator: "Σ◯",
        step: state.ctx.step,
        nodeId: node.nodeId,
        sourceHash: node.sourceHash,
        sourceStatus: "direct-event"
      });
    }

    state.ctx.pendingRecall = selectRecall(state);
    if (state.psi.basinId != null && state.psi.basinId !== previousBasinId) {
      tickEvents.push({
        eventId: `${state.runId}:basin:${state.ctx.step}:${state.psi.basinId}`,
        kind: "basin-transition",
        step: state.ctx.step,
        fromBasinId: previousBasinId,
        toBasinId: state.psi.basinId,
        toBasinLabel: BASINS[state.psi.basinId].label,
        sourceHash: state.currentHash,
        sourceStatus: "direct-event"
      });
    }
    for (const event of tickEvents) addEvent(state, event);
    state.ctx.phase = (state.ctx.phase + 1) % 8;
    state.ctx.step += 1;
    return { state, psi_next: state.psi, frame, events: tickEvents };
  }

  function inscribeMemory(state, label, weight = 1) {
    validateStateShape(state);
    const cleanLabel = String(label || "").trim().slice(0, 120);
    if (!cleanLabel) throw new RangeError("memory label cannot be empty");
    const cleanWeight = M.clamp(M.assertFinite(Number(weight), "memory weight"), 0.1, 2);
    if (!state.config.ablations.memoryWrite) {
      return { state, memory: null, event: null, status: "ablated" };
    }
    const encoded = M.textVector(cleanLabel, DIMENSION, 1.2);
    const latent = M.boundVector(M.mix(state.psi.latent, encoded, 0.35), state.config.componentLimit, state.config.radialLimit);
    const memory = {
      memoryId: `${state.runId}:memory:${state.counters.memoryWrites}`,
      label: cleanLabel,
      latent,
      weight: cleanWeight,
      createdStep: state.ctx.step,
      sourceStateHash: state.currentHash,
      encoder: "fnv1a32-keyed-r12/v1",
      sourceStatus: "realization-local-artifact"
    };
    const event = {
      eventId: `${state.runId}:memory-write:${state.ctx.step}:${state.counters.memoryWrites}`,
      kind: "memory-write",
      step: state.ctx.step,
      memoryId: memory.memoryId,
      label: cleanLabel,
      sourceStateHash: state.currentHash,
      sourceStatus: "direct-event",
      note: "Manual inscription is a realization-local action; it is not an alias for Σ◯."
    };
    state.counters.memoryWrites += 1;
    state.memories.push(memory);
    addEvent(state, event);
    return { state, memory, event, status: "written" };
  }

  function queueRecall(state, query) {
    validateStateShape(state);
    state.ctx.recallQuery = String(query || "").trim().slice(0, 120);
    state.ctx.pendingRecall = selectRecall(state);
    return state.ctx.pendingRecall;
  }

  function requestCollapse(state) {
    validateStateShape(state);
    state.ctx.forceCollapse = true;
  }

  function setAblation(state, key, enabled) {
    if (!(key in state.config.ablations)) throw new RangeError(`unknown ablation: ${key}`);
    state.config.ablations[key] = Boolean(enabled);
    if (key === "thetaReplay" && !enabled) state.ctx.pendingRecall = null;
  }

  function serialize(state, extra = {}) {
    validateStateShape(state);
    return {
      schemaVersion: SCHEMA_VERSION,
      engine: { id: ENGINE_ID, version: ENGINE_VERSION },
      exportedAt: null,
      determinism: {
        seed: state.config.seed,
        quantizationDigits: 8,
        stateHashAlgorithm: "FNV-1a-64 over canonical quantized JSON",
        currentPsiHash: state.currentHash,
        configHash: M.contentHash(state.config)
      },
      state: clone(state),
      ...clone(extra)
    };
  }

  function hydrate(replay) {
    if (!replay || replay.schemaVersion !== SCHEMA_VERSION || !replay.state) {
      throw new TypeError(`expected ${SCHEMA_VERSION} replay`);
    }
    const incoming = clone(replay.state);
    incoming.config = createConfig(incoming.config);
    validateStateShape(incoming);
    const actualHash = psiHash(incoming.psi);
    if (incoming.currentHash !== actualHash) throw new Error("replay current psi hash mismatch");
    return incoming;
  }

  function validateStateShape(state) {
    if (!state || state.schemaVersion !== SCHEMA_VERSION) throw new TypeError("invalid runtime state schema");
    if (state.engineId !== ENGINE_ID || state.engineVersion !== ENGINE_VERSION) throw new TypeError("runtime engine identity mismatch");
    const assertLatent = (vector, label) => {
      M.assertVec(vector, DIMENSION, label);
      if (vector.some((value) => Math.abs(value) > state.config.componentLimit + 1e-8)) throw new RangeError(`${label} exceeds component bounds`);
      if (M.norm(vector) > state.config.radialLimit + 1e-8) throw new RangeError(`${label} exceeds radial bounds`);
    };
    assertLatent(state.psi.latent, "psi.latent");
    assertLatent(state.selfModel, "selfModel");
    if (!Number.isInteger(state.ctx.step) || state.ctx.step < 0) throw new TypeError("ctx.step must be a non-negative integer");
    if (!Number.isInteger(state.psi.t) || state.psi.t !== state.ctx.step) throw new TypeError("psi.t must equal ctx.step");
    if (!Number.isInteger(state.ctx.phase) || state.ctx.phase < 0 || state.ctx.phase > 7) throw new TypeError("ctx.phase must be an integer in [0,7]");
    M.assertFinite(state.psi.coherence, "psi.coherence");
    if (state.psi.coherence < 0 || state.psi.coherence > 1) throw new RangeError("psi.coherence must be in [0,1]");
    M.assertVec(state.lastGamma.vec, DIMENSION, "lastGamma.vec");
    M.assertVec(state.lastFlux.data, DIMENSION, "lastFlux.data");
    if (state.ctx.forcingVector) M.assertVec(state.ctx.forcingVector, DIMENSION, "ctx.forcingVector");
    if (state.ctx.couplingVector) M.assertVec(state.ctx.couplingVector, DIMENSION, "ctx.couplingVector");
    if (state.ctx.pendingRecall) M.assertVec(state.ctx.pendingRecall.latent, DIMENSION, "ctx.pendingRecall.latent");
    for (const [name, cap] of [["frames", state.config.frameCap], ["trace", state.config.traceCap], ["events", state.config.eventCap], ["mesh", state.config.meshCap]]) {
      if (!Array.isArray(state[name]) || state[name].length > cap) throw new RangeError(`${name} must be a bounded array`);
    }
    if (!Array.isArray(state.memories) || state.memories.length > 10000) throw new RangeError("memories must be a bounded array");
    for (const memory of state.memories) {
      assertLatent(memory.latent, `memory ${memory.memoryId || "unknown"}.latent`);
      M.assertFinite(memory.weight, "memory.weight");
    }
    for (const node of state.mesh) assertLatent(node.latent, `mesh ${node.nodeId || "unknown"}.latent`);
    for (const sample of state.trace) {
      assertLatent(sample.latent, "trace.latent");
      M.assertVec(sample.reflexLatent, DIMENSION, "trace.reflexLatent");
      M.assertVec(sample.gamma, DIMENSION, "trace.gamma");
      M.assertVec(sample.flux, DIMENSION, "trace.flux");
    }
    for (const frame of state.frames) {
      for (const key of ["step", "phase", "rho", "phi_energy", "gamma_mag", "reflex_conf", "entropy", "drift"]) M.assertFinite(frame[key], `frame.${key}`);
      if (!Array.isArray(frame.tags) || !frame.tags.includes("tick")) throw new TypeError("frame.tags must contain tick");
    }
    if (!state.counters || Object.values(state.counters).some((value) => !Number.isInteger(value) || value < 0)) {
      throw new TypeError("counters must be non-negative integers");
    }
    return state;
  }

  function stateDigest(state) {
    return M.contentHash({
      psi: state.psi,
      selfModel: state.selfModel,
      ctx: state.ctx,
      memories: state.memories,
      mesh: state.mesh,
      counters: state.counters,
      lastGamma: state.lastGamma,
      lastFlux: state.lastFlux
    });
  }

  function stepCoupledPair(stateA, stateB, observationA = {}, observationB = {}, options = {}) {
    validateStateShape(stateA);
    validateStateShape(stateB);
    const requestedStrength = options.strength == null
      ? Math.min(stateA.config.couplingStrength, stateB.config.couplingStrength)
      : M.assertFinite(options.strength, "coupling strength");
    const enabled = options.enabled !== false && stateA.config.ablations.coupling && stateB.config.ablations.coupling;
    const strength = enabled ? M.clamp(requestedStrength, 0, 1) : 0;
    const frozenA = { latent: [...stateA.psi.latent], hash: stateA.currentHash };
    const frozenB = { latent: [...stateB.psi.latent], hash: stateB.currentHash };
    const couplingA = M.scale(M.sub(frozenB.latent, frozenA.latent), strength);
    const couplingB = M.scale(M.sub(frozenA.latent, frozenB.latent), strength);
    const inputA = { ...observationA, couplingVector: couplingA, couplingSourceHash: frozenB.hash };
    const inputB = { ...observationB, couplingVector: couplingB, couplingSourceHash: frozenA.hash };
    let resultA;
    let resultB;
    if (options.order === "ba") {
      resultB = step(stateB, inputB);
      resultA = step(stateA, inputA);
    } else {
      resultA = step(stateA, inputA);
      resultB = step(stateB, inputB);
    }
    return {
      observers: [stateA, stateB],
      results: [resultA, resultB],
      coupling: {
        enabled,
        strength,
        sourceHashes: [frozenA.hash, frozenB.hash],
        magnitudes: [M.norm(couplingA), M.norm(couplingB)],
        updatePolicy: "frozen snapshot; simultaneous double-buffered inputs",
        classification: "DEVELOP"
      }
    };
  }

  return {
    BASINS,
    DEFAULT_CONFIG,
    DIMENSION,
    ENGINE_ID,
    ENGINE_VERSION,
    SCHEMA_VERSION,
    coherenceOf,
    createConfig,
    createState,
    decode,
    fuse,
    gradientOf,
    hydrate,
    inscribeMemory,
    mergeR,
    nearestBasin,
    omegaSample,
    psiHash,
    projectPsi,
    queueRecall,
    recallCandidates,
    repGamma,
    repReflex,
    requestCollapse,
    sampleFlux,
    serialize,
    setAblation,
    stateDigest,
    step,
    stepCoupledPair,
    summarize,
    validateStateShape,
    weatherClass
  };
}
)(M);
export default api;
