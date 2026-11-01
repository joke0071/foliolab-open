import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source = readFileSync(new URL('../.github/workflows/import.yml', import.meta.url), 'utf8');
const hashes = {"test": "ff07928ba1afb9b46963a14c07070f667bf11656e3b5d015791371c6c660329c", "cross-engine": "968e44c353136e18f3e108d30ab40a00b54acc4a58ef4e3758704160e44070d9", "deploy": "568af6de8fc542f67cdfb8255b00a38f7e06f0f8ca04d15f314d90fa8b5ac459", "live-acceptance": "650739b764551d00bf7529d17662f8369eddabf38f5473842fe80af2c75f856e"};
const pinnedCacheSteps = [
 [
  "      - name: Restore pinned Chromium shell cache (FAST)",
  "        if: needs.plan.outputs.css == 'true' || needs.plan.outputs.ci_contract == 'true'",
  "        uses: actions/cache@v4",
  "        with:",
  "          path: ~/.cache/ms-playwright",
  "          key: foliolab-pw1.56.1-chromium-shell-v1-${{ runner.os }}-${{ runner.arch }}"
 ],
 [
  "      - name: Restore pinned Chromium shell cache (integration)",
  "        uses: actions/cache@v4",
  "        with:",
  "          path: ~/.cache/ms-playwright",
  "          key: foliolab-pw1.56.1-chromium-shell-v1-${{ runner.os }}-${{ runner.arch }}"
 ],
 [
  "      - name: Restore pinned Firefox/WebKit cache (integration)",
  "        uses: actions/cache@v4",
  "        with:",
  "          path: ~/.cache/ms-playwright",
  "          key: foliolab-pw1.64.1-firefox-webkit-v1-${{ runner.os }}-${{ runner.arch }}"
 ]
].map(lines=>lines.join('\n')+'\n');

/** Preserve every sealed historical command; strip only the three pinned cache
 * stanzas, mandatory additional recovery/finance/ETF suites and the increased live timeout.
 * The unchanged baseline hashes still protect all original workflow bodies. */
function originalContractWithOnlyPinnedCaches(source) {
 let reduced=source;
 const additions=[
  '          node tests/browser-unified-bitcoin.mjs\n',
  '            HISTORY_ENGINES=firefox,webkit node tests/browser-unified-bitcoin.mjs\n',
  '          UH02_BASE="$ACCEPTANCE_BASE" node tests/browser-unified-bitcoin.mjs 2>&1 | tee artifacts/gates/production-uh02-chromium.log\n',
  '          UH02_BASE="$ACCEPTANCE_BASE" HISTORY_ENGINES=firefox,webkit node tests/browser-unified-bitcoin.mjs 2>&1 | tee artifacts/gates/production-uh02-cross.log\n',
  '          node tests/browser-cash-account-ux.mjs\n',
  '            CASH_UX_ENGINES=firefox,webkit node tests/browser-cash-account-ux.mjs\n',
  '          CASH_UX_BASE="$ACCEPTANCE_BASE" node tests/browser-cash-account-ux.mjs 2>&1 | tee artifacts/gates/production-cash-ux-chromium.log\n',
  '          CASH_UX_BASE="$ACCEPTANCE_BASE" CASH_UX_ENGINES=firefox,webkit node tests/browser-cash-account-ux.mjs 2>&1 | tee artifacts/gates/production-cash-ux-cross.log\n',
  '          node tests/browser-etf-source-recovery.mjs\n',
  '            ETF_SOURCE_ENGINES=firefox,webkit node tests/browser-etf-source-recovery.mjs\n',
  '          ETF_SOURCE_BASE="$ACCEPTANCE_BASE" node tests/browser-etf-source-recovery.mjs 2>&1 | tee artifacts/gates/production-etf-source-chromium.log\n',
  '          ETF_SOURCE_BASE="$ACCEPTANCE_BASE" ETF_SOURCE_ENGINES=firefox,webkit node tests/browser-etf-source-recovery.mjs 2>&1 | tee artifacts/gates/production-etf-source-cross.log\n',
  '          node tests/browser-fin-e2e.mjs\n',
  '            FIN_E2E_ENGINES=firefox,webkit node tests/browser-fin-e2e.mjs\n',
  '          FIN_E2E_BASE="$ACCEPTANCE_BASE" node tests/browser-fin-e2e.mjs 2>&1 | tee artifacts/gates/production-fin-e2e-chromium.log\n',
  '          FIN_E2E_BASE="$ACCEPTANCE_BASE" FIN_E2E_ENGINES=firefox,webkit node tests/browser-fin-e2e.mjs 2>&1 | tee artifacts/gates/production-fin-e2e-cross.log\n',
  '          node tests/browser-recovery-backup-limits.mjs\n',
  '            RECOVERY_ENGINES=firefox,webkit node tests/browser-recovery-backup-limits.mjs\n',
  '          RECOVERY_BASE="$ACCEPTANCE_BASE" node tests/browser-recovery-backup-limits.mjs 2>&1 | tee artifacts/gates/production-recovery-chromium.log\n',
  '          RECOVERY_BASE="$ACCEPTANCE_BASE" RECOVERY_ENGINES=firefox,webkit node tests/browser-recovery-backup-limits.mjs 2>&1 | tee artifacts/gates/production-recovery-cross.log\n'
 ];
 for(const line of additions){assert.equal(reduced.split(line).length,2,'Each recovery addition is mandatory exactly once');reduced=reduced.replace(line,'');}
 assert.equal(reduced.split('    timeout-minutes: 25\n').length,2);
 reduced=reduced.replace('    timeout-minutes: 25\n','    timeout-minutes: 20\n');
 for(const block of pinnedCacheSteps){
  assert.equal(reduced.split(block).length,2,'Every exact cache stanza must appear once');
  reduced=reduced.replace(block,'');
 }
 assert.doesNotMatch(reduced,/uses: actions\/cache@v4/,'No other unreviewed cache steps');
 return reduced;
}
function validate(s) {
  const sealed=originalContractWithOnlyPinnedCaches(s);
  assert.match(s, /types: \[opened, synchronize, reopened, ready_for_review, converted_to_draft\]/);
  for (const name of ['test', 'cross-engine']) assert.ok(s.includes('  '+name+':\n    needs: [plan]\n    if: needs.plan.outputs.full == '+"'true'"+'\n'));
  assert.ok(s.includes('    if: needs.plan.outputs.stage == '+"'FAST'"+" || needs.plan.outputs.ci_contract == 'true'"));
  assert.match(s, /run: node tests\/ci-stage-plan.mjs/);
  assert.match(s, /fetch-depth: 0/);
  assert.match(s, /needs: \[test, cross-engine\]/);
  for (const [name, next] of [['test','cross-engine'], ['cross-engine','deploy'], ['deploy','live-acceptance'], ['live-acceptance', null]]) {
    let part = sealed.slice(sealed.indexOf('  '+name+':\n'), next ? sealed.indexOf('  '+next+':\n') : undefined);
    if (['test','cross-engine'].includes(name)) part = part.slice(part.indexOf(name === 'test' ? '    runs-on:' : '    strategy:'));
    assert.equal(createHash('sha256').update(part).digest('hex'), hashes[name], name+' full regression/deployment body must remain byte-identical');
  }
  for (const name of ['browser-ui07-audit','browser-responsive-actions','browser-dialog-a11y-mobile']) assert.ok(s.includes('node tests/'+name+'.mjs 2>&1 | tee artifacts/fast/'));
  assert.match(s, /name: fast-only-not-integration-/);
}
test('stage workflow preserves every full regression, deployment and live body byte-for-byte', () => validate(source));
test('stage policy rejects missing review event, unsafe gate, reduced deploy dependency or dropped FAST audit', () => {
  for (const broken of [source.replace('ready_for_review, ', ''), source.replace("if: needs.plan.outputs.full == 'true'", "if: always()"), source.replace('needs: [test, cross-engine]', 'needs: [test]'), source.replace('node tests/browser-ui07-audit.mjs 2>&1 | tee artifacts/fast/', 'echo removed '), source.replace('foliolab-pw1.64.1-firefox-webkit-v1-', 'unversioned-unsafe-'), source.replace('DEBUG=pw:install npx playwright install --with-deps firefox webkit', 'echo skipped-browser-install')]) {
    assert.notEqual(broken, source); assert.throws(() => validate(broken));
  }
});

test('superseded PR runs share one concurrency group while main remains separate', () => {
  assert.ok(source.includes("group: foliolab-open-pages-"+'$'+"{{ github.event_name == 'pull_request' && github.event.pull_request.number || github.ref }}"));
  assert.match(source, /cancel-in-progress: true/);
});
