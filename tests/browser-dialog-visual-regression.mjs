/**
 * Dialog layout pixel regression against reviewed GitHub Actions screenshot references.
 * 16 x 16 spatial RGB565 color samples per image plus exact dimensions.
 * The source images are preserved as a separate immutable Actions artifact.
 * Never regenerate the baseline from the current run (that would hide regressions).
 */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {PNG} from 'pngjs';
const baseline=JSON.parse(readFileSync('tests/dialog-visual-pixel-baselines.json','utf8'));
assert.equal(baseline.grid,16);
const refs=baseline.images;
const names=Object.keys(refs).sort();
const actual=readdirSync('artifacts/dialog-visual').filter(x=>x.endsWith('.png')).sort();
assert.deepEqual(actual,names,'Visual cases must match reference set');
assert.equal(names.length,20,'All twenty dialog visual states must be covered');
mkdirSync('artifacts/dialog-visual-diff',{recursive:true});
const failures=[];
for(const name of names){
 const png=PNG.sync.read(readFileSync('artifacts/dialog-visual/'+name)),ref=refs[name];
 if(png.width!==ref.w||png.height!==ref.h){
  failures.push(name+': dimensions '+png.width+'x'+png.height+' vs '+ref.w+'x'+ref.h);
  continue;
 }
 let samples;
 try{samples=inflateSync(Buffer.from(ref.samples,'base64'));}
 catch(error){throw Error('Corrupt approved screenshot reference '+name+': '+error.message);}
 assert.equal(samples.length,16*16*2,'Reference sample integrity for '+name);
 let changed=0,maximum=0;
 for(let row=0;row<16;row++)for(let col=0;col<16;col++){
  const x=Math.round((col+.5)*png.width/16-.5),y=Math.round((row+.5)*png.height/16-.5);
  const ix=(y*png.width+x)*4,base=(row*16+col)*2;
  const now=((png.data[ix]>>3)<<11)|((png.data[ix+1]>>2)<<5)|(png.data[ix+2]>>3);
  const old=samples[base]|(samples[base+1]<<8);
  const delta=Math.max(Math.abs(((now>>11)&31)-((old>>11)&31))*255/31,
   Math.abs(((now>>5)&63)-((old>>5)&63))*255/63,Math.abs((now&31)-(old&31))*255/31);
  maximum=Math.max(maximum,delta);
  if(delta>42)changed++;
 }
 if(changed>12)failures.push(name+': '+changed+'/256 visual pixels differ (max 12; max RGB channel drift '+maximum.toFixed(0)+')');
}
assert.deepEqual(failures,[],'Spatial RGB pixel regression detected a changed dialog: '+failures.join('; '));
console.log('DIALOG VISUAL PIXEL REGRESSION: 20 approved screenshot references, 256 spatial RGB samples per image, exact dimensions PASS');
