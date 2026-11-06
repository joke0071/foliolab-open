import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('review integrity runs once through the sealed binding path in all integration/live engine stages',()=>{
 const ui=readFileSync(new URL('./browser-ui-quality.mjs',import.meta.url),'utf8'),binding=readFileSync(new URL('./browser-flatex-native-binding.mjs',import.meta.url),'utf8'),workflow=readFileSync(new URL('../.github/workflows/import.yml',import.meta.url),'utf8');
 assert.equal((ui.match(/'\.\/browser-flatex-native-binding\.mjs'/g)||[]).length,1);
 assert.equal((binding.match(/^await import\('\.\/browser-review-v289-integrity\.mjs'\);$/gm)||[]).length,1);
 assert.equal(workflow.split('\n').filter(line=>/^\s*(?:UI_QUALITY_(?:SCREENSHOTS=1|ENGINES=firefox,webkit) )?node tests\/browser-ui-quality\.mjs(?: 2>&1.*)?$/.test(line)).length,4);
});
