import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {connect} from 'node:net';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {_android as android} from 'playwright';

const output='artifacts/ime216/'+(process.env.DIALOG_CASE || 'combined');
mkdirSync(output,{recursive:true});
const [device]=await android.devices();
assert.ok(device,'Android emulator must be visible over ADB');
const adb=(...args)=>execFileSync('adb',['-s',device.serial(),...args]);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const methodState=()=>adb('shell','dumpsys','input_method').toString();
const windowState=()=>adb('shell','dumpsys','window').toString();
function shown(){
 const match=methodState().match(/^\s*mInputShown=(true|false)\s*$/m);
 const visible=/\btype=ime\b[^\n]*\bvisible=true\b/i.test(windowState());
 if(!match||(match[1]==='true')!==visible)return null;
 return visible;
}
async function waitKeyboard(expected){
 for(let i=0;i<25;i++){if(shown()===expected)return;await wait(250);}
 throw Error('Android IME visibility did not reach '+expected);
}
function captureDeviceState(){
 writeFileSync(output+'/device.png',adb('exec-out','screencap','-p'));
 writeFileSync(output+'/ime-state.txt',methodState().split('\n').filter(line=>/mInputShown|mIsInputViewShown|mCurFocusedWindow|mServedView|mCurMethodId|mShowRequested|mInputEditorInfo|mWindowVisible|mIsInteractive|mInputViewShown/i.test(line)).join('\n'));
 writeFileSync(output+'/window-state.txt',windowState().split('\n').filter(line=>/mCurrentFocus|mFocusedApp|type=ime |imeVisible/i.test(line)).join('\n'));
}
function chromeNodes(){
 adb('shell','uiautomator','dump','/sdcard/folio-qa-window.xml');
 const xml=adb('exec-out','cat','/sdcard/folio-qa-window.xml');writeFileSync(output+'/window.xml',xml);
 return JSON.parse(execFileSync('python3',['-c',`import sys,json,xml.etree.ElementTree as E; print(json.dumps([n.attrib for n in E.fromstring(sys.stdin.buffer.read()).iter('node') if n.get('package')=='com.android.chrome']))`],{input:xml}).toString());
}
async function nativeFieldTap(page,field){
 await field.scrollIntoViewIfNeeded();
 let nodes=chromeNodes();
 if(nodes.some(n=>n.text==='Chrome notifications make things easier')){
  const decline=nodes.find(n=>n['resource-id']==='com.android.chrome:id/negative_button'&&n.text==='No thanks');
  assert.ok(decline,'Expected explicit notification dismissal');
  const [l,t,r,b]=decline.bounds.match(/-?\d+/g).map(Number);adb('shell','input','tap',String(Math.round((l+r)/2)),String(Math.round((t+b)/2)));
  nodes=chromeNodes();
 }
 const view=nodes.find(n=>n.class==='android.webkit.WebView')??nodes.find(n=>n['resource-id']==='com.android.chrome:id/compositor_view_holder');
 assert.ok(view,'Chrome content area must be visible in the Android foreground');
 const [left,top,right,bottom]=view.bounds.match(/-?\d+/g).map(Number);
 const point=await field.evaluate(el=>{const r=el.getBoundingClientRect(),v=visualViewport;return {x:r.left+r.width/2-v.offsetLeft,y:r.top+r.height/2-v.offsetTop,width:v.width,height:v.height};});
 const scale=(right-left)/point.width;
 // The compositor holder starts behind Chrome’s address bar. Anchor the visual viewport at its bottom.
 const contentTop=Math.max(top,bottom-point.height*scale);
 const x=Math.round(left+point.x*scale),y=Math.round(contentTop+point.y*scale);
 console.log('Native input tap',JSON.stringify({bounds:view.bounds,point,scale,x,y}));
 adb('shell','input','tap',String(x),String(y));
 const id=await field.getAttribute('id');await page.waitForFunction(id=>document.activeElement?.id===id,id,{timeout:3500});
}
const release = {
 main: '321d33e8ce45511e7611a7f33607b79ce0fc3af1',
 origin: 'https://foliolab.unperfekt.at/',
 indexSha256: 'bc409d059b73d5b77bf06eb99c88619f024779b200531028246ca46e71c161c0',
 workerSha256: '55ffc7fa3bb8ac146cf0faa86c32e76e4fedd659a5b3cd834fa97ac30a39b82f',
};
const report={target:release.main,probe:process.env.GITHUB_SHA,platform:'Android SDK emulator, x86_64',physical:false,android:adb('shell','getprop','ro.build.version.release').toString().trim(),ime:adb('shell','settings','get','secure','default_input_method').toString().trim(),scenarios:[]};
// The hosted emulator could not resolve the production hostname. Carry only
// its TLS stream over ADB; Chrome verifies the production certificate itself.
const host = new URL(release.origin).hostname;
const tunnel = createServer((req,res)=>res.writeHead(403).end());
tunnel.on('connect',(req,client,head)=>{
 if(req.url!==host+':443'){client.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
 const upstream=connect(443,host,()=>{
  client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
  if(head.length)upstream.write(head);
  client.pipe(upstream).pipe(client);
 });
 client.on('error',()=>upstream.destroy());client.on('close',()=>upstream.destroy());
 upstream.on('error',()=>client.destroy());upstream.on('close',()=>client.destroy());
});
await new Promise((resolve,reject)=>{tunnel.once('error',reject);tunnel.listen(0,'127.0.0.1',resolve);});
tunnel.unref();
const port=tunnel.address().port;
adb('reverse','tcp:'+port,'tcp:'+port);
report.transport='Production HTTPS via fixed-origin CONNECT over ADB; regular Chrome TLS verification';
const ctx=await device.launchBrowser({pkg:'com.android.chrome',viewport:null,hasTouch:true,timeout:45000,proxy:{server:'http://127.0.0.1:'+port}});
try{
 const page=await ctx.newPage();await page.bringToFront();page.setDefaultTimeout(12000);
 const navigation = await page.goto(release.origin, {waitUntil:'domcontentloaded'});
 assert.equal(navigation?.status(), 200);
 assert.equal(page.url(), release.origin);
 const indexSha256 = createHash('sha256').update(await navigation.body()).digest('hex');
 assert.equal(indexSha256, release.indexSha256, 'Unexpected production HTML');
 const workerSha256 = await page.evaluate(async () => {
  const response = await fetch('/sw.js', {cache:'no-store'});
  if (!response.ok) throw new Error('Service worker HTTP ' + response.status);
  const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
 });
 assert.equal(workerSha256, release.workerSha256, 'Unexpected production service worker');
 report.deployment = {origin:page.url(), indexSha256, workerSha256};
 const ready=()=>page.waitForFunction(()=>document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'),undefined,{timeout:45000});
 await ready();
 report.browser=await page.evaluate(()=>navigator.userAgent);
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createPosition}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const model=blankModel();model.settings.autoRefresh=false;model.providers.push(createProvider({id:'provider',name:'Synthetic IME fixture'}));
  model.positions.push(createPosition({id:'cash',providerId:'provider',name:'Synthetic cash',kind:'cash',quantity:10,price:1},model));
  const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();
 });
 await page.reload({waitUntil:'commit'});await ready();
 const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const original=await read();await page.locator('#mobileNav [data-page="positions"]').tap();
 for(const spec of [{name:'asset',opener:'#addWizard',field:'#wizardName',action:'#wizardPrev',dialog:'#wizardDialog'},{name:'wallet',opener:'#addWallet',field:'#scanAddress',action:'#cancelDialog',dialog:'#editDialog'}].filter(s=>!process.env.DIALOG_CASE||s.name===process.env.DIALOG_CASE)){
  await page.locator(spec.opener).tap();await waitKeyboard(false);
  const closedHeight=await page.evaluate(()=>visualViewport.height);
  const field=page.locator(spec.field);await nativeFieldTap(page,field);await waitKeyboard(true);
  const draft=spec.name==='wallet'?'0x'+'a'.repeat(40):'SyntheticAndroidDraft'.repeat(3);
  adb('shell','input','text',draft);assert.equal(await field.inputValue(),draft);
  const row=await page.evaluate(({field,action})=>{
   const view=visualViewport;
   function measure(selector){const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,visible:r.top>=view.offsetTop-1&&r.bottom<=view.offsetTop+view.height+1};}
   return {width:innerWidth,height:view.height,offset:view.offsetTop,field:measure(field),action:measure(action),focus:document.activeElement.id,overflow:document.documentElement.scrollWidth>innerWidth+1};
  },spec);
  assert.equal(row.focus,spec.field.slice(1));
  Object.assign(row,{dialog:spec.name,closedHeight,keyboardShown:shown()});report.scenarios.push(row);
  writeFileSync(output+'/'+spec.name+'-ime.png',adb('exec-out','screencap','-p'));
  adb('shell','input','keyevent','4');await waitKeyboard(false);assert.equal(await field.inputValue(),draft);
  page.once('dialog',dialog=>dialog.accept());await page.locator(spec.action).tap();await page.locator(spec.dialog).waitFor({state:'hidden'});
  assert.deepEqual(await read(),original);row.cancelledWithoutMutation=true;
 }
 assert.equal(report.scenarios.length,process.env.DIALOG_CASE?1:2);
 for(const r of report.scenarios){assert.ok(r.keyboardShown&&r.height<r.closedHeight-80,'keyboard must occupy screen');assert.ok(!r.overflow&&r.field.visible,'focused entry must remain on screen');assert.ok(r.action.visible,'footer action must remain visible with the IME open');}
 report.result='PASS';
}catch(error){
 report.failure=String(error);console.error(report.failure);
 try{captureDeviceState();}catch(diagnostic){console.error('Device diagnostics unavailable:',diagnostic.message.split('\n')[0]);}
 throw error;
}finally{
 writeFileSync(output+'/report.json',JSON.stringify(report,null,2)+'\n');
 await ctx.close();adb('reverse','--remove','tcp:'+port);tunnel.close();await device.close();
}
