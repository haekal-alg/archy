// Edge path geometry utilities for manual waypoint routing

export interface Waypoint {
  x: number;
  y: number;
}

export type RoutingMode = 'auto' | 'manual';

interface Point {
  x: number;
  y: number;
}

// ─── Path Builders ───────────────────────────────────────────────

/**
 * Build a straight polyline path: source → waypoints → target
 */
export function buildPolylinePath(
  source: Point,
  target: Point,
  waypoints: Waypoint[]
): string {
  const allPoints = [source, ...waypoints, target];
  return allPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

/**
 * Build an orthogonal (smooth-step) path through waypoints with rounded corners.
 * Each waypoint acts as a corner; segments between consecutive points
 * are drawn as right-angle steps with optional border radius.
 */
export function buildSmoothStepManualPath(
  source: Point,
  target: Point,
  waypoints: Waypoint[],
  borderRadius: number = 5
): string {
  const allPoints = [source, ...waypoints, target];
  if (allPoints.length < 2) return '';
  if (allPoints.length === 2) {
    return `M ${allPoints[0].x} ${allPoints[0].y} L ${allPoints[1].x} ${allPoints[1].y}`;
  }

  let d = `M ${allPoints[0].x} ${allPoints[0].y}`;

  for (let i = 1; i < allPoints.length - 1; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];
    const next = allPoints[i + 1];

    // Distances to previous and next points
    const dPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dNext = Math.hypot(next.x - curr.x, next.y - curr.y);

    // Limit radius to half the shortest adjacent segment
    const r = Math.min(borderRadius, dPrev / 2, dNext / 2);

    if (r > 0.5) {
      // Direction vectors
      const fromPrevX = (curr.x - prev.x) / dPrev;
      const fromPrevY = (curr.y - prev.y) / dPrev;
      const toNextX = (next.x - curr.x) / dNext;
      const toNextY = (next.y - curr.y) / dNext;

      // Arc start/end points
      const arcStartX = curr.x - fromPrevX * r;
      const arcStartY = curr.y - fromPrevY * r;
      const arcEndX = curr.x + toNextX * r;
      const arcEndY = curr.y + toNextY * r;

      // Determine sweep direction using cross product
      const cross = fromPrevX * toNextY - fromPrevY * toNextX;
      const sweep = cross > 0 ? 1 : 0;

      d += ` L ${arcStartX} ${arcStartY}`;
      d += ` A ${r} ${r} 0 0 ${sweep} ${arcEndX} ${arcEndY}`;
    } else {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }

  const last = allPoints[allPoints.length - 1];
  d += ` L ${last.x} ${last.y}`;

  return d;
}

/**
 * Build a smooth bezier curve through waypoints using Catmull-Rom → cubic bezier conversion.
 */
export function buildBezierManualPath(
  source: Point,
  target: Point,
  waypoints: Waypoint[],
  tension: number = 0.3
): string {
  const allPoints = [source, ...waypoints, target];
  if (allPoints.length < 2) return '';
  if (allPoints.length === 2) {
    // Simple quadratic bezier for 2 points
    const midX = (allPoints[0].x + allPoints[1].x) / 2;
    const midY = (allPoints[0].y + allPoints[1].y) / 2;
    return `M ${allPoints[0].x} ${allPoints[0].y} Q ${midX} ${midY} ${allPoints[1].x} ${allPoints[1].y}`;
  }

  let d = `M ${allPoints[0].x} ${allPoints[0].y}`;

  // Catmull-Rom to cubic bezier conversion
  // For each segment [i, i+1], we need points [i-1, i, i+1, i+2]
  for (let i = 0; i < allPoints.length - 1; i++) {
    const p0 = allPoints[Math.max(0, i - 1)];
    const p1 = allPoints[i];
    const p2 = allPoints[i + 1];
    const p3 = allPoints[Math.min(allPoints.length - 1, i + 2)];

    // Catmull-Rom to cubic bezier control points
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

// ─── Label Position ──────────────────────────────────────────────

/**
 * Compute label position at the midpoint along the total polyline length.
 */
export function computeLabelPosition(
  source: Point,
  target: Point,
  waypoints: Waypoint[]
): Point {
  const allPoints = [source, ...waypoints, target];

  // Compute cumulative segment lengths
  const lengths: number[] = [];
  let totalLength = 0;
  for (let i = 1; i < allPoints.length; i++) {
    const len = Math.hypot(
      allPoints[i].x - allPoints[i - 1].x,
      allPoints[i].y - allPoints[i - 1].y
    );
    lengths.push(len);
    totalLength += len;
  }

  // Walk to the midpoint
  const halfLength = totalLength / 2;
  let accumulated = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (accumulated + lengths[i] >= halfLength) {
      const remaining = halfLength - accumulated;
      const t = lengths[i] > 0 ? remaining / lengths[i] : 0;
      return {
        x: allPoints[i].x + (allPoints[i + 1].x - allPoints[i].x) * t,
        y: allPoints[i].y + (allPoints[i + 1].y - allPoints[i].y) * t,
      };
    }
    accumulated += lengths[i];
  }

  // Fallback: midpoint between source and target
  return {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2,
  };
}

// ─── Hit Detection ───────────────────────────────────────────────

/**
 * Minimum distance from a point to a line segment.
 */
export function pointToSegmentDistance(
  point: Point,
  segA: Point,
  segB: Point
): number {
  const dx = segB.x - segA.x;
  const dy = segB.y - segA.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return Math.hypot(point.x - segA.x, point.y - segA.y);

  let t = ((point.x - segA.x) * dx + (point.y - segA.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = segA.x + t * dx;
  const projY = segA.y + t * dy;

  return Math.hypot(point.x - projX, point.y - projY);
}

/**
 * Find the closest segment to a click position.
 * Returns the segment index and the projected point on that segment.
 */
export function findClosestSegment(
  clickPos: Point,
  source: Point,
  target: Point,
  waypoints: Waypoint[]
): { segmentIndex: number; point: Point } {
  const allPoints = [source, ...waypoints, target];

  let bestDist = Infinity;
  let bestIndex = 0;
  let bestPoint: Point = clickPos;

  for (let i = 0; i < allPoints.length - 1; i++) {
    const a = allPoints[i];
    const b = allPoints[i + 1];

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((clickPos.x - a.x) * dx + (clickPos.y - a.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    const dist = Math.hypot(clickPos.x - projX, clickPos.y - projY);

    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
      bestPoint = { x: projX, y: projY };
    }
  }

  return { segmentIndex: bestIndex, point: bestPoint };
}

// ─── Grid Snap ───────────────────────────────────────────────────

/**
 * Snap a point to the nearest grid position.
 */
export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

// ─── Segment Helpers ─────────────────────────────────────────────

/**
 * Build an array of all points (source + waypoints + target) for iteration.
 */
export function getAllPoints(
  source: Point,
  target: Point,
  waypoints: Waypoint[]
): Point[] {
  return [source, ...waypoints, target];
}

/**
 * Build individual segment paths for hit detection overlays.
 * Returns one SVG path string per segment.
 */
export function buildSegmentPaths(
  source: Point,
  target: Point,
  waypoints: Waypoint[]
): string[] {
  const allPoints = [source, ...waypoints, target];
  const paths: string[] = [];
  for (let i = 0; i < allPoints.length - 1; i++) {
    paths.push(
      `M ${allPoints[i].x} ${allPoints[i].y} L ${allPoints[i + 1].x} ${allPoints[i + 1].y}`
    );
  }
  return paths;
}
