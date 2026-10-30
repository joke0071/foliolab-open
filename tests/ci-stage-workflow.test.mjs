import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source = readFileSync(new URL('../.github/workflows/import.yml', import.meta.url), 'utf8');
const hashes = {"test": "ff07928ba1afb9b46963a14c07070f667bf11656e3b5d015791371c6c660329c", "cross-engine": "968e44c353136e18f3e108d30ab40a00b54acc4a58ef4e3758704160e44070d9", "deploy": "568af6de8fc542f67cdfb8255b00a38f7e06f0f8ca04d15f314d90fa8b5ac459", "live-acceptance": "650739b764551d00bf7529d17662f8369eddabf38f5473842fe80af2c75f856e"};
function validate(s) {
  assert.match(s, /types: \[opened, synchronize, reopened, ready_for_review, converted_to_draft\]/);
  for (const name of ['test', 'cross-engine']) assert.ok(s.includes('  '+name+':\n    needs: [plan]\n    if: needs.plan.outputs.full == '+"'true'"+'\n'));
  assert.ok(s.includes('    if: needs.plan.outputs.stage == '+"'FAST'"+" || needs.plan.outputs.ci_contract == 'true'"));
  assert.match(s, /run: node tests\/ci-stage-plan.mjs/);
  assert.match(s, /fetch-depth: 0/);
  assert.match(s, /needs: \[test, cross-engine\]/);
  for (const [name, next] of [['test','cross-engine'], ['cross-engine','deploy'], ['deploy','live-acceptance'], ['live-acceptance', null]]) {
    let part = s.slice(s.indexOf('  '+name+':\n'), next ? s.indexOf('  '+next+':\n') : undefined);
    if (['test','cross-engine'].includes(name)) part = part.slice(part.indexOf(name === 'test' ? '    runs-on:' : '    strategy:'));
    assert.equal(createHash('sha256').update(part).digest('hex'), hashes[name], name+' full regression/deployment body must remain byte-identical');
  }
  for (const name of ['browser-ui07-audit','browser-responsive-actions','browser-dialog-a11y-mobile']) assert.ok(s.includes('node tests/'+name+'.mjs 2>&1 | tee artifacts/fast/'));
  assert.match(s, /name: fast-only-not-integration-/);
}
test('stage workflow preserves every full regression, deployment and live body byte-for-byte', () => validate(source));
test('stage policy rejects missing review event, unsafe gate, reduced deploy dependency or dropped FAST audit', () => {
  for (const broken of [source.replace('ready_for_review, ', ''), source.replace("if: needs.plan.outputs.full == 'true'", "if: always()"), source.replace('needs: [test, cross-engine]', 'needs: [test]'), source.replace('node tests/browser-ui07-audit.mjs 2>&1 | tee artifacts/fast/', 'echo removed ')]) {
    assert.notEqual(broken, source); assert.throws(() => validate(broken));
  }
});
