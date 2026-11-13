# EFF03 – Sieben-Tage-Ziel für den vollständigen bestehenden Entwicklungsumfang

Verbindlicher Planungsnachtrag zum [bestehenden Effizienzplan](WORK_EFFICIENCY_PLAN_2026-11-01.md), Nutzerauftrag vom 11.11.2026, 12:31 MEZ. Ziel: Fertigstellung aller bereits beauftragten Entwicklungspakete innerhalb von sieben Kalendertagen, bis **18.11.2026, 12:31 MEZ**, ohne Qualitäts-, Finanz- oder Datensicherheitsabbau.

Dieser Nachtrag ist ein Ausführungs- und Priorisierungsplan, keine zweite Roadmap. Die [kanonische 41-Scope-Matrix](KONSOLIDIERTE_ROADMAP.md) bleibt die einzige Statusquelle. Historische Nachweise und fachliche Anforderungen bleiben erhalten. Der Wochenumfang umfasst ausdrücklich auch die bisher NACH_1.0 eingeordneten Pakete einschließlich FLH04-Synchronisierung. Die bestehende Definition von Version 1.0 wird dadurch nicht stillschweigend erweitert; die spätere Versionszuordnung ist von der Priorität im Wochenplan zu unterscheiden.

**Ziel ist nicht Garantie.** Eine vollständige Umsetzung und produktive Abnahme aller 41 Positionen innerhalb der Woche ist derzeit nicht belastbar nachgewiesen: echte Restaufwände, verfügbare aktive Agentenzeit, Originalbelege, OAuth-/Betreiberfreigaben und Gerätezugang sind nicht vollständig geklärt. BLOCKED_EXTERNAL, fehlende Zustimmung, nur implementierter Code oder ein vorbereiteter Test gelten niemals als DONE. Das Ziel darf nicht durch Scope-Streichung, Umbenennung oder Abschwächung von Abnahmen scheinbar erfüllt werden.

## Aktive Ausführung

Aktueller Owner, Kandidat und Release ausschließlich aus dem frischen [Checkpointkopf](WORK_RESTPAKETE_CHECKPOINT.md); Scope-Status ausschließlich in der kanonischen Matrix. [Aktiver Effizienzplan](WORK_EFFICIENCY_PLAN_2026-11-01.md#aktive-prozessregeln) ist der kurze Einstieg; Detailhistorie nur bei Bedarf nachladen.

1. **Bestehenden Nutzerkandidaten sicher abschließen.** Gefrorenen Scope erhalten, vorhandene Läufe weiterverwenden. Keine neue Full-CI/Integration parallel; bei Infrastrukturblocker nach begrenzter Diagnose unabhängige Vorarbeit im einen erlaubten Folgeschnitt bzw. Test-/Belegvorbereitung erledigen. Status nur bei begründetem Bedarf prüfen; keine Automation oder garantierte automatische Wiederaufnahme.
2. **Vor dem nächsten Freeze den ganzen Ablauf vorbereiten.** Zielverhalten und betroffene Erfolg-/Abbruch-/Fehlerfälle gemeinsam festlegen. Geänderte UI früh mit vorhandenen nativen Browsermitteln gezielt ansehen: schmale/kurze Ansichten, Fokus/Kontrast, asynchrone Details und lange Namen, soweit betroffen. Keine neue Plattform oder Remote-TARGETED-Stufe; ohne Browserzugang bleibt der Nachweis offen und reguläre Pflicht-CI nötig. Der vollständige eingefrorene Kandidat erhält alle vorgeschriebenen Abschlusstests.
3. **P-CI-B anschließend, P-CI-C separat.** Erhaltenen Balancingkandidaten gegen akzeptierten Main und echte Testdauern qualifizieren; konkrete #229-Freigabe und vollständige Gates anwenden. Nutzen in2–3geeigneten regulären Läufen belegen; keine Zusatzläufe für Statistik.
4. **Externe Nachweise gesammelt vorbereiten.** Im bestehenden eigenen Checkpoint eine kurze verlinkte Liste je fehlendem Gerät/Zugang, synthetischem Teststand, Nutzeraktion, Sollnachweis und Zuständigkeit führen. Vorhandene A01–A10-/TalkBack-/OAuth-/Zweigeräteprotokolle nutzen. Nur tatsächlich nötige Eingriffe gebündelt anfordern; Android-/Safari-/OAuth-/Sync-Prüfung ohne tatsächlichen Nachweis bleibt offen.
5. **Kleine Schritte innerhalb sinnvoller Bündel.** Kurze dauerhafte Zwischenstände an echten Wiederaufnahmepunkten: Owner/Branch/SHA, tatsächlich geprüft, offene Gates/Run-IDs, bestätigte/offene Sicherung, nächste Aktion. Frische Datei-SHAs/Rückprüfung; keine starren Datei-/Zeilen-/Promptgrenzen und kein zusätzlicher Release-/Full-CI-/Vollsicherungszyklus allein pro Zwischenstand. Alle bestehenden Sicherungs-/Original-/Restoreverträge erfüllen.

Aufwandgrenzen und Erfolgsmessung stehen einmal im [aktiven Effizienzplan](WORK_EFFICIENCY_PLAN_2026-11-01.md#nächste-maßnahmen-in-bestehenden-paketen); alle Zusatzarbeiten teilen das bestehende halbtägige Gesamtbudget. Maßstab ist die Zeit bis zur vollständigen produktiven Paketabnahme einschließlich Korrekturen und Sicherung. Keine neue Prozessplattform oder erneute Gesamtanalyse.

**Rotationsversuch beendet:** Aufgabe deaktiviert, keine45-/60-/90-Minuten-Stoppregeln oder automatische QA-Übergabe. Der bestehende alleinige Hauptagent arbeitet bis zur tatsächlichen Kontext-/Technikgrenze oder regulären nutzerbeauftragten Abgabe.

[Frühere organisatorische Nachträge und v309-Messsnapshot unverändert im gespeicherten Stand](https://github.com/joke0071/foliolab-open/blob/6589bcdb7fc60114a9acf279702360bda0ad5c82/docs/EFF03_WEEK_TARGET_2026-11-11.md). Die folgenden Nutzeranforderungen und Paketverträge bleiben erhalten; historische Versions-/Kandidatenangaben sind keine aktuelle Handlungsgrundlage.

## Nutzerbefunde · 11.11.2026 · bestehende Pakete konkretisieren

**Befundsnapshot, kein aktueller Releaseauftrag:** Die folgenden ursprünglichen Versionsangaben dokumentieren die Ausgangslage. Erledigte Kriterien aus frischem Checkpoint/Abnahmebeleg wiederverwenden, keine v308/v309-Wiederholung daraus ableiten.

Gegen aktuellen Main `0be4c7f07a60e1d17ce5a5691261a52810701329` und bestehende Scope-Zuordnung geprüft. Private Screenshots ausschließlich lokal angesehen; öffentliche Belege nur synthetisch. Keine neue Roadmap und keine Erweiterung des eingefrorenen v308. Nach dessen vollständigem Abschluss Funktionsbefunde priorisieren; vorbereiteten P-CI-B-Schnitt erhalten, keine parallele finale CI oder neue Gesamtanalyse.

| Befund / bestehender Scope | Abgleich und konkrete Arbeit | Abnahme |
| --- | --- | --- |
| Stichtagsbearbeitung · K3 / K6-DELTA | `renderReferences`, `openSnapshot` und `reference-management.js` enthalten bereits Verwaltungsmodus und Editdialog, sperren aber automatische/migrierte/unbekannte Herkunft; dadurch fehlt dort der sichtbare Bearbeitungseinstieg. Keine zweite Verwaltung bauen und Herkunftsschutz nicht entfernen. Konsistenten Einstieg wie Positionen/Buchungen herstellen; erlaubte Korrekturen samt Quellen-/Startanker-Verträgen fachlich abgrenzen und gesperrte Felder verständlich erklären. Konkreten fehlenden Nutzerablauf gezielt wieder öffnen, Gesamt-K3 bleibt PARTIAL. | Vor Freeze Erfolg, Abbrechen, ungültige Werte, IDB-Fehler, veraltete Revision und nachgelagerte Fehler prüfen. Unabhängige historische Bewertungs-/Verlaufs-Sollwerte, UNKNOWN-FX, Startanker, Journal, CAS, Backup/Restore erhalten. Finanz-/Speichermutation bei Bedarf als eigener zusammenhängender Kandidat. |
| Android-Startanimation · UI-R1 gezielter Befund / K5 | Große Animation laut Nutzer statisch. CSS stoppt sowohl bei Reduced Motion als auch `startup-delayed`; Startwächter setzt diese Klasse nach 12 Sekunden oder Fehler. Das ist ein Ursachenhinweis, kein auf Hardware bestätigter Repro. Ladeverzögerung und echter Fehler gezielt unterscheiden; kein kompletter UI-R1-Neubau. | Tatsächliches Android mit System-Bewegungseinstellung, kurzer/langer Ladezeit, Fehler und Späterfolg prüfen. Animation und Ladezustand unabhängig zuverlässig; Reduced Motion respektieren. Browserbelege ersetzen keine Hardwareprüfung, bestehende abgenommene Teilbelege bleiben erhalten. |
| Desktopnavigation und Installation · K6-DELTA / UI-R1 begrenzte Änderung | Seitlicher aktiver grüner Inset-Schatten ist im aktuellen CSS vorhanden. Durch dezente Unterstreichung oder gleich klare mobile-nahe Hervorhebung ersetzen. Beide einzelnen Header-Handy-plus-Symbole entfernen. Stattdessen **Mehr → App installieren** mit Symbol und Text auf Desktop/Mobil. Bestehende Prompt-/Installationshilfe wiederverwenden, keine neue Installationsengine. | Aktiv, Hover und Tastaturfokus unterscheidbar; semantische Navigation, Fokusführung und Touchziele erhalten. Installationsfälle siehe unten, Desktop und echtes Android. |
| Dashboard und ausgeklappte Konten/Depots · K6-DELTA / N-UI-PLUS | Aktuell zwei gestreckte Diagrammkarten und separate bildschirmbreite Anbieterkarte; Nutzerbefund trifft Struktur. Einen gemeinsamen Layoutschnitt mit obiger Navigation bilden: Vermögensverlauf links, Donut und kompakte Konten-/Depotübersicht rechts, natürliche Kartenhöhen; kleiner passend stapeln. Detailkennzahlen gruppieren, Kursverlauf/Buchungen als kompakte Kontextbereiche, CSV-Aktion in Inhaltsbreite. | Auf-/Zuklappen, alle Informationen/Funktionen, lange Namen, große Beträge, UNKNOWN-Werte, leere und große Listen, Tastatur/Touch/Zoom sowie schmale Breiten erhalten. Öffentliche Vorher-/Nachherbelege ausschließlich mit synthetischen Portfolios. Keine Berechnungsänderung aus Layoutwunsch. |

### Installation als Teil desselben Navigationspakets

Vorhanden sind `beforeinstallprompt`, `appinstalled`, `display-mode: standalone`, `navigator.standalone`, `updateInstallControls` und `showInstallHelp` im aktuellen `src/app.js`. Diese Signale und Hilfe wiederverwenden. Bereits installierte App nach tatsächlich verfügbarem Erkennungssignal behandeln; keine universelle browserübergreifende Erkennung behaupten.

- **Mehr → App installieren** ist der eindeutige gemeinsame Einstieg mit Symbol und Text. Wo direkter Prompt fehlt, passende vorhandene manuelle Anleitung anbieten.
- Zusätzlich nur auf Desktop und nur bei verfügbarem direktem Installationsangebot, nicht als installiert erkannter App und noch nicht geschlossenem Hinweis: dezenter Hinweis unten in der Seitenleiste **„FolioLab als App nutzen“**, mit eigenem zugänglichem Schließen.
- Schließen als nicht finanzielle lokale Darstellungspräferenz dauerhaft respektieren; Navigation, erneutes Rendern und Neustart zeigen den Hinweis nicht wieder. Bei gesperrtem Präferenzspeicher mindestens innerhalb der laufenden Sitzung respektieren; ein Präferenzfehler blockiert weder App noch Installation.
- Nach App-Installation oder Wechsel in Standalone Hinweis unmittelbar ausblenden. Keine Installation als erfolgt markieren, nur weil ein Prompt angefordert wurde; Abbruch/Fehler nachvollziehbar behandeln. Kein mehrfaches Verwenden desselben verbrauchten Prompt-Events.
- Vor Freeze gezielt prüfen: Prompt vorhanden/fehlend/später verfügbar, Benutzerannahme/Abbruch/Promptfehler, `appinstalled`, initialer und wechselnder Standalone-Zustand, schließbarer Hinweis über Navigation/Reload, gesperrter Präferenzspeicher, manuelle Anleitung und Fokus nach Dialog/Schließen. Keine Portfolio-/Revisionsmutation durch diese Bedienung; PWA-/Update-/Offlineverträge erhalten. Echtes Android separat belegen.

### Gestaltungsreferenzen und Reihenfolge

Aktuelle offizielle Referenzen gelesen: [Finanzfluss-Copilot Dashboard](https://www.finanzfluss.de/copilot/hilfe/dashboard/) und [extraETF Portfolio Tracker](https://extraetf.com/de/service/finanzmanager). Für den Entwurf die klare Priorität des Vermögensverlaufs, kompakte Kennzahlen und gemeinsam präsentierte Konten/Depots nutzen; eigene FolioLab-Gestaltung und bestehende Informations-/Finanzverträge erhalten. Keine fremden Assets oder privaten Finanzdaten übernehmen.

1. Laufenden v308 einschließlich tatsächlicher Produktion und dauerhafter Sicherung/Restore schließen.
2. Stichtagsbearbeitung fachlich reproduzieren/qualifizieren und Android-Animationsbefund gezielt untersuchen; tatsächlicher Hardwarebefund bleibt bis zum Geräteprotokoll offen.
3. Navigation **einschließlich Installation**, Dashboard und Anbieter-/Positionsdetails zu einem vollständigen UI-Kandidaten bündeln. Finanz-/Speicherkorrekturen nur bei notwendigem fachlichem Zusammenhang mitführen, ansonsten separat qualifizieren.
4. P-CI-B-WIP bleibt erhalten und wird mit unveränderten Schutzgates sowie bestehender konkreter Workflow-Mergefreigabe weitergeführt. Zurückgestellte Prozessoptionen bleiben inaktiv.

## FLH04 – begrenzter Wiederverwendungsabgleich · 13.11.2026

Unabhängige Folgevorbereitung nach UI-R4; keine zweite Produktimplementierung, keine Mutation an Draft161 und keine aktivierte Synchronisierung. Gelesen: #160, beide vollständigen Draft161-Dokumente am geschützten HEAD0d980c2f43f28fd06ef9a7403b2144b6099fbc74 sowie aktuelle Mainquellen a27cde2f802c26bfec41190911d88bd1d7d8e325. Kein neuer API-/OAuth-/Krypto-/Geräte-PASS und keine neue Gesamtinventur.

| Vorhandener Baustein / exakter Gitblob | Ergebnis für FLH04 |
| --- | --- |
| backup-vault.js ·7a19b4bd816324dca029b3398ea1f4b7fe5494b0 | AES-GCM-V2 mit festem Backup-AAD, zufälligem IV, Passwort-Wrap und lokalem nicht extrahierbarem Schlüssel vorhanden. Keine Sync-spezifischen Portfolio-/Geräte-/Revisions-/Eltern-/Replayfelder oder deren Validierung in dieser API. Unveränderte Backupverschlüsselung ist allein kein authentisiertes Syncprotokoll. |
| crypto-backup.js ·9ff6c8c7ad78ad14a7fff3dae2b5fd5c7f22dcd4 | Legacy-V1-Backupformat erhalten; keinen neuen Synctyp still unter dessen Formaterkennung einschleusen. Kein Backupfehler allein aus fehlender Syncsemantik behauptet. |
| complete-backup.js ·d7af70fe06b61f9db8dffff215f7e8b2782385db | Portfolio-/Historytransport und opt-in-Konfiguration vorhanden; portable Einstellungen können ausdrücklich gewählte API-Zugänge enthalten. Sync muss Datenumfang gesondert festlegen; kein automatischer Credentialtransfer und kein Austausch des bestehenden Import-/Restorevertrags. |
| drive-backup.js ·e93573b9b39010a30ee0c2aa4465340f00de2ef7 | Aktuelle Backup-/Authzustände und drive.file-Integration vorhanden; kein implementierter authentisierter Revisionsgraph oder konfliktfester Mehrgeräte-Commit daraus. Reale Remote-CAS-/OAuth-/Neugerätefähigkeit weiterhin ungeprüft. |

**Nächster kleinster interner Fachschritt:** bestehenden reinen Revisions-/Konfliktvertrag aus Draft161 präzisieren, bevor Transport/UI entsteht. Keine Transportalternative als entschieden ausgeben. Eingabe ist ein bereits authentisiert und strukturell/umfangsbegrenzt validierter synthetischer Revisionsgraph derselben Portfolioidentität plus lokaler akzeptierter Basis; Ausgabe ausschließlich ein Plan (unverändert, Nachfolger prüfbar, Konflikt oder blockiert), keine IDB-/Netzwerk-/Vaultmutation. Der Plan ist weder ein Integrationscommit noch ein Authentisierungs-/Vollständigkeitsbeweis der Cloud. Mangels vollständiger Sicht niemals „global synchron“ behaupten.

Unabhängige erwartete Referenzfälle für diesen bestehenden Vertrag:

| Synthetischer Fall | Sicheres Soll |
| --- | --- |
| Gleiche bereits akzeptierte Revisionsidentität und gleicher Inhalt | Kein Apply; doppelte Zustellung idempotent. |
| Gleiche Identität mit anderem authentisierten Inhalt | Blockieren; Identitätswiderspruch, kein Gewinner nach Zeitstempel. |
| Vollständig geprüfte lineare Nachfolgerkette derselben Portfolioidentität | Nur als Apply-Kandidat planen; Modell-/History-/Importvalidierung und aktueller lokaler CAS bleiben nachgelagerte Pflicht. |
| Zwei Geschwister nach gleicher Basis | Beide erhalten; expliziter Konflikt, kein Last Write Wins/Automerge aus JSON-Feldverschiedenheit. |
| Fehlender Elternknoten oder unvollständige paginierte Sicht | Blockiert/unvollständig; kein neuer Head oder automatischer Root-Ersatz. |
| Fremdes Portfolio, Selbstbezug/Zyklus, unbekanntes Format, zu große Eingabe | Vor Apply blockieren; lokalen Stand/Vault unverändert lassen. |
| Bekannter alter Vorfahr nach bereits akzeptiertem Nachfolger | Kein Rollback. Legitimer Historienabruf allein ist kein Beweis eines Angriffs. |
| Lokale Revision ändert sich nach Planerstellung | Commit über bestehenden CAS abweisen; neu lesen/planen, nicht Cloudstand erzwingen. |

Das sind spezifizierte Sollfälle, **keine ausgeführten neuen Tests**. Authentisierung/Kanonisierung, Revisionsidentitätsbildung, Nonce-/Schlüsseltrennung, Rotation und Recovery bleiben vor Code fachlich zu schließen; keine neue Eigenkryptografie aus diesem Abgleich. Die tatsächlichen Drive-Schreib-/Sichtbarkeits-/Idempotenz-/OAuthbedingungen sind getrennte externe Nachweise, keine Voraussetzung für das Spezifizieren rein lokaler Fälle.

Der einzige isolierte Produktfolgeschnitt bleibt UI-R4. Solange sein Platz durch den geparkten Releaseblocker gebunden ist, keinen zweiten FLH04-Produktbranch eröffnen oder Sync in UI-R4 mischen. Diese Folgevorbereitung liegt ausschließlich in diesem bestehenden Wochenplan; Draft161 nicht mergen. Vor produktiver Sync-/Migrationsfreigabe konkreten vollständig reviewbaren Kandidaten und die dann erforderliche Nutzerentscheidung gemäß #160 vorlegen.

## 1. Zuständigkeit und sicherer Einstieg

Ein alleiniger HND01-Hauptagent bleibt verantwortlich für Entwicklung, eigene QA, CI, Integration, Produktion, Sicherung und Restore. Keine neue Agentenautomatisierung, kein zweiter Produktwriter, keine automatische Chat-Nachfolge. Dieser ausdrücklich beauftragte Dokumentationsnachtrag übernimmt keine HND01-Verantwortung und verändert weder den zentralen Owner-Eintrag noch Produktcode, Main, Workflow, private Sicherungen oder eingefrorene Kandidaten.

**HISTORISCH / ABGELÖST – kein Integrationsauftrag:** Bei der Bestandsaufnahme: v307 LIVE_ACCEPTED/V142 verifiziert; Hauptowner main-b180b1102417-20261111; PR329/v308 eingefroren auf 3bd46d59591ce32b8ac2f856620d79522e367d1b, Tree 08d2b2b67a900d79b51dcb632d21b52f99636f7a; reguläre Läufe 43012561165/43012561133. Diese Angaben sind ein Snapshot, nicht die künftige Zustandsquelle.

Der oben genannte erste PR329-Kandidat wurde trotz erfolgreicher damaliger CI fachlich verworfen und darf nicht als Freigabe- oder Integrationsbasis dienen. Die [PR329-Korrekturqualifikation](release-evidence/v308-pr329-qualified.json) dokumentiert den Nachfolger; tatsächlichen aktuellen Produkt-/Kandidaten-/Ownerstatus ausschließlich im frischen [Checkpointkopf](WORK_RESTPAKETE_CHECKPOINT.md) feststellen. Keine historischen Statuswerte dieses Zielplans fortschreiben oder als aktuellen Stand ausgeben. Organisatorische Zuständigkeit/Rotation ausschließlich gemäß [Aktive Prozessregeln](WORK_EFFICIENCY_PLAN_2026-11-01.md#aktive-prozessregeln); historische feste Rotationsschwellen sind ersetzt.

**Zuerst den laut aktuellem Checkpoint gültigen Produkt-/Releaseabschluss regulär abschließen. Einen verworfenen historischen Kandidaten nicht integrieren oder unverändert weiterqualifizieren.** Keine laufende CI abbrechen, keine neue Optimierung auf dessen Branch pushen und keinen nachträglichen Sammelkandidaten daraus machen. Neue Prozessregeln und getrennte CI-Optimierung am nächsten sicheren Punkt übernehmen. Aktuellen Stand stets im [Checkpoint](WORK_RESTPAKETE_CHECKPOINT.md) frisch prüfen.

Der Hauptagent verlinkt diesen Nachtrag bei seinem nächsten eigenen sicheren Checkpoint im bestehenden Effizienzplan und in der kanonischen Roadmap. Keine komplette Wiederlektüre oder neue Architekturinventur allein wegen dieser Planfortschreibung.

## 2. Belegte Engpässe und daraus abgeleitete Priorität

| Befund | Nachweis | Konsequenz |
| --- | --- | --- |
| v307: erfolgreiche PR-CI 24:48; Main einschließlich Produktion 62:57. Zusammen 87:45 reine Workflow-Wandzeit, ohne erste fehlgeschlagene Kandidatenprüfung, Entwicklung, Sicherung und manuelle Auswertung. | [PR42992039252](https://github.com/joke0071/foliolab-open/actions/runs/42992039252), [Main42996734436](https://github.com/joke0071/foliolab-open/actions/runs/42996734436) | Nicht jeden kleinen Fix separat veröffentlichen. Ein vollständiger fachlicher Ablauf ist die Einheit für einen Release. |
| Im selben Mainlauf: Cross1 9:37, Cross2 8:55, Cross3 27:14; Chromium-Hauptjob 17:46. | [Jobliste](https://api.github.com/repos/joke0071/foliolab-open/actions/runs/42996734436/jobs?per_page=100), Job-Start/Ende | P-CI-B jetzt als begrenzten Beschleuniger vorziehen. Zusätzliche Cache-Neuentwicklung hat geringere Priorität als das belegte Ungleichgewicht. |
| Produktionsjob führt Chromium und anschließend Firefox/WebKit in getrennten seriellen Schritten aus. Bestehende Browser-Caches und drei Cross-Shards sind bereits vorhanden. | [Workflow](https://github.com/joke0071/foliolab-open/blob/37119745f9ac9e2356477202cae55948f3d74882/.github/workflows/import.yml), Main-Job130455465813 | P-CI-C nach P-CI-B separat auf sichere Parallelisierbarkeit prüfen; nichts bereits Vorhandenes erneut bauen. |
| v307 verarbeitet umfangreiche Originalberichte; das private Main-/Produktionsinkrement umfasst 349112320 Bytes. Ein begrenzter Ergebnisverdichter existiert bereits. | [v307-Abnahme](release-evidence/v307-live-accepted.json), [EFF03-Verdichter](EFF03_RESULT_DIGEST_2026-11-10.md) | Einmalige Vollständigkeitsprüfung und kompakte Ergebnisansicht statt mehrfacher Volllektüre. Originale und erforderliche tatsächliche Bild-/Fachprüfung bleiben erhalten. |
| Lokale Browserstarts waren im aktuellen Paket hostbedingt blockiert; reine Source-/Adaptertests sind keine Browserabnahme. | [PR329](https://github.com/joke0071/foliolab-open/pull/329) | Umgebungsfähigkeit einmal feststellen. Keine wiederholten wirkungslosen Installationsversuche; erforderliche echte Browsernachweise in einer geeigneten bestehenden Testumgebung erbringen. |

Keine Prozent-, Euro- oder Creditersparnis aus diesen Befunden ableiten. GitHub-Wandzeit, summierte Jobzeit, aktive Agentenarbeit und Work-Kontingent getrennt führen. Szenariorechnung zur Bündelung: Würden vier kleine, kompatible Änderungen statt vier separaten Releases einen gemeinsamen vollständigen Kandidaten bilden, entfielen bei unverändert angenommenen 87:45 Fixaufwand drei Zyklen = 4:23:15 Workflow-Wandzeit. Das ist eine hypothetische Oberflächenrechnung, kein gemessener Netto-Gewinn; Zusatztests, Fehler und notwendige getrennte Risikogrenzen sind einzurechnen.

## 3. Einmalige Restaufwandsklärung statt neuer Daueraudits

Im ersten aktiven Arbeitsblock nach sicherem Kandidatenabschluss einen auf vorhandene Belege gestützten Restabgleich durchführen; Richtwert höchstens 60 Minuten aktive Planungsarbeit. Keine neue Gesamtauditserie.

Für jede der 26 noch nicht DONE markierten Scope-IDs in der bestehenden Matrix festhalten: konkret fehlendes Akzeptanzkriterium; bereits nutzbarer Code/Beleg; Art der nächsten Arbeit (Implementierung, gezielte Verifikation oder externe Voraussetzung); Abhängigkeit; verantwortlicher Akteur; nächster ausführbarer Schritt; begründete Restaufwandsspanne, ansonsten UNKNOWN. Die 15 DONE-Scopes bleiben abgeschlossen, sofern kein neuer konkreter Fehler vorliegt. Paketanzahl ist kein Zeitmaß.

Verfügbare tatsächliche aktive Entwicklungszeit und Runner-/Kontingentgrenzen abgleichen. Kritischen Pfad und mindestens 20 Prozent Planungsreserve für Befunde und finale Abnahmen berücksichtigen. Ohne belegbare Kapazität keinen belastbaren Wochentermin behaupten. Wenn Restarbeit, verbindliche Testphasen und Reserve das verfügbare Fenster überschreiten oder notwendige externe Voraussetzungen fehlen, **sofort konkrete Terminrisiken melden**, nicht erst am siebten Tag. Weiter die sicher ausführbare Arbeit erledigen; weder pauschal aufgeben noch den Umfang heimlich reduzieren.

## 4. Vollständige Zuordnung der offenen Scopes zu Abschlussbündeln

Diese Gruppierung steuert die Reihenfolge, nicht die Statuszählung. Jedes Paket wird nur in der kanonischen Matrix als DONE/PARTIAL/VERIFY/BLOCKED_EXTERNAL/PLANNED gepflegt. Ein Bündel kann mehrere getrennte risikoabhängige Kandidaten erfordern.

| Bündel | Bestehende Scope-IDs | Gemeinsames Abschlussziel / Grenze |
| --- | --- | --- |
| A – Abschlussprozess beschleunigen | P-CI-B, P-CI-C | Unveränderte Tests besser verteilen, anschließend Liveprüfungen sicher parallelisieren, sofern der gemessene Nutzen die einmalige Umsetzung rechtfertigt. Kein monatelanges Infrastrukturprojekt. |
| B – Kernverwaltung und Wiederherstellung | K3, K4, K6-DELTA, K6-A11Y, K6-TRUST | Normale Nutzerabläufe und konkret verbliebene UI-/Recovery-/Hinweislücken abschließen; aktuellen Reset/Restore-Schnitt wiederverwenden. Reale Bedienungsbelege mit Bündel G koordinieren. |
| C – Import, Finanzen und Kursversorgung | K1, K2-FIN, K2-KURSE, K2-ETH | Bestehende fünf Anbieter und Finanz-/Kursketten gegen unabhängige Original-/Sollbelege abschließen; nur bestätigte Restlücken implementieren. |
| D – Gerätesynchronisierung | N-DRIVE, E-OAUTH | FLH04 als echtes eigenes Produktpaket: revisionsgebundene E2EE, Konflikt-/Offline-/Recoverymodell, Transport, UI, echte autorisierte Zwei-Geräte-/OAuth-Abnahme. Backup nicht als Synchronisierung ausgeben. |
| E – Komfort und Projektionen | UI-R4, N-UI-PLUS, N-PROJ, N-OTHER | Bereits beauftragte Kleinstbestandsanzeige, Allokation/Navigation, Zukunftsszenarien und konkret spezifizierte historische Restanforderungen. Unentschiedene Schwellen/Scoreformeln nicht erfinden. |
| F – Weitere Finanz-, Broker- und Walletfälle | N-FX, N-BROKER, N-WALLET, N-AT, N-CASHLIEU | Vorhandene, fachlich abgegrenzte Fälle anhand konkreter Originale und unabhängiger Sollwerte vollständig umsetzen/abnehmen. Fehlende Belege oder fachliche Entscheidungen sofort konkret benennen. Keine universelle Unterstützung aus Einzelbeispielen ableiten. |
| G – Reale Plattform- und Sicherheitsabnahmen | K5, E-SAFARI, E-TALKBACK, N-CSP | Android A01–A10, tatsächliches Safari/iOS und TalkBack; konkrete Sicherheitsmängel beheben. CSP nur mit belegtem Nutzen und ohne Funktionsverlust härten. Kein Testersatz durch Browseremulation oder bloßen Score. |

Die 15 bestehenden DONE-Scopes (D-IMPORT, D-FX299, D-UI275, D-UI291, D-UI297, D-WH, D-ETH260, D-AT02, D-AT03, D-AT05, D-STORAGE, UI-R1, UI-R2, UI-R3, P-CI-A) werden nicht neu entwickelt. 15 erhaltene Abschlüsse + 26 explizit zugeordnete offene Scopes = vollständiger 41-Scope-Umfang.

## 5. Sofort geltende Effizienzregeln

**Paketgröße und Freeze.** Vor dem nächsten Kandidaten 2–4 eng zusammengehörige, überprüfbare Änderungen zu einem vollständigen Nutzerablauf bündeln. Ein gemeinsamer Vertrag mit Einzelkriterien und Rücknahmegrenze; keine Mini-Releases pro Beschriftung. Finanz-, Speicher-, Kryptografie-, Sync- und Workflowänderungen nicht künstlich zu einem riskanten Wochen-Megakandidaten vermischen. Während Implementierung gerichtete Repros, Negativfälle, unabhängige Oracles, Units und Syntax. Erst vollständigen Kandidaten einfrieren, dann die vorgeschriebene finale CI. Ein echter kritischer Fehler rechtfertigt einen eigenen kleinen Release.

**Weniger Wiederholungen, nicht weniger Pflichtprüfungen.** Bereits qualifizierte Aussagen nur bei identischem relevantem Code, Testmanifest, Workflow, Build, Abhängigkeiten, Konfiguration und fehlender transitiver Änderung wiederverwenden. Neue Kandidaten-/Main-/Produktionsgates bleiben vollständig. Keine gleiche Vollprüfung zusätzlich aus Gewohnheit; keine pauschale Freigabe allein aus gleichem Tree oder grünem Gesamtstatus. Geänderter Testcode zählt ebenfalls als neue prüfpflichtige Aussage.

**Auswertung einmalig und maschinell unterstützt.** Bestehenden Ergebnisverdichter verwenden; erwartete Berichte/Engines/Tests, SHA/Tree/Run/Versuch, Digests und explizite Fehler-/UNKNOWN-Felder vollständig zuordnen. Fehlender Bericht, falscher Digest/SHA, Fehlerflag, unerwarteter Skip oder fehlende Engine dürfen nicht grün werden. Erst Zusammenfassung lesen, dann neue/geänderte fachliche Belege, Befunde und unbekannte Kontexte gezielt prüfen. Alle vorgeschriebenen Originale und visuellen Nachweise bleiben verfügbar; PNG-Decodierbarkeit/CRC ist keine visuelle Abnahme. Kein neuer Dashboard-/Testframeworkumbau.

**Sicherungen bündeln.** Neue Originale pro vorgeschriebener PR- bzw. Release-Sicherungsphase gemeinsam unveränderlich speichern; keine zusätzliche Vollsicherung für jeden Zwischenkommentar. Unveränderte gesicherte Payloads referenzieren statt mehrfach übertragen, soweit der bestehende Vertrag das zulässt. Versionsschutz, vollständige Originalkette, gepinntes Byte-Readback und tatsächlicher erforderlicher inkrementeller Restore bleiben zwingend. Keine neue Backup-Architektur und kein Verlust alter Fehleroriginale zur Platzersparnis.

**Kontext und Übergaben.** Einstieg über kurzen aktuellen Checkpointkopf, relevanten Diff, Status und Belegindex; historische Texte nur bei betroffener Abhängigkeit lesen. Einen aktuellen Status pflegen statt lange Releaseberichte mehrfach kopieren. Keine routinemäßige Agentenrotation nach einem Leseschritt oder einzelnen Release. Bei tatsächlich zunehmender Kontextlast rechtzeitig am sicheren Punkt HND01 abgeben, mit exakter nächster Aktion. Eine hängende Oberfläche beweist keine fehlende Schreibaktivität.

**Wartezeit produktiv nutzen, ohne zweiten Owner.** Derselbe Hauptagent darf während eingefrorener CI auf einem isolierten Arbeitsstand den nächsten belegbar unabhängigen Umfang vorbereiten und gezielt testen; höchstens ein eingefrorener Releasekandidat und ein vorbereiteter Folgeschnitt. Keine Änderungen an Kandidat A, Main oder gemeinsamem Zustand; keine zweite finale Full-CI/Integration parallel. Unklare Abhängigkeit bedeutet nur lesende Vorarbeit. Befunde und sichere Abnahme von A haben Vorrang; B vor eigener finaler Abnahme auf den tatsächlichen akzeptierten Stand beziehen und alle betroffenen Tests neu qualifizieren. Diese eng begrenzte organisatorische Erlaubnis ersetzt ein pauschales Untätigkeitsgebot, nicht den Kollisionsschutz.

**Kein wirkungsloses Polling.** Status gezielt und mit Abstand lesen; unveränderte umfangreiche Logs nicht erneut laden. Aktive Ausführung, GitHub-CI und bloß dokumentierter ACTIVE-Owner unterscheiden. Keine Hintergrundarbeit, automatische Wiederaufnahme oder Benachrichtigung behaupten, wenn kein entsprechender Mechanismus läuft. Die deaktivierten vier Automatisierungen bleiben deaktiviert.

## 6. Begrenzter technischer Beschleuniger A

Nach sicherem Abschluss des laufenden Produktkandidaten P-CI-B als eigenen eng begrenzten Kandidaten bevorzugt prüfen. Bestehende vollständige Aufrufe anhand realer Gruppendauern und Ressourcenabhängigkeiten umverteilen, vor allem Cross3 zu Cross2. Keine neue Testengine, keine Umstellung eigener .mjs-Suiten auf ein anderes Framework nur für Sharding. Testmanifest, Browser, Assertions, Fristen, Seeds, Artefakte und Sicherheitsgates erhalten. Vorher/Nachher über vorhandene und regulär notwendige vollständige Läufe; keine Duplikat-CI nur für Statistik. Vorhandene Anforderung von 2–3 geeigneten regulären Vergleichsläufen und eigenem belegtem Prüfvertrag bleibt erhalten.

Danach P-CI-C separat: Chromium und Firefox/WebKit nur bei nachgewiesener Isolation von Profilen, Ports, Seeds, Speicher, Produktzustand und Artefaktpfaden parallelisieren. Release-SHA/Tree/Assets müssen auf denselben unveränderten veröffentlichten Stand zeigen; ein zwingendes finales AND-Gate verlangt ALLE unveränderten Ergebnisse. Fehlende/abgebrochene Jobs dürfen nie durch einen grünen Teiljob ersetzt werden. Keine weiteren Main-Deployments während einer laufenden Produktionsabnahme. Runnerzeit und Netzlast mitmessen; Parallelisierung kann die aufsummierte Nutzung erhöhen.

Vor Umsetzung kurze Amortisationsrechnung: zusätzliche aktive Umsetzung/Prüfung gegen erwartete Einsparung bei den tatsächlich noch notwendigen Kandidaten. Richtwert maximal ein halber aktiver Entwicklungstag für den ersten kleinen Optimierungsschnitt; bei ausuferndem Umbau dokumentiert stoppen und Produktarbeit fortsetzen. Ein solcher Stopp schließt P-CI-B/C nicht als DONE. Ein getrennt reviewbarer Kandidat und bestehende konkrete Workflow-Freigabegrenzen bleiben erforderlich; dieser Plan ist keine Freigabe zum ungeprüften Workflow-Merge.

Technische Primärquellen: [GitHub Job-Matrizen](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations), [Cache-Grenzen und Identität](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching), [Artefakte versus Cache](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts). Sie belegen Mechanismen, keine bereits erreichte FolioLab-Ersparnis.

### 6.1 Geprüfte Ergänzungen zum nächsten Optimierungsschnitt

Der [geprüfte Maßnahmenkatalog im Effizienzplan](WORK_EFFICIENCY_PLAN_2026-11-01.md) konkretisiert diesen Zielplan, ohne neue Scope-IDs oder eine zweite Roadmap einzuführen.

- Vor Freeze bei betroffenen Abläufen nicht nur Fehler vor dem Commit, sondern auch nachgelagerte Vault-/Präferenz-/UI-Fehler prüfen. PR329 lieferte hierfür einen konkreten Korrekturanlass trotz erster grüner CI. Bestehende frühe Gegenproben nutzen; native finale Nachweise bleiben Pflicht.
- Neue Originalarchive einmal herunterladen und zugeordnet für Integritätsprüfung, bestehenden Verdichter, fachliche Detailprüfung und Sicherungsupload weiterverwenden. Gelerntes am selben verifizierten Satz erhalten. Gepinntes unabhängiges Sicherungs-Readback und tatsächlicher erforderlicher Restore bleiben erhalten; keine doppelte lokale Entpack-/Downloadarbeit aus Gewohnheit.
- Kleine ergänzende technische Optionen sind getrennte gelockte CI-Testwerkzeuge/npm-Downloadcache, exakt gepinnter Browser-Cache auch im Produktionsjob und angepasste Kompression PNG-lastiger Originalarchive. Im gelesenen Workflow fehlen der Produktions-Cache-Restore und eine explizite Upload-Kompressionsstufe; Testwerkzeuge werden mehrfach installiert. Noch keine Implementierung oder belegte Einsparung dieser Optionen.
- Zuerst den belegten P-CI-B-Engpass bearbeiten; eine kleine Installations-/Cache-/Kompressionsoption nur bei positiver Gesamtamortisation einschieben. P-CI-C weiter separat. Testaufbau-Wiederverwendung nur nach Messung; keine Browserpool-/Framework-Neuentwicklung. In der begrenzten PWA-/Recovery-Stichprobe kein pauschales `waitForTimeout` gefunden: keine vorhandenen 30-s-Fehlerwächter oder fachlichen Ereignistimer zur vermeintlichen Beschleunigung entfernen.
- Pro Schnitt tatsächliche aktive Arbeit, Installation, Test, Archivierung/Übertragung, Cache-Hit, Workflow-Wandzeit und summierte Jobzeit auseinanderhalten. Identische Dateien, Pflichtmanifest/Engines/Assertions/Fristen, Fehleroriginale und alle Sicherungs-/Restoreverträge erhalten. Bestehende reguläre Vergleichsläufe nutzen; das halbtägige Gesamtbudget wird durch diese Optionen nicht vervielfacht.

Diese Ergänzung verändert keinen laufenden Kandidaten, Mainlauf oder Owner. Am nächsten sicheren Punkt durch den bestehenden Hauptagenten übernehmen. Die bisherigen konkreten Workflow-Freigabegrenzen gelten weiter; der aktuelle Auftrag autorisiert die Planfortschreibung, keinen ungeprüften Workflow-Merge. Details, Prüfbefunde und Abnahmekriterien nur im verlinkten Effizienzplan pflegen.

### 6.2 Geprüfte Copilot-Ergänzungen: frühe Auswertung und eindeutige Regeln

Die [Gegenprüfung mit Quellen, Entscheidungen und Abnahmekriterien](WORK_EFFICIENCY_PLAN_2026-11-01.md) ergänzt den bestehenden Belegablauf und P-CI-B/C; keine neuen Scope-IDs.

- **Hohe organisatorische Priorität:** Bereits fertig hochgeladene Jobartefakte während der übrigen Laufzeit einmal zugeordnet vorprüfen. Früher Download eines354Byte-Artefakts aus dem noch laufenden Mainlauf43023136886 wurde einschließlich Digest/Größe/ZIP-CRC tatsächlich bestätigt; übrige Originale und Zeitgewinn sind dadurch nicht qualifiziert. Keine neue Polling-/Watcherstruktur, kein Teil-PASS als Gesamtfreigabe. Vollständige Abschlussmatrix, Originale, Sicht-/Fachprüfung sowie dauerhafte Sicherung/Readback/Restore bleiben Pflicht. Erste zusätzliche Einrichtung höchstens30aktive Minuten im bestehenden Gesamtbudget.
- **Niedrige bedingte technische Priorität:** Releaseübergreifende Verdichter-Sollvorbereitung und genau ein wiederkehrender Diagnostikadapter nur bei gemessenem manuellen Aufwand und positiver Amortisation. Statische Pfadableitung ist kein unabhängiges fachliches Oracle; dynamische Berichte bleiben explizit ungeklärt. Erste Umsetzung höchstens60aktive Minuten im Gesamtbudget, keine automatische PASS-Erklärung und keine reine UNKNOWN-Zahl als Erfolg.
- **Zurückgestellt, nicht aktiviert:** Finale PR-CI von B parallel zu Main/Live von A bleibt eine offene Prozessentscheidung; aktuelle Ein-Kandidaten-/keine-zweite-finale-CI-Grenze gilt weiter. Runnerlast, Betreuungsaufwand, Auswirkungen eines A-Befunds und Nettozeit sind erst begrenzt zu prüfen. Kein B-Merge/Deployment oder parallele private Sicherung während A-Abnahme.
- **Zurückgestellt:** Neue Draft-Stufe TARGETED mit Impactgraph ist eine prüfpflichtige Änderung der Testauswahl, kein kostenloser organisatorischer Ersatz. Bereits geplante breitere Impactzuordnung nicht doppelt beauftragen. Erst nach belegtem Bedarf/Kosten-Nutzen und konkretem konservativem Prüfvertrag erwägen; nicht zwingend mit Sharding vermischen. Alle finalen Pflichtmanifeste und bisherige FAST-Grenzen erhalten.
- **Redaktionell erledigt:** Historische QA-/Rotationsabschnitte im Effizienzplan ausdrücklich markiert; abgelehnten PR329-Snapshot oben als abgelöst gekennzeichnet. Keine Wiederholung alter Übergabepflichten oder Freigabe aus Snapshot-SHAs.

Für die beiden zurückgestellten Optionen höchstens jeweils30Minuten aktive Vorprüfung bei konkretem Bedarf; zusammen mit allen anderen neuen Optimierungen innerhalb des vorhandenen halbtägigen Gesamtbudgets. Keine Zusatz-CI nur für Statistik, keine gekürzte Mainprüfung, keine ungemessene Zeitgarantie. Der bestehende Hauptagent übernimmt geeignete organisatorische Ergänzungen am sicheren Punkt; diese Planfortschreibung übernimmt keine HND01-Verantwortung und ändert keine laufende Ausführung.

## 7. Externe Voraussetzungen ab Tag 1, nicht erst vor Veröffentlichung

Vorhandene private Originale und autorisierte Nachweise zuerst gezielt wiederverwenden. Fehlende Voraussetzungen in EINER kompakten Liste mit Scope, konkret benötigtem Beleg, Zuständigem und spätestem Bereitstellungspunkt sammeln. Keine pauschale erneute Anforderung aller bereits gelieferten Dateien.

- K1/C/F: tatsächlich fehlende unabhängige Anfangs-/Endbestände, Eigentumszuordnungen sowie konkrete Broker-/FX-/Steuer-/Kapitalmaßnahmen-/Staking-Originalklassen. Keine persönlichen Werte oder Locators öffentlich veröffentlichen.
- D: nutzbarer autorisierter OAuth-/Betreiberaufbau, Produkt-Origin, zwei reale Geräte/Profile, Passwort-/Recovery-/Konfliktabläufe. [Issue160](https://github.com/joke0071/foliolab-open/issues/160) verlangt vor produktivem Sync weiterhin den konkreten reviewbaren Kandidaten, bestandene Gates und die notwendige ausdrückliche Nutzerfreigabe. Kein stilles Last-Write-Wins, keine angenommene Remote-CAS-Garantie, kein Connector-Token in der App.
- G: reales Android mit dokumentierter Version, Safari/iOS und TalkBack sowie synthetische Testdaten. Gefährliche Speicherlösch-/Evictionversuche nicht am einzigen Privatportfolio durchführen.
- E/F: noch unentschiedene Produktparameter und fachliche Anforderungen ausdrücklich klären; 0,01-EUR-Dustgrenze oder PORT-COMP-Score sind nicht durch diesen Terminauftrag entschieden. Rechtliche/fachliche externe Abnahmen nicht durch Entwicklerbehauptung ersetzen.

Diese Voraussetzungen möglichst im ersten Tagesfenster beschaffen/terminieren. Was nicht verfügbar ist, bleibt mit konkretem Einfluss auf den Gesamttermin sichtbar. Unabhängige Codearbeit weiterführen, aber weder externe Blockade noch sichere Ablehnung als vollständig implementierte Anforderung zählen.

## 8. Sieben-Tage-Zielpfad und Entscheidungspunkte

Zeitfenster jeweils ab 12:31 MEZ. Dies ist die angestrebte Reihenfolge unter offenen Kapazitätsannahmen, keine bereits belegte Aufwandsschätzung. Externe Abnahmen und Vorbereitung laufen ab Tag 1 begleitend; nur ein Produktowner schreibt.

| Fenster | Schwerpunkt | Nachweis am Ende / Entscheidung |
| --- | --- | --- |
| 11.–12.11. | Laufenden PR329 sicher abschließen; einmaliger Rest-/Kapazitätsabgleich; externe Voraussetzungen konkret anfordern; kleinen P-CI-B-Vertrag und FLH04-Entscheidungsgrundlage vorbereiten. | Kein verlorener laufender Kandidat; alle 26 offenen IDs haben ausführbare nächste Aktion oder benannten Blocker. Wochen-Machbarkeit und kritischer Pfad erstmals belegt oder ausdrücklich als gefährdet gemeldet. |
| 12.–13.11. | B/C: noch fehlende normale Verwaltung, Recovery und Import-/Finanz-/Kursgegenproben bündeln; P-CI-B nur bei positivem Nutzen getrennt qualifizieren. | Größere fachliche Abschlusskriterien statt neuer Mikroversionen; unabhängige Sollwerte und unveränderte Gates. |
| 13.–14.11. | D: vorhandenen Syncvertrag konkretisieren, pure Revisions-/Konflikt-/E2EE-Modelle und Negativtests; OAuth-/Zwei-Geräte-Voraussetzungen müssen geklärt sein. | Keine bloße Backup-Sync-Umbenennung. Fehlende Voraussetzungen oder nicht tragfähiger Restaufwand sofort als Terminrisiko ausweisen. |
| 14.–15.11. | D: Transport, UI, Offline-/Konflikt-/Recoverypfade zum vollständigen Kandidaten; G-Geräteprüfungen und B/C-Restbelege. | Echte autorisierte End-to-End-Abnahme vorbereitet bzw. durchgeführt; Produktfreigabe nur nach allen Gates. |
| 15.–16.11. | E und verfügbare F-Fälle in fachlich getrennten Kandidaten abschließen; P-CI-C nur nach qualifiziertem B und kurzer Amortisation. | Keine unentschiedenen Funktionen erfinden; Vollumfang gegenüber Scope-IDs nachweisen, verbleibende Restarbeit quantifizieren. |
| 16.–17.11. | F/G-Abschluss, Cross-Feature-Regression, reale Plattform-/Originalabnahmen, Fehlerkorrektur. | Spätestens jetzt stabiler Gesamtkandidat; kein neuer optionaler Scope. Fehlende reale Nachweise bleiben offene Terminabweichungen. |
| 17.–18.11. | Reserve: finale vorgeschriebene Regression, Produktionsabnahme, vollständige Sicherung/Readback/Restore und Abschlussmatrix. | Bis 18.11., 12:31: nur tatsächlich abgeschlossene Scopes DONE; alle übrigen mit exakter Restarbeit, fehlender Voraussetzung und realistischer nächster Entscheidung. Kein künstliches 41/41. |

Die Zeitzuordnung wird nach dem einmaligen Restaufwandsabgleich innerhalb dieses Fensters optimiert. Das Verschieben eines Pakets aus der Woche ist eine sichtbare Zielabweichung, nicht stilles Re-Parking. Das Wochenziel setzt aktive ausführbare Arbeit voraus; mit deaktivierten Automatisierungen gibt es keinen belegten 24/7-Agentenbetrieb.

## 9. Minimaler Fortschrittsnachweis und Fertigdefinition

Bei regulären sicheren Meilensteinen eine kurze Zeile: abgeschlossene Akzeptanzkriterien/Scope-IDs; neu geschlossene statt nur erneut geprüfte Restpunkte; Kandidat/Run; aktive Umsetzungs-/Auswertungs-/Sicherungszeit soweit tatsächlich gemessen; CI-Wandzeit/Jobzeit getrennt; Blocker; genau nächste Aktion. Ein täglicher Soll-Ist-Eintrag wird während tatsächlich aktiver Arbeit gepflegt, ohne neue zeitgesteuerte Aufgabe einzurichten.

DONE erfordert den zugesagten vollständigen Fachumfang, tatsächliche Pflicht- und externe Nachweise, qualifizierten relevanten Release, verifizierte Sicherung/Restore sowie keine offenen kritischen Produkt-/Finanz-/Datenverlustbefunde. Vorhandene abgenommene Teilumfänge können wiederverwendet werden; ein Gesamtpaket wird dadurch nicht automatisch fertig. Implementiert aber extern ungeprüft bleibt entsprechend PARTIAL/BLOCKED_EXTERNAL.

Keine aus Releasezahl oder gleichgewichteten Issuezahlen erfundenen Fortschrittsprozente. Erfolg ist mehr belegter fachlicher Abschluss pro aktiver Arbeitszeit, nicht mehr Versionsnummern, Screenshots, Dokumente oder Agentenwechsel.

## 10. Unveränderte Schutzverträge

Sämtliche bestehenden Finanz-/Decimal-/UNKNOWN-FX-/Journal-/Quellidentitäts-/Bestands-/CAS-/Mehrtab-/IndexedDB-/Offline-/PWA-/Backup-/Restore-/Kryptografie-/Datenschutz-/CI-/Main-/Produktionsschutzverträge gelten fort. Keine Secrets/Originalportfolios veröffentlichen, kein stilles FX=1, keine unbekannte Gebühr=0, keine destructive Migration/Installationsänderung oder ungeprüfte Syncfreigabe. Keine Testauslassung, Timeoutlockerung, blinde Snapshot-Anpassung oder Retry-zum-Grün. Vollständige Fehleroriginale erhalten. Keine zusätzlichen kostenpflichtigen Credit-/API-/Tarifkäufe.

GitHub ausschließlich über das verbundene Plugin. Mutationen mit frischem Zustand, eindeutigem Owner und erwarteter Zielidentität absichern. Checkpointbranch niemals vollständig nach Main mergen. Reine Planung auf der Checkpointref erzeugt keine neue Produkt-CI. Ungeklärte Sicherheitsbefunde haben Vorrang vor dem Datum.

**Sofortiger Auftrag an den bestehenden Hauptagenten:** aktuellen Kandidaten sicher abschließen, diesen Nachtrag verlinken, kurzen Rest-/Kapazitätsabgleich und externen Entscheidungsplan erstellen, belegten CI-B-Engpass begrenzt vorziehen und anschließend fachliche Abschlussbündel statt Mikropatches abarbeiten. Keine neue Übernahme oder Automatisierung zur Anwendung dieses Plans erforderlich.
