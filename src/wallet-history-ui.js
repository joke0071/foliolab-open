import {bitcoinHistoryScope} from './wallet-history-state.js';
import {createUnifiedBitcoinUI} from './unified-bitcoin-ui.js';
import {walletStreamMatches} from './historical-position-value.js';
import {createPurchaseEvidenceUI} from './purchase-evidence-ui.js';
import {calculateHistoryDays} from './wallet-history-calculation.js';
import {loadHistoryQuotes,valueHistoryRows,historyChartSeries,historyAssetKey} from './wallet-history-valuation.js';
import {drawInteractiveChart,attachChartInteractions} from './dashboard-ui.js';
import {fetchSolanaHistory} from './solana-history.js';
import {fetchBitcoinHistory} from './bitcoin-history.js';
import {fetchEthereumHistory} from './ethereum-history.js';
import {acceptHistory,checkpointHistory,clearHistoryCheckpoint,historyPreview,invalidateHistory} from './wallet-history-state.js';
import {historyDays,rawQuantity} from './wallet-history-days.js';
import {replayWalletHistory} from './wallet-history-core.js';
import {CHART_PERIODS,chartPeriodDays} from './chart-periods.js';
import {escapeHTML as esc} from './model.js';
const cache=new Map(); // raw provider pages only; not portfolio state or backups
const supported=p=>p.wallet?.enabled&&(['btc','btc-hd','sol','spl'].includes(p.wallet.chain)||['evm','erc20'].includes(p.wallet.chain)&&Number(p.wallet.chainId||1)===1);
const link=(chain,id)=>chain==='btc'?'https://blockstream.info/tx/'+encodeURIComponent(id):chain==='eth'?'https://etherscan.io/tx/'+encodeURIComponent(id):'https://solscan.io/tx/'+encodeURIComponent(id);
function issueLabel(code){
 const recovery={'provider-cursor-format-changed':'Der Explorer hat einen nicht unterstützten Seitenzeiger geliefert.','invalid-cursor':'Der temporäre Abrufstand ist nicht mehr verwendbar.','nonadvancing-cursor':'Der Explorer wiederholt denselben Seitenzeiger.','cursor-provider-changed':'Bereits gelesene Explorer-Seiten haben sich verändert.','cursor-scope-mismatch':'Die Wallet-Zuordnung des Abrufstands passt nicht mehr.','page-limit':'Das Abrufbudget für diesen Schritt ist erreicht.','network':'Die Datenquelle ist vorübergehend nicht erreichbar.','timeout':'Die Datenquelle hat nicht rechtzeitig geantwortet.','aborted':'Der Abruf wurde abgebrochen.'};
 if(recovery[code])return recovery[code];
 const labels={'closed-token-accounts-may-be-missing':'Früher geschlossene Tokenkonten können fehlen.','token-account-open-close-unknown':'Eröffnung oder Schließung eines Tokenkontos ist nicht vollständig belegt.','unknown-token-owner':'Ein Tokenkonto kann keiner eigenen Wallet sicher zugeordnet werden.','token-program-or-extension-unknown':'Token-2022 oder unbekannte Erweiterungen: vollständiger Verlauf nicht belegt.','archive-gap':'Das Archiv liefert nicht alle früheren Transaktionen.','native-protocol-credits-uncovered':'Bestimmte ETH-Gutschriften, etwa Beacon-Auszahlungen, sind nicht vollständig abgedeckt.','missing-opening':'Ein belegter Anfangsbestand fehlt.','unsupported-token-model':'Für Rebase-, Staking- oder komplexe Token ist kein vollständiger Mengenverlauf belegt.','fee-allocation-unknown':'Die Gebühr einer gemeinsam finanzierten Transaktion lässt sich nicht eindeutig zuordnen.','sol-reconciliation-partial':'Solana-Bestand ist nicht vollständig abgeglichen.','reconciliation-mismatch':'Rekonstruierter und abgeglichener Blockchain-Bestand weichen ab.','history-count-mismatch':'Der Provider meldet mehr Transaktionen als im Verlauf vorliegen.','missing-prevout':'Angaben zu früheren Bitcoin-Ausgängen fehlen.'};
 return labels[code]??(/reorg|tip-changed|conflict/.test(code)?'Blockchain-Stand oder Quelldaten widersprüchlich. Neuer Abruf erforderlich.':code==='http-403'?'Datenquelle verweigert den Zugriff. Quelle und Konfiguration prüfen.':code==='http-429'?'Ratenlimit erreicht. Bitte später erneut versuchen.':'Ein erforderlicher Nachweis fehlt; der Bestand bleibt unbekannt oder teilweise belegt.');
}
export function createWalletHistoryUI({getModel,commit}){
 let evidenceUI,unifiedUI;
 let dialog,selected,preview=null,running=false,controller=null,trigger=null,limit=100,calculating=false,calculation=0,calculationController=null,restartNeeded=false;
 const id=()=> 'wallet-history:'+selected.id;
 const el=name=>dialog.querySelector('[data-history="'+name+'"]');
 const setStatus=text=>{el('status').textContent=text;};
 const model=()=>getModel();
 const source=()=>selected.wallet.chain.startsWith('btc')?'blockstream.info':['sol','spl'].includes(selected.wallet.chain)?new URL(model().settings.solanaRpc).hostname:'eth.blockscout.com';
 const chain=()=>selected.wallet.chain.startsWith('btc')?'btc':['sol','spl'].includes(selected.wallet.chain)?'sol':'eth';
 function busy(value){running=value;const blocked=value||calculating;for(const field of dialog.querySelectorAll('select,input'))field.disabled=blocked;el('start').disabled=blocked;el('accept').disabled=blocked||!preview;el('discard').disabled=blocked;el('cancel').disabled=!blocked;
  const entry=cache.get(id()),pending=model().walletHistory?.pending.some(p=>p.id===id()),eth=chain()==='eth';
  const compatible=entry?.identity===JSON.stringify([selected.wallet,model().settings.solanaRpc]);
  el('resume').disabled=blocked||(eth?!(compatible&&Array.isArray(entry.state?.jobs)&&entry.state.jobs.length):!entry&&!pending);
  unifiedUI?.syncBusy();
  el('start').textContent=eth&&(restartNeeded||entry||pending||stored())?'Neu abrufen':'Historie abrufen';
 }
 function cutoff(){const days=chartPeriodDays('wealth',el('period').value);return el('from').value||(days?new Date(Date.now()-(days-1)*864e5).toISOString().slice(0,10):'0000-01-01');}
 async function show(session,isPreview=false){
  const generation=++calculation;calculationController?.abort();calculationController=new AbortController();
  el('output').replaceChildren();if(!session){calculating=false;busy(running);el('accept').hidden=true;return;}
  const replay=replayWalletHistory({events:session.events,streams:session.streams});
  calculating=true;busy(running);el('accept').hidden=true;el('output').textContent='Tagesbestände werden lokal berechnet …';
  let dayRows=[],calculationError='';
  try{dayRows=await calculateHistoryDays(session,{from:cutoff(),limit:6500},{signal:calculationController.signal});}
  catch(e){if(generation!==calculation)return false;if(e.name==='AbortError'){calculating=false;preview=null;busy(running);el('output').textContent='Berechnung abgebrochen. Gespeicherte Daten bleiben unverändert.';return false;}calculationError=e.message;}
  if(generation!==calculation)return;calculating=false;busy(running);
  const rows=valueHistoryRows(dayRows,session.quotes??[]);const events=replay.events.filter(e=>!e.timestamp||e.timestamp.slice(0,10)>=cutoff());
  const known=replay.balances.every(b=>b.coverage==='verified');
  el('output').innerHTML=(calculationError?'<p role="alert">'+esc(calculationError)+' Mengen und Werte wurden nicht als Null ergänzt.</p>':'')+'<h3>'+ (isPreview?'Vorschau – noch nicht übernommen':'Gespeicherte Historie')+'</h3><p>'+esc(known?'Bestände im belegten Umfang verifiziert.':'Teilweise / unbekannt: Bestände sind nicht vollständig belegt.')+'</p><p class="small-help">Stand: '+esc(session.acceptedAt)+' · '+esc(session.streams.map(s=>s.coverage.source).join(', '))+'</p>'+
   (session.issues.length?'<details><summary>Qualität und Lücken ('+session.issues.length+')</summary><ul>'+session.issues.map(i=>'<li title="'+esc(i)+'">'+esc(issueLabel(i))+'</li>').join('')+'</ul></details>':'')+
   '<details data-history="records"><summary>Bestand &amp; Transaktionen</summary><h4>Tagesbestände (UTC)</h4><p class="small-help">Tagesbestände im belegten Zeitraum; vor dem ersten und nach dem letzten Nachweis wird nicht extrapoliert. Unbelegte Bestände bleiben unbekannt. Ohne Kurs bleiben Mengen sichtbar. Die Tabelle zeigt bis zu 365 UTC-Tage; das Diagramm nutzt verfügbare belegte Tage bis zur Berechnungsgrenze; Ereignisse bleiben vollständig gespeichert.</p><div class="wallet-history-table"><table><thead><tr><th>Tag</th><th>Asset</th><th>Bestand</th><th>Qualität</th><th>EUR</th></tr></thead><tbody>'+rows.slice(-365).map(r=>'<tr><td>'+esc(r.date)+'</td><td>'+esc(r.contract||r.mint||r.assetId)+'</td><td>'+esc(rawQuantity(r.quantityBaseUnits,r.decimals))+'</td><td>'+esc(r.coverage)+'</td><td>'+esc(r.eurExact===null?(r.valueStatus==='missing quote'?'Kurs fehlt':'Unbekannt'):r.eurExact+' EUR (Schätzwert)')+'</td></tr>').join('')+'</tbody></table></div>'+(rows.length>365?'<p>Letzte 365 Asset-Tage angezeigt; Ereignisse bleiben vollständig gespeichert.</p>':'')+
   '<h4>Ereignisse ('+events.length+')</h4><ol class="wallet-history-events">'+events.slice(0,limit).map(e=>'<li><a target="_blank" rel="noopener noreferrer" href="'+esc(link(session.chain,e.txid))+'">'+esc(e.timestamp?.slice(0,10)||'Unbestätigt')+' · '+esc(e.type)+'</a><span>'+esc(rawQuantity(e.quantityBaseUnits,e.decimals))+'</span><small>'+esc(e.contract||e.mint||e.assetId)+' · '+esc(e.source||'Quelle unbekannt')+' · '+esc(e.coverage)+'</small></li>').join('')+'</ol>'+(events.length>limit?'<button type="button" class="btn outline" data-history="more">Weitere Ereignisse</button>':'')+'</details>';
  const scoped=rows.filter(r=>walletStreamMatches(r,selected)),view=el('view').value;
  const values=scoped.map(r=>{const q=(session.quotes||[]).find(q=>q.date===r.date&&historyAssetKey(q)===historyAssetKey(r));const total=view==='balances'?(r.quantityBaseUnits===null?null:rawQuantity(r.quantityBaseUnits,r.decimals)):view==='price'?q?.priceExact??null:r.eurExact;return {...r,plotted:total};});
  const series=values.filter(r=>r.plotted!==null).map((r,i,a)=>({date:r.date,totalEURExact:r.plotted,detail:'UTC-Tagesende · '+r.coverage+' · '+(r.quoteSource||'Kursquelle siehe Nachweise'),breakBefore:i>0&&(Date.parse(r.date)-Date.parse(a[i-1].date)!==864e5||values.indexOf(r)!==values.indexOf(a[i-1])+1)}));
  const quotes=document.createElement('section');quotes.innerHTML='<h4>'+({eur:'Historischer Positionswert (€)',price:'Historischer Kurs (€)',balances:'Historischer Bestand'}[view]||'Historie')+'</h4><p class="small-help">Nur datierte EUR-Kurse und belegte Bestände. Schätzwerte sind keine Rendite, keine Portfolio-Stichtage und kein Steuerergebnis. Fehlende Tage werden nicht verbunden.</p><label class="field"><span><input type="checkbox" data-history="bind-csv"> Vorhandene CSV-Kurse gehören genau zu diesem Asset bzw. dieser Contract-/Mint-Adresse.</span></label><button type="button" class="btn outline" data-history="quotes">EUR-Kurse laden</button><div data-history="eur-chart"></div>';
  el('output').prepend(quotes);quotes.hidden=view==='events';if(view==='events')el('output').querySelector('[data-history="records"]').open=true;
  if(series.length>=2){quotes.querySelector('[data-history="eur-chart"]').innerHTML=drawInteractiveChart(series,{money:view==='balances'?String:n=>Number(n).toLocaleString('de-AT',{style:'currency',currency:'EUR'}),esc,dateLabel:d=>d,disjoint:true});quotes.querySelector('.chart-plot')?.setAttribute('aria-label','Historischer Wallet-Wert in EUR (Schätzung). Pfeiltasten zeigen Datenpunkte.');attachChartInteractions(quotes);}
  else quotes.querySelector('[data-history="eur-chart"]').textContent='Kein lückenlos belegtes EUR-Diagramm verfügbar. Einzelwerte stehen in der Tabelle.';
  quotes.querySelector('[data-history="quotes"]').onclick=async()=>{
   if(running)return;controller=new AbortController();const binding=quotes.querySelector('[data-history="bind-csv"]').checked;busy(true);setStatus('Datierte EUR-Kurse werden geprüft.');
   try{const loaded=await loadHistoryQuotes(session,selected,model(),{confirmLocal:binding,signal:controller.signal});if(controller.signal.aborted)throw Error('Kursvorschau abgebrochen.');preview={...session,quotes:loaded,acceptedAt:new Date().toISOString()};if(await show(preview,true))setStatus('EUR-Vorschau bereit. Erst Übernehmen speichert Kurse und Zuordnung.');else setStatus('Berechnung abgebrochen.');}catch(e){setStatus('EUR-Wert bleibt unbekannt: '+e.message);}finally{busy(false);}
  };
  el('output').querySelector('[data-history="more"]')?.addEventListener('click',()=>{limit+=100;show(session,isPreview);});
  el('accept').hidden=!isPreview;busy(running);return true;
 }
 function stored(){return model().walletHistory?.sessions.find(s=>s.id===id());}
 async function pending(){const cached=cache.get(id()),scope=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(cached?.identity??JSON.stringify(selected.wallet))))).map(n=>n.toString(16).padStart(2,'0')).join('');await commit(checkpointHistory(model(),{id:id(),chain:chain(),walletKey:selected.id,provider:source(),filter:el('period').value+':'+el('from').value,tip:cached?.state?.tip?.hash??cached?.state?.tip?.blockhash??null,scope,status:'re-fetch-needed',updatedAt:new Date().toISOString()}));}
 async function run(resume=false){
  preview=null;restartNeeded=false;el('accept').hidden=true;controller=new AbortController();busy(true);setStatus('Historie wird abgerufen. Es werden keine Wallet-Signaturen angefordert.');
  const key=id(),p=selected,w=p.wallet;
  try{
   const onCheckpoint=state=>{cache.set(key,{state,identity:JSON.stringify([w,model().settings.solanaRpc])});if(cache.size>3)cache.delete(cache.keys().next().value);const count=state.transactions?.length??state.jobs?.reduce((n,j)=>n+j.items.length,0)??state.transactions?.length??0;setStatus(count+' Datensätze abgerufen; Blockchain-Stand wird geprüft.');};
   const entry=cache.get(key),compatible=entry?.identity===JSON.stringify([w,model().settings.solanaRpc]);
   if(resume&&!compatible)setStatus('Temporäre Daten fehlen oder Quelle geändert: sicherer erneuter Abruf.');
   let result;
   if(chain()==='sol')result=await fetchSolanaHistory({wallets:[{address:w.address,accountId:p.accountId}],configured:model().settings.solanaRpc,signal:controller.signal,onCheckpoint,resume:resume&&compatible?entry.state:null});
   else if(chain()==='btc')result=await fetchBitcoinHistory({wallets:[{chain:w.chain,address:w.address,addressType:w.addressType,accountId:p.accountId}],signal:controller.signal,onCheckpoint,resume:resume&&compatible?entry.state:null});
   else{
    const positions=model().positions.filter(x=>x.accountId===p.accountId&&x.wallet?.enabled&&x.wallet.address.toLowerCase()===w.address.toLowerCase()&&Number(x.wallet.chainId||1)===1&&x.wallet.chain==='erc20');
    const tokens=[...new Map(positions.map(x=>[x.wallet.contract.toLowerCase(),{contract:x.wallet.contract,decimals:Number(x.wallet.decimals),balanceModel:'unknown'}])).values()];
    result=await fetchEthereumHistory({wallets:[{accountId:p.accountId,address:w.address}],tokens,settings:model().settings,signal:controller.signal,onCheckpoint,resume:resume&&compatible?entry.state:null});
   }
   if(result.restartRequired){
    restartNeeded=true;
    cache.delete(key);if(model().walletHistory?.pending.some(p=>p.id===key))await commit(clearHistoryCheckpoint(model(),key));
    if(result.issues?.some(x=>/reorg|tip-changed|conflict/.test(x))&&stored())await commit(invalidateHistory(model(),key,'observed-chain-conflict'));
    await show(stored());
    const section={transactions:'Transaktionen','token-transfers':'ERC-20','internal-transactions':'Interne Transfers',chain:'Blockchain-Abgleich'}[result.sourceSection]||'Blockchain-Abgleich';
    setStatus('Quelle: Blockscout · '+section+' · '+(result.pagesRead||0)+' neue Seiten. '+(result.issues||[]).map(issueLabel).join(' ')+' Bisherige Daten bleiben erhalten. Bitte neu abrufen.');return;
   }
   if(result.resume){cache.set(key,{state:result.resume,identity:JSON.stringify([w,model().settings.solanaRpc])});await pending();setStatus((result.issues||[]).includes('aborted')?'Abgebrochen. Fortsetzen ist möglich; Cacheverlust erfordert erneuten Abruf.':'Abruf unvollständig. '+(result.issues||[]).map(issueLabel).join(' ')+' Fortsetzen ist möglich oder du kannst neu abrufen.');
    if(result.issues?.some(x=>/reorg|tip-changed|conflict/.test(x))&&stored())await commit(invalidateHistory(model(),key,'observed-chain-conflict'));
    show(stored());return;
   }
   preview=historyPreview(result,{id:key,chain:chain(),walletKey:p.id,...(chain()==='btc'?{walletScopeDigest:bitcoinHistoryScope(w)}:{})});cache.delete(key);limit=100;if(await show(preview,true))setStatus('Vorschau bereit. Erst „Historie übernehmen“ speichert diese Daten dauerhaft.');else setStatus('Abgebrochen. Keine neue Historie gespeichert.');
  }catch(e){
   if(chain()==='eth'&&/^(?:invalid-cursor|cursor-scope-mismatch|provider-cursor-format-changed|cursor-provider-changed|tip-changed-restart-required)$/.test(e.message)){
    restartNeeded=true;cache.delete(key);
    try{if(model().walletHistory?.pending.some(p=>p.id===key))await commit(clearHistoryCheckpoint(model(),key));
     await show(stored());setStatus(issueLabel(e.message)+' Bisherige Daten bleiben erhalten. Bitte neu abrufen.');
    }catch{setStatus('Neuer Abruf erforderlich. Der temporäre Status konnte nicht gespeichert werden; bisherige Daten bleiben erhalten.');}
   }else setStatus('Keine Übernahme: '+String(e.message||e));
  }
  finally{busy(false);if(restartNeeded&&dialog.open)el('start').focus();}
 }
 function choose(positionId){selected=model().positions.find(p=>p.id===positionId&&supported(p));preview=null;restartNeeded=false;limit=100;if(!selected)return;el('wallet').value=selected.id;evidenceUI?.refresh();unifiedUI?.refresh();show(stored());busy(false);setStatus('Quelle: '+source()+'. '+(model().walletHistory?.pending.some(p=>p.id===id())?(chain()==='eth'&&!cache.has(id())?'Temporäre Seiten fehlen. Bitte neu abrufen.':'Vorheriger Abruf kann neu aufgenommen werden.'):'Zum Starten Historie abrufen.'));}
 function mount(){
  dialog=document.createElement('dialog');dialog.className='edit-dialog wallet-history-dialog';dialog.id='walletHistoryDialog';dialog.setAttribute('aria-labelledby','walletHistoryTitle');
  dialog.innerHTML='<div class="dialog-head"><h2 id="walletHistoryTitle" tabindex="-1">Wallet-Historie</h2><button type="button" class="icon-close" data-history="close" aria-label="Historie schließen">×</button></div><div class="wallet-history-body"><p>Öffentliche Blockchain-Daten werden beim Indexer abgefragt. Ein xpub legt zusammengehörige Adressen offen. Keine Seeds, privaten Schlüssel oder Signaturen eingeben. Eigene Transfers sind keine Einzahlungen. Solana-Archive können Lücken enthalten; einen optionalen Archiv-RPC oder Helius-Zugang kannst du unter Mehr → Datenquellen hinterlegen. Keine Pflichtregistrierung.</p><div class="wallet-history-controls"><label class="field"><span>Wallet</span><select data-history="wallet"></select></label><label class="field"><span>Ansicht</span><select data-history="view"><option value="eur">Wert (€)</option><option value="price">Kurs</option><option value="balances">Bestand</option><option value="events">Transaktionen</option></select></label><label class="field"><span>Anzeigezeitraum</span><select data-history="period">'+CHART_PERIODS.wealth.map(p=>'<option value="'+p.value+'"'+(p.value==='all'?' selected':'')+'>'+p.label+'</option>').join('')+'</select></label><label class="field"><span>Optional anzeigen ab</span><input data-history="from" type="date"></label></div><p class="small-help">Für belegte Anfangsbestände kann der Abruf den Gesamtverlauf benötigen. Die Auswahl begrenzt die Anzeige.</p><div class="wallet-history-controls"><button class="btn primary" type="button" data-history="start">Historie abrufen</button><button class="btn outline" type="button" data-history="resume">Fortsetzen</button><button class="btn light" type="button" data-history="cancel" disabled>Abruf abbrechen</button></div><p role="status" aria-live="polite" data-history="status"></p><section data-history="output" aria-label="Historienvorschau"></section></div><div class="dialog-footer"><button type="button" class="btn light" data-history="discard">Vorschau verwerfen</button><button type="button" class="btn primary" data-history="accept" hidden>Historie übernehmen</button></div>';
  document.body.append(dialog);
  const evidenceHost=document.createElement('section');dialog.querySelector('.wallet-history-body').append(evidenceHost);
  evidenceUI=createPurchaseEvidenceUI({host:evidenceHost,getModel:model,getContext:()=>({session:stored(),accountId:selected?.accountId,bitcoin:selected?.wallet.chain.startsWith('btc')}),commit,isBusy:()=>running||calculating});
  const unifiedHost=document.createElement('section');dialog.querySelector('.wallet-history-body').append(unifiedHost);
  unifiedUI=createUnifiedBitcoinUI({host:unifiedHost,getModel:model,getContext:()=>({positionId:selected?.id,bitcoin:selected?.wallet.chain.startsWith('btc')}),commit,isBusy:()=>running||calculating,onBusy:value=>busy(value)});
  const close=()=>{if(running){controller.abort();calculationController?.abort();return;}calculationController?.abort();++calculation;calculating=false;preview=null;dialog.close();if(trigger?.isConnected)trigger.focus();else [...document.querySelectorAll('[data-action="wallet-history"]')].find(b=>b.dataset.id===selected?.id)?.focus();};el('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  el('wallet').onchange=()=>choose(el('wallet').value);for(const field of ['period','from','view'])el(field).onchange=()=>show(preview||stored(),Boolean(preview));
  el('start').onclick=()=>run(false);el('resume').onclick=()=>run(true);el('cancel').onclick=()=>{controller?.abort();calculationController?.abort();};
  el('discard').onclick=()=>{preview=null;show(stored());setStatus('Vorschau verworfen. Gespeicherte Historie bleibt unverändert.');};
  el('accept').onclick=async()=>{if(!preview||running)return;busy(true);try{await commit(acceptHistory(model(),preview));preview=null;await show(stored());evidenceUI.refresh();unifiedUI.refresh();setStatus('Historie dauerhaft gespeichert. Finanzbuchungen und Stichtage bleiben unverändert.');}catch(e){setStatus('Nicht gespeichert: '+e.message);}finally{busy(false);}};
 }
 return {open(positionId,button){if(!dialog)mount();trigger=button;el('wallet').innerHTML=model().positions.filter(supported).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');choose(positionId);if(!selected)return;if(!dialog.open)dialog.showModal();dialog.querySelector('h2').focus();},async openBitcoinFiles(files,button){const wallets=model().positions.filter(p=>p.wallet?.enabled&&p.wallet.chain.startsWith('btc'));if(wallets.length!==1)throw Error('Genau eine Bitcoin-Wallet erforderlich. Bitte Wallet-Zuordnung zuerst klären.');this.open(wallets[0].id,button);await unifiedUI.loadFiles(files);}};
}
