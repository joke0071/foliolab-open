import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectNativeFlatexOrderLinks as inspect} from '../src/flatex-settlements.js';
import {flatexNativeMarkup,flatexNativeOrderMarkup as markup} from '../src/flatex-native-ui.js';
import {nativeFlatexCSV as csv} from './flatex-native-fixture.mjs';
const D=(rows=[{}],name='same.csv')=>({name,document:parseFlatexNativeCSV(csv('depot',rows))});
const C=(rows=[{}],name='same.csv')=>({name,document:parseFlatexNativeCSV(csv('account',rows))});
const links=docs=>inspect(docs.map(f=>f.document));
const order=i=>'ABR ORDER Kauf IE00SYNTH001 '+i;
test('order UI retains exact sources, separated references, duplicate filenames and read-only qualification',()=>{
 const docs=[D([{5:'0,000000000000000001'}]),C()],before=JSON.stringify(docs),l=links(docs),html=flatexNativeMarkup(docs,{orderLinks:l});
 for(const s of ['Mögliche 1:1-Beziehung','1 mögliche Paare','0 Prüffälle','Datei 1 · same.csv · Zeile 2','Datei 2 · same.csv · Zeile 2','00070000000000000001','00080000000000000001','0009007199254740993','0.000000000000000001','-3086.25 EUR','keine bestätigte Abrechnung','Keine Buchungsübernahme'])assert.ok(html.includes(s),s);
 assert.equal((html.match(/class="performance-details"/g)||[]).length,2);assert.equal(JSON.stringify(docs),before);assert.doesNotMatch(html,/type="submit"|bestätigte Abrechnung<|Gebührensumme/);
});
test('all conservative statuses and reasons are displayed without relabelling as accepted',()=>{
 const cases=[[[D(),C()],'Mögliche 1:1-Beziehung'],[[D(),C([{5:'A'},{5:'B'}])],'Mehrere Kontobelege prüfen'],[[D([{8:'A'},{8:'B'}]),C()],'Mehrere Depotausführungen prüfen'],[[D()],'Kontobeleg fehlt'],[[C()],'Depotbeleg fehlt'],[[D(),D([{1:'03.01.1999'}]),C()],'Widerspruch prüfen'],[[D(),D(),C()],'Überlappung prüfen'],[[D([{7:'Storno '+order('0009007199254740993')}]),C()],'Storno prüfen'],[[D(),C([{5:'A'},{5:'B',9:'OTHER'}])],'Quellkontexte prüfen'],[[D(),C([{7:'CHF'}])],'Quellangaben prüfen']];
 for(const [docs,label]of cases){const l=links(docs),html=markup(docs,l);assert.ok(html.includes(label),label);for(const r of l.groups[0].reasons)assert.ok(html.includes(r.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')),r);assert.ok(html.includes('keine bestätigte Abrechnung'));}
});
test('group and leg paging are independent and preserve every source locator',()=>{
 const docs=[D(Array.from({length:45},(_,i)=>({7:order(i),8:'SYN-'+i})))],l=links(docs),html=markup(docs,l);
 assert.equal((html.match(/class="flatex-order-group"/g)||[]).length,20);assert.match(html,/20 von 45 Gruppen/);assert.match(html,/Weitere 20 Gruppen/);assert.doesNotMatch(html,/flatexOrderGroup-20/);assert.match(markup(docs,l,{limit:40}),/flatexOrderGroup-39/);assert.doesNotMatch(markup(docs,l,{limit:60}),/flatexOrdersShowMore/);
 const legs=[D(),C(Array.from({length:45},(_,i)=>({5:'SYN-'+i})))],ll=links(legs),first=markup(legs,ll),last=markup(legs,ll,{legLimits:{0:60}});
 assert.equal((first.match(/tabindex="-1"/g)||[]).length,20);assert.match(first,/20 von 46 Belegen/);assert.match(first,/Weitere 20 Belege/);assert.equal((last.match(/tabindex="-1"/g)||[]).length,46);assert.doesNotMatch(last,/data-flatex-order-legs/);assert.equal(ll.rows.length,46);
 for(const limit of [0,5001,1.5,NaN]){assert.throws(()=>markup(docs,l,{limit}));assert.throws(()=>markup(legs,ll,{legLimits:{0:limit}}));}
});
test('unknown order events stay in source UI and malicious/long source strings remain escaped',()=>{
 const docs=[D([{7:'Thesaurierung',4:'<svg onload=evil()>'}],'<img src=x>')],l=links(docs),html=flatexNativeMarkup(docs,{orderLinks:l});assert.match(html,/0 Gruppen/);assert.match(html,/1 Zeilen ohne Orderreferenz/);assert.match(html,/Thesaurierung/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img|<svg/);
 const evil=[D([{11:'<svg onload=evil()>'}],'<img src=x>'+'a'.repeat(400)),C()],el=links(evil),h=markup(evil,el);assert.match(h,/&lt;svg/);assert.match(h,/&lt;img/);assert.match(h,/Anzeige gekürzt\) · Zeile 2/);assert.doesNotMatch(h,/<img|<svg/);
 assert.throws(()=>markup(evil,{...el,writeEnabled:true}));assert.throws(()=>markup(evil,{...el,ready:true}));
});
