# K1 – begrenzte Belegzuordnung, 09.11.2026

Vorbereitung während der unverändert laufenden UI-R3-Integration. Kein neuer Importcode, keine zweite Implementierung, keine Wiederabnahme akzeptierter Releases. Maßgeblicher Produktionsstand v301/Main `1708d4e947061f353187727ccae54daa1727db7e`; alleiniger Produktowner `c43b5e91f20a`.

| Bestehender Umfang | Vorhandener Nachweis | Aussage und Grenze |
| --- | --- | --- |
| Gemeinsamer Flatex-AT-/Bittr-/Bitpanda-/Kraken-/Ledger-Live-Kern | [v287/PR304](release-evidence/v287-pr304-live-acceptance.json), aktuelle `tests/shared-import.test.mjs`, `tests/browser-shared-import.mjs` | Gemeinsame Vorschau und ein atomarer Commit, Überlappung/Reihenfolge/Wiederimport/Undo/Restore sind umgesetzt. Kein zweiter Importkern. |
| Synthetische gemeinsame Sollwerte | Vorhandene private Fünfanbieter-Diagnose und aktuelle gemeinsame Fixtures | 120 Reihenfolgen, Plain-/V5-Restore und Replay sind kontrollierte technische Aussagen; keine unabhängige Annahme tatsächlicher historischer Anfangs-/Endbestände. |
| Originalgestützter Flatex-Kern im gemeinsamen Ablauf | Vorhandener privater Original-/Python-Decimal-Abgleich und tatsächlicher UI-Gegenbeleg aus PR304 | Belegter begrenzter Flatex-Originalumfang kombiniert mit den vier weiteren synthetischen Quellen. Dies ist keine gemeinsame Vollhistorienabnahme aller fünf privaten Quellen. Originale bleiben privat. |
| Mehrfachfüllungen und Finanzierung | [v290/PR307](release-evidence/v290-pr307-live-acceptance.json) und spätere UH05-Belege | Bereits belegte EUR-/Buchtag-/Valuta-/Finanzierungsfälle erhalten. Neue synthetische 2:1-/3:1-Fälle nicht als echte Originalfälle ausgeben. DKB-Giro bleibt außerhalb. |
| Quellen- und FX-Grenzen | [v298/PR318](release-evidence/v298-pr318-live-acceptance.json), [v299/PR319](release-evidence/v299-live-accepted.json) | Fehlende FX/Fees/Basis bleiben UNKNOWN. Der begrenzte vollständige USD-Spot/Earn-Hauptbetrag erlaubt keine allgemeine FX-Zulassung. |
| BTC-/ETH-/SOL-Bezüge | D-WH und vorhandene UH03-Quellenbrücken der kanonischen Matrix | Technisch akzeptierte Teilketten erhalten; historische Ownership/Endbestände, fehlende Ledger-/Staking-Wallets und nicht abgedeckte Protokolle bleiben getrennt offen. |

K1 bleibt **PARTIAL**. Die privaten Originale sind vorhanden; daraus folgt keine Erlaubnis, unbekannte Anfangswerte, historische Eigentümerschaft oder unvollständige Wallet-/Staking-Bestände zu ergänzen. Ein Fünfanbieter-Synthetik-PASS ersetzt keine fehlenden unabhängigen Originalanker.

Nächste zulässige K1-Arbeit nach dem seriellen UI-R3-Integrationspunkt: vorhandene Originalbelege je zugesagtem Kernumfang vollständig an diese technischen Nachweise binden und nur eine tatsächlich reproduzierte normale Kernlücke als begrenzten Fachschnitt öffnen. Fehlende externe Bestands-/Ownership-Anker konkret benennen; fertige D-IMPORT/D-WH-Teile nicht erneut entwickeln. Keine neue Finanzengine, Migration, pauschale FX-Freigabe oder historische Reparatur.
