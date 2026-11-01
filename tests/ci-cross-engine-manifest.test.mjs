import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/import.yml',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../docs/ci/cross-engine-baseline.v1.json',import.meta.url),'utf8'));
const v221=JSON.parse(readFileSync(new URL('../docs/ci/cross-engine-v221.v1.json',import.meta.url),'utf8'));
// Preserve the historical 30-command evidence verbatim; require the new suite in addition.
const pchainCommand='PCHAIN_ENGINES=firefox,webkit node tests/browser-pchain-evidence.mjs';
const sonicCommand='SONIC_EVIDENCE_ENGINES=firefox,webkit node tests/browser-sonic-staking-evidence.mjs';
const pwaCommand='PWA_UPDATE_ENGINES=firefox,webkit node tests/browser-pwa-update.mjs';
const periodCommands=['firefox','webkit'].flatMap(engine=>['chart-period-consistency','extended-chart-periods'].map(suite=>'UI_PERIOD_ENGINE='+engine+' node tests/browser-'+suite+'.mjs'));
const oldSecond=[pwaCommand,...manifest.shards['2'].flatMap(c=>c==='node tests/browser-cross-engine.mjs'?[c,pchainCommand,sonicCommand]:[c])];
const split=oldSecond.indexOf('UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs');
assert.ok(split>0);
const expectedShards={'1':manifest.shards['1'].flatMap(c=>c==='node tests/browser-atomic-storage-cross-engine.mjs'?[c,...periodCommands]:[c]),'2':oldSecond.slice(0,split),'3':oldSecond.slice(split)};
const uh02Command='HISTORY_ENGINES=firefox,webkit node tests/browser-unified-bitcoin.mjs';
const financeCommand='FIN_E2E_ENGINES=firefox,webkit node tests/browser-fin-e2e.mjs';
const cashCommand='CASH_UX_ENGINES=firefox,webkit node tests/browser-cash-account-ux.mjs';
const etfCommand='ETF_SOURCE_ENGINES=firefox,webkit node tests/browser-etf-source-recovery.mjs';
const recoveryCommand='RECOVERY_ENGINES=firefox,webkit node tests/browser-recovery-backup-limits.mjs';
const command=/^(?:[A-Z][A-Z0-9_]*=\S+\s+)?node tests\/browser-[\w-]+\.mjs$/;
const commands=s=>s.split('\n').map(l=>l.trim()).filter(l=>command.test(l));
function validate(source){
 const begin=source.indexOf('  cross-engine:'),end=source.indexOf('\n  deploy:',begin);
 assert.ok(begin>=0&&end>begin);const cross=source.slice(begin,end),all=commands(cross);
 assert.equal(all.filter(c=>c===cashCommand).length,1,'Cash account UX mandatory exactly once in both engines');
 assert.equal(all.filter(c=>c===etfCommand).length,1,'ETF source recovery mandatory exactly once in both engines');
 assert.equal(all.filter(c=>c===recoveryCommand).length,1,'Recovery suite mandatory exactly once');
 assert.equal(all.filter(c=>c===financeCommand).length,1,'Finance chain mandatory exactly once');
 assert.equal(all.filter(c=>c===uh02Command).length,1,'UH02 mandatory exactly once in both engines');
 const actual=all.filter(c=>c!==uh02Command&&c!==recoveryCommand&&c!==financeCommand&&c!==etfCommand&&c!==cashCommand);
 assert.equal(manifest.commands.length,30);assert.equal(new Set(actual).size,actual.length);
 assert.deepEqual(actual.slice().sort(),[...manifest.commands,pchainCommand,sonicCommand,pwaCommand,...periodCommands].sort());
 assert.match(cross,/fail-fast: false/);assert.match(cross,/shard: \[1, 2, 3\]/);
 const branches=cross.match(/if \[\[ [^\n]+matrix\.shard[^\n]+ \]\]; then\n([\s\S]+?)\n {10}elif \[\[ [^\n]+matrix\.shard[^\n]+ \]\]; then\n([\s\S]+?)\n {10}else\n([\s\S]+?)\n {10}fi/);
 assert.ok(branches);for(const key of ['1','2','3']){assert.ok(expectedShards[key].length>0);assert.deepEqual(commands(branches[Number(key)]).filter(c=>c!==uh02Command&&c!==recoveryCommand&&c!==financeCommand&&c!==etfCommand&&c!==cashCommand),expectedShards[key]);}
 assert.deepEqual(v221.shards,expectedShards);
 assert.deepEqual(v221.commands,[...expectedShards['1'],...expectedShards['2'],...expectedShards['3']]);
 assert.match(cross,/name: cross-engine-gates-.*matrix\.shard/);
 assert.match(source,/needs:\s*\[test,\s*cross-engine\]/);
}
test('CI preserves all historical and v221 commands exactly once across three required isolated shards',()=>validate(workflow));
test('CI policy rejects a dropped suite, duplicate, reduced engine set or missing shard',()=>{
 const first=manifest.commands[0],line='            '+first+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('UI07_ENGINES=firefox,webkit','UI07_ENGINES=firefox'),workflow.replace('shard: [1, 2, 3]','shard: [1, 2]')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
test('CI keeps the expensive sequential UI suite and every third-shard security gate mandatory',()=>{
 for(const command of [...expectedShards['3'],etfCommand,cashCommand]){
  const line='            '+command+'\n';
  for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line)]){
   assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));
  }
 }
 assert.equal(v221.reducedSelectionActivated,false);
 assert.equal(v221.unknownImpact,'full');
 assert.deepEqual(Object.keys(v221.stages),['FAST','INTEGRATION','RELEASE']);
});
test('CI requires the additional P-Chain suite in both engines without changing the historical manifest',()=>{
 const line='            '+pchainCommand+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('PCHAIN_ENGINES=firefox,webkit','PCHAIN_ENGINES=firefox')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
test('CI requires the additional Sonic suite in both engines alongside all previous suites',()=>{
 const line='            '+sonicCommand+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('SONIC_EVIDENCE_ENGINES=firefox,webkit','SONIC_EVIDENCE_ENGINES=firefox')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
test('CI requires warm-cache PWA update coverage in both engines without dropping any existing suite',()=>{
 const line='            '+pwaCommand+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace('PWA_UPDATE_ENGINES=firefox,webkit','PWA_UPDATE_ENGINES=firefox')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
 assert.match(workflow,/^ {10}node tests\/browser-pwa-update\.mjs$/m);
});
test('CI requires both visual period suites in Firefox and WebKit in addition to the historical manifest',()=>{
 for(const command of periodCommands){
  const line='            '+command+'\n';
  for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line)]){
   assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));
  }
 }
});

test('CI requires UH02 in both engines without replacing any historical command',()=>{
 const line='            '+uh02Command+'\n';
 for(const broken of [workflow.replace(line,''),workflow.replace(line,line+line),workflow.replace(uh02Command,'HISTORY_ENGINES=firefox node tests/browser-unified-bitcoin.mjs')]){assert.notEqual(broken,workflow);assert.throws(()=>validate(broken));}
});
