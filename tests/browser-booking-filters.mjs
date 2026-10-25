import {legacyPage} from './legacy-browser-fixture.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await legacyPage(browser,{viewport:{width:390,height:850}});
try{
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#mobileNav [data-page="bookings"]').click();
 assert.equal(await page.locator('#bookingsPage #addBooking').count(),1);
 assert.equal(await page.locator('#bookingsPage #openCSVImport').count(),1);
 assert.equal(await page.locator('#bookingsPage .booking-onboarding button').count(),0);
 assert.equal(await page.locator('#bookingsPage .body-copy').count(),0);
 assert.match(await page.locator('#bookingList').innerText(),/Noch keine Buchungen erfasst/);
 await page.evaluate(async()=>{
  const {blankModel,createProvider,createAccount,createPosition,persist}=await import('/src/model.js');
  const m=blankModel(),p=createProvider({name:'Synthetic Bank'});m.providers.push(p);
  const a=createAccount({name:'Depot',providerId:p.id},m);m.accounts.push(a);
  const position=createPosition({providerId:p.id,accountId:a.id,name:'Synthetic Equity',kind:'stock',symbol:'SYN',quantity:10,price:2},m);m.positions.push(position);
  m.bookings=[
   {id:'one',positionId:position.id,positionName:position.name,type:'buy',date:'2026-10-20',quantity:5,amountEUR:10,notes:'Brokerausführung'},
   {id:'two',positionId:position.id,positionName:position.name,type:'sell',date:'2026-10-19',quantity:2,amountEUR:4,notes:'Verkauf'}
  ];
  persist(m);
 });
 await page.reload();await page.locator('#mobileNav [data-page="bookings"]').click();
 assert.equal(await page.locator('#bookingList .history-row').count(),2);
 await page.locator('#bookingFilterType').selectOption('buy');
 assert.equal(await page.locator('#bookingList .history-row').count(),1);
 assert.match(await page.locator('#bookingList').innerText(),/Brokerausführung/);
 await page.locator('#bookingSearch').fill('nomatch');
 assert.match(await page.locator('#bookingList').innerText(),/Keine Buchungen/);
 await page.locator('#bookingFilterType').selectOption('');
 await page.locator('#bookingSearch').fill('');
 assert.equal(await page.locator('#bookingList .history-row').count(),2);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('foliolab-open-v1')).bookings.length),2);
 console.log('BOOKING FILTERS: type and full text with zero portfolio writes PASS');
}finally{await browser.close();}
