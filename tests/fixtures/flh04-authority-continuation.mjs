// Review model with synthetic inputs. It cannot verify wire bytes or authorize enrollment.
const SEGMENT_LIMIT = 128;
const WRITER_LIMIT = 64;
const OBJECT_LIMIT = 65_536;
const RUN_LIMIT = 16_384;
const BYTE_LIMIT = 64 * 1024 * 1024;
const encoder = new TextEncoder();

function validIdentifier(value) {
  return typeof value === 'string' && value.length > 0;
}

function validHead(head) {
  return Number.isSafeInteger(head?.version) && head.version > 0 &&
    validIdentifier(head.id);
}

function snapshotWriters(writers) {
  if (!Array.isArray(writers) || !writers.length || writers.length > WRITER_LIMIT) return null;
  const snapshot = Array.from(writers);
  if (!snapshot.every(validIdentifier) || new Set(snapshot).size !== snapshot.length) return null;
  return Object.freeze(snapshot);
}

export function startAuthorityReview(context, verifyFixture) {
  const { portfolio, root, purpose, target, floor } = structuredClone(context);
  if (!validIdentifier(portfolio) || !validIdentifier(root) || purpose !== 'fresh-enrollment-review' ||
      !validHead(target) || target.version > RUN_LIMIT ||
      (floor && (!validHead(floor) || floor.version > target.version ||
        (floor.version === target.version && floor.id !== target.id)))) {
    throw new Error('Invalid review context');
  }
  if (typeof verifyFixture !== 'function') throw new TypeError('Fixture verifier required');

  let status = 'pending';
  let running = false;
  let previous = null;
  let verifiedBytes = 0;
  const authorities = new Set();
  const writers = new Set();

  function close(nextStatus) {
    status = nextStatus;
    previous = null;
    authorities.clear();
    writers.clear();
    return status;
  }

  return Object.freeze({
    cancel() {
      return status === 'pending' ? close('cancelled') : status;
    },

    verifySegment(objects) {
      if (status !== 'pending') throw new Error('Review session is closed');
      if (running) throw new Error('A segment is already being checked');
      // A segment has exactly the next up-to-128 states. Short, empty and
      // excessive pages are terminal and never become checkpoints.
      const expected = Math.min(SEGMENT_LIMIT, target.version - (previous?.version ?? 0));
      if (!Array.isArray(objects) || objects.length !== expected) return close('rejected');

      running = true;
      try {
        // Preflight the complete segment before calling the fixture verifier.
        const segment = [];
        for (let index = 0; index < expected; index++) {
          const object = objects[index];
          if (typeof object !== 'string' || object.length > OBJECT_LIMIT) return close('rejected');
          const bytes = encoder.encode(object).length;
          verifiedBytes += bytes;
          if (!bytes || bytes > OBJECT_LIMIT || verifiedBytes > BYTE_LIMIT) return close('rejected');
          segment.push(object);
        }

        for (const object of segment) {
          const state = verifyFixture(object, previous);
          if (status !== 'pending') return status;
          const members = snapshotWriters(state?.writers);
          if (!state || state.portfolio !== portfolio || state.root !== root ||
              state.version !== (previous?.version ?? 0) + 1 ||
              state.previousId !== (previous?.id ?? null) ||
              (!previous && state.authority !== root) ||
              (floor?.version === state.version && floor.id !== state.id) ||
              (target.version === state.version && target.id !== state.id) ||
              !validIdentifier(state.id) || !validIdentifier(state.authority) ||
              !members || writers.has(state.authority) || members.some(key =>
                key === state.authority || authorities.has(key))) {
            return close('rejected');
          }
          authorities.add(state.authority);
          for (const writer of members) writers.add(writer);
          previous = Object.freeze({
            id: state.id,
            version: state.version,
            authority: state.authority,
            writers: members
          });
        }
        return previous.version === target.version ? close('verified-chain-only') : status;
      } catch {
        return status === 'pending' ? close('rejected') : status;
      } finally {
        running = false;
      }
    }
  });
}
