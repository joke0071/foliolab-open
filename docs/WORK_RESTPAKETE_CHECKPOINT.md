# HND01 · ACTIVE / WAITING_USER_APPROVAL · PR #342 QUALIFIED

Writer: `v317-release-ab4d8e6f6672`, alleiniger HND01-Writer. Geordnete Übernahme autorisiert; Einstieg/expectedSHA `3dac897b1de6ec40a7225dc4538f691d0b9c2f6e`, Übernahmecommit `a9d3c937563029d7df1bc98e1ef0459683cd7925`. Vor dieser Fortschreibung Checkpointref `169e204b64c1c363271920ec76d74ebf406c15ad` unverändert. Keine laufenden oder wartenden Jobs, keine konkurrierende Schreibaktivität beobachtet.

## Produktstand

**v317 LIVE_ACCEPTED**, Main `0d1638cb2034805dace789e3072fbb7bcda8d52c`, Tree `2644817dfb558da9668ec0a55bd7e6092cd80324`. Die Freigabe für PR341 am exakten Head wurde vollständig ausgeführt. Regulärer Mainlauf43734167356/1 einschließlich Deployment und tatsächlicher Produktion in drei Engines SUCCESS. [Releasebericht mit Originalpins](V317_RELEASE_ACCEPTANCE_2026-11-15.md) · [Maschinenbeleg](release-evidence/v317-live-accepted-2026-11-15.json).

Neue v317-Originale gepinnt bytegleich rückgelesen: acht ZIPs, 4.237 Originaldateien plus 154 Pages-Dateien tatsächlich restauriert. Das PR341-Paket und alle älteren Ketten bleiben erhalten. Historische 503-/SW-Ursachen UNKNOWN; zwei belegte CDP-Abschlussflags nach browserClosing bleiben dokumentiert. 44-px-Anforderung und Messdiagnostik aktiv.

## Konkrete Mergeentscheidung

**Merge empfohlen ausschließlich für [PR342](https://github.com/joke0071/foliolab-open/pull/342), Head `a9ac99f710571df04884f571cb557a8b52d0828c`.**

- Branch: `fix/request-credential-boundary-ab4d8e6f6672`; Tree `1d5a1f2db0d6e7d7fa39590deea44954868611b9`.
- Basis: unveränderter akzeptierter Main0d1638cb. Ausführungsmerge `3e8ba55eb315b0f53e4f7681238c4bba6c49ee0d` hat exakt denselben Tree. PR offen, mergeable clean; keine Reviews, Kommentare oder offenen Threads.
- Roadmap K2-KURSE/#266/SEC-03: Schlüssel vor Diagnosekürzung schützen und Header-/Request-/Cacheidentität zusammenhalten. Genau vier Dateien, kein Workflowdiff. Keine Finanz-/Speicher-/Architekturänderung.
- Neun Regressionen am unveränderten Main FAIL; am Kandidaten 38 gerichtete Tests PASS. Tatsächlicher Chromium-Gegencheck mit exakt unverändertem vollständigem IDB-Record PASS.
- Reguläre PR-CI43740825503/1 und Wallet43740825516/1 SUCCESS; jeweils 1.492 Tests, 0 Fehler/Skips. Chromium und alle drei Cross-Shards bestanden; 15 Zielhöhen exakt44px, PWA-Vertrag mit v318 PASS. Deployment/Live im PR korrekt SKIPPED, keine Produktionsabnahme dieses Kandidaten.

[Prüfbericht](PR342_REQUEST_CREDENTIAL_BOUNDARY_REVIEW_2026-11-15.md) · [Entscheidung/Originalpin/Restore](release-evidence/pr342-qualified-2026-11-15.json). Neues 214.415.360-Byte-Paket, SHA256 `6999f36bb3475fbff735e73e390062362ced9d8c7be185eaaec5916b8740810b`; exakter Pin `file_00000000151081f58a49601480e077bb`, Version0. Unabhängig bytegleich gelesen, 35 Manifestdateien und 2.362 Originaldateien aus sechs ZIPs tatsächlich restauriert.

## Verbleibender Scope und nächste Aktion

K3-Archivhinweis **DONE**; Gesamt-K3 separat **PARTIAL** wegen geparktem A09 Windows Chrome/Edge und Android Chrome/PWA. Nach Abgleich vorhandener 18 Auswahl-, 9 Großmengen- und 3 Betragsfälle keine weitere konkrete interne Codelücke gefunden. 5.000 Positionen für1.0 entschieden; 10.000 Buchungen/10.000 Stichtage eigenständig belegt. Die 5.000er-Archivgrenze betrifft nur die Aktion. A09/Grafikherkunft bleiben geparkt; keine universelle Finanzmutationsfreigabe.

**Es fehlt genau die separate ausdrückliche Freigabe für PR342:** Merge dieses Heads einschließlich entstehendem Main, regulärem Deployment und vollständiger Live-Abnahme. Bis dahin keine weitere Mainänderung. Nach Freigabe zuerst frische Refs/Head/Basis/Tree/Checks/Reviews prüfen, geänderte Basis auf Tree-Auswirkung untersuchen und Merge headgebunden ausführen; anderer Head braucht neue Entscheidung. Danach tatsächlichen Main-SHA und vollständige Releasegates verfolgen, erst mit vollständigem Nachweis LIVE_ACCEPTED. Bei Fehlern zuerst Originale sichern und trennenden Befund ermitteln, kein blinder Retry.

Unveränderte EFF03-/Finanz-/UNKNOWN-/IDB-/CAS-/Backup-/Restore-/PWA-/TLS-Verträge gelten weiter. [Gepinnter vollständiger Vorgänger](https://github.com/joke0071/foliolab-open/blob/169e204b64c1c363271920ec76d74ebf406c15ad/docs/WORK_RESTPAKETE_CHECKPOINT.md). Kein Handover, kein zweiter Writer, keine Hintergrundfortsetzung behauptet.
