import {execFileSync} from 'node:child_process';
import {readFileSync, mkdirSync, writeFileSync, appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const sha = /^[a-f0-9]{40}$/;
export function readChanges(base, head, cwd = process.cwd()) {
  if (!sha.test(base || '') || !sha.test(head || '')) throw new Error('Missing exact base/head SHA');
  const git = args => execFileSync('git', args, {cwd, encoding: 'utf8'});
  const baseIsAncestor = git(['merge-base', base, head]).trim() === base;
  const raw = git(['diff', '--raw', '--no-abbrev', '--no-renames', '-z', base, head, '--']);
  const fields = raw.split('\0');
  if (fields.pop() !== '') throw new Error('Unterminated change list');
  const changes = [];
  for (let i = 0; i < fields.length; i += 2) {
    const match = /^:(\d{6}) (\d{6}) [a-f0-9]{40} [a-f0-9]{40} ([AMDTRCU])$/.exec(fields[i]);
    if (!match || !fields[i + 1]) throw new Error('Unrecognized change record');
    changes.push({path: fields[i + 1], oldMode: match[1], newMode: match[2], status: match[3]});
  }
  return {baseIsAncestor, changes};
}

export function classify({eventName, ref, event, baseIsAncestor, changes, error}) {
  const full = reason => ({stage: eventName !== 'pull_request' && ref === 'refs/heads/main' ? 'RELEASE' : 'INTEGRATION', full: true, css: false, reason});
  if (eventName !== 'pull_request') return full('Non-PR events always require full regression');
  if (event?.pull_request?.draft !== true || event?.pull_request?.base?.ref !== 'main') return full('Only explicit main-targeted drafts may use FAST');
  if (event.action === 'ready_for_review') return full('Review transition requires full integration');
  if (error || baseIsAncestor !== true || !Array.isArray(changes) || !changes.length) return full(error || 'Unknown, empty or outdated-base impact');
  let css = false;
  for (const c of changes) {
    const regular = c.newMode === '100644' && (c.oldMode === '100644' || (c.status === 'A' && c.oldMode === '000000'));
    const safePath = typeof c.path === 'string' && !/[\x00-\x1f\\]/.test(c.path) && c.path.split('/').every(p => p && p !== '.' && p !== '..');
    if (!regular || !safePath) return full('Unknown path or file mode');
    if (c.path === 'styles.css' && c.status === 'M') { css = true; continue; }
    if (/^docs\/.+\.md$/.test(c.path) && ['A', 'M'].includes(c.status)) continue;
    return full('Changes outside the explicit documentation/CSS allowlist');
  }
  return {stage: 'FAST', full: false, css, reason: css ? 'Draft CSS: full units/syntax and existing targeted UI audits' : 'Draft documentation only: full units/syntax; no runtime impact'};
}

export function makePlan(env = process.env, cwd = process.cwd()) {
  let event, impact = {};
  try {
    event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
    if (env.GITHUB_EVENT_NAME === 'pull_request') impact = readChanges(event.pull_request?.base?.sha, event.pull_request?.head?.sha, cwd);
  } catch (e) { impact.error = 'Impact discovery failed: ' + e.message; }
  const plan = classify({eventName: env.GITHUB_EVENT_NAME, ref: env.GITHUB_REF, event, ...impact});
  const ciContract = impact.changes?.some(c => c.path === '.github/workflows/import.yml' || /^tests\/ci-stage-/.test(c.path)) || false;
  return {...plan, ciContract, base: event?.pull_request?.base?.sha || null, head: event?.pull_request?.head?.sha || env.GITHUB_SHA || null, changes: impact.changes || [], baseIsAncestor: impact.baseIsAncestor ?? null,
    warning: plan.full ? 'Complete existing integration/release gates required.' : 'FAST ONLY: not integration approval; ready_for_review must run the complete regression.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const plan = makePlan();
  mkdirSync('artifacts/ci-stage', {recursive: true});
  writeFileSync('artifacts/ci-stage/plan.json', JSON.stringify(plan, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `stage=${plan.stage}\nfull=${plan.full}\ncss=${plan.css}\nci_contract=${plan.ciContract}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${plan.stage}\n\n${plan.warning}\n\n${plan.reason}\n`);
  console.log(JSON.stringify(plan, null, 2));
}
