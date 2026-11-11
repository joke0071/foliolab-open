import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Execute the actual router with a small DOM boundary. Real rendering and
// keyboard behaviour are additionally checked by navigationFocusBrowserContract.
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const router=source.slice(source.indexOf('function go('),source.indexOf('\nfunction initNav('));
function fixture({origin='page',initial='dashboard',removed=false}={}){
 let active,focusCalls=0;
 const pages=['dashboard','history','positions','bookings','more'].map(id=>({id:id+'Page',active:id===initial,classList:{toggle(_,on){pages.find(p=>p.classList===this).active=on;}}}));
 const originPage=pages.find(p=>p.id===initial+'Page');
 const button={isConnected:true,closest:selector=>selector==='.page'&&origin==='page'?originPage:null};active=button;
 const nodes={pageTitle:{textContent:'',tabIndex:0,focus(){active=this;focusCalls++;}},pageDescription:{},pageKicker:{}};
 const document={get activeElement(){return active;},querySelectorAll:selector=>selector==='.page'?pages:[]};
 const context={document,$:id=>nodes[id],PAGES:pages.map(p=>[p.id.replace('Page',''),'Title','','Kicker']),PAGE_DESCRIPTIONS:{},page:initial,qualityReviewOpen:false,referenceSelecting:false,selectedReferenceIds:[],history:{replaceState(){}},location:{pathname:'/'},window:{scrollTo(){}},render(){if(removed){button.isConnected=false;active=null;}}};
 runInNewContext(router+';this.navigate=go;',context);
 return {navigate:context.navigate,heading:nodes.pageTitle,get active(){return active;},button,get focusCalls(){return focusCalls;}};
}
test('leaving a page through its own action puts keyboard focus at the new heading',()=>{
 for(const removed of [false,true]){const f=fixture({removed});f.navigate('history');assert.equal(f.active,f.heading);assert.equal(f.heading.tabIndex,-1);assert.equal(f.focusCalls,1);}
});
test('persistent navigation keeps its focused control; same-page rendering does not steal focus',()=>{
 for(const args of [{origin:'navigation'},{initial:'history'}]){const f=fixture(args);f.navigate('history');assert.equal(f.active,f.button);assert.equal(f.focusCalls,0);}
});
test('a page-local action to an invalid route uses the safe dashboard destination and heading',()=>{
 const f=fixture({initial:'history'});f.navigate('invalid');assert.equal(f.active,f.heading);assert.equal(f.heading.textContent,'Title');
});
