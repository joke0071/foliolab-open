import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Reuse the existing complete independent HTTP/SHA audit, never a partial/failed
// report. Return the checked bytes themselves so later file changes cannot race it.
export function verifiedFXRelease(reportPath,{root=process.cwd(),sha=process.env.RELEASE_SHA,base}={}){
 const report=JSON.parse(readFileSync(reportPath,'utf8'));
 assert.match(sha||'',/^[a-f0-9]{40}$/);assert.equal(report.sha,sha);assert.equal(report.result,'PASS');
 assert.equal(report.proxyCertificateException,false,'Regular release TLS required');
 assert.equal(report.base,base,'Exact audited production base required');
 const sw=readFileSync(path.join(root,'sw.js'),'utf8');
 const assets=JSON.parse(sw.match(/const ASSETS=(\[[^\n]+\]);/)[1].replaceAll("'",'"'));
 const expected=[...assets,'./sw.js','./LICENSE'];
 assert.equal(new Set(expected).size,expected.length);
 assert.deepEqual(report.assetHashes.map(x=>x.path).sort(),[...expected].sort(),'Every expected published file exactly once');
 assert.equal(report.cache,sw.match(/const CACHE='([^']+)'/)[1]);
 const files=new Map();
 for(const item of report.assetHashes){
  assert.ok(/^\.\/[a-zA-Z0-9_./-]*$/.test(item.path)&&!item.path.includes('..'));
  const bytes=readFileSync(path.join(root,item.path==='./'?'index.html':item.path.slice(2)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,'Audited published bytes '+item.path);
  files.set(new URL(item.path,base).pathname,bytes);
 }
 return {files,sha,cache:report.cache,count:expected.length};
}

export function verifiedFixtureRelease(base){
 const report=process.env.UH03_VERIFIED_RELEASE
  ||(process.env.RELEASE_SHA&&new URL(base).protocol==='https:'?'artifacts/gates/live/report.json':'');
 return report?verifiedFXRelease(report,{base}):null;
}

const fixtureTypes=new Map([
 ['.js','text/javascript'],['.css','text/css'],['.png','image/png'],
 ['.svg','image/svg+xml'],['.woff2','font/woff2'],['.webmanifest','application/manifest+json']
]);
export async function replayVerifiedFixtureAssets(workerBlockedContext,base,published){
 let reused=0;
 if(!published)return ()=>reused;
 const origin=new URL(base).origin,workerPath=new URL('sw.js',base).pathname;
 const contentType=url=>fixtureTypes.get(path.extname(url.pathname));
 await workerBlockedContext.route(url=>url.origin===origin&&!url.search&&url.pathname!==workerPath&&!!contentType(url),async route=>{
  const request=route.request(),url=new URL(request.url()),bytes=published.files.get(url.pathname);
  if(request.method()!=='GET'||request.isNavigationRequest()||request.serviceWorker?.()||!bytes)return route.fallback();
  reused++;
  return route.fulfill({body:bytes,contentType:contentType(url)});
 });
 return ()=>reused;
}
