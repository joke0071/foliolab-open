# UH05 – genau drei EUR-Ausführungen und ein Cashbeleg

Mainbasis v291: `6b020461aec68b6281dbc00e32c953dc6cec14cb`, Tree `6cc86610f633d4e93665d7f53c40282144c9df28`. Owner b1b383f4f228. Kandidat v292, noch keine Integrations-/Produktionsabnahme.

Der gemeinsame Import kann drei getrennt bankreferenzierte Ausführungen derselben EUR-Order mit genau einem Cashbeleg als vollständige Version3-Gruppe übernehmen. Vier Buchungen und vier Journale enthalten drei Asset-/Clearingpaare und ein Cash-/Clearing-/Differenzjournal, insgesamt neun Postings. Gruppendifferenz und unbekannte Gebühren/Steuern/Kosten bleiben ausdrücklich getrennt. Keine Cashverteilung auf Ausführungen, keine erfundene Kostenbasis oder externe Einzahlung/Entnahme.

Version3 bindet die ID an Version und vollständige sortierte native Mitgliedermenge samt Payloaddigests. Lokale Depot-/Kontozuordnung muss aktuell bestätigt sein. Version2 bleibt auf genau zwei Ausführungen beschränkt; bisherige IDs und Belege sind unverändert. Fehlende/geänderte Mitglieder, zusätzliche Ausführungen/Cashbelege, FX, falsche Konten, Schutzreferenzen und widersprüchliche Historie werden weiter gesperrt. Die Verwaltung bietet keine wirtschaftliche Teilrücknahme; vollständiges Sitzungs-Undo und geprüftes Restore bleiben die Rückwege.

## Prüfung

- Vorbereitete unabhängige Python-Decimal-Sollwerte: zehn Kauf-/Verkaufsfälle, gleiche/ungleiche und gebrochene Mengen, verschiedene Preise, positive/negative/Null-Differenz. `tests/flatex-three-fill.test.mjs` prüft alle40 Kombinationen aus zehn Fällen, zwei Dokumentreihenfolgen und Depot12/Konto10 bzw. Depot13/Konto8. Erwartete Mengen, Brutto, Cash, Gruppendifferenz und jedes Posting werden unabhängig verglichen.
- Gezielte Negativtests: jedes fehlende Mitglied/Journal, Version-/Payload-/Quellen-/Reihenfolge-/Mengenänderungen, Rollenwiederverwendung, zusätzliche Ausführung/Cash, Fremdwährung, Datum/Valuta/Order/ISIN/Scope, fehlende Teilgruppen und neu bestätigte fremde Depotzuordnung. Quell-/Modellnichtmutation, Belegerweiterung aller Mitglieder, Wiederimport, Sitzungs-Undo und v5-Restore.
- Tatsächlicher alter v291-Reader weist den neuen V3-Backupinhalt zurück; V2-Proofs und IDs gegen unveränderten v291-Code exakt verglichen.
- `tests/browser-flatex-three-fill.mjs`, eingebunden in die vorhandene verpflichtende Nettogruppe: in Chromium/Firefox/WebKit je beide Dialekte, je zehn Sollfälle gegen tatsächlich kanonisch gespeicherte IDB-Bytes. Vollständige gemeinsame UI mit Backup/Freigabe, genau einer CAS-Revision, Quota-/post-put-Nichtmutation, echtem Zweittabkonflikt, Undo/umgekehrtem Wiederimport, Offline-Reload und verschlüsseltem v5-Fresh-Restore. Fünf mobile Breiten/Axe. Lokale Bilder gesichtet. Keine physische Android-/native-Safari-/Hardwareabnahme.
- 81 ursprüngliche native Gruppen erneut gegen den unveränderten privaten unabhängigen Originaloracle geprüft; Originalpostings/Audit und unbekannte Kosten erhalten. Kein privater3:1-Originalbeleg und kein Vollhistorien-/Eigentumsclaim.

Lokale Browserumgebung: Playwright1.62.1 mit vorhandenen Browsern Chromium141/Firefox157/WebKit26.5; explizite Executablepfade und isoliert wiederverwendete WebKit-Laufzeit. Firefox benötigt in dieser lokalen Containerumgebung `MOZ_DISABLE_CONTENT_SANDBOX=1`. Keine Produkt-/CI-Sandboxänderung. Der erste lokale Firefoxversuch scheiterte an der Container-Usernamespace-Sandbox, vor Appaufruf; danach vollständige Kette bestanden. CI verwendet weiterhin ihre unveränderten gepinnten Browser-/Sicherheitsgates.

Historische v289-/v291-Baseline-Repros bleiben historische Nullfreigabeanker und werden nicht auf die neue Implementierung umgedeutet. Reguläre Pflicht-CI, eingefrorener Integrationskandidat, geschützter Merge, Mainlauf, Deployment und tatsächliche Produktion müssen vor LIVE_ACCEPTED bestehen. Keine Gates gelockert, keine CI dupliziert/abgebrochen, kein Checkpointbranch-Merge.

Alle weiteren N:M-/FX-/Referenz-/Wallet-/Stakingfälle, UI300-Nachträge, QUALITY298, CI229, Android und sämtliche übrigen Produktaufträge bleiben offen. EFF01/HND01 und alle Finanz-/Identitäts-/Journal-/CAS-/Backup-/Restore-/PWA-Verträge gelten unverändert.
