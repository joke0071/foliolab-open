# PR #342 · qualifizierte Requestgrenze · 15.11.2026

**Merge empfohlen ausschließlich für Head `a9ac99f710571df04884f571cb557a8b52d0828c`.** Tree `1d5a1f2db0d6e7d7fa39590deea44954868611b9`, Basis v317/Main `0d1638cb2034805dace789e3072fbb7bcda8d52c`. GitHubs Ausführungsmerge `3e8ba55eb315b0f53e4f7681238c4bba6c49ee0d` hat exakt denselben Tree. PR offen, mergeable clean; keine Reviews, Kommentare oder Review-Threads. [Maschinenentscheidung](release-evidence/pr342-qualified-2026-11-15.json).

## Problem und begrenzte Korrektur

Roadmap K2-KURSE / #266 und bestehender SEC-03-Vertrag. Ein langer Netzwerkfehler konnte einen API-Schlüssel nach der vorzeitigen Kürzung teilweise anzeigen. Eine Fehlermeldung mit nur dem Bearer-Token wurde nicht erkannt. Native Headers führten unterschiedliche Zugangsdaten im Request-Cache zusammen; mutable Header konnten die Identität einer wartenden Anfrage verändern.

Der gemeinsame Request-Cache prüft vor der Kürzung, erkennt sensible Headerwerte und Tokenanteile, kanonisiert die drei unterstützten Headerformen und verwendet denselben Snapshot für gesendete Header, Cache und Diagnose. Ungültige Header werden ohne ihren Inhalt abgewiesen. Genau vier Dateien: Request-Cache, neun konkrete Regressionen, Taskkarte und notwendige Cacheversion v318. Keine Workflow-, Finanz-, Datenformat-, Migrations- oder neue Providerintegration; Retries, Fristen, TLS und bestehende lokale Datenverträge bleiben erhalten. Kein tatsächlicher Abfluss von Nutzerzugängen behauptet; Gegenproben ausschließlich synthetisch.

## Qualifikation

- Alle neun neuen Regressionen scheiterten am unveränderten Main. Danach 38 gerichtete Tests bestanden, 0 Fehler/Skips; Syntax und Diffprüfung bestanden. Die Header-Negativfixture wurde vor Freeze korrigiert: abschließende Zeilenumbrüche werden nativ getrimmt, eingebettete sind ungültig. Keine Assertion-/Fristlockerung.
- Tatsächlicher Chromium 141 mit vorhandenem Playwright 1.62.1: sechs sichere Fehlermeldungen, zwei getrennte Zugangsdatenantworten und vollständiger nativer IndexedDB-Portfoliorecord exakt unverändert. Kein Realprovider-, Windows-/Android- oder Produktionsnachweis dieses Kandidaten.
- [Reguläre PR-CI 43740825503/1](https://github.com/joke0071/foliolab-open/actions/runs/43740825503) SUCCESS: volle Integration, Chromium und alle drei Firefox-/WebKit-Shards. **1.492 Tests, 0 Fehler/Skips.**
- [Wallet 43740825516/1](https://github.com/joke0071/foliolab-open/actions/runs/43740825516) SUCCESS: ebenfalls 1.492 Tests, 0 Fehler/Skips.
- Erwartete Berichtspfade aus unveränderten Testverträgen gegen die Originale abgeglichen; zeitgebundene Fixturedateien enginegebunden zugeordnet. Alle 15 Zielhöhen exakt 44 px; Anforderung/Diagnostik aktiv. Bestehender PWA-Updatevertrag mit Cache v318 erfolgreich.
- Zwei aktuelle Positions-/Buchungsbilder sind bytegleich mit den in dieser Fortsetzung tatsächlich angesehenen v317-Live-Originalen. Begrenzte Sichtprüfung identitätsgebunden wiederverwendet; kein behaupteter Gesamtaudit sämtlicher Bilder.
- FAST-Canary ist wegen unverändertem Workflow-/CI-Vertrag nicht erforderlich; Deployment und Live-Abnahme im PR erwartungsgemäß übersprungen. Daraus folgt keine Produktionsfreigabe.

## Originale, Pin und Restore

`FolioLab_PR342_Requestgrenze_Originalbelege_2026-11-15.tar`, **214.415.360 Bytes**, SHA256 `6999f36bb3475fbff735e73e390062362ced9d8c7be185eaaec5916b8740810b`. Exakter Version-0-Pin `file_00000000151081f58a49601480e077bb`, dauerhafte Identität `libfile_fde3_f-bbf2da5a0c8481919f62e424fd59d740_54e45e8130348191808d9aaa710cf372`.

Unabhängiger bytegleicher Readback mit anderer Dateiidentität; **35 Manifestdateien, sechs Original-ZIPs und 2.362 Originaldateien tatsächlich restauriert**, vollständig gegen Pfade/Größen/SHA256 geprüft. Ein anfänglich falsch behandelter Transferweg wurde am unveränderten Pin korrigiert; kein zweites Speichern und keine neue Version. Die erwarteten neun Baseline-Fehler bleiben als Regressionserklärung erhalten; keine aktuellen CI-Fehler daraus konstruiert. Alle älteren v317-/PR341-Originalketten bleiben bestehen.

## Offene Entscheidung und unveränderte Produktion

Main bleibt v317 `0d1638cb2034805dace789e3072fbb7bcda8d52c`, vollständig LIVE_ACCEPTED. K3-Archivhinweis DONE; Gesamt-K3 wegen geparktem A09 separat PARTIAL. Grafikherkunft bleibt geparkt. Historische 503-/SW-Ursachen UNKNOWN; zwei dokumentierte CDP-Abschlussflags im v317-Lauf bleiben unverändert erhalten.

**Für PR342 fehlt Jochens separate ausdrückliche Freigabe:** Merge dieses exakten Heads einschließlich des entstehenden Main-Heads, regulären Deployments und vollständiger Live-Abnahme. Vor Merge Head/Basis/qualifizierten Merge-Tree/Pflichtchecks/Reviews frisch prüfen und Merge an erwarteten Head binden. Eine geänderte Basis auf Auswirkung zum geprüften Tree untersuchen; ein anderer Head benötigt eine neue Entscheidung. Keine spätere Freigabe aus PR341 übernehmen.
