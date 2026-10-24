import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/drive-backup.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');

function fixture({vault=false,clientId='',withGoogle=false,includeConfig=false}={}){
 const values=new Map(),requests=[],written=[];
 if(clientId)values.set('foliolab-open-drive-backup-settings-v1',JSON.stringify({clientId,retention:3,mode:'off'}));
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))};
 const ids=['driveBackupStatus','driveConnect','driveSaveNow','driveRefreshList','driveRestore',
  'driveAutoMode','driveRetention','driveClientId','driveDisconnect','driveBackupSelect','driveRecoveryInput',
  'driveFolderSelect','driveFolderRefresh','driveFolderNewName','driveFolderCreate','driveCheck',
  'driveConnectionBadge','driveBackupOverview','driveFolderCurrentName'];
 const elements=Object.fromEntries(ids.map(id=>[id,{
  id,value:'',textContent:'',disabled:false,options:[],checked:false,style:{},dataset:{},
  classList:{toggle(){},add(){},remove(){}},
  setAttribute(){},addEventListener(){},
  replaceChildren(){this.options=[];this.value=''},
  add(item){this.options.push(item);if(this.options.length===1)this.value=item.value},
  onclick:null,onchange:null
 }]));
 const document={getElementById:id=>elements[id]||null,addEventListener(){},visibilityState:'visible'};
 const window={addEventListener(){},google:withGoogle?{accounts:{oauth2:{
  initTokenClient(){return {callback:null,error_callback:null,requestAccessToken(){
   this.callback?.({access_token:'ephemeral-test-token',expires_in:3600});
  }}}}}}:null};
 const backend={
  hasPasswordVault:async()=>vault,
  readData:()=>({version:3,positions:[{id:'p'}],snapshots:[],providers:[{id:'prov'}],accounts:[]}),
  readBackupConfiguration:()=>includeConfig?{settings:{eodhdKey:'test-private-key'},drive:{clientId,mode:'daily',retention:5}}:null,
  buildCompleteBackup:(data,configuration)=>({kind:'FolioLabCompleteBackup',backupVersion:1,data,configuration}),
  unpackCompleteBackup:payload=>({data:payload.data,configuration:payload.configuration}),
  encryptPasswordBackup:async plain=>{written.push(JSON.parse(plain));return '{"format":"foliolab-open-encrypted-v2","fake":true}'},
  decryptPasswordBackup:async()=>JSON.stringify({kind:'FolioLabCompleteBackup',backupVersion:1,data:{version:3,positions:[],snapshots:[],providers:[],accounts:[]},configuration:null}),
  validateData:data=>data,restoreData:async()=>{},adoptPasswordVault:async()=>{},
  onBackedUp:()=>{}
 };
 let uploaded=false;
 async function fetch(url,opts={}){
  requests.push({url,method:opts.method||'GET',body:opts.body});
  const qs=new URL(url).searchParams,q=qs.get('q')||'';
  if(url.includes('upload/drive/v3/files')){uploaded=true;return response({id:'backup123456789'})}
  if(opts.method==='POST'&&url.includes('/drive/v3/files'))return response({id:'folder123456789',name:'FolioLab Backups'});
  if(url.includes('/drive/v3/files?')&&q.includes('mimeType'))return response({files:[]});
  if(url.includes('/drive/v3/files?')&&q.includes('in parents'))return response({files:uploaded?[{
    id:'backup123456789',name:'FolioLab-2026-10-24T15-00-00-000Z.encrypted.json',
    createdTime:'2026-10-24T15:00:00.000Z'}]:[]});
  return response({files:[]});
 }
 function response(value){return {ok:true,status:200,json:async()=>value,text:async()=>JSON.stringify(value)}}
 runInNewContext(source,{window,document,google:window.google,localStorage:storage,fetch,Option:class{
  constructor(text,value){this.text=text;this.value=value}},
  Date,Math,JSON,URL,URLSearchParams,Blob,Error,Number,setTimeout,clearTimeout,
  confirm:()=>true},{filename:'drive-backup.js'});
 return {window,elements,storage,requests,written,backend};
}

test('Drive remains voluntary and cannot upload without a configured password',async()=>{
 const t=fixture();
 await t.window.FolioDriveBackup.init(t.backend);
 assert.equal(t.elements.driveAutoMode.value,'off');
 assert.equal(t.elements.driveRetention.value,'3');
 assert.equal(t.elements.driveSaveNow.disabled,true);
 assert.equal(t.elements.driveBackupStatus.textContent,'');
 assert.equal(t.elements.driveBackupStatus.hidden,true,'Neutral setup information does not duplicate the connection badge');
 assert.equal(t.elements.driveDisconnect.hidden,true,'Disconnect is hidden until connected');
 assert.equal(t.storage.getItem('foliolab-open-drive-backup-settings-v1'),null);
});
test('Drive upload encrypts only the sanitized portfolio through the shared password backend',async()=>{
 const t=fixture({vault:true,clientId:'123456789-abc.apps.googleusercontent.com',withGoogle:true});
 await t.window.FolioDriveBackup.init(t.backend);
 assert.equal(t.elements.driveConnect.disabled,false);
 await t.elements.driveConnect.onclick();
 assert.equal(t.elements.driveSaveNow.disabled,false,t.elements.driveBackupStatus.textContent);
 assert.equal(t.elements.driveDisconnect.hidden,false,'Disconnect appears after connection');
 await t.elements.driveSaveNow.onclick();
 assert.equal(t.written.length,1);
 assert.equal(t.written[0].kind,'FolioLabCompleteBackup');
 assert.equal(t.written[0].configuration,null);
 assert.ok(t.requests.some(x=>x.url.includes('upload/drive/v3/files')&&x.method==='POST'));
 assert.match(t.elements.driveBackupStatus.textContent,/erfolgreich/);
});
test('only the user-selected OAuth client ID is stored and no access token persists',async()=>{
 const t=fixture();
 await t.window.FolioDriveBackup.init(t.backend);
 t.elements.driveClientId.value='123456789-abc.apps.googleusercontent.com';
 t.elements.driveClientId.onchange();
 const saved=JSON.parse(t.storage.getItem('foliolab-open-drive-backup-settings-v1'));
 assert.equal(saved.clientId,'123456789-abc.apps.googleusercontent.com');
 assert.equal(JSON.stringify(saved).includes('ephemeral-test-token'),false);
 assert.equal(t.elements.driveConnect.disabled,false);
});
test('public UI offers full encrypted backup without any recovery-code workflow',()=>{
 assert.equal((html.match(/id="backupPasswordSetup"/g)||[]).length,1);
 for(const id of ['backupPassword','backupPasswordConfirm','backupOldPassword','saveBackupPassword','driveRecoveryInput','fullBackupIncludeSettings']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 for(const id of ['recoveryKeyDisplay','recoveryKeyReveal','recoveryKeyCopy','recoveryKeyConfirmed']){
  assert.doesNotMatch(html,new RegExp('id="'+id+'"'));
 }
 assert.doesNotMatch(source,/FLBK1|importRecovery|decryptLegacyLocal/);
 assert.match(source,/backend\.decryptPasswordBackup\(envelope,password\)/);
 assert.match(source,/backend\.encryptPasswordBackup\(/);
 assert.match(source,/backend\.adoptPasswordVault\(envelope,password\)/);
 assert.match(app,/configureBackupPassword\(/);
 assert.match(app,/encryptWithBackupPassword\(JSON\.stringify\(fullBackupPayload\(\)\)\)/);
 assert.match(app,/decryptPasswordBackup\(parsed,password\)/);
 assert.doesNotMatch(source,/api\/public-config|client_secret|refresh_token|FolioLabNativeGoogleAuth/);
});

test('the optional full Drive payload includes configuration but no OAuth session token',async()=>{
 const t=fixture({vault:true,clientId:'123456789-abc.apps.googleusercontent.com',withGoogle:true,includeConfig:true});
 await t.window.FolioDriveBackup.init(t.backend);
 await t.elements.driveConnect.onclick();
 await t.elements.driveSaveNow.onclick();
 assert.equal(t.written[0]?.kind,'FolioLabCompleteBackup');
 assert.equal(t.written[0]?.configuration.settings.eodhdKey,'test-private-key');
 assert.equal(t.written[0]?.configuration.drive.mode,'daily');
 assert.ok(!JSON.stringify(t.written).includes('ephemeral-test-token'));
 assert.ok(!String(t.storage.getItem('foliolab-open-drive-backup-settings-v1')).includes('ephemeral-test-token'));
});

test('compact Drive UI preserves all controls but hides help and advanced actions by default',()=>{
 assert.match(html,/class="advanced-apis drive-backup-panel" id="googleDriveBackupSetup"/);
 assert.match(html,/class="drive-setup-help" id="driveOAuthHelp"/);
 assert.match(html,/class="drive-management" id="driveRestoreSection"/);
 assert.match(html,/class="drive-folder-options"/);
 assert.match(html,/class="drive-status-row"/);
 assert.match(html,/class="drive-restore-actions"/);
 assert.match(html,/id="driveDisconnect" hidden/);
 assert.ok(html.includes('Jetzt sichern'));
 assert.equal((html.match(/id="driveConnectionBadge"/g)||[]).length,1);
 for(const item of ['driveClientId','driveConnect','driveDisconnect','driveAutoMode','driveRetention','driveSaveNow','driveBackupSelect','driveCheck','driveRestore','driveFolderSelect']){
  assert.match(html,new RegExp('id="'+item+'"'));
 }
 assert.doesNotMatch(html,/OAuth-Zustimmungsbildschirm konfigurieren\\. 2\\./,'No unstructured wall of instructions');
});
