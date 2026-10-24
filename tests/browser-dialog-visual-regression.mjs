import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {PNG} from 'pngjs';
const refs=JSON.parse(readFileSync('tests/dialog-visual-pixel-baselines.json','utf8')).images;
const names=Object.keys(refs).sort();
const actual=readdirSync('artifacts/dialog-visual').filter(x=>x.endsWith('.png')).sort();
assert.deepEqual(actual,names,'Visual cases must match reference set');
assert.equal(names.length,20);
mkdirSync('artifacts/dialog-visual-diff',{recursive:true});
const failures=[];
for(const name of names){
 const png=PNG.sync.read(readFileSync('artifacts/dialog-visual/'+name)),ref=refs[name];
 if(png.width!==ref.w||png.height!==ref.h){failures.push(name+' dimensions');continue;}
 const samples=inflateSync(Buffer.from(ref.samples,'base64'));assert.equal(samples.length,1152);
 let changed=0;
 for(let row=0;row<24;row++)for(let col=0;col<24;col++){
  const x=Math.round((col+.5)*png.width/24-.5),y=Math.round((row+.5)*png.height/24-.5);
  const ix=(y*png.width+x)*4,base=(row*24+col)*2;
  const now=((png.data[ix]>>3)<<11)|((png.data[ix+1]>>2)<<5)|(png.data[ix+2]>>3);
  const old=samples[base]|(samples[base+1]<<8);
  const delta=Math.max(Math.abs(((now>>11)&31)-((old>>11)&31))*255/31,
   Math.abs(((now>>5)&63)-((old>>5)&63))*255/63,Math.abs((now&31)-(old&31))*255/31);
  if(delta>42)changed++;
 }
 if(changed>20)failures.push(name+': '+changed+'/576 sampled pixels differ');
}
assert.deepEqual(failures,[],'Spatial pixel regression detected changed dialogs');
console.log('DIALOG VISUAL PIXEL CHECK: 20 baseline screenshots x 576 spatial pixel samples PASS');
