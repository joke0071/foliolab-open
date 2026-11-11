import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {validatedPublicEndpoint} from '../src/public-instruments-client.js';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function harness(settings={},values={}){
 const elements=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value}]));
 elements.namedItem=key=>elements[key]||null;
 const nodes=new Map([['apiSettings',{elements}]]),listeners=[];
 const document={activeElement:{matches:()=>false},querySelector:()=>null,createElement:()=>({setAttribute(){},addEventListener(type,fn){listeners.push(fn);},append(){}}),body:{appendChild(n){nodes.set(n.id,n);}}};
 const context=vm.createContext({model:{settings},$:id=>nodes.get(id),validatedPublicEndpoint,document,saving:false,busy:false,editor:null,confirm:()=>false,notify(){},location:{reload(){context.reloads++;}},reloads:0});
 const start=source.includes('function apiSettingsHasDraft()')?'function apiSettingsHasDraft()':'function pwaUpdateShouldDefer()';
 vm.runInContext(source.slice(source.indexOf(start),source.indexOf("if('serviceWorker'in navigator")),context);
 return {context,elements,listeners,dirty:()=>vm.runInContext('pwaUpdateShouldDefer()',context),notice:()=>vm.runInContext('showPwaUpdateNotice()',context)};
}
test('unfocused unsaved credentials defer an automatic update',()=>{assert.equal(harness({alphaVantageKey:''},{alphaVantageKey:'SYNTHETIC'}).dirty(),true);});
test('every existing form credential and source selection is protected',()=>{
 for(const key of ['alphaVantageKey','marketstackKey','coinGeckoKey','etherscanKey','binplorerKey','eodhdWorkerAccessToken','securitySource'])assert.equal(harness({[key]:''},{[key]:'SYNTHETIC'}).dirty(),true,key);
});
test('missing form, omitted fields, defaults and trimmed credentials remain clean',()=>{
 assert.equal(harness({securitySource:'auto',coinGeckoKey:'SYNTHETIC'},{securitySource:'auto',coinGeckoKey:' SYNTHETIC '}).dirty(),false);
 const h=harness();h.context.$=()=>null;assert.equal(h.dirty(),false);
 assert.equal(harness({etherscanKey:'SYNTHETIC'},{}).dirty(),false);
});
test('saved endpoint origin and equivalent URL spelling remain clean',()=>{
 for(const key of ['publicInstrumentEndpoint','eodhdWorkerEndpoint'])assert.equal(harness({[key]:'https://example.invalid'},{[key]:' https://EXAMPLE.invalid:443/ '}).dirty(),false,key);
});
test('new, changed, removed and invalid endpoints remain protected',()=>{
 for(const key of ['publicInstrumentEndpoint','eodhdWorkerEndpoint'])for(const value of ['', 'http://example.invalid','https://other.invalid','invalid'])assert.equal(harness({[key]:'https://example.invalid'},{[key]:value}).dirty(),true,key);
});
test('credential clearing is dirty until successful save, then clean',()=>{
 const h=harness({coinGeckoKey:'SYNTHETIC'},{coinGeckoKey:''});assert.equal(h.dirty(),true);h.context.model.settings.coinGeckoKey='';assert.equal(h.dirty(),false);
});
test('failed save rollback still protects the form draft',()=>{
 const h=harness({marketstackKey:'stored'},{marketstackKey:'draft'});h.context.model.settings.marketstackKey='draft';h.context.saving=true;assert.equal(h.dirty(),true);h.context.model.settings.marketstackKey='stored';h.context.saving=false;assert.equal(h.dirty(),true);
});
test('existing busy, editor, dialog and focused-input guards remain',()=>{
 for(const key of ['saving','busy','editor']){const h=harness();h.context[key]=true;assert.equal(h.dirty(),true,key);}
 const h=harness();h.context.document.querySelector=()=>({});assert.equal(h.dirty(),true);h.context.document.querySelector=()=>null;h.context.document.activeElement.matches=()=>true;assert.equal(h.dirty(),true);
});
test('explicit update cancellation preserves draft and acceptance reloads once',()=>{
 const h=harness({coinGeckoKey:''},{coinGeckoKey:'SYNTHETIC'});h.notice();h.listeners[0]();assert.equal(h.context.reloads,0);assert.equal(h.elements.coinGeckoKey.value,'SYNTHETIC');h.context.confirm=()=>true;h.listeners[0]();assert.equal(h.context.reloads,1);
});
test('busy explicit updates never reach discard confirmation or reload',()=>{
 const h=harness({coinGeckoKey:''},{coinGeckoKey:'SYNTHETIC'});h.notice();h.context.busy=true;h.context.confirm=()=>{throw Error('must not ask');};h.listeners[0]();assert.equal(h.context.reloads,0);
});
