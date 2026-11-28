// Run the whole-document scan from a reproducible scroll position. A sticky
// menu can legitimately cover content above the current reading position.
// Keep open dialogs in place and return to the user's original scroll offset.
export async function scanPageAccessibility(scope){
 const offset=scrollY;
 const reset=offset>0&&!document.querySelector('dialog[open]');
 if(reset)scrollTo({top:0,behavior:'instant'});
 try{
  return (await axe.run(scope||document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations;
 }finally{
  if(reset)scrollTo({top:offset,behavior:'instant'});
 }
}
