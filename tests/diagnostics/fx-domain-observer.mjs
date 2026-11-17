import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from 'playwright';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifiedFXRelease} from './candidate-verified-fx-release.mjs';
const base='https://foliolab.unperfekt.at/',release=verifiedFXRelease(process.env.QA_ROOT+'/tests/diagnostics/fx-original-live-report.json',{base});
const data={requests:[],responses:[],failed:[],versions:[],bodyErrors:[],scope:'Passive response-body comparison, no additional HTTP requests'};
for(const [name,type] of Object.entries({chromium,firefox,webkit})){
 const launch=type.launch.bind(type);type.launch=async(...args)=>{const browser=await launch(...args);data.versions.push({name,version:browser.version()});const newContext=browser.newContext.bind(browser);browser.newContext=async(...args)=>{
  const context=await newContext(...args),pending=[];
  context.on('request',r=>{if(r.url().startsWith(base))data.requests.push({url:r.url(),at:Date.now()});});
  context.on('requestfailed',r=>data.failed.push({url:r.url(),failure:r.failure(),at:Date.now()}));
  context.on('response',r=>{if(!r.url().startsWith(base))return;const row={url:r.url(),status:r.status(),headers:r.headers(),at:Date.now()};data.responses.push(row);pending.push((async()=>{try{const body=await r.body();row.sha256=createHash('sha256').update(body).digest('hex');const want=release.files.get(new URL(r.url()).pathname);assert.ok(want);assert.equal(r.status(),200);assert.equal(row.sha256,createHash('sha256').update(want).digest('hex'));}catch(e){row.error=String(e);data.bodyErrors.push(row.error);}})());});
  const close=context.close.bind(context);context.close=async(...args)=>{await Promise.all(pending);try{assert.deepEqual(data.bodyErrors,[]);assert.deepEqual(data.failed.filter(r=>!(r.url===base+'icons/flask.svg'&&r.failure?.errorText==='NS_BINDING_ABORTED'&&data.responses.some(x=>x.url===r.url&&x.status===200&&x.sha256&&!x.error))),[]);}finally{await close(...args);}};return context;};return browser;};
}
process.on('exit',()=>writeFileSync(process.env.FX_AGE_OUTPUT_DIR+'/request-observation.json',JSON.stringify(data,null,2)));
