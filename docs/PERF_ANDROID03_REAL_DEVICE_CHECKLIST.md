# Android03 – kurze reale Geräteabnahme

**Nutzer-Scope 13.11.2026:** Android Chrome/PWA bleibt Pflicht des persönlichen Zielumfangs; TalkBack ist ausdrücklich zurückgestellt. Alle folgenden TalkBack-Abfragen und Testschritte sind optional und blockieren Android-PASS nicht. Normale Dialog-/Tastatur-/Touch-/IME-/Systemschriftprüfungen bleiben erforderlich. Vorhandene Fixtures und historische Messergebnisse unverändert. Windows Chrome und Edge sind gesonderte Zielplattformen; dieser Androidauftrag ersetzt deren reale Prüfung nicht.


**Status: EXTERNAL / noch nicht durchgeführt.** Die automatisierte Baseline ist ausdrücklich EMULATED. Ein Desktop-Chromium mit CPU4x ersetzt weder Android-Prozessstart noch installierte PWA, Energiesparen, TalkBack oder längeren Hintergrundbetrieb.

## Offener Operatorpunkt · 13.11.2026

**OPEN / OPERATOR_INPUT_PENDING:** Isolierte Testprofile auf Windows Chrome,
Windows Edge und Android Chrome/PWA sowie deren Versionen sind derzeit nicht
bestätigt. Unbekannte Angaben bleiben UNKNOWN. Bis zu neuen Nutzerangaben keine
erneute Geräte-/Versionsabfrage. Kein Import in ein unbestätigtes Privatprofil,
kein Ersetzen/Löschen des Privatportfolios und keine Löschung von Appdaten.

Einzelfälle können je tatsächlich bestätigter Plattform separat beginnen.
Plattformübergreifender Gerätewechsel braucht zwei bestätigte isolierte Endpunkte.
Bestehende 10k-Fixture (Soll1000EUR) und OperatorZIP unverändert wiederverwenden;
TalkBack optional. Dieser offene Teilauftrag blockiert nur abhängige Gerätebelege,
nicht unabhängige lokale Entwicklung. Kein Geräte-/Versionsschluss aus Chatgerät,
Main, Cachekennung oder Emulation.

## Konkreter erster Operatorauftrag · 13.11.2026

**Vorarbeit abgeschlossen, Geräteausführung weiterhin OPEN.** Die neue gebündelte
[Entsperrzuordnung](EFF03_WEEK_TARGET_2026-11-11.md#blockierte-pakete-gezielt-freimachen--13112026)
verbindet diese bestehende Checkliste mit den TalkBack-Fällen. Kein zweites
Abnahmeformular und keine Scope-Statusänderung.

Für den ersten Last-/Restorefall die bereits vorhandene finale K4-Fixture verwenden,
nicht den historischen v251-10k-Seed. Originalquelle: separat gesicherter
K4-Originalteil V0,24258560Bytes/SHA256
8681fe357930020d724883073f5e98e081a04bdd9d20af910c95a01c7fccd2d8.
Nur benötigte endgültige Dateien gezielt daraus gelesen und gegen das vorhandene
Innenmanifest geprüft; keine erneute vollständige Altarchivabnahme.

| Datei im Operatorpaket | Unveränderte Originalbytes / SHA256 | Unabhängiges Soll |
| --- | --- | --- |
| portfolio-10000.json | 9270601Bytes;67d9526811d4065448b777ba2ba304f928c253a3096792ed37b0153e18afb809 | Version3;1Anbieter/1Konto/1EUR-Cashposition;10000Einzahlungen à0,10EUR;10000zugehörigeJournale/10000Zahlungsflüsse;Menge/Gesamtwert1000EUR;Startmenge0;Fees/Steuern0 |
| portfolio-10000-verschluesselt.json | 12361244Bytes;43a3fa184135abc2fc4a1a8054efa812a12182948912acbd37c0fca5f448baaa | Vorhandener tatsächlicher UI-Export;entschlüsselt/importiert vollständig dasselbe Modell;keine Neugenerierung |

Ausschließlich synthetisches Testpasswort: `SYNTHETIC K4 restore 10000!`.
Dieses vorhandene K4-Backup liegt innerhalb der unveränderten Formatgrenzen;
der oben dokumentierte historische v251-10k-Kapazitätsbefund bleibt erhalten.

Aktuelle gezielte Vorprüfung:Node24.22.1;alle10000Buchungs-/Journal-/Flow-Verknüpfungen,
Sequenzen,10000×10Integercents=100000cents,ausgeglichenenJournalpostings und
vollständige importierte Modellgleichheit zwischen Originalklartext und
entschlüsseltem Originalciphertext geprüft. Vorhandener nativer K4-Restorebeleg
wird wiederverwendet, nicht als neue Ausführung ausgegeben. Relevante Modell-/
Backup-/Limit-/Vollbackupquellen seit Prüfbasis ae0778fa31f035516b6da82de4084c757c0481ed
bis Maina27cde2f802c26bfec41190911d88bd1d7d8e325 unverändert; Appdelta betrifft
Kalenderbedienung, keinen Restorehandler. Keine neue Browser-/IDB-/Hardware-/
Main-/Produktions-/Kryptoreviewabnahme.

**Jetzt unverzichtbar:** Jochen benennt ein tatsächlich isoliertes Android-Testprofil
oder Testgerät ohne Privatportfolio und meldet Gerät/Android/Browser sowie
sichtbare App-/SW-Identität. Das tatsächliche Geräteergebnis bindet sich an genau
diesen beobachteten Stand; UNKNOWN nicht aus Main oder Cachekennung ersetzen.
Kein Import in die bestehende private PWA; fehlt Isolation, mutierende Fälle stoppen.
Keine Freigabe des ungeklärten aktuellen Main-/Produktionsgates durch diesen Testauftrag.

1. Leeres Testprofil zuerst online öffnen, Version/Standalone/Installation erfassen.
2. Vor dem Import automatische Kurse/Walletscans in diesem Profil ausschalten;
   die Originaldatei enthält transportbedingt autoRefresh=daily. Der Import
   übernimmt nicht ungeprüft diese Einstellung; ausgeschalteten lokalen Zustand
   tatsächlich kontrollieren.
3. Bestehende normale Dialogfälle zunächst mit leeren/kleinen synthetischen
   manuellen Eingaben ausführen, keine privaten Walletadressen oder API-Keys.
4. Erst im isolierten Profil das Original-10k-JSON importieren; Menge/Gesamtwert,
   Listenanzahl soweit sichtbar und Journalbezüge gemäß Soll prüfen. Für nicht
   sichtbare Interna keinen Geräte-PASS aus der Nodeprüfung ableiten.
5. Den vorhandenen verschlüsselten Export in einem zweiten isolierten Testprofil
   tatsächlich wiederherstellen; dieselben erwarteten Mengen/History vergleichen.
   Keine Passwort-/Vaultübernahme in das private Profil.
6. Vorhandene Messwiederholungen, Offline-/Hintergrund-/IME-/Systemschriftfälle und
   PASS/FAIL/OPEN-Rückgabe oben verwenden. A07nurbei echterVersionsfolge/A08nurbei
   echterisolierterQuotabedingung;ohneVoraussetzungOPEN.

Erster Schritt ist ausführbar, sobald Isolation und Geräte-/Teststandzuordnung
belegt sind. Physischer Gerätezugriff steht dieser Sitzung nicht zur Verfügung.
Bereitgestellte Testdateien sind keine tatsächliche Operatorausführung.


## Vorbereitung

- Nur ein isoliertes Testprofil bzw. ein bereitgestelltes Testgerät ohne echtes Portfolio verwenden. Ein Backupimport ersetzt lokale Daten. Falls die Isolation fehlt, diesen Punkt offen lassen.
- Keine realen API-Schlüssel, Wallet-Adressen, Drive-Konten oder Finanzdaten eintragen.
- Vor dem synthetischen Import unter **Mehr → Datenquellen & Aktualisierung** die Option **„Kurse und Wallet-Bestände beim Öffnen aktualisieren“ ausschalten**. Ein normaler JSON-Import übernimmt absichtlich nicht einfach fremde Einstellungen. Die synthetischen Wallet-Kennungen sollen keine echten Scans auslösen.
- Gerät, Android-/Browser-/PWA-/TalkBack-Version, geprüfte App-/SW-Version soweit sichtbar, Akkustand, Energiesparen, Netzwerk und Schriftgröße notieren. Nicht sichtbare Angaben als offen führen.
- Synthetische Seeds und Ausgangswerte: [gesicherte Baseline](perf-evidence/2026-11-01/android03-v251/README.md). Die gzip-Dateien müssen vor dem Appimport wieder echte JSON-Dateien sein. Mit dem kleinen Fall beginnen, danach 3.000 und 10.000 Buchungen. Es handelt sich um 3 bzw. 19 Positionen; 100/1.000 Positionen sind damit noch nicht abgenommen.

## Messdurchlauf

Pro Szenario fünf Wiederholungen unter denselben Bedingungen. Rohwerte, Median und Minimum/Maximum aufschreiben. Stoppuhrschätzungen getrennt von Browser-/DevTools-Messungen benennen; keine falsche Millisekundengenauigkeit angeben.

| Szenario | Prüfen und erfassen |
| --- | --- |
| Kaltstart | Test-PWA/Testbrowser vollständig schließen und neu öffnen. Erster sinnvoller Inhalt, erste bedienbare Aktion und geprüfte Übersicht getrennt erfassen. OS-/Prozessstart gehört beim echten Gerät dazu. |
| Warmstart/Reload | App geöffnet lassen, neu laden; dieselben Messpunkte erfassen. |
| Navigation | Übersicht → Positionen → Buchungen → Verlauf → Mehr; Zeit bis zur sichtbaren, bedienbaren Seite und auffällige Hänger erfassen. |
| Lange Listen | Buchungen suchen/filtern, weitere Einträge laden, Verwalten/Fertig, Archivansicht und Details bedienen. Nur synthetische Daten, keine unbewiesenen Finanzänderungen erzwingen. |
| Offline | Erst vollständig online laden; dann offline neu öffnen, navigieren und eine harmlose Testnotiz speichern. Nach Reload müssen Zustand und Speicheranzeige stimmen. |
| Hintergrund | Nach 5 Minuten und nach längerer Unterbrechung zurückkehren, jeweils mit/ohne Energiesparen. Keine verschwundenen Daten, falschen Speicheranzeigen oder unerwarteten Änderungen. |
| Netzwechsel/Update | WLAN/Mobilfunk/Offline wechseln. Einen tatsächlichen angebotenen PWA-Updateablauf nur mit gesicherten Testentwürfen durchführen. Ohne neues Update bleibt dieser Prüfpunkt offen. |
| Ressourcen | Falls Geräte-Diagnostik verfügbar: Hauptthread-Hänger, Heap vor/nach wiederholten Wechseln sowie Anzahl/Menge der Anfragen erfassen. Ohne Messzugriff kein „kein Leak/keine Doppelabrufe“ behaupten. |
| Backup/Restore | Mit isolierten Testdaten tatsächliche Dateien herunterladen und in einem zweiten isolierten Testprofil wiederherstellen; Bestände und Historie vergleichen. Die 10k-Baseline überschritt die bisherigen verschlüsselten Formatgrenzen: eine klare sichere Ablehnung ist kein erfolgreicher verschlüsselter Restore. Kein automatischer Klartext-Ersatz. |

## Bedienbarkeit

Hoch-/Querformat, 320–430 px soweit am Gerät real erreichbar, große Systemschrift und sichtbare Softwaretastatur prüfen. Buttons, Überschriften, Zahlen und Fehlermeldungen müssen erreichbar bleiben. Für echte Sprachausgabe und Dialogfokus die [vorhandene TalkBack-Checkliste](DIALOG_AUDIT_ANDROID_TALKBACK_CHECKLIST.md) verwenden.

## Rückmeldung

Pro Punkt **PASS / FAIL / OPEN** mit Repro, fünf Rohwerten, Gerät/Version und Bedingungen. Nur anonymisierte Testbilder bzw. Messwerte weitergeben; keine persönlichen Backups oder Zugangsdaten. Ergebnisse nicht mit der CPU4x-Desktop-Baseline gleichsetzen. Vorher/Nachher nur mit demselben Gerät, Datenbestand, Netzwerk-/Energiezustand und vergleichbarer Methode bewerten.
