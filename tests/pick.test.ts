import assert from "node:assert/strict";
import { test } from "node:test";
import { closestHit, type Target } from "../src/pick.ts";

const t = (x: number, y: number, r: number, visible = true): Target => ({ x, y, r, visible });

test("a pointer inside a shape's radius hits it; outside misses", () => {
  const targets = [t(100, 100, 50), t(400, 300, 50)];
  assert.equal(closestHit(targets, 120, 110), 0);
  assert.equal(closestHit(targets, 400, 340), 1);
  assert.equal(closestHit(targets, 250, 200), -1);
});

test("small distant shapes still get a minimum click radius", () => {
  const targets = [t(200, 200, 6)];
  assert.equal(closestHit(targets, 225, 200, 34), 0, "25 px away is inside the 34 px minimum");
  assert.equal(closestHit(targets, 260, 200, 34), -1);
});

test("overlapping shapes: the pointer goes to the one it is nearest the centre of", () => {
  const targets = [t(100, 100, 80), t(160, 100, 80)];
  assert.equal(closestHit(targets, 120, 100), 0);
  assert.equal(closestHit(targets, 150, 100), 1);
});

test("hidden shapes are never hit", () => {
  assert.equal(closestHit([t(100, 100, 80, false)], 100, 100), -1);
});
