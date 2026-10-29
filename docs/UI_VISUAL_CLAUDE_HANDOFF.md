# Konsolidierter UI-Nachtrag übernommen · PR200-Release läuft · 29.10.2026

[Verbindlicher Sollvertrag UX01–10 und vollständige Abnahmematrix](https://github.com/joke0071/foliolab-open/blob/e4ce49d5cba0e9fee2b3acdf03f13b443a0bc5d8/docs/UI_MASTER28_KONSOLIDIERTER_NACHTRAG_2026-10-29.md). Die neuen konkreten Androidbefunde werden gegen aktuelles Produkt reproduziert; vorhandene CSS-Regeln/alte DONE-Vermerke gelten nicht als Gegenbeleg. Bestehende UI-MASTER28-Anforderungen und Sonnet-A01–08 bleiben erhalten.

PR200 ist ausdrücklich freigegeben und mit unverändertem geprüften Tree gemergt: main `6ec0cf9c6e28edf1b19993357c3b839106b8aa80`. [Main-/Pages-/Livepipeline40916302834](https://github.com/joke0071/foliolab-open/actions/runs/40916302834) läuft; SW213 noch nicht live abgenommen. Erst PERF01 regulär abschließen, dann UI-P1: Sperrkategorien, gemeinsame Verwaltung/Bearbeiten/Gmail-Auswahl, kompakte Leisten, Tooltips, 4×2-Zeiträume, Liquiditätsleerzustand, kompakte Buchungshistorie, beide redundanten Stichtagsbeschriftungen. Danach P2 einschließlich Archivdropdown, Diagrammmodi/zeitliche X-Achse und Headerstatus; P3 optional. Neue wirtschaftliche Löschpfade separat mit Fachbeweis und Freigabe. Keine zweite Auswahl-/Speicher-/Chartengine.

ChatGPT Work bleibt alleiniger Implementierer. UI-VISUAL-CLAUDE: AUDIT COMPLETED / IMPLEMENTATION RETURNED TO CHATGPT WORK. Issue197 abgeschlossen. Gesamtmaster PARTIAL; externe Hardware-/OAuth-/Originalbeleggrenzen unverändert; FLH05/FLH-PROJ01 OPEN/PARKED.

---

# Aktuell gültiger Masterstand · 29.10.2026

**PR196 DONE / LIVE_ACCEPTED:** main c08bc1d35b25d72081fb07a61e95532a883fdebe, unveränderter freigegebener Baum0d486119, produktiv v211/SW211. Main/Pages/Live40893805495 vollständig SUCCESS,946/946Units,Chromium/Firefox/WebKit,120exakte Live-Assethashes und tatsächliche Referenzrücknahme-/Native-Übernahmeberichte. Dauerhafter Maschinenbeleg [reference-removal-live-v211.json](release-evidence/reference-removal-live-v211.json), Commit53fdbafcfc8e8b71d63bb73ea50b500db04c008b. Keine universelle DELETE-/Folge-PR-Freigabe.

**UI-VISUAL-CLAUDE: AUDIT COMPLETED / IMPLEMENTATION RETURNED TO CHATGPT WORK.** Ausdrückliche Nutzerentscheidung: exklusive Claude-Implementierungsdelegation samt Work-Sperre vollständig aufgehoben. Work übernimmt sämtliche offenen UI-/UX-Aufgaben. Claude lieferte laut Nutzer ausschließlich unabhängigen read-only Audit, keinen Code/Branch/PR. Keinen weiteren Claude-Lauf starten. Historische Delegationstexte darunter sind überholt und bleiben nur als Nachweise erhalten.

Die acht zusätzlichen Sonnet-Kandidaten UI-A01–A08 und der vollständige A–I-Restvertrag stehen im aktuellen Kopf von [UI_VISUAL_CLAUDE_HANDOFF.md](UI_VISUAL_CLAUDE_HANDOFF.md); Umsetzung unter bestehendem UI-MASTER28/#149, keine zweite Roadmap. P1 kompakte Beträge/echte44px-Ziele; P2 Kontrast/Zeiträume/Donutfokus, mobile Zeilen nur bedingt; P3 Willkommen/Leerraum nach belegtem Nutzen. Bereits erledigte UI überspringen. Eigene vorläufige Ausgangsmessung [pr196-followup-baseline.json](release-evidence/pr196-followup-baseline.json) bestätigt A01/A02/A04; übrige Kandidaten vor Umsetzung verifizieren.

**FLH-PERF01 essentielleP1**, echte große IDB-Startperformance/30%-Medianziel, Erst-/Warmstart getrennt messen; nicht hinter optionalerP3 verzögern. FLH03/DELETE/IDB-Recovery/FLH04 und sämtliche ursprünglichen Anforderungen/Originalbeleg-/OAuth-/Hardware-/AT-/Releasegates bleiben erhalten. **FLH05/FLH-PROJ01 OPEN/PARKED.** Gesamtmaster PARTIAL. Keine parallele Implementierung, keine historischen Dokumentationsbranches nach main mergen; jede Etappe und separaten Checkpoint remote sichern.

---

# UI-Rückübernahme und verbindlicher Master-Nachtrag · 29.10.2026

Status **UI-VISUAL-CLAUDE: AUDIT COMPLETED / IMPLEMENTATION RETURNED TO CHATGPT WORK**.

Ausdrückliche neue Nutzerentscheidung: Die bisherige exklusive Implementierungsdelegation und jede daraus abgeleitete Work-UI-Sperre sind vollständig aufgehoben. ChatGPT Work verantwortet wieder sämtliche offenen UI-/UX-Arbeiten einschließlich fachgebundener Sicherheits-UI. Kein weiterer Claude-Codinglauf. Laut Nutzer ausschließlich unabhängiger read-only Sonnet5.5-Audit; kein Claude-Code/Branch/PR zu übernehmen. Historische Delegationstexte darunter bleiben ausschließlich als Nachweise erhalten und sind keine aktuellen Sperren.

Gesamtmaster **PARTIAL**. Weiterhin ein Master/Checkpoint, kein paralleler Implementierungsstrang, keine neue konkurrierende Roadmap. Historischen Dokumentationsbranch niemals als Appcode nach main mergen. Bereits vorhandene Anforderungen, Releasebelege und Sicherheitsgrenzen bleiben erhalten.

## Sonnet-Audit und bestehender UI-MASTER28

Vom Nutzer übermittelte externe Prüfung: damaliger main6fe75a99, Chromium, synthetische Daten, Übersicht/Verlauf/Positionen/Buchungen/Mehr,320/390/430/768/1440px, leer/gefüllt,50Zustände ohne horizontalen Overflow. Keine externe Vollabnahme für Firefox/WebKit, vergrößerten Text, kleine Höhen oder CI. Befunde vor Implementierung gegen neuesten Code reproduzieren; keine Hardware-/iOS-/Android-/TalkBack-/VoiceOver-Abnahme daraus ableiten.

| ID | Priorität / Kandidat | Verbindliche Umsetzung und Prüfumfang |
| --- | --- | --- |
| UI-A01 | P1 kompakte Beträge/Achsen | Bestehende Formatter wiederverwenden; ausreichend präzise und unterscheidbar, dynamische Stellen; exakter Donutwert direkt oder zugänglich; doppelte Achsenlabels vermeiden. Regression983,10/1000/1010/1059/9999/Millionen/negativ/unbekannt. Nur Darstellung, keine gespeicherte Präzision/Berechnung ändern. |
| UI-A02 | P1 Touchziele | Echte bedienbare Bereiche messen, relevante Aktionen mindestens44x44CSSpx; link-button/Kalender/Kopfaktionen/Filterchips, keine Überlappung.320px-Siebenspaltenkalender gesondert lösen. Scoped CSS, keine pauschale globale.btn-Änderung. |
| UI-A03 | P2 kleiner Textkontrast | Sichtbare berechnete Farben/Overrides messen: Wochentage/historyCalendarHint/Wizardkatalog/fehlender Kurs/field small/subtle/chart-caption. Normaltext mindestens4,5:1 soweit erforderlich, bestehende Palette. |
| UI-A04 | P2 Zeiträume/Diagrammleerzustände | Max-Umbruch390px reproduzieren,320/390/430px; kompakte einzeilige oder ausgewogene Rasterdarstellung. Zeiträume/Auswahl/Filtergrenzen erhalten. Nur echte Leerzustände verdichten, keine Chartberechnung ändern. |
| UI-A05 | P2 bedingt mobile Positionszeilen |320px getrennte Iconzeile nur bei tatsächlichem Vorteil ändern; Titel/Aktionszugang/44px/Auswahl-/Archivvertrag erhalten. Keine zweite Auswahlengine/Löschlogik. |
| UI-A06 | P3 Willkommenskarte | Vier Aktionen auf Gleichmäßigkeit/Lesbarkeit prüfen,2x2 oder kompakte mobile Anordnung nur mit tatsächlichem Vorteil; Wizard/Navigation erhalten. |
| UI-A07 | P2 Donutfokus | allocation-segment Tastaturfokus sichtbar machen falls bestätigt; SVGgeometrie/Clipping/Firefox/WebKit prüfen. Keine Allokationsberechnung ändern. |
| UI-A08 | P3 leerer Verlauf | Nur belegte überflüssige Höhe bei leerem Portfolio reduzieren; Hinweis/Hauptaktion erhalten, belegte Diagramme unverändert. |

Alle Kandidaten bleiben unter bestehendem UI-MASTER28/#149. Status zunächst **OPEN / VERIFY**, keine pauschale Bestätigung der acht Befunde. A01-Quellabgleich bestätigt drei Formatter mit nur einer Kompaktdezimalstelle; eigener vorläufiger Chromium-Leerscan auf releasec08bc1d3 bestätigt zu kleine Kopfaktionen/Filter/Links,25Zustände ohne Overflow. Das ersetzt keine gefüllte/3Engine-/Kalenderabnahme.

Vollständiger verbleibender UI-Vertrag A–I:
- A Typografie: Schriftfamilie/-größen/-gewichte/Zeilenhöhen, Überschriften/Hilfe/Buttons/Zahlen/Datum/Tabellen/Dialoge/Akkordeons konsistent; bereits Vereinheitlichtes erhalten.
- B Übersicht/Verlauf: Karten/Trennlinien/Chartachsen/Tooltips/Datenbasis/Zeiträume/Leer-Teilzustände/Rendite-Geldflüsse/Liquidität/Anbieter-Konten, Fachwerte unverändert.
- C Positionen/Buchungen: direkte Aktionen, Gmail-Auswahlengine/kompakte Leisten/Archiv-Restore/Edit-Delete/Status/Touch-Tastatur/Mobile erhalten.
- D Referenzen: Normal-/Verwaltungsmodus/Verwalten-Fertig/Auswahl/Archiv/Mobile/Aktionen/Fehler/sichere Vorschau; CAS/Backup/Undo/Bestätigung nicht schwächen.
- E Erträge/Abzüge/Transfers: kompakte Kennzahlen/Zahlen/unbekannte Werte/Leerzustände/gesperrte Aktionen/Akkordeons; vorhandene Fachlogik erhalten.
- F Erststart/Import: leeres Portfolio/Anbieter/Konto/Position/Importvorschau/Voraussetzungen/nächste Schritte; v193-Kontofortsetzung/FolioLab-Marke nicht erneut bauen.
- G Einstellungen: Quellen/Anbieter-Konten/API/Wallet-Blockchain/Backup/Drive/Experten hierarchisch konsistent; keine API-/Security-/Storageänderung.
- H Mobile/A11y:320/390/430/768/1440px, kurze Höhen, Tastatur/Fokus/44px/Kontrast/Textvergrößerung/Overflow/Dialogscroll/offene Akkordeons/Screenreaderlabels. Emulation und echte Hardware/AT getrennt.
- I AUD04/#157: bestehenden Dirty-Dialog-/Navigationvertrag respektieren; keine universelle beforeunload-/Cross-Origin-Lösung ohne belastbare neue Ursache und passende Freigabe.

Schon erledigt, gegen aktuellen Code erhalten: Vermögen-/Willkommenskartenabstand, Verlaufstrennlinien/3Icons, kompakte Datenbasis/7T–Max/gemeinsamer Wochenfilter, Liquidität nach Anbietern/letzte Anbieterlinie, Gmail-Mehrfachauswahl/Buchungsaktionen/mobile Historienansichten, Kontofortsetzung/FolioLab, Referenzarchiv+Restore, Achseneinheiten sowie vorhandene Recovery-/Kontrast-/Leerfixes. Historische OPEN-Zeilen allein sind keine Implementierungsaufträge.

Begrenzter UX-Abschlusscheck der fünf Ansichten mit synthetischen Portfolios: Auffindbarkeit, Führung, Muster, Dichte, Mobile, Feedback, fehlende Kurse/Teilgeschichte, Geldbeträge, A11y, Fokus/Scroll. Nur reproduzierbare Deltas; keine unbegrenzte neue Auditphase.

## Priorität, Sicherheit und übriger Master

Nach sicherer produktiver PR196-Abnahme: Zuständigkeit/Issue197 sichern; kleine zusammengehörige P1-Pakete Beträge/Touch, danach P2 Kontrast/Zeiträume/Donutfokus/gegebenenfalls Positionsaktionen, bestätigte übrige UI-Deltas. **FLH-PERF01 essentielleP1 nicht hinter optionaler P3-Kosmetik verzögern.** P3 Willkommen/Leerraum zuletzt sinnvoll bündeln.

FLH-PERF01: tatsächliches großes IndexedDB-Portfolio, reproduzierbare Vorhermessung/Median/Interaktivität, Initialisierung/Abfragen/Indexe/Rendering/Mainthread/Chunking-Lazy prüfen. Ziel mindestens30% niedrigerer medianer Appstart soweit messbar ohne Qualitätsverlust. Offline/CAS/Mehrtab erhalten; CI-Laufzeit ist kein Ersatz.

FLH03 native FlatexAT/Bittr/Kraken/Bitpanda/LedgerLive/weitere belegbare Anbieter, Rekonstruktion/Reconciliation/sichere wirtschaftliche Übernahme bleiben bestehen; nur freigegebene und durch Originalbelege qualifizierte Abschnitte. DELETE-MASTER28 bleibt PARTIAL mit quellbezogenen Abhängigkeits-/Vorschau-/CAS-/Undo-/Backup-/Restore-/Atomaritätsgates; PR196 ist keine universelle Freigabe. IDB-only/Recovery/offline/Migration/Mehrtab erhalten. FLH04 Revisionen/Geräteidentität/Konflikte/Recovery/Verschlüsselung sowie externe OAuth-/Transport-/Operatorgates erhalten. **FLH05 und FLH-PROJ01 OPEN / PARKED**, keine eigenständige Implementierung ohne neue ausdrückliche Entscheidung; notwendige Zukunftskompatibilität ohne Zusatzphase.

VanillaJS/HTML/CSS/PWA/local-first/keine Serverpflicht/zentralen Secrets/unnötigen Dependencies. Keine fremden Branches überschreiben, keine privaten CSVs/Finanzdaten/Keys veröffentlichen. Tests nicht abschwächen. Unit/Syntax/Chromium/Firefox/WebKit/mobile/Axe/Fokus plus Finance/CAS/Backup/Restore/Import und echte Livebytes prüfen. Die PR196-Freigabe gilt ausschließlich unverändertem be860237/SW211; spätere sicherheitskritische Funktionen/PRs behalten eigene erforderliche Releasegrenzen.

Jede sichere Etappe committen/pushen/Remote-SHA verifizieren, separaten zentralen Checkpoint mit DONE/PARTIAL/BLOCKED, Branch/SHA/PR/CI/Liveversion/externer Grenze/exakter Fortsetzung. Vor Limits zuerst sichern, keine neue große Arbeit beginnen. Fehlgeschlagenen Push niemals als remote gesichert ausgeben.

---

# UI-VISUAL-CLAUDE – verbindliche Übergabe · 29.10.2026

Status: **DELEGATED / OPEN, Aktivierung gesperrt**.
Exklusiver Implementierungsowner: **GitHub Copilot mit Claude Sonnet 5.5**,
gemäß ausdrücklicher Nutzerentscheidung. Kein neues Gesamtprojekt und keine
Umpriorisierung laufender sicherheitskritischer Arbeit.
ChatGPT Work implementiert diese rein visuellen Restarbeiten künftig nicht selbst.

## Verifizierter Ausgangsstand

- main: `6fe75a997a076d0c17e5200b0bb7ee09532d7044`, produktiv SW208/v208.
- Einziger aktiver Work-Funktionsstrang: [PR196](https://github.com/joke0071/foliolab-open/pull/196),
  `feature/reference-removal-safe-subset`, HEAD
  `be860237af019deab0c4e393dbcc022976bb5c1f`, Kandidat SW211.
- PR196 ist technisch abgenommen: Pflicht-[40883912046](https://github.com/joke0071/foliolab-open/actions/runs/40883912046)
  und Wallet-[40883911994](https://github.com/joke0071/foliolab-open/actions/runs/40883911994)
  SUCCESS,946/946Units und Chromium/Firefox/WebKit. Separate konkrete
  Nutzerfreigabe für Merge/Deployment fehlt. Kein Merge/Deployment erfolgt.
- Geparkte Drafts157/161 bleiben unverändert. Kein Claude-Branch/-PR/-Codinglauf
  durch diese Dokumentation erzeugt. Trackingissue im zentralen Checkpoint/der Roadmap.
- Die verfügbaren verbundenen GitHub-Werkzeuge haben keine Copilot-Modellwahl/
  verifizierbare Sonnet-5.5-Dispatchschnittstelle. Kein anderes Modell als Ersatz
  starten und keinen tatsächlich laufenden Claude-Auftrag behaupten.
  Vor Aktivierung muss der Operator die verlangte Modellwahl in GitHub Copilot
  bestätigen; falls dort nicht verfügbar, ist genau dieser Start extern BLOCKED.

## Bereits implementiert – erhalten, nicht erneut bauen

Diese Darstellung ist schon in main vorhanden (u.a. Vorläufercommit a486c82)
und gegenüber dem aktuellen Kandidaten in den relevanten Stellen unverändert:

| Anforderung | Tatsächlicher Bestand / Nachweis |
| --- | --- |
| Kompakte Datenbasis im Diagrammkopf | index.html `#historyBasis/.history-basis`, vorhandene Optionen auto/observed/partial, Auto-Standard und Zeiträume7T/1M/3M/6M/1J/3J/5J/Max erhalten |
| Drei dekorative Verlaufsicons | `#historyCoverage/#performanceDetails/#snapshotManager`; vorhandener shield-Key zeichnet bereits Schild MIT Haken, zusätzlich chart-no-axes-combined und clipboard-check in src/format.js;17px/1.8Stroke, aria-hidden. Kein Rename/Icon-Neubau allein wegen interner Keybezeichnung |
| Historische Referenzwerte | Bestehender Name, standardmäßig geschlossener Bereich, Normal-/Verwaltungs-/Archiv-/Restoreabläufe bleiben erhalten |
| Liquidität & Fälligkeiten | src/app.js hängt renderCashTermsOverview nach vorhandenen Anbietern an; bestehender geschlossener Einstieg bei vorhandenem sinnvollem Kontoumfang |
| Letzte Anbieterlinie | styles.css `.provider-accordion:not(:has(~ .provider-accordion))` entfernt nur letzte Linie; Zwischentrennlinien und ausgeklappte Zustände erhalten |
| Belegte Leer-/Teilzustände/1W | Bestehende historischen Datenbasen, keine Fakekurve/Interpolation, gemeinsamer Wochenfilter Übersicht/Verlauf; vorhandene UI-/Small-rests-Verträge bewahren |

`tests/browser-history-followup.mjs` prüft diese konkreten History-/Icon-/Liquiditäts-/
Trennlinienzustände in320/390/768/1024/1440px, Keyboard/Axe und exakte
Nullmutation von Record/Revision. Die tatsächlichen aktuellen Logs belegen
Chromium,Firefox und WebKit PASS in40883912046 (Jobs123482405876/123482405354).
Die allgemeine UI-Qualitätsprüfung enthält zusätzlich430px.
Keine spezifische430px-Vollabnahme aller geöffneten History-/Liquiditätszustände
aus diesen anderen Scans erfinden: Claude muss seine verlangte Breitenmatrix
320/390/430/768/1440 für tatsächlich berührte Zustände nachweisen.
Ältere OPEN-Texte aus #149/UI-MASTER28/Roadmap sind keine Wiederholungsaufträge.

## Ausschließlich delegierter Restumfang

Immer zuerst gegen den dann aktuellen main bestätigen, dass ein konkreter
Restbefund fortbesteht. Ein bereits erfüllter Punkt wird als erhalten dokumentiert.

### A – Visuelle Konsistenz

- Verbleibende tatsächliche Typografieabweichungen in bestehenden Ansichten.
- Uneinheitliche Abstände, Beschriftungen, Buttons und Trennlinien.
- Zahlen-, Datums- und Tabellenformatierung ausschließlich auf Darstellungsebene.
- Redundante visuelle Elemente und überflüssige Leerflächen.

Keine neue Palette, kein Redesign, keine neuen Ansichten/Finanzfunktionen.
Formatierung darf keine gespeicherten Dezimalwerte, Rundungs-/Berechnungslogik,
Zeitzonen-/Buchungsdatumssemantik oder vorhandene exakte Wertoffenlegung ändern.

### B – Dashboard und Verlauf

- Kompakte bestehende Datenbasissteuerung im Diagrammkopf samt Optionen/Zeiträumen
  bewahren; nur nachgewiesene verbleibende Darstellungsabweichungen korrigieren.
- Die drei bereits vorhandenen Lucide-kompatiblen Icons bewahren; nur tatsächlich
  fehlende Darstellung im aktuellen Zustand korrigieren.
- Visuelle Erreichbarkeit von Liquidität & Fälligkeiten in relevanten gefüllten,
  leeren und ausgeklappten Zuständen auf allen verlangten Breiten prüfen.
- Letzte Anbieterlinie entfernt lassen und Zwischentrennlinien bewahren.
- Nur konkrete verbleibende Chart-Leerzustands-, Hinweis- und Responsive-Befunde.

Kein Wechsel der Datenbasislogik, keine anderen Zeiträume/Filtergrenzen,
keine neue Bewertung, Rendite, Interpolation, Prognose oder Datenmutation.

### C – Mobile und visuelle Accessibility

- Rein visuelle Overflow-/Clippingkorrekturen, Tabellen- und Kartenlayout.
- Touchziele mindestens44x44 CSSpx und sichtbare Fokusindikatoren erhalten.
- Darstellung ausgeklappter Akkordeons und nicht sicherheitskritischer Dialoge.
- Nachweise bei320/390/430/768/1440px in Chromium/Firefox/WebKit,
  Tastatur, sichtbarer Fokus, Axe, geöffnete Zustände und tatsächliche Bilder.

Kein Austausch fachlicher Auswahl-/Validierungs-/Fokus-/Schließ-/Speicherprotokolle.
Echte Hardware/AT/Notch/OS-Zoom bleibt getrennt; Emulation nicht als Geräteabnahme
ausgeben. Bekannte vollständige Gates nicht durch einfache Screenshots ersetzen.

## Work behält Fach- und Sicherheitsverantwortung

ChatGPT Work führt weiterhin FLH03 native Importe/Reconciliation, sichere
Buchungs-/Positions-/Referenzverwaltung, DELETE-MASTER28-Fachlogik/CAS/atomare
Rücknahme, IndexedDB/Datenintegrität, Backup/Restore/Recovery, FLH04 nach Freigaben,
essentielleP1-FLH-PERF01 und alle übrigen freigegebenen Sicherheitsarbeiten aus.

Zwingend zugehörige sicherheitskritische UI und Tests bleiben bei Work:
Transaktionsbestätigung, fachliche Auswahl/Zulässigkeit, CAS-geschützter
Löschdialog, Backup-/Wiederherstellungsdialog, Herkunft/Abhängigkeiten, Stale-
/Mehrtab-/Undo-/Offlinezustände. PR196 und dessen Sicherheits-/Layoutkorrekturen
werden unverändert regulär abgeschlossen; keine kosmetische Zweitimplementierung.
Work darf Claude-Arbeit lesen/prüfen/koordinieren und Masterdokumentation pflegen,
aber dessen Branch nicht ungefragt verändern. Umgekehrt keine Änderungen an
aktiven Work-Branches durch Claude.

FLH05 und FLH-PROJ01 bleiben OPEN/PARKED. Zukunftskompatibilität nur notwendige
gemeinsame Verträge; keine zusätzliche Phase, Parser-/Modell-/Importduplikate
oder umfangreiche Refactorings. Tatsächliche Startperformance großer IndexedDB-
Portfolios bleibt Work/P1 mit reproduzierbarem30%-Medianziel; CI-Geschwindigkeit
ist dafür kein Ersatz.

## Konkrete Schnittstellen und Schreibbereiche

| Bereich | Grenze |
| --- | --- |
| styles.css | Globalregeln/.btn/Fokus/Details können kritische Dialoge beeinflussen. Vor Schreibbeginn konkrete Selektoren/Hunks vereinbaren, keine globale Überarbeitung ohne Abgleich |
| src/app.js | Nur ausdrücklich abgegrenzte reine Renderstellen; keine Finance-/Import-/Save-/Recovery-/Bestätigungs-/Auswahlhandler oder Referenzlösch-/Undo-Handler ändern |
| index.html / src/format.js | Bestehende IDs/ARIA/Events/Optionswerte/Präzisionsoffenlegung erhalten; nur belegte Darstellung. Shared Formatter vor Änderung mit Work abgrenzen |
| Sicherheitsbereiche PR196 | `#referenceRemovalPreview/#referenceRemovalBackup`, openReferenceRemoval/Undo und src/reference-management.js bleiben Work; keine parallele Umgestaltung |
| Browser-Tests | browser-history-followup/browser-ui-quality/browser-ui-small-rests sind gemeinsam genutzt: konkrete Testblöcke abstimmen. Kritische reference-/booking-/position-removal/native-import/CAS/Restore-Assertions nicht lockern/umgehen |
| Modelle/Speicher/Backup/Drive | Keine Änderungen durch dieses rein visuelle Paket |

Unterschiedliche Branches reichen nicht als Kollisionsschutz. Eine andere
Datei kann durch gemeinsame Selektoren/Komponenten ebenfalls kollidieren.

## Aktivierung und kontrollierter Abschluss

1. PR196-CI/Abnahme/Sicherung ist abgeschlossen; Release bleibt bis eigener
   ausdrücklicher Nutzerfreigabe gesperrt. Vor Abschluss des aktiven Work-Schritts
   keinen kollidierenden Claude-Codinglauf starten.
2. Regulär zuerst PR196 nach Freigabe einschließlich Main/Deployment/tatsächlicher
   Livegates abschließen. Danach frischen main/Branches/PRs/Actions/Deployments,
   vorhandene Work-Läufe und ungesicherte Änderungen prüfen.
3. Claude Sonnet5.5 in GitHub Copilot tatsächlich auswählen/verifizieren.
   Bei fehlender Auswahlmöglichkeit genau diesen externen Blocker dokumentieren,
   keine stillschweigende Ersatzmodellwahl.
4. Eigener Copilot-Branch/PR ab diesem frischen main; vorgeschlagener Name
   `copilot/ui-visual-claude`, nicht durch Work vorab als parallelen Codingstrang
   eröffnen. Tatsächlichen Namen/SHA/Owner/Dateien/Selektoren im Master festhalten.
5. Vor jeder parallelen Schreibarbeit Work-/Claude-Schreibbereiche konkret
   vereinbaren. Bei Überschneidung sequenziell arbeiten oder explizit abstimmen;
   keinen fremden Writer unterbrechen/überschreiben.
6. Nur belegte Restbefunde mit vorhandenen Komponenten klein umsetzen; erledigte
   Punkte überspringen, bestehende Anforderungen und kritische Gates erhalten.
7. Vor Merge frisch gegen dann aktuellen main integrieren, vollständige relevante
   Unit/Syntax/3Engine/Finance/CAS/Backup/Restore/Offline/A11y-Gates und echte
   Bilder auf genau geprüftem SHA/Baum. Keine veralteten Branches ungeprüft mergen.
8. Delegation ist keine Merge-/Deploymentfreigabe. Erforderliche konkrete
   Nutzerentscheidung und Releasegates bleiben bestehen; kein automatisches
   Deployment/Automerge durch die Delegation.
9. Nach jeder Etappe Code/Docs auf richtigen Branches committen/pushen,
   Checkpoint separat sichern, Remote-SHAs prüfen und exakte Fortsetzung angeben.
   Historischen Dokumentationsbranch niemals als Appcode nach main mergen.
