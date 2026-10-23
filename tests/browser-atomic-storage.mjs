import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
const context = await browser.newContext();
const a = await context.newPage();
const b = await context.newPage();
const url = 'http://127.0.0.1:4173/';
const modulePath = '/src/atomic-storage.js';

async function write(page, expectedRevision, name) {
  return page.evaluate(async ({expectedRevision, name, modulePath}) => {
    const {openPortfolioDB, commitPortfolioRecord} = await import(modulePath);
    const {blankModel, backup, createProvider} = await import('/src/model.js');
    const m = blankModel();
    if (name) m.providers.push(createProvider({name, type: 'broker'}));
    const db = await openPortfolioDB();
    try {
      return await commitPortfolioRecord(db, {expectedRevision, raw: backup(m)});
    } finally { db.close(); }
  }, {expectedRevision, name, modulePath});
}
async function read(page) {
  return page.evaluate(async modulePath => {
    const {openPortfolioDB, readPortfolioRecord} = await import(modulePath);
    const db = await openPortfolioDB();
    try { return await readPortfolioRecord(db); } finally { db.close(); }
  }, modulePath);
}
try {
  await Promise.all([a.goto(url), b.goto(url)]);
  const first = await write(a, null, 'Initial');
  assert.equal(first.revision, 1);
  assert.equal(JSON.parse(first.raw).providers[0].name, 'Initial');

  // Both tabs start from revision 1; IDB serializes their readwrite transactions.
  const contenders = await Promise.allSettled([
    write(a, 1, 'Concurrent A'), write(b, 1, 'Concurrent B')
  ]);
  assert.equal(contenders.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(contenders.filter(x => x.status === 'rejected').length, 1);
  assert.match(String(contenders.find(x => x.status === 'rejected').reason), /anderen Tab geändert/);
  const committed = await read(a);
  assert.equal(committed.revision, 2);
  assert.equal(JSON.parse(committed.raw).providers.length, 1);
  assert.ok(['Concurrent A', 'Concurrent B'].includes(JSON.parse(committed.raw).providers[0].name));

  // Failed validation, including malformed backups, leaves revision and raw bytes intact.
  const failed = await a.evaluate(async modulePath => {
    const {openPortfolioDB, commitPortfolioRecord} = await import(modulePath);
    const db = await openPortfolioDB();
    try {
      await commitPortfolioRecord(db, {expectedRevision: 2, raw: '{not json'});
      return false;
    } catch { return true; } finally { db.close(); }
  }, modulePath);
  assert.equal(failed, true);
  assert.deepEqual(await read(a), committed);

  // A quota-like failure during put aborts the whole transaction.
  const quota = await a.evaluate(async modulePath => {
    const {openPortfolioDB, commitPortfolioRecord} = await import(modulePath);
    const {blankModel, backup} = await import('/src/model.js');
    const db = await openPortfolioDB();
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      throw new DOMException('Simulierte Speichergrenze', 'QuotaExceededError');
    };
    try {
      await commitPortfolioRecord(db, {expectedRevision: 2, raw: backup(blankModel())});
      return 'unexpected success';
    } catch (error) {
      return error.name;
    } finally {
      IDBObjectStore.prototype.put = original;
      db.close();
    }
  }, modulePath);
  assert.equal(quota, 'QuotaExceededError');
  assert.deepEqual(await read(b), committed);

  // Deletion is a revisioned tombstone: no accidental resurrection after reset.
  const tombstone = await a.evaluate(async modulePath => {
    const {openPortfolioDB, commitPortfolioRecord} = await import(modulePath);
    const db = await openPortfolioDB();
    try { return await commitPortfolioRecord(db, {expectedRevision: 2, raw: null}); }
    finally { db.close(); }
  }, modulePath);
  assert.equal(tombstone.revision, 3);
  assert.equal(tombstone.raw, null);
  await assert.rejects(() => write(b, 2, 'Stale resurrection'), /anderen Tab geändert/);
  assert.deepEqual(await read(a), tombstone);

  // A v1 legacy migration is explicitly staged, never deletes or overwrites
  // localStorage, and removes all keys including private RPC URLs in the copy.
  const migration = await b.evaluate(async modulePath => {
    const {openPortfolioDB, stageLegacyPortfolio} = await import(modulePath);
    const {blankModel, STORE_KEY, createProvider} = await import('/src/model.js');
    const m = blankModel();
    m.version = 1;
    delete m.accounts;
    m.providers.push(createProvider({name: 'Legacy Broker'}));
    m.settings.eodhdKey = 'SECRET_DO_NOT_COPY';
    m.settings.solanaRpc = 'https://private.example.invalid/SECRET_RPC';
    const raw = JSON.stringify(m);
    localStorage.setItem(STORE_KEY, raw);
    const db = await openPortfolioDB();
    try {
      const result = await stageLegacyPortfolio(db, localStorage, {expectedRevision: 3});
      return {...result, sourceIntact: localStorage.getItem(STORE_KEY) === raw};
    } finally { db.close(); }
  }, modulePath);
  assert.equal(migration.legacyPreserved, true);
  assert.equal(migration.legacyUnchanged, true);
  assert.equal(migration.sourceIntact, true);
  assert.equal(migration.record.revision, 4);
  assert.equal(JSON.parse(migration.record.raw).version, 3);
  assert.equal(JSON.parse(migration.record.raw).providers[0].name, 'Legacy Broker');
  assert.ok(!migration.record.raw.includes('SECRET'));
  assert.equal((await read(a)).revision, 4);

  // An explicit stale revision during a competing import is rejected.
  await assert.rejects(() => write(a, 3, 'Old import'), /anderen Tab geändert/);
  console.log('ATOMIC-STORAGE: competing writes, conflicts, quota rollback, tombstone, key-free v1 migration PASS');
} finally {
  await context.close();
  await browser.close();
}
