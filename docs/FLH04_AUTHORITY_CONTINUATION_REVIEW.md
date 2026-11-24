# FLH04 · Vollständige Autoritätsprüfung in Segmenten

Status: **Reviewkandidat mit ausführbarem Ablaufmodell. Enrollment bleibt gesperrt.**
Bezugsstand: `f2532984e1ff5e9e310077d6ab8674b3af8f7f84`,
Tree `12664602c6cf9d9c9414fe1d9721c778a10bfd41`. Maßgeblich sind
[Abschnitte 3, 5 und 8 des Autoritätsvertrags](FLH04_SYNC_WRAP_AUTHORITY_BYTE_CONTRACT.md),
[Abschnitt 3 des Writervertrags](FLH04_WRITER_FRAME_BYTE_CONTRACT.md) und
[der Ausstellervertrag](FLH04_ENROLLMENT_ISSUER_CONTRACT.md).

## Entscheidungsvorschlag

Die Prüfung läuft von Genesis bis zum exakt gebundenen Zielzustand. Jede
Prüfoperation verarbeitet höchstens 128 Zustände einschließlich Genesis und
Ziel. Fortschritt lebt in einem privaten, flüchtigen Controller. Die
Wiederaufnahme nach einem Prozessende beginnt bei Genesis. Bereits empfangene
Originalbytes können als untrusted Eingabe wiederverwendet und erneut geprüft
werden. Auf einem anderen Gerät gilt derselbe Start beim unabhängig
gepinnten Root und eine eigene lokale Zustimmung. Diese Variante benötigt
keinen neuen persistenten Vertrauensanker.

| Ansatz | Konsequenz |
| --- | --- |
| Vollständige Prüfung in Segmenten, flüchtiger Fortschritt | Jede Kante wird geprüft. Nach Prozessende steigt die Arbeit durch Wiederholung. Root und Ziel lassen sich ohne neue Vertrauensrolle fest binden. |
| Lokal MAC-geschützter persistenter Prüfstand | Ein MAC belegt Integrität im Schlüsselkontext. Ein früherer gültiger MAC kann mit seiner Nutzlast wieder eingespielt werden. Erforderlich wären eine rückrollsichere Generation, atomare Bindung an den kanonischen Store, Schlüssel-Lifecycle, Konfliktbelege und eine Strategie für mehrere Tabs. Auf einem frischen Gerät fehlt dieser lokale Anker. |
| Signierter Checkpoint oder Merkle-Consistency-Proof | Der Checkpoint-Aussteller wäre eine zusätzliche Vertrauensentscheidung. Ein Konsistenzbeweis belegt die Erweiterung eines konkreten Merkle-Baums. Für ausgelassene FLH04-Übergänge wären zusätzlich Rollentrennung, Doppelunterschrift bei Rotation, Widerruf, authentisierte Rootbindung, aktuelle Head-Bestätigung und Split-View-Erkennung zu qualifizieren. Siehe [RFC 9162 §2.1.4](https://www.rfc-editor.org/rfc/rfc9162.html#section-2.1.4) und [§11.3](https://www.rfc-editor.org/rfc/rfc9162.html#section-11.3). |
| Stilllegung und neue Linie | Nur als eigener qualifizierter Lebenszyklus mit explizitem Betreiberentscheid, geklärtem Altbestand, Historie, Outbox und Widerruf. Verlust des nicht portablen Autoritätsschlüssels ohne qualifizierten Nachfolger bleibt ein geschlossener Recoveryfall. |

## Invarianten für den späteren Verifier

1. Der private Controller bindet Protokoll/Suite, Zweck, lokale Linie,
   Portfolio, Rootfingerprint und gepinnte Bootstrapidentität, exakte
   Zielversion und Ziel-StateId, ggf. lokale Akzeptanzfloors und beobachtete
   Konflikte, Writer-/Beitrittskontext sowie eine frische lokale Operation.
   Zielpin und unabhängiger aktueller Autorisierungsnachweis sind getrennte
   Anforderungen. Bei Reload sind die lokale Auswahl und Zustimmung neu zu
   bestätigen.
2. Segmentdaten kommen in streng aufsteigender Reihenfolge. An der Grenze
   bleiben der exakte verifizierte Vorgänger und alle für Folgeregeln
   erforderlichen Historien im selben Controller. Jeder StateId entsteht aus
   den kanonischen signierten TBS-Bytes. Der Verifier vergleicht Version,
   exakten Vorgänger, Portfolio, Root, erlaubte Transition, Schlüssel und
   Signaturen. Auch bei Rotation prüft er beide vorgeschriebenen
   Signaturen. Vollständige Mitgliederlisten ersetzen die vorherige
   aktive Liste. Historische Autoritäts-/Writerrollen bleiben für die
   Rollentrennung erhalten. Epochen/Commitments, Rollen-, Mitglieds- und
   Geräteidentitäten sowie Auflösungen beobachteter Konflikte unterliegen
   weiterhin der vollständigen Vertragsprüfung. Kein historischer
   Prüfstand erzeugt aktuelle Rechte.
3. Die Schnittstelle akzeptiert weder serialisierte Fortschrittsobjekte
   noch externe Verifier- oder Zustimmungsflags. Der Controller akzeptiert
   nur eine laufende Prüfung. Späte Async-Rückgaben nach Abbruch, Reload
   oder neuer Operation werden verworfen. Für Bytes vor jedem Await
   unveränderliche Kopien, mit Begrenzung vor Allokation und Parseraufruf.
   Benötigt werden auch harte Transport-, Zeit-, Speicher- und
   Signaturarbeitsbudgets sowie Yield/Abbruch zwischen Segmenten. Keine
   automatische Endlosschleife oder PBKDF2 pro Segment.
4. Der vollständig geprüfte Pfad muss lokale Akzeptanzfloors an exakt
   derselben StateId enthalten. Bei beobachteten Geschwistern blockieren und
   die Originale erhalten. Selbst eine voll geprüfte Kette kann einen
   versteckten Widerruf oder unbekannten Fork nicht ausschließen. Ein
   frisches Gerät ohne Akzeptanzfloor braucht deshalb die im Vertrag
   geforderte unabhängig qualifizierte aktuelle Autorisierung. Der
   Verifier darf nur an die nachfolgenden vollständigen Vertragsprüfungen
   übergeben. Wrapgrant, Writerframe, aktuelle Mitgliedschaft,
   Frische/Verfügbarkeit, Zustimmung und der atomare CAS bleiben eigene Gates.
5. Unterbrechung innerhalb desselben Controllers lässt die letzte vollständig
   geprüfte Position im Speicher. Bei einem ungültigen Segment wird die
   gesamte Prüfung verworfen. Prozessende, Gerätewechsel und Verlust des
   Controllers beginnen bei Genesis. Fehlende Originale blockieren. Die
   App muss lange Ketten vor Erreichen eines später qualifizierten
   Lebenszykluslimits erkennen und einen separat reviewed Wartungs-/Recovery-
   Weg eröffnen. Ein frei gewählter höherer Grenzwert reicht dafür nicht.

## Reproduktion und Reviewumfang

```sh
node --test tests/flh04-authority-continuation.test.mjs
```

[Modell](../tests/fixtures/flh04-authority-continuation.mjs) und
[Tests](../tests/flh04-authority-continuation.test.mjs) verwenden synthetische
Zustände. Das Modell simuliert insbesondere den ablehnenden Rückgabewert
eines Signaturverifiers. Es enthält keinen Signatur-, Wire-, Persistenz- oder
Enrollment-Code. 16.384 Zustände bzw. 64 MiB sind ausschließlich Modellgrenzen
für prüfbare Lastfälle. Bruchteile der Kette geben nur `pending` zurück.
15 Tests decken die Grenzfälle, bekannte Forks und Floors, Kontextbindung,
Manipulation, Ablehnung, Replay, Rollentrennung, Widerruf über die Grenze,
Neustart, Abbruch während der Prüfung, konkurrierenden Segmentaufruf und
Ressourcenfehler ab.

Der unabhängige Review muss vor dem Wire-Code insbesondere die exakten
Invarianten an Segmentgrenzen, den Erwerb eines aktuellen autorisierten
Heads, die Bindung der Zustimmung an diese Prüfung und die
Lebenszyklus-/Verfügbarkeitsgrenze bestätigen. Danach sind echte
kryptografische Positiv-/Negativ-Vektoren, native Browser-Unterbrechungen,
Profilwechsel, kontrollierte Speicher-/Zeitmessungen und ein
Zwei-Geräte-Fall mit OAuth und unabhängigem Remote-Readback erforderlich.
