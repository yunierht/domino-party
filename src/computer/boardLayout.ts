import type { End, Tile } from './engine';

export interface Point { x: number; y: number }
/** Size once against the actual connected chain, not the legacy grid estimate. */
export function chainMetrics(width: number, height: number) {
  const half = 36;
  const tileWidth = half * 2 + 5, tileHeight = half + 4;
  return { width, height, columns: 7, half, tileWidth, tileHeight, stepX: tileWidth, stepY: tileWidth };
}
/** Fit the visible chain around a fixed opening center. Never pan or recenter it. */
export function boardMetrics(width: number, availableHeight?: number, range = { left: -28, right: 28 }) {
  const columns = 7;
  let maxColumn = 0, maxRow = 0;
  for (let offset = range.left; offset <= range.right; offset++) {
    const index = 3 + Math.abs(offset);
    const row = Math.floor(index / columns);
    const column = row % 2 ? columns - 1 - index % columns : index % columns;
    maxColumn = Math.max(maxColumn, Math.abs(column - 3));
    maxRow = Math.max(maxRow, row);
  }
  const half = Math.max(2, Math.min(36, (width / 2 - 8.5 - maxColumn * 10) / (2 * maxColumn + 1),
    availableHeight ? (availableHeight / 2 - 8.5 - maxRow * 10) / (2 * maxRow + 1) : 28));
  const tileWidth = half * 2 + 5;
  const tileHeight = half + 4;
  const stepX = tileWidth;
  const stepY = tileWidth;
  return { width, height: availableHeight ?? ((maxRow * 2 + 1) * stepY + 12), columns, half, tileWidth, tileHeight, stepX, stepY };
}
export function slot(offset: number, metrics: ReturnType<typeof boardMetrics>) {
  const { columns, stepX, stepY, width, height } = metrics;
  const index = Math.floor(columns / 2) + Math.abs(offset);
  const row = Math.floor(index / columns);
  const column = row % 2 ? columns - 1 - index % columns : index % columns;
  const direction = offset < 0 ? -1 : 1;
  return {
    x: width / 2 + direction * (column - Math.floor(columns / 2)) * stepX,
    y: height / 2 + direction * row * stepY,
    flipped: row % 2 === 1,
  };
}
export function endpointOffsets(board: Tile[], openingId: string | null) {
  if (!board.length) return { left: 0, right: 0 };
  const anchor = Math.max(0, board.findIndex(tile => tile.id === openingId));
  return { left: -anchor - 1, right: board.length - anchor };
}
/** Oblique table projection: far tiles recede, opening stays exactly centered. */
export function perspectiveSlot(offset: number, metrics: ReturnType<typeof boardMetrics>) {
  const p = slot(offset, metrics);
  const depth = p.y / metrics.height;
  const scale = 0.76 + depth * 0.24;
  return { ...p, x: metrics.width / 2 + (p.x - metrics.width / 2) * scale,
    y: metrics.height / 2 + (p.y - metrics.height / 2) * 0.86, scale };
}
/** Edge-connected snake: one vertical step separates horizontal runs. */
export function chainSlot(offset: number, metrics: ReturnType<typeof boardMetrics>, board: Tile[], openingId: string | null) {
  const anchor = Math.max(0, board.findIndex(t => t.id === openingId));
  const shape = (n: number, alongY: boolean) => {
    const t = board[anchor + n];
    const double = !!t && t.a === t.b;
    const vertical = double ? !alongY : alongY;
    return { vertical, double, width: vertical ? metrics.tileHeight : metrics.tileWidth,
      height: vertical ? metrics.tileWidth : metrics.tileHeight };
  };
  const points = new Map<number, { x: number; y: number; width: number; height: number; vertical: boolean; double: boolean; flipped: boolean }>();
  points.set(0, { x: 0, y: 0, ...shape(0, false), flipped: false });
  const ends = endpointOffsets(board, openingId);
  for (const sign of [-1, 1]) {
    const limit = Math.max(Math.abs(sign < 0 ? ends.left : ends.right), Math.sign(offset) === sign ? Math.abs(offset) : 0);
    let routeIndex = 1, previousAlongY = false, previousDirection = sign;
    for (let i = 1; i <= limit; i++) {
      const segment = Math.floor((routeIndex - 3) / 5);
      const alongY = routeIndex > 2 && (routeIndex - 3) % 5 === 0;
      const direction = alongY ? sign : sign * (routeIndex <= 2 || segment % 2 === 1 ? 1 : -1);
      const previous = points.get((i - 1) * sign)!;
      const current = shape(i * sign, alongY);
      // At a corner, meet the outgoing half of a regular tile, not its middle.
      // A double remains the only centered crosspiece.
      const turning = i > 1 && alongY !== previousAlongY && !previous.double;
      const cornerX = turning && alongY ? previousDirection * (previous.width - metrics.tileHeight) / 2 : 0;
      const cornerY = turning && !alongY ? previousDirection * (previous.height - metrics.tileHeight) / 2 : 0;
      points.set(i * sign, { ...current,
        x: previous.x + cornerX + (alongY ? 0 : direction * (previous.width + current.width) / 2),
        y: previous.y + cornerY + (alongY ? direction * (previous.height + current.height) / 2 : 0),
        flipped: direction !== sign,
      });
      // A crosswise double is not the vertical connecting tile.
      if (!(alongY && current.double)) routeIndex++;
      previousAlongY = alongY;
      previousDirection = direction;
    }
  }
  let extentX = 1, extentY = 1;
  for (const p of points.values()) {
    extentX = Math.max(extentX, Math.abs(p.x) + p.width / 2);
    extentY = Math.max(extentY, Math.abs(p.y) + p.height / 2);
  }
  const scale = Math.min(0.96, (metrics.width / 2 - 5) / extentX, (metrics.height / 2 - 5) / (extentY * 0.86));
  const p = points.get(offset)!;
  return { ...p, x: metrics.width / 2 + p.x * scale, y: metrics.height / 2 + p.y * scale * 0.86, scale };
}
/** Drop only inside an available end's highlighted slot; never auto-pick another end. */
export function resolveDrop(point: Point, targets: { end: End; point: Point }[], metrics: ReturnType<typeof boardMetrics>): End | null {
  const hits = targets.filter(target => Math.abs(point.x - target.point.x) <= metrics.stepX / 2 &&
    Math.abs(point.y - target.point.y) <= metrics.stepY / 2);
  hits.sort((a, b) => Math.hypot(point.x - a.point.x, point.y - a.point.y) - Math.hypot(point.x - b.point.x, point.y - b.point.y));
  return hits[0]?.end ?? null;
}
