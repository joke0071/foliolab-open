/**
 * Both EODHD API hosts are documented by the provider. A transport failure
 * (CORS/network/timeout) may trigger one alternate-host attempt. HTTP errors,
 * entitlement problems, and malformed responses must NOT trigger retries.
 * Never proxy a key through an untrusted origin or print URLs containing it.
 */
import {requestJSON} from './request-cache.js';
const isTransportFailure=error=>/Failed to fetch|NetworkError|Load failed|Zeitüberschreitung beim Abruf|Netzwerk-\/CORS-Fehler/i.test(String(error?.message||error));
export async function requestEodhdJSON(url,options={}){
 const primary=new URL(url);
 if(primary.protocol!=='https:'||primary.hostname!=='eodhd.com'||primary.port||!primary.pathname.startsWith('/api/'))
  throw Error('Unzulässiger EODHD-Endpunkt.');
 try{return await requestJSON(primary.toString(),options);}
 catch(error){
  if(!isTransportFailure(error))throw error;
  const fallback=new URL(primary);
  fallback.hostname='eodhistoricaldata.com';
  try{return await requestJSON(fallback.toString(),options);}
  catch(secondError){
   if(!isTransportFailure(secondError))throw secondError;
   throw Error('EODHD im Browser nicht erreichbar (Netzwerk/CORS). Beide offiziellen API-Server geprüft; Internetverbindung oder Browser-Sperre prüfen.');
  }
 }
}
