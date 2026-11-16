import assert from 'node:assert/strict';
export function historicalCrossEngineLayout(source){
 const row='            UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n';
 const predecessor='            FLH03_08_ENGINES=firefox,webkit node tests/browser-position-removal.mjs\n';
 const boundary=predecessor+row+'          else\n';
 assert.equal(source.split(row).length,2,'Exact two-engine UI-quality invocation required once');
 assert.equal(source.split(boundary).length,2,'UI quality must be last in shard 2');
 return source.replace(boundary,predecessor+'          else\n'+row);
}
