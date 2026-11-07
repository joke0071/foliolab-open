// Metadata-only observation in isolated synthetic profiles. No payloads, keys,
// retries, connection reuse or changes to request handlers and gate deadlines.
export function installAlphaIDBLifecycleProbe(){
 const name='foliolab-open-market-cache',events=[],requests=new Map(),connections=new WeakMap();
 let serial=0,dropped=0,last=performance.now(),maxGap=0,ticks=0;
 const record=(type,detail={})=>{const row={type,at:performance.now(),wall:Date.now(),...detail};if(events.length<1024)events.push(row);else dropped++;};
 const open=IDBFactory.prototype.open,remove=IDBFactory.prototype.deleteDatabase,close=IDBDatabase.prototype.close,transaction=IDBDatabase.prototype.transaction;
 const observe=(request,kind,version)=>{
  const id=++serial;requests.set(id,{request,kind,version,started:performance.now()});record(kind,{id,version});
  for(const type of ['blocked','upgradeneeded','success','error'])request.addEventListener(type,event=>{
   const row={id,readyState:request.readyState};
   if(type==='blocked'||type==='upgradeneeded'){row.oldVersion=event.oldVersion;row.newVersion=event.newVersion;}
   if(type==='error')row.errorName=request.error?.name??null;
   if(type==='success'&&kind==='open'){
    const db=request.result;connections.set(db,id);row.version=db.version;row.hasCacheStore=db.objectStoreNames.contains('cache');
    db.addEventListener('versionchange',event=>record('versionchange',{id,oldVersion:event.oldVersion,newVersion:event.newVersion}));
    db.addEventListener('close',()=>record('connection-close-event',{id}));
   }
   record(type,row);if(type==='success'||type==='error')requests.delete(id);
  });return request;
 };
 IDBFactory.prototype.open=function(dbName,...args){const request=open.call(this,dbName,...args);return dbName===name?observe(request,'open',args[0]??null):request;};
 IDBFactory.prototype.deleteDatabase=function(dbName){const request=remove.call(this,dbName);return dbName===name?observe(request,'deleteDatabase',null):request;};
 IDBDatabase.prototype.close=function(){if(this.name===name)record('close-call',{id:connections.get(this)??null,version:this.version});return close.call(this);};
 IDBDatabase.prototype.transaction=function(...args){
  const tx=transaction.apply(this,args);
  if(this.name===name){const id=connections.get(this)??null;record('transaction',{id,mode:tx.mode});for(const type of ['complete','abort','error'])tx.addEventListener(type,()=>record('transaction-'+type,{id,errorName:tx.error?.name??null}));}
  return tx;
 };
 const heartbeat=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;ticks++;},250);
 addEventListener('pagehide',()=>clearInterval(heartbeat),{once:true});
 globalThis.__foliolabAlphaIDBProbe={snapshot:()=>({
  events:events.slice(),dropped,pending:Array.from(requests,([id,row])=>({id,kind:row.kind,version:row.version,started:row.started,readyState:row.request.readyState})),
  timing:{now:performance.now(),wall:Date.now(),ticks,maxGap,last},page:{visibility:document.visibilityState,readyState:document.readyState},
 })};
 record('probe-installed');
}

export async function observeAlphaIDBLifecycle(context,page){
 const snapshots=[];await context.addInitScript(installAlphaIDBLifecycleProbe);
 return {snapshots,async capture(phase){
  let timer;
  try{
   const state=await Promise.race([page.evaluate(()=>globalThis.__foliolabAlphaIDBProbe?.snapshot()??null),new Promise(resolve=>{timer=setTimeout(()=>resolve({captureTimedOut:true}),1000);})]);
   snapshots.push({phase,nodeWall:Date.now(),state});
  }catch(error){snapshots.push({phase,nodeWall:Date.now(),captureErrorName:error.name});}
  finally{clearTimeout(timer);}
 }};
}
