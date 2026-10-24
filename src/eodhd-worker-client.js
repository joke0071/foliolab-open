/** Server-side EODHD via a user-owned Cloudflare Worker.
 * Its EODHD secret never reaches FolioLab. The local access token is sent
 * only to the explicitly configured HTTPS worker using a POST header.
 */
import {requestJSON,TTL} from './request-cache.js';
import {validatedPublicEndpoint} from './public-instruments-client.js';
const symbolPattern=/^[A-Z0-9^_-]{1,32}\.[A-Z0-9]{1,10}$/;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function configuredMarketWorker(settings={}){
 const raw=String(settings.eodhdWorkerEndpoint||'').trim();
 const token=String(settings.eodhdWorkerAccessToken||'').trim();
 if(!raw&&!token)return null;
 if(!raw||!token)return null;
 const origin=validatedPublicEndpoint(raw);
 if(!/^[A-Za-z0-9_-]{24,128}$/.test(token))
  throw Error('Worker-Zugriffsschlüssel muss 24–128 Zeichen aus Buchstaben, Zahlen, _ oder - enthalten.');
 return {origin,token};
}
export async function fetchWorkerEodhdBars(symbol,from,to,settings={},fetcher=globalThis.fetch){
 const worker=configuredMarketWorker(settings);
 if(!worker)throw Error('EODHD-Worker nicht vollständig eingerichtet.');
 const normalized=String(symbol||'').toUpperCase();
 if(!symbolPattern.test(normalized)||!datePattern.test(from)||!datePattern.test(to)||from>to)
  throw Error('Ungültige Börsennotierung oder Kursperiode.');
 const data=await requestJSON(worker.origin+'/api/market/eodhd',{
  fetcher,method:'POST',headers:{'content-type':'application/json',accept:'application/json',authorization:'Bearer '+worker.token},
  body:JSON.stringify({symbol:normalized,from,to}),ttlMs:TTL.history,attempts:1,timeoutMs:14000
 });
 if(data?.schemaVersion!==1||data?.status!=='ok'||data?.symbol!==normalized||!Array.isArray(data?.points)||
  data.points.length>1800)throw Error('Worker lieferte keinen bestätigten EODHD-Kursverlauf.');
 return data.points.map(p=>{
  if(!p||typeof p.date!=='string'||!datePattern.test(p.date)||p.date<from||p.date>to||
   !Number.isFinite(p.close)||p.close<=0||p.close>1e9)throw Error('Worker lieferte ungültige Schlusskurse.');
  return {date:p.date,close:p.close};
 });
}
