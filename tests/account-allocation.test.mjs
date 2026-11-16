import test from 'node:test';
import assert from 'node:assert/strict';
import {accountAllocation,renderAccountAllocation} from '../src/allocation-ui.js';
import {renderProviderAccounts} from '../src/dashboard-ui.js';
import {blankModel,createProvider,createAccount,createPosition,valueEUR,money,escapeHTML} from '../src/model.js';
const now=Date.parse('2026-11-13T12:00:00Z');
function fixture(){
 const m=blankModel(),provider=createProvider({name:'Synthetische Bank'});m.providers.push(provider);
 const account=createAccount({name:'Depot',type:'securities',providerId:provider.id},m);m.accounts.push(account);
 const add=(name,amount,extra={})=>{
  const p=createPosition({name,kind:'etf',quantity:1,price:amount,providerId:provider.id,accountId:account.id,
   quoteAsOf:'2026-11-13',quoteSource:'synthetic',quoteQuality:'provider-timestamp',...extra},m);
  m.positions.push(p);return p;
 };
 return {m,provider,account,add};
}
const weights=ps=>accountAllocation(ps,valueEUR,{depot:true,now});
const frozenCopy=m=>JSON.stringify(m);
test('Account 40/30/20/10 oracle and rendering preserve the whole input model',()=>{
 const {m,add}=fixture();[400,300,200,100].forEach((v,i)=>add('ETF '+i,v));
 const before=frozenCopy(m),a=weights(m.positions);
 assert.deepEqual(m.positions.map(p=>a.shares.get(p).percent),[40,30,20,10]);
 assert.equal([...a.shares.values()].reduce((n,s)=>n+s.percent,0),100);
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML);
 for(const expected of [40,30,20,10])assert.ok(html.includes('Anteil am Depot: '+expected+' %'));
 assert.equal((html.match(/class="account-allocation"/g)||[]).length,4);
 assert.match(html,/positive Anlagen inkl\. Guthaben/);
 assert.equal(frozenCopy(m),before);
});
test('Other accounts/providers cannot dilute a depot; mixed cash is included, simple cash is unchanged',()=>{
 const {m,provider,account,add}=fixture();add('ETF',400);add('Depotcash',100,{kind:'cash',quantity:100,price:1});
 const savings=createAccount({name:'Tagesgeld',type:'savings',providerId:provider.id},m);m.accounts.push(savings);
 m.positions.push(createPosition({name:'Guthaben',kind:'cash',quantity:5000,price:1,providerId:provider.id,accountId:savings.id},m));
 const other=createProvider({name:'Andere Bank'});m.providers.push(other);
 const b=createAccount({name:'Anderes Depot',type:'securities',providerId:other.id},m);m.accounts.push(b);
 m.positions.push(createPosition({name:'Andere Anlage',kind:'etf',quantity:1,price:9000,providerId:other.id,accountId:b.id},m));
 const a=weights(m.positions.filter(p=>p.accountId===account.id));
 assert.deepEqual([...a.shares.values()].map(s=>s.percent),[80,20]);
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML);
 assert.ok(html.includes('Anteil am Depot: 80 %'));assert.ok(html.includes('Anteil am Depot: 20 %'));
 assert.equal((html.match(/class="account-allocation"/g)||[]).length,3);
 assert.match(html,/simple-cash-account/);
});
test('Excluded duplicates, liabilities and negative values do not produce negative or oversized rings',()=>{
 const {m,add}=fixture();const asset=add('Anlage',100),excluded=add('Duplikat',900,{valuationMode:'excluded'});
 const debt=add('Schuld',70,{valuationMode:'liability',economicRole:'borrowed'}),negative=add('Negativer Beitrag',20);
 const a=accountAllocation(m.positions,p=>p===negative?-20:valueEUR(p),{depot:true,now});
 assert.equal(a.shares.get(asset).percent,100);
 for(const p of [excluded,debt,negative])assert.equal(a.shares.get(p).percent,null);
 assert.match(a.shares.get(excluded).name,/Nicht doppelt summiert/);
 assert.match(a.shares.get(debt).name,/Verbindlichkeit/);
 assert.match(a.note,/Verbindlichkeiten ohne Anteil/);
});
test('Missing price/UNKNOWN FX/nonfinite callback suppress the whole account share rather than imply 100%',()=>{
 for(const extra of [{price:0,quoteSource:''},{currency:'USD',fxRate:null,fxRateExact:'UNKNOWN'}]){
  const {m,add}=fixture();add('Bekannt',100);add('Unbekannt',50,extra);
  const a=weights(m.positions);
  assert.deepEqual([...a.shares.values()].map(s=>s.percent),[null,null]);
  assert.match(a.note,/Gewichtung unvollständig/);
  assert.match(renderProviderAccounts(m,money,valueEUR,escapeHTML),/Nicht bewertet/);
 }
 const {m,add}=fixture();add('A',100);const unknown=add('B',10);
 for(const invalid of [null,undefined,NaN,Infinity,'10']){
  const a=accountAllocation(m.positions,p=>p===unknown?invalid:valueEUR(p),{now});
  assert.deepEqual([...a.shares.values()].map(s=>s.percent),[null,null]);
 }
});
test('Empty/all-zero/all-negative accounts have no denominator; real zero differs from unavailable',()=>{
 for(const amounts of [[],[0,0],[-10,-20]]){
  const {m,add}=fixture();amounts.forEach((v,i)=>add('Anlage '+i,1,{quantity:Math.abs(v)}));
  const a=accountAllocation(m.positions,p=>amounts[m.positions.indexOf(p)],{depot:true,now});
  assert.ok([...a.shares.values()].every(s=>s.percent===null));
  assert.match(a.note,/Kein bewertbarer positiver Gesamtwert/);
 }
 const {m,add}=fixture();const zero=add('Nullbestand',0,{quantity:0});add('Anlage',100);
 assert.equal(weights(m.positions).shares.get(zero).percent,0);
});
test('Archive preserves economic weight and saved/stale/derived/undated valuation is explicitly qualified',()=>{
 const {m,add}=fixture();const p=add('Archiviert',400,{archived:true}),other=add('Aktiv',600);
 assert.deepEqual([...weights(m.positions).shares.values()].map(s=>s.percent),[40,60]);
 for(const extra of [{quoteAsOf:'2026-01-01'},{priceStatus:'Aus Stichtag abgeleitet'},{quoteAsOf:''}]){
  const a=weights([p,{...other,...extra}]);
  assert.deepEqual([...a.shares.values()].map(s=>s.percent),[40,60]);
  assert.match(a.note,/Nach gespeicherten Bewertungen/);
  assert.match(a.shares.get(p).name,/nach gespeicherten Bewertungen/);
 }
});
test('Known EUR conversion, tiny positive shares and rerender use current supplied values',()=>{
 const {m,add}=fixture();const usd=add('USD',250,{currency:'USD',fxRate:.8,fxRateExact:'0.8',fxRateDate:'2026-11-13',fxSource:'synthetic'});
 const eur=add('EUR',800);let a=weights(m.positions);
 assert.deepEqual([...a.shares.values()].map(s=>s.percent),[20,80]);
 a=accountAllocation(m.positions,p=>p===usd?400:600,{depot:true,now});
 assert.deepEqual([...a.shares.values()].map(s=>s.percent),[40,60]);
 const tiny=weights([usd,{...eur,price:1e9,priceExact:'1000000000'}]).shares.get(usd);
 assert.equal(tiny.label,'< 0,1 %');assert.ok(tiny.percent>0);
});
test('Static markup escapes labels and adds no button, focus stop, listener or animation',()=>{
 const html=renderAccountAllocation({percent:40,label:'40 % <img>',name:'Anteil <img>'},escapeHTML);
 assert.match(html,/stroke-dasharray="40\.00000000 60\.00000000"/);
 assert.match(html,/role="img"/);assert.match(html,/focusable="false"/);
 assert.doesNotMatch(html,/<img>|<button|tabindex|on\w+=|<animate/);
 assert.match(html,/&lt;img&gt;/);
 const {m,provider,add}=fixture();const p=add('ETF <img>',100);
 const view=renderProviderAccounts(m,money,valueEUR,escapeHTML,new Set([provider.id]),new Set([p.id]));
 assert.match(view,/data-position-id="[^"]+" open/);
 assert.match(view,/Details einklappen · Anteil am Depot/);assert.doesNotMatch(view,/<img>/);
});
test('1000 positions are read-only and a rounded display never changes the underlying shares',()=>{
 const {m,add}=fixture();for(let i=0;i<1000;i++)add('Position '+i,1);
 const before=frozenCopy(m),a=weights(m.positions);
 assert.equal(a.shares.size,1000);for(const s of a.shares.values())assert.equal(s.percent,.1);
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML);
 assert.equal((html.match(/class="account-allocation"/g)||[]).length,1000);
 assert.equal(frozenCopy(m),before);
});
