# ETF-QUOTE #266 – browser source recovery (v255 candidate)

Status: IN_PROGRESS; no release or live-provider approval implied.
Base: main 512d935098e2d31366b861352d94684cae7582cb / v252 LIVE_ACCEPTED.

## Product delta

- Four curated EUR/XETR reference identities (VWCE, XDEM, XDEQ, 5MVL) can be hydrated from exact ISIN + ticker + MIC + explicit currency despite abbreviated broker names. Every conflicting ISIN, venue, provider symbol and currency continues to reject hydration. Legacy full-name matching remains. No amounts, names, bookings, financial engine, schema or write contracts changed.
- FMP direct browser requests are first, Twelve Data next, optional owned EODHD worker last. No direct EODHD quote/history request, including legacy eodhd-only selection. Existing direct keys are retained in local settings and encrypted configuration backups. Absent fields cannot clear keys on save; explicit credential revocation still clears them.
- FMP mapping is resolved read-only at the request boundary. A configured source with missing mapping is visible in diagnosis rather than silently absent. Invalid optional worker settings do not prevent usable direct providers.
- XETR/XETRA exchange aliases are equivalent, while Frankfurt/XFRA, USD or another ticker remain unacceptable substitutes. Provider date freshness is retained. No synthetic valuation or FX substitution.
- General read-only diagnosis covers at most four holdings and each selected configured provider (up to 12 requests), stops further calls per provider on access/network/rate failure, and reports skipped mapping/transport, 404, tariff, stale data or successful dated identity separately. It never commits quotes or financial data. Twelve quote attempts are bounded to one to avoid repeated billable 429 requests.
- The main data-source panel reports prior confirmed quote evidence, actual source/date, coverage and concrete next action before the compact credential setup. This is not a real-time connectivity promise.

## Evidence boundary / external blockers

The fresh development environment contains no authorized user FMP/Twelve/Alpha Vantage keys. Do not extract keys from private screenshots, connected accounts or logs. The new four-ETF browser/IDB/UI test uses only synthetic mocked financial-provider responses; it proves app behavior, not provider coverage, rate entitlement, licensing or actual origin CORS.

- FMP: existing stable `/quote` and historical EOD paths retained. All-four actual EUR/XETR responses with an authorized tariff remain unverified.
- Twelve Data public catalog observation (01.11.2026): actual HTTPS `GET /etfs?symbol=SYMBOL&mic_code=XETR&show_plan=true` with the FolioLab Origin header returned HTTP 200 and `Access-Control-Allow-Origin: *` for **all four**. Rows match their full ETF names, EUR, exchange XETR and MIC XETR; access.plan/global = Grow, access.plan_business = Venture. ISIN is masked as `request_access_via_add_ons`. This is public reference-data evidence, not an actual browser quote or authorized tariff/ISIN verification. Quote/history now send the confirmed MIC without the redundant display exchange alias; response identity validation stays mandatory. Exact user 404 cause is still unproved.
- Twelve Data: official `/quote` and `/time_series` paths exist. HTTP/body 404 now survives as a safe numeric diagnostic; it is not sufficient evidence to blame a key or symbol. The user's exact 404 cause remains BLOCKED pending an authorized origin request. Official Xetra page identifies XETR/EOD and Grow+/Venture+; entitlement is not inferred from a generic free ETF advertisement.
- Alpha Vantage: `.DEX` documented (example MBG.DEX), but this does not establish VWCE/XDEM/XDEQ/5MVL coverage. No adapter added. Required positive authorized origin CORS, four listings/EUR/venue/date, suitable quota and applicable data-use rights remain unproved. Free standard limit documented as 25 requests/day; no automatic signup or paid plan purchased.
- yfp/Yahoo scraping and Alpaca: no new adapter or alternate-market substitution. Existing issue #266 candidate review remains applicable.
- Manual prices and local historical CSV remain reachable. Owned EODHD worker remains optional; it is not counted as satisfying worker-free live-provider acceptance.

## Validation

Unit/syntax and all existing financial/storage/backup/three-engine/PWA gates remain required. Obsolete direct-EODHD tests are migrated to direct FMP/Twelve and owned-worker contracts, with additional no-direct-request, missing-mapping, secret-redaction, per-source stop and legacy-key preservation assertions. Backup hydration is explicitly idempotent; all other canonical data and listing IDs survive round-trip.

New `tests/browser-etf-source-recovery.mjs`: Chromium/Firefox/WebKit, real fresh IndexedDB, four abbreviated ETF identities, direct FMP update, exact quantities and dated quote persistence, legacy-key preservation through real form save, read-only diagnostic record/revision, 404 failure retention, no EODHD/worker network, 320/360/390/412/430/768/1440 widths and Axe. Runs in PR/main and against deployed production; mocks are explicitly labelled in artifacts. This isolated provider-mock suite blocks Service Worker registration so WebKit cannot bypass Playwright network interception and reach a real provider with synthetic keys. All separate existing real-SW/PWA/offline/update suites remain mandatory; this suite does not claim SW lifecycle evidence.

Local browser installation failed because the available download returned an empty/truncated archive. Remote CI must supply the full browser evidence; no local browser or physical Android PASS is claimed.

## Primary provider references checked 01.11.2026

- https://site.financialmodelingprep.com/developer/docs/stable/quote
- https://site.financialmodelingprep.com/developer/docs/stable/full-etf-quotes
- https://twelvedata.com/docs
- https://twelvedata.com/exchanges/xetr?group=mutual_funds
- https://www.alphavantage.co/documentation/
- https://www.alphavantage.co/premium/
- https://www.alphavantage.co/terms_of_service/

Next: exact candidate PR and full CI, resolve all failures, then permitted routine integration, deployment and production acceptance. Keep #266 PARTIAL until actual authorized direct-provider four-ETF acceptance; then continue #267/#264, #268, #257 and remaining ACTIVE master packages serially.
