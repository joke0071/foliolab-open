import {prepareBitpandaSourcePlan,previewBitpandaImport,BITPANDA_SOURCE} from './bitpanda-import.js';
import {escapeHTML as esc} from './model.js';
import {sourceUnmodified} from './import-identity.js';
import {units,exact} from './decimal.js';
/** Show the actual journal draft, never value holdings at the CSV market price. */
export function bitpandaImpactMarkup(model,plan){
 if(!plan)return '';
 const affected=new Set(plan.groups.filter(g=>g.status==='ready').flatMap(g=>g.actions.flatMap(a=>[a.positionId,a.cashPositionId].filter(Boolean))));
 if(!affected.size)return '';
 return '<details open><summary>Bestandswirkung der gewählten neuen Vorgänge</summary><p class="small-help">'+(plan.issues.length?'Simulation mit offenen Sperrgründen – keine Übernahmefreigabe.':'Die Endbestände stimmen exakt mit deinen eingegebenen Kontrollwerten überein. Die unabhängige Herkunft der Kontrollwerte musst du selbst prüfen.')+'</p>'+[...affected].map(id=>{
  const before=model.positions.find(p=>p.id===id),after=plan.simulated.positions.find(p=>p.id===id),start=units(before.quantityExact??before.quantity),end=units(after.quantityExact??after.quantity),delta=end-start;
  return '<div class="history-sub"><strong>'+esc(before.name)+' · '+esc(before.symbol||before.currency)+'</strong><dl><dt>Vorher</dt><dd>'+esc(exact(start))+'</dd><dt>Änderung</dt><dd>'+esc((delta>0n?'+':'')+exact(delta))+'</dd><dt>Danach</dt><dd>'+esc(exact(end))+'</dd></dl></div>';
 }).join('')+'</details>';
}
/** Ephemeral confirmations only; the shared CSV dialog owns the single CAS save. */
export function createBitpandaImportUI({host,inputs,getModel,onApproval}){
 const source=prepareBitpandaSourcePlan(inputs),streams=new Map(),assignments={},expectedClosing={},feeModes={},selected=new Set(source.groups.map(r=>r.id)),external=new Set();let plan=null,approved=false,limit=50;
 for(const r of source.groups){
  streams.set(r.streamId,{asset:r.asset,kind:r.values['Asset class']==='Fiat'?'cash':'crypto',label:r.asset+' · '+r.values['Asset class']+' · '+r.values['Product ID']});
  if(r.cashStreamId)streams.set(r.cashStreamId,{asset:r.values.Fiat,kind:'cash',label:r.values.Fiat+' · Verrechnungskonto'});
 }
 for(const [key]of streams){
  const ids=new Set();for(const b of getModel().bookings){if(b.importSource?.sourceId!==BITPANDA_SOURCE)continue;try{for(const [k,id]of JSON.parse(b.importSource.sourcePayload).bindings||[])if(k===key)ids.add(id);}catch{}}
  if(ids.size===1&&getModel().positions.some(p=>p.id===[...ids][0]))assignments[key]=[...ids][0];
 }
 for(const r of source.groups){const b=getModel().bookings.find(b=>b.importSource?.sourceId===BITPANDA_SOURCE&&b.importSource.fileId===r.id&&sourceUnmodified(getModel(),b));if(b)try{const p=JSON.parse(b.importSource.sourcePayload);if(p.feeMode)feeModes[r.id]=p.feeMode;if(p.external)external.add(r.id);}catch{}}
 const el=k=>host.querySelector('[data-bitpanda="'+k+'"]');
 host.innerHTML='<details><summary>Bitpanda-Buchungen prüfen und übernehmen</summary><p class="small-help">Ordne die Quellprodukte zu und prüfe die tatsächlichen Kontoumsätze anhand deiner Abrechnung. Der Marktpreis wird nicht als Ausführungspreis verwendet. Fehlende Gebühren und Steuern bleiben unbekannt. Transfers und Staking-Hauptbeträge benötigen noch einen gesonderten Gegenbeleg.</p><div data-bitpanda="bindings"></div><label class="field"><span><input type="checkbox" data-bitpanda="net"> Die Exportbeträge entsprechen den tatsächlichen Kontobewegungen. Bei ausgewiesenen Gebühren habe ich je Vorgang geprüft, ob sie enthalten sind oder zusätzlich abgebucht werden.</span></label><label class="field"><span><input type="checkbox" data-bitpanda="opening"> Vorhandene Mengen sind geprüfte Anfangsbestände vor den neuen Vorgängen. Bereits enthaltene Endbestände werden nicht nochmals addiert.</span></label><div data-bitpanda="groups"></div><button type="button" class="btn outline" data-bitpanda="more" hidden>Weitere Vorgänge anzeigen</button><button type="button" class="btn outline" data-bitpanda="simulate">Auswahl prüfen</button><p data-bitpanda="status" role="status" aria-live="polite">Noch keine Buchungsprüfung durchgeführt.</p><div data-bitpanda="impact"></div><label class="field"><span><input type="checkbox" data-bitpanda="partial"> Nicht ausgewählte Restvorgänge ausdrücklich offen lassen.</span></label><label class="field"><span><input type="checkbox" data-bitpanda="approve" disabled> Geprüfte Mengen, Geldbewegungen und unabhängig belegte Endbestände bestätigen. Unbekannte Kosten und Steuern bleiben ungeprüft.</span></label></details>';
 const options=()=>({selectedGroups:[...selected],externalReferences:[...external],feeModes:{...feeModes},expectedClosing:{...expectedClosing},netConfirmed:el('net').checked,openingConfirmed:el('opening').checked});
 const valid=()=>approved&&plan?.ready&&!plan.issues.length&&plan.baseline===JSON.stringify(getModel())&&(!plan.excluded||el('partial').checked);
 const notify=()=>onApproval(Boolean(valid()));
 const invalidate=()=>{plan=null;approved=false;el('approve').checked=false;el('approve').disabled=true;el('status').textContent='Auswahl geändert. Erneut prüfen.';el('impact').innerHTML='';notify();};
 function renderBindings(){
  el('bindings').innerHTML=[...streams].map(([key,s])=>{
   const positions=getModel().positions.filter(p=>!p.wallet?.enabled&&p.managementSource!=='wallet'&&p.currency==='EUR'&&p.kind===s.kind&&(s.kind==='cash'||p.symbol===s.asset));
   return '<div class="history-sub"><label class="field"><span>'+esc(s.label)+'</span><select data-bitpanda-binding="'+esc(key)+'"><option value="">Bitte ausdrücklich zuordnen</option>'+positions.map(p=>'<option value="'+esc(p.id)+'"'+(assignments[key]===p.id?' selected':'')+'>'+esc((getModel().providers.find(v=>v.id===p.providerId)?.name||'Anbieter')+' / '+p.name)+'</option>').join('')+'</select></label><label class="field"><span>Unabhängig belegter Endbestand nach der gewählten neuen Teilmenge</span><input type="text" inputmode="decimal" autocomplete="off" data-bitpanda-closing="'+esc(key)+'" value="'+esc(expectedClosing[assignments[key]]??'')+'"></label></div>';
  }).join('');
  for(const e of host.querySelectorAll('[data-bitpanda-binding]'))e.onchange=()=>{assignments[e.dataset.bitpandaBinding]=e.value;invalidate();renderBindings();};
  for(const e of host.querySelectorAll('[data-bitpanda-closing]'))e.oninput=()=>{const id=assignments[e.dataset.bitpandaClosing];if(id)expectedClosing[id]=e.value;invalidate();};
 }
 function renderGroups(){
  el('groups').innerHTML=source.groups.slice(0,limit).map(r=>{
   const v=r.values,n=r.numbers,result=plan?.groups.find(g=>g.id===r.id);
   return '<div class="history-sub"><label class="field"><span><input type="checkbox" data-bitpanda-group="'+esc(r.id)+'"'+(selected.has(r.id)?' checked':'')+'> '+esc(v.Timestamp+' · '+v['Transaction Type']+' · '+(n['Amount Asset']??'unbekannt')+' '+v.Asset)+'</span></label><p class="small-help">Fiatbetrag: '+esc(n['Amount Fiat']??'unbekannt')+' '+esc(v.Fiat)+' · Gebühr: '+esc(n.Fee??'unbekannt')+' '+esc(v['Fee asset'])+'</p>'+(n.Fee!==null&&Number(n.Fee)>0?'<label class="field"><span>Gebühr laut Abrechnung</span><select data-bitpanda-fee="'+esc(r.id)+'"><option value="">Bitte prüfen</option><option value="included"'+(feeModes[r.id]==='included'?' selected':'')+'>Im Exportbetrag enthalten</option><option value="additional"'+(feeModes[r.id]==='additional'?' selected':'')+'>Zusätzliche Abbuchung</option></select></label>':'')+(['deposit','withdrawal'].includes(r.kind)?'<label class="field"><span><input type="checkbox" data-bitpanda-external="'+esc(r.id)+'"'+(external.has(r.id)?' checked':'')+'> Gegenbereich liegt außerhalb aller erfassten Konten und Wallets.</span></label>':'')+'<p class="small-help">'+esc(result?.message||(result?.status==='ready'?'Geprüft – neuer Vorgang':result?.status==='existing'?'Bereits vorhanden':''))+'</p></div>';
  }).join('');
  for(const e of host.querySelectorAll('[data-bitpanda-group]'))e.onchange=()=>{e.checked?selected.add(e.dataset.bitpandaGroup):selected.delete(e.dataset.bitpandaGroup);invalidate();};
  for(const e of host.querySelectorAll('[data-bitpanda-external]'))e.onchange=()=>{e.checked?external.add(e.dataset.bitpandaExternal):external.delete(e.dataset.bitpandaExternal);invalidate();};
  for(const e of host.querySelectorAll('[data-bitpanda-fee]'))e.onchange=()=>{feeModes[e.dataset.bitpandaFee]=e.value;invalidate();};
  el('more').hidden=limit>=source.groups.length;el('more').classList.toggle('hidden',limit>=source.groups.length);
 }
 el('net').onchange=invalidate;el('opening').onchange=invalidate;
 el('partial').onchange=()=>{approved=false;el('approve').checked=false;notify();};
 el('approve').onchange=()=>{approved=el('approve').checked;notify();};
 el('simulate').onclick=()=>{approved=false;el('approve').checked=false;plan=null;try{plan=previewBitpandaImport(getModel(),inputs,assignments,options());el('status').textContent=plan.ready+' neue Vorgänge · '+plan.duplicates+' bereits vorhanden · '+plan.issues.length+' gesperrt · '+plan.excluded+' nicht ausgewählt. Noch nichts gespeichert.'+(plan.issues.length?' '+[...new Set(plan.issues.map(i=>i.message))].join(' '):'');}catch(e){el('status').textContent='Keine Übernahme: '+e.message;}el('approve').disabled=!plan?.ready||Boolean(plan.issues.length);el('impact').innerHTML=bitpandaImpactMarkup(getModel(),plan);renderGroups();notify();};
 el('more').onclick=()=>{limit+=50;renderGroups();};renderBindings();renderGroups();notify();
 return {approved(){return valid()?{...options(),assignments:{...assignments},baseline:plan.baseline,confirmed:true,partialConfirmed:el('partial').checked}:null;},resetApproval:invalidate};
}
