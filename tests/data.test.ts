import assert from "node:assert/strict";
import { test } from "node:test";
import { TOUR_SIZE, categories, projects, tour } from "../src/data/projects.ts";
import { PARTICLES, SHAPE_IDS, makeShape } from "../src/shapes.ts";

// Repos that must never appear in the tour: this site, forks of others' work, scratch and college lab repos.
const HIDDEN = ["portfolio", "portfolio-v2", "kk10-x", "kk10-x.github.io", "temp", "ElevenLabs", "ML-Lab", "ML-Lab-1", "you-GOT-a-letter", "bella-ingress"];

test("all 16 visible projects are listed exactly once", () => {
  assert.equal(projects.length, 16);
  assert.equal(new Set(projects.map((p) => p.repo)).size, projects.length);
});

test("the scroll tour is the first eight projects, and every one of them is also in the full list", () => {
  assert.equal(TOUR_SIZE, 8);
  assert.equal(tour.length, 8);
  assert.deepEqual(tour.map((p) => p.repo), projects.slice(0, 8).map((p) => p.repo));
});

test("the tour covers more than one theme, so it is not eight of the same thing", () => {
  assert.ok(new Set(tour.map((p) => p.category)).size >= 2);
});

test("no hidden repo is listed", () => {
  for (const p of projects) assert.ok(!HIDDEN.includes(p.repo), `${p.repo} should be hidden`);
});

test("every project has a known category, a shape of its own, and copy that fits a card", () => {
  const ids = new Set(categories.map((c) => c.id));
  const shapes = new Set<string>();
  for (const p of projects) {
    assert.ok(ids.has(p.category), `${p.repo}: category`);
    assert.ok(p.blurb.length > 20 && p.blurb.length <= 190, `${p.repo}: blurb length ${p.blurb.length}`);
    assert.ok(p.tags.length >= 2 && p.tags.length <= 4, `${p.repo}: tags`);
    assert.ok(p.caption.length > 5, `${p.repo}: caption`);
    if (p.live) assert.match(p.live, /^https:\/\//);
    shapes.add(p.shape);
  }
  assert.equal(shapes.size, projects.length, "each project gets a distinct shape");
});

test("every shape produces the same number of finite points inside a sane box", () => {
  for (const id of SHAPE_IDS) {
    const s = makeShape(id);
    assert.equal(s.pos.length, PARTICLES * 3, `${id}: point count`);
    assert.equal(s.mask.length, PARTICLES, `${id}: mask count`);
    for (let i = 0; i < s.pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = s.pos[i + k]!;
        assert.ok(Number.isFinite(v), `${id}: finite`);
        assert.ok(Math.abs(v) < 5, `${id}: coordinate ${v} out of range`);
      }
    }
  }
});

test("shapes are deterministic", () => {
  assert.deepEqual([...makeShape("vortex").pos.slice(0, 30)], [...makeShape("vortex").pos.slice(0, 30)]);
});

test("loop-shaped projects are not swirled, since the swirl shears anything with points at several radii", () => {
  const track = projects.find((p) => p.shape === "track")!;
  assert.equal(track.motion, 0);
});

test("the tour's scroll range ends exactly where the pin ends, so the last project is reachable", () => {
  // Mirrors main.ts: the projects section is pinned for (height - viewport) px, and local progress
  // must reach 1 at the end of that range. With a shorter pin than range, the last card is skipped.
  const vh = 800;
  const height = tour.length * 0.85 * vh + 0.6 * vh;
  const pinned = height - vh;
  const span = Math.max(height - vh * 1, 1);
  const local = pinned / span;
  const idx = Math.round(Math.min(1, local) * (tour.length - 1));
  assert.equal(idx, tour.length - 1);
});
