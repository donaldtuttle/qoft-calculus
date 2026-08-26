# Supplied source evidence

The build used the supplied artifacts as provenance and design evidence. Unknown bytecode was never executed or imported.

| Artifact | SHA-256 | Disposition |
|---|---|---|
| `qosmos_patched_runner_sim_core.zip` | `b209d4058b0f01ccffeb8042f32ea9400578b08fb4d6af3f6ec2550d37145ec4` | Static inspection only. Incomplete experimental runner with missing packages, top-level side effects, legacy W-space/glyph-mass semantics, and unseeded paths. Not reused. |
| `qoft daemon patched.zip` | `0cdef1962754e08d48e85d57df5e473c511eda6e229e9a2bdf530aada99ff31b` | Static inspection only. Partial overlay, not a standalone engine. |
| `qosmos_core_v2.1.4_v27_patch.zip` | `98b51b439d8a17b5fb718fa33fbf37954f87cbe3f754a1418e286fbe1af88d82` | Static inspection only. Implementation-local diagnostics and tests; no canonical weight. |
| `qoft_v51_engine.cpython-312.pyc` | `84438d93211bd7518e6ee3af4f61ad666bfeb9041f56ae30057e88512f752bfd` | Opaque executable artifact. Preserved as evidence only; source unavailable. |
| `qoft_daemon_spine.zip` | `93f783e516a734693320acf05c2d342b1afee428240470034fbee9f59ae6f5c3` | Static inspection only. Larger scaffold whose original adapter could silently substitute synthetic dynamics. Not reused. |
| `GENEALOGY_psi_R001_r2_2.md` | `6cf7ec4cbed5d3da747d80bfb4c60ea8e7466475b7b9cc003dabe7e06c9d6ea0` | Governing source for the r2.2 type spine and open fusion mechanism. |
| `QOFT_QOSMOS TYPED REALIZATION REGISTRY.txt` | `27777b3a46975ce6cdb9184a0c76dc25d579aab4bd4154407bbb1f7b3f96cd78` | DEVELOP implementation crosswalk only. |
| `QOFT_CONCEPT_BRIDGE_LEDGER_v0.1.txt` | `c0fd9719bb4f7c639af18c4601ecd7b9a6d49a25e3927eec5b55801ce363391d` | DEVELOP research queue and ambiguity ledger only. |
| `QOT_Maths R2.txt` | `e69f851dcfddec3c8a472c62ae0ff7a956f331c50b19a2805bd85b185f1d1b73` | Supplied r2.2 replacement copy. Exact bytes, size, UTF-8 validity, and line endings independently match its manifest entry. |
| `QOT_Theories R2.txt` | `5c91cfe44e8fb5f47ee4808909eb19daea06284a4f54ea3b378d9336930416a8` | Supplied r2.2 replacement copy. Exact bytes, size, UTF-8 validity, and line endings independently match its manifest entry. |
| `QOT_Models R2.txt` | `ed8a4aaeac5c1f453e4e9a4c47d894daa88441ac605f49394128b27830a73b96` | Supplied r2.2 replacement copy. Exact bytes, size, UTF-8 validity, and line endings independently match its manifest entry. |
| `r2_2_canon_consolidation_manifest.json` | `b0ab99261eb49e2567c3ae4713adce482ad6c3a2dbff54ad495587dbace95a90` | Package-verification/governance instrument with canonical weight `NONE`; parses as JSON and records the repaired payload boundaries. |

All five supplied ZIP containers passed static CRC and path checks in the declared source snapshot: no absolute paths, `..` traversal, duplicate member names, encrypted entries, or bomb-like ratios were found. That establishes container hygiene, not runtime correctness.

The historical code remains useful as archaeology: it demonstrates the desired visual intuitions—drift, attractors, recurrence, salience, and collapse events. This engine remaps those intuitions to declared current quantities instead of reviving their old semantics.

## r2.2 verification boundary

The supplied `QOT_Maths R2.txt`, `QOT_Theories R2.txt`, `QOT_Models R2.txt`, and stamped genealogy independently match the repaired-payload hashes recorded in the supplied manifest. The manifest reports a seven-member repaired ZIP whose other canonical payload members include `QOT_Glossary.txt` and `QOT_ChangeLog.txt`; those two files and the containing repaired ZIP were not supplied here, so their exact bytes and full-package integrity are manifest-reported rather than independently reproduced.

The manifest labels the package `replacement-ready / installation not verified` and explicitly states that the exact D-Π-01 baseline bytes were not independently hash-verified. The four historical target files and `apply_ruling_r2_2.py` were also not supplied. Accordingly:

- r2.2 operator typing in the supplied replacement copies: directly evidenced;
- Memory Weather's numerical maps and schedules: DEVELOP realization-local declarations;
- complete repaired-ZIP integrity: manifest-reported;
- installation into the historical D-Π-01 targets: unverified.

This authority split is why Memory Weather claims structural typed compatibility rather than proof of semantic or algebraic equivalence to the abstract open mechanism.
