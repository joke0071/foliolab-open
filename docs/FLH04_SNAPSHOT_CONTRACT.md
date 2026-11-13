# FLH04 credential-free snapshot gate — bounded canonical v3/v4 histories

## Current scope · 13.11.2026

Canonical accepted BTC/ETH/SOL sessions and separate canonical CSV/user-confirmed
provider priceHistories are supported losslessly under the dated slices below.
Canonical v3/v4 purchase receipts/decisions are additionally supported by the dated
Purchase-Evidence slice below. v5, pending/resume, populated bitcoinLedger and other
import/management/withdrawal/bridge evidence remain unsupported in full. Earlier empty-only price-history statements below describe
historical slices and are superseded only for this dated scope.
No active integration or Apply permission, no independent crypto/native acceptance.

Base: 648cc0fbeef7031d6583231aa05a4d40d379b9bb. Own isolated branch; no activation, IDB, transport, key or Apply code.

## Boundary fixed before code

Input to the encoder is only the canonical local portfolio raw JSON string, never record.settings or a complete-backup configuration. A sync snapshot is a distinct canonical JSON envelope: kind=FolioLabSyncSnapshot, snapshotVersion=1, data=explicitly allowlisted financial data without settings. All nested supported branches receive path-specific key and type allowlists. Unknown keys/versions, duplicate or noncanonical JSON encodings, nonfinite numbers, malformed Unicode and excessive size fail closed. No unknown field is silently stripped except the explicitly excluded top-level local settings object at encode time; its contents are never inspected/copied. The encoder operates on detached parsed JSON.

Before returning any snapshot, use existing safeImport/assertDataVersion financial, exact-decimal, journal, dedupe and identity validators. Require structural equality of every allowed financial value after the validator projection; a legacy migration, default, trim, FX repair, changed ID or normalization must block rather than change the committed snapshot. settings are excluded from that comparison. The decoder returns the original canonical plain bytes and a frozen financial representation, never an Apply permission. Cryptographic verification and local graph/identity/CAS gates remain mandatory.

This first slice supports canonical v3 ordinary positions/accounts, simple journal/bookings, opening balances, external cashflows, and structured snapshots; v4 booking archive may be preserved under its own explicit schema. Import-source payloads, complex management/withdrawal/bridge proofs, v5, purchase evidence and price histories are explicitly unsupported; accepted wallet history is extended only by the dated slice below and rejected intact. Their full lossless allowlists need separate contracts; no partial portfolio is emitted. This deliberate boundary is NOT a completed full FLH04 financial/history/evidence validator, and cannot be integrated for all portfolios.

Credential-free means no app settings/OAuth/provider configuration/vault/raw provider cache/protocol secrets are selected by the schema. Public wallet addresses and user financial labels/notes remain financial data; this is not a general secret detector for user-entered free text. JSON objects cannot carry arbitrary extension values under string fields.

Required directed checks: sentinel keys/settings never appear; unknown nested fields reject; free-form config envelopes reject; sourcePayload and proof branches reject instead of truncation; exact 18-decimal/UNKNOWN FX survives unchanged; contradictory journal/orphan/duplicate IDs reject by existing validators; preserved ordering and references; source bytes unchanged on failure; canonical syntax/Unicode/limits; no storage/network calls. Node tests are not IDB/browser/real-device/production qualification.


## Implemented and actually checked

New APIs: `createSyncSnapshot(canonicalRaw)` returns distinct compact snapshot text; `validateSyncSnapshot(plain)` returns frozen `{plain,data}`. Local raw accepts only exact compact or existing two-space JSON serialization, rejecting duplicate-key/alternate encodings. Nested financial strings reject escaped lone surrogates as well as invalid raw Unicode. Local top-level settings are deliberately discarded; received settings are forbidden.

Node24.22.1: 21 directed tests PASS, 0FAIL/0SKIP/0CANCELLED; syntax of both new files PASS. 62 original package/source inputs are Git-blob exact at pinned base before the final suite. Earlier local file copies had one extra trailing LF; removed only when the resulting blob matched the pinned source, before final tests. One first-pass assertion expected null for fxRateExact; corrected to the existing canonical `UNKNOWN` representation while fxRate stays null. No product-code FX repair was introduced. No existing 63-test suite repeated; no browser/IDB/CI/device/crypto/production qualification.

Full v5, imported-source payloads and audit/withdrawal/bridge proofs, pending wallet history, populated price histories and purchase evidence remain BLOCKED_UNSUPPORTED. Canonical accepted wallet sessions are supported by the dated slice below. No partial output, migration or activation for those portfolios. A complete financial/history/apply gate is still unfinished.


## Folgeauftrag: B-Lückenproben und Ressourcenbudget

Zweiter unabhängiger Beleg65765d3a wurde gegen diesen Validator ausgewertet.
Neun neue gezielte Reject-/Acceptregressionen prüfen Root-/Journal-/Posting-/
History-Credentials, fremde Identität, Decimalnormalisierung, Resume-/Konfigurations-
verlust und Größen-/Strukturlücken am aktuellen Gate. Die41 alten Charakterisierungen
wurden nicht wiederholt. Betroffene21Snapshottests wegen Budgetänderung erneut geprüft;
zusammen30PASS/0FAIL/0SKIP auf Node24.22.1.

Der neue Snapshot muss maximal3.500.000UTF8-Bytes,100.000Strukturwerte und Tiefe16
haben. Ein Strukturwert ist ein besuchter JSON-Wert einschließlich Container.
Der konservative Byteswert lässt selbst bei doppelter Escapierung im verschlüsselten
Content ausreichend Platz für den begrenzten Descriptor unter dem7,4MB-Framecipherlimit.
Grenzen blockieren vollständig, keine Kürzung/Teil-Snapshots. Vollständige v5-/Beleg-/Resume-/Preishistoryabdeckung bleibt unimplementiert;
kanonische akzeptierte Walletsessions folgen ausschließlich dem datierten Schnitt unten.

## Autorisierter nächster Produktschnitt · 13.11.2026

Vor Umsetzung festgelegt, work-f236b969b0b1-20261113:
vorhanden sind strikter v3/v4-Snapshot, geschlossene Finanzfelder,
unverändernde Vergleichsprüfung gegen safeImport sowie der bestehende
validateWalletHistory-/Replay-/Quotesvalidator. Konkret fehlt eine rekursiv
geschlossene Allowlist für bereits akzeptierte Sessions einschließlich
Events, Streams, Opening/Coverage, Quotes und optionalem BTC-Scopebezug.

Genau dieser Historyumfang wird isoliert ergänzt; v5, Import-/Management-/
Withdrawal-/Bridge-/Purchasebelege, getrennte priceHistories und alle
pending/Resumeinformationen bleiben vollständig gesperrt. Keine neue
Autorisierung/Entsperrung/Outbox-/Appintegration. Kryptoreviewkandidat bleibt
17a5a190d472f1f07b3508e6f35194371fe95eb2; dies ist kein Reviewabschluss.

Betroffene Implementierung: src/sync-snapshot.js; neue gerichtete Tests:
tests/sync-snapshot-history.test.mjs; bestehende Dokumentation/Tests nur im
betroffenen Umfang. Datenversion/Envelopeversion und alle Budgets unverändert.

Erfolg: kanonische akzeptierte BTC/ETH/SOL-Sessions vollständig unverändert,
inklusive Rohmengen jenseits Number-Präzision, UNKNOWN/null, optionalem
walletScopeDigest, IDs/Reihenfolge, Quellen, quote priceExact und Journal/
Snapshot-/Finanzbytes. Fehlende Opening/Quotes bleiben fehlend; Historyfacts
erzeugen keine Journale oder wirtschaftlichen Wirkungen.

Ablehnung: unbekannte Felder an jeder neuen Ebene, Credentials/Providercache,
nicht akzeptierte oder sich normalisierende Sessions/Events/Streams/Quotes,
gefälschte IDs/Orphans/Quotebindung, widersprüchliche oder doppelte Fakten,
Duplikat-Sessions, Resume-/pending-Inhalt und bestehende Unsupportedpayloads.
Jeder Fehler blockiert das ganze Portfolio ohne Quellmutation; keine stille
Sortierung/Dedupe/Sanitization als Ausgabe. Bestehende Semantikvalidatoren
wiederverwenden; keine zweite Replay-/Bewertungsengine.

## Tatsächlich erreichter Implementierungs- und Prüfabschluss

Geschlossene rekursive History-Allowlist ergänzt; bestehende Semantikprüfung
via safeImport→validateWalletHistory→Replay/Quotes und vollständiger
unverändernder Vergleich bleiben maßgeblich. Keine neue Crypto-, Storage-,
Outbox-, Encoder-/Transport- oder Appintegration; keine wirtschaftliche Wirkung.

Final auf Node24.22.1: 40 verschiedene betroffene Tests PASS/0FAIL/0SKIP/
0CANCELLED (21 bestehende Snapshot-,9 Gap-,10 neue Historytests), Prozesscode0.
[Maschinenlesbarer lokaler Prüfbeleg](release-evidence/flh04-snapshot-history-local-2026-11-13.json).
Syntax für Modul, neue Suite und unveränderten nativen Harness PASS.
69 ursprüngliche Paket-/Quell-/Testeingaben vor Änderung blobgenau; davon67
nach Änderung unverändert bestätigt, zusätzliche bestehende Historyfixture
blobgenau. Kein vollständiger Repo-/Releaseaudit.

Erster neuer Lauf9PASS/1FAIL: bereits deklarierte partial-Coverage ist gültig
und wird verlustfrei erhalten; zum positiven Fall mit unbekanntem Saldo korrigiert.
Erster gemeinsamer Lauf39PASS/1FAIL: unvollständige Session weiterhin abgelehnt,
nun durch vorhandenen Historyvalidator statt Empty-only-Allowlist; präzise
Fehlererwartung und veralteten Testtitel nachgeführt. Keine Produktgrenze,
Timeout- oder Ablehnungsassertion gelockert.

Implementierung dieses begrenzten Scopes vollständig; gerichtete interne
Nodeverifikation bestanden. Native Browser-/IDB-/CryptoKey-/Mehrtab-/echte
Crash-/Quota-/Recoveryabnahme nicht durchgeführt, AF_UNIX→EPERM bleibt.
Kein Ersatz dafür durch Units. Keine CI22/Wallet20-/PR-/Main-/Produktions-
oder externe Abnahme; kein Release/FLH04-DONE.
Kryptoreviewpaket [Einstieg](FLH04_CRYPTO_REVIEW_ENTRY_2026-11-13.md)
bleibt EXTERNAL_REVIEW_PENDING, CryptoKeytausch zwischen Challenge/Commit
ungelöst. Alle übrigen Pflichtgates gelten unverändert.


## Autorisierter nächster Historyrest · 13.11.2026 · work-f2948d3c3fba-20261113

Vor Code festgelegt: Kanonische getrennte priceHistories fehlen in der bestehenden
v3/v4-Allowlist. Vorhanden sind validateImportedPriceHistory, historyIdentity und
safeImport mit Positionsreferenz-/Gesamtpunktlimit; diese bleiben unverändert.
Genau ein vollständiger lokaler Historyumfang: CSV-Schlusskurse und ausdrücklich
user-confirmed Anbieterhistorien (EODHD/Twelve Data/FMP/CoinGecko/CoinPaprika),
historische FX-Punkte und Herkunft/Positionsbindung. Kein neuer Anbieterabruf,
keine Retentionbestätigung, Bewertung, Buchung oder Rechte-/Syncfreigabe.

Rekursiv erlaubte Felder: History currency/source/points/priceType/fxPoints/provenance;
Punkt date/total/optionales valuationDate; FX date/currency/rate/source/optionales
referenceDate; Provenienz schema/provider/identity/retention. Bestehende Semantik
und vollständig unverändernder Vergleich entscheiden über Annahme, nicht allein
Feldnamen. Alle Reihenfolgen/Typen/Zahlen/Strings/null/Abwesenheiten erhalten.
Kanonische CSV-History ohne optionale Felder bleibt so; retained history behält
ihre vorhandene fxPoints-Liste und Provenienz. Keine stille Sortierung oder Defaults.

Erfolg: ganze kanonische v3/v4-Portfolios mit mehreren Positionshistorien
verlustfrei hin/zurück einschließlich FX-Referenztagen und Krypto-valuationDate/null,
bei unverändertem Journal/UNKNOWN-FX/Bestand und ausgeschlossenen settings.
Ablehnung: zusätzliche Felder/Credentials an jeder Ebene, falsche Positionsreferenz
oder Anbieter-/Identitäts-/Währungs-/Kursartbindung, ungültige/duplizierte/unsortierte
Kurstage, falsche Zahlen/FX-Referenzen/Normalisierungsbedarf und Budgetüberschreitung.
Ein Fehler blockiert das gesamte Portfolio, keine Teilausgabe/Pruning.
v5/Import-/Management-/Withdrawal-/Bridge-/Purchasebelege und pending/Resume bleiben
vollständig unsupported. Snapshot1/3.500.000UTF8Bytes/100.000Werte/Tiefe16 unverändert.

Betroffen: src/sync-snapshot.js, tests/sync-snapshot-price-history.test.mjs,
präzisierter bestehender Unsupportedtest sowie Fachcheckpoint/Prüfbeleg.
Keine Krypto-/Anker-/Storage-/Outbox-/Appänderung. Impact zum Reviewkandidaten
17a5a190d472f1f07b3508e6f35194371fe95eb2: nur nachgelagerte Snapshot-Feldabdeckung;
Review weiter EXTERNAL_REVIEW_PENDING, keine Freigabe durch diesen Schnitt.


## Preis-History: tatsächlich erreichter Abschluss · 13.11.2026

Implementiert: geschlossene History-/Punkt-/FX-/Provenienzallowlists mit
strikten neuen String-/Zahltypen. Vorhandene safeImport→validateImportedPriceHistory-
Semantik und vollständiger unverändernder Vergleich bleiben unverändert.
Keine neuen Datenabrufe, Bestätigungen, Sortierungen, Defaults oder Bewertungen.
Alle drei Preis-Historyvarianten coexistieren verlustfrei mit akzeptierter
Wallet-Historie, großem Rohmengenstring, UNKNOWN/null und vorhandenem Journal.

Finaler gezielter Lauf Node24.22.1: 58PASS/0FAIL/0SKIP/0CANCELLED, Prozesscode0
(21Snapshot+9Gap+10WalletHistory+11PriceHistory+7historicalCSV), Syntax4PASS.
68ursprünglicheEingaben vor Produktänderung blobgenau;65danach unverändert.
Drei ursprüngliche Dateien bewusst geändert, eine neue Testdatei.
[Lokaler Prüfbeleg mit Erstbefunden und finalem Originaloutput](release-evidence/flh04-snapshot-price-history-local-2026-11-13.json).
Erste Syntax-/Fixture-/Fehlererwartungsbefunde dort ausdrücklich erhalten.
Bestehende Ablehnungsfälle weiterhin wirksam; keine Produkt-/Grenzlockerung.

Begrenzte Implementierung vollständig und gezielte interne Nodeverifikation bestanden.
Keine Browser/IDB/CryptoKey/Reopen/Mehrtab/echterCrash/realeQuota/CI22/Wallet20/
PR/Main/Produktions-/externeAbnahme. Kein Ersatz für Keyslotbindung oder
unabhängiges Kryptoreview. FLH04NOTDONE/OutboxINTERNUNQUALIFIZIERT/N-DRIVEBLOCKED_EXTERNAL.

## Purchase-Evidence-Snapshot · vor Code festgelegt · 13.11.2026

Owner work-3e1b992cda51-20261113; Ausgang 3f05f5ebcc5ec8ccdc2390937c9a961b9d041c83.
Vorhanden: safeImport ruft validatePurchaseEvidence auf; vollständig unverändernder
Snapshotvergleich und bereits belegte kanonische Wallet-/Preis-History bleiben.
Fehlend ist ausschließlich die rekursiv geschlossene Purchase-Allowlist.
Ergänzt werden schema1, receipts (id/provider/currency/timestamp/txid und sämtliche
exakten EUR/BTC-Beträge), decisions (action/walletKey/sessionId/at/receiptIds/events)
und optional bitcoinLedger (id/ownerDigest/txid/timestamp/amountBTC/events).
Alle Textfelder strikt Strings, Schema exakt1, Arrays nur passende Strukturen.
Bestehender Validator prüft Mengen/Gebühren/IDs/Hashform/UTC/Referenzen/Duplikate/
Link-Unlink-Folge und eigene Limits; dessen Projektion muss vollständig gleich sein.
Keine zweite Validierungs-/Bewertungsengine. Kein Normalisieren oder Defaulten.

Erfolg: receipts ohne Zuordnung, bestätigte N:M/split-Bezüge, Link→Unlink→Relink,
optionales leeres Ledger, sämtliche IDs/Hashes/Strings/Reihenfolgen und
koexistierende Finanz-/UNKNOWN-/Wallet-/Preis-History unverändert erhalten.
Bestehende veraltete Sitzung/Fingerprint/Wallet-/Ledgerbezüge bleiben dokumentarisch;
der Snapshot bestätigt sie nicht und erzeugt weder Buchung noch neue Autorität.
Fehlende/nicht mehr aktuelle History darf nicht still zugeordnet oder repariert werden.

Ablehnung vollständig auf Encoder UND Decoder: unbekannte Felder/Credentials an
jeder Ebene, falsche Typen/Schema, falsche Receipt-ID, Mengen/Gebührenwiderspruch,
doppelte Belege/Ledger/aktive Events, verwaiste Receiptrefs, ungültige Link-/Unlinkfolge,
Timestamp-/Decimalnormalisierung und nichtkanonisches null-Ledger. Jede Abweichung
blockiert das gesamte Portfolio ohne Quellmutation oder Teilpayload. v5/Import-/
Management-/Withdrawal-/Bridgebelege/pending-Resume weiterhin unsupported.

Dateigrenze: src/sync-snapshot.js, neue tests/sync-snapshot-purchase-evidence.test.mjs;
3 vorhandene Snapshot-Suiten ersetzen nur ihre nun überholte empty-Purchase-
Ablehnung durch echte ungültige Schemafälle. Snapshotvertrag/Fachcheckpoint und
lokaler Prüfbeleg fortschreiben. Bestehende purchase-evidence.test.mjs unverändert
gezielt mitprüfen. Keine Storage-/Outbox-/Anker-/Krypto-/Appintegration. Alle Budgets,
Kryptoreview-/Persistenz-/Recovery-/Releasegates unverändert und ausdrücklich offen.

### Implementiert und geprüft · Purchase-Evidence

Die konkrete hasUnifiedBitcoinState/assertDataVersion-Abhängigkeit verlangt schon
bei gefülltem bitcoinLedger Datenversion5. Dieser Scope unterstützt deshalb nur
fehlendes/leeres Ledger und kanonische Receipt-/Decisionherkunft unter v3/v4;
gefülltesLedger und v5 bleiben vollständig gesperrt. Die ursprünglich zu weite
Erfolgserwartung eines gefülltenLedgers ist hiermit ausdrücklich korrigiert.
Die Ledgerstruktur ist geschlossen allowlisted, aber keine semantische Freigabe;
der bestehende Versionsvalidator sperrt nichtleere Ledger vor safeImport.

12neueTests und57betroffenebestehendeTests final69PASS/0FAIL/0SKIP/0CANCELLED,
Node24.22.1/Exit0; Syntax5PASS. Verlustfreie N:M/Splitbezüge, Link/Unlink/Relink,
v4-Archiv, Reihenfolge/Provenienz/FX/UNKNOWN/Journal/PreisHistory und unveränderte
conflict-Semantik auch bei fehlenderHistory tatsächlich geprüft. Decoder UND
Encoder weisen unbekannteFelder/falscheTypen/IDs/Referenzen/Arithmetik/Duplikate/
UTC-/Decimalnormalisierung/v5/pending/andereBelege vollständig zurück.
[Originaloutput, Eingabeidentitäten und Grenzen](release-evidence/flh04-snapshot-purchase-evidence-local-2026-11-13.json).
Keine aktiveIntegration/Apply/Krypto-/Native-/CI-/Release-/Produktionsabnahme.
Preis-Historybeleg bleibt gepinnt erhalten; keine Addition historischerTests.
