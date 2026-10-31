# UI-MASTER28: fehlender Kurs ist kein Nullwert · 31.10.2026

Owner ChatGPT Work. P1, begrenzter Teilumfang des weiterhin offenen Text-/Funktionsvertrags.

Reproduziert im echten v231-Cloud-Browser: Erststart → Anlage hinzufügen → synthetischen ETF mit Bestand 2,5 und ohne optionalen Kurs speichern. Position zeigt „Kein Kurs“ und zugleich „€ 0,00“. Dieselbe irreführende Einzelbewertung erscheint im Anbieter-Akkordeon der Übersicht.

Korrektur: Diese beiden Positionswertanzeigen verwenden die bereits vorhandene Kurs-Evidenzprüfung `displayQuotePrice`. Bei fehlendem Kurs und vorhandenem Bestand steht „Nicht bewertet“. Nullbestand, nachgewiesener Nullkurs und aus der Summe ausgeschlossene Beiträge behalten ihre numerische Darstellung. Bereits gespeicherte positive Werte werden weiter angezeigt. Keine Änderung an valueEUR/totalEUR, Aggregaten, Finanzjournal, Mengen, Datenmodell oder Speicherpfaden; kein Schema und keine Migration.

Nachweise: 988/988 Unit-Tests und Syntax lokal PASS; neuer Browserfall prüft ETF/Krypto ohne Kurs, echten Nullbestand, Nullkurs mit Quelle und positiven Cashwert in Positionen und Übersicht bei 320/390/768/1440 px. Vollständiger IndexedDB-Datensatz einschließlich Revision nach Darstellung/Navigation unverändert. Im vorhandenen UI-Quality-Einstieg auch für Firefox/WebKit und Live-Abnahme eingebunden. Die lokale Chromium-Prüfung wurde mit dem Layoutkandidaten #239 kombiniert; komplette CI am exakten HEAD bleibt erforderlich.

Integration: auf dem unveränderten #239-HEAD aufgebaut, separater Folge-PR gegen dessen Branch, SW233 ausschließlich Kandidat. #239 zuerst nach konkreter Freigabe in main übernehmen, dann diesen Folge-PR auf main umstellen und den aktuellen Base-/HEAD-/CI-Zustand erneut prüfen. Nicht ungeprüft in einen laufenden #239-Kandidaten mergen. v231 bleibt die produktive Wochenendbasis, bis eine konkrete Freigabe erfolgt.

Weitere nicht vollständig bewertete Summen-/Detail-/Chart-/Walletfälle und UI-TEXT03–10 bleiben OPEN/PARTIAL. Kein appweiter Abschluss allein aus dieser gezielten Korrektur.
