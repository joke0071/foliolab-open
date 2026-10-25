# AT01 – Gezielte abgeleitete Prüfaktionen

Basis main ad1d966ec98dff9eafba00dc262af0f5ad7ee894 (#137–140 integriert). Bestehenden Positionen-Filter „Zu prüfen“ erweitern, keine neue Hauptnavigation/Diagnosepersistenz oder automatische Reparatur.

## Delta und Grenzen

Eine betroffene Position wird genau einmal gezählt, mit getrennten bekannten Symptomen und je einer erreichbaren Folgeaktion. Quellen: vorhandene `valuationIssues`/`priceQuality` sowie positionsbezogen bestätigte Wallet-Historien und sichere Fortsetzungs-Checkpoints. Stabile IDs, Quelle, belegter Zeitpunkt und Schwere rein ableiten. Fehlende Wallet-Historie oder bewusst manuelle undatierte Kurse werden nicht pauschal zum Fehler erklärt. Keine Wallet-/Kontozuordnung nach gleich klingenden Namen oder geratenen Adressen.

Vorhandene Bewertungswarnungen bleiben fachlich dieselben. Dashboard-Drilldown zeigt weiterhin genau deren Kurspositionen, selbst wenn vorher andere Prüffilter gewählt waren. Im gemeinsamen Prüfen-Bereich wenige Filter: Kurse/Historie und eigenes Konto, mit eindeutigem Reset. Korrekturen an Daten beseitigen die abgeleiteten Hinweise beim nächsten Rendern; keine separate Bestätigungsliste.

Flüchtige Importkonflikte bleiben ausdrücklich im tatsächlichen CSV-Preview-/Zeilenreviewkontext, inklusive bestehender Quarantäne/A11y/Abbruchpfade. Refresh-/Providerfehler bleiben im vorhandenen Abrufkontext; unstrukturierte Meldungen werden nicht anhand von Namen auf Positionen geraten. Ohne belastbare persistierte Quelle wird kein globaler Diagnosezustand erfunden.

## Abnahme

Reine Projektion, kein Schreiben von Bestand/Kurs/Journal/Backups. Tests: Dedupe mehrerer Symptome, Quellen-/Zeit-/Aktionsbindung, fehlender/staler/429-Kursstatus und partielle/pending Historie, verschwundene Befunde nach Behebung, mehrere Konten, Filter/Reset, unveränderte bestätigte Mengen. Neue Browsergates: 320/390/430/768/1440px, tatsächlicher History-Dialog, Fokus, Axe und Nullmutationen. Bestehende CSV-Konflikt-/Finanz-/Storage-/Backup-/Offline-/Cross-Engine-Gates erhalten.

Status: Vertrag erstellt. Nächster Schritt: kleine abgeleitete Projektion und vorhandenen Prüfen-Einstieg gezielt erweitern; dann Tests und vollständige CI.
