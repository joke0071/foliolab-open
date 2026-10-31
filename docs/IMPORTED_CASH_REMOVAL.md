# P1A: belegte importierte EUR-Geldbuchungen zurücknehmen

Status: IN_PROGRESS, Basis v242 / 25ec0bd1cf834fdb129b67fbc12d90fdecbd9196.
Verantwortlich: aktueller Work-Chat /root. Branch: feature/proven-import-cash-removal.

Der vorhandene Löschdialog kann unveränderte generic-csv-Geldbuchungen mit eindeutiger externer Referenz zurücknehmen: Einzahlung, Auszahlung, Dividende, Zinsen, eigenständige Gebühr und Steuer. Herkunftssnapshot, Originalfelder, Fingerprint, Kontobindung, Journal, exakte EUR-Mengen, Kapitalflüsse und Referenzen müssen zusammenpassen. Es gelten weiterhin sämtliche bisherigen Wallet-, Transfer-, Fremdwährungs-, Nebenkosten-, Stichtags-, Bestands- und Chronologieprüfungen. Geprüft wird frisch beim Erstellen der Vorschau und erneut vor CAS-Speicherung.

Auditversion 2 erlaubt ausschließlich Rücknahmen, erhält die vollständigen Originale und enthält selbst keine wirtschaftlichen Postings. Auditversion 1 bleibt für manuelle Vorgänge unverändert lesbar. Ältere Appversionen lehnen neue Auditversionen ab. Der Dialog weist auf die aktuelle Version für Sicherungen hin.

Gelöschte externe Referenzen und mögliche Überschneidungen ohne externe Referenz derselben Position / desselben Datums / Typs sind beim erneuten Import ausdrücklich gesperrt, auch mit anderem Dateinamen oder Quellnamespace. Dies ist ein Prüfhinweis, kein Beweis, dass ähnliche Buchungen identisch sind. Kein automatisches Wiederanlegen oder stilles Überspringen. Exaktes Undo ist bis zur nächsten Portfolioänderung möglich; danach ist eine geprüfte Sicherung nötig. Ein eigenständiger Vorgang mit anderer externer Referenz bleibt auch am selben Datum importierbar. Eine gesonderte erneute Importfreigabe für gelöschte Referenzen ist noch nicht implementiert.

Offen bleiben Broker-/native Flatex-/Walletimporte, fehlende oder mehrdeutige Identitäten, geänderte Herkunft, Wertpapiergeschäfte, gekoppelte Kosten/Gegenkonten und Transfers. Importierte Buchungen werden in diesem Paket weder bearbeitet noch mit neuen Notizen verändert. DELETE-MASTER28 bleibt PARTIAL.

Validierung: neue Unitprüfungen für alle sechs Typen, Betrag und Journal, Audit/Backup/Restore, Wiederimport, geänderte Identität, abhängige Ausgaben, Referenzen, Stichtage, CAS/Consent und Undo. Neuer Browservertrag prüft den bestehenden Dialog bei 320/360/390/412/430/1440 px, Axe, Persistenz und exaktes Undo. Vor Release sind vollständige Chromium-/Firefox-/WebKit-Gates erforderlich. Keine echte Android-/Safari-/TalkBack-Abnahme behauptet.
