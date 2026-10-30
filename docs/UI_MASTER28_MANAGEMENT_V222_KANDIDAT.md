# UI-MASTER28 / UX10 – gemeinsame Listenverwaltung

Work-eigener P1-Teilschnitt auf Main
`d6b2a14f2108bc210411054d5f3d7690ba44fd51`. Dies ist ein vorbereiteter
Kandidat mit SW222. Produktion v221/SW221 bleibt für den Praxistest unverändert.
Merge und Deployment benötigen eine eigene konkrete Freigabe.

## Verhalten dieses Kandidaten

| Bereich | Normalmodus | Verwaltungsmodus |
| --- | --- | --- |
| Positionen | Verwalten, Bearbeiten als Text; keine permanenten Stift-/Archiv-/Löschicons | Fertig, Auswahl, zentrale Lösch-/Archivaktionen; keine Bearbeiten-Aktion in den Listenzeilen |
| Buchungen | Verwalten; Bearbeiten nur bei bisher zulässiger Bearbeitung, sonst kurzer Hinweis auf die Buchungsdetails | Fertig, Auswahl und bestehende zentrale Archiv-/Löschaktionen; keine Zeilenaktionen |
| Historische Referenzwerte | Vorhandenes Verwalten; zulässiges Bearbeiten als Text, geschützte Herkunft bleibt sichtbar | Vorhandenes Fertig, Auswahl und zentrale Aktionen; keine Bearbeiten-Aktion in den Zeilen |

Fertig löscht ausschließlich die vorübergehende Auswahl und führt zum
Normalmodus zurück. Tastaturfokus und 44px-Touchziele werden erhalten.
Positionen und Buchungen behalten ihre bestehende Dreistufenauswahl (sichtbare
Seite, ganzer Auswahlbereich, zurücksetzen). Referenzen behalten ihren
bestehenden Seiten-/Auswahlvertrag. Paging und Behandlung versteckter/veralteter
IDs bleiben erhalten.

Bei genau einer sichtbaren ausgewählten Position verwendet die zentrale
Archiv-/Wiederherstellungsaktion den bisherigen Einzelpositionsdialog.
Mehrfacharchivierung verwendet weiterhin den bestehenden Sammelpfad. Eine neue
Sammel-Wiederherstellung wird nicht eingeführt: Bei mehreren ausschließlich
archivierten Positionen wird die Aktion mit dem Hinweis auf die sichere
Einzelwiederherstellung deaktiviert. Der bisherige Einzelpfad bleibt erreichbar.

UI-TEXT07: Die gemischte Buchungsliste erhält den neutralen Kicker „BUCHUNGEN“
statt „MANUELLE ERFASSUNG“. Weitere Textaudit-IDs werden damit nicht abgeschlossen.

Die Speicherfunktion baut die Buchungsleiste nach Abschluss von `saving` neu
auf. Damit wird eine nach Quota-/Transaktionsfehler und Abbrechen veraltet
deaktivierte Aktion wieder aus dem tatsächlichen Schreibzustand abgeleitet.
Bei nicht lesbarem Portfolio erfolgt dieser Neuaufbau nicht. Konflikt-,
Schreibbarkeits-, Bestätigungs-, CAS- und Herkunftsprüfungen werden erhalten.

## Grenzen und verbleibende Arbeit

Keine neue Finanzberechnung, Migration, Buchungsrekonstruktion oder
Speicheroperation. Keine neue Bearbeitungs-/Löschberechtigung für geschützte
Importe oder Referenzwerte. Vorhandene Dialoge, Vorschauen, Undo und Restore
bleiben maßgeblich. Auch die bisher zulässige Einzel-Löschung im vorhandenen
Positionseditor bleibt erreichbar und behält ihre Schutzprüfungen. Änderungen an Archivfiltern, eine Sammel-Wiederherstellung
von Positionen und weitere UX10-/DELETE-MASTER28-Teile bleiben offen.
Dieser Kandidat schließt weder UI-MASTER28 noch DELETE-MASTER28 insgesamt ab.

## Copilot-Abgrenzung

Die gelieferten Visual-Drafts werden nicht neu implementiert. Der Work-Schnitt
ändert die funktionale Listenbedienung. CSS sichert die nachgewiesenen
44px-Ziele der neuen Textschaltflächen und den vollständigen Umbruch geschützter
Buchungshinweise auf schmalen Geräten; keine visuelle Neugestaltung.

Der unveränderte Textpatch von PR213 lässt sich bereits auf Main d6b2a14f nicht
vollständig anwenden: Kontext am Ende von `app.js` (Zeitrauminitialisierung)
und die spätere CSS-Erweiterung. Diese beiden Konflikte werden durch den Work-Schnitt nicht verursacht.
Die zusätzliche neutrale Buchungsüberschrift verändert außerdem eine
Kontextzeile des späteren More-HTML-Patches; „BUCHUNGEN“ muss beim Anpassen
erhalten bleiben. Keine dieser Stellen wird durch erneute Visual-Implementierung
ersetzt.
PR213 ist hier nicht integriert. Seine spätere Anpassung muss die aktuellen
Zeitraumfunktionen und sämtliche CSS-Blöcke erhalten. Danach die dokumentierten
Abhängigkeiten zu PR214, PR218 und PR219 beachten. Für weitere reine CSS-Pakete
bleibt eine eventuell sinnvolle gemeinsame Integrationsoption separat zu prüfen
und konkret freizugeben.

## Nachweise und Releasegrenze

Bestehende Buchungs-, Positionslöschungs-, Positionsarchiv-, Referenz- und
Detailprüfungen werden an die neue sichtbare Bedienung angepasst. Ihre
Finanzwerte, Herkunftssperren, 200er-Prüfgrenze, Quota-/Transaktionsabbruch-,
Mehrtab-/CAS-, Offline-, Backup-/Restore- und Revisionsassertionen bleiben
verbindlich. Keine Timeoutlockerung und keine blinde Screenshotaktualisierung.

Der fertige Kandidat benötigt vollständige INTEGRATION in Chromium, Firefox und
WebKit. Konkrete Ergebnisse, exakter HEAD/Tree, echte Berichte und Bilder stehen
im zentralen Checkpoint und in den separaten Abnahmebelegen auf
`feature/flh05-import-foundation`. Ein reiner FAST-Erfolg ist keine Abnahme.
Bis zur eigenen Freigabe bleiben Main und Produktion unverändert.

Die neue Nutzwertpriorisierung bleibt maßgeblich. PERF01/PR200/v213 ist bereits
abgenommen; weitere reale Großdaten-/Android-Messungen sind ein eigener Rest.
Nur FLH05 und FLH-PROJ01 bleiben bewusst zurückgestellt. Keine zusätzlichen
kostenpflichtigen Work-Credit-Pakete kaufen oder einplanen.

Die erste vollständige PR-Prüfung 41121801027 hat auf HEAD 1872114 einen
realen Seitenüberlauf durch den neuen geschützten Buchungshinweis erkannt
(320px Viewport, 337px Dokumentbreite). Der Dialog selbst passte. Die Korrektur
erlaubt dem Hinweiscontainer zu schrumpfen und den vollständigen Text umzubrechen.
Die ursprüngliche strikte Breitenassertion bleibt erhalten; eine zusätzliche
Normalmodusprüfung und reine Fehlerdiagnostik sichern diesen Fall ab. Der rote
Erstlauf bleibt als Fehlernachweis erhalten und wird nicht als Infrastrukturfehler
umklassifiziert. Die gezielten Flatex-/Buchungsprüfungen bestehen lokal.
Die vollständige CI muss den korrigierten HEAD erneut prüfen.
