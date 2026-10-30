import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSummaryTiles,renderProviderAccounts,drawInteractiveChart,compactAmount} from '../src/dashboard-ui.js';
import {blankModel,createProvider,createAccount,createPosition,valueEUR,money,escapeHTML} from '../src/model.js';
const labels=d=>d;
const chartPoints=html=>JSON.parse(html.match(/data-chart-points="([^"]+)"/)[1].replaceAll('&quot;','"'));
test('Sparse chart coordinates use actual elapsed time, including comparison and disjoint segments',()=>{
 const rows=[{date:'2026-01-01',total:100},{date:'2026-01-02',total:101},{date:'2026-01-11',total:110,breakBefore:true}];
 const before=structuredClone(rows);
 const html=drawInteractiveChart(rows,{money,esc:escapeHTML,dateLabel:labels,comparison:rows.map(r=>({...r,total:r.total-10})),disjoint:true});
 const points=chartPoints(html);
 assert.deepEqual(points.map(p=>p.x),[5,64,595]);
 assert.deepEqual(points.map(p=>[p.date,p.value,p.compareValue]),rows.map(r=>[r.date,money(r.total),'Kapitalreferenz: '+money(r.total-10)]));
 const paths=[...html.matchAll(/<path d="([^"]+)" fill="none"/g)].map(m=>m[1]);
 assert.match(paths[0],/^M5\.00 .*L64\.00 .*M595\.00 /);
 assert.match(paths[1],/^M5\.00 .*L64\.00 .*L595\.00 /);
 assert.deepEqual(rows,before,'rendering changes no observations or gap evidence');
});
test('Chart time coordinates retain UTC leap-day intervals and equal-date observations without inventing time',()=>{
 const render=rows=>chartPoints(drawInteractiveChart(rows,{money,esc:escapeHTML,dateLabel:labels}));
 assert.deepEqual(render([{date:'2024-02-28',total:1},{date:'2024-02-29',total:2},{date:'2024-03-02',total:3}]).map(p=>p.x),[5,5+590/3,595]);
 const same=render([{date:'2024-02-29',total:1},{date:'2024-02-29',total:2}]);
 assert.deepEqual(same.map(p=>p.x),[300,300]);assert.equal(same.length,2);
});
test('Charts never fall back to invented equally spaced dates for invalid or reversed observations',()=>{
 for(const dates of [['invalid','2026-01-02'],['2026-01-02','2026-01-01']]){
  const html=drawInteractiveChart(dates.map(date=>({date,total:100})),{money,esc:escapeHTML,dateLabel:labels});
  assert.match(html,/Datumsangaben für das Diagramm nicht verfügbar/);assert.doesNotMatch(html,/data-chart-points|NaN/);
 }
});
test('Compact money distinguishes audit examples and never turns missing values into zero',()=>{
 const cases=[[983.1,'€ 983,1'],[1000,'€ 1 Tsd.'],[1010,'€ 1,01 Tsd.'],[1059,'€ 1,059 Tsd.'],[9999,'€ 9,999 Tsd.'],[1234567,'€ 1,235 Mio.'],[-1010,'€ -1,01 Tsd.']];
 for(const [value,label]of cases)assert.equal(compactAmount(value),label);
 for(const value of [null,undefined,'',NaN,Infinity,true])assert.equal(compactAmount(value),'–');
 assert.equal(new Set(cases.map(([v])=>compactAmount(v))).size,cases.length);
});
test('Default EUR chart axes keep distinct labels for tiny and large actual values',()=>{
 for(const amount of [1e-9,983.1,1000,1010,1059,9999,1e6,-1010]){
  const html=drawInteractiveChart([{date:'2024-01-01',total:amount},{date:'2024-01-02',total:amount*1.01}],{money,esc:escapeHTML,dateLabel:labels});
  const axis=html.match(/class="chart-y-labels"[^>]*>(.*?)<\/div>/)[1];
  assert.equal(new Set([...axis.matchAll(/<span>(.*?)<\/span>/g)].map(x=>x[1])).size,3,'distinct labels for '+amount);
 }
});
test('EUR axes use readable rounded euro labels while compact totals and exact point values stay intact',()=>{
 assert.match(compactAmount(198000),/198\s*Tsd\./);
 assert.match(compactAmount(-198000),/-198\s*Tsd\./);
 const snapshots=[
 {date:'2026-10-18',total:193652.38},{date:'2026-10-22',total:188922.79}
 ];
 const html=drawInteractiveChart(snapshots,{money,esc:escapeHTML,dateLabel:labels});
 assert.match(html,/chart-y-labels/);
 const axis=html.match(/class="chart-y-labels"[^>]*>(.*?)<\/div>/)[1];
 assert.doesNotMatch(axis,/Tsd\./);
 assert.match(axis,/[\d.]+ €/);
 for(const [,label]of axis.matchAll(/<span>([\d.]+) €<\/span>/g))assert.equal(Number(label.replaceAll('.',''))%1000,0,'readable rounded thousands as full euro labels');
 assert.match(html,/188\.922,79/);
 assert.match(html,/data-chart-points/);
 assert.match(html,/Pfeiltasten/);
});
test('EUR axis formatting changes no point coordinates, values or comparison geometry',()=>{
 const rows=[{date:'2024-01-01',total:196883.123},{date:'2024-04-01',total:199059.987}];
 const args={money,esc:escapeHTML,dateLabel:labels,comparison:rows.map(r=>({...r,total:r.total-20}))};
 const current=drawInteractiveChart(rows,args),previous=drawInteractiveChart(rows,{...args,axisFormat:v=>compactAmount(v)});
 const points=html=>html.match(/data-chart-points="([^"]+)"/)[1];
 assert.equal(points(current),points(previous),'identical exact tooltip payload and SVG coordinates');
 const geometry=html=>[...html.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(geometry(current),geometry(previous),'line, fill and reference geometry unchanged');
 const axis=current.match(/class="chart-y-labels"[^>]*>(.*?)<\/div>/)[1];
 assert.doesNotMatch(axis,/Tsd\.|,\d/,'normal wealth axes need no fractional thousands');
});
test('Dashboard stats show comparable money values and explicitly distinguish wealth change',()=>{
 const m=blankModel();const p=createProvider({name:'Broker'});m.providers.push(p);
 const a=createAccount({name:'Depot',providerId:p.id},m);m.accounts.push(a);
 m.positions.push(createPosition({name:'ETF',providerId:p.id,accountId:a.id,kind:'etf',quantity:2,price:100},m));
 m.positions.push(createPosition({name:'Coin',providerId:p.id,accountId:a.id,kind:'crypto',quantity:1,price:100},m));
 m.snapshots.push({date:'2026-10-18',total:280},{date:'2026-10-22',total:300});
 const html=renderSummaryTiles(m,money,valueEUR,escapeHTML,labels);
 for(const heading of ['Wertpapiere','Guthaben','Kryptowährungen','Veränderung'])assert.ok(html.includes(heading));
 assert.match(html,/inkl\. Geldflüsse/);
 assert.match(html,/Coin-Positionen/);
 assert.equal((html.match(/class="stat"/g)||[]).length,4);
});
test('Escaped provider accordions preserve per-account position breakdown',()=>{
 const m=blankModel(),p=createProvider({name:'Bank <img src=x>'});m.providers.push(p);
 const a=createAccount({providerId:p.id,name:'Depot',type:'securities'},m);m.accounts.push(a);
 const stock=createPosition({name:'ETF',providerId:p.id,accountId:a.id,kind:'etf',quantity:1,price:120},m);m.positions.push(stock);
 const html=renderProviderAccounts(m,money,valueEUR,escapeHTML,new Set([p.id]));
 assert.match(html,/<details[^>]+open/);
 assert.match(html,/ETF/);
 assert.match(html,/120,00/);
 assert.ok(!html.includes('<img src=x>'));
 assert.match(html,/&lt;img src=x&gt;/);
});
test('Tiny positive crypto prices use a tight, nonnegative axis rather than a one-euro minimum span',()=>{
 const rows=[{date:'2026-10-20',total:0.0054},{date:'2026-10-21',total:0.0058}];
 const chart=drawInteractiveChart(rows,{money,esc:escapeHTML,dateLabel:labels,axisFormat:v=>'€ '+v.toFixed(6)});
 const axis=chart.split('chart-y-labels')[1].split('</div>')[0];
 assert.match(axis,/€ 0\.005/);
 assert.doesNotMatch(axis,/-€ /);
});
test('disjoint historical segments do not bridge missing intervals',()=>{
 const html=drawInteractiveChart([{date:'2023-01-02',total:100},{date:'2023-01-03',total:110},{date:'2023-02-01',total:120,breakBefore:true},{date:'2023-02-02',total:130}],{money,esc:escapeHTML,dateLabel:labels,disjoint:true});
 const path=html.match(/<path d="([^"]+)" fill="none" stroke="#3b8659"/)[1];
 assert.equal((path.match(/M/g)||[]).length,2);assert.equal((path.match(/L/g)||[]).length,2);assert.ok(!html.includes('fill="#e8f2ea"'));
});
