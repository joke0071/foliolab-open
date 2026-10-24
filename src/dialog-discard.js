// Native <dialog> discard protection shared by all edit flows.
export function createDialogDiscardGuard(dialog,{isDirty,isBusy=()=>false,onClose=()=>{}}){
 const mayClose=()=>!isBusy()&&(!isDirty()||window.confirm('Eingaben verwerfen? Nicht gespeicherte Änderungen gehen verloren.'));
 const requestClose=({force=false}={})=>{
  if(!dialog.open)return false;
  if(!force&&!mayClose())return false;
  dialog.close();
  return true;
 };
 dialog.addEventListener('cancel',event=>{if(!mayClose())event.preventDefault();});
 dialog.addEventListener('close',onClose);
 return {requestClose};
}
