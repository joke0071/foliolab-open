// Visual state only: never starts, retries or commits an operation.
let sequence=0;
const template="<svg class=\"lab-flask\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"17\" fill=\"#214d38\"/><defs><clipPath id=\"startup-liquid-clip\"><path d=\"M27 10v16c0 4-2.1 7.2-5.5 12.5L18 44c-6.5 10 3 13 14 13s20.5-3 14-13l-3.5-5.5C39.1 33.2 37 30 37 26V10\"/></clipPath></defs><path class=\"lab-liquid\" d=\"M12 45c9-6 16 8 28 3 5-2 8-5 12-4v18H12Z\" fill=\"#9fd0ac\" opacity=\".46\" clip-path=\"url(#startup-liquid-clip)\"/><g clip-path=\"url(#startup-liquid-clip)\" fill=\"#c6ecd0\"><circle class=\"lab-bubble\" cx=\"25\" cy=\"49\" r=\"1.5\"/><circle class=\"lab-bubble\" cx=\"33\" cy=\"51\" r=\"1.2\"/><circle class=\"lab-bubble\" cx=\"39\" cy=\"48\" r=\"1\"/></g><g fill=\"none\" stroke=\"#f0f9f2\" stroke-width=\"3.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M24 10h16\"/><path d=\"M27 10v16c0 4-2.1 7.2-5.5 12.5L18 44c-6.5 10 3 13 14 13s20.5-3 14-13l-3.5-5.5C39.1 33.2 37 30 37 26V10\"/><path d=\"m20 42 8-6 6 4 18-12m-8 0h8v8\"/></g></svg>";
export function setLoading(target,active){
 if(!target)return;
 if(active&&!target.hasAttribute('role'))target.setAttribute('role','status');
 target.classList.toggle('lab-loading',Boolean(active));
 const previous=target.querySelector(':scope > .lab-flask');
 if(!active){previous?.remove();return;}
 if(previous)return;
 const holder=document.createElement('span');
 holder.innerHTML=template.replaceAll('startup-liquid-clip','inline-liquid-'+(++sequence));
 target.prepend(holder.firstElementChild);
}
