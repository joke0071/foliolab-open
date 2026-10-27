import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalAxisLabel} from '../src/booking-history-ui.js';

test('historical quantity axis has no monetary unit',()=>{
 assert.equal(historicalAxisLabel(2.123456789),'2,12');
 assert.equal(historicalAxisLabel(0),'0');
 assert.doesNotMatch(historicalAxisLabel(-3.123456789),/€|EUR|USD/);
});
test('historical price axes identify actual currency without zeroing tiny values',()=>{
 assert.match(historicalAxisLabel(1e-9,'USD'),/^\$\s*1E-9$/);
 assert.match(historicalAxisLabel(100,'USD'),/^\$\s*100$/);
 assert.match(historicalAxisLabel(100,'EUR'),/^€\s*100$/);
});
test('large axis labels remain compact; invalid values stay unavailable',()=>{
 const large=historicalAxisLabel(1e12,'USD');
 assert.ok(large.length<20);
 assert.match(large,/\$$/);
 assert.equal(historicalAxisLabel(Infinity),'–');
});
