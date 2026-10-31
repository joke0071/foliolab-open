import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {calendarDateLabel,exactQuantityLabel} from '../src/format.js';import {quant} from '../src/model.js';import {units} from '../src/decimal.js';
test('calendar days are Austrian display labels without normalizing invalid evidence',()=>{
 assert.equal(calendarDateLabel('2026-10-31'),'31.10.2026');assert.equal(calendarDateLabel('2024-02-29'),'29.02.2024');assert.equal(calendarDateLabel('2026-02-29'),'2026-02-29');assert.equal(calendarDateLabel('2026-13-01'),'2026-13-01');assert.equal(calendarDateLabel(null),'');
});
test('calendar labels retain the original day across timezone and DST boundaries',()=>{
 const source="import {calendarDateLabel} from './src/format.js';console.log(JSON.stringify(['2026-01-01','2026-03-29','2026-10-25','2024-02-29'].map(calendarDateLabel)))";
 for(const TZ of ['UTC','Europe/Vienna','America/Los_Angeles','Pacific/Kiritimati','Pacific/Pago_Pago','Asia/Kathmandu'])assert.deepEqual(JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),env:{...process.env,TZ},encoding:'utf8'})),['01.01.2026','29.03.2026','25.10.2026','29.02.2024']);
});
test('exact localized quantity notation roundtrips without a binary-number conversion',()=>{
 const values=['0','1','-1','0.000000000000000001','-0.000000000000000001','0.000000123456789012','123456789.123456789012345678','-123456789012345678.123456789012345678'];
 for(const value of values){const label=exactQuantityLabel(value),decoded=label.includes('E')?label.replace(',','.'):label.split(new Intl.NumberFormat('de-AT').formatToParts(1000).find(p=>p.type==='group').value).join('').replace(',','.');assert.equal(units(decoded),units(value),value+' -> '+label);}
 assert.equal(exactQuantityLabel('0.000000000000000001'),'1E-18');assert.equal(exactQuantityLabel('123456789.123456789012345678'),new Intl.NumberFormat('de-AT').format(123456789)+',123456789012345678');assert.equal(exactQuantityLabel('-0.0000000000012300'),'-1,23E-12');
});
test('unknown quantities stay unknown and tiny display values never round to zero',()=>{
 for(const value of [null,undefined,'',NaN,Infinity,true,'invalid'])assert.equal(exactQuantityLabel(value),'–');
 assert.equal(quant(1e-18),'1E-18');assert.equal(quant(-1e-18),'-1E-18');assert.equal(quant(5e-9),'5E-9');assert.equal(quant(0),'0');assert.equal(quant(1e-8),'0,00000001');assert.equal(quant(1234.123456789),new Intl.NumberFormat('de-AT',{maximumFractionDigits:8}).format(1234.123456789));
});
