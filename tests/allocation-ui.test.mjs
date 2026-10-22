import test from 'node:test';
import assert from 'node:assert/strict';
import {allocationBreakdown,renderAllocationDonut,formatAllocationShare} from '../src/allocation-ui.js';
import {money,escapeHTML,TYPES} from '../src/model.js';
const colors={etf:'#4f8662',crypto:'#d2ac66',cash:'#7292bd',other:'#a2a3b2'};
const model=positions=>({positions});
const valueEUR=p=>p.value;
test('Asset shares use gross positive assets and liabilities are reported separately',()=>{
 const result=allocationBreakdown(model([
  {kind:'etf',value:140},{kind:'crypto',value:60},
  {kind:'crypto',value:-50},{kind:'cash',value:0},{kind:'etf',value:0}
 ]),valueEUR,TYPES);
 assert.equal(result.gross,200);
 assert.equal(result.liabilities,50);
 assert.deepEqual(result.slices.map(x=>[x.key,x.value,x.percent]),[['etf',140,70],['crypto',60,30]]);
 assert.equal(result.slices.reduce((sum,x)=>sum+x.percent,0),100);
 const rendered=renderAllocationDonut(result,{money,esc:escapeHTML,colors,netTotal:150});
 assert.match(rendered.legend,/Anteile der positiven Anlagen/);
 assert.ok(rendered.legend.includes(money(-50)),'Signed liability remains visible');
 assert.match(rendered.legend,/70\s*%/);
 assert.match(rendered.donut,/Nettovermögen/);
});
test('Donut offers accessible focusable sectors and keyed pressed states',()=>{
 const allocation=allocationBreakdown(model([{kind:'etf',value:75},{kind:'crypto',value:25}]),valueEUR,TYPES);
 const view=renderAllocationDonut(allocation,{money,esc:escapeHTML,colors,netTotal:100,selectedKey:'crypto'});
 assert.equal(view.activeIndex,1);
 assert.match(view.donut,/role="button"/);
 assert.match(view.donut,/tabindex="0"/);
 assert.match(view.donut,/data-allocation-key="crypto"/);
 assert.match(view.donut,/25\s*%/);
 assert.match(view.donut,/>Krypto<\/span>/);
 assert.equal((view.legend.match(/aria-pressed="true"/g)||[]).length,1);
 assert.match(view.legend,/25,00/);
});
test('Empty, zero and wholly negative portfolios do not divide by zero',()=>{
 for(const positions of [[],[{kind:'crypto',value:0}],[{kind:'crypto',value:-120}]]){
  const data=allocationBreakdown(model(positions),valueEUR,TYPES);
  assert.equal(data.slices.length,0);
  assert.equal(data.gross,0);
  const view=renderAllocationDonut(data,{money,esc:escapeHTML,colors,netTotal:-data.liabilities});
  assert.match(view.legend,/Keine positiven Anlagen/);
  assert.ok(!view.donut.includes('NaN'));
 }
});
test('Small positive shares remain visible as below 0.1 percent',()=>{
 assert.equal(formatAllocationShare(.0001),'< 0,1 %');
 assert.match(formatAllocationShare(99.9),/99,9/);
});
test('Allocation labels are escaped on rendering',()=>{
 const data={slices:[{key:'etf',name:'ETF <img src=x>',value:100,percent:100}],gross:100,liabilities:0};
 const result=renderAllocationDonut(data,{money,esc:escapeHTML,colors,netTotal:100});
 assert.ok(!result.donut.includes('<img src=x>'));
 assert.match(result.legend,/&lt;img src=x&gt;/);
});