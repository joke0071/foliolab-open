// Visual state only: never starts, retries or commits an operation.
const template="<svg class=\"portfolio-loader\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"none\" stroke=\"#e0e9df\" stroke-width=\"9\"/><g class=\"portfolio-loader-orbit\" fill=\"none\" stroke-width=\"9\"><circle cx=\"32\" cy=\"32\" r=\"22\" pathLength=\"100\" stroke=\"#327f52\" stroke-dasharray=\"46 54\"/><circle cx=\"32\" cy=\"32\" r=\"22\" pathLength=\"100\" stroke=\"#9bb98b\" stroke-dasharray=\"27 73\" stroke-dashoffset=\"-49\"/><circle cx=\"32\" cy=\"32\" r=\"22\" pathLength=\"100\" stroke=\"#d5b66b\" stroke-dasharray=\"18 82\" stroke-dashoffset=\"-79\"/></g></svg>";
export function setLoading(target,active){
 if(!target)return;
 if(active&&!target.hasAttribute('role'))target.setAttribute('role','status');
 target.classList.toggle('lab-loading',Boolean(active));
 const previous=target.querySelector(':scope > .portfolio-loader');
 if(!active){previous?.remove();return;}
 if(previous)return;
 const holder=document.createElement('span');
 holder.innerHTML=template;
 target.prepend(holder.firstElementChild);
}
