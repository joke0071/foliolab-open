import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/startup.js',import.meta.url),'utf8');
function startup(){
 const classes=new Set(),listeners=new Map(),timers=new Map();let next=0;
 const elements={appStartup:{classList:{add:c=>classes.add(c)}},appStartupText:{textContent:''},appStartupHelp:{hidden:true}};
 class ErrorEvent{}
 const context={document:{getElementById:id=>elements[id]},window:{addEventListener:(name,fn)=>listeners.set(name,fn)},setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),ErrorEvent};
 vm.runInNewContext(source,context);
 return {classes,elements,timeout:()=>{for(const fn of [...timers.values()])fn();},emit:(name,event={})=>listeners.get(name)?.(event),ErrorEvent};
}
test('delayed start exposes recovery while retaining animation and the single eventual ready path',()=>{
 const s=startup();s.timeout();assert.ok(s.classes.has('startup-delayed'));assert.ok(!s.classes.has('startup-failed'));assert.equal(s.elements.appStartupHelp.hidden,false);
 s.emit('foliolab:ready');const text=s.elements.appStartupText.textContent;s.emit('unhandledrejection');assert.equal(s.elements.appStartupText.textContent,text);assert.ok(!s.classes.has('startup-failed'));
});
test('actual module error remains the failure reason after the watchdog deadline',()=>{
 const s=startup();s.emit('error',{target:{tagName:'SCRIPT'}});const text=s.elements.appStartupText.textContent;assert.match(text,/nicht vollständig/);assert.ok(s.classes.has('startup-failed'));s.timeout();assert.equal(s.elements.appStartupText.textContent,text);
});
test('an actual runtime failure after a delay stops the loader and retains recovery access',()=>{
 const s=startup();s.timeout();s.emit('error',new s.ErrorEvent());assert.ok(s.classes.has('startup-failed'));assert.equal(s.elements.appStartupHelp.hidden,false);assert.match(s.elements.appStartupText.textContent,/nicht vollständig/);
});
test('unhandled rejection is terminal for the visual watchdog; unrelated resource errors are not',()=>{
 const s=startup();s.emit('error',{target:{tagName:'IMG'}});assert.ok(!s.classes.has('startup-failed'));s.emit('unhandledrejection');assert.ok(s.classes.has('startup-failed'));
});
