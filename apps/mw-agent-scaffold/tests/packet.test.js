"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { view, policyInput, ZERO12 } = require("../src/packet.js");

test("policy input is observation + carrier only", () => {
  const input = policyInput({ kind: "probe", cueId: null, turn: 3 }, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(Object.keys(input).sort(), ["carrier", "obs"]);
  assert.equal("rho" in input, false);
  assert.equal("basin_id" in input, false);
});

test("STATELESS-shaped carrier is zero[12] and keys match MW packet", () => {
  const mw = view("MW", 1, Array(12).fill(0.1), { rho: 0.5, gamma_mag: 0.2, basin_id: null, collapse: false, theta_refs: [] }, { open: true, mode: "every_turn" });
  const sl = view("STATELESS", 1, ZERO12.slice(), { rho: null, gamma_mag: null, basin_id: null, collapse: null, theta_refs: [] }, { open: true, mode: "every_turn" });
  assert.deepEqual(Object.keys(mw.packet).sort(), Object.keys(sl.packet).sort());
  assert.deepEqual(sl.packet.carrier, ZERO12);
  assert.equal(sl.packet.audit.rho, null);
});

test("packet does not include basin names", () => {
  const wrapped = view("MW", 0, ZERO12.slice(), { rho: 0.8, gamma_mag: 0.1, basin_id: 1, collapse: true, theta_refs: [] }, { open: true, mode: "every_turn" });
  const text = JSON.stringify(wrapped.packet);
  assert.equal(text.includes("insight"), false);
  assert.equal(text.includes("identity"), false);
  assert.equal(wrapped.packet.audit.basin_id, 1);
});
