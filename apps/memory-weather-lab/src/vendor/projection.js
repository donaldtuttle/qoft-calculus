// @ts-nocheck
/* ESM wrapper around apps/memory-weather/src/projection.js. Factory body is copied from the sibling file. */
import M from "./math.js";
const api = (function (M) {
  "use strict";

  const DIMENSION = 12;
  const PROJECTION_VERSION = "mw-fixed-orthonormal/v1";
  const DEFAULT_PROJECTION_SEED = 0x51a72026;

  function orthonormalBasis(seed = DEFAULT_PROJECTION_SEED, rows = 3) {
    const basis = [];
    for (let row = 0; row < rows; row += 1) {
      let vector = Array.from({ length: DIMENSION }, (_, i) =>
        M.keyedGaussian(seed, "projection-basis", row, i)
      );
      for (const prior of basis) vector = M.sub(vector, M.scale(prior, M.dot(vector, prior)));
      if (M.norm(vector) < 1e-8) throw new Error("projection basis became degenerate");
      vector = M.normalize(vector, 1);
      const firstSignificant = vector.find((value) => Math.abs(value) > 1e-7) || 1;
      if (firstSignificant < 0) vector = M.scale(vector, -1);
      basis.push(vector);
    }
    return basis;
  }

  function createProjection(options = {}) {
    const seed = options.seed == null ? DEFAULT_PROJECTION_SEED : options.seed;
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
      throw new RangeError("projection seed must be an unsigned 32-bit integer");
    }
    const matrix3 = options.matrix3 ? options.matrix3.map((row) => [...row]) : orthonormalBasis(seed, 3);
    validateMatrix(matrix3, 3);
    const anchor = options.anchor ? [...options.anchor] : Array(DIMENSION).fill(0);
    M.assertVec(anchor, DIMENSION, "projection anchor");
    const projection = {
      projectionId: `r12-${seed.toString(16).padStart(8, "0")}`,
      version: PROJECTION_VERSION,
      method: options.matrix3 ? "imported-pinned-basis" : "seed-derived-pinned-basis",
      seed,
      sourceDimension: DIMENSION,
      matrix2: matrix3.slice(0, 2),
      matrix3,
      anchor,
      normalization: "orthonormal rows; viewport maps ±2.25 to edges",
      noninvertible: true
    };
    projection.matrixHash = M.contentHash({
      version: projection.version,
      matrix2: projection.matrix2,
      matrix3: projection.matrix3,
      anchor: projection.anchor
    });
    return projection;
  }

  function validateMatrix(matrix, rows) {
    if (!Array.isArray(matrix) || matrix.length !== rows) throw new TypeError(`projection matrix must have ${rows} rows`);
    for (let i = 0; i < rows; i += 1) M.assertVec(matrix[i], DIMENSION, `projection matrix row ${i}`);
    for (let i = 0; i < rows; i += 1) {
      const lengthError = Math.abs(M.norm(matrix[i]) - 1);
      if (lengthError > 1e-7) throw new RangeError("projection matrix rows must be unit length");
      for (let j = i + 1; j < rows; j += 1) {
        if (Math.abs(M.dot(matrix[i], matrix[j])) > 1e-7) throw new RangeError("projection matrix rows must be orthogonal");
      }
    }
    return matrix;
  }

  function project(projection, latent, targetDimension = 2) {
    M.assertVec(latent, DIMENSION, "latent");
    const matrix = targetDimension === 3 ? projection.matrix3 : projection.matrix2;
    return M.matrixVector(matrix, M.sub(latent, projection.anchor));
  }

  function projectVector(projection, vector, targetDimension = 2) {
    M.assertVec(vector, DIMENSION, "vector");
    const matrix = targetDimension === 3 ? projection.matrix3 : projection.matrix2;
    return M.matrixVector(matrix, vector);
  }

  function lift(projection, coordinates, targetDimension = 2) {
    const matrix = targetDimension === 3 ? projection.matrix3 : projection.matrix2;
    if (!Array.isArray(coordinates) || coordinates.length !== matrix.length) {
      throw new TypeError(`coordinates must have length ${matrix.length}`);
    }
    coordinates.forEach((value, i) => M.assertFinite(value, `coordinates[${i}]`));
    return M.add(projection.anchor, M.transposeVector(matrix, coordinates));
  }

  function residual(projection, latent, targetDimension = 2) {
    const coordinates = project(projection, latent, targetDimension);
    const reconstructed = lift(projection, coordinates, targetDimension);
    const vector = M.sub(latent, reconstructed);
    return { vector, norm: M.norm(vector), discardedDimensions: DIMENSION - targetDimension };
  }

  function viewportToLatent(projection, x, y, radialLimit = 2) {
    M.assertFinite(x, "viewport x");
    M.assertFinite(y, "viewport y");
    return M.boundVector(lift(projection, [x, y], 2), radialLimit, radialLimit);
  }

  function projectionRecord(projection, latent) {
    const loss2 = latent ? residual(projection, latent, 2) : null;
    return {
      projection_id: projection.projectionId,
      method: projection.method,
      version: projection.version,
      source_dim: DIMENSION,
      target_dims: [2, 3],
      matrix_hash: projection.matrixHash,
      anchor: [...projection.anchor],
      rank: 3,
      discarded_nullity_2d: 10,
      discarded_nullity_3d: 9,
      live_residual_norm_2d: loss2 ? loss2.norm : null,
      normalization: projection.normalization,
      noninvertible: true
    };
  }

  function makeFeature(base, details) {
    return {
      frame_id: base.frameId,
      run_id: base.runId,
      observer_id: base.observerId,
      tick: base.tick,
      projection_id: base.projection.projectionId,
      projection_hash: base.projection.matrixHash,
      source_state_hash: base.stateHash,
      canonical: false,
      ...details
    };
  }

  function featureCatalog(projection, state, fieldSpec = {}) {
    const frame = state.frames[state.frames.length - 1] || null;
    const base = {
      frameId: frame ? `${state.runId}:frame:${frame.step}` : null,
      runId: state.runId,
      observerId: state.psi.observerId,
      tick: state.ctx.step,
      projection,
      stateHash: state.currentHash
    };
    const projectionLoss = "2D discards 10 components; 3D discards 9. Projected distances can distort R¹² relations.";
    const commonForbidden = "Do not infer physical space, semantic distance, consciousness, or QOFT validation from this view.";
    const records = [
      makeFeature(base, {
        feature_id: "psi-trace",
        label: "ψ trajectory",
        layer: "trace",
        evidence_class: "state_projection",
        canonical_refs: ["ψ ∈ Ψ"],
        runtime_paths: ["state.trace[].latent", "state.psi.latent"],
        transform_chain: ["fixed R¹² basis", "viewport affine map"],
        discarded_information: projectionLoss,
        permitted_interpretation: "Committed runtime-state motion within this fixed projection.",
        forbidden_extrapolation: commonForbidden
      }),
      makeFeature(base, {
        feature_id: "psi-reflex",
        label: "ψᴽ self-model",
        layer: "reflex",
        evidence_class: "state_projection",
        canonical_refs: ["ψᴽ = Πᴽ(ψ; ctx, m) ∈ Ψᴽ"],
        runtime_paths: ["state.lastReflex.latent"],
        transform_chain: ["Πᴽ realization", "same fixed R¹² basis"],
        discarded_information: projectionLoss,
        permitted_interpretation: "Projected separation between current ψ and its contractive runtime self-model.",
        forbidden_extrapolation: "Not a measurement of phenomenal self-awareness."
      }),
      makeFeature(base, {
        feature_id: "gamma-vectors",
        label: "Γ direction field",
        layer: "vectors",
        evidence_class: "derived_visualization",
        canonical_refs: ["Γ(ψ; ctx) ∈ G"],
        runtime_paths: ["state.lastGamma.vec", "field.grid[].vector"],
        transform_chain: ["declared Γ proxy", "vector projection", "field probe evaluation"],
        discarded_information: `Orthogonal Γ components are hidden. Grid density ${fieldSpec.size || 0} is a display choice.`,
        permitted_interpretation: "Direction of the declared local update proxy and potential derivative.",
        forbidden_extrapolation: "Not canonical curvature and not a physical force field."
      }),
      makeFeature(base, {
        feature_id: "phi-forcing",
        label: "Φ forcing",
        layer: "flux",
        evidence_class: "state_projection",
        canonical_refs: ["Φ"],
        runtime_paths: ["state.lastFlux.data", "state.lastFlux.energy"],
        transform_chain: ["runtime flux sample", "fixed vector projection"],
        discarded_information: projectionLoss,
        permitted_interpretation: "The current runtime forcing vector and scalar energy.",
        forbidden_extrapolation: commonForbidden
      }),
      makeFeature(base, {
        feature_id: "rho-field",
        label: "ρ coherence surface",
        layer: "coherence",
        evidence_class: "derived_visualization",
        canonical_refs: ["ρ"],
        runtime_paths: ["state.psi.coherence", "field.grid[].coherence"],
        transform_chain: ["pure probe evaluation of realization-local ρ", "grid sampling"],
        discarded_information: "The live engine emits one scalar ρ per observer; spatial variation is model evaluation, not direct telemetry.",
        permitted_interpretation: "How the current realization's ρ formula changes over the projected slice.",
        forbidden_extrapolation: "No universal coherence field or threshold is implied."
      }),
      makeFeature(base, {
        feature_id: "attractor-potential",
        label: "Declared attractor potential",
        layer: "potential",
        evidence_class: "derived_visualization",
        canonical_refs: [],
        runtime_paths: ["state.memories", "state.mesh", "BASINS", "field.grid[].potential"],
        transform_chain: ["project nodes", "Gaussian kernel sum", "grid normalization"],
        discarded_information: "Kernel width, event weights, and projection distortions determine the rendered topology.",
        permitted_interpretation: "A realization-local diagnostic landscape over declared basins and memory artifacts.",
        forbidden_extrapolation: "Not symbolic gravity, glyph mass, or a canonical potential."
      }),
      makeFeature(base, {
        feature_id: "memory-influence",
        label: "Θλ applied influence",
        layer: "memory",
        evidence_class: state.lastFlux.recall ? "direct_event" : "derived_visualization",
        canonical_refs: ["Θλ : Ψ × M → Ψ × M"],
        runtime_paths: ["state.lastFlux.recall", "state.ctx.pendingRecall"],
        transform_chain: ["eligible recall selection", "next-tick Φ bias", "endpoint projection"],
        discarded_information: "Only applied or queued packet endpoints and similarity are shown.",
        permitted_interpretation: state.lastFlux.recall ? "An actual recall packet contributed to this tick." : "No Θλ packet was applied this tick.",
        forbidden_extrapolation: "Proximity alone is not shown as causal influence."
      }),
      makeFeature(base, {
        feature_id: "collapse-surface",
        label: "Λψ readiness surface",
        layer: "collapse",
        evidence_class: "derived_visualization",
        canonical_refs: ["Λψ : Ψ → Ψ"],
        runtime_paths: ["config.collapseThreshold", "field.grid[].collapseMargin", "state.ctx.holdRemaining"],
        transform_chain: ["actual realization predicate proxy", "pure grid evaluation", "contour extraction"],
        discarded_information: "The contour does not carry temporal dwell history at every probe point.",
        permitted_interpretation: "Instantaneous readiness in this implementation, with live dwell/hold disclosed separately.",
        forbidden_extrapolation: "Not a canonical, physical, or universal collapse surface."
      }),
      makeFeature(base, {
        feature_id: "event-markers",
        label: "Event markers",
        layer: "events",
        evidence_class: "direct_event",
        canonical_refs: ["Λψ"],
        runtime_paths: ["state.events"],
        transform_chain: ["event source-state endpoint", "fixed R¹² basis"],
        discarded_information: projectionLoss,
        permitted_interpretation: "Integrity-bearing runtime events at their projected source states.",
        forbidden_extrapolation: "An event marker is not evidence of physical branching."
      }),
      makeFeature(base, {
        feature_id: "multi-observer-coupling",
        label: "Declared observer coupling",
        layer: "coupling",
        evidence_class: "state_projection",
        canonical_refs: [],
        runtime_paths: ["observerA.lastFlux.coupling", "observerB.lastFlux.coupling", "observer*.trace"],
        transform_chain: ["frozen prior-state difference", "bounded coupling scale", "independent Ξ ticks", "same fixed R¹² basis"],
        discarded_information: projectionLoss,
        permitted_interpretation: "A DEVELOP coupling input applied symmetrically from a frozen two-observer snapshot.",
        forbidden_extrapolation: "Not canonical re-entanglement, nonlocality, consensus proof, or a physical interaction."
      }),
      makeFeature(base, {
        feature_id: "weather-composite",
        label: "Memory Weather composite",
        layer: "weather",
        evidence_class: "interpretive",
        canonical_refs: ["ρ", "Φ", "Γ", "Λψ", "Θλ"],
        runtime_paths: ["frame.weather", "field.grid", "state.events"],
        transform_chain: ["deterministic UI classifier", "layer compositing"],
        discarded_information: "The label compresses many runtime quantities into a metaphor.",
        permitted_interpretation: "A reproducible interface summary of this realization's current regime.",
        forbidden_extrapolation: "Weather labels are not QOFT operators or scientific diagnoses."
      })
    ];
    return Object.fromEntries(records.map((record) => [record.feature_id, record]));
  }

  return {
    DEFAULT_PROJECTION_SEED,
    DIMENSION,
    PROJECTION_VERSION,
    createProjection,
    featureCatalog,
    lift,
    orthonormalBasis,
    project,
    projectVector,
    projectionRecord,
    residual,
    validateMatrix,
    viewportToLatent
  };
}
)(M);
export default api;
