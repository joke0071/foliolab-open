import {valuationIssues} from './valuation-status.js';
import {priceQuality} from './quote-quality.js';
import {historyAction} from './booking-history.js';
const quoteLabels={missing:'Kurs fehlt',derived:'Zuletzt gespeicherter Wert',review:'Kursstatus unklar',outdated:'Kurs älter als 7 Tage'};
const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v:null;
/** Existing evidence only, one affected position regardless of symptom count. */
export function positionQualityReview(model,now=Date.now()){
 const groups=new Map(),positions=new Map((model.positions||[]).map(p=>[p.id,p]));
 function add(id,issue){if(!positions.has(id))return;const row=groups.get(id)||{id,accountId:positions.get(id).accountId,issues:[]};if(!row.issues.some(x=>x.key===issue.key))row.issues.push(issue);groups.set(id,row);}
 for(const {id,type} of valuationIssues(model,now)){
  const p=positions.get(id);add(id,{key:'position:'+id+':quote',category:'quote',label:quoteLabels[type],source:'Kursstatus',asOf:timestamp(p.quoteAsOf),severity:'warning',quality:priceQuality(p,now).state,action:'edit-position',actionLabel:'Kursdaten prüfen'});
 }
 for(const session of model.walletHistory?.sessions||[]){
  const p=positions.get(session.walletKey)||[...positions.values()].find(p=>session.id==='wallet-history:'+p.id);if(!p)continue;
  if(!(session.streams||[]).some(s=>s.coverage?.status!=='verified')&&!(session.issues||[]).some(x=>/reorg|partial|gap|http-429|unverified|missing|conflict/.test(x)))continue;
  const h=historyAction(model,p),supported=h?.action==='wallet-history';
  add(p.id,{key:'position:'+p.id+':history',category:'history',label:'Wallet-Historie teilweise oder nicht vollständig belegt',source:'Bestätigte Wallet-Historie',asOf:timestamp(session.acceptedAt),severity:'warning',action:supported?'wallet-history':'edit-position',actionLabel:supported?'Historie prüfen':'Walletdaten prüfen'});
 }
 for(const pending of model.walletHistory?.pending||[]){
  const p=positions.get(pending.walletKey)||[...positions.values()].find(p=>pending.id==='wallet-history:'+p.id);if(!p)continue;
  const h=historyAction(model,p),supported=h?.action==='wallet-history';
  add(p.id,{key:'position:'+p.id+':continuation',category:'history',label:'Historienabruf nicht abgeschlossen',source:'Gespeicherter Fortsetzungsstand',asOf:timestamp(pending.updatedAt),severity:'info',action:supported?'wallet-history':'edit-position',actionLabel:supported?'Historie fortsetzen':'Walletdaten prüfen'});
 }
 return [...groups.values()];
}
export function filterQualityReview(groups,{kind='all',accountId=''}={}){
 return groups.filter(g=>(!accountId||g.accountId===accountId)&&(kind==='all'||g.issues.some(i=>i.category===kind)));
}
