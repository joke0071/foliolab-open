import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const root='/workspace/scratch/87dc5aed8b2a/foliolab-perf',baseline='/workspace/scratch/87dc5aed8b2a/foliolab-open';
const model=await import(root+'/src/model.js'),{validateHistorySession}=await import(root+'/src/wallet-history-state.js'),{event,stream}=await import(root+'/tests/wallet-history-fixtures.mjs');
const {projectHistoricalPortfolio:before}=await import(baseline+'/src/historical-portfolio-value.js'),{projectHistoricalPortfolio:after}=await import(root+'/src/historical-portfolio-value.js');
const text=fs.readFileSync(baseline+'/tests/flh02-integration.test.mjs','utf8'),fixtureSource=text.slice(text.indexOf('export function walletFixture()')+7,text.indexOf("\ntest('stored BTC"));
const fixture=new Function('blankModel','createProvider','createAccount','createPosition','validateHistorySession','event','stream',fixtureSource+';return walletFixture;')(model.blankModel,model.createProvider,model.createAccount,model.createPosition,validateHistorySession,event,stream);
const digest=createHash('sha256');let cases=0;
for(let n=0;n<240;n++){
 const m=fixture();for(let j=0;j<n%4;j++){
  const alias={...structuredClone(m.positions[0]),id:'alias-'+j,valuationMode:(n+j)%3?'included':'excluded',representedByPositionId:(n+j)%7?'btc':'missing'};
  if((n+j)%11===0)alias.wallet.chain='sol';if((n+j)%13===0)alias.wallet.chainId='different-chain';
  if((n+j)%5===0){if(!m.accounts.some(a=>a.id==='b'))m.accounts.push(model.createAccount({id:'b',providerId:'provider',name:'Synthetic B',type:'wallet'},m));alias.accountId='b';}
  m.positions.push(alias);if((n+j)%2){const s=structuredClone(m.walletHistory.sessions[0]);s.id='session-'+j;s.walletKey=alias.id;s.events[1].quantityBaseUnits=String((1+(n+j)%3)*100000000);m.walletHistory.sessions.push(s);}
 }
 if(n%6===0)m.walletHistory.sessions[0].streams[0].coverage.status='partial';
 if(n%7===0){const p=model.createPosition({id:'cash',providerId:'provider',accountId:'a',name:'Synthetic cash',kind:'cash',quantity:n%2,price:1},m);p.valuationMode='excluded';p.representedByPositionId='missing';m.positions.push(p);m.openingPositions.push({positionId:'cash',quantityExact:String(n%2),asOf:'2023-01-02'});}
 m.snapshots=[{id:'one',date:'2023-01-02',total:11,totalEURExact:'11',note:'Synthetic'},{id:'two',date:'2023-01-03',total:25,totalEURExact:'25',note:'Synthetic'}];
 const original=JSON.stringify(m),options={dates:['2023-01-04','2023-01-01','2023-01-03','2023-01-02']};
 const a=JSON.stringify(before(m,options));assert.equal(JSON.stringify(m),original);const b=JSON.stringify(after(m,options));assert.equal(JSON.stringify(m),original);assert.equal(b,a,'Full dated projection mismatch '+n);digest.update(a);cases++;
}
const proof={status:'PASS',cases,baseline:'621abf1556b0be87d485fd43943cf521dfc965fb',candidate:'403862ed42140c08cf47aaf75daa953b777720e1',scope:'Exact full dated projection, components, unknowns, overlaps, aliases, chain/account scope, changing dated quantities, known zero, observations and reconciliation; model unchanged before/after each call',digest:digest.digest('hex'),syntheticOnly:true};fs.writeFileSync('/tmp/perf246-projection-oracle.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
