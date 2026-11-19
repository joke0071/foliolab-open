# Verlauf: Konzept für die zweite Navigation

Ausgangspunkt ist [der Nutzerauftrag in #300, Abschnitt 3](https://github.com/joke0071/foliolab-open/issues/300). Er verlangt eine konkrete Prüfung je Seite und Nutzerfeedback vor größeren strukturellen Änderungen. Auf dem gemessenen leeren 390-px-Beispiel beginnen Diagramm, Datenabdeckung, Rendite und historische Referenzen bei ungefähr 175, 390, 440 und 488 px. Die vorgeschlagene Projektion beginnt bei 569 px. Im kompakten Ausgangszustand ist die Seite bereits übersichtlich. Aufgeklappte Bestandsnachweise, Renditedetails und Szenarien bilden lange Arbeitsstrecken. Dann hilft ein Direktzugriff zu einer anderen Teilaufgabe.

## Vorschlag für einen kleinen Pilot

Eine flache Leistengruppe direkt innerhalb „Verlauf“ bietet **Diagramm**, **Datenabdeckung**, **Rendite**, **Stichtage** und nach Liveabnahme der Projektion **Szenarien**. Jeder Link springt zum bereits vorhandenen Arbeitsbereich. Bei einer geschlossenen Zielsektion öffnet er sie, ohne andere Sektionen zu schließen. Alle bestehenden Schaltflächen bleiben an ihrem Ort. Auf schmalen Bildschirmen scrollt nur die Leiste horizontal, mit sichtbarem Hinweis auf weitere Einträge. Der angesprungene Link und die fokussierte Überschrift bleiben sichtbar.

Eine echte Tab- oder Unterseitenumstellung wäre erst sinnvoll, wenn die Abschnitte eigenständige Arbeitsbereiche geworden sind. Zugleich würde sie Auswahl, Verwalten, aktive Zeiträume und Warnungen jetzt auf verschiedene Ansichten verteilen. Für diese Umstellung fehlt der konkrete Nutzenbeleg. Der Pilot kann mit bestehenden Akkordeons als Fallback auskommen. Heutige Inhaltsreihenfolge und Hauptnavigation bleiben gültig.

Die gefüllte synthetische Gegenprobe bei 390 × 844 px bestätigte den Unterschied. Bei geschlossenen Abschnitten beginnen Stichtage bei 688 px und die Projektion bei 769 px. Mit geöffneten Abschnitten liegen sie bei 1.298 bzw. 1.956 px. Gemessen sind Dokumentpositionen, keine Nutzungszeiten. Ein Direktzugriff ist vor allem in diesem zweiten Zustand sinnvoll.

Ein lokaler Prototyp im vorhandenen Verlauf-DOM erreichte bei 320 px mit der Tastatur alle vier aufklappbaren Ziele. Sie öffneten sich und erhielten Fokus. Die Dokumentbreite blieb bei 320 px und der persistierte Datensatz blieb exakt gleich. Der Versuch mit nacktem Fragmentlink verlor den zuvor gesetzten Überschriftenfokus. Deshalb muss die Integration Fragment, Öffnen, Scrollen und Fokus gemeinsam behandeln. Der Prototyp prüft weder Touch noch die vollständige Zurück-/Deep-Link-Kette und wird nicht ausgeliefert.

## Zustände und Annahmen

| Ziel | Zugang und Fallback |
| --- | --- |
| Diagramm | Zeitraumauswahl und Kalender bleiben beim Diagramm. Der Leerzustand mit Anlage-/Verweisaktion bleibt erreichbar. |
| Datenabdeckung | Bestehende Warnungen und Quelle bleiben im Diagrammbereich und in der zugehörigen Detailsektion. |
| Rendite | Bestehendes Akkordeon mit erklärtem fehlendem Startwert oder unvollständiger Geldflusserfassung beibehalten. |
| Stichtage | Bestehenden Auswahl-/Verwalten-/Archivzustand erhalten. Kein Link speichert oder verwirft eine Änderung. |
| Szenarien | Erst nach Liveabnahme der Projektion. Ein Sprung verwendet dieselben flüchtigen Annahmen wie die bereits geöffnete Sektion. |

## Abschluss des Piloten, falls der Umfang aktiviert wird

Direktlinks sind auch beim Öffnen im Browser und bei Vor/Zurück verständlich. Tastaturfokus wechselt zum Ziel, der aktive Eintrag wird semantisch angezeigt, die Hauptnavigation bleibt unverändert. Aktions- und Warnbereiche bleiben im leeren und gefüllten Zustand sichtbar. Bei 320 und 390 px können alle Ziele per Touch und Tastatur erreicht werden. Kein Überlauf der Gesamtseite und kein verdecktes Ziel unter dem festen Kopf. Unveränderte kanonische Daten bei Navigation, Restore und Offlinebetrieb. Bei messbar längerem oder unübersichtlicherem Weg kann die Leiste entfallen. Eine neue Sektion oder Migration ist dafür nicht nötig.

„Mehr“ bleibt außerhalb des Piloten. Dort sind lokale Wiederherstellung, Verbindungen und Quellen verschiedenartige Aufgaben. Die Seite braucht vor einem größeren Umbau einen eigenen Zweck- und Abhängigkeitsabgleich.
