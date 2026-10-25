import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSummaryTiles,renderProviderAccounts,drawInteractiveChart,compactAmount} from '../src/dashboard-ui.js';
import {blankModel,createProvider,createAccount,createPosition,valueEUR,money,escapeHTML} from '../src/model.js';
const labels=d=>d;
test('Compact axis uses de-AT thousands while keeping precision in point values',()=>{
 assert.match(compactAmount(198000),/198\s*Tsd\./);
 assert.match(compactAmount(-198000),/-198\s*Tsd\./);
 const snapshots=[
 {date:'2026-10-18',total:193652.38},{date:'2026-10-22',total:188922.79}
 ];
 const html=drawInteractiveChart(snapshots,{money,esc:escapeHTML,dateLabel:labels});
 assert.match(html,/chart-y-labels/);
 assert.match(html,/Tsd\./);
 assert.match(html,/188\.922,79/);
 assert.match(html,/data-chart-points/);
 assert.match(html,/Pfeiltasten/);
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
