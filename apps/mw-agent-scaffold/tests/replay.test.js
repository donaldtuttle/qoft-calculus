"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createEncoder } = require("../src/encode.js");
const { createMw } = require("../src/substrates/mw.js");
const { createEma, createStateless } = require("../src/substrates/ema.js");
const { createEpisode } = require("../src/env/delayed_cue_bandit.js");

test("recorded observation sequence reconstitutes MW and EMA digests", () => {
  const encoder = createEncoder();
  const episode = createEpisode(99, 0, 2);
  const encoded = episode.turns.map((obs) => encoder.encode(obs).u);

  function replay(factory) {
    const a = factory();
    const digests = [];
    for (const u of encoded) {
      a.update(u);
      digests.push(a.digest());
    }
    const b = factory();
    const again = [];
    for (const u of encoded) {
      b.update(u);
      again.push(b.digest());
    }
    return { digests, again };
  }

  const mw = replay(() => createMw(99));
  const ema = replay(() => createEma(0.24));
  const sl = replay(() => createStateless());
  assert.deepEqual(mw.digests, mw.again);
  assert.deepEqual(ema.digests, ema.again);
  assert.deepEqual(sl.digests, sl.again);
});
