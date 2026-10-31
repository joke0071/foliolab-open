import test from 'node:test';
import assert from 'node:assert/strict';
import {storagePresentation,drivePresentation} from '../src/header-status.js';
test('local status never claims success while checking, pending, failed or conflicted',()=>{
 for(const input of [{checking:true},{saving:true},{error:'quota'},{conflict:true}])assert.notEqual(storagePresentation(input).state,'saved');
 assert.equal(storagePresentation({saving:true,error:'old'}).state,'saving');
 assert.equal(storagePresentation({conflict:true,saving:true}).state,'conflict');
 assert.match(storagePresentation({indexedDB:false}).label,/bisherigen Browser/);
 assert.match(storagePresentation().label,/IndexedDB/);
});
test('Drive setup, auth and backup state remain separate from local storage and from each other',()=>{
 const setup={configured:true,vaultConfigured:true};
 assert.equal(drivePresentation().state,'setup');
 assert.equal(drivePresentation(setup).state,'auth');
 assert.equal(drivePresentation({...setup,connected:true,due:true}).state,'due');
 assert.equal(drivePresentation({...setup,connected:true}).state,'connected');
 assert.match(drivePresentation({...setup,connected:true}).label,/keine erfolgreiche Sicherung/);
 assert.equal(drivePresentation({...setup,busy:true,connecting:true}).state,'busy');
 assert.equal(drivePresentation({...setup,offline:true}).state,'offline');
 assert.equal(drivePresentation({...setup,error:true,message:'Upload unbestätigt'}).state,'error');
 assert.notEqual(drivePresentation({...setup,lastBackupAt:'2026-10-31T08:00:00Z'}).state,'connected','old successful backup is not current OAuth authorization');
});
