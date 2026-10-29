import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount} from '../src/model.js';
import {parseFlatexNativeCSV as parse} from '../src/flatex-native.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
import {inspectNativeFlatexSourceIdentities} from '../src/import-identity.js';
import {inspectNativeFlatexOrderLinks} from '../src/flatex-settlements.js';
import {auditNativeFlatexSettlementAmounts} from '../src/flatex-settlement-audit.js';
import {reviewNativeFlatexBindings,flatexNativeMarkup} from '../src/flatex-native-ui.js';
function fixture(d={},c={}){
 const documents=[{name:'synthetic <img src=x>.csv',document:parse(csv('depot',[{5:'2',9:'3,25',...d}]))},{name:'synthetic-account.csv',document:parse(csv('account',[{6:'-6,5',...c}]))}];
 const docs=documents.map(f=>f.document),m=blankModel();m.providers.push(createProvider({id:'p',name:'Flatex Synthetic'}));for(const [id,type]of [['d','securities'],['c','checking']])m.accounts.push(createAccount({id,providerId:'p',name:id,type},m));
 const ids=inspectNativeFlatexSourceIdentities(docs),assignments={},initial=reviewNativeFlatexBindings(m,ids);
 for(const ctx of initial.contexts){const accountId=ctx.sourceType==='depot'?'d':'c';assignments[ctx.sourceId]={accountId};const current=reviewNativeFlatexBindings(m,ids,assignments).contexts[ctx.index];Object.assign(assignments[ctx.sourceId],{confirmed:true,accountSnapshot:current.accountSnapshot});}
 const staging=()=>reviewNativeFlatexBindings(m,ids,assignments),audit=auditNativeFlatexSettlementAmounts(docs),links=inspectNativeFlatexOrderLinks(docs);
 const html=(s=staging(),a=audit)=>flatexNativeMarkup(documents,{staging:s,orderLinks:links,amountAudit:a});
 return {m,ids,assignments,staging,html,audit,documents,links};
}
test('calculated evidence requires both explicit confirmations and hides immediately when either is withdrawn',()=>{
 const f=fixture();assert.match(f.html(),/class="flatex-amount-review"/);assert.match(f.html(),/Brutto aus Stückzahl × Kurs: 6.5 EUR/);assert.match(f.html(),/Kontobeleg: -6.5 EUR/);assert.match(f.html(),/Ungeklärte Differenz: 0 EUR/);assert.match(f.html(),/Rechnerisch gleich; Kosten und Buchungswirkung bleiben ungeprüft/);
 for(const source of f.ids.rows.map(r=>r.sourceId)){f.assignments[source].confirmed=false;assert.doesNotMatch(f.html(),/class="flatex-amount-review"/);assert.match(f.html(),/Kontozuordnung beider Belege bestätigen/);f.assignments[source].confirmed=true;}
 assert.doesNotMatch(f.html(null),/class="flatex-amount-review"/);
});
test('stale revisions and changed account metadata suppress previously confirmed calculations',()=>{
 const f=fixture(),stale=reviewNativeFlatexBindings(f.m,f.ids,f.assignments,{stale:true});assert.doesNotMatch(f.html(stale),/class="flatex-amount-review"/);assert.match(f.html(stale),/Datenstand geändert/);f.m.accounts[0].name='changed';assert.doesNotMatch(f.html(),/class="flatex-amount-review"/);
});
test('manual and source conflicts cannot be relabelled as a successful amount comparison',()=>{
 const f=fixture();for(const status of ['manual-review','existing-conflict','conflict','overlap-review','source-review']){const s=f.staging(),changed=Object.freeze({...s,rows:s.rows.map((r,i)=>i? r:{...r,status,label:'Geschützter Prüffall'})});assert.doesNotMatch(f.html(changed),/class="flatex-amount-review"/);}
});
test('exact foreign-currency differences are shown without fees, FX or rounded precision claims',()=>{
 const f=fixture({10:'CHF'},{6:'-6,75',7:'CHF'});assert.match(f.html(),/Ungeklärte Differenz: -0.25 CHF/);assert.match(f.html(),/Keine automatische Gebühren-, Steuer- oder FX-Zuordnung/);assert.doesNotMatch(f.html(),/Brutto aus Stückzahl × Kurs: 6.5 EUR/);
 const p=fixture({5:'0,000000000000000001',9:'0,9'},{6:'-0,000000000000000001'});assert.doesNotMatch(p.html(),/class="flatex-amount-review"/);assert.match(p.html(),/keine gerundete Gleichheit/);
 const large=fixture({5:'9007199254740993,125',9:'2'},{6:'-18014398509481986,25'});assert.match(large.html(),/Brutto aus Stückzahl × Kurs: 18014398509481986.25 EUR/);
});
test('existing source/order UI, escaping and immutable input remain intact without amount evidence',()=>{
 const f=fixture(),before=JSON.stringify([f.documents,f.audit,f.staging()]);const h=f.html();assert.match(h,/&lt;img/);assert.doesNotMatch(h,/<img/);assert.equal((h.match(/class="performance-details"/g)||[]).length,2);assert.equal(JSON.stringify([f.documents,f.audit,f.staging()]),before);assert.doesNotMatch(f.html(f.staging(),null),/flatex-amount-review|flatex-amount-status/);assert.doesNotMatch(h,/type="submit"|gebührenfrei|Import bereit/);
});
test('mismatched audit/source locators and untrusted mutable reviews fail closed',()=>{
 const f=fixture(),foreign=fixture({11:'OTHER'}).audit;assert.throws(()=>f.html(f.staging(),foreign));assert.throws(()=>f.html(f.staging(),{...f.audit}));assert.throws(()=>f.html({...f.staging()}));
 const unsupported=fixture({6:'%'});assert.doesNotMatch(unsupported.html(),/class="flatex-amount-review"/);assert.match(unsupported.html(),/keine Prozent-/);
});
