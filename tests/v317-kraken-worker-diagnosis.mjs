import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const output='artifacts/v317-kraken-worker';
await fs.mkdir(output,{recursive:true});
const report={product:'a53856e385ef1d9fd65d8710618244e80b8341e7',originalJob:132821674164,originalTest:'tests/browser-kraken-import.mjs',unchangedTimeoutMs:20000,startedAt:new Date().toISOString(),browsers:[]};
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{
 const browser=await launch(...args), data={index:report.browsers.length,events:[],contexts:[]};
 report.browsers.push(data);
 const cdp=await browser.newBrowserCDPSession();let id=0;
 cdp.on('Target.attachedToTarget',async e=>{
  data.events.push({event:'attached',at:Date.now(),payload:e});
  if(e.targetInfo.type!=='service_worker')return;
  for(const method of ['Network.enable','Runtime.enable','Runtime.runIfWaitingForDebugger'])
   try{await cdp.send('Target.sendMessageToTarget',{sessionId:e.sessionId,message:JSON.stringify({id:++id,method})});}
   catch(error){data.events.push({event:'instrumentationError',message:String(error)});}
 });
 cdp.on('Target.receivedMessageFromTarget',e=>data.events.push({at:Date.now(),sessionId:e.sessionId,payload:JSON.parse(e.message)}));
 cdp.on('Target.detachedFromTarget',e=>data.events.push({event:'detached',at:Date.now(),payload:e}));
 await cdp.send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:false,filter:[{type:'service_worker',exclude:false},{exclude:true}]});
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
