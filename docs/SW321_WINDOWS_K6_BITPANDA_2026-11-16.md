# SW321: Bitpanda native UI and bounded Windows K6 acceptance

Accepted product main `e272297ab1ba855a2922c1faa4010b83c558a796`, SW `foliolab-open-v321`, SW SHA256 `5f0db36b3be4b4f53d8d51b4a75556d76e6147b2a6e0f16a5bd6950512b58548`. Product files unchanged. QA [PR350](https://github.com/joke0071/foliolab-open/pull/350), exact head `778468e639a957a9d55c1332f67e430ad29bdf5c`, [run43952605296](https://github.com/joke0071/foliolab-open/actions/runs/43952605296), job133598764476, attempt1 SUCCESS. No product patch or main merge required.

OS: Windows Server2025 Datacenter, Windows_NT10.0.26100, runner image20261103.298.1. Actual installed Google Chrome156.0.8078.80 and Microsoft Edge156.0.4314.58, driven headlessly via pinned Playwright1.56.1. Headless runner automation is the accepted Windows browser evidence, not physical touch/keyboard or Android.

Original artifact14267893674: 1,075,606bytes, SHA256 `d9965b98468fde09c72d9e698870856600037ee86378877e7a02d41e73863aee`. Archive name retains an old `k4` label; its actual twelve members are two independent JSON reports plus ten synthetic screenshots. Downloaded original passed length/hash/CRC checks. Original logs and a durable companion retain provenance; no private amounts, transaction IDs, statements or portfolio enter CI.

## Supported Bitpanda path

Normal JSON import seeds three existing synthetic target positions; normal native CSV file selection, explicit stream binding, independently specified closing balances, opening/net confirmations, preview and approval commit two trades. No private PDF enters this flow. Both browsers: read-only preview, exactly three positions/two bookings, Cash70 + BTC1 at10 + ETH2 at10 =100EUR. Visible positions, total100 and allocation70/10/20% match; reload preserves raw record. Deliberately unrelated `Asset market price=999999` does not add value.

`prepareBitpandaSourcePlan` groups Transaction ID and builds streams from Asset class/Product ID/Asset plus Fiat. The UI requires existing matching target positions; it does not automatically create an index position. Amount Asset/Amount Fiat and type/direction drive the trades; the PDF is a comparison source and books nothing. **No automatic BCI25/component double counting was reproduced in this supported path.** Existing cross-engine native-import reimport tests remain additional evidence. This is not a blanket claim about independently manually creating overlapping positions.

Private valuation has been reproduced with exact rational arithmetic, original historical quote sources/times and daily FX. Both variants explain the statement index value at cent precision. Three direct coin quantity matches remain accepted; the personal allocation of every remaining coin quantity to the index remains unconfirmed. Missing cash balance remains OPEN. No automatic reclassification or booking, no new broad export requested. Private report supersedes the old index-value UNKNOWN and speculative automatic-double-counting blocker; originals remain private.

## K6 outcome

| Case | Chrome | Edge | Observed evidence |
|---|---|---|---|
| Tab to manage, Enter; Tab to position details, Enter | PASS | PASS | Actual Tab traversal; details open by keyboard |
| Tab to edit, Enter; Escape closes; continue with Tab | PASS | PASS | Focus returns to enabled edit-position control; next enabled input reachable; persistent record unchanged |
| Visible keyboard focus | PASS | PASS | Solid3px outline at manage/edit and following control |
| Computed CSS font200%,320/768 viewport; edit remains keyboard reachable | PASS | PASS | Actual11→22px; no page horizontal overflow; edit targets154×46px; normal dialog open/close still works |
| Real Windows system text scaling | Missing prerequisite | Missing prerequisite | HKCU TextScaleFactor not explicitly configured; OS setting was not changed. CSS200% is not native system scaling. Interactive Windows display-setting session required to close it. |
| Physical touch | Missing prerequisite | Missing prerequisite | No physical touchscreen/input path on hosted runner |

Screenshots reviewed for the320px enlarged-action layout; no product defect reproduced in this bounded scope. Existing eleven K4 encrypted UI export/restore/full-process-reopen cases are reused from [Windows K4 acceptance](WINDOWS_K4_PLATFORM_ACCEPTANCE_2026-11-16.md), run43946304983. They are not rerun or relabeled as broad K6 acceptance. Android installation/app-icon/offline cold-start/restore and A01–A10 remain conditional on isolated accessible physical hardware; Safari/TalkBack retain their existing deferred status.
