# FLH03 – Anzeige nativer Flatex-Orderbeziehungen

Fortsetzung auf PR192 / feature/flh03-flatex-order-links, geprüfte reine Grundlage e48f147, Basis main8850874/v201.
Keine neue Roadmap; bestehender Fachvertrag FLH03_FLATEX_ORDER_LINK_CONTRACT.md unverändert.

## Begrenzter Anzeigenvertrag vor Code

- inspectNativeFlatexOrderLinks einmal je erfolgreich gewähltem Dateistapel berechnen, nur unveränderte Parserdokumente übergeben. Bei Datei-/Moduswechsel alle Gruppen-/Pagingzustände zurücksetzen; vorhandenen Generation-/Dialogschutz erhalten.
- Vorhandene Quellzeilenanzeige und deren globale50-Zeilen-Paginierung/Fokus erhalten. Ergänzend eingeklappte „Orderbeziehungen“ mit Anzahl möglicher1:1-Gruppen, Prüffälle und Zeilen ohne Orderreferenz. „Möglich“ bedeutet keine bestätigte Abrechnung, Kontoeigentümerschaft oder Importfreigabe.
- Alle Helperstatus deutsch und knapp zeigen, keine Statusumdeutung. Konkrete Gründe in jeder Gruppe; mehrere Beine/Storno/Konflikt/Overlap bleiben prüfpflichtig.
- Gruppe über Orderreferenz, Typ/ISIN soweit eindeutig, getrennte Depot-/Kontobeleganzahl beschreiben. Jede Beinanzeige mit Dateiordinal/Dateiname, physischer Zeile, Seite und getrennten Bank-/Orderreferenzen; Quellkontext, Buchtag/Valuta und exakte deklarierte Nominal-/Kurs-/Cashwerte aus der unveränderten Quelle. Keine Summen, Gebühren-/Steuerverteilung, künstliche Buchungen oder Dedupe.
- Gruppen initial20, je Gruppe Beine initial20; explizites Nachladen in20er-Schritten, Fokus auf ersten neu angezeigten Eintrag; offene Gruppen beim Nachladen erhalten. Kein versteckter Import-/Auswahlknopf. Nicht zugeordnete Zeilen bleiben vollständig in der bestehenden Quellanzeige verfügbar.
- Alle Quelltexte/Dateinamen/Referenzen HTML-escapen und lange Anzeigen kenntlich kürzen. Gleiche Dateinamen durch Dateiordinal unterscheiden. Parser-/Helper-/Legacy-/Finanz-/Storage-/Backupvertrag unverändert.
- submitBlocked, deaktivierter „Nur Vorschau“-Button und separater erzwungener Submitguard bleiben. Cancel/Escape/Neuöffnen und Moduswechsel löschen vorigen Anzeigestand.

## Abnahme

Öffentliche synthetische Units für jeden Status, getrennte Quellen/Referenzen/exakte Werte, Escaping, leere Gruppen, Grenzen und progressive Anzeige. Browser über vorhandenen CI-Einstieg Chromium/Firefox/WebKit: echte lokale Dateien, Status-/Beinerhalt, beide Paginierungen/Fokus/Reset, fünf Breiten320/390/430/768/1440/Axe/44px, Bilder tatsächlich ansehen, Submit/Cancel/Escape/Offline, exakter IDB-Record/Revision/Settings unverändert, keine externen Requests. Bestehende volle Pflicht-CI/Wallet nicht abschwächen. SW202 unveröffentlicht, vor Merge grüne aktuelle Gates/Quellreview; danach eigener Main/Pages/Livecheck samt Bytehashes und echten Produktionsprüfungen.

Keine privaten Originale für diesen UI-Schnitt erforderlich; öffentliche Artefakte rein synthetisch. Keine privaten Produktivdatenänderungen. UI-MASTER28/DELETE-MASTER28 und übrige Roadmap offen/erhalten. Zwei Etappen dieses Laufs: UI-Integration/Prüfung, anschließend kontrollierter Release/Liveabnahme soweit Gates erfüllt. Gesamtmaster PARTIAL.
