export async function manageList(page,category){
 const selector={positions:'#positionListHead [data-action="select-positions"]',bookings:'#bookingListHead [data-booking-manage="select"]',references:'#manageReferences[aria-pressed="false"]'}[category];
 if(!selector)throw Error('Unknown management category');
 const button=page.locator(selector);if(await button.count())await button.click();
}
