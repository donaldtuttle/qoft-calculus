"use strict";

function createGate(mode = "every_turn", options = {}) {
  const period = options.period == null ? 7 : options.period;
  if (!["every_turn", "lambda_commit", "fixed_cooldown"].includes(mode)) {
    throw new RangeError(`unsupported gate mode ${mode}`);
  }
  return {
    mode,
    period,
    decide(turn, collapseFlag) {
      if (mode === "every_turn") return { open: true, mode };
      if (mode === "fixed_cooldown") return { open: turn % period === 0, mode };
      return { open: Boolean(collapseFlag), mode };
    }
  };
}

module.exports = { createGate };
