import test from 'node:test';
import assert from 'node:assert/strict';
import {flatexNativeSimulationMarkup as markup} from '../src/flatex-native-ui.js';
import {prepareNativeFlatexPreview} from '../src/flatex-backfill.js';
import {nativeProjectionFixture as fixture} from './flatex-native-projection-fixture.mjs';
test('simulation view requires an explicit mode and preserves the read-only result contract',()=>{
 const html=markup(null);assert.match(html,/<option value="">Modus auswählen/);assert.match(html,/id="flatexSimulationRun"[^>]*disabled/);assert.doesNotMatch(html,/value="append" selected/);
 for(const mode of ['auto',null,{}])assert.throws(()=>markup(null,{mode}));
 const f=fixture(),r=prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{mode:'append'});
 for(const result of [{...r,ready:true},{...r,writeEnabled:true},{...r,kind:'other'}])assert.throws(()=>markup(result,{mode:'append',model:f.model}));
 assert.throws(()=>markup(r,{mode:'append',model:{...f.model,settings:{}}}));assert.throws(()=>markup(r));
});
test('simulation view shows exact shares, unknown costs and entire-batch blockers without mutating inputs',()=>{
 const f=fixture({quantity:1});f.model.positions[0].name='<svg onload=alert(1)>';
 const r=prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{mode:'backfill'}),before=JSON.stringify([r,f.model]);
 const html=markup(r,{mode:'backfill',model:f.model});assert.match(html,/2 neue Buchungen/);assert.match(html,/1 → 1 Stück/);assert.match(html,/Gebühren, Steuern und Anschaffungskosten bleiben ungeprüft/);assert.match(html,/Keine Übernahme/);assert.doesNotMatch(html,/<svg/);assert.match(html,/&lt;svg/);assert.equal(JSON.stringify([r,f.model]),before);
 const blocked=prepareNativeFlatexPreview(f.model,f.documents,f.assignments,{mode:'append'});assert.match(markup(blocked,{mode:'append',model:f.model}),/Simulation gesperrt/);assert.doesNotMatch(markup(blocked,{mode:'append',model:f.model}),/flatex-simulation-quantity/);
 const hostile={...blocked,reason:'<img src=x>'};assert.doesNotMatch(markup(hostile,{mode:'append'}),/<img/);assert.throws(()=>markup({...blocked,preview:r.preview},{mode:'append'}));
});
