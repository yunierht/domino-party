import type { Tile } from './engine';

/** A removed tile leaves a hole; stock indices are resolved by identity. */
export function boneyardSlots(slots: readonly string[], stock: readonly Tile[]) {
  return slots.map(id => ({ id, stockIndex: stock.findIndex(tile => tile.id === id) }));
}
