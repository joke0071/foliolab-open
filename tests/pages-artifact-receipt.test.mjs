import assert from 'node:assert/strict';
import test from 'node:test';
import {pagesArtifactName} from '../tools/pages-artifact-receipt.mjs';

const receipt = {id:'132', run:'31', attempt:'2', commit:'a'.repeat(40)};
const artifact = {id:132, name:'github-pages-attempt-2', expired:false, size_in_bytes:58,
  digest:'sha256:'+'d'.repeat(64), workflow_run:{id:31, head_sha:receipt.commit}};

test('a deploy retry retains the upload of the qualified producer', () => {
  assert.equal(pagesArtifactName(artifact, receipt), artifact.name);
  assert.throws(() => pagesArtifactName(artifact, {...receipt, attempt:'3'}));
});

test('an unverified or different Pages upload is refused', () => {
  for (const change of [{id:133}, {name:'github-pages'}, {expired:true}, {size_in_bytes:0},
    {digest:null}, {workflow_run:{...artifact.workflow_run, id:32}},
    {workflow_run:{...artifact.workflow_run, head_sha:'b'.repeat(40)}}, {workflow_run:null}]) {
    assert.throws(() => pagesArtifactName({...artifact, ...change}, receipt));
  }
  assert.throws(() => pagesArtifactName(artifact, {...receipt, id:''}));
});
