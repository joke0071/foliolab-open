import assert from 'node:assert/strict';
import test from 'node:test';
import {positionValueLabel} from '../src/quote-quality.js';
import {renderProviderAccounts} from '../src/dashboard-ui.js';
import {blankModel,createProvider,createAccount,createPosition,valueEUR,money,escapeHTML} from '../src/model.js';
const missing={kind:'etf',quantityExact:'2.5',priceExact:'0'};
test('missing ETF/crypto quote is not presented as zero, without mutating input',()=>{
 for(const kind of ['etf','stock','fund','crypto']){const p={...missing,kind},before=JSON.stringify(p);assert.equal(positionValueLabel(p,0,money),'Nicht bewertet');assert.equal(JSON.stringify(p),before);}
});
test('real zero holdings and sourced zero quotes remain numeric; stored prices stay visible',()=>{
 assert.equal(positionValueLabel({...missing,quantityExact:'0'},0,money),money(0));
 assert.equal(positionValueLabel({...missing,quoteSource:'Synthetic provider'},0,money),money(0));
 assert.equal(positionValueLabel({...missing,valuationMode:'excluded'},0,money),money(0));
 assert.equal(positionValueLabel({...missing,priceExact:'12',priceStatus:'Gespeicherter Stichtag'},30,money),money(30));
 assert.equal(positionValueLabel({kind:'cash',quantity:0,price:1},0,money),money(0));
});
test('dashboard individual holding repeats the unknown label without changing aggregate calculations',()=>{
 const m=blankModel(),p=createProvider({id:'p',name:'Synthetic'});m.providers.push(p);const a=createAccount({id:'a',providerId:p.id,name:'Synthetic'},m);m.accounts.push(a);m.positions.push(createPosition({id:'missing',providerId:p.id,accountId:a.id,name:'Synthetic missing ETF',kind:'etf',quantity:2.5,price:0},m));const before=JSON.stringify(m);
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML);assert.match(html,/class="provider-holding-right"><strong>Nicht bewertet<\/strong>/);assert.equal(JSON.stringify(m),before);assert.equal(valueEUR(m.positions[0]),0);
});
