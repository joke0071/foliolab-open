# Lokale Archivübernahme und Wiederanlauf

Der experimentelle Speicheradapter unterstützt einen vorbereiteten Archivwechsel pro Profil. Die Dateiansicht wird über `showArchiveHandoff(container, api)` mit dem Adapter des geöffneten Profils eingebunden. Für die Entwicklung führt `npm run test:flh04` die Node-Verträge für Sync und die FLH04-Abnahmen aus. Der PR-Workflow ergänzt alle übrigen Node-Tests und die nativen Browserprüfungen.

| Vorgang | Eingabe und Ergebnis |
| --- | --- |
| Vorbereiten | Bisheriges Archiv, optional Quellarchiv und dessen getrennt erhaltene Prüfsumme. Nach Prüfung von Abstammung, Finanzstand und vorhandener Bindung speichert der Adapter einen kleinen Nachweis in IndexedDB und gibt die Zieldatei mit SHA-256 zum Download aus. |
| Erneut erstellen | Bisheriges Archiv und gegebenenfalls dieselbe Quelldatei reichen zur bytegleichen Wiederherstellung. Aufrufer der Rohframe-API müssen ergänzende Frames erneut vorlegen. Der bisherige Bezugspunkt bleibt gültig. |
| Neue lokale Buchungen einbeziehen | Bisheriges Archiv und bereits gespeicherte Zieldatei auswählen. Sobald die neue lokale Buchung erfasst ist, kann der Adapter ein weiteres Ziel vorbereiten. Für dessen Wiederanlauf dient die frühere Zieldatei als Quellarchiv. Der Downloadname enthält die Prüfsumme. |
| Prüfen | Die gespeicherte Zieldatei, das bisherige Archiv und gegebenenfalls die Quelldatei erneut auswählen. Der Adapter prüft den Inhalt und meldet, ob die Bestätigung aussteht oder das Ziel bereits gebunden ist. |
| Bestätigen | Der Adapter prüft die Dateien und vergleicht Vorbereitung, Archivbindung, Portfolio und Outbox im abschließenden Schreibvorgang. Eine Wiederholung erhält die aktuelle Auswahl bei bereits gebundenem Ziel. |

Eine ausdrücklich neu vorbereitete Übernahme kann die vorherige Vorbereitung ersetzen. Treffen verschiedene Vorbereitungen gleichzeitig ein, entscheidet der atomare Vergleich. Die reine Vorschau und die bisherige Bindungs-API funktionieren weiterhin für bestehende Aufrufer. Bei älteren Profilen kann die Dateiansicht die aktuelle Bindung allein an der Zieldatei prüfen. Eine bereits gespeicherte, noch offene Zieldatei lässt sich am gültigen Ausgangsstand ausdrücklich neu vorbereiten. Ohne frühere Zielprüfsumme muss sie sich aus dem Vorgänger, dem lokalen Stand und gegebenenfalls der geprüften Quelldatei bytegleich rekonstruieren lassen. Zusätzliche frühere Rohlieferungen erfordern die separat erhaltene Zielprüfsumme. Eine andere aktive Vorbereitung bleibt dabei geschützt.

Der native Upgrade-Test verwendet die Originalmodule aus `b6b5678abcac780ef2db47b00565319215107552`. Für einen lokalen Browserlauf kann ein separater Checkout dieses Stands unter `flh04-previous/` neben `src/` bereitgestellt werden. Die CI lädt die zwei benötigten Quellverzeichnisse. Der fokussierte Node-Lauf braucht diesen Checkout nicht.

## Mehrere Konfliktstände gemeinsam sichern

Ab drei Köpfen bietet die experimentelle Konfliktübersicht „Alle Stände sichern“ an. Dafür muss im Profil das Backup-Passwort eingerichtet sein. Das verschlüsselte Verzeichnis, die lokale Finanzkopie und eine Finanzkopie pro angezeigter Revision zusammen mit dem gebundenen Konfliktarchiv aufbewahren. Beim Rücklesen jede gespeicherte Datei im zugehörigen Feld auswählen und das Backup-Passwort eingeben. Die Dateinamen dürfen geändert werden.

Die Finanzkopien enthalten die Finanzdaten des geprüften Snapshots im gewöhnlichen passwortgeschützten v2-Backupformat. Das Verzeichnis enthält Archiv- und Portfolioprüfsumme, lokale Revision, Outbox- und Pinversion, gespeicherte Auswahl sowie Rolle, Revisions-ID und SHA-256 der jeweiligen verschlüsselten Datei. Auch wenn der lokale Stand einem Kopf entspricht, entstehen zwei getrennt zugeordnete Dateien. Der Satz lässt sich im selben Profil nach einem Neustart mit der aktuellen Archivbindung erneut prüfen. Eine neue Auswahl oder Buchung erfordert eine erneute Sicherung des dann gültigen Konflikts.

Export und Prüfung lesen Portfolio, Outbox und Pin am Ende gemeinsam zurück. Beide funktionieren auch vor der ersten Auswahl. Eine gespeicherte Auswahl bleibt für den Einzelexport verfügbar. Die schreibende Konfliktübernahme erfordert weiterhin genau zwei Köpfe und die bestehenden Nachweise.

Für eine Wiederherstellungsprobe zuerst den Sicherungssatz am gebundenen Archiv prüfen. Anschließend jede Finanzkopie im regulären Backup-Import eines eigenen leeren Browserprofils öffnen, das Backup-Passwort eingeben und die Wiederherstellung bestätigen. Nach Schließen und erneutem Öffnen des Profils die Finanzdaten mit dem vor dem Export festgehaltenen Stand der jeweiligen Revision vergleichen. Bei gleichem Saldo unterscheiden beispielsweise Anbieter oder Journal die Kopien. Im Quellprofil das gebundene Archiv erneut öffnen und die gespeicherte Auswahl per Einzelexport prüfen.
