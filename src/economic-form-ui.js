/** Shared explanatory UX only. Financial rules remain in defi.js. */
export function economicFormGuidance(role,mode,target='',targetMode='included'){
 const excluded=mode==='excluded';
 const targetRequired=excluded;
 const roleInvalid=mode==='liability'&&role!=='borrowed';
 const targetMissing=excluded&&!target;
 let message='';
 if(roleInvalid)message='Um eine Position als Verbindlichkeit abzuziehen, wähle bei „Wirtschaftliche Funktion“ „Geliehene Assets / Verbindlichkeit“.';
 else if(targetMissing)message='Damit eine Position nicht doppelt zählt, wähle die bereits angerechnete Position unter „Wird repräsentiert durch“.';
 else if(excluded&&targetMode!=='included')message='Achtung: Die verknüpfte Position wird selbst nicht positiv angerechnet. Prüfe, welche Position den Vermögenswert tatsächlich abbildet.';
 else if(excluded)message='Diese Position wird nicht zum Gesamtvermögen addiert. Die gewählte Referenz wird weiterhin berücksichtigt.';
 else if(mode==='liability')message='Dieser Betrag wird vom Gesamtvermögen abgezogen. Die Eingabe wird nicht automatisch mit einem Guthaben verrechnet.';
 else if(target)message='Diese Position bleibt angerechnet. Prüfe bei wirtschaftlich identischen Beständen, ob dadurch eine Doppelzählung entsteht.';
 else if(role!=='standard')message='Die wirtschaftliche Funktion ist dokumentiert. Ob die Position angerechnet wird, bestimmt die Auswahl „In der Vermögenssumme“.';
 return {message,targetRequired,roleInvalid,targetMissing,warning:roleInvalid||targetMissing||(excluded&&targetMode!=='included')};
}
