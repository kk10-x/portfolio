import assert from "node:assert/strict";
import { test } from "node:test";
import { BEAT_GAIN_BY_SECTION, BEAT_PERIOD, beatEnvelope, beatRing } from "../src/beat.ts";
import { SECTION } from "../src/scene.ts";

test("the beat is a lub-dub: a strong pulse, a softer one 0.3 s later, then rest", () => {
  assert.ok(beatEnvelope(0) > 0.95, "lub");
  const dub = beatEnvelope(0.3);
  assert.ok(dub > 0.55 && dub < 0.75, `dub is softer than lub, got ${dub}`);
  assert.ok(beatEnvelope(0.15) < beatEnvelope(0), "dips between the two");
  assert.ok(beatEnvelope(1.5) < 0.01, "rests in between beats");
  assert.ok(beatEnvelope(BEAT_PERIOD - 0.5) < 0.01);
});

test("the beat repeats exactly every period and stays within 0 to 1", () => {
  for (const t of [0, 0.1, 0.3, 0.9, 2.2]) {
    assert.ok(Math.abs(beatEnvelope(t) - beatEnvelope(t + BEAT_PERIOD)) < 1e-9);
    assert.ok(Math.abs(beatEnvelope(t) - beatEnvelope(t + 5 * BEAT_PERIOD)) < 1e-9);
  }
  for (let t = 0; t < 20; t += 0.013) {
    const e = beatEnvelope(t);
    assert.ok(e >= 0 && e <= 1, `out of range at ${t}: ${e}`);
  }
});

test("the ring starts at the centre at full strength, grows outward, fades out, then waits for the next beat", () => {
  assert.deepEqual(beatRing(0), { r: 0, amp: 1 });
  const mid = beatRing(0.9);
  assert.ok(mid.r > 0.5 && mid.r < 1.2 && mid.amp > 0.3 && mid.amp < 0.7);
  assert.equal(beatRing(2.5).amp, 0);
  assert.ok(beatRing(0.2).r < beatRing(1.2).r);
});

test("the heartbeat is strongest on the opening and the closing, and off during the project tour", () => {
  assert.equal(BEAT_GAIN_BY_SECTION.length, Object.keys(SECTION).length, "one gain per section");
  assert.equal(BEAT_GAIN_BY_SECTION[SECTION.hero], 1);
  assert.equal(BEAT_GAIN_BY_SECTION[SECTION.contact], 1);
  assert.equal(BEAT_GAIN_BY_SECTION[SECTION.projects], 0);
  assert.ok(BEAT_GAIN_BY_SECTION.every((g) => g >= 0 && g <= 1));
});
