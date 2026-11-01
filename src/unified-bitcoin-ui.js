import {readUnifiedBitcoinFiles,previewUnifiedBitcoin,confirmUnifiedBitcoin,undoUnifiedBitcoin} from './unified-bitcoin.js';
import {escapeHTML as esc,money} from './model.js';
/** Uses the existing wallet context and the existing PortfolioStorage commit boundary. */
export function createUnifiedBitcoinUI({host,getModel,getContext,commit,isBusy=()=>false,onBusy=()=>{}}){
 let input={receipts:[],operations:[]},plan=null,working=false,generation=0;
 host.innerHTML='<details><summary>Bittr + Ledger gemeinsam importieren</summary><p class="small-help">Kaufnachweise mit verifizierten Bitcoin-Ausgängen abgleichen und als Käufe buchen. Der gescannte BTC-Bestand wird nicht erhöht. Ledger-Gegenwerte sind keine Anschaffungskosten. Transfers bleiben ohne vollständigen Nachweis ungeklärt. Die aktuelle Restkostenbasis wird aus diesen Belegen allein nicht neu berechnet.</p><p class="small-help">Nach der Übernahme benötigen diese Daten und Backups eine aktuelle FolioLab-Version; ältere Versionen können sie nicht öffnen.</p><label class="field"><span>Bittr- und Ledger-Live-Dateien</span><input type="file" multiple accept=".csv,text/csv" data-unified="files"></label><p role="status" aria-live="polite" data-unified="status"></p><div data-unified="preview"></div><label class="field"><span><input type="checkbox" data-unified="funding"> Die Bittr-Käufe wurden außerhalb aller hier erfassten Konten bezahlt. Diese Finanzierung wurde noch nicht als Einzahlung erfasst.</span></label><label class="field" data-unified="scope-label" hidden><span><input type="checkbox" data-unified="scope"> Nur diese Bitcoin-Wallet übernehmen; andere Ledger-Bereiche und nicht unterstützte Vorgänge ausdrücklich auslassen.</span></label><button type="button" class="btn primary" data-unified="accept" disabled>Geprüfte Änderungen übernehmen</button><button type="button" class="btn light" data-unified="discard">Vorschau verwerfen</button></details>';
 const el=k=>host.querySelector('[data-unified="'+k+'"]'),status=t=>{el('status').textContent=t;};
 function enabled(){el('accept').disabled=working||isBusy()||!plan||plan.blocked>0||!el('funding').checked||(plan.excluded>0&&!el('scope').checked)||!plan.groups.some(g=>g.status==='new'||g.status==='existing')&&!plan.ledgerCount;}
 function render(){
  const {positionId,bitcoin}=getContext();host.hidden=!bitcoin;if(!bitcoin)return;
  plan=null;
  try{
   plan=previewUnifiedBitcoin(getModel(),input,positionId);
   const labels={new:'Neuer Kauf',existing:'Bereits gebucht – nur zusätzliche Belege',blocked:'Gesperrt – Identität oder Zuordnung prüfen',removed:'Zurückgenommen – Wiederimport gesperrt'};
   el('preview').innerHTML='<p>'+plan.newCount+' neue Käufe · '+money(Number(plan.fiatEUR))+' neue belegte Finanzierung · '+plan.ledgerCount+' passende Ledger-Beobachtungen · '+plan.excluded+' nicht zugeordnete Ledger-Beobachtungen</p><p class="small-help">Bestandsänderung: 0 BTC. '+plan.unknownIncoming+' weitere Blockchain-Eingänge behalten unbekannte Anschaffungskosten. Keine vollständige Rendite- oder Steuerabnahme.</p>'+plan.groups.slice(0,100).map(g=>'<details><summary>'+esc(g.receipts[0].timestamp.slice(0,10))+' · '+esc(g.netBTC)+' BTC · '+esc(labels[g.status])+'</summary><p>'+money(Number(g.fiatEUR))+' Ausgaben inklusive Servicegebühren · '+g.receipts.length+' Kaufbelege · '+g.events.length+' eigene verifizierte Ausgänge · '+g.ledgerRefs.length+' Ledger-Nachweise</p><p class="small-help">Bittr-Netzwerkabzug '+esc(g.receipts.map(r=>r.miningFeeBTC).join(' + '))+' BTC bereits in den Nettomengen enthalten. Keine zusätzliche Bestandsgebühr und keine Zuordnung der gesamten Batch-Mininggebühr.</p>'+(g.status==='existing'?'<button type="button" class="btn light" data-unified-undo="'+esc(g.id)+'">Kaufbuchung sicher zurücknehmen</button>':'')+'</details>').join('')+(plan.groups.length>100?'<p>Weitere Gruppen sind im gemeinsamen Plan enthalten; insgesamt '+plan.groups.length+'.</p>':'');
   el('scope-label').hidden=!plan.excluded;
   for(const b of host.querySelectorAll('[data-unified-undo]'))b.onclick=()=>apply(()=>undoUnifiedBitcoin(getModel(),b.dataset.unifiedUndo,{confirmed:true,baseline:plan.baseline}),'Kaufbuchung zurückgenommen. Belege und BTC-Bestand erhalten; Wiederimport gesperrt.');
  }catch(e){el('preview').textContent=e.message;}
  enabled();
 }
 async function apply(make,message){
  if(working||isBusy())return;working=true;onBusy(true);for(const e of host.querySelectorAll('button,input'))e.disabled=true;
  try{const draft=make();if(draft!==getModel())await commit(draft);input={receipts:[],operations:[]};el('funding').checked=false;el('scope').checked=false;render();status(message);}
  catch(e){status('Nicht gespeichert: '+e.message);}
  finally{working=false;onBusy(false);for(const e of host.querySelectorAll('button,input'))e.disabled=false;enabled();}
 }
 async function load(files){
  const selected=++generation,before=JSON.stringify(getModel());
  try{
   if(files.length>20||files.some(f=>f.size>2e6))throw Error('Höchstens 20 Dateien mit je 2 MB.');
   const parsed=readUnifiedBitcoinFiles(await Promise.all(files.map(f=>f.text())));
   if(selected!==generation)return;
   if(before!==JSON.stringify(getModel()))throw Error('Datenstand geändert. Dateien erneut auswählen.');
   input=parsed;el('funding').checked=false;el('scope').checked=false;render();status('Dateien erkannt und lokal geprüft. Noch nichts gespeichert. '+parsed.duplicateReceipts+' identische Kaufbelege ausgelassen.');
  }catch(e){input={receipts:[],operations:[]};plan=null;el('preview').textContent='';enabled();status('Keine Übernahme: '+e.message);}
 }
 el('files').onchange=async()=>{if(working||isBusy())return;await load([...el('files').files]);el('files').value='';};
 el('funding').onchange=enabled;el('scope').onchange=enabled;
 el('accept').onclick=()=>{const shown=plan;apply(()=>confirmUnifiedBitcoin(getModel(),input,shown.positionId,{baseline:shown.baseline,confirmed:true,externalFunding:el('funding').checked,bitcoinOnly:el('scope').checked}),'Käufe und zusätzliche Belege atomar gespeichert. BTC-Bestand unverändert.');};
 el('discard').onclick=()=>{++generation;input={receipts:[],operations:[]};el('funding').checked=false;el('scope').checked=false;render();status('Vorschau verworfen.');};
 return {syncBusy:enabled,refresh(){++generation;input={receipts:[],operations:[]};el('funding').checked=false;el('scope').checked=false;render();status('');},async loadFiles(files){host.querySelector('details').open=true;await load(files);}};
}
