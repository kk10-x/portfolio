import { categories, categoryById, projects, repoUrl, tour as tourProjects, type Project } from "./data/projects.ts";
import { profile } from "./data/profile.ts";
import "./overview.css";
import "./mobile.css";
import { SECTION, Scene3D } from "./scene.ts";
import { GestureGate, easeInOutCubic, stepTarget } from "./snap.ts";

// A refresh always starts at the top, behind the opening screen. Browsers otherwise restore the old scroll
// position, which leaves the page (and the camera) stuck mid-journey behind the gate.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const N = tourProjects.length; // stops in the scroll tour
const NA = projects.length; // every project
const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
const two = (n: number) => String(n).padStart(2, "0");

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---- static content from data ---------------------------------------------------------------
$("numbers").replaceChildren(
  // the last number is the project count, which comes from GitHub, so it is worked out here rather than written down
  ...profile.stats.map((s, i, all) =>
    i === all.length - 1
      ? { value: String(NA), label: `public projects on GitHub. ${N} in the tour, all ${NA} in the overview.` }
      : s,
  ).map((s) => {
    const li = el("li");
    li.append(el("span", "v", s.value), el("span", "l", s.label));
    return li;
  }),
);
$("exp-list").replaceChildren(
  ...profile.experience.map((x) => {
    const d = el("div", "exp");
    d.append(
      el("p", "when", `${x.period} · ${x.place}`),
      el("h3", undefined, x.company),
      el("p", "role", x.role),
      el("p", undefined, x.summary),
    );
    return d;
  }),
);
$("skills-list").replaceChildren(...profile.skills.map((s) => el("li", undefined, s)));
$("edu").textContent = profile.education;
$("contact-line").textContent = profile.contactLine;
$<HTMLAnchorElement>("mail").href = `mailto:${profile.email}`;
$<HTMLAnchorElement>("gh").href = profile.github;
$<HTMLAnchorElement>("li").href = profile.linkedin;
$("year").textContent = String(new Date().getFullYear());
$("counter-all").textContent = two(N);
$("projects").style.height = `calc(${N} * 85svh + 60svh)`;

// ---- scene ----------------------------------------------------------------------------------
const scene = new Scene3D($("stage") as HTMLCanvasElement, reduced);
if (!scene.ok) document.documentElement.classList.add("no-gl");
const hasGL = scene.ok;

// ---- scrolling ------------------------------------------------------------------------------
// With WebGL the page scrolls in discrete steps (see "stepped scrolling" below), so scrolling is always
// done by animating to a position we choose. The native wheel and touch scroll are intercepted.
const scrollY = () => window.scrollY;
let animFrame = 0;
let animating = false;
function scrollTo(y: number, immediate = false) {
  cancelAnimationFrame(animFrame);
  const from = window.scrollY;
  const dist = y - from;
  if (immediate || reduced || Math.abs(dist) < 2) {
    window.scrollTo(0, y);
    animating = false;
    return;
  }
  const dur = Math.min(2200, Math.max(900, 700 + (Math.abs(dist) / vh) * 140));
  const t0 = performance.now();
  animating = true;
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, from + dist * easeInOutCubic(t));
    if (t < 1) animFrame = requestAnimationFrame(tick);
    else animating = false;
  };
  animFrame = requestAnimationFrame(tick);
}

// ---- section geometry -----------------------------------------------------------------------
const sections = [...document.querySelectorAll<HTMLElement>("[data-sec]")];
let tops: number[] = [];
let heights: number[] = [];
let vh = innerHeight;
function measure() {
  vh = innerHeight;
  tops = sections.map((s) => s.offsetTop);
  heights = sections.map((s) => s.offsetHeight);
  queueMicrotask(buildStops);
}
addEventListener("resize", measure);
measure();
new ResizeObserver(measure).observe(document.body);

// The projects section is pinned for (height - viewport) of scrolling, so that is the range the tour must
// cover. Using any longer range means the last project is never reached while its card is still pinned.
const span = (i: number) => Math.max(heights[i]! - vh * (i === SECTION.projects ? 1 : 0.5), 1);
const projectY = (i: number) => tops[SECTION.projects]! + (i / (N - 1)) * span(SECTION.projects);

// ---- stepped scrolling -----------------------------------------------------------------------
// The page has a fixed list of stops: the hero, each statement, the numbers, each job, each project,
// the toolkit and the contact screen. One flick or wheel spin moves exactly one stop, however hard it is.
let stops: number[] = [0];
const centered = (el: HTMLElement) => Math.round(el.offsetTop + el.offsetHeight / 2 - vh / 2);
function buildStops() {
  const max = Math.max(0, document.documentElement.scrollHeight - vh);
  const ys: number[] = [0];
  document.querySelectorAll<HTMLElement>(".intro .statement").forEach((e) => ys.push(centered(e)));
  ys.push(centered($("stats")));
  const expIntro = document.querySelector<HTMLElement>(".exp-intro");
  if (expIntro) ys.push(centered(expIntro));
  document.querySelectorAll<HTMLElement>(".exp").forEach((e) => ys.push(centered(e)));
  for (let i = 0; i < N; i++) ys.push(Math.round(projectY(i)));
  ys.push(Math.round(tops[SECTION.overview]! + 0.6 * span(SECTION.overview)));
  ys.push(centered($("skills")));
  ys.push(max);
  stops = [...new Set(ys.map((y) => Math.min(max, Math.max(0, y))))].sort((a, b) => a - b);
}

// ---- project card ---------------------------------------------------------------------------
const card = $("card");
const ticksEl = $("ticks");
let shown = -1;

function fillCard(p: Project) {
  const cat = categoryById(p.category);
  card.style.setProperty("--c", hex(cat.color));
  $("card-swatch").style.setProperty("--c", hex(cat.color));
  $("card-cat").textContent = cat.label;
  $("card-title").textContent = p.title;
  $("card-blurb").textContent = p.blurb;
  $("card-tags").replaceChildren(...p.tags.map((t) => el("li", undefined, t)));
  $("card-caption").textContent = p.caption;
  $("card-caption").hidden = !p.caption; // generated entries have no caption
  const live = $<HTMLAnchorElement>("card-live");
  if (p.live) {
    live.href = p.live;
    live.hidden = false;
  } else live.hidden = true;
  $<HTMLAnchorElement>("card-src").href = repoUrl(p.repo);
}

function showProject(i: number) {
  if (i === shown) return;
  const first = shown === -1;
  shown = i;
  const apply = () => {
    fillCard(tourProjects[i]!);
    card.classList.remove("swap");
  };
  if (first || reduced) apply();
  else {
    card.classList.add("swap");
    setTimeout(() => shown === i && apply(), 180);
  }
  $("counter-now").textContent = two(i + 1);
  scene.setActiveProject(i);
  ticksEl.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
}

ticksEl.replaceChildren(
  ...tourProjects.map((p, i) => {
    const li = el("li");
    const b = el("button");
    b.type = "button";
    b.setAttribute("aria-label", `${p.title}, project ${i + 1} of ${N}`);
    b.style.setProperty("--c", hex(categoryById(p.category).color));
    b.addEventListener("click", () => scrollTo(projectY(i)));
    li.append(b);
    return li;
  }),
);

// ---- index overlay (all projects, filterable) -----------------------------------------------
const indexEl = $("index");
const grid = $("index-grid");
let filter: string = "all";

function tile(p: Project, i: number) {
  const cat = categoryById(p.category);
  const t = el("article", "tile");
  t.style.setProperty("--c", hex(cat.color));
  const catLine = el("p", "cat");
  const sw = el("span", "swatch");
  sw.style.setProperty("--c", hex(cat.color));
  catLine.append(sw, cat.label);
  const tags = el("ul", "tags");
  tags.append(...p.tags.slice(0, 3).map((x) => el("li", undefined, x)));
  const row = el("div", "row");
  // Only the first N projects are stops in the scroll tour; the rest are reached through the overview and here.
  if (hasGL && i < N) {
    const tour = el("button", undefined, "Open in tour");
    tour.type = "button";
    tour.addEventListener("click", () => {
      closeIndex();
      scrollTo(projectY(i), reduced);
    });
    row.append(tour);
  }
  if (p.live) {
    const a = el("a", undefined, "Live");
    a.href = p.live;
    a.target = "_blank";
    a.rel = "noreferrer";
    row.append(a);
  }
  const src = el("a", undefined, "Source");
  src.href = repoUrl(p.repo);
  src.target = "_blank";
  src.rel = "noreferrer";
  row.append(src);
  t.append(catLine, el("h3", undefined, p.title), el("p", undefined, p.blurb), tags, row);
  return t;
}

function renderGrid() {
  const list = projects.map((p, i) => ({ p, i })).filter(({ p }) => filter === "all" || p.category === filter);
  grid.replaceChildren(...list.map(({ p, i }) => tile(p, i)));
  $("index-count").textContent = String(list.length);
  $("filters").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filter)));
}

$("filters").replaceChildren(
  ...[{ id: "all", label: `All ${NA}` }, ...categories.map((c) => ({ id: c.id, label: `${c.label} (${projects.filter((p) => p.category === c.id).length})` }))].map((c) => {
    const b = el("button", "chip", c.label);
    b.type = "button";
    b.dataset.f = c.id;
    b.addEventListener("click", () => {
      filter = c.id;
      renderGrid();
    });
    return b;
  }),
);
renderGrid();

let lastFocus: HTMLElement | null = null;
function openIndex() {
  lastFocus = document.activeElement as HTMLElement | null;
  indexEl.hidden = false;
  document.body.classList.add("locked", "index-open");
  scene.setPaused(true); // the grid covers the scene, so stop drawing it: that is what keeps scrolling smooth
  $("close-index").focus();
}
function closeIndex() {
  if (indexEl.hidden) return;
  indexEl.hidden = true;
  document.body.classList.remove("index-open");
  scene.setPaused(false);
  if (entered) {
    document.body.classList.remove("locked");
  }
  lastFocus?.focus();
}
$("open-index").addEventListener("click", openIndex);
$("close-index").addEventListener("click", closeIndex);
indexEl.addEventListener("click", (e) => {
  if (e.target === indexEl) closeIndex();
});

// No WebGL: the same grid, inline, so every project is still there.
if (!hasGL) {
  const inline = el("div", "inline-index");
  const h = el("h2", undefined, `All ${NA} projects`);
  const g = el("div", "grid");
  g.append(...projects.map((p, i) => tile(p, i)));
  inline.append(h, g);
  $("projects").append(inline);
  $("projects").querySelector(".pin")?.remove();
}

// ---- gate ----------------------------------------------------------------------------------
let entered = !hasGL;
function enter() {
  if (entered) return;
  entered = true;
  $("gate").classList.add("gone");
  document.body.classList.remove("locked");
  scene.enter();
  const hash = decodeURIComponent(location.hash.slice(1));
  const idx = tourProjects.findIndex((p) => p.repo === hash);
  if (idx >= 0) setTimeout(() => scrollTo(projectY(idx), true), 50);
}
// anywhere on the opening screen enters, not just the button
$("gate").addEventListener("click", enter);
addEventListener("keydown", (e) => {
  if (!entered && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    enter();
  }
});
if (!hasGL) document.body.classList.remove("locked");

// ---- reveal on scroll ----------------------------------------------------------------------
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const en of entries) en.target.classList.toggle("in", en.isIntersecting);
  },
  // A shallow margin: on a phone a heading sits near the top of the screen and must still count as visible.
  { rootMargin: "-6% 0px -6% 0px", threshold: 0 },
);
document.querySelectorAll(".reveal, .statement, .exp, .numbers li").forEach((n) => revealIO.observe(n));

// ---- stepped scrolling: wheel, touch, keyboard, links ---------------------------------------------
const gate = new GestureGate(1000, 110);
const snapOn = () => hasGL && entered && indexEl.hidden;
function step(dir: 1 | -1) {
  scrollTo(stops[stepTarget(stops, window.scrollY, dir)]!);
}

addEventListener(
  "wheel",
  (e) => {
    if (!snapOn() || e.ctrlKey) return; // ctrl+wheel is browser zoom
    e.preventDefault();
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dir = gate.wheel(e.deltaY, performance.now());
    if (dir && !animating) step(dir);
  },
  { passive: false },
);

let touchY = 0;
let touchX = 0;
let touching = false;
addEventListener(
  "touchstart",
  (e) => {
    if (!snapOn()) return;
    touching = true;
    touchY = e.touches[0]!.clientY;
    touchX = e.touches[0]!.clientX;
  },
  { passive: true },
);
addEventListener(
  "touchmove",
  (e) => {
    if (snapOn()) e.preventDefault(); // no native drag scrolling; a swipe is one step
  },
  { passive: false },
);
addEventListener(
  "touchend",
  (e) => {
    if (!touching || !snapOn()) return;
    touching = false;
    const dy = touchY - e.changedTouches[0]!.clientY;
    const dx = touchX - e.changedTouches[0]!.clientX;
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) && !animating && gate.tryStep(performance.now())) {
      step(dy > 0 ? 1 : -1);
    }
  },
  { passive: true },
);

addEventListener("keydown", (e) => {
  if (!indexEl.hidden) {
    if (e.key === "Escape") closeIndex();
    return;
  }
  if (!snapOn() || e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target as HTMLElement;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
  if (e.key === " " && ["BUTTON", "A"].includes(target.tagName)) return; // space activates a focused control
  if (e.key === "Home") {
    e.preventDefault();
    scrollTo(stops[0]!);
    return;
  }
  if (e.key === "End") {
    e.preventDefault();
    scrollTo(stops[stops.length - 1]!);
    return;
  }
  const next = ["ArrowDown", "ArrowRight", "PageDown", "j"].includes(e.key) || (e.key === " " && !e.shiftKey);
  const prev = ["ArrowUp", "ArrowLeft", "PageUp", "k"].includes(e.key) || (e.key === " " && e.shiftKey);
  if (!next && !prev) return;
  e.preventDefault();
  if (!animating && gate.tryStep(performance.now())) step(next ? 1 : -1);
});

// in-page links (brand, "Get in touch") glide to the right stop instead of jumping
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    if (!hasGL) return;
    const id = a.getAttribute("href")!.slice(1);
    if (!document.getElementById(id)) return;
    e.preventDefault();
    if (!entered) return;
    scrollTo(id === "contact" ? stops[stops.length - 1]! : id === "hero" ? 0 : tops[sections.indexOf($(id))]!);
  });
});

// ---- overview: labels that follow the shapes, hover, click to open ----------------------------------
const labelsEl = $("ov-labels");
const projectUrl = (p: Project) => p.live ?? repoUrl(p.repo);
const numberWords: Record<number, string> = { 12: "Twelve", 14: "Fourteen", 15: "Fifteen", 16: "Sixteen", 17: "Seventeen", 18: "Eighteen" };
$("ov-heading").textContent = `${numberWords[NA] ?? NA} systems.`;
const labels: HTMLAnchorElement[] = projects.map((p, i) => {
  const a = el("a", "ov-label");
  a.href = projectUrl(p);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.title = p.live ? `${p.title}: open the live demo` : `${p.title}: open the source on GitHub`;
  const sw = el("span", "swatch");
  sw.style.setProperty("--c", hex(categoryById(p.category).color));
  a.append(sw, el("span", undefined, p.title), el("span", "go", p.live ? "↗" : "↗ source"));
  a.addEventListener("mouseenter", () => setHover(i));
  a.addEventListener("mouseleave", () => setHover(-1));
  a.addEventListener("focus", () => setHover(i));
  a.addEventListener("blur", () => setHover(-1));
  labelsEl.append(a);
  return a;
});
let hover = -1;
let currentSection = 0;
function setHover(i: number) {
  if (i === hover) return;
  hover = i;
  scene.setHover(i);
  labels.forEach((l, k) => l.classList.toggle("hot", k === i));
  document.body.classList.toggle("ov-hot", i >= 0);
}
const inOverview = () => hasGL && entered && currentSection === SECTION.overview && indexEl.hidden;
addEventListener(
  "pointermove",
  (e) => {
    if (!inOverview()) {
      if (hover >= 0) setHover(-1);
      return;
    }
    // while the pointer is over a label, that label already owns the hover
    if ((e.target as HTMLElement).closest?.(".ov-label")) return;
    setHover(scene.pickOverview(e.clientX, e.clientY));
  },
  { passive: true },
);
addEventListener("click", (e) => {
  if (!inOverview() || (e.target as HTMLElement).closest("a, button, .index")) return;
  const i = scene.pickOverview(e.clientX, e.clientY); // click position, so a tap on a phone works too
  if (i >= 0) window.open(projectUrl(projects[i]!), "_blank", "noopener,noreferrer");
});

function updateOverview(local: number) {
  const on = currentSection === SECTION.overview;
  document.body.classList.toggle("ov-on", on);
  if (!on) {
    if (hover >= 0) setHover(-1);
    return;
  }
  const fade = Math.min(1, Math.max(0, (local - 0.3) / 0.35));
  document.body.style.setProperty("--ov", String(fade));
  labels.forEach((l, i) => {
    const t = scene.overviewScreen(i);
    const depthFade = Math.max(0.3, Math.min(1, 1.15 - (t.depth - 14) / 45));
    l.style.opacity = String(fade * depthFade * t.fade);
    l.style.pointerEvents = fade > 0.6 && t.fade > 0.4 ? "auto" : "none";
    // keep the whole label on screen, even when its shape is near (or past) the edge
    const half = (l.offsetWidth || 120) / 2 + 8;
    const x = Math.min(innerWidth - half, Math.max(half, t.x));
    const y = Math.min(innerHeight - 32, Math.max(64, t.y + Math.min(t.r, 90) * 0.55));
    l.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, 0)`;
    l.style.display = t.visible ? "inline-flex" : "none";
  });
}

// ---- frame loop: scroll position -> scene + card ----------------------------------------------
let hashTimer = 0;
function frame() {
  requestAnimationFrame(frame);
  if (!hasGL || !indexEl.hidden) return; // nothing to update while the index covers the page
  // Until the site is entered the page is pinned to the top, even if the browser restores a scroll
  // position after load (back/forward cache, late restoration).
  if (!entered && window.scrollY !== 0) window.scrollTo(0, 0);
  const y = scrollY();
  let sec = 0;
  for (let i = sections.length - 1; i >= 0; i--) {
    if (y >= tops[i]! - 1) {
      sec = i;
      break;
    }
  }
  const local = (y - tops[sec]!) / span(sec);
  scene.setPosition(sec, local);
  currentSection = sec;
  updateOverview(Math.min(1, Math.max(0, local)));

  const inProjects = sec === SECTION.projects;
  card.parentElement!.classList.toggle("off", !inProjects); // fades, instead of popping in and out
  if (inProjects) {
    const idx = Math.min(N - 1, Math.max(0, Math.round(Math.min(1, Math.max(0, local)) * (N - 1))));
    showProject(idx);
    clearTimeout(hashTimer);
    hashTimer = window.setTimeout(() => history.replaceState(null, "", `#${tourProjects[idx]!.repo}`), 300);
  } else if (location.hash && entered) {
    // outside the tour the address shouldn't keep pointing at a project
    clearTimeout(hashTimer);
    hashTimer = window.setTimeout(() => history.replaceState(null, "", location.pathname + location.search), 300);
  }
}
showProject(0);
requestAnimationFrame(frame);
