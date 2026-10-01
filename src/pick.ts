export interface Target {
  /** Screen position of the shape's centre, in px. */
  x: number;
  y: number;
  /** Apparent radius of the shape on screen, in px. */
  r: number;
  /** False when the shape is behind the camera or too far away to click. */
  visible: boolean;
}

/**
 * Which shape is under the pointer? A shape is hit when the pointer is within its apparent radius, but
 * never less than `minR` px so small, distant shapes stay easy to hit. If several overlap, the one whose
 * centre is closest (relative to its size) wins.
 */
export function closestHit(targets: Target[], px: number, py: number, minR = 34): number {
  let best = -1;
  let bestScore = Infinity;
  targets.forEach((t, i) => {
    if (!t.visible) return;
    const reach = Math.max(t.r, minR);
    const d = Math.hypot(t.x - px, t.y - py);
    if (d > reach) return;
    const score = d / reach;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
