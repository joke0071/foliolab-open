# Einheitliche sichere Löschlogik – verbindlicher Nachtrag vom 28.10.2026

Bezug: Masterauftrag, Buchungsverwaltung #165, Positionsverwaltung,
historische Referenzwerte und UI/UX #149. Status: **OPEN**, im nächsten passenden
konfliktfreien Verwaltungsschritt zu prüfen. Keine Unterbrechung, kein Neustart,
keine Umpriorisierung oder parallele Implementierung des laufenden Flatex-Pakets.

## Gemeinsamer Fachvertrag

Für Buchungen, Positionen und historische Referenzwerte soll Löschen möglich sein,
wenn sämtliche Abhängigkeiten sicher und nachvollziehbar behandelt werden können.
**Herkunft allein ist keine pauschale Sperre**, sobald eine fachlich sichere Rücknahme
nachweisbar vorliegt. Umgekehrt erlaubt eine aktive Schaltfläche keine ungeprüfte
Datenänderung. Vorhandene Lösch-, Archiv-, Rücknahme-, Vorschau- und Persistenzpfade
zuerst prüfen und wiederverwenden; keine zweite Verwaltungs-/Finanzengine.

Historische Referenzwerte gezielt prüfen: unabhängige manuelle, migrierte,
historisch ungeprüfte oder fehlerhafte Stichtage sowie nach belegter Rekonstruktion
nicht mehr benötigte Referenzen. Die gemeldete pauschale Löschsperre ist als
Istbehauptung noch gegen den aktuellen Code zu prüfen, nicht als Implementierungsbefund
ausgeben. Frühere herkunftsbasierte Schutzverträge bleiben bis zum sicheren neuen
Abhängigkeits-/Rücknahmebeweis wirksam; sie sind keine unveränderliche Produktanforderung.

Vor Freigabe jedes Löschpfads:
- Renditestart und historische Bewertungsgrundlagen prüfen.
- Abhängige Finanzberechnungen und Kontrollpunkte erfassen.
- Historische Diagramme und Datenabdeckung berücksichtigen.
- Gespeicherte Originalnachweise und Quellenidentitäten erhalten bzw. deren sichere
  Behandlung ausdrücklich nachweisen.
- Auswirkungen auf TWR/XIRR und Bestandsabgleich bewerten.

Nur fachlich sicher entfernbare Referenzen freigeben. Bei Abhängigkeiten eine
verständliche Auswirkungsvorschau oder einen sicheren Korrektur-/Alternativweg
anbieten. Keine automatischen Ersatzwerte oder künstlichen historischen Bewertungen.
Unklare Auswirkungen bleiben gesperrt, mit kurzem konkretem Grund.

## Einheitliche Bedienung in allen drei Bereichen

Bearbeiten direkt am Eintrag, sofern zulässig. Verwalten öffnet Einzel-/Mehrfachauswahl,
Fertig beendet sie. Archivieren, Wiederherstellen und Löschen in der zentralen,
kompakten Aktionsleiste. Auswahl und Änderungsumfang eindeutig anzeigen; gesperrte
Einträge und Gründe kompakt zusammenfassen, keine wiederholten langen Fehlermeldungen.
Vor endgültigen Änderungen Vorschau und Bestätigung. Bei gemischter Auswahl
**keine stillschweigenden Teillöschungen**. UI-MASTER28-Auswahlgrenzen und Filterreset
weiter erhalten; neue Entscheidungen übersteuern widersprüchliche alte UI-Texte.

## Gezielte Abnahme

Bestehende Schutzmechanismen erhalten und nur für nachgewiesene sichere Pfade erweitern.
Mindestens prüfen:
- Unabhängige manuelle Stichtage löschen.
- Migrierte Referenzwerte kontrolliert behandeln.
- Renditestart und relevante Kontrollpunkte schützen.
- Verlauf, Datenabdeckung und Performance vor/nach der Aktion nachvollziehen.
- Nicht mehr benötigte Positionen entfernen.
- Importierte Buchungen fachlich sicher zurücknehmen.
- Einzel-/Mehrfachauswahl einschließlich gemischter und gesperrter Mengen.
- Abbruch, Backup und Wiederherstellung.
- IndexedDB-CAS und konkurrierende Änderungen ohne stille Teilmutation.

**Keine Änderungen an privaten Produktivdaten ohne ausdrückliche Nutzerfreigabe.**
Synthetische Entwicklung/Regression ist davon getrennt; eine allgemeine
Entwicklungs- oder Releasefreigabe ersetzt keine Freigabe echter Datenänderungen.

## Wiederaufnahme und Abschluss

Beim nächsten passenden Verwaltungsschritt zuerst Ist-/Abhängigkeitsmatrix je Bereich
erstellen, konkrete sicher entfernbare Fälle und heutige Rücknahme-/Archivpfade
identifizieren, kleinste belegte Lücken schließen, gezielte Finanz-/Restore-/CAS-/
Drei-Engine-/A11y-/Livegates abnehmen und zentral sichern. Nicht allein für diesen
Nachtrag einen Parallelbranch oder eine neue Masterroadmap beginnen.

Ziel: Sicher Entfernbares kann entfernt werden; geschützte Einträge erhalten kurze,
nachvollziehbare Sperrgründe und möglichst einen sicheren Alternativweg.
