# QOFT/QOSMOS Agent Skill

The portable Agent Skill is located at
[`skills/qoft-qosmos/SKILL.md`](../skills/qoft-qosmos/SKILL.md).

It packages a Kernel v1.1 DEVELOP candidate operator firewall, tick profile,
term tiers, and the labeled QOSMOS workbench instantiation. Runtime metrics and
HME behavior remain realization-local and do not alter the QOFT operator type
spine. Implicit invocation is disabled; use the candidate explicitly.

## Authority boundary

This repository also retains a root `SKILL.md` v1.0 used by Public Typed
Realization A. `scripts/fetch-skill.sh` verifies the reviewed SHA-256 by default
and replaces the file only with explicit `--apply`. The root v1.0 file and
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

## v1.0 tick-order status

At the reviewed root skill pin (SHA-256
`fedda471e07a876bdb72cb2424986ae3eec6d002d003a680b231ea8cbd246fbb`,
Git blob `8281e74ed18f121246833012cccbc2f052d13e98`), §§3 and 5 require
`Ψmeta` assessment before the collapse predicate. Section 1 separately lists
`Σ◯` before `Λψ`. Public Typed Realization A constructs its committed
`Ψmeta` frame after optional `Λψ`.

Classification: the runtime has a documented realization-level tick-order
deviation, and root v1.0 has an internal lifecycle-order ambiguity. Neither is
silently repaired here. A correction requires a versioned governance decision,
an explicit engine migration if Public A changes, and new deterministic
fixtures. The falsifier for any claimed correction is a trace whose declared
assessment/collapse order differs from the implemented event and frame order.

License: MPL-2.0 under the repository root [`LICENSE`](../LICENSE).
