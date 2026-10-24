import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:820}});
try {
 await page.goto('http://127.0.0.1:4173/');
 const id=await page.evaluate(async()=>{
  const {blankModel,persist,createProvider,createAccount,createPosition}=await import('/src/model.js');
  const m=blankModel(),a=createProvider({name:'Aurelia Invest',type:'broker'}),b=createProvider({name:'Flatex',type:'broker'});
  m.providers.push(a,b);
  const ac=createAccount({providerId:a.id,name:'Hauptdepot',type:'securities'},m);
  const bc=createAccount({providerId:b.id,name:'Zweitdepot',type:'securities'},m);
  m.accounts.push(ac,bc);
  const etf=createPosition({kind:'etf',providerId:a.id,accountId:ac.id,name:'Demo-Themen-ETF',symbol:'DEMO',
   isin:'IE00B3RBWM25',exchange:'Xetra',mic:'XETR',eodhdSymbol:'DEMO.DE',quantity:7,price:19.25,currency:'EUR'},m);
  m.positions.push(etf);persist(m);return {etf:etf.id,provider:a.id,account:ac.id,second:b.id};
 });
 await page.reload();
 await page.locator('#mobileNav [data-page="positions"]').click();
 const edit=page.locator('[data-action="edit-position"][data-id="'+id.etf+'"]');
 await edit.click();
 assert.equal(await page.locator('#dialogTitle').innerText(),'Position bearbeiten');
 assert.equal(await page.locator('#saveDialog').innerText(),'Position speichern');
 assert.equal(await page.locator('#positionProvider').inputValue(),id.provider);
 assert.equal(await page.locator('#positionAccount').inputValue(),id.account);
 assert.equal(await page.locator('#positionKind').inputValue(),'etf');
 assert.equal(await page.locator('[name="name"]').inputValue(),'Demo-Themen-ETF');
 assert.equal(await page.locator('[name="symbol"]').inputValue(),'DEMO');
 assert.equal(await page.locator('[name="isin"]').inputValue(),'IE00B3RBWM25');
 assert.equal(await page.locator('[name="quantity"]').inputValue(),'7');
 assert.equal(await page.locator('[name="price"]').inputValue(),'19.25');
 assert.equal(await page.locator('#positionPickerSearch').getAttribute('open'),null);
 assert.equal(await page.locator('#securityGroup').getAttribute('open'),null);
 assert.equal(await page.locator('#positionMarketMore').getAttribute('open'),null);
 assert.equal(await page.locator('#positionWalletMore').isVisible(),false);
 assert.equal(await page.locator('#securityGroup > summary').innerText(),'Wertpapier suchen und zuordnen');
 const sequence=await page.evaluate(()=>{
  const ids=['positionProvider','positionAccount','positionKind','positionCurrency','securityGroup','positionMarketMore'];
  return ids.map(id=>{
   const e=document.getElementById(id);return Array.from(document.querySelectorAll('#dialogFields *')).indexOf(e);
  });
 });
 assert.ok(sequence.every((x,i)=>i===0||x>sequence[i-1]),'Primary fields precede optional search and technical fields: '+sequence);
 await page.locator('#positionPickerSearch > summary').click();
 await page.locator('#positionProviderSearch').fill('Flatex');
 assert.equal(await page.locator('#positionProvider option').count(),1);
 assert.equal(await page.locator('#positionProvider').inputValue(),'','Filtering cannot silently reassign original provider');
 await page.locator('#positionProviderSearch').fill('');
 assert.equal(await page.locator('#positionProvider').inputValue(),id.provider,'Original provider restored after clearing filter');
 await page.locator('#positionPickerSearch > summary').click();
 await page.locator('#securityGroup > summary').click();
 assert.equal(await page.locator('#securityQuery').isVisible(),true);
 await page.locator('#securityGroup > summary').click();
 await page.locator('#positionMarketMore > summary').click();
 assert.equal(await page.locator('[name="exchange"]').inputValue(),'Xetra');
 assert.equal(await page.locator('[name="eodhdSymbol"]').inputValue(),'DEMO.DE');
 await page.locator('#positionMarketMore > summary').click();
 const before=await page.evaluate(()=>localStorage.getItem('foliolab-open-v1'));
 await page.locator('[name="name"]').fill('Nicht speichern');
 page.once('dialog',d=>d.dismiss());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.locator('#editDialog').isVisible(),true);
 assert.equal(await page.locator('[name="name"]').inputValue(),'Nicht speichern');
 page.once('dialog',d=>d.accept());
 await page.locator('#cancelDialog').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('foliolab-open-v1')),before,'Rejected edited draft never mutates portfolio');
 await edit.click();
 await page.locator('[name="name"]').fill('Überarbeiteter Themen-ETF');
 await page.locator('#saveDialog').click();
 await page.locator('#editDialog').waitFor({state:'hidden'});
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions);
 const p=after.find(p=>p.id===id.etf);
 assert.equal(p.name,'Überarbeiteter Themen-ETF');
 assert.equal(p.quantity,7);
 assert.equal(p.price,19.25);
 assert.equal(p.isin,'IE00B3RBWM25');
 assert.equal(p.exchange,'Xetra');
 assert.equal(p.eodhdSymbol,'DEMO.DE');
 for(const width of [320,360,390,430,767,768,1024,1440]){
  await page.setViewportSize({width,height:760});
  const nav=await page.locator('#mobileNav').isVisible()?'#mobileNav':'#sidebarNav';
  await page.locator(nav+' [data-page="positions"]').click();
  await page.locator('[data-action="edit-position"][data-id="'+id.etf+'"]').click();
  const geom=await page.locator('#editDialog').evaluate(el=>{
   const d=el.getBoundingClientRect(),f=el.querySelector('.dialog-footer').getBoundingClientRect();
   return {left:d.left,right:d.right,top:d.top,bottom:d.bottom,footer:f.bottom,scroll:document.documentElement.scrollWidth};
  });
  assert.ok(geom.left>=-1&&geom.right<=width+1&&geom.top>=-1&&geom.bottom<=761,'Editor fits width '+width);
  assert.ok(geom.footer<=761&&geom.scroll<=width+1,'Footer and page reachable width '+width);
  await page.locator('#cancelDialog').click();
 }
 await page.setViewportSize({width:390,height:820});
 await edit.click();
 await page.locator('#positionKind').selectOption('crypto');
 assert.equal(await page.locator('#securityGroup').isVisible(),false);
 assert.equal(await page.locator('#positionMarketMore').isVisible(),false);
 assert.equal(await page.locator('#positionWalletMore').isVisible(),true);
 await page.locator('#positionWalletMore > summary').click();
 assert.equal(await page.locator('#walletEnabled').isVisible(),true);
 page.once('dialog',d=>d.accept());
 await page.locator('#cancelDialog').click();
 const last=await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).positions);
 assert.equal(last.find(p=>p.id===id.etf).kind,'etf','Switching asset type in discarded draft does not persist');
 console.log('POSITION EDITOR UX: compact selectors, optional lookup, identity and quantity priority, retained data, discard, save, eight widths PASS');
}finally{await browser.close();}
