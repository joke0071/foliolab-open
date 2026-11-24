import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startAuthorityReview } from './fixtures/flh04-authority-continuation.mjs';

function fixtures(length, overrides = new Map()) {
  const verified = new Map();
  const objects = Array.from({ length }, (_, index) => {
    const version = index + 1;
    const state = { id: `state-${version}`, version, previousId: index ? `state-${index}` : null,
      root: 'root', portfolio: 'portfolio', authority: 'root', writers: ['writer'], ...overrides.get(version) };
    const object = JSON.stringify(state);
    verified.set(object, state);
    return object;
  });
  const context = { root: 'root', portfolio: 'portfolio', purpose: 'fresh-enrollment-review',
    target: { version: length, id: `state-${length}` } };
  return { objects, context, verify: object => verified.get(object) };
}

function complete(session, objects) {
  let status;
  for (let offset = 0; offset < objects.length; offset += 128) {
    status = session.verifySegment(objects.slice(offset, offset + 128));
    if (status !== 'pending') break;
  }
  return status;
}

for (const length of [127, 128, 129, 130, 385, 16_384]) {
  test(`checks all ${length} authority states before reporting structural completion`, () => {
    const { context, objects, verify } = fixtures(length);
    const versions = [];
    const session = startAuthorityReview(context, (object, previous) => {
      const state = verify(object);
      assert.equal(previous?.version ?? 0, state.version - 1);
      versions.push(state.version);
      return state;
    });
    for (let offset = 0; offset < length; offset += 128) {
      assert.equal(session.verifySegment(objects.slice(offset, offset + 128)),
        offset + 128 < length ? 'pending' : 'verified-chain-only');
    }
    assert.deepEqual(versions, Array.from({ length }, (_, index) => index + 1));
    assert.throws(() => session.verifySegment(objects.slice(0, 128)), /closed/);
  });
}

test('missing, duplicate, reordered, mutated or replayed input closes the attempt', () => {
  const { context, objects, verify } = fixtures(130);
  const last = objects.slice(128);
  for (const invalid of [[], last.slice(1), [last[0], last[0]], last.toReversed(),
    [last[0], last[1] + ' '], objects.slice(0, 128)]) {
    const session = startAuthorityReview(context, verify);
    assert.equal(session.verifySegment(objects.slice(0, 128)), 'pending');
    assert.equal(session.verifySegment(invalid), 'rejected');
    assert.throws(() => session.verifySegment(last), /closed/);
  }
});

test('rejects wrong pin, portfolio, purpose, or a fixture verifier rejecting a signature', () => {
  const { context, objects, verify } = fixtures(130);
  for (const change of [{ root: 'untrusted' }, { portfolio: 'other' }]) {
    assert.equal(complete(startAuthorityReview({ ...context, ...change }, verify), objects), 'rejected');
  }
  assert.throws(() => startAuthorityReview({ ...context, purpose: 'send' }, verify), /context/);
  assert.equal(complete(startAuthorityReview(context, object => {
    const state = verify(object);
    return state.version === 129 ? null : state;
  }), objects), 'rejected');
});

test('rejects rollback and a mismatched pinned predecessor on either side of the budget boundary', () => {
  const { context, objects, verify } = fixtures(130);
  for (const version of [127, 128, 129, 130]) {
    const floor = { id: `state-${version}`, version };
    assert.equal(complete(startAuthorityReview({ ...context, floor }, verify), objects), 'verified-chain-only');
    const conflicting = { ...context, floor: { ...floor, id: 'observed-sibling' } };
    if (version < 130) {
      assert.equal(complete(startAuthorityReview(conflicting, verify), objects), 'rejected');
    } else {
      assert.throws(() => startAuthorityReview(conflicting, verify), /context/);
    }
  }
  assert.throws(() => startAuthorityReview({
    ...context, target: { version: 129, id: 'state-129' }, floor: context.target
  }, verify), /context/);
  const fork = fixtures(130, new Map([[129, { id: 'sibling' }]]));
  assert.equal(complete(startAuthorityReview(context, fork.verify), fork.objects), 'rejected');
});

test('retains role separation after a writer has been removed, and after authority rotation', () => {
  for (const overrides of [
    new Map([[128, { writers: ['replacement'] }], [129, { authority: 'writer', writers: ['replacement'] }]]),
    new Map([[129, { authority: 'new-authority', writers: ['writer'] }],
      [130, { authority: 'new-authority', writers: ['root'] }]])
  ]) {
    const { context, objects, verify } = fixtures(130, overrides);
    assert.equal(complete(startAuthorityReview(context, verify), objects), 'rejected');
  }
  const valid = fixtures(130, new Map([[128, { writers: ['replacement'] }],
    [129, { authority: 'new-authority', writers: ['replacement'] }],
    [130, { authority: 'new-authority', writers: ['replacement'] }]]));
  assert.equal(complete(startAuthorityReview(valid.context, valid.verify), valid.objects), 'verified-chain-only');
});

test('interruption preserves only in-memory progress or requires replay from genesis', () => {
  const { context, objects, verify } = fixtures(130);
  const session = startAuthorityReview(context, verify);
  assert.equal(session.verifySegment(objects.slice(0, 128)), 'pending');
  const forged = { version: 128, id: 'state-128', verified: true };
  assert.equal(startAuthorityReview(context, verify).verifySegment(forged), 'rejected');
  assert.equal(startAuthorityReview(context, verify).verifySegment(objects.slice(128)), 'rejected');
  assert.equal(session.verifySegment(objects.slice(128)), 'verified-chain-only');

  const cancelled = startAuthorityReview(context, verify);
  assert.equal(cancelled.verifySegment(objects.slice(0, 128)), 'pending');
  assert.equal(cancelled.cancel(), 'cancelled');
  assert.throws(() => cancelled.verifySegment(objects.slice(128)), /closed/);
  assert.equal(complete(startAuthorityReview(context, verify), objects), 'verified-chain-only');
});

test('pins the context at start and preflights limits before invoking the verifier', () => {
  const { context, objects, verify } = fixtures(130);
  const session = startAuthorityReview(context, verify);
  context.target.id = 'different';
  assert.equal(complete(session, objects), 'verified-chain-only');
  let calls = 0;
  const count = object => { calls++; return verify(object); };
  for (const input of [objects.slice(0, 129), [...objects.slice(0, 127), 'x'.repeat(65_537)],
    [...objects.slice(0, 127), '€'.repeat(22_000)]]) {
    assert.equal(startAuthorityReview(context, count).verifySegment(input), 'rejected');
  }
  assert.equal(calls, 0);
  assert.throws(() => startAuthorityReview({
    ...context, target: { version: 16_385, id: 'too-long' }
  }, count), /context/);
});

test('bounds aggregate bytes across segments and rejects verifier failure', () => {
  const { context } = fixtures(1_025);
  const object = 'x'.repeat(65_536);
  let calls = 0;
  const session = startAuthorityReview(context, () => {
    const version = ++calls;
    return { id: `state-${version}`, version, previousId: version === 1 ? null : `state-${version - 1}`,
      portfolio: 'portfolio', root: 'root', authority: 'root', writers: ['writer'] };
  });
  for (let index = 0; index < 8; index++) {
    assert.equal(session.verifySegment(Array(128).fill(object)), 'pending');
  }
  assert.equal(session.verifySegment([object]), 'rejected');
  assert.equal(calls, 1_024);
  const short = fixtures(1);
  const throwing = startAuthorityReview(short.context, () => { throw new Error('fixture failure'); });
  assert.equal(throwing.verifySegment(short.objects), 'rejected');
});

test('keeps a removed writer out of all post-boundary fixture memberships', () => {
  const { context, objects, verify } = fixtures(130, new Map([
    [129, { writers: ['replacement'] }],
    [130, { writers: ['replacement'] }]
  ]));
  const previousMembership = [];
  const session = startAuthorityReview(context, (object, previous) => {
    const state = verify(object);
    if (state.version >= 129) previousMembership.push(previous.writers.includes('writer'));
    return state;
  });
  assert.equal(complete(session, objects), 'verified-chain-only');
  assert.deepEqual(previousMembership, [true, false]);
});

test('rejects an overlapping segment and discards a verifier result after cancellation', () => {
  const { context, objects, verify } = fixtures(1);
  const session = startAuthorityReview(context, object => {
    assert.throws(() => session.verifySegment(objects), /already being checked/);
    assert.equal(session.cancel(), 'cancelled');
    return verify(object);
  });
  assert.equal(session.verifySegment(objects), 'cancelled');
  assert.throws(() => session.verifySegment(objects), /closed/);
});
