import {blankModel,load,persist,createProvider,createPosition,totalEUR,valueEUR,snapshot,addBooking,gainSummary,backup,safeImport,defaultSettings,createAccount,suggestedAccountType,money,quant,escapeHTML,TYPES,uid,safeNumber} from './model.js';
import {POPULAR_COINS,coinCatalog,searchCatalog,cryptoPrices,searchSecurities,securityQuote,exchangeRateQuote,historicalExchangeRate,walletBalance,discoverWallet,PUBLIC_EVM_NETWORKS,evmContractPrices,walletBalanceExact} from './market.js';
import {svg} from './format.js';
import {renderSummaryTiles,renderProviderAccounts,drawInteractiveChart,attachChartInteractions} from './dashboard-ui.js';
import {scanBitcoinAccount} from './bitcoin-hd.js';
import {oldProviderQuote,valuationWarnings,valuationHeadline} from './valuation-status.js';
import {allocationBreakdown,renderAllocationDonut,attachAllocationInteractions} from './allocation-ui.js';
import {executeTransaction,TX_TYPES} from './transactions.js';
import {portfolioXirr,portfolioTwr,performanceIssues,modifiedDietz} from './performance.js';
import {NETWORKS,getAdapter} from './blockchain-adapters.js';
import {parseCSV,inferMapping,previewCSV,importCSV,CSV_FIELDS} from './csv-import.js';
import {ECONOMIC_ROLES,VALUATION_MODES,validateEconomicPosition} from './defi.js';
import {encryptBackup,decryptBackup,isEncryptedBackup} from './crypto-backup.js';
let model,loadFailure=null;try{model=load();}catch(e){loadFailure=e;model=blankModel();}let page='dashboard',filter='all',range='all',catalog=POPULAR_COINS.slice(),fullCatalog=false,editor=null,toastTimer=null,installPrompt=null,busy=false,positionLimit=100,bookingLimit=100;
const $=id=>document.getElementById(id), esc=escapeHTML;
const PAGES=[['dashboard','Übersicht','dashboard','DEIN VERMÖGEN IM BLICK'],['history','Verlauf','history','VERMÖGEN IM ZEITVERLAUF'],['positions','Positionen','positions','DEINE ANLAGEN'],['bookings','Buchungen','bookings','MANUELL ERFASSEN'],['more','Mehr','more','EINSTELLUNGEN UND DATEN']];
const colors={etf:'#4f8662',stock:'#7da996',fund:'#b6cdb2',crypto:'#d2ac66',cash:'#7292bd',other:'#a2a3b2'};
const types={broker:'Broker',bank:'Bank',wallet:'Wallet-Anbieter',other:'Sonstiges'};
const accountTypes={securities:'Wertpapierdepot',checking:'Giro- / Verrechnungskonto',savings:'Tages- / Festgeld',exchange:'Kryptobörsenkonto',wallet:'Kryptowallet',other:'Sonstiges'};
const providerPresets=['Flatex','Trade Republic','Scalable Capital','Erste Bank','DADAT','Interactive Brokers','WeltSparen','C24','N26','Renault Bank direkt','Bitpanda','Binance','Coinbase','Kraken','Ledger','Trezor','MetaMask','Phantom'];
function backupCounter(){try{return Number(localStorage.getItem('foliolab-open-unbacked-changes')||0);}catch{return 0;}}
function backupDone(){try{localStorage.setItem('foliolab-open-last-backup-at',new Date().toISOString());localStorage.setItem('foliolab-open-unbacked-changes','0');}catch{}}
function save(){if(loadFailure)throw Error('Der lokale Datenstand konnte nicht geladen werden. Bitte zuerst eine gültige Sicherung wiederherstellen.');persist(model);try{localStorage.setItem('foliolab-open-unbacked-changes',String(Math.min(9999,backupCounter()+1)));}catch{}render();}
function notify(message,error=false){const box=$('toast');box.textContent=message;box.style.background=error?'#9f4840':'#1e5037';box.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.add('hidden'),4600);}
function empty(message){return `<div class="empty">${esc(message)}</div>`;}
function options(values,selected){return values.map(([id,label])=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(label)}</option>`).join('');}
function field(label,name,val='',type='text',attributes=''){return `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(val)}" ${attributes}></label>`;}
function go(next){if(!PAGES.some(x=>x[0]===next))next='dashboard';page=next;document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===next+'Page'));document.querySelectorAll('[data-page]').forEach(x=>{const active=x.dataset.page===next;x.classList.toggle('active',active);x.setAttribute('aria-current',active?'page':'false');});const [,title,,kicker]=PAGES.find(x=>x[0]===next);$('pageTitle').textContent=title;$('pageKicker').textContent=kicker;history.replaceState(null,'',location.pathname+(next==='dashboard'?'':`?page=${next}`));window.scrollTo({top:0,behavior:'instant'});render();}
function initNav(){const build=(mobile=false)=>PAGES.map(([key,label,ico])=>`<button type="button" data-page="${key}" aria-label="${label}">${svg(ico)} <span>${label}</span></button>`).join('');$('sidebarNav').innerHTML=build();$('mobileNav').innerHTML=build(true);$('refreshIcon').innerHTML=svg('refresh',17);$('addIcon').innerHTML=svg('plus',17);$('folderIcon').innerHTML=svg('folder',26);$('settingsGear').innerHTML=svg('gear',19);document.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.page)));document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.go)));go(new URL(location.href).searchParams.get('page')||'dashboard');}
function render(){switch(page){case 'dashboard':renderDashboard();break;case 'history':renderHistory();break;case 'positions':renderPositions();break;case 'bookings':renderBookings();break;case 'more':renderSettings();break;}}
function renderDashboard(){const total=totalEUR(model),positions=model.positions.length,providers=model.providers.length,crypto=model.positions.filter(p=>p.kind==='crypto').reduce((sum,p)=>sum+valueEUR(p),0);$('totalValue').textContent=money(total);
  $('totalHint').textContent=valuationHeadline(valuationWarnings(model))||`${positions} Position${positions===1?'':'en'} bei ${providers} Anbieter${providers===1?'':'n'}`;
  const onboarding=$('onboarding');onboarding.classList.toggle('hidden',!!model.providers.length);if(!model.providers.length)onboarding.innerHTML='<strong>Willkommen bei Foliolab Open</strong><p>Starte mit einem Anbieter und Konto, einer öffentlichen Wallet oder einem vorhandenen Backup.</p><div class="toolbar-buttons"><button class="btn primary" data-action="start-provider">Anbieter hinzufügen</button><button class="btn outline" data-action="start-wallet">Wallet verbinden</button><button class="btn outline" data-action="start-import">Backup importieren</button></div>';
   $('summaryStats').innerHTML=renderSummaryTiles(model,money,valueEUR,esc,dateLabel);
  const alloc=allocationBreakdown(model,valueEUR,TYPES);
  const previousKey=$('allocationLegend').querySelector('[data-allocation-key][aria-pressed="true"]')?.dataset.allocationKey||null;
  const pie=renderAllocationDonut(alloc,{money,esc,colors,netTotal:total,selectedKey:previousKey});
  $('donut').innerHTML=pie.donut;
  $('allocationLegend').innerHTML=pie.legend;
  $('dashboardPage').dataset.hasLiabilities=String(alloc.liabilities>0);
  attachAllocationInteractions($('dashboardPage'),{slices:alloc.slices,money,netTotal:total,initialIndex:pie.activeIndex});
  const expanded=new Set([...$('providerOverview').querySelectorAll('details[open][data-provider-id]')].map(x=>x.dataset.providerId));
  $('providerOverview').innerHTML=renderProviderAccounts(model,money,valueEUR,esc,expanded);
  $('miniChart').innerHTML=drawChart(model.snapshots.slice(-18));attachChartInteractions($('miniChart'));}
function dateLabel(date){const d=new Date(date+'T12:00:00');return Number.isNaN(d.getTime())?date:d.toLocaleDateString('de-AT',{day:'2-digit',month:'short',year:'numeric'});}
function drawChart(samples){return drawInteractiveChart(samples,{money,esc,dateLabel});}
function renderHistory(){const info=$('performanceInfo');const start=model.performanceFlowTrackingSince,end=model.snapshots.at(-1)?.date;const rate=start&&end&&start!==end?portfolioXirr(model,start,end):null;const timeWeighted=start&&end&&start!==end?portfolioTwr(model,start,end):null;const issues=start&&end&&start!==end?performanceIssues(model,start,end):[];
 info.textContent=rate==null?'XIRR noch nicht belastbar: '+(issues.length?issues.join(' · '):'Startwert, externe Cashflows oder ausreichend bewertete Endpunkte fehlen.'):`XIRR (geldgewichtet, jährlich): ${new Intl.NumberFormat('de-AT',{style:'percent',maximumFractionDigits:2}).format(rate)} · ${dateLabel(start)} bis ${dateLabel(end)}.`;
 info.textContent+=timeWeighted==null?' · TWR: nicht berechenbar (exakte Bewertungen vor/nach externen Geldflüssen fehlen oder Stichtage unvollständig).':` · TWR (cashflowfreier Bewertungszeitraum): ${new Intl.NumberFormat('de-AT',{style:'percent',maximumFractionDigits:2}).format(timeWeighted)}.`;
 const now=new Date();let data=model.snapshots;const days={month:31,quarter:92,year:366}[range];if(days){const cut=new Date(now.getTime()-days*864e5).toISOString().slice(0,10);data=data.filter(x=>x.date>=cut);} $('historyChart').innerHTML=drawChart(data);attachChartInteractions($('historyChart'));document.querySelectorAll('[data-range]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.range===range));$('snapshotList').innerHTML=model.snapshots.length?model.snapshots.slice().reverse().map(s=>`<div class="history-row"><div><div class="history-title">${esc(dateLabel(s.date))}</div><div class="history-sub">${esc([s.note||'Portfolio-Stand',s.valuationStatus==='legacy-unverified'?'historisch ungeprüft':s.valuationStatus==='manual'?'manuell bestätigt':''].filter(Boolean).join(' · '))}</div></div><div class="holding-r"><strong class="history-amount">${money(s.total)}</strong><button class="row-btn" data-action="delete-snapshot" data-id="${esc(s.id)}" title="Stichtag löschen" aria-label="Stichtag löschen">${svg('trash',15)}</button></div></div>`).join(''):empty('Hier erscheint dein erster gespeicherter Stichtag.');}
function renderPositions(){const providers=model.providers.map(p=>[p.id,p.name]);$('positionFilters').innerHTML=[['all','Alle'],...providers].map(([id,label])=>`<button class="filter ${filter===id?'active':''}" data-filter="${esc(id)}">${esc(label)}</button>`).join('');const filtered=model.positions.filter(p=>filter==='all'||p.providerId===filter);$('positionList').innerHTML=filtered.length?filtered.slice().sort((a,b)=>valueEUR(b)-valueEUR(a)).slice(0,positionLimit).map(p=>{const provider=model.providers.find(x=>x.id===p.providerId);const account=model.accounts.find(a=>a.id===p.accountId);const updated=p.updatedAt?` · ${esc(dateLabel(p.updatedAt.slice(0,10)))}`:'';const stale=oldProviderQuote(p);const caption=`${esc(provider?.name||'Unbekannt')}${account?' · '+esc(account.name):''} · ${esc(p.quantityExact??String(p.quantity))} × ${money(p.price,p.currency)}${p.currency!=='EUR'?' · Wechselkurs '+quant(p.fxRate):''}${updated}${p.quoteSource?' · Kurs: '+esc(p.quoteSource):''}${p.quoteAsOf?' · '+esc(p.quoteAsOf.slice(0,10)):''}`;return `<div class="holding-row"><div class="holding-l"><div class="holding-mark">${svg(p.wallet?.enabled?'wallet':'positions',21)}</div><div class="holding-info"><div class="holding-name" title="${esc(p.name)}">${esc(p.name)}</div><div class="holding-note">${caption}</div><div><span class="tag">${esc(TYPES[p.kind])}</span>${p.symbol?`<span class="tag neutral">${esc(p.symbol)}</span>`:''}${p.valuationMode==='excluded'?'<span class="tag warn">Nicht doppelt summiert</span>':p.valuationMode==='liability'?'<span class="tag warn">Verbindlichkeit</span>':''}${p.wallet?.enabled?'<span class="tag">Wallet verbunden</span>':p.managementSource==='transactions'?'<span class="tag neutral">Transaktionsbasiert</span>':''}${stale||p.priceStatus?`<span class="tag warn">${esc(p.priceStatus||(stale?'Kurs veraltet':'Kurs prüfen'))}</span>`:''}</div></div></div><div class="holding-r"><strong class="holding-money">${money(valueEUR(p))}</strong><button class="row-btn" data-action="edit-position" data-id="${esc(p.id)}" title="Position bearbeiten" aria-label="Position bearbeiten">${svg('pencil',15)}</button></div></div>`;}).join('')+(filtered.length>positionLimit?`<div class="empty"><button type="button" class="btn outline" data-action="more-positions">Weitere ${Math.min(100,filtered.length-positionLimit)} Positionen anzeigen</button></div>`:''):empty(filter==='all'?'Noch keine Positionen. Erstelle zuerst unter „Mehr“ einen Anbieter und füge deine Anlage hinzu.':'Keine Positionen bei diesem Anbieter.');}
function renderBookings(){$('bookingList').innerHTML=model.bookings.length?model.bookings.slice(0,bookingLimit).map(b=>`<div class="history-row"><div><div class="history-title">${esc(b.positionName||model.positions.find(p=>p.id===b.positionId)?.name||'Entfernte Position')}</div><div class="history-sub">${esc(dateLabel(b.date))} · ${esc(TX_TYPES[b.type]||b.type)} · ${esc(b.quantityExact??String(b.quantity))}${b.targetPositionId?' · Zielposition: '+esc(model.positions.find(p=>p.id===b.targetPositionId)?.name||'historische Position'):''}${b.notes?' · '+esc(b.notes):''}</div></div><div class="holding-r"><strong class="history-amount">${Number.isFinite(b.amountEUR)?money(b.amountEUR):'–'}</strong></div></div>`).join('')+(model.bookings.length>bookingLimit?`<div class="empty"><button type="button" class="btn outline" data-action="more-bookings">Weitere Vorgänge anzeigen</button></div>`:''):empty('Noch keine Vorgänge erfasst.');}
function renderSettings(){const settings=$('providerSettings');settings.innerHTML=model.providers.length?model.providers.map(p=>`<div class="setting-provider"><div><strong>${esc(p.name)}</strong><small>${esc(types[p.type]||types.other)} · ${model.accounts.filter(a=>a.providerId===p.id).length} Konto/Konten</small></div><div class="settings-provider-actions"><button class="row-btn" data-action="edit-provider" data-id="${esc(p.id)}" title="Bearbeiten" aria-label="Bearbeiten">${svg('pencil',15)}</button><button class="row-btn" data-action="delete-provider" data-id="${esc(p.id)}" title="Löschen" aria-label="Löschen">${svg('trash',15)}</button></div></div>
${model.accounts.filter(a=>a.providerId===p.id).map(a=>`<div class="account-entry"><span>${esc(a.name)} <small>· ${esc(accountTypes[a.type]||accountTypes.other)}</small></span><button type="button" class="row-btn" data-action="edit-account" data-id="${esc(a.id)}" aria-label="Konto bearbeiten">${svg('pencil',15)}</button><button type="button" class="row-btn" data-action="delete-account" data-id="${esc(a.id)}" aria-label="Konto löschen">${svg('trash',15)}</button></div>`).join('')}`).join(''):empty('Noch kein Anbieter hinterlegt.');if(document.activeElement!==$('solanaRpc'))$('solanaRpc').value=model.settings.solanaRpc||'';const reminder=$('backupReminder');let last=0;try{last=Date.parse(localStorage.getItem('foliolab-open-last-backup-at')||'')||0;}catch{}reminder.classList.toggle('hidden',!(backupCounter()>=15&&Date.now()-last>30*864e5));}
function showDialog(title,kicker,html,onSave){editor={onSave};$('dialogTitle').textContent=title;$('dialogKicker').textContent=kicker;$('dialogFields').innerHTML=html;$('saveDialog').textContent='Speichern';$('saveDialog').disabled=false;$('editDialog').showModal();}
function closeDialog(){$('editDialog').close();editor=null;}
function openProvider(p){showDialog(p?'Anbieter bearbeiten':'Anbieter hinzufügen','FREIE ANBIETERWAHL',`<p class="dialog-intro">Wähle einen Vorschlag oder gib einen eigenen Namen ein.</p><datalist id="providerSuggestions">${providerPresets.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>${field('Anbietername','name',p?.name||'','text','required maxlength="80" list="providerSuggestions"')}<label class="field"><span>Typ</span><select name="type">${options(Object.entries(types),p?.type||'broker')}</select></label>`,(v)=>{const x=createProvider({...v,id:p?.id});if(p)model.providers=model.providers.map(a=>a.id===p.id?x:a);else model.providers.push(x);save();notify('Anbieter gespeichert.');});}
function openAccount(a,defaultProviderId){
 if(!model.providers.length){openProvider();notify('Bitte zuerst einen Anbieter anlegen.');return;}
 const providerId=a?.providerId||defaultProviderId||model.providers[0].id;
 showDialog(a?'Konto bearbeiten':'Konto hinzufügen','KONTEN UND DEPOTS',`
 <label class="field"><span>Anbieter</span><select name="providerId">${options(model.providers.map(p=>[p.id,p.name]),providerId)}</select></label>
 ${field('Kontoname','name',a?.name||'Mein Depot','text','required maxlength="100"')}
 <div class="field-row"><label class="field"><span>Kontotyp</span><select name="type">${options(Object.entries(accountTypes),a?.type||'securities')}</select></label>
 <label class="field"><span>Kontowährung</span><select name="currency">${options(['EUR','USD','CHF','GBP','CAD','AUD','JPY','SEK','NOK'].map(c=>[c,c]),a?.currency||'EUR')}</select></label></div>
 ${a?'':field('Optionales EUR-Startguthaben','initialBalance','','text','inputmode="decimal" placeholder="z. B. 2500 (nur EUR)"')}`,v=>{
 if(a&&a.providerId!==v.providerId&&model.positions.some(p=>p.accountId===a.id))throw Error('Konto mit Positionen kann nicht zu einem anderen Anbieter verschoben werden.');
 const init=String(v.initialBalance||'').trim();
 if(init&&v.currency!=='EUR')throw Error('Fremdwährungsguthaben bitte als Position mit eigenem EUR-Wechselkurs hinzufügen.');
 const balance=init?safeNumber(init,0):0;
 const next=createAccount({...v,id:a?.id},model);
 if(a)model.accounts=model.accounts.map(x=>x.id===a.id?next:x);else model.accounts.push(next);
 if(!a&&balance>0)model.positions.push(createPosition({providerId:next.providerId,accountId:next.id,kind:'cash',name:'EUR Guthaben',symbol:'EUR',quantity:init,price:1,currency:'EUR'},model));
 model.settings.lastAccountId=next.id;save();notify('Konto gespeichert.');
 });
}
function posForm(p){const providerOptions=model.providers.map(x=>[x.id,x.name]);const preferred=model.accounts.find(a=>a.id===model.settings.lastAccountId&&a.providerId===(p?.providerId||model.providers[0]?.id));const currentAccount=p?.accountId||preferred?.id||model.accounts.find(a=>a.providerId===(p?.providerId||model.providers[0]?.id))?.id;const curr=p?.currency||'EUR';const kind=p?.kind||'etf';const coin=p?.coinId||'';const w=p?.wallet;return `<p class="dialog-intro">Alle Anlagen werden manuell angelegt. Automatische Wertpapierkurse benötigen einen bestätigten Handelsplatz und die passende Kurswährung.</p>
<div class="field-row"><label class="field"><span>Anbieter</span><select name="providerId" id="positionProvider" required>${options(providerOptions,p?.providerId||model.providers[0]?.id)}</select></label><label class="field"><span>Konto / Depot</span><select name="accountId" id="positionAccount" required>${options(model.accounts.filter(a=>a.providerId===(p?.providerId||model.providers[0]?.id)).map(a=>[a.id,a.name]),currentAccount)}</select></label></div>
<div class="field-row"><label class="field"><span>Anlageklasse</span><select name="kind" id="positionKind">${options(Object.entries(TYPES),kind)}</select></label>${field('Name / Bezeichnung','name',p?.name||'','text','required maxlength="110"')}</div>
<div class="field-row">${field('Ticker / Symbol','symbol',p?.symbol||'','text','maxlength="32"')}${field('ISIN (optional)','isin',p?.isin||'','text','maxlength="20"')}</div><div id="exchangeField"><div class="field-row">${field('Handelsplatz (z. B. Xetra)','exchange',p?.exchange||'','text','maxlength="60"')}${field('Börsen-MIC (optional, z. B. XETR)','mic',p?.mic||'','text','maxlength="8"')}</div></div>
<div class="field-row three">${field('Stückzahl / Bestand','quantity',p?.quantityExact??p?.quantity??0,'text',p?.managementSource==='transactions'?'readonly aria-label="Über Buchungen verwalteter Bestand"':'inputmode="decimal" required')}${field('Kurs pro Stück','price',p?.price??0,'number','step="any" min="0" required')}<label class="field"><span>Kurswährung</span><select name="currency" id="positionCurrency">${options(['EUR','USD','CHF','GBP','CAD','AUD','JPY','NOK','SEK','DKK','PLN','CZK','HUF','NZD','SGD'].map(x=>[x,x]),curr)}</select></label></div>
<div id="fxWrap">${field('EUR je Einheit Kurswährung (z. B. USD → EUR)','fxRate',p?.fxRate??1,'number','step="any" min="0.00000001"')}</div>
<div class="dialog-group" id="securityGroup"><strong>Wertpapier finden (optional)</strong><p class="dialog-intro">Mit optionalem Twelve-Data-Key nach Name oder Ticker suchen. Ohne Key sämtliche Felder manuell erfassen.</p><div class="inline-actions"><label class="field"><span>Suche</span><input id="securityQuery" placeholder="z. B. VWCE, S&P 500"></label><button type="button" class="btn outline" id="securitySearch">Suchen</button></div><div class="security-results hidden" id="securityResults"></div></div>
<div class="dialog-group" id="coinGroup"><strong>CoinGecko-Zuordnung (für automatische Kryptokurse)</strong>${field('CoinGecko-ID','coinId',coin,'text','placeholder="z. B. bitcoin, ethereum, solana"')}<div class="inline-actions"><label class="field"><span>Coin suchen</span><input type="search" id="coinQuery" placeholder="Name oder Symbol"></label><button type="button" class="btn outline" id="coinCatalogLoad">Alle Coins laden</button></div><div class="coin-results hidden" id="coinResults"></div></div>
<div class="dialog-group" id="walletGroup"><label class="checkbox-line"><input type="checkbox" name="walletEnabled" id="walletEnabled" ${w?.enabled?'checked':''}> Bestand per öffentlicher Wallet-Adresse abfragen</label><p class="dialog-intro">Nur Watch-only. Niemals private Schlüssel oder Wiederherstellungswörter eingeben. Bitcoin-HD unterstützt öffentliche xpub/ypub/zpub-Account-Keys. Ledger kann auch für Native SegWit (bc1q…) einen xpub exportieren; wähle bei Bedarf den passenden Adresstyp. Kein Taproot (bc1p).</p><div id="walletDetails"><label class="field"><span>Netzwerk</span><select name="walletChain" id="walletChain">${options([['btc','Bitcoin'],['btc-hd','Bitcoin HD (xpub / ypub / zpub)'],['xrp','XRP Ledger (XRP)'],['xrp-token','XRP Trust-Line Token'],['evm','EVM-Native Coin (Ethereum u. a.)'],['erc20','EVM-Token / ERC-20'],['sol','Solana (SOL)'],['spl','Solana Token / SPL']],w?.chain||'btc')}</select></label>${field('Öffentliche Adresse','walletAddress',w?.address||'','text','maxlength="180" autocomplete="off" placeholder="Wallet-Adresse (kein privater Schlüssel)"')}<div id="walletHdField"><label class="field"><span>Bitcoin-HD-Adresstyp</span><select name="walletHdType" id="walletHdType">${options([['auto','Automatisch erkennen (Ledger: Native SegWit zuerst)'],['p2wpkh','Native SegWit (bc1q…)'],['p2sh-p2wpkh','Nested SegWit (3…)'],['p2pkh','Legacy (1…)']],w?.addressType||'auto')}</select></label><p class="small-help">Der xpub-Präfix allein bestimmt bei Ledger nicht den Adresstyp. Ohne nachweisbaren Verlauf wird der Bestand bei automatischer Erkennung nicht auf null gesetzt.</p></div><div id="tokenFields">${field('Token-Contract / Mint','walletContract',w?.contract||'','text','maxlength="120"')}${field('Token-Dezimalstellen','walletDecimals',w?.decimals??18,'number','min="0" max="30" step="1"')}</div><div id="chainIdField">${field('EVM Chain-ID','walletChainId',w?.chainId??1,'number','min="1" step="1"')}</div></div></div>
<details class="advanced-apis"><summary>Einstandswert (optional)</summary><p class="small-help">Nur den tatsächlich bekannten gesamten Anschaffungswert des aktuellen Bestands in EUR eintragen. Leer lassen, wenn unbekannt.</p>${field('Einstandswert in EUR','costBasisEUR',p?.costBasisEUR??'','number','min="0" step="any" placeholder="Unbekannt"')}</details>
<details class="advanced-apis" id="defiPosition"><summary>Wirtschaftliche Position / DeFi (optional)</summary><p class="small-help">Sicherheiten, Liquid Staking und derivative Positionen bewusst zuordnen. Kein automatisches Entfernen oder Bewerten.</p><label class="field"><span>Wirtschaftliche Funktion</span><select name="economicRole">${options([['standard','Normal'],['collateral','Hinterlegt / Collateral'],['liquid-staking','Liquid Staking'],['vault','Vault'],['liquidity-pool','Liquidity Pool'],['lending','Lending'],['borrowed','Geliehene Assets / Verbindlichkeit'],['wrapped','Wrapped Token']],p?.economicRole||'standard')}</select></label><label class="field"><span>In der Vermögenssumme</span><select name="valuationMode">${options([['included','Anrechnen'],['excluded','Nicht anrechnen (bereits durch andere Position repräsentiert)'],['liability','Als Verbindlichkeit abziehen']],p?.valuationMode||'included')}</select></label><label class="field"><span>Wird repräsentiert durch (optional)</span><select name="representedByPositionId">${options([['','Keine Zuordnung'],...model.positions.filter(x=>x.id!==p?.id).map(x=>[x.id,x.name])],p?.representedByPositionId||'')}</select></label></details>${field('Notiz (optional)','notes',p?.notes||'','text','maxlength="300"')}<div class="small-help">Kurse für Fremdwährungen werden nur mit einem gültigen EUR-Umrechnungskurs korrekt berücksichtigt. Wallet-Adressen werden beim Abruf an den jeweiligen Blockchain-Dienst gesendet.</div>${p?`<button type="button" class="danger-link" id="deletePosition">Position löschen</button>`:''}`;}
function refreshPositionAccounts(){const provider=$('positionProvider').value,kind=$('positionKind').value,select=$('positionAccount'),prev=select.value;const accounts=model.accounts.filter(a=>a.providerId===provider).sort((a,b)=>Number(b.type===suggestedAccountType(kind))-Number(a.type===suggestedAccountType(kind)));select.innerHTML=options(accounts.map(a=>[a.id,a.name]),accounts.some(a=>a.id===prev)?prev:accounts[0]?.id);}
function refreshPosForm(){const kind=$('positionKind').value,crypto=kind==='crypto';$('coinGroup').classList.toggle('hidden',!crypto);$('walletGroup').classList.toggle('hidden',!crypto);$('securityGroup').classList.toggle('hidden',!['etf','stock','fund'].includes(kind));$('exchangeField').classList.toggle('hidden',!['etf','stock','fund'].includes(kind));const coinCurrency=$('positionCurrency');if(crypto&&coinCurrency.value!=='EUR'){coinCurrency.value='EUR';} if(crypto){const currPos=$('fxWrap').querySelector('input');currPos.value=1;}$('fxWrap').classList.toggle('hidden',coinCurrency.value==='EUR'||crypto);$('walletDetails').classList.toggle('hidden',!$('walletEnabled').checked);const chain=$('walletChain').value;$('tokenFields').classList.toggle('hidden',!['erc20','spl'].includes(chain));$('chainIdField').classList.toggle('hidden',!['evm','erc20'].includes(chain));$('walletHdField').classList.toggle('hidden',chain!=='btc-hd');}
function openPosition(p){if(!model.providers.length){go('more');openProvider();notify('Lege zuerst einen Anbieter an.');return;}const target=p?.providerId||model.providers[0].id;if(!model.accounts.some(a=>a.providerId===target)){openAccount(null,target);notify('Lege zuerst ein Konto oder Depot an.');return;}showDialog(p?'Position bearbeiten':'Position hinzufügen','DEIN PORTFOLIO',posForm(p),(v)=>{const wallet=v.walletEnabled?{enabled:true,chain:v.walletChain,address:v.walletAddress,contract:v.walletContract,decimals:v.walletDecimals,chainId:v.walletChainId,addressType:v.walletHdType}:null;if(p?.managementSource==='transactions'){v.quantity=p.quantityExact??p.quantity;v.costBasisEUR=p.costBasisEUR;}const pos=createPosition({...v,id:p?.id,wallet,managementSource:p?.managementSource,updatedAt:p?.updatedAt,realizedPnLEUR:p?.realizedPnLEUR,
   costBasisExact:p&&String(v.costBasisEUR)===String(p.costBasisEUR)?p.costBasisExact:undefined,
   realizedPnLExact:p?.realizedPnLExact,
   priceExact:p&&String(v.price)===String(p.price)?p.priceExact:undefined,
   priceStatus:p&&String(v.price)===String(p.price)?p.priceStatus:null,
   quoteSource:p&&String(v.price)===String(p.price)?p.quoteSource:null,
   quoteAsOf:p&&String(v.price)===String(p.price)?p.quoteAsOf:null,
   quoteFetchedAt:p&&String(v.price)===String(p.price)?p.quoteFetchedAt:null,
   quoteQuality:p&&String(v.price)===String(p.price)?p.quoteQuality:null,
   fxRateExact:p&&String(v.fxRate)===String(p.fxRate)?p.fxRateExact:undefined,
   fxSource:p&&String(v.fxRate)===String(p.fxRate)?p.fxSource:null,
   fxRateDate:p&&String(v.fxRate)===String(p.fxRate)?p.fxRateDate:null,
   fxUpdatedAt:p&&String(v.fxRate)===String(p.fxRate)?p.fxUpdatedAt:null},model);validateEconomicPosition(pos,{positions:p?model.positions.map(a=>a.id===p.id?pos:a):[...model.positions,pos]});if(p)model.positions=model.positions.map(a=>a.id===p.id?pos:a);else model.positions.push(pos);model.settings.lastAccountId=pos.accountId;snapshot(model);save();notify('Position gespeichert.');});['positionKind','positionCurrency','walletEnabled','walletChain'].forEach(id=>$(id).addEventListener('change',()=>{if(id==='positionKind')refreshPositionAccounts();refreshPosForm();}));$('positionProvider').addEventListener('change',refreshPositionAccounts);refreshPositionAccounts();refreshPosForm();$('coinQuery').addEventListener('input',showCoinResults);$('coinCatalogLoad').addEventListener('click',loadCoins);$('securitySearch').addEventListener('click',lookupSecurity);$('securityQuery').addEventListener('input',()=>{clearTimeout(securityDebounce);const q=$('securityQuery').value.trim();if(q.length>=2&&model.settings.twelveKey)securityDebounce=setTimeout(lookupSecurity,420);});$('securityQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupSecurity();}});if(p)$('deletePosition').addEventListener('click',()=>{if(model.bookings.some(x=>x.positionId===p.id||x.targetPositionId===p.id)||model.journalEntries.some(e=>e.postings.some(x=>x.positionId===p.id)))return notify('Position hat Buchungen oder Journal-Einträge und kann nicht gelöscht werden.',true);if(model.positions.some(x=>x.representedByPositionId===p.id))return notify('Position wird von einer DeFi-Verknüpfung referenziert. Bitte zuerst die Verknüpfung lösen.',true);if(confirm('Diese unverbuchte Position wirklich löschen?')){model.positions=model.positions.filter(x=>x.id!==p.id);model.openingPositions=model.openingPositions.filter(x=>x.positionId!==p.id);snapshot(model);save();closeDialog();notify('Position gelöscht.');}});}
function showCoinResults(){const area=$('coinResults');const term=$('coinQuery').value;const results=searchCatalog(catalog,term);area.classList.remove('hidden');area.innerHTML=results.length?results.map(c=>`<button class="result-item" data-coin="${esc(c.id)}" data-symbol="${esc(c.symbol)}" data-name="${esc(c.name)}" type="button"><span><strong>${esc(c.symbol)}</strong> · ${esc(c.name)}</span><small>${esc(c.id)}</small></button>`).join(''):empty('Kein Treffer. CoinGecko-ID kann auch manuell eingetragen werden.');area.querySelectorAll('[data-coin]').forEach(b=>b.addEventListener('click',()=>{const form=$('editorForm');form.elements.coinId.value=b.dataset.coin;if(!form.elements.name.value)form.elements.name.value=b.dataset.name;form.elements.symbol.value=b.dataset.symbol;form.elements.currency.value='EUR';refreshPosForm();area.classList.add('hidden');}));}
async function loadCoins(){const button=$('coinCatalogLoad');button.disabled=true;button.textContent='Lade Katalog …';try{catalog=await coinCatalog(model.settings.coinGeckoKey);fullCatalog=true;notify(`${catalog.length} Kryptowährungen verfügbar.`);showCoinResults();}catch(e){notify(`Katalog nicht erreichbar: ${e.message}`,true);}finally{button.disabled=false;button.textContent=fullCatalog?'Katalog aktualisieren':'Alle Coins laden';}}
const securityCache=new Map();let lookupSequence=0,securityDebounce=null;
async function lookupSecurity(){const sequence=++lookupSequence,area=$('securityResults'),term=$('securityQuery').value.trim();if(!term)return notify('Suchbegriff eingeben.',true);area.classList.remove('hidden');area.innerHTML=empty('Suche läuft …');try{let results=securityCache.get(term.toLowerCase());if(!results){results=await searchSecurities(term,model.settings.twelveKey);if(securityCache.size>30)securityCache.clear();securityCache.set(term.toLowerCase(),results);}if(sequence!==lookupSequence)return;area.innerHTML=results.length?results.map((a,i)=>`<button class="result-item" type="button" data-security="${i}"><span><strong>${esc(a.symbol||'')}</strong> · ${esc(a.instrument_name||a.name||'')}</span><small>${esc([a.exchange,a.mic_code,a.currency].filter(Boolean).join(' · ')||a.country||'')}</small></button>`).join(''):empty('Keine Treffer. Du kannst die ETF-Daten manuell erfassen.');area.querySelectorAll('[data-security]').forEach(b=>b.addEventListener('click',()=>{const a=results[Number(b.dataset.security)],f=$('editorForm').elements;f.symbol.value=a.symbol||'';f.name.value=a.instrument_name||a.name||'';f.exchange.value=a.exchange||'';f.mic.value=a.mic_code||'';if(a.isin)f.isin.value=a.isin;if(Array.from(f.currency.options).some(o=>o.value===a.currency))f.currency.value=a.currency;refreshPosForm();area.classList.add('hidden');}));}catch(e){area.innerHTML=empty(e.message);}}

// Wallet-import is deliberately separate from manual asset creation. The user
// reviews all discovered assets before anything is persisted.
let scannedWalletAssets=[];let scannedWalletKey='';
const walletScanIdentity=(network,address,addressType='auto')=>network+'|'+address+'|'+(network==='btc-hd'?addressType:'');
function openWalletImport(){
  scannedWalletAssets=[];scannedWalletKey='';
  const networks=NETWORKS.filter(n=>n.mode!=='manual').map(n=>[n.id,n.name+' · '+n.note]);
  const providers=[['__new__','+ Neue Wallet erstellen'],...model.providers.map(p=>[p.id,p.name])];
  showDialog('Wallet hinzufügen','ÖFFENTLICHE ADRESSE · WATCH-ONLY',`<p class="dialog-intro">Eine öffentliche Wallet-Adresse eingeben und vorhandene Coins automatisch erkennen lassen. <strong>Kein API-Key, kein Login und keine Berechtigung zum Senden.</strong></p>
    <label class="field"><span>Blockchain</span><select id="scanNetwork" name="network">${options(networks,'1')}</select></label>
    <div class="field hidden" id="scanHdField"><label class="field"><span>Bitcoin-HD-Adresstyp</span><select id="scanHdType" name="hdAddressType">${options([['auto','Automatisch erkennen (Ledger: Native SegWit zuerst)'],['p2wpkh','Native SegWit (bc1q…)'],['p2sh-p2wpkh','Nested SegWit (3…)'],['p2pkh','Legacy (1…)']],'auto')}</select></label></div>
    <label class="field"><span>Öffentliche Wallet-Adresse</span><input name="address" id="scanAddress" required autocomplete="off" spellcheck="false" placeholder="0x… / bc1… / Solana-Adresse"></label>
    <div class="field-row"><label class="field"><span>Anbieter / Wallet</span><select name="providerId" id="scanProvider">${options(providers,model.providers[0]?.id||'__new__')}</select></label>
    ${field('Name für neue Wallet','providerName','Meine Wallet','text','id="scanProviderName" maxlength="80"')}</div><label class="field"><span>Konto / Wallet</span><select name="accountId" id="scanAccount"></select></label>
    <p class="small-help">Für Bitcoin sind einzelne Adressen oder öffentliche Account-Keys (xpub/ypub/zpub) möglich. Ethereum, Base, Arbitrum, Optimism, Polygon und Solana können auch Token finden. Kostenlose Datenquellen sind teilweise unvollständig; unbekannte Tokens haben vorerst keinen Kurs.</p>
    <p id="hdPrivacyHint" class="small-help hidden">Datenschutzhinweis für Bitcoin-HD: Der Scan übermittelt mehrere zusammengehörige Empfangs- und Wechselgeldadressen an einen öffentlichen Explorer. Dieser kann daraus Verbindungen zwischen deinen Adressen erkennen. Der xpub-Präfix allein identifiziert bei Ledger den Adresstyp nicht; Taproot (bc1p) wird derzeit nicht unterstützt.</p>
    <div class="button-row"><button class="btn outline" type="button" id="scanWalletButton">◇ Wallet scannen</button><span id="scanWalletStatus" class="status-text" role="status">Noch kein Scan gestartet.</span></div>
    <div id="walletScanResults" class="wallet-scan-results" aria-live="polite"></div>
    <p class="small-help">Bitte verdächtige Spam-Token abwählen. Die Adresse wird an den jeweiligen öffentlichen Blockchain-Dienst gesendet. Seed-Phrase und private Schlüssel niemals eingeben.</p>`,(v)=>{
       if(!scannedWalletAssets.length||scannedWalletKey!==walletScanIdentity(v.network,String(v.address).trim(),v.hdAddressType))throw Error('Bitte die aktuelle Adresse erneut scannen.');
       const chosen=[...$('walletScanResults').querySelectorAll('input[data-wallet-asset]:checked')].map(c=>scannedWalletAssets[Number(c.dataset.walletAsset)]).filter(Boolean);
       if(!chosen.length)throw Error('Bitte mindestens einen gefundenen Coin auswählen.');
       let providerId=v.providerId;
       if(providerId==='__new__'){
         const provider=createProvider({name:v.providerName||'Meine Wallet',type:'wallet'});
         model.providers.push(provider);providerId=provider.id;
       }
       let accountId=v.accountId;
       if(accountId==='__new__'){
         const account=createAccount({providerId,name:'Kryptowallet',type:'wallet'},model);
         model.accounts.push(account);accountId=account.id;
       }
       if(!model.accounts.some(a=>a.id===accountId&&a.providerId===providerId))throw Error('Bitte ein gültiges Wallet-Konto auswählen.');
       let added=0,updated=0;
       for(const asset of chosen){
         const existing=model.positions.find(p=>p.accountId===accountId&&p.wallet?.enabled&&p.wallet.address.toLowerCase()===String(v.address).trim().toLowerCase()&&p.wallet.chain===asset.chain&&(p.wallet.chainId||1)===(asset.chainId||1)&&String(p.wallet.contract||'').toLowerCase()===String(asset.contract||'').toLowerCase());
         if(existing){existing.quantity=Number(asset.quantityExact??asset.quantity);existing.quantityExact=String(asset.quantityExact??asset.quantity);existing.updatedAt=new Date().toISOString();if(asset.chain==='btc-hd'&&asset.addressType)existing.wallet.addressType=asset.addressType;if(asset.price>0){existing.price=asset.price;existing.currency='EUR';existing.fxRate=1;}updated++;continue;}
         const position=createPosition({kind:'crypto',providerId,accountId,name:asset.name,symbol:asset.symbol,coinId:asset.coinId,quantity:asset.quantityExact??asset.quantity,price:asset.price||0,currency:'EUR',wallet:{enabled:true,chain:asset.chain,address:String(v.address).trim(),contract:asset.contract||'',chainId:asset.chainId||1,decimals:asset.decimals,addressType:asset.addressType||v.hdAddressType||'auto'}},model);
         model.positions.push(position);added++;
       }
       if(added||updated){snapshot(model);save();go('positions');}
       notify(`${added} neu · ${updated} aktualisiert. Nicht erkannte Coins bleiben erhalten.`);
  });
  $('saveDialog').textContent='Ausgewählte Coins übernehmen';
  const toggleNew=()=>{$('scanProviderName').parentElement.classList.toggle('hidden',$('scanProvider').value!=='__new__');
    const wallets=model.accounts.filter(a=>a.providerId===$('scanProvider').value&&a.type==='wallet');
    $('scanAccount').innerHTML=options([...wallets.map(a=>[a.id,a.name]),['__new__','+ Neues Wallet-Konto']],wallets[0]?.id||'__new__');
  };
  $('scanProvider').addEventListener('change',toggleNew);toggleNew();
  const updateHdHint=()=>{const hd=$('scanNetwork').value==='btc-hd';$('hdPrivacyHint').classList.toggle('hidden',!hd);$('scanHdField').classList.toggle('hidden',!hd);};
  $('scanNetwork').addEventListener('change',()=>{scannedWalletAssets=[];$('walletScanResults').innerHTML='';$('scanWalletStatus').textContent='Netzwerk geändert – bitte erneut scannen.';updateHdHint();});
  updateHdHint();
  $('scanHdType').addEventListener('change',()=>{scannedWalletAssets=[];scannedWalletKey='';$('walletScanResults').innerHTML='';$('scanWalletStatus').textContent='Adresstyp geändert – bitte erneut scannen.';});
  $('scanAddress').addEventListener('change',()=>{scannedWalletAssets=[];$('walletScanResults').innerHTML='';});
  $('scanWalletButton').addEventListener('click',scanWalletNow);
}
async function scanWalletNow(){
  const button=$('scanWalletButton'),status=$('scanWalletStatus'),area=$('walletScanResults');
  const network=$('scanNetwork').value,address=$('scanAddress').value.trim();
  if(!address){status.textContent='Bitte die öffentliche Wallet-Adresse eingeben.';return;}
  button.disabled=true;status.textContent=network==='btc-hd'?'Scanne Empfangs- und Wechselgeldadressen (Bitcoin HD) …':'Lese Blockchain-Bestände …';area.innerHTML='';scannedWalletAssets=[];
  try{
    const assets=await getAdapter(network).discoverAssets(address,network==='btc-hd'?{...model.settings,hdAddressType:$('scanHdType').value}:model.settings);
    if(!assets.length){status.textContent='Keine positiven Guthaben gefunden.';area.innerHTML=empty('Keine Positionen gefunden. Prüfe Netzwerk und Adresse.');return;}
    // Fetch contract quotes without a key when possible. A quote error never blocks import.
    if(PUBLIC_EVM_NETWORKS[Number(network)]){
      try{
        const contracts=assets.filter(x=>x.contract).map(x=>x.contract);
        const quotes=await evmContractPrices(network,contracts,model.settings.coinGeckoKey);
        for(const a of assets)if(a.contract){const q=Number(quotes[a.contract.toLowerCase()]?.eur);if(q>0)a.price=q;}
      }catch(e){/* holdings are still valid without quotes */}
    }
    scannedWalletAssets=assets.slice(0,150);scannedWalletKey=walletScanIdentity(network,address,$('scanHdType').value);const partial=assets.partial===true;
    area.innerHTML=`<div class="wallet-scan-header"><strong>${assets.length} Position${assets.length===1?'':'en'} gefunden</strong><span>Zur Übernahme auswählen</span></div>`+
      scannedWalletAssets.map((a,i)=>`<label class="wallet-scan-row"><input type="checkbox" data-wallet-asset="${i}" ${i<80&&(!a.contract||a.price>0)&&!/(claim|airdrop|visit|https?:|www\.|reward\.com)/i.test(a.name+' '+a.symbol)?'checked':''}><span class="wallet-scan-info"><strong>${esc(a.name)}</strong><small>${esc(a.symbol)} · ${esc(a.chain==='btc'||a.chain==='btc-hd'?'Bitcoin':a.chain==='xrp'||a.chain==='xrp-token'?'XRP Ledger':a.chain==='sol'||a.chain==='spl'?'Solana':PUBLIC_EVM_NETWORKS[a.chainId]?.name||'EVM')}${a.contract?' · '+esc(a.contract.slice(0,9))+'…':''}</small></span><span class="wallet-scan-money">${quant(a.quantity)}${a.price?`<small>≈ ${money(a.price*a.quantity)}</small>`:'<small>Kurs offen</small>'}</span></label>`).join('');
    status.textContent=partial?'Teilweise erfolgreich: '+assets.warning:assets.length>150?'Maximal 150 Positionen in der Vorschau.':'Bestände abgerufen – unbekannte Tokens bitte einzeln prüfen.';
  }catch(e){status.textContent='Scan nicht möglich: '+e.message;area.innerHTML=empty('Manuelles Hinzufügen ist weiterhin möglich. Öffentliche API-Zugriffe können zeitweise blockiert oder begrenzt sein.');}
  finally{button.disabled=false;}
}
// Imported broker files stay entirely in the browser. A verified dry-run precedes any write.
function openCSVImport(){
 if(!model.positions.some(p=>!p.wallet?.enabled))return notify('Vor dem CSV-Import bitte mindestens eine manuelle Position anlegen.',true);
 const positions=model.positions.filter(p=>!p.wallet?.enabled);
 let parsed=null;
 showDialog('CSV-Transaktionen importieren','LOKALER IMPORT',`
  <p class="dialog-intro">Die CSV bleibt auf deinem Gerät. Spalten zuordnen, Buchungen prüfen und erst danach gesammelt übernehmen. Historisch unbekannte Positionen werden nicht automatisch erfunden.</p>
  <label class="field"><span>CSV-Datei (maximal 2 MB)</span><input id="csvFile" type="file" accept=".csv,text/csv,text/plain"></label>
  <label class="field"><span>Standardposition für Zeilen ohne eindeutigen Identifier</span><select id="csvDefaultPosition">${options(positions.map(p=>[p.id,p.name+' · '+(p.isin||p.symbol||'')]),positions[0].id)}</select></label>
  <label class="field"><span>Verrechnungskonto (optional)</span><select id="csvCashPosition">${options([['','Ohne Gegenkonto'],...positions.filter(p=>p.kind==='cash').map(p=>[p.id,p.name])],'')}</select></label>
  <div id="csvMapping"></div><div id="csvPreview" class="small-help" role="status">Datei auswählen, dann Spalten überprüfen.</div>
 `,()=>{
  if(!parsed)throw Error('CSV-Datei fehlt.');
  const mapping=Object.fromEntries(CSV_FIELDS.map(key=>[key,$('csvMap-'+key)?.value||'']));
  const preview=previewCSV(model,parsed,mapping,{defaultPositionId:$('csvDefaultPosition').value,cashPositionId:$('csvCashPosition').value});
  if(preview.issues.length)throw Error(preview.issues.length+' fehlerhafte CSV-Zeilen. Bitte die Vorschau korrigieren.');
  if(!preview.ready)return notify('Keine neuen Buchungen; erkannte Dubletten wurden übersprungen.');
  const imported=importCSV(model,preview);snapshot(model);save();
  notify(imported.imported+' CSV-Buchungen importiert · '+imported.duplicates+' Dubletten übersprungen.');
 });
 $('saveDialog').disabled=true;$('saveDialog').textContent='Geprüfte CSV übernehmen';
 const fieldLabels={date:'Datum',type:'Buchungstyp',position:'Position / ISIN / Ticker',quantity:'Menge',unitPrice:'Ausführungskurs',feeEUR:'Gebühren EUR',taxEUR:'Steuern EUR',fxRate:'EUR je Kurswährung',cashPosition:'Verrechnungskonto (ID / Name)',notes:'Notiz',externalId:'Externe Transaktions-ID'};
 const preview=()=>{
  if(!parsed)return;
  const mapping=Object.fromEntries(CSV_FIELDS.map(key=>[key,$('csvMap-'+key)?.value||'']));
  try{
   const result=previewCSV(model,parsed,mapping,{defaultPositionId:$('csvDefaultPosition').value,cashPositionId:$('csvCashPosition').value});
   $('csvPreview').innerHTML='<strong>'+result.ready+' neu · '+result.duplicates+' Dubletten · '+result.issues.length+' Fehler</strong>'+
     '<div class="small-help">Beispielzeilen (max. 10):</div>'+
     result.rows.slice(0,10).map(x=>'<div class="history-sub">Zeile '+x.line+' · '+esc(x.status==='ready'?'prüfbar: '+x.row.date+' · '+x.row.type+' · '+x.row.quantity:x.status==='duplicate'?'bereits vorhanden':x.message)+'</div>').join('');
   $('saveDialog').disabled=Boolean(result.issues.length)||result.ready===0;
  }catch(e){$('csvPreview').textContent='Importprüfung: '+e.message;$('saveDialog').disabled=true;}
 };
 $('csvFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];parsed=null;$('saveDialog').disabled=true;
  if(!file)return;
  try{
   if(file.size>2_000_000)throw Error('CSV zu groß (max. 2 MB).');
   parsed=parseCSV(await file.text());
   const inferred=inferMapping(parsed.headers);
   $('csvMapping').innerHTML='<strong>CSV-Spalten zuordnen</strong><div class="field-row">'+
    CSV_FIELDS.map(key=>'<label class="field"><span>'+esc(fieldLabels[key])+'</span><select id="csvMap-'+key+'">'+options([['','– Keine –'],...parsed.headers.map(head=>[head,head])],inferred[key])+'</select></label>').join('')+'</div>';
   $('csvMapping').querySelectorAll('select').forEach(el=>el.addEventListener('change',preview));
   $('csvDefaultPosition').addEventListener('change',preview);
   $('csvCashPosition').addEventListener('change',preview);
   preview();
  }catch(error){$('csvPreview').textContent='CSV konnte nicht gelesen werden: '+error.message;}
 });
}
function openBooking(){
 const list=model.positions.filter(p=>!p.wallet?.enabled);
 if(!list.length)return notify('Lege zuerst eine manuell verwaltete Position oder ein Guthaben an.',true);
 const today=new Date().toISOString().slice(0,10);
 const defaultId=list[0].id;
 showDialog('Vorgang erfassen','BUCHUNGEN & CORPORATE ACTIONS',
 '<p class="dialog-intro">Alle Bewegungen werden nachvollziehbar gespeichert. Interne Transfers zählen nicht als Einzahlung. Automatische Wallet-Bestände bleiben unverändert.</p>'+
 '<label class="field"><span>Position</span><select name="positionId" id="bookingPosition">'+options(list.map(p=>[p.id,p.name]),defaultId)+'</select></label>'+
 '<div class="field-row"><label class="field"><span>Vorgang</span><select name="type" id="bookingType">'+options(Object.entries(TX_TYPES),'buy')+'</select></label>'+
 field('Datum','date',today,'date','required')+'</div>'+
 '<div id="bookingQuantityWrap" class="field-row">'+field('Menge / Betrag','quantity','1','text','required inputmode="decimal" placeholder="z. B. 0.000000000000000001"')+
 field('Ausführungskurs','unitPrice','100','text','inputmode="decimal"')+'</div>'+
 '<div id="bookingCashWrap" class="hidden"><label class="field"><span>Verrechnungskonto für Kauf / Verkauf</span><select name="cashPositionId" id="bookingCash"><option value="">Ohne Verrechnungskonto (Finanzierung ungeklärt)</option></select></label><p class="dialog-intro">Nur zugeordnete Geldpositionen werden automatisch mitgebucht. Ohne Gegenkonto bleibt die Finanzierung ungeklärt, niemals als Einzahlung geschätzt.</p></div>'+
 '<div id="bookingTargetWrap" class="hidden"><label class="field"><span>Zielposition</span><select name="targetPositionId" id="bookingTarget">'+options(list.map(p=>[p.id,p.name]),list[1]?.id||defaultId)+'</select></label>'+
 field('Zielmenge bei Umtausch','targetQuantity','1','text','inputmode="decimal"')+'</div>'+
 '<div id="bookingRatioWrap" class="hidden"><div class="field-row">'+field('Neue Anteile (Zähler)','ratioNumerator','2','text','inputmode="decimal"')+
 field('Alte Anteile (Nenner)','ratioDenominator','1','text','inputmode="decimal"')+'</div></div>'+
 '<div id="bookingMetadataWrap" class="hidden">'+field('Neuer Ticker','newSymbol','','text','maxlength="32"')+
 field('Neue ISIN','newIsin','','text','maxlength="20"')+'</div>'+
 '<div id="bookingCorrectWrap" class="hidden">'+field('Korrekter neuer Bestand','targetQuantity','0','text','inputmode="decimal"')+'</div>'+
 '<details class="advanced-apis" id="bookingAdvanced"><summary>Gebühren, Steuern und historischer Wechselkurs</summary>'+
 '<div class="field-row">'+field('Gebühren in EUR','feeEUR','0','text','inputmode="decimal"')+field('Steuern in EUR','taxEUR','0','text','inputmode="decimal"')+'</div>'+
 field('Historischer Kurs: EUR je Währungseinheit','fxRate','','text','inputmode="decimal" placeholder="Bei USD / CHF / GBP nötig"')+
 '<button type="button" class="btn outline" id="loadHistoricalFx">Frankfurter-Referenzkurs für Buchungsdatum laden</button>'+
 '<p class="small-help" id="historicalFxNote">Referenzkurs kann vom tatsächlichen Ausführungskurs des Brokers abweichen.</p>'+
 field('Referenzkursdatum','fxRateDate','','text','readonly')+
 field('Wechselkursquelle','fxSource','','text','readonly')+'</details>'+
 field('Notiz (optional)','notes','','text','maxlength="180"'),
 (v)=>{
   // The correction selector has the same semantic targetQuantity field as swaps.
   if(v.type==='correction')v.targetQuantity=$('bookingCorrectWrap').querySelector('input').value;
   const event=executeTransaction(model,v);
   if(v.date===new Date().toISOString().slice(0,10))snapshot(model,v.date);
   save();notify('Vorgang gespeichert: '+TX_TYPES[event.type]+'.');
 });
 function configure(){
   const type=$('bookingType').value,meta=['ticker_change','isin_change','delist'].includes(type);
   const ratio=type==='split',correct=type==='correction',target=['transfer','swap','merger'].includes(type);
   $('bookingQuantityWrap').classList.toggle('hidden',meta||ratio||correct);
   $('bookingTargetWrap').classList.toggle('hidden',!target);
   $('bookingRatioWrap').classList.toggle('hidden',!ratio);
   $('bookingCorrectWrap').classList.toggle('hidden',!correct);
   $('bookingMetadataWrap').classList.toggle('hidden',!['ticker_change','isin_change'].includes(type));
   $('bookingMetadataWrap').querySelector('[name="newSymbol"]').parentElement.classList.toggle('hidden',type!=='ticker_change');
   $('bookingMetadataWrap').querySelector('[name="newIsin"]').parentElement.classList.toggle('hidden',type!=='isin_change');
   const current=list.find(p=>p.id===$('bookingPosition').value);
   const linked=type==='buy'||type==='sell';
   $('bookingCashWrap').classList.toggle('hidden',!linked);
   if(linked){
     const available=list.filter(p=>p.kind==='cash'&&p.id!==current?.id&&['EUR',current?.currency].includes(p.currency));
     const preferred=available.find(p=>p.providerId===current?.providerId)||available[0];
     $('bookingCash').innerHTML=options([['','Ohne Verrechnungskonto (Finanzierung ungeklärt)'],...available.map(p=>[p.id,p.name+' · '+p.currency])],preferred?.id||'');
   }
   if(current)$('bookingQuantityWrap').querySelector('[name="unitPrice"]').value=String(current.kind==='cash'?1:current.price);
   // Invisible fields never impose accidental HTML validation on unrelated events.
   for(const element of $('dialogFields').querySelectorAll('.hidden [required]'))element.required=false;
 }
 $('loadHistoricalFx').addEventListener('click',async()=>{
  const button=$('loadHistoricalFx'),selected=list.find(p=>p.id===$('bookingPosition').value),date=$('editorForm').elements.date.value;
  if(!selected)return;
  button.disabled=true;
  try{
    const quote=await historicalExchangeRate(selected.currency,date);
    $('editorForm').elements.fxRate.value=String(quote.rate);
    $('editorForm').elements.fxRateDate.value=quote.date;
    $('editorForm').elements.fxSource.value=quote.source+' (Referenz)';
    $('historicalFxNote').textContent=`Referenzkurs vom ${quote.date}, angefragt für ${date}. Abweichungen vom Broker-Ausführungskurs möglich.`;
  }catch(e){notify('Historischer FX-Abruf: '+e.message,true);}
  finally{button.disabled=false;}
 });
 $('editorForm').elements.fxRate.addEventListener('input',()=>{
   $('editorForm').elements.fxSource.value='Manuell angepasst';
   $('editorForm').elements.fxRateDate.value='';
   $('historicalFxNote').textContent='Manuell angepasster FX: bitte den tatsächlich verwendeten Kurs prüfen.';
 });
 $('bookingType').addEventListener('change',configure);
 $('bookingPosition').addEventListener('change',configure);
 configure();
}
function openSnapshot(){showDialog('Stichtag speichern','VERMÖGENSVERLAUF',`<p class="dialog-intro">Heute wird der aktuelle Portfoliowert gespeichert. Für frühere Tage ist der damals tatsächlich bekannte Gesamtwert erforderlich; heutige Kurse sind kein historischer Wert.</p>${field('Stichtag','date',new Date().toISOString().slice(0,10),'date','required')}${field('Historischer Gesamtwert in EUR (bei früherem Datum erforderlich)','manualTotalEUR','','text','inputmode="decimal" placeholder="z. B. 12345,67"')}${field('Notiz (optional)','note','','text')}`,(v)=>{snapshot(model,v.date,v.note,{manualTotalEUR:v.manualTotalEUR});save();notify('Stichtag gespeichert.');});}
function startPerformanceTracking(){
 if(model.performanceFlowTrackingSince)return notify('Renditestart bereits festgelegt: '+model.performanceFlowTrackingSince);
 const date=new Date().toISOString().slice(0,10);
 if(!confirm('Heute als Beginn der vollständigen Cashflow-Erfassung festlegen? Ältere Renditen werden nicht geschätzt.'))return;
 model.performanceFlowTrackingSince=date;model.externalCashFlows=[];snapshot(model,date,'Beginn der Renditeerfassung');save();notify('Startwert für künftige XIRR-Ermittlung gespeichert.');
}
async function refreshAll(){
 if(busy)return;
 busy=true;$('refreshAll').disabled=true;$('priceInfo').textContent='Kurse und Wallet-Bestände werden abgefragt …';
 const errors=[];let successes=0;const now=new Date().toISOString();
 try{
  const cryptos=model.positions.filter(p=>p.kind==='crypto'&&p.coinId);
  const securities=model.positions.filter(p=>['etf','stock','fund'].includes(p.kind)&&p.symbol);
  if(cryptos.length){
   try{
    const quotes=await cryptoPrices(cryptos.map(p=>p.coinId),model.settings.coinGeckoKey);
    for(const p of cryptos){
      const item=quotes[p.coinId],price=Number(item?.eur);
      if(Number.isFinite(price)&&price>0){
       p.price=price;p.priceExact=String(price);p.currency='EUR';p.fxRate=1;p.fxRateExact='1';
       p.quoteSource='CoinGecko';p.quoteAsOf=item?.last_updated_at?new Date(item.last_updated_at*1000).toISOString():null;
       p.quoteFetchedAt=now;p.quoteQuality=p.quoteAsOf?'provider-timestamp':'undated';p.updatedAt=now;p.priceStatus=null;successes++;
      }else errors.push(`${p.name}: Kein verifizierbarer CoinGecko-Kurs.`);
    }
    if(quotes.partialFailures?.length)errors.push('CoinGecko-Teilabruf: '+quotes.partialFailures[0]);
   }catch(e){errors.push('CoinGecko: '+e.message);}
  }
  if(securities.length&&model.settings.twelveKey){
    for(const p of securities){
     try{
      const q=await securityQuote({symbol:p.symbol,exchange:p.exchange,mic:p.mic,currency:p.currency,isin:p.isin},model.settings.twelveKey);
      p.price=q.price;p.priceExact=String(q.price);p.quoteSource=q.source;p.quoteAsOf=q.asOf;
      p.quoteFetchedAt=now;p.quoteQuality=q.quality;p.updatedAt=now;p.priceStatus=null;successes++;
     }catch(e){errors.push(`${p.symbol}: ${e.message}`);}
    }
  }
  // Daily reference rates are not broker execution prices.
  const fxCache=new Map();
  for(const p of model.positions.filter(x=>x.currency!=='EUR')){
   try{
    if(!fxCache.has(p.currency))fxCache.set(p.currency,await exchangeRateQuote(p.currency,''));
    const q=fxCache.get(p.currency);
    p.fxRate=q.rate;p.fxRateExact=String(q.rate);p.fxSource=q.source;p.fxRateDate=q.date;p.fxUpdatedAt=now;successes++;
   }catch(e){errors.push(`${p.currency}/EUR: ${e.message}`);}
  }
  const networkCache=new Map();
  const walletFetch=async(url,opts={})=>{
    const key=String(url)+'|'+String(opts.method||'GET')+'|'+String(opts.body||'');
    if(!networkCache.has(key))networkCache.set(key,fetch(url,opts).catch(e=>{networkCache.delete(key);throw e;}));
    return (await networkCache.get(key)).clone();
  };
  const contractsByChain=new Map();
  for(const p of model.positions.filter(p=>p.kind==='crypto'&&p.wallet?.chain==='erc20'&&p.wallet?.contract)){
    const id=Number(p.wallet.chainId||1);if(!contractsByChain.has(id))contractsByChain.set(id,[]);
    contractsByChain.get(id).push(p);
  }
  for(const [chainId,positions] of contractsByChain){
   try{
    const quotes=await evmContractPrices(chainId,positions.map(p=>p.wallet.contract),model.settings.coinGeckoKey);
    for(const p of positions){const rate=Number(quotes[p.wallet.contract.toLowerCase()]?.eur);
     if(rate>0){p.price=rate;p.priceExact=String(rate);p.currency='EUR';p.fxRate=1;p.fxRateExact='1';
      p.quoteSource='CoinGecko Token';p.quoteFetchedAt=now;p.quoteQuality='provider-undated';p.quoteAsOf=null;p.updatedAt=now;p.priceStatus=null;successes++;}}
   }catch(e){errors.push('Tokenpreise: '+e.message);}
  }
  for(const p of model.positions.filter(p=>p.wallet?.enabled)){
   try{
    const hdScan=p.wallet.chain==='btc-hd'?await scanBitcoinAccount(p.wallet.address,{fetcher:walletFetch,addressType:p.wallet.addressType||'auto'}):null;
    const exactQty=hdScan?.quantityExact??await walletBalanceExact(p.wallet,model.settings,walletFetch);
    if(hdScan?.addressType)p.wallet.addressType=hdScan.addressType;
    p.quantityExact=exactQty;p.quantity=Number(exactQty);p.updatedAt=now;successes++;
   }catch(e){errors.push(`${p.name} Wallet: ${e.message}`);}
  }
  if(successes){snapshot(model);save();}else render();
  const details=errors.length?' · '+errors.length+' Abfragefehler: '+errors.slice(0,2).join(' · ')+(errors.length>2?' · weitere Fehler':''):'';
  $('priceInfo').textContent=`${successes} Datenupdates · ${new Date().toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'})}${details}`;
  $('priceInfo').classList.toggle('refresh-warning',errors.length>0);
  if(errors.length)notify(`${successes} Datenupdates · ${errors.length} Abfragefehler. Details unter „Aktualisieren“.`,true);
  else notify(successes?'Portfolio aktualisiert.':'Keine automatischen Kurs- oder Wallet-Quellen eingerichtet.');
 }catch(e){notify(e.message,true);}
 finally{busy=false;$('refreshAll').disabled=false;}
}
function downloadBackup(){const file=new Blob([backup(model)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(file);a.href=url;a.download=`foliolab-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);backupDone();notify('Backup ohne API-Schlüssel erstellt.');}
async function downloadEncryptedBackup(){
  const input=$('backupPassword'),password=input.value;
  if(password.length<10)return notify('Bitte ein Passwort mit mindestens 10 Zeichen angeben.',true);
  try{
    const json=await encryptBackup(backup(model),password);
    const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`foliolab-verschluesselt-${new Date().toISOString().slice(0,10)}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);backupDone();notify('Verschlüsseltes Backup heruntergeladen. Passwort sicher aufbewahren.');
  }catch(e){notify(e.message,true);}
  finally{input.value='';}
}
function handleActions(e){const button=e.target.closest('[data-action]');if(!button)return;const id=button.dataset.id;switch(button.dataset.action){case 'more-positions':positionLimit+=100;renderPositions();break;case 'more-bookings':bookingLimit+=100;renderBookings();break;case 'start-provider':go('more');openProvider();break;case 'start-wallet':openWalletImport();break;case 'start-import':$('backupFile').click();break;case 'edit-position':openPosition(model.positions.find(x=>x.id===id));break;case 'edit-provider':openProvider(model.providers.find(x=>x.id===id));break;case 'edit-account':openAccount(model.accounts.find(x=>x.id===id));break;case 'delete-account':{if(model.positions.some(p=>p.accountId===id))return notify('Konto enthält Positionen – zuerst umziehen oder löschen.',true);if(confirm('Konto wirklich löschen?')){model.accounts=model.accounts.filter(a=>a.id!==id);save();}break;}case 'delete-provider':{if(model.positions.some(p=>p.providerId===id)||model.accounts.some(a=>a.providerId===id))return notify('Dieser Anbieter besitzt noch Konten oder Positionen.',true);if(confirm('Anbieter wirklich löschen?')){model.providers=model.providers.filter(x=>x.id!==id);if(filter===id)filter='all';save();}break;}case 'delete-snapshot':if(confirm('Stichtag wirklich löschen?')){model.snapshots=model.snapshots.filter(x=>x.id!==id);save();}break;}}
function initEvents(){$('addProvider').addEventListener('click',()=>openProvider());$('addAccount').addEventListener('click',()=>openAccount());$('addPosition').addEventListener('click',()=>openPosition());$('addWallet').addEventListener('click',openWalletImport);$('addBooking').addEventListener('click',openBooking);$('openCSVImport').addEventListener('click',openCSVImport);$('addSnapshot').addEventListener('click',openSnapshot);$('startPerformance').addEventListener('click',startPerformanceTracking);$('refreshAll').addEventListener('click',refreshAll);$('closeDialog').addEventListener('click',closeDialog);$('cancelDialog').addEventListener('click',closeDialog);$('editDialog').addEventListener('click',e=>{if(e.target===$('editDialog'))closeDialog();});$('editorForm').addEventListener('submit',e=>{e.preventDefault();if(!editor)return;const f=new FormData(e.currentTarget);const v=Object.fromEntries(f.entries());try{editor.onSave(v);closeDialog();}catch(err){notify(err.message,true);}});document.addEventListener('click',handleActions);$('positionFilters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;positionLimit=100;renderPositions();}});$('chartPeriods').addEventListener('click',e=>{const b=e.target.closest('[data-range]');if(b){range=b.dataset.range;renderHistory();}});
  $('exportBackup').addEventListener('click',downloadBackup);$('exportEncryptedBackup').addEventListener('click',downloadEncryptedBackup);$('importBackup').addEventListener('click',()=>$('backupFile').click());$('backupFile').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>20e6)return notify('Backup ist zu groß (max. 20 MB).',true);try{let parsed=JSON.parse(await file.text());if(isEncryptedBackup(parsed)){
   const password=prompt('Passwort für dieses verschlüsselte Foliolab-Backup:');
   if(password===null)return;parsed=JSON.parse(await decryptBackup(parsed,password));
  }
  const imported=safeImport(parsed);if(!confirm(`Backup mit ${imported.positions.length} Positionen und ${imported.providers.length} Anbietern wiederherstellen? Deine aktuellen Daten werden ersetzt. API-Schlüssel auf diesem Gerät bleiben erhalten.`))return;imported.settings={...defaultSettings(),...model.settings};loadFailure=null;model=imported;filter='all';save();notify('Backup wiederhergestellt.');}catch(err){notify(err.message,true);}});
  $('deleteAll').addEventListener('click',()=>{if(confirm('Alle lokalen Positionen, Stichtage UND API-Schlüssel endgültig löschen? Stelle vorher ein Backup sicher.')){loadFailure=null;model=blankModel();save();notify('Alle lokalen Daten gelöscht.');}});
  $('apiSettings').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);for(const key of ['twelveKey','coinGeckoKey','etherscanKey'])model.settings[key]=String(f.get(key)||'').trim();save();notify('Eigene API-Schlüssel lokal gespeichert.');});$('solanaRpc').addEventListener('change',e=>{try{const url=new URL(e.target.value);if(url.protocol!=='https:'||url.username||url.password)throw Error('Der Solana-RPC muss eine HTTPS-Adresse ohne Zugangsdaten im Benutzernamen verwenden.');model.settings.solanaRpc=url.toString();save();notify('Solana-RPC aktualisiert.');}catch(error){e.target.value=model.settings.solanaRpc;notify(error.message,true);}});
  $('autoRefresh').checked=model.settings.autoRefresh!==false;$('autoRefresh').addEventListener('change',e=>{model.settings.autoRefresh=e.target.checked;save();notify(e.target.checked?'Automatische Aktualisierung aktiviert.':'Automatische Aktualisierung deaktiviert.');});
  for(const k of ['twelveKey','coinGeckoKey','etherscanKey'])$('apiSettings').elements[k].value=model.settings[k]||'';
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installButton').classList.remove('hidden');});$('installButton').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();installPrompt=null;$('installButton').classList.add('hidden');});
}
initNav();initEvents();
if(loadFailure){
 const notice=$('notice');notice.classList.remove('hidden');notice.innerHTML='<strong>Lokaler Datenstand beschädigt oder nicht lesbar.</strong> Änderungen sind gesperrt. Lade die Originaldaten herunter und stelle danach ein funktionierendes Backup wieder her. <button class="btn outline" type="button" id="downloadRaw">Originaldaten sichern</button>';
 $('downloadRaw').addEventListener('click',()=>{const raw=localStorage.getItem('foliolab-open-v1')||'';const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='foliolab-original-datenschutzsicherung.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}
if('serviceWorker'in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)))navigator.serviceWorker.register('./sw.js').catch(()=>{});
if(location.protocol==='https:'&&model.settings.autoRefresh!==false){
  const candidates=model.positions.some(p=>p.wallet?.enabled||(p.kind==='crypto'&&p.coinId)||(model.settings.twelveKey&&['etf','stock','fund'].includes(p.kind)&&p.symbol));
  if(candidates){try{const key='foliolab-open-last-auto-refresh';const last=Number(localStorage.getItem(key)||0);if(Date.now()-last>30*60*1000){localStorage.setItem(key,String(Date.now()));setTimeout(()=>refreshAll(),1000);}}catch(e){/* local storage may be disabled */}}
}

