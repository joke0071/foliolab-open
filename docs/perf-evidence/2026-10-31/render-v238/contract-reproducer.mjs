import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const beforeRoot=process.env.PERF_BASELINE_ROOT,afterRoot=process.env.PERF_CANDIDATE_ROOT;
if(!beforeRoot||!afterRoot||!process.env.PERF_FIXTURE_FILE)throw Error('Set PERF_BASELINE_ROOT, PERF_CANDIDATE_ROOT and PERF_FIXTURE_FILE.');
const {money:beforeMoney,quant:beforeQuant}=await import(pathToFileURL(beforeRoot+'/src/model.js'));
const {money:afterMoney,quant:afterQuant}=await import(pathToFileURL(afterRoot+'/src/model.js'));
const {projectHistoricalPortfolio:beforeProjection}=await import(pathToFileURL(beforeRoot+'/src/historical-portfolio-value.js'));
const {projectHistoricalPortfolio:afterProjection}=await import(pathToFileURL(afterRoot+'/src/historical-portfolio-value.js'));
const fixture=readFileSync(process.env.PERF_FIXTURE_FILE),m=JSON.parse(fixture),dates=['2020-12-31','2021-01-01','2024-12-31','2025-01-01','2025-01-02','2026-12-31'];
let cases=0;
for(const currency of ['EUR','USD','CHF','JPY','GBP','CAD','AUD','NZD','SEK','NOK','DKK','PLN','CZK','HUF','CNY','INR','TRY','BRL','ZAR','XYZ'])for(const n of [-0,0,-1,1,0.000000001,-0.000000001,1.005,-1.005,123456789.12345678,Number.MAX_SAFE_INTEGER,NaN,Infinity,-Infinity,'123.45',undefined,null]){assert.equal(afterMoney(n,currency),beforeMoney(n,currency));cases++;}
for(const n of [-0,0,'0.000000000000000001',123456789.12345678,-1e-10,Number.MAX_SAFE_INTEGER,NaN,Infinity,-Infinity,undefined,null]){assert.equal(afterQuant(n),beforeQuant(n));cases++;}
const projections=[];
for(const variant of ['clean','past-clearing','future-clearing','multiple-clearing','excluded']){
 const data=structuredClone(m);if(variant!=='clean'&&variant!=='excluded'){data.journalEntries[0].status='unresolved-clearing';data.journalEntries[0].date=variant==='future-clearing'?'2027-01-01':'2024-12-31';if(variant==='multiple-clearing')data.journalEntries[1].status='unresolved-clearing';}if(variant==='excluded')data.positions[0].valuationMode='excluded';
 const original=JSON.stringify(data),before=beforeProjection(data,{dates}),after=afterProjection(data,{dates});assert.deepEqual(after,before,variant);assert.equal(JSON.stringify(data),original,'no projection mutation');projections.push(variant);
}
const report={result:'PASS',scope:'isolated prototype only; no production release',formatCases:cases,projectionScenarios:projections,fixtureSHA256:createHash('sha256').update(fixture).digest('hex'),fixtureBytes:fixture.length,financialProjectionExactlyEqual:true,fixtureUnchanged:true};writeFileSync(process.env.PERF_CONTRACT_OUTPUT||'formatter-contract.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
