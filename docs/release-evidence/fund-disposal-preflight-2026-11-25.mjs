// Quick model check for FIN-E2E01 and booking management. Run against a product checkout.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [checkout, expected] = process.argv.slice(2);
if (!checkout || !['blocked', 'ready'].includes(expected)) {
  throw Error('Usage: node fund-disposal-preflight-2026-11-25.mjs PRODUCT_CHECKOUT blocked|ready');
}
const fromCheckout = file => import(pathToFileURL(resolve(checkout, file)).href);
const {blankModel, createProvider, createAccount, createPosition} = await fromCheckout('src/model.js');
const {parseCSV, inferMapping, previewCSV, importCSV} = await fromCheckout('src/csv-import.js');
const {previewBookingChange} = await fromCheckout('src/booking-management.js');

const model = blankModel();
model.providers.push(createProvider({id: 'p', name: 'BFH Prüffall'}));
function addPosition(id, kind, quantity, price, basis) {
  const account = createAccount({
    id: 'konto-' + id, name: id, providerId: 'p',
    type: kind === 'cash' ? 'checking' : 'brokerage', currency: 'EUR'
  }, model);
  model.accounts.push(account);
  model.positions.push(createPosition({
    id, name: id, providerId: 'p', accountId: account.id, kind, quantity,
    price, costBasisExact: basis, currency: 'EUR'
  }, model));
}
addPosition('fund', 'fund', '386', '103.16', '39303.64');
addPosition('cash', 'cash', '0', '1', null);
addPosition('reserve', 'cash', '123', '1', null);

// Source amounts from the independent BFH case. Date, initial cash and reserve are test inputs.
const csv = parseCSV([
  'date;type;position;quantity;price;fee;tax;cashPosition;id',
  '2018-12-31;sell;fund;386;103.16;69.90;711.80;cash;bfh-fund-sale'
].join('\n'));
const preview = previewCSV(model, csv, inferMapping(csv.headers));
assert.equal(preview.ready, 1);
importCSV(model, preview);
const position = (state, id) => state.positions.find(p => p.id === id);
assert.equal(model.bookings.length, 1);
assert.equal(model.snapshots.length, 0);
assert.equal(position(model, 'cash').quantityExact, '39038.06');
assert.equal(position(model, 'fund').quantityExact, '0');

const before = JSON.stringify(model);
const change = previewBookingChange(model, {
  ids: [model.bookings[0].id], action: 'remove', reason: 'BFH VIII R 22/23'
});
assert.equal(JSON.stringify(model), before);
console.log(JSON.stringify({ready: change.ready, reasons: change.blocks.map(b => b.reason)}));
assert.equal(change.ready, expected === 'ready');
if (change.ready) {
  assert.equal(position(change.candidate, 'fund').quantityExact, '386');
  assert.equal(position(change.candidate, 'fund').costBasisExact, '39303.64');
  assert.equal(position(change.candidate, 'cash').quantityExact, '0');
  assert.deepEqual(position(change.candidate, 'reserve'), position(model, 'reserve'));
  assert.deepEqual(change.candidate.externalCashFlows, model.externalCashFlows);
}
