/** Preserve a valid rival; replace only a collision with the Settings identity. */
export function lobbyOpponent<T extends string>(items:readonly {id:T}[],selected:T,own:string|undefined):T{return own&&selected===own?(items.find(item=>item.id!==own)?.id??selected):selected;}
