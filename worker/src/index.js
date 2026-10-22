/** Public OpenFIGI metadata only. No personal portfolio, token, quote or user key data. */
const UPSTREAM='https://api.openfigi.com/v3';
const DEFAULT_ORIGIN='https://joke0071.github.io';
const LIMIT=25;
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{
 status,headers:{'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff','cache-control':'no-store',...headers}
});
function cors(origin){
 return {'access-control-allow-origin':origin,'access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'content-type','vary':'Origin'};
}
function asString(v,max=120){return String(v??'').trim().slice(0,max);}
export function normalizeOpenFigi(raw,{isin=''}={}){
 const rows=Array.isArray(raw)?raw:[];
 const seen=new Set(),results=[];
 for(const x of rows){
  if(!x||typeof x!=='object')continue;
  const figi=asString(x.figi,32),name=asString(x.name,140);
  if(!figi||!name||seen.has(figi))continue;seen.add(figi);
  // OpenFIGI does not supply price or timestamp. Never invent either.
  results.push({figi,name,isin:isin||null,ticker:asString(x.ticker,32)||null,
   currency:asString(x.currency,3)||null,mic:asString(x.micCode,8)||null,
   exchangeCode:asString(x.exchCode,16)||null,securityType:asString(x.securityType2||x.securityType,70)||null,
   shareClassFIGI:asString(x.shareClassFIGI,32)||null,source:'openfigi'});
  if(results.length>=LIMIT)break;
 }
 return results;
}
export async function handleInstrumentRequest(request,env={},ctx={},fetcher=globalThis.fetch){
 const url=new URL(request.url),origin=request.headers.get('origin')||'';
 // No permissive reflection of Origin; operator may add its own known frontend.
 const allowed=new Set([DEFAULT_ORIGIN,...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);
 if(!allowed.has(origin))return json({schemaVersion:1,status:'forbidden'},403);
 const headers=cors(origin);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'access-control-max-age':'600'}});
 if(request.method!=='GET')return json({schemaVersion:1,status:'invalid_request'},405,headers);
 const path=url.pathname;
 const isSearch=path==='/api/instruments/search',isResolve=path==='/api/instruments/resolve';
 if(!isSearch&&!isResolve)return json({schemaVersion:1,status:'not_found'},404,headers);
 const q=(isSearch?url.searchParams.get('q'):url.searchParams.get('isin'))||'';
 const input=q.trim();
 if(isSearch?input.length<2||input.length>100||/[\u0000-\u001f<>\\]/.test(input):
   !/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(input.toUpperCase()))
  return json({schemaVersion:1,status:'invalid_request',message:'Unzulässiger Suchbegriff oder ISIN.'},400,headers);
 const norm=isResolve?input.toUpperCase():input;
 const cacheKey=new Request('https://foliolab-open-cache.invalid/'+(isSearch?'search':'resolve')+'?q='+encodeURIComponent(norm));
 const cache=globalThis.caches?.default;
 try{
  if(cache){const existing=await cache.match(cacheKey);if(existing){
   const response=new Response(existing.body,existing);
   for(const [key,value] of Object.entries(headers))response.headers.set(key,value);
   return response;
  }}
  const target=isSearch?UPSTREAM+'/search':UPSTREAM+'/mapping';
  const payload=isSearch?{query:norm}:[{idType:'ID_ISIN',idValue:norm}];
  const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),6500);
  let upstream;
  try{upstream=await fetcher(target,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(payload),signal:abort.signal});}
  finally{clearTimeout(timeout);}
  if(upstream.status===429)return json({schemaVersion:1,status:'rate_limited',retryAfter:Number(upstream.headers.get('retry-after'))||null},429,{...headers,'retry-after':upstream.headers.get('retry-after')||'60'});
  if(!upstream.ok)return json({schemaVersion:1,status:'temporarily_unavailable'},503,headers);
  const raw=await upstream.json(),array=isResolve?raw?.[0]?.data:raw?.data;
  if(raw?.error||isResolve&&raw?.[0]?.error)return json({schemaVersion:1,status:'temporarily_unavailable'},503,headers);
  if(!Array.isArray(array))return json({schemaVersion:1,status:'temporarily_unavailable'},503,headers);
  const results=normalizeOpenFigi(array,{isin:isResolve?norm:''});
  const response=json({schemaVersion:1,status:results.length?'ok':'no_results',source:'openfigi',results},200,{
   ...headers,'cache-control':'public, max-age=0, s-maxage=21600'});
  if(cache&&ctx.waitUntil)ctx.waitUntil(cache.put(cacheKey,response.clone()).catch(()=>{}));
  return response;
 }catch(error){
  return json({schemaVersion:1,status:'temporarily_unavailable'},503,headers);
 }
}
export default {fetch:handleInstrumentRequest};
