# K6-TRUST / #298 C · Grafikherkunft in v316 · 15.11.2026

**Die interne Quellenkette ist konkret zugeordnet; ursprüngliche Zeichnungsrechte und der technische PNG-Export bleiben teilweise unbelegt. Ein fehlender verpflichtender Hinweis wurde nicht nachgewiesen. Kein Hinweis-Patch.**

Basis bleibt v316/Main `82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69`. Das abgeschlossene [Auslieferungsinventar](K6_TRUST_ATTRIBUTION_V316_2026-11-15.md) wird weiterverwendet. Nur die betroffenen sieben Dateien und ihre Fragmente wurden anhand der vorhandenen Hashes verglichen; keine neue Release-CI.

## Nachtrag · 22.11.2026

**Alle drei PWA-PNGs sind aus der eingecheckten SVG-Datei bytegenau reproduzierbar.** Die vier Git-Blobs stimmen zwischen der Einführung `040853ca` und Main `b2ff4a80` überein. Die Standard-PNGs werden transparent in 192 bzw. 512 px gerendert. Bei der maskierbaren Variante liegt die zu 70 % skalierte Vorlage mittig auf 512 × 512 px mit Hintergrund `#214d38`. Der Vergleich lief mit Chromium 141.0.7390.37 unter Linux x86_64 und meldete je Datei dieselbe SHA-256 wie das Original. Die Herkunft der Zeichnung, ihre Rechtezuordnung und das historische Herstellungsprotokoll bleiben offen. Die Aussagen zum technischen Export in den Abschnitten unten beschreiben den Stand vom 15.11.

Reproduktion aus einem Checkout mit den vier Icons. Zuerst `npm install --no-save --package-lock=false playwright@1.56.1` und `npx playwright install chromium --only-shell` ausführen. Danach das [Reproduktionsskript](release-evidence/pwa-icon-export-reproduction-2026-11-22.mjs) mit Node ausführen und den Pfad zum Checkout als Argument übergeben. Das Skript vergleicht die PNG-Bytes und meldet Größen sowie SHA-256. [Maschinenbeleg](release-evidence/pwa-icon-export-reproduction-2026-11-22.json).

## Entscheidungen je Grafikgruppe

| Gruppe | Stärkster konkreter Beleg | Nachgewiesen | Noch benötigter Primärbeleg |
| --- | --- | --- | --- |
| Funktionszeichen in `src/format.js` | Das [hochgeladene v1-ZIP](https://github.com/joke0071/foliolab-open/blob/33eaf2966d591642d567e590bb5769703d58982d/foliolab-open-v1.zip) enthält die Datei bereits; sie wurde in [b2488907](https://github.com/joke0071/foliolab-open/commit/b248890792ca56987d16a5bc7884d9c84970e9a3) bytegleich veröffentlicht. 14 der heutigen 23 Funktionszeichen sind darin unverändert enthalten. Spätere Definitionen sind über die festgehaltenen Versionen und PRs #57/#170/#185/#289/#322 zugeordnet. | Der früheste auffindbare Importgegenstand ist das Projekt-ZIP, nicht eine nachträglich vermutete Iconbibliothek. Aktuelle Fragmente und Änderungen sind einzeln mit Hash erfasst. | Ursprünglicher Erstellungsauftrag/Entwurf oder Herkunftsauskunft zum ZIP und zu späteren Zeichen, soweit ein gemeinsamer Beleg sie nicht umfasst; bei Übernahme die tatsächliche Quelle und Fassung. Das ZIP nennt keine gesonderte Iconquelle. |
| 20 aktuelle Inline-SVGs in `index.html` | Alle 20 anhand ihrer Originalhashes und geometrischen XML-Struktur passenden Projektständen zugeordnet; Aufträge und PRs unten. | Konkrete Implementierungszusammenhänge statt eines pauschalen Verweises auf b2488907. **Kalender Nr.10:** PR #72 nennt ausdrücklich die private FolioLab-Vorlage; deren Kalender stimmt geometrisch überein. | Für die ursprünglichen Zeichen hinter diesen Implementierungen eine Erstellungs-/Importauskunft; für den privaten Kalender dessen ursprünglicher Entwurf oder Herkunft. Die private Vorlage ist die belegte unmittelbare Quelle, noch kein Nachweis einer fremden Iconbibliothek. |
| Sieben Zeichen in `src/position-icons.js` | [Einführung550837c3](https://github.com/joke0071/foliolab-open/commit/550837c342002277e2669bc52d682f25b09e89ff), [PR #134](https://github.com/joke0071/foliolab-open/pull/134) und dessen Kommentare/Reviewstand. | Gemeinsamer Auftrag „Anlageklassensymbole im FolioLab-Stil“ umfasst ETF, Aktie, Fonds, Krypto, Guthaben, Festgeld, Sonstiges. Ganze Datei/Gitblob `3630fee430d88897294f3f9b81e3473dc4c703cc` ist bytegleich zu v316. | Der ursprüngliche Erstellungs-Chat/Zeichenentwurf oder eine ausdrückliche Herkunftsauskunft für diese sieben Pfade. PR, Kommentare und Review enthalten keinen Import-/Upstreambeleg und keine Entwurfsdatei. |
| Flaschenzeichnung `icons/flask.svg` | Initiales SVG schon im v1-ZIP und bytegleich zu b2488907; Änderungen211aa77f/a2554cc1/[4557f190](https://github.com/joke0071/foliolab-open/commit/4557f190e2569edf943e76a0f5c91e2e0337ea4d). Letzterer nennt einen „approved slimmer flask design“ und ändert Icon und Hero gemeinsam. Aktueller Blob `823323630cb3fe1b9a6342e9d6e5421554c1194d`. | Konkrete Projektentwicklung der Vorlage und unveränderte Übernahme dieses finalen SVGs bis v316. Keine verknüpfte PR, Kommentarbeilage oder ursprüngliche Entwurfs-/Importdatei für4557f190 gefunden. | Die tatsächlich freigegebene schlankere Kolbenvorlage vom 23.10.2026 mit Erstellungs-/Herkunftsauskunft; gegebenenfalls ihr älterer Ausgangsentwurf aus dem v1-Paket. |
| Historischer Hero | Icon und Hero in4557f190 teilen Hals-, Kolbenkontur- und Flüssigkeitspfad exakt. Der Pfeil unterscheidet sich gezielt (`18-12` im Icon, `16-12` im Hero), ebenso Strich-/Farbpräsentation. | **Historische Ableitung vom gemeinsamen Kolbenmotiv belegt. Der Flaschen-Hero ist im ausgelieferten v316-HTML nicht mehr vorhanden.** Er ist daher keine zusätzliche aktuelle Grafikgruppe. | Für die gemeinsame ursprüngliche Zeichnung genügt derselbe Beleg wie für den Kolben; kein eigener Hero-Urheberbeleg nötig, solange diese belegte Anpassung umfasst ist. |
| Drei PNGs in `icons/` | [Einführung040853ca](https://github.com/joke0071/foliolab-open/commit/040853ca948554fb6a1e985ca5e5bc69836d421e), [PR #279](https://github.com/joke0071/foliolab-open/pull/279): „Originalgetreue 192-/512-PNGs und ein eigenes maskable Icon ergänzen das SVG“. Alle drei dort eingeführten Gitblobs werden unverändert ausgeliefert. Originalbilder selbst angesehen. | Exportauftrag und vorgesehenes Quellmotiv sind zugeordnet. Herkunft der **Zeichnung** ist die separate Kolbenfrage. | Für die technische **Ableitung** fehlt das Exportskript/-kommando oder ursprüngliche Herstellungsprotokoll mit Quell-SVG, Größen, Maskable-Skalierung/Hintergrund und Ausgaben. In Einführungsdiff/-baum, Workflow und verknüpfter PR nicht hinterlegt. Die damaligen Tests prüfen PNG-Abmessungen, nicht die Erzeugung. Bildähnlichkeit ersetzt keinen Exportnachweis. |

## Vollständige Zuordnung der aktuellen Inline-SVGs

Nummern entsprechen der Reihenfolge im bereits gesicherten v316-HTML; [Originalhash, Zeile und passende Quellstände](release-evidence/v316-graphic-provenance-2026-11-15/graphic-lineage.json) bleiben eindeutig.

| Nr. | Motiv | Konkreter Projektkontext |
| --- | --- | --- |
|1| Portfolio-Donut beim Start | [PR #320](https://github.com/joke0071/foliolab-open/pull/320),74fd8bc0; Auftrag [#300](https://github.com/joke0071/foliolab-open/issues/300) verlangt kleine SVG/CSS-Animation nach visueller Referenz. Kein importiertes GIF/Video. |
|2,16| Gerät plus für Installation | Derselbe SVG-Pfad in PR #320; Verlagerung in Sidebar/Mehr durch [PR #331](https://github.com/joke0071/foliolab-open/pull/331),21e46518. |
|3| Schließen des Installationsangebots | PR #331,21e46518. |
|4,6 und5,7| Speicher und Drive, jeweils mobil/desktop | [PR #244](https://github.com/joke0071/foliolab-open/pull/244),d259b0b4; zwei tatsächliche Statusaktionen. |
|8,9| Warnsymbol und Navigationspfeil des Prüfhinweises | [PR #322](https://github.com/joke0071/foliolab-open/pull/322),258fb237. |
|10| Kalender | [PR #72](https://github.com/joke0071/foliolab-open/pull/72),060b4ca0 nennt die private UI-Vorlage. Geometrisch identischer Kalender im geprüften Vorlagenstand2ddf598f. |
|11,12,15 und13| Plus und Wallet | Unveränderte gleichnamige Geometrie bereits im v1-format.js; unter anderem [PR #77](https://github.com/joke0071/foliolab-open/pull/77),46783f38 vereinheitlicht Darstellung und Aktionen. |
|14| CSV-Datei/Upload | PR #77,46783f38. |
|17,19,20| Aktualisierung, Blockchain-Verbindungen, Datenschutzhinweise | Im konkreten Einstellungsstand53d0c04f sowie späteren Ständen vorhanden. |
|18| Einstellungen | Geometrie des bereits im v1-Paket enthaltenen `more`-Symbols; konkreter Inlinebestand unter anderem in e0c4462a. |

„Passender Quellstand“ bezeichnet einen überprüften Nachweis der Form; nicht jede Tabellenzeile beansprucht den allerersten Zeichenzeitpunkt. Die genaue Vergleichsmethode entfernt lediglich Darstellungsattribute und äußere Anzeigegrößen; sie ist keine Ähnlichkeitssuche nach einer vermeintlichen Bibliothek. Für identische Mehrfachverwendungen genügt der gemeinsame Beleg.

## Quellenprüfung und Grenzen

- Das ZIP stammt aus Uploadcommit33eaf296 und wurde im Publikationscommitb2488907 entfernt/ausgepackt. Größe33346Bytes, Gitblob `27ece1180c0abbec03cf5650d892d82d6d39daae`, SHA256 `fd275ba02f946074aa36afd064aecf29f107965672816a3b44078c3ae29bd624`; ZIP-CRC geprüft. Format, HTML und initiales Flaschen-SVG stimmen bytegleich mit der Veröffentlichung überein. Kein ursprüngliches Zeichenprojekt oder Exportskript im Archiv.
- Private Vorlage ausschließlich wegen des konkreten Hinweises in PR #72 gelesen. Nur geschützte Datei-/Geometriehashes und das Übereinstimmungsergebnis werden als Beleg dokumentiert; keine privaten Appinhalte, Portfoliodaten oder Rohdateien veröffentlicht. Im geprüften Vorlagenbaum keine LICENSE/NOTICE zugeordnet. Das beweist keinen fremden Lizenzverstoß; eine Rechtefreigabe allein aus gleichem Repositoryinhaber wird nicht erfunden.
- Verknüpfte PRs, bei den vier Ausgangscommits vorhandene Commitkommentare sowie Kommentare/Reviews von #134/#279 geprüft. Die PRs belegen Implementierungsaufträge, nennen aber keine tatsächliche fremde Iconbibliothek oder verwendete Version. Die persönliche Kontextsuche lieferte nur spätere Audittexte, keinen ursprünglichen Erstellungsbeleg. Deshalb keine erneute spekulative Feather-/Lucide-Suche.
- PNG-Dateien enthalten keine Herkunftsmetadaten. Alle drei Bilder passen sichtbar zum Kolbenmotiv; daraus werden weder Renderer noch exakte Transformationsparameter oder ursprüngliche Rechte abgeleitet. Kein neuer Render-/CI-Lauf wurde als nachträglicher Herstellungsbeleg ausgegeben.
- **Keine nachgewiesene fremde Übernahme mit bestimmbarer Pflicht und fehlendem Hinweis.** Deshalb kein Lizenztext unter falschem Namen, kein Produktbranch/PR und kein Merge/Deployment. C und K6-TRUST bleiben VERIFY. K4 PARTIAL, A09 OPERATOR_INPUT_PENDING und offene WebKit-Frage unverändert; PR339 seitv316produktivDONE.

[Maschinenlesbare Gruppenentscheidung](release-evidence/v316-graphic-provenance-2026-11-15/decision.json) · [Primärkontexte und Quellidentitäten](release-evidence/v316-graphic-provenance-2026-11-15/source-contexts.json).

## Eine gebündelte Frage an Jochen

Kannst du für v1-Symbole samt privatem Kalender, die sieben PR-134-Zeichen und den Kolben die ursprünglichen Entwürfe/Erstellungs-Chats oder eine Herkunftsauskunft sowie für PR #279 das PNG-Exportskript/-kommando bereitstellen?

Eine gemeinsame Auskunft kann mehrere Zeichen abdecken, wenn sie diese Gruppen und Versionen ausdrücklich umfasst. Bei tatsächlicher Fremdquelle anschließend nur deren Originalfassung und LICENSE/NOTICE prüfen; einen Hinweis-Patch erst bei belegter Pflicht und fehlendem Hinweis vorbereiten. Writer mit dem zentralen Checkpoint abgegeben.
