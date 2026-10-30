# CI-OPT01 – Effizienter Test- und Releaseprozess · 30.10.2026

Status: OPEN / NACH v221-RELEASEABSCHLUSS / VOR WEITEREN UMFANGREICHEN COPILOT-INTEGRATIONEN. Verbindlicher Nutzerauftrag im bestehenden Master. Kein paralleler Entwicklungsstrang, keine Unterbrechung, Wiederholung oder Umpriorisierung der laufenden v221-Liveabnahme. Maßgeblich bleiben WORK_RESTPAKETE_CHECKPOINT.md und KONSOLIDIERTE_ROADMAP.md.

## Ziel und Qualitätsgrenze

Testfrequenz und Testzuordnung beschleunigen; Aussagekraft sicherheits- und finanzkritischer Prüfungen erhalten. Weniger Wartezeit und Work-Credits pro sicherem Paket. Keine Tests stillschweigend entfernen, Sicherheitsprüfungen abschalten, Assertions/Timeouts lockern oder Fehler übergehen. Vollständiger Releasequalitätsstandard bleibt unverändert. Änderungen des CI-Vertrags separat technisch abnehmen und nur nach eigener konkreter Nutzerfreigabe mergen.

## Vorheranalyse und dauerhaft zu sichernde Messwerte

Aktuellen .github/workflows/import.yml, Browser-Testmodule, historische Fehlerruns und tatsächliche Actions-Laufzeiten auswerten. Unit-,Chromium-,Firefox-,WebKit- und Live-Laufzeiten, Browserinstallation/Downloads, wiederholte Funktionsprüfungen, doppelte Testdateninitialisierungen, unnötige Volltests bei reinem CSS, externe HTTP/CDN/Deploymentfehler sowie tatsächliche Abhängigkeiten/Reihenfolgen erfassen. Keine neue Gesamtroadmap und keine pauschale Einordnung von Assertionfehlern als Infrastruktur.

## Verbindliches dreistufiges Prüfmodell

| Stufe | Auslöser und Umfang | Freigabegrenze |
| --- | --- | --- |
| FAST | Entwicklung/Draft: Syntax und vollständige Units, gezielte funktionsbezogene Browser-, relevante A11y-/Responsiveprüfungen, unveränderte Sicherheits-/Datenschutzgrundregeln | Reproduzierbares schnelles Feedback; niemals automatisch vollständige Integrations- oder Releasefreigabe |
| INTEGRATION | Technisch fertiger PR: alle direkt betroffenen Komponenten, relevante Chromium/Firefox/WebKit-Regression, Finanz-/Speicher-/Backup-/CAS-Nachweise nach Risikoklasse, passendeSW-Revision bei produktivenAssets, vollständige Test-/Änderungsnachweise | Technische Abnahme vor konkreter Nutzerfreigabe; unklare Änderungen konservativ vollständiger Pfad |
| RELEASE | Produktive Veröffentlichung: bestehende vollständige Pflichtregression in dreiBrowsern, Finanz-/Datenintegrität,Backup/Restore/Offline,IDB/CAS,PWA/SW-Identität,tatsächliche veröffentlichteDateihashes,Live/A11y | Keine Reduzierung des bisherigen Standards |

## Priorisierte technische Verbesserungen

1. Dateibasierte Testauswahl mit tatsächlich belegten fachlichen Abhängigkeiten.
2. GroßeChromium-Suite sicher auf unabhängige Jobs verteilen; jeder Job intern sequenziell. Bestehende Diagnose zum früheren parallelen Suite-Start respektieren.
3. Reproduzierbares Dependency-/Browser-Caching mit vollständigen korrekten Cachekeys.
4. Festgelegte einheitliche Playwright-Versionen soweit kompatibel; heutige Versionen/Browserbaselines zuerst erfassen.
5. Nachgewiesene Infrastrukturfehler von Produktfehlern trennen.
6. Nur nachgewiesene transiente Infrastrukturfehler begrenzt und nachvollziehbar wiederholen.
7. Unnötige CI-Wiederholungen und Screenshot-Neuerzeugung vermeiden.
8. Diagnose unmittelbar beim ersten tatsächlichen Fehler sichern.

## Konservative Sicherheitszuordnung

Finanzberechnungen,Buchungen,IndexedDB,CAS,Wallets,Backup,Restore,Löschen,Migrationen undPWA müssen automatisch die jeweils umfassenden Sicherheitsprüfungen auslösen. Transitive Abhängigkeiten berücksichtigen. Unbekannte/unklareDateien oderZusammenhänge konservativ in vollerTeststufe prüfen. ReduzierterDraftstatus darf keinePflichtfreigabe ersetzen. SW-Revisionsgate nicht umgehen. Keine versteckte Freischaltung kritischer Funktionen durch Testauswahl.

## Erfolgsmessung und Nachweismatrix

Vorher/Nachher: gesamte CI-Wandzeit,Zeit bis zum ersten relevantenFehler,Anzahl tatsächlich ausgeführterBrowserprüfungen,Actions-Rechenaufwand,Abdeckung proRisikoklasse,Zuverlässigkeit/Reproduzierbarkeit und notwendigeWiederholungen. Alle bisherigen kritischenTestfälle explizit dem jeweils erforderlichenPfad zuordnen und tatsächlicheAusführung belegen. Keine behaupteteErsparnis allein aus Planung. Fehlerruns und unvollständigeNachweise erhalten. ExterneHTTP-/CDN-Probleme nicht durch geringereTesttiefe maskieren.

## Reihenfolge und Sicherung

Zuerst v221 unverändert abschließen bzw. konkrete externeGrenze sichern; erst nach gesichertemReleaseabschluss CI-OPT01 vor weiterenumfangreichenCopilot-Integrationen beginnen. Bestehende UI-VISUAL06/UI-MASTER28 und allefachlichenMasteraufgaben bleiben aktiv. Nur FLH05 undFLH-PROJ01 bewusstOPEN/PARKED. Baseline/Vertrag/Kandidat/Tests/RemoteHEAD+Tree und separateCheckpointcommits sichern. VorMerge eigenekonkreteFreigabe des vollständiggeprüftenCI-Kandidaten.

## Bereits vorhandene konkrete Ausgangsbelege

- Main3b00336d/Run41080709085: unveränderteMain-/Cross-/Pages-Gates bestanden;964Units; vierSHA-verifizierteZIPs,68JSONs/65PASS-Berichte. v221-pr228-main-acceptance.json.
- ErsterLivejob124156258681: konkreterHTTP503 auf wallet-history-valuation.js, MIMEtext/html, blockierterModulgraph stattFinanztestfehler. v221-pr228-live-503-failure.json plus tatsächlichesFehlerbild. BisherigeTimeouts nicht pauschal als dieselbeUrsache deklarieren.
- Genau ein begründeter unveränderterLivejob-Retry124160800384 läuft; dessenAbnahme hatweiterVorrang. KeineCI-OPT01-Implementierung oderzusätzlicheTestausführung aus dieserAuftragsaufnahme.
