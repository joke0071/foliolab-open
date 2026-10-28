import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {executeTransaction} from '../src/transactions.js';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectNativeFlatexSourceIdentities as inspect,bookingOwnership} from '../src/import-identity.js';
import {reviewNativeFlatexBindings as review,flatexNativeBindingMarkup as markup,flatexNativeMarkup} from '../src/flatex-native-ui.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
const D=(rows=[{}])=>parseFlatexNativeCSV(csv('depot',rows)),C=(rows=[{}])=>parseFlatexNativeCSV(csv('account',rows));
function fixture(){const m=blankModel();m.providers.push(createProvider({id:'p',name:'Flatex Synthetic'}),createProvider({id:'foreign',name:'Other Synthetic'}));for(const [id,type,providerId]of [['d1','securities','p'],['d2','securities','p'],['c1','checking','p'],['s1','savings','p'],['w1','wallet','p'],['x1','exchange','p'],['f1','securities','foreign']])m.accounts.push(createAccount({id,name:id,type,providerId},m));m.positions.push(createPosition({id:'asset',providerId:'p',accountId:'d1',name:'Synthetic asset',kind:'etf',quantity:0,price:1},m));return m;}
function confirmed(m,ids,accountId='d1'){const source=ids.rows[0].sourceId,a={[source]:{accountId,confirmed:false}},c=review(m,ids,a).contexts[0];return {[source]:{accountId,confirmed:true,accountSnapshot:c.accountSnapshot}};}
function seed(m,ids){const event=executeTransaction(m,{positionId:'asset',type:'buy',date:'2025-01-01',quantity:1,unitPrice:50,feeEUR:0,taxEUR:0}),b=m.bookings.find(b=>b.id===event.id);m.journalEntries.find(j=>j.id===b.journalEntryId).source='csv';b.importSource={version:1,...ids.rows[0].identity,accountId:b.accountId,sourcePayload:JSON.stringify({sourceEvidence:ids.rows[0].identity.sourceEvidence}),fileId:'synthetic-proof',occurrence:1,ownership:'imported',ownedSnapshot:''};delete b.importSource.sourceEvidence;delete b.importSource.costsVerified;b.importSource.ownedSnapshot=bookingOwnership(m,b);return b;}
test('explicit source scope/account choice and separate confirmation are mandatory even for one account',()=>{
 const m=fixture(),ids=inspect([D()]),r=review(m,ids);assert.equal(r.confirmed,0);assert.equal(r.contexts[0].accountId,'');assert.equal(r.rows[0].status,'unassigned');
 const selected={[ids.rows[0].sourceId]:{accountId:'d1'}},p=review(m,ids,selected);assert.equal(p.rows[0].status,'unconfirmed');assert.equal(p.confirmed,0);assert.equal(review(m,ids,confirmed(m,ids)).rows[0].status,'source-only');
 m.accounts=m.accounts.filter(a=>a.id==='d1');assert.equal(review(m,ids).contexts[0].accountId,'');
});
test('choices reuse custody rules and keep source account mapping separate from cash/FX ownership',()=>{
 const m=fixture(),r=review(m,inspect([D(),C()]));assert.deepEqual(r.contexts[0].options.map(a=>a.id),['d1','d2']);assert.deepEqual(r.contexts[1].options.map(a=>a.id),['d1','d2','c1','s1']);
 m.accounts.find(a=>a.id==='c1').currency='CHF';assert.ok(review(m,inspect([C()])).contexts[0].options.some(a=>a.id==='c1'));assert.equal(review(m,inspect([D()]),{[r.contexts[0].sourceId]:{accountId:'w1',confirmed:true}}).rows[0].status,'unassigned');
});
test('scope/side separation and missing contexts never leak confirmation between sources',()=>{
 const m=fixture(),ids=inspect([D(),D([{11:'SECOND',8:'OTHER'}]),C(),D([{11:''}])]),r=review(m,ids,confirmed(m,ids));assert.equal(r.contexts.length,4);assert.equal(r.confirmed,1);assert.equal(r.rows[0].status,'source-only');assert.equal(r.rows[1].status,'unassigned');assert.equal(r.rows[2].status,'unassigned');assert.equal(r.rows[3].status,'source-review');assert.equal(r.contexts[3].disabled,true);
});
test('changed/removed/provider-renamed accounts and stale revision invalidate confirmations',()=>{
 const original=fixture(),ids=inspect([D()]),bindings=confirmed(original,ids);
 for(const change of [m=>m.accounts.find(a=>a.id==='d1').name='Renamed',m=>m.accounts=m.accounts.filter(a=>a.id!=='d1'),m=>m.providers[0].name='Other']){const m=structuredClone(original);change(m);const r=review(m,ids,bindings);assert.equal(r.confirmed,0);assert.notEqual(r.rows[0].status,'source-only');}
 const stale=review(original,ids,bindings,{stale:true});assert.equal(stale.confirmed,0);assert.equal(stale.rows[0].status,'stale');assert.ok(stale.contexts.every(c=>c.disabled));
});
test('confirmed mapping never overrides raw overlap/conflict/missing reference guards',()=>{
 const m=fixture();for(const [docs,status]of [[[D(),D()],'overlap-review'],[[D(),D([{2:'05.01.1999'}])],'conflict'],[[D([{8:''}])],'source-review']]){const ids=inspect(docs),r=review(m,ids,confirmed(m,ids));assert.ok(r.rows.every(r=>r.status===status));assert.equal(r.rows.length,docs.length);assert.equal(r.writeEnabled,false);}
});
test('existing source proof is informational and does not certify synthetic booking economics',()=>{
 const m=fixture(),ids=inspect([D()]);seed(m,ids);const before=JSON.stringify(m),r=review(m,ids,confirmed(m,ids));assert.equal(r.rows[0].status,'existing-source');assert.match(r.rows[0].label,/Buchungswirkung ungeprüft/);assert.equal(JSON.stringify(m),before);assert.equal(r.ready,false);assert.equal('simulated' in r,false);
});
test('manual edits, raw proof changes, malformed provenance and duplicate existing identities stay protected',()=>{
 const ids=inspect([D()]);for(const [edit,status]of [[b=>b.notes='User correction','manual-review'],[b=>b.importSource.ownership='manual','manual-review'],[b=>b.importSource.sourcePayload=JSON.stringify({sourceEvidence:{version:1,payloadDigest:'a'.repeat(64)}}),'existing-conflict'],[b=>b.importSource.sourcePayload='invalid','existing-conflict']]){const m=fixture(),b=seed(m,ids);edit(b);const before=JSON.stringify(m);assert.equal(review(m,ids,confirmed(m,ids)).rows[0].status,status);assert.equal(JSON.stringify(m),before);}
 const m=fixture(),b=seed(m,ids);m.bookings.push({...structuredClone(b),id:'second'});assert.equal(review(m,ids,confirmed(m,ids)).rows[0].status,'existing-conflict');
});
test('unproven legacy bookings are flagged without automatic matching or deduplication',()=>{
 const m=fixture(),ids=inspect([D()]),b=seed(m,ids);delete b.importSource;const r=review(m,ids,confirmed(m,ids));assert.equal(r.legacyReview,true);assert.equal(r.rows[0].status,'source-only');assert.match(markup(r),/anderer Herkunft/);assert.equal(r.writeEnabled,false);
});
test('context paging, hostile source/account labels and existing source statuses are escaped and bounded',()=>{
 const m=fixture();m.providers[0].name='Flatex <svg>';m.accounts[0].name='<img src=x>';const d=D(Array.from({length:25},(_,i)=>({11:'SYN-'+i,8:'BANK-'+i}))),ids=inspect([d]),r=review(m,ids),html=markup(r);assert.equal((html.match(/<fieldset/g)||[]).length,20);assert.match(html,/Weitere 5 Kontexte/);assert.match(html,/&lt;svg/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<svg|<img/);assert.doesNotMatch(markup(r,{limit:40}),/flatexBindingsShowMore/);
 const full=flatexNativeMarkup([{name:'synthetic.csv',document:d}],{staging:r});assert.match(full,/Portfolio-Konto auswählen/);assert.match(full,/flatex-source-status/);assert.equal((full.match(/class="performance-details"/g)||[]).length,25);
 for(const limit of [0,5001,1.5,NaN])assert.throws(()=>markup(r,{limit}));
});
test('review is deeply immutable and never freezes or changes portfolio/source/assignment inputs',()=>{
 const m=fixture(),ids=inspect([D()]),bindings=confirmed(m,ids),before=JSON.stringify([m,ids,bindings]),r=review(m,ids,bindings);assert.ok(Object.isFrozen(r.contexts[0].options[0]));assert.ok(Object.isFrozen(r.rows[0].reasons));assert.throws(()=>{r.contexts[0].confirmed=false;},TypeError);assert.equal(JSON.stringify([m,ids,bindings]),before);assert.equal(Object.isFrozen(m.accounts[0]),false);assert.equal('commit' in r,false);
 assert.throws(()=>review(m,{...ids}));assert.throws(()=>review({...m,accounts:[m.accounts[0],m.accounts[0]]},ids));
});
