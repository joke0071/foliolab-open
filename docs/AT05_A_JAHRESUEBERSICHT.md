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
