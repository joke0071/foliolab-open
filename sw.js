const CACHE='foliolab-open-v28';
const ASSETS=['./','./index.html','./styles.css','./src/app.js','./src/account-opening.js','./src/dashboard-ui.js','./src/position-history.js','./src/security-sources.js','./src/security-discovery.js','./src/onboarding-suggestions.js','./src/reference-listings.js','./src/crypto-fallbacks.js','./src/historical-csv.js','./src/position-detail-ui.js','./src/allocation-ui.js','./src/valuation-status.js','./src/model.js','./src/assets.js','./src/decimal.js','./src/transactions.js','./src/blockchain-adapters.js','./src/performance.js','./src/market.js','./src/request-cache.js','./src/csv-import.js','./src/xrpl-assets.js','./src/bitcoin-hd.js','./src/defi.js','./src/format.js','./src/crypto-backup.js','./icons/flask.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('foliolab-open-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
// Cache the complete matching app shell per revision; never cache third-party API responses or secret-bearing URLs.
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const file=url.pathname.slice(scope.pathname.length);
  const key=request.mode==='navigate'?'./index.html':'./'+file;
  if(!ASSETS.includes(key))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const target=new URL(key,scope).toString();
    const cached=await cache.match(target);
    if(cached)return cached;
    return fetch(request);
  }));
});
