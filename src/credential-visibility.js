/**
 * Local-only credential visibility. Keys never enter markup attributes,
 * analytics, or logs. Password masking is restored on each page load.
 */
import {svg} from './format.js';
const labels=Object.freeze({
 eodhdKey:'EODHD API-Schlüssel',eodhdWorkerAccessToken:'Worker-Zugriffsschlüssel',fmpKey:'FMP API-Schlüssel',
 twelveKey:'Twelve Data API-Schlüssel',coinGeckoKey:'CoinGecko API-Schlüssel',
 etherscanKey:'Etherscan API-Schlüssel',binplorerKey:'Binplorer API-Schlüssel',
 solanaRpc:'Solana RPC-Adresse'
});
export function installCredentialVisibility(root=document){
 const inputs=root.querySelectorAll('#apiSettings input[type="password"], #blockchainSettings input[type="password"], #marketWorkerSetup input[type="password"], #solanaRpc');
 for(const input of inputs){
  if(input.closest('.credential-control'))continue;
  const id=input.id==='solanaRpc'?'solanaRpc':input.name;
  if(!Object.hasOwn(labels,id))continue;
  input.type='password';
  const wrap=root.createElement('span');
  wrap.className='credential-control';
  input.parentNode.insertBefore(wrap,input);
  wrap.append(input);
  const button=root.createElement('button');
  button.type='button';
  button.className='credential-toggle';
  const update=show=>{
   input.type=show?'text':'password';
   button.setAttribute('aria-pressed',String(show));
   button.setAttribute('aria-label',labels[id]+(show?' verbergen':' anzeigen'));
   button.title=labels[id]+(show?' verbergen':' anzeigen');
   button.innerHTML=svg(show?'eye-off':'eye',19);
  };
  update(false);
  button.addEventListener('click',()=>update(input.type==='password'));
  wrap.append(button);
 }
}
