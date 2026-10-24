/** Private market proxy for a user-owned Worker: not a generic proxy.
 * Never accept arbitrary upstream URLs, client EODHD keys or positions.
 * Both EODHD_TOKEN and MARKET_ACCESS_TOKEN are Worker secrets.
 */
const SYMBOL=/^[A-Z0-9^_-]{1,32}\.[A-Z0-9]{1,10}$/;
const DAY=/^\d{4}-\d{2}-\d{2}$/;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
 'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'
}});
const constantTimeEquals=(a,b)=>{
 const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);
 let v=x.length^y.length;
 for(let i=0;i<Math.max(x.length,y.length);i++)v|=(x[i]||0)^(y[i]||0);
 return v===0;
};
const validDay=d=>typeof d==='string'&&DAY.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
export async function handleMarketRequest(request,env={},fetcher=globalThis.fetch){
 if(request.method!=='POST')return json({schemaVersion:1,status:'method_not_allowed'},405);
 const auth=String(request.headers.get('authorization')||'');
 // CORS restricts browser access, but is NOT an authentication mechanism.
 const access=String(env.MARKET_ACCESS_TOKEN||'');
 if(access.length<24||!/^Bearer [A-Za-z0-9_-]{24,128}$/.test(auth)||
    !constantTimeEquals(auth.slice(7),access))
  return json({schemaVersion:1,status:'unauthorized'},401);
 if(!env.EODHD_TOKEN||String(env.EODHD_TOKEN).length<6)
  return json({schemaVersion:1,status:'not_configured'},503);
 let payload;
 try{
  const raw=await request.text();
  if(raw.length>320)return json({schemaVersion:1,status:'invalid_request'},400);
  payload=JSON.parse(raw);
 }catch{return json({schemaVersion:1,status:'invalid_request'},400);}
 const symbol=String(payload?.symbol||'').toUpperCase(),from=payload?.from,to=payload?.to;
 if(!SYMBOL.test(symbol)||!validDay(from)||!validDay(to)||from>to||
    Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z')>1900*864e5||
    to>new Date(Date.now()+864e5).toISOString().slice(0,10))
  return json({schemaVersion:1,status:'invalid_request'},400);
 const upstream=new URL('https://eodhd.com/api/eod/'+encodeURIComponent(symbol));
 // The EODHD credential stays exclusively inside the worker.
 for(const [k,v] of Object.entries({api_token:env.EODHD_TOKEN,fmt:'json',period:'d',order:'a',from,to}))
  upstream.searchParams.set(k,String(v));
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),11500);
 try{
  const response=await fetcher(upstream.toString(),{headers:{accept:'application/json'},signal:abort.signal,
   redirect:'error',cache:'no-store'});
  if(response.status===401||response.status===403)return json({schemaVersion:1,status:'provider_denied'},403);
  if(response.status===429||response.status===402)return json({schemaVersion:1,status:'rate_limited'},429);
  if(!response.ok)return json({schemaVersion:1,status:'temporarily_unavailable'},502);
  const raw=await response.json();
  if(!Array.isArray(raw))return json({schemaVersion:1,status:'invalid_upstream'},502);
  const seen=new Map();
  for(const value of raw){
   if(!validDay(value?.date)||value.date<from||value.date>to)continue;
   const close=Number(value.close);
   if(!Number.isFinite(close)||close<=0||close>1e9)continue;
   if(seen.has(value.date)&&seen.get(value.date)!==close)return json({schemaVersion:1,status:'invalid_upstream'},502);
   seen.set(value.date,close);
  }
  if(!seen.size||seen.size>1800)return json({schemaVersion:1,status:'no_prices'},502);
  const points=[...seen].sort(([a],[b])=>a.localeCompare(b)).map(([date,close])=>({date,close}));
  return json({schemaVersion:1,status:'ok',symbol,source:'EODHD',points});
 }catch{return json({schemaVersion:1,status:'temporarily_unavailable'},503);}
 finally{clearTimeout(timer);}
}
