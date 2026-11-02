import {units,exact} from './decimal.js';

/**
 * Apply a confirmed wallet rescan to an existing holding.
 * The UI's Number fields and the 18-decimal strings used for valuation must
 * always represent the same economic quantity and market quote.
 */
export function updateScannedWalletPosition(existing,asset,{updatedAt=new Date().toISOString(),model=null}={}){
 if(!existing?.wallet?.enabled||!asset)throw Error('Ungültige Wallet-Scan-Daten.');
 const quantityExact=exact(units(asset.quantityExact??asset.quantity));
 if(units(quantityExact)<0n)throw Error('Wallet-Bestand darf nicht negativ sein.');
 const hasFreshPrice=Number.isFinite(asset.price)&&asset.price>0;
 const priceExact=hasFreshPrice?exact(units(asset.price)):null;
 existing.quantityExact=quantityExact;
 existing.quantity=Number(quantityExact);
 existing.updatedAt=updatedAt;
 if(asset.chain==='btc-hd'&&asset.addressType)existing.wallet.addressType=asset.addressType;
 if(hasFreshPrice){
  existing.price=Number(priceExact);
  existing.priceExact=priceExact;
  existing.currency='EUR';
  existing.fxRate=1;
  existing.fxRateExact='1';
 }
 // An observed opening remains the current scan baseline for acquisition-only backfills.
 // A real quantity-managed journal is never rebased by a rescan.
 if(model){
  const entries=model.journalEntries.filter(j=>j.postings.some(p=>p.positionId===existing.id));
  if(entries.length&&entries.every(j=>j.source==='unified-bitcoin'&&j.postings.every(p=>p.quantityDeltaExact===null))){
   const opening=model.openingPositions.find(o=>o.positionId===existing.id);
   if(opening&&opening.source==='observed-opening'&&opening.asOf===null)opening.quantityExact=quantityExact;
  }
 }
 return existing;
}
