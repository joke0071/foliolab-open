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
