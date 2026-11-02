import test from 'node:test';
import assert from 'node:assert/strict';
import {bitpandaImpactMarkup} from '../src/bitpanda-import-ui.js';
import {previewBitpandaImport} from '../src/bitpanda-import.js';
import {fixture,source} from './bitpanda-import-fixture.mjs';
test('Bitpanda decision shows exact crypto and cash changes and distinguishes supplied control values from independent evidence',()=>{
 const {m,assignments,options}=fixture();m.positions[0].name='<img src=x onerror=alert(1)>';
 const p=previewBitpandaImport(m,[source()],assignments,options),before=JSON.stringify(m),html=bitpandaImpactMarkup(m,p);
 assert.deepEqual(p.issues,[]);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
 assert.match(html,/<dd>\+3.1<\/dd>/);assert.match(html,/<dd>-101<\/dd>/);assert.match(html,/<dd>99<\/dd>/);
 assert.match(html,/unabhängige Herkunft/);assert.equal(JSON.stringify(m),before);
 assert.equal(bitpandaImpactMarkup(m,null),'');
 const blocked=previewBitpandaImport(m,[source()],assignments,{...options,expectedClosing:{}});
 assert.match(bitpandaImpactMarkup(m,blocked),/keine Übernahmefreigabe/);
});
