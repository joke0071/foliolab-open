'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync,execFileSync}=require('node:child_process');
const ignore=fs.readFileSync(path.join(__dirname,'../../.gitignore'),'utf8');
const cases=[
 ['artifacts/gates/new.png',true],['_site/index.html',true],['test-results/latest/report.json',true],['playwright-report/index.html',true],
 ['private/statement.json',true],['backups/full.json',true],['exports/trades.csv',true],['originals/input.txt',true],
 ['.env',true],['.env.local',true],['secret.pem',true],['my-backup.json',true],['portfolio.sqlite3',true],['logs/output.log',true],['node_modules/anything/index.js',true],
 ['tests/fixtures/flh03/january.csv',false],['tests/fixtures/flh03/overlap.csv',false],['docs/perf-evidence/2026-10-31/render-v238/fixture.json.gz',false],
 ['docs/release-evidence/current.json',false],['docs/ui-visual01/reference.png',false],['docs/artifacts/reference.json',false],['src/app.js',false],['tests/calendar.test.mjs',false]
];
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'foliolab-hygiene-'));
const git=args=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
git(['init','-q']);fs.writeFileSync(path.join(dir,'.gitignore'),ignore);
for(const [name,ignored]of cases)test('path '+name,()=>{
 const p=path.join(dir,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,'SYNTHETIC');
 const result=spawnSync('git',['check-ignore','--quiet','--',name],{cwd:dir});
 assert.equal(result.status,ignored?0:1);
});
test('already tracked evidence stays tracked and changes stay detectable',()=>{
 const name='artifacts/gates/existing.json',p=path.join(dir,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,'SYNTHETIC OLD');
 git(['add','-f','--',name]);fs.writeFileSync(p,'SYNTHETIC NEW');
 assert.equal(git(['ls-files','--',name]),name);
 assert.equal(git(['diff','--name-only','--',name]),name);
});
test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
