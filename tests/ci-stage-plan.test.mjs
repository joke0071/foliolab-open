import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync, symlinkSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {classify, readChanges, makePlan} from './ci-stage-plan.mjs';
const draft = {eventName: 'pull_request', ref: 'refs/pull/1/merge', event: {action: 'synchronize', pull_request: {draft: true, base: {ref: 'main'}}}, baseIsAncestor: true};
const change = (path, status = 'M', oldMode = '100644', newMode = '100644') => ({path, status, oldMode, newMode});
const plan = (changes, overrides = {}) => classify({...draft, changes, ...overrides});

test('FAST is limited to explicit draft documentation and modified CSS', () => {
  assert.deepEqual(plan([change('styles.css'), change('docs/review.md', 'A', '000000')]), {stage: 'FAST', full: false, css: true, reason: 'Draft CSS: full units/syntax and existing targeted UI audits'});
  assert.equal(plan([change('docs/qa/report.md')]).css, false);
  for (const overrides of [{baseIsAncestor: false}, {baseIsAncestor: undefined}, {error: 'git failed'}, {event: {pull_request: {draft: false, base: {ref: 'main'}}}}, {event: {action: 'ready_for_review', pull_request: {draft: true, base: {ref: 'main'}}}}, {event: {pull_request: {draft: true, base: {ref: 'p0/review'}}}}]) assert.equal(plan([change('styles.css')], overrides).full, true);
  assert.equal(plan([]).full, true);
});
test('all financial, storage, PWA and unknown paths force full regression, including mixed changes', () => {
  const critical = ['src/decimal.js', 'src/transactions.js', 'src/atomic-storage.js', 'src/browser-portfolio-storage.js', 'src/wallet-history-core.js', 'src/complete-backup.js', 'src/backup-vault.js', 'src/position-removal.js', 'src/model.js', 'sw.js', 'manifest.webmanifest', 'index.html', 'icons/flask.svg', 'worker/src/index.js', 'package.json', 'package-lock.json', '.github/workflows/import.yml', 'tests/browser-pwa-update.mjs', 'tests/ci-stage-plan.mjs', 'unknown.css', 'docs/run.mjs', 'docs/ui.png'];
  for (const path of critical) assert.equal(plan([change('styles.css'), change(path)]).stage, 'INTEGRATION', path);
  for (const c of [change('styles.css', 'A', '000000'), change('styles.css', 'D', '100644', '000000'), change('docs/x.md', 'M', '100644', '120000'), change('docs/x.md', 'M', '100644', '100755'), change('docs/x.md', 'T'), change('docs/../x.md'), change('docs/\nx.md'), change('docs\\x.md')]) assert.equal(plan([c]).full, true, JSON.stringify(c));
});
test('main push and manual release can never inherit reduced draft selection', () => {
  for (const eventName of ['push', 'workflow_dispatch']) assert.equal(plan([change('docs/x.md')], {eventName, ref: 'refs/heads/main'}).stage, 'RELEASE');
  assert.equal(plan([change('docs/x.md')], {eventName: 'workflow_dispatch', ref: 'refs/heads/other'}).stage, 'INTEGRATION');
});
test('real git diff handles addition, removal, rename, symlink, stale base and CLI receipt without optimistic fallback', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'foliolab-ci-plan-'));
  const git = (...args) => execFileSync('git', args, {cwd, encoding: 'utf8'}).trim();
  const commit = () => {git('add', '-A'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD');};
  try {
    git('init', '-q'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture');
    writeFileSync(join(cwd, 'styles.css'), 'body{}'); const base = commit();
    writeFileSync(join(cwd, 'styles.css'), 'body{color:green}'); const head = commit();
    const impact = readChanges(base, head, cwd); assert.equal(plan(impact.changes).stage, 'FAST');
    const event = {...draft.event, pull_request: {...draft.event.pull_request, base: {ref: 'main', sha: base}, head: {sha: head}}};
    const eventPath = join(cwd, 'event.json'); writeFileSync(eventPath, JSON.stringify(event));
    assert.equal(makePlan({GITHUB_EVENT_NAME: 'pull_request', GITHUB_REF: draft.ref, GITHUB_EVENT_PATH: eventPath}, cwd).stage, 'FAST');
    const output = join(cwd, 'output');
    execFileSync(process.execPath, [new URL('./ci-stage-plan.mjs', import.meta.url).pathname], {cwd, env: {...process.env, GITHUB_EVENT_NAME: 'pull_request', GITHUB_REF: draft.ref, GITHUB_EVENT_PATH: eventPath, GITHUB_OUTPUT: output}});
    assert.match(readFileSync(output, 'utf8'), /stage=FAST\nfull=false\ncss=true/);
    assert.equal(JSON.parse(readFileSync(join(cwd, 'artifacts/ci-stage/plan.json'))).head, head);
    git('mv', 'styles.css', 'renamed.css'); const renamed = commit(); assert.equal(plan(readChanges(head, renamed, cwd).changes).full, true);
    git('checkout', '-q', head); rmSync(join(cwd, 'styles.css')); symlinkSync('somewhere', join(cwd, 'styles.css')); const linked = commit();
    assert.equal(plan(readChanges(head, linked, cwd).changes).full, true);
    assert.equal(readChanges(linked, renamed, cwd).baseIsAncestor, false);
    assert.equal(makePlan({GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: '/missing'}, cwd).full, true);
    assert.throws(() => readChanges('not-a-sha', head, cwd));
  } finally {rmSync(cwd, {recursive: true, force: true});}
});
