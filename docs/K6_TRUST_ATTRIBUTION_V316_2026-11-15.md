# K6-TRUST · Issue #298 C · Attribution in v316 · 15.11.2026

**Das Auslieferungsinventar und die Schriftprüfung sind abgeschlossen. Abschnitt C bleibt VERIFY: Die Herkunft der benannten SVG-Gruppen ist nicht abschließend belegt. Eine konkret fehlende Drittanbieter-Lizenz wurde bisher nicht nachgewiesen.**

Es gibt daher keinen sachlich begründeten Produktpatch. Ein leerer Lizenztext oder ein eigener „Lizenzen“-Menüpunkt würde die offene Herkunft nicht klären.

## Basis und vorhandene Belege

Produktbasis: v316 LIVE_ACCEPTED, Main `82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69`, Tree `11429de9e06d9d014875af624cb80bafafb38f20`. [Release-Abnahme](V316_RELEASE_ACCEPTANCE_2026-11-15.md) und [gesichertes Pages-Manifest](release-evidence/v316-live-accepted.json) werden weiterverwendet. Alle 154 restaurierten Pages-Dateien stimmen in Größe und SHA256 mit dem gesicherten Manifest und in ihrem Gitblob mit Main überein.

Die [Vorprüfung vom 08.11.](QUALITY298_RUNTIME_AUDIT_PREPARATION_2026-11-08.md) und der jüngere [C-Audit vom 11.11.](https://github.com/joke0071/foliolab-open/issues/298#issuecomment-6784038991) bleiben gültig. Letzterer lautete ausdrücklich **REPO-INSPECTED / PROVIDER-RIGHTS-UNKNOWN** und zertifizierte keine vollständige Asset-Herkunft.

Gegen dessen Main `9ab3653fc508fa35fe0f20ecf56a14004f837d3e` sind 135 ausgelieferte Dateien identisch, 18 geändert und eine neu (`src/install-hint-preference.js`). Die vier Bilddateien, format.js, position-icons.js, Loader-/Diagrammmodule und der Browserworker sind unverändert. Der [Produktdiff](https://github.com/joke0071/foliolab-open/compare/9ab3653fc508fa35fe0f20ecf56a14004f837d3e...82ce984b1a0406ac37c8bdb5a2cf856afa4b7e69) zeigt kein neu erkennbares Vendorpaket. Der Abgleich basiert auf den ausgelieferten Bytes, nicht auf dem abweichenden Produktbestand des Checkpointbranches.

## Komponenten und Hinweise

| Ausgelieferter Pfad / Bestandteil | Herkunft und Fassung | Vorhandener Hinweis / Bewertung |
| --- | --- | --- |
| `styles.css`: Inter und Systemfontstack | Ausschließlich CSS-Familiennamen. Keine Schriftdatei, @font-face, CSS-Imports oder CSS-URLs im geprüften Bestand. | **Schriftprüfung abgeschlossen:** Keine mitgelieferte oder durch FolioLabs styles.css nachgeladene Inter-Datei. Daraus ist keine fehlende OFL-Datei abzuleiten. |
| 147 lokale JS-Dateien einschließlich `sw.js` und `src/wallet-history-days-worker.js` | 502 statische und vier literale dynamische Importe sind lokal; ein lokaler Modulworker. Root- und Worker-package.json am Produkt-SHA deklarieren keine Runtime-Abhängigkeiten. | Projekt-MIT im Repository. **Liefer- und Modulabgleich abgeschlossen**, aber Importfreiheit belegt keine Autorschaft jedes Fragments. Keine React-/Vue-/Charting-Bibliothek erfunden. |
| `src/drive-backup.js:88–98` → `https://accounts.google.com/gsi/client` | Offizieller Google-Identity-Services-Endpunkt; bedingt geladen bei konfiguriertem Client bzw. Verbindung. Nicht im Pages-Manifest oder Precache. Providerdatei ohne feste Version. | Oberfläche benennt „Google Drive Backup“ und Google-Drive-Autorisierung. Direktladepfad belegt. Maßgeblich sind Google APIs Terms und API-Dokumentation; keine Apache-Lizenz aus dem Footer von Dokumentationsbeispielen auf das SDK übertragen. Kein konkreter fehlender mitzuliefernder Hinweis belegt. |
| `src/format.js` und 20 Inline-SVG-Blöcke in `index.html` | Projektgeschichte seit Einführungscommit b2488907 und spätere UI-Änderungen belegt. Kein Quellen-/Versionsnachweis einer Iconbibliothek gefunden. Inlineblöcke einzeln mit Zeile und Hash erfasst. | **Herkunft offen; Upstream-Lizenz nicht zugewiesen.** Keine per Icon zugeordnete Fremdattribution. Entscheidend wäre ein Erstellungs-/Eigenzeichnungsbeleg oder Originalquelle, feste Version, Glyphenzuordnung und ursprüngliche LICENSE/NOTICE. |
| `src/position-icons.js`: sieben Positionszeichen | Einführung `550837c342002277e2669bc52d682f25b09e89ff`; seit der Vorprüfung identisch. Der Commit beschreibt passende Strichgrafiken, enthält aber keinen Import-/Quellennachweis. | **Herkunft offen.** Benötigt wird ein auf diese sieben Pfade bezogener Erstellungsbeleg oder die Upstreamversion mit Symbolzuordnung. Commitautor und Projekt-MIT allein entscheiden das nicht. |
| `icons/flask.svg`, drei PNG-Größen, Hero-SVG in `index.html` | SVG-Historie bis 4557f190, PNG-Einführung `040853ca948554fb6a1e985ca5e5bc69836d421e`. Alle vier Bilddateien unverändert seit der Vorprüfung. | **Originalrechte und Exportlinie offen.** Benötigt: ursprüngliche Zeichnung/Herstellungsbeleg sowie Zuordnung der drei PNG-Exporte, alternativ Originalasset, Version und Lizenz. Eigene Marke, Dateinamen und Überarbeitungshistorie ersetzen diesen Beleg nicht. |
| `src/allocation-ui.js`, `src/dashboard-ui.js`, `src/loading-ui.js`, Startup-SVG | Lokale geometrische Generatoren; keine externe Chart-/Spinnerbibliothek geladen. Unverändert seit der Vorprüfung. | Kein zusätzlicher Vendorbestandteil oder Noticebedarf identifiziert. Keine allgemeine Autorschaftszertifizierung daraus abgeleitet. |

## Originalquellen und Aussagegrenzen

Die [Google-Ladeanleitung](https://developers.google.com/identity/oauth2/web/guides/load-3p-authorization-library), Stand 28.10.2026, verlangt Direktladen vom GSI-Endpunkt und unterstützt keine Offlinekopie. Die [Google APIs Terms](https://developers.google.com/terms), Revision 09.11.2021, unterscheiden Open-Source-Bedingungen, Erhalt bestehender Hinweise und API-spezifische Attribution (§§2e,4a9,5e,6b). Diese Quellen belegen keinen bestimmten SDK-Build. Dessen genaue Bytes und Hinweisblöcke wurden im isolierten v316-Lauf nicht aufgezeichnet; eine zusätzliche lesende Abrufanfrage war über das verfügbare Quellwerkzeug nicht möglich. Kein vollständiger Remote-SDK-, OAuth- oder Branding-PASS behauptet; mögliche interne SDK-Ressourcen sind nicht durch die Schriftprüfung des FolioLab-Payloads abgedeckt.

Nur als **Hypothesenvergleich** geprüft: [Feather 4.29.2 folder.svg](https://github.com/feathericons/feather/blob/v4.29.2/icons/folder.svg) mit [Original-MIT](https://github.com/feathericons/feather/blob/v4.29.2/LICENSE) und [Lucide 0.468.0 folder.svg](https://github.com/lucide-icons/lucide/blob/0.468.0/icons/folder.svg) mit [Original-ISC](https://github.com/lucide-icons/lucide/blob/0.468.0/LICENSE). Die geprüften Folderpfade sind nicht byteidentisch mit FolioLabs Folderpfad. Das beweist weder Übernahme noch unabhängige Entstehung. **Keine dieser Bibliotheken oder Versionen wurde FolioLab deshalb zugewiesen.** Bei belegter Übernahme verlangen die jeweiligen Lizenztexte den Erhalt der betreffenden Copyright-/Erlaubnishinweise bei Verteilung. Ein eigener UI-Menüpunkt wird darin nicht verlangt.

Externe API-Daten bleiben wie im Vorbeleg **PROVIDER-RIGHTS-UNKNOWN**. Dieser Dateiabgleich erteilt keine Nutzungs- oder Weiterverteilungsrechte an Datensätzen. Der optionale Serverworker gehört nicht zum Pages-Payload; der tatsächlich ausgelieferte Browserworker wurde mitgeprüft. Reine Entwicklungs-/Testwerkzeuge wie Playwright, Axe und pngjs liegen außerhalb der 154 Dateien.

## Belege und nächster 1.0-Schritt

- [Entscheidungsmatrix](release-evidence/v316-attribution-2026-11-15/decision.json)
- [154-Dateien- und 147-Modul-Inventar](release-evidence/v316-attribution-2026-11-15/runtime-inventory.json)
- [Originalquellen und Commit-Historien](release-evidence/v316-attribution-2026-11-15/source-evidence.json)
- [Lesendes Prüfskript](release-evidence/v316-attribution-2026-11-15/audit_runtime.py)

Reproduktion mit den vorhandenen v316-Restaurationsdateien: `python3 audit_runtime.py --release-dir /absoluter/pfad/release316`; Skript und source-evidence.json gemeinsam ablegen. Es prüft Manifestgrößen, SHA256, Gitblobs und Modulziele ohne Ausführung der App. Kein neuer Browser-/Release-Lauf und kein allgemeiner Rechtskonformitäts-PASS.

**Nächster ausführbarer 1.0-Schritt:** gezielt Erstellungs-/Importbelege für die benannten SVG-Gruppen beschaffen, zuerst format.js/Inlineglyphen und position-icons.js. Damit lässt sich zwischen Eigenzeichnung und übernommener Grafik mit konkreter Lizenzpflicht entscheiden. Bei belegter Übernahme nur die tatsächlich erforderlichen Hinweise auf separatem Branch zum Review vorbereiten. Dafür ist weder eine Geräteanfrage noch eine Release-CI nötig. N-CSP bleibt optionales NACH_1.0 und wird nicht vorgezogen.

Der überholte PR-339-Eintrag in der bestehenden Roadmap ist auf **seit v316 produktiv DONE** berichtigt. K6-TRUST bleibt VERIFY, K4 PARTIAL, A09 OPERATOR_INPUT_PENDING; die WebKit-Eviction-Frage bleibt erhalten. Produktcode, CI, Merge und Deployment wurden nicht geändert. Writer nach dem Checkpoint abgegeben.
