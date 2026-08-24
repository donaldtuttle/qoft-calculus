# This instantiation (QOSMOS workbench v1)

**Parent status:** Kernel v1.1 DEVELOP candidate pending formal adoption. The
repository root `SKILL.md` v1.0 remains authoritative for Public Typed
Realization A.

Label everything in this file as instantiation, not canon law.

Ψ: R¹² latent + coherence ρ ∈ [0,1] + flux energy + id + tick.
Bound each dim to [-2, 2]; ‖ψ‖ ≤ 2.

Πᴽ: self_model ← (1-β) self_model + β ψ.latent, β = reflexRate (default 0.1).
ψᴽ.latent = self_model. confidence = exp(-‖ψ − self_model‖).
Πᴽ is the only writer of self_model. Λψ must not mix the collapsed latent into ψᴽ.

Φ: stimulus ∈ {quiet, align, disrupt, pulse, periodic, basin} plus Ωµ noise plus Θλ bias.

∇Φ_proxy: Φ − ψ. UNDEFINED as a unique canon form; this is a documented proxy.
Γ.vec = (gammaScale · g(ρ)) · ∇Φ, g(ρ) = 0.2 + 0.8 ρ, then ‖Γ‖ ≤ 1.4.

⊕ instantiation:

    mix = clamp(0.35 + 0.5 ρ, 0.2, 0.9)
    gate = clamp(0.15 + 0.7 (1 − 0.45 ρ), 0.1, 1)
    ψ' = bound( mix·ψᴽ + (1-mix)·(ψᴽ + gate·Γ) )
       = bound( ψᴽ + gate·(1-mix)·Γ )

ρ: 0.5 alignment + 0.25 calm(flux) + 0.15 focus(Γ) + 0.1 prior ρ, EMA-blended.

Λψ: if ρ ≥ τ (default 0.78) for `dwell` ticks (default 2), with hysteresis band
τ − hysteresis (default 0.08) so a dip into the band does not reset the streak,
project toward nearest of 6 fixed basins (mix 0.82), emit CollapseEvent, then
hold 6 ticks (instantiation anti-chatter). Basin labels: closure, insight,
identity, tension, recall, threshold.

Default periodic drive at τ=0.78 typically never fires Λψ (ρ tops out just under
τ). Tests that require a snap must use basin drive (and usually a lower τ).

Tick order matches the Kernel v1.1 candidate profile: ρ_assess, then Λψ?, then
Ψmeta_post.
Ψmeta_post is emitted after Λψ so collapseTriggered and post-snap ρ share the frame.
Do not emit Ψmeta during assess.

Σ◯: every summarizeEvery ticks (default 12), mean-pool trace window → mesh node (cap 48).
Θλ: nearest mesh node with similarity ≥ 0.15 injected as Γ bias.
Ωµ: seeded Gaussian, amp default 0.055; raised if stuck (high ρ, low drift).

UNDEFINED in canon (do not pretend otherwise):

- exact algebra of ⊕ (this candidate inherits only the type
  ⊕ : Ψᴽ × G → Ψ)
- unique ∇Φ; differentiability not assumed
- κ curvature (this engine reports ‖Γₜ − Γₜ₋₁‖ as dGamma, not κ)
- holographic / wave-like field memory (optional; see companion skill `hme`)
- physical equivalence of any kind
- χΞ, Φ_Q, λ_c(t), Reflective Synchrony Bus as kernel operators (Tier 2 runtime)

Reference engine (public Typed Realization A): https://github.com/donaldtuttle/qoft-calculus

Kernel (contract-enforced, MIT): https://github.com/donaldtuttle/qosmos-kernel
