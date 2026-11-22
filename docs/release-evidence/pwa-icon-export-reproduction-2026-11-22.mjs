import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join, resolve} from 'node:path';

const project = resolve(process.argv[2] ?? '.');
const require = createRequire(import.meta.url);
const resolution = {paths: [project]};
const playwrightVersion = require(require.resolve('playwright/package.json', resolution)).version;
assert.equal(playwrightVersion, '1.56.1');
const {chromium} = require(require.resolve('playwright', resolution));
const svg = await readFile(join(project, 'icons/flask.svg'));
const dataUrl = 'data:image/svg+xml;base64,' + svg.toString('base64');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const outputs = [
  {name: 'flask-192.png', size: 192, maskable: false},
  {name: 'flask-512.png', size: 512, maskable: false},
  {name: 'flask-maskable-512.png', size: 512, maskable: true}
];

const browser = await chromium.launch();
try {
  assert.equal(browser.version(), '141.0.7390.37');
  const comparisons = [];
  for (const {name, size, maskable} of outputs) {
    const page = await browser.newPage({viewport: {width: size, height: size}, deviceScaleFactor: 1});
    const artSize = maskable ? size * 0.7 : size;
    const offset = (size - artSize) / 2;
    const background = maskable ? '#214d38' : 'transparent';
    await page.setContent(`<style>html,body{margin:0;background:${background}}</style><img src="${dataUrl}" style="position:absolute;left:${offset}px;top:${offset}px;width:${artSize}px;height:${artSize}px">`);
    await page.locator('img').evaluate(image => image.decode());
    const generated = await page.screenshot({omitBackground: !maskable});
    const published = await readFile(join(project, 'icons', name));
    assert.ok(generated.equals(published), name + ' differs from the repository PNG');
    comparisons.push({name, width: size, height: size, artSize, offset, background,
      bytes: generated.length, sha256: sha256(generated), byteIdentical: true});
    await page.close();
  }
  console.log(JSON.stringify({playwrightVersion, chromiumVersion: browser.version(),
    source: {path: 'icons/flask.svg', sha256: sha256(svg)}, comparisons}, null, 2));
} finally {
  await browser.close();
}
