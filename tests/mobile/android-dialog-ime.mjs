import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {_android as android} from 'playwright';

const output='artifacts/ime216';
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
const report={target:process.env.GITHUB_SHA,platform:'Android SDK emulator, x86_64',physical:false,android:adb('shell','getprop','ro.build.version.release').toString().trim(),ime:adb('shell','settings','get','secure','default_input_method').toString().trim(),scenarios:[]};
const ctx=await device.launchBrowser({pkg:'com.android.chrome',viewport:null,hasTouch:true,timeout:45000});
try{
 const page=await ctx.newPage();await page.bringToFront();page.setDefaultTimeout(12000);
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'commit'});
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
 await ctx.close();await device.close();
}
