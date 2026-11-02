# NAM01 / COPY01 – FolioLab erhalten, verständlich beschreiben, sicher darstellen

**Verbindlicher Nutzerauftrag vom 02.11.2026.** Ergänzt den bestehenden Masterplan, UI-MASTER28 #149 und PWA-FULL01. Status: **PLAN FREIGEGEBEN; Namensvorprüfung, Textumsetzung und Produktabnahme noch offen.** Keine rechtliche Namensfreigabe, keine neue Produktimplementierung durch diesen Plan.

## Aktualisierte Nutzerpriorität – 02.11.2026 (Android zuerst)

**Primäres und unmittelbar sichtbares Nutzerziel ist der kurze App-Label-Text „FolioLab“ auf dem Android-Startbildschirm und in der installierten PWA.** Nicht eine umfassende Markenstrategie, nicht ein langer Browser-/SEO-Titel. Die App heißt auf unperfekt.at bereits FolioLab; deshalb ist eine **einheitliche sichtbare Benennung** auch im Browser und auf der Produktseite bevorzugt. Der Browser-Tab-Titel mit „Open“ wäre für den Nutzer vorübergehend akzeptabel, ist jedoch nicht das bevorzugte Endergebnis.

**Priorität und kleinster risikoarmer Schnitt:**
- Android/PWA `manifest.webmanifest`: `short_name: "FolioLab"` und bevorzugt auch `name: "FolioLab"`; installierter Startbildschirm-/Launcher-Name ist vorrangiges Erfolgskriterium.
- Browser-Tab `<title>FolioLab</title>` als konsistenter Zielzustand, aber kein Blocker, wenn die Android-App bereits korrekt kurz angezeigt wird. App-intern vorhandenes „FolioLab.“ unverändert; längere Funktionsbeschreibung ausschließlich auf Produktseite/Einführung.
- Bestehende Appinstallationen **datensicher** behandeln: Android-/Browser-Manifest-Update und tatsächliche Launcher-Anzeige auf mindestens einer echten Installation gezielt prüfen; Browser-Shortcut vs installierte Standalone-PWA unterscheiden. Keine Deinstallation/Storage-Bereinigung als Standard, weil Portfolio/Keys lokal gespeichert sind; Verzögerungen bei OS-Namensübernahme ehrlich dokumentieren.
- **NAM01 als einmalige kompakte Vorprüfung** ohne überproportionale Sperrwirkung behandeln. Bei konkretem erheblichem Konflikthinweis die dauerhafte öffentliche Namensveröffentlichung gezielt zur Nutzerentscheidung stellen; ohne solchen Befund die kleine Android-PWA-Korrektur nicht durch eine offene Vollrecherche blockieren. Keine automatische Alternativnamensuche oder rechtliche Freigabebehauptung.
- UI-LOAD01/PWA-FULL01 und aktuelle Release-/Importarbeiten seriell und konfliktfrei fortsetzen. Keine separate Namens-PR und kein paralleler Work-Owner; namengebundene Tests/Deploy-Verifier in demselben geprüften PWA-Schnitt korrigieren.
- Keine Änderung von Repository `foliolab-open`, Origin, App-`id`, `start_url`, `scope`, Service-Worker-Datenschutzregeln, IndexedDB-/Backup-/v5-Identitäten. **Android-Label-Korrektur ist ein UI-/Manifest-Thema, keine Datenmigration.**

**Abnahme:** Android-Launcher zeigt nach regulärer Aktualisierung „FolioLab“ ohne Open/Untertitel; Browser-Titel bevorzugt ebenfalls „FolioLab“; funktionsfähige installierte PWA startet standalone, bestehende Daten bleiben byte-/semantisch unverändert, Offline/Reload/Restore bestehen. Unverifizierte native Android-Hardware nicht als PASS behaupten.

## 1. Vorrangige Entscheidung: Der Name soll FolioLab bleiben

**Ziel ist ausdrücklich, den Namen „FolioLab“ zu erhalten.** Dies ist kein Auftrag zur Entwicklung einer neuen Marke oder zur vorsorglichen Umbenennung. Schreibweise: FolioLab. Das vorhandene eigene Kolbenlogo, die grüne Gestaltung und die typografische Headerform „FolioLab.“ bleiben erhalten; ein grafischer Punkt ist kein Bestandteil technischer Identitäten.

Der gewünschte kurze sichtbare Appname bleibt **FolioLab**, ohne „Open – Unabhängiges Portfolio“. Funktion und Nutzen werden separat beschrieben. Die folgende Prüfung soll einen nachvollziehbaren Weg zur Beibehaltung klären, nicht die gewünschte Entscheidung durch eine unbestimmte Markenrecherche ersetzen.

Eine mögliche andere Nutzung desselben Namens muss sachlich untersucht werden. Ein Suchtreffer ist weder eine automatisch feststehende Rechtsverletzung noch eine Freigabe. Bei einem konkreten erheblichen Konflikthinweis: Belege und begrenzte Handlungsmöglichkeiten dem Nutzer vorlegen; erforderlichenfalls fachkundige Markenrechtsberatung empfehlen. **Keinen neuen Namen, Zusatz, Domainwechsel, Verzicht oder Kontakt mit Dritten eigenständig veranlassen.** Alternativnamen erst bei begründetem Bedarf und neuer Nutzerentscheidung, nicht als Standardarbeitspaket.

Auch „Open“, „by unperfekt“ oder ein anderer Untertitel ist keine ungeprüfte rechtliche Absicherung. Eine tatsächliche Herkunftsangabe kann Nutzern Orientierung bieten, darf aber nicht als garantierte Konfliktlösung ausgegeben werden.

## 2. NAM01 – begrenzte Namens- und Abgrenzungsprüfung

**Ergebnis:** kurze, belegte Entscheidungsvorlage mit Fokus auf Beibehaltung von FolioLab. Keine allgemeine Marketingstudie und keine wiederholte Suche ohne neue Fragestellung.

1. Aktuelle identische und ähnliche Bezeichnungen in relevanten Markenregistern und außerhalb der Register prüfen. Fokus zunächst Österreich und EU sowie Software/Portfolioverwaltung/Finanzanalyse; tatsächlich relevante Waren und Dienstleistungen prüfen, nicht aus einer bloßen Klassennummer Sicherheit ableiten. Weitere Zielmärkte nur bei konkreter Vertriebsabsicht gesondert erfassen.
2. Kostenlose offizielle Ausgangspunkte: see.ip, EUIPO/TMview und gegebenenfalls WIPO/Madrid Monitor. Die zuvor angesprochene gleichnamige Aktienanalyse-App anhand aktueller Anbieter-/Storequellen überprüfen. App-Store-Präsenz, Domainregistrierung und ein Markenregistereintrag getrennt dokumentieren.
3. Pro relevantem Treffer möglichst Zeichen, Inhaber, Register-/Anmeldenummer, Status, Schutzgebiet, Anmelde-/Prioritätsdatum, Waren/Dienstleistungen und Quellenstand festhalten. Nicht zugängliche Register oder fehlende Informationen als offene Prüflücke ausweisen. Keine Ergebnislosigkeit als „rechtssicher frei“ bezeichnen.
4. Vorhandene belegbare eigene Nutzung und Produktabgrenzung knapp aufnehmen: lokaler Portfolio-Tracker, tatsächliche Betreiber-/Produktzuordnung, eigenes Logo. Daraus keine automatische Vorrangigkeit oder rechtliche Unbedenklichkeit ableiten.
5. Ergebnis in einer kleinen Tabelle: gesicherter Befund, Bedeutung für die Beibehaltung, Unsicherheit, nächste erforderliche Entscheidung. Bei relevantem ungeklärtem Risiko die betroffene dauerhafte Namensfestlegung zur Entscheidung vorlegen; **nicht die gesamte technische Roadmap pauschal stoppen**.

**Abnahme NAM01:** Suchumfang und Quellenstand nachvollziehbar; relevante Treffer/Prüflücken benannt; Empfehlung an der Beibehaltung ausgerichtet; keine fingierte juristische Freigabe. Kein Einkauf von Recherchen, keine Markenanmeldung, kein Domainkauf und keine externe Kontaktaufnahme ohne gesonderte Erlaubnis.

## 3. COPY01 – verbindliche Namen- und Beschreibungsmatrix

Eine kompakte Textreferenz verwenden; keine neue Content-Management- oder Branding-Infrastruktur bauen.

| Einsatzort | Zieltext |
| --- | --- |
| Browser-App-Titel, Manifest name und short_name, Installations-/Appsymbolname | **FolioLab** |
| Bestehender App-Header | **FolioLab.** in vorhandener Gestaltung; BETA separat, solange zutreffend |
| Kurzer Untertitel auf der Produktseite | **Dein Portfolio im Überblick.** |
| Sachliche Funktionsbeschreibung | **Portfolio-Tracker für ETFs, Aktien, Krypto und Guthaben.** |
| Kurze Einführung | **ETFs, Aktien, Krypto und Guthaben an einem Ort. Behalte den Wert und die Zusammensetzung deines Portfolios im Blick.** |
| Öffentliche Produktseite: Seitentitel | **FolioLab – Portfolio-Tracker für ETFs und Krypto** |

Keine lange Funktionsbeschreibung in die Android-Titelleiste oder auf das Appsymbol zurückholen. Erklärungen gehören in Einführung, Produktseite und passende Detailhilfen. Meta-Beschreibung und Linkvorschau verwenden denselben sachlichen Wortlaut; nicht mit Schlagwörtern überladen. Reale Abdeckung und Beta-/Einschränkungsstatus bei Bedarf kurz zusätzlich erläutern.

### Funktionsversprechen im selben kleinen Textschnitt prüfen

- **Produktiv verfügbar / eingeschränkt / geplant** unterscheiden. Anbieterformaterkennung oder reine Vorschau nicht als abgeschlossenen automatischen Import bewerben. Anbieter- und Ereignisgrenzen nach aktueller Abnahme benennen.
- **Offline:** gespeicherte Daten und lokale Funktionen von Online-Kursaktualisierung, Blockchainabrufen und optionalen Cloudfunktionen unterscheiden. Kein pauschales „vollständig offline“.
- **Lokal und privat:** lokale Speicherung von tatsächlich stattfindenden Anbieteranfragen und optionalen Drive-Backups abgrenzen. Kein absolutes „Daten verlassen niemals das Gerät“ bei bestehenden externen Verbindungen.
- **Kostenlos:** App-/Projektangebot von externen Tarifrechten und Freikontingenten unterscheiden. Keine unbegrenzte Gratisabdeckung oder garantierte Quoten behaupten.
- **Rendite:** persönliche Performance, Kursentwicklung und Modellrechnung eindeutig unterscheiden; Modellverlauf nicht als tatsächlich erzielte Historie bezeichnen.
- Begriffe konsistent: **Vorschau** verändert keine wirtschaftlichen Daten; **Übernehmen** bestätigt geprüfte Änderungen; **Backup/Wiederherstellen** ist nicht automatisch **Mehrgeräte-Synchronisierung**.

**Abnahme COPY01:** eine gültige Textmatrix, sichtbare Titel ohne unnötige Zusätze, keine widersprüchlichen Funktionsversprechen zwischen App/Hilfe/Produktseite, keine unbewiesenen Finanz- oder Datenschutzgarantien. Keine generelle Neufassung aller historischen Dokumente.

## 4. PWA-FULL01 – sichtbare Bezeichnung ändern, technische Identität erhalten

Bestehenden PWA-Auftrag ergänzen, keinen zweiten erstellen. Nach einer kurzen NAM01-Vorprüfung ohne konkreten erheblichen Konfliktbefund den engen sichtbaren Textschnitt im ohnehin geplanten PWA-/Frontendpaket umsetzen; primär den Android-Launcher-/PWA-Namen, danach möglichst konsistent den Browser-Titel. Bei relevantem ungeklärtem Konflikt nur die betroffene dauerhafte Namensveröffentlichung zur Entscheidung vorlegen. Namensunabhängige Arbeiten wie Loader und Installationsqualität bleiben separat ausführbar, falls eine Namensfrage noch offen ist.

- Sichtbare Vorkommen gezielt inventarisieren: HTML-Titel, Manifest name/short_name, Begrüßung, App-Informationen, Installationshilfen, gegebenenfalls sichtbare Downloadbezeichnungen. Kein globales Suchen-und-Ersetzen von `foliolab-open`.
- Repositoryname, bestehende Website-Origin, IndexedDB-Namen, lokale Schlüssel, Quell-/Buchungsidentitäten, Backup-Formatkennungen und Datenversion nicht zur kosmetischen Namensänderung wechseln. **Aktuelles v5-Datenformat und dessen Kompatibilität erhalten; für übernommene v5-Daten kein Rollback auf v263.**
- Bestehende effektive PWA-Identität, start_url, scope und standalone-Verhalten erhalten. Keine ungeprüfte neue Manifest-id, die eine zweite App erzeugt. Kein zwanghafter Reinstall, Clear-Site-Data oder Deinstallieren als Standardlösung.
- Vorhandenen Originalkolben für die geplanten PNG-Icons und die Ladeanimation verwenden. Installierbarkeit, sichere Maskable-Fläche und passende Auflösungen im bestehenden PWA-FULL01-Vertrag abnehmen; keine Behauptung, eine bestimmte Iconänderung beseitige sicher jede Browserleiste.
- Browser-Tab, installierte Standalone-PWA und browser-/in-app-geöffnete Seite unterscheiden. Ein kurzer Titel allein entfernt keine fremde Browseroberfläche. Statusleiste/Systemnavigation nicht ungefragt verstecken.
- Namensabhängige Tests und Deploy-Verifikation konsistent aktualisieren. Der aktuelle Handover nennt insbesondere die Suche nach „FolioLab Open“ im Deploy-Verifier und in der Begrüßungsprüfung. Erwartungen gezielt ändern, Prüfungen nicht entfernen oder beliebige Titel akzeptieren.
- Service-Worker-Revision und Assetliste nur passend zum tatsächlichen Produktrelease aktualisieren. Daten-/Schema-/Finanzcode nicht mit Brandingänderungen vermischen.

**Abnahme PWA-Ergänzung:** bestehende Installation aktualisieren, gleicher Datenbestand und gleiche App-Identität; korrekter Titel nach erfolgter Browser-/Manifestaktualisierung; frische Installation; Offline-Neustart; Backup/Restore; vorhandene Pflichtprüfungen in Chromium/Firefox/WebKit. Echte Android-Geräteprüfung getrennt von Emulation dokumentieren. Verzögert aktualisierte Appnamen als solchen Zustand erklären, nicht Datenlöschung empfehlen.

## 5. Produktseite und Herkunft – kleiner Abschluss von COPY01

Die bestehende Vorstellungsseite unter unperfekt mit der Textmatrix abgleichen: sichtbarer Name, Untertitel, Funktion, Beta-/Abdeckungsgrenzen, Seitentitel, Meta-Beschreibung und Linkvorschau. Nicht die gesamte Website umbauen. Eine wahrheitsgemäße Betreiber-/Herkunftsangabe kann im bestehenden Footer/Info-Bereich bleiben bzw. klarer werden; kein automatisch neuer Markenname „FolioLab by …“.

Die App selbst behält einen kurzen Namen, die Vorstellungsseite erklärt das Produkt. Ein Domainumzug, App-Store-Launch oder eine kostenpflichtige Anmeldung ist **nicht** Teil dieses Auftrags. Da FolioLab erhalten werden soll, ist auch ein Hinweis „ehemals FolioLab“ derzeit nicht vorgesehen.

## 6. Reihenfolge, Verantwortung und Sicherung

1. Laufenden Release-/Importstrang und dessen Abnahme unverändert respektieren. Vor Produktänderungen aktuellen Main, PR, CI und Owner prüfen. Keine Actions abbrechen oder duplizieren; keine zweite schreibende Produktsitzung.
2. NAM01 einmal gezielt bearbeiten; COPY01 parallel dazu nur als konfliktfreie Text-/Lesevorarbeit. Ein rechtlich relevanter offener Befund verlangt eine konkrete Nutzerentscheidung, keine stillschweigende Umbenennung.
3. Nach dem sicheren Releasepunkt PWA-FULL01 um die freigegebenen sichtbaren Texte und passende Tests ergänzen. UI-LOAD01 und Datenfunktionen nicht wegen einer bloß offenen Namensprüfung pauschal zurückhalten. Keine zusätzliche Branding-Releasekette für jeden Einzeltext.
4. Produktseitenabgleich als kleinen anschließenden Textschnitt durchführen. Echte externe Veröffentlichung und technische Produktänderungen erst nach den jeweiligen bestehenden Freigaben/Prüfungen.
5. Im nächsten regulären Owner-Checkpoint/Roadmap-Eintrag nur Link auf diesen Ergänzungsplan plus Status und nächsten Schritt aufnehmen. Historie und neuere Owner-/Releaseeinträge nicht überschreiben. EFF01/HND01 gelten; Checkpointbranch niemals vollständig nach Main mergen.

**Statusführung:** NAM01 offen, COPY01 Textvorgaben beschlossen / Umsetzung offen, PWA-FULL01 bestehender Auftrag präzisiert / Abnahme offen. Dieses Dokument und der #149-Nachtrag sind die Planänderung; keine Behauptung, der aktive Work-Chat habe sie bereits gelesen oder Produktcode veröffentlicht.

## 7. Recherchegrundlage und klare Beweisgrenze

Offizielle Hinweise für die geplante Vorprüfung, am 02.11.2026 abgerufen:
- Österreichisches Patentamt, Selbstrecherche: https://www.patentamt.at/recherche/marken/selbstrecherche
- Österreichisches Patentamt, Markenrecherche und Beratung bei Unsicherheit: https://www.patentamt.at/recherche/marken
- EUIPO, Verfügbarkeit: https://www.euipo.europa.eu/de/trade-marks/before-applying/availability
- EUIPO, Verfügbarkeitssuche: https://www.euipo.europa.eu/de/help-centre/tm/faq-search-availability

Diese allgemeinen Hinweise bestätigen **nicht**, dass FolioLab rechtlich frei oder gesperrt ist. Die konkrete Register-/Nutzungsrecherche ist Gegenstand von NAM01 und mit diesem Plan noch nicht durchgeführt.

Projektgrundlage: jüngster `WORK_RESTPAKETE_CHECKPOINT.md`-Kopf gelesen; dort PWA-FULL01/UI-LOAD01 und Namensabhängigkeiten bereits aufgeführt. Laufende Releasezustände sind veränderlich und werden hier bewusst nicht als dauerhafte aktuelle Versionsangabe kopiert.
