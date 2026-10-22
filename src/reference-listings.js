/**
 * Small, deliberately curated list of verified EUR Xetra listings.
 * Never infer an exchange from a ticker alone: multiple securities and
 * currencies can share a ticker, and a custody broker is not an exchange.
 * This is a REFERENCE listing, not an asserted execution venue.
 */
const KNOWN=Object.freeze([
 {symbol:'5MVL',kind:'etf',name:/\bishares\b.*\bmsci\b.*\bem\b.*\bvalue\b/i,isin:'IE00BG0SKF03'},
 {symbol:'VWCE',kind:'etf',name:/\bvanguard\b.*\bftse\b.*\ball.world\b/i,isin:'IE00BK5BQT80'},
 {symbol:'XDEM',kind:'etf',name:/\bxtrackers\b.*\bmsci\b.*\bworld\b.*\bmomentum\b/i,isin:'IE00BL25JP72'},
 {symbol:'XDEQ',kind:'etf',name:/\bxtrackers\b.*\bmsci\b.*\bworld\b.*\bquality\b/i,isin:'IE00BL25JL35'}
]);
export function knownReferenceListing(position){
 if(!position||String(position.currency||'EUR').toUpperCase()!=='EUR')return null;
 const match=KNOWN.find(k=>k.kind===position.kind&&k.symbol===String(position.symbol||'').toUpperCase()&&k.name.test(String(position.name||'')));
 if(!match)return null;
 const isin=String(position.isin||'').toUpperCase();
 if(isin&&isin!==match.isin)return null;
 const mic=String(position.mic||'').trim().toUpperCase();
 const exchange=String(position.exchange||'').trim().toUpperCase();
 if(mic&&mic!=='XETR')return null;
 if(exchange&&!['XETRA','XETR'].includes(exchange))return null;
 if(position.tradingViewSymbol&&String(position.tradingViewSymbol).toUpperCase()!=='XETR:'+match.symbol)return null;
 if(position.eodhdSymbol&&String(position.eodhdSymbol).toUpperCase()!==match.symbol+'.XETRA')return null;
 if(position.fmpSymbol&&String(position.fmpSymbol).toUpperCase()!==match.symbol+'.DE')return null;
 return Object.freeze({...match,exchange:'Xetra',mic:'XETR',tradingViewSymbol:'XETR:'+match.symbol,eodhdSymbol:match.symbol+'.XETRA',fmpSymbol:match.symbol+'.DE'});
}
/** Populate missing identity fields in legacy backups only for a precise match. */
export function enhanceKnownReferenceListing(position){
 const found=knownReferenceListing(position);
 if(!found)return position;
 const copy={...position};
 for(const key of ['isin','exchange','mic','tradingViewSymbol','eodhdSymbol','fmpSymbol'])
  if(!String(copy[key]||'').trim())copy[key]=found[key];
 return copy;
}
