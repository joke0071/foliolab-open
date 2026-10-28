// Synthetic declarations only, not a real user wallet or an observed request/balance.
export function sonicObservation(){
 const sfc='0xfc00face00000000000000000000000000000000',constants='0x'+'c'.repeat(40),hash='0x'+'1'.repeat(64);
 const at=contract=>({contract,atBlockHash:hash});
 return {chainId:'146',contract:sfc,block:{number:'123',hash,timestamp:'109'},
  source:{...at(sfc),implementation:'0xf46ab7507088cc9d3f58bb85ae2c36c86103447d',runtimeSHA256:'4dedff7aee0b55c1764a6885d24443e52358583b06aa81cf78673aeae7374290',constantsAddress:constants},
  request:{...at(sfc),owner:'0x'+'a'.repeat(40),validatorId:'1',requestId:'0',amountAtomic:'9007199254740993',epoch:'10',time:'100'},
  validator:{...at(sfc),validatorId:'1',deactivatedTime:'0',deactivatedEpoch:'0'},
  periods:{...at(constants),seconds:'10',epochs:'2'},epoch:{...at(sfc),value:'11'}};
}
