import test from 'node:test';
import assert from 'node:assert/strict';
import {invalidateUnverifiedFlatexBasis} from '../src/flatex-cost-basis.js';

test('unverified broker charges invalidate only affected simulated cost basis and P&L',()=>{
 const model={positions:[
  {id:'flatex',costBasisExact:'150',costBasisEUR:150,realizedPnLExact:'15',realizedPnLEUR:15},
  {id:'other',costBasisExact:'900',costBasisEUR:900,realizedPnLExact:'0',realizedPnLEUR:0}
 ]};
 const preview={rows:[{status:'ready',row:{positionId:'flatex'}},{status:'duplicate',row:{positionId:'other'}}],simulated:structuredClone(model)};
 const original=JSON.stringify(model);
 invalidateUnverifiedFlatexBasis(preview);
 assert.equal(preview.simulated.positions[0].costBasisExact,null);
 assert.equal(preview.simulated.positions[0].realizedPnLEUR,null);
 assert.equal(preview.simulated.positions[1].costBasisExact,'900');
 assert.equal(JSON.stringify(model),original);
});
test('duplicate-only Flatex import never rewrites existing previously verified basis',()=>{
 const model={positions:[{id:'one',costBasisExact:'123',costBasisEUR:123}]};
 const preview={rows:[{status:'duplicate',row:{positionId:'one'}}],simulated:structuredClone(model)};
 invalidateUnverifiedFlatexBasis(preview);
 assert.deepEqual(preview.simulated,model);
});
test('bad preview structure is refused rather than silently treated as valid',()=>{
 assert.throws(()=>invalidateUnverifiedFlatexBasis(null),/Vorschau fehlt/);
});
