import type { ShapeId } from "./data/projects.ts";

export const PARTICLES = 900;

export interface Shape {
  /** xyz triples, roughly within a 7 x 5 x 3 box centred on the origin. */
  pos: Float32Array;
  /** 1 where the point takes part in the motion (flow, wave), 0 where it stays put. */
  mask: Float32Array;
}

/** Small seeded RNG so every shape is the same on every load (and testable). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Builder {
  pos: number[] = [];
  mask: number[] = [];
  r: () => number;
  constructor(seed: number) {
    this.r = rng(seed);
  }
  /** Roughly normal in [-1, 1]. */
  g() {
    return (this.r() + this.r() + this.r() - 1.5) / 1.5;
  }
  add(x: number, y: number, z: number, moves = 0) {
    if (this.pos.length / 3 >= PARTICLES) return;
    this.pos.push(x, y, z);
    this.mask.push(moves);
  }
  get count() {
    return this.pos.length / 3;
  }
  line(ax: number, ay: number, az: number, bx: number, by: number, bz: number, n: number, jitter = 0.03, moves = 0) {
    for (let i = 0; i < n; i++) {
      const t = this.r();
      this.add(
        ax + (bx - ax) * t + this.g() * jitter,
        ay + (by - ay) * t + this.g() * jitter,
        az + (bz - az) * t + this.g() * jitter,
        moves,
      );
    }
  }
  blob(cx: number, cy: number, cz: number, rad: number, n: number, moves = 0) {
    for (let i = 0; i < n; i++) this.add(cx + this.g() * rad, cy + this.g() * rad, cz + this.g() * rad, moves);
  }
  box(cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, perEdge: number) {
    const c = [-1, 1];
    for (const sx of c)
      for (const sy of c) {
        this.line(cx + sx * hx, cy + sy * hy, cz - hz, cx + sx * hx, cy + sy * hy, cz + hz, perEdge);
        this.line(cx + sx * hx, cy - hy, cz + sy * hz, cx + sx * hx, cy + hy, cz + sy * hz, perEdge);
        this.line(cx - hx, cy + sx * hy, cz + sy * hz, cx + hx, cy + sx * hy, cz + sy * hz, perEdge);
      }
  }
  /** Top up to PARTICLES with faint dust inside the given half-extents so every shape has the same count. */
  fill(hx = 3.2, hy = 2.2, hz = 1.4) {
    while (this.count < PARTICLES) this.add(this.g() * hx, this.g() * hy, this.g() * hz);
  }
  done(): Shape {
    return { pos: new Float32Array(this.pos), mask: new Float32Array(this.mask) };
  }
}

const TAU = Math.PI * 2;

const generators: Record<ShapeId, (b: Builder) => void> = {
  vortex(b) {
    while (b.count < 860) {
      const arm = b.count % 3;
      const t = Math.pow(b.r(), 0.6) * 3.2;
      const a = (arm * TAU) / 3 + t * 1.7 + b.g() * 0.25;
      b.add(Math.cos(a) * t, b.g() * 0.12 * (1 + t * 0.3), Math.sin(a) * t, 1);
    }
  },
  lanes(b) {
    for (const y of [-1.2, 0, 1.2]) {
      for (let i = 0; i < 200; i++) b.add((b.r() - 0.5) * 7, y + b.g() * 0.1, b.g() * 0.3, 1);
    }
    // the gate every payment passes through
    b.line(0, -2, -0.8, 0, 2, -0.8, 40);
    b.line(0, -2, 0.8, 0, 2, 0.8, 40);
    b.line(0, -2, -0.8, 0, -2, 0.8, 20);
    b.line(0, 2, -0.8, 0, 2, 0.8, 20);
  },
  ledger(b) {
    for (const x of [-1.7, 1.7]) {
      for (let row = 0; row < 22; row++) {
        const y = -2.2 + row * 0.2;
        b.line(x - 0.45, y, 0, x + 0.45, y, 0, 14, 0.012);
      }
    }
    // the lines that have to agree
    for (let row = 0; row < 22; row += 2) {
      const y = -2.2 + row * 0.2;
      b.line(-1.2, y, 0, 1.2, y, 0, 8, 0.01);
    }
  },
  clusters(b) {
    const centers: [number, number, number][] = [
      [-1.8, 1.1, 0.4],
      [1.8, 1.0, -0.5],
      [-1.2, -1.2, -0.3],
      [1.6, -1.1, 0.5],
    ];
    for (const [x, y, z] of centers) b.blob(x, y, z, 0.42, 150);
    // the scattered failures before triage
    while (b.count < PARTICLES) b.add(b.g() * 3.4, b.g() * 2.3, b.g() * 1.4);
  },
  queue(b) {
    for (let i = 0; i < 300; i++) b.add(-3.5 + b.r() * 2.7, b.g() * 0.08, b.g() * 0.08, 1);
    b.box(0, 0, 0, 0.8, 0.8, 0.8, 22);
    for (const fan of [-1.4, -0.5, 0.5, 1.4]) b.line(0.8, fan * 0.15, 0, 3.5, fan, 0, 60, 0.04, 1);
  },
  graph(b) {
    const nodes: [number, number, number][] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const rad = 1.4 + b.r() * 1.2;
      nodes.push([Math.cos(a) * rad, b.g() * 1.2, Math.sin(a) * rad * 0.7]);
    }
    for (const [x, y, z] of nodes) b.blob(x, y, z, 0.2, 38);
    nodes.forEach((n, i) => {
      for (const k of [1, 3]) {
        const m = nodes[(i + k) % nodes.length]!;
        b.line(n[0], n[1], n[2], m[0], m[1], m[2], 22, 0.02);
      }
    });
  },
  waveform(b) {
    for (let i = 0; i < 780; i++) {
      const x = (b.r() - 0.5) * 7;
      const env = Math.sin(((x + 3.5) / 7) * Math.PI) * (0.55 + 0.45 * Math.sin(x * 2.1));
      b.add(x, Math.sin(x * 3.6) * env * 1.5 + b.g() * 0.07, b.g() * 0.2, 1);
    }
  },
  brackets(b) {
    b.line(-0.7, 1.5, 0, -2.2, 0, 0, 160, 0.05);
    b.line(-2.2, 0, 0, -0.7, -1.5, 0, 160, 0.05);
    b.line(0.7, 1.5, 0, 2.2, 0, 0, 160, 0.05);
    b.line(2.2, 0, 0, 0.7, -1.5, 0, 160, 0.05);
    b.line(0.35, 1.3, 0, -0.35, -1.3, 0, 120, 0.04);
  },
  timeline(b) {
    for (let i = 0; i < 360; i++) b.add((b.r() - 0.5) * 7, b.g() * 0.03, 0, 1);
    for (let i = 0; i < 28; i++) {
      const x = -3.4 + i * 0.25;
      b.line(x, -0.15, 0, x, 0.15, 0, 6, 0.01);
    }
    for (const x of [-2.1, 0.6, 2.3]) b.line(x, -1.1, 0, x, 1.1, 0, 60, 0.02);
  },
  voices(b) {
    for (const phase of [0, Math.PI]) {
      for (let i = 0; i < 430; i++) {
        const x = (b.r() - 0.5) * 7;
        b.add(x, Math.sin(x * 2.4 + phase) * 0.9 + b.g() * 0.06, phase === 0 ? 0.25 : -0.25, 1);
      }
    }
  },
  chart(b) {
    b.line(-3.2, -1.8, 0, -3.2, 1.9, 0, 70, 0.015);
    b.line(-3.2, -1.8, 0, 3.4, -1.8, 0, 120, 0.015);
    for (let i = 0; i < 480; i++) {
      const x = -3.1 + b.r() * 6.4;
      let y = 0.6 + 0.35 * Math.sin(x * 1.3) + 0.1 * Math.sin(x * 7);
      y -= 1.7 * Math.exp(-Math.pow((x - 1.1) * 2.2, 2)); // the regression
      b.add(x, y, 0, 0);
    }
    for (let k = 1; k < 4; k++) b.line(-3.2, -1.8 + k * 1.1, 0, 3.4, -1.8 + k * 1.1, 0, 14, 0.01);
  },
  funnel(b) {
    for (let i = 0; i < 840; i++) {
      const t = b.r();
      const rad = (2.2 * (1 - t) + 0.15 * t) * Math.sqrt(b.r());
      const a = b.r() * TAU;
      b.add(-3.5 + t * 7, Math.cos(a) * rad, Math.sin(a) * rad * 0.6, 1);
    }
  },
  dome(b) {
    for (let i = 0; i < 640; i++) {
      const u = b.r() * TAU;
      const v = Math.acos(b.r());
      b.add(Math.cos(u) * Math.sin(v) * 2.4, Math.cos(v) * 2.2 - 0.9, Math.sin(u) * Math.sin(v) * 2.4);
    }
    for (let i = 0; i < 220; i++) {
      const u = b.r() * TAU;
      b.add(Math.cos(u) * 2.6, -0.9, Math.sin(u) * 2.6);
    }
  },
  tree(b) {
    const root: [number, number, number] = [-3, 0, 0];
    const mid: [number, number, number][] = [[-0.8, 1.5, 0], [-0.8, 0, 0], [-0.8, -1.5, 0]];
    b.blob(root[0], root[1], root[2], 0.2, 40);
    mid.forEach((m, i) => {
      b.blob(m[0], m[1], m[2], 0.16, 30);
      b.line(root[0], root[1], 0, m[0], m[1], 0, 40, 0.025);
      for (let k = -1; k <= 1; k++) {
        const leaf: [number, number, number] = [2.3, m[1] * 1.2 + k * 0.45, 0];
        b.blob(leaf[0], leaf[1], 0, 0.1, 14);
        b.line(m[0], m[1], 0, leaf[0], leaf[1], 0, 22, 0.02);
      }
      void i;
    });
  },
  archive(b) {
    for (let i = 0; i < 380; i++) b.add(-3.5 + b.r() * 4.8, b.g() * 0.6, b.g() * 0.3, 1);
    b.box(2.3, 0, 0, 1.0, 1.0, 1.0, 30);
  },
  track(b) {
    for (let i = 0; i < 740; i++) {
      const t = (i / 740) * TAU;
      const rad = 2.3 + 0.55 * Math.sin(3 * t) + 0.2 * Math.sin(5 * t + 1);
      b.add(Math.cos(t) * rad * 1.35, b.g() * 0.03, Math.sin(t) * rad * 0.85);
    }
    b.line(2.9, 0, -0.4, 2.9, 0, 0.4, 40, 0.01);
  },
};

export function makeShape(id: ShapeId, seed = 7): Shape {
  const b = new Builder(seed);
  generators[id](b);
  b.fill();
  return b.done();
}

export const SHAPE_IDS = Object.keys(generators) as ShapeId[];
