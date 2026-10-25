# AT05-A – Referenzvertrag vor UI

Basis main 26a2460f7640464b323de8a031599f76c17bd680 (#137–139 integriert). Rein dokumentierende Jahres-/Kontenübersicht im bestehenden Bereich Buchungen → Erträge und Abzüge. Keine Steuerberechnung/-bescheinigung, kein OeKB/FIFO/Verlustausgleich oder angeblich vollständiger Brokerbeleg. B und #52 bleiben Beleg-/Fachgates.

## Herkunft, Identität und Summen

Datierte tatsächlich erfasste EUR-Dividenden/Zinsen und Gebühren/Steuern. Exakte Dezimalsummen; Betragslücken und unklare Kontenzuordnung separat sichtbar. Bestände, Journal, externe Cashflows, Rendite, Snapshots, Settings/Secrets werden nicht geschrieben. Keine Bewertung von Rewards mit heutigen Kursen. Verkäufe/Einzahlungen/technische Korrekturen sind keine dokumentierten Erträge.

Journalpostings sind die kanonischen Mengen-/Buchwertbelege. Ein Posting-ID wird nur einmal gezählt, auch wenn mehrere Buchungssichten denselben Journaleintrag referenzieren. Trade-Nebenkosten aus Gebühren-/Steuerpostings werden nicht zusätzlich aus den Buchungsfeldern addiert. Eigenständige Gebühren-/Steuerbuchungen werden über ihren eigenen eindeutigen Journalposten erfasst, nicht noch einmal als Buchungszeile. Verschiedene Journal-/Buchungs-IDs sind ohne weiteren Nachweis nicht anhand gleicher Daten/Beträge zu deduplizieren. Der Importkern schützt Quellidentitäten; mögliche wirtschaftliche Überschneidungen ohne gemeinsame Belegidentität lassen sich nicht automatisch beweisen.

Journalgebundene Position/Handelskonto bestimmt das Konto der Transaktionsnebenkosten; kein stilles Umbuchen zum Verrechnungskonto. Bei nicht eindeutiger Quelle bleibt „Konto nicht zugeordnet“. Journal-Datum hat für dessen Posting Vorrang; abweichendes Buchungsdatum wird als Hinweis ausgewiesen. Journalbetrag und gleichzeitiges Buchungsfeld werden bei Widerspruch nicht blind zusammengerechnet. Alte Buchungen ohne Journal erscheinen als dokumentierter Legacy-Betrag mit Herkunft; unbekannte EUR-Werte/Kosten bleiben offene Einzelposten, niemals null. Unbekannte Trade-Kosten ohne Posting erzeugen separat ausgewiesene Lücken. Erfasste Werte sind keine Bestätigung der steuerlichen Brutto-/Netto-Einordnung.

## Bedienung / Prüfplan

Vorhandenes Einklappelement, Filter Jahr/Konto, vier Betragssummen und aufklappbare Einzelbelege. Keine neue Navigation oder Exportengine. JSON-/verschlüsselte Vollbackups bleiben unverändert; Übersicht wird nach Restore aus denselben Daten abgeleitet.

Tests: Jahresrand, mehrere Konten, Dividende/Zinsen/Trade- und separate Kosten, gemeinsame Posting-Identität, unbekannte Werte, Fremdwährung nur bei tatsächlich erfasstem EUR-Buchwert, alte Backups/Restore, portable Secret-Canaries und verschlüsselter Restore. Alle Betrachtungen ohne Portfolioänderung. Browser: fünf Breiten, Filter/Reset, Detailbelege, Axe und Nullmutationen; vollständige CI vor Integration.

Status: Vertrag erstellt. Nächster Schritt: exakte lesende Projektion in booking-insights.js, Referenztests, dann kleine UI-Erweiterung.

## Lokaler Codecheckpoint

Lesende exakte Projektion und vorhandenes Einklappelement mit Jahr-/Kontofilter, Reset, vier Summen, sichtbaren Betragslücken und paginierten aufklappbaren Einzelbelegen implementiert. Kein zusätzlicher Export oder Persistenzpfad. Aktuelle Fremdwährungskurse werden nicht auf historische Erträge angewendet. Eingehende Überweisungen/Verkäufe/Rewards/Korrekturen werden nicht zu Dividenden/Zinsen umgedeutet.

626/626 Unit-Tests und Syntax bestanden, darunter neun neue Finanzreferenzen: Jahresrand/Konten, Trade- und separate Kosten, mehrfache Sicht desselben Postings, kein Dedupe unterschiedlicher Belege anhand gleicher Beträge, unbekannte Kosten/EUR-Werte, unklare Konten, widersprüchliche Datierung, historische FX-Buchwerte, alte portable Backups und Secret-Canary. Lokales Chromium: fünf Breiten, Filter/Reset/Belegdetails, Axe 0, keine Änderung selbst der IDB-Revision und verschlüsselter kompletter Restore inkl. freiwilligem synthetischem API-Key. Bestehende Buchungsfilter-/Transferregressionen bestanden. Ein tatsächlicher Kontrastfehler der wiederverwendeten kleinen Detailbezeichnungen wurde ausschließlich in den neuen Jahresbelegen auf die vorhandene dunklere Textfarbe korrigiert. Keine globale Styleänderung oder abgeschwächte A11y-Prüfung.

Exakt nächster Schritt: geprüften Code-Tree remote sichern; vollständige Chromium-/Firefox-/WebKit-CI vor Integration. Kein steuerlicher Abnahmeanspruch, Stufe B und #52 weiter blockiert.
