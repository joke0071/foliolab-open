import {escapeHTML as esc} from './model.js';
/** Evidence entry only; preview and CAS stay in the existing shared importer. */
export function createSharedFlatexReconciliationUI({host,getModel,onChange}){
 let openingDate='',closingDate='',confirmed=false,values={};
 const key=(role,snapshotId,id)=>JSON.stringify([role,snapshotId,id]);
 const refs=ids=>(getModel().snapshots||[]).filter(s=>s.byPosition&&ids.some(id=>Object.hasOwn(s.byPosition,id)));
 function observations(scope){
  const model=getModel(),rows=[];
  for(const role of ['opening','closing','reference'])for(const s of role==='reference'?refs(scope.ids):[null])for(const id of scope.ids){
   if(s&&!Object.hasOwn(s.byPosition,id))continue;
   const p=model.positions.find(p=>p.id===id),v=values[key(role,s?.id??null,id)]||{};
   rows.push({role,snapshotId:s?.id??null,date:s?.date??(role==='opening'?openingDate:closingDate),positionId:id,accountId:p.accountId,sourceId:scope.sourceIds[id],sourceReference:v.sourceReference||'',quantityExact:v.quantityExact||'',priceExact:p.kind==='cash'?'1':v.priceExact||'',valueEURExact:s?.byPosition[id]??v.valueEURExact??'',currency:'EUR'});
  }
  return rows;
 }
 function markup(scope){
  if(!scope?.ids.length)return '<p class="small-help">Zuerst Quellen, Konten und EUR-Paare auswählen. Alle bereits verknüpften Positionen werden gemeinsam geprüft.</p>';
  if(scope.ids.length>20||refs(scope.ids).length>24)return '<p class="small-help">Dieser Abgleich ist auf 20 gekoppelte Positionen und 24 Referenzstände begrenzt. Für einen größeren Bereich ist ein gesonderter Belegabgleich erforderlich.</p>';
  const accounts=getModel().accounts;
  return '<div data-shared-reconciliation><p class="small-help">Datierte Belege für Anfang, Ende und jeden betroffenen Referenzstand eingeben. Historische Mengen und Preise werden nicht aus heutigen Werten abgeleitet. Bestehende Buchungen und Referenzen bleiben erhalten; Kosten und ungeklärte Differenzen werden nicht zu bestätigten Gebühren.</p>'+
   '<label class="field"><span>Datum des belegten Anfangs</span><input type="date" data-reconcile-date="opening" value="'+esc(openingDate)+'"></label><label class="field"><span>Datum des belegten Endbestands</span><input type="date" data-reconcile-date="closing" value="'+esc(closingDate)+'"></label>'+
   observations(scope).map((o,i)=>{const p=getModel().positions.find(p=>p.id===o.positionId),title=o.role==='opening'?'Anfang':o.role==='closing'?'Ende':'Referenz '+o.date;return '<fieldset><legend>'+esc(title+' · '+p.name)+'</legend><p class="small-help">'+esc(accounts.find(a=>a.id===p.accountId)?.name||p.accountId)+' · EUR'+'</p>'+[
    ['quantityExact','Unabhängig belegte Menge'],['priceExact','Historischer Preis in EUR'],['valueEURExact','Belegter Positionswert in EUR'],['sourceReference','Belegquelle / Referenz']
   ].map(([k,label])=>'<label class="field"><span>'+label+'</span><input '+(k==='sourceReference'?'maxlength="180"':'inputmode="decimal"')+' data-reconcile-row="'+i+'" data-reconcile-field="'+k+'" value="'+esc(o[k])+'" '+((o.role==='reference'&&k==='valueEURExact'||p.kind==='cash'&&k==='priceExact')?'readonly':'')+'></label>').join('')+'</fieldset>';}).join('')+
   '<label class="selection-check"><input type="checkbox" data-reconcile-confirm '+(confirmed?'checked':'')+'> Mengen, Quellen und historische EUR-Bewertungen unabhängig belegt. Alle betroffenen Referenzstände und bisherigen Buchungen müssen erhalten bleiben.</label></div>';
 }
 return {markup,reset(){openingDate='';closingDate='';confirmed=false;values={};},bind(scope){
  const changed=()=>{confirmed=false;const c=host.querySelector('[data-reconcile-confirm]');if(c)c.checked=false;onChange();};
  for(const e of host.querySelectorAll('[data-reconcile-date]'))e.onchange=()=>{if(e.dataset.reconcileDate==='opening')openingDate=e.value;else closingDate=e.value;changed();};
  const rows=observations(scope);
  for(const e of host.querySelectorAll('[data-reconcile-row]'))if(!e.readOnly)e.oninput=()=>{const o=rows[Number(e.dataset.reconcileRow)],k=key(o.role,o.snapshotId,o.positionId),field=e.dataset.reconcileField;values[k]??={};values[k][field]=field==='sourceReference'?e.value.trim():e.value.trim().replace(',','.');changed();};
  const c=host.querySelector('[data-reconcile-confirm]');if(c)c.onchange=()=>{confirmed=c.checked;onChange();};
 },options(scope){return {observations:observations(scope),confirmed};}};
}
