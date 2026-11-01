/**
 * Small, deliberately curated list of verified EUR Xetra listings.
 * Never infer an exchange from a ticker alone: multiple securities and
 * currencies can share a ticker, and a custody broker is not an exchange.
 * This is a REFERENCE listing, not an asserted execution venue.
 */
const KNOWN=Object.freeze([
 {symbol:'5MVL',label:'iShares MSCI EM Value Factor ETF',kind:'etf',name:/\bishares\b.*\bmsci\b.*\bem\b.*\bvalue\b/i,isin:'IE00BG0SKF03'},
 {symbol:'VWCE',label:'Vanguard FTSE All-World UCITS ETF',kind:'etf',name:/\bvanguard\b.*\bftse\b.*\ball.world\b/i,isin:'IE00BK5BQT80'},
 {symbol:'XDEM',label:'Xtrackers MSCI World Momentum UCITS ETF',kind:'etf',name:/\bxtrackers\b.*\bmsci\b.*\bworld\b.*\bmomentum\b/i,isin:'IE00BL25JP72'},
 {symbol:'XDEQ',label:'Xtrackers MSCI World Quality UCITS ETF',kind:'etf',name:/\bxtrackers\b.*\bmsci\b.*\bworld\b.*\bquality\b/i,isin:'IE00BL25JL35'}
]);
export function knownReferenceListing(position){
 if(!position||String(position.currency||'EUR').toUpperCase()!=='EUR')return null;
 const match=KNOWN.find(k=>k.kind===position.kind&&k.symbol===String(position.symbol||'').toUpperCase());
 if(!match)return null;
 const isin=String(position.isin||'').toUpperCase();
 if(isin&&isin!==match.isin)return null;
 // Legacy full names remain usable. Broker abbreviations require all four
 // independent identity fields, including an explicitly confirmed currency.
 const strong=isin===match.isin&&String(position.currency||'').trim().toUpperCase()==='EUR'&&String(position.mic||'').trim().toUpperCase()==='XETR';
 if(!strong&&!match.name.test(String(position.name||'')))return null;
 const mic=String(position.mic||'').trim().toUpperCase();
 const exchange=String(position.exchange||'').trim().toUpperCase();
 if(mic&&mic!=='XETR')return null;
 if(exchange&&!['XETRA','XETR'].includes(exchange))return null;
 if(position.tradingViewSymbol&&String(position.tradingViewSymbol).toUpperCase()!=='XETR:'+match.symbol)return null;
 if(position.eodhdSymbol&&String(position.eodhdSymbol).toUpperCase()!==match.symbol+'.XETRA')return null;
 // Retired FMP mapping remains historical metadata, never an active identity gate.
 return Object.freeze({...match,exchange:'Xetra',mic:'XETR',eodhdSymbol:match.symbol+'.XETRA',fmpSymbol:match.symbol+'.DE'});
}
/** Populate missing identity fields in legacy backups only for a precise match. */
export function enhanceKnownReferenceListing(position){
 const found=knownReferenceListing(position);
 if(!found)return position;
 const copy={...position};
 for(const key of ['isin','exchange','mic','eodhdSymbol','fmpSymbol'])
  if(!String(copy[key]||'').trim())copy[key]=found[key];
 return copy;
}

/** Curated offline suggestions. These are reference listings, not current prices. */
export function referenceSearch(query=''){
 const q=String(query||'').trim().toUpperCase();
 if(q.length<2)return [];
 return KNOWN.filter(x=>[x.label,x.symbol,x.isin].some(v=>v.toUpperCase().includes(q)))
  .map(x=>({source:'local-reference',name:x.label,symbol:x.symbol,isin:x.isin,kind:x.kind,
    currency:'EUR',exchange:'Xetra',mic:'XETR',
    eodhdSymbol:x.symbol+'.XETRA',fmpSymbol:x.symbol+'.DE'}));
}
