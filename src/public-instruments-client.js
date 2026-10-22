/**
 * Optional public metadata lookup, separate from quote providers.
 * The endpoint is explicitly configured by the operator/user. No API keys,
 * holdings, account data or wallet addresses are ever passed to this service.
 */
export function validatedPublicEndpoint(raw){
 if(!raw)return null;
 const url=new URL(String(raw).trim());
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||
  url.pathname!=='/'&&url.pathname!=='')throw Error('Öffentlicher Suchdienst benötigt eine HTTPS-Basisadresse ohne Zugangsdaten oder Pfad.');
 return url.origin;
}
export async function queryPublicInstruments(base,term,{fetcher=globalThis.fetch}={}){
 const origin=validatedPublicEndpoint(base);
 if(!origin)return [];
 const query=String(term||'').trim();
 if(query.length<2||query.length>100||/[<>\u0000-\u001f]/.test(query))throw Error('Bitte 2 bis 100 gültige Suchzeichen eingeben.');
 const isIsin=/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i.test(query);
 const url=new URL(origin+(isIsin?'/api/instruments/resolve':'/api/instruments/search'));
 url.searchParams.set(isIsin?'isin':'q',query);
 const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),7000);
 try{
  const res=await fetcher(url.toString(),{method:'GET',signal:abort.signal,headers:{accept:'application/json'}});
  if(res.status===429)throw Error('Öffentliche Suche ist ausgelastet; später versuchen oder manuell erfassen.');
  if(!res.ok)throw Error('Öffentliche Stammdatensuche vorübergehend nicht verfügbar.');
  const value=await res.json();
  if(value?.schemaVersion!==1||!['ok','no_results'].includes(value.status)||!Array.isArray(value.results))throw Error('Unbekanntes Antwortformat der Stammdatensuche.');
  return value.results.slice(0,25).map(item=>({
   ...item,name:String(item.name||'').slice(0,140),ticker:String(item.ticker||'').slice(0,32),
   symbol:String(item.ticker||'').slice(0,32),isin:String(item.isin||'').slice(0,20),
   exchange:String(item.exchangeCode||'').slice(0,16),currency:String(item.currency||'').slice(0,3),
   mic:String(item.mic||'').slice(0,8),source:'openfigi'
  })).filter(x=>x.name&&x.figi);
 }finally{clearTimeout(timeout);}
}
