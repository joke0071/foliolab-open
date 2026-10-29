/** Existing disclosure UI; source documents never become financial transactions. */
import {escapeHTML as esc} from './model.js';
import {flatexCustodyAccounts} from './flatex-reconciliation.js';
import {importSourceKey,sourceUnmodified,validateImportSource} from './import-identity.js';
const labels={'order-buy':'ORDER Kauf','order-sell':'ORDER Verkauf',accumulation:'Thesaurierung','custody-change':'Lagerstellenwechsel',split:'Split',merger:'Fusion','fusion-cancellation':'Storno Fusion',cancellation:'Storno',unclassified:'Ungeklärt'};
const orderLabels={'possible-single':'Mögliche 1:1-Beziehung','multiple-cash-review':'Mehrere Kontobelege prüfen','multiple-depot-review':'Mehrere Depotausführungen prüfen','missing-depot':'Depotbeleg fehlt','missing-cash':'Kontobeleg fehlt',conflict:'Widerspruch prüfen','overlap-review':'Überlappung prüfen','cancelled-review':'Storno prüfen','scope-review':'Quellkontexte prüfen','source-review':'Quellangaben prüfen'};
const show=v=>esc(v==null||v===''?'unbekannt':String(v).length>300?String(v).slice(0,300)+' (Anzeige gekürzt)':String(v));
const stagingLabels={'source-only':'Zuordnung bestätigt – Buchungswirkung ungeprüft','existing-source':'Quellnachweis vorhanden – Buchungswirkung ungeprüft','manual-review':'Manuell geändert – geschützt','existing-conflict':'Vorhandenen Quellnachweis prüfen',conflict:'Geänderte Originalquelle prüfen','overlap-review':'Überlappung prüfen','source-review':'Quellangaben prüfen',unassigned:'Portfolio-Konto auswählen',unconfirmed:'Zuordnung noch bestätigen',stale:'Datenstand geändert – neu laden'};
/** Session-only account/source review. Never projects or commits transactions. */
export function reviewNativeFlatexBindings(model,identities,assignments={}, {stale=false}={}){
 if(identities?.kind!=='flatex-native-source-identities'||identities.version!==1||identities.ready!==false||identities.writeEnabled!==false||!Object.isFrozen(identities)||!Array.isArray(identities.rows)||!identities.rows.length||identities.rows.length>5000||!assignments||typeof assignments!=='object'||Array.isArray(assignments))throw Error('Ungeprüfte native Kontozuordnung.');
 for(const key of ['accounts','providers','bookings','journalEntries'])if(!Array.isArray(model?.[key])||model[key].some(x=>typeof x?.id!=='string'||!x.id)||new Set(model[key].map(x=>x.id)).size!==model[key].length)throw Error('Portfoliokontext nicht eindeutig prüfbar.');
 const providers=new Map(model.providers.map(p=>[p.id,p])),choices={depot:flatexCustodyAccounts(model),account:model.accounts.filter(a=>['checking','savings','securities','other'].includes(a.type)&&/flatex/i.test(providers.get(a.providerId)?.name||''))};
 const groups=new Map(),nativeBookings=new Map(),legacyAccounts=new Set();
 for(const b of model.bookings){const key=importSourceKey(b.importSource);if(key){const list=nativeBookings.get(key)||[];list.push(b);nativeBookings.set(key,list);}if(!b.importSource?.sourceId?.startsWith('flatex-native-'))legacyAccounts.add(b.accountId);}
 for(const r of identities.rows){const key=r.sourceId??JSON.stringify([r.sourceType,r.sourceScope]),list=groups.get(key)||[];list.push(r);groups.set(key,list);}
 const contexts=[...groups.values()].map((rows,index)=>{
  const r=rows[0],options=choices[r.sourceType].map(a=>({id:a.id,label:a.name+' · '+providers.get(a.providerId).name+' · '+a.currency})),binding=r.sourceId?assignments[r.sourceId]:null;
  const account=choices[r.sourceType].find(a=>a.id===binding?.accountId),accountSnapshot=account?JSON.stringify([account,providers.get(account.providerId)]):'';
  const confirmed=Boolean(!stale&&r.sourceId&&account&&binding.confirmed===true&&binding.accountSnapshot===accountSnapshot);
  return {index,sourceId:r.sourceId,sourceType:r.sourceType,sourceScope:r.sourceScope,rowCount:rows.length,options,accountId:account?.id||'',accountLabel:options.find(o=>o.id===account?.id)?.label||'',accountSnapshot,confirmed,disabled:stale||!r.sourceId||!options.length,legacyReview:confirmed&&legacyAccounts.has(account.id),reason:stale?'Datenstand geändert. Bitte neu laden.':!r.sourceId?'Quellkontext ungeklärt.':!options.length?'Passendes Flatex-Konto unter „Mehr“ anlegen.':binding?.confirmed&&!confirmed?'Kontodaten geändert. Bitte erneut bestätigen.':''};
 });
 const bySource=new Map(contexts.filter(c=>c.sourceId).map(c=>[c.sourceId,c]));
 const rows=identities.rows.map(r=>{
  const context=bySource.get(r.sourceId);let status=r.status==='candidate-source'?'source-only':r.status,reasons=[...r.reasons];
  if(stale)status='stale';
  else if(r.status==='candidate-source'){
   if(!context?.accountId)status='unassigned';
   else if(!context.confirmed)status='unconfirmed';
   else{
    const matches=nativeBookings.get(importSourceKey({...r.identity,accountId:context.accountId}))||[];
    if(matches.length>1){status='existing-conflict';reasons=['Mehrere Buchungen mit derselben Quellenidentität.'];}
    else if(matches.length){const b=matches[0];try{validateImportSource(b.importSource,b.accountId);const evidence=JSON.parse(b.importSource.sourcePayload).sourceEvidence;if(evidence.payloadDigest!==r.payloadDigest){status='existing-conflict';reasons=['Originalfelder weichen vom vorhandenen Nachweis ab.'];}else if(!sourceUnmodified(model,b)){status='manual-review';reasons=['Manuelle Änderungen bleiben erhalten.'];}else status='existing-source';}catch{status='existing-conflict';reasons=['Vorhandene Herkunft ist nicht vollständig prüfbar.'];}}
   }
  }
  return {sourceIndex:r.sourceIndex,line:r.line,status,label:stagingLabels[status],reasons,accountId:context?.confirmed?context.accountId:null};
 });
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
 return freeze({kind:'flatex-native-binding-review',version:1,ready:false,writeEnabled:false,stale:Boolean(stale),contexts,rows,confirmed:contexts.filter(c=>c.confirmed).length,legacyReview:contexts.some(c=>c.legacyReview)});
}
export function flatexNativeBindingMarkup(staging,{limit=20}={}){
 if(staging?.kind!=='flatex-native-binding-review'||staging.ready!==false||staging.writeEnabled!==false||!Object.isFrozen(staging)||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungeprüfte native Kontozuordnungsanzeige.');
 return '<details id="flatexNativeBindings" class="flatex-order-review"><summary>Kontozuordnung · '+staging.confirmed+' von '+staging.contexts.length+' bestätigt</summary><p class="small-help">Nur für diese Vorschau. Buchungswirkung, Bestände und Kosten bleiben ungeprüft; keine Übernahme.</p>'+(staging.stale?'<p role="status">Datenstand geändert. Bitte neu laden.</p>':'')+(staging.legacyReview?'<p class="small-help">Vorhandene Buchungen anderer Herkunft sind noch nicht abgeglichen.</p>':'')+staging.contexts.slice(0,limit).map(c=>'<fieldset id="flatexBinding-'+c.index+'" class="flatex-binding-context" tabindex="-1"><legend>'+show(c.sourceType==='depot'?'Depot':'Konto')+' · '+show(c.sourceScope)+'</legend><p>'+c.rowCount+' Quellzeilen</p><label class="field"><span>Portfolio-Konto</span><select id="flatexBindingAccount-'+c.index+'" data-flatex-binding-account="'+c.index+'" '+(c.disabled?'disabled':'')+'><option value="">Portfolio-Konto auswählen</option>'+c.options.map(a=>'<option value="'+esc(a.id)+'" '+(a.id===c.accountId?'selected':'')+'>'+show(a.label)+'</option>').join('')+'</select></label>'+(c.accountLabel?'<p class="small-help flatex-binding-selected">Gewählt: '+show(c.accountLabel)+'</p>':'')+'<label class="flatex-binding-confirm"><input type="checkbox" id="flatexBindingConfirm-'+c.index+'" data-flatex-binding-confirm="'+c.index+'" '+(c.confirmed?'checked ':'')+(c.disabled||!c.accountId?'disabled':'')+'>Zuordnung für diese Vorschau bestätigen</label>'+(c.reason?'<p class="small-help">'+esc(c.reason)+'</p>':'')+'</fieldset>').join('')+(staging.contexts.length>limit?'<button type="button" id="flatexBindingsShowMore" class="btn outline">Weitere '+Math.min(20,staging.contexts.length-limit)+' Kontexte anzeigen</button>':'')+'</details>';
}
/** Read-only presentation of the existing common simulation; never a submit DTO. */
export function flatexNativeSimulationMarkup(result,{mode='',disabled=false,model=null}={}){
 if(!['','append','backfill'].includes(mode)||typeof disabled!=='boolean')throw Error('Ungültiger Simulationsmodus.');
 let output='';
 if(result){
  if(!mode||result.kind!=='flatex-native-trade-preview'||result.ready!==false||result.writeEnabled!==false||typeof result.eligible!=='boolean'||(!result.eligible&&result.preview!==null))throw Error('Ungeprüfte Stückhistorien-Simulation.');
  if(!result.eligible)output='<p id="flatexSimulationResult" class="small-help">Simulation gesperrt: '+esc(result.reason)+'</p>';
  else{
   const p=result.preview;
   if(!model||p?.baseline!==JSON.stringify(model)||p.issues.length||p.skipped)throw Error('Datenstand der Simulation nicht aktuell.');
   const ids=new Set(p.rows.map(r=>r.row?.positionId).filter(Boolean)),positions=model.positions.filter(x=>ids.has(x.id));
   output='<div id="flatexSimulationResult"><p><strong>Simulation: '+p.ready+' neue Buchungen · '+p.duplicates+' bereits vorhanden</strong></p><p>'+positions.length+' betroffene Anlagen · '+Math.min(20,positions.length)+' Mengenvergleiche angezeigt.</p>'+positions.slice(0,20).map(x=>{const after=p.simulated.positions.find(a=>a.id===x.id);return '<p class="flatex-simulation-quantity">'+show(x.name)+' · '+show(x.quantityExact??x.quantity)+' → '+show(after.quantityExact??after.quantity)+' Stück</p>';}).join('')+'<p class="small-help">Nur simuliert. Gebühren, Steuern und Anschaffungskosten bleiben ungeprüft. Keine vollständige Cashflow- oder Renditebasis. Keine Übernahme.</p></div>';
  }
 }
 return '<details id="flatexNativeSimulation" class="flatex-order-review"><summary>Stückhistorie simulieren</summary><p class="small-help">Alle ausgewählten Dateien werden gemeinsam geprüft. Ungeklärte Vorgänge sperren den gesamten Stapel. Dein Portfolio bleibt unverändert.</p><label class="field"><span>Simulationsmodus</span><select id="flatexSimulationMode" '+(disabled?'disabled':'')+'><option value="">Modus auswählen</option><option value="append" '+(mode==='append'?'selected':'')+'>Leere Positionen ergänzen</option><option value="backfill" '+(mode==='backfill'?'selected':'')+'>Historie mit vorhandenem Endbestand abgleichen</option></select></label><button type="button" id="flatexSimulationRun" class="btn outline" '+(disabled||!mode?'disabled':'')+'>Stückhistorie prüfen</button>'+output+'</details>';
}
function nativeAmountMarkup(entry,group,staged,stale){
 if(entry.status==='review')return '<p class="small-help flatex-amount-status">Betragsprüfung bleibt offen.'+(entry.reasons.length>group.reasons.length?' '+esc(entry.reasons.at(-1)):'')+'</p>';
 const sources=[...group.depot,...group.cash].map(l=>staged.get(JSON.stringify([l.sourceIndex,l.line])));
 const blocked=sources.find(s=>!s?.accountId||!['source-only','existing-source'].includes(s.status));
 if(stale||sources.length!==2||blocked||sources.some(s=>!s))return '<p class="small-help flatex-amount-status">Betragsprüfung: '+(stale?'Datenstand geändert – neu laden.':blocked&&['manual-review','existing-conflict','conflict'].includes(blocked.status)?esc(blocked.label)+'.':'Kontozuordnung beider Belege bestätigen.')+'</p>';
 return '<div class="flatex-amount-review"><p><strong>Rechnerische Betragsprüfung</strong></p><p>Brutto aus Stückzahl × Kurs: '+show(entry.grossExact)+' '+show(entry.currency)+'</p><p>Kontobeleg: '+show(entry.cashExact)+' '+show(entry.currency)+'</p><p>Ungeklärte Differenz: '+show(entry.differenceExact)+' '+show(entry.currency)+'</p><p class="small-help">'+(entry.status==='gross-equal'?'Rechnerisch gleich; Kosten und Buchungswirkung bleiben ungeprüft.':'Keine automatische Gebühren-, Steuer- oder FX-Zuordnung.')+' Keine Übernahme.</p></div>';
}
export function flatexNativeOrderMarkup(documents,links,{limit=20,legLimits={},amountAudit=null,staging=null}={}){
 if(links?.kind!=='flatex-native-order-links'||links.ready!==false||links.writeEnabled!==false||!Object.isFrozen(links)||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungültige Flatex-Orderanzeige.');
 if(amountAudit&&(amountAudit.kind!=='flatex-native-amount-audit'||!Object.isFrozen(amountAudit)||amountAudit.ready!==false||amountAudit.writeEnabled!==false||amountAudit.costsVerified!==false||amountAudit.entries.length!==links.groups.length||amountAudit.entries.some((e,i)=>e.orderReference!==links.groups[i].orderReference||JSON.stringify([e.depot,e.cash])!==JSON.stringify([links.groups[i].depot,links.groups[i].cash]))))throw Error('Ungeprüfte Flatex-Betragsanzeige.');
 if(amountAudit&&staging&&(staging.kind!=='flatex-native-binding-review'||!Object.isFrozen(staging)||staging.ready!==false||staging.writeEnabled!==false))throw Error('Ungeprüfte Flatex-Kontobindung.');
 const staged=new Map((staging?.rows||[]).map(r=>[JSON.stringify([r.sourceIndex,r.line]),r]));
 const possible=links.groups.filter(g=>g.status==='possible-single').length;
 const sourceRows=documents.map(f=>new Map(f.document.rows.map(r=>[r.line,r])));
 const groups=links.groups.slice(0,limit).map((g,i)=>{
  const legLimit=legLimits[i]??20;if(!Number.isSafeInteger(legLimit)||legLimit<1||legLimit>5000)throw Error('Ungültige Flatex-Beleganzeige.');
  const legs=[...g.depot,...g.cash];
  const items=legs.slice(0,legLimit).map((l,j)=>{
   const f=documents[l.sourceIndex],r=sourceRows[l.sourceIndex].get(l.line),v=r.values,n=r.numbers,depot=l.sourceType==='depot';
   return '<li id="flatexOrderLeg-'+i+'-'+j+'" tabindex="-1"><p>'+(depot?'Depot':'Konto')+' · Datei '+(l.sourceIndex+1)+' · '+show(f.name)+' · Zeile '+l.line+'</p><p>Bankreferenz: '+show(l.bankReference)+' · Orderreferenz: '+show(l.orderReference)+' · Quellkontext: '+show(l.sourceScope)+'</p><p>Buchtag: '+show(r.dates.bookingDate)+' · Valuta: '+show(r.dates.valueDate)+'</p><p>'+(depot?'Nominal laut Export: '+show(n.nominal)+' '+show(v.unit)+' · Kurs laut Export: '+show(n.rate)+' '+show(v.priceCurrency):'Betrag laut Export: '+show(n.amount)+' '+show(v.amountCurrency))+'</p></li>';
  }).join('');
  return '<details id="flatexOrderGroup-'+i+'" class="flatex-order-group"><summary>Order '+show(g.orderReference)+' · '+show(g.type==='buy'?'Kauf':g.type==='sell'?'Verkauf':'Typ ungeklärt')+' · '+show(g.isin)+' · '+esc(orderLabels[g.status])+' · '+g.depot.length+' Depotbelege / '+g.cash.length+' Kontobelege</summary><ul>'+g.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>'+(amountAudit?nativeAmountMarkup(amountAudit.entries[i],g,staged,staging?.stale):'')+'<p>'+Math.min(legLimit,legs.length)+' von '+legs.length+' Belegen angezeigt.</p><ol>'+items+'</ol>'+(legs.length>legLimit?'<button type="button" class="btn outline" data-flatex-order-legs="'+i+'">Weitere '+Math.min(20,legs.length-legLimit)+' Belege anzeigen</button>':'')+'</details>';
 }).join('');
 return '<details id="flatexNativeOrders" class="flatex-order-review"><summary>Orderbeziehungen · '+links.groups.length+' Gruppen · '+possible+' mögliche Paare · '+(links.groups.length-possible)+' Prüffälle</summary><p class="small-help">Nur mögliche Quellenbeziehungen, keine bestätigte Abrechnung oder Kontoeigentümerschaft. Keine Buchungsübernahme, Summierung oder Gebühren-/Steueraufteilung.</p><p>'+links.unassigned.length+' Zeilen ohne Orderreferenz bleiben in den Quellzeilen sichtbar. '+Math.min(limit,links.groups.length)+' von '+links.groups.length+' Gruppen angezeigt.</p>'+groups+(links.groups.length>limit?'<button type="button" class="btn outline" id="flatexOrdersShowMore">Weitere '+Math.min(20,links.groups.length-limit)+' Gruppen anzeigen</button>':'')+'</details>';
}
export function flatexNativeMarkup(documents,{limit=50,orderLinks=null,orderLimit=20,legLimits={},staging=null,bindingLimit=20,amountAudit=null}={}){
 if(!Array.isArray(documents)||!documents.length||documents.length>20||documents.some(f=>f?.document?.kind!=='flatex-native-document-preview'||f.document.writeEnabled!==false||f.document.ready!==false||!['depot','account'].includes(f.document.type))||!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Ungültige Flatex-Originalformatanzeige.');
 const all=documents.flatMap((f,sourceIndex)=>f.document.rows.map(row=>({name:f.name,document:f.document,row,sourceIndex})));
 const staged=new Map((staging?.rows||[]).map(r=>[JSON.stringify([r.sourceIndex,r.line]),r]));
 if(all.length>5000)throw Error('Flatex: insgesamt maximal 5.000 Datenzeilen je Vorschau.');
 const counts=documents.reduce((s,f)=>{s[f.document.type]+=f.document.rows.length;return s;},{depot:0,account:0});
 const dates=all.flatMap(({row})=>row.dates.bookingDate?[row.dates.bookingDate]:[]).sort();
 const rows=all.slice(0,limit).map(({name,document:d,row:r,sourceIndex})=>{
  const v=r.values,n=r.numbers,depot=d.type==='depot',type=depot?'Depot':'Konto';
  const sourceReview=staged.get(JSON.stringify([sourceIndex,r.line]));
  const amount=depot?(n.nominal??'unbekannt')+' '+v.unit:(n.amount??'unbekannt')+' '+v.amountCurrency;
  return '<details class="performance-details"><summary><span>'+show(type+' · '+(r.dates.bookingDate||v.bookingDate)+' · '+labels[r.kind]+' · '+amount)+'</span></summary><div class="performance-details-body">'+
   '<p>'+show(name)+' · Zeile '+r.line+' · '+show(d.encoding)+'</p>'+
   (sourceReview?'<p class="flatex-source-status">'+esc(sourceReview.label)+(sourceReview.reasons.length?' · '+esc(sourceReview.reasons[0]):'')+'</p>':'')+
   '<p>Buchtag: '+show(r.dates.bookingDate)+' · Valuta: '+show(r.dates.valueDate)+'</p>'+
   '<p>Bank-Transaktionsreferenz: '+show(v.transactionReference)+' · Orderreferenz im Quelltext: '+show(r.order?.reference)+'. Keine bestätigte Gegenbuchung.</p>'+
   (depot?'<p>Nominal laut Export: '+show(n.nominal)+' '+show(v.unit)+' · Kurs laut Export: '+show(n.rate)+' '+show(v.priceCurrency)+'</p>':'<p>Betrag laut Export: '+show(n.amount)+' '+show(v.amountCurrency)+'. Keine bestätigte externe Ein- oder Auszahlung.</p>')+
   '<details><summary>Geparste Quellfelder</summary><dl>'+d.columns.map(c=>'<dt>'+esc(c.header||({unit:'Einheit',priceCurrency:'Kurswährung',amountCurrency:'Betragswährung'}[c.key]||c.key)+' (ohne Spaltenüberschrift)')+'</dt><dd>'+show(v[c.key])+'</dd>').join('')+'</dl></details>'+
   (r.issues.length?'<ul>'+r.issues.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>':'')+'</div></details>';
 }).join('');
 return '<div class="ledger-live-preview flatex-native-preview"><h3>Flatex Originalformat – lokale Vorschau</h3><p>'+counts.depot+' Depotzeilen · '+counts.account+' Kontozeilen · '+Math.min(limit,all.length)+' von '+all.length+' angezeigt.</p>'+
  (dates.length?'<p>Gültige Buchtage: '+esc(dates[0])+' bis '+esc(dates.at(-1))+'. Ungeklärte Datumsangaben bleiben in den Quellzeilen sichtbar.</p>':'')+
  '<p class="small-help">Keine Buchungsübernahme. Dateien und mögliche Überlappungen bleiben getrennt; Order- und Cashzuordnung sind noch nicht bestätigt. Für getrennte Uploads „Flatex Originalformat – Vorschau“ wählen.</p>'+(staging?flatexNativeBindingMarkup(staging,{limit:bindingLimit}):'')+(orderLinks?flatexNativeOrderMarkup(documents,orderLinks,{limit:orderLimit,legLimits,amountAudit,staging}):'')+rows+
  (all.length>limit?'<button type="button" id="flatexNativeShowMore" class="btn outline">Weitere '+Math.min(50,all.length-limit)+' Zeilen anzeigen</button>':'')+'</div>';
}
