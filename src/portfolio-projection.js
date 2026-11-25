import {quantityMath} from './decimal.js';
import {positionValuation} from './fx-state.js';
import {hasMissingPositionValue,automaticValuationConfirmed} from './quote-quality.js';
import {duplicateWalletHoldings} from './wallet-identity.js';

export const projectionLimits={start:1e9,monthly:1e7,years:50,lowRate:-90,highRate:50,inflation:30};

export function projectionStart(positions,now=Date.now()){
 const included=positions.filter(p=>p.valuationMode!=='excluded'&&quantityMath(p.wallet).units(p.quantityExact??p.quantity)!==0n);
 if(!included.length)return {value:null,reason:'Kein belegter aktueller Portfoliowert vorhanden.'};
 if(duplicateWalletHoldings({positions}).length)return {value:null,reason:'Mehrfach erfasste Walletbestände verhindern die Übernahme des Portfoliowerts.'};
 const missing=included.filter(p=>hasMissingPositionValue(p)||!automaticValuationConfirmed(p,now)).length;
 if(missing)return {value:null,reason:missing+(missing===1?' Position':' Positionen')+' ohne ausreichend belegte aktuelle Bewertung. Gib bei Bedarf einen eigenen Startwert ein.'};
 const value=Number(positionValuation(included).totalExactEUR);
 if(!(value>=0&&value<=projectionLimits.start))return {value:null,reason:'Der Portfoliowert liegt außerhalb des Bereichs für einen Szenario-Startwert.'};
 return {value,reason:'Vollständig belegter aktueller Portfoliowert verfügbar.'};
}

function inputNumber(input,min,max,label,integer=false){
 const raw=typeof input==='string'?input.trim():String(input);
 if(raw.length>32||!/^[-+]?\d+(?:[.,]\d{1,2})?$/.test(raw))throw Error(label+': Bitte eine Zahl mit höchstens zwei Nachkommastellen eingeben.');
 const value=Number(raw.replace(',','.'));
 if(value<min||value>max||integer&&!Number.isInteger(value))throw Error(label+': Erlaubter Bereich '+min+' bis '+max+(integer?' in ganzen Jahren.':'.'));
 return value;
}

export function projectPortfolio({start,monthly,years,rates,inflation}){
 const limits=projectionLimits;
 start=inputNumber(start,0,limits.start,'Startwert');
 monthly=inputNumber(monthly,-limits.monthly,limits.monthly,'Monatlicher Betrag');
 years=inputNumber(years,1,limits.years,'Zeitraum',true);
 inflation=inputNumber(inflation,0,limits.inflation,'Inflation');
 if(!Array.isArray(rates)||rates.length!==3)throw Error('Bitte drei Renditeannahmen eingeben.');
 const annual=rates.map((rate,i)=>inputNumber(rate,limits.lowRate,limits.highRate,['Unteres Szenario','Mittleres Szenario','Oberes Szenario'][i]));
 if(annual[0]>annual[1]||annual[1]>annual[2])throw Error('Die Renditeannahmen bitte aufsteigend eingeben.');
 return annual.map(rate=>{
  const factor=Math.pow(1+rate/100,1/12);
  let balance=start,unfunded=0;
  const points=[{year:0,nominal:start,real:start}];
  for(let month=1;month<=years*12;month++){
   const next=balance*factor+monthly;
   if(next<0)unfunded-=next;
   balance=Math.max(0,next);
   if(month%12===0)points.push({year:month/12,nominal:balance,real:balance/Math.pow(1+inflation/100,month/12)});
  }
  return {rate,points,unfunded};
 });
}
