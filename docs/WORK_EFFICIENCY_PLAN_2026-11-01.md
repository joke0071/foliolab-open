# EFF01 – Verbindlicher Arbeitsplan für effiziente FolioLab-Entwicklung

Nutzerauftrag vom 01.11.2026. Ergänzt CI-OPT01 #229 und den gesamten bestehenden Masterauftrag. **Prozessregeln ab sofort verbindlich; technische Pipelineänderungen erst nach eigenem belegtem Test.** Kein neuer Produktbranch, keine Entwicklungsübernahme, kein Abbruch laufender Actions. Der aktive Work-Owner bleibt verantwortlich.

## 1. Ziel, Geltung und Priorität

Mehr tatsächlich nutzbare, sicher veröffentlichte Funktionen je verfügbarem Work-Kontingent. Nicht die Zahl der Commits, Testaufrufe oder Statusmeldungen maximieren. Weder Produktumfang noch Finanz-/Datensicherheitsqualität zur Einsparung still reduzieren.

Aktueller fachlicher Vorrang bleibt unverändert: laufenden Marktquellen-Korrekturrelease sicher abschließen; #266 einschließlich Alt-API-/Schlüsselbereinigung; anschließend gemeinsamer CSV-/Blockchain-Import UH01–UH05 nach `IMPORT_HISTORY_UNIFIED_PLAN_2026-11-01.md`. #257 und #149 einschließlich Long-Press, tatsächlich verfügbarer Chartzeiträume und CSV-Werkzeugen im kompakten Mehr-Menü bleiben aktiv. Keine neue mehrtägige CI-Optimierung vor diesen Nutzerfunktionen.

Dieses Dokument ist der verbindliche Ergänzungsplan, nicht eine neue Roadmap. Im nächsten regulären Owner-Checkpoint jeweils nur einen Link hierher und die konkrete nächste Aktion aufnehmen. Aktuelle Release-/Owner-Daten nicht durch historische Werte ersetzen; den historischen Checkpointbranch niemals vollständig nach main mergen.

## 2. Modell-, Reasoning- und Budgetregeln

**Standardpräferenz des Nutzers: GPT-6.1 Sol, Standardgeschwindigkeit, normalerweise mittlerer Reasoning-Aufwand**, sofern in der tatsächlichen Work-Umgebung auswählbar. Für klar mechanische, risikoarme Doku-/Text-/CSS-Korrekturen niedrigen Aufwand erwägen. Kein pauschales Maximum-Reasoning, Fast oder Ultrafast.

Höheren Aufwand bzw. ein leistungsfähigeres Modell gezielt für neue wirtschaftliche Invarianten, komplexen Quellenabgleich, Migration/Restore/Kryptografie, schwierige Nebenläufigkeit oder eine gezielte unabhängige Prüfung dieser Änderungen einsetzen. Nicht jedes Paket mehrfach durch verschiedene Modelle analysieren. Nach höchstens zwei erfolglosen gezielten Reparaturversuchen zunächst Repro, fehlende Daten/Zugriffe und alternative Ursache prüfen; ein größeres Modell ersetzt keine fehlenden Belege.

**Ein Prompt schaltet das Modell nicht technisch um.** Nur eine tatsächlich vorhandene Einstellmöglichkeit verwenden; sonst Nutzerpräferenz dokumentieren, keine automatische Umschaltung behaupten und nicht wegen einer optionalen Modellwahl die sichere Routinearbeit blockieren. Eine sinnvolle Eskalation auf einen anderen Work-Chat verlangt gesicherte Übergabe und alleinigen Owner, keinen parallelen Schreibzugriff.

Keine zusätzlichen Credits, kostenpflichtigen Resets, Abonnements, Tarif-Upgrades oder API-Ausgaben ohne neue ausdrückliche Freigabe. Bereits vorhandene Budgets nur im Rahmen bestehender Freigaben verwenden. Tatsächliche Restnutzung/Resetzeiten nur nennen, wenn zugänglich; aus API-Preisen keine feste Pro-Kontingent-Ersparnis ableiten. Bei fehlendem Kontingent soweit möglich WIP und nächsten Schritt sichern, nicht Tests überspringen. Dieser Plan ändert keine Abrechnungseinstellung und verhindert technisch keinen etwaigen automatischen Guthabenverbrauch.

## 3. Kleiner vertikaler Schnitt statt Mikropatches oder Großumbau

Vor Beginn eines Pakets höchstens eine kurze Taskkarte erstellen: Nutzerziel, Nicht-Ziele, betroffene Dateien/Verträge, Risikostufe, 3–5 Abnahmekriterien, nächster sicherer Releasepunkt. Bestehende Issue-/Originalanalysen verlinken statt kopieren.

Ein Paket soll einen nutzbaren Ablauf abschließen: Eingabe → Prüfung → sichere Übernahme → Reload/Wiederimport, soweit dies sein Fachumfang ist. Ein weiterer dauerhaft gesperrter Preview-Parser erfüllt den Importauftrag nicht.

Zwei bis drei eng zusammengehörige, risikoarme UI-/Textkorrekturen derselben Ansicht dürfen zu einem klar begrenzten gemeinsamen Kandidaten gebündelt werden, sofern gleiche Testbasis, übersichtlicher Diff und eindeutige Rücknahmegrenze bestehen. Nicht für jede Beschriftung ein eigener Vollrelease. **Keine Bündelung unabhängiger Finanz-, Schema-, Credential-, Restore- oder Kryptoumstellungen nur zur CI-Ersparnis.** Bereits erteilte risikobasierte Merge-/Deploymentfreigabe nutzen; echte neue Risikogrenzen weiterhin gesondert behandeln.

Ein aktiver Produkt-/Integrationsstrang. Unabhängige Leseabfragen dürfen gebündelt werden. Bereits vorhandene isolierte CI-Shards sind zulässig, aber keine zusätzlichen parallelen schreibenden Agenten.

## 4. Drei Prüfphasen, bestehende CI-Verträge erhalten

| Phase | Verbindliches Verhalten |
| --- | --- |
| Entwicklung | Lokal die kleinsten aussagekräftigen Repros und direkt betroffenen Tests zuerst; danach bestehende schnelle Unit-/Syntaxprüfungen. Im aktuellen Workflow bereits erlaubtes FAST nur für dessen tatsächlich zugelassene Draft-Deltas verwenden. |
| Integrationskandidat | Paket fertigstellen und Diff einfrieren; exakten Kandidaten gegen die unverändert erforderlichen Integrations-/Crossbrowser-/Sicherheitsgates prüfen. Unbekannter oder kritischer Impact erzwingt den vollständigen Pfad. |
| Release | Bereits verpflichtende Main-, Deployment- und tatsächliche Produktionsprüfungen erhalten. Veröffentlichte Asset-/Versionsidentität und veränderten Nutzerablauf prüfen. Erst belegten Erfolg LIVE_ACCEPTED nennen. |

Keine pauschale Freigabe, finale Browser, Finanz-, Import-, IDB-/CAS-/Mehrtab-, Offline-/SW-, Backup-/Restore-, Sicherheits- oder relevante Accessibility-Gates zu streichen. Anfassen gemeinsamer App-Router, Model-, DOM-/Form-/Speicherverträge ist nicht automatisch risikoarme Optik. FAST ist niemals ein Releasebeleg.

Vor der ersten teuren Kandidaten-CI: Syntax/Units, geänderte ausgelieferte Assets und notwendiger SW-Cachebump, gerichteter Repro, 320px-Layout bei UI-Änderungen, Fokus/Selectorscoping, relevante Daten- und Secret-Nichtmutation prüfen. Bekannte triviale Selektor-, Versions- oder Formatfehler nicht erst von einer langen CI-Schleife finden lassen.

### Nachweise sinnvoll wiederverwenden

Bereits gelesene Logs, Artefakte und Originalanalysen für denselben Zustand referenzieren, nicht neu erzeugen oder wiederholt vollständig lesen. Für jeden Beleg mindestens Commit/Tree, Testumfang, Umgebung/Browser-/Abhängigkeitsversion und Ergebnis erhalten.

Ein alter PASS gilt nicht automatisch für neuen Code. Wiederverwendung nur bei identischem relevantem Code/Tests/Build/Abhängigkeiten/Konfiguration und belegter fehlender transitiver Auswirkung; unbekannter Impact bedeutet neu testen. Geänderte Parser, Schema, Quellen- oder Identitätsregeln invalidieren betroffene alte Originalabnahmen. Finale in der Pipeline vorgeschriebene Läufe werden nicht allein per Dokumentation übersprungen. Produktions-/Liveanbieterbelege sind zeitabhängig und werden nicht aus lokalen Mocks oder einem alten Release abgeleitet.

Bei grünem, eingefrorenem Kandidaten nicht zusätzlich dieselbe volle lokale Suite aus Gewohnheit starten. Gezielte unabhängige fachliche Sollwerte und nötige visuelle Kontrolle bleiben erhalten.

## 5. CI-Aufrufe, Polling und Fehlerbehandlung

**Konkret geprüfter Workflowbefund:** `.github/workflows/import.yml` hat PR-/Main-bezogene Concurrency mit `cancel-in-progress: true`. Ein neuer Push in dieselbe Gruppe kann laufende Arbeit automatisch abbrechen. Deshalb finale CI starten, Kandidat einfrieren und bis zum Ende nicht mit bloßen Status-/Doku-/Formatänderungen erneut pushen. Notwendige Produktkorrektur zunächst lokal bzw. rekonstruierbar sichern; aktuellen Lauf nicht eigenmächtig abbrechen. Reine Plan-Nachträge getrennt auf dem bestehenden Dokumentationsbranch sichern.

Kein Sekunden-Polling und keine wiederholten Vollreads unveränderter GitHub-Daten. Wenn ein Warte-/Ereignismechanismus verfügbar ist, diesen nutzen; andernfalls wenige Statusabfragen mit zunehmendem Abstand. Nicht allein für einen kleinen UI-Nachtrag gesamten Checkpoint, Roadmap und sämtliche Issues erneut lesen. Keine Hintergrundarbeit oder spätere Benachrichtigung behaupten, wenn kein entsprechender Mechanismus läuft.

Fehler zuerst klassifizieren: Produktfehler, nichtdeterministischer Test, Infrastruktur oder Anbieter/Quota. Originalfehler behalten. Höchstens ein gezielter Retry eines nachweislich transient fehlgeschlagenen Jobs auf unverändertem Kandidaten; kein blindes Neuwerfen der ganzen Pipeline. Wiederholter Fehler verlangt Ursachenbehebung. Finanz-/IDB-/Identitätsassertionen nicht durch Retries, längere Fristen, Skip oder blinde Snapshotänderung grün machen.

Bei technisch unabhängiger, rein lesender Originaldateianalyse während CI darf Vorarbeit erfolgen; keine zweite produktive Implementierung oder konkurrierende Integration.

## 6. Reale Daten früher prüfen, externe Kontingente schonen

Vor umfangreicher Anbieter-/Parserintegration einen kleinen autorisierten Original-/Livebeleg bis zum fachlich erwarteten Ergebnis prüfen. Nicht erst nach Deployment erkennen, dass reale Spaltenvarianten, Nullkurse oder Tarifgrenzen den Normalfall verhindern. HTTP200, passende Zeilenzahl und korrekte Metadaten sind noch keine vollständige Wertvalidierung.

Bestehende private Originaldateien und Analysebelege zuerst wiederverwenden. Fehlende konkrete Belege nur nach gezielter Suche privat anfordern. Öffentliche Fixtures synthetisch; keine Originalbestände, Walletkennungen, Schlüssel oder Passwörter veröffentlichen.

Liveanbieteranfragen sparsam: vorhandene redigierte Belege und lokal isolierte Antworten für unveränderte Semantik nutzen, Quoten über Sitzungswechsel hinweg dokumentieren, keine identischen Vier-ETF-Livetests nach jedem CSS-Schritt. Echte finale Anbieter-/Produktionsprobe weiterhin durchführen, wenn sich der relevante Pfad geändert hat. Momentane Kurse und vollständige Historie getrennt abnehmen; Lücken nicht mit Null oder erfundenen Werten schließen.

Finanz-Sollwerte unabhängig berechnen; nicht dieselbe Produktionsfunktion als einzigen Test-Oracle verwenden. Importreihenfolge, Dubletten, Transfers, Gebühren und Restore müssen unabhängig nachweisbar bleiben.

## 7. Kurzer Einstieg, kompakte Statusführung, saubere Übergabe

Pro Wiederaufnahme zuerst nur aktuellen Checkpointkopf, aktive PR/HEAD/Actions und betroffene Issue-Nachträge lesen. Weitere Dateien gezielt nach Diff und Abhängigkeiten. Gesamtaudit nur bei widersprüchlicher Basis, relevanter neuer Architektur oder konkretem Sicherheitsbefund, nicht als Routine.

Checkpointziel: ein kurzer aktueller Kopf mit Owner, Main, letztem wirklich akzeptiertem Release, aktivem Kandidaten/Run, Blocker und nächster ausführbarer Aktion. Umfangreiche Belege verlinken. Keine identischen langen Releaseprotokolle in Checkpoint, Roadmap, Priorisierung und mehreren Issues vervielfachen.

Historische Belege dürfen bei einem späteren sicheren Dokumentationsschnitt in ein verlinktes Archiv wandern; nichts löschen, Quellenlinks erhalten, keine große Archivierungsaktion während aktiver Fremdschreibvorgänge. Erst kürzer schreiben, nicht erst eine neue Dokumentationsplattform bauen.

Bei zunehmender Kontextlast am nächsten sicheren Meilenstein übergeben, nicht bis zum nicht mehr reagierenden Chat warten. WIP/Commit/Tests/Blocker/Owner/Nächster-Schritt und private Zugangslocator getrennt sichern. Neuer Chat erhält Links und Delta, keine vollständige historische Projektchronik. Vorherigen Owner stoppen; fehlende Chatantwort allein beweist keinen Stillstand. Chatwechsel ist kein Kontingentreset.

## 8. Technische Beschleuniger nur mit Beleg und kurzer Amortisation

Bestehende versionierte Browser-Caches und drei Crossbrowser-Shards zuerst nutzen, nicht erneut implementieren. Die aktuellen Grundregeln und Cacheeinträge wurden in `.github/workflows/import.yml` gelesen.

Weitere Pipelineänderungen sind ein begrenzter CI-OPT01-Kandidat, nicht Voraussetzung für Nutzerfunktionen: reproduzierbare Toolinstallation, korrekt schlüsselnde Caches, kompakte maschinenlesbare Ergebniszusammenfassung; Chromium-Sharding oder breitere Testselektion erst bei gemessenem Engpass. Cache-Key muss Laufzeit/OS/Architektur/Browser-/Dependency-Versionen abbilden; nie Secrets oder private Portfolios cachen.

Vorher/Nachher mit identischem Testmanifest und relevanter Negativkontrolle. Unbekannte/geänderte Workflows, Finanz-/Storage-/Backup-/Auth-/Provider-/PWA-Dateien dürfen nicht durch Dateinamensheuristik in FAST rutschen. Schutzregeln nicht für einen grünen Lauf umgehen. Änderungen an Gateauswahl oder Caching separat prüfen, nicht im laufenden Markt-/Importfix verstecken.

Optimierung stoppen oder zurückstellen, wenn sie voraussichtlich mehr Arbeit bindet als sie in den nächsten wenigen Paketen spart. Keine neue Testinfrastruktur ohne konkreten Nutzen.

## 9. Minimale Erfolgskontrolle und sofortiger nächster Schritt

Für die nächsten drei vergleichbaren abgeschlossenen Pakete bestehende CI-Zeiten und Anzahl vollständiger Läufe/gezielter Retries auswerten; dazu erforderliche Wiederholungsanalysen und Rückläufer festhalten. Eine kurze Zeile je Paket genügt. GitHub-Runner-Minuten und Work-Kontingent getrennt behandeln; tatsächlichen Credit-/Tokenverbrauch nur bei vorhandenen Nutzungsdaten. Keine garantierte Prozentersparnis oder feste Restlaufzeit versprechen.

Der aktive Work-Owner übernimmt diese Regeln am nächsten sicheren Checkpoint ohne weitere allgemeine Freigabeschleife. Nur Link und veränderten nächsten Schritt in `WORK_RESTPAKETE_CHECKPOINT.md`, `KONSOLIDIERTE_ROADMAP.md` und `MASTER_PRIORITAETEN_RESTAUDIT_2026-10-30.md` ergänzen. Die derzeitige Release-/Korrekturarbeit bleibt unangetastet. Bestehende Veröffentlichungserlaubnis sicher nutzen, fertige Pakete nicht in wiederholten Audits liegen lassen.

**Sofort anwendbar:** kürzere Kontexte, gezielte Reads, sinnvolle Paketgröße, lokale Vorprüfung, Kandidatenstopp, einmalige Belegauswertung, selektive Eskalation und keine Zusatzkäufe. **Noch nicht implementiert:** etwaige neue CI-Auswahl-/Sharding-/Archivierungsmechanismen. **Nicht geändert:** Produktcode, Secrets, Originaldaten, laufende Jobs, Modellwahl des privaten Work-Chats oder Abrechnungseinstellungen.

## Quellen und geprüfte Grundlage

Projekt: CI-OPT01 #229, aktueller Mastercheckpoint und `.github/workflows/import.yml` (gelesener Blob `ebdbc96fbc071c496ef6ba6872db244b6e893c88`). Neuere Produkt-/Ownerzustände stets frisch prüfen, keine Versionswerte dieses Plans als aktuellen Produktionsstatus übernehmen.

Offizielle OpenAI-Dokumentation, geprüft 01.11.2026:
- https://openai.com/index/introducing-gpt-6-1-sol/ — Modellverfügbarkeit und Positionierung; API-Preisvergleich ist keine Garantie einer proportionalen Abo-Ersparnis.
- https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex — Verbrauch hängt von Modell, Kontext, Reasoning, Geschwindigkeit und Aufgabe ab; tatsächliche Modellauswahl über verfügbare Einstellungen.
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan — verfügbare Nutzung und Kontingentanzeige; keine feste Zahl von Aufgaben aus einer Roadmap ableiten.
