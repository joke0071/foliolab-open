import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {verifiedFXRelease} from './candidate-verified-fx-release.mjs';
const base='https://foliolab.unperfekt.at/',proof=verifiedFXRelease(process.env.QA_ROOT+'/tests/diagnostics/fx-original-live-report.json',{base});
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{const browser=await launch(...args),newContext=browser.newContext.bind(browser);browser.newContext=async(...args)=>{const c=await newContext(...args),register=c.route.bind(c);c.route=(pattern,handler)=>register(pattern,async route=>{route.continue=async()=>{const u=new URL(route.request().url());assert.equal(u.origin,new URL(base).origin);const body=proof.files.get(u.pathname);assert.ok(body);return route.fulfill({body,contentType:u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':u.pathname.endsWith('.png')?'image/png':u.pathname.endsWith('.svg')?'image/svg+xml':'text/html'});};return handler(route);});return c;};return browser;};
