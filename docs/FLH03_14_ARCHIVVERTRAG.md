# FLH03-14 — Archivvertrag vor Implementierung

Basis: main23af6d5, identische App zu live akzeptiertem v179. Konsolidierter Audit/Roadmap #156 ist abgeschlossen und integriert. D ist in #157 geparkt, keine parallele aktive D-Implementierung. Dieser Branch ist der einzige aktive funktionale Hauptstrang. Keine Merge-/Deploymentfreigabe für14 vorhanden; Änderungen zunächst als geprüften eigenständigen PR sichern.

Ein einziges optionales boolesches Positionsfeld `archived` kennzeichnet ausschließlich die Sichtbarkeit in der normalen Positionsliste. Fehlendes Feld bedeutet aktiv. Kein neues Portfolio-/Archivmodell, keine Datenbankmigration, keine zusätzliche Journal-/Löschengine. Unbekannte Feldtypen müssen beim Import scheitern. Wieder einblenden entfernt die Markierung. ID/Anbieter/Konto/Wallet und sämtliche Beträge/Bestände bleiben erhalten.

Archivierte offene Bestände zählen unverändert zu Vermögen, Allokation, Konten, Bestands-/Finanzhistorie und Rendite. Sie werden weiterhin normal aktualisiert und in Journal-/Importzuordnungen gefunden. Die UI erklärt diesen Umfang ausdrücklich. Standardliste zeigt aktive Positionen; „Archivierte anzeigen“ ergänzt archivierte Positionen, statt bestehende Bestände aus Berechnungen zu entfernen. Markierung und Wieder-einblenden sind ausdrückliche bestehende Dialog-/Saveaktionen mit exakter Vorschaufrische, aktueller Storageprüfung und einem CAS-Commit. Kein Snapshot und keine Transaktion als Nebenwirkung.

Alle gefilterten Positionen wählen weiterhin die vollständige tatsächlich angezeigte Filtermenge vor Pagination; „alle Positionen“ bleibt eine gesondert bestätigte Gesamtmenge einschließlich Archiv. Verdeckte markierte IDs bleiben sichtbar gezählt und die Löschvorschau zeigt sie; Archivierung berechtigt nicht zum Löschen referenzierter Daten. Alte Lösch-/Recovery-/CAS-Gates bleiben unverändert.

Manuelle Bearbeitung, CSV-Reimport, Flatex-Backfill und Wallet-Refresh dürfen nicht entarchivieren oder eine zweite aktive Identität erzeugen. Klartext-/verschlüsselte Vollbackups erhalten das Feld durch den bestehenden Modellvertrag; alte Backups bleiben lesbar. Kein automatisches Archivieren oder private neue Entwurfsspeicherung.

Abnahme: sold/zero und Restbestand, gleiche ISIN in zwei Konten, explizites Aus-/Einblenden, Filter-/Pagination-/Mehrfachauswahl, abgebrochener Dialog/Escape/Fokus, stale-preview/CAS/Quota/Abbruch, exakt unveränderte Finanz-/Historydaten und Summen, CSV-/Wallet-Replay, alte und verschlüsselte tatsächliche UI-Restores, Offline/Reload, Chromium/Firefox/WebKit, sechs Breiten/kleine Höhe und vollständiges Axe. Finale CI und unabhängige Sicherheitsprüfung müssen vor einer späteren konkreten Produktionsentscheidung erfolgreich sein.

Status: Fachvertrag erstellt; Implementierung/Tests folgen. Noch kein Paketabschluss oder Release behauptet.

## Implementierungscheckpoint

Optionales Archivfeld/Validierung, bestehende Editoperation, UI-Listenfilter und expliziterArchiv-/Wiedereinblenddialog implementiert. EinCAS-Commit nachexakterModell-/Storagefrischeprüfung; keineFinanz-/Historymutation. Editor/CSV/Wallet behaltenIdentität/Archiv, gefilterteAuswahlvorderPagination berücksichtigtSichtbarkeitsfilter; allePositionen bleibtGesamtmenge. ZusätzlicheDashboard-Prüfaktion zeigtarchivierteweiterbewerteteProblempositionenexplizit, verstecktePrüfhinweise werdenbenannt. NeueBackupsmitArchivmarkierungmitdieseroderneuererAppversionöffnen; alteAppskennenneueDarstellungsmetadatennicht, Finanzdatenformatbleibtv3.

GezielteUnit- undBrowserbelegeimCheckpoint, vollefinaleCI undProduktionsentscheidungnoch offen. Vertrags-CI amVorcode-CommitistkeinImplementierungsnachweis.

Separate Schlussprüfung: ausgeschlossene Repräsentationen und Verbindlichkeiten behalten ebenfalls ihre bisherigen Bewertungsregeln. Der neue UI-Text lautet deshalb „Bewertung unverändert“, ohne eine zweite Anrechnung zu suggerieren. Unabhängiger Sollwert 10 angerechnet +10 ausgeschlossen −3 Verbindlichkeit =7EUR vor/nach Archivierung und Restore,699Units und erneute gezielteChromium/Firefox/WebKit-Prüfung bestanden. Sicherheits-/Vertragsdiff dokumentiert; vollständige finaleCI und konkrete14-Produktionsentscheidung weiterhin erforderlich.

## Tatsächliche finale Codeabnahme

Code-/Test-HEAD32289f03498308ee5514ac597696c5044f681322: CI40372666186 und Wallet40372666074 vollständig erfolgreich.699Unit-Tests/0Fail/Skip, Syntax, vollständige Chromium-/Firefox-/WebKit-Gates und neue Archivefälle im echten Joblog bestätigt. Belege flh03-14-ci.json, flh03-14-local.json, flh03-14-security-review.json. Keine kritischen neuen Befunde aus der getrennten Diff-/Vertragsprüfung; keine unabhängigeHuman-/Hardwareabnahme behauptet. Dieser reine Abschlussdokumentationscommit verändert keine Appdatei; seine eigenen finalen HEAD-Gates vor einer Veröffentlichung im PR prüfen. Keine konkrete14-Produktionsfreigabe vorhanden, keinMerge/Deployment/Liveabschluss. Nächste erforderliche Entscheidung bleibt beim Nutzer gemäß dessen expliziter Freigabegrenze für neueUmfänge.
