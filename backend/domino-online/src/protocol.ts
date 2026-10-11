import type { Intent, AttentionKind } from './room.ts';
export type Command = { commandId: string; epoch: string; revision: number; round: number } &
  (Intent | { type: 'approve' } | { type: 'start' } | { type: 'ready' } | { type: 'nextRound' } | {type:'pauseTurnTimer'} | {type:'resumeTurnTimer'} | {type:'openBoneyard'} | {type:'cancelBoneyard'} | {type:'holdResult'} | {type:'releaseResult'} | {type:'attention';kind:AttentionKind});
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_request');
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 80): string {
  if (typeof value !== 'string' || !value || value.length > max) throw new Error('invalid_request');
  return value;
}
function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('invalid_request');
  return value;
}
export function command(value: unknown): Command {
  const o = object(value), type = text(o.type);
  const base = { commandId: text(o.commandId), epoch: text(o.epoch), revision: integer(o.revision), round: integer(o.round) };
  let result: Command;
  if (type === 'play') {
    if (o.end !== 'left' && o.end !== 'right') throw new Error('invalid_request');
    result = { ...base, type, tileId: text(o.tileId, 3), end: o.end };
  } else if (type === 'draw') result = { ...base, type, slot: text(o.slot, 20) };
  else if(type==='attention'){
    if(o.kind!=='wave'&&o.kind!=='knock'&&o.kind!=='look')throw new Error('invalid_request');
    result={...base,type,kind:o.kind};
  }
  else if (type === 'approve' || type === 'start' || type === 'ready' || type === 'nextRound' || type === 'pass' || type==='pauseTurnTimer' || type==='resumeTurnTimer' || type==='openBoneyard' || type==='cancelBoneyard' || type==='holdResult' || type==='releaseResult') result = { ...base, type };
  else throw new Error('invalid_request');
  if (Object.keys(o).some(key => !(key in result))) throw new Error('invalid_request');
  return result;
}
export async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
}
export function secureRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}
// Clients persist this BEFORE create/join to survive loss of the first response.
export function createGuestCredential(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2,'0')).join('');
}
