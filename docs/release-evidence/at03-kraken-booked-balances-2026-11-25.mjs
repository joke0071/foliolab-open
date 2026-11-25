import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [ledger,checkout,origin='http://127.0.0.1:4412/']=process.argv.slice(2);
const product=path=>import(pathToFileURL(resolve(checkout,path)));
const {prepareKrakenSourcePlan}=await product('src/kraken-source-plan.js');
const {krakenBalanceTrail,previewKrakenImport}=await product('src/kraken-import.js');
const {units,exact}=await product('src/decimal.js');
const {backup,blankModel,createProvider,createAccount,createPosition}=await product('src/model.js');
const {captureOpenings}=await product('src/transactions.js');
const {clickDisclosed}=await product('tests/browser-disclosures.mjs');
const {openApp,readAppState,openBackupControls,saveTargetBackup,importPasswordFile}=await product('tests/flh04-backup-app.mjs');
const {mkdtemp,rm}=await import('node:fs/promises');
const {tmpdir}=await import('node:os');
const {join}=await import('node:path');
const {chromium,firefox,webkit}=await product('node_modules/playwright/index.mjs');

const oracle=JSON.parse(execFileSync('python3',['-c',String.raw`
import csv, sys, json
from decimal import Decimal as D
from collections import Counter, defaultdict
with open(sys.argv[1], newline='', encoding='utf-8-sig') as f:
    rows=list(csv.DictReader(f))
def scope(r): return (r['asset'],r['wallet'],r['subclass'])
eur=[r for r in rows if scope(r)==('EUR','spot / main','fiat')]
opening=max(i for i,r in enumerate(eur) if r['time']==eur[0]['time'])
head,tail=eur[opening],eur[-1]
balance=D(head['balance'])
types=Counter()
for r in eur[opening+1:]:
    fee=D(r['fee'])
    assert fee==0 or r['feecurrency']=='EUR'
    balance+=D(r['amount'])-fee
    assert balance==D(r['balance'])
    types[r['type']]+=1
assert head['time']<tail['time'] and balance==D(tail['balance'])
refs=defaultdict(list)
for i,r in enumerate(rows,2): refs[r['refid']].append((i,r))
matches=[g for g in refs.values() if len(g)==4 and
    {scope(r) for _,r in g}=={(a,w,c) for a,c in [('EUR','fiat'),('USDC','stable_coin')] for w in ['spot / main','earn / liquid']} and
    all(r['type']=='earn' and r['subtype']=='autoallocation' and D(r['fee'])==0 for _,r in g)]
assert len(matches)==1
group=matches[0]
anchors=[]
for line,row in group:
    candidates=[(i,r) for i,r in enumerate(rows,2) if scope(r)==scope(row) and r['time']<row['time']]
    prior_line,prior=candidates[-1]
    assert D(prior['balance'])+D(row['amount'])==D(row['balance'])
    anchors.append(dict(leg=line,prior=prior_line,opening=prior['balance'],closing=row['balance'],wallet=row['wallet'],asset=row['asset']))
for asset in ('EUR','USDC'):
    assert sum(D(r['amount']) for _,r in group if r['asset']==asset)==0
print(json.dumps(dict(first=head['balance'],last=tail['balance'],counts=types,anchors=anchors,movements=len(eur)-opening-1)))
`,ledger],{encoding:'utf8'}));

const raw=readFileSync(ledger,'utf8');
const source=prepareKrakenSourcePlan([raw]);
assert.equal(source.conflicts,0);
const eur=source.observations.filter(r=>r.values.asset==='EUR'&&r.values.wallet==='spot / main'&&r.values.subclass==='fiat');
assert.ok(eur.every(r=>r.issues.length===0));
let balance=exact(units(oracle.first)),movements=0;
for(const [index,rows] of [...Map.groupBy(eur,r=>r.values.time).values()].entries()){
 if(index===0){assert.equal(rows.at(-1).balanceExact,balance);continue;}
 const trail=krakenBalanceTrail(rows,units(balance));
 balance=trail.at(-1).balanceExact;
 assert.equal(balance,rows.at(-1).balanceExact);
 movements+=trail.length;
}
assert.equal(balance,exact(units(oracle.last)));
assert.equal(movements,oracle.movements);

const lines=raw.split(/\r?\n/);
const selected=[lines[0],...oracle.anchors.map(a=>lines[a.leg-1])].join('\n');
const selectedSource=prepareKrakenSourcePlan([selected]);
assert.equal(selectedSource.groups.length,1);
assert.equal(selectedSource.groups[0].kind,'internal-transfer-batch');
assert.deepEqual(selectedSource.groups[0].issues,[]);
const model=blankModel();
model.settings.autoRefresh=false;
model.providers.push(createProvider({id:'kraken-local',name:'Kraken',type:'broker'}));
const assignments={},expected={};
for(const [i,anchor] of oracle.anchors.entries()){
 const row=selectedSource.observations[i],id='local-position-'+i,accountId='local-account-'+i,cash=anchor.asset==='EUR';
 assert.equal(row.values.asset,anchor.asset);
 assert.equal(row.values.wallet,anchor.wallet);
 model.accounts.push(createAccount({id:accountId,providerId:'kraken-local',name:'Local reference '+i,type:'exchange',currency:'EUR'},model));
 model.positions.push(createPosition({id,providerId:'kraken-local',accountId,kind:cash?'cash':'crypto',name:anchor.asset+' '+i,
  symbol:anchor.asset,coinId:cash?'':'usd-coin',quantity:anchor.opening,price:cash?'1':'0'},model));
 assignments[row.streamId]=id;
 expected[id]=exact(units(anchor.closing));
}
captureOpenings(model);
const preview=previewKrakenImport(model,[selected],assignments,{openingConfirmed:true});
assert.equal(preview.ready,1);
assert.deepEqual(Object.fromEntries(preview.simulated.positions.map(p=>[p.id,p.quantityExact])),expected);
const initial=Buffer.from(backup(model));
const original={name:'private-original-group.csv',mimeType:'text/csv',buffer:Buffer.from(selected)};
const directory=await mkdtemp(join(tmpdir(),'foliolab-at03-'));
const password='FolioLab temporary AT03 test password';
const engines=[];
try{
 for(const name of (process.env.AT03_ENGINES||'chromium').split(',')){
  const browser=await ({chromium,firefox,webkit})[name].launch({headless:true,executablePath:process.env['AT03_'+name.toUpperCase()]});
  try{
   const isolated=async()=>{
    const context=await browser.newContext({serviceWorkers:'block'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
    return openApp(context,origin);
   };
   const page=await isolated();
   await page.locator('#sidebarNav [data-page=more]').click();
   page.once('dialog',dialog=>dialog.accept());
   await page.locator('#backupFile').setInputFiles({name:'initial-local.json',mimeType:'application/json',buffer:initial});
   await page.waitForFunction(()=>document.getElementById('backupStatus').textContent.includes('wiederhergestellt'));
   const before=await readAppState(page);
   const load=async()=>{
    await page.locator('#sidebarNav [data-page=bookings]').click();
    await page.locator('#openCSVImport').click();
    await page.locator('#csvFile').setInputFiles(original);
    await clickDisclosed(page.locator('[data-kraken=simulate]'));
   };
   await load();
   for(const [stream,id] of Object.entries(assignments))await page.locator('[data-kraken-binding="'+stream+'"]').selectOption(id);
   await page.locator('[data-kraken=opening]').check();
   await page.locator('[data-kraken=simulate]').click();
   await page.locator('[data-kraken=status]').filter({hasText:/1 neue Gruppen · 0 bereits vorhanden · 0 gesperrt/}).waitFor();
   assert.deepEqual(await readAppState(page),before);
   await page.locator('[data-kraken=approve]').check();
   await page.locator('#saveDialog').click();
   await page.locator('#editDialog').waitFor({state:'hidden'});
   const saved=await readAppState(page),financial=JSON.parse(saved.portfolio.raw);
   assert.equal(saved.portfolio.revision,before.portfolio.revision+1);
   assert.deepEqual(Object.fromEntries(financial.positions.map(p=>[p.id,p.quantityExact])),expected);
   assert.deepEqual(financial.journalEntries.map(e=>e.type),['transfer','transfer']);
   assert.equal(financial.externalCashFlows.length,0);
   await load();
   await page.locator('[data-kraken=simulate]').click();
   await page.locator('[data-kraken=status]').filter({hasText:/0 neue Gruppen · 1 bereits vorhanden · 0 gesperrt/}).waitFor();
   page.once('dialog',dialog=>dialog.accept());
   await page.locator('#cancelDialog').click();
   await page.locator('#editDialog').waitFor({state:'hidden'});
   assert.deepEqual(await readAppState(page),saved);
   await openBackupControls(page);
   await page.locator('#backupPassword').fill(password);
   await page.locator('#backupPasswordConfirm').fill(password);
   await page.locator('#saveBackupPassword').click();
   await page.locator('#backupPasswordForm').waitFor({state:'hidden'});
   const file=join(directory,name+'.json');
   await saveTargetBackup(page,file);
   const fresh=await isolated();
   await fresh.locator('#sidebarNav [data-page=more]').click();
   await importPasswordFile(fresh,file,password,{replacement:'accept'});
   await fresh.reload();
   assert.equal((await readAppState(fresh)).portfolio.raw,saved.portfolio.raw);
   engines.push(name);
  }finally{await browser.close();}
 }
}finally{await rm(directory,{recursive:true,force:true});}
console.log(JSON.stringify({result:'PASS',sourceSHA256:createHash('sha256').update(raw).digest('hex'),release:execFileSync('git',['-C',checkout,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 reference:'https://support.kraken.com/hc/articles/360001169383-how-to-interpret-ledger-history-fields',
 bookedAnchors:2,between:movements,types:oracle.counts,internalTransfer:{legs:4,assets:['EUR','USDC'],providerOpeningAnchors:4,
 providerClosingAnchors:4,externalFlows:0,exactBalanceMatches:4,restore:'byte-exact'},engines},null,2));
