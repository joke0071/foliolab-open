# Lokale Archivübernahme und Wiederanlauf

Der experimentelle Speicheradapter unterstützt einen vorbereiteten Archivwechsel pro Profil. Die Dateiansicht wird über `showArchiveHandoff(container, api)` mit dem Adapter des geöffneten Profils eingebunden. Für die Entwicklung führt `npm run test:flh04` die Node-Verträge für Sync und die FLH04-Abnahmen aus. Der PR-Workflow ergänzt alle übrigen Node-Tests und die nativen Browserprüfungen.

| Vorgang | Eingabe und Ergebnis |
| --- | --- |
| Vorbereiten | Bisheriges Archiv, optional Quellarchiv und dessen getrennt erhaltene Prüfsumme. Nach Prüfung von Abstammung, Finanzstand und vorhandener Bindung speichert der Adapter einen kleinen Nachweis in IndexedDB und gibt die Zieldatei mit SHA-256 zum Download aus. |
| Erneut erstellen | Bisheriges Archiv und gegebenenfalls dieselbe Quelldatei reichen zur bytegleichen Wiederherstellung. Aufrufer der Rohframe-API müssen ergänzende Frames erneut vorlegen. Der bisherige Bezugspunkt bleibt gültig. |
| Neue lokale Buchungen einbeziehen | Bisheriges Archiv und bereits gespeicherte Zieldatei auswählen. Sobald die neue lokale Buchung erfasst ist, kann der Adapter ein weiteres Ziel vorbereiten. Für dessen Wiederanlauf dient die frühere Zieldatei als Quellarchiv. Der Downloadname enthält die Prüfsumme. |
| Prüfen | Die gespeicherte Zieldatei, das bisherige Archiv und gegebenenfalls die Quelldatei erneut auswählen. Der Adapter prüft den Inhalt und meldet, ob die Bestätigung aussteht oder das Ziel bereits gebunden ist. |
| Bestätigen | Der Adapter prüft die Dateien und vergleicht Vorbereitung, Archivbindung, Portfolio und Outbox im abschließenden Schreibvorgang. Eine Wiederholung erhält die aktuelle Auswahl bei bereits gebundenem Ziel. |

Eine ausdrücklich neu vorbereitete Übernahme kann die vorherige Vorbereitung ersetzen. Treffen verschiedene Vorbereitungen gleichzeitig ein, entscheidet der atomare Vergleich. Die reine Vorschau und die bisherige Bindungs-API funktionieren weiterhin für bestehende Aufrufer. Vor Einführung dieses Nachweises erzeugte Vorschauen lassen sich durch erneutes Vorbereiten am noch gültigen Ausgangsstand aufnehmen.
