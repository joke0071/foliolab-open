import {prepareKrakenLinkBridge} from './kraken-link-bridge.js';
import {linkWallet} from './link-explorer-evidence.js';
import {prepareKrakenSolanaBridge,fetchKrakenSolanaTransaction} from './kraken-solana-bridge.js';
import {solanaRpcEndpoints} from './solana-rpc.js';
import {prepareKrakenEthereumBridge,fetchKrakenEthereumTransaction} from './kraken-ethereum-bridge.js';
import {prepareKrakenBitcoinBridge,fetchKrakenBitcoinTransaction} from './kraken-bitcoin-bridge.js';
import {prepareKrakenSourcePlan} from './kraken-source-plan.js';
import {previewKrakenImport,previewKrakenWithdrawal} from './kraken-import.js';
import {sourceUnmodified} from './import-identity.js';
import {escapeHTML as esc} from './model.js';
/** All selections are ephemeral until the enclosing dialog performs its canonical CAS commit. */
export function createKrakenImportUI({host,inputs,getModel,onApproval,allowUnchanged=false}){
 const source=prepareKrakenSourcePlan(inputs),streams=[...new Map(source.observations.map(r=>[r.streamId,r])).values()];
 const assignments={},selected=new Set(source.groups.map(g=>g.id)),external=new Set();let plan=null,approved=false,limit=50,bindingLimit=20,bitcoinBridge=null,ethereumBridge=null,solanaBridge=null,lookupGeneration=0,lookupController=null;
 // Only a unique previously confirmed source binding may be restored.
 for(const row of streams){
  const ids=new Set();for(const b of getModel().bookings){if(b.importSource?.sourceId!=='kraken-uh03-v1')continue;try{for(const [s,id] of JSON.parse(b.importSource.sourcePayload).bindings||[])if(s===row.streamId)ids.add(id);}catch{}}
  if(ids.size===1&&getModel().positions.some(p=>p.id===[...ids][0]))assignments[row.streamId]=[...ids][0];
 }
 for(const g of source.groups.filter(g=>['deposit-review','withdrawal-review'].includes(g.kind)))if(getModel().bookings.some(b=>b.importSource?.sourceId==='kraken-uh03-v1'&&b.importSource.fileId===g.id&&b.external===true&&sourceUnmodified(getModel(),b)))external.add(g.id);
 const el=id=>host.querySelector('[data-kraken="'+id+'"]');
 host.innerHTML='<details><summary>Kraken-Buchungen prüfen und übernehmen</summary><p class="small-help">Ordne jeden Asset-/Walletbereich ausdrücklich zu. Der vorhandene Bestand muss dem Quellsaldo vor der ersten neuen Gruppe entsprechen. Eine vollständige Historie lässt sich damit nicht über den heutigen Endbestand addieren. Bekannte Anschaffungskosten bleiben geschützt. Ledger-IDs belegen keine Blockchain-Transaktion; interne Wallet-Gegenbelege sind gesondert zu klären.</p><label class="field"><span>Vorgang</span><select data-kraken="operation"><option value="import">Buchungsgruppen übernehmen</option><option value="withdraw">Eine vollständige Gruppe zurücknehmen</option><option value="bridge">Bitcoin-Abgang mit eigener Wallet abgleichen</option><option value="ethereum-bridge">Ethereum-Abgang mit eigener Wallet abgleichen</option><option value="link-bridge">LINK-Abgang mit eigener Wallet abgleichen</option><option value="solana-bridge">Solana-Abgang mit eigener Wallet abgleichen</option></select></label><p class="small-help">Zur Rücknahme denselben Originalexport laden und genau eine bestehende Gruppe auswählen. Geld-, Krypto- und Gebührenwirkungen werden gemeinsam zurückgenommen. Der Quellenbeleg bleibt als dauerhafte Wiederimportsperre erhalten. Eine bloße Quellenentfernung ist hier nicht möglich. Spätere oder fremde Buchungen im selben Bereich bleiben geschützt.</p><div data-kraken="bindings"></div><button type="button" class="btn outline" data-kraken="more-bindings" hidden>Weitere Quellbereiche anzeigen</button><label class="field"><span><input type="checkbox" data-kraken="opening"> Vorhandene Mengen sind geprüfte Anfangsbestände vor den ausgewählten neuen Vorgängen, keine bereits enthaltenen Endbestände.</span></label><button type="button" class="btn outline" data-kraken="simulate">Auswahl prüfen</button><p data-kraken="status" role="status" aria-live="polite">Noch keine Buchungsprüfung durchgeführt.</p><div data-kraken="groups"></div><button type="button" class="btn outline" data-kraken="more" hidden>Weitere Gruppen anzeigen</button><label class="field"><span><input type="checkbox" data-kraken="partial"> Nicht ausgewählte Restgruppen ausdrücklich offen lassen. Die gewählte Teilmenge wurde vollständig auf Abhängigkeiten geprüft.</span></label><label class="field"><span><input type="checkbox" data-kraken="approve" disabled> Gezeigten Vorgang einschließlich aller Gruppenbeine bestätigen. Bei Rücknahme Geld-/Mengenänderungen und dauerhafte Wiederimportsperre übernehmen. Exakte Mengen und Geldbewegungen sind bestätigt; Kosten-, Gebührenbewertung und Steuern bleiben soweit angegeben ungeprüft.</span></label></details>';
 const bridgeHost=document.createElement('section');bridgeHost.dataset.kraken='bridge';bridgeHost.hidden=true;bridgeHost.classList.add('hidden');
 bridgeHost.innerHTML='<p class="small-help">Genau ein belegter BTC-Abgang zu einem eigenen bestätigten Bitcoin-Output. Ref-ID und Chain-Hash sind unterschiedliche Kennungen. Der Walletbestand bleibt unverändert; die Kraken-Gebühr wird einmal gebucht. Die Mininggebühr der gesamten Transaktion wird nur als Beleg gespeichert. Weitere Assets und mehrere eigene Ausgänge bleiben gesondert zu prüfen.</p><label class="field"><span>Eigene Bitcoin-Wallet</span><select data-kraken="bridge-wallet"><option value="">Wallet auswählen</option>'+getModel().positions.filter(p=>p.wallet?.enabled&&['btc','btc-hd'].includes(p.wallet.chain)).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label><label class="field"><span>Kraken-Ref.-ID aus den Auszahlungsdetails</span><input data-kraken="bridge-reference" maxlength="200" autocomplete="off"></label><label class="field"><span>Bitcoin-On-Chain-Transaktions-ID</span><input data-kraken="bridge-txid" maxlength="64" autocomplete="off" spellcheck="false"></label><label class="field"><span>Zieladresse aus den Auszahlungsdetails</span><input data-kraken="bridge-address" maxlength="90" autocomplete="off" spellcheck="false"></label><label class="field"><span>Ledger-Live-Originalexport</span><input type="file" data-kraken="bridge-ledger" accept=".csv,text/csv"></label><label class="field"><span><input type="checkbox" data-kraken="bridge-consent"> Netzwerk Bitcoin, Ref.-ID, Chain-Hash und Zieladresse stammen aus den abgeschlossenen Kraken-Auszahlungsdetails. Diese Angaben mit der eigenen Wallet abgleichen.</span></label><p class="small-help">Beim Abgleich wird ausschließlich der eingegebene öffentliche Transaktionshash an blockstream.info gesendet. Kraken- und Ledger-Dateien bleiben lokal.</p><button type="button" class="btn outline" data-kraken="bridge-lookup">Auszahlungsbeleg abgleichen</button><p data-kraken="bridge-status" role="status" aria-live="polite"></p>';
 el('bindings').before(bridgeHost);
 const bitcoinMarkup=bridgeHost.innerHTML;
 const renderBridge=()=>{
  bridgeHost.innerHTML=bitcoinMarkup;
  if(isEthereum()){
   bridgeHost.querySelector('p').textContent='Genau ein direkter nativer ETH-Abgang zu einem eigenen receiptgestützten Ethereum-Eingang. Der gescannte Walletbestand bleibt unverändert. Kraken-Gebühr einmal buchen; Networkgas zahlt der Sender. Die gesamte ETH-Historie bleibt unvollständig. Token, interne Aufrufe und mehrere Eingänge sind hier ausgeschlossen.';
   el('bridge-wallet').previousElementSibling.textContent='Eigene Ethereum-Wallet';
   el('bridge-wallet').innerHTML='<option value="">Wallet auswählen</option>'+getModel().positions.filter(p=>p.wallet?.enabled&&p.wallet.chain==='evm'&&Number(p.wallet.chainId)===1&&p.kind==='crypto'&&p.coinId==='ethereum'&&p.symbol==='ETH'&&!p.wallet.contract).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
   el('bridge-txid').previousElementSibling.textContent='Vollständige Ethereum-Transaktions-ID (0x + 64 Zeichen)';el('bridge-txid').maxLength=66;
   el('bridge-consent').parentElement.lastChild.textContent=' Netzwerk Ethereum, Ref.-ID, vollständiger Chain-Hash und Zieladresse sind mit den abgeschlossenen Kraken-Auszahlungsdetails abgeglichen. Einen gekürzten Hash nur mit dem vollständigen Originalexport ergänzen.';
   bridgeHost.querySelectorAll('p.small-help')[1].textContent='Beim Abgleich werden nur der öffentliche Transaktionshash und zugehörige Blockkennungen an ethereum-rpc.publicnode.com gesendet. Kraken- und Ledger-Dateien bleiben lokal.';
  }
  if(isSolana()){
   bridgeHost.querySelector('p').textContent='Genau ein direkter nativer SOL-Abgang zum eigenen bestätigten Eingang. Der Walletbestand bleibt unverändert. Die Kraken-Gebühr wird einmal gebucht; die Netzwerkgebühr zahlt der Sender. Die Gesamthistorie bleibt gesondert zu prüfen. Token und mehrdeutige Transfers sind ausgeschlossen.';
   el('bridge-wallet').previousElementSibling.textContent='Eigene Solana-Wallet';
   el('bridge-wallet').innerHTML='<option value="">Wallet auswählen</option>'+getModel().positions.filter(p=>p.wallet?.enabled&&p.wallet.chain==='sol'&&p.kind==='crypto'&&p.coinId==='solana'&&p.symbol==='SOL'&&!p.wallet.contract&&!p.wallet.mint).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
   el('bridge-txid').previousElementSibling.textContent='Vollständige Solana-Transaktionssignatur';el('bridge-txid').maxLength=88;
   el('bridge-consent').parentElement.lastChild.textContent=' Netzwerk Solana, Ref.-ID, vollständige Signatur und Zieladresse sind mit den abgeschlossenen Kraken-Auszahlungsdetails abgeglichen. Eine gekürzte Signatur nur mit dem vollständigen Originalexport ergänzen.';
   bridgeHost.querySelectorAll('p.small-help')[1].textContent='Beim Abgleich werden nur die öffentliche Signatur und Blockkennungen an den eingestellten Solana-Anbieter ('+new URL(solanaRpcEndpoints(getModel().settings.solanaRpc)[0]).hostname+') gesendet. Kein Anbieterwechsel. Kraken- und Ledger-Dateien bleiben lokal.';
  }
  if(isLink()){
   bridgeHost.querySelector('p').textContent='Genau ein finalisierter LINK-Eingang aus dem lokalen Blockscout-/Beacon-Belegpaket. Die eigene LINK-Wallet benötigt eine zuvor ausdrücklich übernommene passende Historie. Bei fehlender Historie zuerst dort den lokalen Teilbeleg prüfen und übernehmen. Walletbestand unverändert; Kraken-Gebühr einmal, ETH-Gas beim Sender.';
   el('bridge-wallet').previousElementSibling.textContent='Eigene LINK-Wallet auf Ethereum';el('bridge-wallet').innerHTML='<option value="">Wallet auswählen</option>'+getModel().positions.filter(linkWallet).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');
   el('bridge-txid').previousElementSibling.textContent='Vollständige Ethereum-Transaktions-ID';el('bridge-txid').maxLength=66;
   el('bridge-consent').parentElement.lastChild.textContent=' Kraken-Ref.-ID, vollständigen Chain-Hash, eigene Zielwallet und dieses lokale Belegpaket ausdrücklich prüfen.';
   bridgeHost.querySelectorAll('p.small-help')[1].textContent='Lokale Prüfung ohne Netzabfrage. Blockscout-Ausführung und Beacon-Finalität bleiben getrennte Anbieterbelege. Keine vollständige Tokenhistorie oder historische Saldenabnahme.';
   const label=document.createElement('label');label.className='field';label.innerHTML='<span>Lokales LINK-Belegpaket (JSON, höchstens 1 MB)</span><input data-kraken="bridge-link-evidence" type="file" accept=".json,application/json">';el('bridge-ledger').closest('label').after(label);
  }
  for(const field of bridgeHost.querySelectorAll('input,select'))field.addEventListener('change',invalidate);
  for(const field of bridgeHost.querySelectorAll('input:not([type])'))field.addEventListener('input',invalidate);
  el('bridge-lookup').onclick=lookup;
 };

 const isLink=()=>el('operation').value==='link-bridge';
 const isSolana=()=>el('operation').value==='solana-bridge';
 const isEthereum=()=>el('operation').value==='ethereum-bridge';
 const options=()=>({solanaBridge:isSolana()?solanaBridge:null,ethereumBridge:isEthereum()||isLink()?ethereumBridge:null,bitcoinBridge:el('operation').value==='bridge'?bitcoinBridge:null,operation:el('operation').value,selectedGroups:[...selected],externalReferences:[...external],openingConfirmed:el('opening').checked});
 const notify=()=>onApproval(Boolean(approved&&(plan?.ready||allowUnchanged&&plan?.duplicates)&&!plan.issues.length&&plan.baseline===JSON.stringify(getModel())&&(!plan.excluded||el('partial').checked)));
 const invalidate=({clearProof=true}={})=>{++lookupGeneration;lookupController?.abort();if(clearProof){bitcoinBridge=null;ethereumBridge=null;solanaBridge=null;}plan=null;approved=false;el('approve').checked=false;el('approve').disabled=true;el('status').textContent='Auswahl geändert. Erneut prüfen.';notify();};
 function renderBindings(){
  el('bindings').innerHTML=streams.slice(0,bindingLimit).map(row=>{
   const positions=getModel().positions.filter(p=>!p.wallet?.enabled&&p.currency==='EUR'&&(row.values.asset==='EUR'?p.kind==='cash':p.kind==='crypto'&&p.symbol===row.values.asset));
   return '<label class="field"><span>'+esc(row.values.asset+' · '+row.values.wallet+' · '+row.values.subclass)+'</span><select data-kraken-binding="'+esc(row.streamId)+'"><option value="">Bitte ausdrücklich zuordnen</option>'+positions.map(p=>'<option value="'+esc(p.id)+'"'+(assignments[row.streamId]===p.id?' selected':'')+'>'+esc((getModel().providers.find(v=>v.id===p.providerId)?.name||'Anbieter')+' / '+(getModel().accounts.find(a=>a.id===p.accountId)?.name||'Konto')+' / '+p.name)+'</option>').join('')+'</select></label>';
  }).join('');
  el('more-bindings').hidden=bindingLimit>=streams.length;el('more-bindings').classList.toggle('hidden',bindingLimit>=streams.length);
  for(const select of host.querySelectorAll('[data-kraken-binding]'))select.onchange=()=>{assignments[select.dataset.krakenBinding]=select.value;invalidate();};
 }
 function renderGroups(){
  const labels={exchange:'Handel',reward:'Reward','internal-transfer':'Interner Hauptbetragtransfer','internal-transfer-batch':'Gemeinsame Spot-/Earn-Umbuchung · kein Ertrag','deposit-review':'Zugang – Gegenbereich prüfen','withdrawal-review':'Abgang – Gegenbereich prüfen',unresolved:'Ungeklärt'};
  el('groups').innerHTML=source.groups.slice(0,limit).map(g=>{
   const result=plan?.groups.find(x=>x.id===g.id),movements=g.movements.map(m=>(m.deltaExact??'unbekannt')+' '+m.asset+' ('+m.wallet+')').join(' · ');
   return '<div class="history-sub"><label class="field"><span><input type="checkbox" data-kraken-group="'+esc(g.id)+'"'+(selected.has(g.id)?' checked':'')+'> '+esc(g.rows[0].values.time+' · '+labels[g.kind])+'</span></label><p class="small-help">'+esc(movements)+'</p>'+(['deposit-review','withdrawal-review'].includes(g.kind)?'<label class="field"><span><input type="checkbox" data-kraken-external="'+esc(g.id)+'"'+(external.has(g.id)?' checked':'')+'> Gegenbereich liegt nach eigener Prüfung außerhalb aller erfassten Konten und Wallets.</span></label>':'')+'<p class="small-help">'+esc(result?.message||(result?.status==='ready'?'Geprüft – neue Buchungsgruppe':result?.status==='existing'?'Bereits vorhanden':g.issues.join(' ')))+'</p></div>';
  }).join('');
  for(const box of host.querySelectorAll('[data-kraken-group]'))box.onchange=()=>{box.checked?selected.add(box.dataset.krakenGroup):selected.delete(box.dataset.krakenGroup);invalidate();};
  for(const box of host.querySelectorAll('[data-kraken-external]'))box.onchange=()=>{box.checked?external.add(box.dataset.krakenExternal):external.delete(box.dataset.krakenExternal);invalidate();};
  el('more').hidden=limit>=source.groups.length;el('more').classList.toggle('hidden',limit>=source.groups.length);
 }
 async function lookup(){
  invalidate();const generation=lookupGeneration,baseline=JSON.stringify(getModel());
  try{
   if(!el('bridge-consent').checked)throw Error('Angaben aus den abgeschlossenen Auszahlungsdetails ausdrücklich bestätigen.');
   const reference=el('bridge-reference').value.trim(),txid=el('bridge-txid').value.trim(),destination=el('bridge-address').value.trim(),positionId=el('bridge-wallet').value;
   const groups=source.groups.filter(g=>g.rows.some(r=>r.values.refid===reference));
   if(groups.length!==1)throw Error('Ref.-ID muss genau eine Gruppe im geladenen Kraken-Original identifizieren.');
   const file=el('bridge-ledger').files[0];if(!file||file.size>2e6)throw Error('Ledger-Live-Originalexport mit höchstens 2 MB auswählen.');
   el('bridge-status').textContent=isLink()?'Lokales LINK-Belegpaket wird geprüft …':isSolana()?'Solana-Transaktion wird geprüft …':isEthereum()?'Ethereum-Transaktion und Receipt werden geprüft …':'Bitcoin-Transaktion wird geprüft …';el('bridge-lookup').disabled=true;
   const controller=new AbortController();lookupController=controller;const timer=setTimeout(()=>controller.abort(),15000);
   const eth=isEthereum(),sol=isSolana(),link=isLink();let evidence;try{const local=link?el('bridge-link-evidence').files[0]:null;if(link&&(!local||local.size>1000000))throw Error('Lokales LINK-Belegpaket auswählen (höchstens 1 MB).');evidence=link?{evidenceJSON:await local.text()}:sol?await fetchKrakenSolanaTransaction(txid,{configured:getModel().settings.solanaRpc,signal:controller.signal}):eth?await fetchKrakenEthereumTransaction(txid,{signal:controller.signal}):{transaction:await fetchKrakenBitcoinTransaction(txid,{signal:controller.signal})};}finally{clearTimeout(timer);}
   const ledgerCSV=await file.text();
   if(controller.signal.aborted||generation!==lookupGeneration||baseline!==JSON.stringify(getModel())||!host.isConnected||(host.closest('dialog')&&!host.closest('dialog').open))throw Error('Auswahl oder Datenstand geändert. Erneut prüfen.');
   const proof=(link?prepareKrakenLinkBridge:sol?prepareKrakenSolanaBridge:eth?prepareKrakenEthereumBridge:prepareKrakenBitcoinBridge)(getModel(),groups[0],{positionId,reference,txid,destination,ledgerCSV,...evidence});if(sol)solanaBridge=proof;else if(eth||link)ethereumBridge=proof;else bitcoinBridge=proof;
   selected.clear();selected.add(groups[0].id);external.delete(groups[0].id);renderGroups();
   el('bridge-status').textContent=link?'Exakter eigener LINK-Eingang belegt: '+proof.principalLINK+' LINK. Separate Kraken-Gebühr: '+proof.exchangeFeeLINK+' LINK. ETH-Gas bezahlt der Sender. Walletbestand und übernommene Teilhistory bleiben unverändert. Nur diese Gruppe ist ausgewählt. Anfangsbestand und Restgruppen prüfen, dann Auswahl prüfen.':sol?'Exakter eigener Solana-Eingang belegt: '+proof.principalSOL+' SOL. Kraken-Gebühr: '+proof.exchangeFeeSOL+' SOL. Netzwerkgebühr: '+proof.networkFeeSOL+' SOL, vom Sender bezahlt. Walletbestand unverändert. Nur diese Gruppe ist ausgewählt. Anfangsbestand und offene Restgruppen prüfen, dann Auswahl prüfen.':eth?'Exakter eigener Ethereum-Eingang belegt: '+proof.principalETH+' ETH. Kraken-Gebühr: '+proof.exchangeFeeETH+' ETH. Networkgas: '+proof.networkFeeETH+' ETH, vom Sender bezahlt. Walletbestand unverändert; ETH-Gesamthistorie weiterhin unvollständig. Nur diese Gruppe ist ausgewählt. Anfangsbestand und offene Restgruppen prüfen, dann Auswahl prüfen.':'Exakter eigener Bitcoin-Output belegt: '+bitcoinBridge.principalBTC+' BTC. Kraken-Gebühr: '+bitcoinBridge.exchangeFeeBTC+' BTC. Mininggebühr der gesamten Transaktion: '+bitcoinBridge.transactionFeeBTC+' BTC, keine zusätzliche Walletbelastung. Nur diese Gruppe ist ausgewählt. Anfangsbestand und offene Restgruppen prüfen, dann Auswahl prüfen.';
  }catch(e){if(generation===lookupGeneration)el('bridge-status').textContent='Keine Übernahme: '+e.message;}
  finally{el('bridge-lookup').disabled=false;}
 };
 el('more-bindings').onclick=()=>{const previous=bindingLimit;bindingLimit+=20;renderBindings();host.querySelectorAll('[data-kraken-binding]')[previous]?.focus();};
 el('opening').onchange=()=>invalidate({clearProof:false});el('operation').onchange=()=>{el('bridge').hidden=!['bridge','ethereum-bridge','solana-bridge','link-bridge'].includes(el('operation').value);el('bridge').classList.toggle('hidden',!['bridge','ethereum-bridge','solana-bridge','link-bridge'].includes(el('operation').value));const label=el('opening').closest('label'),withdraw=el('operation').value==='withdraw';label.hidden=withdraw;label.classList.toggle('hidden',withdraw);invalidate();renderBridge();};
 el('partial').onchange=()=>{approved=false;el('approve').checked=false;notify();};
 el('approve').onchange=()=>{approved=el('approve').checked;notify();};
 el('simulate').onclick=()=>{
  approved=false;el('approve').checked=false;plan=null;
  try{
   if(el('operation').value==='withdraw'){
    const review=previewKrakenWithdrawal(getModel(),inputs,assignments,options());
    plan={...review,ready:1,issues:[],groups:[{id:review.group,status:'ready',message:'Vollständige Rücknahme geprüft. Geld-/Mengenänderungen: '+review.changes.map(c=>(getModel().positions.find(p=>p.id===c.positionId)?.name||c.positionId)+' '+c.before+' → '+c.after).join(' · ')}]};
    el('status').textContent='1 Gruppe rücknehmbar · '+review.excluded+' nicht ausgewählt. Quellenbeleg und Wiederimportsperre bleiben dauerhaft erhalten. Noch nichts gespeichert.';
   }else{if(el('operation').value==='bridge'&&!bitcoinBridge||(isEthereum()||isLink())&&!ethereumBridge||isSolana()&&!solanaBridge)throw Error('Auszahlungsbeleg zuerst abgleichen.');plan=previewKrakenImport(getModel(),inputs,assignments,options());el('status').textContent=plan.ready+' neue Gruppen · '+plan.duplicates+' bereits vorhanden · '+plan.issues.length+' gesperrt · '+plan.excluded+' nicht ausgewählt. Noch nichts gespeichert.';}
  }
  catch(e){el('status').textContent='Keine Übernahme: '+e.message;}
  el('approve').disabled=!plan||!(plan.ready||allowUnchanged&&plan.duplicates)||Boolean(plan.issues.length);renderGroups();notify();
 };
 el('more').onclick=()=>{limit+=50;renderGroups();};
 renderBridge();renderBindings();renderGroups();notify();
 return {approved(){if(!approved||!plan||plan.issues.length||!(plan.ready||allowUnchanged&&plan.duplicates)||plan.baseline!==JSON.stringify(getModel())||plan.excluded&&!el('partial').checked)return null;return {...options(),assignments:{...assignments},baseline:plan.baseline,confirmed:true,partialConfirmed:el('partial').checked};},revokeApproval(){approved=false;el('approve').checked=false;notify();},resetApproval(){invalidate();}};
}
