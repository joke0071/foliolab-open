import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCashTerms,accountLiquidity,accountCashNominal,cashTermsFromForm} from '../src/cash-terms.js';
import {blankModel,createProvider,createAccount,createPosition,totalExactEUR,backup,safeImport} from '../src/model.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';

const terms=extra=>({version:1,status:'bound',fixedTerm:true,startDate:'2024-02-29',maturityDate:'2026-10-25',outcome:'unconfirmed',outcomeDate:null,evidence:null,renewalMaturityDate:null,...extra});
function fixture(){
 const m=blankModel(),pr=createProvider({name:'Testbank',type:'bank'});m.providers.push(pr);
 for(const [id,currency,quantity] of [['one','EUR','100'],['two','EUR','250'],['usd','USD','20']]){
  const a=createAccount({id,providerId:pr.id,name:id,type:'savings',currency,cashTerms:terms()},m);m.accounts.push(a);
  m.positions.push(createPosition({id:id+'-cash',providerId:pr.id,accountId:id,name:id,kind:'cash',quantity,price:1,currency,fxRate:0.9},m));
 }
 return m;
}
test('before, on and after maturity: passage of time never releases funds',()=>{
 const account={cashTerms:terms()};
 assert.equal(accountLiquidity(account,'2026-10-24').status,'bound');
 for(const day of ['2026-10-25','2026-10-26','2027-01-01'])assert.equal(accountLiquidity(account,day).status,'unknown');
 assert.equal(accountLiquidity(account,'2026-10-25').reason,'maturity-review');
});
test('missing maturity and future start remain explicit, no invented date',()=>{
 assert.equal(accountLiquidity({cashTerms:terms({maturityDate:null})},'2026-10-25').reason,'missing-maturity');
 assert.equal(accountLiquidity({cashTerms:terms()},'2024-02-28').status,'unknown');
 assert.equal(accountLiquidity({},'2026-10-25').status,'unknown');
});
test('real calendar dates, leap years and ordering are validated',()=>{
 assert.equal(normalizeCashTerms(terms()).startDate,'2024-02-29');
 for(const startDate of ['2025-02-29','2026-02-30','2026-13-01','2026-10-25'])assert.throws(()=>normalizeCashTerms(terms({startDate})));
 assert.throws(()=>accountLiquidity({},'2026-02-30'));
});
test('payment requires evidence and explicit free status, never a financial write',()=>{
 assert.throws(()=>normalizeCashTerms(terms({status:'free'})),/Festgeld/);
 assert.throws(()=>normalizeCashTerms(terms({outcome:'paid-out',status:'unknown'})),/Belegverweis/);
 const pending=terms({outcome:'paid-out',status:'unknown',outcomeDate:'2026-10-25',evidence:'Abrechnung A'});
 assert.equal(accountLiquidity({cashTerms:pending},'2026-10-25').status,'unknown');
 assert.equal(accountLiquidity({cashTerms:{...pending,status:'free'}},'2026-10-25').status,'free');
 assert.equal(accountLiquidity({cashTerms:{...pending,status:'free'}},'2026-10-24').status,'unknown');
});
test('renewal retains original contract, uses new maturity and requires new confirmation when due',()=>{
 const t=terms({outcome:'renewed',outcomeDate:'2026-10-25',evidence:'Wiederanlage B',renewalMaturityDate:'2027-10-25'});
 assert.equal(accountLiquidity({cashTerms:t},'2026-10-25').status,'bound');
 assert.equal(accountLiquidity({cashTerms:t},'2027-10-25').status,'unknown');
 assert.equal(accountLiquidity({cashTerms:{...t,renewalMaturityDate:null}},'2026-10-26').status,'bound');
 assert.throws(()=>normalizeCashTerms({...t,renewalMaturityDate:'2026-10-25'}));
});
test('multiple accounts share provider but never amounts; foreign currency needs no guessed FX',()=>{
 const m=fixture(),before=JSON.stringify(m);
 assert.deepEqual(m.accounts.map(a=>accountCashNominal(m,a)),['100','250','20']);
 assert.equal(JSON.stringify(m),before);
 m.positions[2].fxRate=null;m.positions[2].fxRateExact=null;
 assert.equal(accountCashNominal(m,m.accounts[2]),'20');
 m.positions[2].currency='EUR';assert.equal(accountCashNominal(m,m.accounts[2]),null);
});
test('metadata-only account edits preserve exact wealth, journal, positions and snapshots',()=>{
 const m=fixture(),wealth=totalExactEUR(m),financial=JSON.stringify({positions:m.positions,bookings:m.bookings,journal:m.journalEntries,flows:m.externalCashFlows,snapshots:m.snapshots});
 m.accounts[0]=createAccount({...m.accounts[0],cashTerms:terms({outcome:'paid-out',status:'free',outcomeDate:'2026-10-25',evidence:'Beleg C'})},m);
 assert.equal(totalExactEUR(m),wealth);
 assert.equal(JSON.stringify({positions:m.positions,bookings:m.bookings,journal:m.journalEntries,flows:m.externalCashFlows,snapshots:m.snapshots}),financial);
});
test('old account shape and v1/v2/v3 restores remain supported without new mandatory metadata',()=>{
 const m=fixture();m.accounts.forEach(a=>delete a.cashTerms);
 assert.deepEqual(safeImport(JSON.parse(backup(m))).accounts,m.accounts);
 for(const version of [1,2,3]){
  const raw=JSON.parse(backup(m));raw.version=version;
  if(version===1){delete raw.accounts;raw.positions.forEach(p=>delete p.accountId);}
  const restored=safeImport(raw);assert.equal(restored.positions.length,3);assert.ok(restored.accounts.every(a=>!Object.hasOwn(a,'cashTerms')));
 }
});
test('open and encrypted backup roundtrip retains optional metadata exactly',async()=>{
 const m=fixture(),raw=backup(m),restored=safeImport(JSON.parse(raw));
 assert.deepEqual(restored.accounts,m.accounts);
 const encrypted=await encryptBackup(raw,'test-password-only');
 const decrypted=await decryptBackup(JSON.parse(encrypted),'test-password-only');
 assert.deepEqual(safeImport(JSON.parse(decrypted)).accounts,m.accounts);
});
test('malformed metadata fails restore closed and cannot silently disappear',()=>{
 for(const bad of [[],true,{version:2},terms({status:'invented'}),terms({outcomeDate:'2026-10-25'}),terms({evidence:{bad:1}})]){
  const m=fixture(),raw=JSON.parse(backup(m));raw.accounts[0].cashTerms=bad;
  assert.throws(()=>safeImport(raw));
 }
});
test('form confirmation is explicit and future actual payouts are rejected',()=>{
 const v={cashTermsEnabled:'on',liquidityStatus:'free',fixedTerm:'on',termStartDate:'2024-02-29',termMaturityDate:'2026-10-25',termOutcome:'paid-out',termOutcomeDate:'2026-10-25',termEvidence:'Beleg D'};
 assert.throws(()=>cashTermsFromForm(v,null,'2026-10-25'),/ausdrücklich/);
 const valid=cashTermsFromForm({...v,termEvidenceConfirmed:'on'},null,'2026-10-25');
 assert.deepEqual(cashTermsFromForm(v,valid,'2026-10-25'),valid);
 assert.throws(()=>cashTermsFromForm({...v,termEvidenceConfirmed:'on'},null,'2026-10-24'),/Zukunft/);
 assert.equal(cashTermsFromForm({},valid,'2026-10-25'),null);
});
