# FLH-PERF01 – begrenzter Datumsvalidierungs-Schnitt

Stand 29.10.2026. Bestehender Master, keine neue Roadmap. Vorbereitung während der regulären Release212-Abnahme; Produktimplementierung erst nach LIVE_ACCEPTED.

## Belegter Ausgangspunkt

- Appbytes mainfee4fc5d entsprechen freigegebenem UI-Release0db6863a; letzter Unterschied nur Testvorbereitung.
- CPU-Profil auf Vorgänger c08bc1d3: validDate in historical-position-value.js größter gemessener Self-Anteil (ca1,4–1,6s im synthetischen Stressfall).
- Unprofilierte, identische portable Vorhermessung auf0db6863a:19/1000Positionen, je1825Referenzen, echteIndexedDB/installierte kontrolliertePWA/identischesDashboard1440×900, fünf frischeBrowserprozesse plus warme/offlineReloads.
- Primärer Vergleich ist portableRepeat in release-evidence/perf01-unprofiled-startup-before-v212.json, ScriptSHA256a486bc44f69ab6081fea132049f4697b686a3bf7705b31572ea36cb6942e42a0. Exakter Code in release-evidence/perf01-startup-benchmark.mjs.
- Stressmediane1000Positionen: kalt3113,9ms, warm2882,0ms, offline3086,8ms.19Positionen:542,2/375,1/361,4ms. Alle exakten Records/Settings/Revisionen unverändert.
- Kein tatsächlicher privater Nutzerdatensatz, keine große Walletjournal-/Hardware-Vollabnahme. Messung ist ein expliziter synthetischer App-/IDB-Stressfall.

## Zulässiger erster Produktdelta

Nur die deterministische Gültigkeitsprüfung identischer kanonischer Datumstexte wiederverwenden. Bisherige Kriterien vollständig erhalten: primitiver String, exaktes YYYY-MM-DD-Muster, endliches Date.parse und unveränderter ISO-Roundtrip mit T12:00:00Z. UTC-/Kalender-/Leapday-Semantik nicht ändern.

Begrenzt seitenlokale boolesche Resultate nach Datumstext zwischenspeichern; klare Obergrenze16384Einträge (über bisheriger15000Tage-Grenze einer direkten Portfolioübersicht), bei Grenze leeren. Höchstens10Zeichen je Schlüssel; auch negative Resultate bleiben strikt negativ. Kein Modell, Positions-/Kurs-/FX-/Journal-/Portfolioergebnis oder sensibler Kontext im Cache. Kein IndexedDB-/LocalStorage-/Worker-/Servercache, keine neue Dependency oder API. Reload baut alles frisch auf.

Preis-/FX-/Quell-/Mengen-/Entitlement-/Journalprüfungen weiterhin bei jedem Aufruf ausführen. Korrekturen und neue Buchungen müssen sofort frisch berücksichtigt werden; fehlend bleibt unbekannt. Keine geänderten Grenzen, Finanzwerte, Rechen-/Rundungsregeln, Zeiträume, Parser oder Speicherschreibpfade.

Kein weiteres Rendering-/Index-/CAS-/Storage-Refactoring erfinden. Neues Asset erfordert bestehende SW-Cache-Revision; keine Workflowänderung für diesen Schnitt.

## Prüfgates vor reviewbarem Kandidaten

- Bestehende Unit-/Syntax- und Chromium/Firefox/WebKit-Finanz-/History-/Import-/CAS-/Mehrtab-/Backup-/Restore-/Referenz-/Offlinegates vollständig.
- Relevante Datumsgrenzen: echte/unechte Schalttage, ungültige Kalendertage, nicht kanonische oder nichttextliche Eingaben.
- Nach gültigem Datumscachehit weiterhin ungültigen Preis/FX/Quelle ablehnen; neue Buchungen/Korrekturen frisch bewerten.
- Unter Cache-Druck oberhalb16384verschiedener Tage weiterhin identische wirtschaftliche Ergebnisse, Ablehnungen und exakte Nichtmutation.
- Exakt quellhashgleiche portable Nachhermessung, gleicher Browser/Viewport/Fixture/5Läufe, echteIDB und installiertePWA, Kalt-/Warm-/Offline getrennt. Beide vollständigen Rohserien speichern; keine Profilerzeiten als Vergleich verwenden.
- Ziel: mindestens30% geringerer medianer Kaltstart im expliziten großen Stressfall, soweit ohne Qualitätsverlust erreicht. Kleinere/warm/offline Fälle transparent berichten; keine pauschale persönliche Hardware-/Walletgarantie.
- Bei Nichterreichen oder Regression Ursache prüfen, keinen Erfolg behaupten und keine Gates lockern.

Danach kleiner PR mit exakt abgenommenem Umfang und bestehender eigener Releasefreigabegrenze. Vollständiger Main-/Pages-/Liveabschluss erst nach Freigabe. Gesamtmaster und weitergehende PERF-/UI-/Fachaufgaben bleiben entsprechend ihrer tatsächlich belegten Abdeckung PARTIAL. FLH05/PROJ01 OPEN/PARKED.
