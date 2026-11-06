// Diagnostic of fixed PRE-correction candidate product bytes, not a release gate.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2]||'.'),out=process.argv[3];
for(const [path,expected] of [['src/wallet-identity.js','18df72e535d175a44218c7fe4eb700359c0657b9'],['src/model.js','83aab32967ca4ebb48350d4e04d1a4d4cead6b54']]){
 const bytes=readFileSync(resolve(root,path));assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),expected,'Use the fixed pre-correction product files');
}
const {blankModel,createProvider,createAccount,createPosition,totalExactEUR}=await import(pathToFileURL(resolve(root,'src/model.js')));
const {duplicateWalletHoldings}=await import(pathToFileURL(resolve(root,'src/wallet-identity.js')));
const m=blankModel();m.providers.push(createProvider({id:'p',name:'Synthetic'}));
for(const id of ['a','b'])m.accounts.push(createAccount({id,providerId:'p',name:id,type:'wallet'},m));
const p={kind:'crypto',providerId:'p',name:'Synthetic ETH',symbol:'ETH',quantity:1,price:100,wallet:{enabled:true,chain:'evm',chainId:1,address:'0x'+'a'.repeat(40)}};
m.positions.push(createPosition({...p,id:'first',accountId:'a'},m));const before=totalExactEUR(m);
m.positions.push(createPosition({...p,id:'second',accountId:'b',wallet:{...p.wallet,contract:'unused-native-field'}},m));
assert.equal(before,'100');assert.equal(totalExactEUR(m),'200');assert.equal(duplicateWalletHoldings(m).length,0);
const report={result:'REPRODUCED',finding:'H3 unused native metadata bypass',sourceHead:'f761a8ccaf4fde0d5cc63e211fde2a76bc51c212',walletKeyGitBlob:'18df72e535d175a44218c7fe4eb700359c0657b9',scope:'Fully synthetic; fixed pre-correction product bytes, no original or release acceptance',expectedSingleHoldingEUR:before,actualTotalEUR:totalExactEUR(m),countedWallets:m.positions.length,detectedGroups:duplicateWalletHoldings(m).length};
if(out)writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
