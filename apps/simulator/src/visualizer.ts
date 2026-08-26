import { BASINS, type Vec } from "../../../src/engine.ts";

export type FieldVisualState = {
  latent: Vec;
  selfModel: Vec;
  gamma: Vec;
  trail: Vec[];
  rho: number;
  phase: number;
  step: number;
  fluxEnergy: number;
  collapsed: boolean;
};

type Point = { x: number; y: number };

const TAU = Math.PI * 2;
const LATENT_LIMIT = 2;

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function projectVector(vector: Vec, radius: number): Point {
  let x = 0;
  let y = 0;
  for (let i = 0; i < vector.length; i += 1) {
    const angle = -Math.PI / 2 + (i / vector.length) * TAU;
    x += vector[i] * Math.cos(angle);
    y += vector[i] * Math.sin(angle);
  }
  const scale = radius / (vector.length * 0.92);
  return { x: x * scale, y: y * scale };
}

function radarPoints(vector: Vec, radius: number): Point[] {
  return vector.map((value, index) => {
    const angle = -Math.PI / 2 + (index / vector.length) * TAU;
    const normalized = 0.16 + 0.8 * ((clamp(value, -LATENT_LIMIT, LATENT_LIMIT) + LATENT_LIMIT) / (2 * LATENT_LIMIT));
    return {
      x: Math.cos(angle) * radius * normalized,
      y: Math.sin(angle) * radius * normalized,
    };
  });
}

function polygon(context: CanvasRenderingContext2D, points: Point[]): void {
  if (!points.length) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) context.lineTo(point.x, point.y);
  context.closePath();
}

export class FieldVisualizer {
  private readonly context: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private state?: FieldVisualState;
  private pulse?: Point;
  private pulseTimer?: number;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    this.context = context;
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(canvas);
  }

  update(state: FieldVisualState): void {
    this.state = state;
    this.render();
  }

  markPulse(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pulse = {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };
    this.render();
    if (this.pulseTimer !== undefined) window.clearTimeout(this.pulseTimer);
    this.pulseTimer = window.setTimeout(() => {
      this.pulse = undefined;
      this.pulseTimer = undefined;
      this.render();
    }, 420);
  }

  destroy(): void {
    if (this.pulseTimer !== undefined) window.clearTimeout(this.pulseTimer);
    this.pulseTimer = undefined;
    this.pulse = undefined;
    this.resizeObserver.disconnect();
  }

  private render(): void {
    const state = this.state;
    if (!state) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const ctx = this.context;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);

    const radius = Math.min(rect.width, rect.height) * 0.39;
    const axisCount = state.latent.length;

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.34);
    glow.addColorStop(0, "rgba(80, 226, 209, 0.075)");
    glow.addColorStop(0.62, "rgba(88, 153, 255, 0.025)");
    glow.addColorStop(1, "rgba(7, 16, 20, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.34, 0, TAU);
    ctx.fill();

    for (let ring = 1; ring <= 4; ring += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, radius * (ring / 4), 0, TAU);
      ctx.strokeStyle = ring === 4 ? "rgba(159, 190, 198, 0.24)" : "rgba(159, 190, 198, 0.10)";
      ctx.lineWidth = ring === 4 ? 1.2 : 1;
      ctx.stroke();
    }

    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Engine phase is modulo-eight scheduler metadata, not an R¹² coordinate.
    for (let i = 0; i < axisCount; i += 1) {
      const angle = -Math.PI / 2 + (i / axisCount) * TAU;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(159, 190, 198, 0.10)";
      ctx.stroke();
      ctx.fillStyle = "rgba(196, 218, 222, 0.55)";
      ctx.fillText(String(i + 1).padStart(2, "0"), Math.cos(angle) * radius * 1.09, Math.sin(angle) * radius * 1.09);
    }

    for (const trailVector of state.trail.slice(-28)) {
      const point = projectVector(trailVector, radius);
      ctx.fillStyle = "rgba(78, 214, 201, 0.17)";
      ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
    }

    // A collapse boolean does not identify the emitted basin; keep all basin
    // markers neutral while the field outline carries the genuine event glow.
    BASINS.forEach((basin, index) => {
      const point = projectVector(basin.latent, radius);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.2, 0, TAU);
      ctx.fillStyle = "rgba(255, 211, 138, 0.45)";
      ctx.fill();
      ctx.fillStyle = "rgba(207, 225, 228, 0.58)";
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(String(index + 1), point.x, point.y - 10);
    });

    const reflex = radarPoints(state.selfModel, radius);
    polygon(ctx, reflex);
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = "rgba(72, 215, 204, 0.78)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.setLineDash([]);

    const field = radarPoints(state.latent, radius);
    polygon(ctx, field);
    const fieldFill = ctx.createLinearGradient(-radius, -radius, radius, radius);
    fieldFill.addColorStop(0, "rgba(255, 213, 138, 0.26)");
    fieldFill.addColorStop(0.52, "rgba(255, 125, 137, 0.14)");
    fieldFill.addColorStop(1, "rgba(74, 215, 203, 0.15)");
    ctx.fillStyle = fieldFill;
    ctx.fill();
    ctx.strokeStyle = state.collapsed ? "#ffe2a9" : "#f5c978";
    ctx.lineWidth = state.collapsed ? 2.8 : 1.8;
    ctx.shadowColor = state.collapsed ? "rgba(255, 220, 158, 0.72)" : "rgba(245, 201, 120, 0.34)";
    ctx.shadowBlur = state.collapsed ? 18 : 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i < axisCount; i += 1) {
      const angle = -Math.PI / 2 + (i / axisCount) * TAU;
      const magnitude = clamp(Math.abs(state.gamma[i] ?? 0) / 1.4, 0, 1);
      const inner = radius * 0.72;
      const outer = inner + radius * 0.18 * magnitude;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.strokeStyle = (state.gamma[i] ?? 0) < 0 ? "rgba(255, 121, 137, 0.70)" : "rgba(93, 224, 210, 0.70)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // τ is configurable and is not part of FieldVisualState, so this arc shows
    // only the engine-reported ρ magnitude without threshold semantics.
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.055, -Math.PI / 2, -Math.PI / 2 + TAU * state.rho);
    ctx.strokeStyle = "#58d7ca";
    ctx.lineWidth = 3;
    ctx.stroke();

    const center = projectVector(state.latent, radius);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4.5, 0, TAU);
    ctx.fillStyle = "#f8fbf9";
    ctx.shadowColor = "rgba(255,255,255,.75)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (this.pulse) {
      ctx.beginPath();
      ctx.arc(this.pulse.x, this.pulse.y, 22, 0, TAU);
      ctx.strokeStyle = "rgba(255, 126, 144, 0.78)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.pulse.x, this.pulse.y, 7, 0, TAU);
      ctx.fillStyle = "rgba(255, 126, 144, 0.42)";
      ctx.fill();
    }

    ctx.restore();
  }
}
