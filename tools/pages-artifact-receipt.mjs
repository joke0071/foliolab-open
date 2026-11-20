import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Bind the upload from the tested job to the commit deployed by this run.
export function pagesArtifactName(artifact, {run, commit, attempt, id}) {
  if (![run, attempt, id].every(value => /^[1-9]\d*$/.test(value)) || !/^[a-f0-9]{40}$/.test(commit)) {
    throw new Error('Incomplete Pages upload receipt');
  }
  const name = `github-pages-attempt-${attempt}`;
  if (String(artifact.id) !== id || artifact.name !== name || artifact.expired !== false ||
      artifact.size_in_bytes <= 0 || !Number.isSafeInteger(artifact.size_in_bytes) ||
      !/^sha256:[a-f0-9]{64}$/.test(artifact.digest) ||
      String(artifact.workflow_run?.id) !== run || artifact.workflow_run.head_sha !== commit) {
    throw new Error('Pages upload does not match the tested run, commit and producing attempt');
  }
  return name;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [run, commit, attempt, id] = process.argv.slice(2);
  console.log(pagesArtifactName(JSON.parse(readFileSync(0, 'utf8')), {run, commit, attempt, id}));
}
