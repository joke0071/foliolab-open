import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCashTermsOverview,cashTermsAccountHint} from '../src/cash-terms-ui.js';
import {escapeHTML} from '../src/model.js';
const account=(id,extra={})=>({id,providerId:'bank',name:id,currency:'USD',cashTerms:{version:1,status:'bound',fixedTerm:true,startDate:'2024-02-29',maturityDate:'2026-10-25',outcome:'unconfirmed'},...extra});
test('overview is absent for untouched old portfolios',()=>{
 assert.equal(renderCashTermsOverview({accounts:[{id:'old'}],positions:[]},escapeHTML),'');
});
test('overview sorts actual maturities, distinguishes unknown metadata, escapes and avoids EUR conversion',()=>{
 const m={providers:[{id:'bank',name:'<Bank>'}],accounts:[account('later',{cashTerms:{...account('x').cashTerms,maturityDate:'2027-01-01'}}),account('<first>'),account('old',{cashTerms:undefined})],positions:[{kind:'cash',accountId:'<first>',currency:'USD',quantityExact:'20',fxRate:null},{kind:'cash',accountId:'old',currency:'USD',quantityExact:'5'}]};
 const before=JSON.stringify(m),html=renderCashTermsOverview(m,escapeHTML,{asOf:'2026-10-25'});
 assert.ok(html.indexOf('data-cash-account="&lt;first&gt;"')<html.indexOf('data-cash-account="later"'));
 assert.match(html,/20 USD erfasst/);assert.doesNotMatch(html,/EUR|<Bank>|<first>/);
 assert.match(html,/1 gebunden · 2 nicht bestätigt/);assert.match(html,/Verfügbarkeit noch nicht angegeben/);
 assert.equal(JSON.stringify(m),before);
});
test('card hint marks maturity reached rather than claiming payment and handles missing new maturity',()=>{
 assert.match(cashTermsAccountHint(account('term'),escapeHTML,'2026-10-25'),/Fälligkeit erreicht/);
 const renewed=account('term');Object.assign(renewed.cashTerms,{outcome:'renewed',outcomeDate:'2026-10-25',evidence:'Beleg'});
 const html=cashTermsAccountHint(renewed,escapeHTML,'2026-10-26');assert.match(html,/Gebunden/);assert.match(html,/Wiederanlage/);assert.match(html,/Fälligkeit fehlt/);
});
