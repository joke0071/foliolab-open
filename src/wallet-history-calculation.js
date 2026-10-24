/** Pure calculations off the UI thread. No network/storage APIs in the worker. */
const cache=new Map();
export function calculateHistoryDays(session,options,{signal,timeoutMs=15000}={}){
 const key=JSON.stringify([session.events,session.streams,options]);
 if(cache.has(key))return Promise.resolve(structuredClone(cache.get(key)));
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./wallet-history-days-worker.js',import.meta.url),{type:'module'});let timer;
  const done=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();};
  const abort=()=>{done();const e=Error('Berechnung abgebrochen.');e.name='AbortError';reject(e);};
  if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>{done();reject(Error('Berechnungslimit erreicht. Bitte den Anzeigezeitraum verkleinern.'));},timeoutMs);
  worker.onmessage=e=>{done();if(e.data.error)reject(Error(e.data.error));else{cache.set(key,e.data.rows);if(cache.size>3)cache.delete(cache.keys().next().value);resolve(structuredClone(e.data.rows));}};
  worker.onerror=async()=>{
   done();
   // WebKit may bypass the Service Worker for new workers while offline.
   // Reuse the identical replay generator, yielding between days; never invent rows.
   if(navigator.onLine!==false||session.events.length>5000){reject(Error('Lokale Historienberechnung nicht verfügbar. Für große Historien bitte einmal online öffnen.'));return;}
   try{
    const {historyDaySteps}=await import('./wallet-history-days.js'),rows=[],start=performance.now();
    for(const chunk of historyDaySteps(session,options)){
     if(signal?.aborted){const e=Error('Berechnung abgebrochen.');e.name='AbortError';throw e;}
     if(performance.now()-start>timeoutMs)throw Error('Berechnungslimit erreicht. Bitte den Anzeigezeitraum verkleinern.');
     rows.push(...chunk);await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(signal?.aborted){const e=Error('Berechnung abgebrochen.');e.name='AbortError';throw e;}
    cache.set(key,rows);if(cache.size>3)cache.delete(cache.keys().next().value);resolve(structuredClone(rows));
   }catch(e){reject(e);}
  };
  worker.postMessage({session:{events:session.events,streams:session.streams},options});
 });
}
