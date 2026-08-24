# QOFT/QOSMOS Agent Skill

The portable Agent Skill is located at
[`skills/qoft-qosmos/SKILL.md`](../skills/qoft-qosmos/SKILL.md).

It packages a Kernel v1.1 DEVELOP candidate operator firewall, tick profile,
term tiers, and the labeled QOSMOS workbench instantiation. Runtime metrics and
HME behavior remain realization-local and do not alter the QOFT operator type
spine. Implicit invocation is disabled; use the candidate explicitly.

## Authority boundary

This repository also retains a root `SKILL.md` v1.0 used by Public Typed
Realization A and refreshed by `scripts/fetch-skill.sh`. The root v1.0 file and
the portable Kernel v1.1 skill are versioned independently and are not
automatically interchangeable.

This packaging record does not itself constitute a stamped Kernel v1.1 canon
adoption. Until an adoption record is linked here, treat v1.1 as a DEVELOP
candidate pending adoption. The root v1.0 contract remains authoritative for
Public Typed Realization A; do not use this commit alone as evidence of
governance precedence.

Core boundary:

```
Ξ(ψ) = ψᴽ ⊕ Γ(ψ; ctx)
⊕ : Ψᴽ × G → Ψ
```

License: MPL-2.0 under the repository root [`LICENSE`](../LICENSE).
