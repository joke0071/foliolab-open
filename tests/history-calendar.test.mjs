import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {renderChartPeriodButtons} from '../src/chart-periods.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('history has compact periods, popup calendar and closed snapshot manager',()=>{
 assert.match(html,/id="chartPeriods"/);
 const generated=renderChartPeriodButtons('wealth','data-range','all');
 for(const range of ['month','quarter','year','all']) assert.match(generated,new RegExp('data-range="'+range+'"'));
 assert.match(app,/renderChartPeriodButtons\('wealth','data-range',range\)/);
 assert.match(html,/id="historyCalendarDisclosure"/);
 assert.match(html,/id="historyCalendarGrid"/);
 assert.match(html,/id="addSnapshot" aria-label="Stichtag speichern"/);
 assert.match(html,/<details class="snapshot-manager" id="snapshotManager"><summary>Stichtage verwalten<\/summary>/);
 assert.doesNotMatch(html,/<details class="snapshot-manager" id="snapshotManager" open/);
 assert.match(html,/Entwicklung nach Stichtagen/);
 assert.match(app,/next==='history'\?'Vermögensentwicklung':title/);
 assert.match(css,/@media\(max-width:380px\)/);
});

test('calendar marks snapshot dates and highlights selected two-day interval',()=>{
 const a=app.indexOf('let calendarMonth=null,calendarSelection=[];');
 const b=app.indexOf('function renderHistory(){',a);
 assert.ok(a>=0&&b>a,'calendar helper block present');
 const nodes=Object.fromEntries(['historyCalendarGrid','historyCalendarMonth','historyCalendarHint'].map(k=>[k,{textContent:'',innerHTML:''}]));
 const sandbox={
  $:id=>nodes[id],
  model:{snapshots:[{date:'2026-10-18'},{date:'2026-10-23'}]},
  Date
 };
 runInNewContext(app.slice(a,b)+'\ncalendarMonth="2026-10";calendarSelection=["2026-10-18","2026-10-23"];renderSnapshotCalendar();',sandbox);
 assert.match(nodes.historyCalendarGrid.innerHTML,/data-calendar-day="2026-10-18" class="history-calendar-day has-snapshot selected"/);
 assert.match(nodes.historyCalendarGrid.innerHTML,/data-calendar-day="2026-10-22" class="history-calendar-day selected"/);
 assert.match(nodes.historyCalendarGrid.innerHTML,/data-calendar-day="2026-10-23" class="history-calendar-day has-snapshot selected"/);
 assert.match(nodes.historyCalendarMonth.textContent,/Oktober 2026/i);
 assert.match(nodes.historyCalendarHint.textContent,/2026-10-18 – 2026-10-23/);
});

test('range selection uses inclusive boundaries and resets the calendar',()=>{
 assert.match(app,/data=data.filter\(x=>x.date>=from&&x.date<=to\)/);
 assert.match(app,/calendarSelection=\[\];range='all'/);
 assert.match(app,/if\(calendarSelection.length!==1\)calendarSelection=\[day\]/);
 assert.match(app,/calendarSelection=\[calendarSelection\[0\],day\]\.sort\(\)/);
});
