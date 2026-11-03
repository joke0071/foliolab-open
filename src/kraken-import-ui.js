import {prepareKrakenSourcePlan} from './kraken-source-plan.js';
import {previewKrakenImport,previewKrakenWithdrawal} from './kraken-import.js';
import {sourceUnmodified} from './import-identity.js';
import {escapeHTML as esc} from './model.js';
/** All selections are ephemeral until the enclosing dialog performs its canonical CAS commit. */
export function createKrakenImportUI({host,inputs,getModel,onApproval}){
 const source=prepareKrakenSourcePlan(inputs),streams=[...new Map(source.observations.map(r=>[r.streamId,r])).values()];
 const assignments={},selected=new Set(source.groups.map(g=>g.id)),external=new Set();let plan=null,approved=false,limit=50,bindingLimit=20;
 // Only a unique previously confirmed source binding may be restored.
 for(const row of streams){
  const ids=new Set();for(const b of getModel().bookings){if(b.importSource?.sourceId!=='kraken-uh03-v1')continue;try{for(const [s,id] of JSON.parse(b.importSource.sourcePayload).bindings||[])if(s===row.streamId)ids.add(id);}catch{}}
  if(ids.size===1&&getModel().positions.some(p=>p.id===[...ids][0]))assignments[row.streamId]=[...ids][0];
 }
 for(const g of source.groups.filter(g=>['deposit-review','withdrawal-review'].includes(g.kind)))if(getModel().bookings.some(b=>b.importSource?.sourceId==='kraken-uh03-v1'&&b.importSource.fileId===g.id&&b.external===true&&sourceUnmodified(getModel(),b)))external.add(g.id);
 const el=id=>host.querySelector('[data-kraken="'+id+'"]');
 host.innerHTML='<details><summary>Kraken-Buchungen prüfen und übernehmen</summary><p class="small-help">Ordne jeden Asset-/Walletbereich ausdrücklich zu. Der vorhandene Bestand muss dem Quellsaldo vor der ersten neuen Gruppe entsprechen. Eine vollständige Historie lässt sich damit nicht über den heutigen Endbestand addieren. Bekannte Anschaffungskosten bleiben geschützt. Ledger-IDs belegen keine Blockchain-Transaktion; interne Wallet-Gegenbelege sind gesondert zu klären.</p><label class="field"><span>Vorgang</span><select data-kraken="operation"><option value="import">Buchungsgruppen übernehmen</option><option value="withdraw">Eine vollständige Gruppe zurücknehmen</option></select></label><p class="small-help">Zur Rücknahme denselben Originalexport laden und genau eine bestehende Gruppe auswählen. Geld-, Krypto- und Gebührenwirkungen werden gemeinsam zurückgenommen. Der Quellenbeleg bleibt als dauerhafte Wiederimportsperre erhalten. Eine bloße Quellenentfernung ist hier nicht möglich. Spätere oder fremde Buchungen im selben Bereich bleiben geschützt.</p><div data-kraken="bindings"></div><button type="button" class="btn outline" data-kraken="more-bindings" hidden>Weitere Quellbereiche anzeigen</button><label class="field"><span><input type="checkbox" data-kraken="opening"> Vorhandene Mengen sind geprüfte Anfangsbestände vor den ausgewählten neuen Vorgängen, keine bereits enthaltenen Endbestände.</span></label><button type="button" class="btn outline" data-kraken="simulate">Auswahl prüfen</button><p data-kraken="status" role="status" aria-live="polite">Noch keine Buchungsprüfung durchgeführt.</p><div data-kraken="groups"></div><button type="button" class="btn outline" data-kraken="more" hidden>Weitere Gruppen anzeigen</button><label class="field"><span><input type="checkbox" data-kraken="partial"> Nicht ausgewählte Restgruppen ausdrücklich offen lassen. Die gewählte Teilmenge wurde vollständig auf Abhängigkeiten geprüft.</span></label><label class="field"><span><input type="checkbox" data-kraken="approve" disabled> Gezeigten Vorgang einschließlich aller Gruppenbeine bestätigen. Bei Rücknahme Geld-/Mengenänderungen und dauerhafte Wiederimportsperre übernehmen. Exakte Mengen und Geldbewegungen sind bestätigt; Kosten-, Gebührenbewertung und Steuern bleiben soweit angegeben ungeprüft.</span></label></details>';
 const options=()=>({operation:el('operation').value,selectedGroups:[...selected],externalReferences:[...external],openingConfirmed:el('opening').checked});
 const notify=()=>onApproval(Boolean(approved&&plan?.ready&&!plan.issues.length&&plan.baseline===JSON.stringify(getModel())&&(!plan.excluded||el('partial').checked)));
 const invalidate=()=>{plan=null;approved=false;el('approve').checked=false;el('approve').disabled=true;el('status').textContent='Auswahl geändert. Erneut prüfen.';notify();};
 function renderBindings(){
  el('bindings').innerHTML=streams.slice(0,bindingLimit).map(row=>{
   const positions=getModel().positions.filter(p=>!p.wallet?.enabled&&p.currency==='EUR'&&(row.values.asset==='EUR'?p.kind==='cash':p.kind==='crypto'&&p.symbol===row.values.asset));
   return '<label class="field"><span>'+esc(row.values.asset+' · '+row.values.wallet+' · '+row.values.subclass)+'</span><select data-kraken-binding="'+esc(row.streamId)+'"><option value="">Bitte ausdrücklich zuordnen</option>'+positions.map(p=>'<option value="'+esc(p.id)+'"'+(assignments[row.streamId]===p.id?' selected':'')+'>'+esc((getModel().providers.find(v=>v.id===p.providerId)?.name||'Anbieter')+' / '+(getModel().accounts.find(a=>a.id===p.accountId)?.name||'Konto')+' / '+p.name)+'</option>').join('')+'</select></label>';
  }).join('');
  el('more-bindings').hidden=bindingLimit>=streams.length;el('more-bindings').classList.toggle('hidden',bindingLimit>=streams.length);
  for(const select of host.querySelectorAll('[data-kraken-binding]'))select.onchange=()=>{assignments[select.dataset.krakenBinding]=select.value;invalidate();};
 }
 function renderGroups(){
  const labels={exchange:'Handel',reward:'Reward','internal-transfer':'Interner Hauptbetragtransfer','deposit-review':'Zugang – Gegenbereich prüfen','withdrawal-review':'Abgang – Gegenbereich prüfen',unresolved:'Ungeklärt'};
  el('groups').innerHTML=source.groups.slice(0,limit).map(g=>{
   const result=plan?.groups.find(x=>x.id===g.id),movements=g.movements.map(m=>(m.deltaExact??'unbekannt')+' '+m.asset+' ('+m.wallet+')').join(' · ');
   return '<div class="history-sub"><label class="field"><span><input type="checkbox" data-kraken-group="'+esc(g.id)+'"'+(selected.has(g.id)?' checked':'')+'> '+esc(g.rows[0].values.time+' · '+labels[g.kind])+'</span></label><p class="small-help">'+esc(movements)+'</p>'+(['deposit-review','withdrawal-review'].includes(g.kind)?'<label class="field"><span><input type="checkbox" data-kraken-external="'+esc(g.id)+'"'+(external.has(g.id)?' checked':'')+'> Gegenbereich liegt nach eigener Prüfung außerhalb aller erfassten Konten und Wallets.</span></label>':'')+'<p class="small-help">'+esc(result?.message||(result?.status==='ready'?'Geprüft – neue Buchungsgruppe':result?.status==='existing'?'Bereits vorhanden':g.issues.join(' ')))+'</p></div>';
  }).join('');
  for(const box of host.querySelectorAll('[data-kraken-group]'))box.onchange=()=>{box.checked?selected.add(box.dataset.krakenGroup):selected.delete(box.dataset.krakenGroup);invalidate();};
  for(const box of host.querySelectorAll('[data-kraken-external]'))box.onchange=()=>{box.checked?external.add(box.dataset.krakenExternal):external.delete(box.dataset.krakenExternal);invalidate();};
  el('more').hidden=limit>=source.groups.length;el('more').classList.toggle('hidden',limit>=source.groups.length);
 }
 el('more-bindings').onclick=()=>{const previous=bindingLimit;bindingLimit+=20;renderBindings();host.querySelectorAll('[data-kraken-binding]')[previous]?.focus();};
 el('opening').onchange=invalidate;el('operation').onchange=()=>{const label=el('opening').closest('label'),withdraw=el('operation').value==='withdraw';label.hidden=withdraw;label.classList.toggle('hidden',withdraw);invalidate();};
 el('partial').onchange=()=>{approved=false;el('approve').checked=false;notify();};
 el('approve').onchange=()=>{approved=el('approve').checked;notify();};
 el('simulate').onclick=()=>{
  approved=false;el('approve').checked=false;plan=null;
  try{
   if(el('operation').value==='withdraw'){
    const review=previewKrakenWithdrawal(getModel(),inputs,assignments,options());
    plan={...review,ready:1,issues:[],groups:[{id:review.group,status:'ready',message:'Vollständige Rücknahme geprüft. Geld-/Mengenänderungen: '+review.changes.map(c=>(getModel().positions.find(p=>p.id===c.positionId)?.name||c.positionId)+' '+c.before+' → '+c.after).join(' · ')}]};
    el('status').textContent='1 Gruppe rücknehmbar · '+review.excluded+' nicht ausgewählt. Quellenbeleg und Wiederimportsperre bleiben dauerhaft erhalten. Noch nichts gespeichert.';
   }else{plan=previewKrakenImport(getModel(),inputs,assignments,options());el('status').textContent=plan.ready+' neue Gruppen · '+plan.duplicates+' bereits vorhanden · '+plan.issues.length+' gesperrt · '+plan.excluded+' nicht ausgewählt. Noch nichts gespeichert.';}
  }
  catch(e){el('status').textContent='Keine Übernahme: '+e.message;}
  el('approve').disabled=!plan||!plan.ready||Boolean(plan.issues.length);renderGroups();notify();
 };
 el('more').onclick=()=>{limit+=50;renderGroups();};
 renderBindings();renderGroups();notify();
 return {approved(){if(!approved||!plan||plan.issues.length||!plan.ready||plan.baseline!==JSON.stringify(getModel())||plan.excluded&&!el('partial').checked)return null;return {...options(),assignments:{...assignments},baseline:plan.baseline,confirmed:true,partialConfirmed:el('partial').checked};},resetApproval(){invalidate();}};
}
