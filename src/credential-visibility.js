/**
 * Local-only credential visibility. Keys never enter markup attributes,
 * analytics, or logs. Password masking is restored on each page load.
 */
import {svg} from './format.js';
const labels=Object.freeze({
 alphaVantageKey:'Alpha Vantage API-Schlüssel',marketstackKey:'Marketstack API-Schlüssel',
 eodhdKey:'EODHD API-Schlüssel',eodhdWorkerAccessToken:'Worker-Zugriffsschlüssel',fmpKey:'FMP API-Schlüssel',
 twelveKey:'Twelve Data API-Schlüssel',coinGeckoKey:'CoinGecko API-Schlüssel',
 etherscanKey:'Etherscan API-Schlüssel',binplorerKey:'Binplorer API-Schlüssel',
 solanaRpc:'Solana RPC-Adresse'
});
export function installCredentialVisibility(root=document){
 const inputs=root.querySelectorAll('input[type="password"], input[data-secret-input], #solanaRpc');
 const doc=root.ownerDocument||root;
 let sequence=0;
 for(const input of inputs){
  if(input.closest('.credential-control'))continue;
  const id=input.id==='solanaRpc'?'solanaRpc':input.name;
  const label=labels[id]||input.getAttribute('aria-label')||input.closest('label')?.querySelector('span')?.textContent?.trim().replace(/\s+/g,' ').slice(0,100)||'Geheimen Zugang';
  input.type='password';
  if(!input.id){do{input.id='credential-input-'+(++sequence);}while(doc.querySelectorAll('#'+input.id).length>1);}
  const wrap=doc.createElement('span');
  wrap.className='credential-control';
  input.parentNode.insertBefore(wrap,input);
  wrap.append(input);
  const button=doc.createElement('button');
  button.type='button';
  button.className='credential-toggle';
  button.setAttribute('aria-controls',input.id);
  const update=show=>{
   input.type=show?'text':'password';
   button.setAttribute('aria-pressed',String(show));
   button.setAttribute('aria-label',label+(show?' verbergen':' anzeigen'));
   button.title=label+(show?' verbergen':' anzeigen');
   button.innerHTML=svg(show?'eye-off':'eye',19);
  };
  update(false);
  // Revealing an unfinished draft must not blur it and trigger an existing
  // change/autosave handler. Keyboard navigation remains native and available.
  const keepInputFocus=event=>{if(doc.activeElement===input)event.preventDefault();};
  button.addEventListener('pointerdown',keepInputFocus);
  button.addEventListener('mousedown',keepInputFocus);
  button.addEventListener('click',()=>update(input.type==='password'));
  wrap.append(button);
 }
}
