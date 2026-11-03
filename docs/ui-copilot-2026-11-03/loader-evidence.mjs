// Loader motion evidence: holds app.js so the real boot overlay stays visible, then samples time-shifted frames.
import {chromium} from 'playwright';
import {mkdirSync,renameSync,readdirSync} from 'node:fs';
const tag=process.argv[2],base=process.argv[3];
const out=new URL('./img/',import.meta.url).pathname;mkdirSync(out,{recursive:true});
const reduced=process.argv[4]==='reduced';
const browser=await chromium.launch({args:['--no-sandbox']});
const ctx=await browser.newContext({viewport:{width:390,height:700},serviceWorkers:'block',reducedMotion:reduced?'reduce':'no-preference',recordVideo:reduced?undefined:{dir:'/tmp/loadervideo',size:{width:390,height:700}}});
const p=await ctx.newPage();let release;const hold=new Promise(r=>release=r);
await p.route('**/src/app.js',async r=>{await hold;await r.continue();});
await p.goto(base,{waitUntil:'commit'});await p.waitForSelector('#appStartup .lab-flask',{state:'visible'});
const flask=p.locator('#appStartup .lab-flask');const frames=[];
for(let i=0;i<8;i++){await flask.screenshot({path:`${out}loader-${tag}${reduced?'-reduced':''}-frame${i}.png`});frames.push(i);await p.waitForTimeout(350);}
const anim=await p.evaluate(()=>[...document.querySelectorAll('#appStartup .lab-liquid,#appStartup .lab-bubble')].map(e=>getComputedStyle(e).animationName+' '+getComputedStyle(e).animationDuration));
console.log(JSON.stringify(anim));
release();await p.waitForFunction(()=>document.getElementById('appStartup').hidden);
await ctx.close();await browser.close();
if(!reduced){const f=readdirSync('/tmp/loadervideo')[0];renameSync('/tmp/loadervideo/'+f,`${out}loader-${tag}.webm`);}
