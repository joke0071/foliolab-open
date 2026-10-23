import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});
const first=await context.newPage(),second=await context.newPage();
try{
 await Promise.all([first.goto('http://127.0.0.1:4173/'),second.goto('http://127.0.0.1:4173/')]);
 const more=page=>page.locator('#mobileNav [data-page="more"]');
 await more(first).click();
 await more(second).click();
 await first.locator('#addProvider').click();
 await first.locator('#editorForm [name="name"]').fill('Provider Tab A');
 await first.locator('#saveDialog').click();
 await second.locator('#notice').waitFor({state:'visible'});
 assert.match(await second.locator('#notice').innerText(),/anderen Tab geändert/);
 assert.equal(await second.locator('#notice').getAttribute('role'),'alert');
 await second.locator('#addProvider').click();
 await second.locator('#editorForm [name="name"]').fill('Provider Tab B');
 await second.locator('#saveDialog').click();
 assert.match(await second.locator('#toast').innerText(),/Änderung nicht gespeichert/);
 let recorded=await second.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.deepEqual(recorded.providers.map(x=>x.name),['Provider Tab A'],'Stale tab must never overwrite another tab');
 assert.match(await second.locator('#notice').innerText(),/neu laden/);
 // Repeating the write without reloading must still fail (stale form data must not leak).
 await second.locator('#saveDialog').click();
 recorded=await first.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.deepEqual(recorded.providers.map(x=>x.name),['Provider Tab A']);
 await second.reload();
 await more(second).click();
 await second.locator('#addProvider').click();
 await second.locator('#editorForm [name="name"]').fill('Provider Tab B');
 await second.locator('#saveDialog').click();
 recorded=await first.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')));
 assert.deepEqual(recorded.providers.map(x=>x.name).sort(),['Provider Tab A','Provider Tab B']);
 await first.locator('#notice').waitFor({state:'visible'});
 assert.match(await first.locator('#notice').innerText(),/anderen Tab geändert/);
 // Deleting data in one tab must be detected in the other, not silently revived.
 first.on('dialog',d=>d.accept());
 await first.reload();
 await more(first).click();
 await first.locator('#deleteAll').click();
 await second.locator('#notice').waitFor({state:'visible'});
 assert.equal(await second.evaluate(()=>localStorage.getItem('foliolab-open-v1')),null);
 console.log('MULTI-TAB-INTEGRITY: conflict warning, blocked stale writes, recovery by reload, deletion alert PASS');
}finally{await context.close();await browser.close();}
