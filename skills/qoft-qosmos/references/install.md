# Install (model-agnostic)

This pack follows the [Agent Skills](https://agentskills.io/specification) open standard. One folder. One `SKILL.md`. Works anywhere the spec is implemented.

Folder must be named `qoft-qosmos` to match the YAML `name` field.

```
qoft-qosmos/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    ├── tick-contract.md
    ├── tiers.md
    ├── instantiation.md
    ├── changelog.md
    └── install.md
```

This skill is a **Kernel v1.1 DEVELOP candidate**, pending formal adoption. It
does not supersede the repository root `SKILL.md` v1.0 and is not the full
ROFT/QOSMOS v27.3 runtime.

## Claude

- **Claude.ai Skills:** Settings → Capabilities → Skills → Upload the `qoft-qosmos` folder (or zip).
- **Claude Code:** copy the folder to `~/.claude/skills/qoft-qosmos/` (user) or `.claude/skills/qoft-qosmos/` (repo).
- **Claude Projects:** attach `SKILL.md` as project knowledge and add: “Apply this
  Kernel v1.1 DEVELOP candidate only when explicitly requested. Do not present
  it as adopted canon or invent QOFT operators. The root v1.0 contract remains
  authoritative for Public Typed Realization A.”

Implicit invocation is disabled in `agents/openai.yaml`. Invoke the candidate
explicitly by name.

## ChatGPT

- **Native Skills (Business / Enterprise / Edu / Codex / API):** upload the same folder. ChatGPT reads `name` + `description`, then loads `SKILL.md` when the task matches. Optional UI chrome lives in `agents/openai.yaml`.
- **Codex:** copy to `$HOME/.agents/skills/qoft-qosmos/` or `$REPO_ROOT/.agents/skills/qoft-qosmos/`. Invoke with `$qoft-qosmos` or `@`.
- **Custom GPT / Project (fallback):** paste the full `SKILL.md` into Instructions
  (or upload as a project file) and prepend: “This is a pending-adoption Kernel
  v1.1 DEVELOP candidate. Apply it only when explicitly requested; do not
  present it as adopted canon. Follow the firewall. Runtime metrics are not
  glyphs.”

## Other agents

Cursor, Codex CLI, Gemini agent hosts, and any client that implements agentskills.io: drop the folder into that product’s skills directory. Do not rewrite operators for the host.

## Pairing with HME

Install `hme` (v2.2.1+) beside this skill. When a task needs reconstructive memory, ranked retrieval, or QMesh lineage, load `hme`. Do not fold HME algorithms into this calculus file.

Tick pairing: this candidate profile emits Ψmeta_post after Λψ. HME may emit
Ψmeta_pre before Λψ. Those are slots of Ψmeta, not two glyphs, and an HME pre
record does not replace the candidate profile's post record.
