import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,createProvider,createAccount,createPosition} from '../src/model.js';
import {previewCSV,parseCSV,inferMapping} from '../src/csv-import.js';

function setup(){
 const m=blankModel();
 for(const name of ['Flatex Österreich','Zweitbroker']){
  const provider=createProvider({name});m.providers.push(provider);
  const account=createAccount({providerId:provider.id,name:'Depot',type:'securities'},m);
  m.accounts.push(account);
  const position=createPosition({providerId:provider.id,accountId:account.id,kind:'etf',
    name:'All-World',isin:'IE00BK5BQT80',quantity:0,price:100,currency:'EUR'},m);
  m.positions.push(position);
 }
 const f=m.providers.find(p=>p.name.startsWith('Flatex'));
 const account=m.accounts.find(a=>a.providerId===f.id);
 return {m,account,position:m.positions.find(p=>p.accountId===account.id)};
}
test('duplicate ISIN across brokers resolves only within chosen Flatex custody account',()=>{
 const {m,account,position}=setup();
 const csv=parseCSV('Datum;Typ;ISIN;Menge;Kurs\n2026-10-20;Kauf;IE00BK5BQT80;2;100');
 const mapped=inferMapping(csv.headers);
 const before=JSON.stringify(m);
 const result=previewCSV(m,csv,mapped,{allowedAccountId:account.id});
 assert.equal(result.ready,1);
 assert.equal(result.issues.length,0);
 assert.equal(result.rows[0].row.positionId,position.id);
 assert.equal(JSON.stringify(m),before);
 const other=m.positions.find(p=>p.id!==position.id);
 assert.equal(other.quantityExact,'0');
});
test('explicit cross-account override cannot defeat custody boundary',()=>{
 const {m,account,position}=setup();
 const other=m.positions.find(p=>p.id!==position.id);
 const csv=parseCSV('Datum;Typ;ISIN;Menge;Kurs\n2026-10-20;Kauf;IE00BK5BQT80;2;100');
 const result=previewCSV(m,csv,inferMapping(csv.headers),{
  allowedAccountId:account.id,positionOverrides:{2:other.id}
 });
 assert.equal(result.ready,0);
 assert.equal(result.issues.length,1);
 assert.match(result.issues[0].message,/nicht eindeutig|gehört nicht|zuordnen/);
 assert.equal(position.quantityExact,'0');
});
test('without custody scope existing universal CSV behavior remains deliberately unchanged',()=>{
 const {m}=setup(),csv=parseCSV('Datum;Typ;ISIN;Menge;Kurs\n2026-10-20;Kauf;IE00BK5BQT80;2;100');
 const result=previewCSV(m,csv,inferMapping(csv.headers));
 assert.equal(result.ready,0);
 assert.equal(result.issues.length,1);
 assert.match(result.issues[0].message,/nicht eindeutig/);
});

test('foreign currency trades require a user-provided historical rate, never implicit FX',()=>{
 const m=blankModel(),provider=createProvider({name:'Flatex Österreich'});m.providers.push(provider);
 const dep=createAccount({providerId:provider.id,name:'Aktien USD',type:'securities'},m);m.accounts.push(dep);
 const p=createPosition({providerId:provider.id,accountId:dep.id,kind:'stock',
  name:'US-Aktie',isin:'US0378331005',quantity:0,price:150,currency:'USD'},m);m.positions.push(p);
 const csv=parseCSV('Datum;Typ;ISIN;Menge;Kurs\n2026-10-20;Kauf;US0378331005;2;150');
 const missing=previewCSV(m,csv,inferMapping(csv.headers),{allowedAccountId:dep.id});
 assert.equal(missing.ready,0);
 assert.match(missing.issues[0].message,/Historischer Wechselkurs fehlt/);
 const complete=previewCSV(m,csv,inferMapping(csv.headers),{
  allowedAccountId:dep.id,fxRateOverrides:{2:'0,92'}
 });
 assert.equal(complete.ready,1);
 assert.equal(complete.rows[0].row.fxRate,'0.92');
 assert.equal(m.positions[0].quantityExact,'0');
});
