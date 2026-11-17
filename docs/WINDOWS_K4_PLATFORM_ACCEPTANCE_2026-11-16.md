## Android-Nachtrag · Browserbeleg und Testumfang geklärt

Screenshot „Über Google Chrome“: **Chrome157.0.8103.78 / Android16 / CPH2663 / BuildUKQ1.231108.001**. Geräte-/Browserzuordnung nun visuell belegt; funktionale Ergebnisse weiterhin ausdrücklich Nutzerbericht ohne Funktionsbilder/Logs. Nutzer bestätigt **schon installiert, ohne Passwort**. Damit bestehender Symbolstart und **unverschlüsselter100EUR-Datei-Export/Restore/Wiederöffnung** manuell abgeschlossen; Neuinstallation und verschlüsselter Android-Restore **nicht geprüft**. Keine der bisherigen Sachrückfragen offen und keine erneute gleiche Frage/Testwiederholung.

[Präzisierte Einzelabnahme](ANDROID_MANUAL_USER_ACCEPTANCE_2026-11-17.md). Screenshot nur als Versionsbeleg, keine neue Gesamt-A01/A09-/K4/K5-Abnahme. Originalbild nicht in Git veröffentlicht. Main e9130ad9/SW321 und separater csv-import.js503-Status unverändert; kein CI-Retry.

## Manuelle Android-Fortschreibung · 17.11.2026

[Manueller Nutzerbeleg](ANDROID_MANUAL_USER_ACCEPTANCE_2026-11-17.md): Symbolstart/Grundnavigation, Offline-Wiederöffnung aus App-Übersicht bei Flugmodus/WLANaus und100EUR-Datei-Export→Änderung200EUR→Restore100EUR mit Werterhalt nach Wiederöffnung **DONE_MANUAL_USER_CONFIRMED**. Ausschließlich Nutzerbericht, keine Screenshots/Logs. Gerätekennung CPH2663/Android16 laut ausdrücklichem Nutzernachtrag aus Sitzungsangaben ergänzt, nicht technisch ausgelesen. Browser-/SW-Version, frische Installation, vollständiges Prozessende und Verschlüsselung/Format weiter nicht bestätigt. Gesamtverträge A01/A03/A05/A09/K4/K5 nicht pauschal geschlossen. Historische NOT_RUN-/Gerätezugangsblocker unten gelten nicht mehr für die genannten erledigten Teilfälle.

# Windows Chrome/Edge · K4-Plattformnachweis · 16.11.2026

**PASS im ausdrücklich akzeptierten Windows-Runner-Umfang.** [Lauf43946304983](https://github.com/joke0071/foliolab-open/actions/runs/43946304983), Job133576766668, QA-Head `e67ba0b5e6c43169fcf51250ed99eca727b67f28`, [QA-PR348](https://github.com/joke0071/foliolab-open/pull/348). Ausschließlich synthetische Daten, kein Privatportfolio oder privates Belegmaterial in CI. Keine Produktänderung, kein Deployment und keine neue SW321-Livefreigabe erforderlich.

| Identität | Tatsächlich beobachtet |
| --- | --- |
| OS | Windows Server 2025 Datacenter, Windows_NT10.0.26100, x64 |
| Runner | windows-2025; Image win25-vs2026 /20261103.298.1 |
| Google Chrome | installiertes chrome.exe; Produkt-/Datei-/Browserversion156.0.8078.80 |
| Microsoft Edge | installiertes msedge.exe; Produkt-/Datei-/Browserversion156.0.4314.58 |
| Modus | Branded Browser unter Windows, headless; getrennte persistente Testprofile |
| Produkt | Main `e272297ab1ba855a2922c1faa4010b83c558a796`, unveränderte SW-v321-Dateien lokal ausgeliefert |
| SW | foliolab-open-v321; SHA256 `5f0db36b3be4b4f53d8d51b4a75556d76e6147b2a6e0f16a5bd6950512b58548`; aktiver Controller/Cache im 10k-Fall erfasst |
| Werkzeuge | Node22.23.4, Playwright1.56.1; keine gebündelte Chromium-Testinstallation als Chrome/Edge ausgegeben |

## Tatsächlich geprüfte Abläufe

| Fall | Ergebnis |
| --- | --- |
| Chrome: unveränderte originale 10k-JSON über reguläre Importoberfläche, Passwort über reguläre UI einrichten, verschlüsselter UI-Download mit History-/Einstellungsoption | PASS |
| Chrome vollständig beenden; Prozessabwesenheit für dieses Profil prüfen; dasselbe Profil neu öffnen | PASS, kompletter nativer Record einschließlich Revision/Settings exakt erhalten |
| Originale Chrome-Exportdatei physisch im Runner-Dateisystem übertragen, Hash prüfen; frisches Edge-Profil über normale Importoberfläche wiederherstellen | PASS, vollständige kanonische Modellbytes und transportierte Einstellungen gleich |
| Edge vollständig beenden, Prozessabwesenheit prüfen, dasselbe Profil neu öffnen; regulären verschlüsselten Edge-UI-Export erzeugen | PASS |
| Edge-Datei in weiteres frisches Chrome-Profil importieren; vollständig beenden und dasselbe Profil erneut öffnen | PASS |
| Vier kleine unveränderte Originaldateien: precise-price (Legacy-v2), localized-fx (Legacy-v2), localized-fx-discrepancy und UNKNOWN; jeweils in Chrome und Edge importieren und nach vollständigem Prozessende wiederöffnen | 8/8 PASS; exakte Menge/Preis/FX/UNKNOWN und vollständiger Record erhalten |

Insgesamt **11 abgeschlossene Fälle**, **22 geprüfte vollständige Browserbeendigungen** mit jeweils0 verbleibenden Prozessen für das konkrete Testprofil. Keine Seitenfehler und keine externen App-Anfragen.

Originale 10k-Fixture:9270601Bytes, SHA256 `67d9526811d4065448b777ba2ba304f928c253a3096792ed37b0153e18afb809`; nur verlustfrei transportiert, nicht neu erzeugt. Soll:10.000Einzahlungen zu0,10EUR = **1.000EUR**, 10.000eindeutige Buchungen, 10.000zugeordnete Journale und10.000Geldflüsse; sämtliche Quellstrukturen sowie exakte Mengen/Bezüge geprüft. Automatische Abrufe vor Import aus; autoRefresh=off tatsächlich transportiert. Exporte ändern den Quelldatensatz nicht.

| Tatsächliche verschlüsselte Datei | Bytes | SHA256 |
| --- | ---: | --- |
| Chrome → Edge |12361784| `7f128dea63a18cbc33e902ec0c6544adfc35c390f816b1b7be2632297b958bbb` |
| Edge → frisches Chrome |12361784| `351c00a3443316e5c99c865ad9d1bef8b1537aa4a6adc311b8ed4254cec24d0e` |

Die unterschiedlichen Ciphertexte sind reguläre UI-Exporte; transportierter kanonischer Datensatz ist exakt gleich. Beide Übertragungsrichtungen und Wiederöffnungen sind belegt. Keine Passwort-/Vaultschlüssel- oder vollständige Browserpräferenzübernahme behauptet.

## Originale und Grenzen

Erstlauf [43946067928](https://github.com/joke0071/foliolab-open/actions/runs/43946067928), Job133575940656, bleibt FAIL: Windows-Git änderte durch core.autocrlf die SW-Bytes; Abbruch vor Browserstart. Logs erhalten. Ein begrenzter Checkoutfix deaktiviert die Zeilenendenkonvertierung; ursprünglicher Hash und sämtliche Fachassertions bleiben unverändert. Kein blind identischer Retry und kein Produktfehler daraus abgeleitet.

[Originalartefakt14264084074](https://github.com/joke0071/foliolab-open/actions/runs/43946304983/artifacts/14264084074),27942177Bytes, SHA256 `dcd0b58f71b6e04a3afa4f8cb24d0e454501a115fa32f3113865630f16f11a2c`; vier Originaldateien/CRC geprüft. [Dauerhaftes synthetisches Belegpaket](https://chatgpt.com/library?file_id=libfile_fde3_f-37b607bbf7048191a8e8cea45eef7286_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0,28029677Bytes, SHA256 `095519dddd4119a3e6fe018bccad82c7c8a3802e0f0f3c06bd71310e78e4e983`. Tatsächliche gespeicherte Kopie unabhängig zurückgeholt:8Manifestpfade, Original-ZIP und4Originaldateien mit Längen/Hashes/CRC exakt. [Maschinenbeleg und Rücklesequittung](release-evidence/windows-k4-sw321-2026-11-16.json).

Geschlossen ist die Windows-Teilpflicht der hier benannten Browser-/verschlüsselten Export-/FreshRestore-/Prozess-Wiederöffnungsfälle in K3/K4/A09. Dies ist kein Nachweis für zwei physische Rechner, Windows-PWA-Installation, sämtliche v1–v5-Konstellationen, Systemschrift, reale Touch-/Tastaturbedienung, Quota/Eviction, echte OAuth-Sitzungen oder Android. Bestehende andere K4-/K6-Nachweise bleiben erhalten; Gesamt-K4/K6 nicht pauschal DONE.

## Android · bestehende A01–A10

Die anschließende Zugangsprüfung fand in dieser Sitzung weder adb/Appium noch einen USB-Bus oder eine konfigurierte Remote-Device-Verbindung. Die Suche nach einer passenden angebundenen Geräteintegration ergab keinen verfügbaren BrowserStack-Zugang. Ein physisches Android-Testgerät ist damit aktuell **nicht zugänglich**. Kein Emulator-/Linux-Ergebnis als Android-PASS ausgegeben; Kosten oder Verfügbarkeit eines neuen Anbieterzugangs wurden nicht zugesagt.

| Bestehender Fall | Ergebnis | Konkrete fehlende Voraussetzung |
| --- | --- | --- |
| Installation / Start vom App-Symbol, A01 Kaltstart | OPEN | Isoliertes physisches fernbedientes Android-Testgerät; Chrome-Installation, nativer Installations-/Launcherzugriff und Prozess-/Standalone-Beobachtung |
| A02 Warmstart | OPEN | Dasselbe physische Gerät und tatsächlicher Rückkehr-/Startablauf mit Zustandserfassung |
| A03 Navigation | OPEN | Physische Touch-/Zurück-/Long-Press-/Fokus-/Safe-Area-Bedienung auf isoliertem Android |
| A04 Große Listen | OPEN | Physisches Gerät mit vorhandener gültiger 10k-Fixture und Mess-/Interaktionszugriff |
| A05 Offline-Kaltstart | OPEN | Installierte PWA auf physischem Gerät und kontrollierbarer Netzwerkzustand bei vollständig beendetem Prozess |
| A06 Hintergrund | OPEN | Gerätezugriff auf Hintergrund/Sperrbildschirm/Netzwechsel sowie Beobachtung nach Unterbrechung |
| A07 Update | OPEN | Physischer Testendpunkt plus kontrollierte tatsächliche Alt-/Neuversion und offener Editor/zweiter Tab |
| A08 Quota | OPEN | Physisches isoliertes Profil mit kontrolliert erreichbarer Quota-/post-put-Grenze; keine Appdatenlöschung eines Privatprofils |
| A09 Datei-Recovery | OPEN für Android | Physisches isoliertes Android, echter Dateizugriff/Dateiauswahl und frisches Profil samt Prozess-Wiederöffnung; Windows-Teil separat PASS |
| A10 Ressourcen | OPEN | Physisches Gerät plus reproduzierbarer CPU-/Speicher-/Long-Task-/Netzmesszugriff und definierte Bedingungen |

Bei zugänglichem Gerät zuerst Installation/App-Symbolstart, A01, A05 und A09; bestehende Fixture/Originalexporte verwenden. Falls nur kostenpflichtige Device-Cloud oder Jochens Handy verfügbar ist, steht die Entscheidung über genau diesen Zugang aus; Windows-Arbeit ist vorher vollständig abgeschlossen. Ein Handy wäre nur mit tatsächlich isolierter Testumgebung zulässig, ohne Zugriff auf das Privatportfolio.
