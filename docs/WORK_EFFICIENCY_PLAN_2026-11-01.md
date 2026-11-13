# FolioLab – aktiver Effizienzplan

## Verbindlicher Nutzungsfokus und Vereinfachung · 13.11.2026

Neuester ausdrücklicher Nutzerauftrag: hauptsächlich persönliche Nutzung auf Windows mit Chrome UND Edge sowie Android; gleichzeitige geräteübergreifende Bearbeitung unwahrscheinlich; TalkBack nicht wichtig, Safari voraussichtlich ungenutzt. Diese fachliche Priorisierung ersetzt entgegenstehende ältere Pflichtzuordnungen für Safari/TalkBack im persönlichen Zielumfang. Vorhandene Daten-/Original-/Transaktions-/Reviewgates werden nicht durch eine Nutzungsannahme aufgehoben.

### Angenommene Leitplanken

- Zielplattformen: Windows Chrome, Windows Edge und Android Chrome/PWA. Android-Edge oder andere Browser erst bei konkretem Bedarf separat zuordnen. Ein Chromium-Linux-Lauf beweist keine tatsächliche Windows-/Android- oder installierte Edge-PWA-Abnahme.
- E-SAFARI und E-TALKBACK sind DEFERRED_USER: bewusst zurückgestellt, nicht erledigt und keine Blocker des persönlichen Zielumfangs. Historische Protokolle und Nachweise bleiben erhalten. Kein aktiver Gerätebeschaffungs-/TalkBack-Testauftrag.
- Semantisches HTML, bestehende Labels/ARIA, Tastaturbedienung, sichtbarer Fokus, Escape/Zurück, Fokus beim Öffnen/Schließen relevanter Dialoge, Touchziele und lesbare Fehler erhalten. Keine neue umfassende Screenreaderoptimierung; keine pauschale Entfernung vorhandener Bedienhilfen.
- Bestehende Vanilla-JS-Module und Ereignisse weiterverwenden; keine neue Custom-Reactivity-/Event-Bus-Abstraktion. CustomEvent/EventTarget für einfache UI-Benachrichtigungen bevorzugen, direkte Funktionsaufrufe für Fachbefehle/Ergebnisse zulassen. Nicht die gesamte App auf Events umbauen.
- Eventnamen und Datenumfang pro tatsächlich geänderter Schnittstelle knapp festhalten; Listenerlebensdauer sauber beenden. Events sind weder persistente Zustände noch Transaktionen oder Autorisierung. Benachrichtigung über gespeicherte Änderungen erst nach bestätigtem Commit. Kein Portfolio/Key/Credential als breit verteiltes Eventdetail.
- Keine CRDTs, Feldzusammenführung oder automatische Konfliktauflösung neu bauen. Bereits bestehende Revisions-/Konfliktregeln verwenden.

### Gerätewechsel statt automatischem Last Write Wins

Für den häufigsten Ablauf zuerst bestehendes verschlüsseltes Backup/Restore und ausdrücklich ausgelösten Gerätewechsel qualifizieren. N-DRIVE/E2EE-Autosync bleibt getrennt geparkt, soweit kein konkret notwendiger Teil eines aktuellen Datenverlustschutzes betroffen ist. Bestehende Implementierungen/Verträge erhalten; keine neue Synchronisierungsarchitektur in diesem Dokument freigeben.

Zeitstempel-LWW wird NICHT übernommen. Beispiel: Desktop und Android starten bei Revision R; Desktop bearbeitet und sichert R1, später bearbeitet Android seinen alten Stand R. Ein späterer Zeitstempel macht die Androiddaten nicht vollständiger. Uhrenabweichungen verschärfen das Problem. Fehlende Gleichzeitigkeit beseitigt diesen Konflikt nicht.

Für eine spätere komfortable Gerätewechseloperation gelten mindestens:
- Vorherigen lokalen Stand vollständig erhalten; Backup als eigene überprüfte Revision erhalten, keine stille Überschreibung des einzigen Originals.
- Quelle/Portfolioidentität, lokale Revision und vorhandene gemeinsame Basis prüfen, soweit vom bestehenden Vertrag tatsächlich getragen. Keine erfundene gemeinsame Basis.
- Änderungen auf beiden Seiten oder unklare Herkunft führen zu sichtbarem Konflikt. Beide Stände erhalten; Nutzer wählt einen vollständigen Stand nach Vorschau, keine Feldfusion.
- Atomarer lokaler CAS/Mehrtabschutz bleibt erforderlich, auch bei nur einem Gerät.
- Ohne sichere automatische Konflikterkennung beim expliziten bestehenden Import-/Restoreablauf bleiben. Nicht mit einem Zeitstempel eine neue Garantie vortäuschen.
- Neue Kryptografie, Writerautorität und aktive Sync benötigen weiterhin den unabhängigen Reviewabschluss. Vereinfachter Nutzungsablauf ersetzt ihn nicht.

### Fehler klar anzeigen, Wiederholung kontrollieren

Neue Netzwerkaktionen begrenzt und für den Nutzer nachvollziehbar halten. Bei abgelaufener Anmeldung unmittelbar Reconnect anbieten; lokale Bearbeitung und Daten erhalten. Bei sicher fehlgeschlagener Aktion ausdrückliche Wiederholung anbieten; keine unbegrenzten Hintergrundqueues oder Retryframeworks.

Bei möglicherweise bereits erfolgreichem Upload/Commit mit verlorener Antwort lautet der Zustand „Ergebnis unklar“ und wird zuerst anhand gespeicherter Daten/Dateiidentität geklärt. Kein blindes erneutes Anlegen, Löschen oder Verschlüsseln. Teilweise erfolgreicher Upload plus fehlgeschlagenes Cleanup darf nicht als vollständig fehlgeschlagener Upload dargestellt werden.

Vorhandener Mainstand a27cde2f: drive-backup.js nutzt CustomEvent('foliolab-drive-status'); POST-Upload maximal einen Versuch, GET/DELETE maximal drei begrenzte Versuche mit 400/800ms Pause; 401 fordert neue Anmeldung. Keine komplexe allgemeine Retryengine gefunden in diesem gezielt gelesenen Pfad. Diese bestehende einfache Logik nicht allein zur Erfüllung eines Slogans umbauen. Bestehende geplante Backups sind kein Auftrag zur neuen Syncqueue.

### Finanzimporte: belegte Standardfälle, sichere Ausnahmebehandlung

Vorhandene CSV-/Brokerparser wiederverwenden. Kein neuer allgemeiner PDF-Parser allein für die vorgeschlagene 80/20-Regel. „80 Prozent“ ist eine Zielheuristik, keine gemessene Abdeckung.

Kauf/Verkauf/Dividende nur in tatsächlich unterstützten und vollständig belegten Klassen automatisieren. Bekannte komplexe Fälle bleiben unverändert erhalten. Neue exotische Automatisierungen nachrangig behandeln.

Manuelle Eingabe oder Standard-CSV ist nur dann ein gültiger Ersatz, wenn der vorhandene Ablauf Mengen, Cash, Gebühren/Steuern, Kostenbasis, Datum, Herkunft und Rücknahme für den Fall korrekt ausdrücken kann. Barausgleich oder komplexe Steuerkorrektur nicht als normale Einzahlung/Kauf umetikettieren. Andernfalls klare Unsupported-Meldung und Originalerhalt; keine neue Spezial-UI ohne konkreten Bedarf.

### QA nach Auswirkung und eindeutigen Ausgangszuständen

Pro Fix zuerst genau den fehlenden Gegenfall und den passenden Erfolgsfall prüfen. Zusätzlich direkt betroffene Abhängigkeiten wählen: bei Parseränderung insbesondere gemeinsam verwendete Normalisierung, Duplikaterkennung, Journal/Bestand, Wiederimport und Undo/Restore soweit betroffen. „Nur ein Test“ ist keine ausreichende allgemeine Regel.

Vorhandene Originale und gültige unveränderte Nachweise wiederverwenden. Keine komplette E2E-Runde nach jedem Zwischencommit. Vor Integration/Release bleiben die für den tatsächlichen Änderungsscope erforderlichen Gates bestehen.

Für jeden neuen Test festhalten: SHA/Tree, Browser/OS/Profil, Neuinstallation oder Altbestand, DB-Version/Modusmarker/Revision, SW/Assetstand, Fixture und Sollwerte; bei OAuth nur Status/Accountrolle ohne Token. Nachbedingungen und Cleanup erfassen. Migrations-/Alttabfälle benötigen absichtlich definierte Altzustände; frische Profile ersetzen sie nicht.

Neue Prüfplanung konzentriert sich auf unterstützte Plattformen. Historische Firefox-/WebKit-/Safari-Fails bleiben historische Fails, erzeugen aber keine neue Safari-Featurearbeit im persönlichen Scope. Bestehende Workflowgates nicht still löschen: eine erforderliche CI-Matrixänderung als eigenen kleinen reviewbaren Kandidaten nach dem vorhandenen Freigabevertrag vorbereiten, inklusive Abbildung auf Chrome/Edge/Android. Dieser Dokumentationsschnitt verändert keinen Workflow.

Technischer Mechanismus, native Laufzeitabnahme, unabhängiger Kryptoreview und Fachbelege getrennt führen; sie müssen vor abhängiger Freigabe gemeinsam erfüllt sein. Compliance pauschal als externe Prüfung zu etikettieren ersetzt keine konkrete Anforderung.

### Sofortige Reihenfolge

1. Androidpaket als normale Android-Prüfung ohne TalkBack-Pflicht nutzen; vorhandene gültige Fixtures unverändert wiederverwenden. Windows Chrome UND Edge für tatsächliche Installations-/Datei-/Offline-/Bedienabläufe berücksichtigen.
2. Bestehendes manuelles verschlüsseltes Backup/Restore und bewussten Gerätewechsel vor neuer aktiver Synchronisierung priorisieren.
3. Fertige unabhängige Nutzerabläufe abschließen; Main-/Produktionsgate gesondert erhalten.
4. Renderer-Versuch43500770689 bleibt FAILURE/Timeout, Renderer T1/T2 ungeprüft. Keine Wiederholung. Weiteren Crashmechanismus nur für eine konkret freizugebende Speicher-/Recoveryänderung mit klarer Nachweislücke vorbereiten; keinen offenen Forschungsstrang zum allgemeinen Fortschrittsblocker machen.
5. Automatische Mehrgerätesync, Safari-/TalkBack-Spezialarbeit und neue exotische Parser bleiben nachrangig. Ein bestätigter Datenverlust-/Sicherheitsfehler im unterstützten Kern hat weiterhin Vorrang.

Primärgrundlagen: [MDN dispatchEvent](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) (synchroner Dispatch, kein Transaktionsersatz), [IDB complete](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event), [WAI Labels](https://www.w3.org/WAI/tutorials/forms/labels/) und [sichtbarer Fokus](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html). Keine neue rechtliche Konformitätsbehauptung.



### Wiederaufnahme blockierter Pakete · 13.11.2026

**Aktuelle Präzisierung aus den wiederholten Operatorfragen und Renderer43500770689.** Der vorhandene [Entsperrauftrag](EFF03_WEEK_TARGET_2026-11-11.md#blockierte-pakete-gezielt-freimachen--13112026) bleibt fachliche Referenz unter dem neuesten persönlichen Scope.

1. **Aktueller Zustand statt kopierter Historie.** Der Checkpoint enthält nur aktuellen Owner/Arbeitsstand, Freigaben, Wartestatus, nächste ausführbare Aktion, Schutzgates und gepinnte Historieverweise. Beim nächsten echten Wiederaufnahmepunkt diese Felder aktualisieren, nicht die gesamte alte Übergabe anhängen. Vor Kürzung muss der vollständige Vorgänger unter unveränderlichem Commit erreichbar bleiben. Historie gezielt bei fachlichem Bedarf lesen; alte ACTIVE-/NEXT-Angaben sind keine aktuelle Zuständigkeit. Keine starre Zeichen- oder Laufzeitgrenze.
2. **Fehlende Eingaben einmal festhalten.** OPERATOR_INPUT_PENDING für unbestätigte Windows-/Android-Testisolation und Versionen bleibt bestehen, bis neue Angaben vorliegen. Nicht bei jedem Chat nach allen Geräten fragen. Nur bei neuer, konkret notwendiger Abhängigkeit eine zusätzliche Frage stellen. TalkBack/Safari bleiben DEFERRED_USER.
3. **Eine aktive Aufgabe, eine konkrete Alternative.** Für den gewählten Scope im vorhandenen Checkpoint genau fehlendes Kriterium, vorhandenen Beleg, jetzt ausführbare Arbeit und Freigabegrenze führen. Ist nur externe Evidenz offen, diese parken und den nächsten unabhängig bearbeitbaren Scope gezielt prüfen. Keinen künstlichen Codepatch/Reviewbericht erzeugen. Fehlt bei allen konkret geprüften nächsten Kandidaten ausführbare Arbeit, begrenzte Lage samt benötigter Entscheidung melden statt endlos neue Kandidaten zu inventarisieren.
4. **Freigaben mit ihrem Gegenstand behandeln.** Quelle/Tree, Ausführungscommit, Trigger, Versuch/Höchstumfang und bereits erteilte Zustimmung gemeinsam im Kandidatenbeleg führen. Passende Zustimmung nicht erneut verlangen; verbrauchte Zustimmung nicht wiederverwenden. Lokales Lesen, Syntax und gerichtete Node-Regression innerhalb bestehender Autorisierung bleiben ohne allgemeine Neubestätigung erlaubt. Kein neues Freigaberegister oder Automationsdienst.
5. **Deltas begründen statt alles wiederholen.** Vorhandene Nachweise nur für unveränderte relevante Bytes, Voraussetzungen und Abhängigkeiten übernehmen. Je Änderung Gegenfall, Erfolgsfall und tatsächlich betroffene Schnittstellen wählen. Setup/Fixture/Adapteränderungen können frühere Aussagen ungültig machen. Alte Belege bleiben erhalten; kein Gesamt-PASS aus Einzelbelegen verschiedener Stände. Erst nach vollständigem Kandidaten vorgeschriebene Abschlussgates. Keine neue Ausführung durch diese Regel.
6. **Diagnose muss einen Abbruch überleben.** Bei der nächsten tatsächlich erforderlichen Änderung eines langen nativen Harnesses: begrenzte strukturierte BEGIN/STAGE/RESULT-Einträge pro Gruppe vom Host aus fortlaufend sichern; Fallkennung und letzte bestätigte Grenze vor riskantem Await erfassen. Fehlende Browserantwort nicht als erfolgreiches Ereignis schreiben. Kein vollständiges Portfolio/Token/Key/Stack. Cleanup getrennt vom fachlichen Ergebnis protokollieren; ein hängendes context.close darf nicht den bereits beobachteten Befund verdecken. Innerhalb bestehender Gesamtfrist ausreichende Zeit für Report und Cleanup planen, Fristen/Assertions nicht lockern. Logging und Instrumentierung offenlegen und lokal prüfen. Dies ist ein konkretes Kriterium für den nächsten erforderlichen Harnesspatch, kein Auftrag zur Wiederholung des geparkten Rendererexperiments.
7. **Dokumentationsabschluss mit tatsächlicher Umsetzung trennen.** Keine weitere generische Prozessrunde nach dieser Änderung. Nächste Arbeit muss ein konkretes Nutzerverhalten, fehlender fachlicher Nachweis oder nachweisbar erforderlicher Testmechanismus betreffen. Gerätepakete, vorhandenes Reviewpaket und Operatorfixtures wiederverwenden.
8. **Stabilität vor Laufdauer.** Bei wiederholter SHA-/Branchverwechslung oder verlorener Ergebniszuordnung Schreiben pausieren, betroffenen Stand gezielt rekonstruieren und bei unzuverlässiger Klärung übergeben. Gewöhnliche Testfehler und Paketabschlüsse erzwingen keinen Chatwechsel. Ein vollständiger frischer HND01-Einstieg, danach relevante Deltas/Lease vor Mutation; keine erneute Vollabgleichschleife ohne Anlass.

Erfolgsmessung nur an ohnehin nötiger Arbeit: wiederholte bereits beantwortete Eingabefragen, vermeidbare Re-Reads, ungeklärte Diagnoseabbrüche und tatsächlich geschlossene Kriterien knapp im bestehenden Abschlussbeleg erfassen. Keine Statistikläufe, keine behauptete Zeit-/Creditersparnis und keine Optimierung anhand von Commit-/Testzahlen.


## Aktive Prozessregeln

**Fortschreibung 12.11.2026, Nutzeraufträge 17:12 und 17:52 MEZ:** Effizienz und Stabilität gemeinsam verbessern; keine pauschale Prozentgewichtung. Maßstab ist das sicher vollständig abgenommene Nutzerergebnis, nicht die Anzahl von Änderungen, Commits, Tests oder Releases. Diese organisatorische Fortschreibung ändert keine Produkt-, Workflow-, Test-, Sicherungs- oder Freigabelogik und übernimmt keine HND01-Zuständigkeit. Der laufende eingefrorene Release wird nicht umgeplant.

**Einstieg und Quellen:** frischen [Checkpointkopf](WORK_RESTPAKETE_CHECKPOINT.md) und nur die für dessen nächste Aktion relevanten Deltas lesen. Owner/SHAs/Releasezustand ausschließlich dort; Scope-Status ausschließlich in der [kanonischen Roadmap](KONSOLIDIERTE_ROADMAP.md), Prioritäten und vollständiger Wochenumfang im [Wochenplan](EFF03_WEEK_TARGET_2026-11-11.md). Dieser Einstieg ist für organisatorische Widersprüche maßgeblich. Keine zweite Roadmap und keine neue Gesamtinventur.

**Ein alleiniger HND01-Owner:** vor Übernahmen und kritischen Schreib-/Freigabe-/Sicherungsaktionen die einschlägigen Owner-, Main-, Ref-, PR-, Review-, Kommentar-, Actions- und Sicherungsstände frisch abgleichen. Repository, Zielbranch, Dateipfad und zugehörige Blob-SHA als zusammengehörigen Schreibbezug aus demselben gepinnten Leseergebnis übernehmen; eine SHA nie zwischen Branches oder Pfaden übertragen. Erwartete Ziel-/Datei-SHAs schützen, Ergebnisse rücklesen; bei Konflikt zuerst den neuen Stand prüfen, niemals fremde Änderungen überschreiben. Ein ACTIVE-Eintrag beweist keinen laufenden Chat; eine hängende Oberfläche beweist keinen STOP. Keine feste Chatrotation, separate QA-Agentenpflicht, neue Automation oder automatische Modell-/Kontingentumschaltung. Historische Gegenprüfungen und unabhängige maschinelle Oracles bleiben erhalten.

<a id="aktive-präzisierung-bündelung-mit-kurzen-zwischenständen--11112026"></a>

### Paketgröße und Abschlussgrenze

**Ein Paket ist der kleinste fachlich vollständige, sinnvoll abnehmbare Nutzerablauf.** Vorzugsweise 2–4 eng zusammengehörige Änderungen sind ein Richtwert, weder Mindestfüllung noch Obergrenze. Keine zusätzlichen Zahlenregeln je UI-/Finanz-/Speichertyp, keine Datei-/Zeilen-/Promptgrenze. Fertige unabhängige Nutzerabläufe nicht nachträglich zu größeren Freigabestapeln sammeln, nur um Releasekosten zu verteilen. Ein einzelner vollständiger Fix darf regulär abgeschlossen werden; ein P0/P1-Fehler hat Vorrang, aber erhält dieselben vorgeschriebenen Sicherheitsgates.

Zusammenführen nur bei gemeinsamem Ziel, zusammenhängendem Prüfvertrag und nachvollziehbarer sicherer Rücknahmegrenze. Notwendig zusammengehörige Finanz-/Speicher-/Kryptografie-/Syncschichten dürfen gemeinsam bearbeitet werden; unabhängige Risiken nicht künstlich vermischen. Vor Freeze teilen, wenn ein unabhängiger oder extern blockierter Teil den übrigen vollständigen Ablauf aufhält, die Fehlerzuordnung unklar wird oder keine gemeinsam beherrschbare Abnahme mehr möglich ist. Pflichtteile eines Ablaufs nicht auslagern, um scheinbar DONE zu erreichen. Externe Grenzen bleiben sichtbar; reiner Implementierungsstand ist keine Abnahme.

**Kleine Schritte innerhalb des Pakets:** gerichtete Repros, Negativfälle, Units und Syntax während der Umsetzung. An echten Wiederaufnahmepunkten im vorhandenen eigenen Checkpoint knapp Owner, Branch/SHA, geprüften Stand, offene Gates/Run-IDs, Sicherungsstand und nächste ausführbare Aktion sichern. Kein zusätzlicher Full-CI-/Release-/Vollsicherungszyklus je Zwischenstand und keine künstliche Sitzungsgrenze. Nach einem Teilabschluss im selben Chat mit dem nächsten autorisierten, unabhängig ausführbaren Umfang fortfahren. Ein Paketabschluss allein ist kein Übergabegrund. Am tatsächlichen Sitzungsende den konkreten Anlass nennen, etwa Kontext-/Technikgrenze, unverzichtbare fehlende Entscheidung oder Nutzerauftrag; keine feste Laufzeit oder Mindestzahl von Paketen einführen. Den vollständigen kopierfertigen Folgeprompt dann direkt im Chat ausgeben; ein Link ergänzt ihn. Erst vollständigen Kandidaten einfrieren; danach keine kosmetischen Erweiterungen oder Prozessänderungen auf seine Ref. Ein notwendiger Fehlerfix wird als neue Revision mit Originalbefund und erneuter Qualifikation der betroffenen Aussagen behandelt.


**Stabilitätsgrenze der kontinuierlichen Fortführung:** Kontinuierliche Fortführung gilt nur bei zuverlässig beherrschtem Arbeitsstand. Ein abgeschlossener Teilumfang erzwingt keinen Chatwechsel. Solange Kontext, Zuständigkeit, Abhängigkeiten und Prüfergebnisse klar sind, mit dem nächsten autorisierten, unabhängig ausführbaren Umfang weiterarbeiten. Stabilität und nachvollziehbare Ergebnisse haben Vorrang vor langer Laufzeit.

Bei widersprüchlichen Ständen, wiederholten Verwechslungen von Branches oder SHAs, verlorener Nachweiszuordnung oder erkennbar unzuverlässiger Kontextführung zuerst weitere Schreibaktionen pausieren. Den betroffenen Stand gezielt aus den maßgeblichen Quellen rekonstruieren. Gelingt das nicht zuverlässig oder treten solche Fehler erneut auf, rechtzeitig geordnet übergeben; nicht bis zum technischen Ausfall weiterarbeiten. Ein gewöhnlicher, nachvollziehbar untersuchbarer Testfehler ist für sich kein Grund zum Chatwechsel. Keine festen Laufzeiten, Mindestpaketzahlen oder Pflicht zum Durchhalten einführen.

### Vorhandene Funktionen zum Abschluss bringen

Am nächsten sicheren Priorisierungspunkt: bestätigte P0/P1-Fehler zuerst, danach bereits implementierte, mit vertretbarem Rest intern abschließbare Nutzerabläufe vor zusätzlichem Neubau oder optionaler Infrastruktur. Abhängigkeiten und Risiko mitberücksichtigen; nicht bloß leicht schließbare Zählpunkte sammeln. Der vollständige Wochenumfang einschließlich Folgepaketen bleibt beauftragt. Laufende Freeze-/Abnahmegrenzen bleiben bestehen.

Für den nächsten gewählten Scope im vorhandenen Taskvertrag nur vorhandenen Code/Abnahmebeleg, exakt fehlendes Kriterium und nächste Aktion abgleichen: **Implementierung, interne Verifikation oder externer Nachweis**. Bereits vorhandenen Restabgleich fortschreiben, keine neue Gesamtauditserie. Bei aufeinanderfolgenden Snapshot-/Allowlist-Erweiterungen vor dem nächsten gleichartigen Umfang im bestehenden Fachvertrag das noch fehlende fachliche Abschlusskriterium einschließlich erforderlicher Integration und Prüfungen benennen. Den nächsten vollständigen Import-/Belegablauf samt Quellpayload, Journal, Wiederimport und Rücknahme wählen; keine isolierten Feldfreigaben oder endlose Erweiterung ohne Bezug zum Abschluss. Extern blockierte Teile nicht als fertig auslagern. PARTIAL/VERIFY bedeutet weder fehlender Code noch automatisch „fast fertig“. Fehlt nur ein Nachweis, diesen gezielt erbringen; Produktcode nur bei belegter Lücke ändern. Ist der genaue Umfang bereits vollständig gültig belegt, den vorhandenen Scope-/Issueabschluss nachführen statt einen künstlichen Produktcommit, SW-Bump oder Zusatzlauf auszulösen. Neue Änderungen behalten alle vorgeschriebenen Gates.

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

### Fortschreibung 13.11.2026: kurze Statuspflege und ausführbare Abnahmewege

Im aktuellen Checkpointkopf nur neuen Fortschritt, exakte Belege, Änderungen an Gates und die nächste ausführbare Aktion fortschreiben. Unveränderte technische Schutzverträge und Originalnachweise verlinken statt nochmals vollständig kopieren; bestehende Historie erhalten. Der vollständige Folgeprompt bei tatsächlicher Übergabe bleibt Pflicht und muss alle weiterhin nötigen Schutzgrenzen eindeutig durch Text oder gepinnte Quellen übernehmen. Kein neues Statusdokument, Formular oder Dashboard.

Für einen blockierten Abschluss im bestehenden Fach-/Belegvertrag genau fehlenden Beitrag, zuständigen Akteur, nächste ausführbare Handlung und Wiederaufnahmebedingung festhalten. Eine reine Wiederholung von „Prüfer fehlt“ oder „Umgebung blockiert“ genügt nicht. Unabhängige Produktarbeit fortsetzen; die fehlende Abnahme bleibt sichtbar. Für die derzeitigen FLH04-/Releasegrenzen gilt:

| Abnahmeweg | Nächste konkrete Handlung und Zuständigkeit | Wiederaufnahme / unveränderte Grenze |
| --- | --- | --- |
| Unabhängiges Kryptoreview | Hauptowner verwendet das bereits fertige gepinnte Reviewpaket. Jochen entscheidet über den unabhängigen qualifizierten Prüfer und, falls erforderlich, Zugang/Budget; der Owner benennt nur die konkret fehlende Entscheidung. Keine erneute Paketerstellung oder externe Nachricht/Beauftragung ohne ausdrücklichen Auftrag. | Benannter unabhängiger Prüfer kann den exakten Kandidaten tatsächlich prüfen. Erst ein einschlägiger gültiger Abschluss erfüllt das Reviewgate; eigene oder KI-Prüfung ersetzt ihn nicht. |
| Native Persistenz-/Recoveryabnahme | Hauptowner ordnet vorhandene Harnesses den tatsächlich benötigten Fähigkeiten zu und benennt die konkret bereitzustellende zulässige Umgebung. Falls Nutzerbereitstellung nötig ist, nennt er genau diese Handlung; bekannte unveränderte Fehlstarts nicht wiederholen. | Nachgewiesene Ausführungsfähigkeit ermöglicht gezielte native Prüfungen. Browserverfügbarkeit, echte Persistenz/Mehrtab, Prozesscrash/reale Quota und ungelöste atomare Keyslotbindung bleiben getrennte Kriterien. |
| Ungeklärter Main-/Produktionsbefund | Hauptowner verwendet die gesicherten Originale und Diagnoseergebnisse. Bei neuer begründeter Hypothese oder geänderter Voraussetzung bereitet er genau einen reviewbaren Kandidaten mit Umfang, Sollnachweis und nötiger Ausführungsentscheidung vollständig vor. Fehlt neue Evidenz, bleibt der Befund mit dieser Wiederaufnahmebedingung geparkt. | Jochen entscheidet erst am konkreten Kandidaten über erforderliche neue Ausführung. Verbrauchte Einzelversuche, erfolgreiche Diagnosen und Parkstatus schließen kein Main-/Releasegate und erlauben keinen blinden Retry. |

Diese Fortschreibung präzisiert bestehende Regeln. Sie ändert weder alleinige HND01-Zuständigkeit noch Paketgrößen, Schutzverträge, Testpflichten, Workflowfreigaben oder das gemeinsame Optimierungsbudget. Eine Dokumentationsänderung belegt noch keine Zeitersparnis.

### Infrastrukturfehler und sichere Stopps

Queue-/Setup-/Transportfehler, Produkt-/Assertionsfehler und noch ungeklärte Ursachen getrennt führen; ein erfolgreicher Neuabruf erklärt keinen alten 503/429-Fehler. Originale erhalten. Höchstens 15 Minuten zusätzliche aktive Erstdiagnose bis konkretem Befund/Zugriffsgrenze innerhalb des Gesamtbudgets; das ist weder Freigabe noch Abbruchfrist für laufende Tests. Danach sichere unabhängige Vorarbeit oder wiederaufnehmbaren Blockerstand herstellen, statt dieselbe unergiebige Diagnose zu wiederholen. Bei neuen Belegen gezielt weiterprüfen.

Keine blinden Retries, CI-Abbrüche oder Doppelstarts. Ein gezielter Wiederholungsweg benötigt den bestehenden konkreten Ursachen-/Prüfvertrag und getrennte Originalidentität; UNKNOWN nicht als nachgewiesen transient umetikettieren. Bei Statusbedarf in einer aktiven Sitzung gebündelt prüfen, bei langem unverändertem Incident seltener; keine automatische Hintergrundfortsetzung behaupten.

### Capability-Preflight und eingegrenzte Blocker · Nutzerauftrag 13.11.2026

Vor jedem neuen Arbeitsabschnitt einmal nur die tatsächlich benötigten Fähigkeiten prüfen; gültige Nachweise derselben Laufzeit wiederverwenden. GitHub-Lese-/Schreibzugang, Node/Testwerkzeuge, erforderliche Browserstarts und lokale Unix-Sockets, reguläres TLS/CA/Proxy-Vertrauen, Zielerreichbarkeit sowie bei Abschluss privater Versions-/Readback-/Restoreweg gehören je nach Aufgabe dazu. Ein PASS aus anderer Sitzung ist kein aktueller Fähigkeitsnachweis. Keine pauschale Installation oder Testmutation privater Daten.

Fehlende Fähigkeit sofort als **ENVIRONMENT_BLOCKED** mit exakter Fehlstelle und benötigter Fähigkeit erfassen. Bekannten Fehlstart im unveränderten Kontext nicht wiederholen; daraus keine Produktursache ableiten. Nur eine bereits zulässige geeignete Umgebung verwenden; keine Sicherheitsumgehung. Sichere unabhängige Arbeit fortsetzen.

**Ein Fehler blockiert nur nachweislich abhängige Arbeiten und Freigaben.** Im bestehenden Checkpoint unterscheiden: PRODUCT_BLOCKED = bestätigter Produktfehler; TEST_BLOCKED = erforderlicher Test ohne gültiges Ergebnis/ungeklärte Voraussetzung; ENVIRONMENT_BLOCKED = benötigter Test technisch nicht startbar; RELEASE_BLOCKED = Pflichtabnahme unvollständig; INDEPENDENT_WORK_ALLOWED = isolierte unabhängige Entwicklung zulässig. Diese Begriffe sind keine neue Statusdatenbank. Einmal exakt eingrenzen, Originale erhalten, genau eine begründete Diagnose/Korrektur wählen. Fehlt die Fähigkeit, aktive Diagnose stoppen und unabhängig fortsetzen. Maximal ein eingefrorener Kandidat plus ein isolierter Folgeschnitt, alleiniger Writer und keine zweite finale CI. Parken schließt kein Releasegate und erlaubt keinen Umgehungsrelease.

Vor Freeze konkrete Änderungen an SW/Cache/Offline/IDB/Restore/Browserinitialisierung den vorhandenen kritischen Abläufen zuordnen: Erstinstallation, aktiver Controller/Reload, Offline-Reload, Cacheversionswechsel, fehlgeschlagene/abgebrochene Installation, frischer Kontext und tatsächliches Speichern/Restore. Vorhandene Tests bevorzugen; Browser/Node/Playwright und Ausgangsbedingungen möglichst produktionsgleich, Abweichungen nennen. Lokaler PASS ersetzt keine Produktionsabnahme; Workflowänderungen benötigen die konkrete #229-Freigabe.

Nach sicherem Abschluss des aktuellen Releaseblockers begrenzte vorhandene Fehlerdiagnostik prüfen: vor goto Test-/Contextidentität, Navigation/Requests/HTTP-Fehler, relevante Konsole/pageerror, SW-Registrierung/Installation/Aktivierung/Controller, Dokument-/Assetidentität und Cachebefüllungsfehler erfassen. Vorhandenen Wrapper wiederverwenden; nur synthetische Portfolios, keine allgemeine Nutzerdatenprotokollierung oder umfangreiche Erfolgstraces. Fehleroriginale unverändert erhalten. Bis dahin keinen Diagnostikumbau mit UI-R4 vermischen.

PR334/V2 wiederverwenden: geänderte Skripte statisch, geänderte Bedienung und relevante negative Ausgangszustände früh prüfen. Kein unveränderter CI-Neustart ohne neue Hypothese/geänderte Voraussetzung; Ebene, Ursache (ggf. UNKNOWN) und nächste Entscheidung festhalten. Keine Frist-/Assertionlockerung oder blinde Zusatztests. Bei den nächsten ohnehin regulären Abschlüssen vermeidbare Fehlzyklen und tatsächlich belegte Zeitersparnis knapp im bestehenden Belegindex erfassen; unbekannte Werte UNKNOWN. Kein Dashboard/Statistiklauf und keine Wiedererzeugung geschlossener Original-/Abnahmebelege.

## Nächste Maßnahmen in bestehenden Paketen

| Priorität | Nächster sinnvoller Schritt | Entscheidungsgrenze |
| --- | --- | --- |
| Laufender Kandidat/Blocker | Bestehenden Prüf-/Diagnosevertrag am nächsten sicheren Punkt schließen oder begründet gesichert parken. | Kein Eingriff in Freeze, Owner oder laufende Tests; offene Fehler/Gates bleiben erhalten. |
| Nächster Produktabschluss | Bereits implementierten vollständigen Ablauf anhand des konkret fehlenden Kriteriums abschließen. | Bestehende Belege nutzen; kein Neubau allein aus offenem Issue, kein zusätzlicher Release nur für Statuspflege. |
| P-CI-B, bedingt | Verbleibenden Zusatzaufwand gegen erwartete Verkürzung des gesamten Pflichtwegs prüfen; nur den begrenzten Balancingkandidaten qualifizieren. | Keine dauerhafte Voraussetzung für unabhängige Produktarbeit. Eigener #229-Vertrag; alle Aufrufe/Engines/Assertions/Fristen/Artefakte erhalten. |
| P-CI-C, bedingt | Nur bei nachgewiesen relevantem verbleibendem Produktionsengpass gesondert bewerten. | Kein automatischer Folgeumbau. Nettonutzen, isolierte Profile/Ports/Seeds/Speicher-/Artefaktpfade, gleicher ausgelieferter SHA und Gesamt-AND-Gate erforderlich. |
| Externe Abnahmen | Windows-Chrome/Edge-/Android- und bei Bedarf OAuth-/Gerätewechselprotokolle wiederverwenden. Fehlende Isolation/Versionen einmal als OPERATOR_INPUT_PENDING führen; TalkBack/Safari DEFERRED_USER. | Höchstens 30 Minuten zusätzliche Vorbereitung im Gesamtbudget; Entwicklungsrest separat, keine Pflichtgrenze wegdefinieren. |

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
