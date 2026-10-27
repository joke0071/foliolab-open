# Ledger Live · FLH03-18/#159 · aktueller sicherer Kandidat

Basis: produktiv abgenommenes v189 / main8ac0b2f9cba4a5fdbc61632f7b2cec2720e12261. Bestehender Branch feature/ledger-live-preview und WIP0c292c8 bleiben erhalten. SW190 ist ausschließlich ein unveröffentlichter Kandidat. Kein FLH05-A-Start; Vorrang gemäß Vorgänger-Gesamtaudit/zentraler Roadmap f57fb8ebc2002fd22aa773fc4ebf7699722299d8 auf dem bestehenden Dokumentationsbranch.

## Begrenzter Umfang

Native 12-Spalten-Erkennung im bestehenden CSV-Dialog, rein lokale Vorschau und ausdrückliche bestehende Wallet-/Netzwerk-/Assetzuordnung. Wiederverwendung von parseCSV, decimal18, sourceDigest, walletStreamMatches/positionWalletSession sowie der vorhandenen Bittr-Kaufbeleggruppierung. Keine zweite Finanz-, Import- oder Historienengine. Keine Persistenz-, Journal-, Saldo-, Cashflow-, Kostenbasis- oder Historienübernahme; daher auch kein neu erfundenes Finanz-Undo. Abbrechen verwirft nur den transienten Vorschauzustand. Vorhandene generische/Flatex-Übernahme und Undo bleiben unverändert.

Der bereits geprüfte Quellen-/Schemaaudit wird wiederverwendet, nicht erneut durchgeführt. Unveränderliche offizielle Exportimplementierung: https://github.com/LedgerHQ/ledger-live/blob/c7947b848a87b175c8d7d4a81ed255ca26ab800e/libs/ledger-live-common/src/csvExport.ts . Vorhandene Quellenmatrix: feature/flh05-import-foundation:docs/import-formats/sources.v1.json; frühere lokale Originalschema-/Bittr-Belege bleiben privat. Keine neue vollständige Originaldatei-/Bestandsabnahme aus synthetischen Tests behauptet. Keine Quellcode- oder Fixtureübernahme aus Fremdprojekten.

## Fachvertrag / Sperren

| Fall | Vorschau | Wirtschaftliche Wirkung |
| --- | --- | --- |
| IN/OUT/FEES | Originaltyp, exakte Menge, Status, Referenz, Gebührenfeld und Marktgegenwerte anzeigen | Gesperrt: Netzwerk-/Ereignislocator, Gebührenwährung und Einbeziehung fehlen als universeller Exportvertrag |
| Failed | Fehlgeschlagen sichtbar; erfolgreiche Mengenbewegung ausdrücklich nicht ableiten | Gesperrt, auch möglicher Fee-only-Fall benötigt gesonderten Nachweis |
| DELEGATE/UNDELEGATE/WITHDRAW_UNBONDED | Zustandsprüfung/Verfügbarkeit und Doppelzählungsrisiko nennen | Keine fiktiven externen Zu-/Abflüsse |
| Unbekannte Typen/Swaps | Sichtbar als ungeklärt | Gesperrt; keine erfundenen Mehrbeine/Steuerannahmen |
| Fehlende Fees/Countervalues/Mengen | null/unbekannt; exakt0 bleibt0 | Keine Nullersetzung/Preis-/Steuerbasisannahme |
| Identische Zeilen/gleiche Hashes | Alle Zeilen erhalten, identische Beobachtungen mehrdeutig | Beobachtungs-ID ist kein Blockchain-Ereignis-Locator und keine Importfreigabe |
| Wallet-/Konto-/Tickerwiderspruch oder Token ohne Contractbeleg | Konkreter Sperrhinweis, keine fremden Wallet-/Bittr-Referenzen aus Cache anhängen | Keine Zuordnung oder Zusammenführung |
| Eindeutiger vorhandener BTC-Walletbezug plus bestehende Bittr-Gruppe | Ausschließlich vorhandene Hashreferenzen/Kaufbeleggruppe anzeigen, auch N:1 | Keine zweite Bestandsbewegung oder automatische Kostenbasisübernahme |

Feld- und Dialogreview schließt unpassende Eigentums-/Assetreferenzverknüpfung und Reaktivierung des gesperrten Übernahmebuttons nach provoziertem Formsubmit. Alle persistierenden Callbackpfade bleiben durch Ledger-Modus gesperrt. HTML wird escaped. Überlange/ungültige Daten nutzen bestehende2MB/5000Zeilen/18Dezimal-Grenzen; >100Scopes gesperrt. 50Zeilen initial sichtbar, weitere50 explizit nachladen. Keine privaten Daten/Walletkennungen/Dateifingerprints in öffentlichen Fixtures oder Artefakten.

## Nachweise / offene Gates

- Lokal757/757 Unit-Tests,0Fehler/0Skip und Syntax PASS; darunter14native Ledger-Tests (elf bestehende plus drei neue Referenz-/Token-/Hostile-Fälle).
- Neuer tests/browser-ledger-live.mjs wird aus bestehendem browser-csv-batch.mjs geladen, damit Chromium und beide vorhandenen verpflichtenden FX/WK-Shards dieselbe native Prüfung ausführen. Keine Workflow-/Policy-/Versionsänderung und kein alter Test entfernt.
- Browserziele: echte native Dateiauswahl/Zuordnung/Bittr-Anzeige;320/390/430/768/1440/Axe/44px;Aufklappen/Keyboard/Fokus;Reimport/Abbruch/Escape;75Zeilen/HostileCSV;generischer/gemischter Import gesperrt;provozierter Submit bleibt gesperrt;Offline;kanonischer Record/Revisionsstand unverändert;keine externen Aufrufe.
- Lokaler Browserdownload liefert weiterhin leere/ungültige Archive. Kein lokaler Browserpass behauptet; verpflichtende neue PR-CI und visuelle Artefaktprüfung stehen noch aus.
- Keine Releasebereitschaft oder produktive v190 behauptet. #159 bleibt PARTIAL; native Verbuchung benötigt pro unterstütztem Vorgang belegten Locator-/Fee-/Ownership-/Transfervertrag, unabhängige Sollwerte und eigene kritische Releaseentscheidung. Nicht universell aus Exporthash/Ticker/Countervalue herleitbar. Historienrekonstruktion bleibt vorhandene FLH02-Engine, keine rückwirkende Ableitung aus aktuellem Bestand.

---

## Historischer unveröffentlichter Checkpoint (durch aktuellen Stand oben übersteuert)

# Ledger Live: unpublished intermediate checkpoint

Base v188 / ca1fa8fd46b3060d10a13095400bc3d33b0f3c42, issue159. Production v188 is live accepted; this branch is not released. SW189 is a candidate only.

The first local native recognition/preview experiment reuses the already audited official twelve-column dialect and existing CSV, decimal, wallet-history and Bittr grouping functions. No balance/journal/history commit API is implemented. Wallet mappings are transient, unknown fees/identity/locators remain unresolved and countervalues are not purchase prices. Exact duplicate export observations are retained as ambiguous, not silently removed.

Local checkpoint: eleven focused unit tests pass; syntax checks pass. A mistaken test expectation that an invalid per-row identity throws globally was corrected to assert its explicit row blocker. No product assertion was weakened. No full/browser/real-original validation or release readiness claimed. Browser test integration and field-level security review are unfinished.

New master steering: FLH05-00 format/open-source/license research now precedes further parser development. This intermediate experiment is preserved remotely and paused. Its prior Ledger/Bittr schema/source evidence remains reusable; research must cover all priority A/B providers and shared import architecture before this code is extended or shipped. Current native posting support is OPEN/BLOCKED by provenance, fee and event-locator evidence. No private original rows, identifiers, addresses or fingerprints are part of this branch.
