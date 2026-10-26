// Native <dialog> discard protection shared by all edit flows.
export function createDialogDiscardGuard(dialog,{isDirty,isBusy=()=>false,onClose=()=>{}}){
 // Register only while a dirty dialog is open, preserving clean-page bfcache.
 let navigationGuardActive=false;
 const protectNavigation=event=>{
  if(!dialog.open||!isDirty())return;
  event.preventDefault();event.returnValue=true;
 };
 const syncNavigationGuard=()=>{
  const needed=dialog.open&&isDirty();
  if(needed===navigationGuardActive)return;
  navigationGuardActive=needed;
  window[needed?'addEventListener':'removeEventListener']('beforeunload',protectNavigation);
 };
 const scheduleSync=()=>queueMicrotask(syncNavigationGuard);
 // Bubble after each dialog's own dirty-state handlers have run.
 const afterEdit=event=>{if(dialog.contains(event.target))syncNavigationGuard();};
 window.addEventListener('input',afterEdit);window.addEventListener('change',afterEdit);window.addEventListener('click',afterEdit);
 const observer=new MutationObserver(scheduleSync);
 observer.observe(dialog,{attributes:true,attributeFilter:['open'],childList:true,subtree:true});
 const mayClose=()=>!isBusy()&&(!isDirty()||window.confirm('Eingaben verwerfen? Nicht gespeicherte Änderungen gehen verloren.'));
 const requestClose=({force=false}={})=>{
  if(!dialog.open)return false;
  if(!force&&!mayClose())return false;
  dialog.close();syncNavigationGuard();
  return true;
 };
 dialog.addEventListener('cancel',event=>{if(!mayClose())event.preventDefault();});
 dialog.addEventListener('close',()=>{syncNavigationGuard();onClose();});
 return {requestClose};
}
