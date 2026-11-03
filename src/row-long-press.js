// Touch/pen long press that only opens the existing management mode for one row.
// It never mutates data itself; the caller decides what the press selects.
const INTERACTIVE='a,button,input,select,textarea,summary,label,[role="button"],[contenteditable="true"]';
export const LONG_PRESS_MS=500;
export const LONG_PRESS_SLOP=10;
export const GHOST_CLICK_MS=700;
// Upper bound while the finger is still down; a lost release event must never swallow later clicks.
export const HOLD_GUARD_MS=3000;

export function attachRowLongPress(container,{rowSelector,idOf,enabled,onLongPress,delay=LONG_PRESS_MS,slop=LONG_PRESS_SLOP,now=()=>performance.now()}){
 let state=null,suppressUntil=0,pressedPointer=null;
 const pointers=new Set();
 const clear=()=>{if(state){clearTimeout(state.timer);state=null;}};
 container.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||event.button>0)return;
  pointers.add(event.pointerId);
  if(pointers.size>1){clear();return;}
  if(!enabled()||event.target.closest(INTERACTIVE))return;
  const row=event.target.closest(rowSelector);if(!row||!container.contains(row))return;
  const id=idOf(row);if(!id)return;
  clear();
  state={row,id,x:event.clientX,y:event.clientY,pointerId:event.pointerId,timer:setTimeout(()=>{
   const current=state;state=null;
   if(!current||!current.row.isConnected||!enabled())return;
   suppressUntil=now()+HOLD_GUARD_MS;pressedPointer=current.pointerId;
   onLongPress(current.id,current.row);
  },delay)};
 });
 container.addEventListener('pointermove',event=>{
  if(!state||event.pointerId!==state.pointerId)return;
  if(Math.hypot(event.clientX-state.x,event.clientY-state.y)>slop||!state.row.contains(document.elementFromPoint(event.clientX,event.clientY)))clear();
 });
 const release=event=>{
  pointers.delete(event.pointerId);
  if(state&&event.pointerId===state.pointerId)clear();
  if(event.pointerId===pressedPointer){pressedPointer=null;suppressUntil=now()+GHOST_CLICK_MS;}
 };
 // The pressed row is re-rendered, so release events must be observed on the document.
 document.addEventListener('pointerup',release,true);
 document.addEventListener('pointercancel',release,true);
 container.addEventListener('pointerleave',event=>{if(state&&event.pointerId===state.pointerId)clear();});
 // Any scroll in the page (capture) means the finger is panning, not pressing.
 window.addEventListener('scroll',clear,{capture:true,passive:true});
 container.addEventListener('contextmenu',event=>{if(state||now()<suppressUntil)event.preventDefault();});
 // The browser may still dispatch the click that ends the press; swallow it once.
 const swallow=event=>{
  if(now()>=suppressUntil)return;
  suppressUntil=0;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 };
 document.addEventListener('click',swallow,true);
 return {cancel:clear,destroy(){clear();document.removeEventListener('pointerup',release,true);document.removeEventListener('pointercancel',release,true);document.removeEventListener('click',swallow,true);window.removeEventListener('scroll',clear,{capture:true});}};
}
