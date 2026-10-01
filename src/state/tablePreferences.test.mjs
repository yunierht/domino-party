import test from 'node:test';
import assert from 'node:assert/strict';
import { tablePreferences } from './tablePreferences.ts';
test('fresh, legacy and invalid settings default to tile sound on and music off',()=>{
 for(const saved of [{},{sound:true},{sound:false},{tileSound:true},{tileSound:true,tileSoundExplicit:false},{music:true,musicTrack:'moonlight'},{tileSound:'true',tableMusic:1}]){
  assert.deepEqual(tablePreferences(saved),{tileSound:true,tableMusic:false,vibration:true,matchingTiles:true});
 }
});
test('old default-off migration follows the new default, but an explicit mute persists',()=>{
 for(const tileSoundMigration of [undefined,1,2]) {
  assert.equal(tablePreferences({tileSound:false,tileSoundExplicit:false,tileSoundMigration}).tileSound,true);
  const saved={tileSound:false,tileSoundExplicit:true,tileSoundMigration};
  assert.equal(tablePreferences(JSON.parse(JSON.stringify(saved))).tileSound,false);
  assert.equal(tablePreferences({...saved,tileSound:true}).tileSound,true);
 }
});
test('all independent explicit settings survive persistence',()=>{
 for(let bits=0;bits<16;bits++){
  const saved={tileSound:!!(bits&1),tableMusic:!!(bits&2),vibration:!!(bits&4),matchingTiles:!!(bits&8)};
  assert.deepEqual(tablePreferences(JSON.parse(JSON.stringify({...saved,tileSoundExplicit:true,tileSoundMigration:1,sound:!saved.tileSound,music:true}))),saved);
 }
});
