import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
// Run against the original PR308 head 1aa742996482c776ae0673090a1245af4ed2a1b0.
// The hash guard prevents a fixed implementation from being reported as baseline.
const root=resolve(process.env.FOLIOLAB_SOURCE_ROOT||'.');
const bytes=readFileSync(resolve(root,'src/dashboard-ui.js'));
assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex'),'76b30cb44a29f3a2df71c8555886db6da7d0f15a');
const {wealthChangePresentation}=await import(pathToFileURL(resolve(root,'src/dashboard-ui.js')));
const samples=[{date:'2026-11-05',totalEURExact:'100',valuationStatus:'manual'},{date:'2026-11-06',totalEURExact:'20',valuationStatus:'partial',source:'current'}],before=structuredClone(samples);
const actual=wealthChangePresentation({basis:'observed'},samples,String,d=>d,{period:true});
assert.equal(actual.delta,'-80','baseline reproduces the unintended comparable value');
assert.deepEqual(samples,before);
console.log(JSON.stringify({result:'BASELINE_DEFECT_REPRODUCED',baselineHead:'1aa742996482c776ae0673090a1245af4ed2a1b0',expectedDelta:null,actual,scope:'synthetic presentation only; modern partial automatic snapshot is not a fully comparable observation'}));
