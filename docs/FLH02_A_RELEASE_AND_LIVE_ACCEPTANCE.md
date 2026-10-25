> Historical v171/A release record. For the later combined FLH02 release, see [FLH02_FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md](FLH02_FINAL_RELEASE_AND_LIVE_ACCEPTANCE.md) and [FLH02_WORK_CHECKPOINT.md](FLH02_WORK_CHECKPOINT.md). Status statements below describe the A release date only.

# FLH02-A production acceptance — partial FLH02 delivery

**Only A is released. FLH02 as a whole is NOT complete.** B/C1 are draft foundations; C2/C3/D/E/Drive remain open. Follow the current foundation-branch checkpoint, not the older main checkpoint.

- A PR: https://github.com/joke0071/foliolab-open/pull/143
- Released application/main SHA: `8e12ae1ad1a0b517eab3404a2dacbe9b31ab61db`.
- Production: https://joke0071.github.io/foliolab-open/ — PWA `foliolab-open-v171`.
- PR CI https://github.com/joke0071/foliolab-open/actions/runs/40213142311: passed.
- Main CI/deployment https://github.com/joke0071/foliolab-open/actions/runs/40213713241: passed, including actual published homepage/service-worker verification.
- A gates: syntax, 639/639 units, full Chromium suite and Firefox/WebKit regression (including purchase-evidence E2E).

## Actual production checks

Ran `RELEASE_SHA=8e12ae1ad1a0b517eab3404a2dacbe9b31ab61db node tests/browser-live-acceptance.mjs` from the exact A checkout. No local app-response substitutions; only isolated synthetic profiles, external API requests blocked.

- 100 exact SHA-256 matches for production assets; v171 service worker and current cache verified.
- Six acceptance groups, 18 actual axe scans without findings.
- UI creation/edit/save/reload, five tabs and ETF/crypto histories; transfers and data-quality paths.
- Real UI JSON/encrypted complete backup downloads, fresh-profile restoration and reload; exact bookings retained.
- Actual service-worker control, offline reload/navigation and IndexedDB write/reload.
- Full machine-readable evidence: [release-evidence/flh02-a-v171-live.json](release-evidence/flh02-a-v171-live.json).

Additionally ran `node tests/browser-live-purchase-evidence.mjs` against actual production: purchase preview/confirmation/undo/reload, no financial mutation, IDB persistence, encrypted full restore, six viewport widths, axe, private-field/XSS exclusion and conflicting-tab CAS passed. Axe was injected via the browser test initialization API, preserving production CSP. An initial attempt using an inline script was refused by CSP; the application policy was not weakened. The environment's HTTPS inspection proxy required a browser certificate exception; certificate-chain validation is not claimed by this acceptance.

Private Bittr parsing was verified locally. Private rendered wallet text lacks transaction/output identities and is incomplete; exact real-world receipt matching counts cannot be established from it. No private reference contents/checksums were committed.

## Remaining delivery

Draft foundation PR: https://github.com/joke0071/foliolab-open/pull/144. Its application is not deployed. Latest local foundation gates: 650/650 unit tests, syntax, historical-value and mini-card Chromium E2E, existing large-booking regression, 66 Chromium UI07 scans with zero findings. Earlier foundation CI failed because UI07 assumed the former Transactions default. The audit now checks EUR default and explicitly opens Transactions before preserving its metadata assertions; replacement CI is required.

Outstanding: B provider/FX/range/cache and wallet/corporate-action integration; C1 full wallet/staking/cash-interest scope; C2 chart connection; C3 integrated reconciliation/E2E; D/E including optional connections consolidation; Drive connection-to-backup UX; final combined all-engine gates and full FLH02 deployment. No complete-FLH02 release or active background continuation is asserted.
