# FolioLab – aktiver Effizienzplan

## Aktive Prozessregeln

**Fortschreibung 12.11.2026, Nutzeraufträge 17:12 und 17:52 MEZ:** Effizienz und Stabilität gemeinsam verbessern; keine pauschale Prozentgewichtung. Maßstab ist das sicher vollständig abgenommene Nutzerergebnis, nicht die Anzahl von Änderungen, Commits, Tests oder Releases. Diese organisatorische Fortschreibung ändert keine Produkt-, Workflow-, Test-, Sicherungs- oder Freigabelogik und übernimmt keine HND01-Zuständigkeit. Der laufende eingefrorene Release wird nicht umgeplant.

**Einstieg und Quellen:** frischen [Checkpointkopf](WORK_RESTPAKETE_CHECKPOINT.md) und nur die für dessen nächste Aktion relevanten Deltas lesen. Owner/SHAs/Releasezustand ausschließlich dort; Scope-Status ausschließlich in der [kanonischen Roadmap](KONSOLIDIERTE_ROADMAP.md), Prioritäten und vollständiger Wochenumfang im [Wochenplan](EFF03_WEEK_TARGET_2026-11-11.md). Dieser Einstieg ist für organisatorische Widersprüche maßgeblich. Keine zweite Roadmap und keine neue Gesamtinventur.

**Ein alleiniger HND01-Owner:** vor Übernahmen und kritischen Schreib-/Freigabe-/Sicherungsaktionen die einschlägigen Owner-, Main-, Ref-, PR-, Review-, Kommentar-, Actions- und Sicherungsstände frisch abgleichen. Erwartete Ziel-/Datei-SHAs schützen, Ergebnisse rücklesen; bei Konflikt zuerst den neuen Stand prüfen, niemals fremde Änderungen überschreiben. Ein ACTIVE-Eintrag beweist keinen laufenden Chat; eine hängende Oberfläche beweist keinen STOP. Keine feste Chatrotation, separate QA-Agentenpflicht, neue Automation oder automatische Modell-/Kontingentumschaltung. Historische Gegenprüfungen und unabhängige maschinelle Oracles bleiben erhalten.

<a id="aktive-präzisierung-bündelung-mit-kurzen-zwischenständen--11112026"></a>

### Paketgröße und Abschlussgrenze

**Ein Paket ist der kleinste fachlich vollständige, sinnvoll abnehmbare Nutzerablauf.** Vorzugsweise 2–4 eng zusammengehörige Änderungen sind ein Richtwert, weder Mindestfüllung noch Obergrenze. Keine zusätzlichen Zahlenregeln je UI-/Finanz-/Speichertyp, keine Datei-/Zeilen-/Promptgrenze. Fertige unabhängige Nutzerabläufe nicht nachträglich zu größeren Freigabestapeln sammeln, nur um Releasekosten zu verteilen. Ein einzelner vollständiger Fix darf regulär abgeschlossen werden; ein P0/P1-Fehler hat Vorrang, aber erhält dieselben vorgeschriebenen Sicherheitsgates.

Zusammenführen nur bei gemeinsamem Ziel, zusammenhängendem Prüfvertrag und nachvollziehbarer sicherer Rücknahmegrenze. Notwendig zusammengehörige Finanz-/Speicher-/Kryptografie-/Syncschichten dürfen gemeinsam bearbeitet werden; unabhängige Risiken nicht künstlich vermischen. Vor Freeze teilen, wenn ein unabhängiger oder extern blockierter Teil den übrigen vollständigen Ablauf aufhält, die Fehlerzuordnung unklar wird oder keine gemeinsam beherrschbare Abnahme mehr möglich ist. Pflichtteile eines Ablaufs nicht auslagern, um scheinbar DONE zu erreichen. Externe Grenzen bleiben sichtbar; reiner Implementierungsstand ist keine Abnahme.

**Kleine Schritte innerhalb des Pakets:** gerichtete Repros, Negativfälle, Units und Syntax während der Umsetzung. An echten Wiederaufnahmepunkten im vorhandenen eigenen Checkpoint knapp Owner, Branch/SHA, geprüften Stand, offene Gates/Run-IDs, Sicherungsstand und nächste ausführbare Aktion sichern. Kein zusätzlicher Full-CI-/Release-/Vollsicherungszyklus je Zwischenstand und keine künstliche Sitzungsgrenze. Erst vollständigen Kandidaten einfrieren; danach keine kosmetischen Erweiterungen oder Prozessänderungen auf seine Ref. Ein notwendiger Fehlerfix wird als neue Revision mit Originalbefund und erneuter Qualifikation der betroffenen Aussagen behandelt.

### Vorhandene Funktionen zum Abschluss bringen

Am nächsten sicheren Priorisierungspunkt: bestätigte P0/P1-Fehler zuerst, danach bereits implementierte, mit vertretbarem Rest intern abschließbare Nutzerabläufe vor zusätzlichem Neubau oder optionaler Infrastruktur. Abhängigkeiten und Risiko mitberücksichtigen; nicht bloß leicht schließbare Zählpunkte sammeln. Der vollständige Wochenumfang einschließlich Folgepaketen bleibt beauftragt. Laufende Freeze-/Abnahmegrenzen bleiben bestehen.

Für den nächsten gewählten Scope im vorhandenen Taskvertrag nur vorhandenen Code/Abnahmebeleg, exakt fehlendes Kriterium und nächste Aktion abgleichen: **Implementierung, interne Verifikation oder externer Nachweis**. Bereits vorhandenen Restabgleich fortschreiben, keine neue Gesamtauditserie. PARTIAL/VERIFY bedeutet weder fehlender Code noch automatisch „fast fertig“. Fehlt nur ein Nachweis, diesen gezielt erbringen; Produktcode nur bei belegter Lücke ändern. Ist der genaue Umfang bereits vollständig gültig belegt, den vorhandenen Scope-/Issueabschluss nachführen statt einen künstlichen Produktcommit, SW-Bump oder Zusatzlauf auszulösen. Neue Änderungen behalten alle vorgeschriebenen Gates.

### Früh prüfen, ohne eine neue Vorabnahme zu bauen

Vor der Implementierung im bestehenden PR-/Taskvertrag kurz Ziel/Nichtziel, Risiko- und Commitgrenze, überprüfbare Erfolg-/Abbruch-/Fehlerfälle sowie notwendige Original-/Geräte-/Zugriffsvoraussetzungen festhalten. Vorhandene Kriterien weiterverwenden; kein neues Formularsystem. Bei Persistenz auch Fehler **nach** dem Commit prüfen: gespeicherter Zustand, Revision, Rückmeldung und Entwurf. Kein vollständiges Datenrollback behaupten, wenn der Commit bereits erfolgt ist.

Geänderte UI vor Freeze gezielt nativ ansehen: betroffene schmale/kurze Ansichten, lange Namen/große Werte/UNKNOWN, Fokus/Kontrast und asynchrone Details. Bestehende funktionsfähige Browserumgebung verwenden; höchstens 30 Minuten zusätzliche Einrichtung innerhalb des gemeinsamen Optimierungsbudgets. Fehlt sie, die konkrete Grenze nennen und den vorhandenen regulären CI-Weg verwenden, nicht endlos installieren. Quellen-/Syntaxprüfungen sind kein Browser-PASS. Keine neue TARGETED-Stufe, erweiterte FAST-Allowlist oder zusätzliche Full-CI allein als Vorprobe. Alle final vorgeschriebenen Sichten bleiben Pflicht.

### Übernahmefähigkeit vor Umgebungswechsel

Vor einer beabsichtigten technischen Vollübernahme einmal prüfen, ob die für den nächsten Abschnitt tatsächlich nötigen Fähigkeiten verfügbar sind: verbundener GitHub-Zugriff, ausführbare benötigte Tests sowie bei anstehendem Abschluss der bestehende private Versions-/Readback-/Restoreweg. Vorhandene aktuelle Fähigkeitsnachweise nutzen; kein Probe-Release, keine Testmutation privater Daten, keine erneute Komplettsicherung zur Zugriffsprobe. Ungeprüfte Schreib-/Restorefähigkeit bleibt ausdrücklich ungeprüft.

Fehlende Fähigkeiten als konkrete Grenze dokumentieren, nicht erst am Releaseende entdecken oder durch einen Ownertext als vorhanden erklären. Soweit autorisiert, sichere isolierte Vorarbeit ermöglichen; vollständige technische Übernahme erst nach geklärter Zuständigkeit und erforderlichen Zugriffen behaupten. Keine Konten-/Cloud-/OAuth-Neueinrichtung oder Tokenweitergabe als vermeintliche Prozessoptimierung. Externe Android-/Safari-/TalkBack-/OAuth-/Zweigeräte-/Originalnachweise früh gebündelt mit Teststand, Aktion, Sollnachweis und Zuständigkeit vorbereiten; Drive-Backup ist kein Sync-PASS.

### Entwicklung, interne Abnahme und externe Nachweise getrennt

Bei der nächsten regulären Bearbeitung in der **bestehenden Scope-Zeile bzw. ihrem Belegindex** drei Aussagen getrennt führen: Implementierung vollständig/Rest/UNKNOWN; interne Pflichtabnahme bestanden/offen/fehlgeschlagen; externe Nachweise erbracht/ausstehend/nicht erforderlich laut Vertrag. Jede Aussage benötigt Beleg oder konkrete Grenze. Das sind keine neuen Scope-IDs oder Ersatzstatus: DONE bleibt an sämtliche Kriterien gebunden; kein pauschaler Prozentwert aus Teilstatus.

Im vorhandenen externen Protokoll Gerät-/Account-/Originalzugang von der tatsächlich fehlenden Durchführung unterscheiden; Teststand, konkrete Nutzeraktion, Sollnachweis und Zuständigkeit einmal verlinken. Vorhandenes Android ist kein fehlendes Gerät, aber auch kein Test-PASS. Fehlende Geräteabnahme blockiert nur nachweislich davon abhängige Zusagen/Freigaben; unabhängige sichere Entwicklung und Abschlüsse dürfen weitergehen. Pflichtprüfungen nicht nachträglich auslagern. Insbesondere N-DRIVE nicht als „nur extern offen“ führen, solange Sync-Implementierung oder interne Konflikt-/Recoveryprüfungen fehlen.

Statusberichte trennen Code-Rest, interne Abnahme und externe Wartebedingung. Gleichgewichtete Scope-Abschlussquoten sind keine Aufwands- oder Terminprognose; kein Wechsel zwischen 1.0- und Gesamtumfang ohne Kennzeichnung. Termine nur aus konkretem Rest, Kapazität und Abhängigkeiten ableiten, andernfalls UNKNOWN.

### Prüfung, Originale und Wiederaufnahme

**Unveränderte Pflichtgates:** vorgeschriebene PR-/Wallet-/Main-/Deployment-/tatsächliche Produktionsprüfung in allen benötigten Engines, gewöhnliches TLS, Asset-/SW-/PWA-/Offline-/IDB-/CAS-/Quota-/Finanz-/Decimal-/Journal-/UNKNOWN-FX-/Identitäts-/Datenschutz-/A11y-Verträge, unabhängige Fach-/Sichtprüfung, unveränderliche Originalsicherung, Versionsschutz, gepinntes Byte-Readback und tatsächlicher erforderlicher Restore. Keine Assertion-/Fristlockerung, stillen Skips oder Freigabe aus Teil-PASS. Allgemeiner historischer Datenschutz-Audit bleibt gemäß bestehender Nutzerentscheidung optional; konkrete bestätigte Vorfälle bleiben verbindlich.

Maximal ein eingefrorener Kandidat plus ein isoliert vorbereiteter Folgeschnitt desselben Hauptowners. Keine zweite finale Full-CI/Integration oder paralleles Deployment. Während CI nur belegbar unabhängige Folgevorbereitung; nach Befunden an A dessen sicheren Abschluss priorisieren und B gegen den tatsächlich akzeptierten Stand neu abgleichen.

Neue Originale einmal identitätsgebunden herunterladen und für Integritätsprüfung, vorhandenen Verdichter, fachliche/visuelle Detailprüfung und Sicherung weiterverwenden. Fertige Jobartefakte bei ohnehin nötiger Statusabfrage früh vorprüfen; künftige Gesamtbelege sichtbar PENDING lassen. Run/Job/Versuch, HEAD/Tree, Workflow-/Testmanifest, Browser/Toolstand, Artefakt-ID/Digest/Größe und Inhaltsqualifikation zusammen erhalten. Keine Auswahl allein nach Name oder „latest“, keine Sollwerte aus den zu prüfenden Istwerten ableiten. PNG-Decodierbarkeit ist keine Sichtprüfung; UNKNOWN bleibt UNKNOWN.

Nach Unterbrechung aus dem bestehenden Belegindex am **ersten tatsächlich offenen Schritt** fortsetzen. Übernommene Daten und Aussagen nach geltendem Identitäts-/Integritätsvertrag prüfen; nicht allein wegen Chatwechsel bereits vollständig qualifizierte identische Releases oder Restore-Schritte erneut ausführen. Wiederverwendung nur bei gleicher relevanter Code-/Test-/Workflow-/Build-/Dependency-/Konfigurationsaussage ohne transitiven Impact. Neue Kandidaten-, Main- und Produktionsgates bleiben vollständig. Lokale Bytes ersetzen niemals das unabhängige gepinnte Sicherungs-Readback oder den erforderlichen neuen Restore. Bei unklarem Ausgang einer Mutation zuerst deren tatsächliche Version/ID lesen, nicht blind nochmals schreiben.

### Infrastrukturfehler und sichere Stopps

Queue-/Setup-/Transportfehler, Produkt-/Assertionsfehler und noch ungeklärte Ursachen getrennt führen; ein erfolgreicher Neuabruf erklärt keinen alten 503/429-Fehler. Originale erhalten. Höchstens 15 Minuten zusätzliche aktive Erstdiagnose bis konkretem Befund/Zugriffsgrenze innerhalb des Gesamtbudgets; das ist weder Freigabe noch Abbruchfrist für laufende Tests. Danach sichere unabhängige Vorarbeit oder wiederaufnehmbaren Blockerstand herstellen, statt dieselbe unergiebige Diagnose zu wiederholen. Bei neuen Belegen gezielt weiterprüfen.

Keine blinden Retries, CI-Abbrüche oder Doppelstarts. Ein gezielter Wiederholungsweg benötigt den bestehenden konkreten Ursachen-/Prüfvertrag und getrennte Originalidentität; UNKNOWN nicht als nachgewiesen transient umetikettieren. Bei Statusbedarf in einer aktiven Sitzung gebündelt prüfen, bei langem unverändertem Incident seltener; keine automatische Hintergrundfortsetzung behaupten.

## Nächste Maßnahmen in bestehenden Paketen

| Priorität | Nächster sinnvoller Schritt | Entscheidungsgrenze |
| --- | --- | --- |
| Laufender Kandidat/Blocker | Bestehenden Prüf-/Diagnosevertrag am nächsten sicheren Punkt schließen oder begründet gesichert parken. | Kein Eingriff in Freeze, Owner oder laufende Tests; offene Fehler/Gates bleiben erhalten. |
| Nächster Produktabschluss | Bereits implementierten vollständigen Ablauf anhand des konkret fehlenden Kriteriums abschließen. | Bestehende Belege nutzen; kein Neubau allein aus offenem Issue, kein zusätzlicher Release nur für Statuspflege. |
| P-CI-B, bedingt | Verbleibenden Zusatzaufwand gegen erwartete Verkürzung des gesamten Pflichtwegs prüfen; nur den begrenzten Balancingkandidaten qualifizieren. | Keine dauerhafte Voraussetzung für unabhängige Produktarbeit. Eigener #229-Vertrag; alle Aufrufe/Engines/Assertions/Fristen/Artefakte erhalten. |
| P-CI-C, bedingt | Nur bei nachgewiesen relevantem verbleibendem Produktionsengpass gesondert bewerten. | Kein automatischer Folgeumbau. Nettonutzen, isolierte Profile/Ports/Seeds/Speicher-/Artefaktpfade, gleicher ausgelieferter SHA und Gesamt-AND-Gate erforderlich. |
| Externe Abnahmen | Vorhandene A01–A10-/TalkBack-/OAuth-/Zweigeräteprotokolle gebündelt mit ausführbarer Nutzeraktion verlinken. | Höchstens 30 Minuten zusätzliche Vorbereitung im Gesamtbudget; Entwicklungsrest separat, keine Pflichtgrenze wegdefinieren. |

**Optimierungen müssen sich lohnen:** gemeinsame bestehende Aufwandgrenze von höchstens einem halben aktiven Entwicklungstag für den ersten kleinen Optimierungsschnitt, nicht erneut je Idee oder Tabelle. Vor technischem Umbau erwartete Verringerung des tatsächlich blockierenden Gesamtwegs gegen Einrichtung, Qualifikation, Auswertung und neue Fehlerrisiken abwägen. Keine scheinpräzise Prozentgewichtung von Effizienz/Stabilität. Bei fehlender plausibler Amortisation oder wachsendem Umbau dokumentiert zurückstellen und Produktarbeit fortsetzen; der Scope bleibt offen, nicht DONE.

Bereits verbrauchter Diagnose-/Einrichtungsaufwand zählt weiter; Chatwechsel oder neue Teilideen erneuern das Budget nicht. Für weitere optionale Arbeit den **verbleibenden** Aufwand und erwarteten Nutzen über die tatsächlich noch nötigen regulären Läufe getrennt nach aktiver Arbeit, Gesamtwandzeit und Runnerverbrauch abwägen. Bereits investierte Arbeit allein rechtfertigt keine Fortsetzung; kürzere Einzeljobs oder ein fehlgeschlagener Gesamtlauf sind kein Erfolgsbeleg.

Ist der Nettonutzen nicht plausibel oder das gemeinsame Budget ausgeschöpft, stellt der alleinige Hauptowner die Optimierung am sicheren Punkt mit Originalen, offener Ursache und Wiederaufnahmebedingung dokumentiert zurück; kein laufender Test wird deshalb abgebrochen. Erst nach eindeutigem Parkstatus des bisherigen aktiven Kandidaten darf der reguläre Folgekandidat dessen Platz übernehmen; keine zweite finale CI. Der ungeklärte Produkt-/Testbefund bleibt für alle betroffenen Kandidaten offen: weder Branchwechsel noch „CI-Optimierung geparkt“ erlaubt das Umgehen einer fehlgeschlagenen Pflichtprüfung. Neue belegte P0/P1-Fehler bleiben vorrangig.

Vorher/Nachher an 2–3 geeigneten **regulär ohnehin nötigen** Läufen beobachten; keine Statistik-Duplikate. Bei regulärem Paketabschluss kompakt Durchlauf-/CI-/Queue-/Produktionszeit, aktive Umsetzung/Auswertung/Sicherung soweit tatsächlich verfügbar, Korrekturen nach Freeze samt Ursache und erneute Prüfungen/Übergaben erfassen. Zeit bis zur sicheren Gesamtabnahme und Fehlervermeidung zählen, nicht nur ein kürzerer Einzeljob. Unterschiedliche Scopes/Umgebungen offenlegen; unbekannte Werte UNKNOWN, Runnerzeit nicht als Work-Credits ausgeben. Wiederholte paketbedingte Korrekturen sprechen für engere Abgrenzung, reine Infrastrukturprobleme beweisen keine falsche Paketgröße.

Cache/Kompression/Toolchain-/Verdichteranpassungen bleiben kleine **bedingte Optionen**, keine zusätzliche Pflichtserie. Vorhandene Implementierungen nicht neu bauen, keine generischen Frameworks/Browserpools/Watcherdienste. Versionsgebundene Cache-/Installationsverträge, unabhängige Sollmanifeste, negative Kontrollen und unveränderte fachliche Gates bleiben Voraussetzung. Konkrete Workflow-Mergefreigaben aus [#229](https://github.com/joke0071/foliolab-open/issues/229) gelten weiter; dieser Auftrag ist keine pauschale Pipelinefreigabe. Keine zusätzlichen kostenpflichtigen Käufe.

## Detailverträge und unveränderte Historie

Der vollständige vorherige Plan ist **bytegleich** als [Detailarchiv](WORK_EFFICIENCY_PLAN_ARCHIVE_2026-11-12_bf6248ee.md) erhalten: Originalblob `4b8bba4205a05022162dbe08c7e3b767a7ea6b67`, zusätzlich [unveränderlicher Originalstand](https://github.com/joke0071/foliolab-open/blob/bf6248ee79b8f8a660c21e849dedc657495c7ad0/docs/WORK_EFFICIENCY_PLAN_2026-11-01.md). Keine früheren Belege oder technischen Schutzverträge gelöscht. Das Archiv ist keine zweite aktive Prozessquelle: alte ACTIVE-Überschriften, Owners, Rotations-/QA-Pflichten und nächste Releases darin sind historisch. Nicht widersprechende technische Detailverträge gelten weiter und werden nur für die betroffene Aufgabe nachgeladen.

Weitergeltend: [Wochenplan mit Nutzeranforderungen und Maßnahmenkatalog](EFF03_WEEK_TARGET_2026-11-11.md), [Verdichtervertrag](EFF03_RESULT_DIGEST_2026-11-10.md), [Datenschutzentscheidung](PRIVACY_REVIEW_POLICY_2026-11-10.md), [kanonische Matrix](KONSOLIDIERTE_ROADMAP.md). GitHub ausschließlich über das verbundene Plugin; historischen Checkpointbranch niemals vollständig nach Main mergen. Dokumentation allein ist keine technische Optimierung, Releaseabnahme oder belegte Zeitersparnis.

<a id="eff03--copilot-gegenprüfung-geprüft-und-eingeordnet--11112026"></a>
<a id="eff03--geprüfte-zusätzliche-effizienzmaßnahmen--nutzerauftrag-11112026"></a>
<a id="eff03--ein-agenten-modell--verbindliche-nutzerentscheidung-11112026"></a>
<a id="eff03--zwei-agenten-modell--nutzerentscheidung-10112026"></a>
<a id="aktive-nutzerentscheidung-geplante-rotation--11112026"></a>

Frühere organisatorische Ergänzungen und Pilot-/Messnachweise stehen im verlinkten unveränderten Archiv; maßgeblich sind die aktiven Regeln oben. Keine Reaktivierung des beendeten Zwei-Agenten-/Rotationsversuchs. Fachliche Grundlage für kleine unabhängig prüfbare Einheiten und kurze Feedbackwege: [DORA – Working in small batches](https://dora.dev/capabilities/working-in-small-batches/); daraus werden weder starre FolioLab-Paketgrößen noch garantierte Einsparungen abgeleitet.
