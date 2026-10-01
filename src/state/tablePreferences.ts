export interface TablePreferences {
  tileSound: boolean;
  tableMusic: boolean;
  vibration: boolean;
  matchingTiles: boolean;
}

/** Explicit choices win; unchosen/previously migrated defaults follow sound-on. */
export function tablePreferences(saved: Partial<TablePreferences> & { sound?: boolean; tileSoundExplicit?: boolean; tileSoundMigration?: number }): TablePreferences {
  return {
    tileSound: saved.tileSoundExplicit === true && typeof saved.tileSound === 'boolean' ? saved.tileSound : true,
    tableMusic: saved.tableMusic === true,
    vibration: saved.vibration ?? true,
    matchingTiles: saved.matchingTiles ?? true,
  };
}
