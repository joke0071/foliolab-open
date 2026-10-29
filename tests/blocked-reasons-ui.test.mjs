import assert from 'node:assert/strict';
import test from 'node:test';
import {groupBlockedReasons,blockedReasonsMarkup} from '../src/blocked-reasons-ui.js';
const origin='Verlauf und Abgleich: Originalquelle, Aufschlüsselung oder Wiederimport sind noch nicht sicher rücknehmbar. Archivieren ist möglich.';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
test('blocker categories count unique identities, including overlapping reasons and repeated inputs',()=>{
 const entries=[{id:'a',reasons:[origin,origin,'Originalrevision oder zusätzliche Referenzfelder benötigen eine eigene Abhängigkeitsprüfung.']},
  {id:'a',reasons:[origin]},{id:'b',reasons:[origin]},{id:'c',reasons:[]}];
 const before=JSON.stringify(entries),g=groupBlockedReasons(entries);
 assert.equal(g.blockedCount,2);assert.deepEqual(g.categories.map(x=>x.count),[2,1]);
 assert.equal(g.categories[0].reasons.length,1);assert.deepEqual(g.categories[0].reasons[0].ids,['a','b']);
 assert.equal(JSON.stringify(entries),before);assert.equal(blockedReasonsMarkup([{id:'safe',reasons:[]}],{id:'empty',esc}),'');
});
test('many identical reasons render once without one DOM structure per selected identity',()=>{
 const html=blockedReasonsMarkup(Array.from({length:15000},(_,i)=>({id:'ref-'+i,reasons:[origin]})),{id:'referenceDeleteReason',esc,hint:'Archivieren ist möglich.'});
 assert.equal(html.split(origin).length-1,1);assert.match(html,/15000 geschützte Originalwerte/);
 assert.equal((html.match(/<section>/g)||[]).length,1);assert.equal((html.match(/<details/g)||[]).length,2);
 assert.doesNotMatch(html,/<details[^>]*\bopen\b/);assert.match(html,/ref-14999/);
});
test('unknown exact reasons stay distinct, safely escaped and traceable to their own identities',()=>{
 const a='<img src=x onerror=alert(1)>',b='Unbekanntes Detail & Sonderfall';
 const g=groupBlockedReasons([{id:'1',reasons:[a]},{id:'2',reasons:[b]},{id:'3',reasons:[a,b]}]);
 assert.equal(g.blockedCount,3);assert.equal(g.categories.length,1);assert.equal(g.categories[0].count,3);
 assert.deepEqual(g.categories[0].reasons.map(r=>r.ids),[['1','3'],['2','3']]);
 const html=blockedReasonsMarkup([{id:'<id>',label:'<name>',reasons:[a,b]}],{id:'"quoted',esc});
 assert.doesNotMatch(html,/<img|<name>|<id>/);assert.match(html,/&lt;img/);assert.match(html,/&quot;quoted/);
});
