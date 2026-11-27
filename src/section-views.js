// Section views keep their live controls in the owning tab, including unsaved form input.
export function createSectionViews({back,title,description}){
 let current=null;
 const obscured=[],containers=[];
 const entries=[...document.querySelectorAll('details[data-view-title]')];
 for(const entry of entries)entry.querySelector(':scope>summary').setAttribute('role','link');
 const resolve=(page,id)=>entries.find(entry=>entry.id===id&&entry.closest('.page').id===page+'Page');
 function show(next,parentTitle,parentDescription){
  if(current)current.open=false;
  current?.classList.remove('section-current');
  for(const el of obscured.splice(0))el.classList.remove('section-obscured');
  for(const el of containers.splice(0))el.classList.remove('section-container');
  current=next||null;
  title.textContent=current?.dataset.viewTitle||parentTitle;
  description.textContent=parentDescription;
  description.hidden=Boolean(current);
  back.hidden=!current;
  if(!current)return;
  const backLabels={historyPage:'Zurück zum Verlauf',bookingsPage:'Zurück zu den Buchungen',morePage:'Zurück zu „Mehr“'};
  back.textContent=backLabels[current.closest('.page').id];
  current.open=true;
  current.classList.add('section-current');
  for(let child=current;!child.classList.contains('page');child=child.parentElement){
   const parent=child.parentElement;
   for(const sibling of parent.children){
    if(sibling===child||sibling.classList.contains('portfolio-unavailable-message'))continue;
    sibling.classList.add('section-obscured');obscured.push(sibling);
   }
   if(!parent.classList.contains('page')){parent.classList.add('section-container');containers.push(parent);}
  }
 }
 return {resolve,show,get current(){return current;}};
}
