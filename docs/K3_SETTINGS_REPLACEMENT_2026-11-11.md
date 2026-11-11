# K3/K4 – API-Formular nach bestätigtem Reset/Restore · 11.11.2026

Owner main-75ea9fa46556-20261111. Ausgang: v307 LIVE_ACCEPTED, Main37119745f9ac9e2356477202cae55948f3d74882/Tree3c5cc434bc8f9600a727d53b71ffda0d5ab7e8d5, V142 gepinnt und tatsächlich restauriert (37 Manifestpfade/0 Fehler).

## Gemeinsames Ergebnis und begrenzter Befund

Nach einer ausdrücklich bestätigten vollständigen Löschung oder der angenommenen Wiederherstellung von Einstellungen müssen die vorhandenen API-Formularfelder den tatsächlich übernommenen Modelleinstellungen entsprechen. Neue übernommene Schlüssel sollen maskiert sein. Normales Rendern, abgelehnte/fehlende Konfiguration und fehlgeschlagene Speicheroperationen dürfen dagegen keine laufenden Formularentwürfe verwerfen.

Die tatsächlich ausgeführten bestehenden deleteAll-/render-/renderSettings-/apiSettingsHasDraft-Funktionen mit DOM-/Speicheradaptern ergeben nach erfolgreichem Reset: Modellschlüssel leer, alter Formularwert bleibt erhalten, Updateguard meldet Entwurf. Dies ist eine Quellcode-Gegenprobe, noch keine native Browser-/Produktionsreproduktion. renderSettings synchronisiert RPC und Aktualisierungsfrequenz bereits; dafür kein zusätzlicher Patch. Die lokalen und Drive-Restorepfade ersetzen angenommene Einstellungen und rufen save/render auf; die API-Formularwerte werden bisher nur beim initialen initEvents geladen.

## Fachpaket

1. Bestehende Formularbelegung einmal gemeinsam definieren und bei Initialisierung sowie nach bestätigtem vollständigem Reset verwenden.
2. Nach erfolgreichem lokalen oder Drive-Restore ausschließlich bei ausdrücklich angenommener Konfiguration die Formularwerte auf das übernommene Modell abgleichen; bestehende Sichtbarkeitstoggles dabei über ihren vorhandenen Mechanismus maskieren.
3. Ohne/bei abgelehnter Konfiguration und bei Fehler/Abbruch Entwürfe erhalten. Nicht bei jedem render synchronisieren. V307-Update-/Entwurfsvertrag vollständig erhalten.

Keine Finanz-, Speicher-, CAS-, Backupformat-, Kryptografie-, Origin- oder Installationsänderung; keine neue Engine oder globale Schlüsselkopie. Normale Speicherung und bestehende Restore-/Löschschutzverträge bleiben unverändert. Risikoklasse: UI-Zustand an vorhandenen bestätigten K3/K4-Operationen; sämtliche Finanz-/Speicher-/Recoverygates bleiben Pflicht.

| Kriterium | Gemeinsame Prüfung | Phase |
| --- | --- | --- |
| Reset erfolgreich/abgebrochen/fehlgeschlagen, Sichtbarkeit und gemeinsamer Formularabgleich | tatsächliche Handler mit Adaptern; neuer isolierter Browservertrag mit echtem IDB | lokal + PR/Main/Produktion3Engines |
| Angenommener verschlüsselter Dateirestore zeigt neue Werte maskiert; Modell/Record stimmen überein | tatsächlicher verschlüsselter UI-Dateiimport und kanonischer Readback | PR/Main/Produktion3Engines |
| Abgelehnte/fehlende Konfiguration, normale Darstellung und gescheiterter Commit erhalten Entwürfe | Handler-Negativfälle, tatsächliche UI-/IDB-Fehlerpfade | lokal + PR/Main/Produktion3Engines |
| Drive-Callback gleiches lokales Zustandsverhalten | tatsächliche Callbackfunktion mit expliziten Adaptern, kein OAuth-Beweis | lokal + verpflichtende bestehende Suite |
| V307-Draft-/Update-, Daten-/Revisions-, Finanz-/CAS-/Offline-/Restoreverträge erhalten | bestehende unveränderte Pflichtsuiten und neue Zustandsfälle | jede vorgeschriebene Phase separat |

V307 bleibt letzter LIVE_ACCEPTED bis ein neuer vollständiger Kandidat PR/Main/Deployment/tatsächliche Produktion/private Sicherung/Readback/Restore erfüllt. Echte OAuth-/Android-/Safari-/TalkBack- und unabhängige Original-/Ownership-Belege bleiben extern. 1.0 wird dadurch nicht pauschal abgenommen.
