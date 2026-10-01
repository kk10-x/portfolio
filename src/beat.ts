/** Seconds between heartbeats. About 19 a minute: a resting, unhurried pulse, not a racing one. */
export const BEAT_PERIOD = 3.2;
/** How long the faint ring that rides each beat takes to cross the screen. */
const RING_SECONDS = 1.8;

const phase = (t: number) => ((t % BEAT_PERIOD) + BEAT_PERIOD) % BEAT_PERIOD;
const bump = (x: number, centre: number, width: number) => Math.exp(-(((x - centre) / width) ** 2));

/**
 * A "lub-dub": a quick strong pulse, then a softer second one 0.3 s later, then rest.
 * Returns 0 to 1.
 */
export function beatEnvelope(t: number): number {
  const p = phase(t);
  const lub = bump(p, 0, 0.1) + bump(p, BEAT_PERIOD, 0.1); // the second term makes it wrap cleanly at the period
  const dub = 0.65 * bump(p, 0.3, 0.12);
  return Math.min(1, lub + dub);
}

/** The faint ring that expands from the centre on each beat. `amp` fades from 1 to 0 as it grows. */
export function beatRing(t: number): { r: number; amp: number } {
  const p = phase(t);
  if (p >= RING_SECONDS) return { r: 0, amp: 0 };
  const k = p / RING_SECONDS;
  return { r: k * 1.7, amp: 1 - k };
}

/**
 * How strongly the heartbeat shows in each section, in page order: hero, intro, numbers, experience,
 * projects, overview, toolkit, contact. It is strongest on the opening and the closing screen, and off
 * during the project tour, where people are reading cards and the shapes already move.
 */
export const BEAT_GAIN_BY_SECTION = [1, 0.7, 0.35, 0.2, 0, 0.2, 0.4, 1];
