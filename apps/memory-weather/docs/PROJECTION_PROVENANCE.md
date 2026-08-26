# Projection provenance

The viewport never treats “looks spatial” as “is physical space.” R¹² is projected through a fixed, versioned basis.

The canonical symbols are interpreted inside the declared simulation domain:

```text
⟦Ψ⟧MW  = Ψsim
⟦Ψᴽ⟧MW = Ψᴽsim ⊆ Ψsim
⟦G⟧MW  = GR12
```

Projection maps these simulated carriers into viewport coordinates. It does not map them into physical, neurological, or biological quantities, and this realization declares no `Ψsim → biological state space` interpretation.

## Projection record

Every layer exposes:

```text
featureId
label
canonicalTarget
runtimeSource
sourceStatus: direct | model-derived | reconstructed | interpretive
transform
projectionHash
normalization
discardedInformation
parameters
permittedInterpretation
forbiddenExtrapolation
```

## Default mapping

| Feature | Source | Status | Discarded information |
|---|---|---|---|
| ψ marker/trace | `psi.latent[12]` | Direct telemetry after projection | 10 dimensions in 2D; 9 in 3D. |
| ψᴽ marker | `PsiReflex.latent[12]` | Direct telemetry after projection | Same as ψ. |
| Γ arrow | `Gamma.vec[12]` | Direct telemetry after vector projection | Components orthogonal to the viewport basis. |
| Φ arrow/energy | `FluxSample.data/energy` | Direct telemetry after projection/scalar mapping | Orthogonal vector components and phase detail. |
| ρ value | `Psi.coherence` | Direct scalar telemetry | Spatial variation is not measured. |
| Attractor potential | Declared Gaussian kernel over projected basin/memory nodes | Model-derived | Original R¹² distances are approximated after projection. |
| Vector field | Negative derivative of declared potential plus projected Γ/Φ forcing | Model-derived | Non-visible components and alternative field constructions. |
| Heatmap | Grid evaluation of the declared field | Model-derived | Continuous appearance does not imply sampled physical continuity. |
| Fronts | Gradient-magnitude contours of the grid | Reconstructed | Grid resolution, contour threshold, and smoothing. |
| Λψ watch contour | Local evaluation of the actual realization predicate proxy | Model-derived | It is a viewport diagnostic, not a canonical surface. |
| Θλ link | An applied `RecallPacket` | Direct event relation after projection | Full memory-state relation outside projected endpoints. |
| Weather label | Deterministic rule over ρ, Φ energy, Γ magnitude, and recent events | Interpretive | Most telemetry detail; metaphor only. |

The `canonicalTarget` field names the abstract operator or quantity being *realized*; it does not promote the rendered layer to canon. `runtimeSource`, `sourceStatus`, and `transform` identify what the implementation actually measured or derived. In particular, a projected `ψᴽ` marker remains a view of `Ψᴽsim`, while the fused/committed `ψ` marker is a view of `Ψsim`.

## Picking and inverse projection

Clicking a 2D point maps the visible coordinates back into the span of the two projection axes. Ten dimensions are assigned no new information. The result becomes an explicit forcing vector in the next observation context; it does not overwrite ψ directly.

## Hashes

The projection hash covers the rounded 2×12 and 3×12 matrices plus projection version. Replay JSON stores the matrices and hash. Imported projections are validated for shape and finite values.
