# AT01 – Gezielte abgeleitete Prüfaktionen

Basis main ad1d966ec98dff9eafba00dc262af0f5ad7ee894 (#137–140 integriert). Bestehenden Positionen-Filter „Zu prüfen“ erweitern, keine neue Hauptnavigation/Diagnosepersistenz oder automatische Reparatur.

## Delta und Grenzen

Eine betroffene Position wird genau einmal gezählt, mit getrennten bekannten Symptomen und je einer erreichbaren Folgeaktion. Quellen: vorhandene `valuationIssues`/`priceQuality` sowie positionsbezogen bestätigte Wallet-Historien und sichere Fortsetzungs-Checkpoints. Stabile IDs, Quelle, belegter Zeitpunkt und Schwere rein ableiten. Fehlende Wallet-Historie oder bewusst manuelle undatierte Kurse werden nicht pauschal zum Fehler erklärt. Keine Wallet-/Kontozuordnung nach gleich klingenden Namen oder geratenen Adressen.

Vorhandene Bewertungswarnungen bleiben fachlich dieselben. Dashboard-Drilldown zeigt weiterhin genau deren Kurspositionen, selbst wenn vorher andere Prüffilter gewählt waren. Im gemeinsamen Prüfen-Bereich wenige Filter: Kurse/Historie und eigenes Konto, mit eindeutigem Reset. Korrekturen an Daten beseitigen die abgeleiteten Hinweise beim nächsten Rendern; keine separate Bestätigungsliste.

Flüchtige Importkonflikte bleiben ausdrücklich im tatsächlichen CSV-Preview-/Zeilenreviewkontext, inklusive bestehender Quarantäne/A11y/Abbruchpfade. Refresh-/Providerfehler bleiben im vorhandenen Abrufkontext; unstrukturierte Meldungen werden nicht anhand von Namen auf Positionen geraten. Ohne belastbare persistierte Quelle wird kein globaler Diagnosezustand erfunden.

## Abnahme

Reine Projektion, kein Schreiben von Bestand/Kurs/Journal/Backups. Tests: Dedupe mehrerer Symptome, Quellen-/Zeit-/Aktionsbindung, fehlender/staler/429-Kursstatus und partielle/pending Historie, verschwundene Befunde nach Behebung, mehrere Konten, Filter/Reset, unveränderte bestätigte Mengen. Neue Browsergates: 320/390/430/768/1440px, tatsächlicher History-Dialog, Fokus, Axe und Nullmutationen. Bestehende CSV-Konflikt-/Finanz-/Storage-/Backup-/Offline-/Cross-Engine-Gates erhalten.

Status: Vertrag erstellt. Nächster Schritt: kleine abgeleitete Projektion und vorhandenen Prüfen-Einstieg gezielt erweitern; dann Tests und vollständige CI.

## Lokaler Codecheckpoint

Gemeinsame rein abgeleitete Prüfsicht implementiert: eine Position pro Zähler, getrennte bekannte Kurs-/History-/Fortsetzungshinweise, konkrete vorhandene Bearbeiten-/History-Aktionen, Kategorie/Konto/Reset. Der Dashboard-Bewertungsdrilldown setzt ausdrücklich den Kursfilter und bleibt fachlich exakt. Ein nicht bestätigter manueller Kurs wird nicht durch die Metadatenanzeige als zusätzlicher Fehler gezählt; deren Zahl heißt nun „nicht bestätigt“ statt des mit „Zu prüfen“ verwechselbaren „prüfen“.

633/633 Unit-Tests und Syntax bestanden. Sechs neue Referenzen: gruppierte Dedupe/Quellen/Zeit/Aktionen, kombinierte Filter, Verschwinden nach Behebung, keine Pflicht-Historie/kein pauschaler manueller-Kursfehler, 429 ohne Nullsetzung/rohe Secrets und keine Zuordnung fremder Historien nach Namen/Adressen. Lokales Chromium: fünf Breiten, tatsächlicher Wallet-History-Dialog samt Fokusrückgabe, Axe 0, Filterreset, exakt unveränderte IDB-Revision/Mengen, nach belegter Änderung verschwundene Hinweise. Bestehende präzise Bewertungsdrilldown-, CSV-Konflikt-/A11y- und FLH01-Gates bestanden. Eine anfängliche „Reparatur“-Fixture enthielt noch keinen belegten Anfangsbestand; erst mit expliziter synthetischer Genesis-Quelle wird sie vollständig, die Assertion blieb unverändert. Keine Produktions-Recovery-/Coverage-Schranke aufgeweicht.

Nächster Schritt: Code-Tree remote sichern und vollständige CI aller drei Engines abwarten. Keine Diagnosepersistenz/automatische Reparatur oder neue Finanz-/Storageengine. Flüchtige Importkonflikte und unstrukturierte Providerfehler bleiben in ihren vorhandenen Kontexten.
