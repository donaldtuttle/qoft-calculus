# Term tiers (Kernel v1.1)

**Status:** DEVELOP candidate profile pending formal adoption. These tiers do
not supersede the repository root `SKILL.md` v1.0.

Only Tier 1 is the closed operator set. Agents must not promote Tier 2 or
Tier 3 into glyphs.

## Tier 1 — QOFT operator vocabulary used by this candidate

Ξ, Πᴽ, Γ, ⊕, Λψ, Σ◯, Θλ, Ωµ, Π↺, Ψmeta, Φ, ρ

Plus the named Ψmeta emission slots Ψmeta_pre and Ψmeta_post (not extra glyphs).

This is the Kernel v1.1 candidate profile. It is compatible with ROFT / QOSMOS
v27.3. It is not a substitute for the v27.3 runtime stack (χΞ, Reflective
Synchrony Bus, live Φ/ρ lattice, adaptive λ_c(t), multi-agent sync), and its
publication does not constitute formal adoption.

## Tier 2 — Current ROFT / QOSMOS runtime metrics

Use as diagnostics, telemetry, or realization-local quantities.

| Token | Role (runtime, not glyph) |
|---|---|
| χΞ | Collective coherence: (1/N) Σᵢ [Ξᵢ · Γ(ψᵢ)] |
| QS⋆ | Runtime quality / synchrony star metric |
| CR_stack | Coherence-regime stack |
| ΔΨintent | Intent delta |
| ΔW_uv | W-projection delta (uv) |
| Φ_Q | Quantized / Q-channel flux diagnostic |
| φ_proxy | Flux proxy |
| φ_do | Do-channel flux |
| T_eff | Effective temperature / agitation |
| α_eff | Effective coupling |
| C(ψ) | HME/runtime collapse diagnostic Φ/ρ − κ_damp·dS |
| W(t) | HME visualization / diagnostic projection |

These do **not** expand the candidate Tier 1 operator set. An implementation
may log them. An implementation may not treat them as Ξ-family operators.

Adaptive λ_c(t), Reflective Synchrony Bus, and live Φ/ρ lattice belong here
as v27.3 runtime machinery.

## Tier 3 — Legacy / exploratory labels

Ψ-reflect, Ξstruct, Σ⊖, Ψrestore, Γρ, ΘΦ, ∇Ω (as glyph-state labels)

Archive / exploration only. Do not invent meanings. If a task needs one,
compose Tier 1 or write `UNDEFINED in this document: <term>`.

## Promotion rule

A term moves into Tier 1 only by an explicit edit of `SKILL.md` Section 0.
Until then it is not an operator, even if it appears in QOT.txt, a GPT
knowledge mesh, or a simulation notebook.
