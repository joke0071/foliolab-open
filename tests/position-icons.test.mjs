import test from 'node:test';
import assert from 'node:assert/strict';
import {POSITION_ICON_PATHS,positionIconName} from '../src/position-icons.js';
import {svg} from '../src/format.js';

test('one distinctive class icon per supported position kind',()=>{
  const kinds={etf:'asset-etf',stock:'asset-stock',fund:'asset-fund',crypto:'asset-crypto',cash:'asset-cash',other:'asset-other'};
  for(const [kind,name] of Object.entries(kinds)){
    assert.equal(positionIconName({kind}),name);
    assert.ok(POSITION_ICON_PATHS[name]);
  }
  assert.equal(new Set(Object.values(kinds)).size,6);
});

test('fixed deposits only use explicit account contract data',()=>{
  const cash={kind:'cash',name:'Tagesgeld und Festgeld'};
  assert.equal(positionIconName(cash,{cashTerms:{fixedTerm:true}}),'asset-fixed');
  for(const account of [undefined,{}, {type:'savings'}, {cashTerms:{fixedTerm:false}}, {cashTerms:{}}]){
    assert.equal(positionIconName(cash,account),'asset-cash');
  }
  assert.equal(positionIconName({kind:'etf'}, {cashTerms:{fixedTerm:true}}),'asset-etf');
});

test('wallet, staking and asset display names never replace asset class',()=>{
  const crypto={kind:'crypto',wallet:{enabled:true},economicRole:'liquid-staking',name:'Savings ETF'};
  assert.equal(positionIconName(crypto),'asset-crypto');
  assert.equal(positionIconName({kind:'crypto',wallet:{enabled:false}}),'asset-crypto');
  assert.equal(positionIconName({kind:'unexpected',name:'Bitcoin'}),'asset-other');
  assert.equal(positionIconName(null),'asset-other');
});

test('all asset symbols reuse accessible decorative SVG system and stroke',()=>{
  for(const name of Object.keys(POSITION_ICON_PATHS)){
    const markup=svg(name,21);
    assert.match(markup,/^<svg aria-hidden="true"/);
    assert.match(markup,/stroke="currentColor" stroke-width="1.8"/);
    assert.match(markup,/width="21" height="21"/);
    assert.ok(markup.includes(POSITION_ICON_PATHS[name]));
  }
});
