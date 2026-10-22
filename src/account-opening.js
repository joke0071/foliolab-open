import {safeNumber} from './model.js';
/**
 * Produce opening cash position fields without creating an external cashflow or
 * a fictitious purchase. The valuation FX rate is always explicitly supplied
 * for non-EUR accounts; absence must not silently become 1.
 */
export function openingCashInput({amount,currency='EUR',fxRate}={}){
 const raw=String(amount??'').trim();
 if(!raw)return null;
 const quantity=safeNumber(raw,0);
 if(quantity===0)return null;
 if(!['EUR','USD','CHF','GBP','CAD','AUD','JPY','SEK','NOK'].includes(currency))throw Error('Unbekannte Kontowährung.');
 const rate=currency==='EUR'?1:safeNumber(fxRate,0.00000001,1000);
 return {kind:'cash',name:currency+' Guthaben',symbol:currency,quantity:raw,price:1,currency,fxRate:rate};
}
