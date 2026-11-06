/** Concrete holdings, not ticker aliases. Non-EVM identifiers retain their case. */
export function normalizeWalletIdentifier(value,chain){
 const text=String(value??'').trim();
 return ['evm','erc20','sonic-stake'].includes(chain)?text.toLowerCase():text;
}
export function walletHoldingKey(wallet){
 if(!wallet?.enabled)return null;
 // Match the actual balance readers: native balances ignore contract metadata.
 // Token and validator/stake readers use that field as a concrete identifier.
 const contract=['erc20','spl','sol-stake','sonic-stake','cosmos-stake','cosmos-unbonding','xrp-token'].includes(wallet.chain)?wallet.contract:'';
 return JSON.stringify([wallet.chain,['evm','erc20'].includes(wallet.chain)?Number(wallet.chainId||1):null,
  normalizeWalletIdentifier(wallet.address,wallet.chain),normalizeWalletIdentifier(contract,wallet.chain)]);
}
export function assertWalletHoldingAvailable(model,candidate){
 const key=walletHoldingKey(candidate.wallet);if(!key)return;
 const current=model.positions?.find(p=>p.id===candidate.id);
 if(current&&walletHoldingKey(current.wallet)===key&&(current.valuationMode||'included')===(candidate.valuationMode||'included'))return;
 const matches=(model.positions||[]).filter(p=>p.id!==candidate.id&&walletHoldingKey(p.wallet)===key&&p.valuationMode!=='excluded');
 if(!matches.length)return;
 if(candidate.valuationMode==='excluded'&&matches.some(p=>p.id===candidate.representedByPositionId))return;
 throw Error('Diese konkrete Walletposition wird bereits in einem Konto erfasst. Bestehende Position verwenden; Historien werden nicht automatisch zusammengeführt.');
}
/** Read-only review for pre-existing duplicates; never changes holdings or history. */
export function duplicateWalletHoldings(model){
 const groups=new Map();for(const p of model.positions||[]){const key=walletHoldingKey(p.wallet);if(!key||p.valuationMode==='excluded')continue;const list=groups.get(key)||[];list.push(p);groups.set(key,list);}
 return [...groups.values()].filter(list=>list.length>1);
}
