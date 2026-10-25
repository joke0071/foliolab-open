/** Presentation-only position symbols. Do not infer an asset class from its name or ticker. */
export const POSITION_ICON_PATHS=Object.freeze({
  'asset-etf':'<path d="m12 2.5-9 5 9 5 9-5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  'asset-stock':'<path d="M7 2v20M17 2v20"/><rect x="4" y="7" width="6" height="8" rx="1.2"/><rect x="14" y="4.5" width="6" height="10" rx="1.2"/>',
  'asset-fund':'<path d="M11 3.2a8.8 8.8 0 1 0 9.8 9.8H11z"/><path d="M14 3.2v6.8h6.8A8.5 8.5 0 0 0 14 3.2z"/>',
  'asset-crypto':'<circle cx="9" cy="14" r="6.5"/><path d="M11.5 3.9A7.2 7.2 0 0 1 20.1 13"/><path d="M7 11.6h3.2a2.4 2.4 0 0 1 0 4.8H7M8.6 10v8"/>',
  'asset-cash':'<path d="m3 9 9-5 9 5M3 10h18M5 19v-8m5 8v-8m4 8v-8m5 8v-8M3 21h18"/>',
  'asset-fixed':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><circle cx="12" cy="15.5" r="3.3"/><path d="M12 13.7v1.8l1.2.8"/>',
  'asset-other':'<rect x="3" y="3.5" width="8" height="8" rx="2"/><circle cx="17.5" cy="7.5" r="3.5"/><path d="m8 14.5 5 7H3zM16 15h5v6h-5z"/>'
});
const ICON_BY_KIND=Object.freeze({
  etf:'asset-etf',
  stock:'asset-stock',
  fund:'asset-fund',
  crypto:'asset-crypto',
  cash:'asset-cash',
  other:'asset-other'
});
/**
 * Pure UI mapping. A connected wallet does not change an asset's class.
 * Only explicit fixed-term account metadata qualifies cash as Festgeld.
 */
export function positionIconName(position,account){
  if(position?.kind==='cash'&&account?.cashTerms?.fixedTerm===true)return 'asset-fixed';
  return ICON_BY_KIND[position?.kind]||'asset-other';
}
