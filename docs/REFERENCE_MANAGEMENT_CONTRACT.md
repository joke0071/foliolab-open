# Historische Referenzwerte – Herkunft, Sichtbarkeit und Persistenz vor Code

Basis: v196 LIVE_ACCEPTED, main `bccd1f7956edba4d9ec0c5f11dc8edd023f31809`. Einziger neuer funktionaler Strang: `feature/reference-management`. Maßgeblich bleibt der vollständige zentrale UI-Nachtrag auf `feature/flh05-import-foundation`; keine neue Masterplanung. Diese Vertragsfassung wird vor Funktionscode separat gesichert.

## Herkunft und zulässige Aktionen

Alle bestehenden `model.snapshots` bleiben vollständige Originaldatensätze. Datum, Betrag/Exaktbetrag, Herkunft, Qualität, Aufschlüsselungen, Kurszeiten, Revisionen und Notizen werden durch Archivierung niemals verändert. `historical-portfolio-value.js`, `performance.js`, `capital-flows.js`, Reconciliation, Buchungen, Mengen und Geldflüsse erhalten dieselben Eingaben.

- Normale Liste: Datum, Beschreibung/Herkunft, Qualität, rechtsbündiger Betrag; keine dauerhaften Zeilenaktionen/Checkboxen.
- Manuelle Einzelbearbeitung ausschließlich bei eindeutig `source=manual`, `valuationStatus=manual` und ohne automatische Konto-/Positions-/Kursaufschlüsselung. Bestehende Edit-/Revisionsfunktion wiederverwenden. Alte Revisionen bleiben vollständig erhalten; keine rückwirkende Verifikation unbekannter Originale.
- Automatische, migrierte, unbekannte und widersprüchliche Herkunft erhalten keine pauschale Bearbeitungsfreigabe. Verständlicher Grund/Quellenverweis. Ein Importlabel ist kein kryptografischer Beweis.
- Der Rendite-Erfassungsstart wird nie zurückgesetzt. Bestehende Datum-/Betragssperre am Startstichtag bleibt; zulässige manuelle Notizkorrektur erhält den Start.
- Datum-/Betragskorrektur: vorher Herkunft, Datumskollision und vollständigen Ausgangszustand prüfen. Vorschau zeigt alten/neuen Stichtag/Betrag und die Wirkung auf Verlauf/Abgleich/Rendite; ausdrückliche Bestätigung vor Commit. Keine neue Renditeberechnung/Engine.
- Hinzufügen verwendet einen echten Neuanlage-Handler statt des bisher als Stichtag missverstandenen MouseEvents. Ein vorhandenes Datum wird niemals durch diesen Formularpfad überschrieben oder reaktiviert. Historische Werte brauchen weiterhin einen expliziten damaligen Wert.
- **Löschen ist für alle derzeit gespeicherten Stichtage gesperrt:** die bestehende Projektion verwendet jeden als Beobachtung und Datums-/Abgleichgrundlage. Unabhängige löschbare Datensätze sind im aktuellen Modell nicht nachgewiesen. Kein fingierter zulässiger Sonderfall, keine stille Teillöschung und kein Rücksetzen des Renditestarts. Sperrgrund in Verwaltung anzeigen; alte direkte UI-Löschaktion ebenfalls durch neuen Herkunfts-/Abhängigkeitsguard führen. Archivieren ist die sichere Alternative. Eine spätere unabhängig bewiesene Kategorie benötigt eigenen Vertrag.

## Ein vorhandenes Archivformat kontrolliert erweitern

Vorhandenes portables Modell4 und `bookingPresentation` wiederverwenden, **kein neues IndexedDB-Schema, kein automatisches Startupgrade und kein zweiter Speicher**.

- Bisherige Metadatenversion1 bleibt unverändert für ausschließlich archivierte Buchungen: `{version:1, archivedIds:[...]}`.
- Erste ausdrücklich bestätigte Referenzarchivierung aktiviert Metadatenversion2: `{version:2, archivedIds:[...], referenceArchivedIds:[...]}`, dabei ist die Referenzliste nicht leer. Die Buchungsliste darf leer sein.
- Strikte Form-/Versions-/Schlüssel-/Mengen-/ID-/Duplikats-/Referenzprüfung gegen echte normalisierte Snapshot- und Buchungsidentitäten. Ungültige, veraltete, verwaiste oder mehrdeutige Einträge brechen vollständig ab; keine stillen Drops.
- Wiederherstellung der letzten Referenz führt zu Version1, falls Buchungsarchive verbleiben; andernfalls wird der bestehende reine Modell3-Zustand hergestellt. Buchungsarchivierung/-wiederherstellung/-entfernung muss Referenzmetadaten erhalten und dieselbe gemeinsame Normalisierung verwenden.
- Aktuelle ältere Leser (v191–v196) lehnen Metadatenversion2 durch ihren bestehenden strikten Version-/Schlüsselvalidator ab. Ältere Modell3-Leser lehnen Modell4 ab. Sie dürfen neue Metadaten niemals unbemerkt verlieren. Dies vor Release gegen den echten v196-Leser nachweisen.
- Plain-Backup, vollständiger verschlüsselter V2-Backup, frischer UI-Restore, Reload, lokale Migration und vorhandene Drive-Verpackung erhalten beide Archivlisten. Alte Formate1/2/3 und Buchungsarchivformat1 bleiben lesbar.
- Benutzertext vor erster Referenzarchivierung erklärt die Kompatibilitätsgrenze. Eine neue kritische Produktionsentscheidung ist erst am vollständig geprüften Kandidaten erforderlich, gemäß zentralem Checkpoint: „Neue finanz-, migrations-, backup- oder sicherheitskritische Produktionsänderungen sind ohne eigene konkrete Freigabe nicht erlaubt.“ Implementierung/Review/Tests werden zuvor vollständig abgeschlossen.

## Reversible Sichtbarkeit und Auswahl

Archivierung/Wiederherstellung ändern ausschließlich die Verwaltungsansicht. Kein Herausfiltern aus Finanzprojektionen, keinerlei Ignore-/Revaluation-/Flow-/Journal-/Bestandsänderung. Archivfilter Aktiv/Archiviert/Alle erschließt alle Originale.

Bestehende Stable-ID-Auswahlengine `updatePositionSelection`, `selectionCoverage`, `selectionMaster`, gemeinsame Zeilen-/Dialog-/Aktionsstyles wiederverwenden. Verwalten/Fertig steuert nur sitzungslokale UI. Master ausschließlich aktuell angezeigte IDs, korrekter Teilzustand; keine globale zweite Auswahlstufe. Filter-/Seitenausweitung und Verlassen der Ansicht leeren die Auswahl ausdrücklich. Versteckte/archivierte/außerhalb der gerenderten Seite liegende IDs werden niemals unbemerkt erfasst. Gemischte Archivzustände oder unzulässige/stale IDs werden erklärt und vollständig gesperrt, keine stillen Teilerfolge.

## Atomare Speicherung und Fehlervertrag

Nur vollständig validierte Kandidaten auf Klonen. Vorschau bindet den gesamten ursprünglichen Modelltext; unmittelbar vor Commit erneute Herkunfts-/Abhängigkeitsprüfung, `portfolioStore.assertCurrent()`, bestehende Busy-/Stale-/CAS-/atomare IndexedDB-Gates. Savefehler/Quota/post-put-Abbruch/Abbrechen erhalten den exakten ursprünglichen Record samt Revision. Keine Mutation der Originale vor Freigabe; Fehler lassen Dialog/Verwaltung erneut bedienbar. Echte Offline-Commits und Reload müssen funktionieren.

## Verbindliche Abnahme

Gezielte unabhängige Unitreferenzen für Herkunft/Mischzustände/ungültige IDs/Versionsformen/Altmigration/Datumskollision/Renditestart/Originalerhalt/Plain+Encrypted-Roundtrip/Buchungs-Referenzarchiv-Kombination. Archivinvarianten prüfen vollständige Wirtschaftsdatensätze, historische Projektionen in allen Datenbasen, Reconciliation und bestehende TWR/XIRR-Ausgaben einschließlich einer wirklich belegten nicht-null Referenz.

Browser: Normalansicht, Verwalten/Fertig, sichtbare100er-Seite/Teilcheckbox/Filter/Seitenausweitung, zulässige/gesperrte Bearbeitung, gesperrtes Löschen, Archiv/Wiederherstellen, Neuanlage, Herkunft, 320/390/430/768/1440, Tastatur/Fokus/Axe/44px, echte Quota/post-put-Abbrüche/CAS, Plain und frischer verschlüsselter V2-UI-Restore, Offlinecommit/Reload. Bestehende Chromium-/Firefox-/WebKit-/Finance-/Import-/Restoregates unverändert. Finalen Kandidaten und Bilder vollständig prüfen, dann konkrete kritische Releaseentscheidung; vor Zustimmung kein Merge/Deployment. Nach Freigabe unverändert vollständige Main-/Pages-/tatsächliche Produktionsabnahme.

Gesamt-UI bleibt PARTIAL bis tatsächlicher Abnahme. FLH-PROJ01 bleibt ausschließlich dokumentiert; danach bestehende Mastersequenz ohne neue Planung fortsetzen.

