import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {historicalCrossEngineLayout} from './ci-cross-engine-layout.mjs';
const source=readFileSync(new URL('../.github/workflows/import.yml',import.meta.url),'utf8');
const row='            UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n';
const previous='            FLH03_08_ENGINES=firefox,webkit node tests/browser-position-removal.mjs\n';
test('one exact UI suite move normalizes to historical layout without changing any other byte',()=>{
 const restored=historicalCrossEngineLayout(source);
 assert.equal(source.replace(row,''),restored.replace(row,''));
 assert.equal(restored.split('          else\n'+row).length,2);
 assert.equal(source.split(previous+row+'          else\n').length,2);
});
test('layout contract rejects omissions, duplicates, reduced browsers, historical and arbitrary placement',()=>{
 const historical=historicalCrossEngineLayout(source);
 for(const broken of [source.replace(row,''),source.replace(row,row+row),source.replace(row,row.replace('firefox,webkit','firefox')),historical,source.replace(previous+row,row+previous),source.replace(row,'').replace('            CASH_UX_ENGINES=',row+'            CASH_UX_ENGINES=')]){
  assert.notEqual(broken,source);assert.throws(()=>historicalCrossEngineLayout(broken));
 }
});
