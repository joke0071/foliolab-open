import {fetchBitcoinHistory} from './bitcoin-history.js';
import {fetchEthereumHistory} from './ethereum-history.js';
import {acceptHistory,checkpointHistory,historyPreview,invalidateHistory} from './wallet-history-state.js';
import {historyDays,rawQuantity} from './wallet-history-days.js';
import {replayWalletHistory} from './wallet-history-core.js';
import {CHART_PERIODS,chartPeriodDays} from './chart-periods.js';
import {escapeHTML as esc} from './model.js';
const cache=new Map(); // raw provider pages only; not portfolio state or backups
const supported=p=>p.wallet?.enabled&&(['btc','btc-hd'].includes(p.wallet.chain)||['evm','erc20'].includes(p.wallet.chain)&&Number(p.wallet.chainId||1)===1);
const link=(chain,id)=>chain==='btc'?'https://blockstream.info/tx/'+encodeURIComponent(id):chain==='eth'?'https://etherscan.io/tx/'+encodeURIComponent(id):'https://solscan.io/tx/'+encodeURIComponent(id);
export function createWalletHistoryUI({getModel,commit}){
 let dialog,selected,preview=null,running=false,controller=null,trigger=null,limit=100;
 const id=()=> 'wallet-history:'+selected.id;
 const el=name=>dialog.querySelector('[data-history="'+name+'"]');
 const setStatus=text=>{el('status').textContent=text;};
 const model=()=>getModel();
 const source=()=>selected.wallet.chain.startsWith('btc')?'blockstream.info':'eth.blockscout.com';
 const chain=()=>selected.wallet.chain.startsWith('btc')?'btc':'eth';
 function busy(value){running=value;for(const field of dialog.querySelectorAll('select,input'))field.disabled=value;el('start').disabled=value;el('accept').disabled=value||!preview;el('discard').disabled=value;el('cancel').disabled=!value;el('resume').disabled=value||!cache.has(id())&&!model().walletHistory?.pending.some(p=>p.id===id());}
 function cutoff(){const days=chartPeriodDays('wealth',el('period').value);return el('from').value||(days?new Date(Date.now()-(days-1)*864e5).toISOString().slice(0,10):'0000-01-01');}
 function show(session,isPreview=false){
  el('output').replaceChildren();if(!session){el('accept').hidden=true;return;}
  const replay=replayWalletHistory({events:session.events,streams:session.streams});
  const rows=historyDays(session,{from:cutoff()});const events=replay.events.filter(e=>!e.timestamp||e.timestamp.slice(0,10)>=cutoff());
  const known=replay.balances.every(b=>b.coverage==='verified');
  el('output').innerHTML='<h3>'+ (isPreview?'Vorschau – noch nicht übernommen':'Gespeicherte Historie')+'</h3><p>'+esc(known?'Bestände im belegten Umfang verifiziert.':'Teilweise / unbekannt: Bestände sind nicht vollständig belegt.')+'</p><p class="small-help">Stand: '+esc(session.acceptedAt)+' · '+esc(session.streams.map(s=>s.coverage.source).join(', '))+'</p>'+
   (session.issues.length?'<details><summary>Qualität und Lücken ('+session.issues.length+')</summary><ul>'+session.issues.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul></details>':'')+
   '<h4>Tagesbestände (UTC)</h4><p class="small-help">Nur durch Ereignisse belegte Tage; Lücken werden nicht mit Null aufgefüllt. Ohne Kurs bleiben Mengen sichtbar.</p><div class="wallet-history-table"><table><thead><tr><th>Tag</th><th>Asset</th><th>Bestand</th><th>Qualität</th></tr></thead><tbody>'+rows.slice(-365).map(r=>'<tr><td>'+esc(r.date)+'</td><td>'+esc(r.contract||r.mint||r.assetId)+'</td><td>'+esc(rawQuantity(r.quantityBaseUnits,r.decimals))+'</td><td>'+esc(r.coverage)+'</td></tr>').join('')+'</tbody></table></div>'+(rows.length>365?'<p>Letzte 365 Asset-Tage angezeigt; Ereignisse bleiben vollständig gespeichert.</p>':'')+
   '<h4>Ereignisse ('+events.length+')</h4><ol class="wallet-history-events">'+events.slice(0,limit).map(e=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(link(session.chain,e.txid))+'">'+esc(e.timestamp?.slice(0,10)||'Unbestätigt')+' · '+esc(e.type)+'</a><span>'+esc(rawQuantity(e.quantityBaseUnits,e.decimals))+'</span><small>'+esc(e.contract||e.mint||e.assetId)+' · '+esc(e.source||'Quelle unbekannt')+' · '+esc(e.coverage)+'</small></li>').join('')+'</ol>'+(events.length>limit?'<button type="button" class="btn outline" data-history="more">Weitere Ereignisse</button>':'');
  el('output').querySelector('[data-history="more"]')?.addEventListener('click',()=>{limit+=100;show(session,isPreview);});
  el('accept').hidden=!isPreview;busy(running);
 }
 function stored(){return model().walletHistory?.sessions.find(s=>s.id===id());}
 async function pending(){await commit(checkpointHistory(model(),{id:id(),chain:chain(),walletKey:selected.id,provider:source(),filter:el('period').value+':'+el('from').value,tip:null,status:'re-fetch-needed',updatedAt:new Date().toISOString()}));}
 async function run(resume=false){
  preview=null;el('accept').hidden=true;controller=new AbortController();busy(true);setStatus('Historie wird abgerufen. Es werden keine Wallet-Signaturen angefordert.');
  const key=id(),p=selected,w=p.wallet;
  try{
   const onCheckpoint=state=>{cache.set(key,{state,identity:JSON.stringify([w,model().settings.solanaRpc])});if(cache.size>3)cache.delete(cache.keys().next().value);const count=state.transactions?.length??state.jobs?.reduce((n,j)=>n+j.items.length,0)??0;setStatus(count+' Datensätze abgerufen; Blockchain-Stand wird geprüft.');};
   const entry=cache.get(key),compatible=entry?.identity===JSON.stringify([w,model().settings.solanaRpc]);
   if(resume&&!compatible)setStatus('Temporäre Daten fehlen oder Quelle geändert: sicherer erneuter Abruf.');
   let result;
   if(chain()==='btc')result=await fetchBitcoinHistory({wallets:[{chain:w.chain,address:w.address,addressType:w.addressType,accountId:p.accountId}],signal:controller.signal,onCheckpoint,resume:resume&&compatible?entry.state:null});
   else{
    const positions=model().positions.filter(x=>x.accountId===p.accountId&&x.wallet?.enabled&&x.wallet.address.toLowerCase()===w.address.toLowerCase()&&Number(x.wallet.chainId||1)===1&&x.wallet.chain==='erc20');
    const tokens=[...new Map(positions.map(x=>[x.wallet.contract.toLowerCase(),{contract:x.wallet.contract,decimals:Number(x.wallet.decimals),balanceModel:'unknown'}])).values()];
    result=await fetchEthereumHistory({wallets:[{accountId:p.accountId,address:w.address}],tokens,settings:model().settings,signal:controller.signal,onCheckpoint,resume:resume&&compatible?entry.state:null});
   }
   if(result.resume){cache.set(key,{state:result.resume,identity:JSON.stringify([w,model().settings.solanaRpc])});await pending();setStatus((result.issues||[]).includes('aborted')?'Abgebrochen. Fortsetzen ist möglich; Cacheverlust erfordert erneuten Abruf.':'Abruf unvollständig: '+(result.issues||[]).join(', ')+'. Fortsetzen oder neu beginnen.');
    if(result.issues?.some(x=>/reorg|tip-changed|conflict/.test(x))&&stored())await commit(invalidateHistory(model(),key,'observed-chain-conflict'));
    show(stored());return;
   }
   preview=historyPreview(result,{id:key,chain:chain(),walletKey:p.id});cache.delete(key);limit=100;show(preview,true);setStatus('Vorschau bereit. Erst „Historie übernehmen“ speichert diese Daten dauerhaft.');
  }catch(e){setStatus('Keine Übernahme: '+String(e.message||e));}
  finally{busy(false);}
 }
 function choose(positionId){selected=model().positions.find(p=>p.id===positionId&&supported(p));preview=null;limit=100;if(!selected)return;el('wallet').value=selected.id;show(stored());busy(false);setStatus('Quelle: '+source()+'. '+(model().walletHistory?.pending.some(p=>p.id===id())?'Vorheriger Abruf kann neu aufgenommen werden.':'Zum Starten Historie abrufen.'));}
 function mount(){
  dialog=document.createElement('dialog');dialog.className='edit-dialog wallet-history-dialog';dialog.id='walletHistoryDialog';dialog.setAttribute('aria-labelledby','walletHistoryTitle');
  dialog.innerHTML='<div class="dialog-head"><h2 id="walletHistoryTitle" tabindex="-1">Wallet-Historie</h2><button type="button" class="icon-close" data-history="close" aria-label="Historie schließen">×</button></div><div class="wallet-history-body"><p>Öffentliche Blockchain-Daten werden beim Indexer abgefragt. Ein xpub legt zusammengehörige Adressen offen. Keine Seeds, privaten Schlüssel oder Signaturen eingeben. Eigene Transfers sind keine Einzahlungen.</p><div class="wallet-history-controls"><label class="field"><span>Wallet</span><select data-history="wallet"></select></label><label class="field"><span>Anzeigezeitraum</span><select data-history="period">'+CHART_PERIODS.wealth.map(p=>'<option value="'+p.value+'"'+(p.value==='all'?' selected':'')+'>'+p.label+'</option>').join('')+'</select></label><label class="field"><span>Optional anzeigen ab</span><input data-history="from" type="date"></label></div><p class="small-help">Für belegte Anfangsbestände kann der Abruf den Gesamtverlauf benötigen. Die Auswahl begrenzt die Anzeige.</p><div class="wallet-history-controls"><button class="btn primary" type="button" data-history="start">Historie abrufen</button><button class="btn outline" type="button" data-history="resume">Fortsetzen</button><button class="btn light" type="button" data-history="cancel" disabled>Abruf abbrechen</button></div><p role="status" aria-live="polite" data-history="status"></p><section data-history="output" aria-label="Historienvorschau"></section></div><div class="dialog-footer"><button type="button" class="btn light" data-history="discard">Vorschau verwerfen</button><button type="button" class="btn primary" data-history="accept" hidden>Historie übernehmen</button></div>';
  document.body.append(dialog);
  const close=()=>{if(running){controller.abort();return;}preview=null;dialog.close();if(trigger?.isConnected)trigger.focus();else [...document.querySelectorAll('[data-action="wallet-history"]')].find(b=>b.dataset.id===selected?.id)?.focus();};el('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  el('wallet').onchange=()=>choose(el('wallet').value);for(const field of ['period','from'])el(field).onchange=()=>show(preview||stored(),Boolean(preview));
  el('start').onclick=()=>run(false);el('resume').onclick=()=>run(true);el('cancel').onclick=()=>controller?.abort();
  el('discard').onclick=()=>{preview=null;show(stored());setStatus('Vorschau verworfen. Gespeicherte Historie bleibt unverändert.');};
  el('accept').onclick=async()=>{if(!preview||running)return;busy(true);try{await commit(acceptHistory(model(),preview));preview=null;show(stored());setStatus('Historie dauerhaft gespeichert. Finanzbuchungen und Stichtage bleiben unverändert.');}catch(e){setStatus('Nicht gespeichert: '+e.message);}finally{busy(false);}};
 }
 return {open(positionId,button){if(!dialog)mount();trigger=button;el('wallet').innerHTML=model().positions.filter(supported).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');choose(positionId);if(!selected)return;dialog.showModal();dialog.querySelector('h2').focus();}};
}
