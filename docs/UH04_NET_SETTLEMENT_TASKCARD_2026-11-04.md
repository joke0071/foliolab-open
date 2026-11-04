# UH04 – nächster wirtschaftlicher Flatex-Schnitt

Stand 04.11.2026; Vorbereitung während der unveränderten v278-Mainabnahme. Noch keine Produktänderung oder Finanzfreigabe. Grundlage: IMPORT_HISTORY_UNIFIED_PLAN_2026-11-01.md und UH04_DEPOT13_NATIVE.md.

## Nutzerziel und belegter Engpass

Ein ausdrücklich gewähltes, eindeutig zusammengehöriges EUR-Depot-/Kontopaar soll im bestehenden Assistenten genau einmal Stück- und tatsächliche Nettocashwirkung übernehmen. Gebühren, Steuern, Kostenbasis und historische Vollständigkeit bleiben unbekannt, soweit die Quellen sie nicht belegen. Die vorhandenen Originalpaare haben auch bei identischem Buchtag und identischer Valuta eine ungeklärte Brutto-/Nettodifferenz. Ein ausschließlich auf rechnerische Gleichheit begrenzter Fall würde den wiedergefundenen Originalfall daher nicht lösen.

Der bestehende previewCSV-Vertrag sperrt bei unbekannten Gebühren/Steuern ein Verrechnungskonto. executeTransaction berechnet dessen Cash ausschließlich aus Brutto plus klassifizierten Gebühren/Steuern. Dieser Schutz darf nicht einfach entfernt werden. Zuerst ist eine eng begrenzte gemeinsame Transaktions-/Posting-Erweiterung für belegten Nettocash mit ausdrücklich unbekannter Aufteilung zu spezifizieren und unabhängig zu prüfen. Kein weiterer Vorschauparser als Paketabschluss.

## Zu qualifizierender gemeinsamer Vertrag

- Nur positionsgenau geprüfte Depot12/Konto10, echte getrennte Quellbereiche und Bankreferenzen, bestätigte eigene Depot-/Kontobindung, EUR/Stück, eindeutige unstornierte 1:1-Orderkorrespondenz sowie passende Buch-/Valutatage. Fehlende Depot13-Identität, Konto8, FX, Sonderereignisse und Mehrbeinfälle bleiben offen. Identische überlappende Originalvorkommen erhalten ihre Belege, Wirkung nur einmal; geänderte Payloads bleiben Konflikte.
- Bruttoausführung und tatsächliche Kontobewegung getrennt exakt erhalten. Ausgleich einer ungeklärten Differenz ausdrücklich als ungeklärter Verrechnungsbetrag behandeln; keine Gebühren-/Steuer-/Ertragsrolle daraus machen, auch keine Nullkosten bei Gleichheit. Bestand und gesamtes Journal müssen exakt aufgehen. Kostenbasis, realisierter Erfolg und davon abhängige Auswertungen bleiben unbekannt; eine neue Statusrolle muss auch in Rendite-/Qualitätsprüfungen wirksam sein.
- Keine zusätzliche externe Ein-/Auszahlung. Keine Kontobewegung als Saldo oder erfundene Eröffnung. Vorhandene Endbestände, datierte Eröffnungen, bestätigte Kosten, manuelle Änderungen und nicht vergleichbare Referenzstände schützen. Der erste Appendfall benötigt ausdrücklich bestätigte, vor der Auswahl liegende Anfangsbestände; historischen Cash-Backfill nicht aus heutigen Salden ableiten.
- Beide Quellenidentitäten und exakte Payloads gehören zu derselben dauerhaften Wirtschaftsgruppe. Depot-only-Wiederimport darf einen vorhandenen Cashbeleg nicht entfernen; nachträgliches Gegenbein darf keinen zweiten Kauf erzeugen. Eine bereits vorhandene reine Stückbuchung braucht einen gesondert geprüften Ergänzungsvertrag oder bleibt sichtbar gesperrt. Quellenentfernung und wirtschaftliche Rücknahme nicht gleichsetzen.
- Bestehenden Transaktionskern, Importbaseline, Journal, IDB/CAS, Backup/Restore und v5 verwenden; keine zweite Finanzengine. Eine vorgeschlagene optionale Herkunfts-/Posting-Erweiterung ist vor Speicherung strikt zu validieren, einschließlich entfernter Gruppen und Wiederimportsperren. Feldnamen/Struktur erst mit der Implementierung festlegen.

## Umfang und Abnahme

Betroffen: transactions.js, csv-import.js/import-identity.js, native Flatex-Projektion/Bindings/Simulation, model.js-Backupvalidierung und bestehender Importdialog. Kein neuer Produktbranch, solange v278 noch nicht vollständig live abgenommen ist.

1. Privater Originalfall und unabhängiger Python-CSV/Decimal-Oracle vor teurer CI: exakte Stück-, Brutto-, Nettocash- und ungeklärte Differenz; Reihenfolge und überlappende Wiederholungen ohne doppelte Wirkung. Öffentliche Fixtures ausschließlich synthetisch.
2. Tatsächliche Vorschau → aktueller Bestätigungsplan → ein atomarer Commit → Reload/Offline → verschlüsseltes v5-Restore → identischer Wiederimport; gleiche Bestände und Quellen, kein falscher Kapitalfluss/keine erfundenen Kosten.
3. Quota, post-put-Abbruch, tatsächlicher konkurrierender CAS, veraltete Zuordnung und geänderte Dateien: exakte Nullteilwirkung und neue Zustimmung erforderlich. Bestehende native Stückübernahme unverändert regressionsprüfen.
4. Dauerhafte Gruppenrücknahme einschließlich Quellen-/Löschschutz und abhängiger Buchungen prüfen. Ein sitzungslokales Receipt nicht als Reload-Undo ausgeben.
5. Bestehende vollständige Integrations-/Main-/Produktionsgates in Chromium/Firefox/WebKit und mobile Breiten erhalten. Erst nach tatsächlicher Abnahme veröffentlichen; UH04 als Ganzes bleibt für die offenen Dialekte, Sonderereignisse und Endbestände offen.

Nächster ausführbarer Schritt nach v278: exakten Nettocash-/ungeklärten-Verrechnungs-Postingvertrag im vorhandenen Kern implementieren und zuerst mit unabhängigem synthetischem Sollwert sowie dem gesicherten Originalpaar qualifizieren. Keine pauschale Neuanforderung von Dateien.
