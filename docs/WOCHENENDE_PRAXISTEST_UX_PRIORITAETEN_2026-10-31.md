# FolioLab Open – Wochenend-Praxistest und Usability-Prioritäten (31.10.–01.11.2026)

**Verbindliche Nutzerentscheidung vom 30.10.2026:** Die App dieses Wochenende mit realistischem Portfolio möglichst umfassend praktisch testen, Probleme sammeln und darauf aufbauend ab Montag 02.11.2026 gezielte Optimierungen umsetzen. Ab sofort **Nutzwert, Zuverlässigkeit und Testbarkeit vor weiteren rein technischen CI-Feinoptimierungen** priorisieren, soweit dies konfliktfrei möglich ist. Kein neuer Masterplan und keine rückwirkende Aufhebung bestehender Fach-/Releasepflichten.

## 1. Verifizierter Ausgangsstand (30.10.2026, ca. 19:50 Europe/Vienna)

- Produktiv: v221/SW221 **DONE / LIVE_ACCEPTED**, aktuelle Main-Änderung PR230 ist CI-only und vollständig LIVE_ACCEPTED; Main bei Entscheidung `7490f243ff32c659c418cdf92540fe9ef1cc4189`.
- CI-OPT01: PR230 abgeschlossen (drei isolierte Crossbrowser-Shards, vollständige Gate-Abdeckung). **Draft PR231** (`ci/ci-opt01-draft-stages-v1`, initialer HEAD `9369d6b3d880a52effc3ca54214a5fbc76d6113a`) mit konservativen FAST/INTEGRATION/RELEASE-Tests **CI_RUNNING / NICHT FREIGABEREIF**. Diesen einen bereits laufenden Kandidaten sicher auswerten, nicht abbrechen. Erst nach technischer Abnahme **eigene konkrete Nutzerfreigabe** für Merge; kein automatisches Deployment. Falls nicht rechtzeitig abgenommen, bleibt die bestehende LIVE_ACCEPTED-Produktionsbasis der Wochenend-Teststand.
- UI-VISUAL01 PR209 einschließlich208 vollständig integriert. Weitere **sieben gelieferte visuelle Drafts** #213/#214/#218/#219/#222/#225/#227 und QA223 unverändert unmerged; UI-VISUAL06/#217 Work-owned/offen. Eine bloße Copilot-Lieferung ist nicht produktiv.
- Gesamtmaster PARTIAL; fachliche Pakete FLH03/04, Startperformance-P1, Daten-/Text-UX und zahlreiche Masterrestpunkte offen. **Nur FLH05 und FLH-PROJ01 bewusst PARKED**.
- **Keine zusätzlichen kostenpflichtigen Work-Credit-Pakete:** Zusatzkaufbudget 0 €; bei Quota-Engpass Zustand sichern, nicht Sicherheit aufweichen.

## 2. Neue Reihenfolge nach Usability-Wirkung

**Nutzwert-Rangliste** (nicht blind als Merge-Reihenfolge interpretieren; Abhängigkeiten, aktuelle Main-Diffs, PR-Konflikte und noch laufende Arbeit gehen vor):

| Rang | Thema | Bereits vorbereitete Kandidaten / Verantwortlichkeit | Praktischer Nutzen |
|---|---|---|---|
| P0 | Fehlende/irreführende Finanz- oder Statuswerte, nicht sichere Lösch-/Import-/Backupaktionen | UI-MASTER28/DELETE/FLH03; Work | Unmittelbare Verlässlichkeit/Sicherheit, vor optischer Änderung |
| 1 | Navigation und Header mobil/desktop | #218 UI-VISUAL04 | Jede App-Sitzung; Orientierung und Erreichbarkeit |
| 2 | Buchungen und Positionen, Filter, Mehrfachauswahl/Bedienflächen | #214 UI-VISUAL03 + #227 UI-VISUAL09 | Täglich häufigste Interaktionen |
| 3 | Echte Startzeit mit großer IndexedDB / großer Historie | #177 FLH-PERF01; Work | Nutzerwahrnehmung, besonders mobil; echte App-Metriken statt CI-Dauer |
| 4 | Reiter Mehr – Konten, Backup, Restore, Kursquellen, Einstellungen | #213 UI-VISUAL02 | Essentiell für sicheren Praxistest und Einrichtung |
| 5 | Anlageassistent und Walletdialoge | #219 UI-VISUAL05 | Alltag beim Ergänzen, Wallet-Monitoring |
| 6 | Dashboard-Werte/Anlageklassen inkl. Accessibility | #222 UI-VISUAL07 + QA223 | Tägliche Übersicht, visuelle Zugänglichkeit |
| 7 | Verlauf, Datenabdeckung, Referenzwerte | #225 UI-VISUAL08 | Auswertung und Diagnose |
| 8 | Erststart, Onboarding, Leerzustände | #217 UI-VISUAL06; Work | Hoher Nutzwert bei Neueinrichtung, geringer beim bereits gefüllten Bestand |

**Sichere technische Integrationsreihenfolge:** die bereits dokumentierten Abhängigkeiten #213 vor #214 und #214 vor #218 respektieren, #218 vor #219 prüfen. #227 kann nach/zusammen mit #214 geprüft werden, wenn keine Kollision und **ein gemeinsamer Kandidat eigenständig konkret freigegeben** wird (max.2–3 risikoarme CSS-Pakete gemäß Issue229); andernfalls einzeln. #222 + QA223 nur nach gesicherter Kompatibilität, #225 eigenständig. **Keine automatische Sammelintegration und keine automatische Freigabe.**

**Performance #177** bleibt essentielle P1; wenn der Wochenendtest reale hohe Ladezeiten oder fehlende Interaktivität zeigt, den kleinsten gemessenen PERF01-Schnitt vor weiteren kosmetischen Paketen bearbeiten. CI-Sharding ist kein Ersatz für App-Startperformance.

**CI-OPT01 nach PR231:** konservative, nachgewiesen sichere FAST-Stufe möglichst regulär abschließen. Weitere umfangreiche CI-Optimierungen (Caching, Versionsangleichung, Chromium-Sharding, automatische Infrastruktur-Retries) zunächst nur bei klar nachweisbarem unmittelbarem Engpass; sonst als OPEN/DEFERRED innerhalb CI-OPT01 bewahren und UI-/Wochenendbefunde priorisieren. Nicht unbefristet an CI-OPT01 festhalten.

## 3. Wochenende: stabile echte Nutzung, keine riskanten Last-minute-Releases

**Samstag 31.10. – tägliche UX mit bestehenden, echten Daten (Android + Desktop):**
- Appstart kalt/warm, sichere Erstinteraktivität, störende Lade-/Updateanzeige, Navigation inkl. Zurück/Bottom-Nav und längeren Texten.
- Übersicht: Summen, Quellen-/Frischeanzeigen, Klassenzuordnung, Liquidität/Fälligkeiten.
- Positionen: suchen, filtern, sortieren, Zeitraumwechsel, Detailansichten; Archiv-/Mehrfachauswahl **nur an reversiblen Testobjekten**.
- Buchungen: Filter, Jahr/Konto/Vorgang, Erträge/Abzüge, interne Transfers, Detail- und Bestätigungstexte; nur ungefährliche Probeaktionen.
- Verlauf: Datenabdeckung, Auto-/Linien-/Punkte-Modus, Monats-/Jahreszeiträume, echte Zeitabstände, Rendite/Geldflüsse/Referenzwerte.

**Sonntag 01.11. – Einrichtung, Datenintegrität und Grenzfälle:**
- „Mehr“: Konto-/Datenstand, Kursquellen, Fehlermeldungen; Backup heruntergeladen, sichere Ablage und Integrität geprüft.
- **Wiederherstellung nur in separatem Testbrowserprofil/-gerät mit Testdaten**, niemals ungesichert überschreibend im produktiven Portfolio. Ebenso Lösch-/Archiv-/Import-/Transfer-Grenzen nur mit klaren Testdatensätzen und vorherigem Backup testen.
- FLH03-Brokerimporte nur soweit tatsächlich produktiv unterstützt; zuerst **Vorschau, Dubletten, Kontozuordnung und Verwerfen**, keine Annahme, dass FLH05 oder alle Providerformate freigegeben sind.
- Nur öffentliche Walletadressen/xpub und vorhandene Watch-only-/Staking-Anzeigen testen; keine Seed-/Private-Keys oder reale Transaktionen für Tests.
- Offline-Start/Wechsel, Rückkehr online, PWA-Neustart/Update, Browser-Rücknavigation; Mehrtab-Konflikt prüfen ohne produktive Daten zu gefährden.
- Smartphone Hoch-/Querformat, 200%-Schrift bzw. System-Schriftvergrößerung, lange Namen/Zahlen, Fokus, Tastatur, 320–430px-ähnliche Darstellung bei Bedarf ergänzend am Desktop.

**Wichtig:** Zum Wochenende ist der **tatsächlich bestätigte LIVE_ACCEPTED-Stand** das Testobjekt. Neue PRs nur nach vollständigen Gates, individueller Freigabe und Produktionsabnahme. Während praktischer Tests bevorzugt **kein ungeplantes UI-Release**, das Befunde/Versionen vermischt.

## 4. Ergebnisformat für kommende Woche

Jeden Fund kurz als `Bereich | Gerät/Browser | Version/SW | Schritte | Erwartet | Tatsächlich | Schweregrad P0/P1/P2/P3 | Screenshot/kurzes Video | Datenmutationsrisiko` dokumentieren. **P0**: Datenverlust, falscher Finanzwert, Sicherheits-/Backup-Fehler; **P1**: Kernaktion nicht möglich, massiver Start-/Navigationsfehler; **P2**: Umständlich, zu viele Klicks, mobil unpraktisch; **P3**: Typografie, Abstände, Kosmetik. Keine privaten Kontodaten, API-Keys, Seedphrasen oder Originalfinanzbelege öffentlich in Issues hochladen.

Montag ab 02.11.: tatsächliche P0/P1-Repros zuerst, dann gemessene Startperformance und P2 nach Häufigkeit, Schweregrad und sichtbarem Nutzwert; bestehende UI-Drafts mit den realen Befunden **abgleichen statt erneut entwickeln**. Vor jeder Merge-/Deployaktion eigene konkrete Nutzerfreigabe und komplette passende Releaseabnahme.

## 5. Master-/Kosten-/Kollisionsschutz

Kein Abbruch laufender Actions, keine parallele Implementierung, keine Umpriorisierung eines bereits gestarteten Release-Schritts, keine Tests/Assertions/Timeouts/Finanz-/CAS-/Backup-/PWA-Gates abschwächen, keine historische Dokumentationsbranch-Merges nach main. Alles im zentralen `docs/WORK_RESTPAKETE_CHECKPOINT.md` und `docs/KONSOLIDIERTE_ROADMAP.md` verlinken. Unfertiges / CI-Restumfang nicht heimlich als erledigt behandeln. Null zusätzliche kostenpflichtige Work-Credit-Pakete.
