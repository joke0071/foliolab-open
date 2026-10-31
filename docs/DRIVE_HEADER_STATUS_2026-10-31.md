# DRIVE-HEADER01 / UI-HEADER-STATUS02 (2026-10-31)

Verantwortlich Codex. Gemeinsamer P1-Schnitt mit DRIVE-AUTH-PERSIST01 Phase A. FLH04-Synchronisierung bleibt separat OPEN/ACTIVE.

## Tatsächliche Umsetzung

Zwei getrennte, ruhige 44×44px-Statusaktionen im mobilen Header und in der Desktop-Kopfzeile. Linkes Logo und Beta unverändert. Der bisherige mobile Status bleibt ausschließlich für assistive Technik zugänglich; keine weitere sichtbare Textzeile. Datenbank- und Drive-Symbol unterscheiden sich, zusätzliche Zeichen kennzeichnen Erfolg, laufenden Vorgang, Reautorisierung, Fälligkeit und Fehler ohne alleinige Farbcodierung.

Lokaler Status stammt aus bestätigter Initialisierung, Save-Promise, konkretem Speicherfehler und CAS-/Mehrtabzustand. Ein fehlgeschlagenes Schreiben bleibt als Fehler angezeigt, bis wieder tatsächlich erfolgreich gespeichert wurde. Antippen zeigt den Status im nativen Dialog; ein read-only assertCurrent prüft dabei die aktuelle IDB-Revision. Vordergrundwechsel prüfen ebenfalls ereignisgesteuert, ohne Polling oder Vollmodellserialisierung. Fehler bietet Speicherhilfe, Konflikt bietet ausdrücklich Neu laden mit Hinweis auf ungespeicherte Eingaben. Bestehende Dirty-/BeforeUnload-Schutzlogik bleibt erhalten.

Drive besitzt einen nicht-sensitiven State-Getter und ereignisgesteuerte UI-Aktualisierung, kein Token im DOM/Eventpayload. Ohne Einrichtung führt die Aktion zu den bestehenden Einstellungen; ohne Passwort zuerst zur Einrichtung. Bei fehlendem/abgelaufenem Token erfolgt direkt aus der Klickgeste die vorhandene connect-Funktion, gegen parallele Verbindungsversuche geschützt. Die existierende Due-/Verschlüsselungs-/Uploadlogik führt nach erfolgreicher Autorisierung die fällige Sicherung aus. Bei gültigem Token öffnet Antippen nur Status und letzte erfolgreiche Sicherung mit Jetzt sichern/Einstellungen; kein Upload durch bloßes Lesen. Bei bekanntem lokalem Fehler/Konflikt/laufender Speicherung ist der Header-Upload blockiert.

Token bleibt ausschließlich flüchtig. Ein einzelner Ablauf-Timer aktualisiert den Status ohne Netzwerkabfrage; Online-/Offline-/Vordergrundereignisse verwenden bestehende Due-Prüfung. Ungültige Ablaufzeiten gelten nicht als gültige Autorisierung. Keine dauerhafte Google-Autorisierung oder Hintergrundsicherung wird behauptet. Offizielle GIS-Grenze frisch geprüft: https://developers.google.com/identity/oauth2/web/guides/use-token-model (kurzlebiger Token; neue Anfrage aus Nutzerinteraktion).

## Gezielte Prüfung

Lokal1000/1000Unit-Prüfungen PASS: vorhandene Prüfungen plus Statuspriorität, keine Erfolgsanzeige bei Pending/Fehler/Konflikt, ein reentrant geschützter OAuth-Aufruf, fälliges verschlüsseltes Startbackup genau einmal, keine Tokens in State/Event/Storage, Popup-Abbruch und ungültige Ablaufzeit. Syntax vollständig prüfen.

Neue Browserprüfung in der vorhandenen seriellen UI-Quality-Kette; daher regulär Chromium/Firefox/WebKit und nach Deployment echte Produktions-UI. 320/360/390/412/430/768/1440px und 740×360, 44px-Flächen, Logoabstand, keine sichtbare mobile Textzeile, 125% Textsimulation, native Dialog-Axe-/Escape-/Fokusprüfung und Settings-Fokus. Synthetische Google-Antworten ausdrücklich gekennzeichnet; echte bestehende lokale Verschlüsselung und App-Backupbackend, genau ein fälliger Upload, verschlüsselter Transportkörper, kompletter IDB-Record samt Revision unverändert. Echter fehlgeschlagener IDB-put: Pending→Fehler, niemals Saved. Echte konkurrierende IDB-Revision wird beim Statusaufruf als Konflikt erkannt. Offline bleibt lokaler Speicher unabhängig von Drive.

Screenshots bei 320/1440px manuell visuell kontrolliert. Alle vorhandenen Tests, Baselines und Toleranzen erhalten; bisherige Logoabstandsprüfung misst jetzt die tatsächliche neue Symbolgruppe statt des bewusst unsichtbaren Textes.

## Grenzen und Release

Realer Google-Kontodialog, Ablauf/Revoke unter echten Browser-/Google-Richtlinien und echte Android-/PWA-/TalkBack-Geräte sind EXTERNAL bis tatsächlicher Abnahme. Synthetischer OAuth-Erfolg ist kein Beleg realer Autorisierung. Kein neues persistentes Authmodell, kein eigener OAuth-Server, keine Änderung von Finanz-/Speicherformat-/Verschlüsselungsalgorithmen. DRIVE-AUTH-PERSIST01 bleibt PARTIAL; umfassende Mehrtab-/Netzwerk-/Upload-Idempotenz und sichere FLH04-Mehrgeräte-Synchronisierung benötigen ihre weitergehenden Fach-/Sicherheitsnachweise.

Gemeinsam mit dem unveränderten UI-POS02-Archivpaket #243 integrieren; SW236-Kandidat (SW235 war nur Archiv-Kandidat). Kein Zwischen-Deployment notwendig. Vollständige CI, Live-Abnahme und zentraler Checkpoint vor LIVE_ACCEPTED erforderlich. Neue autonome Nutzerfreigabe gilt.

## Nachprüfung des ersten CI-Kandidaten

Erster HEAD d259b0b45fb1f5362bbed1990bee9dd969e93178, Lauf41186938664: Cross1/2 SUCCESS, Chromium und Cross3 FAILURE; nicht integrationsfähig, kein Deployment. Keine laufende Pipeline abgebrochen.

- Cross3: Timeout beim ausbleibenden synthetischen Backupabschluss in Firefox. Die Testgegenstelle hatte keine vollständige CORS-/OPTIONS-Antwort und keinen vollständig nachgebildeten verwalteten Backupordner/Dateinamen. Fixture auf echte Preflight-/POST-Trennung und korrekte Metadaten ergänzt; kein App-Auth-/Backup-Erfolg als Fallback simuliert. Endzustand/Transportfehler und Fehler-Screenshot werden nun bei Fehlschlag gesichert; die Abschlussassertion meldet tatsächliche Drive-Fehler direkt. Eine alleinige Ursache des ursprünglichen Timeouts wird ohne neuen Cross-Nachweis nicht als bewiesen ausgegeben.
- Chromium: bisherige Axe-Prüfung bei430px erfasste die Verwaltungsaktion „Fertig“ auf y≈−6px hinter dem sticky Header und dessen neuem Statusbutton. Lokal reproduziert. Bestehende Axe-/Eligibility-/IDB-Assertions vollständig erhalten; vor der Prüfung wird die tatsächlich zu bedienende Verwaltungsaktion in den sichtbaren Bereich gebracht und zusätzlich mit Rechteck und elementFromPoint als zwischen Kopf-/Fußnavigation sichtbar und klickbar belegt. Mobile Fokus-/Scrollabstände ergänzt; Header wieder56px inklusive44px-Zielen. Keine Axe-Ausnahme/Toleranzänderung.
- Echte visuelle Dialogprüfung zeigte mehrfach wiederholten Sicherungszeitpunkt und unnötige Höhe. Kompakter Status mit ausführlicher letzter Rückmeldung im zugänglichen Akkordeon; Fehler bleibt unmittelbar sichtbar. Neuer lokaler Chromium-Header- und Blocker-Test wieder PASS.

Vollständiger erneuter CI-Nachweis vor Merge erforderlich; reale Google-/Android-Grenzen unverändert EXTERNAL.
