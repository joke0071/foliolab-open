import {discoverWallet,walletBalance,PUBLIC_EVM_NETWORKS} from './market.js';
/** @typedef {{network:string,name:string,mode:string,canScan:boolean,note:string}} WalletCapabilities */
export const NETWORKS=[
 {id:'btc',name:'Bitcoin',mode:'native',note:'Einzeladresse, kein xpub'},
 {id:'1',name:'Ethereum',mode:'tokens-best-effort',note:'ETH / ERC-20'},
 {id:'8453',name:'Base',mode:'tokens-best-effort',note:'ETH / ERC-20'},
 {id:'42161',name:'Arbitrum',mode:'tokens-best-effort',note:'ETH / ERC-20'},
 {id:'10',name:'Optimism',mode:'tokens-best-effort',note:'ETH / ERC-20'},
 {id:'137',name:'Polygon',mode:'tokens-best-effort',note:'POL / ERC-20'},
 {id:'43114',name:'Avalanche C-Chain',mode:'tokens-best-effort',note:'AVAX / ERC-20'},
 {id:'xrp',name:'XRP Ledger',mode:'tokens-best-effort',note:'XRP und Trust Lines (Issuer prüfen)'},
 {id:'sol',name:'Solana',mode:'native',note:'SOL, SPL-Abfrage eingeschränkt'},
 ...[['bnb','BNB Smart Chain'],['cardano','Cardano'],['cosmos','Cosmos'],['ton','TON'],['sui','Sui'],['aptos','Aptos']].map(([id,name])=>({id,name,mode:'manual',note:'Manuell; keine verifizierte Schlüssel-los-Erkennung'}))
];
export function getCapabilities(network){
 const n=NETWORKS.find(x=>x.id===String(network));if(!n)throw Error('Unbekanntes Netzwerk.');
 return {network:n.id,name:n.name,mode:n.mode,canScan:n.mode!=='manual',note:n.note};
}
export function validateAddress(network,address){
 const id=String(network),a=String(address||'').trim();
 if(/^(xprv|yprv|zprv)/i.test(a)||/\b(seed|mnemonic|private key)\b/i.test(a))throw Error('Keine privaten Schlüssel oder Seed-Phrases eingeben.');
 const valid=id==='btc'?/^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{24,47})$/.test(a):id==='sol'?/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a):id==='xrp'?/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a):PUBLIC_EVM_NETWORKS[Number(id)]?/^0x[0-9a-fA-F]{40}$/.test(a):false;
 if(!valid)throw Error('Öffentliche Adresse passt nicht zum Netzwerk.');return a;
}
export function getAdapter(network){
 const caps=getCapabilities(network);
 return Object.freeze({
 validateAddress:a=>validateAddress(network,a),
 getCapabilities:()=>caps,
 discoverAssets:(address,settings={},fetcher=globalThis.fetch)=>{if(!caps.canScan)throw Error('Netzwerk derzeit nur manuell verwaltbar.');return discoverWallet(caps.network,validateAddress(network,address),settings,fetcher);},
 getBalances:(wallet,settings={},fetcher=globalThis.fetch)=>walletBalance(wallet,settings,fetcher),
 getTokenMetadata:async()=>null
 });
}
