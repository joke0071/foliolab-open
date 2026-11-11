/* Runs independently of the module graph and IndexedDB. No storage mutations. */
(()=>{
 const startup=document.getElementById('appStartup'),text=document.getElementById('appStartupText'),help=document.getElementById('appStartupHelp');
 let ready=false,startupFailed=false;
 const fail=(message,{failed=false}={})=>{
  if(ready||startupFailed)return;
  startup.classList.add('startup-delayed');
  if(failed){startupFailed=true;startup.classList.add('startup-failed');}
  text.textContent=message;help.hidden=false;
 };
 const timeout=setTimeout(()=>fail('Der Start dauert ungewöhnlich lange. Der lokale Speicher ist noch nicht bereit.'),12000);
 window.addEventListener('error',event=>{
  if(event.target?.tagName==='SCRIPT'||event instanceof ErrorEvent)fail('FolioLab konnte nicht vollständig gestartet werden.',{failed:true});
 },true);
 window.addEventListener('unhandledrejection',()=>fail('FolioLab konnte nicht vollständig gestartet werden.',{failed:true}));
 window.addEventListener('foliolab:ready',()=>{
  ready=true;clearTimeout(timeout);
 },{once:true});
})();
