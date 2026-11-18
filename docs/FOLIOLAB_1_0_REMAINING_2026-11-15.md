# FolioLab1.0 · aktuelle Restliste · 17.11.2026

Verbindlicher [Kriterienabgleich und Einzelanforderungen](FOLIOLAB_1_0_CRITERIA_RECONCILIATION_2026-11-17.md). Ersetzt die kumulierten, teils überholten Zugangs-/Angaberückfragen; Historie bleibt im Git-Checkpointf9ef0f83. Main e9130ad9/SW321 unverändert.

| Pflichtbereich | Status | Nächste Handlung / genaue Beleglücke |
|---|---|---|
| Android bestehende PWA, Symbolstart, Grundnavigation | DONE_MANUAL_USER_CONFIRMED | Keine Wiederholung. Chrome157.0.8103.78/Android16/CPH2663 zugeordnet. Zusätzliche De-/Neuinstallation kein ausdrücklich vorgeschriebener eigener Pflichtschritt. |
| Android Offline-Lesen/Navigation nach Recents-Schließen | DONE_MANUAL_USER_CONFIRMED | Geschlossen exakt für berichteten Ablauf. |
| Android Klartextdatei100→200→Restore100→Wiederöffnung100 | DONE_MANUAL_USER_CONFIRMED | Geschlossen; keine Funktionsscreenshots/Logs behauptet. |
| Windows K4, Kraken Spot, UI-R1–R4/ALLOC01 | DONE im dokumentierten Umfang | Bestehende Abnahmen erhalten; keine Wiederholung. |
| A01/A05 Offline-Write und Prozess-Kaltstart | DONE_MANUAL_USER_CONFIRMED | Offline gespeichert, Chrome UND FolioLab beenden erzwungen, offline per Symbol gestartet: Offline-Test/100EUR/Navigation erhalten. Keine Wiederholung. |
| A05 zusätzlicher expliziter Offline-Reload / technische Identität | Nicht berichtet | Separater In-App-Reload und Controller-/Cache-/Recordvergleich nicht aus dem Nutzerbericht ableiten; kein Wiederöffnen des erledigten Prozess-Kaltstarts. |
| Android verschlüsselter Datei-Restore K4/A09 | DONE_MANUAL_USER_CONFIRMED | Passwortdatei100EUR exportiert,200EUR geändert, Android-Dateidialog/Passwort/Restore100EUR, Chrome und FolioLab beenden erzwungen, Wiederöffnung100EUR; Nutzer bestätigt gesamten vorgegebenen Ablauf. Keine Wiederholung. |
| Android FreshRestore/Großdaten-/Recordgleichheit | OPEN | Isoliertes frisches Ziel und vorhandene Original10k-/Präzisions-/UNKNOWN-Belege; kein Löschen des bestehenden Profils. Kleiner Passworttest ersetzt das nicht. |
| A02/A06 Editor nach Appwechsel/Sperre und Abbrechen | DONE_MANUAL_USER_CONFIRMED | Editor/ungespeicherter Hintergrund-Test nach Appwechsel und ca.30s Sperre erhalten; Abbrechen bewahrt Offline-Test/100EUR. Keine Wiederholung. |
| A02/A03/A06 weitere Bedien-/Netzbedingungen | PARTIAL | Grundnavigation und beschriebener Hintergrundfall erledigt; vollständige Long-Press-/Zurück-/Fokus-/Safe-Area-/Netzwechsel-/Importbedingungen nicht pauschal abgenommen. |
| A04/A10 Last/Ressourcen; A07 echte Updatefolge; A08 Quota | OPEN, fehlende Gerätebedingungen | Physischer isolierter Messkontext/Originalfixtures; echte qualifizierte Versionsfolge; instrumentierte Fehlerbedingung. Kein Emulatorersatz, kein künstliches Produktdeployment. |
| K6 echte OS-Systemschrift Windows/Android | PARTIAL | Windows Tastatur/Fokus/CSS200% bestanden; OS-Schrift/Android-Kernbedienung fehlen. |
| Regulärer Main-Liveabschluss PR354 | FAIL / offen | Einmal erlaubter Retry2 bis Ende begleitet: coin-identity.js429 bei Workeraufbau, danach20s Controller-Timeout. Original csv-import.js503 separat erhalten. Restliche kontrollierte Offline-/Live-/Enginekette nicht abgenommen; kein weiterer Retry. |
| K1/K2 begrenzte Originalbestands-/Eigentumsanker | PARTIAL | Vorhandene private Quellen ausgewertet. Bitpanda: für Indexzuordnung BCI25-Komponenten zum31.03.2026; für Cash separat Stichtagssaldo. Keine neue allgemeine Privatvollhistorienpflicht. |
| K2 private ETH-Cursorfolge | OPEN | Genau erste Originalantwort inklusive next_page_params und zugehörige tatsächliche nächste Antwort; öffentliche Gegenproben/Fix DONE. |

Private Kraken-/Wallet-/Bitpanda-Befunde und ihre Grenzen stehen im Kriterienbericht; keine privaten Originale/Mengen hier veröffentlichen. Fehlende Nachweise sind kein beobachteter Produktfehler.

**Entwicklung:** Zugesagter Produktkern implementiert, keine konkret fehlende Featureimplementierung ermittelt. Ungeklärter regulärer Worker-/Transportabschluss verhindert einen vorbehaltlosen technischen Gesamtabschluss. **Abnahme:**1.0noch nicht vollständig. Safari/TalkBack/Komfort bleiben zurückgestellt. Kein intern belegter weiterer Codefix; nächste vorbereitete manuelle Handlung ist K6 Android-OS-Schriftgröße und Erreichbarkeit der Kernaktionen (siehe Kriterienabgleich).
