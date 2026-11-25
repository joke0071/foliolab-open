/** Local fixed-point arithmetic for portfolio ledgers; at most 18 decimal places. */
export const SCALE=10n**18n;
// Pure parsing results only: immutable primitives, successful parses, bounded
// to 128 short inputs. No journal/model/permission validation is cached.
const parsedUnits=new Map();
const PARSED_UNITS_LIMIT=128;
function rememberUnits(key,result){
 if(key!==null){if(parsedUnits.size>=PARSED_UNITS_LIMIT)parsedUnits.delete(parsedUnits.keys().next().value);parsedUnits.set(key,result);}
 return result;
}
function expand(v){
 const s=String(v).trim().replace(',','.');
 const match=/^([+-]?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(s);
 if(!match)throw Error('Ungültiger Dezimalwert.');
 const digits=match[2]+(match[3]||''),places=(match[3]||'').length-Number(match[4]||0);
 if(!Number.isSafeInteger(places)||Math.abs(places)>200)throw Error('Zahl außerhalb des gültigen Bereichs.');
 const value=places>0?(digits.length<=places?'0.'+'0'.repeat(places-digits.length)+digits:digits.slice(0,-places)+'.'+digits.slice(-places)):digits+'0'.repeat(-places);
 return match[1]+value;
}
/** @param {string|number|bigint} value @returns {bigint} */
export function units(value){
 if(typeof value==='bigint')return value*SCALE;
 const key=(typeof value==='string'&&value.length<=80)||typeof value==='number'?String(value):null;
 if(key!==null&&parsedUnits.has(key))return parsedUnits.get(key);
 return rememberUnits(key,parseFixed(value,18,SCALE));
}

function parseFixed(value,places,scale){
 if(typeof value==='bigint')return value*scale;
 const match=/^([+-]?)(\d+)(?:\.(\d+))?$/.exec(expand(value));
 const fraction=match[3]||'';
 if(fraction.length>places&&/[1-9]/.test(fraction.slice(places)))throw Error('Mehr als '+places+' Nachkommastellen können nicht exakt gespeichert werden.');
 if(match[2].length>32)throw Error('Wert überschreitet das unterstützte Größenlimit.');
 const n=BigInt(match[2])*scale+BigInt(fraction.slice(0,places).padEnd(places,'0'));
 return match[1]==='-'?-n:n;
}

function formatFixed(n,places,scale){
 const sign=n<0n?'-':'',u=n<0n?-n:n;
 const fraction=(u%scale).toString().padStart(places,'0').replace(/0+$/,'');
 return sign+(u/scale)+(fraction?'.'+fraction:'');
}

export const exact=n=>formatFixed(n,18,SCALE);
const ledgerQuantity=Object.freeze({units,exact,scale:SCALE});
const yoctoScale=10n**24n;
export const nearQuantity=Object.freeze({
 units:value=>parseFixed(value,24,yoctoScale),
 exact:value=>formatFixed(value,24,yoctoScale),
 scale:yoctoScale
});
export function quantityMath(wallet){
 return wallet?.enabled&&!wallet.contract&&(wallet.chain==='near'||wallet.chain==='near-locked')?nearQuantity:ledgerQuantity;
}
export const plus=(a,b)=>a+b;
export const minus=(a,b)=>a-b;
export function mul(a,b){
 const n=a*b,mag=n<0n?-n:n;
 const result=(mag+SCALE/2n)/SCALE;
 return n<0n?-result:result;
}
export function div(a,b){
 if(b===0n)throw Error('Division durch Null.');
 const n=a*SCALE,negative=(n<0n)!==(b<0n),aa=n<0n?-n:n,bb=b<0n?-b:b;
 const result=(aa+bb/2n)/bb;
 return negative?-result:result;
}
export function preciseValue(quantity,price,rate='1',wallet=null){
 const math=quantityMath(wallet);
 const product=math.units(quantity)*units(price);
 const magnitude=product<0n?-product:product;
 const gross=(magnitude+math.scale/2n)/math.scale;
 return exact(mul(product<0n?-gross:gross,units(rate)));
}
/** Only convert to JS number at UI/external-API boundaries. */
export function approx(value){return Number(exact(typeof value==='bigint'?value:units(value)));}

/** Exact nonnegative atomic on-chain integer to canonical decimal with 18-digit limit. */
export function atomicDecimal(raw,decimals){
 if(!/^\d+$/.test(String(raw??''))||!Number.isInteger(Number(decimals))||decimals<0||decimals>30)throw Error('Unvollständiger oder ungültiger Blockchain-Rohbetrag.');
 const n=BigInt(String(raw)),base=10n**BigInt(decimals);
 const fraction=(n%base).toString().padStart(decimals,'0').replace(/0+$/,'');
 return exact(units((n/base).toString()+(fraction?'.'+fraction:'')));
}
