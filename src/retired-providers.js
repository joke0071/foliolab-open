/** Deliberately retired credentials, never historical quote/source evidence. */
export const RETIRED_PROVIDER_KEYS=Object.freeze(['fmpKey','twelveKey','eodhdKey']);
export function retiredSettingsPresent(settings){
 return !!settings&&typeof settings==='object'&&(RETIRED_PROVIDER_KEYS.some(k=>Object.hasOwn(settings,k))||['fmp','twelve'].includes(settings.securitySource));
}
export function withoutRetiredSettings(settings){
 const copy={...settings};
 for(const key of RETIRED_PROVIDER_KEYS)delete copy[key];
 if(['fmp','twelve'].includes(copy.securitySource))copy.securitySource='auto';
 return copy;
}
