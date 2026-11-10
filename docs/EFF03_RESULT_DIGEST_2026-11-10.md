# EFF03 – lokaler Ergebnisverdichter: begrenzter Vertrag · 10.11.2026

Owner4932401a9f1d. Basis v303/Main73a17662e53d4b4d88125a85879e5fcae112596e/Tree160ba4767a04dc6a3d38b2d2058dbf529a2c7ff1. Keine Wiederabnahme des Releases.

## Umfang vor Implementierung

Ein lokales Python-Standardbibliothek-Werkzeug liest explizit zugeordnete vorhandene OriginalZIPs und einen erwarteten Manifestvertrag. Identität je Main/Tree/Run/Versuch/Artefakt-ID sowie ZIP-Größe/SHA256/CRC und vollständige erwartete JSON-Berichtpfade bleiben nachvollziehbar. Originale werden niemals verändert oder entpackt. JSON-Befunde behalten Artefakt, Mitgliedspfad und JSON-Pointer. Fehlende Berichte, widersprüchliche Identität, defekte Archive, falsche Digests/Größen und bekannte Fehlerflags ergeben explizite Fehler. Unbekannte Ergebnisschemata/Statuswerte bleiben UNKNOWN. Ein leerer Manifestvertrag darf keine Entwarnung erzeugen.

Ausgabe ist ausschließlich eine technische Zusammenfassung mit REVIEW_REQUIRED, FINDINGS oder UNKNOWN; niemals automatische PASS-/Releasefreigabe. Keine CI-/Workflow-/Gateauswahl-/Produktänderung. Tatsächliche Bilder-, Finanz-, Geräte- und Fachprüfung bleiben erforderlich. Kein allgemeiner rekursiver Wahrheitswertscanner, der erwartete negative Testwerte als Produktfehler behandelt: nur bekannte Ergebnisfelder und Fehlerlisten aus tatsächlichen v303-Schemata, sonst UNKNOWN. Alle JSON-Originalpfade bleiben als Index verfügbar.

## Abnahme

Acht vorhandene v303-OriginalZIPs aus Main42814350681 Versuch1 mit398JSON und3472PNG sind der identische Vergleichssatz. Erwartete Berichte aus einer vorher getrennt erfassten vollständigen ZIP-Inventarliste, nicht während des eigentlichen Verdichtungslaufs erfinden. Quellenbindung an bereits qualifizierten v303-Index; historische Main-Zwischenzustände mit LIVE_IN_PROGRESS nicht als aktuellen Produktfehler umdeuten.

Negative Kontrollen müssen fehlenden Bericht, falschen Digest, echten Fehlerflag, falsche Runidentität, unbekanntes Schema und CRC-Schaden sichtbar machen. Messung: vollständige JSON-Anzahl gegen einen Zusammenfassungsread plus tatsächlich notwendige Detailreads, Laufzeit des Werkzeugs separat. Aktive frühere manuelle Auswertungszeit und Workverbrauch UNKNOWN; keine prozentuale Zeitersparnis behaupten. Keine Wiederholung der PNG-Sichtprüfung oder qualifizierter Pflichtgates.

## Übernahmeprüfung

287Refs erfasst; Main/Tree und Checkpoint-HEAD6bf08028c627442d5191fa06d2c54e8f0517bc44 stimmen mit regulärer Abgabe überein. Nur historische Drafts157/161 offen, keine Reviews/Inlinekommentare;0in_progress/queuedActions. Kein lokales WIP. Sicherungsidentität aktuell132/405432320Bytes bestätigt; unveränderte V132-Readback-/Restorebelege wiederverwendet, keine erneute Vollrestorebehauptung. Alle vorherigen Originalketten erhalten.

## Ergebnis des begrenzten Kandidaten

**LOCAL_CANDIDATE_VALIDATED**, ausschließlich auf der bestehenden Checkpointref bereitgestellt; nicht nach Main integriert und kein Produktrelease. Werkzeug: `tools/summarize_release_artifacts.py`; Standardbibliothek, lokaler Read-only-Lauf. Aufruf: `python3 tools/summarize_release_artifacts.py docs/release-evidence/v303-eff03-input-contract.json <ZIP-Verzeichnis>`. Optional `--details` liefert den vollständigen Index. Exit0 bedeutet nur REVIEW_REQUIRED; Exit1 FINDINGS, Exit2 UNKNOWN. Niemals Releasefreigabe.

[Expliziter v303-Eingangsvertrag](release-evidence/v303-eff03-input-contract.json), [kompakte Ausgabe](release-evidence/v303-eff03-summary.json), [Negativkontrollen](release-evidence/v303-eff03-negative-controls.json). ZIP-Dateinamen entsprechen den Artefakt-IDs. Erwartete Größen/Digests stammen aus dem bereits qualifizierten v303-Abnahmeindex; zusätzlich alle8 aktuellen API-Artefaktmetadaten einschließlich Run/Head/Größe/Digest verglichen. Main-Tree und Versuch1 frisch bestätigt. Getrennte Vorlaufinventur aus den bereits qualifizierten OriginalZIPs erstellt; nicht automatisch auf neue Releases übertragen oder mit neuen Istwerten als Soll regenerieren.

Ergebnis:8Archive/Digest+Größe+vollständigerCRC,398JSON,3472PNG-CRC,745 explizite Ergebnisassertions;0FINDINGS,15UNKNOWN wegen bewusst fehlender Ergebnisadapter. Keine PNG-Dekodierung/Sichtprüfung wiederholt. Laufzeit2,831s auf dieser Umgebung, kompakte Ausgabe4793Bytes. Keine Gesamtsemantikprüfung: übrige Felder bleiben ungeprüft, alle Fach-/CI-/Gerätegates bleiben erforderlich.

Bei der ersten Erprobung wurde ein Ergebnisobjekt mit mehreren Unterergebnissen zunächst fälschlich als skalarer Fehlschlag markiert. Expliziter Adapter für die tatsächlich geprüfte Chromium-Long-Press-Struktur korrigiert; andere unbekannte Formen bleiben UNKNOWN. Keinen Produktfehler daraus abgeleitet.

Messbare technische Sichtung auf identischem Satz:398Einzelberichte im vollständigen Ausgangsinventar; jetzt1kompakte Ausgabe und15explizit ausgewiesene Detailberichte. Diese15Originale zur Schemaeinordnung geöffnet;6Diagnostik-Snapshots,3Provider-Retirement-Berichte ohne skalaren Status,4Ereignisprotokolle,2andereLong-Press-Ergebnisobjekte. WeiterhinUNKNOWN im Werkzeug, kein stiller Adapter-/PASS-Zwang. Dieser16-Read-Pfad ist nur die technische Erstübersicht der definierten Felder, **kein äquivalenter Ersatz für398vollständige fachliche Einzelprüfungen**. Tatsächliche frühere aktive Auswertungszeit/Workverbrauch UNKNOWN; keine gemessene Zeitersparnis oder Prozentersparnis behauptet.

10gezielte adversariale Tests bestanden: leeresManifest/Runabweichung/fehlenderBericht/Digest/Größe/CRC/echterFehler/Fehlerliste/UNKNOWN/fehlenderPointer/unsichererZIP-Pfad/Originalerhaltung. Zusätzlich auf dem v303-Vertrag fehlendenBericht/falschenDigest/falschenRun und einen echten FAIL im isolierten Klon des tatsächlichen Refresh-Berichts geprüft: alleFINDINGS; Originale unverändert. Vollständige Rohoriginale sind bereits in V132 samt Ergänzungen dauerhaft gesichert; keine neue Originalklasse oder privater Payload durch das Werkzeug entstanden. Neuer Quellcode und abgeleitete redigierte Belege gitbasiert erhalten; V132 bleibt unverändert. Kein zusätzlicher Vollrestore/keine neue private Version behauptet.

## Nächste Arbeit und Grenze

Kandidat kann im nächsten real nötigen Auswertungsschritt unterstützend verwendet werden; neue Releaseverträge müssen unabhängig aus vorgeschriebenen Berichten/qualifizierten Quellen erstellt werden. Nicht durch einfaches Inventarisieren beliebiger neuer Istwerte eine Sollfreigabe erfinden. Keine automatische CI-Einbindung oder Folgeplattform. Aufwand begrenzt lassen.

Danach seriell K1–K6 gemäß kanonischer Matrix: vorhandene K1-Belegzuordnung verwenden, konkret fehlende unabhängige Originalanker extern lassen; nächsten K2-KURSE-Quellen-/Hilfen-/Copy-Rest gegen bestehenden Main abgrenzen, nur reproduzierte Kernlücke öffnen. Kein neuer Finanzsonderfall und kein Wiederbau fertiger UI/Frequenzteile. Physische Android/TalkBack/Safari/OAuth-Grenzen unverändert.
