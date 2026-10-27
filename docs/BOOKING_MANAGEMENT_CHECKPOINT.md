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

Originalbuchung, kompletter Originaljournalsatz, eigene Flüsse, Beleggrund und Nachherbezug bleiben in einem validierten audit-only Journalereignis erhalten. Dieses besitzt genau ein Nullwert-Dokumentationsposting ohne Position/Konto/Menge und erzeugt keine Finanzbewegung oder neues künstliches Finanzdatum. Audit-Nachweise überstehen vollständigen Backup/Restore. Validierte eigene Nullwert-Auditnachweise werden von fremden wirtschaftlichen Referenzen unterschieden. Die jüngste eindeutige Änderungskette muss exakt zum aktuellen Vorgang passen; andernfalls gesperrt. Dadurch bleiben wiederholte belegte Korrekturen möglich.

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

Lokal733 Unit-Tests /0Fail/0Skip und Syntax bestanden. Neue unabhängige Fachtests sowie ein Browserflow für205 Buchungen/103 gefilterte, fünf Breiten/Axe, Vorschau/Escape, echte Quota/post-put-Abbrüche, konkurrierenden Tab, Offline-CAS, Undo und frischen plain/encryptedRestore vorhanden. Lokale Browserbinary fehlt; neue vollständige GitHub-CI und echte Bildprüfung noch offen. Keine vollständige Phase-A-Abnahme behauptet.

Nächster Schritt: finale PR173-CI/Bilder auswerten, Fehler beheben, Fach-/Source-Review sichern. Erst danach konkrete Produktionsfreigabe für diesen begrenzten belegten Umfang einholen. Breitere Trade-/Import-/Walletmutationen bleiben explizite Fachblocker, nicht als fertig melden.

## Gesamtfortsetzung

Broker-/Exchange-Originaldateien sind hier weiterhin nicht zugänglich. Für Ledger ist der frühere private 12-Spalten-Schemaaudit bereits in den Kommentaren von #159 belegt; nicht wiederholen. Offizielles LedgerHQ csvExport.ts wurde zusätzlich an c7947b848a87b175c8d7d4a81ed255ca26ab800e geprüft (gleiche12Spalten). Konto-/Chain-/Assetidentität, IN-/OUT-Feezuordnung, Mehrfachoperationen je Hash und reale Zuordnung müssen weiterhin belegt werden; Countervalues sind Marktbeobachtungen, keine Kauf-/Steuerbasis. FLH04#160/#161 braucht Operator/OAuth/Remote-Concurrency/Neugerät/Recovery-Nachweise und eigene Freigabe. D157 nur mit neuer Browserhypothese. CI-Optimierung erst nach diesem sicheren Funktionscheckpoint, vorhandene Baseline aus PR172 wiederverwenden.

## Erster neuer Remote-Lauf

CI40517607177 Chromium erreicht neue Buchungsprüfungen nach bestandenen Finanz-/Historien-/Auswahl-/CAS-/Archivregressionen. Neue Axe-Prüfung meldet nach Resize Kontrast an addBooking.action-label. Testflow wartet nun auf tatsächlich laufende endliche Animationen plus zwei Frames (wie bestehende strenge Gates), keine Assertion geändert. Bei erneutem Fehler werden ComputedStyles/Viewport/Animationszustände diagnostiziert. Tatsächlicher Produktkontrastfehler noch nicht ausgeschlossen. Kein Merge/Deployment.

Weitere Review-Korrektur: nextJournalSequence verwendet die höchste vorhandene Sequenz statt der Journalanzahl, damit Folgegeschäftsvorgänge nach Rücknahmen nicht doppelte/kleinere Nummern erhalten. Regressionsfall Rücknahme + Folgeeinzahlung mit unabhängigem Sollsaldo113 EUR bestanden. Neuer Browserflow ergänzt echte UI-Rücknahme, Notiz/Undo und programmgesteuerten Submit auf gesperrter Importherkunft. Kontenfixtures sind ausdrücklich getrennte Konten.

CI40519556015: neue Chromium-Prüfungen für Korrektur, Rücknahme, Notiz, Undo, Restore/CAS erreichen den zuletzt ergänzten Import-Sperrfall. Tatsächlicher UI-Fehler: hidden-Attribut des saveDialog wurde durch .btn-display überschrieben. Gezielter [hidden]-Style korrigiert die Sichtbarkeit, programmatischer Submit bleibt weiterhin durch preview.ready und Provenienz gesperrt. Testassertionen unverändert. Referenzprüfung zusätzlich auf8MB/200kKnoten/64Ebenen begrenzt; übergroße/ungeklärte Strukturen bleiben unverändert gesperrt. Vollständige letzte CI noch erforderlich.

Fokusvertrag ergänzt: nach Commit/Undo ersetzt der Render die auslösenden Verwaltungsbuttons. Der gemeinsame Dialogguard fokussiert dann die neue Buchungsaktion, analog zur bestehenden Positionsverwaltung; gezielte Browserassertionen prüfen beide Fälle.

Bildprüfung: Kontoeffekte in320/390/1440 tatsächlich angesehen. Anschließend Belegreferenz und aufklappbare Einzelübersicht jeder ausgewählten Buchung (ID, Typ, Position, Datum/Betrag/Notiz vorher/nachher) ergänzt, damit Bestätigung nicht nur Kontosummen zeigt. Browser prüft die tatsächlich geöffneten Vorher/Nachher-Felder; unveränderte Fachassertions bleiben. Neue finale CI erforderlich.

Abschließender Referenzreview: unbekannte Buchungs-/Journal-/Postingfelder sowie unbekannte Referenzen sperren auch Notizänderungen. Eigene validierte Auditnachweise werden nicht fälschlich als fremde wirtschaftliche Verknüpfung behandelt; die jüngste eindeutige Sequenz muss mit dem aktuellen Vorgang übereinstimmen. Nachherbelege sind eigenständige tiefe Kopien statt Objektaliase. Neue Referenzfälle prüfen mehrfache Korrektur/Notiz/Rücknahme, unbekannte Metadatenreferenzen, abweichende/doppelte Auditketten und Manipulation. Lokale733Tests bestehen; finale Remote-Abnahme dieses Heads offen.


## Gemeinsamer UI-Nachtrag: Positionen und Buchungen

Vorheriger fachlicher Checkpoint `9daa130d514a928179ed1018883a40f2dde28393`: CI [40524779982](https://github.com/joke0071/foliolab-open/actions/runs/40524779982) vollständig erfolgreich mit733 Unit-Tests und allen drei Browsern. Keine Veröffentlichung.

Im selben PR-Strang integriert, kein paralleles Paket: bestehende stabile Auswahlengine erhält eine gemeinsame `cycle`-Aktion. Sie ergänzt zuerst die aktuell dargestellte Seite (bestehendes „Weitere anzeigen“ erweitert diese), dann den gesamten Filterbereich und setzt danach vollständig zurück. Bereits vollständige Bereiche überspringen wirkungslose Stufen. Filter, Sortierung und Pagination selbst verändern keine IDs. Einzelauswahl bleibt erhalten. Ohne Positionsfilter umfasst der explizit beschriftete Gesamtbereich auch archivierte Positionen. Ohne Buchungsfilter sämtliche vorhandenen Buchungszeilen. Abbrechen beendet den Modus. Keine Auswahlmenüs mehr.

Positionen: dieselben drei Einzelicons stehen im oberen Kartenbereich, Checkbox links, Icons rechts mit Umbruch und44px-Zielen. Oben „Alle löschen“ (bestehende Vorschau) und „Alle archivieren“. Neue Sammelarchivierung setzt ausschließlich vorhandene Archivflags für die explizite Auswahl; bereits archivierte Zeilen bleiben unverändert. Bestätigung, genaue Liste/Konten und Auswirkungen, exakter Modellvorstand und IndexedDB-CAS vor einem atomaren Save. Wiederherstellung über vorhandene Einzelaktion. Keine neue Finanz-/Importengine.

Buchungen: Zulässigkeit derselben vorhandenen Auswirkungenprüfung bestimmt die aktivierten Aktionen; konkrete Sperrgründe stehen direkt unter der Leiste. Keine Archivierung, keine Umgehung der Vorschau/Bestätigung/atomaren Fachprüfung. Notiz und Betrag/Datum weiterhin nur einzeln, gemeinsame Rücknahme nur bei vollständig belegter Zulässigkeit und innerhalb der bestehenden Grenzen.

Automatisierte Referenzen ergänzen Checkbox-Zyklus, Teil-/Einzelauswahl, leere/einseitige Filter, Pagination, Abbrechen, versteckte IDs und deaktivierte Herkunftsfälle. Bestehende wirtschaftliche und Speicherfehlerassertionen bleiben erhalten. Neue Sammelarchivierung prüft tatsächliche Quota-/post-put-Abbrüche, exakt einen Commit und unveränderte wirtschaftliche Daten. Geometrie und Axe für320/390/430px sowie Desktop. Lokale735 Unit-Tests erfolgreich; neue Browserabnahme nach diesem UI-Head noch ausstehend.

**Release-Gate bleibt geschlossen:** neue Buchungsmutationen und neue Sammelaktionen erst nach eigener konkreter Nutzerfreigabe mergen und produktiv schalten. Kandidat SW188 bleibt unveröffentlicht.


UI-CI40527206898: Positionsauswahl, sechs Breiten, obere Kartenicons/Geometrie, zwölf Axe-Prüfungen und bestehende Quota-/CAS-/Offline-/Restore-Referenzen erfolgreich. Archivtest erwartet nach verändertem Sichtbereich noch sofort die alte globale Auswahl. Test auf die neue belegte Zweistufe erweitert:201 bestehend →250 nach expliziter sichtbarer Seite →401 nach explizitem Gesamtbereich; keine Produktlogik angepasst. Neue Sammelarchivierungs-Vorschau zusätzlich in320/390/430/1440 mit Axe und44px-Footer geprüft. Separate Test-Settings beim Wiederherstellen des synthetischen Fixtures erhalten. Positions-Auswahlbuttons explizit auch am Desktop mindestens44px hoch.


Statischer Folgereview: Undo-/Audit-Markup wird nach der Auswahlleiste ergänzt; der finale Checkbox-DOM erhält seinen checked/indeterminate-Status deshalb erst danach. Browserreferenz prüft Teil-, Seiten- und Einzelauswahl ausdrücklich auch nach vorhandener Änderung samt Undo/Audit und unveränderten Speicherbytes. Synthetische Buchungsfixture hat deterministische IDs, damit gleichdatierte Sortierung und die100er-Seite reproduzierbar bleiben; keine Zufallsannahme über UUID-Reihenfolge.
