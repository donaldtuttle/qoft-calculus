"use strict";

const { contentHash } = require("./hashes.js");

const ZERO12 = Object.freeze(Array(12).fill(0));

function view(condition, turn, carrier, audit, gate) {
  const packet = {
    schema: "mw-agent-packet/0.1",
    condition,
    turn,
    carrier: carrier ? carrier.slice() : ZERO12.slice(),
    audit: {
      rho: audit && audit.rho != null ? audit.rho : null,
      gamma_mag: audit && audit.gamma_mag != null ? audit.gamma_mag : null,
      basin_id: audit && audit.basin_id != null ? audit.basin_id : null,
      collapse: audit && audit.collapse != null ? audit.collapse : null,
      theta_refs: audit && audit.theta_refs ? audit.theta_refs : []
    },
    action_gate: gate.open ? "open" : "blocked",
    gate_mode: gate.mode
  };
  return { packet, packetHash: contentHash(packet) };
}

function policyInput(obs, carrier) {
  return {
    obs: {
      kind: obs.kind,
      cueId: obs.cueId == null ? null : obs.cueId,
      turn: obs.turn
    },
    carrier: carrier ? carrier.slice() : ZERO12.slice()
  };
}

module.exports = { ZERO12, view, policyInput };
