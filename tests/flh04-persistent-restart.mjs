import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

// Only the browser directly launched by this test with its unique temporary profile is eligible.
async function fixtureBrowserPid(context,profile){
 const session=await context.browser().newBrowserCDPSession();
 try{
  const {processInfo}=await session.send('SystemInfo.getProcessInfo');
  const browsers=processInfo.filter(info=>info.type==='browser');
  assert.equal(browsers.length,1);
  const pid=browsers[0].id;
  assert.ok(Number.isSafeInteger(pid)&&pid>1&&pid!==process.pid);
  const args=(await readFile('/proc/'+pid+'/cmdline','utf8')).split('\0');
  assert.ok(args.includes('--user-data-dir='+profile));
  const status=await readFile('/proc/'+pid+'/status','utf8');
  assert.equal(Number(status.match(/^PPid:\s*(\d+)$/m)?.[1]),process.pid);
  return pid;
 }finally{await session.detach();}
}

export async function restartAfterKill(context,profile){
 const browser=context.browser(),pid=await fixtureBrowserPid(context,profile);
 const disconnected=once(browser,'disconnected',{signal:AbortSignal.timeout(15000)});
 process.kill(pid,'SIGKILL');
 await disconnected;
 assert.equal(browser.isConnected(),false);
 const fresh=await chromium.launchPersistentContext(profile);
 try{
  assert.notEqual(await fixtureBrowserPid(fresh,profile),pid);
  return fresh;
 }catch(error){await fresh.close();throw error;}
}
