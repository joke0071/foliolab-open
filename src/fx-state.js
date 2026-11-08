import {units,exact,preciseValue} from './decimal.js';
import {valueSign} from './defi.js';

// An explicit, fail-closed value in the existing exact FX field. Older readers
// reject this non-decimal value instead of replacing a nullable rate with 1.
// Native quantities, dated journal FX and existing numeric legacy rates do not change.
export const FX_UNKNOWN='UNKNOWN';
const missing=v=>v==null||typeof v==='string'&&!v.trim();
export function positionFX(p){
 if(!p.currency||p.currency==='EUR')return {state:'known',rateExact:'1'};
 const precise=p.fxRateExact,display=p.fxRate;
 if(precise===FX_UNKNOWN)return missing(display)?{state:'unknown',rateExact:null}:{state:'invalid',rateExact:null};
 if(missing(precise)&&missing(display))return {state:'unknown',rateExact:null};
 try{
  const raw=missing(precise)?display:precise,n=units(raw);
  if(n<units('0.00000001')||n>units('1000'))throw Error();
  if(!missing(display)&&Number(exact(n))!==Number(display))throw Error();
  return {state:'known',rateExact:exact(n)};
 }catch{return {state:'invalid',rateExact:null};}
}
export function normalizePositionFX(p,{legacy=false}={}){
 // EUR identity valuation ignores the legacy auxiliary FX field, exactly as
 // before. Retain a stored numeric exact field instead of silently repairing it.
 if(!p.currency||p.currency==='EUR')return {fxRate:1,fxRateExact:missing(p.fxRateExact)?'1':exact(units(p.fxRateExact))};
 const fx=positionFX(p);
 if(fx.state==='invalid'){
  // A pre-existing numeric display/exact discrepancy remains inspectable and
  // unvalued; never repair either value on load. New contradictory input rejects.
  if(legacy&&p.fxRateExact!==FX_UNKNOWN&&!missing(p.fxRate)&&!missing(p.fxRateExact)){
   const a=units(p.fxRate),b=units(p.fxRateExact);
   if(a>=units('0.00000001')&&b>=units('0.00000001')&&a<=units(1000)&&b<=units(1000))
    return {fxRate:Number(p.fxRate),fxRateExact:exact(b)};
  }
  throw Error('EUR-Wechselkurs ungültig oder widersprüchlich.');
 }
 return fx.state==='unknown'?{fxRate:null,fxRateExact:FX_UNKNOWN}:{fxRate:Number(fx.rateExact),fxRateExact:fx.rateExact};
}
/** Same fixed-point valuation as the existing core; UNKNOWN is never arithmetic. */
export function grossPositionValueExact(p){
 if(units(p.quantityExact??p.quantity)===0n)return '0';
 const fx=positionFX(p);if(fx.state!=='known')return null;
 return preciseValue(p.quantityExact??p.quantity,p.priceExact??p.price,fx.rateExact);
}
export function signedPositionValueExact(p){
 const sign=valueSign(p);if(sign===0)return '0';
 const v=grossPositionValueExact(p);return v===null?null:exact(units(v)*BigInt(sign));
}
export function positionValuation(positions){
 let known=0n,missing=0;
 for(const p of positions){const v=signedPositionValueExact(p);if(v===null)missing++;else known+=units(v);}
 return {totalExactEUR:missing?null:exact(known),knownTotalExactEUR:exact(known),unknownFXPositions:missing};
}
