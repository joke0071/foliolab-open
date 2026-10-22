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
 assert.match(html,/Arrow/gi);
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