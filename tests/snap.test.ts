import assert from "node:assert/strict";
import { test } from "node:test";
import { GestureGate, nearestStop, stepTarget } from "../src/snap.ts";

const stops = [0, 800, 1600, 2400, 3200];

test("nearestStop picks the closest stop", () => {
  assert.equal(nearestStop(stops, 0), 0);
  assert.equal(nearestStop(stops, 390), 0);
  assert.equal(nearestStop(stops, 410), 1);
  assert.equal(nearestStop(stops, 99999), 4);
});

test("stepTarget moves exactly one stop from a stop, and clamps at both ends", () => {
  assert.equal(stepTarget(stops, 800, 1), 2);
  assert.equal(stepTarget(stops, 800, -1), 0);
  assert.equal(stepTarget(stops, 0, -1), 0);
  assert.equal(stepTarget(stops, 3200, 1), 4);
});

test("stepTarget from between stops goes to the next stop in that direction, not the nearest", () => {
  // 1500 is closest to 1600, but "up" must still move to 800, and "down" to 1600.
  assert.equal(stepTarget(stops, 1500, -1), 1);
  assert.equal(stepTarget(stops, 1500, 1), 2);
  assert.equal(stepTarget(stops, 900, 1), 2);
  assert.equal(stepTarget(stops, 900, -1), 1);
});

test("a fast spin of 60 wheel events steps exactly once", () => {
  const g = new GestureGate(1000, 110);
  let steps = 0;
  for (let i = 0; i < 60; i++) if (g.wheel(100, i * 16) !== 0) steps++; // 60 events over ~1 second
  assert.equal(steps, 1);
});

test("trackpad inertia that outlasts the cooldown does not trigger a second step", () => {
  const g = new GestureGate(1000, 110);
  let steps = 0;
  // 3 seconds of coasting, a decaying delta, an event every 16 ms
  for (let t = 0, d = 120; t < 3000; t += 16, d = Math.max(5, d * 0.985)) if (g.wheel(d, t) !== 0) steps++;
  assert.equal(steps, 1);
});

test("a new flick after a pause steps again, in either direction", () => {
  const g = new GestureGate(1000, 110);
  assert.equal(g.wheel(120, 0), 1);
  assert.equal(g.wheel(120, 16), 0);
  assert.equal(g.wheel(-120, 1500), -1, "after the cooldown and a pause, scrolling up steps back");
  assert.equal(g.wheel(120, 3000), 1);
});

test("slow, separate wheel notches each step once the previous step has finished", () => {
  const g = new GestureGate(1000, 110);
  assert.equal(g.wheel(100, 0), 1);
  assert.equal(g.wheel(100, 400), 0, "mid-step: swallowed");
  assert.equal(g.wheel(100, 1200), 1, "step finished and there was a pause");
});

test("tiny deltas are ignored", () => {
  const g = new GestureGate(1000, 110, 4);
  assert.equal(g.wheel(1, 0), 0);
  assert.equal(g.wheel(3, 500), 0);
});

test("tryStep (touch, keyboard) respects the cooldown", () => {
  const g = new GestureGate(1000, 110);
  assert.equal(g.tryStep(0), true);
  assert.equal(g.tryStep(500), false);
  assert.equal(g.tryStep(1001), true);
});
