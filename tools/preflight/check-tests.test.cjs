'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {checkSources,validPath,readWorktree,readRevision,loadCompiler}=require('./check-tests.cjs');
const ts=loadCompiler();
const check=source=>checkSources(new Map([['tests/probe.mjs',source]]),ts);
const cases=[
 ['historical toggle ReferenceError',`import assert from 'node:assert/strict';const p={keyboard:{press:async()=>{}}};await p.keyboard.press('Escape');assert.ok(await toggle.evaluate(e=>document.activeElement===e));`,false],
 ['declared focus target',`import assert from 'node:assert/strict';const focusTarget={evaluate:async f=>true};assert.ok(await focusTarget.evaluate(e=>document.activeElement===e));`,true],
 ['lexical block leakage',`if(true){const button=1;}console.log(button);`,false],
 ['misspelled existing variable',`const keyboard=1; console.log(keybaord);`,false],
 ['undefined shorthand',`const report={missingName};`,false],
 ['undefined callback reference',`const xs=[1];xs.map(x=>x+missed);`,false],
 ['browser API in callback',`const p={evaluate:async f=>{}}; await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);`,true],
 ['injected axe global',`const p={evaluate:async f=>{}};await p.evaluate(async()=>axe.run(document));`,true],
 ['Node runtime globals',`console.log(process.version,Buffer.from('x'),setImmediate(()=>{}));`,true],
 ['broken syntax',`const broken = ;`,false],
 ['async import alias',`import {chromium} from 'playwright';const browser=await chromium.launch();await browser.close();`,true],
 ['ts nocheck blocks approval',`// @ts-nocheck\nconsole.log(bad);`,false],
 ['ts ignore blocks approval',`// @ts-ignore\nconsole.log(bad);`,false],
 ['ts expect error blocks approval',`// @ts-expect-error\nconsole.log(bad);`,false],
 ['string is not a suppression',`console.log('// @ts-nocheck');`,true],
 ['no source execution',`throw Error('Must not run');`,true],
 ['property names not identifiers',`const x={toggle:1};console.log(x.toggle);`,true],
 ['explicit isolated module',`export {};const toggle=1;console.log(toggle);`,true]
];
for(const [name,source,pass]of cases)test(name,()=>assert.equal(check(source).status,pass?'PASS':'FAIL'));
test('separate files do not supply missing local bindings',()=>{
 const r=checkSources(new Map([['tests/a.mjs','const toggle=1;'],['tests/b.mjs','console.log(toggle);']]),ts);
 assert.equal(r.status,'FAIL');assert.equal(r.files[0].issues.length,0);assert.ok(r.files[1].issues.length);
});
test('invalid and empty inputs fail closed',()=>{
 for(const p of ['../tests/a.mjs','src/app.js','tests/../private/a.mjs','tests//a.mjs','tests/a.mjs\n','/tests/a.mjs'])assert.equal(validPath(p),false);
 assert.throws(()=>checkSources(new Map(),ts));
 assert.throws(()=>checkSources(new Map([['src/app.js','x']]),ts));
 assert.throws(()=>checkSources(new Map([['tests/x.mjs','x'.repeat(2097153)]]),ts));
});
test('read-only worktree; symlinks blocked; exact committed bytes used',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'foliolab-preflight-'));
 const git=args=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
  fs.mkdirSync(path.join(dir,'tests'));git(['init','-q']);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Synthetic fixture']);
  const p=path.join(dir,'tests/a.mjs');fs.writeFileSync(p,'const ok=1;console.log(ok);');git(['add','.']);git(['commit','-qm','baseline']);const base=git(['rev-parse','HEAD']);
  fs.writeFileSync(p,'console.log(toggle);');git(['add','.']);git(['commit','-qm','missing name']);const head=git(['rev-parse','HEAD']);
  fs.writeFileSync(p,'const toggle=1;console.log(toggle);');
  assert.equal(checkSources(readRevision(dir,base,head),ts).status,'FAIL');
  assert.equal(checkSources(readWorktree(dir,['tests/a.mjs']),ts).status,'PASS');
  assert.equal(fs.readFileSync(p,'utf8'),'const toggle=1;console.log(toggle);');
  fs.symlinkSync(p,path.join(dir,'tests/link.mjs'));assert.throws(()=>readWorktree(dir,['tests/link.mjs']));
  assert.throws(()=>readRevision(dir,'HEAD',head));assert.throws(()=>readRevision(dir,base,';exit 0'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});


// A committed type change must not disappear from the explicit input set.
function withTypeChange(from, to, run) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'foliolab-preflight-type-'));
 const git=args=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try {
  git(['init','-q']);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Synthetic fixture']);
  fs.mkdirSync(path.join(dir,'tests'));
  const file=path.join(dir,'tests/a.mjs');
  const write=kind=>kind==='symlink'?fs.symlinkSync('../outside.mjs',file):fs.writeFileSync(file,'const safe=1;console.log(safe);');
  write(from);git(['add','.']);git(['commit','-qm','original type']);const base=git(['rev-parse','HEAD']);
  fs.unlinkSync(file);write(to);git(['add','.']);git(['commit','-qm','changed type']);const head=git(['rev-parse','HEAD']);
  assert.equal(git(['diff','--name-status',base,head]),'T\ttests/a.mjs');
  run({dir,base,head});
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
test('committed regular-to-symlink change is rejected rather than omitted',()=>{
 withTypeChange('regular','symlink',({dir,base,head})=>{
  assert.throws(()=>readRevision(dir,base,head),/Non-regular changed test: tests\/a\.mjs/);
 });
});
test('committed symlink-to-regular change includes and checks the new bytes',()=>{
 withTypeChange('symlink','regular',({dir,base,head})=>{
  const sources=readRevision(dir,base,head);
  assert.deepEqual([...sources.keys()],['tests/a.mjs']);
  assert.equal(checkSources(sources,ts).status,'PASS');
 });
});
test('type-change CLI reports BLOCKED with exit 2, not NOT_APPLICABLE',()=>{
 withTypeChange('regular','symlink',({dir,base,head})=>{
  const {spawnSync}=require('node:child_process');
  const result=spawnSync(process.execPath,[path.join(__dirname,'check-tests.cjs'),'--base',base,'--head',head],{cwd:dir,encoding:'utf8'});
  assert.equal(result.status,2);
  assert.equal(result.stdout,'');
  const report=JSON.parse(result.stderr);
  assert.equal(report.status,'BLOCKED');
  assert.match(report.message,/Non-regular changed test/);
 });
});
