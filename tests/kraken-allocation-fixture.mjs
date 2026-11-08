import {readFileSync} from 'node:fs';
import {krakenCSV} from './kraken-ledger-fixture.mjs';
import {fixture} from './kraken-import-fixture.mjs';
import {prepareKrakenSourcePlan} from '../src/kraken-source-plan.js';
export const allocationOracle=JSON.parse(readFileSync(new URL('../docs/release-evidence/uh05-kraken-allocation-oracle.json',import.meta.url),'utf8'));
export const allocationSource=(rows=allocationOracle.rows)=>krakenCSV(rows);
export function allocationFixture(rows=allocationOracle.rows){
 const text=allocationSource(rows),f=fixture(text);f.m.settings.autoRefresh=false;
 for(const p of f.m.openingPositions)p.asOf='1999-02-01';
 return {...f,text,files:[{name:'Synthetic Kraken allocation.csv',text}],choices:{kraken:{assignments:f.assignments,openingConfirmed:true,confirmed:true}},group:prepareKrakenSourcePlan([text]).groups[0].id};
}
