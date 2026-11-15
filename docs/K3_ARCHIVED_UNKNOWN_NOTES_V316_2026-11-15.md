# K3 · archivierte Buchung mit unbekannten Kosten · v316

## Vorab festgelegte Prüffrage

Nutzerablauf: Buchungen → Ansicht „Archivierte“ → Verwalten → Bearbeiten → nur Notiz ändern → Vorschau abbrechen beziehungsweise bestätigen → zweite Seite derselben Origin/des Profils öffnen → im ursprünglichen, weiterhin offenen Fenster rückgängig machen → erneut öffnen.

Synthetisches Soll: Ausgangscash 100 EUR + manuelle Einzahlung 20 EUR = exakt 120 EUR. Gebühren und Steuern sind null/UNKNOWN, booking-a ist archiviert. Betrag/Datum/Löschen bleiben geschützt. Nur die Notiz ist erlaubt. Vorschau benennt unbekannte Kosten und unverändertes Vermögen. Abbruch schreibt nichts. Bestätigung erzeugt genau einen nativen Portfolio-Commit/eine CAS-Revision, bewahrt alle Finanz-, Archiv-, Herkunfts- und Historienfelder außer Notiz plus dokumentierendem Nullwirkungs-Audit. Wiederöffnung liest den exakt gespeicherten Record und die neue Notiz. Undo in derselben Sitzung stellt raw/settings exakt wieder her, mit genau einem weiteren Commit. Erneutes Öffnen bewahrt den rückgenommenen Record. Keine Zusage von Undo nach Sitzungsverlust.

## Abgrenzung vorhandener Nachweise

K3-Einstellungen v308, Wallet-Metadaten v304 sowie bestehende Archiv-/Finanz-/Undo-Abnahmen werden wiederverwendet. Der native Lauf 43567167015 (QA-Quelle 4249a698fda42896099db6e3b7321ba0434121f2, tests/browser-latest-native.mjs) prüfte unbekannte Gebühren/Steuern nur bis zur Notiz-Vorschau; kein Bestätigen in diesen Fällen. Bestehende browser-booking-management behandelt die normale EUR-Notiz mit bekannten Nullkosten; booking-unknown-costs charakterisiert die Berechtigung/Vorschau. Neu ist ausschließlich deren bislang unbelegte Integration mit archiviertem Datensatz, dauerhaftem Commit, Wiederöffnung und Undo.

## Unveränderlicher Laufvertrag

Produkt: v316 LIVE_ACCEPTED, Main 82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69, Tree 11429de9e06d9d014875af624cb80bafafb38f20. QA-Head 0dd0f76d6791cc91924a28222d9c92b3f6c58c3e, direkter Elterncommit ist Produkt-Main. Genau drei neue QA-Dateien; kein Produktpatch. Isolierte Ref test/k3-archived-notes-v316-20261115, ein Ubuntu-24.04/Chromium-Workflow mit vorhandenem Playwright 1.56.1, eigenem synthetischem Browserkontext und aktivem Service Worker/Cache v316. Keine Deployment-/Release-CI. Archivzustand entsteht als Fixture über vorhandene Produkt-API, nicht als zusätzliche behauptete Archivierungsabnahme. Native IDB-put/complete-Beobachter reichen unverändert an Originalmethoden durch; sie ersetzen weder Save noch CAS. Unabhängiger readonly Recordvergleich und zweite Seite verhindern einen reinen UI-/In-Memory-Nachweis.

Vor Start: Fixture/Vertrags-Vorabcheck und Syntaxprüfung lokal PASS, kein nativer lokaler Browsernachweis. Jeder Laufabschnitt schreibt seinen Beginn in report.json; Fehlerzustand/DB/Screenshot werden soweit erreichbar gesichert; Cleanup separat bewertet. Originalartefakt enthält Report, vollständige Records, Quell-/Laufidentitäten, native Logs und drei Dialogbilder. Nach erstem Ergebnis betroffenen Job/Artefakt auswerten; keine blinde Wiederholung.

## Ergebnis: begrenzter K3-Teilpunkt DONE / PASS

[GitHub-Lauf 43704011917, Versuch 1](https://github.com/joke0071/foliolab-open/actions/runs/43704011917) und Job132781073772 sind SUCCESS. QA-Head 0dd0f76d6791cc91924a28222d9c92b3f6c58c3e; Produktbasis unverändert v316/Main82ce. Ubuntu24.04, Chromium141.0.7390.37, Playwright1.56.1, Node22.23.4. Ein isoliertes Profil/Origin http://127.0.0.1:4173, aktiver Controller /sw.js, Cache foliolab-open-v316, DB-Version1 und Modus idb-v1 tatsächlich beobachtet. QA-Diff enthält ausschließlich die drei vorab eingefrorenen Workflow-/Test-/Fixturedateien.

| Geprüfter Schritt | Beobachtung |
| --- | --- |
| Ausgangszustand | Archivierte booking-a; exakt120 EUR, externer Geldfluss20 EUR, Gebühren/Steuern null/UNKNOWN, ursprüngliche Notiz; Revision2. |
| Bearbeiten/Vorschau | Notiz bearbeitbar; Betrag, Datum und Löschen geschützt. Gebühren und Steuern ausdrücklich unbekannt → unbekannt; Gesamtvermögen120 →120. |
| Abbrechen | Vollständiger Record einschließlich raw/settings/revision unverändert;0 native puts/commits. |
| Bestätigen | Genau1 Portfolio-put und1 vollständiger Commit,0 Abbrüche; Revision3. Notiz geändert, genau1 dokumentierender Audit; nach dessen Abzug und Rücksetzung der Notiz entspricht das gesamte Modell dem Ausgangsmodell. Archivstatus, Quellen, unbekannte Originalkosten und Finanzhistorie bewahrt. |
| Zweite Seite, gleiche Origin/gleiches Profil | Vollständiger Record exakt gleich gespeichertem Nachzustand; Notiz über normalen Archive-/Verwalten-/Bearbeiten-Einstieg wiedergefunden; Schutzfelder weiterhin gesperrt;0 implizite Writes. Archivfilter bewusst erneut gewählt, keine Persistenz dieses Ansichtsfilters behauptet. |
| Undo im ursprünglichen offenen Fenster | Genau1 weiterer nativer Commit, Revision4; raw und settings exakt vor Notizänderung wiederhergestellt. |
| Wiederöffnung nach Undo | Vollständiger rückgenommener Record unverändert; ursprüngliche Notiz im Editor,0 implizite Writes. |

41 protokollierte Gleichheitsprüfungen bestanden, keine Pageerrors, beide begrenzten Dialog-Axe-Scans0 Verstöße. Drei Originalbilder tatsächlich visuell geprüft: Vorschau zeigt unbekannte Kosten/unverändertes Vermögen; Editor nach Öffnen zeigt neue Notiz und geschützte Finanzfelder; Editor nach Undo/Reload zeigt ursprüngliche Notiz. Cleanup separat PASS. Es gab keinen nativen Fehlversuch und keine Korrektur am Produkt. Die vorab lokale Fixtureinitialisierung wurde vor Freeze berichtigt; der native Lauf war einmalig und erfolgreich.

## Dauerhafte Belege und Rückprüfung

- [Vollständiger Originalreport mit Vorher-/Nachher-/Undo-Records](release-evidence/k3-archived-unknown-notes-v316-2026-11-15/report.json).
- [Originalartefakt ZIP](release-evidence/k3-archived-unknown-notes-v316-2026-11-15/original.zip), [vollständiges Joblog](release-evidence/k3-archived-unknown-notes-v316-2026-11-15/job.log), [Laufmetadaten](release-evidence/k3-archived-unknown-notes-v316-2026-11-15/run.json), [Artefakt-ID/Digest](release-evidence/k3-archived-unknown-notes-v316-2026-11-15/artifact.json).
- Artefakt14158310086,183288Bytes,SHA256 0641245c1e9c800860ffdcc2bba6313594c9d73fd9e4d5018986a07b9a2c3ad5; Downloadgröße/Digest/ZIP-CRC geprüft. Original unverändert auf Dokumentationsbranch gespeichert, Commit c66c14a44f08aa4b7096fa34781e7cb2a3207627, Gitblob20ae6035473db67882261789afd8f8f441e6d85f. Unabhängiges gepinntes GitHub-Rücklesen bytegleich; daraus tatsächlich alle11 Originaldateien extrahiert, per Datei gehasht und Report/41Prüfungen/exakte Undo-Bytes erneut geprüft. [Rücklese-/Restoremanifest](release-evidence/k3-archived-unknown-notes-v316-2026-11-15/readback-restore.json).
- Keine neue Voll-/Release-Sicherung nötig: neuer synthetischer QA-Originalsatz vollständig und unveränderlich gepinnt im Repo, bestehende v316-/ältere Originalketten unverändert weiterverwendet. Kein Produktcode, Main, Merge oder Deployment verändert.

## Aussagegrenze und Fortsetzung

Nur der oben benannte unterstützte K3-Ablauf ist geschlossen. Gesamt-K3 bleibt PARTIAL; keine universelle Bearbeitungs-/Löschfreigabe. Die reine Archivierung war Fixtureaufbau und ist durch bestehende Archivbelege zu beurteilen. Wiederöffnung meint zweite Seite im selben Browserkontext sowie Reload, keinen OS-Neustart; Undo bleibt an die ursprüngliche aktive Sitzung und unverändertes Portfolio gebunden. Kein Windows-/Edge-/Android-Gerätebeleg, keine neue Restore-/Eviction-Abnahme oder vollständige1.0-Freigabe. Bestehende Release-/Restore-/Evictionbelege gelten weiter.

Nächste ausführbare1.0-Arbeit: für den verbleibenden K3-Gesamtabschluss die zugesagten Normaltypen aus #165/#257 den vorhandenen Archiv-/Buchungs-/FIN-Abnahmen zuordnen und ausschließlich eine konkret noch unbelegte Integration als nächsten Testvertrag benennen; bereits geschlossene Notiz-/Einstellungs-/Walletfälle nicht wiederholen. A09 bleibt ohne bestätigten Endpunkt OPERATOR_INPUT_PENDING. #298 C wartet ausschließlich auf neuen Entwurf/Erstellungs-Chat/Originalquelle/konkrete Auskunft von Jochen; interne Zuordnungen und offene Ursprungs-/PNG-Exportnachweise bleiben erhalten. Keine erneute Quellen- oder Geräteanfrage aus diesem Abschluss.


## K3-Gesamtentscheidung · aktiver Prüfvertrag 15.11.2026

Main/Checkpoint am Einstieg82ce/6277f9fa unverändert, letzter passender QA43704011917 vollständig SUCCESS, keine passende laufende Arbeit. Zusagen aus #165/#257 nach heute unterstütztem Fachumfang begrenzt; historische Issue-Zeile „noch keine Mutation implementiert“ ist kein aktueller Produktbefund. Maßgeblich aktuelle Funktionen und v316-Abnahmen. Keine Erweiterung universeller Finanzmutationen aus UI-Parität.

| Noch zu entscheidende Frage | Warum vorhandene Belege diese Kombination nicht abschließen | Entscheidender neuer Nachweis |
| --- | --- | --- |
| Verdeckte Teilmenge über100er-Seite und Archivfilter in allen drei Listen | [v316 booking-management](https://github.com/joke0071/foliolab-open/blob/82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69/tests/browser-booking-management.mjs) setzt die große Auswahl vor Einzelmutation zurück; [position-archive](https://github.com/joke0071/foliolab-open/blob/82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69/tests/browser-position-archive.mjs) bestätigt alle aktiven201 statt kleiner verdeckter Teilmenge; [reference-management](https://github.com/joke0071/foliolab-open/blob/82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69/tests/browser-reference-management.mjs) leert große Auswahl vor3sichtbaren Archivmutationen. [management-parity](https://github.com/joke0071/foliolab-open/blob/82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69/tests/browser-management-parity.mjs) belegt Auswahl/Modi, ohne neue Mutation. | Aus104Datensätzen3vorarchiviert,101aktive. Genau IDs103und003 über zwei Seiten wählen; Archivfilter auf3vorarchivierte wechseln:2gewählt/2ausgeblendet. Beim zwischenzeitlichen Hinzuwählen001 gemischte Archivaktion gesperrt, nach Abwahl wieder ausführbar. Vorschau genau2korrekt zuordenbare Originale; Abbruch0Writes; Bestätigung genau1Commit/Revision und nur diese2Archivflags. Andere102IDs und sämtliche wirtschaftlichen Werte unverändert, Wiederöffnung exakt. |
| Einzelzeileneditor bei anderer verdeckter Auswahl in allen drei Listen | Bisher normale Einzel-Editor-/Finanz-/Schutzbelege, aber keine explizite Konkurrenz zwischen Zeilen-ID und fremder ausgewählter Teilmenge. | Frischer identischer Aufbau, ausgewählt103/003, sichtbar archivierte001 bearbeiten: ausschließlich Notiz001 ändern.103/003 und alle anderen IDs geschützt;1Commit. Buchungsvorschau benennt ausschließlich001 plus Notiz-Audit. Referenz erhält1alte Revision. Positionsnotiz erzeugt nach vorhandenem regulärem Vertrag zusätzlich1aktuellen Snapshot mit unveränderter Vermögenssumme und lastAccountId; kein Bestands-/Historienverlust. Danach „Fertig“ ohne weitere Writes, keine Checkbox/Edit-/offenen Detailreste oder Restselektion; unabhängig wiedergeöffnet gleicher Record. |

Vorab feste wirtschaftliche Orakel: Positionen104×2EUR=208EUR, zwei Cashkonten100+100 plus104Einzahlungen×1EUR=304EUR (je152EUR), Referenzen Cash100EUR und104historische manuelle100EUR-Werte. Zielpräfixe p/b/r; Vorarchiv000/001/002; gewählte IDs103/003; Einzelziel001. Je Kategorie zwei unabhängige frische Profil-Fixtures; in Chromium/Firefox/WebKit getrennte Ergebnisse. Insgesamt18Fälle, jeder aus tatsächlichem IDB-Baseline-Record. Observer delegiert unverändert an native put/complete, unabhängige readonly Reads/zweite Seite und genaue protected-ID-Modellvergleiche. Keine Save-/CAS-/Handlerersetzung.

Vorab geprüft: vorhandene DOM-Selektoren/Archiv-Confirmfelder/100er-Nachladebuttons, Sortierreihenfolge, de-AT-Datum dd.mm.yyyy und normales Positions-Snapshotverhalten direkt am Maincode und bisherigen QA-Quellen abgeglichen; alle3Fixture-Sollwerte lokal PASS, Harnesssyntax PASS. Nur neuer isolierter QA-Workflow, keine Release-/Full-CI/Deployment. Bestehende vollständige v316-Gates und ursprünglicher UNKNOWN-Notizbeleg werden nicht wiederholt. Native Ergebnisse dieses neuen Vertrags noch AUSSTEHEND.

Eingefrorener QA-Head: 0dd968b22d0b55369165766e91d48d773753b348.
