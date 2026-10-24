import {escapeHTML} from './model.js';
import {cryptoChoices,loadTopCrypto,loadAllCrypto,loadFundCatalog,loadFundCatalogPersistent,searchFundCatalog} from './instrument-catalog.js';
import {DIRECTORY_PAGE_LINKS,MAX_DIRECTORY_BYTES,parseSecurityDirectory,saveSecurityDirectory,loadSecurityDirectories,searchSecurityDirectories,directoryAge} from './security-catalog.js';
import {buildAssetWizardDraft} from './asset-wizard-core.js';
const e=escapeHTML;
const kinds=[['etf','ETF'],['stock','Aktie'],['fund','Fonds'],['crypto','Kryptowährung'],['cash','Guthaben'],['other','Sonstiges']];
const providerKinds=[['broker','Broker'],['bank','Bank'],['wallet','Wallet-Anbieter'],['other','Sonstiges']];
const accountKinds=[['securities','Wertpapierdepot'],['checking','Giro- / Verrechnungskonto'],['savings','Tages- / Festgeld'],['exchange','Kryptobörsenkonto'],['wallet','Kryptowallet'],['other','Sonstiges']];
const currencies=['EUR','USD','CHF','GBP','CAD','AUD','JPY','SEK','NOK','DKK','PLN','CZK','HUF','NZD','SGD'];
const walletChains=[['btc','Bitcoin'],['btc-hd','Bitcoin HD (xpub / ypub / zpub)'],['xrp','XRP Ledger'],['xrp-token','XRP Token'],['evm','EVM Coin'],['erc20','ERC-20 Token'],['sol','Solana'],['spl','SPL Token'],['sol-stake','Solana Staking'],['sonic-stake','Sonic Staking'],['cosmos','Cosmos'],['cosmos-stake','Cosmos Staking'],['cosmos-unbonding','Cosmos Unbonding'],['hedera','Hedera'],['near','NEAR'],['near-locked','NEAR Locked']];
const roleChoices=[['standard','Normal'],['collateral','Sicherheit / Collateral'],['liquid-staking','Liquid Staking'],['vault','Vault'],['liquidity-pool','Liquidity Pool'],['lending','Lending'],['borrowed','Geliehene Assets / Verbindlichkeit'],['wrapped','Wrapped Token']];
const valuationChoices=[['included','Im Vermögen anrechnen'],['excluded','Nicht anrechnen (bereits anders erfasst)'],['liability','Als Verbindlichkeit abziehen']];
const today=()=>new Date().toISOString().slice(0,10);
const opts=(items,selected,placeholder='Bitte wählen')=>'<option value="">'+e(placeholder)+'</option>'+items.map(([id,label])=>'<option value="'+e(id)+'"'+(selected===id?' selected':'')+'>'+e(label)+'</option>').join('');
const input=(id,label,value='',attrs='')=>'<label class="field"><span>'+e(label)+'</span><input id="'+id+'" value="'+e(value)+'" '+attrs+'></label>';
const defaultAcc=kind=>kind==='crypto'?['Kryptowallet','wallet']:kind==='cash'?['Guthabenkonto','savings']:['Wertpapierdepot','securities'];
const defaultProviderType=kind=>kind==='crypto'?'wallet':kind==='cash'?'bank':'broker';
const fresh=()=>({step:1,kind:'etf',query:'',name:'',symbol:'',isin:'',coinId:'',currency:'EUR',exchange:'',mic:'',eodhdSymbol:'',fmpSymbol:'',tradingViewSymbol:'',
 providerId:'',accountId:'',providerName:'',providerType:'broker',accountName:'Wertpapierdepot',accountType:'securities',accountCurrency:'EUR',
 mode:'opening',quantity:'',date:today(),currentPrice:'',unitPrice:'',feeEUR:'',fxRate:'',advancedOpen:false,economicOpen:false,walletOpen:false,notes:'',costBasisEUR:'',economicRole:'standard',valuationMode:'included',representedByPositionId:'',walletEnabled:false,walletChain:'btc',walletAddress:'',walletContract:'',walletDecimals:'18',walletChainId:'1',walletHdType:'auto',results:[],status:'',busy:false,saved:false});
/**
 * Native modal wizard. Provider/account drafts remain transient until final,
 * atomic model validation and one onCommit call.
 */
export function createAssetWizard(dialog,{getModel,onCommit,lookupListings,lookupPublic,notify}){
 let state=fresh(),sequence=0,opener=null,leaders=[],allCoins=[],funds=loadFundCatalog(),directories=[],cryptoLoading=false,coinFullLoading=false;
 const $=id=>dialog.querySelector('#'+id);
 const directorySummary=()=>{
  if(!directories.length)return 'Noch keine Wertpapierliste importiert. Dateiverarbeitung nur in diesem Browser.';
  const total=directories.reduce((sum,x)=>sum+x.entries.length,0),stale=directories.some(x=>directoryAge(x).stale);
  return total.toLocaleString('de-AT')+' Wertpapiernotierungen aus '+directories.length+' Dateien gespeichert · '+
   (stale?'Mindestens eine Datei ist älter als 30 Tage – erneut von der Quelle herunterladen.':'Aktualisierung nach spätestens 30 Tagen empfohlen.');
 };

 const updateValue=(key,val)=>{state[key]=val;};
 const shell=(fields,title)=>{
  dialog.innerHTML='<div class="wizard-shell"><div class="dialog-head"><div><div class="panel-kicker">ANLAGE HINZUFÜGEN</div><h2 id="wizardTitle">'+e(title)+'</h2></div><button type="button" id="wizardClose" class="icon-close" aria-label="Abbrechen oder schließen">×</button></div>'+
  
  '<div id="wizardFields">'+fields+'</div><div class="wizard-feedback" id="wizardError" role="alert" aria-live="polite"></div>'+
   '<div class="dialog-footer"><button class="btn light" type="button" id="wizardPrev">Abbrechen</button><button class="btn primary" type="button" id="wizardNext"'+(state.saved?' hidden':'')+'>Position speichern</button></div></div>';
  $('wizardClose').addEventListener('click',close);
  $('wizardPrev').addEventListener('click',close);
  $('wizardNext')?.addEventListener('click',advance);
   
 };
 const resultsMarkup=()=>{
  const query=state.query.trim(),list=state.results||[];
  if(!query&&state.kind!=='crypto')return '';
   if(state.kind!=='crypto'&&query.length<2)return '<p class="small-help">Bitte mindestens zwei Zeichen eingeben.</p>';
  return (state.status?'<div class="wizard-search-status" role="status">'+e(state.status)+'</div>':'')+
   (list.length?'<div class="wizard-matches">'+list.map((x,i)=>'<button type="button" data-wizard-pick="'+i+'" class="result-item"><span><strong>'+e(x.name)+'</strong><small>'+
    e([x.kind==='crypto'?'Krypto':x.kind==='stock'?'Aktie':x.kind==='fund'?'Fonds':x.kind==='other'?'Sonstiges':'ETF',x.isin,x.symbol,x.kind==='crypto'?x.id:''].filter(Boolean).join(' · '))+
    '</small></span><small>'+e([x.rank?'#'+x.rank:'',x.exchange,x.mic,x.currency,x.source].filter(Boolean).join(' · '))+'</small></button>').join('')+'</div>':
    '<p class="small-help">'+(state.kind!=='crypto'&&!directories.length&&!funds?'Kein lokaler Katalog vorhanden. Nutze die externe Suche oder gib die Daten unten ein.':'Keine Treffer im lokalen Katalog. Extern suchen oder unten selbst eingeben.')+'</p>');
 };
 const updateResults=()=>{
  const q=state.query.trim();
  if(state.kind==='crypto'){
   state.results=cryptoChoices(q,{leaders,all:allCoins,limit:100});
   state.status=leaders.length?(!q?'CoinGecko · Top '+leaders.length+' nach Marktkapitalisierung (Live-Katalog, nur Metadaten)':
    'CoinGecko · Top '+leaders.length+(allCoins.length?' + '+allCoins.length+' weitere Coin-IDs':' · vollständiger Katalog wird bei Suche geladen')):
    (cryptoLoading?'CoinGecko Top 100 werden abgerufen …':'Offline-Auswahl · vollständige Liste vorübergehend nicht verfügbar');
  }else if(q.length>=2){
   // Only explicitly imported catalogs are searchable: never mix in the
   // former four hard-coded ETF suggestions.
   const matching=searchFundCatalog(q,state.kind,funds,100),securities=searchSecurityDirectories(q,state.kind,directories,100);
   const identified=new Set(),unique=[];
   for(const item of [...securities.results,...matching.results]){
    const key=[item.isin||item.symbol,item.symbol,item.mic,item.currency].join('|');
    if(identified.has(key))continue;
    identified.add(key);unique.push(item);
   }
   state.results=unique.slice(0,100);
   const sources=[];
   if(directories.length)sources.push('Wertpapier-CSV/TXT: '+securities.total+' Treffer');
   if(funds)sources.push('Fonds-CSV: '+matching.total+' Treffer');
   state.status=(sources.length?sources.join(' · '):'')+
    (securities.total+matching.total>100?' · erste 100 Treffer – Suche präzisieren':'');
  }else{state.results=[];state.status='';}
  if($('wizardMatches'))$('wizardMatches').innerHTML=resultsMarkup();
 };
 const loadCoins=({all=false}={})=>{
  if(state.kind!=='crypto')return;
  const apiKey=getModel()?.settings?.coinGeckoKey||'';
  if(!leaders.length&&!cryptoLoading){
   cryptoLoading=true;
   loadTopCrypto({key:apiKey}).then(items=>{leaders=items;}).catch(error=>{
    if(state.kind==='crypto'&&state.step===1){state.status='CoinGecko nicht erreichbar: '+String(error.message).slice(0,90)+'. Offline-Suche weiterhin möglich.';}
   }).finally(()=>{cryptoLoading=false;if(dialog.open&&state.kind==='crypto'&&state.step===1)updateResults();});
  }
  if(all&&!allCoins.length&&!coinFullLoading){
   coinFullLoading=true;
   loadAllCrypto({key:apiKey}).then(items=>{allCoins=items;}).catch(()=>{}).finally(()=>{
    coinFullLoading=false;if(dialog.open&&state.kind==='crypto'&&state.step===1)updateResults();
   });
  }
 };
 const renderOne=()=>{
  const kindChoices=opts(kinds,state.kind,'Anlageklasse wählen').replace('<option value="">Anlageklasse wählen</option>','');
  const catalogTools=(['etf','fund','stock','other'].includes(state.kind)?
    '<details id="wizardCatalogTools" class="wizard-catalog-tools"><summary>Wertpapierkatalog importieren (CSV/TXT)</summary><div class="wizard-catalog-content">'+
    '<p>Zusätzliche Wertpapiere aus offiziellen Dateien lokal ergänzen. Auf der Xetra-Seite „T7 (Xetra) Alle handelbaren Instrumente“ als CSV wählen.</p>'+
    '<a href="'+e(DIRECTORY_PAGE_LINKS.xetra)+'" target="_blank" rel="noopener noreferrer">Xetra-Downloadseite ↗</a>'+
    '<div class="wizard-source-inline"><a href="https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt" target="_blank" rel="noopener noreferrer">Nasdaq-Werte (.txt) ↗</a><a href="https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt" target="_blank" rel="noopener noreferrer">Weitere US-Börsen (.txt) ↗</a></div>'+
    '<div class="wizard-catalog-actions"><button id="wizardDirectoryImport" class="btn outline" type="button">CSV/TXT auswählen</button>'+
    '<input id="wizardDirectoryFile" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" class="hidden"></div>'+
    '<small id="wizardDirectoryStatus">'+e(directorySummary())+'</small><small>Quelle und Ausgabedatum prüfen. Eine Abwicklungswährung aus einer Datei ist nicht automatisch die Kurswährung.</small></div></details>':'');
  const m=getModel(),providerChoices=[...m.providers.map(x=>[x.id,x.name]),['__new__','+ Neuen Anbieter anlegen']];
  const accountChoices=[...m.accounts.filter(a=>a.providerId===state.providerId).map(x=>[x.id,x.name]),['__new__','+ Neues Konto anlegen']];
  let storage='<section class="wizard-group"><h3>Konto / Depot</h3>'+
    '<label class="field"><span>Anbieter</span><select id="wizardProvider">'+opts(providerChoices,state.providerId)+'</select></label>';
  if(state.providerId==='__new__')storage+='<div class="wizard-inline-new">'+input('wizardProviderName','Name des Anbieters',state.providerName,'maxlength="80"')+
    '<label class="field"><span>Typ des Anbieters</span><select id="wizardProviderType">'+opts(providerKinds,state.providerType)+'</select></label></div>';
  if(state.providerId)storage+='<label class="field"><span>Konto oder Depot</span><select id="wizardAccount">'+opts(accountChoices,state.accountId)+'</select></label>';
  if(state.accountId==='__new__')storage+='<div class="wizard-inline-new">'+input('wizardAccountName','Kontoname',state.accountName,'maxlength="100"')+
    '<label class="field"><span>Kontotyp</span><select id="wizardAccountType">'+opts(accountKinds,state.accountType)+'</select></label>'+
    '<label class="field"><span>Kontowährung</span><select id="wizardAccountCurrency">'+opts(currencies.map(x=>[x,x]),state.accountCurrency)+'</select></label></div>';
  storage+='</section>';
  const buy=state.mode==='buy',cash=state.kind==='cash';
  const holdings='<section class="wizard-group"><h3>Bestand erfassen</h3>'+
    '<fieldset class="wizard-mode"><legend>Art der Erfassung</legend>'+
    '<label><input type="radio" name="wizardMode" value="opening"'+(!buy?' checked':'')+'> Aktueller Bestand</label>'+
    (!cash?'<label><input type="radio" name="wizardMode" value="buy"'+(buy?' checked':'')+'> Kauf erfassen</label>':'')+'</fieldset>'+
    '<div class="field-row">'+input('wizardQuantity',cash?'Kontostand':'Stückzahl / Menge',state.quantity,'inputmode="decimal" required')+
    input('wizardDate',buy?'Kaufdatum':'Datum',state.date,'type="date" required max="'+today()+'"')+'</div>'+
    (buy?'<div class="field-row">'+input('wizardUnitPrice','Kaufpreis je Stück',state.unitPrice,'inputmode="decimal" required')+
      input('wizardFee','Gebühren in EUR (optional)',state.feeEUR,'inputmode="decimal"')+'</div>':'')+
    (!cash?input('wizardCurrentPrice','Aktueller Kurs (optional)',state.currentPrice,'inputmode="decimal"'):'')+
    (state.currency!=='EUR'?input('wizardFX','EUR je Einheit '+state.currency,state.fxRate,'inputmode="decimal" required'):'')+
    '<p class="small-help">'+(buy?'Kaufpreis und aktueller Marktpreis werden getrennt erfasst.':'Der Anfangsbestand ist keine historische Kaufbuchung. Unbekannte Kaufpreise bleiben unbekannt.')+'</p></section>';
  const linkedPositions=m.positions.map(p=>[p.id,p.name+(p.symbol?' · '+p.symbol:'')]);
  const crypto=state.kind==='crypto';
  const advanced='<section class="wizard-group wizard-extra-group"><details class="advanced-apis wizard-extra" id="wizardAdvanced"'+(state.advancedOpen?' open':'')+'>'+
   '<summary>Weitere Angaben (optional)</summary>'+
   '<p class="small-help">Nur bei Bedarf ausfüllen. Diese Angaben können später bearbeitet werden.</p>'+
   (state.mode==='opening'&&!cash?input('wizardCostBasis','Bekannter Einstandswert gesamt (EUR)',state.costBasisEUR,'inputmode="decimal" placeholder="Unbekannt – leer lassen"'):'')+
   input('wizardNotes','Notiz',state.notes,'maxlength="300" placeholder="Optional"')+
   '<details class="advanced-apis wizard-extra-nested" id="wizardEconomic"'+(state.economicOpen?' open':'')+'>'+
    '<summary>Wirtschaftliche Zuordnung / DeFi</summary>'+
    '<p class="small-help">Für Sicherheiten, Staking, Wrapped Tokens oder Verbindlichkeiten. Verhindere Doppelzählungen durch bewusste Zuordnung.</p>'+
    '<label class="field"><span>Wirtschaftliche Funktion</span><select id="wizardEconomicRole">'+opts(roleChoices,state.economicRole).replace('<option value="">Bitte wählen</option>','')+'</select></label>'+
    '<label class="field"><span>In der Vermögenssumme</span><select id="wizardValuationMode">'+opts(valuationChoices,state.valuationMode).replace('<option value="">Bitte wählen</option>','')+'</select></label>'+
    '<label class="field"><span>Wird repräsentiert durch (optional)</span><select id="wizardRepresented">'+opts(linkedPositions,state.representedByPositionId,'Keine Zuordnung')+'</select></label></details>'+
   (crypto?'<details class="advanced-apis wizard-extra-nested" id="wizardWalletAdvanced"'+(state.walletOpen?' open':'')+'>'+
    '<summary>Öffentliche Wallet verknüpfen</summary>'+
    '<p class="small-help">Für die automatische Wallet-Suche nutze den separaten Button „Wallet hinzufügen“ unter Positionen. Hier kannst du einzelne Positionen manuell einer öffentlichen Adresse zuordnen. Keine privaten Schlüssel eingeben.</p>'+
    '<label class="checkbox-line"><input type="checkbox" id="wizardWalletEnabled"'+(state.walletEnabled?' checked':'')+'> Öffentliche Wallet für diese Position hinterlegen</label>'+
    '<div id="wizardWalletFields"'+(state.walletEnabled?'':' class="hidden"')+'>'+
     '<label class="field"><span>Netzwerk</span><select id="wizardWalletChain">'+opts(walletChains,state.walletChain).replace('<option value="">Bitte wählen</option>','')+'</select></label>'+
     input('wizardWalletAddress','Öffentliche Wallet-Adresse',state.walletAddress,'maxlength="180" autocomplete="off" spellcheck="false"')+
     '<div id="wizardWalletContractWrap">'+input('wizardWalletContract','Token-Contract, Mint oder Validator-ID',state.walletContract,'maxlength="120"')+'</div>'+
     '<div id="wizardWalletDecimalsWrap">'+input('wizardWalletDecimals','Token-Dezimalstellen',state.walletDecimals,'type="number" min="0" max="30" step="1"')+'</div>'+
     '<div id="wizardWalletChainIdWrap">'+input('wizardWalletChainId','EVM Chain-ID',state.walletChainId,'type="number" min="1" step="1"')+'</div>'+
     '<div id="wizardWalletHdWrap"><label class="field"><span>Bitcoin-HD-Adresstyp</span><select id="wizardWalletHdType">'+opts([['auto','Automatisch erkennen'],['p2wpkh','Native SegWit (bc1q)'],['p2sh-p2wpkh','Nested SegWit (3)'],['p2pkh','Legacy (1)']],state.walletHdType).replace('<option value="">Bitte wählen</option>','')+'</select></label></div>'+
    '</div></details>':'')+'</details></section>';
  const fields=storage+'<section class="wizard-group"><h3>Anlage auswählen</h3>'+
    '<label class="field"><span>Anlageklasse</span><select id="wizardKind">'+kindChoices+'</select></label>'+
    '<label class="field"><span>Anlage suchen (optional)</span><input type="search" id="wizardQuery" value="'+e(state.query)+'" autocomplete="off" placeholder="Name, ISIN oder Ticker"></label>'+
    '<div id="wizardMatches" role="region" aria-label="Suchergebnisse">'+resultsMarkup()+'</div>'+
    (['etf','stock','fund'].includes(state.kind)?'<button type="button" class="btn outline wizard-lookup" id="wizardExternalSearch">Online suchen</button>':'')+
    '<div class="wizard-manual"><strong>Anlagedaten</strong><div class="field-row">'+
    input('wizardName','Bezeichnung',state.name,'required maxlength="110"')+
    input('wizardSymbol','Ticker / Symbol',state.symbol,'maxlength="32"')+'</div>'+
    (state.kind==='crypto'?input('wizardCoinId','CoinGecko-ID (optional)',state.coinId,'maxlength="110"'):
     ['etf','stock','fund'].includes(state.kind)?input('wizardIsin','ISIN (optional)',state.isin,'maxlength="20"'):'')+
    (state.kind==='crypto'?'':('<label class="field"><span>'+ (state.kind==='cash'?'Kontowährung':'Kurswährung') +'</span><select id="wizardCurrency">'+opts(currencies.map(x=>[x,x]),state.currency,'Währung wählen')+'</select></label>'))+
    '<details class="advanced-apis"><summary>Weitere Angaben zur Börsennotierung</summary>'+
    input('wizardExchange','Handelsplatz',state.exchange,'maxlength="60"')+
    input('wizardMic','Börsen-MIC',state.mic,'maxlength="8"')+
    input('wizardEodhd','EODHD-Börsenkürzel',state.eodhdSymbol,'maxlength="45"')+
    input('wizardFmp','FMP-Börsenkürzel',state.fmpSymbol,'maxlength="45"')+
    input('wizardTV','TradingView-Symbol',state.tradingViewSymbol,'maxlength="48"')+'</details></div>'+catalogTools+'</section>'+holdings+advanced;
  shell(fields,'Position hinzufügen');
  const bind={wizardName:'name',wizardSymbol:'symbol',wizardIsin:'isin',wizardCoinId:'coinId',wizardExchange:'exchange',wizardMic:'mic',wizardEodhd:'eodhdSymbol',wizardFmp:'fmpSymbol',wizardTV:'tradingViewSymbol'};
  Object.entries(bind).forEach(([id,key])=>$(id)?.addEventListener('input',x=>updateValue(key,x.target.value)));
  $('wizardKind').addEventListener('change',x=>{state.kind=x.target.value;state.currency='EUR';state.walletEnabled=false;state.walletOpen=false;state.query='';state.results=[];state.name='';state.isin='';state.coinId='';state.symbol='';state.providerType=defaultProviderType(state.kind);[state.accountName,state.accountType]=defaultAcc(state.kind);render();if(state.kind==='crypto')loadCoins();});
  $('wizardCurrency')?.addEventListener('change',x=>state.currency=x.target.value);
  $('wizardQuery').addEventListener('input',x=>{state.query=x.target.value;updateResults();if(state.kind==='crypto'&&state.query.trim().length>=2)loadCoins({all:true});});
  $('wizardMatches').addEventListener('click',x=>{
   const b=x.target.closest('[data-wizard-pick]');if(!b)return;
   const item=state.results[Number(b.dataset.wizardPick)];if(!item)return;
   state.name=item.name;state.symbol=item.symbol||'';state.isin=item.isin||'';state.coinId=item.coinId||'';
   state.exchange=item.exchange||'';state.mic=item.mic||'';
   state.eodhdSymbol=item.eodhdSymbol||'';state.fmpSymbol=item.fmpSymbol||'';state.tradingViewSymbol=item.tradingViewSymbol||'';
   state.currency=item.currency||'';state.query='';render();
  });
  $('wizardDirectoryImport')?.addEventListener('click',()=>$('wizardDirectoryFile')?.click());
  $('wizardDirectoryFile')?.addEventListener('change',async event=>{
   const file=event.target.files?.[0];event.target.value='';
   if(!file)return;
   if(file.size>MAX_DIRECTORY_BYTES)return error('Verzeichnis überschreitet 24 MB. Bitte kleinere CSV/TXT-Datei wählen.');
   try{
    let raw=await file.text();
    if(raw.includes('\uFFFD'))raw=new TextDecoder('windows-1252').decode(await file.arrayBuffer());
    const catalog=parseSecurityDirectory(raw,{filename:file.name});
    await saveSecurityDirectory(catalog);
    directories=await loadSecurityDirectories();
    updateResults();
    const status=$('wizardDirectoryStatus');if(status)status.textContent=directorySummary();
    notify(catalog.entries.length+' Instrumente lokal übernommen ('+catalog.source+'). '+catalog.skipped+' ungültige/inaktive Einträge übersprungen. Börsenzuordnung und Währung vor der Auswahl prüfen.');
   }catch(ex){error('Verzeichnisimport: '+String(ex.message||ex).slice(0,220));}
  });
  $('wizardExternalSearch')?.addEventListener('click',externalSearch);
  $('wizardAdvanced')?.addEventListener('toggle',event=>{state.advancedOpen=event.target.open;});
  $('wizardEconomic')?.addEventListener('toggle',event=>{state.economicOpen=event.target.open;});
  $('wizardWalletAdvanced')?.addEventListener('toggle',event=>{state.walletOpen=event.target.open;});
  for(const [id,key] of Object.entries({wizardCostBasis:'costBasisEUR',wizardNotes:'notes',wizardEconomicRole:'economicRole',wizardValuationMode:'valuationMode',wizardRepresented:'representedByPositionId',wizardWalletAddress:'walletAddress',wizardWalletContract:'walletContract',wizardWalletDecimals:'walletDecimals',wizardWalletChainId:'walletChainId',wizardWalletHdType:'walletHdType'})){
   $(id)?.addEventListener('input',event=>state[key]=event.target.value);
   $(id)?.addEventListener('change',event=>state[key]=event.target.value);
  }
  const updateWalletFields=()=>{
   if(!$('wizardWalletChain'))return;
   const chain=$('wizardWalletChain').value;
   $('wizardWalletContractWrap').classList.toggle('hidden',!['erc20','spl','xrp-token','sol-stake','sonic-stake','cosmos-stake','cosmos-unbonding'].includes(chain));
   $('wizardWalletDecimalsWrap').classList.toggle('hidden',!['erc20','spl','xrp-token'].includes(chain));
   $('wizardWalletChainIdWrap').classList.toggle('hidden',!['evm','erc20'].includes(chain));
   $('wizardWalletHdWrap').classList.toggle('hidden',chain!=='btc-hd');
  };
  $('wizardWalletEnabled')?.addEventListener('change',event=>{
   state.walletEnabled=event.target.checked;
   $('wizardWalletFields').classList.toggle('hidden',!state.walletEnabled);
  });
  $('wizardWalletChain')?.addEventListener('change',event=>{state.walletChain=event.target.value;updateWalletFields();});
  updateWalletFields();
  $('wizardProvider').addEventListener('change',event=>{
   state.providerId=event.target.value;state.accountId=state.providerId==='__new__'?'__new__':'';
   state.providerName='';state.accountName=defaultAcc(state.kind)[0];
   state.accountType=defaultAcc(state.kind)[1];state.providerType=defaultProviderType(state.kind);render();
  });
  $('wizardAccount')?.addEventListener('change',event=>{state.accountId=event.target.value;render();});
  for(const [id,key] of Object.entries({wizardProviderName:'providerName',wizardProviderType:'providerType',wizardAccountName:'accountName',wizardAccountType:'accountType',wizardAccountCurrency:'accountCurrency'})){
   $(id)?.addEventListener('input',event=>state[key]=event.target.value);
   $(id)?.addEventListener('change',event=>state[key]=event.target.value);
  }
  dialog.querySelectorAll('[name=wizardMode]').forEach(el=>el.addEventListener('change',()=>{state.mode=el.value;render();}));
  for(const [id,key] of Object.entries({wizardQuantity:'quantity',wizardDate:'date',wizardUnitPrice:'unitPrice',wizardFee:'feeEUR',wizardCurrentPrice:'currentPrice',wizardFX:'fxRate'})){
   $(id)?.addEventListener('input',event=>state[key]=event.target.value);
  }

  if(state.kind==='crypto'){updateResults();loadCoins();}
  if(!state.providerId)$('wizardProvider').focus();
 };
 const externalSearch=async()=>{
  const q=state.query.trim(),kind=state.kind;
  if(q.length<2){error('Bitte mindestens zwei Zeichen eingeben.');return;}
  if(!['etf','stock','fund'].includes(kind)){error('Externe Suche ist nur für Wertpapiere verfügbar. Kryptowährungen stehen im lokalen Katalog.');return;}
  const seq=++sequence;
  state.status='Externe Metadatensuche läuft …';state.results=[];updateResults();state.status='Externe Metadatensuche läuft …';$('wizardMatches').innerHTML=resultsMarkup();
  try{
   let found=null;
   if(lookupPublic)found=await lookupPublic(q);
   if(!found?.length&&lookupListings)found=await lookupListings(q);
   if(seq!==sequence||state.step!==1||state.query.trim()!==q)return;
   state.results=(found||[]).filter(x=>x.name&&x.symbol||x.name&&x.figi).map(x=>({
    ...x,kind,x:undefined,currency:x.currency||'',exchange:x.exchange||x.exchangeCode||'',
    mic:x.mic||'',isin:x.isin||'',symbol:x.symbol||x.ticker||''
   })).slice(0,30);
   state.status=state.results.length?'Externe Stammdaten – Identität und Handelsplatz vor Übernahme prüfen':'Keine überprüfbaren Treffer; manuell erfassen';
   $('wizardMatches').innerHTML=resultsMarkup();
  }catch(ex){
   if(seq!==sequence||state.step!==1)return;
   state.status='Suche nicht erreichbar: '+String(ex.message||ex).slice(0,140)+'. Manuelle Erfassung bleibt möglich.';
   $('wizardMatches').innerHTML=resultsMarkup();
  }
 };
 const renderSuccess=()=>{
  shell('<div class="wizard-success"><strong>Position gespeichert</strong><p>Bestand und Zuordnung wurden übernommen. Die Kursbewertung bleibt überprüfbar und verwendet keine erfundenen Kurse.</p><div class="toolbar-buttons"><button id="wizardMore" type="button" class="btn outline">Weitere Position hinzufügen</button><button id="wizardPortfolio" type="button" class="btn primary">Zum Portfolio</button></div></div>','Anlage hinzugefügt');
  $('wizardPrev').classList.add('hidden');
  $('wizardMore').addEventListener('click',()=>{state=fresh();sequence++;const m=getModel();state.providerId=m.providers[0]?.id||'__new__';state.accountId=m.accounts.find(a=>a.providerId===state.providerId)?.id||'__new__';render();});
  $('wizardPortfolio').addEventListener('click',close);
  $('wizardPortfolio').focus();
 };
 const error=message=>{const target=$('wizardError');if(target){target.textContent=String(message);target.classList.add('visible');}};
 const advance=async ()=>{
  if(state.busy||state.saved)return;
  if(!state.name.trim())return error('Bitte eine Anlage auswählen oder benennen.');
  if(state.kind!=='crypto'&&!state.currency)return error('Bitte die Währung auswählen.');
  if(['etf','fund','stock'].includes(state.kind)&&!state.isin&&!state.symbol)return error('Bitte ISIN oder Ticker angeben.');
  if(!state.providerId)return error('Bitte einen Anbieter auswählen.');
  if(state.providerId==='__new__'&&!state.providerName.trim())return error('Bitte den Anbieter benennen.');
  if(!state.accountId)return error('Bitte ein Konto oder Depot auswählen.');
  if(state.accountId==='__new__'&&!state.accountName.trim())return error('Bitte das Konto benennen.');
  state.busy=true;$('wizardNext').disabled=true;$('wizardNext').textContent='Speichere …';
  try{
   const output=buildAssetWizardDraft(getModel(),state);
   await onCommit(output);
   state.saved=true;renderSuccess();
  }catch(ex){state.busy=false;error(ex.message||String(ex));$('wizardNext').disabled=false;$('wizardNext').textContent='Position speichern';}
 };
 const render=()=>{if(!dialog.open)return;
  if(state.saved)return renderSuccess();
  renderOne();
 };
 const close=()=>{sequence++;if(dialog.open)dialog.close();opener?.focus?.();};
 dialog.addEventListener('cancel',ev=>{if(state.busy){ev.preventDefault();return;}sequence++;});
 dialog.addEventListener('close',()=>opener?.focus?.());
 return {open(){opener=document.activeElement;state=fresh();funds=loadFundCatalog();sequence++;
   const m=getModel(),preferred=m.accounts.find(a=>a.id===m.settings?.lastAccountId);
   const provider=m.providers.find(x=>x.id===preferred?.providerId)||m.providers[0];
   state.providerId=provider?.id||'__new__';
   const account=m.accounts.find(a=>a.id===preferred?.id&&a.providerId===provider?.id)||m.accounts.find(a=>a.providerId===provider?.id);
   state.accountId=provider?account?.id||'__new__':'__new__';
   dialog.showModal();render();
   void loadSecurityDirectories().then(list=>{
    if(!dialog.open)return;
    directories=list;
    if(state.step===1&&['stock','etf','fund','other'].includes(state.kind)){
     const status=$('wizardDirectoryStatus');if(status)status.textContent=directorySummary();
     updateResults();
    }
   }).catch(()=>{if(dialog.open){const status=$('wizardDirectoryStatus');if(status)status.textContent='Lokale Wertpapierlisten konnten nicht gelesen werden.';}});
   void loadFundCatalogPersistent().then(next=>{if(!next||!dialog.open)return;funds=next;
     if(state.step===1&&['etf','fund'].includes(state.kind)){
       // Existing locally imported fund references remain available without a misleading OeKB download control.
       updateResults();
     }
   });
 },close,getState:()=>({...state})};
}
