export const NOW='2026-10-24T12:00:00.000Z';
export function event(overrides={}){
 return {network:'ethereum',chainId:'1',walletId:'wallet-a',accountId:'a',txid:'tx-1',
  locator:{kind:'log',index:'0',subindex:'0'},blockHeight:'10',blockHash:'block-10',txIndex:'0',
  timestamp:NOW,assetId:'token',contract:'contract-a',mint:null,decimals:24,quantityBaseUnits:'1',
  type:'incoming',source:'fixture',status:'confirmed',finality:'finalized',observedAt:NOW,
  coverage:'verified',qualityCode:'complete',...overrides};
}
export function stream(overrides={}){
 return {network:'ethereum',chainId:'1',accountId:'a',assetId:'token',contract:'contract-a',mint:null,decimals:24,
  opening:{quantityBaseUnits:'0',beforeBlock:'0',source:'fixture-genesis'},
  coverage:{status:'verified',fromBlock:'0',toBlock:'10',tipHash:'block-10',source:'fixture'},
  throughBlock:'10',...overrides};
}
