import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshFailures,refreshHeadline} from '../src/refresh-ui.js';
test('Aggregates repeated API errors without inventing success or modifying holdings',()=>{
 const errors=['Bitcoin: Anbieter 429','Ethereum: Anbieter 429','ETF: Kein Kurs'];
 const result=refreshFailures(errors);
 assert.equal(result.length,2);
 assert.deepEqual(result[0].positions,['Bitcoin','Ethereum']);
 assert.equal(result[0].count,2);
 assert.equal(refreshHeadline(14,errors),'14 Datenupdates · 3 Abfragen prüfen');
 assert.equal(refreshHeadline(0,[]),'0 Datenupdates');
});
