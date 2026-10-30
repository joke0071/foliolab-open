# CI-OPT01: konservative Draft-Stufen

Fortsetzung von Issue #229 nach vollständig abgenommenem PR #230 / Main
`7490f243ff32c659c418cdf92540fe9ef1cc4189`. Dieser Teilschnitt aktiviert nur
eine kleine explizite FAST-Allowlist. Er verändert keine Produktdatei und keinen
bestehenden vollständigen Browser-, Sicherheits- oder Releaseprüfpfad.

| Anlass / tatsächliche Änderungen | Stufe | Pflichtumfang |
| --- | --- | --- |
| Draft gegen Main, ausschließlich hinzugefügte/geänderte reguläre `docs/**/*.md` | FAST | Vollständige Units und Syntax; separater eindeutiger FAST-Beleg |
| Derselbe Draft, zusätzlich/ausschließlich geänderte reguläre `styles.css` | FAST | Zusätzlich bestehende Chromium-UI07-, Responsive-Actions- und Dialog-A11y-Mobile-Tests |
| Fertiger PR / `ready_for_review`, anderer Zielbranch, veraltete Basis, unbekannte/fehlende Metadaten oder sonstige Datei | INTEGRATION | Vollständiger bisheriger Main-/Chromium-/dreiCross-Prüfpfad |
| Main-Push oder manueller Main-Lauf | RELEASE | Vollständige Regression, Pages und tatsächliche Live-Abnahme unverändert |

Die CSS-Audits prüfen sechs Breiten, alle fünf Reiter, Dialogfokus und Tastatur,
200% CSS-Zoom, reduzierte Bewegung, Leerzustände, Accessibility und unveränderte
Finanzdaten/Revision. Firefox/WebKit und die komplette Finanz-/Speicher-/Backup-/CAS-
Regression bleiben vor technischer Abnahme und in jedem Release Pflicht.

`src/**`, Worker, HTML, SW/PWA/Manifest, Icons, Abhängigkeiten, Testcode,
CI-Vertrag und alle unbekannten Dateien lösen automatisch volle Prüfung aus.
Damit gilt dies auch für Finanz-/Buchungs-/Wallet-/Lösch-/Migrationsänderungen.
Mischänderungen sind vollständig, sobald eine einzige Datei nicht freigegeben
ist. Löschungen, Umbenennungen, Symlinks und andere Dateimodi sind konservativ
vollständig. Die Klassifizierung verwendet den vollständigen tatsächlichen
Git-Diff ohne Rename-Erkennung zwischen exakten Event-SHAs. FAST setzt voraus,
dass die aktuelle PR-Basis Vorfahr des PR-HEAD ist; keine veraltete Basis erhält
optimistisch FAST. Ein Discoveryfehler wird im Beleg genannt und führt zu FULL.

Der `ready_for_review`-Trigger ist ausdrücklich ergänzt. FAST ist kein
Integrationserfolg. Die vollen Jobs werden nur bei `full=true` ausgeführt;
Pages hängt weiterhin zwingend an beiden vollständigen Jobgruppen. Ein
Planfehler überspringt die abhängigen Jobs und kann keinen Release ermöglichen.
Jeder vollständige Prüfbody einschließlich aller Assertions, Versionen und
Fristen sowie Pages/Live bleibt bytegleich zu Main7490f243; Hashkontrollen und
Negativtests schützen diesen Vertrag. Der vorhandene SW-Revisionscheck bleibt
in INTEGRATION/RELEASE unverändert. Ein CSS-Draft kann die Revisionsänderung bis
zum fertigen Kandidaten vorbereiten; ein mitgeändertes `sw.js` erzwingt FULL.

Es wird keine neue Branch-Protection behauptet: zuletzt hatte Main keine
erforderlichen Check-Kontexte. Die bestehende konkrete technische und
Nutzerabnahme vor jedem Merge bleibt verbindlich. Ein grüner FAST-Lauf darf
niemals dafür verwendet werden; der bereite Kandidat benötigt die vollständige
INTEGRATION auf seinem exakten aktuellen HEAD/Testmerge.

`artifacts/ci-stage/plan.json` enthält Stufe, Grund, Basis/HEAD, vollständigen
Diff und die ausdrückliche Abnahmegrenze. FAST-Artefakte heißen
`fast-only-not-integration-*`. Bei Änderung dieses CI-Vertrags wird derselbe
gezielte CSS-Browserpfad zusätzlich als Canary in einem isolierten Job geprüft,
während gleichzeitig sämtliche vollständigen Gates verpflichtend laufen.
Die kompletten Units werden dabei einmal im Hauptjob ausgeführt; der Canary
wiederholt sie nicht. Kein automatischer Retry und keine neue Screenshot-Baseline.

## Messung und verbleibender Umfang

Vorherbelege und PR230-Ergebnisse bleiben auf dem zentralen Checkpoint-Branch
erhalten. FAST spart ausschließlich bei den obigen Drafts Browserinstallationen
und vollständige Regressionen. Bereite PRs und Releases werden nicht reduziert.
Laufzeit, ausgeführte Testaufrufe und Runneraufwand sind am tatsächlichen
Canary zu dokumentieren; Simulationen sind keine reale FAST-Gesamtlaufzeit.
Keine erfundenen Work-Credit-/Euroersparnisse oder statistischen Garantien.

Caching, Playwright-Versionsangleichung, Chromium-Sharding, breitere fachliche
Impactzuordnung und Infrastruktur-Retrypolitik bleiben offene CI-OPT01-Teile.
Alle Masteranforderungen erhalten; nur FLH05 und FLH-PROJ01 bewusst PARKED.
Keine zusätzlichen kostenpflichtigen Work-Credit-Pakete kaufen oder einplanen.
