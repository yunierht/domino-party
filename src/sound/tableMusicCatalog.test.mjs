import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
const mod = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(readFileSync(new URL('./tableMusicCatalog.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(path => {
  assert.ok(existsSync(new URL(path, import.meta.url)));
  return path;
}, mod, mod.exports);
test('saved selection restores each chosen local track and invalid or retired values fall back safely', () => {
  const { MUSIC_TRACKS, musicTrack, musicSource } = mod.exports;
  for (const { id } of MUSIC_TRACKS) {
    assert.equal(musicTrack(JSON.parse(JSON.stringify({ tableMusicTrack: id })).tableMusicTrack), id);
    assert.ok(musicSource(id).endsWith('.mp3'));
  }
  for (const value of [undefined, null, {}, 'old-track', 2]) assert.equal(musicTrack(value), 'smooth-jazz');
});
