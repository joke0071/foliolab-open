import {previewTransferMatch,confirmTransferMatch,undoTransferMatch} from './transactions.js';
import {escapeHTML as esc} from './model.js';
export function createTransferMatchingUI({getModel,assertCurrent,commit}){
 let dialog,trigger,preview=null,running=false,incomingLimit=200;
 const el=k=>dialog.querySelector('[data-transfer="'+k+'"]');
 function label(b){const m=getModel(),p=m.positions.find(p=>p.id===b.positionId),a=m.accounts.find(a=>a.id===p?.accountId),provider=m.providers.find(x=>x.id===p?.providerId);return [b.date,provider?.name,a?.name,b.quantityExact??b.quantity,p?.currency,b.id].filter(x=>x!=null).join(' · ');}
 function selected(){return [...dialog.querySelectorAll('[data-transfer-in]:checked')].map(x=>x.value);}
 function updatePreview(){
  preview=previewTransferMatch(getModel(),el('out').value,selected());
  el('preview').textContent=preview.ready?'Mengen stimmen überein: '+preview.quantityExact+' '+preview.currency+'. Nach Bestätigung werden diese vorhandenen Bewegungen als intern zugeordnet und aus den externen Geldflüssen entfernt. Erfasste Bestände und Stichtage bleiben unverändert.':preview.reasons.join(' ');
  el('accept').disabled=running||!preview.ready||!el('reference').value.trim()||!el('consent').checked;
 }
 function showIncoming(reset=true){
  const previous=new Set(reset?[]:selected());el('consent').checked=false;if(reset)el('reference').value='';
  const m=getModel(),out=m.bookings.find(b=>b.id===el('out').value),p=m.positions.find(p=>p.id===out?.positionId);
  el('out-summary').textContent=out?label(out):'';
  const available=m.bookings.filter(b=>b.type==='deposit'&&!b.transferMatch&&m.positions.some(x=>x.id===b.positionId&&x.kind==='cash'&&x.accountId!==p?.accountId)&&out&&Math.abs(Date.parse(b.date)-Date.parse(out.date))<=7*864e5);
  const candidates=available.slice(0,incomingLimit);el('incoming-more').hidden=available.length<=incomingLimit;
  el('incoming').innerHTML=candidates.length?candidates.map(b=>'<label class="checkbox-line transfer-candidate"><input type="checkbox" data-transfer-in value="'+esc(b.id)+'"'+(previous.has(b.id)?' checked':'')+'><span>'+esc(label(b))+'</span></label>').join(''):'<p class="small-help">Kein offener Eingang auf einem anderen eigenen Konto innerhalb von sieben Tagen gefunden. Fehlende Gegenbuchung, Valuta oder Belege separat prüfen.</p>';
  updatePreview();
 }
 function refresh(){
  const m=getModel(),out=m.bookings.filter(b=>b.type==='withdraw'&&!b.transferMatch&&m.positions.some(p=>p.id===b.positionId&&p.kind==='cash'));
  el('out').innerHTML='<option value="">Ausgang auswählen</option>'+out.map(b=>'<option value="'+esc(b.id)+'">'+esc(label(b))+'</option>').join('');
  const groups=[...new Map(m.bookings.filter(b=>b.transferMatch).map(b=>[b.transferMatch.id,b.transferMatch])).values()];
  el('confirmed').innerHTML=groups.length?groups.map(t=>'<div class="history-row"><div><strong>'+esc(t.reference)+'</strong><p class="small-help">'+esc([t.outgoingId,...t.incomingIds].join(' ↔ '))+'</p><button type="button" class="btn outline" data-transfer-undo="'+esc(t.id)+'">Zuordnung aufheben</button></div></div>').join(''):'<p class="small-help">Noch keine bestätigten Zuordnungen.</p>';
  incomingLimit=200;showIncoming();
 }
 async function save(action){
  if(running)return;running=true;el('accept').disabled=true;el('status').textContent='Zuordnung wird geprüft …';
  try{await assertCurrent();const draft=structuredClone(getModel()),result=action(draft);if(result.changed)await commit(draft);refresh();el('status').textContent=result.changed?'Zuordnung gespeichert. Keine Bestände erneut gebucht.':'Diese Zuordnung ist bereits gespeichert.';}
  catch(e){el('status').textContent='Nicht gespeichert: '+String(e.message||e);}
  finally{running=false;updatePreview();}
 }
 function mount(){
  dialog=document.createElement('dialog');dialog.className='edit-dialog wallet-history-dialog';dialog.id='transferMatchingDialog';dialog.setAttribute('aria-labelledby','transferMatchingTitle');
  dialog.innerHTML='<div class="dialog-head"><h2 id="transferMatchingTitle" tabindex="-1">Interne Transfers prüfen</h2><button type="button" class="icon-close" data-transfer="close" aria-label="Transferprüfung schließen">×</button></div><div class="wallet-history-body"><p class="small-help">Gleicher Betrag ist kein Nachweis. Wähle beide Bewegungen und prüfe ihre Belege. Mehrere Eingänge können einen Teiltransfer bilden. Gebühren, unterschiedliche Währungen und fehlende Belege werden nicht automatisch ausgeglichen.</p><label class="field"><span>Ausgang · Datum, Anbieter, Konto, Menge, Währung, Buchungs-ID</span><select data-transfer="out"></select></label><p class="small-help" data-transfer="out-summary"></p><fieldset class="dialog-group"><legend>Eingänge auf eigenen Konten · bis zu 12 auswählen</legend><div data-transfer="incoming"></div><button type="button" class="btn outline" data-transfer="incoming-more" hidden>Weitere Gegenbewegungen anzeigen</button></fieldset><p class="small-help" data-transfer="preview" role="status"></p><label class="field"><span>Geprüfter Beleg / Verwendungszweck</span><input data-transfer="reference" maxlength="180" placeholder="z. B. Überweisungsbeleg vom …"></label><label class="checkbox-line"><input type="checkbox" data-transfer="consent"><span>Ich habe die Belege geprüft. Ausgang und ausgewählte Eingänge gehören zu diesem Transfer zwischen meinen eigenen Konten.</span></label><p data-transfer="status" role="status" aria-live="polite"></p><details class="advanced-apis"><summary>Bestätigte Zuordnungen</summary><div data-transfer="confirmed"></div></details></div><div class="dialog-footer"><button type="button" class="btn primary" data-transfer="accept" disabled>Ausdrücklich intern zuordnen</button></div>';
  document.body.append(dialog);const close=()=>{if(running)return;dialog.close();trigger?.focus();};el('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  el('out').onchange=()=>{incomingLimit=200;showIncoming();};el('incoming-more').onclick=()=>{incomingLimit+=200;showIncoming(false);};el('incoming').onchange=()=>{el('consent').checked=false;updatePreview();};el('reference').oninput=updatePreview;el('consent').onchange=updatePreview;
  el('accept').onclick=()=>{const selection={...preview,reference:el('reference').value,confirmed:el('consent').checked};void save(m=>confirmTransferMatch(m,selection));};
  el('confirmed').onclick=e=>{const button=e.target.closest('[data-transfer-undo]');if(button&&confirm('Die Zuordnung aufheben und die ursprünglichen externen Geldflüsse wiederherstellen? Bestände bleiben unverändert.'))void save(m=>undoTransferMatch(m,button.dataset.transferUndo));};
 }
 return {open(button){if(!dialog)mount();trigger=button;refresh();el('status').textContent='';dialog.showModal();dialog.querySelector('h2').focus();}};
}
