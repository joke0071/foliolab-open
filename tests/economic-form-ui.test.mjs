import test from 'node:test';
import assert from 'node:assert/strict';
import {economicFormGuidance} from '../src/economic-form-ui.js';

test('Excluded representation needs explicit positively counted reference',()=>{
 const missing=economicFormGuidance('liquid-staking','excluded','');
 assert.equal(missing.targetRequired,true);
 assert.equal(missing.targetMissing,true);
 assert.equal(missing.warning,true);
 assert.match(missing.message,/bereits angerechnete Position/);
 const valid=economicFormGuidance('liquid-staking','excluded','eth','included');
 assert.equal(valid.targetMissing,false);
 assert.equal(valid.warning,false);
 const unresolved=economicFormGuidance('liquid-staking','excluded','vault','excluded');
 assert.equal(unresolved.warning,true,'Warn if reference is also excluded');
});
test('Liabilities require borrowed role and do not silently rewrite it',()=>{
 const invalid=economicFormGuidance('wrapped','liability','');
 assert.equal(invalid.roleInvalid,true);
 assert.match(invalid.message,/Geliehene Assets/);
 const valid=economicFormGuidance('borrowed','liability','');
 assert.equal(valid.roleInvalid,false);
 assert.equal(valid.targetRequired,false);
 assert.match(valid.message,/abgezogen/);
});
test('Explicit included links warn about potential double count',()=>{
 const unlinked=economicFormGuidance('standard','included','');
 assert.equal(unlinked.message,'');
 assert.equal(unlinked.targetRequired,false);
 const linked=economicFormGuidance('wrapped','included','eth');
 assert.match(linked.message,/Doppelzählung/);
});
