# 1.0: verbindlicher Umfang und verbliebene Nachweise · 17.11.2026

Ausgang: Checkpoint f9ef0f83, anschließend e61352a9 (einmaliger Retry ausdrücklich freigegeben). Produkt-Main e9130ad90874434a38bb329a7dafaa22e2163e1d / SW321 unverändert. Dieser Bericht ersetzt widersprüchliche ältere Android-Zugangsrückfragen und die Gleichsetzung „nicht frisch installiert = zusätzliche Neuinstallation Pflicht“.

## Maßstab

Verbindlich sind die Nutzerentscheidung K1–K6 in [Issue124, Kommentar6726116758](https://github.com/joke0071/foliolab-open/issues/124#issuecomment-6726116758), die persönlichen Plattformfestlegungen im [Effizienzplan](WORK_EFFICIENCY_PLAN_2026-11-01.md), [Roadmap A01–A10](KONSOLIDIERTE_ROADMAP.md#reale-android-pwa-testmatrix-a01a10), [K4-Plattformvertrag](K4_BACKUP_PLATFORM_REVIEW_2026-11-14.md) und [physische Gerätecheckliste](PERF_ANDROID03_REAL_DEVICE_CHECKLIST.md). Bereits abgenommene Diagnosen werden übernommen. NOT_RUN alleine begründet keine neue Pflicht.

**Installation:** Installation/Launcher/Standalone gehören zu K5. Der Nutzer bestätigt eine vorhandene installierte PWA und erfolgreichen Symbolstart; diese Aussage ist erledigt. Kein Vertrag verlangt ausdrücklich Deinstallation und erneute Installation für diesen Nachtest. Ein frischer nativer Installationsdialog ist nicht beobachtet, aber daraus wird kein zusätzlicher Pflichtablauf erzeugt. **FreshRestore ist ein eigener K4-Datenkontext**, nicht automatisch ein App-Neuinstallationsauftrag.

**Verschlüsselter Restore:** ausdrücklich im persönlichen Windows-Chrome/Edge-/Android-Plattformumfang (K4-Review, Abschnitt Plattform). Nun zusätzlich mit bestehendem100EUR-Testportfolio manuell bestätigt; Klartext- und Passwortpfad sind getrennt DONE. Der kleine Android-Verschlüsselungsfall ersetzt nicht den Großdaten-/Herkunfts-/FreshRestorevergleich.

## Geschlossene Pflichten und Teilpflichten

| Nachweis | Befund |
|---|---|
| Android-Zuordnung | Chrome157.0.8103.78, Android16, CPH2663; Versionsbild vorhanden. Keine Funktionsbilder/Logs behauptet. |
| Bestehende PWA / Symbolstart / Grundnavigation | DONE_MANUAL_USER_CONFIRMED. |
| Offline lesen/navigieren nach App-Übersicht-Schließen und Wiederöffnung | DONE_MANUAL_USER_CONFIRMED, Flugmodus und WLANaus. Kein vollständiges Prozessende/Offline-Write hineininterpretiert. |
| Offline-Schreiben und Prozess-Kaltstart | DONE_MANUAL_USER_CONFIRMED: offline Name gespeichert; Chrome und FolioLab jeweils Beenden erzwingen; weiterhin offline per Symbol gestartet; Offline-Test/100EUR/Navigation erhalten. Kein zusätzlicher In-App-Reload behauptet. |
| Unverschlüsselter Datei-Export/Restore und Wiederöffnung | DONE_MANUAL_USER_CONFIRMED: 100→200→Datei-Restore100→Wiederöffnung100EUR. |
| A02/A06 Hintergrund-/Sperr-Rückkehr, Entwurf/Abbruch | DONE_MANUAL_USER_CONFIRMED: Editor und Hintergrund-Test nach Appwechsel/ca.30s Sperre erhalten; Abbrechen bewahrt Offline-Test/100EUR. Kein weiterer Netz-/Import-/Langzeitumfang behauptet. |
| Android verschlüsselter Datei-Restore | DONE_MANUAL_USER_CONFIRMED: vorgegebenen vollständigen Passwort-Export/Dateipicker/100→200→Restore100-Ablauf samt Force-Stop beider Apps und Wiederöffnung100EUR bestätigt. Keine Funktionsbilder/Logs. |
| Windows K4 | Elf Fälle/22 Prozessbeendigungen, Chrome/Edge, Original10k, verschlüsselte UI-Exporte/FreshRestore sowie Präzisions-/Legacy-/UNKNOWN-Fälle DONE im dokumentierten Umfang. |
| Kraken Spotanker | Alle13 Spotwährungen beidseitig abgeglichen, DONE; kein erneuter Nachweis erforderlich. |
| Produktkern/UI | Bestehende K1–K3-Implementierungen, UI-R1–R4/UI-ALLOC01 und K6-TRUST erhalten ihre Abnahme. D-ETH260-Fix und öffentliche Cursorpaare DONE. Kein neuer belegter Codefehler aus diesem Dokumentationsabgleich. |

## Offene Pflichtaussagen: konkrete Anforderung, Lücke, nächster Schritt

| Vertrag | Noch erforderliche Aussage | Fehlender Nachweis / kleinster nächster Schritt |
|---|---|---|
| A05 verbleibende Reload-/technische Teilbehauptungen | Expliziter Offline-Dokumentreload und technische Controller-/Cache-/Recordidentität. | Offline-Schreiben und Start nach Force-Stop beider Apps sind nun manuell DONE. Zusätzlicher In-App-Reload/Internas nicht berichtet; diese Grenze getrennt führen und den bestätigten Kaltstart nicht wiederholen. |

| K4/A09 FreshRestore/Originaldatenumfang | Isoliertes frisches Ziel, vorgeschriebene Original10k sowie Finanz-/Herkunfts-/Journal-/UNKNOWN- und tatsächlich eingeschlossene Einstellungssemantik erhalten. | Kleiner Restore auf gleichem Bestand belegt das nicht. Vorhandene originale10k-Datei und tatsächlicher verschlüsselter Export sind vorbereitet; geschütztes separates Zielprofil bzw. zweiter isolierter Endpunkt plus Record-/Sollvergleich erforderlich. Kein Löschen des bestehenden Nutzerprofils. Windows-Gegenstücke erledigt. |
| A02/A03/A06 verbleibende Bedingungen | Vollständige Navigation inklusive Long-Press/Zurück/Fokus/Safe-Area und weitere Netz-/Importbedingungen. | Grundnavigation, normale Wiederöffnung sowie Editorerhalt nach Appwechsel/ca.30s Sperre und sicherer Abbruch manuell DONE; weitere Bedingungen nicht berichtet. Keine Wiederholung des erledigten Hintergrundfalls. |
| A04/A10 | Repräsentative Großlisten/Scrollen/Suche/Mehrfachauswahl und Ressourcen-/Latenzverhalten auf echtem Android. | Keine Android-Großdaten-/Messserie. Vorhandene Fixtures verwenden: Ziel5000Positionen, getrennte10000Buchungs-/Stichtagsnachweise; Messzugriff/Protokoll auf physischem Gerät, keine Emulatormessung als Ersatz. |
| A07 | Sicherer kontrollierter Versionswechsel mit offenem Editor/zweitem Kontext, korrektem Worker/Assetstand, ohne Datenreset. | Keine reale Android-Alt-/Neuversionfolge. Erst nächste qualifizierte tatsächliche Versionsfolge vorbereiten; kein nutzloses Produktdeployment zum Erzeugen eines Prüfanlasses. |
| A08 | Quota-/Postput-Abbruch ohne Mutation und mit exakter Revision auf Android. | Automatisierte Gegenstücke vorhanden, kein isolierter physischer Android-Fehleraufbau. Benötigt isolierten synthetischen Gerätekontext und Instrumentierung, keine Speicherauslastung auf dem persönlichen Profil. |
| K6 Systemschrift/Bedienung | Tatsächliche OS-Schriftvergrößerung auf Windows/Android; zentrale Aktionen lesbar/erreichbar und Fokus sinnvoll. | Windows Tastatur/Fokus/CSS200% erledigt; echte OS-Systemschrift und umfassende Android-Touch/Dialogbeobachtung fehlen. OS-Schrift auf Testgerät erhöhen und Kernansichten/Editor prüfen; CSS-Zoom ersetzt diese Aussage nicht. |
| Regulärer PR354-Liveabschluss | Gesamte vorgeschriebene Main-Livekette beendet erfolgreich, einschließlich kontrollierter Worker-/Offline-/Speicherfälle und restlicher Engines. | Einmaliger Retry2 FAIL: Worker-Precache coin-identity.js HTTP429, danach20s Controller-Timeout. Beleg unten; kein weiterer Retry autorisiert/ausgeführt. Erst konkreter begrenzter Umgang mit diesem weiterhin offenen Transportbefund qualifizieren. |
| K1/K2 Originalabnahme im zugesagten Kern | Fünfanbieter-Kernfälle und kombinierte Übernahme gegen unabhängige Bestands-/Eigentumsanker, mit Cash/Gebühren/Finanzierung/Historie ehrlich begrenzt. | Technische120Reihenfolgen/Undo/Restore und bestehende Originalsegmente erhalten. Offene Anfangs-/End-/Eigentumssegmente einzeln begrenzen; keine universelle Privatvollhistorie zur neuen1.0-Pflicht erklären. Kleinste konkreten Originalbelege siehe unten. |
| K2-ETH betroffener Originalcursor | Tatsächliche erste Antwort plus unveränderte next_page_params führen zur tatsächlichen Folgeseite ohne Lücke/Überlappung. | Öffentliche Paare und synthetische Adapterbelege ersetzen betroffenen privaten Fall nicht. Benötigt genau zusammengehörige erste JSON-Antwort inklusive Cursor und nächste Originalantwort, ohne Zugangsdaten. |

Nicht jeder Zeile entspricht ein zusätzlicher Produktausbau. A07/A08/A10 sind fehlende Beobachtungsbedingungen; kein beobachteter Produktfehler. Safari/TalkBack und Komfortfunktionen bleiben nach Nutzerentscheidung zurückgestellt.

## Ausgeführter kleinster manueller Test · DONE_MANUAL_USER_CONFIRMED

Zweck A01/A05: Offline-Schreiben und Start nach tatsächlichem Prozessende. Bestehendes synthetisches100EUR-Portfolio verwenden, keine Daten löschen.

1. Flugmodus einschalten, WLAN ausschalten.
2. In Positionen die vorhandene synthetische Testposition über Verwalten/Stift öffnen. Nur ihren Namen in **Offline-Test** ändern und speichern; Wert100EUR unverändert lassen.
3. Android Einstellungen → Apps → FolioLab → Beenden erzwingen, falls als eigener Eintrag vorhanden. Zusätzlich Chrome → Beenden erzwingen. Keine Speicher-/Datenlöschung. Ist FolioLab kein eigener Eintrag, genau diese Einschränkung melden; das ist kein Produktfehler.
4. Weiterhin offline über das FolioLab-App-Symbol öffnen. Prüfen: **Offline-Test und100EUR** erhalten, Portfolio und Navigation bedienbar. Wenn möglich innerhalb der PWA einmal neu laden und erneut prüfen.
5. Nur beobachtetes Ergebnis melden: Name/Wert, welche Apps tatsächlich beendet wurden, ob ein zusätzlicher Reload möglich war. Fehlende Screenshots nicht nachfordern; manuelle Bestätigung als solche führen.

Status nach ausdrücklichem Nutzerbericht: **DONE_MANUAL_USER_CONFIRMED** für offline umbenennen/speichern, Beenden erzwingen von Chrome UND FolioLab, weiterhin offline Symbolstart mit Offline-Test/100EUR/Navigation. Keine Funktionsbilder/Logs; kein Agenten-/Lab-PASS. Ein zusätzliches Neu laden innerhalb der PWA wurde nicht berichtet; technische Internas ebenfalls nicht. Vorbereitete Schritte oben bleiben als tatsächlich beantworteter Prüfauftrag nachvollziehbar. Der anschließend vorbereitete verschlüsselte Datei-Restore ist inzwischen ebenfalls manuell bestätigt (siehe unten).

## Verschlüsselungsfall · inzwischen DONE_MANUAL_USER_CONFIRMED

Mit bestehendem100EUR-Testportfolio, automatischen Abruf aus lassen: Mehr → Lokales Portfolio → Backup-Passwort → Passwort festlegen (mindestens10Zeichen, nur lokal merken) → verschlüsseltes Backup herunterladen. Tatsächliche Datei in Downloads sichern; eingeschlossene History-/Einstellungsoptionen notieren. Bestand sichtbar200EUR ändern. Backup wiederherstellen wählen, im Android-Dateidialog genau diese Datei auswählen, Passwort eingeben und regulären Restore bestätigen. Soll100EUR. PWA/Chrome beenden und per Symbol wiederöffnen: Soll100EUR. Bei fehlendem Download/Picker/Passwortdialog den konkreten Schritt berichten. Keine Entschlüsselungsdatei/Passwörter im Chat und keine künstlichen Erfolgsannahmen. Ein falsches Passwort ist optional separat negativ zu prüfen und ersetzt nicht den Erfolgsfall.

Nutzer bestätigt den unmittelbar vorgegebenen gesamten Ablauf mit „Ja hat funktioniert“. Damit Android-Verschlüsselungspfad und Werterhalt nach Force-Stop/Wiederöffnung DONE_MANUAL_USER_CONFIRMED; ein frisches Zielprofil, Gerätewechsel und10k-/Recordgleichheit bleiben getrennt. Die bereits vorhandenen Originaldateien werden dafür weiterverwendet; keine neue Fixtureerzeugung.

## A06 Hintergrund/Sperren · DONE_MANUAL_USER_CONFIRMED

Im bestehenden Testpositionseditor den Namen nur als **Hintergrund-Test** eintippen, nicht speichern. Mit Home zu einer anderen App wechseln, Bildschirm rund30Sekunden sperren, entsperren und zu FolioLab zurückkehren, ohne Apps zu beenden erzwingen. Soll: Editor und Entwurf erhalten. Danach abbrechen; gespeicherter Name **Offline-Test** und100EUR unverändert. Nutzer berichtet am18.11.2026 ausdrücklich Editor/Entwurf erhalten; nach Abbrechen Offline-Test/100EUR. DONE_MANUAL_USER_CONFIRMED. Kein pauschaler Abschluss weiterer Netz-/Importbedingungen und keine unberichtete Beobachtung.

## Nächster vorbereiteter manueller Teilfall K6: Android-Systemschrift

Android-Einstellungen nach Schriftgröße durchsuchen, bisherige Stufe merken, größte angebotene Schriftstufe wählen. PWA über Symbol öffnen, Übersicht/Positionen und Testpositionseditor prüfen: Texte/Werte lesbar, Navigation/Speichern/Abbrechen erreichbar; vertikales Scrollen erlaubt. Abbrechen bewahrt Offline-Test/100EUR. Anschließend ursprüngliche Schriftstufe wiederherstellen. PREPARED, kein Ergebnis. Keine200%-Messung aus der Reglerstellung ableiten, kein Displayzoom als OS-Schriftnachweis und kein globaler K6-PASS.

## Vorhandene private Quellen vor neuen Anforderungen ausgewertet

Gelesen: FolioLab_Restnachweise_2026-11-15.txt Version3 und FolioLab_Bitpanda_Nachtrag_2026-11-16.txt Version0. Private Mengen/Adressen/Originale nicht veröffentlicht.

| Grenze | Bereits geklärt | Kleinster gegebenenfalls noch nötiger Beleg und Frage |
|---|---|---|
| Kraken | Spotanker mit13Währungen exakt, Bidirektionalvergleich DONE. | Kein neuer Kraken-Spotbeleg. Frühere Eröffnung/Earn/Staking nur für ein konkret in den Kernumfang aufgenommenes Segment gesondert nachweisen. |
| Bitpanda31.03.2026 | Original-PDF/CSV verglichen, historische Index-Centbewertung plausibel erklärt; unterstützte UI zählt Indexkomponenten nicht doppelt. Kein offener nachgewiesener Importbug. | Für Coin-/Indexzuordnung: eine Komponentenaufstellung des betreffenden BCI25 zum Stichtag. Für fehlenden Cashanker: genau ein Bargeld-Saldo zum31.03.2026. Diese zwei Aussagen getrennt; kein erneuter Gesamtexport und keine Umbuchung aus bloßer Centgleichheit. |
| Eigene Wallets/Staking | Bereits bestätigte BTC-/ETH-/SOL-Brücken erhalten. | Nur ein tatsächlich im bisherigen Ledger-Live-Abzug fehlendes Konto plus Eigentumsbeginn, sofern dessen Historie abgenommen werden soll; keine pauschale Vollhistorie verlangen. |
| ETH-Originalpagination | D-ETH260 und öffentliche transactions/token-transfers-Paare DONE. | Genau zusammengehöriges erstes JSON inklusive Originalcursor und tatsächlich nächste JSON-Antwort; klärt die private betroffene Pagination, kein erneuter Auszahlungsscreenshot. |

## Einmaliger regulärer Live-Wiederanlauf: abgeschlossen, fehlgeschlagen

[Run44048209546/Attempt2](https://github.com/joke0071/foliolab-open/actions/runs/44048209546/attempts/2), Livejob134216858755, 17:08:01–17:11:15UTC (18:08:01–18:11:15MEZ),194s. Nur fehlgeschlagener Livejob neu ausgeführt; übernommene grüne Integrations-/Deployjobs sind keine neuen Ausführungen. Vorab sw.js und Homepage200/hashgleich; im Lauf alle155Produktassets exakt passend zuSW321. Kein Produkt-/Workflow-/Deploydelta.

Bestanden: initiale Liveacceptance6Gruppen/18Axe, ALPHA-ETF, Chromium-FX8Byte-Replayfälle und2direkteProduktionsfälle. Letztere messen852Produktionsanfragen und471Anfragen im stärksten UTC-Wandsekundenintervall. Das ist ein Chromium-Teilwert, kein neuer3-Engine-Gesamtvergleich und keine CI-Laufzeitverbesserung;194s sind die fehlgeschlagene Livejobdauer.

**17:10:52.260UTC /18:10:52.260MEZ:** Worker-Network.responseReceived erfasst `https://foliolab.unperfekt.at/src/coin-identity.js` → **HTTP429**, Varnish/IAD, Retry-After0. Um17:11:12 erreicht `browser-controlled-storage-fixture.mjs:46`, aufgerufen durch `browser-kraken-import.mjs:132`, den20s-Wartefehler. Anfang Worker installing, Ende kein active/installing/controller; IndexedDB-Anzeige aktiv. Der nachfolgende Fixture-Save, kontrollierte Reload und Offline-Kraken-Replay wurden nicht erreicht. Keine Datenkorruption daraus abgeleitet. Restliche verkettete Live-/Cross-Engine-Abnahmen nicht vollständig gelaufen.

Der ursprüngliche `csv-import.js`-503 aus Attempt1 bleibt FAIL und eigenständig archiviert. Er ist im erfolgreich durchlaufenen ersten Block dieses Retries nicht erneut aufgetreten; seine Ursache bleibt UNKNOWN. HTTP429 ist ein anderer konkreter Befund, genaue Regel/Fenster weiterhin UNKNOWN. GitHub-Ticket5016095-Schließung ohne technischen Befund bleibt einmalig im historischen Checkpoint dokumentiert; nicht auf Support warten, keine neue Supportschleife. Keine weiteren Wiederanläufe ausgeführt.

Originalartifact14350907511:12603196Bytes, SHA256d3146f13d1831e012d09585a96e1eb5314ddc03f8db0141e978b5399498f5d28,137ZIP-Einträge/CRC PASS. Rohlog, Workerdiagnose, Traces, API-Endstatus und Auswertung gesichert; [Maschinenbeleg](release-evidence/pr354-live-retry-2026-11-17.json). Archiv FolioLab_PR354_Live_Retry_2026-11-17.tar.gz,12609594Bytes, SHA2565114b30e507bdefff3bd8eb489957e8b61c5f195ac2cb3dbc933eddf860222d0 dauerhaft gesichert.

## Entwicklungsstand gegenüber Abnahme

Der zugesagte1.0-Produktkern ist implementiert; **keine konkret noch fehlende Featureimplementierung identifiziert**. Bestehende Windows-/Kraken-/UI-/SW321-Abnahmen bleiben abgeschlossen. Der Gesamtabschluss der Produktentwicklung kann wegen der ungeklärten regulären Worker-/Transport-Endabnahme nicht vorbehaltlos erklärt werden: Ein dort nachgewiesener Produktfehler wäre weiter Pflicht. **1.0 insgesamt ist nicht vollständig abgenommen.** Offene Gerätebedingungen/Originalanker und der konkrete Live429 sind explizit oben begrenzt. Kein tragfähiger intern belegter Codefix rechtfertigt aktuell spekulative Produktänderungen, zusätzliche Komfortarbeit oder eine weitere unveränderte CI-Serie.
