import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const directory = new URL('.', import.meta.url);
const source = await readFile(new URL('flask-conical.source.svg', directory));
const license = await readFile(new URL('LICENSE-Lucide.txt', directory));
const output = name => new URL(name, directory);
const require = createRequire(import.meta.url);
const lookup = {paths: [resolve(process.argv[2] ?? '.')]};
const {chromium} = require(require.resolve('playwright', lookup));
const {PNG} = require(require.resolve('pngjs', lookup));
const hash = value => createHash('sha256').update(value).digest('hex');
const paths = [...source.toString().matchAll(/<path d="[^"]+" \/>/g)].map(match=>match[0]);
assert.equal(paths.length, 3);
const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
  '  <rect width="64" height="64" rx="17" fill="#214d38"/>',
  '  <g transform="translate(9.2 8) scale(1.9)" fill="none" stroke="#f0f9f2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
  ...paths.map(path=>'    '+path),
  '  </g>',
  '</svg>',
  '',
].join('\n');
const generate = process.argv.includes('--write');
async function verify(name, bytes) {
  const url = output(name);
  if (generate) await writeFile(url, bytes);
  const stored = await readFile(url);
  assert.ok(stored.equals(bytes), name+' is not reproducible');
}
await verify('flask.svg', Buffer.from(svg));
const browser = await chromium.launch({args:['--no-sandbox']});
assert.equal(browser.version(), '141.0.7390.37');
try {
  const records = [];
  for (const {size, maskable} of [{size:192,maskable:false},{size:512,maskable:false},{size:512,maskable:true}]) {
    const name = maskable?'flask-maskable-512.png':`flask-${size}.png`;
    const p = await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    const drawingSize = maskable?size*0.7:size;
    const offset = (size-drawingSize)/2;
    const background = maskable?'#214d38':'transparent';
    const url = 'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
    try {
      await p.setContent(`<style>html,body{margin:0;background:${background}}</style><img src="${url}" style="position:absolute;left:${offset}px;top:${offset}px;width:${drawingSize}px;height:${drawingSize}px">`);
      await p.locator('img').evaluate(image=>image.decode());
      const raster = await p.screenshot({omitBackground:!maskable});
      await verify(name, raster);
      const pixels = PNG.sync.read(raster);
      assert.equal(pixels.width,size);
      assert.equal(pixels.height,size);
      let maxForegroundRadius=0;
      if (maskable) {
        for (let y=0;y<size;y++) {
          for (let x=0;x<size;x++) {
            const i=(y*size+x)*4;
            const [r,g,b,a]=pixels.data.subarray(i,i+4);
            assert.equal(a,255);
            // Compositing equal colors can differ from the fill by one channel value.
            const pixelDifference = Math.max(Math.abs(r-33),Math.abs(g-77),Math.abs(b-56));
            if (pixelDifference>1) maxForegroundRadius=Math.max(maxForegroundRadius,Math.hypot(x-size/2+0.5,y-size/2+0.5));
          }
        }
        assert.ok(maxForegroundRadius>0&&maxForegroundRadius<size*0.40);
      } else assert.equal(pixels.data[3],0);
      records.push({name,size,maskable,maxForegroundRadius,sha256:hash(raster)});
    } finally { await p.close(); }
  }
  console.log(JSON.stringify({
    version:'0.468.0',
    upstreamCommit:'f12b0de177fbc2a6795e99be065887e72b237123',
    browser:browser.version(),
    originalSvgSHA256:hash(source),
    licenseSHA256:hash(license),
    derivedSvgSHA256:hash(svg),
    files:records,
  },null,2));
} finally { await browser.close(); }
