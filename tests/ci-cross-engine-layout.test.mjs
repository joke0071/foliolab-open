import {combinedQualityWorkflow} from './ci-stage-quality-jobs.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {historicalCrossEngineLayout} from './ci-cross-engine-layout.mjs';
const current=combinedQualityWorkflow(readFileSync(new URL('../.github/workflows/import.yml',import.meta.url),'utf8'));
const row='            UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n';
test('one exact relocation preserves every invocation and original sealed layout',()=>{
 const old=historicalCrossEngineLayout(current);
 assert.deepEqual(current.split('\n').sort(),old.split('\n').sort());
 assert.equal(old.replace('          else\n'+row,row+'          else\n'),current);
});
test('layout rejects omission duplication reduced engines old or arbitrary placement',()=>{
 for(const invalid of [current.replace(row,''),current.replace(row,row+row),current.replace(row,row.replace('firefox,webkit','firefox')),historicalCrossEngineLayout(current),current.replace(row,'').replace('          else\n','          else\n'+row)])assert.throws(()=>historicalCrossEngineLayout(invalid));
});
