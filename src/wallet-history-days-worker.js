import {historyDays} from './wallet-history-days.js';
self.onmessage=event=>{try{self.postMessage({rows:historyDays(event.data.session,event.data.options)});}catch{self.postMessage({error:'Tagesbestände konnten nicht sicher berechnet werden.'});}};
