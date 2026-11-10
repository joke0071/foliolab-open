import assert from 'node:assert/strict';
/** Uses the real fresh-IDB editor/save/reload path with synthetic public identities.
 * Also imported by the existing three-engine archive gate, including production. */
export async function checkExistingWalletEditor(browser,{base='http://127.0.0.1:4173/',engine='chromium'}={}){
 const ctx=await browser.newContext({viewport:{width:390,height:820},ignoreHTTPSErrors:base.startsWith('https:')});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>document.getElementById('portfolioStorageState')?.textContent.includes('IndexedDB aktiv'));
 const nav=()=>page.locator('#mobileNav [data-page="positions"]:visible,#sidebarNav [data-page="positions"]:visible').click();
 const record=()=>page.evaluate(async base=>{const {openPortfolioDB,readUnverifiedRecord}=await import(new URL('src/atomic-storage.js',base));const db=await openPortfolioDB();try{return await readUnverifiedRecord(db);}finally{db.close();}},base);
 const open=async id=>{
  if(await page.locator('[data-action=cancel-selection]').count())await page.locator('[data-action=cancel-selection]').click();
  await page.locator('[data-action=select-positions]').click();
  await page.locator('[data-action=edit-position][data-id="'+id+'"]').click();
  await page.locator('#editDialog[open]').waitFor();
 };
 try{
  await page.goto(base);await ready();
  const ids=await page.evaluate(async base=>{
   const {createProvider,createAccount,createPosition}=await import(new URL('src/model.js',base));
   const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));
   const store=new PortfolioStorage();try{
    const m=await store.initialize();m.settings.autoRefresh='off';
    m.providers.push(createProvider({id:'editor-provider',name:'Synthetic wallet provider'}));
    m.accounts.push(createAccount({id:'editor-account',providerId:'editor-provider',name:'Synthetic wallet account',type:'crypto'},m));
    const evm='0x'+'1'.repeat(40),cosmos='cosmos1'+'a'.repeat(38),validator='cosmosvaloper1'+'a'.repeat(38);
    const wallets=[
     {chain:'sol-stake',address:'11111111111111111111111111111111',contract:'22222222222222222222222222222222'},
     {chain:'sonic-stake',address:evm,contract:'7'},
     {chain:'cosmos',address:cosmos},
     {chain:'cosmos-stake',address:cosmos,contract:validator},
     {chain:'cosmos-unbonding',address:cosmos,contract:validator},
     {chain:'hedera',address:'0.0.12345'},
     {chain:'near',address:'synthetic.near'},
     {chain:'near-locked',address:'synthetic.near'}
    ];
    for(const wallet of wallets)m.positions.push(createPosition({id:'editor-'+wallet.chain,providerId:'editor-provider',accountId:'editor-account',kind:'crypto',name:'Synthetic '+wallet.chain,symbol:'TEST',quantityExact:'1.000000001',price:10,notes:'original note',wallet:{enabled:true,...wallet}},m));
    await store.save(m);return m.positions.map(p=>p.id);
   }finally{store.close();}
  },base);
  await page.reload();await ready();await nav();
  const original=await record(),originalModel=JSON.parse(original.raw);
  // Cancel/discard is a read-only operation, including the otherwise overlapping
  // synthetic Solana/BTC address which would silently change chain in the old UI.
  await open(ids[0]);await page.locator('[name=name]').fill('discarded change');
  page.once('dialog',d=>d.dismiss());await page.locator('#cancelDialog').click();
  assert.equal(await page.locator('#editDialog').isVisible(),true);
  page.once('dialog',d=>d.accept());await page.locator('#cancelDialog').click();
  assert.deepEqual(await record(),original,'discard does not persist any chain or text change');
  // All eight previously absent identities must survive ordinary text edits.
  for(const id of ids){
   const before=await record(),old=JSON.parse(before.raw).positions.find(p=>p.id===id);
   await open(id);
   assert.equal(await page.locator('#walletChain').inputValue(),old.wallet.chain,'existing network is selected before editing');
   assert.match(await page.locator('#walletChain option:checked').innerText(),/bestehende Verknüpfung/);
   assert.equal(await page.locator('[name=walletContract]').inputValue(),old.wallet.contract||'');
   await page.locator('[name=name]').fill(old.name+' renamed');
   await page.locator('[name=notes]').fill('changed note only');
   await page.locator('#saveDialog').click();await page.locator('#editDialog').waitFor({state:'hidden'});
   const after=await record(),next=JSON.parse(after.raw).positions.find(p=>p.id===id);
   assert.equal(after.revision,before.revision+1,'one canonical edit commit');
   assert.deepEqual(next.wallet,old.wallet,'chain/address/contract/decimals/chainId all retained');
   assert.equal(next.quantityExact,old.quantityExact);
   assert.deepEqual({...next,name:old.name,notes:old.notes},old,'position changes only its intended text');
  }
  const saved=await record(),savedModel=JSON.parse(saved.raw);
  for(const key of ['bookings','journalEntries','openingPositions','externalCashFlows','providers','accounts','priceHistories'])
   assert.deepEqual(savedModel[key],originalModel[key],key+' unchanged by wallet text edits');
  await page.reload();await ready();assert.deepEqual(await record(),saved,'all wallet identities survive actual reload');
  await nav();await open(ids[0]);
  // A rejected real canonical put cannot persist either text or identity.
  await page.evaluate(()=>{window.walletEditorPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='records'&&args[1]==='portfolio')throw new DOMException('synthetic editor quota','QuotaExceededError');return window.walletEditorPut.apply(this,args);};});
  await page.locator('[name=name]').fill('must not persist');await page.locator('#saveDialog').click();
  await page.locator('#dialogError:not(.hidden)').waitFor();assert.deepEqual(await record(),saved,'quota rejection retains exact canonical record');
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.walletEditorPut;});
  page.once('dialog',d=>d.accept());await page.locator('#cancelDialog').click();
  await open(ids[0]);await page.locator('[name=name]').fill('stale edit must not persist');
  const peer=await ctx.newPage();await peer.goto(base);
  await peer.evaluate(async base=>{const {PortfolioStorage}=await import(new URL('src/browser-portfolio-storage.js',base));const store=new PortfolioStorage();try{const m=await store.initialize();m.positions.at(-1).notes='peer winner';await store.save(m);}finally{store.close();}},base);
  const winner=await record();
  if(!await page.locator('#saveDialog').isDisabled()){
   await page.locator('#saveDialog').click();await page.locator('#dialogError:not(.hidden)').waitFor();
  }
  assert.deepEqual(await record(),winner,'stale editor cannot overwrite a competing tab');await peer.close();
  assert.deepEqual(errors,[]);
  console.log(engine+': existing-wallet editor eight networks, exact identity/text-only save, discard, quota, peer CAS and reload PASS');
  return {engine,networks:8,status:'PASS',checks:['actual native selected network','eight text-only one-revision commits','unchanged wallet/quantity/economic records','discard','quota exact-record retention','actual reload','peer CAS winner retained']};
 }finally{await ctx.close();}
}

