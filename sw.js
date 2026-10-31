const CACHE='foliolab-open-v243';
const ASSETS=['./','./src/header-status.js','./src/blocked-reasons-ui.js','./src/flatex-native-ui.js','./src/flatex-native.js','./src/bitpanda-preview-ui.js','./src/csv-records.js','./src/bitpanda-preview.js','./src/kraken-ledger.js','./src/kraken-ledger-ui.js','./src/pchain-identity.js','./src/reference-management.js','./src/sonic-staking-evidence.js','./src/pchain-evidence.js','./src/ledger-live.js','./src/ledger-live-ui.js','./src/account-evidence.js','./src/booking-management.js','./src/csv-batch.js','./src/history-evidence-cache.js','./src/historical-portfolio-value.js','./src/historical-position-value.js','./src/purchase-evidence.js','./src/purchase-evidence-ui.js','./src/interest-ui.js','./src/interest-account.js','./src/interest-scenario.js','./src/cash-reconciliation.js','./src/cash-terms.js','./src/cash-terms-ui.js','./src/wallet-history-calculation.js','./src/wallet-history-days-worker.js','./src/wallet-history-valuation.js','./src/solana-history.js','./src/wallet-history-days.js','./src/wallet-history-ui.js','./src/wallet-history-state.js','./src/ethereum-history.js','./src/bitcoin-history.js','./src/wallet-history-core.js','./src/import-identity.js','./index.html','./styles.css','./src/credential-visibility.js','./src/economic-form-ui.js','./src/dialog-discard.js','./src/app.js','./src/drive-backup.js','./src/backup-vault.js','./src/complete-backup.js','./src/account-opening.js','./src/portfolio-edit-actions.js','./src/position-selection.js','./src/coin-identity.js','./src/position-search.js','./src/asset-wizard.js','./src/asset-wizard-core.js','./src/public-instruments-client.js','./src/refresh-ui.js','./src/market-diagnostics.js','./src/quote-quality.js','./src/dashboard-ui.js','./src/chart-periods.js','./src/position-history.js','./src/eodhd-transport.js','./src/eodhd-worker-client.js','./src/security-sources.js','./src/security-discovery.js','./src/onboarding-suggestions.js','./src/reference-listings.js','./src/instrument-catalog.js','./src/security-catalog.js','./src/crypto-fallbacks.js','./src/historical-csv.js','./src/position-detail-ui.js','./src/position-bookings.js','./src/flatex-review-export.js','./src/allocation-ui.js','./src/position-quality-review.js','./src/valuation-status.js','./src/legacy-quote-audit.js','./src/atomic-storage.js','./src/browser-portfolio-storage.js','./src/model.js','./src/assets.js','./src/decimal.js','./src/transfer-matching-ui.js','./src/transactions.js','./src/blockchain-adapters.js','./src/performance.js','./src/market.js','./src/staking-discovery.js','./src/bnb-token-scanner.js','./src/solana-rpc.js','./src/wallet-scan-update.js','./src/ethereum-fallback.js','./src/native-staking-networks.js','./src/staking-catalog.js','./src/wallet-visibility.js','./src/request-cache.js','./src/csv-import.js','./src/flatex-import.js','./src/flatex-reconciliation.js','./src/flatex-backfill.js','./src/flatex-cost-basis.js','./src/flatex-settlements.js','./src/flatex-settlement-audit.js','./src/flatex-cash-audit.js','./src/booking-history.js','./src/booking-history-ui.js','./src/booking-insights-ui.js','./src/booking-insights.js','./src/capital-flows.js','./src/xrpl-assets.js','./src/bitcoin-hd.js','./src/defi.js','./src/position-icons.js','./src/format.js','./src/crypto-backup.js','./icons/flask.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{
  // A new version must not inherit still-fresh HTTP-cache bytes from the old
  // deployment. Cache API requests otherwise use the browser's HTTP cache.
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(asset=>new Request(asset,{cache:'reload'})))).then(()=>self.skipWaiting()));
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
