/** Existing canonical-day check shared by readers and journal validation.
 * Validity depends only on the primitive day, never on portfolio or clock.
 * Bound page-local boolean reuse; no financial results or write permissions.
 */
const dateValidity=new Map(),DATE_VALIDITY_LIMIT=16384;
export function validCalendarDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d$/.test(value))return false;
 if(dateValidity.has(value))return dateValidity.get(value);
 const date=new Date(value+'T12:00:00Z');
 const valid=Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
 if(dateValidity.size>=DATE_VALIDITY_LIMIT)dateValidity.clear();
 dateValidity.set(value,valid);
 return valid;
}
