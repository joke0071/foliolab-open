import {units,exact} from './decimal.js';

/**
 * Apply a confirmed wallet rescan to an existing holding.
 * The UI's Number fields and the 18-decimal strings used for valuation must
 * always represent the same economic quantity and market quote.
 */
export function updateScannedWalletPosition(existing,asset,{updatedAt=new Date().toISOString()}={}){
 if(!existing?.wallet?.enabled||!asset)throw Error('Ungültige Wallet-Scan-Daten.');
 const quantityExact=exact(units(asset.quantityExact??asset.quantity));
 if(units(quantityExact)<0n)throw Error('Wallet-Bestand darf nicht negativ sein.');
 existing.quantityExact=quantityExact;
 existing.quantity=Number(quantityExact);
 existing.updatedAt=updatedAt;
 if(asset.chain==='btc-hd'&&asset.addressType)existing.wallet.addressType=asset.addressType;
 if(Number.isFinite(asset.price)&&asset.price>0){
  const priceExact=exact(units(asset.price));
  existing.price=Number(priceExact);
  existing.priceExact=priceExact;
  existing.currency='EUR';
  existing.fxRate=1;
  existing.fxRateExact='1';
 }
 return existing;
}
