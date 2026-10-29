/** Presentation only. Never use these groups to decide whether an action is safe. */
const categories=[
 [/Startstichtag|Renditeerfassung/,'geschützte Startstichtage'],
 [/Originalquelle|Aufschlüsselung|Wiederimport sind/,'geschützte Originalwerte'],
 [/Importierte oder unbekannte Herkunft|Herkunft geschützt/,'geschützte Herkunft'],
 [/Wallet|Blockchain/,'Wallet-Verknüpfungen'],
 [/Verknüpfter Vorgang|Gegenbuchung|Transfer|DeFi|Wirtschaftlich.*Position/,'verknüpfte Vorgänge'],
 [/Journal|Referenz|Revision|Identität|Nachweis|Zuordnung/,'ungeklärte Abhängigkeiten'],
 [/Kontrollpunkt|Stichtag/,'abhängige Kontrollpunkte'],
 [/Gebühren|Steuer|Gegenkonto/,'zusätzliche Kosten oder Gegenkonten'],
 [/Mengen|EUR-Beträge|Geldbestand/,'ungeklärte Bestandsnachweise'],
 [/Status|Kapitalfluss/,'ungeklärte Geldflüsse'],
 [/Wirtschaftliche Änderung/,'eingeschränkte Änderungsmöglichkeiten'],
 [/Automatisch verwaltete/,'automatisch verwaltete Positionen']
];
export function groupBlockedReasons(entries){
 const groups=new Map(),blocked=new Set(),labels=new Map();
 for(const {id,reasons,label} of entries){
  labels.set(id,label||id);
  for(const reason of new Set(reasons.filter(r=>typeof r==='string'&&r.trim()))){
   blocked.add(id);
   const label=categories.find(([pattern])=>pattern.test(reason))?.[1]||'weitere Abhängigkeiten';
   if(!groups.has(label))groups.set(label,{label,ids:new Set(),reasons:new Map()});
   const group=groups.get(label);group.ids.add(id);
   if(!group.reasons.has(reason))group.reasons.set(reason,new Set());
   group.reasons.get(reason).add(id);
  }
 }
 return {blockedCount:blocked.size,categories:[...groups.values()].map(g=>({label:g.label,count:g.ids.size,
  reasons:[...g.reasons].map(([reason,ids])=>({reason,ids:[...ids],labels:[...ids].map(id=>labels.get(id)),count:ids.size}))}))};
}
export function blockedReasonsMarkup(entries,{id,esc,hint='',actionLabel='Löschen'}={}){
 const groups=groupBlockedReasons(entries),list=groups.categories;
 if(!list.length)return '';
 const summary=actionLabel+' gesperrt: '+list.slice(0,2).map(g=>g.count+' '+g.label).join(' · ')+
  (list.length>2?' (+'+(list.length-2)+' Kategorien)':'')+'.'+(hint?' '+hint:'');
 return '<div id="'+esc(id)+'" class="blocked-reasons"><p id="'+esc(id+'Summary')+'" class="small-help blocked-reasons-summary">'+esc(summary)+'</p>'+
  '<details class="performance-details blocked-reasons-details"><summary><span>Details anzeigen</span></summary><div class="performance-details-body">'+
  list.map(g=>'<section><h4>'+esc(g.count+' '+g.label)+'</h4>'+g.reasons.map(r=>
   '<p>'+esc(r.reason)+'</p><details class="blocked-reason-identities"><summary>'+r.count+' betroffene Einträge</summary><p>'+esc(r.labels.map((label,i)=>label===r.ids[i]?label:label+' ['+r.ids[i]+']').join(' · '))+'</p></details>'
  ).join('')+'</section>').join('')+'</div></details></div>';
}
