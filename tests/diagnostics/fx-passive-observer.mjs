import {chromium,firefox,webkit} from 'playwright';
import {writeFileSync} from 'node:fs';
const data={requests:[],versions:[]};
for(const [name,type] of Object.entries({chromium,firefox,webkit})){
 const launch=type.launch.bind(type);type.launch=async(...args)=>{const browser=await launch(...args);data.versions.push({name,version:browser.version()});const newContext=browser.newContext.bind(browser);browser.newContext=async(...args)=>{const context=await newContext(...args);context.on('request',r=>data.requests.push({url:r.url(),at:Date.now()}));return context;};return browser;};
}
process.on('exit',()=>writeFileSync(process.env.FX_AGE_OUTPUT_DIR+'/request-observation.json',JSON.stringify(data)));
