import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const output='artifacts/v317-kraken-worker';
await fs.mkdir(output,{recursive:true});
const report={product:'a53856e385ef1d9fd65d8710618244e80b8341e7',originalJob:132821674164,originalTest:'tests/browser-kraken-import.mjs',unchangedTimeoutMs:20000,startedAt:new Date().toISOString(),browsers:[]};
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{
 args[0]={...args[0],args:[...(args[0]?.args||[]),'--remote-debugging-port=9222']};
 const browser=await launch(...args), data={index:report.browsers.length,events:[],contexts:[]};
 report.browsers.push(data);
 const version=await (await fetch('http://127.0.0.1:9222/json/version')).json();
 const ws=new WebSocket(version.webSocketDebuggerUrl); await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map();
 const command=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 ws.addEventListener('message',async e=>{
  const m=JSON.parse(e.data);data.events.push({at:Date.now(),payload:m});
  if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}
  if(m.method==='Target.attachedToTarget'&&m.params.targetInfo.type==='service_worker'){
   const session=m.params.sessionId;
   try{await command('Network.enable',{},session);await command('Runtime.enable',{},session);await command('Runtime.runIfWaitingForDebugger',{},session);}
   catch(error){data.events.push({event:'instrumentationError',message:String(error)});}
  }
 });
 await command('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true,filter:[{type:'service_worker',exclude:false},{exclude:true}]});
 const newContext=browser.newContext.bind(browser);
 browser.newContext=async(...opts)=>{
  const context=await newContext(...opts), c={index:data.contexts.length,options:opts,events:[]};data.contexts.push(c);
  context.on('requestfailed',r=>c.events.push({event:'requestfailed',url:r.url(),failure:r.failure(),at:Date.now()}));
  context.on('response',r=>{if(r.status()>=400)c.events.push({event:'response',url:r.url(),status:r.status(),headers:r.headers(),at:Date.now()});});
  context.on('page',p=>p.on('pageerror',e=>c.events.push({event:'pageerror',message:String(e),at:Date.now()})));
  return context;
 };
 const close=browser.close.bind(browser);
 browser.close=async(...opts)=>{data.closedAt=new Date().toISOString();await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2));return close(...opts);};
 return browser;
};
process.env.UH03_BASE='https://foliolab.unperfekt.at/';
process.env.HISTORY_ENGINES='chromium';
try{await import('./browser-kraken-import.mjs');report.result='PASS';}
catch(error){report.result='FAIL';report.error=String(error.stack||error);throw error;}
finally{report.finishedAt=new Date().toISOString();await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2));}
