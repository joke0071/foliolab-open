import {historicalWealthView} from './historical-portfolio-value.js';
import {positionQualityReview,filterQualityReview} from './position-quality-review.js';
import {createTransferMatchingUI} from './transfer-matching-ui.js';
import {bookingHistoryRows,historyAction} from './booking-history.js';
import {bookingRowMarkup,createBookingHistoryUI} from './booking-history-ui.js';
import {forecastAccountInterest} from './interest-account.js';
import {interestFormMarkup,interestTermsFromForm,bindInterestForm} from './interest-ui.js';
import {compareCurrentCashBalance} from './cash-reconciliation.js';
import {cashTermsFromForm,localToday} from './cash-terms.js';
import {cashTermsFormMarkup,bindCashTermsForm,cashTermsAccountHint,renderCashTermsOverview} from './cash-terms-ui.js';
import {createWalletHistoryUI} from './wallet-history-ui.js';
import {blankModel,load,persist,createProvider,createPosition,totalEUR,valueEUR,snapshot,addBooking,gainSummary,backup,safeImport,defaultSettings,purgeLocalAppData,purgeLegacySnapshots,createAccount,suggestedAccountType,money,quant,escapeHTML,TYPES,uid,safeNumber} from './model.js';
import {POPULAR_COINS,coinCatalog,searchCatalog,cryptoPrices,searchSecurities,securityQuote,exchangeRateQuote,historicalExchangeRate,walletBalance,discoverWallet,PUBLIC_EVM_NETWORKS,evmContractPrices,walletBalanceExact,coinQuoteFreshness} from './market.js';
import {svg} from './format.js';
import {positionIconName} from './position-icons.js';
import {installCredentialVisibility} from './credential-visibility.js';
import {createDialogDiscardGuard} from './dialog-discard.js';
import {economicFormGuidance} from './economic-form-ui.js';
import {renderSummaryTiles,renderProviderAccounts,drawInteractiveChart,attachChartInteractions} from './dashboard-ui.js';
import {renderChartPeriodButtons,filterChartPeriod,syncChartPeriodButtons} from './chart-periods.js';
import {positionDetailMarkup,loadPositionDetail} from './position-detail-ui.js';
import {availablePositionPeriods} from './position-history.js';
import {cryptoFallbackQuote,defiLlamaContractKey} from './crypto-fallbacks.js';
import {parseHistoricalPriceCSV} from './historical-csv.js';
import {providerDirectory,providerSuggestions,providerExact,accountSuggestions,accountExact,suggestedAccountForProvider} from './onboarding-suggestions.js';
import {fetchSecurityQuote,tradingViewIdentifier,marketSourceOptions} from './security-sources.js';
import {discoverSecurityListings,rankListings,listingCompatibility} from './security-discovery.js';
import {scanBitcoinAccount} from './bitcoin-hd.js';
import {oldProviderQuote,valuationWarnings,valuationHeadline,valuationIssues} from './valuation-status.js';
import {allocationBreakdown,renderAllocationDonut,attachAllocationInteractions} from './allocation-ui.js';
import {searchAndSortPositions} from './position-search.js';
import {createAssetWizard} from './asset-wizard.js';
import {queryPublicInstruments,validatedPublicEndpoint} from './public-instruments-client.js';
import {refreshFailures,refreshHeadline} from './refresh-ui.js';
import {diagnoseEodhd} from './market-diagnostics.js';
import {priceQuality,quoteQualitySummary} from './quote-quality.js';
import {PortfolioStorage,MODE_KEY,MODE_VALUE} from './browser-portfolio-storage.js';
import {executeTransaction,TX_TYPES} from './transactions.js';
import {annualOverviewMarkup} from './booking-insights-ui.js';
import {portfolioXirr,portfolioTwr,performanceIssues,modifiedDietz} from './performance.js';
import {capitalReferenceSeries} from './capital-flows.js';
import {NETWORKS,getAdapter} from './blockchain-adapters.js';
import {solanaRpcRead} from './solana-rpc.js';
import {updateScannedWalletPosition} from './wallet-scan-update.js';
import {legacyQuoteDiscrepancies,verifiedCurrentQuote,applyVerifiedQuoteRepair} from './legacy-quote-audit.js';
import {STAKING_ASSETS,STAKING_MODES,lookupStakingAsset} from './staking-catalog.js';
import {partitionWalletAssets,walletTokenVisibility} from './wallet-visibility.js';
import {parseCSV,inferMapping,previewCSV,importCSV,CSV_FIELDS} from './csv-import.js';
import {prepareCSVBatch,csvPreviewSummary,csvUndoReceipt,canUndoCSV,undoCSV} from './csv-batch.js';
import {detectFlatexCSV,prepareFlatexImport,FLATEX_MAPPING} from './flatex-import.js';
import {reconcileFlatexPositions,flatexCustodyAccounts} from './flatex-reconciliation.js';
import {pairFlatexSettlements} from './flatex-settlements.js';
import {auditFlatexSettlementAmounts} from './flatex-settlement-audit.js';
import {auditFlatexCashStatements,flatexCashAccountChoices} from './flatex-cash-audit.js';
import {exportFlatexAuditCSV} from './flatex-review-export.js';
import {prepareFlatexBackfillPreview} from './flatex-backfill.js';
import {invalidateUnverifiedFlatexBasis} from './flatex-cost-basis.js';
import {ECONOMIC_ROLES,VALUATION_MODES,validateEconomicPosition} from './defi.js';
import {createCompleteBackup,unpackCompleteBackup,portableDrivePreferences,COMPLETE_BACKUP_KIND} from './complete-backup.js';
import {hasBackupPassword,configureBackupPassword,encryptWithBackupPassword,decryptPasswordBackup,isPasswordBackup,adoptBackupPassword} from './backup-vault.js';
import {openingCashInput} from './account-opening.js';
import {snapshotEditChanges,editSnapshot,deleteSnapshot,deletePosition,assertPositionDeletable} from './portfolio-edit-actions.js';
const positionDetailRanges=new Map();
const portfolioStore=new PortfolioStorage();
let model,loadFailure=null;try{model=await portfolioStore.initialize();}catch(e){loadFailure=e;model=blankModel();}
let saving=false,recoveryDownloaded=false,recoveryOriginal=null,csvReceipt=null;
let incomeYear='',incomeAccount='',incomeLimit=100;
let reviewKind='all',reviewAccount='';
let otherTabChangedPortfolio=false;
let legacyAuditPerformed=false;let page='dashboard',filter='all',range='all',miniRange='all',catalog=POPULAR_COINS.slice(),fullCatalog=false,editor=null,toastTimer=null,installPrompt=null,busy=false,positionLimit=100,bookingLimit=100,listingReviewOpen=false,listingReviewLimit=50;
const $=id=>document.getElementById(id), esc=escapeHTML;
const transferMatchingUI=createTransferMatchingUI({getModel:()=>model,assertCurrent:()=>portfolioStore.assertCurrent(),commit:async draft=>{model=draft;await save();}});
const bookingHistoryUI=createBookingHistoryUI({getModel:()=>model,commit:async draft=>{model=draft;await save();}});
const walletHistoryUI=createWalletHistoryUI({getModel:()=>model,commit:async draft=>{model=draft;await save();}});
const PAGES=[['dashboard','Übersicht','dashboard','DEIN VERMÖGEN IM BLICK'],['history','Verlauf','history','VERMÖGEN IM ZEITVERLAUF'],['positions','Positionen','positions','DEINE ANLAGEN'],['bookings','Buchungen','bookings','MANUELL ERFASSEN'],['more','Mehr','more','EINSTELLUNGEN UND DATEN']];
const PAGE_DESCRIPTIONS={history:'Historische Werte und ihre Datenabdeckung ansehen.',positions:'Anlagen erfassen, Kurse aktualisieren und Wallets ergänzen.',bookings:'Käufe, Verkäufe, Einzahlungen und Rewards erfassen.',more:'Verwalte Konten, Datenquellen und Backups an einem Ort.'};
const colors={etf:'#4f8662',stock:'#7da996',fund:'#b6cdb2',crypto:'#d2ac66',cash:'#7292bd',other:'#a2a3b2'};
const types={broker:'Broker',bank:'Bank',wallet:'Wallet-Anbieter',other:'Sonstiges'};
const accountTypes={securities:'Wertpapierdepot',checking:'Giro- oder Verrechnungskonto',savings:'Tagesgeld oder Festgeld',exchange:'Kryptobörsenkonto',wallet:'Kryptowallet',other:'Sonstiges'};
const providerPresets=providerDirectory.map(p=>p.name);
function backupCounter(){try{return Number(localStorage.getItem('foliolab-open-unbacked-changes')||0);}catch{return 0;}}
function backupDone(){try{localStorage.setItem('foliolab-open-last-backup-at',new Date().toISOString());localStorage.setItem('foliolab-open-unbacked-changes','0');}catch{}renderBackupStatus();}
async function save(){
 if(saving)throw Error('Ein Speichervorgang läuft bereits.');
 saving=true;syncPortfolioState();
 try{
  if(loadFailure)throw Error('Der gespeicherte Datenstand konnte nicht geladen werden. Bitte eine Sicherung wiederherstellen.');
  if(otherTabChangedPortfolio)throw Error('Portfolio wurde in einem anderen Tab geändert. Bitte diesen Tab neu laden, bevor du weitere Änderungen speicherst.');
  await portfolioStore.save(model);
  try{localStorage.setItem('foliolab-open-unbacked-changes',String(Math.min(9999,backupCounter()+1)));}catch{}
  render();
 }catch(error){
  if(!loadFailure){try{model=await portfolioStore.reload();}catch(recoveryError){loadFailure=recoveryError;}}
  render();
  notify('Änderung nicht gespeichert: '+(error?.name==='QuotaExceededError'?'Browserspeicher voll. Bitte Backup erstellen.':String(error?.message||error)),true);
  throw error;
 }finally{saving=false;syncPortfolioState();}
}
function notify(message,error=false){const box=$('toast');box.textContent=message;box.style.background=error?'#9f4840':'#1e5037';box.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.add('hidden'),4600);}
function empty(message){return `<div class="empty">${esc(message)}</div>`;}
function options(values,selected){return values.map(([id,label])=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(label)}</option>`).join('');}
function field(label,name,val='',type='text',attributes=''){return `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(val)}" ${attributes}></label>`;}
function go(next){if(!PAGES.some(x=>x[0]===next))next='dashboard';page=next;document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===next+'Page'));document.querySelectorAll('[data-page]').forEach(x=>{const active=x.dataset.page===next;x.classList.toggle('active',active);x.setAttribute('aria-current',active?'page':'false');});const [,title,,kicker]=PAGES.find(x=>x[0]===next);$('pageTitle').textContent=next==='history'?'Vermögensentwicklung':title;$('pageDescription').textContent=PAGE_DESCRIPTIONS[next]||'';$('pageKicker').textContent=kicker;history.replaceState(null,'',location.pathname+(next==='dashboard'?'':`?page=${next}`));window.scrollTo({top:0,behavior:'instant'});render();}
function initNav(){const build=(mobile=false)=>PAGES.map(([key,label,ico])=>`<button type="button" data-page="${key}" aria-label="${label}">${svg(ico)} <span>${label}</span></button>`).join('');$('sidebarNav').innerHTML=build();$('mobileNav').innerHTML=build(true);$('refreshIcon').innerHTML=svg('refresh',17);$('folderIcon').innerHTML=svg('folder',26);$('settingsGear').innerHTML=svg('gear',19);document.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.page)));document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.go)));go(new URL(location.href).searchParams.get('page')||'dashboard');}
function syncPortfolioState(){
 const unavailable=Boolean(loadFailure),conflict=otherTabChangedPortfolio;
 document.body.classList.toggle('portfolio-unavailable',unavailable);
 document.body.classList.toggle('portfolio-conflict',conflict);
 const status=unavailable?'Speicher nicht verfügbar':conflict?'Datenstand veraltet':saving?'Wird gespeichert …':'Portfolio lokal gespeichert';
 $('localPortfolioStatus').textContent=status;
 $('mobilePortfolioStatus').textContent=unavailable?'Speicher nicht verfügbar':conflict?'Datenstand veraltet':saving?'Wird gespeichert …':'Lokal gespeichert';
 $('portfolioStorageState').textContent=unavailable?'Speicher nicht verfügbar. Keine Änderungen gespeichert.':conflict?'Datenstand veraltet. Bitte neu laden.':portfolioStore.isIndexedDB?'Transaktionale IndexedDB aktiv':'Bisheriger Browser-Speicher aktiv';
 if(unavailable){
  $('totalValue').textContent='–';$('totalHint').textContent='Portfolio derzeit nicht lesbar.';
  $('onboarding').classList.add('hidden');$('onboarding').replaceChildren();
  $('providerSettings').textContent='Anbieter und Konten derzeit nicht verfügbar.';
  for(const id of ['dashboardPage','historyPage','positionsPage','bookingsPage']){
   const pageNode=$(id);if(!pageNode.querySelector('.portfolio-unavailable-message')){
    const message=document.createElement('p');message.className='empty portfolio-unavailable-message';
    message.textContent='Portfolio derzeit nicht lesbar. Sichere zuerst die Originaldaten und verwende dann die kontrollierte Wiederherstellung oben.';pageNode.prepend(message);
   }
  }
  showRecoveryNotice();
  document.querySelectorAll('.page button,.page input,.page select,.page textarea').forEach(control=>{
   if(control.id!=='backupFile'&&!control.disabled){control.dataset.recoveryDisabled='true';control.disabled=true;}
  });
 }else{
  document.querySelectorAll('.portfolio-unavailable-message').forEach(node=>node.remove());
  document.querySelectorAll('[data-recovery-disabled]').forEach(control=>{control.disabled=false;delete control.dataset.recoveryDisabled;});
 }
}
function render(){syncPortfolioState();if(loadFailure)return;if($('optionalConnectionStatus')){const n=[model.settings.publicInstrumentEndpoint,model.settings.eodhdWorkerEndpoint].filter(Boolean).length;$('optionalConnectionStatus').textContent=n?n+' eingerichtet':'Nicht eingerichtet';}switch(page){case 'dashboard':renderDashboard();break;case 'history':renderHistory();break;case 'positions':renderPositions();break;case 'bookings':renderBookings();break;case 'more':renderSettings();break;}syncPortfolioState();}
function showValuationIssues(){
 reviewKind='quote';reviewAccount='';
 filter='__review';
 positionLimit=100;
 $('positionSearch').value='';
 go('positions');
 $('positionQuoteDetails').open=true;
 const first=$('positionList').querySelector('.position-entry .holding-expand');
 if(first)first.open=true;
 const active=$('positionFilters').querySelector('[data-filter="__review"]');
 active?.scrollIntoView({block:'start',behavior:'instant'});
 active?.focus({preventScroll:true});
}
function renderDashboard(){const total=totalEUR(model),positions=model.positions.length,providers=model.providers.length,crypto=model.positions.filter(p=>p.kind==='crypto').reduce((sum,p)=>sum+valueEUR(p),0);$('totalValue').textContent=money(total);
  const issues=valuationIssues(model),hint=$('totalHint');
  hint.replaceChildren();
  if(issues.length){
   const review=document.createElement('button');
   review.type='button';review.className='hero-valuation-link';
   review.textContent=`${issues.length} Position${issues.length===1?'':'en'} prüfen ›`;
   review.title=valuationHeadline(valuationWarnings(model))||'Betroffene Positionen ansehen';
   review.setAttribute('aria-label',`${issues.length} Position${issues.length===1?'':'en'} mit eingeschränkter Bewertung anzeigen`);
   review.addEventListener('click',showValuationIssues);
   hint.append(review);
  }else hint.textContent=`${positions} Position${positions===1?'':'en'} bei ${providers} Anbieter${providers===1?'':'n'}`;
  const onboarding=$('onboarding');onboarding.classList.toggle('hidden',!!model.providers.length);if(!model.providers.length)onboarding.innerHTML='<strong>Willkommen bei Foliolab Open</strong><p>Starte mit einem Anbieter und Konto, einer öffentlichen Wallet oder einem vorhandenen Backup.</p><div class="toolbar-buttons"><button class="btn primary" data-action="start-wizard">Anlage hinzufügen</button><button class="btn outline" data-action="start-provider">Anbieter verwalten</button><button class="btn outline" data-action="start-wallet">Wallet verbinden</button><button class="btn outline" data-action="start-import">Backup importieren</button></div>';
   const wealth=wealthView();
   $('summaryStats').innerHTML=renderSummaryTiles(model,money,valueEUR,esc,dateLabel,wealth);
  const alloc=allocationBreakdown(model,valueEUR,TYPES);
  const previousKey=$('allocationLegend').querySelector('[data-allocation-key][aria-pressed="true"]')?.dataset.allocationKey||null;
  const pie=renderAllocationDonut(alloc,{money,esc,colors,netTotal:total,selectedKey:previousKey});
  $('donut').innerHTML=pie.donut;
  $('allocationLegend').innerHTML=pie.legend;
  $('dashboardPage').dataset.hasLiabilities=String(alloc.liabilities>0);
  attachAllocationInteractions($('dashboardPage'),{slices:alloc.slices,money,netTotal:total,initialIndex:pie.activeIndex});
  const expanded=new Set([...$('providerOverview').querySelectorAll('details[open][data-provider-id]')].map(x=>x.dataset.providerId));
  const expandedPositions=new Set([...$('providerOverview').querySelectorAll('details[open][data-position-id]')].map(x=>x.dataset.positionId));
  const cashOverviewOpen=Boolean($('cashTermsOverview')?.open);
  $('providerOverview').innerHTML=renderCashTermsOverview(model,esc,{open:cashOverviewOpen})+renderProviderAccounts(model,money,valueEUR,esc,expanded,expandedPositions);
  for(const id of expandedPositions)showPositionDetail(id);
  const shots=wealth.samples;
  $('miniHistoryStatus').textContent=wealth.label;
  const visible=filterChartPeriod(shots,'wealth',miniRange);
  $('miniChart').innerHTML=drawChart(visible);
  attachChartInteractions($('miniChart'));
  syncChartPeriodButtons($('miniChartPeriods'),'data-mini-range',miniRange,
   period=>period==='all'||filterChartPeriod(shots,'wealth',period).length>=2);
}
function showPositionDetail(id){
  const p=model.positions.find(x=>x.id===id);
  const mount=[...$('providerOverview').querySelectorAll('[data-position-detail]')].find(el=>el.dataset.positionDetail===id);
  if(!p||!mount||!mount.closest('details[data-position-id]')?.open)return;
  const days=positionDetailRanges.get(id)||30;
  mount.innerHTML=positionDetailMarkup(p,model,{esc,money,quant,valueEUR,days});
  void loadPositionDetail(p,model,mount,{days,esc,money,quant,valueEUR,dateLabel});
}
function dateLabel(date){const d=new Date(date+'T12:00:00');return Number.isNaN(d.getTime())?date:d.toLocaleDateString('de-AT',{day:'2-digit',month:'short',year:'numeric'});}
let wealthBasis='auto',wealthKey='',wealthCached;
function wealthView(){const key=JSON.stringify([wealthBasis,model.positions,model.accounts,model.openingPositions,model.journalEntries,model.bookings,model.walletHistory,model.priceHistories,model.snapshots]);if(key!==wealthKey){wealthCached=historicalWealthView(model,wealthBasis);wealthKey=key;}return wealthCached;}
function drawChart(samples,comparison=null){return samples.length?drawInteractiveChart(samples,{money,esc,dateLabel,comparison,disjoint:samples.some(s=>s.breakBefore)}):'<p class="chart-zero">Historische Kurse oder Bestandsnachweise fehlen. Historie einer Position öffnen; manuelle Kontrollpunkte bleiben optional.</p>';}


let calendarMonth=null,calendarSelection=[];
function calendarDayKey(year,zeroBasedMonth,day){return year+'-'+String(zeroBasedMonth+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');}
function renderSnapshotCalendar(){
 const grid=$('historyCalendarGrid');if(!grid)return;
 if(!calendarMonth)calendarMonth=(model.snapshots.at(-1)?.date||new Date().toISOString().slice(0,10)).slice(0,7);
 const [year,month]=calendarMonth.split('-').map(Number);
 const offset=(new Date(year,month-1,1).getDay()+6)%7;
 const count=new Date(year,month,0).getDate();
 const marked=new Set(model.snapshots.map(s=>s.date));
 const [from,to]=calendarSelection;
 const cells=Array(offset).fill('<span class="history-calendar-empty" aria-hidden="true"></span>');
 $('historyCalendarMonth').textContent=new Date(year,month-1,1).toLocaleDateString('de-AT',{month:'long',year:'numeric'});
 for(let day=1;day<=count;day++){
  const key=calendarDayKey(year,month-1,day),stored=marked.has(key);
  const inRange=Boolean(from&&key>=from&&key<=(to||from));
  cells.push('<button type="button" data-calendar-day="'+key+'" class="history-calendar-day'+(stored?' has-snapshot':'')+(inRange?' selected':'')+'" aria-pressed="'+inRange+'" aria-label="'+key+(stored?' · Stichtag vorhanden':'')+'">'+day+(stored?'<span class="history-calendar-dot" aria-hidden="true"></span>':'')+'</button>');
 }
 grid.innerHTML=cells.join('');
 $('historyCalendarHint').textContent=calendarSelection.length===2?calendarSelection.join(' – '):calendarSelection.length===1?'Start: '+calendarSelection[0]+' · Endtag wählen':'Starttag und Endtag wählen · Punkte markieren Stichtage.';
}
function shiftSnapshotCalendar(months){
 if(!calendarMonth)calendarMonth=(model.snapshots.at(-1)?.date||new Date().toISOString().slice(0,10)).slice(0,7);
 const [year,month]=calendarMonth.split('-').map(Number);
 const d=new Date(year,month-1+months,1);
 calendarMonth=calendarDayKey(d.getFullYear(),d.getMonth(),1).slice(0,7);
 renderSnapshotCalendar();
}
function renderHistory(){
 const info=$('performanceInfo'),summary=$('performanceSummary'),start=model.performanceFlowTrackingSince,end=model.snapshots.at(-1)?.date;
 const rate=start&&end&&start!==end?portfolioXirr(model,start,end):null;
 const twr=start&&end&&start!==end?portfolioTwr(model,start,end):null;
 const issues=start&&end&&start!==end?performanceIssues(model,start,end):[];
 const percent=v=>new Intl.NumberFormat('de-AT',{style:'percent',maximumFractionDigits:2}).format(v);
 summary.textContent=rate==null&&twr==null?'':
  [rate==null?null:'XIRR '+percent(rate),twr==null?null:'TWR '+percent(twr)].filter(Boolean).join(' · ');
 const issueText=issues.length?' Fehlende Angaben: '+issues.slice(0,4).join('; ')+'.':'';
 info.innerHTML='<p><strong>XIRR:</strong> '+(rate==null?
  esc(start?'Für eine geldgewichtete Rendite fehlen noch vollständige Bewertungen oder Ein- und Auszahlungen.'+issueText:
  'Für die geldgewichtete Rendite zuerst einen Startwert festlegen und Geldflüsse erfassen.'):
  esc(percent(rate)+' pro Jahr · '+dateLabel(start)+' bis '+dateLabel(end)))+'</p>'+
  '<p><strong>TWR:</strong> '+(twr==null?
  'Für eine zeitgewichtete Rendite fehlen noch bewertete Zeitpunkte vor und nach externen Geldflüssen.':
  esc(percent(twr)+' für den erfassten Zeitraum'))+'</p>';
 $('startPerformance').classList.toggle('hidden',Boolean(start));
 const wealth=wealthView();let data=wealth.samples;
 $('historySourceStatus').textContent=wealth.label;
 if(page==='history')$('pageDescription').textContent=PAGE_DESCRIPTIONS.history;
 const emptyHistory=!wealth.samples.length;
 $('historySourceStatus').hidden=emptyHistory;
 $('historyPage').querySelector('.history-controls').classList.toggle('hidden',emptyHistory);
 $('historyChart').classList.toggle('is-empty',emptyHistory);
 const basis=$('historyBasis');basis.parentElement.hidden=!(wealth.projection.observations.length&&wealth.projection.days.some(d=>d.partialEURExact!==null));
 const missing=[...new Set(wealth.projection.days.flatMap(d=>d.missing).map(m=>m.reason))];
 $('historyCoverageBody').innerHTML='<p>'+esc(wealth.reason)+'</p>'+(missing.length?'<ul>'+missing.slice(0,8).map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>':'')+wealth.projection.reconciliation.filter(r=>r.status==='review').slice(-30).map(r=>'<p>'+esc(r.date)+' · Kontrollpunkt '+money(Number(r.observedEURExact))+' · Rekonstruiert '+money(Number(r.reconstructedEURExact))+' · Differenz '+money(Number(r.differenceEURExact))+'</p>').join('');
 if(range==='calendar'&&calendarSelection.length===2){
  const [from,to]=calendarSelection;
  data=data.filter(x=>x.date>=from&&x.date<=to);
 }else if(range!=='calendar'){
  data=filterChartPeriod(data,'wealth',range);
 }
 const reference=wealth.basis==='observed'?capitalReferenceSeries(model,data):null,comparisonToggle=$('compareCapital');
 comparisonToggle.disabled=!reference;
 if(!reference)comparisonToggle.checked=false;
 $('capitalCompareHelp').textContent=reference?'Optionaler Vergleich zum ersten verifizierten Stichtag im gewählten Zeitraum.':'Für diesen Zeitraum fehlen ein bestätigter Startwert oder lückenlos erfasste externe Geldbewegungen.';
 $('historyChart').innerHTML=emptyHistory?'<div class="empty"><p>'+
  (model.positions.length?'Historische Werte fehlen. '+esc(wealth.reason)+' Bestandsnachweise, Tageskurse und EUR-Wechselkurse der Positionen prüfen.':'Noch keine Positionen erfasst. Lege zuerst eine Anlage an; vorhandene Buchungen und Kursdaten kannst du danach importieren.')+
  '</p><button type="button" class="btn outline" data-action="'+(model.positions.length?'history-positions':'start-wizard')+'">'+(model.positions.length?'Positionen und Historie prüfen':'Anlage hinzufügen')+'</button></div>':drawChart(data,comparisonToggle.checked?reference:null);attachChartInteractions($('historyChart'));syncChartPeriodButtons($('chartPeriods'),'data-range',range,period=>period==='all'||filterChartPeriod(wealth.samples,'wealth',period).length>=2);$('snapshotList').innerHTML=model.snapshots.length?model.snapshots.slice().reverse().map(s=>`<div class="history-row"><div><div class="history-title">${esc(dateLabel(s.date))}</div><div class="history-sub">${esc([s.note||'Portfolio-Stand',s.valuationStatus==='legacy-unverified'?'historisch ungeprüft':s.valuationStatus==='manual'?'manuell bestätigt':''].filter(Boolean).join(' · '))}</div></div><div class="holding-r"><strong class="history-amount">${money(s.total)}</strong><div class="snapshot-row-actions"><button type="button" class="row-btn" data-action="edit-snapshot" data-id="${esc(s.id)}" title="Stichtag bearbeiten" aria-label="Stichtag vom ${esc(dateLabel(s.date))} bearbeiten">${svg('pencil',15)}</button><button type="button" class="row-btn" data-action="delete-snapshot" data-id="${esc(s.id)}" title="Stichtag löschen" aria-label="Stichtag vom ${esc(dateLabel(s.date))} löschen">${svg('trash',15)}</button></div></div></div>`).join(''):empty('Hier erscheint dein erster gespeicherter Stichtag.');renderSnapshotCalendar();}
function renderPositions(){
 const quality=quoteQualitySummary(model.positions),q=quality.counts,uncertain=quality.total-q.confirmed;
 $('quoteQualitySummary').textContent=quality.total?'Kurse: '+q.confirmed+' bestätigt · '+uncertain+' nicht bestätigt':'Kurse: Noch keine Bewertungen';
 const breakdown=[q.stale&&q.stale+' älter als 7 Tage',q.derived&&q.derived+' aus Stichtagen',q.missing&&q.missing+' ohne Kurs',q.review&&q.review+' mit Prüfhinweis',q.undated&&q.undated+' ohne Kursdatum',q.unverified&&q.unverified+' ohne bestätigte Quelle'].filter(Boolean);
 $('quoteQualityBreakdown').textContent=breakdown.length?breakdown.join(' · '):quality.total?'Alle berücksichtigten Kurse sind aktuell bestätigt.':'Hier werden später Kursquellen und Einschränkungen erklärt.';
 const unresolved=unresolvedListings(),allReview=positionQualityReview(model),reviewItems=filterQualityReview(allReview,{kind:reviewKind,accountId:reviewAccount}),reviewIds=new Set(reviewItems.map(x=>x.id));
 const reviewReasons=new Map(allReview.map(g=>[g.id,g.issues.map(i=>i.label).join(' · ')]));
 const reviewById=new Map(allReview.map(g=>[g.id,g]));
 $('legacyQuoteAudit').hidden=legacyQuoteDiscrepancies(model).length===0&&!legacyAuditPerformed;
 const tools=$('qualityReviewTools');tools.classList.toggle('hidden',filter!=='__review');
 $('qualityReviewKind').value=reviewKind;
 $('qualityReviewAccount').innerHTML='<option value="">Alle Konten</option>'+model.accounts.map(a=>'<option value="'+esc(a.id)+'"'+(reviewAccount===a.id?' selected':'')+'>'+esc(a.name+' · '+(model.providers.find(p=>p.id===a.providerId)?.name||'Anbieter unbekannt'))+'</option>').join('');
 $('qualityReviewCount').textContent=reviewItems.length+' von '+allReview.length+' betroffenen Positionen. Mehrere Hinweise zählen dieselbe Position nur einmal.';
 const reviewAction=$('listingReviewAction'),reviewPanel=$('listingReviewPanel'),reviewButton=$('resolveListings');
 if(!unresolved.length)listingReviewOpen=false;
 reviewAction.classList.toggle('hidden',unresolved.length===0);
 const relevant=unresolved.filter(p=>listingReviewGaps(p).relevant.length),optionalOnly=unresolved.length-relevant.length;
 $('listingReviewIntro').textContent=unresolved.length+
  ' Wertpapierposition'+(unresolved.length===1?'':'en')+' mit fehlenden Angaben. '+
  (relevant.length?relevant.length+' mit möglicherweise kursrelevanten Kennungen. ':'')+
  (optionalOnly?optionalOnly+' nur ohne ISIN (optional). ':'')+
  'Das sind nicht automatisch Fehler.';
 reviewButton.textContent=listingReviewOpen?'Übersicht schließen':'Positionen ansehen ('+unresolved.length+')';
 reviewButton.setAttribute('aria-expanded',String(listingReviewOpen));
 reviewPanel.classList.toggle('hidden',!listingReviewOpen||!unresolved.length);
 if(listingReviewOpen&&unresolved.length){
  const ordered=unresolved.slice().sort((a,b)=>Number(Boolean(listingReviewGaps(b).relevant.length))-Number(Boolean(listingReviewGaps(a).relevant.length))||a.name.localeCompare(b.name,'de'));
  const items=ordered.slice(0,listingReviewLimit).map(p=>{
   const gaps=listingReviewGaps(p);
   const provider=model.providers.find(x=>x.id===p.providerId),account=model.accounts.find(x=>x.id===p.accountId);
   return '<div class="listing-review-item"><div class="listing-review-main"><strong>'+esc(p.name)+'</strong>'+
    '<small>'+esc([provider?.name,account?.name].filter(Boolean).join(' · '))+'</small>'+
    (gaps.relevant.length?'<span class="listing-review-relevant">Für die Kurszuordnung prüfen: '+esc(gaps.relevant.join(', '))+'</span>':'')+
    (gaps.optional.length?'<span class="listing-review-optional">Optional: '+esc(gaps.optional.join(', '))+'</span>':'')+
    '</div><button class="btn outline" type="button" data-action="edit-position" data-id="'+esc(p.id)+
    '" aria-label="'+esc(p.name)+' bearbeiten">Bearbeiten</button></div>';
  });
  reviewPanel.innerHTML='<h3 id="listingReviewHeading" tabindex="-1">Betroffene Wertpapierpositionen ('+unresolved.length+')</h3>'+
   '<p class="small-help">Fehlende Kennungen können die automatische Kurszuordnung erschweren; sie bedeuten nicht zwangsläufig falsche Bestände oder Kurse. Eine ISIN ist optional. Die Kursqualität wird separat angezeigt.</p>'+
   '<div class="listing-review-items">'+items.join('')+'</div>'+
   (ordered.length>listingReviewLimit?'<button type="button" class="btn outline listing-review-more" data-action="more-listing-review">Weitere '+
    Math.min(50,ordered.length-listingReviewLimit)+' Positionen anzeigen</button>':'');
 }else reviewPanel.replaceChildren();
 const providers=model.providers.map(p=>[p.id,p.name]);const accountFilter=filter.startsWith('account:')?model.accounts.find(a=>a.id===filter.slice(8)):null;
 $('positionFilters').innerHTML=[['all','Alle'],...((allReview.length||filter==='__review')?[['__review','Zu prüfen ('+allReview.length+')']]:[]),...(accountFilter?[[filter,'Konto: '+accountFilter.name]]:[]),...providers]
  .map(([id,label])=>'<button class="filter '+(filter===id?'active':'')+'" data-filter="'+esc(id)+'">'+esc(label)+'</button>').join('');
 const filtered=model.positions.filter(p=>filter==='all'||(filter==='__review'?reviewIds.has(p.id):accountFilter?p.accountId===accountFilter.id:p.providerId===filter));
 const visible=searchAndSortPositions(filtered,model,$('positionSearch').value,$('positionSort').value,valueEUR);
 const list=visible.slice(0,positionLimit).map(p=>{
  const provider=model.providers.find(x=>x.id===p.providerId),account=model.accounts.find(a=>a.id===p.accountId),stale=oldProviderQuote(p),quality=priceQuality(p);
  const quoteDate=p.quoteAsOf?dateLabel(p.quoteAsOf.slice(0,10)):null;
  const source=p.quoteSource||((p.priceStatus&&/stichtag|abgeleit/i.test(p.priceStatus))?'Zuletzt gespeicherter Wert':'');
  // Quote date takes precedence: do not print an unrelated position-edit timestamp beside it.
  const caption=[provider?.name||'Unbekannt',account?.name||'',source,quoteDate].filter(Boolean).map(esc).join(' · ');
  const tags='<span class="tag">'+esc(p.kind==='cash'&&account?.cashTerms?.fixedTerm===true?'Festgeld':TYPES[p.kind])+'</span>'+
   (p.symbol?'<span class="tag neutral">'+esc(p.symbol)+'</span>':'')+
   (p.valuationMode==='excluded'?'<span class="tag warn">Nicht doppelt summiert</span>':p.valuationMode==='liability'?'<span class="tag warn">Verbindlichkeit</span>':'')+
   (p.wallet?.enabled?'<span class="tag">Wallet verbunden</span>':p.managementSource==='transactions'?'<span class="tag neutral">Transaktionsbasiert</span>':'')+
   (quality.state==='ignored'?'':'<span class="tag '+(quality.state==='confirmed'?'neutral':'warn')+'">'+esc(quality.label)+'</span>');
  const facts=[
   ['Bestand',String(p.quantityExact??p.quantity)],
   ['Kurs je Einheit',String(p.priceExact??p.price)+' '+p.currency],
   ...(p.currency!=='EUR'?[['EUR je Einheit Kurswährung',String(p.fxRateExact??p.fxRate)]]:[]),
   ['Kursquelle',p.quoteSource||((p.priceStatus&&/stichtag|abgeleit/i.test(p.priceStatus))?'Gespeicherter Stichtag':'Nicht angegeben')],
   ['Kursstand',quoteDate||'Nicht angegeben'],
   ['Kursqualität',quality.label],
   ...(reviewById.get(p.id)?.issues.some(i=>i.category==='quote')?[['Bewertungshinweis',reviewById.get(p.id).issues.filter(i=>i.category==='quote').map(i=>i.label).join(' · ')]]:[]),
   ...(reviewById.get(p.id)?.issues.some(i=>i.category==='history')?[['Historienhinweis',reviewById.get(p.id).issues.filter(i=>i.category==='history').map(i=>i.label).join(' · ')],['Historien-Datenstand',reviewById.get(p.id).issues.filter(i=>i.category==='history'&&i.asOf).map(i=>dateLabel(i.asOf.slice(0,10))).join(' · ')||'Nicht angegeben']]:[]),
   ...(p.updatedAt?[['Position zuletzt geändert',dateLabel(p.updatedAt.slice(0,10))]]:[]),
   ...(p.isin?[['ISIN',p.isin]]:[]),
   ...(p.exchange?[['Börse',p.exchange]]:[]),
   ...(p.mic?[['MIC',p.mic]]:[]),
   ...(p.coinId?[['CoinGecko-ID',p.coinId]]:[]),
   ...(p.wallet?.enabled?[['Netzwerk',p.wallet.chain],['Öffentliche Wallet-Adresse',p.wallet.address]]:[])
  ];
  const rows=facts.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('');
  return '<div class="position-entry"><div class="holding-row">'+
   '<div class="holding-l"><div class="holding-mark">'+svg(positionIconName(p,account),21)+'</div>'+
   '<div class="holding-info"><div class="holding-name" title="'+esc(p.name)+'">'+esc(p.name)+'</div>'+
   '<div class="holding-note">'+caption+'</div><div>'+tags+'</div>'+
   (filter==='__review'&&reviewReasons.has(p.id)?'<div class="position-review-reason">'+esc(reviewReasons.get(p.id))+'</div><div class="settings-actions quality-review-actions">'+[...new Map(reviewById.get(p.id).issues.map(i=>[i.action,i])).values()].map(i=>'<button type="button" class="btn outline" data-action="'+i.action+'" data-id="'+esc(p.id)+'" aria-label="'+esc(i.actionLabel+' für '+p.name)+'">'+i.actionLabel+'</button>').join('')+'</div>':'')+
   '</div></div>'+
   '<div class="holding-r"><strong class="holding-money">'+money(valueEUR(p))+'</strong>'+
   '<div class="position-row-actions"><button type="button" class="row-btn" data-action="edit-position" data-id="'+esc(p.id)+'" title="Position bearbeiten" aria-label="'+esc(p.name)+' bearbeiten">'+svg('pencil',15)+'</button>'+'<button type="button" class="row-btn" data-action="delete-position" data-id="'+esc(p.id)+'" title="Position löschen" aria-label="'+esc(p.name)+' löschen">'+svg('trash',15)+'</button></div></div></div>'+
   '<details class="holding-expand"><summary>Bestand und Kursdetails</summary><dl class="holding-facts">'+rows+'</dl></details>'+(p.kind==='cash'?'<button type="button" class="btn outline" data-action="check-cash-balance" data-id="'+esc(p.id)+'" aria-label="Kontostand für '+esc(p.name)+' prüfen">Kontostand prüfen</button>':'')+ (()=>{const h=historyAction(model,p);return h&&!(filter==='__review'&&reviewById.get(p.id)?.issues.some(i=>i.action===h.action))?'<button type="button" class="btn outline" data-action="'+h.action+'" data-id="'+esc(p.id)+'">'+h.label+'</button>':'';})()+'</div>';
 });
 $('positionList').innerHTML=visible.length?list.join('')+
  (visible.length>positionLimit?'<div class="empty"><button type="button" class="btn outline" data-action="more-positions">Weitere '+Math.min(100,visible.length-positionLimit)+' Positionen anzeigen</button></div>':''):
  empty(filter==='all'?'Noch keine Positionen. Erstelle zuerst unter „Mehr“ einen Anbieter und füge deine Anlage hinzu.':
   filter==='__review'?'Keine Positionen zu diesem Prüffilter.':'Keine Positionen bei diesem Anbieter.');
}
function renderBookings(){
 $('undoCSVImport').classList.toggle('hidden',!canUndoCSV(model,csvReceipt));
 $('bookingIncome').innerHTML=annualOverviewMarkup(model,{year:incomeYear,accountId:incomeAccount},incomeLimit);
 const query=$('bookingSearch').value.trim().toLocaleLowerCase('de'),type=$('bookingFilterType').value;
 const historyRows=bookingHistoryRows(model);
 const list=historyRows.filter(b=>(!type||b.type===type||(type==='transfer'&&b.transferMatch))&&(!query||
  [b.positionName,model.positions.find(p=>p.id===b.positionId)?.name,b.notes,b.type,TX_TYPES[b.type],b.date]
   .some(x=>String(x||'').toLocaleLowerCase('de').includes(query))));
 $('bookingList').innerHTML=historyRows.length?(
  list.length?list.slice(0,bookingLimit).map(b=>bookingRowMarkup(b,model)).join('')+
   (list.length>bookingLimit?'<div class="empty"><button type="button" class="btn outline" data-action="more-bookings">Weitere '+Math.min(100,list.length-bookingLimit)+' Vorgänge anzeigen</button></div>':''):
   empty('Keine Buchungen zu diesem Filter gefunden.')):
  '<div class="empty booking-onboarding"><strong>Noch keine Buchungen erfasst</strong><p>Neue Buchungen und CSV-Importe erscheinen hier.</p></div>';
}
function renderSettings(){
 if(legacyAuditPerformed)renderLegacyQuoteAudit();
 const settings=$('providerSettings');
 const expanded=new Set([...settings.querySelectorAll('details[open][data-provider-settings]')].map(x=>x.dataset.providerSettings));
 settings.innerHTML=model.providers.length?model.providers.map(p=>{
  const accounts=model.accounts.filter(a=>a.providerId===p.id);
  const children=accounts.map(a=>'<div class="account-entry"><span>'+esc(a.name)+' <small>· '+esc(accountTypes[a.type]||accountTypes.other)+'</small>'+cashTermsAccountHint(a,esc)+'</span>'+
   '<button type="button" class="row-btn" data-action="edit-account" data-id="'+esc(a.id)+'" aria-label="Konto bearbeiten">'+svg('pencil',15)+'</button>'+
   '<button type="button" class="row-btn" data-action="delete-account" data-id="'+esc(a.id)+'" aria-label="Konto löschen">'+svg('trash',15)+'</button></div>').join('');
  return '<div class="setting-provider provider-settings-row">'+
   '<details class="provider-settings-group" data-provider-settings="'+esc(p.id)+'"'+(expanded.has(p.id)?' open':'')+'>'+
   '<summary><strong>'+esc(p.name)+'</strong><small>'+esc(types[p.type]||types.other)+' · '+accounts.length+' Konto/Konten</small></summary>'+
   '<div class="provider-settings-accounts">'+(children||'<p class="small-help">Noch keine Konten.</p>')+'</div></details>'+
   '<div class="settings-provider-actions"><button class="row-btn" data-action="edit-provider" data-id="'+esc(p.id)+'" title="Anbieter bearbeiten" aria-label="Anbieter bearbeiten">'+svg('pencil',15)+'</button>'+
   '<button class="row-btn" data-action="delete-provider" data-id="'+esc(p.id)+'" title="Anbieter löschen" aria-label="Anbieter löschen">'+svg('trash',15)+'</button></div></div>';
 }).join(''):empty('Noch kein Anbieter hinterlegt.');
 $('autoRefresh').checked=model.settings.autoRefresh!==false;
 if(document.activeElement!==$('solanaRpc'))$('solanaRpc').value=model.settings.solanaRpc||'';
 const reminder=$('backupReminder');let last=0;
 try{last=Date.parse(localStorage.getItem('foliolab-open-last-backup-at')||'')||0;}catch{}
 reminder.classList.toggle('hidden',!(backupCounter()>=15&&Date.now()-last>30*864e5));
 renderBackupStatus();
}
function renderLegacyQuoteAudit(){
 const status=$('legacyQuoteAuditStatus'),results=$('legacyQuoteAuditResults');
 if(!legacyAuditPerformed||!status||!results)return;
 const issues=legacyQuoteDiscrepancies(model);
 status.textContent=issues.length
  ?issues.length+' Position'+(issues.length===1?' enthält':'en enthalten')+' abweichende gespeicherte Kurswerte. Es wurde nichts geändert.'
  :'Keine Abweichung zwischen Anzeige- und Exaktkursen gefunden. Historische Renditen wurden nicht neu berechnet.';
 results.innerHTML=issues.map(issue=>{
  const p=model.positions.find(x=>x.id===issue.id);
  const rows=issue.fields.map(field=>{
   const price=field==='price',label=price?'Kurs':'EUR-Wechselkurs';
   const display=price?issue.displayPrice:issue.displayFx,precise=price?issue.exactPrice:issue.exactFx;
   return '<div class="legacy-quote-values">'+esc(label)+': Anzeige '+esc(String(display))+' · genaue Bewertung '+esc(String(precise))+'</div>';
  }).join('');
  const actions=issue.fields.map(field=>{
   if(field==='price'&&!issue.hasQuoteSource)
    return '<span class="small-help">Für diesen Kurs ist kein bestätigter automatischer Anbieter konfiguriert. Bitte die Position und externe Belege manuell prüfen.</span>';
   return '<button type="button" class="btn outline" data-audit-fix="'+esc(field)+'" data-id="'+esc(issue.id)+'">'+
    (field==='price'?'Aktuellen Anbieterkurs prüfen':'Aktuellen Wechselkurs prüfen')+'</button>';
  }).join('');
  return '<div class="legacy-quote-item"><strong>'+esc(issue.name||'Position')+
   (p?.symbol?' · '+esc(p.symbol):'')+'</strong>'+rows+
   '<div class="legacy-quote-actions">'+actions+'</div></div>';
 }).join('');
}
async function confirmLegacyQuoteRepair(positionId,field,button){
 const p=model.positions.find(x=>x.id===positionId);
 if(!p||!legacyQuoteDiscrepancies({positions:[p]})[0]?.fields.includes(field))
  return notify('Diese gespeicherte Kursabweichung besteht nicht mehr.',true);
 button.disabled=true;
 try{
  let value,source,date;
  if(field==='price'){
   if(['etf','fund','stock'].includes(p.kind)){
    const q=await fetchSecurityQuote(p,model.settings);
    value=q.price;source=q.source;date=q.asOf;
   }else if(p.kind==='crypto'&&p.coinId){
    const quotes=await cryptoPrices([p.coinId],model.settings.coinGeckoKey);
    const q=quotes[p.coinId],freshness=coinQuoteFreshness(q);
    if(!freshness.ok||!freshness.dated)throw Error('CoinGecko hat keinen ausreichend aktuellen datierten Kurs geliefert.');
    value=q.eur;source='CoinGecko';date=new Date(Number(q.last_updated_at)*1000).toISOString().slice(0,10);
   }else throw Error('Für diese Position fehlt eine verifizierbare Kursquelle.');
  }else{
   if(p.currency==='EUR')throw Error('EUR benötigt keinen Wechselkurs.');
   const q=await exchangeRateQuote(p.currency,'');
   value=q.rate;source=q.source;date=q.date;
  }
  const checked=verifiedCurrentQuote(value,{source,date});
  const old=field==='price'?p.priceExact:p.fxRateExact;
  const label=field==='price'?'Kurs '+p.currency:'Wechselkurs '+p.currency+'/EUR';
  if(!confirm('Korrektur für „'+p.name+'“ bestätigen?\n'+label+': bisher exakt '+old+
   ' · neuer Anbieterwert '+checked.exactValue+'\nQuelle: '+checked.source+' · Kursdatum: '+checked.date+
   '\n\nZuerst wird ein Backup der ursprünglichen Daten heruntergeladen. Historische Buchungen und Stichtage bleiben unverändert.'))return;
  downloadBackup();
  applyVerifiedQuoteRepair(model,p.id,field,checked,{confirmed:true});
  await save();
  renderLegacyQuoteAudit();
  notify('Aktueller Kurs aus '+checked.source+' übernommen. Historische Daten unverändert.');
 }catch(error){notify('Kursprüfung: '+String(error.message||error).slice(0,180),true);}
 finally{button.disabled=false;}
}
function renderBackupStatus(){
 const element=$('backupStatus');
 if(!element)return;
 let value='';
 try{value=localStorage.getItem('foliolab-open-last-backup-at')||'';}catch{}
 const date=new Date(value);
 element.textContent=value&&Number.isFinite(date.getTime())
  ?'Zuletzt für einen Download erstellt: '+date.toLocaleDateString('de-AT')+' · '+date.toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'})+'. Prüfe, ob du die Datei sicher abgelegt hast.'
  :'Noch kein Backup erstellt. Sichere deine lokalen Daten regelmäßig.';
}
let dialogOpener=null,editorSubmitting=false;
const editorDiscardGuard=createDialogDiscardGuard($('editDialog'),{
 isDirty:()=>Boolean(editor?.dirty),
 isBusy:()=>editorSubmitting,
 onClose:()=>{
  editor=null;
  const opener=dialogOpener;dialogOpener=null;
  if(opener?.isConnected)opener.focus({preventScroll:true});
 }
});
const dialogSaveLabel=title=>title.startsWith('Anbieter')?'Anbieter speichern'
 :title.startsWith('Konto')?'Konto speichern'
 :title.startsWith('Position')?'Position speichern'
 :title.startsWith('Buchung')?'Buchung speichern'
 :title.startsWith('Stichtag')?'Stichtag speichern'
 :title.startsWith('Wallet')?'Coins hinzufügen'
 :title.startsWith('CSV')?'Buchungen importieren':'Speichern';
function showDialog(title,kicker,html,onSave,{readOnly=false}={}){
 if(loadFailure&&!readOnly){notify('Portfolio nicht lesbar. Bitte zuerst Originaldaten sichern und wiederherstellen.',true);return;}
 dialogOpener=document.activeElement;
 editor={onSave,dirty:false,readOnly};
 $('dialogTitle').textContent=title;
 $('dialogKicker').textContent=kicker;
 $('dialogFields').innerHTML=html;
 $('dialogError').textContent='';
 $('dialogError').classList.add('hidden');
 $('saveDialog').textContent=readOnly?'Prüfen':dialogSaveLabel(title);
 $('cancelDialog').textContent=readOnly?'Schließen':'Abbrechen';
 $('saveDialog').disabled=false;
 $('editDialog').showModal();
 $('dialogTitle').focus({preventScroll:true});
}
function closeDialog({force=false}={}){return editorDiscardGuard.requestClose({force});}
function providerMatchMarkup(query){
 const found=providerSuggestions(query,6);
 return found.length?found.map(x=>'<button type="button" class="onboarding-suggestion" data-provider-preset="'+esc(x.name)+'"><strong>'+esc(x.name)+'</strong><span>'+esc(types[x.type])+'</span></button>').join(''):'<p class="small-help">Kein Vorschlag? Eigene Anbieterbezeichnung und Typ frei eintragen.</p>';
}
function openCashBalanceCheck(positionId){
 const position=model.positions.find(p=>p.id===positionId&&p.kind==='cash');
 if(!position)return;
 const account=model.accounts.find(a=>a.id===position.accountId),provider=model.providers.find(p=>p.id===position.providerId);
 const currency=position.currency;
 showDialog('Kontostand prüfen','AKTUELLER VERGLEICH',
  '<p class="dialog-intro">'+esc(provider?.name||'Anbieter')+' · '+esc(account?.name||'Konto')+' · '+esc(position.name)+' · '+esc(currency)+'</p>'+
  '<p class="small-help">Vergleiche den aktuellen Bank-Kontostand mit dieser Guthabenposition. Ältere Kontoauszüge eignen sich dafür nicht. Eine Differenz bleibt ein Prüfhinweis; deine Daten bleiben unverändert.</p>'+
  '<label class="field"><span>Aktueller Bank-Kontostand ('+esc(currency)+')</span><input id="cashReference" name="referenceAmount" inputmode="decimal" autocomplete="off" maxlength="55" aria-describedby="cashReferenceHelp"></label>'+
  '<p id="cashReferenceHelp" class="small-help">Betrag in der Kontowährung, z. B. 100,50. Auch 0 oder ein negativer Saldo sind möglich.</p>'+
  '<label class="csv-skip"><input type="checkbox" name="currentReference" id="cashReferenceCurrent"> Ich verwende den aktuellen Kontostand für genau diese Guthabenposition.</label>'+
  '<div id="cashComparisonResult" class="cash-comparison-result" role="status" aria-live="polite" tabindex="-1"></div>',
  values=>{
   $('cashComparisonResult').replaceChildren();
   if(loadFailure||otherTabChangedPortfolio)throw Error('Der Datenstand ist nicht aktuell. Bitte diesen Tab neu laden und erneut prüfen.');
   if(!values.currentReference)throw Error('Bitte bestätigen, dass der Kontostand aktuell ist und zu dieser Guthabenposition gehört.');
   const result=compareCurrentCashBalance(model,{positionId,referenceAmount:values.referenceAmount,currency});
   const amount=value=>value.replace('.',',')+' '+currency;
   const output=$('cashComparisonResult');
   output.replaceChildren();
   const heading=document.createElement('h3');heading.textContent=result.status==='matched'?'Kontostände stimmen rechnerisch überein':'Differenz prüfen';
   const detail=document.createElement('p');detail.textContent='In FolioLab: '+amount(result.recordedExact)+' · Bank: '+amount(result.referenceExact)+' · Differenz (Bank minus FolioLab): '+amount(result.differenceExact);
   const basis=document.createElement('p');basis.className='small-help';basis.textContent=result.basis==='opening-and-journal'
    ?'Der erfasste Bestand ist mit Anfangsbestand und Finanzjournal rechnerisch konsistent. Das bestätigt keine vollständige Bankhistorie.'
    :'Vergleich mit dem erfassten Bestand. Ohne Journalbewegungen ist keine Bankhistorie rekonstruiert.';
   const help=document.createElement('p');help.className='small-help';help.textContent=result.status==='matched'
    ?'Diese Prüfung speichert keinen Beleg und verändert keine Buchung.'
    :'Prüfe Kontozuordnung, fehlende oder doppelte Buchungen, Gebühren und Buchungszeitpunkte. Eine Differenz ist keine automatische Einzahlung.';
   output.append(heading,detail,basis,help);output.focus({preventScroll:true});
   return false;
  },{readOnly:true});
 const clear=()=>{$('cashComparisonResult').replaceChildren();$('dialogError').classList.add('hidden');};
 $('cashReference').addEventListener('input',clear);
 $('cashReferenceCurrent').addEventListener('change',clear);
}
function openProvider(p){
 showDialog(p?'Anbieter bearbeiten':'Anbieter hinzufügen','FREIE ANBIETERWAHL',
 '<p class="dialog-intro">Name eingeben, z. B. „f“, und einen passenden Anbieter aus den Vorschlägen wählen. Der Typ wird vorgeschlagen, kann aber geändert werden. Die Liste funktioniert offline; es findet keine Internetsuche statt.</p>'+
 '<label class="field"><span>Anbietername</span><input name="name" id="providerName" required maxlength="80" autocomplete="off" value="'+esc(p?.name||'')+'" placeholder="z. B. Flatex, Trade Republic …"></label>'+
 '<div id="providerMatches" class="onboarding-suggestions" role="region" aria-label="Anbietervorschläge"></div>'+
 '<label class="field"><span>Typ</span><select name="type" id="providerType">'+options(Object.entries(types),p?.type||providerExact(p?.name)?.type||'broker')+'</select></label>',
 async (v)=>{
  const name=String(v.name||'').trim();
  // Provider names are not IDs: prevent accidental duplicates from common suggestions.
  const duplicate=model.providers.find(x=>x.id!==p?.id&&x.name.trim().toLocaleLowerCase('de')===name.toLocaleLowerCase('de'));
  if(duplicate)throw Error('Diesen Anbieter gibt es bereits. Bitte den bestehenden Anbieter auswählen.');
  const x=createProvider({...v,name,id:p?.id});
  if(p)model.providers=model.providers.map(a=>a.id===p.id?x:a);else model.providers.push(x);
  await save();notify('Anbieter gespeichert.');
 });
 const name=$('providerName'),matches=$('providerMatches'),type=$('providerType');
 const show=()=>{matches.innerHTML=providerMatchMarkup(name.value);matches.classList.toggle('hidden',!name.value.trim());};
 name.addEventListener('input',()=>{const exact=providerExact(name.value);if(exact)type.value=exact.type;show();});
 name.addEventListener('change',()=>{const exact=providerExact(name.value);if(exact)type.value=exact.type;});
 matches.addEventListener('click',e=>{
  const btn=e.target.closest('[data-provider-preset]');if(!btn)return;
  const item=providerExact(btn.dataset.providerPreset);if(!item)return;
  name.value=item.name;type.value=item.type;if(editor)editor.dirty=true;matches.classList.add('hidden');name.focus();
 });
}
function accountMatchMarkup(providerId,query){
 const provider=model.providers.find(p=>p.id===providerId);
 const list=accountSuggestions(provider?.type||'other',query).slice(0,6);
 return list.length?list.map(([name,type])=>'<button type="button" class="onboarding-suggestion" data-account-preset="'+esc(name)+'"><strong>'+esc(name)+'</strong><span>'+esc(accountTypes[type])+'</span></button>').join(''):'<p class="small-help">Eigene Kontobezeichnung möglich.</p>';
}
function openAccount(a,defaultProviderId){
 const interestAsOf=localToday();
 if(!model.providers.length){openProvider();notify('Bitte zuerst einen Anbieter anlegen.');return;}
 const providerId=a?.providerId||defaultProviderId||model.accounts.find(x=>x.id===model.settings?.lastAccountId)?.providerId||(model.providers.length===1?model.providers[0].id:'');
 const provider=model.providers.find(p=>p.id===providerId),suggestion=suggestedAccountForProvider(provider?.type||'other');
 showDialog(a?'Konto bearbeiten':'Konto hinzufügen','KONTEN UND DEPOTS',
 '<p class="dialog-intro">Anbieter auswählen und einen Kontonamen eintippen. Passende Kontotypen werden vorgeschlagen; Name und Typ bleiben frei bearbeitbar.</p>'+
 '<label class="field"><span>Anbieter</span><select id="accountProvider" name="providerId" required><option value="">Anbieter auswählen</option>'+options(model.providers.map(p=>[p.id,p.name]),providerId)+'</select></label>'+
 '<label class="field"><span>Kontoname</span><input name="name" id="accountName" type="text" required maxlength="100" autocomplete="off" value="'+esc(a?.name||suggestion[0])+'" placeholder="Girokonto, Wertpapierdepot …"></label>'+
 '<div class="onboarding-suggestions" id="accountMatches" role="region" aria-label="Kontovorschläge"></div>'+
 '<div class="field-row"><label class="field"><span>Kontotyp</span><select name="type" id="accountType">'+options(Object.entries(accountTypes),a?.type||suggestion[1])+'</select></label>'+
 '<label class="field"><span>Kontowährung</span><select id="accountCurrency" name="currency">'+options([...new Set(['EUR','USD','CHF','GBP','CAD','AUD','JPY','SEK','NOK',a?.currency].filter(Boolean))].map(c=>[c,c]),a?.currency||'EUR')+'</select></label></div>'+
 (a?'':('<label class="field"><span id="accountOpeningLabel">Startguthaben (EUR) · optional</span><input id="accountOpeningAmount" name="initialBalance" type="text" inputmode="decimal" placeholder="z. B. 2500"></label>'+
 '<label class="field hidden" id="accountOpeningFxWrap"><span>EUR je Einheit Kontowährung (manueller Umrechnungskurs)</span><input name="openingFxRate" id="accountOpeningFx" type="number" min="0.00000001" step="any" placeholder="z. B. 0.92"><small>Nur bei einem Startguthaben in Fremdwährung erforderlich; keine automatische Schätzung.</small></label>'+
 '<label class="field"><span>Datum des Anfangsbestands (dokumentarisch)</span><input name="initialBalanceDate" type="date" max="'+new Date().toISOString().slice(0,10)+'" value="'+new Date().toISOString().slice(0,10)+'"></label><p class="small-help">Das Datum dokumentiert den Anfangsbestand; es erzeugt keinen rückdatierten Vermögensstichtag.</p>'))+cashTermsFormMarkup(a?.cashTerms,esc,options)+interestFormMarkup(a?.interestTerms,esc,options,{canForecast:Boolean(a),asOf:interestAsOf}),
 async v=>{
  if(a&&a.providerId!==v.providerId&&model.positions.some(p=>p.accountId===a.id))throw Error('Konto mit Positionen kann nicht zu einem anderen Anbieter verschoben werden.');
  // Validate account and opening valuation before mutating either collection.
  const next=createAccount({...v,id:a?.id,cashTerms:cashTermsFromForm(v,a?.cashTerms),interestTerms:interestTermsFromForm($('editorForm'))},model);
  const opening=a?null:openingCashInput({amount:v.initialBalance,currency:next.currency,fxRate:v.openingFxRate});
  const openingDate=String(v.initialBalanceDate||'').trim();
  if(opening&&(!/^\d{4}-\d{2}-\d{2}$/.test(openingDate)||Number.isNaN(Date.parse(openingDate))||new Date(openingDate+'T12:00:00Z').toISOString().slice(0,10)!==openingDate||openingDate>new Date().toISOString().slice(0,10)))throw Error('Bitte ein gültiges Anfangsbestandsdatum bis heute angeben.');
  const firstPosition=opening?createPosition({...opening,notes:'Anfangsbestand zum '+openingDate,providerId:next.providerId,accountId:next.id},{...model,accounts:[...model.accounts,next]}):null;
  if(a)model.accounts=model.accounts.map(x=>x.id===a.id?next:x);else model.accounts.push(next);
  if(firstPosition)model.positions.push(firstPosition);
  model.settings.lastAccountId=next.id;await save();notify('Konto gespeichert.');
 });
 bindCashTermsForm($('editorForm'));
 bindInterestForm($('editorForm'),{onEdit:()=>{if(editor)editor.dirty=true;},calculate:async parameters=>{
  if(loadFailure||otherTabChangedPortfolio)throw Error('Der Datenstand ist nicht aktuell. Bitte diesen Tab neu laden.');
  await portfolioStore.assertCurrent();
  if($('accountCurrency').value!==a.currency)throw Error('Kontowährung wurde geändert. Bitte zuerst speichern und Kontozuordnung prüfen.');
  if($('cashTermsEnabled').checked&&$('fixedTerm').checked)throw Error('Diese Prognose gilt für Tagesgeld, nicht für Festgeld.');
  return forecastAccountInterest(model,{...parameters,accountId:a.id,asOf:interestAsOf});
 }});
 const providerSelect=$('accountProvider'),name=$('accountName'),type=$('accountType'),area=$('accountMatches');
 if(!a){
  const currency=$('accountCurrency'),amount=$('accountOpeningAmount'),wrap=$('accountOpeningFxWrap'),fx=$('accountOpeningFx');
  let previousCurrency=currency.value;
  const sync=()=>{
   $('accountOpeningLabel').textContent='Startguthaben ('+currency.value+') · optional';
   wrap.classList.toggle('hidden',currency.value==='EUR');
   fx.required=currency.value!=='EUR'&&amount.value.trim()!=='';
  };
  currency.addEventListener('change',()=>{
   if(amount.value.trim()&&currency.value!==previousCurrency&&!confirm('Das eingetragene Startguthaben wird als '+currency.value+' statt '+previousCurrency+' gespeichert. Fortfahren?')){
    currency.value=previousCurrency;return;
   }
   previousCurrency=currency.value;sync();
  });
  amount.addEventListener('input',sync);sync();
 }
 const show=()=>{area.innerHTML=accountMatchMarkup(providerSelect.value,name.value);area.classList.toggle('hidden',!name.value.trim());};
 const align=()=>{const p=model.providers.find(x=>x.id===providerSelect.value),exact=accountExact(name.value,p?.type||'other');if(exact)type.value=exact[1];};
 providerSelect.addEventListener('change',()=>{
  const p=model.providers.find(x=>x.id===providerSelect.value),next=suggestedAccountForProvider(p?.type||'other');
  if(!a&&!name.dataset.userEdited){name.value=next[0];type.value=next[1];}
  show();
 });
 name.addEventListener('input',()=>{name.dataset.userEdited='true';align();show();});
 name.addEventListener('change',align);
 area.addEventListener('click',e=>{
  const btn=e.target.closest('[data-account-preset]');if(!btn)return;
  name.value=btn.dataset.accountPreset;name.dataset.userEdited='true';if(editor)editor.dirty=true;align();area.classList.add('hidden');name.focus();
 });
}
function posForm(p){const providerOptions=model.providers.map(x=>[x.id,x.name]);const preferred=model.accounts.find(a=>a.id===model.settings.lastAccountId&&a.providerId===(p?.providerId||model.providers[0]?.id));const currentAccount=p?.accountId||preferred?.id||model.accounts.find(a=>a.providerId===(p?.providerId||model.providers[0]?.id))?.id;const curr=p?.currency||'EUR';const kind=p?.kind||'etf';const coin=p?.coinId||'';const w=p?.wallet;return `<p class="dialog-intro">Prüfe die wichtigsten Positionsdaten. Weitere Zuordnungen und technische Angaben findest du in den aufklappbaren Bereichen.</p>
<div class="field-row"><label class="field"><span>Anbieter</span><input type="search" id="positionProviderSearch" class="picker-search" autocomplete="off" placeholder="Suchen, z. B. f → Flatex" aria-label="Anbieter filtern"><select name="providerId" id="positionProvider" required>${options(providerOptions,p?.providerId||model.providers[0]?.id)}</select></label><label class="field"><span>Konto / Depot</span><input type="search" id="positionAccountSearch" class="picker-search" autocomplete="off" placeholder="Konto suchen" aria-label="Konten filtern"><select name="accountId" id="positionAccount" required>${options(model.accounts.filter(a=>a.providerId===(p?.providerId||model.providers[0]?.id)).map(a=>[a.id,a.name]),currentAccount)}</select></label></div>
<details class="advanced-apis position-editor-optional" id="securityGroup"><summary>Wertpapier suchen und zuordnen</summary><p class="small-help">Optional: Mit eigenem EODHD-, FMP- oder Twelve-Data-Schlüssel nach ISIN, Ticker oder Name suchen. Übernommene Stammdaten bitte prüfen. Stückzahl und Kurs werden nicht überschrieben.</p><div class="inline-actions"><label class="field"><span>Suche</span><input id="securityQuery" placeholder="ISIN, Ticker oder Fondsname"></label><button type="button" class="btn outline" id="securitySearch">Suchen</button></div><div class="security-results hidden" id="securityResults"></div></details>
<div class="field-row"><label class="field"><span>Anlageklasse</span><select name="kind" id="positionKind">${options(Object.entries(TYPES),kind)}</select></label>${field('Name / Bezeichnung','name',p?.name||'','text','required maxlength="110" placeholder="Oder selbst eintippen"')}</div>
<div class="field-row">${field('Ticker / Symbol','symbol',p?.symbol||'','text','maxlength="32"')}${field('ISIN (optional)','isin',p?.isin||'','text','maxlength="20"')}</div><div id="exchangeField"><div class="field-row">${field('Handelsplatz (z. B. Xetra)','exchange',p?.exchange||'','text','maxlength="60"')}${field('Börsen-MIC (optional, z. B. XETR)','mic',p?.mic||'','text','maxlength="8"')}</div></div>
<div id="marketIdentifiers"><details class="advanced-apis"><summary>Externe Börsenkürzel (optional)</summary><p class="small-help">Nur den Ticker derselben ISIN, Handelswährung und Börsennotierung verwenden. Ein falsches Kürzel kann falsche Kurse liefern.</p><div class="field-row">${field('EODHD (z. B. VWCE.XETRA)','eodhdSymbol',p?.eodhdSymbol||'','text','maxlength="45"')}${field('FMP (z. B. VWCE.DE)','fmpSymbol',p?.fmpSymbol||'','text','maxlength="45"')}</div>${field('TradingView (z. B. XETR:VWCE)','tradingViewSymbol',p?.tradingViewSymbol||'','text','maxlength="48"')}</details></div>
<div class="field-row three">${field('Stückzahl / Bestand','quantity',p?.quantityExact??p?.quantity??0,'text',p?.managementSource==='transactions'?'readonly aria-label="Über Buchungen verwalteter Bestand"':'inputmode="decimal" required')}${field('Kurs pro Stück','price',p?.price??0,'number','step="any" min="0" required')}<label class="field"><span>Kurswährung</span><select name="currency" id="positionCurrency">${options(['EUR','USD','CHF','GBP','CAD','AUD','JPY','NOK','SEK','DKK','PLN','CZK','HUF','NZD','SGD'].map(x=>[x,x]),curr)}</select></label></div>
<div id="fxWrap">${field('EUR je Einheit Kurswährung (z. B. USD → EUR)','fxRate',p?.fxRate??1,'number','step="any" min="0.00000001"')}</div>
<div class="dialog-group" id="coinGroup"><strong>CoinGecko-Zuordnung (für automatische Kryptokurse)</strong>${field('CoinGecko-ID','coinId',coin,'text','placeholder="z. B. bitcoin, ethereum, solana"')}<div class="inline-actions"><label class="field"><span>Coin suchen</span><input type="search" id="coinQuery" placeholder="Name oder Symbol"></label><button type="button" class="btn outline" id="coinCatalogLoad">Alle Coins laden</button></div><div class="coin-results hidden" id="coinResults"></div></div>
<div class="dialog-group" id="walletGroup"><label class="checkbox-line"><input type="checkbox" name="walletEnabled" id="walletEnabled" ${w?.enabled?'checked':''}> Bestand per öffentlicher Wallet-Adresse abfragen</label><p class="dialog-intro">Nur Watch-only. Niemals private Schlüssel oder Wiederherstellungswörter eingeben. Bitcoin-HD unterstützt öffentliche xpub/ypub/zpub-Account-Keys. Ledger kann auch für Native SegWit (bc1q…) einen xpub exportieren; wähle bei Bedarf den passenden Adresstyp. Kein Taproot (bc1p).</p><div id="walletDetails"><label class="field"><span>Netzwerk</span><select name="walletChain" id="walletChain">${options([['btc','Bitcoin'],['btc-hd','Bitcoin HD (xpub / ypub / zpub)'],['xrp','XRP Ledger (XRP)'],['xrp-token','XRP Trust-Line Token'],['evm','EVM-Native Coin (Ethereum u. a.)'],['erc20','EVM-Token / ERC-20'],['sol','Solana (SOL)'],['spl','Solana Token / SPL']],w?.chain||'btc')}</select></label>${field('Öffentliche Adresse','walletAddress',w?.address||'','text','maxlength="180" autocomplete="off" placeholder="Wallet-Adresse (kein privater Schlüssel)"')}<div id="walletHdField"><label class="field"><span>Bitcoin-HD-Adresstyp</span><select name="walletHdType" id="walletHdType">${options([['auto','Automatisch erkennen (Ledger: Native SegWit zuerst)'],['p2wpkh','Native SegWit (bc1q…)'],['p2sh-p2wpkh','Nested SegWit (3…)'],['p2pkh','Legacy (1…)']],w?.addressType||'auto')}</select></label><p class="small-help">Der xpub-Präfix allein bestimmt bei Ledger nicht den Adresstyp. Ohne nachweisbaren Verlauf wird der Bestand bei automatischer Erkennung nicht auf null gesetzt.</p></div><div id="tokenFields">${field('Token-Contract / Mint','walletContract',w?.contract||'','text','maxlength="120"')}${field('Token-Dezimalstellen','walletDecimals',w?.decimals??18,'number','min="0" max="30" step="1"')}</div><div id="chainIdField">${field('EVM Chain-ID','walletChainId',w?.chainId??1,'number','min="1" step="1"')}</div></div></div>
<details class="advanced-apis"><summary>Einstandswert (optional)</summary><p class="small-help">Nur den tatsächlich bekannten gesamten Anschaffungswert des aktuellen Bestands in EUR eintragen. Leer lassen, wenn unbekannt.</p>${field('Einstandswert in EUR','costBasisEUR',p?.costBasisEUR??'','number','min="0" step="any" placeholder="Unbekannt"')}</details>
<details class="advanced-apis" id="defiPosition"><summary>Wirtschaftliche Position / DeFi (optional)</summary><p class="small-help">Sicherheiten, Liquid Staking und derivative Positionen bewusst zuordnen. Kein automatisches Entfernen oder Bewerten.</p><label class="field"><span>Wirtschaftliche Funktion</span><select name="economicRole" id="defiRole">${options([['standard','Normal'],['collateral','Hinterlegt / Collateral'],['liquid-staking','Liquid Staking'],['vault','Vault'],['liquidity-pool','Liquidity Pool'],['lending','Lending'],['borrowed','Geliehene Assets / Verbindlichkeit'],['wrapped','Wrapped Token']],p?.economicRole||'standard')}</select></label><label class="field"><span>In der Vermögenssumme</span><select name="valuationMode" id="defiValuation">${options([['included','Anrechnen'],['excluded','Nicht anrechnen (bereits durch andere Position repräsentiert)'],['liability','Als Verbindlichkeit abziehen']],p?.valuationMode||'included')}</select></label><label class="field"><span>Wird repräsentiert durch</span><select name="representedByPositionId" id="defiRepresented" aria-describedby="defiGuidance">${options([['','Keine Zuordnung'],...model.positions.filter(x=>x.id!==p?.id).map(x=>[x.id,x.name])],p?.representedByPositionId||'')}</select></label><p id="defiGuidance" class="economic-guidance" role="status" aria-live="polite"></p></details>${field('Notiz (optional)','notes',p?.notes||'','text','maxlength="300"')}<div class="small-help">Kurse für Fremdwährungen werden nur mit einem gültigen EUR-Umrechnungskurs korrekt berücksichtigt. Wallet-Adressen werden beim Abruf an den jeweiligen Blockchain-Dienst gesendet.</div>${p?`<button type="button" class="danger-link" id="deletePosition">Position löschen</button>`:''}`;}
function syncEconomicPositionForm(){
 const role=$('defiRole'),mode=$('defiValuation'),linked=$('defiRepresented'),hint=$('defiGuidance');
 if(!role||!mode||!linked||!hint)return;
 const target=model.positions.find(x=>x.id===linked.value);
 const state=economicFormGuidance(role.value,mode.value,linked.value,target?.valuationMode||'included');
 linked.required=state.targetRequired;
 linked.setAttribute('aria-required',String(state.targetRequired));
 role.setAttribute('aria-invalid',String(state.roleInvalid));
 hint.textContent=state.message;
 hint.classList.toggle('economic-guidance-warning',state.warning);
}
function refreshPositionAccounts(){
 const select=$('positionAccount'),selected=select.dataset.selectedAccountId||select.value;
 const provider=$('positionProvider').value,kind=$('positionKind').value;
 const q=String($('positionAccountSearch')?.value||'').trim().toLocaleLowerCase('de');
 const accounts=model.accounts.filter(a=>a.providerId===provider&&(!q||a.name.toLocaleLowerCase('de').includes(q)))
  .sort((a,b)=>Number(b.type===suggestedAccountType(kind))-Number(a.type===suggestedAccountType(kind)));
 // A filter only changes visibility, never the confirmed account selection.
 select.innerHTML=options(accounts.map(a=>[a.id,a.name]),selected);
 if(!accounts.some(a=>a.id===selected))select.selectedIndex=-1;
 select.required=true;
}
function refreshPositionProviders(){
 const q=String($('positionProviderSearch')?.value||'').trim().toLocaleLowerCase('de');
 const select=$('positionProvider'),selected=select.dataset.selectedProviderId||select.value;
 const providers=model.providers.filter(p=>!q||p.name.toLocaleLowerCase('de').includes(q));
 select.innerHTML=options(providers.map(p=>[p.id,p.name]),selected);
 if(!providers.some(p=>p.id===selected))select.selectedIndex=-1;
 refreshPositionAccounts();
}
function polishPositionEditorLayout(position){
 // Presentation-only rearrangement: move the original, already-populated form
 // controls rather than cloning or recreating them (preserves names and values).
 const selectRow=$('positionProvider').closest('.field-row');
 const picker=document.createElement('details');
 picker.id='positionPickerSearch';
 picker.className='advanced-apis position-editor-optional';
 const pickerTitle=document.createElement('summary');
 pickerTitle.textContent='Anbieter oder Konto suchen';
 const pickerFields=document.createElement('div');
 pickerFields.className='field-row';
 for(const [id,label] of [['positionProviderSearch','Anbieter filtern'],['positionAccountSearch','Konten filtern']]){
  const search=$(id);
  const wrap=document.createElement('label');
  wrap.className='field';
  const heading=document.createElement('span');
  heading.textContent=label;
  wrap.append(heading,search);
  pickerFields.append(wrap);
 }
 picker.append(pickerTitle,pickerFields);
 selectRow.after(picker);
 const identity=$('positionKind').closest('.field-row');
 const ticker=$('positionKind').closest('.field-row').nextElementSibling;
 const holdings=$('positionCurrency').closest('.field-row');
 const fx=$('fxWrap');
 const finder=$('securityGroup');
 ticker.after(holdings,fx,finder);
 const market=document.createElement('details');
 market.id='positionMarketMore';
 market.className='advanced-apis position-editor-optional';
 const marketTitle=document.createElement('summary');
 marketTitle.textContent='Handelsplatz und technische Börsenkürzel';
 market.append(marketTitle,$('exchangeField'),$('marketIdentifiers'));
 finder.after(market);
 const crypto=$('coinGroup');
 const wallet=$('walletGroup');
 const walletMore=document.createElement('details');
 walletMore.id='positionWalletMore';
 walletMore.className='advanced-apis position-editor-optional';
 const walletTitle=document.createElement('summary');
 walletTitle.textContent='Öffentliche Wallet-Verknüpfung (optional)';
 wallet.before(walletMore);
 walletMore.append(walletTitle,wallet);
 if(position?.wallet?.enabled)walletMore.open=true;
}
function refreshPosForm(){const kind=$('positionKind').value,crypto=kind==='crypto';$('coinGroup').classList.toggle('hidden',!crypto);$('walletGroup').classList.toggle('hidden',!crypto);$('securityGroup').classList.toggle('hidden',!['etf','stock','fund'].includes(kind));$('exchangeField').classList.toggle('hidden',!['etf','stock','fund'].includes(kind));$('marketIdentifiers').classList.toggle('hidden',!['etf','stock','fund'].includes(kind));$('positionMarketMore').classList.toggle('hidden',!['etf','stock','fund'].includes(kind));$('positionWalletMore').classList.toggle('hidden',!crypto);const coinCurrency=$('positionCurrency');if(crypto&&coinCurrency.value!=='EUR'){coinCurrency.value='EUR';} if(crypto){const currPos=$('fxWrap').querySelector('input');currPos.value=1;}$('fxWrap').classList.toggle('hidden',coinCurrency.value==='EUR'||crypto);$('walletDetails').classList.toggle('hidden',!$('walletEnabled').checked);const chain=$('walletChain').value;$('tokenFields').classList.toggle('hidden',!['erc20','spl'].includes(chain));$('chainIdField').classList.toggle('hidden',!['evm','erc20'].includes(chain));$('walletHdField').classList.toggle('hidden',chain!=='btc-hd');}
function openPosition(p){++lookupSequence;securityCache.clear();if(!model.providers.length){go('more');openProvider();notify('Lege zuerst einen Anbieter an.');return;}const target=p?.providerId||model.providers[0].id;if(!model.accounts.some(a=>a.providerId===target)){openAccount(null,target);notify('Lege zuerst ein Konto oder Depot an.');return;}showDialog(p?'Position bearbeiten':'Position hinzufügen','DEIN PORTFOLIO',posForm(p),async (v)=>{const wallet=v.walletEnabled?{enabled:true,chain:v.walletChain,address:v.walletAddress,contract:v.walletContract,decimals:v.walletDecimals,chainId:v.walletChainId,addressType:v.walletHdType}:null;if(p?.managementSource==='transactions'){v.quantity=p.quantityExact??p.quantity;v.costBasisEUR=p.costBasisEUR;}const listingChanged=Boolean(p&&['symbol','currency','exchange','mic','isin'].some(k=>String(p[k]||'').toUpperCase()!==String(v[k]||'').toUpperCase()));const pos=createPosition({...v,id:p?.id,wallet,managementSource:p?.managementSource,updatedAt:p?.updatedAt,realizedPnLEUR:p?.realizedPnLEUR,
   costBasisExact:p&&String(v.costBasisEUR)===String(p.costBasisEUR)?p.costBasisExact:undefined,
   realizedPnLExact:p?.realizedPnLExact,
   priceExact:p&&String(v.price)===String(p.price)?p.priceExact:undefined,
   priceStatus:listingChanged?'Neue Börsenzuordnung: Kurs prüfen':p&&String(v.price)===String(p.price)?p.priceStatus:null,
   quoteSource:!listingChanged&&p&&String(v.price)===String(p.price)?p.quoteSource:null,
   quoteAsOf:!listingChanged&&p&&String(v.price)===String(p.price)?p.quoteAsOf:null,
   quoteFetchedAt:!listingChanged&&p&&String(v.price)===String(p.price)?p.quoteFetchedAt:null,
   quoteQuality:!listingChanged&&p&&String(v.price)===String(p.price)?p.quoteQuality:null,
   fxRateExact:p&&String(v.fxRate)===String(p.fxRate)?p.fxRateExact:undefined,
   fxSource:p&&String(v.fxRate)===String(p.fxRate)?p.fxSource:null,
   fxRateDate:p&&String(v.fxRate)===String(p.fxRate)?p.fxRateDate:null,
   fxUpdatedAt:p&&String(v.fxRate)===String(p.fxRate)?p.fxUpdatedAt:null},model);if(p&&model.priceHistories?.[p.id]&&(pos.symbol!==p.symbol||pos.isin!==p.isin||pos.currency!==p.currency||pos.kind!==p.kind||pos.exchange!==p.exchange||pos.mic!==p.mic))throw Error('Für diese Position ist ein CSV-Kursverlauf gespeichert. Bitte den Kursverlauf vor Änderung von Symbol, ISIN, Börse oder Währung entfernen.');validateEconomicPosition(pos,{positions:p?model.positions.map(a=>a.id===p.id?pos:a):[...model.positions,pos]});if(p)model.positions=model.positions.map(a=>a.id===p.id?pos:a);else model.positions.push(pos);model.settings.lastAccountId=pos.accountId;snapshot(model);await save();notify('Position gespeichert.');});polishPositionEditorLayout(p);['positionKind','positionCurrency','walletEnabled','walletChain'].forEach(id=>$(id).addEventListener('change',()=>{if(id==='positionKind')refreshPositionAccounts();refreshPosForm();}));$('positionProvider').dataset.selectedProviderId=$('positionProvider').value;
 $('positionAccount').dataset.selectedAccountId=$('positionAccount').value;
 $('positionAccount').addEventListener('change',e=>{e.target.dataset.selectedAccountId=e.target.value;});
 $('positionProvider').addEventListener('change',e=>{
  e.target.dataset.selectedProviderId=e.target.value;
  $('positionAccount').dataset.selectedAccountId='';
  $('positionAccountSearch').value='';
  refreshPositionAccounts();
 });
 $('positionProviderSearch').addEventListener('input',refreshPositionProviders);
 $('positionAccountSearch').addEventListener('input',refreshPositionAccounts);
 refreshPositionAccounts();refreshPosForm();
 ['defiRole','defiValuation','defiRepresented'].forEach(id=>$(id).addEventListener('change',syncEconomicPositionForm));
 syncEconomicPositionForm();
 $('coinQuery').addEventListener('input',showCoinResults);$('coinCatalogLoad').addEventListener('click',loadCoins);$('securitySearch').addEventListener('click',lookupSecurity);$('securityQuery').addEventListener('input',()=>{clearTimeout(securityDebounce);const q=$('securityQuery').value.trim();if(q.length>=3&&(model.settings.eodhdKey||model.settings.fmpKey||model.settings.twelveKey))securityDebounce=setTimeout(lookupSecurity,650);});$('securityQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupSecurity();}});if(p)$('deletePosition').addEventListener('click',()=>confirmDeletePosition(p.id,{fromDialog:true}));}
function showCoinResults(){const area=$('coinResults');const term=$('coinQuery').value;const results=searchCatalog(catalog,term);area.classList.remove('hidden');area.innerHTML=results.length?results.map(c=>`<button class="result-item" data-coin="${esc(c.id)}" data-symbol="${esc(c.symbol)}" data-name="${esc(c.name)}" type="button"><span><strong>${esc(c.symbol)}</strong> · ${esc(c.name)}</span><small>${esc(c.id)}</small></button>`).join(''):empty('Kein Treffer. CoinGecko-ID kann auch manuell eingetragen werden.');area.querySelectorAll('[data-coin]').forEach(b=>b.addEventListener('click',()=>{const form=$('editorForm');form.elements.coinId.value=b.dataset.coin;if(!form.elements.name.value)form.elements.name.value=b.dataset.name;form.elements.symbol.value=b.dataset.symbol;form.elements.currency.value='EUR';if(editor)editor.dirty=true;refreshPosForm();area.classList.add('hidden');}));}
async function loadCoins(){const button=$('coinCatalogLoad');button.disabled=true;button.textContent='Lade Katalog …';try{catalog=await coinCatalog(model.settings.coinGeckoKey);fullCatalog=true;notify(`${catalog.length} Kryptowährungen verfügbar.`);showCoinResults();}catch(e){notify(`Katalog nicht erreichbar: ${e.message}`,true);}finally{button.disabled=false;button.textContent=fullCatalog?'Katalog aktualisieren':'Alle Coins laden';}}
const securityCache=new Map();let lookupSequence=0,securityDebounce=null;
async function lookupSecurity(){
 const sequence=++lookupSequence,area=$('securityResults'),term=$('securityQuery')?.value.trim();
 if(!term)return notify('Bitte ISIN, Ticker oder Fondsname eingeben.',true);
 area.classList.remove('hidden');area.innerHTML=empty('Suche läuft …');
 try{
  // Cache only per current editor opening, never store secret keys or query responses in backups.
  const cacheKey=term.toUpperCase()+'|'+['eodhdKey','fmpKey','twelveKey'].map(k=>Boolean(model.settings[k])).join('-');
  let lookup=securityCache.get(cacheKey);
  if(!lookup){
   lookup=await discoverSecurityListings(term,model.settings);
   if(securityCache.size>25)securityCache.clear();
   securityCache.set(cacheKey,lookup);
  }
  if(sequence!==lookupSequence||!$('securityQuery')||$('securityQuery').value.trim()!==term)return;
  const fields=$('editorForm').elements;
  const existing={isin:fields.isin.value,currency:fields.currency.value,price:fields.price.value};
  const results=rankListings(lookup.results,term,existing);
  const note='<p class="small-help">Quelle: '+esc(lookup.provider.toUpperCase())+' · '+results.length+' Börsennotierungen. Treffer ohne ISIN benötigen zusätzliche Prüfung. Bei anderen Währungen keine automatische Übernahme bestehender Kurse.</p>';
  area.innerHTML=note+(results.length?results.map((a,i)=>{
   const status=listingCompatibility(a,existing);
   const identity=a.isin?' · '+a.isin:' · ISIN nicht bestätigt';
   return '<button class="result-item" type="button" data-security="'+i+'" '+(status.ok?'':'disabled')+
    '><span><strong>'+esc(a.symbol)+'</strong> · '+esc(a.name)+'</span><small>'+
    esc([a.exchange,a.mic,a.currency].filter(Boolean).join(' · ')+identity)+
    (status.ok?'':' · '+status.reason)+'</small></button>';
  }).join(''):empty('Keine passenden Notierungen. Du kannst alle Angaben weiterhin manuell erfassen.'));
  area.querySelectorAll('[data-security]').forEach(button=>button.addEventListener('click',()=>{
   if(sequence!==lookupSequence)return;
   const entry=results[Number(button.dataset.security)],f=$('editorForm').elements;
   if(!entry)return;
   const check=listingCompatibility(entry,{isin:f.isin.value,currency:f.currency.value,price:f.price.value});
   if(!check.ok)return notify(check.reason,true);
   const warning=check.warning||!entry.isin?'Die Quelle bestätigt keine ISIN für diese Notierung. Bitte Wertpapieridentität, Handelsplatz und Währung selbst überprüfen.':'';
   if(!confirm('Diese Börsennotierung übernehmen?\n'+entry.name+'\n'+entry.symbol+' · '+entry.exchange+' · '+(entry.mic||'ohne MIC')+' · '+entry.currency+
    '\nISIN: '+(entry.isin||f.isin.value||'nicht bestätigt')+
    '\n\n'+(warning||'Nur die Identität der Börsennotierung übernehmen. Preise, Stückzahlen und Buchungen bleiben unverändert.')))return;
   // Populate listing identifiers only. Never import prices from a search result.
   f.symbol.value=entry.symbol;f.name.value=entry.name;
   if(entry.isin)f.isin.value=entry.isin;
   f.exchange.value=entry.exchange;f.mic.value=entry.mic;
   f.eodhdSymbol.value=entry.eodhdSymbol;f.fmpSymbol.value=entry.fmpSymbol;
   f.tradingViewSymbol.value=entry.tradingViewSymbol;
   if(entry.currency!==f.currency.value){
    if(Number(f.price.value)>0)return notify('Bitte Kurswährung und aktuellen Kurs zuerst manuell abstimmen.',true);
    f.currency.value=entry.currency;
    if(entry.currency!=='EUR'){f.fxRate.value='';notify('Kurswährung prüfen und EUR-Wechselkurs eingeben.',true);}
   }
   if(editor)editor.dirty=true;
   refreshPosForm();area.classList.add('hidden');
  }));
 }catch(e){
  if(sequence!==lookupSequence||!$('securityResults'))return;
  area.innerHTML=empty('Wertpapiersuche: '+String(e.message||e).slice(0,350));
 }
}
function listingReviewGaps(p){
 if(!['etf','stock','fund'].includes(p.kind))return {relevant:[],optional:[]};
 const relevant=[];
 if(!String(p.symbol||'').trim())relevant.push('Ticker/Symbol');
 if(!String(p.currency||'').trim())relevant.push('Kurswährung');
 if(!String(p.mic||'').trim()&&!String(p.exchange||'').trim())relevant.push('Handelsplatz oder MIC');
 const optional=!String(p.isin||'').trim()?['ISIN (optional)']:[];
 return {relevant,optional};
}
function unresolvedListings(){
 return model.positions.filter(p=>{
  const gap=listingReviewGaps(p);
  return gap.relevant.length||gap.optional.length;
 });
}
function openListingReview(){
 if(!unresolvedListings().length)return;
 listingReviewOpen=!listingReviewOpen;
 listingReviewLimit=50;
 renderPositions();
}
// Wallet-import is deliberately separate from manual asset creation. The user
// reviews all discovered assets before anything is persisted.
let scannedWalletAssets=[];let scannedWalletKey='',walletScanGeneration=0;
const walletScanIdentity=(network,address,addressType='auto')=>network+'|'+address+'|'+(network==='btc-hd'?addressType:'');
function openWalletImport(){
 scannedWalletAssets=[];scannedWalletKey='';walletScanGeneration++;
 const networks=NETWORKS.filter(n=>n.mode!=='manual').map(n=>[n.id,n.name+' · '+n.note]);
 const walletProviders=model.providers.filter(p=>p.type==='wallet');
 const otherProviders=model.providers.filter(p=>p.type!=='wallet');
 // Never attach a scan to the first of several existing wallet providers.
 const selectedProvider=walletProviders.length===1?walletProviders[0].id:walletProviders.length?'':'__new__';
 const providers=(walletProviders.length>1?'<option value="">Wallet-Anbieter auswählen</option>':'')+
  '<option value="__new__"'+(selectedProvider==='__new__'?' selected':'')+'>+ Neue Wallet anlegen</option>'+
  (walletProviders.length?'<optgroup label="Wallet-Anbieter">'+options(walletProviders.map(p=>[p.id,p.name]),selectedProvider)+'</optgroup>':'')+
  (otherProviders.length?'<optgroup label="Andere Anbieter">'+options(otherProviders.map(p=>[p.id,p.name]),selectedProvider)+'</optgroup>':'');
 showDialog('Wallet hinzufügen','NUR ÖFFENTLICHE DATEN',
  '<p class="dialog-intro">Lass FolioLab deine Coins anhand einer öffentlichen Adresse erkennen. Du verbindest kein Konto und gibst keine Zugriffsrechte frei.</p>'+
  '<label class="field"><span>Blockchain</span><select id="scanNetwork" name="network">'+options(networks,'1')+'</select></label>'+
  '<label class="field"><span>Öffentliche Wallet-Adresse</span><input name="address" id="scanAddress" required autocomplete="off" spellcheck="false" placeholder="0x…" aria-describedby="scanAddressHint"></label>'+
  '<p id="scanAddressHint" class="small-help">Kopiere die öffentliche Empfangsadresse deiner Wallet. Niemals Seed-Phrase oder privaten Schlüssel eingeben.</p>'+
  '<div class="field hidden" id="scanHdField"><label class="field"><span>Bitcoin-Adresstyp (optional)</span><select id="scanHdType" name="hdAddressType">'+
  options([['auto','Automatisch erkennen (Ledger: Native SegWit zuerst)'],['p2wpkh','Native SegWit (bc1q…)'],['p2sh-p2wpkh','Nested SegWit (3…)'],['p2pkh','Legacy (1…)']],'auto')+'</select></label></div>'+
  '<p id="hdPrivacyHint" class="small-help hidden">Bitcoin-HD: Bei einem xpub-Scan werden mehrere zusammengehörige Empfangs- und Wechselgeldadressen an einen öffentlichen Explorer gesendet. Dadurch können Adressen miteinander verknüpft werden. Taproot (bc1p) wird derzeit nicht unterstützt.</p>'+
  '<details class="advanced-apis wallet-staking-options" id="walletStakingOptions"><summary>Staking-Unterstützung prüfen (optional)</summary>'+
    '<p class="small-help">Hier erfährst du, welche Staking-Arten für die Netzwerksuche unterstützt werden. Diese Auswahl filtert den Scan nicht auf ein einzelnes Staking-Asset: Er zeigt alle vom jeweiligen Netzwerk unterstützten Guthaben.</p>'+
    '<label class="field"><span>Staking-Asset auswählen</span><select id="scanAsset" aria-describedby="scanAssetInfo">'+options([['','Keine Vorauswahl'],...STAKING_ASSETS.map(a=>[a.id,a.name+' ('+a.ticker+') · '+STAKING_MODES[a.mode]])],'')+'</select></label>'+
    '<p id="scanAssetInfo" class="small-help" role="status">Nicht alle Staking-Positionen sind anhand einer öffentlichen Adresse automatisch erkennbar.</p></details>'+
  '<div class="wallet-scan-action"><button class="btn primary" type="button" id="scanWalletButton">Coins suchen</button><p id="scanWalletStatus" class="small-help" role="status">Noch keine Suche gestartet.</p></div>'+
  '<div id="walletScanResults" class="wallet-scan-results"></div>'+
  '<section id="scanSaveSettings" class="wallet-save-settings hidden"><h3>Wo möchtest du die Coins speichern?</h3>'+
    '<p class="small-help">Die gefundenen Coins werden unter dieser Wallet in FolioLab abgelegt. Du kannst auch einen vorhandenen Anbieter verwenden.</p>'+
    '<label class="field"><span>Wallet / Anbieter</span><select name="providerId" id="scanProvider">'+providers+'</select></label>'+
    field('Name der neuen Wallet','providerName','Meine Wallet','text','id="scanProviderName" maxlength="80"')+
    '<label class="field"><span>Wallet-Konto</span><select name="accountId" id="scanAccount"></select></label></section>'+
  '<details class="advanced-apis wallet-scan-help"><summary>Welche Coins und Staking-Arten werden erkannt?</summary>'+
    '<p class="small-help">Die Suche zeigt bestätigte öffentliche Guthaben. Unbekannte oder auffällige Tokens werden aus Sicherheitsgründen zunächst ausgeblendet. Einige Staking-Verträge, ETH-Validatoren, Vaults, Avalanche-P-Chain und externe NEAR-Pools erfordern eine manuelle Erfassung oder eigene Adapter. Natives SOL-Staking benötigt gegebenenfalls einen Solana-RPC (Mehr → Solana-Staking einrichten).</p>'+
    '<p class="small-help">Beim Suchen wird die öffentliche Adresse an den jeweiligen Blockchain-Dienst übertragen. Ein API-Schlüssel oder Login ist für die üblichen Netzwerke nicht nötig.</p></details>',
  async v=>{
   if(!scannedWalletAssets.length||scannedWalletKey!==walletScanIdentity(v.network,String(v.address).trim(),v.hdAddressType))throw Error('Bitte die aktuelle Adresse erneut scannen.');
   const chosen=[...$('walletScanResults').querySelectorAll('input[data-wallet-asset]:checked')].map(c=>scannedWalletAssets[Number(c.dataset.walletAsset)]).filter(Boolean);
   if(!chosen.length)throw Error('Bitte mindestens einen gefundenen Coin auswählen.');
   // Fail before changing the model if an ambiguous storage choice remains.
   if(!v.providerId||(v.providerId!=='__new__'&&!model.providers.some(p=>p.id===v.providerId)))throw Error('Bitte den Wallet-Anbieter auswählen.');
   if(!v.accountId||(v.accountId!=='__new__'&&!model.accounts.some(a=>a.id===v.accountId&&a.providerId===v.providerId)))throw Error('Bitte das Wallet-Konto auswählen.');
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
    if(existing){updateScannedWalletPosition(existing,asset);updated++;continue;}
    const position=createPosition({kind:'crypto',providerId,accountId,name:asset.name,symbol:asset.symbol,coinId:asset.coinId,quantity:asset.quantityExact??asset.quantity,price:asset.price||0,currency:'EUR',wallet:{enabled:true,chain:asset.chain,address:String(v.address).trim(),contract:asset.contract||'',chainId:asset.chainId||1,decimals:asset.decimals,addressType:asset.addressType||v.hdAddressType||'auto'}},model);
    model.positions.push(position);added++;
   }
   if(added||updated){snapshot(model);await save();go('positions');}
   notify(added+' neu · '+updated+' aktualisiert. Nicht erkannte Coins bleiben erhalten.');
  });
 $('saveDialog').disabled=true;
 $('saveDialog').textContent='Coins speichern';
 const updateSave=()=>{
  const count=$('walletScanResults').querySelectorAll('[data-wallet-asset]:checked').length;
  const providerId=$('scanProvider').value,accountId=$('scanAccount').value;
  const validProvider=providerId==='__new__'||model.providers.some(p=>p.id===providerId);
  const validAccount=accountId==='__new__'||model.accounts.some(a=>a.id===accountId&&a.providerId===providerId);
  $('saveDialog').disabled=!count||!scannedWalletKey||!validProvider||!validAccount;
  $('saveDialog').textContent=count?count+' Coin'+(count===1?'':'s')+' speichern':'Coins speichern';
 };
 const toggleNew=()=>{
  $('scanProviderName').parentElement.classList.toggle('hidden',$('scanProvider').value!=='__new__');
  const wallets=model.accounts.filter(a=>a.providerId===$('scanProvider').value&&a.type==='wallet');
  const selectedAccount=wallets.length===1?wallets[0].id:wallets.length?'':'__new__';
  $('scanAccount').innerHTML=(wallets.length>1?'<option value="">Wallet-Konto auswählen</option>':'')+
   options([...wallets.map(a=>[a.id,a.name]),['__new__','+ Neues Wallet-Konto']],selectedAccount);
  updateSave();
 };
 $('scanProvider').addEventListener('change',toggleNew);$('scanAccount').addEventListener('change',updateSave);toggleNew();
 const updateHdHint=()=>{
  const network=$('scanNetwork').value,hd=network==='btc-hd';
  $('hdPrivacyHint').classList.toggle('hidden',!hd);
  $('scanHdField').classList.toggle('hidden',!hd);
  $('scanAddress').placeholder=hd?'xpub… / ypub… / zpub…':network==='btc'?'bc1… / 1… / 3…':network==='sol'?'Solana-Adresse':network==='xrp'?'r…':'0x… / öffentliche Adresse';
 };
 const resetWalletScan=()=>{
  const hadScan=$('scanWalletStatus').textContent!=='Noch keine Suche gestartet.';
  walletScanGeneration++;
  scannedWalletAssets=[];scannedWalletKey='';
  $('walletScanResults').innerHTML='';
  $('scanSaveSettings').classList.add('hidden');
  $('scanWalletStatus').textContent=hadScan?'Eingabe geändert – bitte erneut suchen.':'Noch keine Suche gestartet.';
  updateSave();
  const staking=lookupStakingAsset($('scanAsset').value);
  $('scanWalletButton').disabled=Boolean(staking&&!staking.scannerNetwork);
 };
 $('scanNetwork').addEventListener('change',()=>{
  const addressWasEntered=Boolean($('scanAddress').value.trim());
  $('scanAddress').value='';
  resetWalletScan();$('scanAsset').value='';
  const name=NETWORKS.find(n=>n.id===$('scanNetwork').value);
  $('scanAssetInfo').textContent='Netzwerk manuell auf '+(name?.name||'Auswahl')+' gewechselt. Staking-Vorauswahl zurückgesetzt.'+
   (addressWasEntered?' Die bisherige Adresse wurde aus Sicherheitsgründen geleert; bitte die passende öffentliche Adresse erneut eingeben.':'')+
   (name?.note?' '+name.note:'');
  $('scanWalletButton').disabled=false;updateHdHint();
 });
 $('scanAsset').addEventListener('change',()=>{
  const selected=lookupStakingAsset($('scanAsset').value);
  resetWalletScan();
  if(!selected){
   $('scanAssetInfo').textContent='Die normale Suche zeigt alle vom Netzwerk unterstützten Guthaben – keine Auswahl eines einzelnen Assets.';
   $('scanWalletButton').disabled=false;return;
  }
  const supported=Boolean(selected.scannerNetwork);
  $('scanAssetInfo').textContent=STAKING_MODES[selected.mode]+': '+selected.note+
   (supported?' · Die Suche prüft alle vom Netzwerk unterstützten Guthaben, nicht nur '+selected.ticker+'.':
    ' · Kein automatischer Scan für dieses Staking-Asset. Erfasse den Bestand unter Positionen → Position hinzufügen manuell.');
  $('scanWalletButton').disabled=!supported;
  if(supported&&$('scanNetwork').value!==selected.scannerNetwork){
   const oldAddress=Boolean($('scanAddress').value.trim());
   $('scanNetwork').value=selected.scannerNetwork;
   $('scanAddress').value='';updateHdHint();
   const name=NETWORKS.find(n=>n.id===selected.scannerNetwork)?.name||selected.network;
   $('scanAssetInfo').textContent+=' · Netzwerk automatisch auf '+name+' umgestellt.'+
    (oldAddress?' Die bisherige Adresse wurde geleert; bitte die passende öffentliche Adresse erneut eingeben.':
     ' Bitte die öffentliche Adresse für dieses Netzwerk eingeben.');
  }
 });
 $('scanHdType').addEventListener('change',resetWalletScan);
 $('scanAddress').addEventListener('input',resetWalletScan);
 $('walletScanResults').addEventListener('change',updateSave);
 updateHdHint();
 $('scanWalletButton').addEventListener('click',scanWalletNow);
}
async function scanWalletNow(){
  const button=$('scanWalletButton'),status=$('scanWalletStatus'),area=$('walletScanResults');
  const network=$('scanNetwork').value,address=$('scanAddress').value.trim();
  if(!address){status.textContent='Bitte die öffentliche Wallet-Adresse eingeben.';return;}
  const scanGeneration=++walletScanGeneration;
  const scanKey=walletScanIdentity(network,address,$('scanHdType').value);
  button.disabled=true;status.textContent=network==='btc-hd'?'Scanne Bitcoin-Adressen …':'Suche vorhandene Coins …';area.innerHTML='';scannedWalletAssets=[];scannedWalletKey='';$('scanSaveSettings').classList.add('hidden');$('saveDialog').disabled=true;
  try{
    const assets=await getAdapter(network).discoverAssets(address,network==='btc-hd'?{...model.settings,hdAddressType:$('scanHdType').value}:model.settings);
    if(scanGeneration!==walletScanGeneration)return;
    if(!assets.length){status.textContent=assets.partial?'Teilscan unvollständig: '+(assets.warning||'Einige Wallet-Bestände konnten nicht geprüft werden.'):'Keine positiven Guthaben gefunden.';area.innerHTML=empty(assets.partial?'Keine bestätigten Positionen. Netzwerk-/Staking-Abfragen waren unvollständig.':'Keine Positionen gefunden. Prüfe Netzwerk und Adresse.');return;}
    // Fetch contract quotes without a key when possible. A quote error never blocks import.
    if(PUBLIC_EVM_NETWORKS[Number(network)]){
      try{
        const contracts=assets.filter(x=>x.contract).map(x=>x.contract);
        const quotes=await evmContractPrices(network,contracts,model.settings.coinGeckoKey);
        for(const a of assets)if(a.contract){const q=Number(quotes[a.contract.toLowerCase()]?.eur);if(q>0)a.price=q;}
      }catch(e){/* holdings are still valid without quotes */}
    }
    if(scanGeneration!==walletScanGeneration)return;
    const {visible,hidden}=partitionWalletAssets(assets);
    const displayed=visible.slice(0,150);
    const review=hidden.slice(0,Math.max(0,150-displayed.length));
    scannedWalletAssets=[...displayed,...review];
    scannedWalletKey=scanKey;
    const partial=assets.partial===true;
    const renderRow=(a,i,preselect=false,reason='')=>`<label class="wallet-scan-row"><input type="checkbox" data-wallet-asset="${i}" ${preselect&&i<80?'checked':''}><span class="wallet-scan-info"><strong>${esc(a.name)}</strong><small>${esc(a.symbol)} · ${esc(a.chain==='btc'||a.chain==='btc-hd'?'Bitcoin':a.chain==='xrp'||a.chain==='xrp-token'?'XRP Ledger':a.chain==='sol'||a.chain==='spl'?'Solana':a.chain==='sol-stake'?'Solana Staking':a.chain==='sonic-stake'?'Sonic Staking':a.chain.startsWith('cosmos')?'Cosmos Hub':a.chain==='hedera'?'Hedera':a.chain.startsWith('near')?'NEAR':PUBLIC_EVM_NETWORKS[a.chainId]?.name||'EVM')}${a.contract?' · '+esc(a.contract.slice(0,9))+'…':''}</small>${reason?`<small>${esc(reason)}</small>`:''}</span><span class="wallet-scan-money">${quant(a.quantity)}${a.price?`<small>≈ ${money(a.price*a.quantity)}</small>`:'<small>Kurs offen</small>'}</span></label>`;
    const extra=hidden.length?
      `<details class="wallet-spam-review"><summary>${hidden.length} ausgeblendete Tokens prüfen</summary><p>Unbekannte, auffällige und sehr kleine Guthaben werden nicht automatisch übernommen. Einblenden und bei Bedarf einzeln auswählen.</p>${review.map((a,i)=>renderRow(a,displayed.length+i,false,walletTokenVisibility(a).reason)).join('')}${review.length<hidden.length?'<p>Vorschau auf maximal 150 Positionen begrenzt.</p>':''}</details>`:'';
    area.innerHTML=`<div class="wallet-scan-header"><strong>${displayed.length} Position${displayed.length===1?'':'en'} zur Auswahl</strong><span>${hidden.length?'Unbekannte Tokens ausgeblendet':'Zur Übernahme auswählen'}</span></div>`+
      displayed.map((a,i)=>renderRow(a,i,true)).join('')+
      (!displayed.length?empty('Keine automatisch vorgeschlagenen Positionen. Bei Bedarf ausgeblendete Tokens prüfen.'): '')+extra;
    status.textContent=(partial?'Teilweise erfolgreich: '+assets.warning:assets.warning|| (assets.length>150?'Vorschau auf maximal 150 Positionen begrenzt.':'Coins gefunden. Wähle die Bestände aus, die du speichern möchtest.'))+
      (hidden.length?' · '+hidden.length+' ungeprüfte oder auffällige Tokens ausgeblendet.':'');
    $('scanSaveSettings').classList.remove('hidden');
    area.dispatchEvent(new Event('change',{bubbles:true}));
  }catch(e){if(scanGeneration===walletScanGeneration){status.textContent='Suche fehlgeschlagen: '+e.message;area.innerHTML=empty('Bitte Netzwerk und Adresse prüfen. Du kannst die Position auch manuell hinzufügen.');}}
  finally{if(scanGeneration===walletScanGeneration)button.disabled=false;}
}
// Guard against doubling existing manual opening holdings with historical trades.
function flatexWouldDoubleCount(current,prepared,accountId){
 if(!accountId)return true;
 return prepared.parsed.rows.some(row=>current.positions.some(p=>p.accountId===accountId&&String(p.isin||'').toUpperCase()===row.position&&Number(p.quantityExact??p.quantity)>0&&!(current.journalEntries||[]).some(entry=>entry.postings?.some(post=>post.positionId===p.id))));
}
// Imported broker files stay entirely in the browser. A verified dry-run precedes any write.
function openCSVImport(){
 const positions=model.positions.filter(p=>!p.wallet?.enabled);
 if(!positions.length)return notify('Vor dem CSV-Import bitte mindestens eine manuelle Position anlegen.',true);
 let batch=null,selectionGeneration=0,parsed=null,positionOverrides={},fxRateOverrides={},skippedLines=[],brokerImport=null,brokerAccepted=false,brokerBackupDownloaded=false,backfillRequested=false,bankEURConfirmed=false;
 const labels={date:'Datum',type:'Buchungsart',position:'Anlage / ISIN / Ticker',quantity:'Menge / Betrag',unitPrice:'Kurs',feeEUR:'Gebühren (EUR)',taxEUR:'Steuern (EUR)',fxRate:'Wechselkurs',cashPosition:'Verrechnungskonto',notes:'Notiz',externalId:'Buchungs-ID'};
 const necessary=['date','type','position','quantity','unitPrice'];
 const currentMapping=()=>brokerImport?FLATEX_MAPPING:Object.fromEntries(CSV_FIELDS.map(key=>[key,$('csvMap-'+key)?.value||'']));
 const sourceLineLabel=line=>{const row=(brokerImport||(batch?.reports.length>1?batch:null))?.sourceRows?.[line-2];return row?row.file+', Zeile '+row.line:'Zeile '+line;};
 const selectedBrokerAccount=()=>brokerImport?($('csvBrokerAccount')?.value||''):'';
 const previewOptions=()=>({positionOverrides,fxRateOverrides,skippedLines,cashPositionId:$('csvCashPosition')?.value||'',allowedAccountId:selectedBrokerAccount()});
 const backfillCheck=()=>{
  const accountId=selectedBrokerAccount();
  if(!brokerImport||!accountId||!flatexWouldDoubleCount(model,brokerImport,accountId))return null;
  return prepareFlatexBackfillPreview(model,brokerImport,accountId,previewOptions());
 };
 const finalPreview=()=>{
  if(!backfillRequested){const preview=previewCSV(model,parsed,currentMapping(),previewOptions());return brokerImport?invalidateUnverifiedFlatexBasis(preview,model):preview;}
  const checked=backfillCheck();
  if(!checked?.eligible)throw Error('Historische Rekonstruktion nicht zulässig: '+(checked?.reason||'Bestandsvergleich fehlt.'));
  return checked.preview;
 };
 showDialog('CSV importieren','BUCHUNGEN',
  '<p class="dialog-intro">Wähle allgemeine Buchungen oder Flatex-Exporte. Flatex-Kontoumsätze werden zunächst nur zur Prüfung angezeigt, nicht automatisch verbucht. Alle Dateien bleiben auf deinem Gerät.</p>'+
  '<label class="field"><span>Importformat</span><select id="csvSource"><option value="auto">Automatisch erkennen</option><option value="generic">Allgemeine Buchungs-CSV</option><option value="flatex">Flatex Österreich</option></select></label>'+ 
   '<label class="field"><span>CSV-Datei(en) (je maximal 2 MB)</span><input id="csvFile" type="file" accept=".csv,text/csv,text/plain" multiple></label>'+ 
   '<div id="csvBrokerStatus" role="status"></div>'+
   '<button type="button" id="csvDownloadAudit" class="btn outline hidden">Flatex-Prüfbericht als CSV</button>'+
  '<div id="csvMapping"></div><p id="csvReviewStatus" class="visually-hidden" role="status" aria-live="polite">Nach der Dateiauswahl werden die Buchungen geprüft.</p><div id="csvReview"><p class="small-help">Nach der Dateiauswahl werden die Buchungen geprüft.</p></div>',
  async ()=>{
   if(!parsed)throw Error('Bitte zuerst eine CSV-Datei auswählen.');
    if(brokerImport){
     if(brokerImport.issues.some(x=>x.code==='invalid'||x.code==='ambiguous-duplicate'))throw Error('Flatex: fehlerhafte oder nicht eindeutig identifizierbare Vorgänge prüfen.');
     if(!brokerAccepted)throw Error('Bitte den vorläufigen Flatex-Import und die nicht unterstützten Vorgänge ausdrücklich bestätigen.');
     if(!brokerBackupDownloaded)throw Error('Vor dem Flatex-Import bitte ein lokales Backup herunterladen.');
     if(!selectedBrokerAccount())throw Error('Bitte ein bestehendes Flatex-Depot zuordnen.');
     if(brokerImport.depotIdentifiers.length>1)throw Error('Mehrere Flatex-Depotnummern in derselben Auswahl: bitte pro Depot getrennt importieren.');
     if(flatexWouldDoubleCount(model,brokerImport,selectedBrokerAccount())&&!backfillRequested)throw Error('Historische Käufe und bestehende Anfangsbestände müssen vor dem Import abgeglichen werden.');
    }
   const result=finalPreview();
   if(result.issues.length)throw Error('Bitte die '+result.issues.length+' noch ungeklärten Buchungen prüfen oder ausdrücklich überspringen.');
   if(!result.ready)throw Error('Keine neuen Buchungen zum Import vorhanden.');
   const imported=importCSV(model,result);snapshot(model);await save();
   csvReceipt=csvUndoReceipt(result.baseline,model);renderBookings();
   notify(imported.imported+' Buchungen importiert · '+imported.duplicates+' Dubletten übersprungen'+(result.skipped?' · '+result.skipped+' bewusst ausgelassen':'')+'.');
  });
 const importEditor=editor;
 $('saveDialog').disabled=true;$('saveDialog').textContent='Buchungen importieren';
 const review=(returnTo=null)=>{
  if(!parsed)return;
  try{
   const result=finalPreview();
   const needsMatch=m=>/^Anlage fehlt|^Anlage nicht eindeutig/.test(m);
   const summary=csvPreviewSummary(model,result);
   const impact='<details class="advanced-apis"><summary>Auswirkung und Datenabdeckung prüfen</summary><p class="small-help">'+summary.conflicts+' Konflikte · '+summary.unresolved+' ungeklärt · '+(summary.coverage.from?esc(summary.coverage.from+' bis '+summary.coverage.to):'Keine neuen Ereignisdaten')+'</p><p class="small-help">'+esc(summary.historyNote)+'</p>'+summary.impacts.map(p=>'<div class="history-sub">'+esc(p.name)+' · '+esc(model.accounts.find(a=>a.id===p.accountId)?.name||'Konto')+': '+esc(p.beforeExact)+' → '+esc(p.afterExact)+(p.kind==='cash'?' '+esc(p.currency):' Stück')+'</div>').join('')+'</details>';
   const status='<div class="csv-import-summary"><strong>'+result.ready+' bereit · '+result.duplicates+' bereits vorhanden · '+result.issues.length+' zu prüfen'+(result.skipped?' · '+result.skipped+' übersprungen':'')+'</strong></div>';
   const backfill=backfillCheck();
   $('csvReviewStatus').textContent=result.ready+' bereit, '+result.duplicates+' bereits vorhanden, '+result.issues.length+' zu prüfen'+(result.skipped?', '+result.skipped+' übersprungen':'')+'.';
   if(brokerImport&&$('csvBrokerSettlement')){
    const accountId=selectedBrokerAccount();
    if(!accountId)$('csvBrokerSettlement').textContent='Abrechnungsabgleich: bitte zuerst das Flatex-Depot wählen.';
    else{
     const amounts=auditFlatexSettlementAmounts(brokerImport,model,accountId,{accountAmountsEUR:bankEURConfirmed});
     const sum=amounts.counts;
     const cashStatement=auditFlatexCashStatements(brokerImport,{accountAmountsEUR:bankEURConfirmed});
     const availableCash=flatexCashAccountChoices(model,accountId);
     const warn=amounts.distinctAccountIdentifiers.length>1?
      '<p class="small-help">Mehrere Kontoreferenzen im Export erkannt: '+amounts.distinctAccountIdentifiers.length+'. Kontoumsätze bleiben strikt voneinander getrennt.</p>':'';
     $('csvBrokerSettlement').innerHTML='<details class="advanced-apis"><summary>Abrechnungsbeträge vergleichen ('+amounts.entries.length+' mögliche Paare)</summary>'+
      '<p class="small-help">'+esc(amounts.note)+'</p>'+
      '<p>'+sum.equal+' brutto gleich · '+sum.unexplained+' ungeklärte Differenz · '+sum.pending+' ohne EUR-Abgleich · '+sum.ambiguous+' mehrdeutig · '+sum.unpairedCash+' weitere nicht zugeordnete Kontoumsätze.</p>'+warn+
      amounts.entries.slice(0,40).map(entry=>
        '<div class="history-sub">'+esc(entry.date+' · '+entry.isin+' · '+entry.kind)+
        ' · '+esc(entry.evidence)+
        (entry.grossExact!==null?' · Brutto '+esc(entry.grossExact)+' EUR · Kontoumsatz '+esc(entry.cashExact)+' EUR · Differenz '+esc(entry.differenceExact)+' EUR':'')+
        '<p class="small-help">'+esc(entry.message)+'</p></div>').join('')+
      (amounts.entries.length>40?'<p class="small-help">Weitere Buchungen separat prüfen.</p>':'')+'</details>'+
      '<details class="advanced-apis"><summary>Kontoumsätze nach CSV-Kontoreferenz ('+cashStatement.groups.length+' Gruppen)</summary>'+
      '<p class="small-help">'+esc(cashStatement.note)+'</p>'+
      '<p class="small-help">'+availableCash.length+' mögliche manuelle EUR-Guthabenposition(en) desselben Flatex-Anbieters vorhanden. Eine Kontoreferenz im Export wird keinem FolioLab-Guthaben automatisch zugeordnet.</p>'+
      (cashStatement.issues.length?'<p class="small-help">'+cashStatement.issues.length+' Kontozeilen nicht eindeutig auswertbar.</p>':'')+
      cashStatement.groups.slice(0,25).map(g=>
       '<div class="history-sub">'+esc(g.reference)+' · '+g.count+' Zeilen · '+esc(g.earliest)+' bis '+esc(g.latest)+
       (g.netExact==null?' · EUR-Währung noch nicht bestätigt':
        ' · Zuflüsse '+esc(g.inflowsExact)+' EUR · Abflüsse '+esc(g.outflowsExact)+' EUR · Netto '+esc(g.netExact)+' EUR')+
       '<p class="small-help">'+Object.entries(g.kinds).map(([k,n])=>esc(k)+': '+n).join(' · ')+'</p></div>').join('')+
      (cashStatement.groups.length>25?'<p class="small-help">Weitere CSV-Kontoreferenzen getrennt prüfen.</p>':'')+'</details>';
    }
   }
   if(brokerImport&&$('csvBrokerReconcile')){
    const accountId=selectedBrokerAccount();
    if(!accountId)$('csvBrokerReconcile').textContent='Wähle das passende Flatex-Depot, um den rechnerischen Bestandsabgleich anzuzeigen.';
    else{
     const reconciled=reconcileFlatexPositions(brokerImport,model,accountId);
     $('csvBrokerReconcile').innerHTML='<details class="advanced-apis"><summary>Rechnerischer Bestandsvergleich ('+reconciled.results.length+' ISINs)</summary>'+
       '<p class="small-help">'+esc(reconciled.note)+'</p>'+
       reconciled.results.slice(0,50).map(x=>'<div class="history-sub">'+esc(x.name)+': '+esc(x.netQuantityExact)+' Netto-Stück laut CSV · '+(x.currentQuantityExact==null?'nicht im Depot hinterlegt':esc(x.currentQuantityExact)+' aktuell erfasst')+' · '+esc(({'arithmetically-aligned':'rechnerisch gleich','opening-review':'Anfangsbestand prüfen','unmatched':'Position zuordnen','inconsistent':'Historie widersprüchlich','ambiguous':'mehrdeutige ISIN'})[x.status]||x.status)+'</div>').join('')+
       (reconciled.results.length>50?'<p class="small-help">Weitere Positionen im Depot gesondert prüfen.</p>':'')+'</details>'+
       (backfill?.eligible?'<label class="csv-skip"><input id="csvBackfill" type="checkbox"'+(backfillRequested?' checked':'')+'> Historische Käufe und Verkäufe statt bisheriger Anfangsmengen übernehmen (Bestand unverändert)</label><p class="small-help">'+esc(backfill.note)+'</p>':
        backfill?'<p class="small-help">Historische Übernahme gesperrt: '+esc(backfill.reason)+'</p>':'');
     $('csvBackfill')?.addEventListener('change',e=>{backfillRequested=e.target.checked;review();});
    }
   }
   const errors=result.rows.filter(x=>x.status==='error');
   const detail=errors.map(x=>{
    const unmatched=needsMatch(x.message);
    const fxMissing=/Historischer Wechselkurs fehlt/.test(x.message);
    const fxField=fxMissing?'<label class="field"><span>Abgerechneter EUR-Wechselkurs (Handelswährung × Kurs)</span><input type="text" inputmode="decimal" aria-label="'+esc(sourceLineLabel(x.line))+': historischer Wechselkurs" data-csv-fx="'+x.line+'" value="'+esc(fxRateOverrides[x.line]||'')+'" placeholder="z. B. 0,92"></label>':'';
    const select=unmatched?'<label class="field"><span>Passende Anlage</span><select aria-label="'+esc(sourceLineLabel(x.line))+': passende Anlage" data-csv-assign="'+x.line+'">'+
      options([['','Bitte auswählen'],...positions.filter(p=>!brokerImport||p.accountId===selectedBrokerAccount()).map(p=>[p.id,p.name+(p.isin?' · '+p.isin:p.symbol?' · '+p.symbol:'')])],positionOverrides[x.line]||'')+
      '</select></label>':'';
    return '<div class="csv-review-row"><strong>'+esc(sourceLineLabel(x.line))+'</strong><p>'+esc(x.message)+'</p>'+select+fxField+
      '<label class="csv-skip"><input type="checkbox" aria-label="'+esc(sourceLineLabel(x.line))+' überspringen" data-csv-skip="'+x.line+'"'+(skippedLines.includes(x.line)?' checked':'')+'> Diese Buchung überspringen</label></div>';
   }).join('');
   const examples=result.rows.filter(x=>x.status==='ready').slice(0,5).map(x=>
     '<div class="history-sub">'+esc(sourceLineLabel(x.line))+' · '+esc(x.row.date+' · '+x.row.type+' · '+x.row.quantity)+'</div>').join('');
   const skipped=result.rows.filter(x=>x.status==='skipped').map(x=>
    '<div class="csv-review-row"><strong>'+esc(sourceLineLabel(x.line))+' wird übersprungen</strong><label class="csv-skip"><input type="checkbox" aria-label="'+esc(sourceLineLabel(x.line))+' weiterhin auslassen" data-csv-skip="'+x.line+'" checked> Weiterhin auslassen</label></div>').join('');
   $('csvReview').innerHTML='<div class="csv-import-review"><h3 id="csvReviewHeading" tabindex="-1">Buchungen prüfen</h3>'+status+impact+
    (errors.length?'<p class="small-help">Unklare Anlagen werden niemals automatisch einer anderen Position zugeordnet.</p>'+detail:'<p class="small-help">Alle übrigen Buchungen sind zugeordnet.</p>')+skipped+
    (examples?'<details class="advanced-apis"><summary>Beispielbuchungen ansehen</summary>'+examples+'</details>':'')+'</div>';
   $('csvReview').querySelectorAll('[data-csv-assign]').forEach(el=>el.addEventListener('change',()=>{
    if(el.value)positionOverrides[Number(el.dataset.csvAssign)]=el.value;else delete positionOverrides[Number(el.dataset.csvAssign)];
    review({kind:'assign',line:Number(el.dataset.csvAssign)});
   }));
   $('csvReview').querySelectorAll('[data-csv-fx]').forEach(el=>el.addEventListener('change',()=>{fxRateOverrides[Number(el.dataset.csvFx)]=el.value.trim();review({kind:'fx',line:Number(el.dataset.csvFx)});}));
   $('csvReview').querySelectorAll('[data-csv-skip]').forEach(el=>el.addEventListener('change',()=>{
    const line=Number(el.dataset.csvSkip);
    if(el.checked){if(!skippedLines.includes(line))skippedLines.push(line);}
    else skippedLines=skippedLines.filter(x=>x!==line);
    review({kind:'skip',line});
   }));
   if(returnTo){
    const field=$('csvReview').querySelector('[data-csv-'+returnTo.kind+'="'+returnTo.line+'"]');
    (field||$('csvReviewHeading')).focus({preventScroll:true});
   }
   const invalid=brokerImport?.issues.some(x=>x.code==='invalid'||x.code==='ambiguous-duplicate');
    const missingAcknowledgement=brokerImport&&(!brokerAccepted||!brokerBackupDownloaded);
    const accountId=selectedBrokerAccount();
    const wouldDoubleCount=brokerImport&&flatexWouldDoubleCount(model,brokerImport,accountId)&&!backfillRequested;
    const multipleDepots=brokerImport&&brokerImport.depotIdentifiers.length>1;
    $('saveDialog').disabled=Boolean(result.issues.length)||result.ready===0||Boolean(invalid)||Boolean(missingAcknowledgement)||Boolean(wouldDoubleCount)||Boolean(multipleDepots)||Boolean(brokerImport&&!accountId);
    if(wouldDoubleCount&&accountId)$('csvReview').insertAdjacentHTML('beforeend','<p class="small-help">Historische Käufe und vorhandene Bestände würden doppelt zählen. Nur nach erfolgreich geprüftem Mengenabgleich und ausdrücklicher Zustimmung übernehmbar.</p>');
    if(multipleDepots)$('csvReview').insertAdjacentHTML('beforeend','<p class="small-help">Mehrere Flatex-Depots erkannt: bitte die CSV-Dateien getrennt pro Depot importieren.</p>');
   $('saveDialog').textContent=result.ready?result.ready+' Buchung'+(result.ready===1?'':'en')+' importieren':'Buchungen importieren';
  }catch(error){$('csvReview').textContent='Importprüfung: '+error.message;$('csvReviewStatus').textContent='Importprüfung fehlgeschlagen.';$('saveDialog').disabled=true;}
 };
 async function chooseCSV(){
  const generation=++selectionGeneration;
  const files=[...($('csvFile').files||[])];
  batch=null;parsed=null;brokerImport=null;brokerAccepted=false;brokerBackupDownloaded=false;backfillRequested=false;bankEURConfirmed=false;positionOverrides={};fxRateOverrides={};skippedLines=[];
  $('csvDownloadAudit').classList.add('hidden');
  $('saveDialog').disabled=true;$('csvBrokerStatus').innerHTML='';
  if(!files.length){$('csvMapping').innerHTML='';$('csvReview').textContent='Bitte CSV-Datei auswählen.';$('csvReviewStatus').textContent='Bitte CSV-Datei auswählen.';return;}
  try{
   if(files.length>20)throw Error('Maximal 20 Dateien je Import.');
   if(files.some(f=>f.size>2_000_000))throw Error('Je Datei sind höchstens 2 MB erlaubt.');
   const inputs=await Promise.all(files.map(async f=>({name:f.name,text:await f.text()})));
   if(generation!==selectionGeneration||editor!==importEditor||!$('editDialog').open)return;
   const probe=parseCSV(inputs[0].text,{sourceName:inputs[0].name}),source=$('csvSource').value;
   const flatex=source==='flatex'||(source==='auto'&&Boolean(detectFlatexCSV(probe)));
   if(flatex){
    brokerImport=prepareFlatexImport(inputs);parsed=brokerImport.parsed;
    $('csvDownloadAudit').classList.remove('hidden');
    const other=brokerImport.issues.filter(x=>x.code==='unsupported');
    const critical=brokerImport.issues.filter(x=>x.code!=='unsupported');
    const report=brokerImport.reports.map(x=>esc(x.name)+' · '+(x.type==='depot'?'Depot':'Konto')+' ('+esc(x.variant)+')').join('<br>');
    const settlementPairs=pairFlatexSettlements(brokerImport);
    $('csvBrokerStatus').innerHTML='<div class="csv-import-review"><h3>Flatex-Export erkannt</h3><p class="small-help">'+report+'</p>'+
     '<p>'+parsed.rows.length+' Käufe/Verkäufe · '+brokerImport.duplicates+' doppelte Referenzen · '+brokerImport.cashItems.length+' Kontoumsätze nur zur Prüfung · '+other.length+' weitere Depotvorgänge · '+critical.length+' problematische Zeilen</p>'+
     (brokerImport.cashItems.length?'<p class="small-help">Mögliche Depot-/Kontoumsatz-Paare: '+settlementPairs.paired.length+' · '+settlementPairs.uncertain.length+' mehrdeutig · '+settlementPairs.unmatched.length+' ohne passenden Kontobeleg. Noch keine Cash-Verbuchung.</p>':'')+
     (critical.length?'<details open><summary>Zeilen mit Fehlern</summary>'+critical.slice(0,30).map(x=>'<p>'+esc(x.file)+', Zeile '+x.line+': '+esc(x.message)+'</p>').join('')+'</details>':'')+
     (other.length?'<details><summary>Sonstige Depotvorgänge</summary>'+other.slice(0,30).map(x=>'<p>'+esc(x.file)+', Zeile '+x.line+': '+esc(x.message)+'</p>').join('')+'</details>':'')+
     (brokerImport.cashItems.length?'<details><summary>Kontoumsätze (noch nicht verbucht)</summary>'+brokerImport.cashItems.slice(0,30).map(x=>'<p>'+esc(x.date+' · '+x.kind+' · '+x.amount+' · '+x.details)+'</p>').join('')+'</details>':'')+
     '<label class="csv-skip"><input id="csvBrokerConfirm" type="checkbox"> Flatex-Import (Beta): Ich habe die Kauf-/Verkaufsdaten anhand meiner Abrechnungen geprüft. Kontoumsätze, Steuer- und Sondervorgänge werden nicht automatisch übernommen.</label>'+
     '<p class="small-help">Depotumsätze enthalten nicht zwingend alle Spesen und Steuerabzüge. Einstandswerte und realisierte Gewinne bleiben deshalb nach der Übernahme ausdrücklich unbekannt, bis vollständige Abrechnungen vorliegen. Noch kein vollständiger Depotabgleich.</p></div>';
    $('csvBrokerConfirm')?.addEventListener('change',e=>{brokerAccepted=e.target.checked;review();});
    const brokerAccounts=flatexCustodyAccounts(model);
    const accountChoices=brokerAccounts.map(a=>[a.id,(model.providers.find(p=>p.id===a.providerId)?.name||'Flatex')+' · '+a.name]);
    $('csvMapping').innerHTML='<label class="field"><span>Welches Flatex-Depot?</span><select id="csvBrokerAccount">'+options([['','Depot auswählen'],...accountChoices],'')+'</select></label>'+
      (!accountChoices.length?'<p class="small-help">Bitte zuerst unter „Mehr“ einen Flatex-Anbieter und ein Wertpapierdepot anlegen.</p>':'')+
      (brokerImport.cashItems.length?'<label class="csv-skip"><input id="csvBrokerAmountsEUR" type="checkbox"> Die Beträge im hochgeladenen Kontoumsatz-Export sind in EUR ausgewiesen (laut Auszug geprüft).</label><div id="csvBrokerSettlement" role="group" aria-label="Flatex-Abrechnungsabgleich"></div>':'')+
      '<button type="button" class="btn outline" id="csvBackupNow">Backup vor Flatex-Import herunterladen</button><p id="csvBackupStatus" class="small-help">Vor der Übernahme ist eine lokale Sicherung erforderlich.</p>'+ 
      '<div id="csvBrokerReconcile" role="status"></div>'+
      '<p class="small-help">Wertpapiere werden nur innerhalb des ausgewählten Depots über ihre ISIN zugeordnet. Andere Broker und Depots bleiben geschützt.</p>';
    $('csvBackupNow').addEventListener('click',()=>{
     const json=backup(model),blob=new Blob([json],{type:'application/json'});
     const href=URL.createObjectURL(blob),a=document.createElement('a');
     a.href=href;a.download='FolioLab-Backup-vor-Flatex-'+new Date().toISOString().slice(0,10)+'.json';
     document.body.append(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(href),500);
     brokerBackupDownloaded=true;
     $('csvBackupStatus').textContent='Backup-Download gestartet. Die Datei lokal aufbewahren.';
     review();
    });
    $('csvBrokerAccount').addEventListener('change',()=>{positionOverrides={};backfillRequested=false;review();});
    $('csvBrokerAmountsEUR')?.addEventListener('change',e=>{bankEURConfirmed=e.target.checked;review();});
   }else{
    if(inputs.some(f=>detectFlatexCSV(parseCSV(f.text))))throw Error('Flatex-Exporte bitte im Flatex-Import mit Depotzuordnung prüfen.');
    batch=prepareCSVBatch(inputs);parsed=batch.parsed;
    $('csvBrokerStatus').textContent=batch.reports.length+' Datei(en) · '+parsed.rows.length+' Zeilen · nur neue, eindeutig geprüfte Buchungen übernehmen.';
    const inferred=inferMapping(parsed.headers);
    const mappingControl=key=>'<label class="field"><span>'+esc(labels[key])+'</span><select id="csvMap-'+key+'">'+options([['','Nicht vorhanden'],...parsed.headers.map(head=>[head,head])],inferred[key])+'</select></label>';
    $('csvMapping').innerHTML='<div class="csv-import-mapping"><h3>Spalten zuordnen</h3><p class="small-help">Prüfe die automatische Spaltenzuordnung.</p>'+
     '<div class="field-row">'+necessary.map(mappingControl).join('')+'</div>'+
     '<details class="advanced-apis"><summary>Weitere Spalten (optional)</summary><div class="field-row">'+CSV_FIELDS.filter(x=>!necessary.includes(x)).map(mappingControl).join('')+'</div></details>'+
     (positions.some(p=>p.kind==='cash')&&parsed.rows.some(row=>/^(kauf|verkauf|buy|sell)$/i.test(String(row[inferred.type]||'').trim()))?'<details class="advanced-apis"><summary>Verrechnungskonto zuordnen (optional)</summary><p class="small-help">Nur auswählen, wenn dieses Konto tatsächlich zur Abrechnung verwendet wurde. Ohne Zuordnung keine erfundene Geldbewegung.</p><label class="field"><span>Gegenkonto</span><select id="csvCashPosition">'+options([['','Ohne Gegenkonto'],...positions.filter(p=>p.kind==='cash').map(p=>[p.id,p.name])],'')+'</select></label></details>':'')+
     '</div>';
    $('csvMapping').querySelectorAll('select').forEach(el=>el.addEventListener('change',review));
   }
   review();
  }catch(error){
   if(generation!==selectionGeneration||editor!==importEditor)return;
   batch=null;parsed=null;brokerImport=null;$('csvBrokerStatus').innerHTML='';$('csvMapping').innerHTML='';
   $('csvReview').textContent='CSV konnte nicht gelesen werden: '+error.message;
   $('csvReviewStatus').textContent='CSV konnte nicht gelesen werden.';
  }
 }
 $('csvFile').addEventListener('change',chooseCSV);
 $('csvSource').addEventListener('change',chooseCSV);
 $('csvDownloadAudit').addEventListener('click',()=>{
  if(!brokerImport)return;
  const report=exportFlatexAuditCSV(brokerImport);
  const href=URL.createObjectURL(new Blob([report],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=href;link.download='FolioLab-Flatex-Pruefbericht.csv';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(href),500);
 });
}
function openBooking(){
 const list=model.positions.filter(p=>!p.wallet?.enabled);
 if(!list.length)return notify('Lege zuerst eine manuell verwaltete Position oder ein Guthaben an.',true);
 const today=new Date().toISOString().slice(0,10);
 // Only an explicit previous choice or a single available position can be preselected.
 const preferred=list.find(p=>p.id===model.settings?.lastPositionId)||(list.length===1?list[0]:null);
 const commonTypes=['buy','sell','deposit','withdraw','dividend','interest','reward','fee','tax','transfer'];
 const typeOptions='<optgroup label="Häufige Buchungen">'+options(commonTypes.map(k=>[k,TX_TYPES[k]]),preferred?.kind==='cash'?'deposit':'buy')+'</optgroup>'+
   '<optgroup label="Weitere Vorgänge & Kapitalmaßnahmen">'+options(Object.entries(TX_TYPES).filter(([k])=>!commonTypes.includes(k)),null)+'</optgroup>';
 showDialog('Buchung hinzufügen','BUCHUNGEN',
  '<p class="dialog-intro">Wähle die Anlage und den Vorgang. FolioLab zeigt nur die dafür benötigten Angaben.</p>'+
  '<label class="field"><span>Anlage oder Konto</span><select name="positionId" id="bookingPosition" required>'+(preferred?'':'<option value="">Anlage oder Konto auswählen</option>')+options(list.map(p=>[p.id,p.name]),preferred?.id)+'</select></label>'+
  '<div class="field-row"><label class="field"><span>Was ist passiert?</span><select name="type" id="bookingType">'+typeOptions+'</select></label>'+
    field('Datum','date',today,'date','required max="'+today+'"')+'</div>'+
  '<div id="bookingQuantityWrap" class="field-row">'+
    field('Stückzahl / Betrag','quantity','','text','required inputmode="decimal" placeholder="z. B. 10"')+
    '<label class="field" id="bookingPriceWrap"><span id="bookingPriceLabel">Kauf-/Verkaufskurs je Stück</span><input name="unitPrice" type="text" inputmode="decimal" placeholder="Tatsächlicher Ausführungskurs"></label></div>'+
  '<div id="bookingCashWrap" class="hidden"><label class="field"><span>Bezahlung über dieses Konto (optional)</span><select name="cashPositionId" id="bookingCash"></select></label>'+
    '<p class="small-help">Nur auswählen, wenn der Kauf oder Verkauf wirklich über dieses Konto abgerechnet wurde. Sonst bleibt der Zahlungsweg offen.</p></div>'+
  '<div id="bookingTargetWrap" class="hidden"><label class="field"><span>Zielposition</span><select name="targetPositionId" id="bookingTarget"><option value="">Zielposition auswählen</option>'+options(list.map(p=>[p.id,p.name]),'')+'</select></label>'+
    field('Erhaltene Menge bei Umtausch','targetQuantity','1','text','inputmode="decimal"')+
    '<p class="small-help">Ein Barausgleich oder eine Barabfindung wird nicht automatisch verbucht. Bitte mit der Brokerabrechnung abgleichen.</p></div>'+
  '<div id="bookingRatioWrap" class="hidden"><div class="field-row">'+field('Neue Anteile','ratioNumerator','2','text','inputmode="decimal"')+
    field('Bisherige Anteile','ratioDenominator','1','text','inputmode="decimal"')+'</div>'+
    '<p class="small-help">Beispiel: Beim Split 2:1 erhältst du 2 neue Anteile je altem Anteil. Barausgleich separat prüfen.</p></div>'+
  '<div id="bookingMetadataWrap" class="hidden">'+field('Neuer Ticker','newSymbol','','text','maxlength="32"')+
    field('Neue ISIN','newIsin','','text','maxlength="20"')+'</div>'+
  '<div id="bookingCorrectWrap" class="hidden">'+field('Korrekter neuer Bestand','targetQuantity','0','text','inputmode="decimal"')+'</div>'+
  '<details class="advanced-apis" id="bookingAdvanced"><summary>Gebühren & Steuern (optional)</summary>'+
    '<div class="field-row">'+field('Gebühren in EUR','feeEUR','0','text','inputmode="decimal"')+
    field('Steuern in EUR','taxEUR','0','text','inputmode="decimal"')+'</div></details>'+
  '<div id="bookingFxWrap" class="hidden"><label class="field"><span>Wechselkurs zum Buchungsdatum (EUR je '+ '<span id="bookingFxCurrency">Fremdwährung</span>'+ ')</span>'+
    '<input name="fxRate" type="text" inputmode="decimal" placeholder="z. B. 0,92"></label>'+
    '<button type="button" class="btn outline booking-fx-button" id="loadHistoricalFx">Referenzkurs abrufen</button>'+
    '<p class="small-help" id="historicalFxNote">Bei Fremdwährungen den damals verwendeten Wechselkurs eintragen. Der Referenzkurs kann vom Brokerkurs abweichen.</p>'+
    '<details class="advanced-apis" id="bookingFxDetails"><summary>Wechselkursdetails</summary>'+
      field('Referenzkursdatum','fxRateDate','','text','readonly')+
      field('Wechselkursquelle','fxSource','','text','readonly')+'</details></div>'+
  '<details class="advanced-apis booking-notes"><summary>Notiz hinzufügen (optional)</summary>'+
    field('Notiz','notes','','text','maxlength="180"')+'</details>',
  async v=>{
   if(v.type==='correction')v.targetQuantity=$('bookingCorrectWrap').querySelector('input').value;
   const event=executeTransaction(model,v);
   if(v.date===new Date().toISOString().slice(0,10))snapshot(model,v.date);
   await save();notify('Buchung gespeichert: '+TX_TYPES[event.type]+'.');
  });
 const form=$('editorForm'),fee=form.elements.feeEUR,tax=form.elements.taxEUR,fx=form.elements.fxRate,price=form.elements.unitPrice;
 let lastType='',lastPosition='';
 function configure(){
  const type=$('bookingType').value;
  const position=list.find(p=>p.id===$('bookingPosition').value);
  if(position?.kind==='cash'&&['buy','sell'].includes(type)){
   $('bookingType').value='deposit';
  }
  const actual=$('bookingType').value;
  const changed=lastType!==actual||lastPosition!==position?.id;
  const meta=['ticker_change','isin_change','delist'].includes(actual);
  const ratio=actual==='split',correct=actual==='correction',target=['transfer','swap','merger'].includes(actual);
  const trade=['buy','sell'].includes(actual);
  const needsQuantity=!meta&&!ratio&&!correct;
  $('bookingQuantityWrap').classList.toggle('hidden',!needsQuantity);
  $('bookingTargetWrap').classList.toggle('hidden',!target);
  $('bookingTarget').required=target;
  $('bookingRatioWrap').classList.toggle('hidden',!ratio);
  $('bookingCorrectWrap').classList.toggle('hidden',!correct);
  $('bookingMetadataWrap').classList.toggle('hidden',!['ticker_change','isin_change'].includes(actual));
  $('bookingMetadataWrap').querySelector('[name="newSymbol"]').parentElement.classList.toggle('hidden',actual!=='ticker_change');
  $('bookingMetadataWrap').querySelector('[name="newIsin"]').parentElement.classList.toggle('hidden',actual!=='isin_change');
  const priceRequired=trade,priceRelevant=trade||['swap','merger','transfer','deliver_in','deliver_out','adjust'].includes(actual);
  $('bookingPriceWrap').classList.toggle('hidden',!priceRelevant);
  $('bookingPriceLabel').textContent=trade?'Tatsächlicher Kurs je Stück':'Kurs je Stück (für die Bewertung)';
  price.required=priceRequired;
  if(changed)price.value=trade?'':String(position?.kind==='cash'?1:position?.price??0);
  $('bookingCashWrap').classList.toggle('hidden',!trade);
  if(trade){
   const available=list.filter(p=>p.kind==='cash'&&p.id!==position?.id&&['EUR',position?.currency].includes(p.currency));
   const selected=$('bookingCash').value;
   $('bookingCash').innerHTML=options([['','Kein Konto zuordnen'],...available.map(p=>[p.id,p.name+' · '+p.currency])],available.some(p=>p.id===selected)?selected:'');
  }
  const advanced=$('bookingAdvanced');
  advanced.classList.toggle('hidden',!trade);
  if(trade&&!lastType)advanced.open=false;
  fee.disabled=!trade;tax.disabled=!trade;
  if(!trade){fee.value='0';tax.value='0';}
  const foreign=Boolean(position&&position.currency!=='EUR');
  $('bookingFxWrap').classList.toggle('hidden',!foreign);
  $('bookingFxCurrency').textContent=position?.currency||'Fremdwährung';
  fx.required=Boolean(foreign);
  if(!foreign){fx.value='1';form.elements.fxRateDate.value='';form.elements.fxSource.value='';}
  else if(changed){fx.value='';form.elements.fxRateDate.value='';form.elements.fxSource.value='';$('historicalFxNote').textContent='Verwende den Kurs deiner Abrechnung oder lade einen Referenzkurs. Referenzkurse können abweichen.';}
  const quantityInput=$('bookingQuantityWrap').querySelector('[name="quantity"]');
  quantityInput.required=needsQuantity;
  if(!needsQuantity)quantityInput.value='0';
  else if(changed)quantityInput.value='';
  for(const el of $('dialogFields').querySelectorAll('.hidden [required]'))el.required=false;
  lastType=actual;lastPosition=position?.id||'';
 }
 $('loadHistoricalFx').addEventListener('click',async()=>{
  const button=$('loadHistoricalFx'),selected=list.find(p=>p.id===$('bookingPosition').value),date=form.elements.date.value;
  if(!selected||selected.currency==='EUR')return;
  button.disabled=true;
  try{
   const quote=await historicalExchangeRate(selected.currency,date);
   fx.value=String(quote.rate);
   form.elements.fxRateDate.value=quote.date;
   form.elements.fxSource.value=quote.source+' (Referenz)';
   $('historicalFxNote').textContent='Referenzkurs vom '+quote.date+' für '+date+'. Abweichungen vom Broker-Ausführungskurs möglich.';
  }catch(error){notify('Referenzkurs nicht verfügbar: '+error.message,true);}
  finally{button.disabled=false;}
 });
 fx.addEventListener('input',()=>{
  form.elements.fxSource.value='Manuell eingetragen';
  form.elements.fxRateDate.value='';
  $('historicalFxNote').textContent='Manuellen Wechselkurs mit deiner Abrechnung abgleichen.';
 });
 $('bookingType').addEventListener('change',configure);
 $('bookingPosition').addEventListener('change',configure);
 configure();
}
function openSnapshot(s=null){
 const editing=Boolean(s);
 const locked=editing&&model.performanceFlowTrackingSince===s.date;
 const total=s?.totalEURExact??String(s?.total??'');
 showDialog(editing?'Stichtag bearbeiten':'Stichtag speichern','VERMÖGENSVERLAUF',
  (editing?'<p class="dialog-intro">Notiz, Datum oder Gesamtwert bearbeiten. Eine Änderung von Datum oder Betrag wird ausdrücklich als manuelle Korrektur gekennzeichnet; alte Einzelpositionswerte bleiben nicht als vermeintlich verifiziert erhalten.</p>':
   '<p class="dialog-intro">Heute wird der aktuelle Portfoliowert gespeichert. Für frühere Tage ist der damals tatsächlich bekannte Gesamtwert erforderlich; heutige Kurse sind kein historischer Wert.</p>')+
  field('Stichtag','date',s?.date||new Date().toISOString().slice(0,10),'date','required max="'+new Date().toISOString().slice(0,10)+'"'+(locked?' readonly':''))+
  field(editing?'Gespeicherter Gesamtwert in EUR':'Historischer Gesamtwert in EUR (bei früherem Datum erforderlich)','manualTotalEUR',total,'text','inputmode="decimal"'+(editing?' required':'')+(locked?' readonly':'')+' placeholder="z. B. 12345,67"')+
  field('Notiz (optional)','note',s?.note||'','text','maxlength="180"')+
  (locked?'<p class="small-help" id="snapshotLocked">Beginn der Renditeerfassung: Datum und Startwert sind geschützt, die Notiz kann bearbeitet werden.</p>':''),
  async (v)=>{
   if(editing){
    const values={date:v.date,totalEUR:v.manualTotalEUR,note:v.note};
    const change=snapshotEditChanges(model,s.id,values);
    if(change.correction&&!confirm('Datum oder Betrag wirklich korrigieren? Der Stichtag wird als manuell bestätigt gespeichert; die alte Einzelpositions-Aufschlüsselung entfällt. Die ursprüngliche Version bleibt im Änderungsverlauf dokumentiert.'))
     throw Error('Korrektur nicht übernommen.');
    editSnapshot(model,s.id,values,{confirmCorrection:change.correction});
    await save();notify('Stichtag aktualisiert.');
   }else{
    snapshot(model,v.date,v.note,{manualTotalEUR:v.manualTotalEUR});await save();notify('Stichtag gespeichert.');
   }
  });
}
async function confirmDeletePosition(id,{fromDialog=false}={}){
 let p;
 try{p=assertPositionDeletable(model,id);}catch(error){return notify(String(error.message||error),true);}
 if(!confirm('Position „'+p.name+'“ wirklich löschen? Historische Stichtage bleiben erhalten. Bei bestehenden Buchungen oder DeFi-Verknüpfungen wird das Löschen blockiert.'))return;
 try{
  deletePosition(model,id);
  snapshot(model);
  await save();
  if(fromDialog)closeDialog({force:true});
  notify('Position gelöscht. Historische Stichtage wurden nicht gelöscht.');
 }catch(error){notify(String(error.message||error),true);}
}
async function startPerformanceTracking(){
 if(model.performanceFlowTrackingSince)return notify('Renditestart bereits festgelegt: '+model.performanceFlowTrackingSince);
 const date=new Date().toISOString().slice(0,10);
 if(!confirm('Heute als Beginn der vollständigen Cashflow-Erfassung festlegen? Ältere Renditen werden nicht geschätzt.'))return;
 model.performanceFlowTrackingSince=date;model.externalCashFlows=[];snapshot(model,date,'Beginn der Renditeerfassung');await save();notify('Startwert für künftige XIRR-Ermittlung gespeichert.');
}
async function refreshAll(){
 if(busy)return;
 busy=true;$('refreshAll').disabled=true;$('priceInfo').classList.remove('hidden');$('priceInfo').textContent='Kurse und Wallet-Bestände werden abgefragt …';
 const errors=[];let successes=0;const now=new Date().toISOString();
 try{
  const cryptos=model.positions.filter(p=>p.kind==='crypto'&&(p.coinId||defiLlamaContractKey(p)));
  const securities=model.positions.filter(p=>['etf','stock','fund'].includes(p.kind)&&p.symbol);
  if(cryptos.length){
   let quotes={},primaryFailure='';
   try{quotes=await cryptoPrices(cryptos.map(p=>p.coinId).filter(Boolean),model.settings.coinGeckoKey);}
   catch(e){primaryFailure=String(e.message||e);}
   for(const p of cryptos){
    const item=quotes[p.coinId],price=Number(item?.eur);
    const freshness=coinQuoteFreshness(item);
    let result=null,issue='';
    if(Number.isFinite(price)&&price>0&&freshness.ok){
     result={price,source:'CoinGecko',asOf:item?.last_updated_at?new Date(item.last_updated_at*1000).toISOString():null,
      quality:item?.last_updated_at?'provider-timestamp':'undated'};
    }else{
     issue=primaryFailure||(!freshness.ok?freshness.reason:'CoinGecko lieferte keinen gültigen EUR-Kurs.');
     try{result=await cryptoFallbackQuote(p);}
     catch(e){issue+=' · '+String(e.message||e);}
    }
    if(result){
     p.price=result.price;p.priceExact=String(result.price);
     p.currency='EUR';p.fxRate=1;p.fxRateExact='1';
     p.quoteSource=result.source;p.quoteAsOf=result.asOf;
     p.quoteFetchedAt=now;p.quoteQuality=result.quality;p.updatedAt=now;p.priceStatus=null;successes++;
    }else{
     const hint=p.coinId==='sonic'&&String(p.symbol||'').toUpperCase()==='S'?' Prüfe die CoinGecko-ID sonic-3.':'';
     errors.push(p.name+': '+issue.slice(0,150)+hint+' Bisheriger Kurs bleibt erhalten.');
    }
   }
   if(quotes.partialFailures?.length)errors.push('CoinGecko-Teilabruf: '+quotes.partialFailures[0]);
  }
  if(securities.length&&(model.settings.twelveKey||model.settings.eodhdKey||model.settings.fmpKey||(model.settings.eodhdWorkerEndpoint&&model.settings.eodhdWorkerAccessToken))){
    for(const p of securities){
     try{
      const q=await fetchSecurityQuote(p,model.settings);
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
  if(successes){snapshot(model);await save();}else render();
  const status=refreshHeadline(successes,errors),details=$('refreshErrorDetails');
  $('priceInfo').textContent=status+' · '+new Date().toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit'});
  $('priceInfo').classList.toggle('refresh-warning',errors.length>0);
  const grouped=refreshFailures(errors);
  details.classList.toggle('hidden',grouped.length===0);
  details.open=false;
  details.innerHTML=grouped.length?'<summary>'+errors.length+' Fehlerdetails anzeigen</summary><div class="refresh-error-list">'+
   grouped.map(x=>'<div><strong>'+x.count+'× '+esc(x.cause)+'</strong><small>Betroffen: '+esc(x.positions.join(', '))+'</small></div>').join('')+'</div>':'';
  if(errors.length)notify(status+' · Details unter „Positionen“.',true);
  else notify(successes?'Portfolio aktualisiert.':'Keine automatischen Kurs- oder Wallet-Quellen eingerichtet.');
 }catch(e){notify(e.message,true);}
 finally{busy=false;$('refreshAll').disabled=false;}
}
const FULL_BACKUP_OPTION='foliolab-open-backup-include-configuration-v1';
const HISTORY_BACKUP_OPTION='foliolab-open-backup-include-history-v1';
function includeBackupConfiguration(){return $('fullBackupIncludeSettings')?.checked===true;}
function readDriveConfig(){
 let prefs={};try{prefs=JSON.parse(localStorage.getItem('foliolab-open-drive-backup-settings-v1')||'{}')}catch{}
 return portableDrivePreferences({clientId:prefs.clientId??'',mode:prefs.mode??'off',retention:prefs.retention??3});
}
function fullBackupPayload(data=JSON.parse(backup(model))){
 const included=includeBackupConfiguration();
 return createCompleteBackup(data,included?{settings:model.settings,drive:readDriveConfig()}:null,$('fullBackupIncludeHistory')?.checked?model.walletHistory??null:null);
}
function decideImportedConfiguration(config){
 if(!config)return null;
 if(!confirm('Diese verschlüsselte Sicherung enthält auch Einstellungen und möglicherweise API-Schlüssel. Sollen diese Einstellungen und Schlüssel auf diesem Gerät wiederhergestellt werden? Vorhandene Einstellungen werden ersetzt.'))return null;
 return config;
}
function applyImportedDriveConfiguration(configuration){
 if(!configuration)return;
 const old=(()=>{try{return JSON.parse(localStorage.getItem('foliolab-open-drive-backup-settings-v1')||'{}')}catch{return {}}})();
 const drive=portableDrivePreferences(configuration.drive);
 // Never copy stale folder IDs, session timestamps or OAuth access tokens.
 localStorage.setItem('foliolab-open-drive-backup-settings-v1',JSON.stringify({
  mode:drive.mode,clientId:drive.clientId,retention:drive.retention,
  folderId:'',folderName:'',lastBackupAt:'',cleanupPending:false
 }));
 window.FolioDriveBackup?.reloadRestoredConfiguration?.();
}
function downloadBackup(){const file=new Blob([backup(model)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(file);a.href=url;a.download=`foliolab-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);backupDone();notify('Backup ohne API-Schlüssel erstellt.');}
async function exportEncryptedFile(){
 const json=await encryptWithBackupPassword(JSON.stringify(fullBackupPayload()));
 const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=`foliolab-verschluesselt-${new Date().toISOString().slice(0,10)}.json`;
 document.body.append(a);
 try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 backupDone();
}
async function downloadEncryptedBackup(){
 try{
  await exportEncryptedFile();
  notify('Verschlüsseltes Backup heruntergeladen'+(includeBackupConfiguration()?' – inklusive Einstellungen und API-Schlüsseln.':'.'));
 }catch(e){notify(e.message,true)}
}
let backupPasswordEditing=false;
async function refreshBackupPasswordStatus(){
 const label=$('backupPasswordStatus');
 if(!label)return;
 try{
  const available=await hasBackupPassword();
  label.textContent=available?'Backup-Passwort eingerichtet':'Noch kein Backup-Passwort eingerichtet';
  const form=$('backupPasswordForm'),oldField=$('backupOldPasswordField'),change=$('backupChangeToggle'),exportButton=$('exportEncryptedBackup');
  if(form)form.hidden=available&&!backupPasswordEditing;
  if(oldField)oldField.hidden=!available;
  if(change){
   change.hidden=!available;
   change.textContent=backupPasswordEditing?'Abbrechen':'Passwort ändern';
   change.setAttribute('aria-expanded',String(backupPasswordEditing));
   change.setAttribute('aria-controls','backupPasswordForm');
  }
  if(exportButton)exportButton.disabled=!available;
  $('saveBackupPassword').textContent=available?'Neues Passwort speichern':'Passwort festlegen';
 }catch(e){
  label.textContent='Backup-Passwort nicht verfügbar: '+String(e.message||e);
  $('exportEncryptedBackup').disabled=true;
 }
}
$('providerOverview').addEventListener('toggle',event=>{
 const node=event.target;
 if(node.matches?.('details[data-position-id]')&&node.open)showPositionDetail(node.dataset.positionId);
},true);
$('providerOverview').addEventListener('click',event=>{
 const rangeButton=event.target.closest('[data-position-range]');
 if(!rangeButton)return;
 const mount=rangeButton.closest('[data-position-detail]');
 if(!mount)return;
 const raw=rangeButton.dataset.positionRange,days=raw==='max'?'max':Number(raw),id=mount.dataset.positionDetail;
 const position=model.positions.find(x=>x.id===id);
 if(!position||!availablePositionPeriods(position,model).includes(days))return;
 positionDetailRanges.set(id,days);
 showPositionDetail(id);
});
function openHistoricalPriceCSV(positionId){
 const p=model.positions.find(x=>x.id===positionId);
 if(!p||!['etf','stock','fund'].includes(p.kind))return notify('Nur Wertpapiere können einen CSV-Marktkursverlauf importieren.',true);
 const input=document.createElement('input');
 input.type='file';input.accept='.csv,text/csv,text/plain';input.style.display='none';
 document.body.append(input);
 input.addEventListener('cancel',()=>input.remove(),{once:true});
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];input.remove();
  if(!file)return;
  try{
   if(file.size>1500000)throw Error('CSV-Datei ist zu groß (max. 1,5 MB).');
   const data=parseHistoricalPriceCSV(await file.text(),p);
   const first=data.points[0].date,last=data.points.at(-1).date;
   const msg='Importiere '+data.points.length+' historische Kurse für „'+p.name+'“ ('+(p.symbol||p.isin||'keine Kennung')+', '+data.currency+')?\n'+
    first+' bis '+last+'\n\nBitte bestätige, dass die CSV genau dieselbe Notierung und Handelswährung wie deine Position enthält. '+
    'Diese Kurse werden nur für Diagramme genutzt, nicht für den aktuellen Positionswert oder Buchungen. '+
    (model.priceHistories?.[p.id]?'Der bisherige importierte Kursverlauf wird ersetzt.':'');
   if(!confirm(msg))return;
   model.priceHistories??=Object.create(null);
   const previous=model.priceHistories[p.id];
   model.priceHistories[p.id]=data;
   try{await save();}catch(err){if(previous)model.priceHistories[p.id]=previous;else delete model.priceHistories[p.id];throw err;}
   notify(data.points.length+' Kursdaten lokal importiert. Bitte ein Backup erstellen.');
  }catch(error){notify('Kurs-CSV: '+String(error?.message||error).slice(0,150),true);}
 },{once:true});
 input.click();
}
function openPublicTradingView(positionId){
 const p=model.positions.find(x=>x.id===positionId),symbol=p&&tradingViewIdentifier(p);
 const container=[...$('providerOverview').querySelectorAll('[data-tv-slot]')].find(el=>el.dataset.tvSlot===positionId);
 if(!p||!symbol||!container)return notify('Für dieses Wertpapier fehlt ein bestätigtes TradingView-Börsensymbol.',true);
 if(container.querySelector('iframe'))return;
 // A vendor <script> loaded in the app origin could access local portfolio data and
 // user API keys. Use an isolated, cross-origin chart frame instead.
 const url=new URL('https://s.tradingview.com/widgetembed/');
 for(const [key,value] of Object.entries({
  symbol,interval:'D',hidesidetoolbar:'1',symboledit:'0',saveimage:'0',
  hideideas:'1',theme:'Light',style:'3',timezone:'Europe/Berlin',withdateranges:'1'
 }))url.searchParams.set(key,value);
 const wrap=document.createElement('div');wrap.className='tradingview-widget-container';
 const widget=document.createElement('div');widget.className='tradingview-widget-container__widget';
 const frame=document.createElement('iframe');
 frame.src=url.toString();
 frame.title='Öffentliches TradingView-Börsendiagramm: '+p.name;
 frame.loading='lazy';frame.referrerPolicy='no-referrer';
 frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups');
 widget.append(frame);
 const attribution=document.createElement('a');
 attribution.href='https://www.tradingview.com/symbols/'+encodeURIComponent(symbol.replace(':','-'))+'/';
 attribution.textContent='Kursdiagramm bei TradingView öffnen ↗';
 attribution.target='_blank';attribution.rel='noopener noreferrer';attribution.referrerPolicy='no-referrer';
 attribution.className='position-history-external';
 wrap.append(widget,attribution);
 container.replaceChildren(wrap);
}
async function handleActions(e){const button=e.target.closest('[data-action]');if(!button)return;const id=button.dataset.id;switch(button.dataset.action){case 'review-legacy-quote':filter='__review';go('positions');$('legacyQuoteAudit').open=true;legacyAuditPerformed=true;renderLegacyQuoteAudit();$('runLegacyQuoteAudit').focus();break;case 'reset-quality-review':reviewKind='all';reviewAccount='';$('positionSearch').value='';positionLimit=100;renderPositions();$('qualityReviewKind').focus();break;case 'reset-income-filters':incomeYear='';incomeAccount='';incomeLimit=100;renderBookings();$('incomeYear').focus();break;case 'more-income-lines':incomeLimit+=100;renderBookings();$('incomeRecords').open=true;break;case 'transfer-matching':transferMatchingUI.open(button);break;case 'check-cash-balance':openCashBalanceCheck(id);break;case 'booking-history':bookingHistoryUI.open(id,button);break;case 'wallet-history':walletHistoryUI.open(id,button);break;case 'load-tradingview':openPublicTradingView(id);break;case 'retry-price-chart':showPositionDetail(id);break;case 'import-price-history':openHistoricalPriceCSV(id);break;case 'remove-price-history':{if(!model.priceHistories?.[id])break;if(confirm('Nur die für diese Position importierten CSV-Kurse entfernen? Bestand und Stichtage bleiben unverändert.')){const previous=model.priceHistories[id];delete model.priceHistories[id];try{await save();}catch(err){model.priceHistories[id]=previous;notify(err.message,true);break;}notify('Importierten Kursverlauf entfernt.');}break;}case 'more-listing-review':listingReviewLimit+=50;renderPositions();break;case 'more-positions':positionLimit+=100;renderPositions();break;case 'more-bookings':bookingLimit+=100;renderBookings();break;case 'start-booking':openBooking();break;case 'start-csv':openCSVImport();break;case 'view-account':filter='account:'+id;go('positions');break;case 'history-positions':go('positions');break;case 'start-wizard':assetWizard.open();break;case 'start-provider':go('more');openProvider();break;case 'start-wallet':openWalletImport();break;case 'start-import':$('backupFile').click();break;case 'edit-position':openPosition(model.positions.find(x=>x.id===id));break;case 'delete-position':confirmDeletePosition(id);break;case 'edit-snapshot':{const shot=model.snapshots.find(x=>x.id===id);if(shot)openSnapshot(shot);break;}case 'edit-provider':openProvider(model.providers.find(x=>x.id===id));break;case 'edit-account':openAccount(model.accounts.find(x=>x.id===id));break;case 'delete-account':{if(model.positions.some(p=>p.accountId===id))return notify('Konto enthält Positionen – zuerst umziehen oder löschen.',true);if(confirm('Konto wirklich löschen?')){model.accounts=model.accounts.filter(a=>a.id!==id);await save();}break;}case 'delete-provider':{if(model.positions.some(p=>p.providerId===id)||model.accounts.some(a=>a.providerId===id))return notify('Dieser Anbieter besitzt noch Konten oder Positionen.',true);if(confirm('Anbieter wirklich löschen?')){model.providers=model.providers.filter(x=>x.id!==id);if(filter===id)filter='all';await save();}break;}case 'delete-snapshot':{
 const shot=model.snapshots.find(x=>x.id===id);if(!shot)break;
 const isStart=model.performanceFlowTrackingSince===shot.date;
 if(!confirm('Stichtag vom '+dateLabel(shot.date)+' wirklich löschen?'+(isStart?' Damit wird der festgelegte Start der Renditeerfassung zurückgesetzt; vorhandene Buchungen bleiben erhalten.':'')))break;
 try{deleteSnapshot(model,id);await save();notify('Stichtag gelöscht.');}catch(error){notify(error.message,true);}break;
}}}
function initEvents(){$('resolveListings').addEventListener('click',openListingReview);$('addProvider').addEventListener('click',()=>openProvider());$('addAccount').addEventListener('click',()=>openAccount());$('addWizard').addEventListener('click',()=>assetWizard.open());$('addWallet').addEventListener('click',openWalletImport);$('addBooking').addEventListener('click',openBooking);$('openCSVImport').addEventListener('click',openCSVImport);$('undoCSVImport').addEventListener('click',()=>{
 showDialog('CSV-Import rückgängig machen','BUCHUNGEN','<p class="dialog-intro">Den letzten CSV-Import dieser Sitzung einschließlich seines automatisch erzeugten Stichtags zurücknehmen? Dies ist nur möglich, solange seitdem nichts geändert wurde.</p>',async()=>{
  await portfolioStore.assertCurrent();undoCSV(model,csvReceipt);await save();csvReceipt=null;renderBookings();notify('CSV-Import rückgängig gemacht.');
 });
});$('addSnapshot').addEventListener('click',openSnapshot);$('startPerformance').addEventListener('click',startPerformanceTracking);$('refreshAll').addEventListener('click',refreshAll);$('closeDialog').addEventListener('click',closeDialog);$('cancelDialog').addEventListener('click',closeDialog);$('editDialog').addEventListener('click',e=>{if(e.target===$('editDialog'))closeDialog();});
 const markEditorDirty=event=>{
  if(editor&&!editor.readOnly&&!event.target.closest('[data-interest-preview]')&&event.target.matches('input, select, textarea'))editor.dirty=true;
 };
 $('dialogFields').addEventListener('input',markEditorDirty);
 $('dialogFields').addEventListener('change',markEditorDirty);
 $('editorForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!editor||saving||editorSubmitting)return;
  editorSubmitting=true;
  const button=$('saveDialog');button.disabled=true;
  const f=new FormData(e.currentTarget),v=Object.fromEntries(f.entries());
  $('dialogError').textContent='';$('dialogError').classList.add('hidden');
  try{const result=await editor.onSave(v);if(result!==false)closeDialog({force:true});}
  catch(err){
   const feedback=$('dialogError');
   feedback.textContent=(editor?.readOnly?'Prüfung nicht möglich: ':'Änderung nicht gespeichert: ')+String(err.message||err);
   feedback.classList.remove('hidden');
   feedback.tabIndex=-1;
   feedback.focus({preventScroll:true});
   feedback.scrollIntoView({block:'nearest'});
  }
  finally{editorSubmitting=false;button.disabled=false;}
 });document.addEventListener('click',e=>{void handleActions(e).catch(err=>notify(String(err.message||err),true));});$('positionFilters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;reviewKind='all';reviewAccount='';positionLimit=100;renderPositions();}});$('qualityReviewKind').addEventListener('change',e=>{reviewKind=e.target.value;positionLimit=100;renderPositions();});$('qualityReviewAccount').addEventListener('change',e=>{reviewAccount=e.target.value;positionLimit=100;renderPositions();$('qualityReviewAccount').focus({preventScroll:true});});$('positionSearch').addEventListener('input',()=>{positionLimit=100;renderPositions();});$('positionSort').addEventListener('change',()=>{positionLimit=100;renderPositions();});$('bookingIncome').addEventListener('change',e=>{const id=e.target.id;if(id==='incomeYear'||id==='incomeAccount'){if(id==='incomeYear')incomeYear=e.target.value;else incomeAccount=e.target.value;incomeLimit=100;renderBookings();$(id).focus({preventScroll:true});}});$('bookingSearch').addEventListener('input',()=>{bookingLimit=100;renderBookings();});$('bookingFilterType').addEventListener('change',()=>{bookingLimit=100;renderBookings();});$('miniChartPeriods').addEventListener('click',e=>{const btn=e.target.closest('[data-mini-range]');if(btn&&!btn.disabled){miniRange=btn.dataset.miniRange;renderDashboard();}});$('chartPeriods').addEventListener('click',e=>{const b=e.target.closest('[data-range]');if(b){range=b.dataset.range;calendarSelection=[];$('historyCalendarDisclosure').open=false;renderHistory();}});
 $('historyCalendarDisclosure').addEventListener('toggle',()=>{if($('historyCalendarDisclosure').open)renderSnapshotCalendar();});
 $('historyCalendarPrev').addEventListener('click',()=>shiftSnapshotCalendar(-1));
 $('historyCalendarNext').addEventListener('click',()=>shiftSnapshotCalendar(1));
 $('historyCalendarReset').addEventListener('click',()=>{calendarSelection=[];range='all';$('historyCalendarDisclosure').open=false;renderHistory();});
 $('historyBasis').addEventListener('change',e=>{wealthBasis=e.target.value;renderDashboard();renderHistory();});$('compareCapital').addEventListener('change',renderHistory);
 $('historyCalendarGrid').addEventListener('click',e=>{
  const day=e.target.closest('[data-calendar-day]')?.dataset.calendarDay;if(!day)return;
  if(calendarSelection.length!==1)calendarSelection=[day];
  else{calendarSelection=[calendarSelection[0],day].sort();range='calendar';$('historyCalendarDisclosure').open=false;}
  renderHistory();
 });
 document.addEventListener('click',e=>{const popup=$('historyCalendarDisclosure');if(popup.open&&!e.composedPath().includes(popup))popup.open=false;});
 document.addEventListener('keydown',e=>{const popup=$('historyCalendarDisclosure');if(e.key==='Escape'&&popup.open){popup.open=false;popup.querySelector('summary')?.focus();}});

  $('exportBackup').addEventListener('click',downloadBackup);$('exportEncryptedBackup').addEventListener('click',downloadEncryptedBackup);
  $('backupChangeToggle').addEventListener('click',async()=>{
    backupPasswordEditing=!backupPasswordEditing;
    for(const id of ['backupPassword','backupPasswordConfirm','backupOldPassword'])$(id).value='';
    await refreshBackupPasswordStatus();
    if(backupPasswordEditing)$('backupPassword').focus();
  });
  $('saveBackupPassword').addEventListener('click',async()=>{
    const input=$('backupPassword'),confirmInput=$('backupPasswordConfirm'),old=$('backupOldPassword'),button=$('saveBackupPassword');
    button.disabled=true;
    try{
      const result=await configureBackupPassword(input.value,confirmInput.value,old.value);
      backupPasswordEditing=false;
      notify(result.changed?'Passwort geändert. Ältere Backups benötigen weiterhin das bisherige Passwort.':'Backup-Passwort eingerichtet.');
      await refreshBackupPasswordStatus();
      await window.FolioDriveBackup?.refreshVaultStatus?.();
    }catch(error){notify(String(error.message||error),true)}
    finally{input.value='';confirmInput.value='';old.value='';button.disabled=false;}
  });
  const fullOption=$('fullBackupIncludeSettings');
  const historyOption=$('fullBackupIncludeHistory');
  historyOption.checked=localStorage.getItem(HISTORY_BACKUP_OPTION)==='true';
  historyOption.addEventListener('change',()=>{
    try{
      localStorage.setItem(HISTORY_BACKUP_OPTION,historyOption.checked?'true':'false');
      notify(historyOption.checked?'Bestätigte Wallet-Historien werden künftig in verschlüsselten Backups mitgesichert.':'Wallet-Historien werden aus neuen verschlüsselten Backups ausgeschlossen.');
    }catch{
      historyOption.checked=!historyOption.checked;
      notify('Backup-Auswahl konnte nicht gespeichert werden. Die bisherige Auswahl bleibt bestehen.',true);
    }
  });
  fullOption.checked=localStorage.getItem(FULL_BACKUP_OPTION)==='true';
  fullOption.addEventListener('change',()=>{
    localStorage.setItem(FULL_BACKUP_OPTION,fullOption.checked?'true':'false');
    notify(fullOption.checked?'Vollständige verschlüsselte Backups enthalten künftig auch Einstellungen und Zugangsschlüssel.':'Einstellungen und API-Schlüssel werden wieder aus neuen Backups ausgeschlossen.');
  });
  void refreshBackupPasswordStatus();$('importBackup').addEventListener('click',()=>$('backupFile').click());$('backupFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';
 if(!file)return;
 if(file.size>20e6)return notify('Backup ist zu groß (max. 20 MB).',true);
 try{
  let parsed=JSON.parse(await file.text()),v2Envelope=null,password='';
  if(isPasswordBackup(parsed)){
    password=prompt('Backup-Passwort für diese Sicherung:');
    if(password===null)return;
    v2Envelope=parsed;
    parsed=JSON.parse(await decryptPasswordBackup(parsed,password));
  }else if(parsed?.kind===COMPLETE_BACKUP_KIND){
    throw Error('Ein vollständiges Backup darf nur in verschlüsselter Form importiert werden.');
  }
  const unpacked=parsed?.kind===COMPLETE_BACKUP_KIND
    ?unpackCompleteBackup(parsed):{data:parsed,configuration:null};
  const imported=safeImport(unpacked.data);
  if(!confirm('Backup mit '+imported.positions.length+' Positionen und '+imported.providers.length+' Anbietern wiederherstellen? Der aktuelle Datenbestand wird ersetzt.'))return;
  const configuration=decideImportedConfiguration(unpacked.configuration);
  if(loadFailure&&portfolioStore.isIndexedDB){
    if(!recoveryDownloaded)throw Error('Zuerst die beschädigte IndexedDB-Originaldatei herunterladen.');
    imported.settings=configuration?configuration.settings:defaultSettings();
    await portfolioStore.recoverFromBackup(imported,recoveryOriginal);
    if(v2Envelope)await adoptBackupPassword(v2Envelope,password);
    if(configuration)applyImportedDriveConfiguration(configuration);
    location.reload();return;
  }
  imported.settings=configuration?configuration.settings:{...defaultSettings(),...model.settings};
  const previous=model;
  model=imported;filter='all';
  try{await save()}catch(error){model=previous;throw error}
  loadFailure=null;
  if(v2Envelope){
    await adoptBackupPassword(v2Envelope,password);
    await refreshBackupPasswordStatus();
    await window.FolioDriveBackup?.refreshVaultStatus?.();
  }
  if(configuration)applyImportedDriveConfiguration(configuration);
  notify('Backup wiederhergestellt.'+(unresolvedListings().length?' Unter „Positionen“ kannst du fehlende Wertpapier-Stammdaten ansehen.':''));
 }catch(err){notify(err.message,true)}
});
  // Drive only receives an encrypted package. API/RPC credentials are added to
  // that package exclusively when the user has enabled full backups.
  if(window.FolioDriveBackup){
    const driveBackend={
      readData(){
        if(loadFailure)throw Error('Lokaler Speicher beschädigt. Zuerst die Originaldaten sichern.');
        if(saving||otherTabChangedPortfolio)throw Error('Änderungen in einem anderen Tab oder laufende Speicherung: bitte neu laden beziehungsweise Vorgang abschließen.');
        return JSON.parse(backup(model));
      },
      readBackupConfiguration(){
        return includeBackupConfiguration()?{settings:model.settings,drive:readDriveConfig()}:null;
      },
      buildCompleteBackup:(data,config)=>createCompleteBackup(data,config,$('fullBackupIncludeHistory')?.checked?model.walletHistory??null:null),
      unpackCompleteBackup,
      validateData(data){return safeImport(data);},
      hasPasswordVault:hasBackupPassword,
      encryptPasswordBackup:encryptWithBackupPassword,
      decryptPasswordBackup,
      async adoptPasswordVault(envelope,password){
        await adoptBackupPassword(envelope,password);
        await refreshBackupPasswordStatus();
        await window.FolioDriveBackup?.refreshVaultStatus?.();
      },
      async restoreData(data,configuration=null){
        if(saving||otherTabChangedPortfolio)throw Error('Speicherung aktiv oder Daten durch anderen Tab verändert. Bitte zuerst neu laden.');
        const imported=safeImport(data);
        if(loadFailure){
          if(!portfolioStore.isIndexedDB||!recoveryDownloaded)throw Error('Beschädigte Originaldaten zuerst unter „Daten retten“ exportieren, danach Wiederherstellung erneut starten.');
          const accepted=decideImportedConfiguration(configuration);
          imported.settings=accepted?accepted.settings:defaultSettings();
          await portfolioStore.recoverFromBackup(imported,recoveryOriginal);
          if(accepted)applyImportedDriveConfiguration(accepted);
          location.reload();return;
        }
        // Before overwriting meaningful local data, offer a rollback backup.
        // On a fresh device with no holdings yet, no rollback is required.
        if(model.providers.length||model.positions.length||model.snapshots.length){
          if(await hasBackupPassword())await exportEncryptedFile();
          else{
            if(!confirm('Auf diesem Gerät ist noch kein Backup-Passwort eingerichtet. Die Rückfallsicherung wird deshalb als unverschlüsselte JSON-Datei angeboten. Fortfahren?'))
              throw Error('Wiederherstellung abgebrochen, bis eine lokale Rückfallsicherung möglich ist.');
            downloadBackup();
          }
        }
        const accepted=decideImportedConfiguration(configuration);
        imported.settings=accepted?accepted.settings:{...defaultSettings(),...model.settings};
        const previous=model;
        model=imported;filter='all';
        try{await save()}catch(error){model=previous;throw error}
        if(accepted)applyImportedDriveConfiguration(accepted);
        backupDone();
        notify('Google-Drive-Backup erfolgreich wiederhergestellt.');
        return true;
      },
      onBackedUp(){backupDone();}
    };
    void window.FolioDriveBackup.init(driveBackend).catch(error=>notify('Google-Drive-Modul: '+String(error?.message||error),true));
  }
  $('deleteAll').addEventListener('click',async ()=>{
 if(!confirm('Alle lokalen Positionen, Stichtage, API-Schlüssel und ältere Migrationskopien auf diesem Gerät endgültig löschen? Stelle vorher ein Backup sicher.'))return;
 try{
  await portfolioStore.removeAll();
  loadFailure=null;model=blankModel();filter='all';render();
  notify('Lokale FolioLab-Daten einschließlich alter Migrationskopien gelöscht.');
 }catch(error){notify('Lokale Daten konnten nicht vollständig gelöscht werden. Bitte die Website-Daten im Browser prüfen.',true);}
});
  const apiCredentialFields=['twelveKey','eodhdKey','fmpKey','coinGeckoKey','etherscanKey','binplorerKey','eodhdWorkerAccessToken'];
$('clearApiKeys').addEventListener('click',async ()=>{
 if(!confirm('Alle gespeicherten API-Schlüssel und den privaten Solana-RPC-Zugang auf diesem Gerät entfernen? Portfolio und Konten bleiben erhalten.'))return;
 try{
  for(const key of apiCredentialFields)model.settings[key]='';
  model.settings.solanaRpc=defaultSettings().solanaRpc;
  await save();
  purgeLegacySnapshots(localStorage);
  if(portfolioStore.isIndexedDB)localStorage.removeItem('foliolab-open-v1');
  for(const key of apiCredentialFields)$('apiSettings').elements[key].value='';
  $('solanaRpc').value=model.settings.solanaRpc;
  notify('API-Schlüssel und privater RPC-Zugang entfernt. Portfolio bleibt erhalten.');
 }catch(error){
  notify('Zugangsdaten konnten nicht vollständig entfernt werden. Bitte den lokalen Speicher prüfen.',true);
 }
});
$('checkMarketSources').addEventListener('click',async()=>{
 const button=$('checkMarketSources'),status=$('marketDiagnosticStatus');
 if(button.disabled)return;
 button.disabled=true;
 status.textContent='Prüfe höchstens vier vorhandene Notierungen über den gespeicherten EODHD-Zugang …';
 try{
  const result=await diagnoseEodhd(model.settings,model.positions);
  status.replaceChildren();
  const headline=document.createElement('p');headline.textContent=result.message;status.append(headline);
  for(const item of result.rows){
   const row=document.createElement('p');row.className='diagnostic-row';
   const strong=document.createElement('strong');strong.textContent=item.symbol+' · '+item.label;
   const hint=document.createElement('span');hint.textContent=' '+item.help;
   row.append(strong,hint);status.append(row);
  }
 }catch{
  status.textContent='Diagnose nicht möglich. Keine Portfoliodaten verändert.';
 }finally{button.disabled=false;}
});
// Migration always includes wallet history. Credentials follow the existing,
// explicit encrypted-full-backup opt-in; never put them in a plain export.
async function downloadMigrationBackup(draft){
 const data=JSON.parse(backup(draft,{includeHistory:true}));
 const withConfiguration=includeBackupConfiguration();
 const payload=withConfiguration
  ?await encryptWithBackupPassword(JSON.stringify(createCompleteBackup(data,{settings:draft.settings,drive:readDriveConfig()})))
  :JSON.stringify(data,null,2);
 const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;
 link.download=`foliolab-migration-${withConfiguration?'verschluesselt-':''}${new Date().toISOString().slice(0,10)}.json`;
 document.body.append(link);
 try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
$('migrateToIDB').addEventListener('click',async()=>{
 const button=$('migrateToIDB');
 if(button.disabled||saving||loadFailure)return;
 if(!confirm('Andere FolioLab-Tabs schließen. Zuerst wird eine Sicherung aller Portfoliodaten einschließlich Wallet-Historie heruntergeladen. Einstellungen und API-Schlüssel sind nur enthalten, wenn du ihre Mitnahme im verschlüsselten Vollbackup aktiviert hast. Fortfahren?'))return;
 button.disabled=true;saving=true;
 try{
  await portfolioStore.assertCurrent();
  const draft=structuredClone(model);
  await downloadMigrationBackup(draft); // failure/cancellation must never cut over
  if(!confirm('Ist die Migrationssicherung sicher gespeichert? Der Browser kann den gespeicherten Download nicht selbst bestätigen. Zugangsdaten bleiben lokal und unverschlüsselt in IndexedDB. Die bisherige Kopie bleibt eingefrorenes Rückfallmaterial. Jetzt ausdrücklich umstellen?'))return;
  await portfolioStore.assertCurrent();
  await portfolioStore.migrate(draft);location.reload();
 }catch(error){notify('Speicherumstellung abgebrochen: '+String(error.message||error).slice(0,170),true);}
 finally{saving=false;button.disabled=false;}
});
$('runLegacyQuoteAudit').addEventListener('click',()=>{
 legacyAuditPerformed=true;renderLegacyQuoteAudit();
});
$('legacyQuoteAuditResults').addEventListener('click',event=>{
 const button=event.target.closest('button[data-audit-fix]');
 if(button&&!button.disabled)void confirmLegacyQuoteRepair(button.dataset.id,button.dataset.auditFix,button);
});
$('apiSettings').addEventListener('submit',async e=>{
 e.preventDefault();
 const f=new FormData(e.currentTarget);
 try{
  const publicInstrumentEndpoint=validatedPublicEndpoint(String(f.get('publicInstrumentEndpoint')||'').trim())||'';
  const eodhdWorkerEndpoint=validatedPublicEndpoint(String(f.get('eodhdWorkerEndpoint')||'').trim())||'';
  const eodhdWorkerAccessToken=String(f.get('eodhdWorkerAccessToken')||'').trim();
  if(Boolean(eodhdWorkerEndpoint)!==Boolean(eodhdWorkerAccessToken))
   throw Error('Für den EODHD-Worker bitte Adresse und Zugriffsschlüssel gemeinsam eintragen oder beide leer lassen.');
  if(eodhdWorkerAccessToken&&!/^[A-Za-z0-9_-]{24,128}$/.test(eodhdWorkerAccessToken))
   throw Error('Der Worker-Zugriffsschlüssel muss 24 bis 128 Zeichen aus Buchstaben, Zahlen, _ oder - enthalten.');
  const changes={publicInstrumentEndpoint,eodhdWorkerEndpoint,eodhdWorkerAccessToken,
   securitySource:String(f.get('securitySource')||'auto')};
  for(const key of ['twelveKey','eodhdKey','fmpKey','coinGeckoKey','etherscanKey','binplorerKey'])
   changes[key]=String(f.get(key)||'').trim();
  Object.assign(model.settings,changes);
  await save();notify('Datenquellen und Zugänge lokal gespeichert.');
 }catch(error){notify(error.message,true);}
});$('solanaRpc').addEventListener('change',async e=>{try{const url=new URL(e.target.value);if(url.protocol!=='https:'||url.username||url.password)throw Error('Der Solana-RPC muss eine HTTPS-Adresse ohne Zugangsdaten im Benutzernamen verwenden.');model.settings.solanaRpc=url.toString();await save();$('solanaRpcTestStatus').textContent='RPC-Adresse gespeichert. Mit „Verbindung & Staking prüfen“ kannst du den Zugang testen.';notify('Solana-RPC aktualisiert.');}catch(error){e.target.value=model.settings.solanaRpc;notify(error.message,true);}});
  $('testSolanaRpc').addEventListener('click',async()=>{
   const button=$('testSolanaRpc'),status=$('solanaRpcTestStatus'),rpc=$('solanaRpc').value.trim();
   button.disabled=true;
   status.textContent='Verbindung und native Staking-Abfrage werden geprüft …';
   try{
    if(!rpc)throw Error('Bitte zuerst die vollständige HTTPS-RPC-Adresse einfügen.');
    const knownAddress='11111111111111111111111111111111';
    // Test only public Blockchain metadata; no signing, no wallet or API secret logging.
    await solanaRpcRead(rpc,'getBalance',[knownAddress,{commitment:'confirmed'}]);
    try{
     await solanaRpcRead(rpc,'getProgramAccounts',[
      'Stake11111111111111111111111111111111111111',
      {encoding:'jsonParsed',commitment:'confirmed',filters:[{dataSize:200},{memcmp:{offset:44,bytes:knownAddress}}]}
     ]);
     status.textContent='Verbindung erfolgreich. Der RPC unterstützt native Solana-Staking-Abfragen. Du kannst deine Wallet jetzt erneut scannen.';
    }catch(error){
     status.textContent='RPC erreichbar, aber die native Staking-Abfrage ist blockiert. Prüfe den Anbieterzugang (z. B. Helius) oder dessen Limits. Details: '+String(error.message||error).slice(0,180);
    }
   }catch(error){
    status.textContent='Solana-RPC nicht erreichbar: '+String(error.message||error).slice(0,180);
   }finally{button.disabled=false;}
  });
  $('autoRefresh').checked=model.settings.autoRefresh!==false;$('autoRefresh').addEventListener('change',async e=>{model.settings.autoRefresh=e.target.checked;await save();notify(e.target.checked?'Automatische Aktualisierung aktiviert.':'Automatische Aktualisierung deaktiviert.');});
  for(const k of ['twelveKey','eodhdKey','fmpKey','coinGeckoKey','etherscanKey','binplorerKey'])$('apiSettings').elements[k].value=model.settings[k]||'';
  $('apiSettings').elements.securitySource.value=model.settings.securitySource||'auto';
 $('apiSettings').elements.publicInstrumentEndpoint.value=model.settings.publicInstrumentEndpoint||'';
 $('apiSettings').elements.eodhdWorkerEndpoint.value=model.settings.eodhdWorkerEndpoint||'';
 $('apiSettings').elements.eodhdWorkerAccessToken.value=model.settings.eodhdWorkerAccessToken||'';
 const configured=[model.settings.publicInstrumentEndpoint,model.settings.eodhdWorkerEndpoint].filter(Boolean).length;$('optionalConnectionStatus').textContent=configured?configured+' eingerichtet':'Nicht eingerichtet';
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installButton').classList.remove('hidden');});$('installButton').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();installPrompt=null;$('installButton').classList.add('hidden');});
}
const assetWizard=createAssetWizard($('wizardDialog'),{
 getModel:()=>model,
 onCommit:async ({draft})=>{
  model=draft;
  await save();
  notify('Position gespeichert.');
 },
 lookupPublic:async(term)=>queryPublicInstruments(model.settings.publicInstrumentEndpoint,term),
 lookupListings:async(term)=>(await discoverSecurityListings(term,model.settings)).results
});
$('miniChartPeriods').innerHTML=renderChartPeriodButtons('wealth','data-mini-range',miniRange);
$('chartPeriods').innerHTML=renderChartPeriodButtons('wealth','data-range',range);
for(const type of ['click','input','change','submit'])document.addEventListener(type,event=>{
 if(!loadFailure)return;
 const control=event.target.closest('button,input,select,textarea,form');
 if(!control||control.matches('[data-page]')||['downloadRaw','recoverBackup','backupFile','installButton'].includes(control.id))return;
 event.preventDefault();event.stopImmediatePropagation();
},true);
initNav();initEvents();installCredentialVisibility();
$('portfolioStorageState').textContent=loadFailure?'Speicher nicht verfügbar. Keine Änderungen gespeichert.':portfolioStore.isIndexedDB?'Transaktionale IndexedDB aktiv':'Bisheriger Browser-Speicher aktiv';
$('migrateToIDB').classList.toggle('hidden',portfolioStore.isIndexedDB);
// Existing pre-cutover installations alone get a one-time, consented handover.
// Technical rollback/recovery remains in PortfolioStorage, never a regular UI choice.
$('storageMigrationSetup').classList.toggle('hidden',portfolioStore.isIndexedDB||Boolean(loadFailure));
// Keep a user's draft visible, but block stale writes until an explicit reload.
// localStorage compare-before-set alone is not an atomic multi-tab lock.
window.addEventListener('storage',event=>{
 if(event.storageArea!==localStorage||!['foliolab-open-v1',MODE_KEY].includes(event.key)||event.oldValue===event.newValue||loadFailure)return;
 otherTabChangedPortfolio=true;syncPortfolioState();
 const cashResult=$('cashComparisonResult');
 if(cashResult)cashResult.textContent='Der Datenstand wurde geändert. Bitte diesen Tab neu laden und erneut prüfen.';
 const interestResult=$('interestResult');if(interestResult)interestResult.textContent='Der Datenstand wurde geändert. Bitte diesen Tab neu laden und erneut prüfen.';
 const notice=$('notice');
 notice.textContent='Portfolio in einem anderen Tab geändert. Bitte diesen Tab neu laden, bevor du weitere Änderungen speicherst. Ungespeicherte Eingaben vorher sichern.';
 notice.setAttribute('role','alert');
 notice.classList.remove('hidden');
});
function showRecoveryNotice(){
 if($('downloadRaw'))return;
 const notice=$('notice');notice.setAttribute('role','alert');notice.classList.remove('hidden');
 notice.innerHTML='<strong>Gespeicherter Datenstand nicht lesbar.</strong> Änderungen sind gesperrt. '+
  'Zuerst Originaldaten sichern, dann ein geprüftes Backup wiederherstellen. '+
  (portfolioStore.isIndexedDB?'<strong>Hinweis: Die IDB-Originaldatei kann lokale API-Schlüssel enthalten!</strong> ':'')+
  '<button class="btn outline" type="button" id="downloadRaw">Originaldaten sichern</button> '+
  '<button class="btn outline" type="button" id="recoverBackup">Backup auswählen</button>';
 $('downloadRaw').addEventListener('click',async()=>{
  try{
   const data=portfolioStore.isIndexedDB?await portfolioStore.unverifiedBackup():localStorage.getItem('foliolab-open-v1')||'';
   const raw=typeof data==='string'?data:JSON.stringify(data,null,2);
   const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download=portfolioStore.isIndexedDB?'foliolab-idb-original-mit-lokalen-zugaengen.json':'foliolab-original-datenschutzsicherung.json';
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   recoveryDownloaded=true;recoveryOriginal=typeof data==='string'?null:data;
   notify('Originaldaten als Datei angeboten. Datei vor dem Fortfahren sicher speichern.');
  }catch(error){notify('Originaldaten konnten nicht exportiert werden: '+String(error.message||error),true);}
 });
 $('recoverBackup').addEventListener('click',()=>{
  if(!recoveryDownloaded)return notify('Zuerst die Originaldaten als Datei sichern.',true);
  $('backupFile').click();
 });
}
function pwaUpdateShouldDefer(){
 const active=document.activeElement;
 return saving||busy||Boolean(editor)||Boolean(document.querySelector('dialog[open]'))||
  Boolean(active&&active.matches('input, textarea, select, [contenteditable="true"]'));
}
function showPwaUpdateNotice(){
 let banner=$('pwaUpdateNotice');
 if(banner)return;
 banner=document.createElement('div');
 banner.id='pwaUpdateNotice';
 banner.className='pwa-update-notice';
 banner.setAttribute('role','status');
 const message=document.createElement('span');
 message.textContent='Neue FolioLab-Version verfügbar.';
 const button=document.createElement('button');
 button.type='button';
 button.textContent='Jetzt aktualisieren';
 button.addEventListener('click',()=>{
  if(saving||busy||editor||document.querySelector('dialog[open]')){
   notify('Bitte den laufenden Vorgang zuerst abschließen.',true);return;
  }
  location.reload();
 });
 banner.append(message,button);
 document.body.appendChild(banner);
}
if('serviceWorker'in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))){
 let existingController=Boolean(navigator.serviceWorker.controller);
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(existingController){
   if(pwaUpdateShouldDefer())showPwaUpdateNotice();
   else location.reload();
  }
  existingController=true;
 });
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{
  let lastUpdateCheck=Date.now();
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden||Date.now()-lastUpdateCheck<10*60*1000)return;
   lastUpdateCheck=Date.now();
   void registration.update().catch(()=>{});
  });
 }).catch(()=>{});
}
if(!loadFailure&&location.protocol==='https:'&&model.settings.autoRefresh!==false){
  const candidates=model.positions.some(p=>p.wallet?.enabled||(p.kind==='crypto'&&p.coinId)||((model.settings.twelveKey||model.settings.eodhdKey||model.settings.fmpKey||(model.settings.eodhdWorkerEndpoint&&model.settings.eodhdWorkerAccessToken))&&['etf','stock','fund'].includes(p.kind)&&p.symbol));
  if(candidates){try{const key='foliolab-open-last-auto-refresh';const last=Number(localStorage.getItem(key)||0);if(Date.now()-last>30*60*1000){localStorage.setItem(key,String(Date.now()));setTimeout(()=>refreshAll(),1000);}}catch(e){/* local storage may be disabled */}}
}

