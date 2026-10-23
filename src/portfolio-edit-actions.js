/** Guarded edit/delete operations shared by the portfolio screens.
 * Historical financial data is never silently revalued with today's quotes.
 */
import {exact,units} from './decimal.js';

const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 Number.isFinite(Date.parse(value+'T12:00:00Z'))&&
 new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value&&
 value<=new Date().toISOString().slice(0,10);

export function snapshotEditChanges(model,id,{date,totalEUR,note}){
 const current=model.snapshots.find(x=>x.id===id);
 if(!current)throw Error('Stichtag nicht mehr vorhanden.');
 const nextDate=String(date??current.date).trim();
 if(!validDate(nextDate))throw Error('Bitte einen gültigen Stichtag bis heute eingeben.');
 if(model.snapshots.some(x=>x.id!==id&&x.date===nextDate))throw Error('Für dieses Datum existiert bereits ein Stichtag.');
 const totalExact=exact(units(totalEUR==null||String(totalEUR).trim()===''?(current.totalEURExact??current.total):totalEUR));
 const total=Number(totalExact);
 if(!Number.isFinite(total)||Math.abs(total)>1e18)throw Error('Ungültiger historischer Gesamtwert.');
 const newNote=String(note??current.note??'').trim();
 if(newNote.length>180)throw Error('Die Stichtagsnotiz darf maximal 180 Zeichen enthalten.');
 const correction=nextDate!==current.date||totalExact!==(current.totalEURExact??String(current.total));
 if(correction&&model.performanceFlowTrackingSince===current.date)
  throw Error('Der Startstichtag der Renditeerfassung darf nur in der Notiz geändert werden. Andernfalls zuerst die Renditeerfassung neu beginnen.');
 return {current,date:nextDate,total,totalExact,note:newNote,correction};
}
export function editSnapshot(model,id,values,{confirmCorrection=false}={}){
 const change=snapshotEditChanges(model,id,values);
 if(change.correction&&!confirmCorrection)throw Error('Änderung von Datum oder Betrag erfordert eine ausdrückliche Bestätigung als manuell korrigierter Stichtag.');
 const item=change.current;
 const previous={recordedAt:item.recordedAt||null,date:item.date,
  note:item.note||'',totalEURExact:item.totalEURExact??String(item.total),
  valuationStatus:item.valuationStatus||'unknown',source:item.source||'unknown'};
 if(change.correction||change.note!==previous.note){
  item.revisions=Array.isArray(item.revisions)?item.revisions:[];
  item.revisions.push(previous);
 }
 if(change.correction){
  // Converting a dated valuation to a manually corrected amount must invalidate
  // the old per-position and per-account historical breakdown.
  item.date=change.date;item.total=change.total;item.totalEURExact=change.totalExact;
  item.source='manual';item.valuationStatus='manual';
  item.byPosition=null;item.byAccount=null;item.quoteTimes=[];
 }
 item.note=change.note;
 if(change.correction||change.note!==previous.note)item.recordedAt=new Date().toISOString();
 model.snapshots.sort((a,b)=>a.date.localeCompare(b.date));
 return {correction:change.correction};
}
export function deleteSnapshot(model,id){
 const index=model.snapshots.findIndex(x=>x.id===id);
 if(index<0)throw Error('Stichtag nicht mehr vorhanden.');
 const item=model.snapshots[index];
 model.snapshots.splice(index,1);
 if(model.performanceFlowTrackingSince===item.date)model.performanceFlowTrackingSince=null;
 return {resetPerformanceStart:model.performanceFlowTrackingSince===null&&item.note==='Beginn der Renditeerfassung'};
}
export function deletePosition(model,id){
 const item=model.positions.find(x=>x.id===id);
 if(!item)throw Error('Position nicht mehr vorhanden.');
 if(model.bookings.some(x=>x.positionId===id||x.targetPositionId===id)||
    model.journalEntries.some(e=>e.postings?.some(x=>x.positionId===id)))
  throw Error('Position hat Buchungen oder Journal-Einträge und kann nicht gelöscht werden.');
 if(model.positions.some(x=>x.representedByPositionId===id))
  throw Error('Position wird von einer DeFi-Verknüpfung referenziert. Bitte zuerst die Verknüpfung lösen.');
 model.positions=model.positions.filter(x=>x.id!==id);
 model.openingPositions=model.openingPositions.filter(x=>x.positionId!==id);
 if(model.priceHistories)delete model.priceHistories[id];
 return item;
}
