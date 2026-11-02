/* Runs independently of the module graph and IndexedDB. No storage mutations. */
(()=>{
 const startup=document.getElementById('appStartup'),text=document.getElementById('appStartupText'),help=document.getElementById('appStartupHelp');
 let ready=false;
 const fail=message=>{
  if(ready)return;
  startup.classList.add('startup-delayed');
  text.textContent=message;help.hidden=false;
 };
 const timeout=setTimeout(()=>fail('Der Start dauert ungewöhnlich lange. Der lokale Speicher ist noch nicht bereit.'),12000);
 window.addEventListener('error',event=>{
  if(event.target?.tagName==='SCRIPT'||event instanceof ErrorEvent)fail('FolioLab konnte nicht vollständig gestartet werden.');
 },true);
 window.addEventListener('unhandledrejection',()=>fail('FolioLab konnte nicht vollständig gestartet werden.'));
 window.addEventListener('foliolab:ready',()=>{
  ready=true;clearTimeout(timeout);startup.hidden=true;
  document.querySelector('.layout').inert=false;
  performance.mark('foliolab-interactive');
 },{once:true});
})();
