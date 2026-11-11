/** Device-local display preference, independent of portfolio data and revisions. */
export const INSTALL_HINT_KEY='foliolab-open-install-hint-dismissed-v1';
export function createInstallHintPreference(sources=[()=>globalThis.localStorage,()=>globalThis.sessionStorage]){
 let dismissed=false;
 for(const source of sources){try{if(source()?.getItem(INSTALL_HINT_KEY)==='1')dismissed=true;}catch{}}
 return {
  get dismissed(){return dismissed;},
  dismiss(){
   dismissed=true;
   // Remember in memory before either storage write can fail. Session storage
   // also preserves dismissal over reload when persistent storage is blocked.
   for(const source of sources){try{source()?.setItem(INSTALL_HINT_KEY,'1');}catch{}}
  }
 };
}
