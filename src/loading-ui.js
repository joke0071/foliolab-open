// Visual state only: never starts, retries or commits an operation.
export function setLoading(target,active){
 if(!target)return;
 if(active&&!target.hasAttribute('role'))target.setAttribute('role','status');
 target.classList.toggle('lab-loading',Boolean(active));
 const previous=target.querySelector(':scope > .portfolio-loader');
 if(!active){previous?.remove();return;}
 if(previous)return;
 const graphic=document.querySelector('#appStartup .portfolio-loader');
 if(graphic)target.prepend(graphic.cloneNode(true));
}
