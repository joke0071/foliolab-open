import {escapeHTML,defaultSettings} from './model.js';
import {cryptoChoices,loadTopCrypto,loadAllCrypto,loadFundCatalog,loadFundCatalogPersistent,searchFundCatalog} from './instrument-catalog.js';
import {referenceSearch} from './reference-listings.js';
import {DIRECTORY_PAGE_LINKS,MAX_DIRECTORY_BYTES,parseSecurityDirectory,saveSecurityDirectory,loadSecurityDirectories,searchSecurityDirectories,directoryAge} from './security-catalog.js';
import {buildAssetWizardDraft} from './asset-wizard-core.js';
const e=escapeHTML;
const kinds=[['etf','ETF'],['stock','Aktie'],['fund','Fonds'],['crypto','Kryptowährung'],['cash','Guthaben'],['other','Sonstiges']];
const providerKinds=[['broker','Broker'],['bank','Bank'],['wallet','Wallet-Anbieter'],['other','Sonstiges']];
const accountKinds=[['securities','Wertpapierdepot'],['checking','Giro- / Verrechnungskonto'],['savings','Tages- / Festgeld'],['exchange','Kryptobörsenkonto'],['wallet','Kryptowallet'],['other','Sonstiges']];
const currencies=['EUR','USD','CHF','GBP','CAD','AUD','JPY','SEK','NOK'];
const today=()=>new Date().toISOString().slice(0,10);
const opts=(items,selected,placeholder='Bitte wählen')=>'<option value="">'+e(placeholder)+'</option>'+items.map(([id,label])=>'<option value="'+e(id)+'"'+(selected===id?' selected':'')+'>'+e(label)+'</option>').join('');
const input=(id,label,value='',attrs='')=>'<label class="field"><span>'+e(label)+'</span><input id="'+id+'" value="'+e(value)+'" '+attrs+'></label>';
const defaultAcc=kind=>kind==='crypto'?['Kryptowallet','wallet']:kind==='cash'?['Guthabenkonto','savings']:['Wertpapierdepot','securities'];
const defaultProviderType=kind=>kind==='crypto'?'wallet':kind==='cash'?'bank':'broker';
const fresh=()=>({step:1,kind:'etf',query:'',name:'',symbol:'',isin:'',coinId:'',currency:'EUR',exchange:'',mic:'',eodhdSymbol:'',fmpSymbol:'',tradingViewSymbol:'',
 providerId:'',accountId:'',providerName:'',providerType:'broker',accountName:'Wertpapierdepot',accountType:'securities',accountCurrency:'EUR',
 mode:'opening',quantity:'',date:today(),currentPrice:'',unitPrice:'',feeEUR:'',fxRate:'',results:[],status:'',busy:false,saved:false});
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
  '<div class="wizard-progress" aria-label="Fortschritt">'+[1,2,3].map((x,i)=>'<span class="'+(x===state.step?'is-current':x<state.step||state.saved?'is-done':'')+'">'+(i+1)+'</span>').join('')+'</div>'+
  '<div id="wizardFields">'+fields+'</div><div class="wizard-feedback" id="wizardError" role="alert" aria-live="polite"></div>'+
  '<div class="dialog-footer"><button class="btn light" type="button" id="wizardPrev">'+(state.step===1||state.saved?'Abbrechen':'Zurück')+'</button><button class="btn primary" type="button" id="wizardNext"'+(state.saved?' hidden':'')+'>'+(state.step===3?'Bestand speichern':'Weiter →')+'</button></div></div>';
  $('wizardClose').addEventListener('click',close);
  $('wizardPrev').addEventListener('click',()=>{if(state.step>1&&!state.saved){state.step--;render();}else close();});
  $('wizardNext')?.addEventListener('click',advance);
 };
 const resultsMarkup=()=>{
  const query=state.query.trim(),list=state.results||[];
  if(!query&&state.kind!=='crypto')return '<p class="small-help">Suche nach Fondsname, ISIN oder Ticker – oder lege eine Anlage manuell an.</p>';
  return '<div class="wizard-search-status" role="status">'+e(state.status||'')+'</div>'+
   (list.length?'<div class="wizard-matches">'+list.map((x,i)=>'<button type="button" data-wizard-pick="'+i+'" class="result-item"><span><strong>'+e(x.name)+'</strong><small>'+
    e([x.kind==='crypto'?'Krypto':x.kind==='stock'?'Aktie':x.kind==='fund'?'Fonds':x.kind==='other'?'Sonstiges':'ETF',x.isin,x.symbol,x.kind==='crypto'?x.id:''].filter(Boolean).join(' · '))+
    '</small></span><small>'+e([x.rank?'#'+x.rank:'',x.exchange,x.mic,x.currency,x.source].filter(Boolean).join(' · '))+'</small></button>').join('')+'</div>':
    '<p class="small-help">Keine Treffer in den verfügbaren Katalogen. Manuelle Eingabe bleibt möglich.</p>');
 };
 const updateResults=()=>{
  const q=state.query.trim();
  if(state.kind==='crypto'){
   state.results=cryptoChoices(q,{leaders,all:allCoins,limit:100});
   state.status=leaders.length?(!q?'CoinGecko · Top '+leaders.length+' nach Marktkapitalisierung (Live-Katalog, nur Metadaten)':
    'CoinGecko · Top '+leaders.length+(allCoins.length?' + '+allCoins.length+' weitere Coin-IDs':' · vollständiger Katalog wird bei Suche geladen')):
    (cryptoLoading?'CoinGecko Top 100 werden abgerufen …':'Offline-Auswahl · vollständige Liste vorübergehend nicht verfügbar');
  }else if(q.length>=2){
   const locals=referenceSearch(q).filter(x=>x.kind===state.kind);
   const matching=searchFundCatalog(q,state.kind,funds,100),securities=searchSecurityDirectories(q,state.kind,directories,100);
   const identified=new Set(),unique=[];
   for(const item of [...locals,...securities.results,...matching.results]){
    const key=[item.isin||item.symbol,item.symbol,item.mic,item.currency].join('|');
    if(identified.has(key))continue;
    identified.add(key);unique.push(item);
   }
   state.results=unique.slice(0,100);
   state.status=(directories.length?'Wertpapier-Verzeichnisse: '+securities.total+' Treffer · ':'')+
    (funds?'Fonds-CSV: '+matching.total+' Treffer · ':'')+
    'Referenznotierungen: '+locals.length+
    (unique.length>100?' · erste 100 Treffer – genauer suchen':'');
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
  const fields='<p class="dialog-intro">Welche Anlage möchtest du hinzufügen? Wähle einen Treffer oder erfasse die Daten selbst. Es werden keine Bestände oder Kurse übernommen.</p>'+
   '<label class="field"><span>Anlageklasse</span><select id="wizardKind">'+kindChoices+'</select></label>'+
   '<label class="field"><span>Anlage suchen</span><input type="search" id="wizardQuery" value="'+e(state.query)+'" autocomplete="off" placeholder="Name, ISIN, Ticker oder Coin"></label>'+
   '<div id="wizardMatches" role="region" aria-label="Suchergebnisse">'+resultsMarkup()+'</div>'+
   '<button type="button" class="btn outline wizard-lookup" id="wizardExternalSearch">Externe Treffer suchen (optional)</button>'+
   (['etf','fund','stock','other'].includes(state.kind)?
    '<details id="wizardCatalogTools" class="wizard-catalog-tools"><summary>Wertpapierkatalog erweitern</summary><div class="wizard-catalog-content">'+
    '<p>Zusätzliche Wertpapiere aus offiziellen Dateien lokal ergänzen. Auf der Xetra-Seite „T7 (Xetra) Alle handelbaren Instrumente“ als CSV wählen.</p>'+
    '<a href="'+e(DIRECTORY_PAGE_LINKS.xetra)+'" target="_blank" rel="noopener noreferrer">Xetra-Downloadseite ↗</a>'+
    '<div class="wizard-source-inline"><a href="https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt" target="_blank" rel="noopener noreferrer">Nasdaq-Werte (.txt) ↗</a><a href="https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt" target="_blank" rel="noopener noreferrer">Weitere US-Börsen (.txt) ↗</a></div>'+
    '<div class="wizard-catalog-actions"><button id="wizardDirectoryImport" class="btn outline" type="button">CSV/TXT auswählen</button>'+
    '<input id="wizardDirectoryFile" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" class="hidden"></div>'+
    '<small id="wizardDirectoryStatus">'+e(directorySummary())+'</small><small>Quelle und Ausgabedatum prüfen. Eine Abwicklungswährung aus einer Datei ist nicht automatisch die Kurswährung.</small></div></details>':'')+
   '<div class="wizard-manual"><strong>Anlage manuell hinzufügen</strong><div class="field-row">'+
   input('wizardName','Bezeichnung',state.name,'required maxlength="110"')+
   input('wizardSymbol','Ticker / Symbol',state.symbol,'maxlength="32"')+'</div>'+
   (state.kind==='crypto'?input('wizardCoinId','CoinGecko-ID (optional)',state.coinId,'maxlength="110"'):
    ['etf','stock','fund'].includes(state.kind)?input('wizardIsin','ISIN (optional)',state.isin,'maxlength="20"'):'')+
   (state.kind==='crypto'?'':('<label class="field"><span>'+ (state.kind==='cash'?'Kontowährung':'Kurswährung') +'</span><select id="wizardCurrency">'+opts(currencies.map(x=>[x,x]),state.currency,'Währung wählen')+'</select></label>'))+
   '<details class="advanced-apis"><summary>Erweiterte Einstellungen · Börsennotierung</summary>'+
   input('wizardExchange','Handelsplatz',state.exchange,'maxlength="60"')+
   input('wizardMic','Börsen-MIC',state.mic,'maxlength="8"')+
   input('wizardEodhd','EODHD-Börsenkürzel',state.eodhdSymbol,'maxlength="45"')+
   input('wizardFmp','FMP-Börsenkürzel',state.fmpSymbol,'maxlength="45"')+
   input('wizardTV','TradingView-Symbol',state.tradingViewSymbol,'maxlength="48"')+'</details></div>';
  shell(fields,'Welche Anlage möchtest du hinzufügen?');
  const bind={wizardName:'name',wizardSymbol:'symbol',wizardIsin:'isin',wizardCoinId:'coinId',wizardExchange:'exchange',wizardMic:'mic',wizardEodhd:'eodhdSymbol',wizardFmp:'fmpSymbol',wizardTV:'tradingViewSymbol'};
  Object.entries(bind).forEach(([id,key])=>$(id)?.addEventListener('input',x=>updateValue(key,x.target.value)));
  $('wizardKind').addEventListener('change',x=>{state.kind=x.target.value;state.currency='EUR';state.query='';state.results=[];state.name='';state.isin='';state.coinId='';state.symbol='';state.providerType=defaultProviderType(state.kind);[state.accountName,state.accountType]=defaultAcc(state.kind);render();if(state.kind==='crypto')loadCoins();});
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
  $('wizardExternalSearch').addEventListener('click',externalSearch);
  if(state.kind==='crypto'){updateResults();loadCoins();}
  $('wizardQuery').focus();
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
 const renderTwo=()=>{
  const m=getModel();
  const providerOptions=[...m.providers.map(x=>[x.id,x.name]),['__new__','+ Neuen Anbieter anlegen']];
  const selectedProvider=m.providers.find(p=>p.id===state.providerId);
  const accs=m.accounts.filter(a=>a.providerId===state.providerId);
  const accountOptions=[...accs.map(x=>[x.id,x.name]),['__new__','+ Neues Konto anlegen']];
  let fields='<p class="dialog-intro">Wo verwahrst du diese Anlage? Neue Anbieter und Konten werden erst beim abschließenden Speichern angelegt.</p>'+
   '<label class="field"><span>Anbieter</span><select id="wizardProvider">'+opts(providerOptions,state.providerId)+'</select></label>';
  if(state.providerId==='__new__')fields+='<div class="wizard-inline-new">'+input('wizardProviderName','Neuer Anbieter',state.providerName,'maxlength="80"')+'<label class="field"><span>Typ</span><select id="wizardProviderType">'+opts(providerKinds,state.providerType,'Typ').replace('<option value="">Typ</option>','')+'</select></label></div>';
  if(state.providerId)fields+='<label class="field"><span>Konto / Depot</span><select id="wizardAccount">'+opts(accountOptions,state.accountId)+'</select></label>';
  if(state.accountId==='__new__'&&state.providerId)fields+='<div class="wizard-inline-new">'+input('wizardAccountName','Neues Konto / Depot',state.accountName,'maxlength="100"')+
    '<label class="field"><span>Kontotyp</span><select id="wizardAccountType">'+opts(accountKinds,state.accountType,'Typ').replace('<option value="">Typ</option>','')+'</select></label>'+
    '<label class="field"><span>Kontowährung</span><select id="wizardAccountCurrency">'+opts(currencies.map(x=>[x,x]),state.accountCurrency,'Währung').replace('<option value="">Währung</option>','')+'</select></label></div>';
  shell(fields,'Wo verwahrst du diese Anlage?');
  $('wizardProvider').addEventListener('change',x=>{state.providerId=x.target.value;state.accountId='';state.accountName=defaultAcc(state.kind)[0];state.accountType=defaultAcc(state.kind)[1];if(state.providerId==='__new__')state.providerType=defaultProviderType(state.kind);render();});
  $('wizardAccount')?.addEventListener('change',x=>{state.accountId=x.target.value;render();});
  for(const [id,key] of Object.entries({wizardProviderName:'providerName',wizardProviderType:'providerType',wizardAccountName:'accountName',wizardAccountType:'accountType',wizardAccountCurrency:'accountCurrency'})){
   $(id)?.addEventListener('input',x=>state[key]=x.target.value);
   $(id)?.addEventListener('change',x=>state[key]=x.target.value);
  }
  if(!state.providerId)$('wizardProvider').focus();
  else if(state.providerId==='__new__')$('wizardProviderName').focus();
  else if(!state.accountId)$('wizardAccount').focus();
 };
 const renderThree=()=>{
  const cash=state.kind==='cash',buy=state.mode==='buy';
  const fields='<p class="dialog-intro">Ein Anfangsbestand ist keine historische Kaufbuchung. Für einen Kauf werden tatsächliche Transaktionsdaten im bestehenden Journal erfasst.</p>'+
   '<fieldset class="wizard-mode"><legend>Wie möchtest du deinen Bestand erfassen?</legend>'+
   '<label><input type="radio" name="wizardMode" value="opening"'+(!buy?' checked':'')+'> Aktueller Bestand</label>'+
   (!cash?'<label><input type="radio" name="wizardMode" value="buy"'+(buy?' checked':'')+'> Kauf erfassen</label>':'')+'</fieldset>'+
   '<div class="field-row">'+input('wizardQuantity',cash?'Kontostand ('+state.currency+')':'Stückzahl / Menge',state.quantity,'inputmode="decimal" required')+
   input('wizardDate',buy?'Kaufdatum':'Bestands- / Bewertungsdatum',state.date,'type="date" required max="'+today()+'"')+'</div>'+
   (buy?'<div class="field-row">'+input('wizardUnitPrice','Tatsächlicher Kaufpreis je Stück',state.unitPrice,'inputmode="decimal" required')+
    input('wizardFee','Gebühren in EUR (optional)',state.feeEUR,'inputmode="decimal"')+'</div>':'')+
   (!cash?input('wizardCurrentPrice',buy?'Aktueller Marktpreis (optional, nicht Kaufpreis)':'Aktueller Kurs je Stück (optional)',state.currentPrice,'inputmode="decimal"'):'')+
   (state.currency!=='EUR'?input('wizardFX','EUR je Einheit '+state.currency+' (manuell)',state.fxRate,'inputmode="decimal" required'):'')+
   '<p class="small-help">'+(buy?'Ohne aktuellen Kurs wird der Marktwert zunächst als unvollständig gekennzeichnet. Der Kaufpreis dient ausschließlich der Transaktion.':'Ein vergangenes Bestandsdatum erzeugt keinen rückdatierten Vermögens-Snapshot. Unbekannte Anschaffungskosten bleiben unbekannt.')+'</p>';
  shell(fields,'Wie möchtest du deinen Bestand erfassen?');
  dialog.querySelectorAll('[name=wizardMode]').forEach(x=>x.addEventListener('change',()=>{state.mode=x.value;render();}));
  for(const [id,key] of Object.entries({wizardQuantity:'quantity',wizardDate:'date',wizardUnitPrice:'unitPrice',wizardFee:'feeEUR',wizardCurrentPrice:'currentPrice',wizardFX:'fxRate'})){
   $(id)?.addEventListener('input',x=>state[key]=x.target.value);
  }
  $('wizardQuantity').focus();
 };
 const renderSuccess=()=>{
  shell('<div class="wizard-success"><strong>Position gespeichert</strong><p>Bestand und Zuordnung wurden übernommen. Die Kursbewertung bleibt überprüfbar und verwendet keine erfundenen Kurse.</p><div class="toolbar-buttons"><button id="wizardMore" type="button" class="btn outline">Weitere Position hinzufügen</button><button id="wizardPortfolio" type="button" class="btn primary">Zum Portfolio</button></div></div>','Anlage hinzugefügt');
  $('wizardPrev').classList.add('hidden');
  $('wizardMore').addEventListener('click',()=>{state=fresh();sequence++;render();});
  $('wizardPortfolio').addEventListener('click',close);
  $('wizardPortfolio').focus();
 };
 const error=message=>{const target=$('wizardError');if(target){target.textContent=String(message);target.classList.add('visible');}};
 const advance=()=>{
  if(state.busy||state.saved)return;
  if(state.step===1){
   if(!state.name.trim())return error('Bitte eine Anlage aus der Suche wählen oder manuell benennen.');
   if(state.kind!=='crypto'&&!state.currency)return error('Bitte Währung des Instruments ausdrücklich auswählen.');
   if(['etf','fund','stock'].includes(state.kind)&&!state.isin&&!state.symbol)return error('Für dieses Wertpapier bitte ISIN oder Ticker angeben.');
   state.step=2;render();return;
  }
  if(state.step===2){
   if(!state.providerId)return error('Bitte einen Anbieter wählen.');
   if(state.providerId==='__new__'&&!state.providerName.trim())return error('Bitte neuen Anbieternamen angeben.');
   if(!state.accountId)return error('Bitte ein Konto wählen oder neu anlegen.');
   if(state.accountId==='__new__'&&!state.accountName.trim())return error('Bitte neuen Kontonamen eingeben.');
   state.step=3;render();return;
  }
  state.busy=true;$('wizardNext').disabled=true;$('wizardNext').textContent='Speichere …';
  try{
   const output=buildAssetWizardDraft(getModel(),state);
   onCommit(output);
   state.saved=true;renderSuccess();
  }catch(ex){state.busy=false;error(ex.message||String(ex));$('wizardNext').disabled=false;$('wizardNext').textContent='Bestand speichern';}
 };
 const render=()=>{if(!dialog.open)return;
  if(state.saved)return renderSuccess();
  if(state.step===1)renderOne();else if(state.step===2)renderTwo();else renderThree();
 };
 const close=()=>{sequence++;if(dialog.open)dialog.close();opener?.focus?.();};
 dialog.addEventListener('cancel',ev=>{if(state.busy){ev.preventDefault();return;}sequence++;});
 dialog.addEventListener('close',()=>opener?.focus?.());
 return {open(){opener=document.activeElement;state=fresh();funds=loadFundCatalog();sequence++;dialog.showModal();render();
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
