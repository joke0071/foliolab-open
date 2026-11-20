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
const shown=()=>/\bmInputShown=true\b|\bisInputViewShown=true\b/.test(adb('shell','dumpsys','input_method').toString());
async function waitKeyboard(expected){
 for(let i=0;i<25;i++){if(shown()===expected)return;await wait(250);}
 throw Error('Android IME visibility did not reach '+expected);
}
const report={target:process.env.GITHUB_SHA,platform:'Android SDK emulator, x86_64',physical:false,android:adb('shell','getprop','ro.build.version.release').toString().trim(),ime:adb('shell','settings','get','secure','default_input_method').toString().trim(),scenarios:[]};
const ctx=await device.launchBrowser({pkg:'com.android.chrome',viewport:null,timeout:45000});
try{
 const page=await ctx.newPage();page.setDefaultTimeout(12000);
 await page.goto('http://127.0.0.1:4173/');
 const ready=()=>page.waitForFunction(()=>document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 await ready();
 report.browser=await page.evaluate(()=>navigator.userAgent);
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createPosition}=await import('/src/model.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const model=blankModel();model.settings.autoRefresh=false;model.providers.push(createProvider({id:'provider',name:'Synthetic IME fixture'}));
  model.positions.push(createPosition({id:'cash',providerId:'provider',name:'Synthetic cash',kind:'cash',quantity:10,price:1},model));
  const s=new PortfolioStorage();await s.initialize();await s.save(model);s.close();
 });
 await page.reload();await ready();
 const read=()=>page.evaluate(async()=>{const {openPortfolioDB,readUnverifiedRecord}=await import('/src/atomic-storage.js');const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}});
 const original=await read();await page.locator('#mobileNav [data-page="positions"]').tap();
 for(const spec of [{name:'asset',opener:'#addWizard',field:'#wizardName',action:'#wizardPrev',dialog:'#wizardDialog'},{name:'wallet',opener:'#addWallet',field:'#scanAddress',action:'#cancelDialog',dialog:'#editDialog'}]){
  await page.locator(spec.opener).tap();await waitKeyboard(false);
  const closedHeight=await page.evaluate(()=>visualViewport.height);
  const field=page.locator(spec.field);await field.tap();await waitKeyboard(true);
  const draft=spec.name==='wallet'?'0x'+'a'.repeat(40):'SyntheticAndroidDraft'.repeat(3);
  adb('shell','input','text',draft);assert.equal(await field.inputValue(),draft);
  const row=await page.evaluate(({field,action})=>{
   const view=visualViewport;
   function measure(selector){const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,visible:r.top>=view.offsetTop-1&&r.bottom<=view.offsetTop+view.height+1};}
   return {width:innerWidth,height:view.height,offset:view.offsetTop,field:measure(field),action:measure(action),focus:document.activeElement.id,overflow:document.documentElement.scrollWidth>innerWidth+1};
  },spec);
  Object.assign(row,{dialog:spec.name,closedHeight,keyboardShown:shown()});report.scenarios.push(row);
  writeFileSync(output+'/'+spec.name+'-ime.png',adb('exec-out','screencap','-p'));
  adb('shell','input','keyevent','4');await waitKeyboard(false);assert.equal(await field.inputValue(),draft);
  page.once('dialog',dialog=>dialog.accept());await page.locator(spec.action).tap();await page.locator(spec.dialog).waitFor({state:'hidden'});
  assert.deepEqual(await read(),original);row.cancelledWithoutMutation=true;
 }
 for(const r of report.scenarios){assert.ok(r.keyboardShown&&r.height<r.closedHeight-80,'keyboard must occupy screen');assert.ok(!r.overflow&&r.field.visible,'focused entry must remain on screen');assert.ok(r.action.visible,'footer action must remain visible with the IME open');}
 report.result='PASS';
}finally{
 writeFileSync(output+'/report.json',JSON.stringify(report,null,2)+'\n');
 await ctx.close();await device.close();
}
