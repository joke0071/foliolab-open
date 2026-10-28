# FLH03-09 – P-Chain-Adress-/Identitätskandidat

Basis v197 LIVE_ACCEPTED / main `7b96a411925621f59021c36ad4d4a60a531c3a92`.
Vertrag vor Code: `7d7fa3f9ae476dafcb8b1e3a4719b2ac8fc8400c`,
[FLH03_PCHAIN_IDENTITY_CONTRACT.md](FLH03_PCHAIN_IDENTITY_CONTRACT.md).
Einziger Funktionsbranch `feature/flh03-pchain-identity`; keine parallele Arbeit.

- **P09-ID01 DONE:** feste AvalancheGo-Primärquellen und begrenzter Fachvertrag gesichert.
- **P09-ID02 IN_PROGRESS:** Implementierung und lokale Fachprüfung abgeschlossen;
  finale Pflicht-CI/Browser-/Merge-/Produktionsgates noch offen.

## Implementierung und lokale Nachweise

`src/pchain-identity.js` prüft ausschließlich kanonische P-Mainnet-/Fuji-Adressen
gegen ein ausdrücklich erklärtes Netzwerk, Bech32-Konstante1 und genau20Byte.
Keine Alias-/Case-/Whitespace-/EVM-Normalisierung, kein Bitcoin-SegWit-Umbau.
Owner-Schlüssel enthält Netzwerk/Platformchain/Owner; UTXO-Beobachtungsschlüssel
enthält Netzwerk/Ziel-/Quellchain/Transaktion/uint32-Index. Keine automatische
Deduplizierung oder wirtschaftliche Gleichsetzung von Atomic-/lokalen Ausgaben.
Immutable Ergebnisse, unveränderte Eingaben. Kein Netzwerk-/Storagezugriff.

Die Helfer sind ausschließlich über Tests erreichbar. Keine Änderung an App,
Scanner, Finanzmodell, Backup, Migration oder Buchungen. Neuer Modulpfad im
bestehenden Service-Worker-Precache; SW198 ist nur unveröffentlichter Kandidat.
Bestehende P-Chain-Browsersuite um Adresse/Identität/Negativfälle erweitert;
alle bisherigen UTXO-/Owner-/Lock-/Nullmutationsassertionen erhalten.
Keine Workflow-/Pin-/Gateänderung oder Zusatzabhängigkeit.

Lokal24/24 gezielte P-Chain-Tests, vollständige821/821Units/0Fail/0Skip und
Syntax bestanden. Neun neue Fachtests mit festen unabhängig per Python
berechneten rein synthetischen Bech32-Referenzen, jeder einzelnen beschädigten
Payload-/Checksumstelle, Netzwerk/Chain/Case/Format/19-21Byte/Bech32m,
Kontextpflicht/Namespace/uint32-Grenzen und bestehendem Decoder-/Ownervergleich.
Erster gezielter Lauf23/24: Testhilfsfunktion ersetzte absichtlich fehlende
Netzwerk-ID durch ihren Default. Negativtest auf direkten API-Aufruf korrigiert;
keine Produktregel oder Assertion entfernt. Anschließend24/24 und821/821 PASS.

Lokaler Chromiumstart scheiterte vor Testausführung an fehlender erwarteter
Playwright-Binärdatei. Kein Browser-PASS behauptet; keine Wiederholungsschleife,
keine Testumgehung. Die unveränderte Pflicht-CI führt die bestehende erweiterte
Suite in Chromium, Firefox und WebKit und später tatsächlich produktiv aus.

## Exakt nächster Schritt / offene Grenzen

Finale GitHub-Pflicht-CI und unveränderten Mergebaum prüfen, Quellreview und
vorhandene Browserberichte abnehmen. Bei Veröffentlichung vollständige
Main-/Pages-/echte Drei-Engine-Produktionsabnahme mit Modulbytes, IDB/Settings-
Nullmutation und vorhandenen Kernbildern. Zentrale Details im maßgeblichen
WORK_RESTPAKETE_CHECKPOINT auf `feature/flh05-import-foundation`.

Der begrenzte reinlesende Helfer benötigt keine neue kritische Finanz-/Backup-
Freigabe; ein aktiver Adapter bleibt davon getrennt. FLH03-09 gesamt PARTIAL:
vollständiger/konsistenter UTXO-/Stakingzustand, Transaktionsherkunft,
Export-/Importbeziehung, Fees und unabhängige Soll-/Eigentumsnachweise offen.
Nach diesen zwei Etappen gesicherter Sitzungsstopp, keine FLH05-/PERF-Vorziehung.
