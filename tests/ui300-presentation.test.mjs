import test from 'node:test';
import assert from 'node:assert/strict';
import {wealthChangePresentation} from '../src/dashboard-ui.js';
import {money} from '../src/model.js';
const dates=d=>d;
test('UI300 period difference uses exact selected endpoints and changes no evidence',()=>{
 const samples=[{date:'2026-01-01',totalEURExact:'100.000000000000000001'},{date:'2026-02-01',totalEURExact:'120'},{date:'2026-02-04',totalEURExact:'130.000000000000000003'}],before=structuredClone(samples);
 const view=wealthChangePresentation({basis:'observed'},samples,money,dates,{period:true});assert.equal(view.delta,'30.000000000000000002');assert.match(view.note,/2026-01-01 – 2026-02-04 · inkl. Geldflüsse · keine Rendite/);
 assert.equal(wealthChangePresentation({basis:'observed'},samples.slice(1),money,dates,{period:true}).delta,'10.000000000000000003');assert.deepEqual(samples,before);
 // The existing legacy summary retains its previous last-two-observation scope.
 assert.equal(wealthChangePresentation({basis:'observed'},samples,money,dates).delta,'10.000000000000000003');
});
test('UI300 incomplete periods never invent a zero or bridge reconstructed gaps',()=>{
 const samples=[{date:'2026-01-01',total:100},{date:'2026-01-02',total:110,breakBefore:true},{date:'2026-01-03',total:120}];
 for(const wealth of [{basis:'partial'},{basis:'unavailable',reason:'Nachweise fehlen'},{basis:'reconstructed'}])assert.equal(wealthChangePresentation(wealth,samples,money,dates,{period:true}).value,'–');
 assert.equal(wealthChangePresentation({basis:'reconstructed'},samples.slice(1),money,dates,{period:true}).delta,'10');
 for(const rows of [[],samples.slice(0,1)])assert.equal(wealthChangePresentation({basis:'observed',reason:'Belege fehlen'},rows,money,dates,{period:true}).value,'–');
 assert.equal(wealthChangePresentation({basis:'observed'},[{date:'2026-01-01',total:5},{date:'2026-01-02',total:5}],money,dates,{period:true}).delta,'0');
 assert.equal(wealthChangePresentation({basis:'observed'},[{date:'2026-01-01',total:5},{date:'2026-01-02',total:2}],money,dates,{period:true}).delta,'-3');
});

test('UI300 partial automatic observations never become comparable period endpoints or bridges',()=>{
 const rows=[{date:'2026-01-01',total:100,valuationStatus:'manual'},{date:'2026-01-02',total:20,valuationStatus:'partial',source:'current'},{date:'2026-01-03',total:120,valuationStatus:'observed'}];
 const before=structuredClone(rows);
 for(const selected of [rows,rows.slice(0,2),rows.slice(1)]){const view=wealthChangePresentation({basis:'observed'},selected,money,dates,{period:true});assert.equal(view.delta,null);assert.equal(view.value,'–');assert.match(view.note,/unvollständig bewerteten Stichtag/);}
 assert.equal(wealthChangePresentation({basis:'observed'},[rows[0],rows[2]],money,dates,{period:true}).delta,'20');
 assert.equal(wealthChangePresentation({basis:'observed'},rows,money,dates).delta,'100','legacy last-two presentation scope remains unchanged');assert.deepEqual(rows,before);
});
