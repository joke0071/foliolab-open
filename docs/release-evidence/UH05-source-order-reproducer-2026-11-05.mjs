/** Read-only diagnostic over detached synthetic models; no product patch or guard exception.
 * Run from repo root: node docs/release-evidence/UH05-source-order-reproducer-2026-11-05.mjs
 */
import assert from 'node:assert/strict';
import {fixture as nativeFixture} from '../../tests/flatex-net-fixture.mjs';
import {contextFixture} from '../../tests/flatex-context-fixture.mjs';
import {fixture as bitpandaFixture,source} from '../../tests/bitpanda-import-fixture.mjs';
import {prepareFlatexNetPreview} from '../../src/flatex-net-settlement.js';
import {importCSV} from '../../src/csv-import.js';
import {snapshot} from '../../src/model.js';
import {previewBitpandaImport,confirmBitpandaImport} from '../../src/bitpanda-import.js';
const reports=[];
for(const [dialect,make] of [['Depot12/Konto10',nativeFixture],['Depot13/Konto8',contextFixture]]){
 const f=make(),b=bitpandaFixture(),model=structuredClone(f.model);
 for(const key of ['providers','accounts','positions','openingPositions'])model[key].push(...structuredClone(b.m[key]));
 const bp=m=>{const p=previewBitpandaImport(m,[source()],b.assignments,b.options);assert.deepEqual(p.issues,[]);return confirmBitpandaImport(m,[source()],b.assignments,{...b.options,confirmed:true,baseline:p.baseline});};
 const first=structuredClone(model),p=prepareFlatexNetPreview(first,f.documents,f.assignments,f.options);
 assert.equal(p.eligible,true,p.reason);importCSV(first,p.preview);assert.equal(bp(first).bookings.length,3);
 const reversed=bp(model),blocked=prepareFlatexNetPreview(reversed,f.documents,f.assignments,f.options);
 assert.equal(blocked.eligible,false);assert.match(blocked.reason,/Eröffnung/);
 snapshot(reversed); // This is also called by the actual provider UI after commit.
 // Diagnostic clone modification ONLY, to isolate the subsequent reference guard.
 // It is not an approved implementation for dating/replacing existing openings.
 for(const o of reversed.openingPositions.filter(o=>['etf','cash'].includes(o.positionId)))o.asOf=f.options.openingDate;
 const reference=prepareFlatexNetPreview(reversed,f.documents,f.assignments,f.options);
 assert.equal(reference.eligible,false);assert.match(reference.reason,/Referenzstand/);
 reports.push({dialect,firstOrder:'Flatex → Bitpanda accepted by current core',reversedOrder:blocked.reason,actualUiFollowingGuard:reference.reason});
}
console.log(JSON.stringify({result:'REPRODUCED_CURRENT_BOUNDARIES',reports,limits:'No shared-import acceptance. Preserve true opening/end-balance/reference/cost/manual/CAS guards; dating null alone does not solve the actual UI path.'},null,2));
