import {previewTransferMatch,confirmTransferMatch,undoTransferMatch} from './transactions.js';
import {escapeHTML as esc} from './model.js';
/** UI choices only; previewTransferMatch remains the sole financial proof gate. */
export function transferDialogChoices(model,outgoingId='',incomingId=''){
 const positions=new Map(model.positions.map(p=>[p.id,p])),accounts=new Map(model.accounts.map(a=>[a.id,a]));
 const ownCash=b=>{const p=positions.get(b.positionId),a=p&&accounts.get(p.accountId);return p?.kind==='cash'&&!p.wallet?.enabled&&Boolean(a&&a.providerId===p.providerId);};
 const eligiblePair=(out,b)=>{const p=positions.get(out.positionId),q=positions.get(b.positionId);return b.type==='deposit'&&!b.transferMatch&&ownCash(b)&&q.accountId!==p.accountId&&q.currency===p.currency&&Math.abs(Date.parse(b.date)-Date.parse(out.date))<=7*864e5;};
 const anchor=incomingId?model.bookings.find(b=>b.id===incomingId):null;
 const outgoing=model.bookings.filter(b=>b.type==='withdraw'&&!b.transferMatch&&ownCash(b)&&(!incomingId||(anchor&&eligiblePair(b,anchor))));
 const out=outgoing.find(b=>b.id===outgoingId)||null;
 const incoming=out?model.bookings.filter(b=>eligiblePair(out,b)):[];
 return {outgoing,out,incoming,hasOwnCash:model.positions.some(p=>ownCash({positionId:p.id}))};
}
export function createTransferMatchingUI({getModel,assertCurrent,commit,onCreate,canCreate=()=>true,restoreFocus=button=>button?.focus()}){
 let dialog,trigger,preview=null,running=false,incomingLimit=200,anchorIncomingId='',contextMatchId='';
 const el=k=>dialog.querySelector('[data-transfer="'+k+'"]');
 function label(b){const m=getModel(),p=m.positions.find(p=>p.id===b.positionId),a=m.accounts.find(a=>a.id===p?.accountId),provider=m.providers.find(x=>x.id===p?.providerId);return [b.date,provider?.name,a?.name,b.quantityExact??b.quantity,p?.currency,b.id].filter(x=>x!=null).join(' · ');}
 function selected(){return [...dialog.querySelectorAll('[data-transfer-in]:checked')].map(x=>x.value);}
 function updatePreview(){
  preview=previewTransferMatch(getModel(),el('out').value,selected());
  el('preview').textContent=preview.ready?'Mengen stimmen überein: '+preview.quantityExact+' '+preview.currency+'. Nach Bestätigung werden diese vorhandenen Bewegungen als intern zugeordnet und aus den externen Geldflüssen entfernt. Erfasste Bestände und Stichtage bleiben unverändert.':preview.reasons.join(' ');
  el('accept').disabled=running||!preview.ready||!el('reference').value.trim()||!el('consent').checked;
 }
 function showIncoming(reset=true){
  const previous=new Set(reset?(anchorIncomingId?[anchorIncomingId]:[]):selected());el('consent').checked=false;if(reset)el('reference').value='';
  const m=getModel(),{outgoing,out,incoming:available,hasOwnCash}=transferDialogChoices(m,el('out').value,anchorIncomingId);
  el('out-summary').textContent=out?label(out):'Wähle zuerst eine vorhandene Auszahlung von einem eigenen Geldkonto.';
  const hasChoices=Boolean(out&&available.length);
  el('form').hidden=!outgoing.length;el('candidate-group').hidden=!out;
  el('approval').hidden=!hasChoices;el('preview').hidden=!hasChoices;el('footer').hidden=!hasChoices;
  dialog.classList.toggle('transfer-is-empty',!hasChoices);
  el('empty').hidden=hasChoices;
  el('intro').textContent=hasChoices?'Gleicher Betrag ist kein Nachweis. Wähle beide Bewegungen und prüfe ihre Belege. Mehrere Eingänge können einen Teiltransfer bilden. Gebühren, unterschiedliche Währungen und fehlende Belege werden nicht automatisch ausgeglichen.':'Dieser Abgleich ist für Ein- und Auszahlungen zwischen eigenen Geldkonten. Wallet- und Wertpapiertransfers werden hier nicht zugeordnet.';
  el('empty-message').textContent=anchorIncomingId&&!outgoing.length?'Keine offene Auszahlung derselben Währung auf einem anderen eigenen Geldkonto innerhalb von sieben Tagen für diesen Eingang gefunden. Belege und Valuta prüfen.':!outgoing.length?(hasOwnCash?'Keine offene Auszahlung auf einem eigenen Geldkonto vorhanden. '+(m.bookings.some(b=>b.transferMatch)?'Bereits zugeordnete Transfers bleiben unten einsehbar.':'Erfasse oder importiere passende Geldbewegungen vor dem Abgleich.'):'Noch keine Guthabenposition auf einem eigenen Geldkonto vorhanden.'):
   !out?'Wähle einen Ausgang. Die Auswahl ersetzt noch keine Prüfung der Buchungs- und Journalbelege.':'Kein offener Eingang derselben Währung auf einem anderen eigenen Geldkonto innerhalb von sieben Tagen gefunden. Gegenbuchung, Währung und Valuta prüfen.';
  const createKind=hasOwnCash?'booking':'cash';el('create').textContent=hasOwnCash?'Buchung hinzufügen':'Anlage hinzufügen';
  el('create').hidden=typeof onCreate!=='function'||Boolean(outgoing.length&&!out);el('create').disabled=running||!canCreate(createKind);
  const ordered=anchorIncomingId?[...available.filter(b=>b.id===anchorIncomingId),...available.filter(b=>b.id!==anchorIncomingId)]:available;
  const candidates=ordered.slice(0,incomingLimit);el('incoming-more').hidden=available.length<=incomingLimit;
  el('incoming').innerHTML=candidates.length?candidates.map(b=>'<label class="checkbox-line transfer-candidate"><input type="checkbox" data-transfer-in value="'+esc(b.id)+'"'+(previous.has(b.id)?' checked':'')+'><span>'+esc(label(b))+'</span></label>').join(''):'<p class="small-help">Die erforderliche Gegenbewegung fehlt in dieser Auswahl.</p>';
  if(contextMatchId){el('form').hidden=true;el('empty').hidden=true;el('footer').hidden=true;el('intro').textContent='Prüfe den Transferbeleg und die Gegenbuchungen. Aufheben stellt die ursprünglichen externen Geldflüsse wieder her; Bestände bleiben unverändert.';}
  updatePreview();
 }
 function refresh(){
  const m=getModel(),out=transferDialogChoices(m,'',anchorIncomingId).outgoing;
  el('out').innerHTML='<option value="">Ausgang auswählen</option>'+out.map(b=>'<option value="'+esc(b.id)+'">'+esc(label(b))+'</option>').join('');
  const groups=[...new Map(m.bookings.filter(b=>b.transferMatch&&(!contextMatchId||b.transferMatch.id===contextMatchId)).map(b=>[b.transferMatch.id,b.transferMatch])).values()];
  el('confirmed').innerHTML=groups.length?groups.map(t=>'<div class="history-row"><div><strong>'+esc(t.reference)+'</strong><ul class="transfer-counterparts">'+[t.outgoingId,...t.incomingIds].map(id=>{const b=m.bookings.find(b=>b.id===id);return '<li>'+esc(b?label(b):id)+'</li>';}).join('')+'</ul><p class="small-help">Aufheben stellt die ursprünglichen externen Ein- und Auszahlungen wieder her. Bestände bleiben unverändert.</p><button type="button" class="btn outline" data-transfer-undo="'+esc(t.id)+'">Zuordnung aufheben</button></div></div>').join(''):'<p class="small-help">Noch keine bestätigten Zuordnungen.</p>';
  el('confirmed-section').hidden=!groups.length;incomingLimit=200;showIncoming();
 }
 async function save(action,{undo=false}={}){
  if(running)return;running=true;el('accept').disabled=true;el('status').textContent='Zuordnung wird geprüft …';
  try{await assertCurrent();const draft=structuredClone(getModel()),result=action(draft);if(result.changed)await commit(draft);if(undo&&result.changed)contextMatchId='';refresh();el('status').textContent=result.changed?(undo?'Zuordnung aufgehoben. Ursprüngliche externe Geldflüsse wiederhergestellt. Bestände unverändert.':'Zuordnung gespeichert. Keine Bestände erneut gebucht.'):'Diese Zuordnung ist bereits gespeichert.';el('status').tabIndex=-1;el('status').focus({preventScroll:true});}
  catch(e){el('status').textContent='Nicht gespeichert: '+String(e.message||e);}
  finally{running=false;updatePreview();}
 }
 function mount(){
  dialog=document.createElement('dialog');dialog.className='edit-dialog wallet-history-dialog';dialog.id='transferMatchingDialog';dialog.setAttribute('aria-labelledby','transferMatchingTitle');
  dialog.innerHTML='<div class="dialog-head"><h2 id="transferMatchingTitle" tabindex="-1">Interne Transfers prüfen</h2><button type="button" class="icon-close" data-transfer="close" aria-label="Transferprüfung schließen">×</button></div><div class="wallet-history-body"><p class="small-help" data-transfer="intro">Gleicher Betrag ist kein Nachweis. Wähle beide Bewegungen und prüfe ihre Belege. Mehrere Eingänge können einen Teiltransfer bilden. Gebühren, unterschiedliche Währungen und fehlende Belege werden nicht automatisch ausgeglichen.</p><p class="small-help transfer-booking-context" data-transfer="context" hidden></p><div data-transfer="form"><label class="field"><span>Ausgang · Datum, Anbieter, Konto, Menge, Währung, Buchungs-ID</span><select data-transfer="out"></select></label><p class="small-help" data-transfer="out-summary"></p><fieldset class="dialog-group" data-transfer="candidate-group"><legend>Eingänge auf eigenen Konten · bis zu 12 auswählen</legend><div data-transfer="incoming"></div><button type="button" class="btn outline" data-transfer="incoming-more" hidden>Weitere Gegenbewegungen anzeigen</button></fieldset><p class="small-help" data-transfer="preview" role="status"></p><div data-transfer="approval"><label class="field"><span>Geprüfter Beleg / Verwendungszweck</span><input data-transfer="reference" maxlength="180" placeholder="z. B. Überweisungsbeleg vom …"></label><label class="checkbox-line"><input type="checkbox" data-transfer="consent"><span>Ich habe die Belege geprüft. Ausgang und ausgewählte Eingänge gehören zu diesem Transfer zwischen meinen eigenen Konten.</span></label></div></div><div data-transfer="empty" hidden><p class="small-help" data-transfer="empty-message" role="status" aria-live="polite"></p><div class="transfer-empty-actions"><button type="button" class="btn outline" data-transfer="create">Anlage hinzufügen</button></div></div><p data-transfer="status" role="status" aria-live="polite"></p><details class="advanced-apis" data-transfer="confirmed-section"><summary>Bestätigte Zuordnungen</summary><div data-transfer="confirmed"></div></details></div><div class="dialog-footer" data-transfer="footer"><button type="button" class="btn primary" data-transfer="accept" disabled>Ausdrücklich intern zuordnen</button></div>';
  document.body.append(dialog);const close=()=>{if(running)return;dialog.close();restoreFocus(trigger);};el('close').onclick=close;el('create').onclick=()=>{if(running||typeof onCreate!=='function')return;const kind=transferDialogChoices(getModel()).hasOwnCash?'booking':'cash';if(!canCreate(kind)){el('create').disabled=true;el('status').textContent='Datenstand nicht schreibbar. Bitte zuerst den Speicherstatus prüfen und gegebenenfalls neu laden.';return;}close();onCreate(kind);};dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  el('out').onchange=()=>{incomingLimit=200;showIncoming();};el('incoming-more').onclick=()=>{incomingLimit+=200;showIncoming(false);};el('incoming').onchange=()=>{el('consent').checked=false;updatePreview();};el('reference').oninput=updatePreview;el('consent').onchange=updatePreview;
  el('accept').onclick=()=>{const selection={...preview,reference:el('reference').value,confirmed:el('consent').checked};void save(m=>confirmTransferMatch(m,selection));};
  el('confirmed').onclick=e=>{const button=e.target.closest('[data-transfer-undo]');if(button&&confirm('Die Zuordnung aufheben und die ursprünglichen externen Geldflüsse wiederherstellen? Bestände bleiben unverändert.'))void save(m=>undoTransferMatch(m,button.dataset.transferUndo),{undo:true});};
 }
 return {open(button,{bookingId='',matchId=''}={}){if(!dialog)mount();trigger=button;const booking=getModel().bookings.find(b=>b.id===bookingId);anchorIncomingId=booking?.type==='deposit'&&!booking.transferMatch?booking.id:'';contextMatchId=matchId||booking?.transferMatch?.id||'';refresh();if(booking?.type==='withdraw'&&!booking.transferMatch){el('out').value=booking.id;showIncoming();}el('context').textContent=booking?'Gewählte Buchung: '+label(booking):'';el('context').hidden=!booking;el('confirmed-section').open=Boolean(contextMatchId);el('status').textContent='';dialog.showModal();dialog.querySelector('h2').focus();}};
}
