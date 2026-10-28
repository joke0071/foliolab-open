# Schlanke Mehrfachauswahl – begrenzter UI-Nachtrag

Basis: vollständig produktiv abgenommenes v191/main `5b9bb792125343b602157bb949ec8b0efcb28fd0`. Einziger funktionaler Strang: `feature/ui-selection-header`. Neuer SW192 ist Kandidat, nicht veröffentlicht.

Positionen und Buchungen zeigen im Normalzustand nur die dezente Aktion „Mehrfachauswahl“ im jeweiligen Listenkopf. Keine zusätzlichen Auswahl-Disclosures, Checkboxen oder Sammelaktionen. Im aktiven Modus bleiben die bestehenden Checkboxen und Sammelaktionen unmittelbar sichtbar, mobil in zwei Spalten. Abbrechen stellt den normalen Zustand und Tastaturfokus am Listenkopf wieder her. Direkte Bearbeiten-/Löschen-/Archivieren-Icons bleiben erhalten.

Keine Änderung an Finanz-, Import-, Archiv-, Auswahl-, Journal-, Backup- oder Speicherengine und kein neues Modellformat. Bestehende Auswahlreichweite, Filter/Pagination, Vorschau/Bestätigung, CAS/Undo/Restore und fachliche Sperren gelten unverändert. Normale Undo-/Änderungsnachweise bleiben verfügbar.

Lokal: 766/766 Unit-Tests,0Fail/0Skip und Syntax PASS. Bestehende Chromium-Positionsauswahl/-löschung und Buchungsmanagement-Suites vollständig PASS, inklusive Quota/post-put-Abbruch/CAS/Offline/plain+encryptedRestore; zusätzlich beide Normalzustände in320/390/430/768/1440 mit Axe/44px/direkten Aktionen, Tastatur-Aktivierung/Abbrechen/Fokusrückgabe und exakt unverändertem kanonischem Record. Fünf ausgewählte lokale Normalzustandsbilder (Positionen320/1440; Buchungen320/390/1440) tatsächlich angesehen, PASS.

Die lokale Umgebung war kurz getrennt; nach Wiederverbindung belegten die bestehenden Logs den regulären erfolgreichen Abschluss beider Browser-Suites. Kein Testneustart und kein abgebrochener Test als Erfolg ausgegeben. Vollständige neue GitHub-CI mit Chromium/beiden Firefox-WebKit-Shards, finale Bildprüfung, Merge/Main/Deployment/tatsächliche Live-Abnahme noch PENDING.

Danach UI17-09/10 und1W gemäß bestehender Gesamtsequenz. Keine vorgezogene FLH05-A-/PERF01-Implementierung. Gesamtauftrag und #149/#165 bleiben PARTIAL.
