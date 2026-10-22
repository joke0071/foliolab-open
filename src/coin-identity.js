// Identity normalization is deliberately explicit, not a ticker-based guess.
// Verified native Sonic (S) CoinGecko ID: sonic-3 (2026-10).
export const COIN_ID_MIGRATION='2026-10-sonic-v1';
export function normalizeLegacyCoinId({kind,coinId,name,symbol,coinIdMigration}={}){
 const id=String(coinId??'').trim().toLowerCase();
 if(kind!=='crypto'||id!=='sonic')return {id,migration:coinIdMigration||null};
 const isNative=String(symbol||'').trim().toUpperCase()==='S' &&
  /^(sonic|sonic \(s\)|sonic network)$/i.test(String(name||'').trim());
 return isNative?{id:'sonic-3',migration:COIN_ID_MIGRATION}:{id,migration:coinIdMigration||null};
}
