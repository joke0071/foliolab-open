import {POPULAR_COINS,coinCatalog} from './market.js';
import {requestJSON,TTL} from './request-cache.js';

/** Public metadata only. No accounts, balances, wallet addresses or keys are stored here. */
export const OeKB_FUNDS_URL='https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f';
export const FUND_CATALOG_KEY='foliolab-open-fund-catalog-v1';
const TOP_TTL=60*60*1000,MAX_FUND_ROWS=120000,MAX_FILE_CHARS=14_000_000;
let leaderCache=null,leaderPending=null,fullCache=null,fullPending=null,temporaryFunds=null;
const lower=s=>String(s||'').toLocaleLowerCase('de').normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const text=s=>String(s??'').trim();
const normCoin=x=>({id:text(x.id).toLowerCase(),symbol:text(x.symbol).toUpperCase(),name:text(x.name),rank:Number(x.market_cap_rank)||null});
const validCoin=x=>/^[a-z0-9-]{2,110}$/.test(x.id)&&x.name&&x.symbol&&x.symbol.length<=24;
const compareCoins=(q,a,b)=>{
 const score=x=>{
  const sym=lower(x.symbol),name=lower(x.name),id=lower(x.id);
  return sym===q?0:id===q?1:name===q?2:sym.startsWith(q)?3:name.startsWith(q)?4:id.startsWith(q)?5:6;
 };
 return score(a)-score(b)||(a.rank||999999)-(b.rank||999999)||a.name.localeCompare(b.name);
};
/** Current top 100 is a live, transient ranking, never a permanently asserted static rank. */
export async function loadTopCrypto({fetcher=globalThis.fetch,key='',now=Date.now()}={}){
 if(leaderCache&&now-leaderCache.at<TOP_TTL)return leaderCache.coins;
 if(leaderPending)return leaderPending;
 const u=new URL('https://api.coingecko.com/api/v3/coins/markets');
 for(const [k,v] of Object.entries({vs_currency:'eur',order:'market_cap_desc',per_page:'100',page:'1',sparkline:'false'}))u.searchParams.set(k,v);
 leaderPending=(async()=>{
  const raw=await requestJSON(u.toString(),{fetcher,headers:key?{'x-cg-demo-api-key':key}:{},ttlMs:TTL.catalog,attempts:1});
  if(!Array.isArray(raw)||!raw.length||raw.length>100)throw Error('CoinGecko lieferte keinen gültigen Top-100-Katalog.');
  const list=raw.map(normCoin).filter(validCoin);
  if(!list.length)throw Error('CoinGecko-Treffer sind unvollständig.');
  leaderCache={coins:list,at:now};
  return list;
 })();
 try{return await leaderPending;}finally{leaderPending=null;}
}
/** Full public catalogue (often tens of thousands), loaded once on demand. */
export async function loadAllCrypto({fetcher=globalThis.fetch,key=''}={}){
 if(fullCache)return fullCache;
 if(fullPending)return fullPending;
 fullPending=coinCatalog(key,fetcher).then(raw=>{
  const result=raw.map(normCoin).filter(validCoin);
  if(!result.length)throw Error('Vollständiger Coin-Katalog leer.');
  fullCache=result;return result;
 });
 try{return await fullPending;}finally{fullPending=null;}
}
export function cryptoChoices(query='',{leaders=leaderCache?.coins||[],all=fullCache||[],limit=40}={}){
 const q=lower(query.trim());
 const fallback=POPULAR_COINS.map(normCoin),out=new Map();
 for(const item of [...leaders,...fallback,...all])if(validCoin(item)&&!out.has(item.id))out.set(item.id,item);
 const match=q?[...out.values()].filter(x=>[x.id,x.name,x.symbol].some(v=>lower(v).includes(q))):[...out.values()].filter(x=>leaders.length?leaders.some(l=>l.id===x.id):fallback.some(l=>l.id===x.id));
 if(q)match.sort((a,b)=>compareCoins(q,a,b));
 else match.sort((a,b)=>(a.rank||999999)-(b.rank||999999)||a.name.localeCompare(b.name));
 return match.slice(0,Math.max(1,Math.min(100,limit))).map(x=>({...x,coinId:x.id,kind:'crypto',currency:'EUR',source:x.rank?'CoinGecko Top 100':'CoinGecko-Katalog'}));
}
export function cryptoCatalogState(){return {leaders:leaderCache?.coins.length||0,all:fullCache?.length||0};}

/** RFC4180-style parser, with strict bounds and no arbitrary HTML/URL interpretation. */
function splitCSV(raw,delimiter){
 const rows=[];let line=[],part='',quoted=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(c==='"'){
   if(quoted&&raw[i+1]==='"'){part+='"';i++;}
   else quoted=!quoted;
  }else if(c===delimiter&&!quoted){line.push(part.trim());part='';}
  else if((c==='\r'||c==='\n')&&!quoted){
   line.push(part.trim());part='';if(line.some(Boolean))rows.push(line);line=[];
   if(c==='\r'&&raw[i+1]==='\n')i++;
   if(rows.length>MAX_FUND_ROWS+10)throw Error('Fondsdatei enthält zu viele Datensätze.');
  }else part+=c;
 }
 if(quoted)throw Error('Fondsdatei enthält nicht abgeschlossene CSV-Anführungszeichen.');
 line.push(part.trim());if(line.some(Boolean))rows.push(line);
 return rows;
}
const field=s=>lower(s).replace(/[^a-z0-9]/g,'');
const validIsin=s=>/^[A-Z]{2}[A-Z0-9]{10}$/.test(s);
export function parseFundCatalogCSV(input,{filename='fondsliste.csv',at=new Date().toISOString()}={}){
 if(typeof input!=='string'||input.length<20||input.length>MAX_FILE_CHARS)throw Error('Bitte eine gültige Fonds-CSV bis 14 MB wählen.');
 const raw=input.replace(/^\uFEFF/,'');
 const first=raw.split(/\r?\n/,1)[0];
 const delim=[';','\t',','].map(c=>[c,splitCSV(first,c)[0]?.length||0]).sort((a,b)=>b[1]-a[1])[0];
 if(!delim||delim[1]<2)throw Error('Die Fondsliste benötigt mindestens zwei CSV-Spalten.');
 const data=splitCSV(raw,delim[0]);
 if(data.length<2)throw Error('Die Fondsliste enthält keine Datenzeilen.');
 const cols=data[0].map(field);
 const isinCol=cols.findIndex(c=>c==='isin'||c.endsWith('isin')||c.includes('isin'));
 const nameCol=cols.findIndex(c=>c==='fondsbezeichnung'||c==='fondsname'||c==='fundname'||c==='bezeichnung'||c==='name'||c.includes('fondsbezeichnung')||c.includes('fundname'));
 if(isinCol<0||nameCol<0||isinCol===nameCol)throw Error('OeKB-CSV braucht erkennbare Spalten für ISIN und Fondsbezeichnung. Keine Daten aus unbekannten Spalten übernommen.');
 const maxIndex=Math.max(isinCol,nameCol),out=new Map(),skipped={invalid:0,duplicate:0};
 for(const row of data.slice(1)){
  if(row.length<=maxIndex){skipped.invalid++;continue;}
  const isin=text(row[isinCol]).toUpperCase(),name=text(row[nameCol]).slice(0,140);
  if(!validIsin(isin)||name.length<3){skipped.invalid++;continue;}
  if(out.has(isin)){skipped.duplicate++;continue;}
  out.set(isin,{isin,name,kind:/\bETF\b/i.test(name)?'etf':'fund',source:'OeKB-CSV (vom Nutzer bereitgestellt)',currency:'',symbol:'',exchange:'',mic:''});
 }
 if(out.size<1)throw Error('Keine Fonds mit plausibler ISIN und Bezeichnung erkannt.');
 return {schemaVersion:1,importedAt:at,filename:text(filename).slice(0,130),source:'Vom Nutzer eingespielte Fondsliste, nicht live verifiziert',entries:[...out.values()],skipped};
}
export function saveFundCatalog(catalog,storage=globalThis.localStorage){
 if(catalog?.schemaVersion!==1||!Array.isArray(catalog.entries)||!catalog.entries.length)throw Error('Kein gültiger Fondskatalog zum Speichern.');
 const json=JSON.stringify(catalog);
 if(json.length>MAX_FILE_CHARS)throw Error('Fondskatalog ist für die lokale Speicherung zu groß.');
 storage.setItem(FUND_CATALOG_KEY,json);temporaryFunds=catalog;
 return catalog.entries.length;
}
export function loadFundCatalog(storage=globalThis.localStorage){
 if(temporaryFunds)return temporaryFunds;
 try{
  const raw=storage?.getItem(FUND_CATALOG_KEY);
  if(!raw)return null;
  const found=JSON.parse(raw);
  if(found?.schemaVersion!==1||!Array.isArray(found.entries)||found.entries.length>MAX_FUND_ROWS)return null;
  temporaryFunds=found;return found;
 }catch{return null;}
}
export function searchFundCatalog(query,kind='etf',catalog=loadFundCatalog(),limit=60){
 if(!catalog||!Array.isArray(catalog.entries))return {results:[],total:0};
 const q=lower(query.trim());
 if(q.length<2)return {results:[],total:0};
 const matching=catalog.entries.filter(x=>x.kind===kind&&[x.isin,x.name].some(v=>lower(v).includes(q)));
 matching.sort((a,b)=>Number(lower(b.isin)===q)-Number(lower(a.isin)===q)||Number(lower(b.name).startsWith(q))-Number(lower(a.name).startsWith(q))||a.name.localeCompare(b.name));
 return {total:matching.length,results:matching.slice(0,Math.max(1,Math.min(100,limit)))};
}
