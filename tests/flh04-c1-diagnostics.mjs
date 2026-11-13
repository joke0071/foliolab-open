// Only bounded synthetic diagnostics. Never serialize error messages, stacks,
// records, keys, credentials, raw portfolio bytes, fingerprints or digests.
import {isDeepStrictEqual} from 'node:util';
const tokens=new Set(['legacy','idb','blocked','VersionError','AbortError','aborted','schema-committed','fulfilled','rejected']);
const errorTypes=new Set(['AssertionError','Error','TypeError','DOMException','AbortError','QuotaExceededError','VersionError']);
const fields=['portfolio','sync','schemaVersion','revision','raw','settings','deleted','updatedAt','syncEnrollmentRequired','lineId','status','localRevision','outcome','version','errorName'];
function minimal(value){
 if(value===undefined)return {type:'undefined'};
 if(value===null)return {type:'null'};
 if(typeof value==='boolean')return value;
 if(Number.isSafeInteger(value)&&value>=0&&value<=1000)return value;
 if(typeof value==='string'&&tokens.has(value))return value;
 return {type:Array.isArray(value)?'array':typeof value};
}
function difference(actual,expected){
 const differing=[];
 if(actual&&expected&&typeof actual==='object'&&typeof expected==='object'){
  for(const field of fields){
   if(Object.hasOwn(actual,field)!==Object.hasOwn(expected,field)||!isDeepStrictEqual(actual[field],expected[field])){
    differing.push(field);
    if(field==='portfolio'&&actual[field]&&expected[field]){
     for(const name of fields.slice(2))if(Object.hasOwn(actual[field],name)!==Object.hasOwn(expected[field],name)||!isDeepStrictEqual(actual[field][name],expected[field][name]))differing.push('portfolio.'+name);
    }
   }
  }
 }
 return differing;
}
export function createC1Diagnostics(group,ids,{path='tests/flh04-version2-candidate-probes.mjs'}={}){
 if(!['tests/flh04-version2-candidate-probes.mjs','tests/flh04-source-lifecycle-probes.mjs'].includes(path))throw new TypeError('Unknown diagnostic source');
 const rows=ids.map(id=>({id:group+'.'+id,status:'NOT_REACHED',assertion:{path,anchor:id}}));
 let active=null,failure=null;
 return {
  start(id){
   const row=rows.find(row=>row.id===group+'.'+id);
   if(active||!row||row.status!=='NOT_REACHED')throw Error('Invalid C1 assertion sequence');
   const stack=new Error().stack??'';
   if(path==='tests/flh04-version2-candidate-probes.mjs'){
    const match=stack.match(/flh04-version2-candidate-probes\.mjs:(\d+):(\d+)/);
    if(match)row.assertion.line=Number(match[1])+1;
   }else{
    const matches=[...stack.matchAll(/flh04-source-lifecycle-probes\.mjs:(\d+):(\d+)/g)];
    if(matches[1])row.assertion.line=Number(matches[1][1]);
   }
   active=row;row.status='RUNNING';
  },
  pass(id){
   if(active?.id!==group+'.'+id)throw Error('Invalid C1 assertion completion');
   active.status='PASS';active=null;
  },
  fail(error){
   const errorType=errorTypes.has(error?.name)?error.name:'Error';
   failure={id:active?.id??group+'.OPERATION',errorType,
    assertion:active?.assertion??{path,anchor:group+'.OPERATION'},
    kind:active?'assertion-or-operand':'operation-between-assertions'};
   if(error?.name==='AssertionError'){
    failure.expected=minimal(error.expected);failure.actual=minimal(error.actual);
    failure.differingFields=difference(error.actual,error.expected);
   }
   if(active){active.status='FAIL';active=null;}
   return failure;
  },
  complete(){if(active||rows.some(row=>row.status!=='PASS'))throw Error('C1 assertions not completed');},
  report(){return rows.map(row=>({...row,assertion:{...row.assertion}}));},
 };
}
