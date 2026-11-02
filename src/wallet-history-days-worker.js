// Catch dependency-load rejections inside the worker. WebKit can otherwise
// report a static module-graph failure to the page despite a canceled error event.
self.onmessage=async event=>{
 let historyDays;
 try{({historyDays}=await import('./wallet-history-days.js'));}
 catch{self.postMessage({loadError:true});return;}
 try{self.postMessage({rows:historyDays(event.data.session,event.data.options)});}
 catch{self.postMessage({error:'Tagesbestände konnten nicht sicher berechnet werden.'});}
};
