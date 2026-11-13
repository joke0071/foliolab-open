# FLH04 credential-free snapshot gate — bounded canonical histories and UH02 v5

## Current scope · 13.11.2026

Canonical accepted BTC/ETH/SOL sessions and separate canonical CSV/user-confirmed
provider priceHistories are supported losslessly under the dated slices below.
Canonical v3/v4 purchase receipts/decisions are additionally supported by the dated
Purchase-Evidence slice below. The dated UH02-v5 slice additionally supports the complete
canonical purchase/undo economic chain with its import and Ledger provenance.
The dated CSV-cash, manual EUR-cash management and complete native USD-principal
slices below additionally preserve their full active/permanent-removal provenance.
The dated ETH-staking slice additionally supports complete principal and
reward+fee groups with their permanent original-group withdrawal chains.
Ledger-only v5, other import/management/withdrawal/bridge evidence and pending/resume
remain unsupported in full. Earlier empty-only price-history statements below describe
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


## Vollständiger UH02-v5-Snapshotumfang · vor Code · 13.11.2026

Owner work-dedcfdccd449-20261113; Basis3429b9c0faecf7e5febd950f840b43a8f4c2605d.
Abgleich N-DRIVE/Übergabe8: safeImport liest PurchaseEvidence/History, validiert ImportSource,
Journal/Opening/Bestandsaudit, ruft validateUnifiedBitcoinEconomics und alle bestehenden
Withdrawal-/Bridge-/Flatexvalidatoren und abschließend assertDataVersion auf.
assertDataVersion verlangt echte geschützte v5-Inhalte; kein bloßes Versionsflag.
UH02-Käufe verbinden Receipts, Wallet-Scope, Eventfingerprints, Ledgerreferenzen,
bookingOwnership, Null-Mengenjournal und genau einen externen Finanzierungsflow.
Undo erhält Belege und eine permanente uh02-undo-Tombstone. Diese vorhandene reine
Wirtschaftskette ist unabhängig von gesperrtem Kryptocode und vollständig prüfbar.

Kleinster vollständiger Umfang: kanonische v5-UH02-Käufe und ihre Undo-Tombstones,
mit sämtlicher erforderlicher vorhandener Receipt-/Decision-/Ledger-/Importherkunft,
History soweit vorhanden, Journal, unveränderten Beständen und Finanzierungsflows.
Erforderlich mindestens ein bestehender UH02-Kauf-/Undo-Journaleintrag; reines gefülltes
Ledger ohne wirtschaftliche Kette bleibt unsupported. Keine allgemeine v5-Freigabe.
Andere ImportSource-Namensräume, Management/Withdrawal/Bridge/Flatexnetto/Resume
bleiben ganz unsupported. Keine Validator-/Versionsguardänderung.

Ergänzung allein in src/sync-snapshot.js: v5-Format innerhalb dieses Scopes;
rekursiv geschlossene UH02-importSource-Allowlist, einschließlich JSON-kodierter
sourcePayload-Fakten (walletScopeDigest/facts receipts+events/ledgerRefs).
Die payload-Zeichenfolge muss selbst kanonisch kompakt und strukturell begrenzt
sein; unbekannte Schlüssel, Credentials, doppelte JSON-Felder, Unicode und
normalisierende Kodierung blockieren. ownedSnapshot bleibt exakter bestehender
bookingOwnership-String, durch validateUnifiedBitcoinEconomics/sourceUnmodified
an exakt allowlistetes Booking/Journal gebunden; kein freies JSON-Datentunneln.
Kein zweiter ökonomischer Validator, keine neue Import-/Eigentumsbestätigung.

Erfolg: Kauf mit/ohne Ledger, N:M, Quellenreihenfolgen, dokumentierte fehlende History,
Undo und vorhandenes Archiv, Koexistenz PreisHistory/UNKNOWN/Decimal/Null bleiben
vollständig unverändert auf Encoder/Decoder; Reimport bleibt wirtschaftlich einmalig.
Ablehnung: fehlende/inkonsistente Quelle/Receipt/Journal/Flow/Walletbindung,
Wirtschaftsänderung, stille Normalisierung, unbekannte nested/JSON-Stringfelder,
Versionsdowngrade/leeres v5/isoliertesLedger, fremde Import-/Belegketten und Budgets.
Jeder Fehler blockiert ganz ohne Quellmutation. Bestehende Validatoren wiederverwenden.
Snapshot1/3500000UTF8Bytes/100000Werte/Tiefe16 unverändert.
Neue gerichtete Suite tests/sync-snapshot-v5-bitcoin.test.mjs; betroffene bestehende
Snapshottests plus bestehende UH02-Tests gezielt prüfen. Gültige historische Belege
wiederverwenden, keine unveränderten CSV-/Purchase-Validatorzahlen addieren.
Kryptopaket unverändert; Impact nur nachgelagerte Snapshotabdeckung gegen Kandidat
17a5a190d472f1f07b3508e6f35194371fe95eb2, keine pauschale Freigabe. Keine aktive
Sync-/Anker-/Storage-/Outbox-/Appänderung, native/CI/Releasegates bleiben offen.

### UH02: tatsächlicher Implementierungs- und Prüfabschluss

Geschlossene UH02-importSource-/sourcePayload-/facts-/event-Allowlist und enges
v5-Scopekriterium implementiert. Reines Ledger ohne UH02-Journal bleibt unsupported.
Vorhandene Semantikvalidatoren unverändert, keine zweite Wirtschaftsengine.
Ein direkt belegter Vergleichsfehler war für kanonische BTC-Wallets zusätzlich nötig:
createPosition erzeugt eigene undefined chainId/addressType-Felder, die kein JSON
transportiert. Der unverändernde Vergleich ignoriert ausschließlich zusätzliche
undefined-Projektionsschlüssel. Jeder ursprüngliche JSON-Schlüssel und Wert muss
weiter identisch sein; null statt Abwesenheit und echte Default-/Normalisierungs-
änderungen bleiben abgewiesen. Keine Quellmutation/Verwerfung transportierbarer Daten.

Final90PASS/0FAIL/0SKIP/0CANCELLED/Exit0 auf Node24.22.1:
21Snapshot+9Gap+10WalletHistory+11PriceHistory+12PurchaseSnapshot+17UH02Snapshot+
10bestehendeUH02. Syntax2PASS. Alle bestehenden Tests unverändert; geschlossene
Scopeprüfung liegt auch im Envelope-Schema und erhält bisherige Ablehnungswege.
75ursprüngliche Paket-/Quell-/Testeingaben blobgenau identifiziert,74nachCode
unverändert, nur src/sync-snapshot.js geändert plus neueSuite.
[Originaloutput, Eingaben und Erstbefunde](release-evidence/flh04-snapshot-v5-bitcoin-local-2026-11-13.json).

Erstprobe deckte undefined-Projektionsschlüssel auf; isolierteSuite erst15/2,
dann16/1 (Stalefixture hatte geänderten Blockhash ohne passenden Tip/Canonicalisierung;
Preisfixture hatte falsches CSV-Label/nur1Punkt). Fixtures an vorhandene Verträge
angepasst. Erster gemeinsamerLauf87/3:2alteEnvelope-Fehlererwartungen nach Schema-
erweiterung und1zuenge erwarteteStaleFehlerstelle. Scopeprüfung ins gemeinsame
Schema verschoben statt bestehende Assertions zu lockern; Staleprobe ohne neuen
Ledger-Reimport löst gezielt altenFingerprintkonflikt aus. Zweiter gemeinsamer89/1:
neue isolierteLedger-Probe erwartete Decoder-Unsupported statt Envelope; nur diese
neue Erwartung auf bestehende Encoder-/Decoderfehler abgestimmt. Final90/0.
Originale beider gemeinsamerFehlläufe erhalten; keine Budget-/Timeoutlockerung.

Gültige bisherige Preis-/Purchase-/Historybelege bleiben unverändert. Wegen globaler
dataSchema-/Vergleichsauswirkung alle fünf betroffenen Snapshot-Suiten erneut;
10UH02-Semantiktests aufgrund neuer Nutzung gezielt. Historische CSV-/Purchase-
Validatorbelege nicht pauschal wiederholt/addiert. Begrenzte Implementierung
vollständig, gezielte interne Nodeverifikation bestanden; FLH04NOTDONE,
OutboxINTERNUNQUALIFIZIERT/N-DRIVEBLOCKED_EXTERNAL mit internem/externalemRest.
Keine nativeBrowser/IDB/CryptoKey/Reopen/Mehrtab/echterCrash/realeQuota/Recovery/
CI22/Wallet20/Geräte/PR/Main/Produktions-/externeAbnahme oder aktiveIntegration.
Kryptoreview/Keyslotrace/A1/A2/prepared-locked/Budgets/Releasegates unverändert.

## Generische CSV-EUR-Cashkette · vor Code · 13.11.2026

Owner work-f1798d3a9454-20261113; Basis4876bf0e6af9757e1c9b602d953ca5d25fac2d84.
Vorhanden: validateImportSource prüft Herkunft, provenCashImport bindet exakt die
sechs generischen Geldereignisse deposit/withdraw/dividend/interest/fee/tax an
Quellzeile, bookingOwnership, Fingerprint und Journal. validateJournalEntry prüft
Remove-v2 samt Originalbooking/-journal/-flows; removedImportSources verhindert
Wiederanlage. prepareBookingUndo bleibt exakter lokaler Preimage-/Receiptvertrag.
Fehlend ist nur verlustfreie Snapshotabdeckung dieses vollständigen Belegablaufs.

Kleinster vollständiger Scope: kanonische generic-csv-Geldbuchungen, die bestehenden
provenCashImport erfüllen, plus ausschließlich reine importierte Remove-v2-Audits
derselben Klasse mit allen originals und null-afterBookings. Auch gebündelte
Rücknahme und Koexistenz bisher unterstützter v3/v4/UH02-v5-Inhalte gehören dazu.
Kein allgemeines CSV, manuelle Edit-/Notiz-/Remove-v1-Historie, Misch-Audit,
Broker-/Native-/Withdrawal-/Bridge-/pending-/Resume-Scope. Kein neuer Finanzkern,
keine Importfreigabe oder Eigentums-/Zustimmungsentscheidung. Snapshot transportiert
keine flüchtigen Undo-Receipts; bereits vorhandener Receipt funktioniert nur bei
weiterhin exakt identischem Modell, niemals durch neue Snapshotautorität.

Geschlossene generic-csv-importSource-Allowlist und kompakte kanonische JSON-
sourcePayload-Zeile (type/date/positionId/quantity/unitPrice/feeEUR/taxEUR/fxRate/
cashPositionId/notes/externalId), strikt Stringfelder. ownedSnapshot bleibt exakt
an bookingOwnership durch provenCashImport gebunden. Audit/Originalbooking/-journal/
-flow rekursiv geschlossen; keine rekursiven Managementaudits in Originals.
safeImport/validateImportSource/provenCashImport/Journal-/Reimport-/Undo-Validatoren
unverändert wiederverwenden. Vollständig unverändernder Vergleich bleibt Pflicht.

Erfolg: alle sechs Ereignisklassen hin/zurück, aktive und gelöschte Herkunft,
gebündelte Rücknahme, sichere Reimportduplikate/gelöschte Quellkonflikte, vorhandenes
lokales Undo, Archiv und UH02-Koexistenz. Sämtliche IDs/Quellbytes/Decimale/null/
Abwesenheiten/UNKNOWN unverändert. Kein stiller Verlust von Audit/Rücknahmeherkunft.
Ablehnung Encoder UND Decoder: fremde Quellen/Typen, unbekannte Felder an jeder
Ebene oder in JSON-Strings, nichtkanonische Payloads/Normalisierung, manipulierte
Ownership/Fingerprint/Journal/Flüsse, abgeschnittene oder gemischte Audits,
Budgetüberschreitungen. Ein Fehler blockiert ganz ohne Quellmutation/Pruning.
Snapshot1/3500000UTF8Bytes/100000Werte/Tiefe16 unverändert.

Dateien: src/sync-snapshot.js; neue tests/sync-snapshot-csv-cash.test.mjs;
bestehender Vertrag/Fachcheckpoint und gezielter lokaler Prüfbeleg. Bestehende
Tests unverändert; betroffene Snapshot-Suiten und vorhandene import-cash-removal-
Suite prüfen. Gültige weitere Validatorbelege nicht neu addieren.
Kryptoimpact zum exakten Kandidaten17a5a190d472f1f07b3508e6f35194371fe95eb2:
nachgelagerte Snapshotfeldabdeckung, keine Änderung seiner Byte-/Autoritätsverträge
oder Selbstfreigabe. REVIEW_READY/EXTERNAL_REVIEW_PENDING unverändert.
Keine Storage-/Outbox-/Anker-/Krypto-/Appintegration oder aktiveSync.
NativePersistenz/Keyslotrace/CI/Release/externeGates bleiben offen.

### Generische Cashkette: tatsächlicher Implementierungs- und Prüfabschluss

Geschlossene generic-csv-sourcePayload-/importSource- und Remove-v2-Audit-
Originalbooking/-journal/-flow-Allowlist implementiert; bestehendes provenCashImport
bindet Quelle/Ownership/Fingerprint/Journal. safeImport/alle Fachvalidatoren unverändert.
Nur sechs belegte EUR-Geldereignisse und reine importierte Remove-v2-Audits,
keine generische Trade-/Broker-/manuelle oder gemischte Managementfreigabe.
Sämtliche kanonischen JSON-Werte bleiben unverändert; Settings weiterhin ausgeschlossen.
Bisherige UH02-v5-/Purchase-/Preis-/Wallet-History-Verträge und Budgets erhalten.

99gezielteNode24.22.1TestsPASS/0FAIL/0SKIP/0CANCELLED/Exit0:
80bestehendeSnapshot+11neueCSVSnapshot+8bestehendeCashRemoval. Syntax2PASS.
75ursprünglicheEingaben blobgenau;74nachCodeunverändert, nurSnapshotmodul geändert.
Alle bestehenden Tests unverändert; Wiederholung wegen gemeinsamemSchema/CSV-
Rücknahmevertrag, keine historischenTestadditionen.
[Originaloutputs/Eingabeidentitäten](release-evidence/flh04-snapshot-csv-cash-local-2026-11-13.json).

Erster isolierterLauf10PASS/1FAIL: neue Undoerwartung nach safeImport war zu weit.
PersistenterAudit wird vollständig transportiert; flüchtigerUndoReceipt wird nicht
portiert. BestehendesUndo verlangt weiterhin exakt gleiche Modellbytes; lokalesUndo
besteht, nach nicht byteidentischerRekonstruktion bleibt es gesperrt. KeineProdukt-
oderGuardänderung dafür. Erster gemeinsamerLauf98PASS/1FAIL: unvollständigesAudit
passierte neue optionaleFeldallowlist bis bestehendemJournalfehler, alteDecoder-
Envelopeassertion bliebstreng. Pflicht-v2/Remove-/nichtleereOriginals-Scopeprüfung
vorSchemaannahme korrigiert; Final99/0, keinbestehenderTest/Timeout/Budgetgelockert.
Beide ursprünglichen Fehleroutputs vollständig erhalten.

BegrenzteImplementierungvollständig/gezielteinterneNodeprüfungbestanden.
KeineBrowser/IDB/CryptoKeyPersistenz/Reopen/Mehrtab/echterCrash/realeQuota/Recovery/
CI22/Wallet20/Geräte/PR/Main/Produktions-/externeAbnahme. KeineaktiveIntegration.
Kryptokandidat17a5a190d472f1f07b3508e6f35194371fe95eb2 exakt alsComparebasis
verwendet: nur nachgelagerte Snapshotabdeckung/Belege, keineByte-/Autoritätscode-
freigabe; Reviewpaketfd3fce4b bleibtREVIEW_READY/EXTERNAL_REVIEW_PENDING.
Keyslotrace/A1/A2/prepared-locked/Identitätsschutz/alleReleasegatesoffen.
FLH04NOTDONE/OutboxINTERNUNQUALIFIZIERT/N-DRIVEBLOCKED_EXTERNAL mitinternem/externalemRest.

## Manueller EUR-Cash-Managementablauf · vor Code · 13.11.2026

Owner work-f1798d3a9454-20261113; Basisce5ab5967faaf997e336f46041074a8e9ee4ac02.
Prozessänderungen7e5139c86e35ecf1559b359489acf35d13758f64 selektiv auf frischen
ZentralHEAD übernommen (285ed13489c0e64fd5196868d64592deed72b304); nur zwei Pläne,
gepinnt byte-/blobgeprüft, kein neuer CI-/Chat-/Releasezyklus.

Fehlendes fachliches Abschlusskriterium dieses nächsten vollständigen Ablaufs:
vorhandene manuelle EUR-Cash-Notiz/Korrektur/Rücknahme mit sämtlichen v1-Audits,
Originalbookings/-journal/-flows und afterBookings verlustfrei transportieren und
nach Restore dieselben bestehenden Folgeänderungs-/Undo-/Stalegrenzen erhalten.
Vorhanden: booking-management erzeugt diese Belege; validateJournalEntry/safeImport
lesen sie, bestehende booking-management-changes-Suite prüft alle sechs Geldarten,
Korrektur/Notiz/Mehrfachrücknahme/fortgesetzte Änderungshistorie und strikte Guards.
Fehlend: geschlossene Snapshotabdeckung, nicht neuer Verwaltungscode.

Kleinster vollständiger Scope: diese bestehenden v1-Managementketten für
deposit/withdraw/dividend/interest/fee/tax auf weiterhin vorhandenen eigenen EUR-
Cashpositionen. Notes/Edit haben vollständige manuelle afterBookings; Remove hat
null. Originaljournal nur bestehendes einfaches manual-Journal, keine rekursiven
Audits oder Import-/Fingerprintherkunft. Reine v2-generic-csv-Remove-Belege bleiben
getrennt unverändert unterstützt; gemischte v2-Audits weiterunsupported. Bestehende
Validatoren und unverändernder Vergleich bleiben unverändert. Keine neue Mutation,
Eigentumsbestätigung, Autorität, Reimport-/Undoengine oder Projektion/Default.

Erfolg: alle6Geldarten×3Aktionen, Betrag/Datum/Notiz/ID/Reihenfolge/Kapitalflüsse,
gebündelteRücknahme, aufeinanderfolgendeEdit→Notes→Remove-Historie, alte lokaleUndo-
Preimagegrenze, Archiv/UNKNOWN und bisherigeImportbelege. Snapshotportiertkeinen
flüchtigenUndoReceipt. Ein veralteter/mehrdeutigerAuditbezug gewinnt keine neue
Berechtigung; bestehendeFolgeänderungsprüfung bleibtentscheidend.
AblehnungEncoderUNDDecoder: unbekannteFelder/Credentials anAudit/Original/
Booking/Journal/Posting/Flow/afterBookings, fremdeImportherkunft, falscheVersion/
Aktion/afterForm/Originalstruktur, GeldwirkungimAudit undScopefremdeTrade-/FX-/
Wallet-/Positionenketten. GanzerPayloadscheitert,keinPruning. Budgets unverändert.
Dateien: Snapshotmodul, neue sync-snapshot-management.test.mjs, bestehenderVertrag/
Fachcheckpoint/Prüfbeleg. BestehendeSnapshot-/CSVTestsunverändert; neueAbdeckungund
vorhandenebooking-management-changes gezielt prüfen.

Bezug zum tatsächlichen FLH04-Abschluss: diese Implementierung schließt nur den
genannten Portfolioablauf, keineEndlossammelfreigabe. VollständigeSnapshotabdeckung
übrigerbereitsgespeicherterImport-/Bridge-/Withdrawal-/Flatex-/Resumezustände bleibt
offen; unknown/unsupportedvollständigabweisen. Separat ungelöst ist die atomare
Bindung credentialfreierSnapshotbytes an originale lokaleRaw-/Revision-/Keyslot-
Preimages: sync-outbox-state vergleicht noch portfolio.raw mit verifiziertem
Payload, Storage.confirm gesperrt/planApply.applyAuthorized=false. Snapshotmodul
hier NICHT anOutbox/Storage/Apply anschließen oder Rawidentität umdeuten.
Für interneVollabnahme braucht es den geschlossenenRaw-/Payload-/CryptoKey-CAS-
Vertrag und echte Persistenz/Reopen/Mehrtab/Crash/Quota-Prüfungen. Hauptowner muss
dafür vorhandeneHarnesses in tatsächlich zulässiger geeigneterUmgebung ausführen;
bekannteunveränderteFehlstarts nichtwiederholen. Für reviewgesperrtenCode muss
Jochen den unabhängigen qualifiziertenPrüfer und nötigenZugang/Budget bestimmen;
bestehendesPaketfd3fce4b/exakterKandidat17a5a190d472f1f07b3508e6f35194371fe95eb2
wiederverwenden, keineSelbstfreigabe/externeBeauftragung. Ohne tatsächlichen
einschlägigenReviewabschluss weiterkeinWrap-/Signatur-/Aussteller-/Entsperrcode.
MainbefundgeparktbisneuerbegründeterHypothese/geänderterVoraussetzungundkonkretem
reviewbarenKandidaten;neueAusführungsentscheidungdurchJochen,KEinblindRetry.
Alleübrigeninternen/externenGeräte-/OAuth-/CI-/Releasegatesweiteroffen.

### Manueller Cash-Managementablauf: tatsächlich geprüft

Geschlossene v1-Managementaudit-/Original-/afterBooking-Allowlist für vorhandene
manuelle EUR-Cash-Notiz/Korrektur/Rücknahme implementiert. Importiertev2-Remove-
Audits bleibenreinundunverändert;keinegemischteoderallgemeineManagementfreigabe.
Vorhandene validateJournalEntry/safeImport/Management-/Undo-Validatoren unverändert.
Vollständige mehrstufigeEdit→Edit→Notes→Remove-Ketten überSnapshot/Restore weiter
bedienbar;mehrereKonten/gebündelteRücknahme/monotoneSequenz/Archiv/UNKNOWN/
großeDecimalwerteundKoexistenzgenerischerCSV-Auditsgeprüft. StaleaktuelleBuchung
bleibtexaktdokumentiertundblockiertweiterFolgeänderungen;keineneueAutorität.
FlüchtigeUndoReceiptsweiterkeinSnapshotinhalt;identischelokalePreimagesPflicht.

Isoliert9PASS/0FAIL; finalgemeinsam123PASS/0FAIL/0SKIP/0CANCELLED/Exit0 aufNode24.22.1:
91bestehendeSnapshotinklusiveCSV+9neueManagementSnapshot+8bestehendeCashRemoval+
15bestehendeManagementChanges. Syntax2PASS. KeinebestehendenTestsgeändert.
78ursprünglichePaket-/Quell-/Testeingabenblobgenau;77nachCodeunverändert,
nurSnapshotmodulgeändert. KeineursprünglichenFehlläufeindiesemFolgeschnitt.
[OriginaloutputsundEingaben](release-evidence/flh04-snapshot-management-local-2026-11-13.json).
GezielteinterneVerifikationbestanden;keineVollabnahme/aktiveIntegration.

OffeneAbschlussbeiträgebleibenkonkretwiezuvor: Hauptowner mussRaw-/Payload-/
CryptoKey-CAS-VertraggeschlossenbearbeitenundnativeHarnessesinbelegbargeeigneter
zulässigerUmgebungaustesten;JochenbestimmtunabhängigenqualifiziertenKryptoprüfer
undggfZugang/BudgetfürdasbestehendePaket. MainbefundnurmitneuerHypothese/
geänderterVoraussetzungundkonkretemreviewbarenKandidatenzurAusführungsentscheidung.
KeineWrap-/Signatur-/Aussteller-/EntsperrimplementierungoderSelbstfreigabe.
N-DRIVEBLOCKED_EXTERNALmitinternem/externalemRest,FLH04NOTDONE,
OutboxINTERNUNQUALIFIZIERT. A1/A2/prepared-locked/alleBudgetsundGatesunverändert.

## Vollständige Kraken-USD-Principal-Snapshotkette · vor Code · 13.11.2026

Owner work-3de59b8f2b9b-20261113; Basis d2b4325d6fc8275b8e3dcc248df01516fa4a8ec2.
Vorhanden: validateUnpricedUSDTransfers bindet vollständige aktive Herkunft/Ownership,
zwei eigene USD-Cashkonten, UNKNOWN-Journal und exakte native Principalmenge.
validateKrakenWithdrawals bindet dauerhafte uh03-undo-Originale samt Digest, Journal,
Quellpayload und Wiederanlagesperre. Acht bestehende Principaltests unverändert PASS.
Repro: Encoder weist aktive UND zurückgenommene vollständige Fixture ab.
assertDataVersion/hasFlatexNetState verlangen hier v5 MIT flatexNetRemovals=[].
Marker löschen oder Version herabsetzen scheitert; keine Versionsumgehung zulässig.

Fehlendes Abschlusskriterium: diesen ganzen vorhandenen Nutzerablauf verlustfrei
transportieren, nach Restore gleichen Reimport-/Rücknahme-/UNKNOWN-Schutz erhalten.
Enger Scope: genau kraken-uh03-v1 Transfer mit unpriced-native-usd-principal,
geschlossene kanonische JSON-sourcePayload(group,payload,bindings,action), vollständige
Ownership, Originalbookings/-journal/flows und dauerhafter uh03-undo-Digest.
Bindings genau zwei Stringpaare, action ausschließlich die vorhandenen Principal-
Transferfelder; keine opaque Erweiterung/Credentials oder Bridgevariante.
Originale ausschließlich dieser Principalrolle; kein beliebiger Kraken-Withdrawal.
Leerer flatexNetRemovals-Marker wird nur mit dieser vollständigen aktiven oder
dauerhaft zurückgenommenen Kette erhalten; gefüllter Flatexzustand bleibt unsupported.
v5 braucht wie bisher die komplette UH02-Kette ODER diesen vollständigen Principal-
Ablauf samt Marker, nie Ledger-only/Marker-only. Keine pauschale v5-/Krakenfreigabe.
Bestehende safeImport/assertDataVersion/Import-/Journal-/Withdrawalvalidatoren sowie
vollständiger unverändernder Vergleich bleiben unverändert, keine Defaults/Pruning.

Erfolg: aktive Quelle→Snapshot→Restore→Reimportduplikat→Originalgruppenrücknahme→
Snapshot→Restore→dauerhafte Wiederanlagesperre, Originale/Digest bytegleich, 18Decimal/
UNKNOWN/kein externer Fluss, Archiv und zulässige UH02-/CSV-/Managementkoexistenz.
Lokales CSV-Undo weiterhin nur mit exakt identischem Modellpreimage; Snapshot
portiert keine flüchtigen Receipts oder neue Autorität. Bekannter aktueller FX kann
historisches UNKNOWN nicht verändern. Ablehnung Encoder UND Decoder: unbekannte
Felder jeder Ebene einschließlich eingebettetem JSON/Ownership, fehlende Herkunft/
Originale/Marker, gefüllter Flatexzustand, falsche Rollen/FX/Journal/Bindings/Menge,
Digeständerung/Verlust, aktive und entfernte Duplikate, andere Kraken-/Bridgeklassen.
Ein Fehler blockiert ganz ohne Quellmutation; bestehende Budgets unverändert.

Dateien: src/sync-snapshot.js; neue tests/sync-snapshot-usd-principal.test.mjs;
bestehender Snapshotvertrag/Fachcheckpoint und neuer lokaler Prüfbeleg.
Alle vorhandenen Tests unverändert; betroffene Snapshots und bestehende acht
Kraken-Principaltests gemeinsam prüfen; vorhandenen Decimal100-Oracle wiederverwenden.
Kryptoimpact gegen exakten Kandidaten17a5a190d472f1f07b3508e6f35194371fe95eb2:
ausschließlich nachgelagerte Snapshotabdeckung, keine Byte-/Autoritätsfreigabe.

Integration bleibt separat offen: originale lokale Raw-/Revision-/CryptoKey-
Preimages müssen credentialfreie Payloadbytes geschlossen atomar binden.
Kein Anschluss an sync-outbox-state/Storage/Apply, kein Umdeuten der Rawidentität.
Hauptowner bearbeitet diesen CAS-Vertrag und ordnet vorhandene native Harnesses
einer nachweislich geeigneten zulässigen Umgebung zu; Persistenz/Reopen/Mehrtab/
Prozesscrash/realeQuota/Recovery getrennt nachweisen. Bekannte Fehlstarts nicht
wiederholen. Jochen bestimmt unabhängigen qualifizierten Kryptoprüfer und ggf.
Zugang/Budget für bestehendes Paketfd3fce4b; erst gültiger einschlägiger Abschluss
erfüllt das Gate. Kein Wrap-/Signatur-/Aussteller-/Entsperrcode/Selbstfreigabe.
Mainbefund nur bei neuer Hypothese/geänderter Voraussetzung und konkretem reviewbarem
Kandidaten zur Ausführungsentscheidung; kein Retry/Runner/Workflow/PR/Merge/Release/
SW-Bump/aktiveSync. A1/A2/prepared-locked/Identitäts-/DB-/Budgetgrenzen unverändert.
FLH04NOTDONE/OutboxINTERNUNQUALIFIZIERT/N-DRIVEBLOCKED_EXTERNAL intern UND extern.

### USD-Principal: tatsächlicher Implementierungs- und Prüfabschluss

Vollständige kanonische aktive und dauerhafte uh03-undo-Kette verlustfrei unterstützt,
mit geschlossenem group/payload/bindings/action-JSON, Ownership, allen Originalen,
Digest, UNKNOWN und unverändertem v5/leerem flatexNetRemovals-Marker.
Marker-only, gefüllter Flatexzustand, andere Krakenrollen/Bridges bleiben unsupported.
Keine Änderung bestehender Finanz-/Import-/Journal-/Withdrawal-/Versionsvalidatoren.
Aktiv→Snapshot→Restore→Duplikat→Originalgruppenrücknahme→Snapshot→Restore→dauerhafte
Wiederanlagesperre geprüft. Aktuelles FX ersetzt kein historisches UNKNOWN.
UH02-Kauf-/CSV-Remove-/manuelle Management-/Archivkoexistenz und striktes lokales
Undo-Preimage geprüft; kein Receipttransport/keine neue Autorität.

Final gemeinsam121PASS/0FAIL/0SKIP/0CANCELLED/Exit0,Node24.22.1,Syntax2PASS:
100bestehendeSnapshot+13neuePrincipalSnapshot+8bestehendeKrakenPrincipal.
93Originaleingabenblobgenau;92nachCodeunverändert, nurSnapshotmodul geändert.
Keine bestehenden Tests geändert; keine historischen Testzahlen addiert.
Erster isolierter Lauf11/2: neue zusammengesetzte UH02-Fixture hatte doppelte
Journalsequenz; neue Managementfixture wählte mit at(-1) die alte Krakenbuchung
statt der vom Transaktionskern zurückgegebenen neuen Buchungs-ID. Fixtures über
bestehende APIs erzeugt und über konkrete Herkunft/IDs ausgewählt, keine Guards/
Validatoren/Assertions gelockert. Danach isoliert13/0, gemeinsam121/0.
[Originaloutputs und Eingabeidentitäten](release-evidence/flh04-snapshot-usd-principal-local-2026-11-13.json).

Begrenzte Implementierung vollständig/gezielte interne Nodeverifikation bestanden;
keine Browser-/IDB-/CryptoKey-/Reopen-/Mehrtab-/Prozesscrash-/realeQuota-/Recovery-/
CI22-/Wallet20-/Geräte-/PR-/Main-/Produktions-/externeAbnahme und keine Integration.
Kryptoimpact zum exakten Kandidaten17a5a190d472f1f07b3508e6f35194371fe95eb2:
nur nachgelagerte Snapshotabdeckung/Tests/Belege; unverändertes Reviewpaketfd3fce4b
REVIEW_READY/EXTERNAL_REVIEW_PENDING. Kein Wrap-/Signatur-/Aussteller-/Entsperrcode.
Raw-/Payload-/CryptoKey-CAS-Integration und alle zuvor konkret zugeordneten
Abnahmewege/Gates bleiben offen. FLH04NOTDONE/OutboxINTERNUNQUALIFIZIERT/
N-DRIVEBLOCKED_EXTERNAL mit internem UND externem Rest.

## Raw-/Payload-/CryptoKey-CAS: Integrationsvertrag und verbleibende Sperre · 13.11.2026

work-0c5363d0ea74-20261113, Produktbasis 920debdad089b085f21f3fc5ca0c84a27577b22b.
Dies konkretisiert die komplette erforderliche Bindung; **keine gelöste
CryptoKey-CAS, kein Integrations-/Aussteller-/Entsperrcode und keine Abnahme**.
Die bisherigen Rawgleichheitsguards bleiben unverändert. Der bestehende
Ausstellervertrag Abschnitt4 verbietet Cryptoawait in einer IDB-Transaktion.

**Ein Erfassungsversuch bindet einen vollständigen Originalzustand P:**
Vorhandensein (count, auch belegtes undefined/null), vollständigen
Portfolio-Record einschließlich schemaVersion/revision/raw/settings/deleted/
updatedAt/syncEnrollmentRequired samt Feldpräsenz; vollständige Outbox inklusive
Version/disabled/Ankerkette/allen Frames; vollständigen lokalen Anker inklusive
Status/Lifecycle/Identitäten/Autoritäts-/Mitgliedschafts-/Wrapreferenzen und aller
Keyslots einschließlich Schlüsselmaterial, Algorithmus, extractable und usages.
Nicht-JSON-Werte und unbekannte Feldformen sind kein stiller JSON-Vergleich:
unqualifizierte Formen blockieren ganz. Private Credentials bleiben ausschließlich
im lokalen Preimage; weder P noch dessen Digest werden protokolliert/transportiert.

**Exakte Ableitung:** S=createSyncSnapshot(P.portfolio.raw), D=SHA256(UTF8(S)).
Kein record.settings, kein Backupobjekt und keine spätere Rawfassung als Quelle.
Originalraw R und S bleiben verschiedene Bytefolgen; Descriptor.payloadDigest
muss exakt D sein und der verifizierte Frame exakt S enthalten. P, R, S, D,
vollständiger Descriptor, lokale Erfassungsrevision, exakter Frame und Schlüssel-
/Mitgliedschaftskontext müssen durch einen privat erzeugten flüchtigen Beleg
gebunden werden; kein Caller-JSON/verified-Flag und kein serialisierter Beleg.
Unveränderliche Kopien vor dem ersten Cryptoawait, keine Mutation der Quelle.
Jeder Cryptoawait (Snapshotdigest, Validierung, Frameprüfung, Keykohärenz,
Signatur/Wrapprüfung im später reviewten Pfad) liegt innerhalb desselben
Erfassungsversuchs und entwertet bei irgendeiner Preimageänderung den Versuch.

**Wurzel/Nachfolger/Retry:** neue Wurzel nur nach eigenständig gültigem Enrollment,
exakter Portfolio-/Epoche-/Writerzuordnung und abwesender Outbox; prepared-locked
ist niemals ein solches Enrollment. Nachfolger nur an exakt letztem lokalen
Descriptor und streng neuerem Portfolio-CAS, vollständige alte Outbox unverändert.
Retry nur identischer persistierter Frame mit seiner ursprünglichen
Erfassungsrevision und Bindung; niemals alten Frame an neuen CAS hängen, auch
wenn R oder S zufällig wieder gleich sind. Ein identischer S bei geänderten
lokalen settings ist keine Erlaubnis, das lokale Recordpreimage wegzulassen.

**Einziger Commit:** bestehende DB/Version/records; Portfolio, Outbox,
Anker-/Key-/Autoritätszustand im selben readwrite-Commit gegen P prüfen.
Alle Presencecounts und Werte müssen stimmen. Erst oncomplete macht den
Erfassungszustand dauerhaft; kein Senden davor. Abort/Quota lässt Originale
unverändert. Antwortverlust nach Commit bedeutet UNKNOWN-Ausgang: tatsächlich
gespeicherten Zustand erneut lesen, Frames und Bindung erneut verifizieren,
keine neue Revision oder Neuverschlüsselung als blinden Retry. Nach
Page-Reopen kein flüchtiger Beleg wiederhergestellt. confirmed/Remoteherkunft
und Finanz-Apply bleiben eigene gesperrte Verträge.

| Veränderung/Gegenprobe | Verbindlicher Ausgang |
| --- | --- |
| Gleicher CAS, anderes raw/settings/updatedAt/Sperrfeld oder Feldpräsenz | Ganzer Versuch verworfen, kein Commit/Send/Apply |
| Restore/Adoption/Tombstone/Recovery zwischen beliebigen Cryptoawaits | Bindung ungültig, Originaloutbox/-anker erhalten/gesperrt |
| Outbox/Anker fehlt versus belegtes undefined/null, zusätzliche/unbekannte Slots | Nicht gleichsetzen, vollständig blockieren |
| Keyslottausch bei gleichen JSON-/Lifecycle-/Envelopebytes | Muss blockieren; aktueller Vergleich kann dies NICHT beweisen |
| Identische Attribute, anderer HKDF-/Writerkey; IDB-Klon mit neuer JS-Identität | Metadaten bzw. Objektidentität sind kein vollständiger Schlüssel-CAS |
| Parallelversuch/älterer Parent/alter Frame an neuerer CAS | Höchstens passender atomarer Nachfolger, sonst blockieren |
| Aktuelles FX, normalisierende Importprojektion, unknown/unsupported Snapshot | Kein historischer Ersatzwert/Teilpayload |
| Commit erfolgt, Rückgabe verloren; später neuer lokaler Save | Alten persistierten Versuch rekonstruieren, neueren CAS nicht bestätigen |

**Konkrete ungelöste Voraussetzung:** Kryptochallenge vor dem Commit beweist
Keykohärenz nur zum Challengezeitpunkt. Erneutes JSONlesen schließt den
anschließenden Keyslottausch nicht. Der aktuelle prepared-locked-Record enthält
nicht exportierbare CryptoKeys; count schützt allein dessen bisherige
Neuanlage gegen vorhandene Slots. Es gibt am Produktstand keinen qualifizierten
exklusiven Keyslotwriter-/Lebenszyklusmechanismus, der diese Racegrenze schließt.
Keine Keepalive-/Cryptoawait-Transaktion, zweite DB, DBVersionsänderung,
Ankerpromotion oder stiller Wechsel zu ausschließlich Envelopebytes als Lösung.
Daher **Integrationslösung weiterhin OFFEN/NOT_IMPLEMENTED**, nicht
„Vertrag geschlossen“ aus dieser Anforderungsmatrix ableiten.

Hauptowner: vorhandenen tests/browser-sync-outbox.mjs auf einer zulässigen
nativen Umgebung mit ausgewähltem Playwright-Browser und lokalem Testorigin
zuordnen. In dieser Sitzung Node24.22.1, Projektimport Playwright:
ERR_MODULE_NOT_FOUND; kein bekannter Browser-/AF_UNIX-Fehlstart wiederholt.
Der aktuelle Harness testet ursprüngliches Raw und PageReopen im selben
BrowserContext; nicht neue Snapshotintegration, Prozesscrash oder reale Quota.
Sollbeleg: exakter SHA/Tree, Engine/Version, vollständige erfolgreiche
CAS-/Presence-/Keyslotraces an JEDER Cryptoawaitgrenze und gespeicherter
Zustand nach Commit/Antwortverlust; Prozesscrash/realeQuota/Recovery separat.
Jochen bestimmt ggf. zugängliche geeignete Umgebung sowie den unabhängigen
qualifizierten Kryptoprüfer/Zugang/Budget. Bestehendes Paket fd3fce4b und
Kandidat17a5a190d472f1f07b3508e6f35194371fe95eb2 verwenden; keine neue
Beauftragung/Paketerstellung oder reviewgesperrte Implementierung.
Ohne nachgewiesene komplette Key-CAS keine Outboxanbindung.

## Vollständige Kraken-ETH-Stakingkette · Vorcode · 13.11.2026

Wegen der oben konkret ungelösten nativen Keyslotgrenze wird gemäß dem
autorisierten Ersatzpfad ein schon implementierter Portfolioablauf übernommen:
native ETH-Spot→Earn-Umbuchung, nachfolgender separater Earn-Reward samt
Kryptogebühr, Originalgruppenrücknahme in umgekehrter Reihenfolge und dauerhafte
Wiederanlagesperren. Wiederverwendung vorhandener kraken-import-/withdrawal-APIs,
Fixturen und unveränderter Finanz-/Ownership-/Journalvalidatoren.
Keine allgemeine Kraken-/Trade-/Bridge-/Fiat-/Flatexfreigabe.

Snapshotumfang: ausschließlich manuelle EUR-bewertete ETH-Kryptopositionen
(coinId ethereum, keine Walletverwaltung) mit unbekannter Kostenbasis.
Geschlossene kanonische JSON-sourcePayload group/payload/bindings/action:
64Hex-Gruppen-/Payloaddigests, ein/zwei explizite Streampositionbindungen;
nur transfer/reward/fee mit den bereits erzeugten neun/zehn string-Actionfeldern.
Booking-/Journaltypen und Quell-ID müssen passen; keine zusätzlichen Bridge-
/Trade-/Credentialsfelder. Ganze aktive Gruppe oder dauerhafter uh03-undo mit
vollständigen original bookings/journals/flows/Digest/count erhalten.
Bestehende USD-UNKNOWN-Principal- und UH02-v5-Semantik unverändert; leerer
Flatexmarker/v5 nur auf bereits erlaubter vollständiger Wirtschaftskette,
ETH allein kein neuer v5-/Flatexmarkergrund.

Erfolg: Aktiv→Snapshot→Restore→Reimportduplikat→Reward-/Fee-Gruppenrücknahme
→Snapshot→Restore→Principalrücknahme→Snapshot→Restore→dauerhafte Sperre beider
Gruppen. Exakte18Decimalmengen, unbekannte Gebühren-/Kostenwerte, Journal,
keine externen Flüsse, Archiv und Koexistenz mit vorhandenen vollständigen
Snapshotfamilien. Lokale flüchtige Undo-Receipts nicht übertragen; bestehende
CSV-Undo-/Management-/Gruppenabhängigkeitsguards unverändert.

Ablehnung Encoder UND Decoder: neue Felder in allen verschachtelten Originalen,
Sourcepayload/Action/Bindings/Ownership, nichtkanonisches JSON, geänderte
Originale/Digests, partielle oder veränderte Importgruppen und fremde
Trade-/Bridge-/Fiat-/andereCoin-/Walletfamilien. Unsupported blockiert den
gesamten Payload. Keine bestehenden Tests/Assertions/Validatoren ändern.
Dateien: Snapshotmodul, neue Stakingsnapshotsuite, dieser Vertrag,
Fachcheckpoint und Originalprüfbeleg; vor Umsetzung Vorcodecommit pinnen.
Snapshot1/3500000UTF8Bytes/100000Werte/Tiefe16 sowie A1/A2/prepared-locked
und alle nativen/externalen/CI-/Releasegates unverändert.

### ETH-Staking: tatsächlich implementiert und geprüft · 13.11.2026

Vorcodevertrag 807af8cabaf0ba2f44dcb51567643433ba30e328 /
Treee1c4ce29fe0e04246d0ada907a0561a79c7953d9; vollständige Bytes und
Gitblob4875264d10d48936cc199a5492fda0235c978ef5 bestätigt.
Geschlossene ETH-Principal-/Reward+Fee-Gruppen mit vollständiger aktiver und
dauerhafter uh03-undo-Herkunft implementiert. Gruppenprüfung bindet Quellpayload,
Ownership, konkrete Booking-/Journal-/Postingrelationen, Positionsscope und
vollständige Gegenbeine; kein alleinstehender Reward oder Fee als Teilgruppe.
Bestehende Finanz-/Import-/Journal-/Withdrawal-/Versionsvalidatoren unverändert.

Vollständige Folge geprüft: Aktiv→Snapshot→Restore→Reimportduplikate→zuerst
Reward/Fee-Gruppe zurücknehmen→Snapshot/Restore→Principal zurücknehmen→
Snapshot/Restore→beide Wiederanlagesperren, auch mit umgeordneten Quelldateizeilen.
18Decimal, null-Gebührenwerte/UNKNOWN-Kosten, keine externen Flüsse, Archiv,
lokale exakte CSV-Undo-Grenze, manuelles Cash und vorhandene USD-v5-Kette erhalten.
ETH allein autorisiert weiter weder v5 noch leeren/gefüllten Flatexmarker.

Finaler gemeinsamer Lauf Node24.22.1:
**143PASS/0FAIL/0SKIP/0CANCELLED/Exit0**, Syntax2PASS.
113 vorhandene Snapshottests +16 neue Stakingtests +14 bestehende
Kraken-Import-/Withdrawaltests. Erste isolierte15/0, nach zusätzlicher
wirtschaftlicher Gegenbeinprüfung16/0; keine Testfehler/gelockerten Assertions.
Nicht additiv zählen. 86Originaleingaben vorCode blobgenau,85 nachCode
unverändert; einziges bestehendes Produktdelta src/sync-snapshot.js.
[Originaloutputs und Eingabemanifest](release-evidence/flh04-snapshot-staking-local-2026-11-13.json).
Lokale Textkopien zunächst mit zusätzlichem Patchnewline erzeugt, vor jedem
Test durch exakte gepinnte Bytes ersetzt und unabhängig Gitblob-geprüft.

Raw-/Payload-/CryptoKey-CAS-Anforderungen oben konkretisiert, **Lösung weiterhin
OFFEN**: Keyslottausch nach Kryptochallenge ist mit Metadatenvergleich nicht
geschlossen. Keine Outbox-/Storage-/Anchor-/Applyanbindung oder -Guardlockerung.
Keine Browser/IDB/CryptoKeyPersistenz/PageReopen/Mehrtab/Prozesscrash/realeQuota/
Recovery/CI22/Wallet20/PR/Main/Produktions-/externeAbnahme.
Playwright-Projektimport ERR_MODULE_NOT_FOUND; kein Browserstart/keine Umgehung.
Kryptoreview EXTERNAL_REVIEW_PENDING am unveränderten exakten Kandidaten;
Snapshotimpact unter src nur sync-snapshot.js, keine Krypto-/Autoritätsfreigabe.

## Exklusiver Keyslot-/Writer-Lifecyclekandidat K1 · 13.11.2026

work-9df7d4dd8c06-20261113; gepinnte Produktbasis
3f79ad2d620723013621c861c0eb98f01589f1ca /
Tree359a87764cbf50ef9a2de82ea4b551505fdc1db1.
**KANDIDAT / NICHT IMPLEMENTIERT / NICHT QUALIFIZIERT.**
K1 ist konkret prüfbar, aber keine geschlossene CryptoKey-CAS-Lösung:
seine exklusive Writerabdeckung ist am Produktstand nicht durchgesetzt.
Die Ablehnungsmatrix oben und Ausstellervertrag Abschnitt4 bleiben unverändert.
Kein Architekturentscheid, keine neue Autorisierung und kein Kryptoreviewabschluss.

### Konkreter Mechanismus und Geltungsbereich

K1 untersucht EINEN exklusiven Web-Lock für die gesamte bestehende
foliolab-open-portfolio/records-Linie im selben Storage-Bucket, nicht pro Tab,
Writer-ID, Epoch-ID oder nachträglich aus dem Portfolio abgeleiteten wechselnden Namen.
Ein noch festzulegender konstanter interner Ressourcenname muss für alle
Keyslotbenutzer identisch sein; er ist keine Autorität und enthält keine Finanzdaten.
Alle beteiligten Fenster und Worker müssten denselben privaten Adapter verwenden.
Ein Keyslot-/Lifecyclevorgang erwirbt den Lock VOR dem ersten IDB-Read und hält ihn
durch sämtliche Cryptoawaits bis zum abgeschlossenen Commit bzw. dessen Klärung.
Crypto läuft zwischen kurzen IDB-Transaktionen, niemals innerhalb einer offenen
readwrite-Transaktion. Kein Polling/Keepalive/Lease/TTL/LocalStorage-Fallback,
kein Lock-steal und kein neuer Runner oder Store.

Der Adapter darf keine allgemeine withLock(callback)-, putKey-, callerKey- oder
unlock-API exponieren. Nur fachlich geschlossene Operationen und privat im
Lockcallback erzeugte flüchtige Fähigkeiten; nicht serialisierbar, keine frei
nachbaubaren Flags. Außen übergebene Objekte vor dem ersten Await vollständig
ablösen. Lockcallback wartet die gesamte interne Arbeit; keine abgetrennten Tasks,
keine frei ausführbaren Callbacks während der Schlüsselarbeit. Ein Wiederanlauf
erwirbt neu, liest neu, prüft neu und kann keinen alten Token reaktivieren.
Fehlende Web-Locks-Fähigkeit blockiert diesen Pfad, nicht die unabhängige lokale
Portfolioverwaltung. Lockbeobachtung per query() ist kein Besitzbeweis.

**Kerninvariante, die erst noch bewiesen werden muss:** Von der ersten vollständigen
Erfassung von P bis tx.oncomplete kann KEIN zulässiger Writer den tatsächlich
verwendeten Keyslot ersetzen, löschen oder umformen. Damit wäre Schlüsselidentität
durch qualifizierte Nichtmutation gebunden, nicht durch JSON/Lifecycle/Digest.
Die vorhandenen Challenges müssten weiterhin Material-/Attributkohärenz der
gelesenen Schlüssel beweisen. Ein Lock ersetzt keine Challenge, Signatur,
Mitgliedschaft, Autorisierung oder atomare Prüfung aller übrigen Preimages.

### Vollständiger Operationslebenszyklus des Kandidaten

| Operation | Vorgeschlagene zwingende Regel / unverändert fehlende Freigabe |
| --- | --- |
| Bestehender format1-prepared-locked | Ganz blockieren; nicht übernehmen, ändern, ersetzen oder löschen. Bestehendes prepareLocalSyncAnchor bleibt isolierte Vorbereitung ohne K1-Garantie. Keine Nachrüstung bestehender Schlüssel durch Metadaten. |
| Neue zulässige Linie | Erst nach eigenem gültigem Enrollment-/Reviewvertrag, abwesender Outbox/Anker/allen vorgesehenen Slots und vollständigem P. Neu erzeugte Keys nur durch private Routine; atomare Neuanlage mit count/add-Schutz. Dies ist KEIN Auftrag zur Implementierung dieses Erzeugungs-/Ausstellerpfads. |
| Capture / Verifikation / Begin | Vollständigen gebundenen Lifecycle unter demselben Lock lesen; sämtliche verwendeten Slots während der gesamten Prüfung unveränderlich. Erfassung R/S/D und Framebeleg nach obigem Vertrag; Rawguards im vorhandenen Code bleiben unverändert. |
| Rotation / Widerruf | Ebenfalls exklusiv; neue Schlüsselerzeugung/Generation und Übergang nur mit eigenem reviewtem Vertrag. Keine in-place-Ersetzung alter Schlüssel. Alte Frames/Keys unverändert history-only erhalten; Referenz-/Rechteübergang atomar an vollständiges Parent-P binden. Keine neue Rotation hier freigegeben. |
| Recovery / Adoption / Restore / Delete | Keine Autoritäts-/Writerportierung, kein Wiederverwenden alter Fähigkeiten. Vorhandene Portfoliooperationen behalten CAS/Fence/Outboxinvalidierung; jeder künftige Keyslot-/Lifecyclewriter müsste K1 vollständig erfüllen. Format1 bleibt erhalten. Neue Finanzrevision oder Fenceänderung entwertet den Versuch über P. |
| Abort / Quota vor Commit | Gesamte IDB-Transaktion abbrechen, kein Send/Unlock/Apply; Originale erhalten. Lock erst nach Transaktionsende freigeben. |
| tx.oncomplete / Antwortverlust | Erst oncomplete dauerhaft. Keine Neuverschlüsselung/zweite Neuanlage als Retry. Bei unklarem Ausgang neu exklusiv lesen und Operation/Frames/Lifecycle prüfen; neueren CAS nicht bestätigen. |
| PageClose / Prozessende | Keine fremde Lockübernahme per steal. Nach Ende gespeicherten Zustand neu lesen/verifizieren; kein rekonstruierter flüchtiger Beleg. Crash-/Powerlossdurabilität bleibt separat nativ nachzuweisen. |
| Slotcleanup / DB-Löschung | Nicht durch K1 freigegeben. Kein clear/delete/DB-Neuanlegen als Lock- oder Recoverylösung; Original-/Identitäts-/Restoreverträge gelten weiter. |

Nach jedem Cryptoawait werden Presence und vollständige vergleichbare Formen von P
erneut gelesen und streng verglichen. Dann EIN records-readwrite-Commit mit denselben
Prüfungen. read/get allein genügt nicht: count bindet fehlend gegen belegtes
undefined/null, und zusätzliche/unbekannte Slots blockieren. Unbekannte Formen
dürfen weder serialisiert wegfallen noch normalisiert werden. Der Kandidat braucht
eine geschlossene Slotliste und Attributformen; zusätzliche Slots sind kein
automatisch transportierbares Metadatum. Privates P inklusive aller Credentials,
Challengeeingaben, R/S/D und Preimagedigests bleiben flüchtig/lokal und aus Logs fern.

Normale Portfoliosaves dürfen zwischen den kurzen IDB-Transaktionen stattfinden;
unveränderter Revision-/Vollpreimagevergleich muss den Versuch dann verwerfen.
Same-CAS-Änderungen werden ebenfalls vollständig geprüft. Ein zusätzliches
Keyslotlock alleine verhindert kein Same-CAS-/ABA-Verhalten fremder ungebundener
Writer. Darauf darf die Behauptung vollständiger Bindung nicht aufgebaut werden.

### Gezielter Istcodeabgleich und tatsächliche Lücke

Vollständig gepinnt gelesen und unabhängig Gitblob-SHA1-geprüft:
atomic-storage b8bc22967d451150801cd8ac1fd847a768c37ca2,
sync-local-anchor 815f2ac2ccd0e507bcf4dbefbaf6a07b5332afa4,
sync-outbox-storage e2f4341934f33f81f16fdb731d57d6bf0c40525e,
sync-outbox-state ba713bb111a74c1d3d7e1b4f2ca884fbd804cc9d,
browser-portfolio-storage c383901ffe000b82f3a97c1f08460748dbe228eb,
Ausstellervertrag 4e0c446e70a828cd0cfcf81b1600a556cd7c509a,
Harness 88529dbbc1748e48c0f1c9c973fe4c0e03550691.

prepareLocalSyncAnchor hat privaten Neuanlagewriter mit Presence-/Portfolio-Prüfung,
aber keinen solchen exklusiven Lebenszyklus. Bestehende vorhandene Slots werden
korrekt verweigert; das verhindert nicht spätere externe Keyslotmutationen.
PortfolioStorage.withLocalLock verwendet einen anderen vorhandenen Lockpfad;
normale IDB-Saves und Outboxadapter sind dadurch kein exklusiver Keyslotwriter.
atomic-storage exportiert den DBzugang; ein allgemeiner IDB-Zugriff ist technisch
weiter möglich. Die gelesenen Module reichen daher NICHT als vollständiger
Nachweis aller App-/Alt-Tab-/Worker-/Recovery-/Cleanupwriter. Teilweise vorhandene
lokale Quellkopien wurden nicht als vollständiger Repositorynachweis behandelt.
Kein allgemeiner neuer Gesamtaudit und keine neue Abnahme aus Quelltext.

**Konkreter Gegenablauf gegen K1 ohne Writerabschluss:**
A hält den Web-Lock, liest K0 und besteht Challenge; B verwendet eine unabhängige
records-Transaktion ohne denselben Lock und ersetzt K0 durch K1 mit identischen
JSON-/Lifecycle-/Envelopebytes und Attributen; A prüft nur diese vergleichbaren
Werte und committet. K1-Lock und Metadaten allein würden diesen Ablauf NICHT
ablehnen. Gleiches gilt für einen Lock-steal mit weiterlaufendem altem Callback.
Das ist ein aus API-/Codegrenzen abgeleitetes Gegenbeispiel, kein ausgeführter
nativer Repro und keine neue Produktfehlermeldung.

Web Locks ist laut Primärspezifikation kooperative Koordination; query() ist nur
eine Momentaufnahme, steal kann alte Callbacks ohne Exklusivitätsgarantie
weiterlaufen lassen. IDB liefert keine daraus abgeleitete Slot-ACL.
Quellen am 13.11.2026 gelesen:
https://www.w3.org/TR/2026/WD-web-locks-20261112/ (Einleitung, request/steal/query),
https://www.w3.org/TR/2026/WD-IndexedDB-3-20261030/ (Transaktionen/Objectstore).
Eigene Schlussfolgerung: K1 ist unter unveränderter Ablehnungsmatrix erst dann
tragfähig, wenn sämtliche zulässigen Writer nachweislich beteiligt sind und der
Keytauschgegenfall tatsächlich nicht zu einem falschen Commit führen kann.
Feindlicher Same-Realm-Code liegt außerhalb des bestehenden Kryptothreatmodells;
das darf normale Alt-Tab-/Worker-/Recovery-/Testwriter oder unqualifizierte
Racefälle nicht nachträglich aus dem Pflichtumfang ausschließen.

**Entscheidung dieser Bearbeitung:** K1 NICHT als gelöst/implementierbar abgenommen.
Kein Produktcode, keine Sperrlockerung, keine Änderung des Ausstellervertrags4.
Die nächste Facharbeit ist der konkrete nachweisbare Abschluss der Writerabdeckung
oder ein anderer vollständiger Mechanismus, der den Gegenablauf unter dem
unveränderten Vertrag ausschließt. Nur den Locknamen hinzuzufügen genügt nicht.
Keine Annahme, ein Browser-PASS allein könne diese logische Lücke schließen.

### Native Prüfzuordnung und konkret bereitzustellender Testplatz

Aktuelle Sitzung: Node24.22.1; runtimeeigener Playwright1.62.1 samt playwright-core
vorhanden, Systempfad /usr/bin/chromium vorhanden. Kein erfolgreicher Projektimport,
kein gewählter/gestarteter nativer Engineprozess und keine funktionsfähige
Browser-/Socketausführung dadurch belegt. NoNewPrivs1/Seccomp2 entspricht der
bekannten AF_UNIX-Fehlumgebung; kein identischer Fehlstart wiederholt. Kein
environment_status-Werkzeug in dieser Sitzung angeboten. Keine Sicherheits-,
Sandbox-/TLS-/Zertifikats-/Timeoutumgehung oder pauschale Installation versucht.
ENVIRONMENT_BLOCKED für diese native Abnahme; andere zulässige Umgebungen UNKNOWN.

Jochen muss, soweit kein zugelassener vorhandener Testplatz zugeordnet werden kann,
GENAU einen zugänglichen Testplatz zuordnen: Playwright mit fest gewähltem
ENGINE=chromium (oder ausdrücklich firefox/webkit), regulär startbarem Browser,
lokalem vertrauenswürdigem HTTP-Testorigin, echten IDB/WebCrypto/Web-Locks-Fähigkeiten,
zwei Seiten im selben BrowserContext und unverändertem Repositorystand.
Keine Secrets in Chat. Vor Ausführung SHA/Tree, Node-/Playwright-/Engineversion und
Startvoraussetzungen festhalten. Vorhandenen tests/browser-sync-outbox.mjs und
tests/storage-origin.html verwenden; KEIN neuer Runner/Workflow/CI-Trigger.
Eine Projektauflösung von Playwright darf nur regulär zugeordnet werden; ein
Installations-/Startversuch ist kein Abnahme-PASS.

| Sollnachweis am exakten Kandidaten | Bestehender Harness / noch konkret fehlender Beitrag |
| --- | --- |
| Native Original-Raw-Outbox, zwei Seiten/CAS, PageClose/Reopen/Reverify | Bestehender Harness unverändert vorgesehen; noch nicht ausgeführt. Reopen im selben Context ist kein Prozessneustart. |
| prepared-locked-Keypersistenz und Kohärenz | Vorhandene anchor-proof-Gegenprüfung nach Page-Reopen; kein Enrollment/Unlock. |
| P-Präsenz, Same-CAS und tatsächliche Keyslotraces an JEDER Cryptoawaitgrenze | Im vorhandenen Harness erst nach tragfähigem Mechanismus gezielt erweitern: K0/K1 mit gleichen Metadaten, unterschiedliche HKDF-/Writerkeys, Presence/Attribute/Zusatzslots, Alt-Tab/Worker und fremder Writer. Bestehender Harness deckt K1 oder Snapshotintegration NICHT ab. Kein neuer Runner. |
| Lockverlust/steal/Close und konkurrierende Lifecycleänderung | Falscher Commit muss ausgeschlossen bzw. Versuch vollständig verworfen sein; nicht bloß erfolgreicher Lockcallback. Keine automatische Übernahme oder TTL. |
| oncomplete plus Antwortverlust und neuer Save | Tatsächlich gespeicherten Frame, Original-CAS, Parent, vollständigen Lifecycle und fehlende doppelte Neuanlage lesen/verifizieren. Kein fiktives Rollback. |
| Prozesscrash, reale Quota, Recovery | Separat qualifizieren und als Voraussetzung des zugeordneten Testplatzes benennen. Injizierte Fehler bleiben begrenzte Faultinjection. |

Kryptoreview unverändert: bestehendes Paket fd3fce4bb3038e525c78e9a5bdc9bc81f4dab15b,
Kandidat17a5a190d472f1f07b3508e6f35194371fe95eb2/Tree44ff9c4d60fb22b9519b4b0b344a91045f97f28e,
REVIEW_READY/EXTERNAL_REVIEW_PENDING. Jochen benennt unabhängigen qualifizierten
Prüfer und nötigen Zugang/Budget; kein Paketneubau, Selbst-/KI-Reviewabschluss oder
externe Beauftragung. K1 ist zusätzliche ungeprüfte nachgelagerte Vorarbeit und
keine Änderung oder pauschale Erweiterung des gepinnten Reviewgegenstands.
Alle A1/A2/prepared-locked/Snapshot-/Produktions-/Sicherungsgrenzen bleiben gültig.
