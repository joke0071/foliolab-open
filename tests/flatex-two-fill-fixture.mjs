import {fixture} from './flatex-net-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectFlatexNetPairs,prepareFlatexNetPreview} from '../src/flatex-net-settlement.js';
import {importCSV} from '../src/csv-import.js';
import {backup,safeImport} from '../src/model.js';
import {ledgerQuantityAudit} from '../src/transactions.js';
export function twoFixture({equal=false,reverse=false}={}){
 const f=fixture();f.documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{5:'1',9:'10',8:'SYN-FILL-A'},{5:equal?'1':'2',9:'10',8:'SYN-FILL-B'}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{6:equal?'-22':'-32'}]))];if(reverse)f.documents.reverse();
 f.options.selectedIds=inspectFlatexNetPairs(f.documents).pairs.map(p=>p.id);return f;
}
