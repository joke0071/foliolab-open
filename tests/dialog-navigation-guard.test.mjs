import test from 'node:test';
import assert from 'node:assert/strict';
import {createDialogDiscardGuard} from '../src/dialog-discard.js';

test('navigation protection follows the existing dirty predicate and is absent on clean/closed dialogs',async()=>{
 const previous={window:globalThis.window,MutationObserver:globalThis.MutationObserver};
 const listeners=new Map();let observed,dirty=false,busy=false,consent=false,closed=0;
 const win=new EventTarget();
 win.confirm=()=>consent;
 const add=win.addEventListener.bind(win),remove=win.removeEventListener.bind(win);
 win.addEventListener=(name,handler)=>{if(name==='beforeunload')listeners.set(handler,true);add(name,handler);};
 win.removeEventListener=(name,handler)=>{if(name==='beforeunload')listeners.delete(handler);remove(name,handler);};
 globalThis.window=win;globalThis.MutationObserver=class{constructor(callback){observed=callback;}observe(){}};
 class Dialog extends EventTarget{open=false;contains(target){return target===this;}close(){this.open=false;this.dispatchEvent(new Event('close'));}}
 const dialog=new Dialog();
 const fire=()=>{const event=new Event('beforeunload',{cancelable:true});Object.defineProperty(event,'returnValue',{value:'',writable:true});win.dispatchEvent(event);return event.defaultPrevented;};
 const sync=async()=>{observed();await Promise.resolve();};
 try{
  const guard=createDialogDiscardGuard(dialog,{isDirty:()=>dirty,isBusy:()=>busy,onClose:()=>closed++});
  dialog.open=true;await sync();assert.equal(listeners.size,0);assert.equal(fire(),false);
  dirty=true;const input=new Event('input');Object.defineProperty(input,'target',{value:dialog});win.dispatchEvent(input);
  assert.equal(listeners.size,1);assert.equal(fire(),true);
  assert.equal(guard.requestClose(),false);assert.equal(dialog.open,true);assert.equal(listeners.size,1);
  busy=true;consent=true;assert.equal(guard.requestClose(),false);assert.equal(dialog.open,true);
  busy=false;assert.equal(guard.requestClose(),true);assert.equal(closed,1);assert.equal(listeners.size,0);assert.equal(fire(),false);
  dialog.open=true;dirty=true;await sync();assert.equal(listeners.size,1);
  dirty=false;assert.equal(fire(),false,'fresh predicate prevents a stale listener from warning after save');
  dialog.close();assert.equal(listeners.size,0);
  dialog.open=true;dirty=true;await sync();assert.equal(listeners.size,1);
  assert.equal(guard.requestClose({force:true}),true);assert.equal(listeners.size,0);
  dialog.open=true;dirty=false;await sync();dirty=true;
  const click=new Event('click');Object.defineProperty(click,'target',{value:dialog});win.dispatchEvent(click);
  assert.equal(listeners.size,1,'preset button edits also activate the native guard');
  dialog.close();assert.equal(listeners.size,0);
 }finally{globalThis.window=previous.window;globalThis.MutationObserver=previous.MutationObserver;}
});
