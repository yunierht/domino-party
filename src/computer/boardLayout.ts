import type { End, Tile } from './engine';

export interface Point { x: number; y: number }
/** Size once against the actual connected chain, not the legacy grid estimate. */
export function chainMetrics(width: number, height: number) {
  const half = 40;
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
/** Nearest legal end anywhere in the board; exact ties consistently favor left. */
export function resolveDrop(point: Point, targets: { end: End; point: Point }[], metrics: { width: number; height: number }): End | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.y < 0 || point.x > metrics.width || point.y > metrics.height) return null;
  return [...targets].sort((a, b) => {
    const distance = Math.hypot(point.x - a.point.x, point.y - a.point.y) - Math.hypot(point.x - b.point.x, point.y - b.point.y);
    return distance || (a.end === b.end ? 0 : a.end === 'left' ? -1 : 1);
  })[0]?.end ?? null;
}

/** Compare in viewport pixels so pan/zoom never change the valid drop surface. */
export function resolveScreenDrop(point: Point, targets: { end: End; point: Point }[], viewport: { width: number; height: number }, canvas: { width: number; height: number }, camera: BoardCamera): End | null {
  return resolveDrop(point, targets.map(target => ({ end: target.end, point: {
    x: viewport.width / 2 + camera.x + (target.point.x - canvas.width / 2) * camera.scale,
    y: viewport.height / 2 + camera.y + (target.point.y - canvas.height / 2) * camera.scale,
  } })), viewport);
}

export interface BoardCamera { x: number; y: number; scale: number }
export interface ChainBounds { left: number; top: number; right: number; bottom: number }
/** Rendered tile edges plus playable end slots, in virtual-canvas coordinates. */
export function chainBounds(board: Tile[], openingId: string | null, metrics: ReturnType<typeof chainMetrics>): ChainBounds {
  const anchor = Math.max(0, board.findIndex(tile => tile.id === openingId));
  const boxes = board.map((_, index) => {
    const p = chainSlot(index - anchor, metrics, board, openingId);
    return { x: p.x, y: p.y, w: p.width * p.scale + 4, h: p.height * p.scale * 0.86 + 4 };
  });
  const ends = endpointOffsets(board, openingId);
  for (const end of board.length ? ['left', 'right'] as const : ['right'] as const) {
    const p = chainSlot(ends[end], metrics, board, openingId);
    boxes.push({ x: p.x, y: p.y, w: metrics.stepX, h: metrics.stepY });
  }
  return { left: Math.min(...boxes.map(p => p.x - p.w / 2)), right: Math.max(...boxes.map(p => p.x + p.w / 2)),
    top: Math.min(...boxes.map(p => p.y - p.h / 2)), bottom: Math.max(...boxes.map(p => p.y + p.h / 2)) };
}
/** Keep visible chains stationary; fit only when space is needed or explicitly reset. */
export function fitBoardCamera(bounds: ChainBounds, viewport: { width: number; height: number }, canvas: { width: number; height: number }, current: BoardCamera, reset = false): BoardCamera {
  const margin = Math.min(22, Math.max(6, Math.min(viewport.width, viewport.height) * 0.06));
  const scale = Math.min(1, (viewport.width - margin * 2) / Math.max(1, bounds.right - bounds.left),
    (viewport.height - margin * 2) / Math.max(1, bounds.bottom - bounds.top), reset ? 1 : current.scale);
  const centerX = (bounds.left + bounds.right) / 2 - canvas.width / 2;
  const centerY = (bounds.top + bounds.bottom) / 2 - canvas.height / 2;
  const fits = viewport.width / 2 + current.x + (bounds.left - canvas.width / 2) * current.scale >= margin &&
    viewport.width / 2 + current.x + (bounds.right - canvas.width / 2) * current.scale <= viewport.width - margin &&
    viewport.height / 2 + current.y + (bounds.top - canvas.height / 2) * current.scale >= margin &&
    viewport.height / 2 + current.y + (bounds.bottom - canvas.height / 2) * current.scale <= viewport.height - margin;
  if (!reset && fits) return current;
    if (reset) return { x: -centerX * scale, y: -centerY * scale, scale };
  // Clamp to the nearest valid frame, rather than shifting visible tiles to center.
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
  return {
    x: clamp(current.x, margin - viewport.width / 2 - (bounds.left - canvas.width / 2) * scale,
      viewport.width / 2 - margin - (bounds.right - canvas.width / 2) * scale),
    y: clamp(current.y, margin - viewport.height / 2 - (bounds.top - canvas.height / 2) * scale,
      viewport.height / 2 - margin - (bounds.bottom - canvas.height / 2) * scale),
    scale,
  };
}
/** Invert the very same camera used for rendering before resolving a drag target. */
export function screenToBoard(point: Point, viewport: { width: number; height: number }, canvas: { width: number; height: number }, camera: BoardCamera): Point {
  return { x: canvas.width / 2 + (point.x - viewport.width / 2 - camera.x) / camera.scale,
    y: canvas.height / 2 + (point.y - viewport.height / 2 - camera.y) / camera.scale };
}

/** Preserve screen-space tile centers when the hand frees or takes table space. */
export function resizedBoardCamera(current: BoardCamera, previous: {width:number;height:number}, next: {width:number;height:number}): BoardCamera {
  return { ...current, x: current.x + (previous.width-next.width)/2, y: current.y + (previous.height-next.height)/2 };
}
