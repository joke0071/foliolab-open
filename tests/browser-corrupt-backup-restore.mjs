import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {blankModel,createProvider,createAccount,createPosition,backup,STORE_KEY} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';

const m=blankModel(),provider=createProvider({name:'Sicherungstest',type:'broker'});
m.providers.push(provider);
const account=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);
const cashAccount=createAccount({providerId:provider.id,name:'Cash',type:'checking'},m);
m.accounts.push(account,cashAccount);
const security=createPosition({providerId:provider.id,accountId:account.id,kind:'etf',name:'World ETF',
 quantity:0,price:100,currency:'EUR'},m);
const cash=createPosition({providerId:provider.id,accountId:cashAccount.id,kind:'cash',name:'Cash',
 quantity:1000,price:1,currency:'EUR'},m);
m.positions.push(security,cash);
executeTransaction(m,{type:'buy',positionId:security.id,cashPositionId:cash.id,
 date:'2026-10-21',quantity:2,unitPrice:100,feeEUR:1});
const valid=JSON.parse(backup(m));
const invalid=structuredClone(valid);
invalid.bookings[0].positionId='orphan-id';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:844}});
page.on('dialog',dialog=>dialog.accept());
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.evaluate(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key:STORE_KEY,data:m});
 await page.reload();
 await page.locator('#mobileNav [data-page="more"]').click();
 const original=await page.evaluate(key=>localStorage.getItem(key),STORE_KEY);
 assert.ok(original);
 await page.locator('#backupFile').setInputFiles({
  name:'broken-foliolab.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))
 });
 await page.waitForFunction(()=>/Buchung|Position|Referenz/.test(document.getElementById('toast')?.textContent||''));
 assert.match(await page.locator('#toast').innerText(),/Buchung|Position|Referenz/);
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORE_KEY),original,
  'Invalid backup must not modify a single persisted byte');
 await page.reload();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),STORE_KEY),original,
  'An invalid restore must remain reversible after reload');
 await page.locator('#mobileNav [data-page="more"]').click();
 // A valid backup with another provider should be restored normally.
 const changed=structuredClone(valid);
 changed.providers[0].name='Gültige Wiederherstellung';
 await page.locator('#backupFile').setInputFiles({
  name:'valid-foliolab.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(changed))
 });
 await page.waitForFunction(()=>document.getElementById('toast')?.textContent?.includes('Backup wiederhergestellt'),null,{timeout:10000});
 assert.match(await page.locator('#toast').innerText(),/Backup wiederhergestellt/);
 const restored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORE_KEY);
 assert.equal(restored.providers[0].name,'Gültige Wiederherstellung');
 assert.equal(restored.bookings[0].journalEntryId,valid.bookings[0].journalEntryId);
 console.log('BACKUP-RESTORE-INTEGRITY: corrupted restore leaves committed portfolio byte-identical, valid restore succeeds PASS');
}finally{await browser.close();}
