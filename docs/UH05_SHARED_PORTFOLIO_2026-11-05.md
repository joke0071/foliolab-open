# UH05 – gemeinsames Portfolio und nächste UI-/CAS-Etappe

Basis: v286 LIVE_ACCEPTED, Main `588d3d3900477e4b3591917634b4f718d3465b0d`, Tree `ab8ccb62fb991858b7d508ba486922c93c341cf7`. [Produktionsabschluss](release-evidence/v286-pr303-live-acceptance.json), [neuer Kernbeleg](release-evidence/uh05-shared-kernel-qualification-2026-11-05.json). Kein neuer Produktkandidat oder zusätzlicher CI-Lauf.

## Tatsächlich neu geprüft

Ein synthetisches Portfolio mit acht getrennten Positionen und fünf Anbieterquellen: native Bittr-/Ledger-Live-/Kraken-/Bitpanda-/Flatex-Testformate sowie bereits akzeptierte synthetische BTC-History. Alle 120 Quellreihenfolgen durchlaufen die vorhandenen Parser, Vorschau- und Bestätigungskerne. Jede Vorschau bleibt unverändernd; nach jedem Quellschritt Snapshot und vollständiger Plain-Backup/Restore. Überlappende Bittr-Teilquelle, doppelter Ledger-Export, doppelte Kraken-/Bitpanda-Dateien, 600 umgekehrte Wiederimporte sowie verschlüsselter vollständiger v5-Restore bestanden. Feste unabhängig deklarierte Mengen/Cash-/Gebührenwerte und wirtschaftliche Projektion in jeder Reihenfolge identisch; sechs Buchungen, eine belegte externe Finanzierung, unbekannte Flatex-Kosten bleiben unbekannt. Appmodule vor/nach exakt Main-Gitblobs. Repro `tests/uh05-shared-diagnostic.mjs` und vollständige Bindung privat im neuen Ownerdelta gesichert; bei Wiedereinstieg auf genau dieser Mainbasis ausführen, nicht den historischen Checkpointbranch als Produktbasis verwenden.

**Grenze:** reine lokale Kernprüfung. Keine neue gemeinsame UI-, IDB-/CAS-, Produktions-, Originalgesamt- oder historische Eigentumsabnahme. Keine neue Chainabfrage. Die fünf Schritte sind weiterhin einzelne vorhandene Bestätigungen; kein gemeinsamer Einmalcommit. Bereits journalisierte Flatex-Endbestandsbereiche bleiben gesondert geschützt. Ledger-/Stakinglücken bleiben PARTIAL/UNKNOWN. UH04/UH05 insgesamt PARTIAL.

## Nächster einzelner Nutzerschnitt

Ziel: Eine gemeinsame Prüfung unterstützter Quellen desselben Portfolios über die vorhandenen Kerne, kompakte Übersicht und eine ausdrückliche Übernahme. Keine zweite Finanz-/Journal-/Matchingengine und kein dauerhaftes neues Preview-only-Ende. Bestehende HND01-/EFF01-/Importpläne bleiben verbindlich.

Betroffene Bereiche: vorhandener CSV-Einstieg/Quellzuordnung, bestehende Anbieterplaner und einmaliger PortfolioStorage/CAS-Übergang; neue gemeinsame Tests am bestehenden Browserentry. Risikostufe hoch (Import/Storage); reguläre unveränderte Gates, unabhängige Originaloracles und kontrollierter Main-/Deployment-/Liveabschluss.

Abnahmekriterien:

1. Unterstützte fünf Quellen gemeinsam auswählen, Konten/Wallets eindeutig bestätigen; ungeklärte Bereiche sichtbar erhalten und ohne stillen Teilcommit blockieren beziehungsweise nur explizit unabhängig ausgewählte Teilmenge zulassen. Beobachtung, Kauf, Transfer und Gebühr getrennt lassen.
2. Vorhandene Planer auf einem getrennten Entwurf komponieren; genau eine aktuelle Ausgangsrevision und ein bestehender atomarer CAS-Commit erst nach Gesamtsimulation/Backup/Zustimmung. Neue Auswahl widerruft sämtliche Freigaben. Stale, echter Zweittab, Quota und post-put-Abbruch haben Nullteilwirkung.
3. Gemeinsame tatsächliche UI-Reihenfolgen, überlappende Dateien/History und Wiederimport gegen unabhängige Mengen-/Cash-/Gebühren-/Quellen-Sollwerte prüfen; manuelle Buchungen, Stichtage, Rücknahmen und unbekannte Kosten schützen. Keine neuen LINK-RPCs und keine fehlende Ledger-Anzeige als Null verwenden.
4. Reload/Offline, verschlüsseltes v5-Restore im frischen Profil, quellenübergreifender Wiederimport und geprüfte wirtschaftliche Rücknahme erhalten dieselben Wirkungen und Quellenbelege.
5. Chromium/Firefox/WebKit, 320–430px/Fokus/Axe und große Stapel im gemeinsamen Alltagspfad; vorhandene Originale privat prüfen. Kein Android-Hardware-PASS ohne Gerät. Erst regulär qualifizierten Kandidaten veröffentlichen.

Vor Implementierung aktuellen Main/Tree/Owner/PRs/Actions frisch abgleichen. Repro ist eine neue gemeinsame Vorprüfung, kein Anlass, identische v286-Abnahmen erneut auszuführen. Die neue gemeinsame UI muss ihre eigene vollständige Integration erhalten.
