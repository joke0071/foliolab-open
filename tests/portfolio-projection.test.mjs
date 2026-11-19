import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectPortfolio,projectionStart} from '../src/portfolio-projection.js';
const simulate=overrides=>projectPortfolio({start:'1000',monthly:'25,50',years:'3',rates:['0','5','10'],inflation:'2',...overrides});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);

test('effective annual returns, end-of-month deposits and inflation match independent closed form',()=>{
 for(const s of simulate({rates:['-10','0','10']})){
  const r=(1+s.rate/100)**(1/12)-1, growth=(1+s.rate/100)**3;
  const expected=1000*growth+25.5*(r===0?36:(growth-1)/r);
  assert.equal(s.points.length,4);
  close(s.points.at(-1).nominal,expected);
  close(s.points.at(-1).real,expected/1.02**3);
 }
});

test('withdrawal never invents overdraft borrowing and records unmet nominal withdrawals',()=>{
 const s=simulate({start:'100',monthly:'-30',years:'1',rates:['0','0','0']})[0];
 assert.equal(s.points.at(-1).nominal,0);
 assert.equal(s.unfunded,260);
 for(const invalid of [{start:''},{monthly:'1e3'},{years:'51'},{years:'1,50'},{rates:[5,4,7]},{rates:[-100,0,1]}]){
  assert.throws(()=>simulate(invalid));
 }
});

test('only a complete, supported present valuation may provide the optional scenario start',()=>{
 const now=Date.parse('2026-11-19T12:00Z');
 const cash={kind:'cash',currency:'EUR',quantityExact:'1000',priceExact:'1'};
 const excluded={kind:'stock',currency:'USD',quantityExact:'1',priceExact:'0',valuationMode:'excluded'};
 const uncertain={...excluded,valuationMode:'included',priceExact:'500',fxRateExact:'UNKNOWN'};
 const old={...uncertain,currency:'EUR',quoteAsOf:'2026-11-01',quoteQuality:'verified-listing'};
 const current={...old,quoteAsOf:'2026-11-19',quoteSource:'verified'};
 const duplicate={...cash,wallet:{enabled:true,chain:'evm',chainId:1,address:'0x123'}};
 assert.equal(projectionStart([cash,excluded],now).value,1000);
 assert.equal(projectionStart([cash,uncertain],now).value,null);
 assert.equal(projectionStart([cash,old],now).value,null);
 assert.equal(projectionStart([cash,current],now).value,1500);
 assert.equal(projectionStart([duplicate,duplicate],now).value,null);
 assert.equal(projectionStart([{...cash,valuationMode:'liability'}],now).value,null);
 assert.equal(projectionStart([],now).value,null);
});
