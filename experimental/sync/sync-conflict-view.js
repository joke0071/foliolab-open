// Read-only presentation of a verified pinned archive. A failed or superseded
// request cannot leave rows from a previously opened archive on screen.
const sections={
 version:'Datenformat',providers:'Anbieter',accounts:'Konten',assets:'Wertpapiere und Vermögenswerte',
 positions:'Positionen',bookings:'Buchungen',journalEntries:'Journal',openingPositions:'Anfangsbestände',
 externalCashFlows:'Externe Zahlungsflüsse',snapshots:'Bewertungsstände',performanceFlowTrackingSince:'Beginn der Zahlungsflusserfassung',
 priceHistories:'Kursverläufe',bookingPresentation:'Buchungsansicht',walletHistory:'Wallet-Historie',
 purchaseEvidence:'Kaufbelege',flatexNetRemovals:'flatex-Nettoentnahmen'
};

export async function showPinnedConflict(container,api,text){
 const table=container.ownerDocument.createElement('table');
 container.replaceChildren(table);
 try{
  const {overview}=await api.reopenPinnedConflictArchive({text,includeOverview:true});
  table.createCaption().textContent=overview.baseId===null?'Kein gemeinsamer Ausgangsstand':
   'Änderungen seit dem gemeinsamen Stand '+overview.baseId;
  const header=table.createTHead().insertRow();
  for(const title of ['Stand','Geänderte Finanzbereiche']){
   const cell=container.ownerDocument.createElement('th');cell.scope='col';cell.textContent=title;header.append(cell);
  }
  const body=table.createTBody();
  for(const {id,changedSections} of overview.heads){
   const row=body.insertRow();row.insertCell().textContent=id;
   row.insertCell().textContent=changedSections===null?'Vergleich nicht möglich':
    changedSections.map(key=>sections[key]??key).join(', ')||'Keine Änderungen';
  }
 }catch(error){table.remove();throw error;}
}
