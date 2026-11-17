# PR354 · FX-Produktionsabrufe reduziert · entscheidungsreif

**QUALIFIED_PENDING_MERGE_DECISION.** Exakter Head `aeea7d11d0169dde8355a7f317a16c1a62dab806`, Basis/Main `494ed8f0f6b627d8be972a5ceb886005e5064b31`, Tree `3fd78f746c08ab0fe0347ab30932a00309d7d008`. [PR #354](https://github.com/joke0071/foliolab-open/pull/354). Getesteter synthetischer Merge `504ec4bf30ef2e1bdfa2a3a2838419b4b98cd6ca` hat exakt denselben Tree und Parents Basis+Head. Kein Merge ausgeführt.

## Erhaltene Aussagen

[Fallweise Zuordnung und vollständiger Diffvertrag am exakten Head](https://github.com/joke0071/foliolab-open/blob/aeea7d11d0169dde8355a7f317a16c1a62dab806/docs/FX_VERIFIED_RELEASE_MATRIX_2026-11-17.md). Alle acht Fälle in Chromium, Firefox und WebKit behalten Fixturetabelle, vollständigen ursprünglichen Refresh-/Assertion-/Reopenblock und 180-s-Gesamtfrist. Normaler UI-Refresh, native Web Locks/IndexedDB, exakter vollständiger Record und Scheduler nach Reload, UNKNOWN, Journal-/Cashflowerhalt und erwartete Provideraufrufe werden pro Fall ausgeführt. Die vollständige Matrix benutzt Buffer, die gegen sämtliche 155 veröffentlichten Hashes des vollständigen erfolgreichen Coreberichts mit aktuellem Release-SHA, Base und SW geprüft wurden. Fehlerhafte/fehlende Proofs oder Dateien brechen ab, kein Netzwerkfallback.

Die Phase ist ausdrücklich verifizierter Releasebyte-Replay auf der sicheren Produktivorigin. Sie behauptet keine 24 neuen ungemockten CDN-Kaltstartstichproben. Diese Wiederholungen sind keine eigene Daten-/Altersgrenzenassertion im K2-Vertrag. Zusätzlich bleiben today und old-unknown-other-fx-saved als sechs vollständige direkte Domainfälle in allen Engines bestehen. Core-Modulauslieferung, alle 155 HTTP-/SHA-Prüfungen, tatsächlicher SW, Offline, Reload, Daten-/Schedulererhalt, UI-Export/FreshRestore und andere Quellenprüfungen bleiben erhalten. Jeder künftig speziell origin-/auslieferungsabhängig belegte Fall benötigt weiterhin seine direkte Domain-Gegenprobe.

Keine Produkt-, SW- oder Workflowdatei geändert. Keine zusätzliche Pause, kein pauschaler HTTP-Retry, keine Frist-/Assertionlockerung. Der separate initiale market.js-503 bleibt im unveränderten Coretransport sichtbar; keine Behebung aus der FX-Verkehrsreduktion ableiten.

## Vergleich und Gegenprobe

| Beleg | Ergebnis |
|---|---|
| Lokaler Vergleich 44039980251 | Original und Replay jeweils 24/24 native Fälle PASS; Fixture-/Assertionblock bytegleich und fachliche Resultate gleich. 155 Dateien gleich zum Original-Live-Corebeleg von Main494. |
| Engines | Chromium141.0.7390.37/PW1.56.1, Firefox157/PW1.64.1, WebKit27.2/PW1.64.1, entsprechend regulären Gates. |
| Direkte Domain 44040401966 +44040894083 | Alle sechs eindeutigen Kontrollfälle PASS; Chromium852, Firefox858, WebKit858 Produktionsanfragen, zusammen2568. Alle Antworten200 und Hash gleich. Standard-TLS, ursprüngliche drei Reload-/Startgraphen je Fall, keine vorgeschaltete Hashanfrageserie. |
| Vollmatrix-Requestreferenz | Lokal vollständig3408/3432/3432 gleichoriginige Requests gezählt, zusammen10272; gleicher Originalcode und beobachtete426Requests je erfolgreichem historischen Chromiumfall. Keine neue erfolgreiche10272-Request-Livebaseline behauptet. Bei identischer Requeststruktur75% weniger Produktionsabrufe, 7704 entfallen. |
| Anfragespitzen | Direkte Kontrollen535/351/376 Starts pro Sekunde; alte Originale547 bzw697. Keine robuste Spitzensenkung behauptet, kein interner Limiterparameter bekannt. |
| Laufzeit der Live-Teile | Replay31.513s summiert + direkte Kontrollen21.028s =52.541s. Lokale Originalreferenz42.248s. Keine gepaarte Produktions-Gesamtzeitmessung; keine garantierte Laufzeitersparnis. |
| Integrität/Wiring | 30 gezielte Tests, alle1511 lokalen Units und TypeScript5.8.3-Preflight PASS. Vollständiger endgültiger Wrapper mit automatischer Corebelegauswahl in44041910430 offline8+2Fälle PASS,0Produktionsnetz. |

## Reguläre Qualifikation und kritischer CI-Pfad

[Run44041905697](https://github.com/joke0071/foliolab-open/actions/runs/44041905697), Versuch1 des endgültigen Heads, vollständig SUCCESS. [Wallet44041905817](https://github.com/joke0071/foliolab-open/actions/runs/44041905817) SUCCESS. 1511/1511 Unit-Tests,0Fehler/Skips/Abbrüche, Chromium und alle drei Cross-Jobs PASS. Die regulären FX-Originalfälle8jeEngine sind in den Originalartefakten belegt. Deployment/Full-Live im PR korrekt SKIPPED, bestehende SW321-Abnahme übernommen.

| Pflichtjob | Sekunden | Laufzeit |
|---|---:|---|
| test |1102|18:22|
| Cross1 |799|13:19|
| Cross2 |1451|24:11|
| Cross3 |856|14:16|

Pflichtjobspanne08:51:55–09:16:06 MEZ:1451s=24:11. Runnerarbeit4208s=70:08. Früherer qualifizierter PR349:17:56 und3658Runnersekunden. Dieser Lauf ist375s länger und verbraucht550Runnersekunden mehr. **Kein Integrations- oder Runnerzeitgewinn behauptet.** Kein zusätzlicher Full-Lauf nur zur Zeitmessung.

Die Cross2-Originalzeitstempel begrenzen den Befund: Der unveränderte vollständige UI-Block wächst587.257→814.615s (+227.358s); Reference-Management darin170.176→239.128s. Der ursprüngliche Zwei-Engine-FX-Abschnitt zwischen vorherigem Refresh-Frequenzmarker und letztem FX-PASS wächst17.387→25.716s (+8.329s). Diese Breitenabweichung ist kein kausales Hardware-/Last- oder FX-Regressionsurteil. Der Integrationsworkflow und sämtliche Aufrufe bleiben bytegleich; die eigentliche Verlagerung betrifft erst den späteren Livejob.

## Fehler- und Zusatzaufwand separat

Erster Headca354d3d war nicht qualifiziert: vorhandener Schutz versiegelter Workflow-Kommandos meldete1510/1511. Die unnötigen Workflow-Env-Änderungen wurden vollständig zurückgenommen. Kein Vertragsguard angepasst; alter Lauf44041385714 und seine abgebrochenen Cross-Jobs werden nicht als neue Head-PASSes ausgegeben.

Erster Firefox-Domainlauf hatte einen zusätzlichen Sammlerfehler beim navigationsabgebrochenen favicon (NS_BINDING_ABORTED), nachdem derselbe Iconbody bereits zweimal200/hashkorrekt geliefert worden war. Fachlicher today-Fall war bestanden. Sammler nur für genau diesen beobachteten Abbruch präzisiert, Firefox gezielt abgeschlossen; Originale erhalten. Versehentliche PR-Pfad-Wiederauslösungen führten zu einem weiteren lokalen Vergleich und einem weiteren Firefox-Domainlauf. Gesamter einmaliger Diagnoseverkehr3855Produktionsanfragen, davon1287 über den sechs eindeutigen Fällen. Diese Mehrarbeit wird nicht als zukünftige Einsparung verrechnet; weitere Domainauslösungen sind gestoppt. Im Kandidaten selbst keine Retries/Pausen.

## Dauerhafte Originale und Entscheidung

[Originalpaket mit Auswertung](https://chatgpt.com/library?file_id=libfile_fde3_f-ef351668a23081918749a18d58362f0a_54e45e8130348191808d9aaa710cf372&account_id=personal), Version0, Pin `file_000000002dc88246a1650f563b506266`:253121109Bytes, SHA256 `770c4c852e00a245c792114ca3ede3aab85bf69c20874c707db8aaee7d3f2000`. Tatsächliche gespeicherte Kopie erneut bereitgestellt und vollständig geprüft:25unveränderte Original-ZIPs,2841Originalmitglieder, API-Größen/Digests, SHA-Gleichheit, äußere und sämtliche inneren CRCs PASS. Das Archiv endet vor seiner anschließenden Save-/Readbackquittung; [abschließender Maschinenbeleg](release-evidence/fx-verified-release-qualified-2026-11-17.json) hält diese spätere Prüfung fest. Bestehende 429-/503-Originale unverändert separat weiterverwendet.

Support Ticket#5016095: angekündigte Schließung ohne technischen Befund laut Jochen. 429-Regel und separater503-Ursprung UNKNOWN. Keine Anfrage nach demselben aussichtslosen Supportbefund. Private Finanz-/Brokerdateien wurden nicht verwendet oder veröffentlicht. Bitpanda-, Kraken-, Windows- und SW321-Abnahmen gelten weiter; keine neue Android-/Systemschrift-/private Cursor-/globale1.0-Abnahme.

Eigener vollständiger Diffreview; keine unabhängige Fremdprüfung behauptet. PR frisch offen/mergeable, keine Reviews, Threads oder Kommentare offen. **Mergeempfehlung für PR354 ausschließlich am Head aeea7d11d0169dde8355a7f317a16c1a62dab806**, wegen nachgewiesener Verkehrsreduktion bei erhaltener fachlicher Abdeckung; kein Geschwindigkeits- oder Hostingheilungsversprechen. Nicht QA353 oder den gesamten Checkpoint-Branch mergen. Nächste konkrete Entscheidung ist Jochens Headfreigabe.
