import test from 'node:test';
import assert from 'node:assert/strict';
import {blankModel,backup} from '../src/model.js';
import {createCompleteBackup,unpackCompleteBackup,portableSettings,portableDrivePreferences,COMPLETE_BACKUP_KIND} from '../src/complete-backup.js';

test('default encrypted backup omits all settings and credentials',()=>{
 const m=blankModel();m.settings.alphaVantageKey='secret-eodhd';m.settings.marketstackKey='secret-fmp';
 const data=JSON.parse(backup(m)),pkg=createCompleteBackup(data);
 assert.equal(pkg.kind,COMPLETE_BACKUP_KIND);
 assert.equal(pkg.configuration,undefined);
 assert.ok(!JSON.stringify(pkg).includes('secret-eodhd'));
 assert.ok(!JSON.stringify(pkg).includes('secret-fmp'));
});
test('opt-in full backup includes the complete user API/RPC configuration and Google OAuth client ID',()=>{
 const m=blankModel();
 m.settings.alphaVantageKey='eodhd-private';
 m.settings.etherscanKey='twelve-private';
 m.settings.marketstackKey='fmp-private';
 m.settings.coinGeckoKey='coingecko-private';
 m.settings.eodhdWorkerAccessToken='worker-secret';
 m.settings.solanaRpc='https://rpc.example.test/?api-key=solana-private';
 m.settings.autoRefresh=false;
 const payload=createCompleteBackup(JSON.parse(backup(m)),{
  settings:m.settings,
  drive:{clientId:'12345-abc.apps.googleusercontent.com',mode:'weekly',retention:5,
    access_token:'must-never-include',refresh_token:'never',folderId:'device-specific'}
 });
 const recovered=unpackCompleteBackup(payload);
 for(const key of ['alphaVantageKey','etherscanKey','marketstackKey','coinGeckoKey','eodhdWorkerAccessToken','solanaRpc','autoRefresh'])
  assert.equal(recovered.configuration.settings[key],m.settings[key]);
 assert.equal(recovered.configuration.drive.clientId,'12345-abc.apps.googleusercontent.com');
 assert.equal(recovered.configuration.drive.mode,'weekly');
 assert.equal(recovered.configuration.drive.retention,5);
 assert.ok(!JSON.stringify(payload).includes('must-never-include'));
 assert.ok(!JSON.stringify(payload).includes('never'));
 assert.ok(!JSON.stringify(payload).includes('device-specific'));
});
test('untrusted configuration is strictly whitelisted, data must use supported schema',()=>{
 const m=blankModel(),data=JSON.parse(backup(m));
 assert.throws(()=>createCompleteBackup(data,{settings:{alphaVantageKey:15},drive:{}}),/Einstellung/);
 assert.throws(()=>createCompleteBackup(data,{settings:m.settings,drive:{clientId:'invalid',mode:'off'}}),/OAuth/);
 assert.throws(()=>createCompleteBackup(data,{settings:m.settings,drive:{retention:999}}),/Aufbewahrung/);
 assert.throws(()=>unpackCompleteBackup({kind:COMPLETE_BACKUP_KIND,backupVersion:2,data}),/Backupformat/);
 assert.throws(()=>unpackCompleteBackup({kind:COMPLETE_BACKUP_KIND,backupVersion:1,data,configuration:{settings:{alphaVantageKey:{bad:true}},drive:{}}}),/Einstellung/);
 assert.equal(portableSettings({...m.settings,__proto__:null}).currency,'EUR');
 assert.equal(portableDrivePreferences({mode:'off',retention:3}).mode,'off');
});
