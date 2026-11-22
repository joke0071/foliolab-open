import assert from 'node:assert/strict';
export function historicalCrossEngineLayout(source){
 const row='            UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n';
 const predecessor='            FLH03_08_ENGINES=firefox,webkit node tests/browser-position-removal.mjs\n';
 const history='            HISTORY_ENGINES=firefox,webkit node tests/browser-history-ui.mjs\n';
 const restore='            RESTORE_ENGINES=firefox,webkit node tests/browser-restore-deposits.mjs\n';
 const releasePosition=history+predecessor+'          elif ';
 assert.equal(source.split(predecessor).length,2,'Exact two-engine position-removal invocation required once');
 assert.equal(source.split(releasePosition).length,2,'Position removal must be last in shard 1');
 assert.equal(source.split(restore+row).length,2,'Restore and UI quality must stay in shard 2');
 source=source.replace(releasePosition,history+'          elif ').replace(restore+row,restore+predecessor+row);
 const boundary=predecessor+row+'          else\n';
 assert.equal(source.split(row).length,2,'Exact two-engine UI-quality invocation required once');
 assert.equal(source.split(boundary).length,2,'UI quality must be last in shard 2');
 return source.replace(boundary,predecessor+'          else\n'+row);
}
