/** FLH03-08a: transient selection and read-only dependency review. No write/delete API. */
import {assertPositionDeletable} from './portfolio-edit-actions.js';
import {sourceDigest} from './import-identity.js';

const fail=message=>{throw Error(message);};
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=200;
function ids(values){
 if(!Array.isArray(values)||values.length>100000||!values.every(validId))fail('Ungültige Positionsauswahl.');
 return [...new Set(values)];
}
function index(model){
 if(!Array.isArray(model?.positions))fail('Positionsbestand nicht prüfbar.');
 const result=new Map();
 for(const p of model.positions){
  if(!p||!validId(p.id)||result.has(p.id))fail('Positionsidentitäten fehlen oder sind mehrdeutig.');
  result.set(p.id,p);
 }
 return result;
}
function current(map,values){
 const selected=ids(values);
 if(selected.some(id=>!map.has(id)))fail('Auswahl veraltet. Bestand neu prüfen oder Auswahl aufheben.');
 return selected;
}

/** matchingIds must come from the complete existing filter/search result BEFORE pagination. */
export function updatePositionSelection(model,selectedIds,action){
 const positions=index(model);
 if(action?.type==='clear')return [];
 const selected=new Set(current(positions,selectedIds));
 switch(action?.type){
  case 'toggle':{
   if(!validId(action.id)||!positions.has(action.id))fail('Position nicht mehr vorhanden.');
   if(selected.has(action.id))selected.delete(action.id);else selected.add(action.id);
   break;
  }
  case 'filtered':for(const id of current(positions,action.matchingIds))selected.add(id);break;
  case 'all':
   if(action.confirmed!==true)fail('Alle Positionen müssen ausdrücklich ausgewählt werden.');
   return [...positions.keys()];
  default:fail('Unbekannte Auswahlaktion.');
 }
 return [...positions.keys()].filter(id=>selected.has(id));
}

/** Filter changes never expand or discard a selection. Stale IDs remain explicit. */
export function positionSelectionSummary(model,selectedIds,matchingIds){
 const positions=index(model),selected=ids(selectedIds),selectedSet=new Set(selected),matching=new Set(current(positions,matchingIds));
 const currentIds=[...positions.keys()].filter(id=>selectedSet.has(id));
 const staleIds=selected.filter(id=>!positions.has(id));
 const inFilterCount=currentIds.filter(id=>matching.has(id)).length;
 return {selectedIds:[...selected],selectedCount:selected.length,currentIds,currentCount:currentIds.length,
  matchingCount:matching.size,inFilterCount,hiddenCount:currentIds.length-inFilterCount,
  staleIds,requiresRefresh:staleIds.length>0};
}

/**
 * Candidate classification is NOT deletion consent or a CAS/storage freshness check.
 * A future UI/atomic commit must recheck the complete model AND IndexedDB revision.
 * Unknown/serialized references are conservatively included; never silently cascade.
 */
export function previewPositionRemoval(model,selectedIds,{maxNodes=200000,maxBytes=8000000}={}){
 const positions=index(model),selected=current(positions,selectedIds),targets=new Set(selected);
 if(!selected.length)fail('Keine Position ausgewählt.');
 if(!Number.isSafeInteger(maxNodes)||maxNodes<1||!Number.isSafeInteger(maxBytes)||maxBytes<1)fail('Ungültiges Prüflimit.');
 for(const key of ['bookings','journalEntries','openingPositions','snapshots','accounts','providers'])
  if(!Array.isArray(model[key]))fail('Abhängigkeiten nicht vollständig prüfbar: '+key);
 if(model.priceHistories!=null&&(typeof model.priceHistories!=='object'||Array.isArray(model.priceHistories)))fail('Kurshistorien nicht prüfbar.');
 const references=new Map(selected.map(id=>[id,new Map()])),cleanup=new Map(selected.map(id=>[id,[]]));
 const blockers=new Map(selected.map(id=>[id,[]])),stack=new WeakSet(),encoder=new TextEncoder();
 let nodes=0,bytes=0;
 const size=text=>{bytes+=encoder.encode(text).length;if(bytes>maxBytes)fail('Abhängigkeitsprüfung zu groß. Keine Löschfreigabe.');};
 const reference=(value,path,category,owner)=>{
  const id=targets.has(value)?value:typeof value==='string'&&value.startsWith('wallet-history:')?value.slice(15):null;
  if(id&&targets.has(id)&&id!==owner)references.get(id).set(path,{category,path});
 };
 const walk=(value,path,category,owner=null,depth=0)=>{
  if(++nodes>maxNodes||depth>64)fail('Abhängigkeitsprüfung begrenzt. Keine Löschfreigabe.');
  bytes+=8;if(bytes>maxBytes)fail('Abhängigkeitsprüfung zu groß. Keine Löschfreigabe.');
  if(value==null)return;
  if(typeof value==='string'){
   size(value);reference(value,path,category,owner);
   const text=value.trim();
   if(text.startsWith('{')||text.startsWith('[')){
    let decoded;
    try{decoded=JSON.parse(text);}catch{
     for(const id of selected)if(id!==owner)references.get(id).set(path,{category:'opaque-data',path});
     return;
    }
    walk(decoded,path+'(json)',category,owner,depth+1);
   }
   return;
  }
  if(typeof value==='number'){if(!Number.isFinite(value))fail('Ungültige Zahl in Abhängigkeiten.');return;}
  if(typeof value==='boolean')return;
  if(typeof value!=='object'||(!Array.isArray(value)&&![Object.prototype,null].includes(Object.getPrototypeOf(value))))fail('Datenstruktur nicht prüfbar.');
  if(stack.has(value))fail('Zyklische Abhängigkeiten. Keine Löschfreigabe.');
  stack.add(value);
  for(const [key,item] of Object.entries(value)){
   size(key);const next=path+'['+JSON.stringify(key)+']';
   reference(key,next,category,owner);walk(item,next,category,owner,depth+1);
  }
  stack.delete(value);
 };
 // Own record/opening/history are listed as explicit impacts, never removed here.
 // References from another selected record remain blocked as well: no inferred cascade.
 for(const [key,value] of Object.entries(model)){
  if(key==='positions')value.forEach((p,i)=>walk(p,'positions['+i+']','positions',p.id));
  else if(key==='openingPositions')value.forEach((p,i)=>{
   const owner=p?.positionId,path='openingPositions['+i+']';
   if(targets.has(owner))cleanup.get(owner).push({category:'openingPositions',path});
   walk(p,path,key,owner);
  });
  else if(key==='priceHistories'&&value)for(const [id,history] of Object.entries(value)){
   const path='priceHistories['+JSON.stringify(id)+']';
   if(targets.has(id))cleanup.get(id).push({category:'priceHistories',path});
   walk(history,path,key,id);
  }
  else{reference(key,key,key,null);walk(value,key,key);}
 }
 const items=selected.map(id=>{
  const p=positions.get(id),reasons=blockers.get(id);
  try{assertPositionDeletable(model,id);}catch(error){reasons.push(String(error.message));}
  if(p.wallet?.enabled)reasons.push('Wallet-Position: Eigentum, Discovery und Wiederimport zuerst prüfen.');
  const refs=[...references.get(id).values()];
  return {id,name:p.name,providerId:p.providerId,accountId:p.accountId,quantityExact:p.quantityExact??String(p.quantity),
   classification:reasons.length||refs.length?'blocked':'unreferenced',blockers:reasons,references:refs,cleanup:cleanup.get(id)};
 });
 const raw=JSON.stringify(model);if(encoder.encode(raw).length>maxBytes)fail('Abhängigkeitsprüfung zu groß. Keine Löschfreigabe.');
 return {kind:'position-removal-preview',version:1,selectedIds:[...selected],modelDigest:sourceDigest(raw),
  selectedCount:items.length,blockedCount:items.filter(x=>x.classification==='blocked').length,
  unreferencedCount:items.filter(x=>x.classification==='unreferenced').length,writeEnabled:false,items};
}
