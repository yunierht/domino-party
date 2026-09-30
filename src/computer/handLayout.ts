/** Show the entire hand, choosing the largest tiles that fit the available tray. */
export function handLayout(count: number, width: number, maxHeight: number) {
  let best = { columns: 7, rows: 1, size: 0 };
  for (let columns = 7; columns <= Math.max(7, count); columns++) {
    const rows = Math.max(1, Math.ceil(count / columns));
    // Whole units plus spare width avoid native pixel rounding wrapping the last tile.
    const size = Math.floor(Math.min(54, (width - 4 - (columns - 1) * 2) / columns - 10, (maxHeight / rows - 26) / 2));
    if (size > best.size) best = { columns, rows, size };
  }
  return best;
}
