/**
 * A Flatex depot turnover file provides the gross execution price but does
 * NOT establish total acquisition costs, withholding taxes, or all cash fees.
 * Prevent plausible-but-wrong cost bases / realised gains from appearing as
 * verified financial performance after an otherwise valid journal import.
 *
 * Mutates ONLY the disposable simulated model belonging to a preflight
 * preview. It must never be called against the live portfolio.
 */
export function invalidateUnverifiedFlatexBasis(preview,originalModel=null){
 if(!preview||!Array.isArray(preview.rows)||!preview.simulated?.positions)
  throw Error('Flatex-Vorschau fehlt.');
 const touched=new Set(preview.rows.filter(x=>x.status==='ready').map(x=>x.row?.positionId).filter(Boolean));
 if((originalModel?.positions||[]).some(p=>touched.has(p.id)&&(
  p.costBasisExact!=null||p.costBasisEUR!=null||p.realizedPnLExact!=null||p.realizedPnLEUR!=null)))
  throw Error('Flatex: bereits vorhandene Anschaffungskosten oder realisierte Ergebnisse dürfen nicht stillschweigend durch unvollständige Brokerkosten ersetzt werden. Bitte die Originalabrechnungen zuerst prüfen.');
 for(const position of preview.simulated.positions){
  if(!touched.has(position.id))continue;
  position.costBasisExact=null;
  position.costBasisEUR=null;
  position.realizedPnLExact=null;
  position.realizedPnLEUR=null;
 }
 return preview;
}
