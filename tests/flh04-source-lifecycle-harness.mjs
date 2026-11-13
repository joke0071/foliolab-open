// Browser-only scheduling instrumentation. No product source/import replacement.
// Delay one readonly oncomplete CALLBACK after the native complete EVENT.
// No transaction keepalive; product promise stays pending at its existing await.
export function installLifecycleHarness({controller,action,model,fault=null}) {
 const events=[],handles=[],transactions=[];
 const mark=(name,kind='native')=>events.push({seq:events.length,name,kind});
 const original={open:IDBFactory.prototype.open,transaction:IDBDatabase.prototype.transaction,
  close:IDBDatabase.prototype.close,set:Storage.prototype.setItem,remove:Storage.prototype.removeItem};
 let release=null,held=false,settled=false,result=null,source=null,sourceCount=0;
 let resolveHeld;const atBarrier=new Promise(resolve=>{resolveHeld=resolve;});
 IDBFactory.prototype.open=function(...args){
  const request=original.open.apply(this,args);
  if(args[0]==='foliolab-open-portfolio'){
   sourceCount++;mark('source-open','operation');
   request.addEventListener('success',()=>{
    const db=request.result;source??=db;handles.push(db);mark('source-success');
    db.addEventListener('versionchange',()=>mark('source-versionchange'));
    db.addEventListener('close',()=>mark('source-close-event'));
   });
  }
  return request;
 };
 IDBDatabase.prototype.close=function(){
  if(handles.includes(this))mark('source-close-call','operation');
  return original.close.call(this);
 };
 IDBDatabase.prototype.transaction=function(...args){
  const tx=original.transaction.apply(this,args);
  if(this.name!=='foliolab-open-portfolio')return tx;
  transactions.push(tx);mark('transaction-'+(args[1]??'readonly'),'operation');
  tx.addEventListener('abort',()=>mark('transaction-abort'));
  if(!held&&(args[1]??'readonly')==='readonly'){
   held=true;
   Object.defineProperty(tx,'oncomplete',{configurable:true,set(callback){
    tx.addEventListener('complete',event=>{
     mark('read-complete');
     release=()=>{
      mark('barrier-release','harness');
      if(fault==='close-event-injected'){
       // Regular close plus synthetic event; NEVER a native forced-close claim.
       source.close();source.dispatchEvent(new Event('close'));
       mark('close-event-injected','injected');
      }
      if(fault==='read-error-injected'){
       mark('read-error-injected','injected');
       tx.onabort?.call(tx,new Event('abort'));return;
      }
      callback.call(tx,event);
     };
     mark('barrier-held','harness');resolveHeld();
    },{once:true});
   }});
  }else tx.addEventListener('complete',()=>mark('transaction-complete'));
  return tx;
 };
 for(const [method,key] of [['setItem','set'],['removeItem','remove']])Storage.prototype[method]=function(...args){
  if(this===localStorage&&['foliolab-open-v1','foliolab-open-storage-mode','foliolab-open-idb-revert-intent'].includes(args[0])){
   mark(method+':'+args[0],'operation');
   if(fault==='marker-injected'&&method==='removeItem'&&args[0]==='foliolab-open-storage-mode'){
    mark('marker-error-injected','injected');throw new DOMException('synthetic','QuotaExceededError');
   }
  }
  return original[key].apply(this,args);
 };
 mark('operation-start','operation');
 // The real unmodified PortfolioStorage method, with the real model and IDB.
 const done=Promise.resolve().then(()=>controller[action](model)).then(
  ()=>{result={status:'fulfilled'};},error=>{result={status:'rejected',errorName:error.name};}
 ).finally(()=>{settled=true;mark('operation-settled','operation');});
 return {
  atBarrier,done,controller,events,
  snapshot:()=>({events:[...events],settled,result,sourceCount}),
  release(){if(!release)throw Error('barrier-not-reached');const run=release;release=null;run();},
  cleanup(){
   IDBFactory.prototype.open=original.open;IDBDatabase.prototype.transaction=original.transaction;
   IDBDatabase.prototype.close=original.close;Storage.prototype.setItem=original.set;Storage.prototype.removeItem=original.remove;
   // Release even on assertion/setup failure; do not leave a blocked test origin.
   if(release){const run=release;release=null;run();}
   controller.close();for(const db of handles)db.close();
  }
 };
}
