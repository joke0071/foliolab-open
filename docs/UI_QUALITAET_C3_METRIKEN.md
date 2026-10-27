# C3: Metrikspezifische Historiensegmente

Status: zunächst Diagnose, keine Produktänderung. Auf v183 bleibt die bestehende Darstellung unverändert, bis tatsächliche Reproduktion vorliegt.

Hypothese: Bestandschart übernimmt EUR-Segmentgrenzen. Eine fehlende Preis-/FX-Bewertung darf den unbekannten EUR-Wert unterbrechen; eine belegte Menge ist dadurch nicht unbekannt. Drei konkrete tägliche Mengen, zwei Kurstage, ein dazwischen liegender Kauf bilden eine unabhängige Browser-Sollfixture. Bestandslinie1M/2L, EUR2M/0L, Kurs genau2 belegte Beobachtungen, fehlender Kurseintrag weiter sichtbar, exakte Nullmutationen. Keine künstlichen Mengen oder Kurse.

Nur nach tatsächlichem Fehlerbeleg kleinste Änderung am bestehenden UI-Renderer, Projektion unverändert. Strenge Tests/Fokus/Axe/3Engines und vollständige relevante Regressionen, danach nur unter bestehender UI-Freigabe integrieren/deployen/live prüfen. Keine Universalbehauptung über den nicht zugänglichen ursprünglichen Android-Datensatz. Buchungsfinanzmutationen und FLH04 ausgeschlossen.
