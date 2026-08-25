# Changelog

## Unreleased - v1.1.0 DEVELOP candidate

- published the portable `qoft-qosmos` Kernel v1.1 candidate beside the root
  v1.0 contract;
- disabled implicit invocation and marked formal adoption pending;
- added a plain-language repository front door, use-case map, credibility-scan
  badges, changelog, and release plan;
- preserved the boundaries among root `SKILL.md`, Public Typed Realization A,
  the deployed live workbench, and the candidate skill.

This documentation work does not adopt the v1.1 candidate or change engine
behavior.

## 1.0.2 - 2026-08-23

- committed `package-lock.json` and moved CI to `npm ci`;
- replaced placeholder coverage with deterministic, ownership, ablation,
  hysteresis, and configuration tests;
- rejected NaN, non-finite values, and non-integer count fields;
- hardened `fetch-skill.sh` with UTF-8, frontmatter, closed-set, hash, and atomic
  replacement checks;
- evaluated `Ωµ` once per tick and passed the result into flux sampling;
- documented that Public Typed Realization A and the deployed workbench are
  separate realizations.

Reference commit:

```text
183dacd5393f36559b22e11867fc9479b748fea5
```

## 1.0.0 - 2026-08-22

- published the public Glyphogenic Calculus contract;
- added the R¹² TypeScript reference engine and deterministic test harness;
- separated the public engine from the live workbench;
- licensed the repository under MPL-2.0.
