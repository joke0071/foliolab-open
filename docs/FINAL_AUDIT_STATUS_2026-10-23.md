# FolioLab Open – Konsolidierter Abschlussstand des Stabilitätsaudits

**Datum:** 23. Oktober 2026  
**Basis:** Produktivversion v71 (`168d784551cc546724c9de8aef5241c332b94c80`)  
**Finaler Audit-PR:** `audit/2026-10-23-final-legacy-quotes-chevrons`, Service Worker v72.  
**Geltungsbereich:** Community-PWA FolioLab Open; keine Änderung der privaten FolioLab-Instanz.

## Abgeschlossene Auditschwerpunkte

1. **Persistenz und Recovery:** keine stillschweigende Rücksetzung beschädigter Portfolios; Speicherquoten-Fehlerbehandlung; Warnungen und Schreibsperre für erkannte konkurrierende Tabs; invalides Backup verändert keine gespeicherten Bytes.
2. **Finance/Journal:** validierte Journalbeziehungen und Ledger-Salden; unabhängige Referenzen für Splits, Fusion/Transfers, Teilverkäufe, Gebühren und historische Wechselkurse; 18-Dezimal-Arithmetik ohne unnötige Zwischenrundung; Schutz vor unverbuchtem Barausgleich.
3. **Security & Privacy:** Drittanbieter-Charts vom App-Origin isoliert; sichere API-Diagnostik; eingeschränkte Drittanbieter-Daten; Browser-Cookies und Referrer bei Anbieterabfragen ausgeschlossen; gezielte Schlüssel- und vollständige Datenlöschung.
4. **Browser, Performance und Accessibility:** CI-Gates für Chromium, Firefox und WebKit, automatisierte WCAG-Teilaspekte, mobile Breiten und Portfolio-Skalierungsprobe.
5. **Altbestands-Kurswerte (Issue #47):** **Opt-in, rein lokaler** Vergleich angezeigter und exakter Kurs-/FX-Werte, ohne Abfrage externer Dienste oder Veränderung des Speichers. Gleichwertige Rundungswerte bei 18 Dezimalstellen gelten nicht als Fehler. Für erkannte Abweichungen ausschließlich Nutzerfreigabe nach erneutem, datiertem Kurs eines verifizierten externen Anbieters; vorher Download des unveränderten JSON-Backups. Unverifizierbare Positionen werden ausdrücklich nur zur manuellen Belegprüfung angeboten. **Keine** automatischen historischen Neuberechnungen.
6. **UI-Konsistenz:** gleiche geometrische Chevron-Form, Strichstärke, Farbe und Offen-/Geschlossen-Animation bei Anbieter- und Datenquellen-Accordions.

## Testnachweise und Release

- Neue Unit-Suite `tests/legacy-quote-audit.test.mjs`: lokale Unveränderlichkeit, präzise Rundungsvergleiche, Backups, verifizierte Quote, abgelehnte veraltete/undatierte Werte, selektive Korrektur sowie Erhaltung des Journals und der Stichtage.
- Neue Chromium-Suite `tests/browser-legacy-quotes-chevrons.mjs`: identische berechnete Chevron-Styles, korrektes Aufklappen, keine externen Requests bei lokaler Prüfung, unveränderte lokale Bytes, Crypto-/FX-Anbieterantworten, bestätigte Korrektur mit Backup-Download, Stale-Quote-Abweisung, Reload und 320–1440 px.
- Die beiden Tests sind Bestandteil der CI-Pflichtprüfungen. Der **nach Merge** erfolgreiche Build und direkte HTTP-Check der veröffentlichten Homepage und des Service Workers sind Voraussetzungen, um v72 als produktiv verifiziert zu bezeichnen.

## Unverändert offene Folgeprojekte

| GitHub-Issue | Status / Risiko | Begründung |
|---|---|---|
| [#44](https://github.com/joke0071/foliolab-open/issues/44) | Offen · P2 | `localStorage` hat weder garantierte atomare Multi-Tab-Transaktionen noch unbegrenzte Kapazität. IndexedDB nur nach eigenem versioniertem Migrations-/Rollback-Konzept. |
| [#52](https://github.com/joke0071/foliolab-open/issues/52) | Offen · P2 | Eine Kapitalmaßnahme mit tatsächlicher Barabfindung benötigt gesonderte Geld- und steuerlich nachvollziehbare Basisbuchungen. Unbelegte Werte werden nicht erfunden. |

**Weitere dokumentierte Grenzen:** Geräte mit schwacher Leistung, manuelle Screenreader-/Zoom-Tests, ein formaler OWASP-ASVS-/Penetrationstest, Sicherheits-HTTP-Header bei GitHub Pages und weiterhin unverschlüsselte lokale API-Zugangsdaten. Watch-only-Blockchain-Abfragen hängen von Drittanbieter-Abdeckung und Limits ab.

**Klarstellung:** „Abschluss des Stabilitätsaudits“ heißt, dass die geplanten automatisierten MVP-Audits und ihre bekannten konkreten Korrekturen dokumentiert und geprüft wurden. Es bedeutet nicht, dass sämtliche denkbaren Sicherheitsrisiken ausgeschlossen, sämtliche regulatorischen Finanzfälle implementiert oder eine formale WCAG-/Sicherheitszertifizierung erreicht worden ist.
