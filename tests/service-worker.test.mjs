import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

// The cache-first PWA can serve old modules indefinitely if a new import is
// omitted from the installation assets or the shell version is not bumped.
test('service worker precaches every first-party JS module for offline startup',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/const CACHE='foliolab-open-v\d+';/);
 const cached=new Set([...sw.matchAll(/'\.\/src\/([^']+\.js)'/g)].map(match=>match[1]));
 const modules=readdirSync(new URL('../src/',import.meta.url)).filter(name=>name.endsWith('.js'));
 for(const name of modules)assert.ok(cached.has(name),'Module omitted from offline cache: '+name);
 assert.equal(cached.size,modules.length,'Cache includes an unknown or duplicate JS module');
 for(const required of ['index.html','styles.css','manifest.webmanifest']){
  assert.ok(sw.includes("'./"+required+"'"),'Missing offline asset '+required);
 }
});
