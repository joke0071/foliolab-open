# Native Flatex-Stückhistorie kontrolliert übernehmen · Vorabvertrag 29.10.2026

Fortsetzung desselben PR195, bestehende native Projektions-/Simulations-/Dialogpfade.
Kein neuer Parser, kein zweiter Import-/Speicherkern. Vor Codeänderung vollständigen
laufenden UIkandidaten a8adc396/CI40842974152 regulär abschließen und prüfen.

## Zulässiger Umfang

Nur die vollständig qualifizierte gemeinsame Stückhandels-Simulation aus allen
ausgewählten nativen Dokumenten darf übernommen werden. Bestehende Quellen-,
Kontobestätigungs-, Typ-/EUR-/ISIN-/Manual-/Kosten-/Backfill-/Bestandsgates vollständig
wiederverwenden. Append ausschließlich leere ungeschützte Positionen oder unveränderte
Dubletten; Backfill exakte beobachtete Endmenge erhalten. Kein Skip/Override, keine
Konto-/Positionsanlage, Cash-/FX-/Steuer-/Sonderbuchung oder fiktive Eröffnung.

Gebühren/Steuern/Kosten bleiben ausdrücklich unbekannt. Keine vollständige
Kosten-/Saldo-/Cashflow-/Historien-/Renditefreigabe, auch nach erfolgreichem Import.
Historienstart01.01.2022 weiterhin erhalten, keine früheren belegten Zeilen still filtern.

## Bestätigung und Sicherung

Nach zulässiger Simulation mit neuen Zeilen bestehenden lokalen Backupmechanismus
für exakt denselben aktuellen Modellbaseline verwenden, einschließlich vorhandener
Historie, ohne API-Keys. Downloadstart offen als Downloadstart kennzeichnen.
Nutzer bestätigt gesondert, dass Backup sicher abgelegt ist, der konkrete gesamte
Stapel geprüft wurde und nur Stückhistorie ohne bekannte Kosten übernommen wird.
Vorher Submit deaktiviert; programmatisches Submit prüft alle Gates erneut.
Dubletten allein erzeugen keinen Save und keine neue Revision.

Datei-/Format-/Konto-/Quellbestätigungs-/Moduswechsel, neue Simulation, Stale-Hinweis,
Abbruch und Dialogwechsel verwerfen Ergebnis, Backupbezug und Übernahmebestätigung.
Paging erhält nur die noch aktuelle Sitzung. Keine Bestätigung über Reload speichern.

## Atomarer Schreibpfad

Unmittelbar vor Übernahme aktuelle Revision über assertCurrent, unveränderten
Dialog/Aktions-/Dateigeneration und exakten Baseline prüfen. Native vollständige
Qualifizierung aus Originaldokumenten und aktuellen Bindungen erneut ausführen;
keine fremden UI-DTOs als Autorisierung verwenden. Nur den intern bestätigten
gleichen Simulationsentwurf verwenden, wenn Zeilen/Modus/Baseline unverändert sind.
Bestehende importCSV-/ledgerQuantityAudit-/safeImport-/CASspeicherung benutzen.
Vor Speicherung auf Clone arbeiten. Bestehenden aktuellen Snapshotmechanismus
unverändert wiederverwenden; keine historischen Werte erfinden.

Genau eine akzeptierte CASrevision; konkurrierende/stale Entwürfe abweisen.
Bei echter Quota/post-put-Abbruch keine Teilbuchung/Revision/Settingsänderung.
Fehler setzt Zustimmung/Backupbezug/Übernahmeentwurf zurück, keinen stillen Retry.
Sitzungslokales bestehendes csvUndoReceipt/undoCSV wiederverwenden; exakte
Modellrücknahme, spätere Änderungen sperren Undo. Keine neue selektive Löschengine.

## Abnahme und Produktionsgrenze

Units/Syntax, echte synthetische UI-Übernahme append und backfill, exakte Mengen/
unbekannte Kosten/keine externen Cashflows/keine fremden Depotänderungen, Backup-
Downloadinhalt, Bestätigungsreset, forcierter Submit ohne Gates, tatsächliche
Quota/post-put-Abbrüche und Mehrtab/CAS, Replay ohne Revision, exaktes UI-Undo,
Plain-/EncryptedRestore und Offline. Fünf Breiten/Axe/Fokus/44px; vollständige
aktuelle Chromium/Firefox/WebKit-/Wallet-/Quell-/Artefaktabnahme.

Private Originale/Produktivprofile unberührt. Synthetischer eigenständig reviewbarer
Kandidat zuerst vollständig herstellen. **Neue aktive wirtschaftliche Übernahme
benötigt danach eine konkrete Nutzerentscheidung für Merge/Deployment.**
Vorher nicht mergen/publizieren oder als produktiv abgenommen melden.

FLH05-Zukunftskompatibilität ausschließlich durch ohnehin nötige Wiederverwendung
bestehender gemeinsamer Verträge. Kein FLH05 vorziehen, kein Zusatzrefactoring.
FLH05/PROJ01 geparkt; UI-/DELETE-MASTER28/PERF01/FLH04/übrige Roadmap offen erhalten.
