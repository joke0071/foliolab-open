// Fragments identify both the primary subpage and optional settings within it.
const tabs={
 history:[['historyDiagram','Vermögensverlauf'],['performanceDetails','Rendite & Geldflüsse'],['snapshotManager','Historische Referenzwerte'],['portfolioProjection','Zukunft simulieren']],
 bookings:[['bookingPanel','Buchungen'],['bookingIncomeDetails','Erträge und Abzüge'],['internalTransfers','Interne Transfers']],
 more:[['moreAccounts','Anbieter und Konten'],['moreData','Deine Daten'],['moreSources','Datenquellen und Aktualisierungen']]
};
const byId=id=>document.getElementById(id);
export function createSectionViews({nav,title,description}){
 const entries=[...document.querySelectorAll('details[data-view-title]')];
 const roots=new Map();
 for(const [page,items] of Object.entries(tabs)){
  for(const [id] of items)roots.set(id,page==='more'?byId(id).closest('.panel'):id==='historyDiagram'?byId('historyOverview'):byId(id));
 }
 const obscured=[],containers=[];
 let current=null,navPage='';
 function resolve(page,id){
  if(!id)return null;
  const target=byId(id);
  if(target?.closest('.page')!==byId(page+'Page'))return null;
  return roots.has(id)||entries.includes(target)||id==='historyCoverage'?target:null;
 }
 function show(page,id,parentTitle,parentDescription){
  const items=tabs[page],target=resolve(page,id);
  if(current&&current!==target&&current instanceof HTMLDetailsElement)current.open=false;
  current?.classList.remove('section-current');
  for(const el of obscured.splice(0))el.classList.remove('section-obscured');
  for(const el of containers.splice(0))el.classList.remove('section-container');
  const selected=items?.find(([key])=>roots.get(key)===target||roots.get(key).contains(target))?.[0]||items?.[0][0];
  const detail=entries.includes(target)&&!roots.has(id);
  current=detail?target:selected?roots.get(selected):null;
  const label=items?.find(([key])=>key===selected)?.[1];
  const back=byId('sectionParent');
  back.hidden=!detail;
  if(detail){
   const parent=target.parentElement.closest('details[data-view-title]');
   const parentId=parent?.id||selected;
   back.href='?page='+page+'#'+parentId;
   back.textContent='‹ '+(parent?.dataset.viewTitle||label);
  }
  title.textContent=detail?target.dataset.viewTitle:label||parentTitle;
  title.classList.toggle('visually-hidden',Boolean(items&&!detail));
  description.textContent=parentDescription;
  description.hidden=Boolean(items);
  nav.hidden=!items;
  if(navPage!==page){
   navPage=page;
   nav.replaceChildren(...(items||[]).map(([key,text])=>{
    const link=document.createElement('a');
    link.href='?page='+page+'#'+key;link.dataset.section=key;link.textContent=text;
    return link;
   }));
  }
  for(const link of nav.children){
   if(link.dataset.section!==selected){link.removeAttribute('aria-current');continue;}
   link.setAttribute('aria-current',detail?'location':'page');
   const left=link.offsetLeft-nav.scrollLeft;
   if(left<0||left+link.offsetWidth>nav.clientWidth)nav.scrollLeft+=left-(nav.clientWidth-link.offsetWidth)/2;
  }
  if(!current)return;
  if(current instanceof HTMLDetailsElement){current.open=true;current.classList.add('section-current');}
  for(let child=current;!child.classList.contains('page');child=child.parentElement){
   const parent=child.parentElement;
   for(const sibling of parent.children){
    if(sibling===child||sibling.classList.contains('portfolio-unavailable-message'))continue;
    sibling.classList.add('section-obscured');obscured.push(sibling);
   }
   if(!parent.classList.contains('page')){parent.classList.add('section-container');containers.push(parent);}
  }
  if(target?.id==='historyCoverage')target.open=true;
 }
 return {resolve,show};
}
