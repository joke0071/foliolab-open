# v192 LIVE_ACCEPTED · schlanke Mehrfachauswahl abgeschlossen · 28.10.2026

**DONE:** [PR181](https://github.com/joke0071/foliolab-open/pull/181) veröffentlicht und tatsächlich produktiv abgenommen. Release/main `6dab772e9ed15878779a5f345b132091917b7167`, Tree `bc25754038bfd0c2cee2707daf1121764511ca96` identisch mit finalem PR-/lokalem/getestetem Mergebaum. PR40644389670+Wallet40644389516 und Main/Pages/Live40645289206 vollständig SUCCESS;766/766Units,0Fail/0Skip, Syntax, Chromium/beideFirefox-WebKit-Shards. Lokal zusätzlich volle Positions-/Buchungssuites PASS.

Zusätzliche tatsächliche Produktionsprüfung beider Listen40647218802/QA-only4072ff85f02cd9b14f2060dee7611bc861145ce5 SUCCESS: drei Engines, fünf Normalbreiten320/390/430/768/1440,401synthetische Positionen/249Buchungen, Axe/44px, Headernormalzustand/direkteZeilenicons, Tastatur/Abbrechen/Fokus, bestehender Auswahlzyklus/Filter/Pagination, Nullmutation, Archiv ohne Finanzänderung, geschützte Löschung, Quota/post-put-Abbruch/CAS/Undo/Reimport/plain+frischerEncryptedRestore/echterOfflinecommitundReload. Main109Dateivergleiche, gezielt108eindeutigeAppdateien/SW192. Zwölf ausgewählte tatsächliche Produktionsbilder beider Listen/allerEngines angesehen,PASS; beide ZIPs vorExtraktionSHA256-verifiziert. [Maschinenbeleg](release-evidence/ui-selection-v192-release.json).

Erhaltener Fehllauf40646597977: nach erfolgreicher Chromium-Buchungsprüfung scheiterte Positions-Test am Controller-Voraussetzungsgate. Kontrollierter identischer Chromium-A/B-Probe belegt: pauschales ignoreHTTPSErrors=true ergibt aktiven Worker/Cache, aber keinen Controller/Timeout; normale Zertifikatsprüfung liefert Controller sofort. Temporäre Produktionskopie begrenzt diese Transportausnahme nun wie bestehende Coregates auf tatsächlichen Proxy. Sämtliche ursprünglichen Assertions und ausgelieferte App-/Testbytes unverändert; keine Interception, kein Produktfix oder Gateverzicht. [Dauerhafter Diagnosenachweis](release-evidence/ui-selection-v192-controller-probe.json). Keine allgemeine Browserfehlergarantie daraus ableiten.

Vorgemerkter schlanker Auswahl-Nachtrag ist damit erledigt, nicht erneut implementieren. **Nächster einziger funktionaler Schnitt:** verbleibende belegte UI17-09/10 (Markenschreibweise/Kontoanlage nach Anbieteranlage) und gemeinsamer1W-Vermögenszeitraum. Danach unveränderte konsolidierte Vorgängersequenz; FLH05-A/PERF01 nicht vorziehen. Gesamtauftrag/#149/#165 bleiben PARTIAL; breitere Finanzmutationen/Ignore und reale Hardware/OAuth-/Original-/AT-Fachnachweise bleiben offen.

---

# Schlanke Mehrfachauswahl – begrenzter UI-Nachtrag

Basis: vollständig produktiv abgenommenes v191/main `5b9bb792125343b602157bb949ec8b0efcb28fd0`. Einziger funktionaler Strang: `feature/ui-selection-header`. Neuer SW192 ist Kandidat, nicht veröffentlicht.

Positionen und Buchungen zeigen im Normalzustand nur die dezente Aktion „Mehrfachauswahl“ im jeweiligen Listenkopf. Keine zusätzlichen Auswahl-Disclosures, Checkboxen oder Sammelaktionen. Im aktiven Modus bleiben die bestehenden Checkboxen und Sammelaktionen unmittelbar sichtbar, mobil in zwei Spalten. Abbrechen stellt den normalen Zustand und Tastaturfokus am Listenkopf wieder her. Direkte Bearbeiten-/Löschen-/Archivieren-Icons bleiben erhalten.

Keine Änderung an Finanz-, Import-, Archiv-, Auswahl-, Journal-, Backup- oder Speicherengine und kein neues Modellformat. Bestehende Auswahlreichweite, Filter/Pagination, Vorschau/Bestätigung, CAS/Undo/Restore und fachliche Sperren gelten unverändert. Normale Undo-/Änderungsnachweise bleiben verfügbar.

Lokal: 766/766 Unit-Tests,0Fail/0Skip und Syntax PASS. Bestehende Chromium-Positionsauswahl/-löschung und Buchungsmanagement-Suites vollständig PASS, inklusive Quota/post-put-Abbruch/CAS/Offline/plain+encryptedRestore; zusätzlich beide Normalzustände in320/390/430/768/1440 mit Axe/44px/direkten Aktionen, Tastatur-Aktivierung/Abbrechen/Fokusrückgabe und exakt unverändertem kanonischem Record. Fünf ausgewählte lokale Normalzustandsbilder (Positionen320/1440; Buchungen320/390/1440) tatsächlich angesehen, PASS.

Die lokale Umgebung war kurz getrennt; nach Wiederverbindung belegten die bestehenden Logs den regulären erfolgreichen Abschluss beider Browser-Suites. Kein Testneustart und kein abgebrochener Test als Erfolg ausgegeben. Vollständige neue GitHub-CI mit Chromium/beiden Firefox-WebKit-Shards, finale Bildprüfung, Merge/Main/Deployment/tatsächliche Live-Abnahme noch PENDING.

Danach UI17-09/10 und1W gemäß bestehender Gesamtsequenz. Keine vorgezogene FLH05-A-/PERF01-Implementierung. Gesamtauftrag und #149/#165 bleiben PARTIAL.
