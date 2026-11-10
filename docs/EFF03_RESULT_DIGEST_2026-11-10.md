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
