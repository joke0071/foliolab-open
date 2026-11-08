# UH05: native Fiat-/Positionsart-Zuordnung

Status: Originalnachweis, unabhängiger Decimal-Abgleich und isolierte Reproduktion gesichert. Noch keine Produktimplementierung oder Freigabe eines Nutzerimports. Der nächste Produktkandidat darf erst nach vollständiger LIVE_ACCEPTED-Abnahme von v297 beginnen.

## Beleg und Grenze

Die vorhandenen privaten Quellen wurden erneut gelesen: 20 Original-CSV-Dateien sowie 29 Beleg-/Oracledateien mit 19 eindeutigen Beleg-Hashes. Die historischen Flatex-Gruppen und die bereits abgenommenen Funding- und Kraken-Transferfälle werden wiederverwendet; daraus werden keine hypothetischen N:M-/FX-Fälle erzeugt.

Zwei tatsächliche native Kraken-Gruppen belegen einen neuen Zuordnungsschutzfall: eine vollständige Fiat-Ausführung mit internem Gebührenbein und ein Fiat-Ertragsereignis. Auf unverändertem v297-Code kann eine manuell als Krypto angelegte, EUR-basierte Position mit dem Namen des Fremdwährungsassets die native Fiat-Rolle umgehen. Beide vollständigen Gruppen wurden ausschließlich in einem abgetrennten Speichermodell bis zur In-Memory-Bestätigung reproduziert. Es gab keine IndexedDB-/CAS-Schreibvorgänge und keine Übernahme in ein Nutzerportfolio.

Der unabhängige Sollbeleg liest die Originaldatei mit Python CSV und Decimal-Präzision 100. Er prüft Herkunfts-Hash, vollständige Referenzmitgliedschaft, Zeitpunkt, native Assetklasse, Walletbereich und exakte Vor-/Nachbestände einschließlich Gebühren. Diese bedingten Quellenanfänge sind keine Freigabe realer Anfangsbestände. Der EUR-Wert interner Gebühreneinheiten bleibt UNKNOWN. Originalreferenzen, Kennungen und persönliche Beträge bleiben ausschließlich in der privaten Sicherung.

## Nächster begrenzter Vertrag

- Frische native Fiat-Zeilen ausschließlich über den vorhandenen EUR-Cashvertrag zulassen. Fremdwährungsfiat darf nicht durch eine gleichnamige Kryptoposition importierbar werden.
- Native EUR-Fiat-Zeilen dürfen nicht als Krypto umgedeutet werden. Cashzuordnung verlangt die passende native Fiat-Rolle.
- Unveränderte vollständig gespeicherte Altgruppen müssen lesbar bleiben und exakt ohne neue Wirkung wiedererkannt werden. Bestehende Undo- und dokumentarische Rücknahmewege bleiben erhalten. Geänderte, unvollständige, anders zugeordnete oder journalverwaiste Altgruppen dürfen daraus keine Ausnahme erhalten.
- Legitime Krypto-/Stablecoin-, EUR-, interne Gebührenmengen-, Transfer-, Quellen-, Kostenbasis-, Anfangsbestands-, CAS- und Backupverträge erhalten. Keine neue Finanzengine, kein Datenformatwechsel und keine Migration.
- Öffentliche Tests verwenden ausschließlich erfundene Quellen. Zwei synthetische Altgruppen wurden bereits mit dem tatsächlichen unveränderten v297-Importer erzeugt; der Importer-Gitblob wurde gegen den Main-Tree geprüft.
- Direkte und gemeinsame Vorschau/Bestätigung, Nichtmutation, gemischter Import ohne Teilübernahme, Altgruppen-Replay/Undo/Rücknahme und tatsächliche gemeinsame Importoberfläche in allen drei Engines prüfen. Keine Abschwächung bestehender Quoten-, Mehrtab-, Offline-, Restore- oder Releaseprüfungen.

Das ist ein Zulassungsschutz, keine Unterstützung fremder Cashwährungen oder vollständiger FX-Settlements. Historische Fehlklassifikationen werden nicht automatisch korrigiert. UH05 bleibt PARTIAL. DKB bleibt außerhalb; externe Sparplanfinanzierung ist kein Gewinn. Fehlende Wallets/Staking bleiben UNKNOWN.

## Weitere belegte Grenzen

Die aktuellen Kraken-Quellen enthalten weiterhin zwölf ungeklärte Gruppen: elf Einzelzeilen und eine mehrgliedrige USD/EUR-Gruppe. Die bereits produktive begrenzte Spot-/Earn-Hauptbetragserkennung bleibt unverändert. Bitpanda-Transfer-/Stake-/Unstake-Zeilen liefern ohne zusätzliche Gegenbelege keine neuen sicheren Buchungen oder Kostenbasen. Ledger-/Walletüberschneidungen und fehlende Historie werden nicht durch Summenheuristiken geschlossen.

UI300 mit allen zehn Nachträgen, QUALITY-TRUST01 #298, CI-OPT01 #229 und die gesamte bestehende Roadmap bleiben erhalten. Das statische Runtime-/Modulinventar ist eine Vorbereitung, kein vollständiger Datenschutz-, Sicherheits- oder Lizenznachweis. Echte Android-Geräte-, native Safari-, OAuth- und TalkBack-Prüfungen wurden dadurch nicht durchgeführt. Die historische Alpha-IDB-Ursache bleibt UNKNOWN; die frühere Ausnahme ist verbraucht.
