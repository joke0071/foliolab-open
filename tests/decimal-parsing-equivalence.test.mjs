import test from 'node:test';
import assert from 'node:assert/strict';
import {units,SCALE} from '../src/decimal.js';
// Independent arithmetic oracle: generated decimal strings versus integer
// coefficients. Repeated parses are interleaved with enough other inputs to
// exercise both retained and evicted results without inspecting implementation.
test('repeated parsing preserves exact arithmetic across signs, locale and exponent forms',()=>{
 let state=73;const next=()=>state=(Math.imul(state,1664525)+1013904223)>>>0;
 for(let i=0;i<5000;i++){
  const places=next()%19,coefficient=BigInt(next())*(next()%2?-1n:1n),sign=coefficient<0n?'-':'',digits=(coefficient<0n?-coefficient:coefficient).toString().padStart(places+1,'0');
  const plain=sign+(places?digits.slice(0,-places)+'.'+digits.slice(-places):digits),expected=coefficient*10n**BigInt(18-places);
  for(const input of [plain,plain,plain.replace('.',','),' '+plain+' ',coefficient+'e-'+places])assert.equal(units(input),expected,input);
 }
});
test('valid parses cannot make invalid precision, syntax or range acceptable',()=>{
 const invalid=['NaN','Infinity','','0x10','1.0000000000000000001','0.0000000000000000001','1e-19','1e201','1e33','--1','1.2.3','1,2,3'];
 for(let i=0;i<3;i++){for(const good of ['0','-0','1','0.01','1e-18',1,0.01,NaN]){if(Number.isNaN(good))assert.throws(()=>units(good));else units(good);}for(const bad of invalid)assert.throws(()=>units(bad),bad);}
 assert.equal(units(1n),SCALE);assert.equal(units(-1n),-SCALE);
});
test('objects preserve conversion behavior and large zero-padded inputs preserve precision',()=>{
 let calls=0;const input={toString(){calls++;return calls%2?'1':'2';}};assert.equal(units(input),SCALE);assert.equal(units(input),2n*SCALE);assert.equal(calls,2);
 const long='0'.repeat(120)+'1.000000000000000000';assert.throws(()=>units(long));
 assert.equal(units('0.'+'0'.repeat(120)),0n);
});
