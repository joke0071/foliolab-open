import {createProvider,createAccount,createPosition,snapshot,safeNumber,safeImport} from './model.js';
import {executeTransaction} from './transactions.js';
import {validateEconomicPosition} from './defi.js';
/**
 * Pure, atomic setup of a portfolio position.
 * Only the returned draft may be persisted; validation never mutates the source.
 * @param {object} source Existing v3 portfolio
 * @param {object} input Wizard form state
 */
export function buildAssetWizardDraft(source,input){
 if(!source||![3,4].includes(source.version))throw Error('Unbekannter Portfoliostand.');
 if(source.version===4)safeImport(structuredClone(source));
 const draft=structuredClone(source);
 const kinds=['etf','stock','fund','crypto','cash','other'];
 const kind=String(input?.kind||'');
 if(!kinds.includes(kind))throw Error('Anlageklasse fehlt.');
 const simpleCash=kind==='cash'&&(input.accountId==='__new__'||input.providerId==='__new__')&&input.accountType==='savings';
 const name=String((simpleCash?input.accountName:input.name)||'').trim();
 if(!name)throw Error('Bitte eine Anlagenbezeichnung angeben.');
 const mode=input.mode==='buy'?'buy':'opening';
 if(kind==='cash'&&mode==='buy')throw Error('Guthaben werden als Bestand oder Einzahlung, nicht als Kauf erfasst.');
 const date=String(input.date||'');
 if(!/^\d{4}-\d\d-\d\d$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10))throw Error('Bitte ein gültiges Datum bis heute auswählen.');
 let provider=draft.providers.find(p=>p.id===input.providerId);
 if(!provider){
  if(input.providerId!=='__new__')throw Error('Bitte einen Anbieter auswählen oder neu erstellen.');
  provider=createProvider({name:input.providerName,type:input.providerType||'other'});
  if(draft.providers.some(p=>p.name.toLocaleLowerCase('de')===provider.name.toLocaleLowerCase('de')))throw Error('Anbieter existiert bereits; bitte auswählen.');
  draft.providers.push(provider);
 }
 let account=draft.accounts.find(a=>a.id===input.accountId&&a.providerId===provider.id);
 if(!account){
  if(input.accountId!=='__new__'&&input.providerId!=='__new__')throw Error('Bitte ein Konto dieses Anbieters auswählen oder neu erstellen.');
  account=createAccount({providerId:provider.id,name:input.accountName,type:input.accountType||'other',currency:(simpleCash?input.currency:input.accountCurrency)||'EUR'},draft);
  if(draft.accounts.some(a=>a.providerId===provider.id&&a.name.toLocaleLowerCase('de')===account.name.toLocaleLowerCase('de')))throw Error('Konto existiert bereits; bitte auswählen.');
  draft.accounts.push(account);
 }
 const currency=kind==='crypto'?'EUR':String(input.currency||'').toUpperCase();
 if(kind!=='crypto'&&!currency)throw Error('Bitte die Handels- oder Kontowährung ausdrücklich wählen.');
 const qty=String(input.quantity??'').trim();
 if(!qty)throw Error('Bitte einen Bestand oder eine Stückzahl angeben.');
 const quantity=safeNumber(qty,mode==='buy'?0.000000000000000001:0);
 if(mode==='buy'&&quantity<=0)throw Error('Kaufmenge muss größer als null sein.');
 const rawPrice=String(input.currentPrice??'').trim();
 const price=kind==='cash'?1:rawPrice?safeNumber(rawPrice,0):0;
 const rate=currency==='EUR'?1:safeNumber(input.fxRate,0.00000001,1000);
 if(input.walletEnabled&&kind!=='crypto')throw Error('Eine Wallet-Adresse kann nur mit Kryptowährungen verknüpft werden.');
 if(input.walletEnabled&&mode==='buy')throw Error('Wallet-Bestände werden ohne fiktive Kaufbuchung erfasst. Bitte „Aktueller Bestand“ auswählen.');
 const rawBasis=mode==='opening'?String(input.costBasisEUR??'').trim():'';
 if(rawBasis)safeNumber(rawBasis,0);
 const role=String(input.economicRole||'standard'),valuationMode=String(input.valuationMode||'included');
 const related=String(input.representedByPositionId||'');
 const wallet=input.walletEnabled?{
  enabled:true,chain:input.walletChain,address:input.walletAddress,contract:input.walletContract,
  decimals:input.walletDecimals,chainId:input.walletChainId,addressType:input.walletHdType
 }:null;
 const isin=String(input.isin||'').trim().toUpperCase();
 const symbol=String(input.symbol||'').trim().toUpperCase();
 const coinId=String(input.coinId||'').trim().toLowerCase();
 if(['etf','stock','fund'].includes(kind)&&!isin&&!symbol)throw Error('Bitte ISIN oder Ticker angeben, damit die Anlage später zugeordnet werden kann.');
 if(kind==='crypto'&&!coinId&&!symbol)throw Error('Kryptowährung bitte mit Symbol oder bestätigter CoinGecko-ID erfassen.');
 const same=(p)=>p.accountId===account.id&&p.kind===kind&&(
  isin&&p.isin===isin||
  kind==='crypto'&&coinId&&p.coinId===coinId||
  !isin&&!coinId&&symbol&&p.symbol===symbol||
  kind==='cash'&&p.currency===currency
 );
 if(draft.positions.some(same))throw Error('Diese Anlage ist in diesem Konto bereits vorhanden. Bitte den bestehenden Bestand bearbeiten oder eine Buchung erfassen.');
 const position=createPosition({providerId:provider.id,accountId:account.id,kind,name,
  symbol,isin,coinId,exchange:input.exchange||'',mic:input.mic||'',
  eodhdSymbol:input.eodhdSymbol||'',fmpSymbol:input.fmpSymbol||'',
  currency,fxRate:rate,quantity:mode==='buy'?'0':qty,price,wallet,
  economicRole:role,valuationMode,representedByPositionId:related,
  costBasisEUR:rawBasis||null,
  notes:String(input.notes||'').trim().slice(0,300)||(mode==='opening'?'Anfangsbestand zum '+date:'Kaufhistorie ab '+date),
  priceStatus:kind==='cash'?null:price>0?'Manuell angegebener Kurs':'Aktueller Kurs fehlt – Bewertung offen',
  },draft);
 draft.positions.push(position);
 validateEconomicPosition(position,draft);
 if(mode==='buy'){
  const purchase=String(input.unitPrice??'').trim();
  if(!purchase)throw Error('Für einen Kauf wird der tatsächliche Ausführungskurs benötigt.');
  const unitPrice=safeNumber(purchase,0.000000000000000001);
  const feeEUR=String(input.feeEUR??'').trim()?safeNumber(input.feeEUR,0):0;
  executeTransaction(draft,{type:'buy',date,positionId:position.id,quantity:qty,unitPrice,fxRate:rate,feeEUR});
 }
 snapshot(draft);
 return {draft,positionId:position.id,providerId:provider.id,accountId:account.id,mode};
}
