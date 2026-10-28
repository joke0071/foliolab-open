import test from 'node:test';
import assert from 'node:assert/strict';
import {CHART_PERIODS,chartPeriodDays,renderChartPeriodButtons,filterChartPeriod,syncChartPeriodButtons} from '../src/chart-periods.js';

test('wealth and market charts share labels, ordering and a coherent preset contract',()=>{
 assert.deepEqual(CHART_PERIODS.wealth.map(x=>x.label),['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max']);
 assert.deepEqual(CHART_PERIODS.market.map(x=>x.label),['7 T','1 M','3 M','6 M','1 J','3 J','5 J','Max']);
 assert.equal(chartPeriodDays('wealth','quarter'),90);
 assert.equal(chartPeriodDays('market','30'),30);
 assert.equal(chartPeriodDays('wealth','all'),null);
 assert.throws(()=>chartPeriodDays('market','all'),/Ungültiger/);
});
test('controls use exactly one pressed selection and preserve host event attributes',()=>{
 const overview=renderChartPeriodButtons('wealth','data-mini-range','month');
 const history=renderChartPeriodButtons('wealth','data-range','month');
 const position=renderChartPeriodButtons('market','data-position-range',30);
 assert.equal((overview.match(/aria-pressed="true"/g)||[]).length,1);
 assert.equal((history.match(/aria-pressed="true"/g)||[]).length,1);
 assert.equal((position.match(/aria-pressed="true"/g)||[]).length,1);
 assert.match(overview,/data-mini-range="month" aria-pressed="true" class="selected">1 M/);
 assert.match(history,/data-range="month" aria-pressed="true" class="selected">1 M/);
 assert.match(position,/data-position-range="30" aria-pressed="true" class="selected">1 M/);
 assert.throws(()=>renderChartPeriodButtons('wealth','onclick','month'),/Ungültiges/);
});
test('period filtering is rolling, inclusive, and leaves the source untouched',()=>{
 const points=[{date:'2026-09-24'},{date:'2026-09-25'},{date:'2026-10-23'},{date:'2026-10-24'}];
 const now=Date.parse('2026-10-24T12:00:00Z');
 assert.deepEqual(filterChartPeriod(points,'wealth','month',now).map(x=>x.date),
  ['2026-09-25','2026-10-23','2026-10-24']);
 assert.equal(filterChartPeriod(points,'wealth','all',now),points);
 assert.deepEqual(filterChartPeriod(points,'market',7,now).map(x=>x.date),['2026-10-23','2026-10-24']);
 assert.equal(points.length,4);
});
test('DOM selection gracefully ignores missing or unsupported containers',()=>{
 assert.doesNotThrow(()=>syncChartPeriodButtons(null,'data-range','month'));
 assert.doesNotThrow(()=>syncChartPeriodButtons({},'onmouseover','month'));
});

test('extended market presets require explicit opt-in and max is not a remote default',()=>{
 assert.equal(chartPeriodDays('market',1826),1826);
 assert.equal(chartPeriodDays('market','max'),null);
 assert.equal(renderChartPeriodButtons('market','data-position-range',30).includes('5 J'),false);
 const extended=renderChartPeriodButtons('market','data-position-range',1826,[1826,'max']);
 assert.match(extended,/data-position-range="1826" aria-pressed="true" class="selected">5 J/);
 assert.match(extended,/data-position-range="max" aria-pressed="false">Max/);
});


test('one-week wealth view retains the exact inclusive seven-day boundary without inventing missing points',()=>{
 for(const now of ['2026-01-01T00:01:00Z','2024-03-01T23:59:00Z','2026-10-28T12:00:00Z']){
  const end=Date.parse(now),date=ago=>new Date(end-ago*864e5).toISOString().slice(0,10);
  const points=[{date:date(7),totalEURExact:'100'},{date:date(6),totalEURExact:'110'},{date:date(2),totalEURExact:'130'},{date:date(0),totalEURExact:'140'}];
  const before=JSON.stringify(points),expected=points.slice(1);
  assert.deepEqual(filterChartPeriod(points,'wealth','week',end),expected);
  assert.deepEqual(filterChartPeriod(points,'market',7,end),expected);
  assert.equal(JSON.stringify(points),before);
 }
 assert.equal(chartPeriodDays('wealth','week'),7);
 assert.deepEqual(filterChartPeriod([],'wealth','week',Date.parse('2026-01-01T12:00:00Z')),[]);
 for(const attribute of ['data-mini-range','data-range'])assert.match(renderChartPeriodButtons('wealth',attribute,'week'),new RegExp(attribute+'="week" aria-pressed="true" class="selected">7 T'));
});
