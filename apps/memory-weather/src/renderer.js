(function (root, factory) {
  const math = typeof module === "object" && module.exports ? require("./math.js") : root.MWMath;
  const projectionApi = typeof module === "object" && module.exports ? require("./projection.js") : root.MemoryWeatherProjection;
  const fieldApi = typeof module === "object" && module.exports ? require("./field.js") : root.MemoryWeatherField;
  const api = factory(math, projectionApi, fieldApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MemoryWeatherRenderer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (M, Projection, Field) {
  "use strict";

  const DEFAULT_LAYERS = Object.freeze({
    scalar: true,
    vectors: true,
    streamlines: true,
    trace: true,
    reflex: true,
    basins: true,
    collapse: true,
    memory: true,
    events: true,
    grid: true
  });

  function createRenderer(canvas) {
    if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("renderer requires a canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const offscreen = document.createElement("canvas");
    return {
      canvas,
      ctx,
      offscreen,
      offctx: offscreen.getContext("2d"),
      width: 1,
      height: 1,
      dpr: 1,
      view: "weather",
      scalarMode: "weather",
      layers: { ...DEFAULT_LAYERS },
      yaw: -0.52,
      pitch: 0.92,
      selected: null
    };
  }

  function resize(renderer) {
    const rect = renderer.canvas.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const width = Math.max(320, Math.round(rect.width * dpr));
    const height = Math.max(280, Math.round(rect.height * dpr));
    if (renderer.canvas.width !== width || renderer.canvas.height !== height) {
      renderer.canvas.width = width;
      renderer.canvas.height = height;
      renderer.width = width;
      renderer.height = height;
      renderer.dpr = dpr;
    }
    return renderer;
  }

  function setView(renderer, view) {
    if (!["weather", "field", "terrain"].includes(view)) throw new RangeError("unknown view");
    renderer.view = view;
  }

  function setScalarMode(renderer, mode) {
    renderer.scalarMode = mode;
  }

  function setLayer(renderer, layer, enabled) {
    if (!(layer in renderer.layers)) throw new RangeError(`unknown layer ${layer}`);
    renderer.layers[layer] = Boolean(enabled);
  }

  function plotRect(renderer) {
    const pad = Math.max(18, Math.round(24 * renderer.dpr));
    return { x: pad, y: pad, width: renderer.width - 2 * pad, height: renderer.height - 2 * pad };
  }

  function fieldToScreen(renderer, field, x, y) {
    const plot = plotRect(renderer);
    return [
      plot.x + ((x + field.spec.extent) / (2 * field.spec.extent)) * plot.width,
      plot.y + ((field.spec.extent - y) / (2 * field.spec.extent)) * plot.height
    ];
  }

  function screenToField(renderer, field, clientX, clientY) {
    const rect = renderer.canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * renderer.dpr;
    const py = (clientY - rect.top) * renderer.dpr;
    const plot = plotRect(renderer);
    const u = M.clamp((px - plot.x) / plot.width, 0, 1);
    const v = M.clamp((py - plot.y) / plot.height, 0, 1);
    return {
      x: -field.spec.extent + 2 * field.spec.extent * u,
      y: field.spec.extent - 2 * field.spec.extent * v
    };
  }

  function colorStops(t, weather = false) {
    const stops = weather
      ? [[4, 9, 18], [14, 31, 52], [16, 83, 108], [41, 154, 138], [180, 206, 111], [244, 190, 91]]
      : [[6, 15, 30], [24, 48, 80], [42, 91, 124], [76, 143, 144], [176, 188, 126], [238, 207, 122]];
    const clamped = M.clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(clamped));
    const amount = clamped - i;
    const color = stops[i].map((value, channel) => Math.round(value * (1 - amount) + stops[i + 1][channel] * amount));
    return color;
  }

  function signedColor(value, maxAbs) {
    const t = M.clamp(value / Math.max(1e-9, maxAbs), -1, 1);
    if (t < 0) {
      const a = -t;
      return [Math.round(18 + 33 * a), Math.round(31 + 70 * a), Math.round(55 + 110 * a)];
    }
    return [Math.round(24 + 226 * t), Math.round(38 + 112 * t), Math.round(54 + 35 * t)];
  }

  function drawBackground(renderer) {
    const { ctx, width, height } = renderer;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#071019");
    gradient.addColorStop(0.55, "#09131e");
    gradient.addColorStop(1, "#050a11");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawHeatmap(renderer, field, mode, weather) {
    const values = Field.normalizedValues(field, mode);
    const raw = Field.scalarValues(field, mode);
    const size = field.spec.size;
    const off = renderer.offscreen;
    if (off.width !== size || off.height !== size) {
      off.width = size;
      off.height = size;
    }
    const image = renderer.offctx.createImageData(size, size);
    const signed = mode === "lambda";
    const maxAbs = signed ? Math.max(Math.abs(field.ranges.collapseMargin.min), Math.abs(field.ranges.collapseMargin.max)) : 1;
    for (let i = 0; i < values.length; i += 1) {
      const color = signed ? signedColor(raw[i], maxAbs) : colorStops(values[i], weather);
      const index = i * 4;
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = 255;
    }
    renderer.offctx.putImageData(image, 0, 0);
    const plot = plotRect(renderer);
    renderer.ctx.save();
    renderer.ctx.imageSmoothingEnabled = true;
    renderer.ctx.globalAlpha = weather ? 0.92 : 0.86;
    renderer.ctx.drawImage(off, plot.x, plot.y, plot.width, plot.height);
    if (weather) {
      const vignette = renderer.ctx.createRadialGradient(
        plot.x + plot.width * 0.5, plot.y + plot.height * 0.45, 0,
        plot.x + plot.width * 0.5, plot.y + plot.height * 0.5, Math.max(plot.width, plot.height) * 0.68
      );
      vignette.addColorStop(0, "rgba(4,8,14,0)");
      vignette.addColorStop(1, "rgba(3,7,12,.72)");
      renderer.ctx.fillStyle = vignette;
      renderer.ctx.fillRect(plot.x, plot.y, plot.width, plot.height);
    }
    renderer.ctx.restore();
  }

  function drawGrid(renderer, field) {
    const { ctx } = renderer;
    const plot = plotRect(renderer);
    ctx.save();
    ctx.strokeStyle = "rgba(174,202,210,.10)";
    ctx.lineWidth = renderer.dpr;
    for (let i = 0; i <= 8; i += 1) {
      const x = plot.x + (i / 8) * plot.width;
      const y = plot.y + (i / 8) * plot.height;
      ctx.beginPath(); ctx.moveTo(x, plot.y); ctx.lineTo(x, plot.y + plot.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(plot.x, y); ctx.lineTo(plot.x + plot.width, y); ctx.stroke();
    }
    const origin = fieldToScreen(renderer, field, 0, 0);
    ctx.strokeStyle = "rgba(205,224,225,.24)";
    ctx.beginPath(); ctx.moveTo(origin[0], plot.y); ctx.lineTo(origin[0], plot.y + plot.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(plot.x, origin[1]); ctx.lineTo(plot.x + plot.width, origin[1]); ctx.stroke();
    ctx.restore();
  }

  function drawVectors(renderer, field, weather) {
    const { ctx } = renderer;
    const size = field.spec.size;
    const stride = size > 70 ? 7 : 5;
    const scale = Math.min(renderer.width, renderer.height) * 0.025;
    ctx.save();
    ctx.strokeStyle = weather ? "rgba(185,234,226,.46)" : "rgba(217,232,228,.64)";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = Math.max(1, renderer.dpr * 0.8);
    for (let row = Math.floor(stride / 2); row < size; row += stride) {
      for (let col = Math.floor(stride / 2); col < size; col += stride) {
        const index = row * size + col;
        const [x, y] = field.coordinates[index];
        const [sx, sy] = fieldToScreen(renderer, field, x, y);
        const vx = field.fields.vectorX[index];
        const vy = field.fields.vectorY[index];
        const mag = Math.hypot(vx, vy);
        if (mag < 0.025) continue;
        const length = Math.min(scale * 1.8, scale * (0.35 + mag));
        const ex = sx + (vx / mag) * length;
        const ey = sy - (vy / mag) * length;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        const angle = Math.atan2(ey - sy, ex - sx);
        const head = 3.3 * renderer.dpr;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - head * Math.cos(angle - 0.55), ey - head * Math.sin(angle - 0.55));
        ctx.lineTo(ex - head * Math.cos(angle + 0.55), ey - head * Math.sin(angle + 0.55));
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function vectorAt(field, x, y) {
    const sample = Field.sampleAt(field, x, y);
    return sample.vector;
  }

  function drawStreamlines(renderer, field, state, weather) {
    const { ctx } = renderer;
    const extent = field.spec.extent;
    ctx.save();
    ctx.lineWidth = Math.max(0.8, renderer.dpr * 0.62);
    for (let line = 0; line < 26; line += 1) {
      let x = (M.keyedUniform(state.config.seed, "render-stream", line, 0) * 2 - 1) * extent;
      let y = (M.keyedUniform(state.config.seed, "render-stream", line, 1) * 2 - 1) * extent;
      const alpha = 0.16 + 0.2 * M.keyedUniform(state.config.seed, "render-stream", line, 2);
      ctx.strokeStyle = weather ? `rgba(170,235,225,${alpha})` : `rgba(224,234,222,${alpha * 0.86})`;
      ctx.beginPath();
      for (let segment = 0; segment < 38; segment += 1) {
        const point = fieldToScreen(renderer, field, x, y);
        if (segment === 0) ctx.moveTo(point[0], point[1]); else ctx.lineTo(point[0], point[1]);
        const [vx, vy] = vectorAt(field, x, y);
        const mag = Math.hypot(vx, vy);
        if (mag < 1e-4) break;
        x += (vx / mag) * 0.045;
        y += (vy / mag) * 0.045;
        if (Math.abs(x) > extent || Math.abs(y) > extent) break;
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFronts(renderer, field) {
    const { ctx } = renderer;
    const size = field.spec.size;
    const values = field.normalized.front;
    ctx.save();
    ctx.strokeStyle = "rgba(245,189,114,.40)";
    ctx.lineWidth = Math.max(1, renderer.dpr * 0.85);
    for (let row = 0; row < size - 1; row += 1) {
      for (let col = 0; col < size - 1; col += 1) {
        const index = row * size + col;
        if (values[index] < 0.54) continue;
        const [x, y] = field.coordinates[index];
        const point = fieldToScreen(renderer, field, x, y);
        const next = fieldToScreen(renderer, field, field.coordinates[index + 1][0], field.coordinates[index + 1][1]);
        ctx.beginPath(); ctx.moveTo(point[0], point[1]); ctx.lineTo(next[0], next[1]); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCollapseContour(renderer, field) {
    const { ctx } = renderer;
    const size = field.spec.size;
    const values = field.fields.collapseMargin;
    ctx.save();
    ctx.strokeStyle = "rgba(255,139,94,.82)";
    ctx.setLineDash([6 * renderer.dpr, 5 * renderer.dpr]);
    ctx.lineWidth = Math.max(1.2, renderer.dpr);
    for (let row = 0; row < size - 1; row += 1) {
      for (let col = 0; col < size - 1; col += 1) {
        const i = row * size + col;
        const corners = [values[i], values[i + 1], values[i + size], values[i + size + 1]];
        if (!(Math.min(...corners) <= 0 && Math.max(...corners) >= 0)) continue;
        const [x, y] = field.coordinates[i];
        const [x2, y2] = field.coordinates[i + size + 1];
        const a = fieldToScreen(renderer, field, x, y);
        const b = fieldToScreen(renderer, field, x2, y2);
        ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      }
    }
    ctx.restore();
  }

  function drawAttractors(renderer, field) {
    const { ctx } = renderer;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = `${11 * renderer.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    for (const attractor of field.attractors) {
      if (attractor.kind === "observer") continue;
      if (attractor.kind === "basin" && !renderer.layers.basins) continue;
      if ((attractor.kind === "memory" || attractor.kind === "mesh") && !renderer.layers.memory) continue;
      const [x, y] = fieldToScreen(renderer, field, attractor.xy[0], attractor.xy[1]);
      if (attractor.kind === "basin") {
        ctx.strokeStyle = "rgba(164,182,188,.42)";
        ctx.fillStyle = "rgba(164,182,188,.72)";
        ctx.beginPath();
        for (let k = 0; k < 6; k += 1) {
          const angle = (Math.PI * 2 * k) / 6;
          const px = x + Math.cos(angle) * 5 * renderer.dpr;
          const py = y + Math.sin(angle) * 5 * renderer.dpr;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
      } else {
        ctx.fillStyle = attractor.kind === "memory" ? "#f0c57c" : "#88bdb4";
        ctx.beginPath(); ctx.arc(x, y, attractor.kind === "memory" ? 4.2 * renderer.dpr : 3 * renderer.dpr, 0, Math.PI * 2); ctx.fill();
        if (attractor.kind === "memory") ctx.fillText(attractor.label.slice(0, 18), x, y - 7 * renderer.dpr);
      }
    }
    ctx.restore();
  }

  function drawTrace(renderer, field, state, projection) {
    const trace = state.trace.slice(-160);
    if (trace.length < 2) return;
    const { ctx } = renderer;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1.6, renderer.dpr * 1.35);
    const gradient = ctx.createLinearGradient(0, 0, renderer.width, renderer.height);
    gradient.addColorStop(0, "rgba(100,195,208,.15)");
    gradient.addColorStop(1, "rgba(205,247,229,.92)");
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    trace.forEach((item, index) => {
      const xy = Projection.project(projection, item.latent, 2);
      const point = fieldToScreen(renderer, field, xy[0], xy[1]);
      if (index === 0) ctx.moveTo(point[0], point[1]); else ctx.lineTo(point[0], point[1]);
    });
    ctx.stroke();
    ctx.restore();
  }

  function drawStateMarkers(renderer, field, state) {
    const { ctx } = renderer;
    const psi = fieldToScreen(renderer, field, field.live.psi[0], field.live.psi[1]);
    const reflex = fieldToScreen(renderer, field, field.live.reflex[0], field.live.reflex[1]);
    ctx.save();
    if (renderer.layers.reflex) {
      ctx.strokeStyle = "rgba(242,184,99,.8)";
      ctx.setLineDash([5 * renderer.dpr, 4 * renderer.dpr]);
      ctx.lineWidth = Math.max(1, renderer.dpr);
      ctx.beginPath(); ctx.moveTo(psi[0], psi[1]); ctx.lineTo(reflex[0], reflex[1]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#f1b768";
      ctx.beginPath(); ctx.arc(reflex[0], reflex[1], 7 * renderer.dpr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowColor = "rgba(139,240,219,.85)";
    ctx.shadowBlur = 14 * renderer.dpr;
    ctx.fillStyle = "#dffcf3";
    ctx.beginPath(); ctx.arc(psi[0], psi[1], 5.6 * renderer.dpr, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    drawTelemetryArrow(ctx, psi, field.live.gamma, "#b9f1e4", "Γ", renderer.dpr, 34);
    drawTelemetryArrow(ctx, psi, field.live.flux, "#75b5dc", "Φ", renderer.dpr, 24);
    ctx.fillStyle = "#dffcf3";
    ctx.font = `${11 * renderer.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText("ψ", psi[0] + 9 * renderer.dpr, psi[1] - 8 * renderer.dpr);
    ctx.fillStyle = "#f1b768";
    ctx.fillText("ψᴽ", reflex[0] + 9 * renderer.dpr, reflex[1] + 13 * renderer.dpr);
    ctx.restore();
  }

  function drawTelemetryArrow(ctx, origin, vector, color, label, dpr, scale) {
    const magnitude = Math.hypot(vector[0], vector[1]);
    if (magnitude < 0.015) return;
    const capped = Math.min(72 * dpr, magnitude * scale * dpr);
    const ex = origin[0] + (vector[0] / magnitude) * capped;
    const ey = origin[1] - (vector[1] / magnitude) * capped;
    const angle = Math.atan2(ey - origin[1], ex - origin[0]);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4 * dpr;
    ctx.beginPath(); ctx.moveTo(origin[0], origin[1]); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 5 * dpr * Math.cos(angle - 0.5), ey - 5 * dpr * Math.sin(angle - 0.5));
    ctx.lineTo(ex - 5 * dpr * Math.cos(angle + 0.5), ey - 5 * dpr * Math.sin(angle + 0.5));
    ctx.closePath(); ctx.fill();
    ctx.font = `${10 * dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText(label, ex + 4 * dpr, ey - 4 * dpr);
  }

  function drawPeer(renderer, field, state, peerState, projection) {
    if (!peerState) return;
    const { ctx } = renderer;
    const trace = peerState.trace.slice(-160);
    ctx.save();
    if (trace.length > 1 && renderer.layers.trace) {
      ctx.strokeStyle = "rgba(102,169,212,.72)";
      ctx.lineWidth = Math.max(1.3, renderer.dpr * 1.1);
      ctx.beginPath();
      trace.forEach((item, index) => {
        const xy = Projection.project(projection, item.latent, 2);
        const point = fieldToScreen(renderer, field, xy[0], xy[1]);
        if (index === 0) ctx.moveTo(point[0], point[1]); else ctx.lineTo(point[0], point[1]);
      });
      ctx.stroke();
    }
    const peerXY = Projection.project(projection, peerState.psi.latent, 2);
    const peer = fieldToScreen(renderer, field, peerXY[0], peerXY[1]);
    const primary = fieldToScreen(renderer, field, field.live.psi[0], field.live.psi[1]);
    if (peerState.lastFlux.coupling && peerState.lastFlux.coupling.applied) {
      ctx.strokeStyle = "rgba(105,169,212,.62)";
      ctx.setLineDash([7 * renderer.dpr, 5 * renderer.dpr]);
      ctx.lineWidth = renderer.dpr;
      ctx.beginPath(); ctx.moveTo(primary[0], primary[1]); ctx.lineTo(peer[0], peer[1]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(166,207,229,.88)";
      ctx.font = `${9 * renderer.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText("declared coupling", (primary[0] + peer[0]) / 2 + 5 * renderer.dpr, (primary[1] + peer[1]) / 2 - 5 * renderer.dpr);
    }
    ctx.fillStyle = "#69a9d4";
    ctx.strokeStyle = "rgba(214,239,252,.85)";
    ctx.lineWidth = renderer.dpr;
    ctx.beginPath(); ctx.arc(peer[0], peer[1], 5.4 * renderer.dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#a6cfe5";
    ctx.font = `${11 * renderer.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText("ψ B", peer[0] + 9 * renderer.dpr, peer[1] - 8 * renderer.dpr);
    ctx.restore();
  }

  function drawRecall(renderer, field) {
    if (!field.live.appliedRecall) return;
    const source = field.attractors.find((item) => item.id === field.live.appliedRecall.memoryId);
    if (!source) return;
    const { ctx } = renderer;
    const a = fieldToScreen(renderer, field, source.xy[0], source.xy[1]);
    const b = fieldToScreen(renderer, field, field.live.psi[0], field.live.psi[1]);
    ctx.save();
    ctx.strokeStyle = "rgba(245,200,116,.88)";
    ctx.lineWidth = 1.5 * renderer.dpr;
    ctx.setLineDash([3 * renderer.dpr, 4 * renderer.dpr]);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 36 * renderer.dpr, b[0], b[1]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f6ce83";
    ctx.font = `${10 * renderer.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText("Θλ applied", (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 12 * renderer.dpr);
    ctx.restore();
  }

  function drawSelection(renderer, field) {
    if (!renderer.selected) return;
    const { ctx } = renderer;
    const point = fieldToScreen(renderer, field, renderer.selected.x, renderer.selected.y);
    ctx.save();
    ctx.strokeStyle = "rgba(232,247,241,.88)";
    ctx.lineWidth = renderer.dpr;
    ctx.beginPath(); ctx.arc(point[0], point[1], 11 * renderer.dpr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(point[0] - 16 * renderer.dpr, point[1]); ctx.lineTo(point[0] + 16 * renderer.dpr, point[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(point[0], point[1] - 16 * renderer.dpr); ctx.lineTo(point[0], point[1] + 16 * renderer.dpr); ctx.stroke();
    ctx.restore();
  }

  function drawEventPulses(renderer, field, state) {
    const { ctx } = renderer;
    const recent = state.events.filter((event) => event.kind === "collapse").slice(-8);
    ctx.save();
    for (const event of recent) {
      const basin = field.attractors.find((item) => item.id === `basin:${event.basinId}`);
      if (!basin) continue;
      const point = fieldToScreen(renderer, field, basin.xy[0], basin.xy[1]);
      const age = Math.max(0, state.ctx.step - event.step);
      const radius = (9 + Math.min(22, age * 1.6)) * renderer.dpr;
      ctx.strokeStyle = `rgba(255,132,91,${Math.max(0.16, 0.8 - age * 0.045)})`;
      ctx.lineWidth = Math.max(1, renderer.dpr);
      ctx.beginPath(); ctx.arc(point[0], point[1], radius, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawDecorativeParticles(renderer, field, state) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { ctx } = renderer;
    ctx.save();
    for (let i = 0; i < 46; i += 1) {
      const phase = state.ctx.step * 0.018 + i * 0.37;
      const baseX = (M.keyedUniform(state.config.seed, "decorative", i, 0) * 2 - 1) * field.spec.extent;
      const baseY = (M.keyedUniform(state.config.seed, "decorative", i, 1) * 2 - 1) * field.spec.extent;
      const x = M.clamp(baseX + 0.08 * Math.cos(phase), -field.spec.extent, field.spec.extent);
      const y = M.clamp(baseY + 0.08 * Math.sin(phase * 0.83), -field.spec.extent, field.spec.extent);
      const point = fieldToScreen(renderer, field, x, y);
      const sample = Field.sampleAt(field, x, y);
      const alpha = 0.06 + 0.16 * M.clamp(sample.weather, 0, 1);
      ctx.fillStyle = `rgba(180,241,226,${alpha})`;
      ctx.beginPath(); ctx.arc(point[0], point[1], (0.8 + 1.6 * alpha) * renderer.dpr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function terrainPoint(renderer, field, x, y, z) {
    const yaw = renderer.yaw;
    const pitch = renderer.pitch;
    const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
    const ry = x * Math.sin(yaw) + y * Math.cos(yaw);
    const depth = ry * Math.sin(pitch) + z * Math.cos(pitch);
    const vertical = ry * Math.cos(pitch) - z * Math.sin(pitch);
    const scale = Math.min(renderer.width, renderer.height) * 0.19;
    return {
      x: renderer.width * 0.5 + rx * scale,
      y: renderer.height * 0.56 + vertical * scale,
      depth
    };
  }

  function drawTerrain(renderer, field, state, projection, peerState = null) {
    const { ctx } = renderer;
    const size = field.spec.size;
    const values = Field.normalizedValues(field, renderer.scalarMode);
    const quads = [];
    for (let row = 0; row < size - 1; row += 1) {
      for (let col = 0; col < size - 1; col += 1) {
        const i = row * size + col;
        const ids = [i, i + 1, i + size + 1, i + size];
        const points = ids.map((id) => {
          const [x, y] = field.coordinates[id];
          return terrainPoint(renderer, field, x, y, values[id] * 1.25 - 0.34);
        });
        quads.push({ points, value: ids.reduce((sum, id) => sum + values[id], 0) / 4, depth: points.reduce((sum, p) => sum + p.depth, 0) / 4 });
      }
    }
    quads.sort((a, b) => a.depth - b.depth);
    ctx.save();
    for (const quad of quads) {
      const c = colorStops(quad.value, renderer.scalarMode === "weather");
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.91)`;
      ctx.strokeStyle = "rgba(203,229,223,.075)";
      ctx.lineWidth = Math.max(0.4, renderer.dpr * 0.36);
      ctx.beginPath();
      quad.points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (renderer.layers.trace && state.trace.length > 1) {
      ctx.strokeStyle = "rgba(226,255,246,.95)";
      ctx.lineWidth = 2 * renderer.dpr;
      ctx.beginPath();
      state.trace.slice(-140).forEach((item, index) => {
        const xyz = Projection.project(projection, item.latent, 3);
        const point = terrainPoint(renderer, field, xyz[0], xyz[1], xyz[2] * 0.58);
        if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    if (peerState && renderer.layers.trace && peerState.trace.length > 1) {
      ctx.strokeStyle = "rgba(105,169,212,.8)";
      ctx.lineWidth = 1.6 * renderer.dpr;
      ctx.beginPath();
      peerState.trace.slice(-140).forEach((item, index) => {
        const xyz = Projection.project(projection, item.latent, 3);
        const point = terrainPoint(renderer, field, xyz[0], xyz[1], xyz[2] * 0.58);
        if (index === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
    const drawProjectedMarker = (runtimeState, color, label) => {
      const xyz = Projection.project(projection, runtimeState.psi.latent, 3);
      const point = terrainPoint(renderer, field, xyz[0], xyz[1], xyz[2] * 0.58);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 * renderer.dpr;
      ctx.beginPath(); ctx.arc(point.x, point.y, 5.5 * renderer.dpr, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = `${10 * renderer.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText(label, point.x + 8 * renderer.dpr, point.y - 8 * renderer.dpr);
    };
    drawProjectedMarker(state, "#dffcf3", "ψ · R¹²→R³");
    if (peerState) drawProjectedMarker(peerState, "#69a9d4", "ψ B");
    ctx.restore();
  }

  function drawHud(renderer, field, state) {
    const { ctx } = renderer;
    const frame = state.frames[state.frames.length - 1];
    const title = renderer.view === "terrain" ? "3D scalar terrain" : renderer.view === "field" ? "2D observer-field slice" : "Memory Weather composite";
    ctx.save();
    ctx.fillStyle = "rgba(4,10,16,.72)";
    ctx.strokeStyle = "rgba(194,219,216,.13)";
    ctx.lineWidth = renderer.dpr;
    const x = 36 * renderer.dpr;
    const y = 34 * renderer.dpr;
    const w = 250 * renderer.dpr;
    const h = 57 * renderer.dpr;
    roundRect(ctx, x, y, w, h, 10 * renderer.dpr); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#dff3ef";
    ctx.font = `600 ${12 * renderer.dpr}px system-ui, sans-serif`;
    ctx.fillText(title, x + 13 * renderer.dpr, y + 21 * renderer.dpr);
    ctx.fillStyle = "#87a19f";
    ctx.font = `${10 * renderer.dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const status = frame ? `${frame.weather.label} · t${frame.step} · ${field.dataHash.slice(-8)}` : `initial · ${field.dataHash.slice(-8)}`;
    ctx.fillText(status, x + 13 * renderer.dpr, y + 41 * renderer.dpr);
    ctx.restore();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function render(renderer, field, state, projection, peerState = null) {
    resize(renderer);
    drawBackground(renderer);
    if (renderer.view === "terrain") {
      drawTerrain(renderer, field, state, projection, peerState);
    } else {
      const weather = renderer.view === "weather";
      if (renderer.layers.scalar) drawHeatmap(renderer, field, renderer.scalarMode, weather);
      if (renderer.layers.grid && !weather) drawGrid(renderer, field);
      if (renderer.layers.streamlines) drawStreamlines(renderer, field, state, weather);
      if (renderer.layers.vectors) drawVectors(renderer, field, weather);
      if (renderer.scalarMode === "fronts") drawFronts(renderer, field);
      if (renderer.layers.collapse) drawCollapseContour(renderer, field);
      if (renderer.layers.basins || renderer.layers.memory) drawAttractors(renderer, field);
      if (renderer.layers.trace) drawTrace(renderer, field, state, projection);
      if (renderer.layers.memory) drawRecall(renderer, field);
      if (renderer.layers.events) drawEventPulses(renderer, field, state);
      drawPeer(renderer, field, state, peerState, projection);
      drawStateMarkers(renderer, field, state);
      drawSelection(renderer, field);
      if (weather) drawDecorativeParticles(renderer, field, state);
    }
    drawHud(renderer, field, state);
  }

  return {
    DEFAULT_LAYERS,
    createRenderer,
    fieldToScreen,
    render,
    resize,
    screenToField,
    setLayer,
    setScalarMode,
    setView
  };
});
