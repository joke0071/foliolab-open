# Aktueller Master-Checkpoint · abschließende PR179-Regression · 27.10.2026

**PARTIAL / DRAFT / UNVERÖFFENTLICHT.** HEAD `d085e58624f2f1522bf851ef3d6de8c7b5962b95`, Tree `2dc0b34b2bc0e3398b324c69af5a12e4241cdc53` lokal/remote exakt. CI40594291174 läuft; Wallet40594291315 SUCCESS. Produktion v190/main7b7fae7, SW191 nur Kandidat.

Vollständiger Vorlauf40593139062 +Wallet40593139006 SUCCESS:766/766 Units0fail0skip, Chromium und beideFirefox/WebKit-Pflichtshards, neue und bestehende Buchungs-/Finanz-/Storage-/Backup-/Offline-/Axe-Gates. WebKit320-Überlauf behoben und tatsächlich visuell bestätigt.30neue Bilder erzeugt;18ausgewählte echte CI-Bilder aus allen3Engines/Mobile/Desktop angesehen, PASS. ZIPs12774204334/SHA256e50e0f861f72a6259ae26bbe45bd02e0dba97734c38a46ac787b3cab872c5586 und12774463449/SHA256f39852a7232b1b7c0891020428fee61d180d8b4b08f1aba2590e7802c1181b14 vor Extraktion verifiziert.

Letzter Reviewdelta: Neues Zeilen-UI konnte nach save()-Fehler/Abbrechen das während saving=true gerenderte disabled-Attribut behalten. DOM sperrt nun fachliche/permanente Speichergründe; bestehende assertBookingWritable-Prüfung vor jedem Öffnen sowie vollständige Zulässigkeit/Bestätigung/atomarerCAS vor Commit bleiben unverändert. Gleiches Grundmuster wie Positionen, keine globale Speicher-/Renderumstellung. Neuer Browserfall prüft tatsächlichenQuota-Fehler→Abbrechen→direkte Aktion wieder bedienbar, exakt unveränderte Originaldaten→erneute Vorschau und die bisherigen post-put-Abbruch/Offline/Undo/Restorefälle. Für diesen Delta aktuelle vollständige Gates abwarten; vorheriger grüner Stand nicht als aktuelle Final-CI ausgeben.

Umfang bleibt begrenzt: direkte gemeinsame Zeilenicons/Toolbar/Selektion, Kontextdialog für vorhandene sichere manuelle Notiz-/EUR-Cash-Vorgänge; reversibles reines Sichtbarkeitsarchiv ohne Finanzwirkung mit Vorschau/Bestätigung/CAS/Undo/Quell-/Reimportschutz. Kein Ignore und keine neue breite Import-/Wallet-/Transfer-/Trade-/technische Finanzmutation. Weitere Felder, Interpretationskorrekturen und Sammelbearbeitung OPEN.

**Eigene konkrete Nutzerfreigabe vor Merge/Deployment:** Erst bestätigte Archivierung aktiviert portables Modell4 mit streng validiertem bookingPresentation; ältere Leser lehnen vor Metadatenverlust ab. Kein Startupgrade/IndexedDB-Schemawechsel. Neuer Speicher-/Backup-Vertrag nicht durch v188-Freigabe gedeckt. Nach aktueller Final-CI und Abnahme releasefähigen PR zur Entscheidung vorlegen. Keine Veröffentlichung oder v191-Live-Abnahme behauptet.

Neuester identisch wiederholter UI-Nachtrag bleibt ausschließlich vorgemerkt (vollständig unten): kein Code/Branch/Testlauf dafür, keine neue Kopie/Parallelentwicklung. Aktueller PR behält absichtlich seinen bisherigen Normalzustand bis zum nächsten regulären konfliktfreien UI-Schritt. CI-Zwischenoptimierung nur lesend dokumentiert; keine Workflow-/Cache-/Gate-/Branch-Protectionänderung, keine Vorziehung vor aktiven Abschluss. Restliche ausführbare Vorgänger gemäß bestehender Roadmap offen; FLH05-A/PERF01 nicht vorgezogen. FLH05-Spezifikation/12Testvektoren unverändert, Blob953f816c648ebabec42476be80cd0bf481fe6a2e.

Historische Fehlnachweise erhalten:40585032435/40585906272/40586826976 Testaufbaukorrekturen;40589392451/40590627035 WebKit-Textbegrenzung;40592094554 anschließend Kontrastprüfung vor stabiler Darstellung. Keine Assertions/Regeln/Testumfänge geschwächt. Ursache/Workaround passt zu primärem WebKit36dfaa00d2384e29dbca5f36d2cdaf90739f557b/326939 (nicht-automatische Mindesthöhe und veraltete Grid-Höhe beim Verkleinern);44px nun über inneren34px-Inhalt+Padding/Rand, außen auto. Bestehende2Frame-/Übergangs-Abnahme übernommen; Farbe/Browserpins unverändert. Sämtliche vorigen Jobs vor jedem Update regulär beendet, nichts abgebrochen/neugestartet.

---

# Vorgemerkter UI-Nachtrag: schlanke Mehrfachauswahl · 27.10.2026

**OPEN / NUR DOKUMENTIERT / NACHRANGIG.** Zu #149/#165, ausschließlich im bestehenden Masterauftrag. Aktuellen Strang PR179 und dessen jeweils laufende Pflichtprüfungen sowie alle laufenden Implementierungen, Audits, Tests, Merges und Deployments unverändert fortsetzen. Kein Pausieren, Neustart, Umpriorisieren, zusätzlicher Branch, Code oder Testlauf aufgrund dieses Nachtrags.

Umsetzung erst beim nächsten regulären, sicheren und konfliktfreien UI-Checkpoint nach dem aktiven Paket. Bereits erledigte Teile überspringen; keine parallele Auswahl-/Verwaltungsengine.

- Neuer schlanker Normalzustand für Positionen und Buchungen: **kein alleinstehender „Auswählen“-Button über der Liste**, keine Checkboxen/Sammelaktionen. Dezente jederzeit erreichbare Aktion **„Mehrfachauswahl“ im jeweiligen Listenkopf** aktiviert den Modus; keine zusätzliche aufklappbare Steuerung. Direkte kleine Zeilenicons Bearbeiten/Löschen/Archivieren bleiben erreichbar.
- Aktiver Modus: Auswahlleiste dauerhaft offen und unmittelbar sichtbar; Zeilencheckboxen, „Aktuelle Seite auswählen“, „Alle löschen“, „Alle archivieren“, „Abbrechen“. Mobile Zweispaltenanordnung, eindeutige Anzahl und Reichweite beibehalten. Abbrechen/reguläres Beenden kehrt in den schlanken Normalzustand zurück. Bestehender geprüfter Checkboxzyklus sowie Filter-/Pagination-/Einzelauswahlregeln bleiben erhalten.
- Mobile: unnötigen Leerraum über Namen reduzieren, Icons allenfalls kompakter bei mindestens bestehenden ausreichenden44px-Touchflächen. Kein Überlappen, horizontales Scrollen, schlechtere Lesbarkeit oder Redesign; Farben/Kartenstruktur erhalten.
- Sicherheit unverändert: explizite Lösch-/Auswirkungsvorschau, Archivieren ungleich Löschen/Ignore, Quellen-/Importidentitäten schützen, atomare nachvollziehbare Sammelaktionen. Reine UI ändert keine Finanzberechnung, Bestände oder Historien.
- Spätere Abnahme: beide Reiter gemeinsam mit vorhandenen Komponenten, synthetischen Daten und Mobile/Desktop insbesondere320/390/1440px prüfen. Pflichtprüfungen und Release-Gates vollständig erhalten.

Dieser vorgemerkte Bediennachtrag ersetzt **für den nächsten UI-Schritt** die ältere Normalzustandsanforderung „ausschließlich Auswählen“. Der aktuell laufende PR179 bleibt bewusst unverändert und wird dadurch nicht als fehlgeschlagen oder vollständig an den neuen Normalzustand angepasst bezeichnet. Bestehende Freigabegates und verbindliche Gesamtsequenz bleiben erhalten. FLH05-A nicht vorzeitig beginnen.

---

# Buchungs-UI: sicherer Implementierungscheckpoint · 27.10.2026

Basis: main `7b7fae74d864914c9c4f4dab6a2300c8ee0e0ef5`, produktiv v190 LIVE_ACCEPTED. Einziger funktionaler Strang: `feature/booking-management-ui`. SW191 ist unveröffentlichter Kandidat. FLH05-A und PERF01 bleiben gemäß zentraler Vorgängersequenz zurückgestellt; PR157/161 unverändert.

## Implementierter begrenzter Umfang

- Direkte Bearbeiten-/Löschen-/Archivicons je Buchungszeile mit vorhandenen Positionskomponenten, 44px-Zielen; gemeinsame Auswahlengine und kompakte Zweispaltenleiste.
- Kontextdialog nutzt ausschließlich vorhandene geprüfte manuelle Notiz- und EUR-Cash-Korrekturen. Kein scheinbarer Speichervorgang bei unveränderten Feldern.
- Archivieren/Wiederherstellen sämtlicher stabil identifizierter Buchungszeilen ist reine Sichtbarkeit. Alle Buchungen, Journalpostings, Originalquellen, Cashflows, Bestände und historischen Berechnungen bleiben unverändert. Keine Ausschlussfunktion.
- Einzel- und Sammelarchivierung brauchen Vorschau, ausdrückliche Bestätigung, exakte Vorzustandsprüfung und bestehenden atomaren CAS-Speicher; gemeinsames begrenztes Undo.
- Import-/Trade-/Transfer-/Wallet-/technische Finanzmutationen bleiben anhand bestehender Regeln gesperrt; keine stillen Teilerfolge.

## Datenvertrag und eigene Releaseentscheidung

Optionales `bookingPresentation: {version:1, archivedIds:string[]}` verwendet bestehende stabile Buchungs-/Journalzeilenidentitäten. Strikte Schlüssel-, Größen-, Versions-, Eindeutigkeits- und Referenzprüfung. Finanzielle Projektionen werden nicht gefiltert. Reimporte behalten Quellidentität und Archivstatus.

Erst die ausdrücklich bestätigte erste Archivierung setzt das portable Modell auf Version4. Kein Startupgrade, keine IndexedDB-Schema-/Store-/Modusänderung. Formate1/2/3 ohne Archiv bleiben unverändert. Bestehende v190-Leser lehnen Version4 am vorhandenen Versionsgate ab, bevor sie neue Sichtbarkeitsmetadaten verlieren können. Aktuelle Leser, vollständige und verschlüsselte Backups erhalten diese. Explizite Wiederherstellung der letzten archivierten Zeile entfernt nur diese Metadaten und erlaubt wieder Version3.

**Merge/Deployment gesperrt bis konkrete Nutzerfreigabe für diesen neuen Speicher-/Backup-Vertrag vorliegt**, gemäß Masterregel für neue migrations-, backup- und sicherheitskritische Änderungen. Die frühere v188-Freigabe deckt diesen Vertrag nicht ab.

## Nachweise und verbleibende Gates

Lokal: 766/766 Unit-Tests, null Fehler/Skip; npm check PASS. Neun neue Fachtests prüfen exakte finanzielle Unverändertheit einschließlich Historien, technische Zeilen, Reimport, Undo, Sicherungen, alte Versionsgrenze und bestehenden Anlageassistenten.

Neu vorbereitetes Browsergate wird aus dem bestehenden verpflichtenden Buchungsmanagement-Gate in Chromium/Firefox/WebKit aufgerufen, ohne Workflowänderung oder entfernte Prüfungen. Synthetisch249 Buchungen einschließlich Import/technischer Korrektur: fünf Breiten320/390/430/768/1440, Axe,44px, Auswahlzyklus100→249→0, blockierte gemischte Löschungen, Quota/post-put-Abbruch, Offline, verschlüsselter Restore auf frischem Kontext, Reimport, Undo und Mehrtab-Stale-Vorschau. **Browser-/CI-/visuelle Abnahme noch PENDING; keine lokale Browserabnahme behauptet.**

Offen außerhalb dieses begrenzten Inkrements: lokale Import-/API-Interpretationskorrekturen, breitere wirtschaftliche Bearbeitungsfelder, kompatible Sammelbearbeitung und separat benannte Ausschlussfunktion. Erst pro Fall belegte Wirkungen, Originalschutz, Referenzen und Rücknahmevertrag implementieren; keine pauschale Behauptung vollständiger #149/#165-Abnahme.

## Begrenzte UI-Referenzen, kein FLH05-Recherchestart

Actual: [Transfer-Gegenstücke](https://actualbudget.org/docs/transactions/transfers/), [Splitgruppen](https://actualbudget.org/docs/transactions/split-transactions/). rotki: [lokale Ereignisanpassungen](https://docs.rotki.com/usage-guides/history/events). Portfolio Performance: [Buchungsübersicht](https://help.portfolio-performance.info/en/reference/view/accounts/all-transactions/), [direkte Bearbeitung](https://help.portfolio-performance.info/en/how-to/shortcuts/). Nur Bedien-/Schutzprinzipien verglichen; kein Fremdcode übernommen, keine allgemeine Archivfunktion dieser Projekte behauptet.

---

# Verbindlicher UI-/UX-Nachtrag zu #149 und #165 · 27.10.2026

Status: **PARTIAL: begrenzter Implementierungskandidat, noch nicht veröffentlicht.** Dieser konsolidierte Nachtrag ersetzt die zuvor gewünschten drei direkten Einzelbuttons „Notiz / Betrag-Datum / Rücknahme“ und die ältere Einschränkung „keine Buchungsarchivierung“. Bestehende fachliche Sperren und der freigegebene v188-Umfang bleiben bis zu einer geprüften Erweiterung verbindlich. Kein neuer Finanzkern, kein Redesign, keine parallele Implementierung. Laufender sicherer Ledger-Schritt #159/PR178 und dessen CI werden nicht unterbrochen; Umsetzung erst beim nächsten zulässigen UI-Schritt der zentralen Roadmap.

## Gemeinsame Oberfläche und direkte Aktionen

Positionen und Buchungen verwenden bestehende Komponenten, Styles und Auswahlengine. Gleiche Buttonmaße, Abstände, Farben und Anordnung; mobil dieselbe kompakte Zweispaltenstruktur der Auswahl-/Aktionsleiste. Buchungszeilen zeigen Datum, Typ, Anlage, Menge/Betrag und Herkunft kompakt, technische Nachweise bleiben ausklappbar.

Rechts oben in jeder Buchungszeile sind direkt ohne Auswahlmodus erreichbar: Stift = **Bearbeiten**, Papierkorb = **Löschen**, Archiv = **Archivieren/Wiederherstellen**. Nicht zulässige Aktionen deaktivieren mit verständlichem Grund oder ausblenden. Einzelaktionen und Sammelaktionen klar unterscheiden. Die alten separaten Hauptaktionen gehen in verständliche kontextabhängige Dialoge über; bestehende sichere Korrekturmechanismen werden intern weiterverwendet.

## Einheitlicher Bearbeitungsdialog und Herkunftsmatrix

Vor Implementierung tatsächliche Buchungs-/Positions-/Import-/Backup-/Reconciliation-Schnittstellen prüfen. Gewünschte Felder sind Datum/Uhrzeit, Buchungstyp, Anlage, Anbieter/Konto, Menge/Betrag/Preis/Währung, Gebühren/Steuern, Notiz/Kategorie und Zuordnungen zu Transfers oder Buchungen. Das ist eine **Zulässigkeitsmatrix**, keine pauschale Freigabe aller Felder. Nicht vorhandene Uhrzeit-, Kategorie- oder Belegsemantik nicht erfinden. Nicht zulässige Felder mit konkretem Grund kennzeichnen; kein scheinbar erfolgreiches Speichern ohne Änderung.

| Herkunft | Erforderlicher Vertrag |
| --- | --- |
| Manuell | Zulässige Felder nach vollständiger Integritäts- und Abhängigkeitsprüfung bearbeiten; vorhandenen #165-Vertrag verwenden |
| CSV/Broker | Originalbeleg und Quellidentität erhalten; Korrektur nachvollziehbar separat belegen; Wiederholungsimport darf sie nicht überschreiben |
| Blockchain/API | Unveränderte Quelldaten; nur belegte lokale Interpretation/Zuordnung korrigieren, keine externe Originaltransaktion umschreiben |
| Technische Bestandskorrektur | Herkunft und Abgleichsgrund anzeigen, Auswirkungen vor Änderung prüfen; niemals automatisch ignorieren oder entfernen |
| Nicht rekonstruierbare Kosten-/Transfer-/Historienabhängigkeit | Änderung blockieren; keine neuen Gegenbuchungen, Tax-Lots oder historischen Werte erfinden |

Die produktiven v188-Fälle werden nicht erneut entwickelt. Breitere wirtschaftliche Kategorien bleiben solange gesperrt, bis ihr eigener belegter inverser Fachvertrag, Tests und gegebenenfalls kritische Releasefreigabe vorliegen. Orientierung an Actual Budget, rotki und Portfolio Performance vor Übernahme auf tatsächliche Eignung prüfen; keine ungeprüfte Code- oder Architekturkoppelung.

## Löschen und gesicherte Wiederherstellung

Einzel- und Mehrfachlöschung nur für sicher ausführbare Fälle. Vorher sämtliche Abhängigkeiten, Transfergegenstücke und zusammengehörige Gruppen identifizieren; Folgen für Bestände, Einstandswerte, Rendite, Historien und Kontosalden prüfen. Finanzielle Auswirkungen konkret mit betroffenen Positionen zeigen, ausdrücklich bestätigen lassen, atomar übernehmen oder vollständig zurückrollen und sichere Wiederherstellung/Rücknahme ermöglichen.

Kein einzelnes technisches Journalposting löschen, keine unkontrollierten Cascades, keine Teilgruppe, keine stillen Bestandskorrekturen oder erfundenen Gegenbuchungen. Originalimporte und API-/Blockchain-Belege bleiben erhalten. Gelöschte oder ausdrücklich ausgeschlossene Ereignisse dürfen beim Reimport nicht unbemerkt reaktiviert werden. Dafür vor Code einen kompatiblen Source-/Ausschluss-/Wiederherstellungsvertrag prüfen; keine stillschweigende Storage-Migration und keine unnötig neue Identitätsengine.

## Archivieren ist keine Berechnungsausnahme

- **Archivieren:** reversible Sichtbarkeit, standardmäßig ausgeblendet, über Archivfilter erreichbar; keinerlei Einfluss auf Finanzberechnungen oder historische Ergebnisse.
- **Ignorieren / von Berechnungen ausschließen:** getrennte, ausdrücklich benannte Fachfunktion, nur geeignete Buchungsarten; konkrete Auswirkungsvorschau, Begründung und nachvollziehbarer Ausschlussstatus. Niemals als Archivieren darstellen.
- Technische Bestandskorrekturen werden durch keine der beiden Funktionen automatisch entfernt oder fachlich ignoriert.

Archivstatus muss von tatsächlichen vorhandenen Buchungstypen, sicheren Export-/Restore-Verträgen und stabilen Quellenidentitäten getragen werden. Keine UI-Markierung vortäuschen, die nach Speichern oder Restore verloren geht.

## Mehrfachauswahl und gemischte Fälle

Vorhandenen Zyklus weiterverwenden: aktuelle Seite → sämtliche gefilterten Einträge (ungefiltert alle) → Auswahl leer, redundante vollständig erfasste Stufen überspringen. Einzelcheckboxen, Anzahl, Filterbezug und Reichweite eindeutig; Abbrechen beendet Auswahlmodus. Filter/Sortierung/Pagination erweitern Auswahl nicht still. Keine versehentliche Auswahl aller Einträge, wenn nur die Seite gemeint ist.

„Alle archivieren“ und „Alle löschen“ betreffen ausschließlich ausgewählte zulässige Einträge. Sammelbearbeitung nur fachlich kompatibler Buchungen/Felder. Gemischte Auswahlen zeigen erlaubte und blockierte Fälle; keine stillschweigenden Teilerfolge. Archivfilter, Rückkehr aus Dialogen und Seitenwechsel korrekt berücksichtigen.

## Verbindliche Abnahme und Releasegrenzen

Synthetisch prüfen: manuell bearbeiten/löschen/archivieren; Importkorrektur mit unverändertem Original; technische Bestandskorrektur mit Sperren; Kauf/Verkauf mit Kostenabhängigkeit; Transfergruppe mit zwei Seiten; Filter/Pagination/Einzelauswahl/gemischte Auswahl; Archivieren/Wiederherstellen mit identischen Mengen, Cashflows, Bewertungen und Historien; Löschen → Reimport ohne stille Wiederaktivierung; Backup/Restore mit Status/Quelle/Audit; Fehler und vollständiger Rollback; CAS/Mehrtab/stale Vorschau; bestehendes Undo.

Mobile 320/390/430 und Desktop, mindestens 44×44 CSS-Pixel, kein horizontaler Overflow/Überlappung, Tastatur/Fokus/Axe/Touch. Alle drei direkten Zeilenaktionen ohne vorherige Mehrfachauswahl erreichbar. Blockierte fachliche Kategorien als blockiert prüfen, keine Scheinfunktion oder abgeschwächten Assertions.

Kleine sequenzielle Inkremente im bestehenden Hauptstrang. Neue finanz-, migrations-, backup- oder sicherheitskritische Mutationen erst als vollständig geprüfter reviewbarer Kandidat und anschließend nur nach konkreter Nutzer-Releasefreigabe veröffentlichen. Tatsächliche PRs/SHAs/Tests/Deployment/offene Gates im zentralen Checkpoint dokumentieren. Keine Änderung der Gesamtsequenz und kein vorzeitiger FLH05-A-Start; dessen Spezifikation und zwölf Testvektoren bleiben erhalten.

Dokumentiert in #149 Kommentar6452285529 und #165 Kommentar6452285941; diese neuere Fassung hat Vorrang vor Kommentaren6452174228/6452174628.

---

## Historischer Implementierungscheckpoint (freigegebenen Umfang erhalten)

# #165: Korrektur, Rücknahme, Vorschau, CAS und Undo — Kandidat

Basis main/v187 ab5c4aa9edcb44597975daf9684d5701f46a1cf1. Bestehender PR173 / Branch feature/booking-management-foundation wird weiterverwendet, nicht separat read-only gemergt. Vollständige frühere CI40511209825 ist Grundlage, keine Abnahme der neuen Mutationen. SW188 ist unveröffentlichter Kandidat. Kein Merge oder Deployment ohne konkrete Nutzerfreigabe.

## Zulässigkeitsmatrix

| Herkunft/Fall | Notiz | Wirtschaftliche Änderung/Rücknahme | Nachweis/Sperre |
|---|---|---|---|
| Eindeutig manuelle Buchung mit Journal | erlaubt, sofern kein Wallet-/Transfer-/Importbezug | nur folgende EUR-Cash-Fälle | Stabile ID, ein Journal je Buchung, globale Journal-/Mengenprüfung |
| Manuelle EUR-Einzahlung/Auszahlung/Dividende/Zinsen/Gebühr/Steuer | erlaubt | Betrag/Datum korrigieren oder vollständigen Geschäftsvorgang zurücknehmen | Exact-Mengen/EUR/Flow/Postings/Account gleich; EUR-Faktor1, kein zusätzliches Fee-/Tax-/Gegenkonto; keine weiteren Referenzen/späteren Kontrollpunkte |
| Manuelle Trades / Einstand / Kapitalmaßnahme | nur unkritische Notiz bei eindeutiger Herkunft | BLOCKED | Kein belegter inverser Kostenbasis-/Steuer-/Folgetransaktionsvertrag; kein rückwirkender Replay aus aktuellem Bestand |
| CSV/Broker/Exchange, auch ownership=manual | BLOCKED | BLOCKED | Quellidentität/Owned-Snapshot/Overlap/Batch-Undo darf nicht ungeprüft geändert werden |
| Transfer/Swap/Merger / bestätigte Zuordnung | BLOCKED | BLOCKED | Gegenbuchungs-/Transfervertrag zuerst gemeinsam prüfen; vorhandenes Transfer-Undo bleibt separat |
| Wallet/Blockchain | BLOCKED | BLOCKED | Eigentums-/Replay-/Dedupevertrag bleibt erforderlich |
| Technischer Journal-only Vorgang / unbekannte Herkunft | BLOCKED | BLOCKED | Kein isoliertes Journalposting-DELETE |
| Generierte technische Bestandsabgleichzeile | BLOCKED | BLOCKED | Kein gespeicherter selbständiger Geschäftsvorgang |
| Weitere Referenzen / spätere Snapshots / widersprüchliche Bestände | gegebenenfalls reine manuelle Notiz | BLOCKED | Konkreter Grund in Vorschau; keine Ausgleichseinzahlung oder Cascade |

## Implementierter Vertrag

Vorhandene Auswahlengine und bookingHistoryRows bleiben kanonisch. Auswahl gilt vor Pagination; globale Auswahl erfordert ausdrückliche Entscheidung, verdeckte Mengen sichtbar. Aus Sicherheits-/Ressourcengründen höchstens200 Geschäftsvorgänge je wirtschaftlicher Prüfung, nie stillschweigend Teilmengen bearbeiten.

Vorschau gruppiert betroffene Konten/Positionen und zeigt exakte Cashmengen, Gebühren/Steuern vorher/nachher, unveränderte oder unbekannte Einstandswerte, externe Flüsse sowie Historiengrenzen. Fehlende Rendite-/Kurswerte werden nicht erfunden. Abhängige Import-/Wallet-/Transferbelege werden gesperrt statt implizit kaskadiert.

EUR-Cash-Rücknahme entfernt die exakt verknüpfte vollständige manuelle Buchung samt ihrem gesamten Journalereignis und belegtem eigenen externen Flow. Sie entfernt niemals einzelne Postings. Die historische Folge wird mit vorhandenen Eröffnungen und verbleibenden Journalbewegungen geprüft; negativ werdende Zwischenbestände blockieren. Ersatzbuchungen laufen durch executeTransaction, einschließlich dessen Chronologie-/Mengenprüfungen.

Originalbuchung, kompletter Originaljournalsatz, eigene Flüsse, Beleggrund und Nachherbezug bleiben in einem validierten audit-only Journalereignis erhalten. Dieses besitzt genau ein Nullwert-Dokumentationsposting ohne Position/Konto/Menge und erzeugt keine Finanzbewegung oder neues künstliches Finanzdatum. Audit-Nachweise überstehen vollständigen Backup/Restore. Validierte eigene Nullwert-Auditnachweise werden von fremden wirtschaftlichen Referenzen unterschieden. Die jüngste eindeutige Änderungskette muss exakt zum aktuellen Vorgang passen; andernfalls gesperrt. Dadurch bleiben wiederholte belegte Korrekturen möglich.

Commit berechnet Kandidaten erneut gegen exaktes Vorabbild, benötigt Checkbox und aktuellen IndexedDB-CAS-Stand, prüft Busy/Recovery/Mehrtab vor/nach Await und speichert genau eine Revision. Abbruch und Vorschau schreiben nichts. Undo ist ein sitzungslokaler exakter Vorabbild-Receipt, nur bis zur nächsten beliebigen Portfolioänderung und erneut mit CAS. Nach Reload/weiteren Änderungen bleibt Backup/Änderungsnachweis, keine universelle Undo-Garantie.

Oberfläche: Auswählen, gefiltert/alle/aufheben, Notiz, Betrag/Datum, Rücknahme prüfen, Bestätigung, optionales Undo und geschlossene Änderungsnachweise im v187-Stil. Vorhandener Dialog-/Escape-/Discard-/Fokusvertrag wird wiederverwendet.

## Fachliche Referenzen

- 100+20 EUR Einzahlung -> Rücknahme exakt100; externe20 entfällt; Eröffnung unverändert, Original bleibt Auditbeleg.
- 100+20 -> Betrag7,25 ergibt107,25; externer Flow exakt7,25.
- Alle sechs EUR-Cash-Arten unabhängig gegen blankes Referenzportfolio geprüft, auch Ertrags-/Gebühren-/Steuerübersicht.
- Zwei gleich benannte Cashpositionen/Konten bleiben getrennt; gemischter gesperrter Batch wird nicht teilweise übernommen.
- Späterer Verbrauch140 bei100+50: Entfernung50 führt zu negativem Verlauf und bleibt unverändert gesperrt.
- Falsches FX, fehlende/abweichende EUR-Beträge, Source/Ownership, gespeicherte Referenzen, Snapshots, stale IDs und Preimages blockieren.

## Prüfstand / nächster Schritt

Lokal733 Unit-Tests /0Fail/0Skip und Syntax bestanden. Neue unabhängige Fachtests sowie ein Browserflow für205 Buchungen/103 gefilterte, fünf Breiten/Axe, Vorschau/Escape, echte Quota/post-put-Abbrüche, konkurrierenden Tab, Offline-CAS, Undo und frischen plain/encryptedRestore vorhanden. Lokale Browserbinary fehlt; neue vollständige GitHub-CI und echte Bildprüfung noch offen. Keine vollständige Phase-A-Abnahme behauptet.

Nächster Schritt: finale PR173-CI/Bilder auswerten, Fehler beheben, Fach-/Source-Review sichern. Erst danach konkrete Produktionsfreigabe für diesen begrenzten belegten Umfang einholen. Breitere Trade-/Import-/Walletmutationen bleiben explizite Fachblocker, nicht als fertig melden.

## Gesamtfortsetzung

Broker-/Exchange-Originaldateien sind hier weiterhin nicht zugänglich. Für Ledger ist der frühere private 12-Spalten-Schemaaudit bereits in den Kommentaren von #159 belegt; nicht wiederholen. Offizielles LedgerHQ csvExport.ts wurde zusätzlich an c7947b848a87b175c8d7d4a81ed255ca26ab800e geprüft (gleiche12Spalten). Konto-/Chain-/Assetidentität, IN-/OUT-Feezuordnung, Mehrfachoperationen je Hash und reale Zuordnung müssen weiterhin belegt werden; Countervalues sind Marktbeobachtungen, keine Kauf-/Steuerbasis. FLH04#160/#161 braucht Operator/OAuth/Remote-Concurrency/Neugerät/Recovery-Nachweise und eigene Freigabe. D157 nur mit neuer Browserhypothese. CI-Optimierung erst nach diesem sicheren Funktionscheckpoint, vorhandene Baseline aus PR172 wiederverwenden.

## Erster neuer Remote-Lauf

CI40517607177 Chromium erreicht neue Buchungsprüfungen nach bestandenen Finanz-/Historien-/Auswahl-/CAS-/Archivregressionen. Neue Axe-Prüfung meldet nach Resize Kontrast an addBooking.action-label. Testflow wartet nun auf tatsächlich laufende endliche Animationen plus zwei Frames (wie bestehende strenge Gates), keine Assertion geändert. Bei erneutem Fehler werden ComputedStyles/Viewport/Animationszustände diagnostiziert. Tatsächlicher Produktkontrastfehler noch nicht ausgeschlossen. Kein Merge/Deployment.

Weitere Review-Korrektur: nextJournalSequence verwendet die höchste vorhandene Sequenz statt der Journalanzahl, damit Folgegeschäftsvorgänge nach Rücknahmen nicht doppelte/kleinere Nummern erhalten. Regressionsfall Rücknahme + Folgeeinzahlung mit unabhängigem Sollsaldo113 EUR bestanden. Neuer Browserflow ergänzt echte UI-Rücknahme, Notiz/Undo und programmgesteuerten Submit auf gesperrter Importherkunft. Kontenfixtures sind ausdrücklich getrennte Konten.

CI40519556015: neue Chromium-Prüfungen für Korrektur, Rücknahme, Notiz, Undo, Restore/CAS erreichen den zuletzt ergänzten Import-Sperrfall. Tatsächlicher UI-Fehler: hidden-Attribut des saveDialog wurde durch .btn-display überschrieben. Gezielter [hidden]-Style korrigiert die Sichtbarkeit, programmatischer Submit bleibt weiterhin durch preview.ready und Provenienz gesperrt. Testassertionen unverändert. Referenzprüfung zusätzlich auf8MB/200kKnoten/64Ebenen begrenzt; übergroße/ungeklärte Strukturen bleiben unverändert gesperrt. Vollständige letzte CI noch erforderlich.

Fokusvertrag ergänzt: nach Commit/Undo ersetzt der Render die auslösenden Verwaltungsbuttons. Der gemeinsame Dialogguard fokussiert dann die neue Buchungsaktion, analog zur bestehenden Positionsverwaltung; gezielte Browserassertionen prüfen beide Fälle.

Bildprüfung: Kontoeffekte in320/390/1440 tatsächlich angesehen. Anschließend Belegreferenz und aufklappbare Einzelübersicht jeder ausgewählten Buchung (ID, Typ, Position, Datum/Betrag/Notiz vorher/nachher) ergänzt, damit Bestätigung nicht nur Kontosummen zeigt. Browser prüft die tatsächlich geöffneten Vorher/Nachher-Felder; unveränderte Fachassertions bleiben. Neue finale CI erforderlich.

Abschließender Referenzreview: unbekannte Buchungs-/Journal-/Postingfelder sowie unbekannte Referenzen sperren auch Notizänderungen. Eigene validierte Auditnachweise werden nicht fälschlich als fremde wirtschaftliche Verknüpfung behandelt; die jüngste eindeutige Sequenz muss mit dem aktuellen Vorgang übereinstimmen. Nachherbelege sind eigenständige tiefe Kopien statt Objektaliase. Neue Referenzfälle prüfen mehrfache Korrektur/Notiz/Rücknahme, unbekannte Metadatenreferenzen, abweichende/doppelte Auditketten und Manipulation. Lokale733Tests bestehen; finale Remote-Abnahme dieses Heads offen.


## Gemeinsamer UI-Nachtrag: Positionen und Buchungen

Vorheriger fachlicher Checkpoint `9daa130d514a928179ed1018883a40f2dde28393`: CI [40524779982](https://github.com/joke0071/foliolab-open/actions/runs/40524779982) vollständig erfolgreich mit733 Unit-Tests und allen drei Browsern. Keine Veröffentlichung.

Im selben PR-Strang integriert, kein paralleles Paket: bestehende stabile Auswahlengine erhält eine gemeinsame `cycle`-Aktion. Sie ergänzt zuerst die aktuell dargestellte Seite (bestehendes „Weitere anzeigen“ erweitert diese), dann den gesamten Filterbereich und setzt danach vollständig zurück. Bereits vollständige Bereiche überspringen wirkungslose Stufen. Filter, Sortierung und Pagination selbst verändern keine IDs. Einzelauswahl bleibt erhalten. Ohne Positionsfilter umfasst der explizit beschriftete Gesamtbereich auch archivierte Positionen. Ohne Buchungsfilter sämtliche vorhandenen Buchungszeilen. Abbrechen beendet den Modus. Keine Auswahlmenüs mehr.

Positionen: dieselben drei Einzelicons stehen im oberen Kartenbereich, Checkbox links, Icons rechts mit Umbruch und44px-Zielen. Oben „Alle löschen“ (bestehende Vorschau) und „Alle archivieren“. Neue Sammelarchivierung setzt ausschließlich vorhandene Archivflags für die explizite Auswahl; bereits archivierte Zeilen bleiben unverändert. Bestätigung, genaue Liste/Konten und Auswirkungen, exakter Modellvorstand und IndexedDB-CAS vor einem atomaren Save. Wiederherstellung über vorhandene Einzelaktion. Keine neue Finanz-/Importengine.

Buchungen: Zulässigkeit derselben vorhandenen Auswirkungenprüfung bestimmt die aktivierten Aktionen; konkrete Sperrgründe stehen direkt unter der Leiste. Keine Archivierung, keine Umgehung der Vorschau/Bestätigung/atomaren Fachprüfung. Notiz und Betrag/Datum weiterhin nur einzeln, gemeinsame Rücknahme nur bei vollständig belegter Zulässigkeit und innerhalb der bestehenden Grenzen.

Automatisierte Referenzen ergänzen Checkbox-Zyklus, Teil-/Einzelauswahl, leere/einseitige Filter, Pagination, Abbrechen, versteckte IDs und deaktivierte Herkunftsfälle. Bestehende wirtschaftliche und Speicherfehlerassertionen bleiben erhalten. Neue Sammelarchivierung prüft tatsächliche Quota-/post-put-Abbrüche, exakt einen Commit und unveränderte wirtschaftliche Daten. Geometrie und Axe für320/390/430px sowie Desktop. Lokale735 Unit-Tests erfolgreich; neue Browserabnahme nach diesem UI-Head noch ausstehend.

**Release-Gate bleibt geschlossen:** neue Buchungsmutationen und neue Sammelaktionen erst nach eigener konkreter Nutzerfreigabe mergen und produktiv schalten. Kandidat SW188 bleibt unveröffentlicht.


UI-CI40527206898: Positionsauswahl, sechs Breiten, obere Kartenicons/Geometrie, zwölf Axe-Prüfungen und bestehende Quota-/CAS-/Offline-/Restore-Referenzen erfolgreich. Archivtest erwartet nach verändertem Sichtbereich noch sofort die alte globale Auswahl. Test auf die neue belegte Zweistufe erweitert:201 bestehend →250 nach expliziter sichtbarer Seite →401 nach explizitem Gesamtbereich; keine Produktlogik angepasst. Neue Sammelarchivierungs-Vorschau zusätzlich in320/390/430/1440 mit Axe und44px-Footer geprüft. Separate Test-Settings beim Wiederherstellen des synthetischen Fixtures erhalten. Positions-Auswahlbuttons explizit auch am Desktop mindestens44px hoch.


Statischer Folgereview: Undo-/Audit-Markup wird nach der Auswahlleiste ergänzt; der finale Checkbox-DOM erhält seinen checked/indeterminate-Status deshalb erst danach. Browserreferenz prüft Teil-, Seiten- und Einzelauswahl ausdrücklich auch nach vorhandener Änderung samt Undo/Audit und unveränderten Speicherbytes. Synthetische Buchungsfixture hat deterministische IDs, damit gleichdatierte Sortierung und die100er-Seite reproduzierbar bleiben; keine Zufallsannahme über UUID-Reihenfolge.
