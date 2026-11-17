import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import path from 'node:path';
// The sealed live workflow already supplies RELEASE_SHA and ETF_SOURCE_BASE.
const proof=process.env.FX_AGE_VERIFIED_RELEASE||(process.env.RELEASE_SHA&&new URL(process.env.ETF_SOURCE_BASE||'http://127.0.0.1:4173/').protocol==='https:'?'artifacts/gates/live/report.json':'');
if(!proof){
 await import('./browser-fx-age.mjs');
}else{
 // Preserve the original whole-matrix deadline across both phases.
 let child;
 const deadline=setTimeout(()=>{child?.kill('SIGKILL');console.error('FX age release deadline exceeded');process.exit(1);},180000);deadline.unref();
 const run=env=>new Promise((resolve,reject)=>{
  child=spawn(process.execPath,[path.resolve('tests/browser-fx-age.mjs')],{env,stdio:'inherit'});
  child.on('error',reject);child.on('exit',(code,signal)=>{try{assert.equal(code,0,'FX phase failed '+signal);resolve();}catch(e){reject(e);}});
 });
 try{
  await run({...process.env,FX_AGE_VERIFIED_RELEASE:proof,FX_AGE_DOMAIN_CONTROL:''});
  await run({...process.env,FX_AGE_VERIFIED_RELEASE:'',FX_AGE_DOMAIN_CONTROL:'1',FX_AGE_OUTPUT_DIR:(process.env.FX_AGE_OUTPUT_DIR||'artifacts/gates/fx-age')+'/production-domain'});
 }finally{clearTimeout(deadline);}
}
