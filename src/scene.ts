import * as THREE from "three";
import { categoryById, projects, tour } from "./data/projects.ts";
import { PARTICLES, makeShape, rng } from "./shapes.ts";
import { closestHit, type Target } from "./pick.ts";
import { BEAT_GAIN_BY_SECTION, beatEnvelope, beatRing } from "./beat.ts";

/** Section order in the page. The scene flies through them in this order. */
export const SECTION = {
  hero: 0,
  intro: 1,
  stats: 2,
  experience: 3,
  projects: 4,
  overview: 5,
  skills: 6,
  contact: 7,
} as const;

const N = tour.length; // stops in the scroll tour
const NA = projects.length; // every project (the overview rotates through all of them)
const STEP = 20; // world units between project constellations
const FIRST_Z = -60;
const CX = 3.0; // constellations sit right of the flight path, so text can sit on the left
const clusterY = (i: number) => Math.sin(i * 1.7) * 1.1;
const clusterZ = (i: number) => FIRST_Z - i * STEP;
const OV_LIFE = 18; // seconds a project spends drifting through the tunnel
const OV_VISIBLE = 5; // how many are in the tunnel at once
const Z_OV = clusterZ(N - 1) - 75; // the ring tunnel with every project floating in it
const END_Z = Z_OV - 70;

interface Pose {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const clusterPose = (i: number): Pose => ({
  pos: v(0.4, clusterY(i) * 0.5 + 0.3, clusterZ(i) + 12.5),
  look: v(CX * 0.7, clusterY(i), clusterZ(i)),
});

const OV_POSE: Pose = { pos: v(0, 0, Z_OV + 14), look: v(0, 0, Z_OV - 25) };
const OV_DEEP: Pose = { pos: v(0, 0, Z_OV + 1), look: v(0, 0, Z_OV - 30) };

const WAYPOINTS: Pose[] = [
  { pos: v(0, 0.3, 28), look: v(0, 0, 0) }, // hero
  { pos: v(0, 0.2, 22), look: v(0, 0, 0) }, // intro
  { pos: v(0, 0.1, 16), look: v(0, 0, -2) }, // stats
  { pos: v(0, 0, 12), look: v(0, 0, -30) }, // experience
  clusterPose(0), // projects start
  clusterPose(N - 1), // overview start
  OV_DEEP, // skills start
  { pos: v(0, 0, END_Z + 22), look: v(0, 0, END_Z) }, // contact start
  { pos: v(0, 0, END_Z + 11), look: v(0, 0, END_Z) }, // contact end
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const smoothRange = (a: number, b: number, t: number) => smooth(Math.min(1, Math.max(0, (t - a) / (b - a))));

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aMove;
  uniform float uTime;
  uniform float uScale;
  uniform float uMode;
  uniform float uBright;
  uniform float uPulse;
  uniform float uBeat;
  uniform float uBeatR;
  uniform float uBeatAmp;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying float vA;
  varying vec3 vC;
  void main() {
    vec3 p = position;
    if (uMode > 0.5 && uMode < 1.5) {
      p.x += (fract(uTime * 0.28 + aPhase) - 0.5) * 1.1 * aMove;
    } else if (uMode > 1.5 && uMode < 2.5) {
      p.y += sin(p.x * 2.2 + uTime * 2.4 + aPhase * 6.0) * 0.22 * aMove;
    } else if (uMode > 2.5) {
      float r = length(p.xz);
      float a = uTime * 0.7 / (0.7 + r);
      float c = cos(a);
      float s = sin(a);
      p.xz = mat2(c, -s, s, c) * p.xz;
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    float dist = max(-mv.z, 0.1);
    float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, dist);
    // a ring of light that expands from the centre when the site is entered
    float ring = exp(-pow((length(ndc) - uPulse * 1.9) * 4.5, 2.0)) * step(0.001, uPulse) * (1.0 - uPulse * 0.7);
    // the heartbeat: after the entry ring has finished, everything swells slightly with each beat, and a
    // much fainter ring rides outward from the centre
    float beatRing = exp(-pow((length(ndc) - uBeatR) * 4.0, 2.0)) * uBeatAmp;
    gl_PointSize = max(aSize * uScale / dist * (1.0 + ring * 1.6 + uBeat * 0.14 + beatRing * 0.6), 1.0);
    gl_Position = clip;
    float tw = 0.8 + 0.2 * sin(uTime * 1.6 + aPhase * 12.0);
    vA = aAlpha * fade * uBright * tw * (1.0 + uBeat * 0.22) + ring * 0.9 + beatRing * 0.3;
    vC = aColor;
  }
`;
const FRAG = /* glsl */ `
  varying float vA;
  varying vec3 vC;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d);
    gl_FragColor = vec4(vC, a * vA);
  }
`;

interface Shared {
  uTime: { value: number };
  uScale: { value: number };
  uPulse: { value: number };
  uBeat: { value: number };
  uBeatR: { value: number };
  uBeatAmp: { value: number };
}

function material(shared: Shared, mode: number, fade: [number, number]) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      ...shared,
      uMode: { value: mode },
      uBright: { value: 1 },
      uFadeNear: { value: fade[0] },
      uFadeFar: { value: fade[1] },
    },
  });
}

interface CloudOptions {
  color: THREE.Color;
  size: number;
  alpha: number;
  mask?: Float32Array;
  seed?: number;
}

function cloud(positions: Float32Array, mat: THREE.ShaderMaterial, o: CloudOptions) {
  const n = positions.length / 3;
  const r = rng(o.seed ?? 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const colors = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  const alphas = new Float32Array(n);
  const phases = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const k = 0.7 + r() * 0.3;
    colors.set([o.color.r * k, o.color.g * k, o.color.b * k], i * 3);
    sizes[i] = o.size * (0.6 + r() * 0.8);
    alphas[i] = o.alpha * (0.45 + r() * 0.55);
    phases[i] = r();
  }
  g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  g.setAttribute("aMove", new THREE.BufferAttribute(o.mask ?? new Float32Array(n), 1));
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return pts;
}

const BONE = new THREE.Color(0xe9e4d8);
const BLUE = new THREE.Color(0x6f95ff);

export class Scene3D {
  readonly ok: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
  private clock = new THREE.Clock();
  private shared: Shared = {
    uTime: { value: 0 },
    uScale: { value: 400 },
    uPulse: { value: 0 },
    uBeat: { value: 0 },
    uBeatR: { value: 0 },
    uBeatAmp: { value: 0 },
  };
  private clusters: { group: THREE.Points; mat: THREE.ShaderMaterial; motion: number; bright: number }[] = [];
  private endRing!: THREE.Points;
  private overview: {
    group: THREE.Points;
    mat: THREE.ShaderMaterial;
    base: number;
    spin: number;
    radius: number;
    hover: number;
    bright: number;
  }[] = [];
  private hover = -1;
  private ovSlots: { proj: number; spawn: number; angle: number; wall: number }[] = [];
  private ovClock = 0;
  private ovNext = OV_VISIBLE;
  private ovCounter = OV_VISIBLE;
  private lookDrop = 0;
  private wide = false;
  private viewOff = -1;
  private size = { w: 1, h: 1 };
  private pointerTarget = new THREE.Vector2(9, 9);
  private pointer = new THREE.Vector2(9, 9);
  private section: number = SECTION.hero;
  private local = 0;
  private active = 0;
  private entered = false;
  private pulseT = -1;
  // the heartbeat starts once the entry ring has finished
  private beatOn = false;
  private beatClock = 0;
  private beatGain = 0;
  private reduced: boolean;
  private narrow = false;
  private raf = 0;
  private running = true;
  private paused = false;
  private smoothPos = WAYPOINTS[0]!.pos.clone();
  private smoothLook = WAYPOINTS[0]!.look.clone();

  constructor(canvas: HTMLCanvasElement, reduced: boolean) {
    this.reduced = reduced;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
      this.ok = true;
    } catch {
      this.ok = false;
      this.renderer = undefined as unknown as THREE.WebGLRenderer;
      return;
    }
    this.renderer.setClearColor(0x05060a, 1);
    this.build();
    addEventListener("resize", this.resize);
    addEventListener("pointermove", this.onPointer, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    this.resize();
    this.loop();
  }

  private build() {
    const s = this.shared;
    const R = rng(11);
    const gauss = () => (R() + R() + R() - 1.5) / 1.5;

    // dust along the whole flight path
    const dustN = 5200;
    const dust = new Float32Array(dustN * 3);
    const zMin = END_Z - 40;
    for (let i = 0; i < dustN; i++) dust.set([gauss() * 22, gauss() * 14, zMin + R() * (60 - zMin)], i * 3);
    this.scene.add(cloud(dust, material(s, 0, [30, 90]), { color: BONE, size: 0.2, alpha: 0.6, seed: 5 }));

    // opening nebula: a tilted disc the hero looks into
    const discN = 2600;
    const disc = new Float32Array(discN * 3);
    for (let i = 0; i < discN; i++) {
      const rad = Math.pow(R(), 0.65) * 15;
      const a = rad * 0.9 + R() * Math.PI * 2 * (R() < 0.35 ? 1 : 0.12) + (i % 3) * 2.09;
      disc.set([Math.cos(a) * rad, gauss() * 0.5 * (1 + rad * 0.12), Math.sin(a) * rad - 2], i * 3);
    }
    const nebula = cloud(disc, material(s, 3, [28, 80]), { color: BLUE, size: 0.2, alpha: 1, seed: 9 });
    nebula.rotation.set(-0.35, 0, 0.25);
    this.scene.add(nebula);

    // the tunnel the experience section flies through
    const rings = 14;
    const per = 150;
    const tun = new Float32Array(rings * per * 3);
    for (let k = 0; k < rings; k++) {
      const z = 8 - k * 4;
      const rad = 4.2 + 0.5 * Math.sin(k * 0.9);
      for (let i = 0; i < per; i++) {
        const a = (i / per) * Math.PI * 2 + k * 0.4 + gauss() * 0.02;
        tun.set([Math.cos(a) * rad + gauss() * 0.05, Math.sin(a) * rad + gauss() * 0.05, z], (k * per + i) * 3);
      }
    }
    this.scene.add(cloud(tun, material(s, 0, [26, 60]), { color: BLUE, size: 0.2, alpha: 0.9, seed: 13 }));

    // one constellation per project
    tour.forEach((p, i) => {
      const shape = makeShape(p.shape, 100 + i);
      const color = new THREE.Color(categoryById(p.category).color);
      const mat = material(s, p.motion, [34, 70]);
      const pts = cloud(shape.pos, mat, { color, size: 0.22, alpha: 1, mask: shape.mask, seed: 200 + i });
      pts.position.set(CX, clusterY(i), clusterZ(i));
      pts.scale.setScalar(1.3);
      // shapes laid out flat (in the xz plane) are tilted toward the camera so they don't show edge-on
      pts.rotation.order = "YXZ";
      pts.rotation.x = p.shape === "vortex" || p.shape === "track" ? 1.0 : p.shape === "dome" ? 0.35 : 0;
      pts.rotation.y = p.shape === "vortex" || p.shape === "track" ? 0 : (i % 2 ? 0.28 : -0.22);
      this.scene.add(pts);
      this.clusters.push({ group: pts, mat, motion: p.motion, bright: 0.3 });
    });

    // overview: a tunnel of rings with every project floating around its walls
    const TAU = Math.PI * 2;
    const ringCount = 15;
    const perRing = 300;
    const ovRings = new Float32Array(ringCount * perRing * 3);
    for (let k = 0; k < ringCount; k++) {
      const z = Z_OV + 14 - k * 5;
      const rad = 9.5 + 0.5 * (k % 2);
      for (let i = 0; i < perRing; i++) {
        const a = (i / perRing) * TAU;
        ovRings.set([Math.cos(a) * rad, Math.sin(a) * rad, z + gauss() * 0.03], (k * perRing + i) * 3);
      }
    }
    this.scene.add(cloud(ovRings, material(s, 0, [60, 140]), { color: BLUE, size: 0.17, alpha: 0.9, seed: 31 }));

    const streakCount = 90;
    const perStreak = 10;
    const streaks = new Float32Array(streakCount * perStreak * 3);
    for (let k = 0; k < streakCount; k++) {
      const a = R() * TAU;
      const z = Z_OV + 14 - R() * 75;
      const r0 = 3 + R() * 2;
      for (let j = 0; j < perStreak; j++) {
        const r = r0 + (9.5 - r0) * (j / (perStreak - 1));
        streaks.set([Math.cos(a) * r, Math.sin(a) * r, z], (k * perStreak + j) * 3);
      }
    }
    this.scene.add(cloud(streaks, material(s, 0, [60, 140]), { color: BONE, size: 0.1, alpha: 0.5, seed: 33 }));

    projects.forEach((p, i) => {
      const shape = makeShape(p.shape, 300 + i);
      // thinned to two thirds so sixteen more shapes stay cheap
      const keep: number[] = [];
      for (let k = 0; k < PARTICLES; k++) if (k % 3 !== 0) keep.push(k);
      const pos = new Float32Array(keep.length * 3);
      const mask = new Float32Array(keep.length);
      keep.forEach((k, j) => {
        pos[j * 3] = shape.pos[k * 3]!;
        pos[j * 3 + 1] = shape.pos[k * 3 + 1]!;
        pos[j * 3 + 2] = shape.pos[k * 3 + 2]!;
        mask[j] = shape.mask[k]!;
      });
      const color = new THREE.Color(categoryById(p.category).color);
      const mat = material(s, p.motion, [60, 140]);
      const pts = cloud(pos, mat, { color, size: 0.2, alpha: 1, mask, seed: 400 + i });
      const angle = i * 2.399963 + 0.4; // golden angle, so neighbours in the list are not neighbours on the wall
      const wall = 5.4 + (i % 3) * 1.1;
      const z = Z_OV + 6 - (i / (NA - 1)) * 38 + Math.sin(i * 2.1) * 2;
      pts.position.set(Math.cos(angle) * wall, Math.sin(angle) * wall * 0.8, z);
      const base = 0.85 + (i % 4) * 0.1;
      pts.scale.setScalar(base);
      pts.rotation.order = "YXZ";
      const flat = p.shape === "vortex" || p.shape === "track";
      pts.rotation.set(flat ? 1.0 : ((i * 37) % 10) / 20 - 0.25, flat ? 0 : ((i * 53) % 10) / 6 - 0.8, 0);
      pts.visible = false;
      this.scene.add(pts);
      this.overview.push({ group: pts, mat, base, spin: (i % 2 ? 1 : -1) * (0.1 + 0.02 * (i % 5)), radius: 3.4, hover: 0, bright: 0 });
    });

    // five slots, staggered: the oldest is about to leave and the newest has just arrived
    const interval = OV_LIFE / OV_VISIBLE;
    for (let j = 0; j < OV_VISIBLE; j++) {
      this.ovSlots.push({
        proj: j,
        spawn: -(OV_VISIBLE - 1 - j) * interval,
        angle: j * 2.399963 + 0.4,
        wall: 4.8 + (j % 3) * 0.9,
      });
    }

    // the closing ring
    const ringN = 2200;
    const ring = new Float32Array(ringN * 3);
    for (let i = 0; i < ringN; i++) {
      const a = R() * Math.PI * 2;
      const streak = i % 5 === 0;
      const rad = streak ? 1.5 + R() * 8 : 5 + gauss() * 0.35;
      ring.set([Math.cos(a) * rad, Math.sin(a) * rad, gauss() * (streak ? 0.05 : 0.3)], i * 3);
    }
    this.endRing = cloud(ring, material(s, 0, [40, 90]), { color: BONE, size: 0.2, alpha: 1, seed: 17 });
    this.endRing.position.set(0, 0, END_Z);
    this.scene.add(this.endRing);
  }

  // ---- inputs from the page -------------------------------------------------------------
  /** Which section the viewport is in, and how far through it (0 to 1). */
  setPosition(section: number, local: number) {
    this.section = section;
    this.local = Math.min(1, Math.max(0, local));
  }
  setActiveProject(i: number) {
    this.active = i;
  }
  /** Fires the opening ring of light. */
  enter() {
    this.entered = true;
    this.pulseT = 0;
  }
  get projectCount() {
    return N;
  }
  /** Which overview shape (if any) is highlighted. */
  setHover(i: number) {
    this.hover = i;
  }
  /** Where project i is in its trip through the tunnel, or null if it is not one of the five on show. */
  private ovInfo(i: number) {
    const slot = this.ovSlots.find((sl) => sl.proj === i);
    if (!slot) return null;
    const a = Math.min(1, Math.max(0, (this.ovClock - slot.spawn) / OV_LIFE));
    const fade = smoothRange(0, 0.14, a) * (1 - smoothRange(0.84, 1, a));
    return { slot, a, fade };
  }
  /** Screen position and apparent size of overview shape i, for labels and hit testing. */
  overviewScreen(i: number): Target & { depth: number; fade: number } {
    const o = this.overview[i]!;
    const info = this.ovInfo(i);
    const cam = this.camera;
    const c = o.group.position;
    const forward = cam.getWorldDirection(new THREE.Vector3());
    const inFront = c.clone().sub(cam.position).dot(forward) > 0.5;
    const p = c.clone().project(cam);
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const edge = c.clone().addScaledVector(right, o.radius * o.group.scale.x).project(cam);
    const { w, h } = this.size;
    return {
      x: (p.x * 0.5 + 0.5) * w,
      y: (-p.y * 0.5 + 0.5) * h,
      r: Math.hypot((edge.x - p.x) * 0.5 * w, (edge.y - p.y) * 0.5 * h),
      visible: !!info && info.fade > 0.05 && inFront && this.section === SECTION.overview,
      depth: cam.position.distanceTo(c),
      fade: info?.fade ?? 0,
    };
  }
  /** Which overview shape is at this screen position, or -1. */
  pickOverview(x: number, y: number): number {
    return closestHit(
      this.overview.map((_, i) => this.overviewScreen(i)),
      x,
      y,
    );
  }

  private onPointer = (e: PointerEvent) => {
    this.pointerTarget.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  };
  private onVisibility = () => {
    this.running = !document.hidden;
    if (this.running && !this.paused) {
      this.clock.getDelta();
      this.loop();
    } else cancelAnimationFrame(this.raf);
  };
  /** Stop drawing (the last frame stays on screen) while something opaque covers the scene, e.g. the index. */
  setPaused(paused: boolean) {
    if (!this.ok || paused === this.paused) return;
    this.paused = paused;
    cancelAnimationFrame(this.raf);
    if (!paused && this.running) {
      this.clock.getDelta(); // don't count the paused time as one huge frame
      this.loop();
    }
  }
  private resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.narrow = w / h < 0.9;
    this.camera.fov = this.narrow ? 62 : 45;
    this.size = { w, h };
    this.wide = w / h > 1.1;
    this.viewOff = -1; // re-applied each frame (it eases to zero in the overview, where the scene is centred)
    this.camera.updateProjectionMatrix();
    // on a phone the constellation shares the screen with the card, so it is drawn smaller
    for (const c of this.clusters) c.group.scale.setScalar(this.narrow ? 0.8 : 1.3);
    this.shared.uScale.value = h * dpr * 0.5;
  };

  // ---- camera ---------------------------------------------------------------------------
  private pose(): Pose {
    const sec = this.section;
    const t = this.local;
    if (sec === SECTION.projects) {
      const f = t * (N - 1);
      const i = Math.min(N - 2, Math.floor(f));
      const frac = smoothRange(0.2, 0.8, f - i); // dwell on each constellation, then travel
      const a = clusterPose(i);
      const b = clusterPose(i + 1);
      return { pos: a.pos.clone().lerp(b.pos, frac), look: a.look.clone().lerp(b.look, frac) };
    }
    if (sec === SECTION.overview) {
      // fly out of the last project and into the tunnel, then drift deeper
      const [from, to, k] =
        t < 0.6
          ? [clusterPose(N - 1), OV_POSE, smooth(t / 0.6)]
          : [OV_POSE, OV_DEEP, smooth((t - 0.6) / 0.4)];
      return { pos: from.pos.clone().lerp(to.pos, k), look: from.look.clone().lerp(to.look, k) };
    }
    const a = WAYPOINTS[sec]!;
    const b = WAYPOINTS[Math.min(sec + 1, WAYPOINTS.length - 1)]!;
    const k = smooth(t);
    return { pos: a.pos.clone().lerp(b.pos, k), look: a.look.clone().lerp(b.look, k) };
  }

  // ---- frame ----------------------------------------------------------------------------
  private loop = () => {
    if (!this.running || this.paused) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const s = this.shared;
    s.uTime.value += dt;

    if (this.pulseT >= 0) {
      this.pulseT += dt / 2.4;
      s.uPulse.value = Math.min(1, this.pulseT);
      if (this.pulseT >= 1) {
        this.pulseT = -1;
        s.uPulse.value = 0;
        this.beatOn = true; // the entry ring is done: from here the scene has a pulse
        this.beatClock = 0;
      }
    }

    // heartbeat: a lub-dub every few seconds. Its strength depends on the section (strongest on the opening and
    // closing, off during the project tour) and eases between sections instead of switching.
    if (this.beatOn && !this.reduced) {
      this.beatClock += dt;
      const gainGoal = BEAT_GAIN_BY_SECTION[this.section] ?? 0;
      this.beatGain += (gainGoal - this.beatGain) * (1 - Math.exp(-dt * 1.5));
      const ring = beatRing(this.beatClock);
      s.uBeat.value = beatEnvelope(this.beatClock) * this.beatGain;
      s.uBeatR.value = ring.r;
      s.uBeatAmp.value = ring.amp * this.beatGain;
    }

    // cursor: eased; it only nudges the camera slightly (parallax), it no longer moves any particles
    this.pointer.lerp(this.pointerTarget, 1 - Math.exp(-dt * 10));

    // the scene sits right of centre next to the text, but is centred in the overview
    {
      const sec = this.section;
      const t = this.local;
      const ovW =
        sec === SECTION.overview ? smoothRange(0, 0.5, t) : sec === SECTION.skills ? 1 - smoothRange(0, 0.6, t) : 0;
      const off = this.wide ? 0.15 * (1 - ovW) : 0;
      if (Math.abs(off - this.viewOff) > 0.001) {
        this.viewOff = off;
        const { w, h } = this.size;
        if (off > 0.0005) this.camera.setViewOffset(w, h, -w * off, 0, w, h);
        else this.camera.clearViewOffset();
        this.camera.updateProjectionMatrix();
      }
    }

    const target = this.pose();
    const k = this.reduced ? 1 : 1 - Math.exp(-dt * 4.5);
    this.smoothPos.lerp(target.pos, k);
    this.smoothLook.lerp(target.look, k);
    const cam = this.camera;
    cam.position.copy(this.smoothPos);
    if (!this.reduced && this.entered) {
      cam.position.x += this.pointer.x * 0.5 * (Math.abs(this.pointer.x) < 2 ? 1 : 0);
      cam.position.y += this.pointer.y * 0.3 * (Math.abs(this.pointer.y) < 2 ? 1 : 0);
    }
    const look = this.smoothLook.clone();
    // On a phone, keep the shape above the card. Eased, so entering the tour doesn't snap the camera.
    const dropGoal = this.narrow && this.section === SECTION.projects ? 1.6 : 0;
    this.lookDrop += (dropGoal - this.lookDrop) * (this.reduced ? 1 : 1 - Math.exp(-dt * 3));
    look.y -= this.lookDrop;
    cam.lookAt(look);

    // constellations: the active one glows, the rest dim; slow spin where the shape is meant to be still
    this.clusters.forEach((c, i) => {
      const goal = this.section === SECTION.projects && i === this.active ? 1 : this.section === SECTION.projects ? 0.35 : 0.5;
      c.bright += (goal - c.bright) * (1 - Math.exp(-dt * 4));
      c.mat.uniforms.uBright!.value = c.bright;
      if (!this.reduced && c.motion !== 1) c.group.rotation.y += dt * (c.motion === 3 ? 0.03 : 0.12);
    });
    if (!this.reduced) this.endRing.rotation.z += dt * 0.08;

    // overview shapes: five at a time drift toward the camera along the tunnel and fade out as new ones
    // arrive from the far end. Everything freezes while one is hovered, so it is easy to click.
    const showing = this.section === SECTION.overview || this.section === SECTION.skills;
    if (showing) {
      this.ovClock += dt * (this.hover >= 0 ? 0 : 1);
      for (const slot of this.ovSlots) {
        if ((this.ovClock - slot.spawn) / OV_LIFE >= 1) {
          slot.proj = this.ovNext % NA;
          this.ovNext++;
          slot.spawn += OV_LIFE;
          slot.angle = this.ovCounter * 2.399963 + 0.4; // golden angle: successive projects land far apart
          slot.wall = 4.8 + (this.ovCounter % 3) * 0.9;
          this.ovCounter++;
        }
      }
    }
    this.overview.forEach((o, i) => {
      const info = showing ? this.ovInfo(i) : null;
      o.group.visible = !!info;
      if (!info) return;
      const aPos = this.reduced ? 0.5 : info.a; // reduced motion: they fade in place instead of travelling
      const ang = info.slot.angle + aPos * 0.3;
      o.group.position.set(
        Math.cos(ang) * info.slot.wall,
        Math.sin(ang) * info.slot.wall * 0.8,
        Z_OV - 34 + aPos * 43,
      );
      o.hover += ((this.hover === i ? 1 : 0) - o.hover) * (1 - Math.exp(-dt * 8));
      const goal = this.hover === -1 ? 0.95 : this.hover === i ? 1.9 : 0.55;
      o.bright += (goal - o.bright) * (1 - Math.exp(-dt * 4));
      o.mat.uniforms.uBright!.value = o.bright * info.fade;
      o.group.scale.setScalar(o.base * (1 + 0.2 * o.hover));
      if (!this.reduced) o.group.rotation.y += dt * o.spin;
    });

    this.renderer.render(this.scene, this.camera);
  };
}

export { PARTICLES };
