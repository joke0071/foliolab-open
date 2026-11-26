import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const checkoutJobs = [
  ['quality-chromium', 'c2b9772d89a2efed62e859c5aef6ec610845cfe872dc4eb808febfcb0d97451c'],
  ['quality-cross', 'd0fea348fdb2bc0102d5d36af73f87cddba89cf87a06864d9501bc9da84f11d1'],
];
const sharedSteps = [
  ['quality-chromium-cache', 'Restore pinned Chromium shell cache (integration)'],
  ['quality-chromium-install', 'Install browser test tools'],
  ['quality-cross-cache', 'Restore pinned Firefox/WebKit cache (integration)'],
  ['quality-cross-install', 'Install Firefox and WebKit for cross-engine regression'],
];

function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length, 2, 'Expected one occurrence of ' + before.trim());
  return source.replace(before, () => after);
}

// Validate the new jobs before reassembling their exact old commands for the
// existing release seals. The original tests still protect the remaining jobs.
export function combinedQualityWorkflow(source) {
  let combined = source;
  let review;
  for (const [job, digest] of checkoutJobs) {
    const block = combined.match(new RegExp('^  ' + job + ':\\n[\\s\\S]*?(?=^  [a-z][a-z-]+:\\n)', 'm'))?.[0];
    assert.ok(block, 'Missing required job ' + job);
    assert.equal(createHash('sha256').update(block).digest('hex'), digest, job + ' check or evidence path changed');
    if (job === 'quality-chromium') {
      review = block.slice(block.indexOf('      - name: Expose bounded'), block.indexOf('      - name: Preserve UI quality evidence'));
      assert.ok(review.startsWith('      - name: Expose bounded synthetic C5 PR review\n'));
    }
    combined = replaceOnce(combined, block, '');
  }
  for (const [anchor, name] of sharedSteps) {
    combined = replaceOnce(combined, '      - &' + anchor + '\n        name: ' + name + '\n', '      - name: ' + name + '\n');
  }
  const deps = '    needs: [test, cross-engine, quality-chromium, quality-cross]\n';
  combined = replaceOnce(combined, deps, '    needs: [test, cross-engine]\n');
  const chromiumNext = '          node tests/browser-flatex-import.mjs\n';
  combined = replaceOnce(combined, chromiumNext, '          UI_QUALITY_SCREENSHOTS=1 node tests/browser-ui-quality.mjs\n' + chromiumNext);
  const crossEnd = '            FLH03_08_ENGINES=firefox,webkit node tests/browser-position-removal.mjs\n          else\n';
  combined = replaceOnce(combined, crossEnd, crossEnd.replace('          else', '            UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n          else'));
  const evidence = '      - name: Preserve test evidence\n';
  return replaceOnce(combined, evidence, review + evidence);
}
