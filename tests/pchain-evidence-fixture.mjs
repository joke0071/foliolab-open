// Entirely synthetic wire fixture. Fixed checksum independently calculated with Python hashlib.
export const OWNER_A='aa'.repeat(20),OWNER_B='bb'.repeat(20);
export const PCHAIN_UTXO='0x0000111111111111111111111111111111111111111111111111111111111111111100000003222222222222222222222222222222222222222222222222222222222222222200000007002000000000000100000000000000640000000100000001aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa84ce9037';
export const PCHAIN_EXPECTED=Object.freeze({transactionId:'11'.repeat(32),outputIndex:3,assetId:'22'.repeat(32),amountAtomic:'9007199254740993',locktime:'100',stakeableLocktime:null,threshold:1,ownerIds:[OWNER_A]});
