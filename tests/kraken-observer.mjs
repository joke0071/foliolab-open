// Draft only: preload with node --import, before the unchanged Kraken test.
// Existing wrapper observations, now installed through awaited newPage barriers.
export async function observeBrowser(browser, emit) {
  let contextId = 0;
  const drains = [];
  const browserClose = browser.close.bind(browser);
  browser.close = async (...args) => {
    try { return await browserClose(...args); }
    finally { for(const drain of drains)await drain(); }
  };
  const originalContext = browser.newContext.bind(browser);
  browser.newContext = async (...args) => {
    const context = await originalContext(...args), id = ++contextId;
    let pageId = 0;
    const pending = new Set();
    drains.push(async () => { while(pending.size)await Promise.all([...pending]); });
    const log = (type, data = {}) => emit({context:id, type, ...data});
    const track = promise => {
      const task = promise.catch(error => log('observer-error',{error:String(error)}));
      pending.add(task); task.finally(() => pending.delete(task));
    };
    // URLs are public resource identity only: no query, fragment, userinfo or bodies.
    const url = value => { try { const u = new URL(value); return u.origin + u.pathname; } catch { return '<invalid-url>'; } };
    context.on('request', r => log('request',{url:url(r.url()),method:r.method(),worker:!!r.serviceWorker()}));
    context.on('requestfailed', r => log('requestfailed',{url:url(r.url()),failure:r.failure(),worker:!!r.serviceWorker()}));
    context.on('response', r => {
      const at = Date.now();
      track((async () => log('response',{at,url:url(r.url()),status:r.status(),worker:!!r.request().serviceWorker(),security:await r.securityDetails()}))());
    });
    context.on('serviceworker', w => {log('worker',{url:url(w.url())});w.on('close',()=>log('workerclose',{url:url(w.url())}));});
    await context.exposeBinding('__folioDiagnostic', (_,data) => log('lifecycle',data));
    await context.addInitScript(() => {
      const describe = w => w ? {script:new URL(w.scriptURL).pathname,state:w.state} : null;
      const seen = new WeakSet();
      const report = (event,r) => window.__folioDiagnostic({event,path:location.pathname,controller:describe(navigator.serviceWorker.controller),installing:describe(r?.installing),waiting:describe(r?.waiting),active:describe(r?.active)});
      const watch = r => {report('registration',r);const workers=()=>{for(const w of [r.installing,r.waiting,r.active])if(w&&!seen.has(w)){seen.add(w);w.addEventListener('statechange',()=>{report('statechange',r);workers();});}};workers();r.addEventListener('updatefound',()=>{report('updatefound',r);workers();});};
      if('serviceWorker' in navigator){
        navigator.serviceWorker.addEventListener('controllerchange',()=>report('controllerchange'));
        const original=navigator.serviceWorker.register;
        navigator.serviceWorker.register=function(...args){report('register-call');return original.apply(this,args).then(r=>{watch(r);return r;},e=>{window.__folioDiagnostic({event:'register-error',error:String(e)});throw e;});};
      }
    });
    const originalPage = context.newPage.bind(context);
    context.newPage = async (...pageArgs) => {
      const page = await originalPage(...pageArgs), pid = ++pageId;
      page.on('pageerror', e => log('pageerror',{page:pid,error:String(e)}));
      // Do not copy arbitrary console text (could contain fixture secrets).
      page.on('console', m => log('console',{page:pid,level:m.type()}));
      const cdp = await context.newCDPSession(page);
      for(const event of ['ServiceWorker.workerRegistrationUpdated','ServiceWorker.workerVersionUpdated','ServiceWorker.workerErrorReported'])cdp.on(event,data=>log(event,{page:pid,data}));
      cdp.on('Network.loadingFailed',data=>log('Network.loadingFailed',{page:pid,data}));
      await cdp.send('ServiceWorker.enable');
      await cdp.send('Network.enable');
      log('page-observer-ready',{page:pid});
      return page;
    };
    const originalClose = context.close.bind(context);
    context.close = async (...closeArgs) => {
      try { return await originalClose(...closeArgs); }
      finally { await Promise.all([...pending]); log('context-closed'); }
    };
    log('context-observer-ready');
    return context;
  };
}
