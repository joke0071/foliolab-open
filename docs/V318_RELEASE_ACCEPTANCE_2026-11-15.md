# v318 · vollständige Releaseabnahme · 15.11.2026

**LIVE_ACCEPTED**, Main `127019cf71304981c0c7f1a446f4dee8bc27404d`, Tree `1d5a1f2db0d6e7d7fa39590deea44954868611b9`. PR342 ausschließlich am freigegebenen Head `a9ac99f710571df04884f571cb557a8b52d0828c` mit erwartetem Head gemergt. Unmittelbare Prüfung: Basis0d1638cb unverändert, Kandidat und getesteter Merge3e8ba55e exakt derselbe Tree, alle regulären PR-/Walletpflichtchecks erfolgreich, keine Reviews/Threads/Kommentare. Tatsächlicher Main hat exakt beide erwarteten Parents. Keine weitere Mainänderung.

[Regulärer Release43744866312/2](https://github.com/joke0071/foliolab-open/actions/runs/43744866312) einschließlich Deployment132919210891 und vollständiger Live-Abnahme132919311762 SUCCESS. [Maschinenbeleg](release-evidence/v318-live-accepted-2026-11-15.json).

## Main, Auslieferung und Produktion

- 1492Units,0Fehler/Skips. Drei Cross-Shards aus dem erfolgreichen Erstlauf identitätsgebunden weiterverwendet; GitHubs kopierte Ergebnisse im Versuch2 sind keine erneuten Browserausführungen. Chromium-SHA-Artefakt und drei tatsächliche Originalcheckoutlogs binden alle ausgeführten Jobs an Main127019cf.
- 261Main-JSON,644expliziteErgebnisassertions ohne Finding.8Metadata-/Sonderberichte anhand ihrer tatsächlichen Strukturen geprüft. Alle15Zielhöhen exakt44px.
- Pages-Paket:154Dateien exakt zu Main-Gitblobs. HTTPS-Produktion:155unabhängigeSHA256-Asset-/Aliasvergleiche und142tatsächlich geladene Assets. Keine Zertifikatsausnahme in der tatsächlichen Live-Abnahme.
- SechsKernprüfgruppen und18Axe-Scans: tatsächliche UI-Anlage/Bearbeitung, nativeIDB/Reload, normaler und verschlüsselter UI-Export→FreshRestore→Reload, exakte Buchungen sowie aktiver SW/Cachev318 und Offline-IDB-Speichern/Reload.
- Produktions-UI66Scans und Transferansichten10Scans je Chromium/Firefox/WebKit.196Produktions-JSON mit254direktenErgebnisassertions;26unterschiedlich strukturierte Berichte/Metadaten zusätzlich geprüft. Keine Realprovider-, Windows-/Android- oder private Gesamtportfolioabnahme daraus abgeleitet.
- Vier ausgewählte Originalbilder tatsächlich angesehen. Positions-Vollseitenbild enthält bekannte Fixed-Header-/Scroll-/Fokusartefakte der Aufnahme. Kein Gesamtaudit sämtlicher1431Produktions-PNGs oder echter Systemschrift.

## Ein Erstfehler und genau ein begründeter Rerun

Versuch1 bleibt **FAILURE**: test132905874026 scheiterte an430px. Der erstmals vollständig erfasste Zielknoten war bereits disconnected und0px hoch; im selben Callback waren die beiden aktuellen Ziele jeweils44px. [Originalbefund und kontrollierte native Gegenprobe](V318_MAIN_FAILURE_2026-11-15.md): der echte Aufklapp-Handler erneuert den Detailmount; eine zuvor aufgelöste Referenz bleibt anschließend abgelöst. Vollständiger nativer IDBRecord unverändert. Kein Produktgeometriefix und keine Lockerung von Schwelle/Frist.

Erst nach vollständigem Erstlaufabschluss und dessen gepinntem Restore genau ein begründeter Rerun des fehlgeschlagenen Chromiumjobs am unveränderten Main. Versuch2 vollständig erfolgreich. Historische Fails ohne gleichwertige Messaufnahme bleiben UNKNOWN. Die konkrete testseitige Korrektur wird als nächster separater Pflicht-PR vorbereitet; dessen Merge entscheidet Jochen gesondert.

## Workerdiagnostik

208Originalprotokolle:70Chromium/69Firefox/69WebKit. Alle Browser abgeschlossen, alle70Chromium-Captures bereit. **Ein unverändert erhaltener instrumentationError**, Sonic: runIfWaitingForDebugger-Timeout4982ms nach browserClosing und4955ms nach browserClosed. Kein solches Flag vor Closing. Keine Aussage „0Instrumentierungsfehler insgesamt“. CDP beeinflusst Timing; Firefox/WebKit liefern Kontextbeobachtung, keinen direkten Worker-CDP-Beleg. Historische HTTP503-/SW-Ursachen bleiben UNKNOWN.

## Originale und tatsächlicher Restore

[FolioLab_v318_Main43744866312_Originalbelege_2026-11-15.tar](https://chatgpt.com/library?file_id=libfile_fde3_f-6435e692ff8c819187da53fd3364cf06_54e45e8130348191808d9aaa710cf372&account_id=personal),381870080Bytes,SHA256 `78085b313933e06c047f65784f4483142b1f1b9cf670b9d80ddf71d89304a027`. ExakterVersion0-Pin `file_00000000b96c82129375356b6d691f10`.

Unabhängig bytegleich mit anderer Dateiidentität zurückgelesen.71Manifestdateien und8OriginalZIPs, daraus **4237Originaldateien plus154Pages-Dateien tatsächlich restauriert** und gegen vollständige Pfad-/Größen-/SHA256-Manifeste geprüft. [Externer Sicherungsreceipt](release-evidence/v318-2026-11-15/pinned-restore.json) · [vollständiger komprimierter Restoremanifest](release-evidence/v318-2026-11-15/full-restore-manifest.json.gz.b64) · [ausgeführter Restorer](release-evidence/v318-2026-11-15/restore_success.py). Abschlussreceipt außerhalb des Archivs vermeidet einen zirkulären Selbsthash. Portfolio-FreshRestore ist davon getrennt produktiv belegt.

Der vollständige Erstlauf188661760Bytes/SHA25612f480f8481c5f8971131424ecef198eabfff76916f3443ef89659324e908313 bleibt separat Version0 gepinnt und mit23Manifestdateien/1780Originalrestaurierungen erhalten. Der zuerst gesicherte Fehlerteil und sämtliche PR342-/v317-/älteren Ketten bleiben unverändert.

## 1.0 und nächste Arbeit

[Verbleibende Pflichten, Abschlusskriterien und Operatorbedarf](FOLIOLAB_1_0_REMAINING_2026-11-15.md), aus aktueller kanonischer Roadmap, HND01 und frisch gelesenen31offenen Issues.5000Positionen für1.0 entschieden;10000Buchungen/10000Stichtage gesondert gültig. A09 bleibt trotz Parken Pflicht. Grafikherkunft ohne belegte Pflichtverletzung geparkt; Safari/TalkBack/aktiveAutosync nachrangig. Neuer synthetischer K2-FX-Altersbefund bleibt offen und wird nicht als durchv318 behoben behauptet. Kein Scope-/Issue-Gesamtabschluss und keine zweite Roadmap.
