# FolioLab Open – Stabilisierungsaudit (23. Oktober 2026)

## Umfang und Ausgangslage

- Repository: `joke0071/foliolab-open`
- Ausgangs-Commit: `900f1c5a3d5d49c6ddd47aee19b80ebc3d3b7acf` (inklusive des unabhängigen Wallet-Live-Audits)
- Arbeitszweig: `audit/2026-10-23-integrity-stability`
- Architektur: statische Vanilla-JS-PWA, Local-First, `localStorage`, versioniertes v3-Journal, expliziter JSON-Import/-Export, öffentliche APIs und Watch-only-Walletscanner
- Prüfung: gezielte Quellcodeanalyse, deterministische Unit-/Integrations- und Browser-Regressionstests, CI über GitHub Actions

**Einordnung:** Technischer, risikobasierter *Teilaudit* mit tatsächlich implementierten Verbesserungen. Er ist weder ein ISO/IEC-25010-Zertifikat noch ein vollständiger OWASP-ASVS-, WCAG- oder Multi-Browser-Audit. Externe Live-Probes sind zeitgebundene Momentaufnahmen.

## Implementierte Korrekturen

| ID | Schwere | Befund | Änderung / Schutz |
|---|---|---|---|
| AUD-001 | P2 | HTTP-429/503 mit langem `Retry-After` wurde zu früh erneut angefragt, weil die Wartezeit auf 3,5 s begrenzt wurde | Kurze Pausen respektiert, lange Provider-Sperrfristen kontrolliert ohne verfrühten Retry abgebrochen |
| AUD-002 | P1 | Nach fehlgeschlagenem `localStorage`-Speichern konnte der sichtbare Speicherstand von den persistenten Daten abweichen | Letzten bestätigten Datenstand wiederherstellen, Änderung als nicht gespeichert melden, UI synchronisieren |
| AUD-003 | P2 | Installierte PWAs konnten bei unverändertem Service-Worker-Cache alte Anwendungsmodule laden | Cache-Version `v52` und automatischer Test der vollständigen JS-Precache-Liste |
| AUD-004 | P2 | Im Backup wurden unmögliche Kalendertage wie 2026-02-30 bei Stichtagen, Cashflows und Buchungen akzeptiert | Strikte Kalenderdatumsprüfung; gültiger 29. Februar bleibt erlaubt |
| AUD-005 | P1 | Ein manipuliertes/defektes Backup konnte zwischen Exaktwert und numerischem Wert abweichende Cashflows, Mengen oder Stichtagswerte enthalten | Exakt-/Numerik-Doppelrepräsentation vor Import konsistent validieren; auch winzige 18-Dezimalmengen und 1-Wei-Differenzen geprüft |

### Gezielte Regressionstests

- HTTP-429/503 mit `Retry-After` von 60/120 Sekunden
- `QuotaExceededError` im realen Chromium-Browser: kein falsches Erfolgssignal, gespeicherte Einstellungen bleiben intakt, anschließender erfolgreicher Speichervorgang
- Vollständigkeit der Offline-JavaScript-Modulliste
- Unmögliche Daten in drei Finanzdatensatztypen, gültiger Schalttag
- Abweichende Exakt- und Zahlendarstellungen einschließlich Kleinmengen bis 18 Nachkommastellen

## Prüfergebnisse

### Commit `51c7533e99131e6fe3bf27259373e724dddb568d`

- GitHub Actions „Wallet scan checks“: **bestanden**.
- GitHub Actions „FolioLab Open – testen und veröffentlichen“ im Pull-Request-Modus: **bestanden**.
- `npm test`: **270 bestanden, 0 fehlgeschlagen, 0 übersprungen**.
- `npm run check`: **bestanden**.
- Chromium-Playwright-Browserkette inklusive Responsiveness, Buchungsjournal, Migration, Backup, Portfolio-Darstellung, Finanzlogik, Sicherheitssmoke und Wallet-Bestandsschutz: **bestanden**.
- Stresstests für 500, 2.000 und 5.000 Positionen mit jeweils 5.000 historischen Buchungen sind Teil der Unit-Suite; Tests bestanden. Dies ersetzt keinen Browser-Memory-/CPU-Lasttest.
- Öffentliche Live-API-Probes liefern erwartbar auch CORS-, HTTP-403-, HTTP-429- und Timeout-Ergebnisse. Die Probes sind informativ; keine vollständige Wallet-Verifikation.

**Hinweis:** Die genannten Testresultate beziehen sich auf den angegebenen geprüften Commit. Nach weiteren Änderungen ist ein neuer vollständiger Durchlauf erforderlich.

## Qualitätsbereiche – bisheriger Prüfstatus

| ISO/IEC-25010-Bereich | Status |
|---|---|
| Funktionale Eignung | Gezielte Finanz- und Importregressionen + vorhandene Produkttests bestanden |
| Leistungseffizienz | Bestehende Skalierungstests bestanden; Realgeräteprofiling ausständig |
| Kompatibilität | Chromium und mehrere Viewports getestet; Firefox/WebKit/Android-Realgerät ausständig |
| Interaktionsfähigkeit | Bestehende Browser-Smokes bestanden; vollständiger heuristischer UX-Audit ausständig |
| Zuverlässigkeit | Retry-/Quota-/Backup-/Offline-Fälle zusätzlich abgesichert |
| IT-Sicherheit | Keine neuen Secrets; vorhandene XSS-/Backup-Smokes bestanden; systematischer Penetrationstest ausständig |
| Wartbarkeit | Gezielte kleine Patches mit Regressionstests; umfassende Modularchitekturanalyse ausständig |
| Flexibilität | Vanilla-JS- und Local-First-Modell erhalten, Migrationen getestet |
| Safety | Datenverlust-/Finanzwert-Inkonsistenzen gezielt behoben; vollständige fachliche Referenzauditierung ausständig |

## Bekannte Grenzen und Anschlussaufgaben

1. End-to-End-Tests über Firefox, WebKit und echte Android-Geräte ergänzen.
2. Reproduzierbare CPU-/Speicher- und Lighthouse-Baselines mit großen Portfolios erstellen.
3. Systematischen WCAG-2.2-AA- und OWASP-ASVS-Abgleich abschließen.
4. Komplexe finanzielle Sonderfälle durch unabhängig gerechnete Referenzportfolios und Property-Based-Tests absichern.
5. Solana-Staking, ERC-20-Indexer und weitere öffentliche APIs bleiben providerabhängig und dürfen bei Teilscans keine Vollständigkeit behaupten. Details: `docs/WALLET_SCANNER_REALWORLD_AUDIT_2026-10-22.md`.
6. Die Mehr-Tab-Konkurrenzkontrolle vor `localStorage.setItem` ist nicht vollständig atomar. Der vorhandene Konfliktschutz ist eine praktische Minderung, aber keine transaktionale Sperre.

## Release-Disziplin

- Keine P0/P1-Regressionsfehler in den ausgeführten Tests.
- Veröffentlichungen müssen auf den zuletzt erfolgreich geprüften Commit bezogen sein.
- Vor Merge GitHub Actions und Mergefähigkeit prüfen.
- Nach Veröffentlichung Produktions-URL, Actions-Deployment und Service-Worker-/Asset-Stand verifizieren.
- Kein unbewiesenes „vollständig geprüft“ oder „ISO-zertifiziert“ kommunizieren.
