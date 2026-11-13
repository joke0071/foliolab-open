/** Transaction DOUBLE only. Tests orchestration/error paths, NOT native IDB,
 * browser durability, actual quota, process crash or real tabs. No such PASS.
 * Tentative writes publish only on completion; all readwrite tx serialize.
 */
export function memoryDB() {
 const data=new Map();let tail=Promise.resolve();
 const db={data,fault:null,transaction(_store,mode){
  const tx={error:null,abort(){if(tx.done)return;tx.done=true;setImmediate(()=>{tx.onabort?.();release();});}};
  let working,active=false,release,scheduled=false;const queue=[];
  const done=new Promise(r=>release=r),prior=tail;tail=done;
  const store={get(key){const req={};queue.push(()=>{req.result=structuredClone(working.get(key));req.onsuccess?.();});pump();return req;},
   put(value,key){if(!active||tx.done)throw Error('inactive');if(db.fault==='quota'){db.fault=null;throw new DOMException('quota-double','QuotaExceededError');}
    working.set(key,structuredClone(value));
    if(db.fault==='abort-after-put'){db.fault=null;tx.abort();}
    return {};}};
  tx.objectStore=()=>store;
  function pump(){if(!active||scheduled||tx.done)return;scheduled=true;setImmediate(()=>{
   scheduled=false;if(tx.done)return;
   if(queue.length){try{queue.shift()();}catch(e){tx.error=e;tx.abort();}pump();return;}
   tx.done=true;if(mode==='readwrite'){data.clear();for(const [k,v] of working)data.set(k,v);}
   tx.oncomplete?.();release();
  });}
  prior.then(()=>{working=structuredClone(data);active=true;pump();});return tx;
 }};return db;
}
