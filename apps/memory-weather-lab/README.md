# Memory Weather Lab

A React viewport of **Memory Weather v0.1.1**. It renders the same deterministic
R¹² state-dynamics engine as [`apps/memory-weather`](../memory-weather), with the
same published demo hash. Technical labels are primary, QOFT symbols remain
visible, and original weather terms are retained as presentation aliases.

> **Status:** DEVELOP · viewport of an existing typed realization · not a new
> engine and not a claim of physics or consciousness.

This app lives beside—not instead of—the dependency-free HTML realization. It
does not replace `apps/memory-weather`, `apps/simulator`, root `src/engine.ts`,
the stable root skill, or the r2.2 DEVELOP candidate. It is **not** Typed
Realization B (the separate Grok glyphogenic workbench).

Live: [donaldtuttle.github.io/qoft-calculus/memory-weather-lab](https://donaldtuttle.github.io/qoft-calculus/memory-weather-lab/)

## Run it

```bash
cd apps/memory-weather-lab
npm ci
npm run verify
npm run dev
```

The lab opens on the published 96-tick demonstration:

```text
seed 12062026 → 96 ticks → mw-fnv64:e199888bbf930070
```

The vanilla offline build remains `apps/memory-weather/dist/memory-weather.html`.

## Authority boundary

```text
apps/memory-weather
  source of truth for the v0.1.1 JS engine, tests, docs, and standalone HTML

apps/memory-weather-lab
  React + Vite viewport
  ESM wrappers whose factory bodies are copied from the sibling
  npm run sync-engine:check fails if those bodies drift
```

Same seed, configuration, and input sequence must reproduce the sibling's
rounded `ψ` hashes and event order. A passing lab test is not evidence that
canonical `⊕` is uniquely realized, and it does not promote this viewport to
canon.

Operator contract, projection provenance, terminology, and the staged-routing experiment
remain in [`apps/memory-weather/docs`](../memory-weather/docs). Start with the
[terminology guide](../memory-weather/docs/TERMINOLOGY.md).

## Controls

Transport, measured layers, memory recording, memory replay Θλ, commitment projection Λψ, observer B, and replay
import/export match the sibling viewport. `Space` toggles run/pause when focus
is outside an interactive control. Step, reset, and view changes use explicit
buttons. X/Y sliders provide keyboard forcing coordinates, and four buttons
provide keyboard terrain orbit. Clicking the 2D field remains available for
pointer forcing. Ten hidden components receive no invented information.

## Engine copies

`src/vendor/*.js` are ESM wrappers around `apps/memory-weather/src`. After an
engine change in the sibling:

```bash
npm run sync-engine
npm test
```

Do not edit factory bodies in this app.

## License

MPL-2.0 under the repository's root `LICENSE`.
