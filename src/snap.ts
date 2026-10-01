/** Index of the stop closest to scroll position `y`. */
export function nearestStop(stops: number[], y: number): number {
  let best = 0;
  for (let i = 1; i < stops.length; i++) {
    if (Math.abs(stops[i]! - y) < Math.abs(stops[best]! - y)) best = i;
  }
  return best;
}

/**
 * The stop to move to from `current` in direction `dir` (+1 or -1), clamped to the list.
 * If the page was left between stops (for example by dragging the scrollbar), "next" is the first
 * stop strictly ahead of where it is, not the nearest one.
 */
export function stepTarget(stops: number[], y: number, dir: 1 | -1, current = nearestStop(stops, y)): number {
  const near = stops[current]!;
  if (Math.abs(near - y) > 2) {
    if (dir > 0) {
      const i = stops.findIndex((s) => s > y + 2);
      return i === -1 ? stops.length - 1 : i;
    }
    for (let i = stops.length - 1; i >= 0; i--) if (stops[i]! < y - 2) return i;
    return 0;
  }
  return Math.min(stops.length - 1, Math.max(0, current + dir));
}

/**
 * Turns a noisy stream of wheel events into discrete steps.
 *
 * One physical flick or wheel spin fires many events (a trackpad keeps sending them for a second or
 * more as it coasts). The gate lets exactly one of them through, then ignores the rest of that stream
 * until there has been a pause. A new flick after a pause steps again.
 */
export class GestureGate {
  private last = -Infinity;
  private busyUntil = 0;
  private stream = false;

  constructor(
    /** How long a step takes; wheel input during this time is swallowed. */
    private cooldownMs = 1000,
    /** A pause this long between events means a new gesture has started. */
    private gapMs = 110,
    /** Ignore tiny deltas (trackpad noise). */
    private minDelta = 4,
  ) {}

  /** Returns +1 or -1 if this event should start a step, or 0 if it should be ignored. */
  wheel(deltaY: number, now: number): 0 | 1 | -1 {
    if (now - this.last > this.gapMs) this.stream = false;
    this.last = now;
    if (Math.abs(deltaY) < this.minDelta) return 0;
    if (now < this.busyUntil || this.stream) return 0;
    this.stream = true;
    this.busyUntil = now + this.cooldownMs;
    return deltaY > 0 ? 1 : -1;
  }

  /** For touch and keyboard: a step that respects the same cooldown. */
  tryStep(now: number): boolean {
    if (now < this.busyUntil) return false;
    this.busyUntil = now + this.cooldownMs;
    this.stream = true;
    this.last = now;
    return true;
  }
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
