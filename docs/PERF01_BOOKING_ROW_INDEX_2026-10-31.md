# PERF01 – kurzlebige Indizes für Buchungszeilen

SW242-Kandidat nach PR249; Status und endgültige Produktionszuordnung im zentralen Checkpoint. Kein Abschluss aller Android-Performancepakete.

## Gemessener Engpass und Änderung

Das bestehende v240-Profil und die neue unabhängige Messung des PR249-Quellbaums zeigen wiederholte vollständige Buchungs-/Journal-/Kapitalfluss-Suchen innerhalb der Zeilenhinweise als wesentliche Eigenzeit. Hundert sichtbare Zeilen lösen bisher dieselben linearen Suchen vielfach aus.

`bookingRowsActionReasons(model, ids)` erstellt je synchronem Aufruf kurzlebige Indizes. Es verwendet dieselbe bestehende Entscheidungsfunktion für Notiz-/Löschhinweise, zählt weiterhin sämtliche Buchungen je Journal-ID, erhält alle passenden Kapitalflüsse und bevorzugt bei mehrdeutigen IDs wie das bisherige `find` das erste Element. Die bestehende Journalvalidierung und alle Sperrkriterien bleiben aktiv. Die Indizes verlassen den Aufruf nicht; nur die resultierenden Hinweistexte werden zurückgegeben. Sichtbare Zeilen und ausgewählte Buchungen verwenden jeweils eine aktuelle gemeinsame Auswertung.

Keine Freigabe wirtschaftlicher Aktionen aus Anzeigeindizes: `bookingChangePermissions`, `previewBookingChange`, `prepareBookingChange` sowie Referenzprüfung, vollständige Importvalidierung, Journalaudit, Bestätigung und CAS prüfen weiterhin den aktuellen vollständigen Datenstand. Keine Änderung an Finanzberechnung, kanonischen Daten, Serialisierung, Buchungsidentitäten, Verschlüsselung, Persistenz oder Sync. Keine Validierung entfernt und kein Cache über Modellrevisionen hinweg.

## Ergebnis und Grenzen

Identische synthetische Fixture mit19Positionen/10.000Buchungen/1.825Referenzen, Chromium, CPU4x,390×844px, je5 warme Navigationen mit zwei anschließenden Animationsframes:

| Quellbaum | Einzelwerte ms | Median ms |
|---|---|---|
| PR249-Anwendung vor Indizes | 884 / 850 / 916 / 983 / 800 | 884 |
| Kandidat mit Indizes | 665 / 697 / 672 / 630 / 603 | 665 |

Beobachteter Medianunterschied: **−24,77%** in diesem begrenzten Versuch. Ein getrenntes Diagnoseprofil je Variante bestätigt die verminderte Such-Eigenzeit. Kein statistischer Wirksamkeitsnachweis, kein Hardwareversprechen und keine Kaltstartmessung. Nicht mit früheren Prozentangaben addieren. Die früheren explorativen933→634ms bleiben als Zwischenmessung erhalten und sind nicht die finale Vergleichsbasis.

Der vollständige kanonische IndexedDB-Datensatz wurde innerhalb jedes Durchlaufs vor/nach sämtlichen Navigationen exakt gehasht und blieb unverändert. Verschiedene Durchläufe haben wegen Initialisierungszeitstempeln nicht zwingend denselben Gesamthash.

## Prüfung und Reproduktion

- 42 mutierte Fallgruppen /168 Vergleiche gegen die tatsächlich unveränderte Elternimplementierung: identische geordnete Gründe bei Importherkunft, Wallets, Gegenbuchungen, doppelten IDs/Journalreferenzen, unbekannten Feldern, Mengen-/Kontofehlern, Gebühren, Steuern, Kapitalflussfehlern und späteren Kontrollpunkten. Quellhashes und Ergebnis in `docs/perf-evidence/2026-10-31/booking-row-v242/frozen-parent-contract.json`.
- Dauerhafter Differentialtest gegen die bestehende nichtindizierte API, keine Änderungen während Auswertung, neuer vollständiger Index nach Modelländerung; wirtschaftliche Vorschau lehnt mehrdeutige kanonische Daten weiterhin durch vollständige Importvalidierung ab.
- Bestehende kompletten Finanz-/Speicher-/Buchungs-/Transfer-/Offline-/Restore-/Undo-/Chromium-/Firefox-/WebKit-Gates bleiben verpflichtend. Lokale und endgültige CI-Ergebnisse werden nur ihrem tatsächlichen HEAD zugeordnet.

Rohberichte, beide finalen und explorativen CPU-Profile, exaktes Messskript und Hashzusammenfassung unter `docs/perf-evidence/2026-10-31/booking-row-v242/`. Das unveränderte10.582.038Byte-JSON steckt in der bestehenden `docs/perf-evidence/2026-10-31/render-v238/fixture.json.gz`; SHA256 steht in `summary.json`. Das exakte Messskript erwartet die entpackte Fixture unter `/workspace/scratch/036b1bacfc1b/booking-render-fixture.json`, einen HTTP-Server auf4173, installiertes Playwright und `PROBE_OUTPUT`/`PROBE_SHA`; es wird aus der jeweiligen Repositorywurzel gestartet. Baseline und Kandidat nacheinander ohne andere lokale Browserprüfungen ausführen. Für die alte Implementierung den dokumentierten Elterncommit verwenden; die Testselektor-Korrektur d56 ändert keine Runtime-Assets gegenüber4a.

Alle Bestände synthetisch. Keine echte Android-/Safari-/TalkBack-/Google-OAuth-Abnahme.
