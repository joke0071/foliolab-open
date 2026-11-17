# Android · Samsung Remote Test Lab · 17.11.2026

**SAMSUNG_REACHABLE_AUTHENTICATION_PENDING.** Alleiniger bestehender HND01-Hauptagent; Wiedereinstieg am frisch remote bestätigten ed74481b122d9efcedb8f7ee9b37d37d680306ac. Main e9130ad90874434a38bb329a7dafaa22e2163e1d unverändert. Jochens persönliches Handy ausgeschlossen, nur vorhandenes kostenloses Kontingent zulässig; keine bezahlte Buchung, kein CI-Retry.

## Tatsächlicher Zugang

Die aufgerufene Herstellerseite https://developer.samsung.com/remote-test-lab lädt im Prüfbrowser. Über sichtbares Get Started wurde https://developer.samsung.com/remotetestlab/devices geöffnet. Nach tatsächlichem Laden zeigt die öffentliche Tabelle1241Geräteeinträge und verfügbare physische Galaxy-Smartphones, darunter GalaxyS26FE/Android17 mit KennungSM-S741N_KR1. Diese Tabellenbeobachtung ist **keine Reservierung oder Geräteidentität eines ausgeführten Tests**.

Sign in führt auf einen tatsächlich geladenen Samsung-Account-Dialog am Ursprung https://account.samsung.com. Sichtbar sind Email address/Next, Sign in with Google und Sign in with QR code. Kein Site-Unavailable-Fehler wie bei zuvor geprüften Anbietern. OAuth-State/Anmeldeparameter und Secrets werden nicht in den öffentlichen Checkpoint übernommen. Samsung-Konto noch nicht angemeldet; konkretes Kontingent und Webclientfunktionen erst nach Anmeldung prüfbar.

Kleinster nächster Nutzerbeitrag: im geöffneten sicheren Samsung-Anmeldedialog das bestehende Samsung-Konto anmelden. Kein persönliches Handy als Testgerät nötig. Keine Kontoanlage oder neue Vertragsannahme automatisiert. Eine bloße öffentliche Available-Zeile ist kein Beleg für nutzbare Kontominuten.

## Kriterien und vorbereitete Originaldateien

Bestehende A01/A05/A09-Kriterien aus PERF_ANDROID03_REAL_DEVICE_CHECKLIST.md und WINDOWS_K4_PLATFORM_ACCEPTANCE_2026-11-16.md vor jeglicher Gerätezeit gelesen. Der bestehende Last-/Restorevertrag verlangt die originale10k-Fixture; sie wird nicht durch einen neu erzeugten kleinen Modellfall ersetzt. Ein zusätzlich auf dem Gerät erzeugter kleiner Export/Änderung/Restore kann den normalen Dateidialog separat belegen, schließt aber allein nicht die unveränderte10k-/verschlüsselte FreshRestore-Teilpflicht.

Unveränderte Originalfixture aus bereits qualifiziertem qa/windows-k4-sw321-Bundle lokal bereitgestellt, XZ nur verlustfrei dekodiert, ursprüngliche Bytes/Hash und Sollstruktur geprüft:
- portfolio-10000.json:9270601Bytes, SHA25667d9526811d4065448b777ba2ba304f928c253a3096792ed37b0153e18afb809.
- Soll1000EUR,10000Einzahlungen à0,10EUR,10000Journalbuchungen und10000Zahlungsflüsse; ein EUR-Cashbestand, keine realen Keys/Wallets/Finanzdaten.
- Zusätzlich unveränderter tatsächlicher Windows-UI-Export aus Originalartefakt14264084074:chrome-to-edge.encrypted.json,12361784Bytes, SHA2567f128dea63a18cbc33e902ec0c6544adfc35c390f816b1b7be2632297b958bbb.
- Original-ZIP27942177Bytes, SHA256dcd0b58f71b6e04a3afa4f8cb24d0e454501a115fa32f3113865630f16f11a2c; CRC bestanden. Originales synthetisches Testpasswort gemäß bestehendem Vertrag.
- Kein neuer Windows-/Android-PASS aus dieser Vorprüfung. Vor Import automatische Kurs-/Walletabrufe im frischen Geräteprofil ausschalten und tatsächlichen Zustand prüfen.

## Einzelne Gerätefälle: Soll, Ist, Beleg

| Fall | Soll | Bisheriges Ist | Beleg / Grenze |
|---|---|---|---|
| Installation und Symbolstart | Frisches physisches Galaxy, Chrome; FolioLab installieren, über App-Symbol starten, Navigation bedienen. Modell/OS/Chrome/Leerzustand erfassen. | NOT_RUN / Anmeldung ausstehend | Öffentliche Gerätetabelle und geladener Samsung-Login belegen nur erreichbaren Zugang. Keine Gerätezeit oder Installation. |
| Datei-Restore und Wiederöffnung | Vorbereitete Originaldatei im Android-Dateidialog auswählen,1000EUR/zugehörigen Testbestand prüfen. Vollständig schließen, App-Symbolstart, Soll vergleichen. Kleiner eigener UI-Export/Änderung/Rückrestore optional zusätzlicher Fall. | NOT_RUN / Anmeldung ausstehend | Hash-/Längen-/Sollwertbeleg der vorbereiteten Originale vorhanden; Android-Dateiauswahl nicht ausgeführt. |
| Offline-Kaltstart zuletzt | Tatsächliche Offlinebereitschaft/SW abwarten, PWA vollständig beenden, Testgeräte-Internet unterbrechen, Offlinezustand und Symbol-Neustart/Bedienbarkeit nachweisen; Fernsteuerung erhalten. | NOT_RUN / Anmeldung ausstehend | Internet-/Prozesssteuerung des konkreten Webclients noch unbekannt. Keine Behauptung, dass WLANabschaltung die Steuerung erhält. |

Nach Login: passendes kostenloses Kontingent prüfen, möglichst verfügbares Smartphone wählen, Webclient-/Datei-/Home-/Schließen-/Offlinefunktionen vor Verbrauch klären, erst dann minimale kostenlose Reservierung. Gerät/Android/Chrome und tatsächlich leere Umgebung erfassen. Reihenfolge **Installation → Restore/Wiederöffnung → Offline zuletzt**. Nur tatsächlich gesehene Schritte PASS; Labgrenzen NOT_RUN/BLOCKED, Produktfehler nur nach Gerätebeobachtung. Einen gewöhnlichen FolioLab-Ressourcenfehler mit Zeit/URL/sichtbarem Verhalten sichern; keine Hash-Stresssuite oder CI-Wiederholung starten.

## Firebase: bedingter Ersatzweg geprüft

Offizielle Android-Dokumentation https://developer.android.com/studio/run/android-device-streaming beschreibt physisches Streaming aus unterstütztem Android Studio, Anmeldung und Projekt-/Kontingentprüfung. In dieser Umgebung keine studio/android-studio/adb-Binaries im PATH und keine Standardinstallation unter /opt/android-studio,/usr/local/android-studio,/opt/android-sdk gefunden; kein verfügbares Device-Streaming-Werkzeug. Ein allgemeines Firebase-Plugin ist auffindbar, aber nicht installiert und kein nachgewiesener Ersatz für Android Studio/physische Streamingsteuerung. Kein vorhandenes autorisiertes Firebase-Projekt oder kostenloses Restkontingent bestätigt, keine IAM-/Billingänderung.

Samsung ist aktuell erreichbar und nur am Konto-Login blockiert; daher keine unnötige parallele neue Firebase-Einrichtung. Falls Samsung einen erforderlichen Fall tatsächlich verhindert, Firebase nur bei nachgewiesener unterstützter Umgebung und kostenfreiem Projektkontingent für die dann fehlenden Fälle verwenden. Keine Emulatorbelege.

## Erhaltene Abschlüsse

BrowserStack/TestMu nicht erneut geprüft. Windows/Kraken bleiben erledigt. PR354 bleibt gemergt, SW321-Produktabnahme gültig im bisherigen Umfang. Separate reguläre Liveabnahme nach csv-import.js503 bleibt offen; kein unveränderter CI-Retry. Kosten0, Reservierungen0, physische Tests0 am bisherigen Zwischenstand.
