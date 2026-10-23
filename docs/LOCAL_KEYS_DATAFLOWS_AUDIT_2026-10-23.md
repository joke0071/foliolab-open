# FolioLab Open – Audit der lokalen Zugangsdaten und externen Datenflüsse

**Datum:** 23. Oktober 2026  
**Ausgangsversion:** `9136ffe03a2192ab1085e64f41b4a2af5f7a505b` (`v57`)  
**Audit-Branch:** `audit/2026-10-23-key-storage-dataflow`

## Prüfumfang und Datenmodell

- FolioLab ist eine Local-First-PWA ohne eigenen Portfolio-Backenddienst.
- Portfolio, Konto-/Positionsdaten, Wallet-Watch-only-Informationen und optionale API-Schlüssel befinden sich derzeit im `localStorage` des Browsers; dieser ist **nicht verschlüsselt**.
- Reguläre JSON-Backups und optional verschlüsselte JSON-Backups exportieren **keine API-Schlüssel** (beide nutzen die bereinigte Backup-Repräsentation).
- Einige Kurs-/Suchanbieter erhalten bei Abruf erforderliche Wertpapierkennungen, öffentliche Walletadressen oder Nutzersuchbegriffe. API-Schlüssel gehen nur an den jeweils beauftragten Anbieter.
- Der optionale TradingView-Chart wird erst nach Nutzerklick über einen isolierten Cross-Origin-Iframe geladen. Die aufgerufene Börsenkennung und Verbindungsmetadaten werden dabei an TradingView übertragen, nicht das Portfolio.
- Der optionale eigene öffentliche Instrumentensuchdienst erhält nur den eingegebenen Suchbegriff bzw. die ISIN, **keine** Depotlisten oder Schlüssel.

## Befunde und Korrekturen

| ID | Priorität | Ausgangslage | Umsetzung |
|---|---|---|---|
| PRIV-01 | P1 | „Alle Daten löschen“ setzte das aktuelle Portfolio zurück, ließ aber vor der Migration gespeicherte FolioLab-Sicherungen und weitere app-eigene Speichermarker zurück | App-spezifische lokale Einträge inklusive Hauptdatensatz und Migrationskopien werden vollständig entfernt; fremde Schlüssel bleiben erhalten |
| PRIV-02 | P2 | Kein gezielter Weg zum Entfernen gespeicherter API-Schlüssel bei gleichzeitiger Aufbewahrung des Portfolios | Neue explizite Aktion „Gespeicherte API-Schlüssel entfernen“ mit Rückfrage; löscht sechs optionale API-Schlüssel, setzt den privaten Solana-RPC auf den öffentlichen Standard zurück und entfernt alte Migrationskopien |
| PRIV-03 | P2 | Externe API-Aufrufe nutzten implizite Browser-Fetch-Defaults, inklusive Weiterleitungen und Standard-Referrer-Policy | Externe JSON-Abfragen erhalten `credentials:'omit'`, `referrerPolicy:'no-referrer'`, `redirect:'error'`; verhindert Cookies, Referer und Weiterleitung auf andere Ziele beim Abruf von API-Key-URLs |
| PRIV-04 | P2 | Die optionale öffentliche Metadatensuche verwendete eigene `fetch`-Parameter, die dieselben Browser-Defaults erlaubten | Gleiche strenge Netzwerkregeln auch für die Metadatensuche |
| PRIV-05 | P3 | Keine explizite globale Referrer-Policy in der öffentlichen App | HTML-Meta `referrer=no-referrer` ergänzt, auch für externe Navigationen/Frames |
| PRIV-06 | P2 | Regressionen bei vollständiger Löschung und Schlüsselwiderruf bisher nicht abgesichert | Neue isolierte Unit- und Browserprüfungen mit synthetischen Schlüsselwerten und fremden Browser-Speichereinträgen; dauerhaftes CI-Gate |

## Grenzen

- Der lokale Speicher **bleibt unverschlüsselt**. Diese Etappe entfernt Schlüssel auf ausdrücklichen Wunsch, verschlüsselt aber nicht das laufende Portfolio und schützt nicht vor kompromittierten Browsererweiterungen oder Schadsoftware.
- Vom Nutzer bereits exportierte Backups, Browser-Synchronisierung und vorherige Geräte- oder Betriebssystem-Backups lassen sich von einer Website aus nicht rückwirkend löschen.
- `localStorage` bietet keinen atomaren Multi-Tab-Transaktionsmechanismus. App-seitige Erkennung konkurrierender Updates und Storage-Recovery bleiben als Schutzmechanismen aktiv.
- Manche Drittanbieter benötigen URL-Query-Schlüssel; die neue Redirect-Sperre verhindert die unbeabsichtigte Weiterleitung, kann aber legitime Weiterleitungs-Endpunkte blockieren. Die Regressionstests und externe Live-Probes prüfen die bekannten Pfade; der einzelne Anbieter bleibt von dessen API-Infrastruktur abhängig.
- `connect-src https:` bleibt aufgrund eigener, frei konfigurierbarer HTTPS-RPC- und Suchendpunkte bewusst breiter als eine starre Domain-Allowlist. Im Falle einer DOM-XSS-Schwachstelle könnte eine breite Connect-Richtlinie missbraucht werden. Die strenge Skript-CSP, konsequente Ausgabemaskierung und Isolation fremder Widgets sind die ergänzenden Schutzschichten.
- GitHub Pages unterstützt nicht beliebige Sicherheits-HTTP-Header wie `frame-ancestors`; die Content Security Policy aus dem `meta`-Element verhindert Clickjacking nicht vollständig. Ein entsprechender Host-/Edge-Layer wäre bei höheren Anforderungen sinnvoll.

## Nachweise und Release-Bedingungen

- Node-Test `tests/privacy-dataflow.test.mjs` kontrolliert vollständiges Löschen, gezieltes Bereinigen alter Kopien, sichere externe `fetch`-Parameter und Backup-Geheimnisfreiheit.
- Browser-Test `tests/browser-key-privacy.mjs` prüft in Chromium: API-Schlüssel eingeben, gezielt entfernen und nachladen, Portfolio unverändert behalten, alte Migrationsdaten entfernen, vollständiges Löschen auf eigenen Speicher beschränken, Neuladen ohne Daten.
- Alle bestehenden 277+ Unit-, Finanz-, Wallet-, drei Browser-Engine-, WCAG-Smoke- und PWA-Tests bleiben verpflichtend.
- Merge und Live-Veröffentlichung ausschließlich nach erfolgreichen Prüfungen des **finalen Commit-SHA**, inklusive GitHub-Pages-Deployment und HTTP-Live-Smoke-Test.

**Einordnung:** Dies ist ein risikobasierter Datenschutz-/Security-Teilaudit, keine formelle ISO-/OWASP-/DSGVO-Zertifizierung.
