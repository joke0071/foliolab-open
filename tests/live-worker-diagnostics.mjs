// Preload only in live acceptance / isolated diagnostic QA. Product bytes and
// assertions are untouched. CDP autoattach pauses new workers until Network is
// enabled, so observation can alter timing and is not proof of an old cause.
import {chromium,firefox,webkit} from 'playwright';
import {mkdirSync,appendFileSync} from 'node:fs';

if(process.env.LIVE_WORKER_DIAGNOSTICS==='1'){
 const dir=process.env.LIVE_WORKER_DIAGNOSTICS_DIR||'artifacts/gates/worker-diagnostics';
 mkdirSync(dir,{recursive:true});
 let sequence=0;
 for(const type of [chromium,firefox,webkit]){
  const launch=type.launch.bind(type);
  type.launch=async(options={})=>{
   const engine=type.name(),file=dir+'/'+engine+'-'+process.pid+'-'+sequence+++'.jsonl';
   const log=(event,data={})=>appendFileSync(file,JSON.stringify({at:Date.now(),event,...data})+'\n');
   log('start',{engine,script:process.argv[1],scope:engine==='chromium'?'direct-worker-CDP':'context-network-and-document-lifecycle',timingAffected:true});
   const port=Number(process.env.LIVE_WORKER_DIAGNOSTICS_PORT||9222);
   const browser=await launch({...options,...(engine==='chromium'?{args:[...(options.args||[]),'--remote-debugging-port='+port]}:{})});
   let ws,closing=false;
   if(engine==='chromium'){
    try{
     const version=await (await fetch('http://127.0.0.1:'+port+'/json/version',{signal:AbortSignal.timeout(5000)})).json();
     ws=new WebSocket(version.webSocketDebuggerUrl);
     await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('CDP socket timeout')),5000);ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});ws.addEventListener('error',e=>{clearTimeout(timer);reject(e);},{once:true});});
     let id=0;const pending=new Map();
     const command=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
      const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error(method+' timeout'));},5000);
      pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));
     });
     ws.addEventListener('message',async e=>{
      const m=JSON.parse(e.data);
      if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}
      if(m.method)log('cdp',{sessionId:m.sessionId,method:m.method,params:m.params});
      if(m.method==='Target.attachedToTarget'&&m.params.targetInfo.type==='service_worker'){
       const session=m.params.sessionId;
       try{await command('Network.enable',{},session);await command('Runtime.enable',{},session);}
       catch(error){log('instrumentationError',{error:String(error)});}
       finally{await command('Runtime.runIfWaitingForDebugger',{},session).catch(error=>log('instrumentationError',{error:String(error)}));}
      }
     });
     ws.addEventListener('error',()=>log(closing?'socketErrorDuringTeardown':'instrumentationError',{error:'CDP socket error'}));
     await command('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true,filter:[{type:'service_worker',exclude:false},{exclude:true}]});
     log('workerCaptureReady');
    }catch(error){log('instrumentationError',{error:String(error)});ws?.close();await browser.close();throw error;}
   }
   const newContext=browser.newContext.bind(browser);let contextIndex=0;
   browser.newContext=async(...args)=>{
    const context=await newContext(...args),index=contextIndex++;
    const record=(event,data)=>log(event,{context:index,...data});
    record('context',{serviceWorkers:args[0]?.serviceWorkers||'allow'});
    context.on('request',r=>record('contextRequest',{url:r.url(),method:r.method(),resourceType:r.resourceType()}));
    context.on('response',r=>record('contextResponse',{url:r.url(),status:r.status()}));
    context.on('requestfailed',r=>record('requestfailed',{url:r.url(),failure:r.failure()}));
    context.on('response',r=>{if(r.status()>=400)record('badResponse',{url:r.url(),status:r.status(),headers:r.headers()});});
    context.on('close',()=>record('contextClosed',{}));
    if(engine==='chromium'){
     const newPage=context.newPage.bind(context);
     context.newPage=async(...options)=>{
      const page=await newPage(...options),session=await context.newCDPSession(page);
      for(const event of ['workerRegistrationUpdated','workerVersionUpdated','workerErrorReported'])session.on('ServiceWorker.'+event,data=>record('ServiceWorker.'+event,data));
      await session.send('ServiceWorker.enable');return page;
     };
    }
    await context.exposeBinding('__folioWorkerDiagnostic',(_source,data)=>record('lifecycle',data));
    await context.addInitScript(()=>{
     if(!navigator.serviceWorker)return;
     const describe=w=>w?{script:w.scriptURL,state:w.state}:null;
     const emit=(event,registration)=>{void window.__folioWorkerDiagnostic({event,url:location.href,controller:describe(navigator.serviceWorker.controller),active:describe(registration?.active),installing:describe(registration?.installing),waiting:describe(registration?.waiting)}).catch(()=>{});};
     const seen=new WeakSet();
     const watch=registration=>{
      if(!registration)return;
      const update=()=>{for(const worker of [registration.installing,registration.waiting,registration.active])if(worker&&!seen.has(worker)){seen.add(worker);worker.addEventListener('statechange',()=>{emit('statechange',registration);update();});}emit('registration',registration);};
      registration.addEventListener('updatefound',()=>{emit('updatefound',registration);update();});update();
     };
     const register=navigator.serviceWorker.register.bind(navigator.serviceWorker);
     navigator.serviceWorker.register=(...args)=>{emit('register');const result=register(...args);void result.then(watch,error=>emit('registerRejected:'+String(error)));return result;};
     navigator.serviceWorker.addEventListener('controllerchange',()=>emit('controllerchange'));
     void navigator.serviceWorker.getRegistration().then(watch);emit('document');
    });
    return context;
   };
   const close=browser.close.bind(browser);
   browser.close=async(...args)=>{closing=true;log('browserClosing');try{return await close(...args);}finally{ws?.close();log('browserClosed');}};
   return browser;
  };
 }
}
