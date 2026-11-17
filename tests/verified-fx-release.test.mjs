import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifiedFXRelease} from './verified-fx-release.mjs';
const sha='a'.repeat(40),base='https://release.example.test/';
function fixture(fn){const root=mkdtempSync(path.join(tmpdir(),'fx-proof-'));try{const values={'./':'<html>synthetic</html>','./sw.js':"const CACHE='test-v1';\nconst ASSETS=['./'];\n"};for(const [key,value]of Object.entries(values))writeFileSync(path.join(root,key==='./'?'index.html':key.slice(2)),value);const report={sha,base,result:'PASS',proxyCertificateException:false,cache:'test-v1',assetHashes:Object.entries(values).map(([p,b])=>({path:p,sha256:createHash('sha256').update(b).digest('hex')}))},file=path.join(root,'report.json');const load=()=>{writeFileSync(file,JSON.stringify(report));return verifiedFXRelease(file,{root,sha,base});};fn({root,report,load});}finally{rmSync(root,{recursive:true,force:true});}}
test('audited bytes are held unchanged even if checkout changes later',()=>fixture(({root,load})=>{const sealed=load();writeFileSync(path.join(root,'index.html'),'changed');assert.equal(sealed.files.get('/').toString(),'<html>synthetic</html>');assert.throws(load,/Audited published bytes/);}));
test('failed, TLS-exception, wrong release or wrong domain proofs cannot authorize replay',()=>{for(const [key,value]of [['result','FAIL'],['proxyCertificateException',true],['sha','b'.repeat(40)],['base','https://other.example.test/']])fixture(({report,load})=>{report[key]=value;assert.throws(load);});});
test('missing, duplicated or extra audited files reject rather than silently falling back',()=>{for(const mutation of [r=>r.assetHashes.pop(),r=>r.assetHashes.push(r.assetHashes[0]),r=>r.assetHashes.push({path:'./extra.js',sha256:'0'.repeat(64)})])fixture(({report,load})=>{mutation(report);assert.throws(load,/Every original audited file exactly once/);});});
test('changed service-worker asset membership or revision rejects old proof',()=>{for(const sw of ["const CACHE='test-v2';\nconst ASSETS=['./'];\n","const CACHE='test-v1';\nconst ASSETS=['./','./new.js'];\n"])fixture(({root,load})=>{writeFileSync(path.join(root,'sw.js'),sw);assert.throws(load);});});
