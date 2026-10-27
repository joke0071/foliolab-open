import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/import.yml',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../docs/ci/cross-engine-baseline.v1.json',import.meta.url),'utf8'));
const command=/^(?:[A-Z][A-Z0-9_]*=\S+\s+)?node tests\/browser-[\w-]+\.mjs$/;
const commands=s=>s.split('\n').map(l=>l.trim()).filter(l=>command.test(l));
function validate(source){
 const begin=source.indexOf('  cross-engine:'),end=source.indexOf('\n  deploy:',begin);
 assert.ok(begin>=0&&end>begin);const cross=source.slice(begin,end),actual=commands(cross);
 assert.equal(manifest.commands.length,30);assert.equal(new Set(actual).size,actual.length);
 assert.deepEqual(actual.slice().sort(),manifest.commands.slice().sort());
 assert.match(cross,/fail-fast: false/);assert.match(cross,/shard: \[1, 2\]/);
 const branches=cross.match(/if \[\[ [^\n]+matrix\.shard[^\n]+ \]\]; then\n([\s\S]+?)\n {10}else\n([\s\S]+?)\n {10}fi/);
 assert.ok(branches);for(const key of ['1','2']){assert.ok(manifest.shards[key].length>0);assert.deepEqual(commands(branches[Number(key)]),manifest.shards[key]);}
 assert.match(cross,/name: cross-engine-gates-.*matrix\.shard/);
 assert.match(source,/needs:\s*\[test,\s*cross-engine\]/);
}
test('CI preserves the independently recorded v188 cross-engine manifest in both required shards',()=>validate(workflow));
test('CI policy rejects a dropped suite, duplicate, reduced engine set or missing shard',()=>{
 const first=manifest.commands[0],line='            '+first+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('UI07_ENGINES=firefox,webkit','UI07_ENGINES=firefox'),workflow.replace('shard: [1, 2]','shard: [1]')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
