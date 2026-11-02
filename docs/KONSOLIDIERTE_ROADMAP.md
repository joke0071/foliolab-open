## v269 LIVE_ACCEPTED / nächster Fachschnitt UH03 – 02.11.2026

Main `f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb`, SW v269/v5/Installationsidentität erhalten. #283 geschützt gemergt; Main-/Produktionslauf **41521172914 Versuch2 SUCCESS**, Livejob **125556061110 SUCCESS**. 1118 Units, volle Chromium-/Firefox-/WebKit-Pflichtgates, 138/138 normale HTTPS-Assets, verifiziertes Liveartefakt und mobile Sichtprüfung PASS. [Verbindliche Abnahme einschließlich Fehler-/Retryhistorie](release-evidence/v269-pr283-live-acceptance.json). Diese Abnahme nicht wiederholen.

**UH03 insgesamt offen, danach UH04 → UH05.** Nächster begrenzter Schritt: [gesicherte exakte Kraken-Saldopfadanalyse](release-evidence/uh03-kraken-exact-trail-analysis.json) umsetzen, keine CSV-Reihenfolge oder lokal-gierige Wahl; eindeutigen vollständigen Pfad am bestätigten Bestand verankern, echte Mehrdeutigkeiten/Lücken weiter sperren. Voranalyse ist noch keine Produktkorrektur. Originale/Oracles wiederverwenden; unabhängige historische Endbelege, referenzübergreifende Chronologie, kombinierte BTC/ETH/ERC20/SOL/SPL-/Transfer-/Gas-/Gebührenfälle und persistente selektive Quellenrücknahme bleiben offen. Übrige UI-/Drive-/Kurs-/Analysepakete unverändert erhalten. EFF01/HND01; Übergabe/Owner ausschließlich im aktuellen zentralen Checkpoint. Checkpointbranch niemals vollständig nach Main mergen.

---

# FolioLab – konsolidierte aktuelle Roadmap

Vollständigkeitsabgleich vom **02.11.2026** auf ausdrücklichen Nutzerauftrag. Dies ist eine Dokumentationskorrektur, **keine Entwicklungsübernahme, keine Implementierung und keine neue Releaseabnahme**.

## Verbindliche Quellen und Statusregeln

- **Aktueller Owner, Main, Kandidat und CI:** immer zuerst den neuesten Kopf in [WORK_RESTPAKETE_CHECKPOINT.md](WORK_RESTPAKETE_CHECKPOINT.md) lesen. Neuere Zustände gehen diesem datierten Überblick vor. Der dort aktive Owner bleibt alleiniger Entwicklungs-/Integrations-/Releaseowner.
- **Prüfumfang und konkrete neue Befunde:** [ROADMAP_VOLLSTAENDIGKEIT_2026-11-02.md](ROADMAP_VOLLSTAENDIGKEIT_2026-11-02.md).
- **Arbeitsreihenfolge:** [MASTER_PRIORITAETEN_RESTAUDIT_2026-10-30.md](MASTER_PRIORITAETEN_RESTAUDIT_2026-10-30.md), [gemeinsamer Importplan](IMPORT_HISTORY_UNIFIED_PLAN_2026-11-01.md), [EFF01/HND01](WORK_EFFICIENCY_PLAN_2026-11-01.md).
- **Keine historischen Anforderungen gelöscht:** Die bisherige vollständige Roadmap ist bytegleich als [Roadmap-Historie](KONSOLIDIERTE_ROADMAP_HISTORIE_2026-11-02_6084e743.md) erhalten (Git-Blob `6084e743062744a6b9211bd07e7d56372d7424e3`). Alte Detailverträge, Belege und Restpakete bleiben verbindlich, soweit nicht ausdrücklich durch neuere Nutzerentscheidungen ersetzt. Historische Releaseüberschriften sind keine aktuellen Statusmeldungen.

**Statusdefinition:** ABGENOMMENER TEIL = nur der belegte veröffentlichte Umfang; IMPLEMENTIERT = im geprüften Quellstand vorhanden, nicht automatisch vollständig abgenommen; OFFEN = konkrete Restumsetzung; VERIFY = konkrete Prüfung oder Kontextklärung fehlt; EXTERNAL = tatsächlicher externer Nachweis fehlt; VORSCHLAG = kein freigegebener vollständiger Implementierungsvertrag. Kein Gesamtpaket wird wegen eines fertigen Teilstücks pauschal DONE.

## Releaseaufnahme beim Audit

Geprüfter Produktquellstand: Main `f02c4ef277ba727eeecfee07e7b4261ab3b7a4bb`, SW v269. PR #281, #282 und #283 sind integriert. **v269 ist deployed; der beim Audit gelesene Checkpoint führt es weiterhin NICHT LIVE_ACCEPTED. v268 bleibt dort die letzte vollständig akzeptierte Produktion.** Die gezielte unveränderte Firefox-Diagnose bestand; ein einzelner gezielter Live-Retry von Lauf `41521172914` ist im Checkpoint dokumentiert. Nicht den veralteten 25-Minuten-Blocker oder #283 als noch offenen Kandidaten weiterführen. Keine zusätzlichen Retries/Abbrüche durch diesen Audit. Terminalen Releaseabschluss ausschließlich durch den aktiven Owner und seine echten Nachweise übernehmen.

## 1. Gemeinsamer Import – aktueller fachlicher Hauptpfad

| Paket | Belastbarer Stand | Verbleibender Abschluss |
| --- | --- | --- |
| UH01 – Belege, Herkunft, Wirkung, Konflikte | Grundlagen in bestehendem Importkern und den UH02/03-Schnitten genutzt; keine Vollabnahme aller Anbieter daraus ableiten. | Bei jedem neuen Dialekt nur den konkreten Delta-/Originalabgleich nachziehen, keine neue Gesamtauditschleife. |
| UH02 – Bittr + Ledger Live + Bitcoin | **ABGENOMMENER TEIL**, einschließlich v5-/Offline-PWA-Schutz gemäß v266-Beleg. | Vorhandene Kette erhalten, nicht erneut implementieren. Weitere Netzwerke und alle Ledger-Ereignisklassen sind dadurch nicht fertig. |
| UH03 – Kraken und Bitpanda, ETH/ERC20, SOL/SPL | **TEILWEISE**: begrenzter Kraken-Schnitt in v268; weiterer Bitpanda-Wirtschaftsschnitt in v269, Releaseabschluss siehe Checkpoint. | Unabhängige historische Endstände, Gebühren-/Sonderfälle, Kraken-Saldopfad unabhängig von CSV-Zeilenreihenfolge, kombinierte Chain-/Börsen-/Ledgerbelege und persistente selektive Quellenrücknahme. |
| UH04 – Flatex AT Ende zu Ende | **OFFEN als Gesamtetappe**, native Leser/Simulation/Abgleiche bereits vorhanden. | Depot- und Kontoumsätze im gemeinsamen Assistenten bis bestätigter Übernahme, Bestand, Cash, Historie, Wiederimport, Undo und Restore; Original-/Beta-Dopplung beseitigen. |
| UH05 – gemeinsame Alltagsabnahme | **OFFEN**. | Alle fünf vereinbarten Anbieter zusammen mit unterstützten Blockchainpfaden, überlappenden Quellen, vertauschter Reihenfolge, großen Stapeln und Android prüfen. Einmalige bestätigte Übernahme, nicht bloß Vorschau. |
| FLH03 #148 / FLH05 #174 – übriger Umfang | **ACTIVE**, nicht PARKED. UH01–05 bündeln den priorisierten Fünf-Anbieter-Schnitt. | Trade Republic und weitere bereits beauftragte Anbieterprofile, Mapping/Formatkatalog und belegabhängige Ereignisklassen bleiben erhalten. Die Fünf-Anbieter-Priorität streicht sie nicht. |

Vorhandene private Originale/Oracles/Diagnosen wiederverwenden. Generierte Kontrollstände nicht als unabhängige historische Endbelege ausgeben. Kauf, interner Transfer, Gas/Börsengebühr und zusätzliche Quelle nicht mehrfach buchen. Kein zweiter Finanz-, Journal- oder Importkern.

## 2. Bedienung, Android und konkrete Nutzernachträge

| Paket | Belastbarer Stand | Verbleibender Abschluss |
| --- | --- | --- |
| UI-POS02 / UI-BOOK03 / #257 – Grundverwaltung | **ABGENOMMENE TEILE**: Verwalten/Fertig, Archivfilter und Bearbeiten-/Löschpfade; aktuelle Quellen enthalten diese Grundlagen. | Gezielte Restfälle statt Neubau: getrennte Klickflächen, sichere Dialoglöschung, konsistente Archivansicht, mobile Details und Fehlerrückmeldung. |
| #257 – Long-Press + Symbolauswahl | **OFFEN**, siehe Audit L01. | Neueste Entscheidung: langer Druck aktiviert Verwalten **und wählt genau den gedrückten Eintrag sofort aus**. Drei Listen; linkes Symbol als Auswahlfläche, Checkbox-Fallback, kein sichtbares zeilenweises „Auswählen“, Scroll-/Cancel-/Ghost-Click-Schutz. |
| DELETE-MASTER28 / #165 | **TEILWEISE**. Vorhandene sichere Rücknahmen und UI erhalten. | Importierte/verknüpfte Vorgänge nur mit geprüfter inverser Wirkung auf Journal, Bestand, Kostenbasis, Steuern/Transfers, Wiederimport, Undo und Restore erweitern; keine universelle Löschfreigabe aus einer UI-Änderung. |
| UI-TRANSFER04 | In Buchungsverwaltung integrierte Grundlage vorhanden; frühere Teilabnahmen gelten. | Gegenbuchungen, Zuordnen/Aufheben, Vorschau/Bestätigung und import-/quellenübergreifende Restfälle im Finanzvertrag weiterprüfen; altes separates Transferakkordeon nicht wieder einführen. |
| UI-HERO-QUALITY03 / Prüfbereich | **ABGENOMMENER TEIL**. | Hero-Kurzinfo/Chevron, bewusster Einstieg „Prüfbereich öffnen“, betroffene Positionen/Gründe/Aktionen/Fortschritt erhalten. Veraltete Kurse, fehlende Bewertung und historische Lücken getrennt; keine automatische Zwangsnavigation wieder einführen. |
| UI-ALLOC01 – Positionsgewichtung im Depot | **OFFEN**, Audit L02. | Kompakter Prozent-Ring/Text sofort in jeder Positionszeile. Bezug Depot/Konto klar, Anbieter optional getrennt; fehlende Werte/Null/negative Werte und Cash/Ausschluss korrekt behandeln. Vorhandener Anbieteranteil im aufgeklappten Detail ist nicht diese Funktion. |
| PWA-FULL01 – Name, Icons, Standalone | Frontend-Grundumfang **ABGENOMMENER TEIL v267**. | Tatsächliche Android-WebAPK-/Launcher-/Standalone- und Updateprüfung **VERIFY/EXTERNAL**. FolioLab als kurzer Name; Origin, Installationsidentität, start_url/scope und Daten unverändert. |
| PWA-INSTALL02 | **OFFEN**, Audit L03. | Große Karte „FolioLab als App verwenden“ entfernen. Kleines brauchbares Installationssymbol nur im passenden Browserkontext; nativer Prompt nur bei Verfügbarkeit und Nutzertap. In Standalone ausblenden; kein funktionsloser Button. |
| UI-LOAD01 – Grundfunktion | Originalkolben vor Modul-/DB-Bereitschaft, Inlineanzeigen und Fehler-/Reduced-Motion-Wege **ABGENOMMENER TEIL v267**. | Nicht erneut bauen. Ein voller Reload führt grundsätzlich erneut durch vorhandenes Boot-Markup. |
| UI-LOAD01 – Reload und Wahrnehmbarkeit | **OFFEN/VERIFY**, Audit L04. | Reales erneutes kritisches Laden, PWA-Neustart, verzögerte DB und Fehlerpfade prüfen. Blasen ruhig, aber sichtbar; keine künstliche Mindestladezeit. Normale Hintergrundupdates dürfen die App nicht blockieren. Echte Android-Bewegungsprüfung fehlt. |
| Historien-/Übersichts-Copy | **OFFENE DELTAS**, Audit L06. | Redundantes „Erfasste Stichtage“ aus der beanstandeten Zusammenfassung/Quelle entfernen; Ladehinweise kleiner und „Gebuchte Vorgänge“ typografisch angleichen. Nicht ungefragt gespeicherte Stichtage oder deren ganze Verwaltung löschen. |
| Diagramme / HIST-VIS01 | Belegte Rekonstruktion, vorhandene Perioden/Achsen und Quellenbasis bleiben erhalten; Gesamtumfang **TEILWEISE/OFFEN**. | Best-Guess nur klar gekennzeichnete Grafik, niemals Finanz-/Rendite-/Journalwert. Optionaler Modellverlauf mit heutigen konstanten Stückzahlen explizit von tatsächlicher Historie trennen. Diagrammmodi und Datenbasis nicht vermischen. |
| Kurs-CSV im Positionsdetail | **OFFEN**, Audit L07. | Bei nutzbarer alternativer Quelle den derzeit allgemeinen CSV-Einstieg kontextabhängig reduzieren bzw. unter „Mehr“ bündeln. Importierte Historien und ihren Entfernen-/Ersetzenpfad erhalten. |
| „Täglich“ als Standard | **VERIFY_CONTEXT**, Audit L08. | Nutzerentscheidung gehört zur betreffenden Automatik-/Aktualisierungsauswahl, nicht automatisch zur Diagramm-Abtastrate. Zielauswahl anhand ursprünglichen Kontexts absichern; bestehende Präferenz/Einwilligung nicht überschreiben. |
| Anbieteranordnung „6×1“ | **VERIFY_CONTEXT**, Audit L08. | Konkreten betroffenen Anbieterbereich/Breakpoint aus Originalnachtrag prüfen. Nicht pauschal sechs Spalten auf schmalem Android erzwingen und nicht als erledigt abhaken. |
| UI-TEXT03–10 / Mehr-Vertrag / Erststart | Vorhandene Onboarding-, Leerzustands-, Navigation-/Filter-/Dialogverbesserungen bleiben abgenommene Teilumfänge. | Verbleibende falsche Quellen-/Status-/Datums-/ARIA-/Pluraltexte, kompakte Leerzustände, Toolbar-/Dropdown-/Touch-/Fokus-/Kalenderbedingungen gezielt prüfen. Keine pauschale Gesamt-DONE-Angabe. |
| UX-MORE-ACCOUNT01 #264 / P1A-CASH-UX01 #267 | Konto-/Guthaben-Grundlagen im Quellstand vorhanden. | Keine doppelte Namenseingabe, keine doppelte Cash-Konto-/Positionsdarstellung; mehrere Festgeldverträge, Konditionen/Fälligkeiten, Fremdwährung und Buchungswirkung separat prüfen. Keine automatische reale Zinsbuchung aus Simulation. |

## 3. Kursdaten, Sicherung, Synchronisierung und Sicherheit

| Paket | Belastbarer Stand | Verbleibender Abschluss |
| --- | --- | --- |
| #266 – aktuelle Kursversorgung | Alpha-/Marketstack-/Worker-/Kryptobausteine vorhanden; dokumentierte reale ETF-Teilprüfungen nicht als allgemeine Abdeckung verkaufen. | Free-Tier-, EUR-/Listing-/Datum-/Budget-/CORS-Nachweise je tatsächlich verwendeter Quelle; historische Providerlücken bleiben sichtbar. Nicht allein durch vorhandenen Key „funktioniert“ behaupten. |
| #266 – Altanbieterbereinigung | **IMPLEMENTIERTER KERN**: `retired-providers.js`, Modell-/Storage-/Backup-/Restore-Anbindung vorhanden. Alte Aussage „noch gar nicht implementiert“ ist überholt. | **OFFENE COPY-LÜCKE L05:** drei Nutzerhilfen empfehlen weiterhin entfernte FMP/Twelve-/direkte EODHD-Zugänge. Keine historischen Kursbelege/Quellmetadaten pauschal löschen. |
| Geheimfelder / Auge | Vereinheitlichte Sichtbarkeitskomponente und maskierte aktuelle Inputs vorhanden; frühere Teilabnahme gilt. | Neue/verbliebene Felder konsistent halten; Wert/Formular-/Backup-/Autosave-/Tastaturwirkung und echte Hardware getrennt prüfen. Nicht entfernte Anbieter allein für ein Augen-Symbol wieder einführen. |
| Drive-Backup / Headerstatus | Lokaler/Drive-Status, Wiederverbinden und fällige Sicherung nach Autorisierung im Quellstand vorhanden. | Reale OAuth-Abläufe, Tokenablauf, Offline, Passwort-/Revisionskonflikte, Mehrtab und autorisierte automatische Sicherung **VERIFY/EXTERNAL**. Dauerhafte problemlose Anmeldung nicht garantieren. |
| FLH04 #160 – verschlüsselte Mehrgeräte-Synchronisierung | **OPEN/EXTERNAL**, eigenständiges Projekt. | Geräteidentität, Remote-Revisionsschutz, Parallelwriter-/Konfliktauflösung, Recovery und echte Neugeräte-/OAuth-Nachweise. Backup ist kein fertiges Synchronisierungsprotokoll; Draft #161 nicht unkontrolliert mergen. |
| REL-RECOVERY01 #254 / Speicher-/Updategates #44 | Versions-/Export-/Restore-Guards und Teilabnahmen vorhanden. | Reale OS-Unterbrechung, Quota/Eviction, alte Tabs, Wiederaufnahme, vollständige v5-Kompatibilität und Gerätefälle nachhalten. Keine pauschale neue Zertifizierung durch diesen Dokumentationsaudit. |
| FIN-E2E01 #255 | Mehrere geprüfte Finanzketten vorhanden. | Zusätzliche Anbieter/Teilfüllungen/FX/Fees/Transfers/Löschen/Undo/Reimport/Backup entlang UH03–05 unabhängig abgleichen; reale Originalbelege und synthetische Sollwerte unterscheiden. |
| AT-Fachlichkeit / Kapitalmaßnahmen / Settlement | Vorhandene sichere Teilfunktionen erhalten. | Belegabhängige Steuer-/Kostenbasis-/Settlement-/Kapitalmaßnahmenfälle separat offen halten; keine Steuerbescheinigung oder unbewiesene Tax-Lots behaupten. |
| Native Wallet-/Staking-Reste | Bestehende BTC/EVM/Solana-/Stakingbausteine erhalten. | P-Chain/Sonic/Withdrawal-/Unbonding-/claimable-Sonderfälle und Eigentums-/Gas-/Rewardwirkung nur nach konkreter Abnahme; kein doppeltes Vermögen. |

## 4. Performance, Analyse, Name und Infrastruktur

| Paket | Belastbarer Stand | Verbleibender Abschluss |
| --- | --- | --- |
| PERF01 #177 / PERF-ANDROID03 #256 | Mehrere gemessene synthetische Optimierungen veröffentlicht; **TEILWEISE**. | Echter Android-Kalt-/Warmstart, Zeit bis Interaktion, Tabs, große Listen/Historie, Speicher/Long Tasks, Offline/PWA/Wiederaufnahme. Emulation ist keine Hardwareabnahme. |
| A11y / Dirty-Dialog #157 / Geräte #44 | Automatisierte Browser-/Axe-/Fokusprüfungen und bestehende Guards nicht verwerfen. | TalkBack, echte Safari-/Tastatur-/Systemzoom-/Back-/beforeunload-Grenzen und Notch/Safe-Area separat **VERIFY/EXTERNAL**. Keine universelle Navigationswarnungs-Garantie. |
| FLH-PROJ01 #252 | **ACTIVE / PLANNED**, nicht PARKED. | Optionale transparente Zukunftsszenarien für Sparen/Entnahme/Inflation; keine Umdeutung als tatsächliche Vermögenswerte oder zweite Datenengine. |
| PORT-COMP01 | **VORSCHLAG**, nicht vollständig beschlossener Scoreauftrag. | Benchmark/Rendite/Risiko/Gleichlauf fachlich begrenzen; Scoreformel/Gewichtung noch nicht entschieden. Nicht mit freigegebenem UI-ALLOC01 verwechseln. |
| NAM01 / COPY01 | Name **FolioLab erhalten**; kurze Android-Bezeichnung umgesetzt. | Begrenzte AT-/EU-Namensprüfung und Produktseiten-/Funktionsversprechenreste **OPEN/VERIFY**. Keine pauschale juristische Freigabe, keine eigenmächtige Umbenennung/Domainänderung. |
| CI-OPT01 #229 / EFF01/HND01 | Caching und Pipeline-Teile vorhanden; Rest **ACTIVE/DEFERRED** nach Nutzwert. | Weitere Optimierung nur messbar und ohne fachliche Gates/Browser/Assertions zu lockern. Keine blinden Voll-Retries; nachvollziehbare Übergaben, keine Zusatzcredits buchen. |

## Abschlussvertrag und Pflege

Vor DONE je Teilumfang dokumentieren: **konkrete Anforderung → Produktcode → gezielter Test → PR/Commit → Deployment → tatsächliche Abnahme → offene Grenzen**. Reine Spezifikation, Parsergrün, CIgrün, Deployment oder Browseremulation sind jeweils nicht automatisch Vollabnahme.

Sicherer serieller Pfad bleibt **aktuellen Releaseabschluss klären → UH03 → UH04 → UH05**. Echte neue P0-Daten-/Finanzfehler haben Vorrang. Kleine belegte UI-Korrekturen dürfen am konfliktfreien Punkt integriert werden, ohne den aktiven Import-/Releasepfad durch eine zweite Umsetzung zu unterbrechen. Keine Umpriorisierung durch diesen Audit.

**Unverändert:** local-first ohne Pflichtserver/Login, keine Handelsautomatik, Daten-/Installationsidentität und v5 schützen, keine destruktive Migration/kein v263-Rollback, keine privaten Originale oder Secrets veröffentlichen. Checkpointbranch niemals vollständig nach Main mergen. Spätere neue Nutzerentscheidungen ergänzen diese Matrix; fehlende Hardwarebelege bleiben sichtbar, abgenommene Teilfunktionen werden nicht neu gebaut.
