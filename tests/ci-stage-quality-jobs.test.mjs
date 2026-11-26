import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {combinedQualityWorkflow} from './ci-stage-quality-jobs.mjs';

const workflow = readFileSync(new URL('../.github/workflows/import.yml', import.meta.url), 'utf8');
test('both isolated UI jobs are mandatory and retain engine, screenshots and upload controls', () => {
  combinedQualityWorkflow(workflow);
  for (const [before, after] of [
    ['quality-chromium, quality-cross]', 'quality-chromium]'],
    ['- *quality-cross-install', '- *quality-chromium-install'],
    ['- &quality-cross-cache', '- &unrelated-cache'],
    ['UI_QUALITY_ENGINES=firefox,webkit node tests/browser-ui-quality.mjs\n', 'UI_QUALITY_ENGINES=firefox node tests/browser-ui-quality.mjs\n'],
    ['UI_QUALITY_SCREENSHOTS=1 node tests/browser-ui-quality.mjs\n', 'node tests/browser-ui-quality.mjs\n'],
    ['- name: Preserve UI quality evidence\n        if: always()', '- name: Preserve UI quality evidence\n        if: success()'],
    ['- name: Run the full local UI quality suite', '- continue-on-error: true\n        name: Run the full local UI quality suite'],
  ]) {
    const changed = workflow.replace(before, after);
    assert.notEqual(changed, workflow);
    assert.throws(() => combinedQualityWorkflow(changed));
  }
});
