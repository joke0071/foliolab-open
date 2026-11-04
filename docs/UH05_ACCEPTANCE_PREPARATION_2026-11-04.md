# UH05 – vorbereitete Gesamtabnahme, noch offen

Vorbereitung am unveränderten v280-Releasepunkt. Grundlage: [verbindlicher gemeinsamer Importplan, Etappen9/10](IMPORT_HISTORY_UNIFIED_PLAN_2026-11-01.md). **Keine zusätzliche CI, keine neue Implementierung und kein UH05-Gesamt-PASS.** Aktuellen Releasezustand ausschließlich dem Checkpoint und Releasebelegen entnehmen.

Vorhandene Einzelabnahmen sind Bausteine. Weder eine grüne allgemeine FIN-E2E-Suite noch Parser-/Preview-PASS beweist den gemeinsamen Alltagspfad aller fünf Anbieter.

| Anbieter | Vorhandene Test-/Integrationsbausteine | Für die gemeinsame UH05-Abnahme nachzuweisen |
| --- | --- | --- |
| Bittr | `browser-unified-bitcoin.mjs`, vorhandene BTC-Kauf-/Quellenbelege | Kauf + Ledger-Eingang + akzeptierte BTC-History im selben Portfolio; zusätzliche Quellen verändern gezählten Bestand nicht. |
| Kraken | `browser-kraken-import.mjs`, bestehende native BTC-/ETH-/SOL-Belegpfade | Kauf/Auszahlung/Gebühr und eigener Walletgegenbeleg getrennt; LINK nur nach tatsächlich abgeschlossener konkreter Brücke. Balance-Snapshots sind keine Einzahlungen. |
| Bitpanda | `browser-bitpanda-import.mjs`, vorhandene Original-/Withdrawalanalysen | Reale Exportvarianten, Kauf/Verkauf und unterstützte Reward-/Gebührenbeine plus spätere Chain-/Ledgerbelege in gemeinsamer Reihenfolge. Unqualifizierte Ereignisklassen bleiben sichtbar offen. |
| Ledger Live | `browser-ledger-live.mjs`, vorhandene Beobachtungs-/Locator-Verträge | Quellenbeobachtung statt zweitem Zugang; Countervalue nicht als Kaufpreis; mehrere echte native Locators nicht verdichten. |
| Flatex AT | `browser-flatex-net-settlement.mjs`, native Quellen-/Bindungs-/Commitpfade | Eindeutige EUR-Depot-/Kontopaare, inkrementelle Quellen, vorhandene Bestände und sichere Rücknahme gemeinsam mit den Kryptopfaden. Einzelbeinergänzung/weitere Dialekte/Mehrbeine/Endbelege jeweils nur nach eigener Abnahme. |

## Ein gemeinsamer gezielt zu qualifizierender Ablauf

1. Ein aktuelles synthetisches Portfolio mit eindeutig getrennten eigenen Quell-/Kontobereichen und unterstützten Wallets. Mengen-/Cash-/Gebühren-Soll unabhängig von Produktionsfunktionen festlegen. Vorhandene private Originaloracles separat nach Anbieter referenzieren; keine Rohdaten veröffentlichen.
2. Vorhandene Import-/Historyfunktionen benutzen; keine zweite Importengine. Vertauschte Quellreihenfolgen, überlappende Dateien und spätere Belege müssen denselben exakten wirtschaftlichen Endzustand erzeugen.
3. Echte verschiedene Ereignisse bei gleichem Asset/Menge/naher Zeit auseinanderhalten. Mehrere BTC-Ausgänge, ERC20-Logs, Solana-Instruktionen, HD-Überlappungen, andere Contracts/Chains und unterschiedliche Gebührenzahler explizit prüfen. Nicht qualifizierte N:M-/Teilfüllungsfälle nicht als unterstützt ausgeben.
4. Frühere manuelle Buchungen, Stichtage, Anfangsbestände, Korrekturen und dauerhafte Rücknahmen schützen. Abgeleitete Kontosummen sind keine Endsalden; unbekannte Kosten bleiben unbekannt.
5. Tatsächliche UI: Auswahl/Vorschau/Zustimmung → ein atomarer Commit → Reload/Offline → verschlüsseltes v5-Restore im frischen Profil → Wiederimport → geprüfte wirtschaftliche Rücknahme. Exakte Mengen, Cash, Quellen und erlaubte Rendite-/Kapitalflussrollen unabhängig vergleichen.
6. Stale-Baseline, echter Zweittab-CAS, Quota/post-put-Abbruch, Scangaps/Cursor/Reorg/fehlgeschlagene Chain-Transaktion und fehlende Preise/Referenzen mit Nullteilwirkung beziehungsweise ehrlich partieller Qualität prüfen.
7. Große Stapel am tatsächlichen gemeinsamen Ablauf messen: Importzeit, Zeit bis Interaktion, Listenbedienung und 320–430px-Layout. Chromium/Firefox/WebKit und Android-Emulation getrennt von echtem Android-Hardwarebeleg ausweisen; kein Hardware-PASS ohne tatsächliches Gerät.
8. Erst vorhandene identische Belege wiederverwenden und danach notwendige neue gemeinsame Tests im normalen eingefrorenen Kandidaten prüfen. Kein zusätzlicher Vollrelease allein für diese Vorbereitung, keine pauschale Reduktion von Finanz-/IDB-/CAS-/Backup-/Offline-Gates.

Nächster ausführbarer Produktschritt vor diesem Gesamtschnitt: [belegte Einzelbeinergänzung](UH04_SINGLE_LEG_AUGMENTATION_TASKCARD_2026-11-04.md). LINK bleibt WAITING_FOR_EXTERNAL_CAPTURE und wird bei Eingang am konfliktfreien Integrationspunkt separat abgeschlossen. Diese Matrix ist Vorbereitung, kein Ersatz für offene wirtschaftliche Fälle oder einen vollständigen Original-/Produktionsnachweis.
