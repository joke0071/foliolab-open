// Local synthetic UH05 qualification on exact v286 modules. No network or IDB.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {ledgerModel,ledgerEvidence,ledgerCSV,at,txid} from './ledger-live-fixture.mjs';
import {fixture as krakenFixture,source as krakenSource} from './kraken-import-fixture.mjs';
import {fixture as pandaFixture,source as pandaSource} from './bitpanda-import-fixture.mjs';
import {fixture as flatexFixture} from './flatex-net-fixture.mjs';
import {previewUnifiedBitcoin,confirmUnifiedBitcoin,readUnifiedBitcoinFiles} from '../src/unified-bitcoin.js';
import {previewKrakenImport,confirmKrakenImport} from '../src/kraken-import.js';
import {previewBitpandaImport,confirmBitpandaImport} from '../src/bitpanda-import.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {importCSV} from '../src/csv-import.js';
import {backup,safeImport,snapshot} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
import {createCompleteBackup,unpackCompleteBackup} from '../src/complete-backup.js';
import {encryptBackup,decryptBackup} from '../src/crypto-backup.js';
function setup(){
 const m=ledgerEvidence(ledgerModel());
 m.providers[0].id='ledger';m.accounts[0].providerId='ledger';m.positions[0].providerId='ledger';
 const header='Currency,Fiat Amount,Bittr Fee,Bitcoin Purchased,Mining Fee,Bitcoin Amount,Bitcoin Transaction ID,Timestamp\n';
 const rows=['2025-01-01 12:00:00Z','2025-01-01 12:01:00Z'].map(time=>'EUR,500,9,0.0125,0.0001,0.0124,'+txid+','+time);
 const bitcoin=readUnifiedBitcoinFiles([header+rows.join('\n'),header+rows[0],ledgerCSV(),ledgerCSV()]);
 assert.deepEqual(bitcoin.receipts,m.purchaseEvidence.receipts);assert.equal(bitcoin.duplicateReceipts,1);assert.equal(bitcoin.operations.length,1);delete m.purchaseEvidence;
 const kr=krakenFixture(),bp=pandaFixture(),f=flatexFixture();
 for(const [id,q]of [['etf','2'],['cash','78.25']])Object.assign(f.model.positions.find(p=>p.id===id),{quantityExact:q,quantity:Number(q)});
 for(const other of [kr.m,bp.m,f.model])for(const k of ['providers','accounts','positions','openingPositions'])m[k].push(...structuredClone(other[k]));
 f.options={...f.options,mode:'net-backfill',openingQuantities:{etf:'0',cash:'100'},expectedClosing:{etf:'2',cash:'78.25'},closingConfirmed:true};
 m.settings.autoRefresh=false;
 return {m,bitcoin,kr,bp,f};
}
const economic=m=>({positions:m.positions.map(p=>[p.id,p.quantityExact,p.costBasisExact,p.realizedPnLExact]).sort(),bookings:m.bookings.map(b=>[b.positionId,b.cashPositionId,b.type,b.quantityExact,b.amountExactEUR,b.feeEUR,b.taxEUR,b.importSource?.sourceId]).sort(),postings:m.journalEntries.map(j=>[j.date,j.type,j.postings.map(p=>[p.role,p.positionId,p.quantityDeltaExact,p.amountBookEURExact]).sort()]).sort(),flows:m.externalCashFlows.map(f=>[f.date,f.positionId,f.amountExactEUR,f.type]).sort()});

export function fixture(){
 const f=setup(),header='Currency,Fiat Amount,Bittr Fee,Bitcoin Purchased,Mining Fee,Bitcoin Amount,Bitcoin Transaction ID,Timestamp\n';
 const row=time=>'EUR,500,9,0.0125,0.0001,0.0124,'+txid+','+time;
 const quote=v=>'"'+v.replaceAll('"','""')+'"';
 const files=[{name:'synthetic-bittr.csv',text:header+[row('2025-01-01 12:00:00Z'),row('2025-01-01 12:01:00Z')].join('\n')},{name:'synthetic-bittr-overlap.csv',text:header+row('2025-01-01 12:00:00Z')},...['synthetic-ledger.csv','synthetic-ledger-repeat.csv'].map(name=>({name,text:ledgerCSV()})),...['synthetic-kraken.csv','synthetic-kraken-repeat.csv'].map(name=>({name,text:krakenSource()})),...['synthetic-bitpanda.csv','synthetic-bitpanda-repeat.csv'].map(name=>({name,text:pandaSource()})),...f.f.documents.map((d,i)=>({name:'synthetic-flatex-'+i+'.csv',text:[d.columns.map(c=>quote(c.header)).join(';'),...d.rows.map(r=>r.fields.map(quote).join(';'))].join('\n')}))];
 return {...f,files,choices:{bitcoin:{positionId:'wallet',confirmed:true,externalFunding:true,bitcoinOnly:true},kraken:{assignments:f.kr.assignments,confirmed:true,openingConfirmed:true},bitpanda:{assignments:f.bp.assignments,...f.bp.options,confirmed:true},flatex:{assignments:f.f.assignments,options:f.f.options,confirmed:true}}};
}
export {economic};
