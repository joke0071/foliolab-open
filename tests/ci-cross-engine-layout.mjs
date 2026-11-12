import assert from 'node:assert/strict';

// Normalize only the explicitly reviewed Cross3 -> end-of-Cross2 move so
// historical manifests and sealed workflow hashes remain independently intact.
export function historicalCrossEngineLayout(source){
 const row='            UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n';
 const predecessor='            FLH03_08_ENGINES=firefox,webkit node tests/browser-position-removal.mjs\n';
 const boundary=predecessor+row+'          else\n';
 assert.equal(source.split(row).length,2,'UI quality must run exactly once with both engines');
 assert.equal(source.split(boundary).length,2,'Only end-of-Cross2 UI quality placement is approved');
 return source.replace(boundary,predecessor+'          else\n'+row);
}
