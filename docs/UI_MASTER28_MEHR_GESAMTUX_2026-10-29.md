# UI-MASTER28: Vollständige UX-Überarbeitung „Mehr“ · 29.10.2026

**Status: OPEN / bestehende Implementierung und Einzelbefunde teilweise vorhanden, neue Gesamtprüfung noch offen.** Dieser vollständige 16-teilige Auftrag ersetzt den einzelnen Ergänzungsprompt zur Backup-Beschriftung. Er erweitert die vorhandenen UI-MASTER28-, K03/K04-, Android-, Backup- und Drive-UX-Anforderungen; keine neue Roadmap, Einstellungsarchitektur oder parallele Implementierung.

## 1. Auftrag und Kollisionsschutz

Den gesamten Reiter „Mehr“ einschließlich geschlossener, geöffneter und verschachtelter Bereiche konsistent vereinheitlichen. Wichtige Aktionen schnell auffindbar, optionale Einstellungen verständlich, technische Details nachrangig. Bestehende Komponenten, Funktionen, Datenmodelle und Sicherheitsmechanismen erhalten; keine vollständige Neugestaltung. Vor Änderungen main, PRs und Checkpoint prüfen. Laufende freigegebene PRs/CI/Releases regulär abschließen; schon erledigte Arbeiten nicht doppelt entwickeln. Eigene Merge-/Deploymentfreigaben erhalten.

## 2. Vollständiger Prüfumfang

- Anbieter und Konten: Übersicht, Anbieterakkordeons, Konten/Depots, Bearbeiten/Löschen, Datenstand/Prüfhinweise und Leerzustände.
- Deine Daten: lokales Portfolio, JSON-Export, Wiederherstellung, endgültiges Löschen, Backupstatus/-passwort, verschlüsselte Backups, Zusatzoptionen/„Was wird gesichert?“, Google Drive, OAuth, Intervalle/Aufbewahrung, Verwaltung/Wiederherstellung und Ordner.
- Datenquellen und Aktualisierung: Automatik, Kurse/API-Schlüssel, Quellenauswahl, Diagnose/API-Sicherheit, weitere Verbindungen, erweiterte Suche, optionaler EODHD-Dienst und technische Einrichtung.
- Blockchain: Etherscan, Binplorer, Solana-RPC/Staking-Test, RPC-Sicherheit, Netzwerke und Hinweise.
- Datenschutz/Hinweise: lokale/externe Daten, Zugangsdaten, Wallet-Sicherheit, Rechtliches. Sämtliche Unterakkordeons und deren mobile Zustände gehören zur Abnahme.

## 3. Einheitliches visuelles Prinzip

Schriftfamilie, Größen je Hierarchie, Gewichte und Abstände vereinheitlichen. Akkordeons erhalten einheitliche Pfeile/Symbolgrößen, Öffnen/Schließen, Innenabstände, mindestens 44px bedienbare Touchfläche und sichtbaren Fokus. Keine mehrfachen Linien, unnötigen verschachtelten Rahmen oder großen Leerflächen. Äußere Hauptkarten dürfen bleiben; Unterbereiche bevorzugt durch dezente Abstände/Linien gliedern. Gleichwertige Funktionen gleich gestalten. Kurze Einleitungen, normale Erklärungstexte; Fett nur für Überschriften/wichtige Statuswerte. Keine redundanten Techniktexte oder unpräzisen Sicherheitsversprechen.

## 4. Anbieter und Konten

„+ Konto“/„+ Anbieter“ kompakt und mobil korrekt anordnen. Bearbeiten/Löschen eindeutig zuordnen und von Aufklappsymbolen unterscheiden. Ohne Anbieter verständlichen Einstieg zeigen. Singular/Plural im gesamten Reiter prüfen, insbesondere „1 Konto“/„2 Konten“ statt „Konto/Konten“.

K03-Kontodatenstand integrieren: zusätzlichen Rahmen/Hintergrund entfernen, Abstand nach vorheriger Linie und einheitliches kompaktes Akkordeon; technische Werte gruppieren, lange Prüflisten strukturieren und vollständige Details erhalten. Vorhandene Daten, fehlende Nachweise, ungeprüfte Angaben und bestätigte Vollständigkeit klar unterscheiden. Importierte Buchungen allein beweisen keinen vollständigen Depotabgleich. Prüfzahlen und Herkunft bleiben erhalten.

## 5. Deine Daten

Normalen JSON-Export eindeutig als „Portfolio als JSON exportieren“ kennzeichnen und von verschlüsselten Vollbackups trennen. Kurz erklären: keine API-Zugangsdaten und standardmäßig keine zusätzlich ausgewählten Wallet-Historien; keine lange Beschreibung neben dem Button.

Wiederherstellung: bestehende lokale Daten können ersetzt werden; Sicherung wird vor Übernahme geprüft. Sicherheitsbestätigungen und Rückfallsicherung vor riskanter Überschreibung erhalten.

„Alle Daten löschen“ von alltäglichen Aktionen trennen, bevorzugt in geschlossenem Unterbereich „Lokale Daten endgültig löschen“. Keine prominente rote Zwischenaktion. Bestehende Bestätigungen/Löschverträge unverändert; keine versehentliche Löschung von Drive-Backups.

## 6. Backup-Passwort und Zusatzoptionen

Passworttext verbindlich: **„Dein Passwort schützt verschlüsselte Backups auf deinem Gerät und in Google Drive. Zur Wiederherstellung benötigst du das Backup und dieses Passwort.“** Status separat „Backup-Passwort eingerichtet“. Bei vorhandenem Passwort Änderungsdialog standardmäßig geschlossen.

Kleine Zwischenüberschrift „Zusätzliche Daten sichern“. Darunter: „Portfolio, Buchungen und historische Stichtage werden standardmäßig gesichert. Wähle, welche weiteren Daten in zukünftige verschlüsselte Backups aufgenommen werden sollen.“

Checkboxen:
- „Bestätigte Wallet-Historien einschließen“
- „Einstellungen und API-Zugangsdaten einschließen“

Kurzer Hinweis: „Diese Auswahl gilt für zukünftige verschlüsselte Backups auf deinem Gerät und in Google Drive.“ Tatsächliche Bedeutung bestehender Felder bewahren.

„Was wird gesichert?“ bleibt Detailakkordeon und unterscheidet:
- Immer im jeweiligen bestehenden Portfolio-Backup: Portfolio/Positionen, Buchungen, historische Referenzwerte und weitere tatsächlich standardmäßig enthaltene Portfoliodaten.
- Optional im verschlüsselten Vollbackup: bestätigte Wallet-Historien, Einstellungen/API-/RPC-Zugänge, übertragbare Drive-Konfiguration gemäß vorhandenem Vertrag.
- Nicht sichern: Google-Zugriffstokens, Geräteschlüssel, Seed-Phrases oder private Wallet-Schlüssel.

Keine Behauptung, jeder einfache JSON-Export enthalte Wallet-Historien. Checkboxtexte nicht fett, links an erster Textzeile ausrichten, kompakte Gruppierung und einheitliche Zeilenhöhe. Erklärungen nicht außerhalb/innerhalb doppeln. Ohne gespeicherte Präferenz beide Optionen aus; gespeicherte Auswahl nicht zurücksetzen. Verschlüsselung/Exportinhalte unverändert ohne eigenen Fachvertrag. Wiederherstellung für alle vier Optionskombinationen prüfen.

## 7. Eindeutige Backupstatus

Passwort eingerichtet, Backup erstellt, Download angestoßen, Datei sicher aufbewahrt und bestätigte Drive-Sicherung sind verschiedene Zustände. Passwort bedeutet kein vorhandenes Backup; Download beweist keine sichere Aufbewahrung. Lokale/Drive-Vorgänge unterscheiden, Fehler niemals als Erfolg anzeigen. Vorhandene gespeicherte Statusinformationen korrekt und kurz pro Sicherungstyp nutzen; keine erfundenen lokalen Sicherungsnachweise.

## 8. Google Drive Backup

Verbindungsstatus, letzte tatsächlich bestätigte Sicherung, Verbinden/Erneuern und zulässiges „Jetzt sichern“ früh zeigen. Lange Einrichtung nicht vor häufigen Aktionen platzieren. „Google-Zugang einrichten“ optional/geschlossen, kompakte Anleitung. Benötigte JavaScript-Origin aus der aktuellen Installation korrekt erläutern: Schema, Domain und gegebenenfalls Port, kein Pfad. Kein fest eingebranntes falsches github.io-Beispiel. Google-Testnutzer, OAuth-Sicherheit und drive.file unverändert. Akkordeonpfeil statt extern wirkendem ↗; echte externe Links getrennt kennzeichnen.

Beschriftung etwa „Automatische Sicherung bei geöffneter App“. Aus/Bei aktiver Verbindung/Täglich/Wöchentlich/Monatlich dürfen keine Sicherung bei geschlossener App versprechen. Hinweis: „Automatische Sicherungen erfolgen nur, während FolioLab geöffnet und Google Drive verbunden ist.“

„Anzahl der aufzubewahrenden Drive-Backups“ statt unklarem „Backups behalten“. Vor einer Änderung mit Löschung älterer Sicherungen verständlich auf die Auswirkung hinweisen; bestehende Bereinigungs-/Konfliktsicherheit erhalten.

Auswählen/Prüfen/Wiederherstellen/Ordnerwechsel kompakt logisch gruppieren, technische Felder nachrangig, Folgen klar. Rückfallsicherung vor Wiederherstellung verpflichtend. FLH04-Wunsch erhalten: nach OAuth bei erfüllten Voraussetzungen unmittelbar bereits autorisierten Sicherungsablauf starten oder direkt anbieten; keine stille Überschreibung/Berechtigungserweiterung.

## 9. Datenquellen und Aktualisierung

Klar gliedern: automatische Aktualisierung, Wertpapier-/Kryptokurse, optionale Verbindungen, Blockchain und Datenschutz. Keine doppelten technischen Erklärungen. Automatik korrekt als Aktualisierung beim Öffnen beziehungsweise während Nutzung mit bestehender zeitlicher Begrenzung erklären, keine garantierte Hintergrundaktualisierung bei geschlossener PWA. Logik unverändert.

EODHD/FMP/Twelve Data/CoinGecko knapp einheitlich erläutern. Klare Quellenauswahl; Schlüssel/Test logisch zusammenhalten. „EODHD-Verbindung prüfen“ von Speichern unterscheiden. Status Noch nicht geprüft/Wird geprüft/Erreichbar/Fehler mit Ursache; Erreichbarkeit bestätigt nicht Kurse jeder Position. API-Schlüssel entfernen visuell absetzen und nur mit bestehender sicherer Bestätigung; kein gewöhnlicher Speichervorgang.

## 10. Optionale Verbindungen

K04 vollständig integrieren. Erweiterte Suche: optional, Namen/ISIN und übertragene Daten erklären; Funktionen ohne Worker nur soweit tatsächlich unterstützt. EODHD: optional, direkte API versus eigener Worker/CORS korrekt; Worker-Zugriffsschlüssel vom EODHD-Schlüssel unterscheiden.

Doppelte Cloudflare-Anleitungen konsolidieren: gemeinsame Grundlage einmal, Dienstunterschiede getrennt, zentralen vollständigen Leitfaden verlinken. Keine zwei gleichen Schrittfolgen oder Vermischung mit allgemeinem Datenschutz.

Mehrere Speicherbuttons für denselben Formularzustand prüfen. Bei gemeinsamem Speicherpfad klare Bedienlogik, keine doppelte Speicherung/versteckten Nebeneffekte; ungespeicherte Werte und Tastaturbedienung erhalten. Endpunkte/Authentifizierung unverändert.

## 11. Blockchain-Verbindungen

Etherscan V2, Binplorer, Solana-RPC, Staking-Test und Netzwerkinformationen einheitlich darstellen. Optionale Zugänge markieren, Zweck/Netzwerk/benötigte Daten knapp; lange Anleitung geschlossen. Gleiche Muster für Test, Speichern, Status und Fehler.

RPC-Adresse kann Schlüssel enthalten; keine Seeds/private Schlüssel verlangen. Bestehendes Speichern beim Verlassen transparent erklären, „Verbindung & Staking prüfen“ eindeutig von Speichern trennen. Sicherheitsdetails kompakt. Lange Anbieter-/Netzwerkhinweise als kleines Unterakkordeon; keine Duplikate zu Kursen/Datenschutz. Keine Änderung an Wallet-/Staking-/Blockchainberechnung.

## 12. Zentrale Datenschutz- und Rechtsinformationen

Lokale Speicherung: Datenort, Zugangsdaten, Folgen eines Browser-Resets. Externe Anfragen: Kurse, öffentliche Wallet-Adressen, RPC und optionale Suche. Sicherheit: keine Seeds/privaten Wallet-Schlüssel, keine Google-Zugriffstokens im Backup, Risiken lokal gespeicherter API-Schlüssel. Rechtliches: keine Anlageberatung/Verwahrung, externe Kurse und Bestände möglicherweise unvollständig.

Knapp verständlich an einer zentralen Stelle. Spezifische Hinweise an riskanten Eingaben dürfen bleiben; allgemeine Erklärung nicht viermal wiederholen. Tatsächliche Datenschutz-/Sicherheitsverträge nicht abschwächen.

## 13. Informationshierarchie

Gewöhnliche Einstellungen dürfen nicht mehrere Unterakkordeons erfordern. Jede Ebene, Einzelaktionsakkordeons, redundante Rahmen, prominente Technik, tiefe wichtige Aktionen, Statussichtbarkeit und Kontext mehrerer geöffneter Bereiche prüfen. Nur mit erhaltener Funktion/Erreichbarkeit zusammenfassen; keine pauschale Akkordeonentfernung.

## 14. Android und Bedienperformance

Geschlossene und geöffnete Zustände bei 320/360/390/412/430/768/1440px prüfen. Lange Schlüssel/URLs/Namen, mehrere offene Bereiche, Tastatur bei OAuth/RPC, lange Texte/Listen, Checkboxen, Speichern/Prüfen, Aktionsleisten, Bottom-Navigation, Scrollposition, Systemschrift, dynamische Höhe, Touch, Screenreader und sichtbarer Fokus. Keine horizontalen Überläufe/übergroßen Karten/unnötigen DOM-Neuberechnungen. Daten-/Speichermodell unverändert. Hardware und Emulation getrennt nachweisen.

## 15. Zustands- und Funktionsregression

Anbieter: leer, ein Anbieter/ein Konto, mehrere Konten, Datenstand offen/zu.

Backup: kein/eingerichtetes/geändertes Passwort; beide Optionen aus, nur Historie, nur Einstellungen, beide an; JSON, verschlüsselter Download und Wiederherstellung.

Drive: unkonfiguriert/unverbunden/verbunden, Sicherung erfolgreich/fehlgeschlagen, Automatik aus/aktiv, vorhandene Backups, Wiederherstellung, fehlendes Passwort und abgelaufene OAuth-Verbindung.

Quellen: ohne/gültige/ungültige Schlüssel, Diagnose erfolgreich/fehlerhaft, Worker unkonfiguriert/konfiguriert. Blockchain: kein/eigener RPC, Verbindungsfehler, unterstütztes/nicht unterstütztes Staking. Aussagen müssen implementiertem Verhalten entsprechen; öffentliche Fixtures ausschließlich synthetisch, externe echte OAuth-Grenzen getrennt kennzeichnen.

## 16. Umsetzung und dauerhafte Absicherung

Laufenden freigegebenen Release abschließen, Nachtrag sichern, bestehenden Stand und Überschneidungen abgleichen, reproduzierbare Deltas erheben. Kleine zusammenhängende Text-/Layoutpakete im vorhandenen UI-Master; Sicherheitsabläufe nur nach eigener Fachprüfung. Chromium/Firefox/WebKit und relevante Backup-/OAuth-/Recoverytests, Vorher-/Nachherbilder auch offener Unterbereiche. Commit/GitHub-Sicherung/Remote-SHA und separater zentraler Checkpoint.

Keine selbstständige Änderung von OAuth-Berechtigungen, Endpunkten, Verschlüsselung, Speicherformaten, CAS, Wiederherstellung oder wirtschaftlichen Daten. Keine neuen verpflichtenden Clouddienste. Historischen Dokumentationsbranch nie als Appcode nach main mergen. FLH05/FLH-PROJ01 OPEN/PARKED.

## Erster belegter Codeabgleich, keine Gesamt-Abnahme

Auf dem unveränderten PR202-Tree bestätigt: falscher Passwortsatz, fette Zusatzoptionen, permanente Löschaktion, feste github.io-Beispielorigin, ↗-Akkordeon und „Konto/Konten“ vorhanden. Diese UI-Deltas sind OPEN. Die bestehenden beiden Opt-ins lesen gespeicherte Präferenzen und sind ohne solche standardmäßig aus; diese Funktion erhalten. Vollbackup-Vertrag trennt optionale Konfiguration/Wallet-Historie und schließt Google-Tokens/Geräteschlüssel aus. Keine Neuerstellung dieser vorhandenen Fachlogik. Vollständige geöffnete „Mehr“-Browserprüfung, Hardware und externe OAuth-Abnahme noch nicht durchgeführt.
