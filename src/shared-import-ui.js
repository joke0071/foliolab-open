import {escapeHTML as esc} from './model.js';
import {readSharedImportFiles,previewSharedImport,confirmSharedImport} from './shared-import.js';
import {createKrakenImportUI} from './kraken-import-ui.js';
import {createBitpandaImportUI} from './bitpanda-import-ui.js';
import {createSharedFlatexUI} from './shared-flatex-ui.js';
/** Entire session is disposable; the caller alone owns the one canonical save. */
export function createSharedImportUI({host,getModel,assertCurrent,downloadBackup,onReady,isActive=()=>host.isConnected}){
 let sources=null,kraken=null,bitpanda=null,flatex=null,plan=null,backupKey=null,generation=0,checking=false,detailLimit=50;
 host.innerHTML='<p class="dialog-intro">Originalexporte von Flatex AT, Bittr, Bitpanda, Kraken und Ledger Live gemeinsam prüfen. Noch nichts wird gespeichert. Konten, Anfangsbestände und Gegenbelege ausdrücklich zuordnen; danach den gesamten Entwurf einmal übernehmen.</p><label class="field"><span>Originaldateien (höchstens 20, je 2 MB, zusammen 5.000 Zeilen)</span><input type="file" multiple accept=".csv,text/csv,text/plain" data-shared="files"></label><p data-shared="files-status" role="status" aria-live="polite"></p><div data-shared="sources"></div><section data-shared="bitcoin" hidden></section><section data-shared="kraken" hidden></section><section data-shared="bitpanda" hidden></section><section data-shared="flatex" hidden></section><div data-shared="final" hidden><button type="button" class="btn outline" data-shared="simulate">Gesamten Import prüfen</button><p data-shared="status" role="status" aria-live="polite">Quellen zuordnen und prüfen.</p><div data-shared="preview"></div><button type="button" class="btn outline" data-shared="backup" disabled>Backup vor dem gesamten Import herunterladen</button><label class="selection-check"><input type="checkbox" data-shared="approve" disabled> Backup sicher abgelegt. Den gesamten gezeigten Import einschließlich Mengen, Geldbewegungen, Gebühren und ausdrücklich offener Restbereiche einmal übernehmen.</label></div>';
 const el=k=>host.querySelector('[data-shared="'+k+'"]');
 function invalidate(){plan=null;backupKey=null;el('approve').checked=false;el('approve').disabled=true;el('backup').disabled=true;el('preview').innerHTML='';el('status').textContent='Auswahl geändert. Gesamten Import erneut prüfen.';onReady(false);}
 function revokeOthers(provider){if(provider!=='kraken')kraken?.revokeApproval();if(provider!=='bitpanda')bitpanda?.revokeApproval();}
 function choices(){
  const c={};
  if(sources.files.some(f=>['bittr','ledger'].includes(f.kind)))c.bitcoin={positionId:el('bitcoin').querySelector('[data-shared-btc="wallet"]').value,externalFunding:el('bitcoin').querySelector('[data-shared-btc="funding"]').checked,bitcoinOnly:el('bitcoin').querySelector('[data-shared-btc="partial"]').checked,confirmed:true};
  if(kraken){c.kraken=kraken.approved();if(!c.kraken)throw Error('Kraken-Auswahl zuerst prüfen und bestätigen.');}
  if(bitpanda){c.bitpanda=bitpanda.approved();if(!c.bitpanda)throw Error('Bitpanda-Auswahl zuerst prüfen und bestätigen.');}
  if(flatex)c.flatex=flatex.choices();
  return c;
 }
 async function load(){
  const token=++generation,baseline=JSON.stringify(getModel()),files=[...el('files').files];invalidate();sources=null;kraken=null;bitpanda=null;flatex=null;el('sources').innerHTML='';el('final').hidden=true;
  for(const k of ['bitcoin','kraken','bitpanda','flatex']){el(k).innerHTML='';el(k).hidden=true;}
  el('files-status').textContent='Dateien werden lokal geprüft …';
  try{
   if(!files.length){el('files-status').textContent='Originaldateien auswählen.';return;}
   if(files.length>20||files.some(f=>f.size>2e6))throw Error('Höchstens 20 Dateien mit je 2 MB.');
   const inputs=await Promise.all(files.map(async f=>({name:f.name,bytes:new Uint8Array(await f.arrayBuffer())})));
   if(token!==generation||!isActive())return;
   if(baseline!==JSON.stringify(getModel()))throw Error('Portfolio geändert. Dateien erneut auswählen.');
   sources=readSharedImportFiles(inputs);
   el('sources').innerHTML='<h3>Gemeinsame Quellenauswahl</h3><ul>'+sources.files.map(f=>'<li>'+esc(f.name)+' · '+esc({flatex:'Flatex AT',bittr:'Bittr',ledger:'Ledger Live',kraken:'Kraken',bitpanda:'Bitpanda'}[f.kind])+' · '+f.rows+' Quellzeilen</li>').join('')+'</ul><p class="small-help">Doppelte Dateien und überlappende Quellen werden durch die bestehenden Anbieterprüfungen abgeglichen. Interne Transfers brauchen Gegenbelege. Fehlende Ledger-Wallets und Staking-Positionen bleiben unbekannt und werden niemals auf null gesetzt.</p>';
   if(sources.files.some(f=>['bittr','ledger'].includes(f.kind))){
    el('bitcoin').hidden=false;el('bitcoin').innerHTML='<details open><summary>Bittr / Ledger Live · Bitcoin</summary><label class="field"><span>Eigene verifizierte Bitcoin-Wallet</span><select data-shared-btc="wallet"><option value="">Ausdrücklich zuordnen</option>'+getModel().positions.filter(p=>p.wallet?.enabled&&['btc','btc-hd'].includes(p.wallet.chain)).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label><p class="small-help">'+(sources.bitcoin.duplicateReceipts||0)+' doppelte Bittr-Kaufbelege erkannt. Nur bereits übernommene verifizierte eigene Blockchain-Ausgänge werden verknüpft. Der beobachtete Walletbestand wird nicht erhöht. Ledger-Gegenwerte sind keine Einstandswerte.</p><label class="selection-check"><input type="checkbox" data-shared-btc="funding"> Bittr-Käufe außerhalb aller hier erfassten Konten bezahlt; diese Finanzierung noch nicht als Einzahlung erfasst.</label><label class="selection-check"><input type="checkbox" data-shared-btc="partial"> Nur diese Bitcoin-Wallet verknüpfen. Andere Ledger-Bereiche und nicht belegte Transfers ausdrücklich offen lassen.</label></details>';
   }
   if(sources.kraken.length){el('kraken').hidden=false;kraken=createKrakenImportUI({host:el('kraken'),inputs:sources.kraken,getModel,onApproval:invalidate,allowUnchanged:true});}
   if(sources.bitpanda.length){el('bitpanda').hidden=false;bitpanda=createBitpandaImportUI({host:el('bitpanda'),inputs:sources.bitpanda,getModel,onApproval:invalidate,allowUnchanged:true});}
   if(sources.flatex.length){el('flatex').hidden=false;flatex=createSharedFlatexUI({host:el('flatex'),sources,getModel,onChange:()=>{invalidate();revokeOthers('flatex');}});}
   // Selective economic withdrawals keep their existing dedicated review flow.
   for(const k of ['kraken','bitpanda'])if(el(k).querySelector('[data-'+k+'="operation"]'))for(const option of el(k).querySelectorAll('[data-'+k+'="operation"] option[value="withdraw"]'))option.remove();
   el('final').hidden=false;el('files-status').textContent=sources.files.length+' Dateien erkannt. Noch nichts gespeichert.';
  }catch(error){if(token===generation){sources=null;el('files-status').textContent='Keine Übernahme: '+error.message;}}
 }
 function renderPreview(){
  el('preview').innerHTML='<h3>Gesamter geprüfter Entwurf</h3>'+plan.reports.map(r=>'<details open><summary>'+esc(r.provider)+' · '+r.ready+' neu · '+r.duplicates+' bereits vorhanden · '+r.excluded+' ausdrücklich offen</summary><p class="small-help">'+esc(r.note)+'</p><ul>'+r.details.slice(0,detailLimit).map(d=>'<li>'+esc(({new:'Neuer Kauf',ready:'Neue Buchung',existing:'Bereits vorhanden',duplicate:'Bereits vorhanden',removed:'Zurückgenommen',blocked:'Gesperrt'}[d.status]||d.status)+' · '+d.text)+'</li>').join('')+'</ul>'+(r.details.length>detailLimit?'<p>'+r.details.length+' Gruppen insgesamt; '+detailLimit+' angezeigt.</p>':'')+'</details>').join('')+'<h3>Gemeinsame Bestandswirkung</h3>'+(plan.impacts.length?plan.impacts.map(p=>'<p>'+esc(p.name+' · '+p.before+' → '+p.after+' '+p.symbol+' · Änderung '+p.delta)+'</p>').join(''):'<p>Beobachtete Bestände unverändert. Neue Quellen- und Journalbelege siehe oben.</p>')+'<p class="small-help">Keine erfundenen Einstandswerte und keine Ausgleichsbuchungen. Unbekannte Kosten, fehlende Wallets und Staking bleiben ungeklärt. Quelle, Beobachtung, Kauf, Transfer und Gebühr werden getrennt erhalten.</p>'+(plan.reports.some(r=>r.details.length>detailLimit)?'<button type="button" class="btn outline" data-shared="more">Weitere Gruppen anzeigen</button>':'');
  if(el('more'))el('more').onclick=()=>{detailLimit+=50;renderPreview();};
 }
 el('files').onchange=load;
 host.addEventListener('input',event=>{if(event.target.matches('[data-shared-start],[data-shared-end]')||event.target.closest('[data-shared="kraken"],[data-shared="bitpanda"],[data-shared="bitcoin"]'))invalidate();});
 host.addEventListener('change',event=>{const k=event.target.closest('[data-shared="kraken"],[data-shared="bitpanda"],[data-shared="bitcoin"]')?.dataset.shared;if(k&&!event.target.matches('[data-kraken="approve"],[data-bitpanda="approve"]')){invalidate();revokeOthers(k);}});
 el('simulate').onclick=async()=>{
  if(checking||!sources)return;checking=true;invalidate();const token=generation;
  try{await assertCurrent();if(token!==generation||!isActive())return;plan=previewSharedImport(getModel(),sources,choices());renderPreview();el('status').textContent=plan.changed?'Gesamter Import geprüft. Noch nichts gespeichert. Backup herunterladen und ausdrücklich bestätigen.':'Alle gewählten Quellen bereits vorhanden. Keine neue Wirkung und kein Speicher-Commit.';el('backup').disabled=!plan.changed;}
  catch(error){invalidate();el('status').textContent='Keine Übernahme: '+error.message;}
  finally{checking=false;}
 };
 el('backup').onclick=async()=>{
  const shown=plan,token=generation;backupKey=null;el('approve').checked=false;el('approve').disabled=true;onReady(false);
  try{await assertCurrent();if(!shown||shown!==plan||token!==generation||!isActive()||shown.baseline!==JSON.stringify(getModel()))throw Error('Vorschau geändert. Erneut prüfen.');await downloadBackup();if(shown!==plan||token!==generation||!isActive()||shown.baseline!==JSON.stringify(getModel()))throw Error('Auswahl oder Datenstand geändert.');backupKey=shown.draftKey;el('approve').disabled=false;el('status').textContent='Backup-Download gestartet. Sicher ablegen und gesamten Import bestätigen.';}
  catch(error){invalidate();el('status').textContent=error.message;}
 };
 el('approve').onchange=()=>onReady(Boolean(el('approve').checked&&plan?.changed&&backupKey===plan.draftKey&&plan.baseline===JSON.stringify(getModel())));
 onReady(false);
 return {invalidate,async candidate(){const shown=plan,token=generation,c=choices();if(!el('approve').checked||!shown||backupKey!==shown.draftKey)throw Error('Gesamten Import und Backup zuerst ausdrücklich bestätigen.');await assertCurrent();if(shown!==plan||token!==generation||!isActive())throw Error('Auswahl geändert. Erneut prüfen.');return confirmSharedImport(getModel(),sources,c,shown,{confirmed:el('approve').checked,backupConfirmed:backupKey===shown.draftKey});}};
}
