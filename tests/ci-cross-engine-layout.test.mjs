import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {historicalCrossEngineLayout} from './ci-cross-engine-layout.mjs';
const current=readFileSync(new URL('../.github/workflows/import.yml',import.meta.url),'utf8');
const row='            UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n';
const removal='            FLH03_08_ENGINES=firefox,webkit node tests/browser-position-removal.mjs\n';
const history='            HISTORY_ENGINES=firefox,webkit node tests/browser-history-ui.mjs\n';
test('the two exact relocations preserve every invocation and the original sealed layout',()=>{
 const old=historicalCrossEngineLayout(current);
 assert.deepEqual(current.split('\n').sort(),old.split('\n').sort());
 assert.equal(old.replace('          else\n'+row,row+'          else\n')
  .replace(removal+row,row).replace(history,history+removal),current);
});
test('layout rejects omission duplication reduced engines old or arbitrary placement',()=>{
 for(const suite of [row,removal]){
  for(const invalid of [current.replace(suite,''),current.replace(suite,suite+suite),
   current.replace(suite,suite.replace('firefox,webkit','firefox')),
   current.replace(suite,'').replace('          else\n','          else\n'+suite)])
   assert.throws(()=>historicalCrossEngineLayout(invalid));
 }
 assert.throws(()=>historicalCrossEngineLayout(historicalCrossEngineLayout(current)));
});
