/**
 * Wallet scan visibility is a conservative presentation filter, not a security verdict.
 * Hidden assets remain available for a deliberate opt-in; no holdings are discarded.
 * Never trust a ticker alone: known assets are matched by both chain and contract.
 */
const canonicalContracts = {
  1:new Set([
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // Lido stETH
    '0xae78736cd615f374d3085123a210448e74fc6393', // Rocket Pool rETH
    '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', // Lido wstETH
    '0x514910771af9ca656af840dff83e8264ecf986ca', // Chainlink
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    '0x1f9840a85d5af5bf1d1762f925bdadc4201f984'  // UNI
  ]),
  56:new Set([
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
    '0x55d398326f99059ff775485246999027b3197955', // Binance-Peg USDT
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // Binance-Peg USDC
    '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c'  // BTCB
  ]),
  43114:new Set(['0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be']), // BENQI sAVAX
  146:new Set([
    '0xe5da20f15420ad15de0fa650600afc998bbe3955', // Beets stS
    '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38', // wS
    '0x29219dd400f2bf60e5a23d13be72b486d4038894', // USDC
    '0x6047828dc181963ba44974801ff68e538da5eaf9'  // USDT
  ])
};
const suspiciousText = /(?:https?:\/\/|www\.|(?:^|[\s/_.-])(?:airdrop|claim|bonus|free|gift|reward|rewards|voucher|visit|verify|redeem|presale|connectwallet|connect-wallet)(?:$|[\s/_.-])|(?:^|[\s/])(?:[a-z0-9-]+\.(?:com|net|xyz|site|top|io))(?:$|[\s/]))/i;
const dangerousReputation = /^(scam|spam|suspicious|malicious|unsafe|phishing|fake)$/i;

/** Classifies *visibility*, not legitimacy; restores are always possible. */
export function walletTokenVisibility(asset){
  if(['sol-stake','sonic-stake','cosmos-stake','cosmos-unbonding','near-locked'].includes(asset?.chain))return {show:true,reason:''}; // on-chain verified staking
  if(!asset?.contract)return {show:true,reason:''}; // native coins are never suppressed
  const reputation=String(asset.reputation||'').trim();
  if(dangerousReputation.test(reputation))return {show:false,reason:'Vom Explorer als verdächtig markiert'};
  const label=(String(asset.name||'')+' '+String(asset.symbol||'')).normalize('NFKC');
  if(suspiciousText.test(label)||/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/u.test(label))
    return {show:false,reason:'Verdächtiger Tokenname oder Link'};
  const quantity=Number(asset.quantityExact??asset.quantity);
  const price=Number(asset.price);
  if(Number.isFinite(quantity)&&quantity>0&&(
    quantity<1e-6 || (Number.isFinite(price)&&price>0&&quantity*price<0.01)
  ))return {show:false,reason:'Kleinstbetrag (Dust-Token)'};
  if(Number.isFinite(price)&&price>0)return {show:true,reason:''};
  const known=canonicalContracts[Number(asset.chainId)]?.has(String(asset.contract).toLowerCase());
  if(known)return {show:true,reason:''};
  return {show:false,reason:'Unbekanntes Token ohne bestätigten Kurs'};
}
export function partitionWalletAssets(assets){
  const visible=[],hidden=[];
  for(const asset of assets){
    (walletTokenVisibility(asset).show?visible:hidden).push(asset);
  }
  return {visible,hidden};
}
