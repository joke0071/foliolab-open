# FolioLab Open · Fortsetzung am 24.11.2026

Main `d919bfc2a177b642275afa9f15fcb9a63b4de709`, Tree
`85c1c07f4053611e22d8bcd22af7d7ae2daa778d`. Produktiv
**SW339 LIVE_ACCEPTED**, integriert in [#426](https://github.com/joke0071/foliolab-open/pull/426).
Direkt abgerufene Bytes von `/`, `/index.html` und `/sw.js` stimmen mit Main
überein. Firefox bestätigte im frischen Profil den aktiven IndexedDB-Store,
Service Worker und Cache v339 sowie die Buchungsnavigation. [Main, Pages und Live](https://github.com/joke0071/foliolab-open/actions/runs/45197813405)
und [Wallet-CI](https://github.com/joke0071/foliolab-open/actions/runs/45194016325)
sind grün. Geprüfter Fortschritt **6/6 Kernbereiche und 10/29 Folgepakete**.

## Offen nach Abnahmekriterium

| Einordnung | Paket | Verbleibender Eingang oder Arbeit |
| --- | --- | --- |
| Sofort unabhängig vollständig abnehmbar | — | Die 19 offenen Zeilen enthalten externe Abnahmekriterien oder Entscheidungen. Teilumfänge siehe unten. |
| Teilweise unabhängig | Drive / FLH04 | [#427](https://github.com/joke0071/foliolab-open/pull/427) enthält das ausführbare Ablaufmodell zur Kette ab Version 129. Unabhängiges Kryptoreview, qualifizierte aktuelle Autorisierung, autorisierte OAuth-Origin und Testkonto, zwei reale Geräte, bestätigter Write mit unabhängigem Readback und Sicherheitsfreigabe stehen aus. |
| Teilweise unabhängig | CI-Effizienz | [#428](https://github.com/joke0071/foliolab-open/pull/428) erfasst additive P1A-Zeitmessungen. [#429](https://github.com/joke0071/foliolab-open/pull/429) prüft parallel ausschließlich in der kontrollierten lokalen Umgebung. Ein reproduzierbarer Zeitgewinn im regulären Release steht aus. |
| Teilweise unabhängig | TRUST01 | Statischer CSP-Bestand und Browserabnahme zu SW339 liegen vor. HTTP-Frame-Schutz erfordert einen dafür qualifizierten Auslieferungsweg. Weitere Kriterien sind natives Safari/VoiceOver/ITP und die Primärquelle für die Rechtekette der Originalgrafik. |
| Produktentscheidung | UI-Refresh | Drei Sprunglinks in „Mehr“ oder bestehende Gliederung. |
| Produktentscheidung | Benchmark/Roadmap | Vergleichsreihe, Währung und Gewichtung. |
| Produktentscheidung | Produktmaster | Freigabe öffentlicher Auftritt. |
| Extern | FIN-E2E01 | Unabhängige Originalwerte für Journal, Kosten und Cash zur zusätzlichen Rücknahme. |
| Extern | FLH03 | Unabhängige Bitpanda-Stichtags-/BCI25-Werte und Regelfälle. Separater generischer Trade-Republic-Beleg. |
| Extern | AT03 | Unabhängig gebuchte Anfangs- und Endsalden für denselben Zeitraum und dasselbe Konto. |
| Extern | FLH05 | Zusammengehörige Originalzeilen für Teilfüllung, FX, Gebühren und unabhängiger Nettosollwert. |
| Extern | Verwaltung / Buchungsmutationen | Originalbuchungen samt Gegenposition und unabhängige Journal-, Kosten- und Flow-Werte. |
| Extern | ETH-HISTORY-CURSOR01 | Privater Originalcursor samt Providerfolgeantwort. Öffentliche Teilabnahme liegt vor. |
| Extern | FLH03-18 | Zusätzlich zu prüfende Ledger-/Stakingposition mit eigener Zuordnung und datiertem Endbestand. |
| Extern | Weitere Wallet-Abdeckung | Datierter eigener Wallet-/Stakingbestand mit Menge und Finalität. |
| Extern | AT05 | Brokerjahresabrechnung, passende OeKB-Daten und unabhängige Fachprüfung. |
| Extern | Barausgleich | Originalabrechnung mit Bruchteil, Auszahlungswährung, Kosten und Steuerbasis. |
| Extern | UI-SENTIMENT01 | Freigegebener CMC-Abrufweg und CNN-Feed mit Anzeigerechten. Darstellung und Cache haben bereits Fixture-Belege. |
| Extern | Speicher / Migration / Recovery | Passende Altinstallation sowie beim geräteübergreifenden Fall zweites autorisiertes Gerät. |
| Extern | Startperformance | Physisches Android-Gerät für fünf Kalt-, Warm- und Offline-Starts mit identischem Bestand. |

Technische Folgearbeiten innerhalb FLH04 hängen vom unabhängigen Review ab.
Das betrifft den Wire-Verifier und nach separater Qualifikation der
Vorbedingungen den Aussteller, die dauerhafte Synchronisierung und deren
Produktivabnahme. Die bestehenden anderen Roadmap-Kriterien gelten getrennt.

## Nachweise für die Kandidaten

- [FLH04 #427](https://github.com/joke0071/foliolab-open/pull/427), Head
  `de80324b788db97ae8db129ebe92580d57753e19`, Tree
  `84a5509823a744571530fcddc7b9e1a710479f81`. Lokal 1.729/1.729 Node-Tests,
  einschließlich 15 neuer synthetischer Ablaufprüfungen. Isolierter
  [Browserlauf](https://github.com/joke0071/foliolab-open/actions/runs/45478057305)
  grün in Chromium, Firefox und WebKit für die bestehenden Outbox-, Recovery-
  und Speicherverträge. Die neuen Ablaufprüfungen laufen unter Node.
- [CI #428](https://github.com/joke0071/foliolab-open/pull/428), Head
  `823fd471445d175ec62bbd901926bec986a10dde`, Tree
  `d80ec391347b9586e28b73389d193edec866bab3`.
  [Pflicht-CI](https://github.com/joke0071/foliolab-open/actions/runs/45477599208)
  und [Wallet-CI](https://github.com/joke0071/foliolab-open/actions/runs/45477036601).
  Bei SW339 dauerte der Firefox-/WebKit-Abschnitt 1.798 Sekunden. Der Abschnitt
  von WebKit-Referenzentfernung bis Ende P1A dauerte 118 Sekunden. Die neue
  Messung unterscheidet Laden und Fixture, responsive Prüfung sowie Screenshots.
  Der lokale Durchlauf mit Firefox 157 bestand einschließlich 42 responsiver
  Prüfungen und 84 Screenshots. Dauer 87.539 ms, davon 8.177 ms Fixture/Laden,
  58.118 ms responsive Prüfungen und 5.797 ms Screenshots. Auf diesem Einzelwert
  beruht noch keine Aussage zum Produktionszeitgewinn. Lokal 1.533 Node-Tests grün.

- Der diagnostische Firefox-Lauf maß 50.148 ms in 42 Axe-Aufrufen.
  Im kontrollierten A/B/B/A-Versuch dauerten die sequenziellen Läufe
  94.134 und 80.841 ms, die parallelen 38.769 und 39.805 ms. Alle vier
  Läufe bestanden und erzeugten jeweils 84 Screenshots.
  [#429](https://github.com/joke0071/foliolab-open/pull/429) bestand lokal
  in Firefox mit 37.026 ms, 42 responsiven Prüfungen und 84 Screenshots.
  Der Parallelmodus lehnte einen Start gegen die Produktionsorigin ab.
  Vor Übernahme: direkter Vergleich auf den übrigen Pflichtbrowsern,
  Ressourcenprüfung unter Runnerbedingungen und Vergleich der regulären
  CI-Gesamtlaufzeit.
