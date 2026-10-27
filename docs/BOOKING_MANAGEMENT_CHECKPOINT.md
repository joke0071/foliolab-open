# #165: Korrektur, Rücknahme, Vorschau, CAS und Undo — Kandidat

Basis main/v187 ab5c4aa9edcb44597975daf9684d5701f46a1cf1. Bestehender PR173 / Branch feature/booking-management-foundation wird weiterverwendet, nicht separat read-only gemergt. Vollständige frühere CI40511209825 ist Grundlage, keine Abnahme der neuen Mutationen. SW188 ist unveröffentlichter Kandidat. Kein Merge oder Deployment ohne konkrete Nutzerfreigabe.

## Zulässigkeitsmatrix

| Herkunft/Fall | Notiz | Wirtschaftliche Änderung/Rücknahme | Nachweis/Sperre |
|---|---|---|---|
| Eindeutig manuelle Buchung mit Journal | erlaubt, sofern kein Wallet-/Transfer-/Importbezug | nur folgende EUR-Cash-Fälle | Stabile ID, ein Journal je Buchung, globale Journal-/Mengenprüfung |
| Manuelle EUR-Einzahlung/Auszahlung/Dividende/Zinsen/Gebühr/Steuer | erlaubt | Betrag/Datum korrigieren oder vollständigen Geschäftsvorgang zurücknehmen | Exact-Mengen/EUR/Flow/Postings/Account gleich; EUR-Faktor1, kein zusätzliches Fee-/Tax-/Gegenkonto; keine weiteren Referenzen/späteren Kontrollpunkte |
| Manuelle Trades / Einstand / Kapitalmaßnahme | nur unkritische Notiz bei eindeutiger Herkunft | BLOCKED | Kein belegter inverser Kostenbasis-/Steuer-/Folgetransaktionsvertrag; kein rückwirkender Replay aus aktuellem Bestand |
| CSV/Broker/Exchange, auch ownership=manual | BLOCKED | BLOCKED | Quellidentität/Owned-Snapshot/Overlap/Batch-Undo darf nicht ungeprüft geändert werden |
| Transfer/Swap/Merger / bestätigte Zuordnung | BLOCKED | BLOCKED | Gegenbuchungs-/Transfervertrag zuerst gemeinsam prüfen; vorhandenes Transfer-Undo bleibt separat |
| Wallet/Blockchain | BLOCKED | BLOCKED | Eigentums-/Replay-/Dedupevertrag bleibt erforderlich |
| Technischer Journal-only Vorgang / unbekannte Herkunft | BLOCKED | BLOCKED | Kein isoliertes Journalposting-DELETE |
| Generierte technische Bestandsabgleichzeile | BLOCKED | BLOCKED | Kein gespeicherter selbständiger Geschäftsvorgang |
| Weitere Referenzen / spätere Snapshots / widersprüchliche Bestände | gegebenenfalls reine manuelle Notiz | BLOCKED | Konkreter Grund in Vorschau; keine Ausgleichseinzahlung oder Cascade |

## Implementierter Vertrag

Vorhandene Auswahlengine und bookingHistoryRows bleiben kanonisch. Auswahl gilt vor Pagination; globale Auswahl erfordert ausdrückliche Entscheidung, verdeckte Mengen sichtbar. Aus Sicherheits-/Ressourcengründen höchstens200 Geschäftsvorgänge je wirtschaftlicher Prüfung, nie stillschweigend Teilmengen bearbeiten.

Vorschau gruppiert betroffene Konten/Positionen und zeigt exakte Cashmengen, Gebühren/Steuern vorher/nachher, unveränderte oder unbekannte Einstandswerte, externe Flüsse sowie Historiengrenzen. Fehlende Rendite-/Kurswerte werden nicht erfunden. Abhängige Import-/Wallet-/Transferbelege werden gesperrt statt implizit kaskadiert.

EUR-Cash-Rücknahme entfernt die exakt verknüpfte vollständige manuelle Buchung samt ihrem gesamten Journalereignis und belegtem eigenen externen Flow. Sie entfernt niemals einzelne Postings. Die historische Folge wird mit vorhandenen Eröffnungen und verbleibenden Journalbewegungen geprüft; negativ werdende Zwischenbestände blockieren. Ersatzbuchungen laufen durch executeTransaction, einschließlich dessen Chronologie-/Mengenprüfungen.

Originalbuchung, kompletter Originaljournalsatz, eigene Flüsse, Beleggrund und Nachherbezug bleiben in einem validierten audit-only Journalereignis erhalten. Dieses besitzt genau ein Nullwert-Dokumentationsposting ohne Position/Konto/Menge und erzeugt keine Finanzbewegung oder neues künstliches Finanzdatum. Audit-Nachweise überstehen vollständigen Backup/Restore. Weitere wirtschaftliche Änderungen an bereits referenzierten Originalen werden konservativ gesperrt.

Commit berechnet Kandidaten erneut gegen exaktes Vorabbild, benötigt Checkbox und aktuellen IndexedDB-CAS-Stand, prüft Busy/Recovery/Mehrtab vor/nach Await und speichert genau eine Revision. Abbruch und Vorschau schreiben nichts. Undo ist ein sitzungslokaler exakter Vorabbild-Receipt, nur bis zur nächsten beliebigen Portfolioänderung und erneut mit CAS. Nach Reload/weiteren Änderungen bleibt Backup/Änderungsnachweis, keine universelle Undo-Garantie.

Oberfläche: Auswählen, gefiltert/alle/aufheben, Notiz, Betrag/Datum, Rücknahme prüfen, Bestätigung, optionales Undo und geschlossene Änderungsnachweise im v187-Stil. Vorhandener Dialog-/Escape-/Discard-/Fokusvertrag wird wiederverwendet.

## Fachliche Referenzen

- 100+20 EUR Einzahlung -> Rücknahme exakt100; externe20 entfällt; Eröffnung unverändert, Original bleibt Auditbeleg.
- 100+20 -> Betrag7,25 ergibt107,25; externer Flow exakt7,25.
- Alle sechs EUR-Cash-Arten unabhängig gegen blankes Referenzportfolio geprüft, auch Ertrags-/Gebühren-/Steuerübersicht.
- Zwei gleich benannte Cashpositionen/Konten bleiben getrennt; gemischter gesperrter Batch wird nicht teilweise übernommen.
- Späterer Verbrauch140 bei100+50: Entfernung50 führt zu negativem Verlauf und bleibt unverändert gesperrt.
- Falsches FX, fehlende/abweichende EUR-Beträge, Source/Ownership, gespeicherte Referenzen, Snapshots, stale IDs und Preimages blockieren.

## Prüfstand / nächster Schritt

Lokal728 Unit-Tests /0Fail/0Skip und Syntax bestanden. Neue unabhängige Fachtests sowie ein Browserflow für205 Buchungen/103 gefilterte, fünf Breiten/Axe, Vorschau/Escape, echte Quota/post-put-Abbrüche, konkurrierenden Tab, Offline-CAS, Undo und frischen plain/encryptedRestore vorhanden. Lokale Browserbinary fehlt; neue vollständige GitHub-CI und echte Bildprüfung noch offen. Keine vollständige Phase-A-Abnahme behauptet.

Nächster Schritt: finale PR173-CI/Bilder auswerten, Fehler beheben, Fach-/Source-Review sichern. Erst danach konkrete Produktionsfreigabe für diesen begrenzten belegten Umfang einholen. Breitere Trade-/Import-/Walletmutationen bleiben explizite Fachblocker, nicht als fertig melden.

## Gesamtfortsetzung

Originalformatnachweise für Broker/Exchange/Ledger wurden bisher nicht zugänglich gefunden; keine privaten Formate erfinden. #159 bleibt bis tatsächlicher lokaler Originalprobe blockiert. FLH04#160/#161 braucht Operator/OAuth/Remote-Concurrency/Neugerät/Recovery-Nachweise und eigene Freigabe. D157 nur mit neuer Browserhypothese. CI-Optimierung erst nach diesem sicheren Funktionscheckpoint, vorhandene Baseline aus PR172 wiederverwenden.

## Erster neuer Remote-Lauf

CI40517607177 Chromium erreicht neue Buchungsprüfungen nach bestandenen Finanz-/Historien-/Auswahl-/CAS-/Archivregressionen. Neue Axe-Prüfung meldet nach Resize Kontrast an addBooking.action-label. Testflow wartet nun auf tatsächlich laufende endliche Animationen plus zwei Frames (wie bestehende strenge Gates), keine Assertion geändert. Bei erneutem Fehler werden ComputedStyles/Viewport/Animationszustände diagnostiziert. Tatsächlicher Produktkontrastfehler noch nicht ausgeschlossen. Kein Merge/Deployment.
