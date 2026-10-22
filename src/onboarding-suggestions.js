/**
 * Offline, optional onboarding suggestions. Names and classifications are
 * interface hints, NOT statements about licensing, custody or affiliation.
 * Never contact web search services or create a provider/account automatically.
 */
const DIRECTORY=[
 ['Flatex','broker',['flatex.at','flatexdegiro']],
 ['Trade Republic','broker',['traderepublic']],
 ['Scalable Capital','broker',['scalable']],
 ['DADAT','broker',[]],
 ['Interactive Brokers','broker',['ibkr']],
 ['DEGIRO','broker',[]],
 ['Smartbroker+','broker',['smartbroker']],
 ['Finanzen.net ZERO','broker',['zero']],
 ['Traders Place','broker',[]],
 ['JustTRADE','broker',[]],
 ['Consorsbank','broker',[]],
 ['Comdirect','broker',[]],
 ['ING','bank',['ing diba']],
 ['Erste Bank','bank',['sparkasse','erste']],
 ['Raiffeisen','bank',['raiffeisenbank']],
 ['Bank Austria','bank',['unicredit']],
 ['BAWAG','bank',[]],
 ['Volksbank','bank',[]],
 ['Easybank','bank',[]],
 ['Santander','bank',['santander bank']],
 ['N26','bank',[]],
 ['C24','bank',[]],
 ['DKB','bank',[]],
 ['Revolut','bank',[]],
 ['Renault Bank direkt','bank',[]],
 ['WeltSparen','broker',['raisin']],
 ['Bitpanda','broker',[]],
 ['Coinbase','broker',[]],
 ['Kraken','broker',[]],
 ['Binance','broker',[]],
 ['Bitstamp','broker',[]],
 ['Crypto.com','broker',['crypto com']],
 ['Bison','broker',[]],
 ['Ledger','wallet',['ledger live']],
 ['Trezor','wallet',[]],
 ['MetaMask','wallet',[]],
 ['Phantom','wallet',[]],
 ['Rabby','wallet',[]],
 ['Trust Wallet','wallet',[]],
 ['Exodus','wallet',[]],
 ['Coinbase Wallet','wallet',[]],
 ['BlueWallet','wallet',[]],
 ['Electrum','wallet',[]]
];
const norm=x=>String(x||'').toLocaleLowerCase('de').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export const providerDirectory=Object.freeze(DIRECTORY.map(([name,type,aliases])=>Object.freeze({name,type,aliases:Object.freeze(aliases)})));
export function providerSuggestions(query='',limit=12){
 const term=norm(query);
 if(!term)return providerDirectory.slice(0,limit);
 return providerDirectory.map((p,rank)=>{
  const words=[p.name,...p.aliases].map(norm);
  const score=words.some(s=>s===term)?0:words.some(s=>s.startsWith(term))?1:words.some(s=>s.split(' ').some(w=>w.startsWith(term)))?2:words.some(s=>s.includes(term))?3:99;
  return {p,score,rank};
 }).filter(x=>x.score<99).sort((a,b)=>a.score-b.score||a.rank-b.rank).slice(0,limit).map(x=>x.p);
}
/** Only exact name/known alias may change the suggested provider type. */
export function providerExact(name){
 const target=norm(name);
 return target?providerDirectory.find(p=>norm(p.name)===target||p.aliases.some(a=>norm(a)===target))||null:null;
}
const ACCOUNT_PRESETS={
 broker:[
  ['Wertpapierdepot','securities'],['Verrechnungskonto','checking'],
  ['Kryptobörsenkonto','exchange'],['Guthabenkonto','savings']
 ],
 bank:[
  ['Girokonto','checking'],['Tagesgeldkonto','savings'],['Sparkonto','savings'],
  ['Wertpapierdepot','securities'],['Verrechnungskonto','checking']
 ],
 wallet:[
  ['Krypto-Wallet','wallet'],['Bitcoin-Wallet','wallet'],['Ethereum-Wallet','wallet'],
  ['Staking-Wallet','wallet']
 ],
 other:[['Depot','securities'],['Guthabenkonto','savings'],['Wallet','wallet'],['Standardkonto','other']]
};
export function accountSuggestions(providerType='other',term=''){
 const candidates=ACCOUNT_PRESETS[providerType]||ACCOUNT_PRESETS.other;
 const q=norm(term);
 return candidates.filter(([name])=>!q||norm(name).includes(q));
}
export function accountExact(name,providerType='other'){
 const q=norm(name);
 return q?(accountSuggestions(providerType).find(([n])=>norm(n)===q)||null):null;
}
export function suggestedAccountForProvider(providerType='other'){
 return (ACCOUNT_PRESETS[providerType]||ACCOUNT_PRESETS.other)[0];
}
/** Exact, unambiguous ID selection; never create or map a provider by substring. */
export function findOwnedProvider(query,providers){
 const q=norm(query);if(!q)return null;
 return (providers||[]).find(p=>norm(p.name)===q)||null;
}
