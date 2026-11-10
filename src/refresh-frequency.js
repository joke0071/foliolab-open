export const REFRESH_INTERVALS=Object.freeze({off:0,daily:86400000,'6h':21600000,'30m':1800000});
/** One canonical preference. Legacy booleans are accepted only at boundaries. */
export function refreshFrequency(value){
 if(value===false)return 'off';
 if(value===true||value===undefined)return 'daily';
 if(typeof value==='string'&&Object.hasOwn(REFRESH_INTERVALS,value))return value;
 throw Error('Ungültige Einstellung: automatische Aktualisierung.');
}
export function refreshSettings(settings){return {...settings,autoRefresh:refreshFrequency(settings?.autoRefresh)};}
export const REFRESH_STATE_KEY='foliolab-open-auto-refresh-v2';
export const REFRESH_LOCK='foliolab-source-refresh';
const RETRY_MIN=300000,RETRY_MAX=1800000;
const timestamp=value=>Number.isSafeInteger(value)&&value>=0;
const blank=scope=>({version:1,scope,lastAttemptAt:null,lastSuccessAt:null,nextAttemptAt:0,failures:0,completed:{}});
function readState(storage,scope){
 const raw=storage.getItem(REFRESH_STATE_KEY);
 if(raw===null)return blank(scope);
 const s=JSON.parse(raw);
 if(s?.version!==1||typeof s.scope!=='string'||
  ![s.lastAttemptAt,s.lastSuccessAt].every(x=>x===null||timestamp(x))||!timestamp(s.nextAttemptAt)||
  !Number.isInteger(s.failures)||s.failures<0||s.failures>20||!s.completed||typeof s.completed!=='object'||Array.isArray(s.completed)||
  !Object.entries(s.completed).every(([key,value])=>key.length<=200&&timestamp(value)))
  throw Error('Automatische Aktualisierung: ungültiger lokaler Versuchsstand. Bitte manuell aktualisieren.');
 return s.scope===scope?s:blank(scope);
}
/** Called under the cross-tab Web Lock, before any network work. Transient
 * attempts never enter financial records, backups or their CAS revisions. */
export function beginAutoRefresh(storage,{frequency,scope,now=Date.now(),online=true,manual=false}){
 const configured=REFRESH_INTERVALS[refreshFrequency(frequency)],interval=configured||REFRESH_INTERVALS.daily;
 if(!manual&&(!configured||!online))return null;
 if(!timestamp(now)||typeof scope!=='string'||scope.length>200)throw Error('Ungültige Aktualisierungszeit.');
 let s;try{s=readState(storage,scope);}catch(error){if(!manual)throw error;s=blank(scope);}
 // A backwards clock must not turn a prior success into immediate new traffic.
 if(!manual&&((s.lastAttemptAt!==null&&s.lastAttemptAt>now)||(s.lastSuccessAt!==null&&s.lastSuccessAt>now))){
  s.lastAttemptAt=now;s.lastSuccessAt=null;s.nextAttemptAt=now+RETRY_MIN;s.completed={};
  storage.setItem(REFRESH_STATE_KEY,JSON.stringify(s));return null;
 }
 if(!manual&&(s.nextAttemptAt>now||(s.lastSuccessAt!==null&&now-s.lastSuccessAt<interval)))return null;
 s.lastAttemptAt=now;s.nextAttemptAt=now+RETRY_MIN;
 storage.setItem(REFRESH_STATE_KEY,JSON.stringify(s)); // quota failure => no request
 const completed=new Set();
 return {
  due:key=>manual||!Object.hasOwn(s.completed,key)||now-s.completed[key]>=interval,
  success:key=>completed.add(key),
  finish({saved=false,complete=false,at=Date.now(),scope:finalScope=scope}={}){
   if(!timestamp(at)||at<now)at=now;
   // Successful partial work is skipped only AFTER canonical persistence.
   if(saved){s.scope=finalScope;for(const key of completed)s.completed[key]=at;}
   if(saved&&complete){s.lastSuccessAt=at;s.failures=0;s.nextAttemptAt=0;}
   else{s.failures=Math.min(20,s.failures+1);s.nextAttemptAt=at+Math.min(RETRY_MAX,RETRY_MIN*2**(s.failures-1));}
   storage.setItem(REFRESH_STATE_KEY,JSON.stringify(s));
  }
 };
}
export async function refreshScope(model){
 const source={settings:model.settings,positions:model.positions.map(p=>({id:p.id,kind:p.kind,symbol:p.symbol,isin:p.isin,currency:p.currency,coinId:p.coinId,wallet:p.wallet}))};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(source)));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
