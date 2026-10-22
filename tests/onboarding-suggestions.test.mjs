import test from 'node:test';
import assert from 'node:assert/strict';
import {providerDirectory,providerSuggestions,providerExact,accountSuggestions,accountExact,suggestedAccountForProvider,findOwnedProvider} from '../src/onboarding-suggestions.js';
test('Typing one letter f suggests Flatex with a broker classification',()=>{
 const suggestions=providerSuggestions('f');
 assert.equal(suggestions[0].name,'Flatex');
 assert.equal(providerExact('Flatex').type,'broker');
 assert.equal(providerExact('flatex.at').name,'Flatex');
 assert.equal(providerExact('unknown fintech'),null);
 assert.ok(providerDirectory.length>35);
});
test('Search matches aliases and name fragments without using network or guessing types',()=>{
 assert.equal(providerSuggestions('ibkr')[0].name,'Interactive Brokers');
 assert.equal(providerSuggestions('ledger')[0].type,'wallet');
 assert.ok(providerSuggestions('bank').some(p=>p.type==='bank'));
 assert.equal(providerSuggestions('totally unknown custodian').length,0);
 assert.equal(providerExact('Led'),null,'Partial name is a suggestion, never an exact identity');
});
test('Contextual broker/bank/wallet account names suggest appropriate types but permit custom names',()=>{
 assert.deepEqual(suggestedAccountForProvider('broker'),['Wertpapierdepot','securities']);
 assert.deepEqual(suggestedAccountForProvider('bank'),['Girokonto','checking']);
 assert.deepEqual(suggestedAccountForProvider('wallet'),['Krypto-Wallet','wallet']);
 assert.deepEqual(accountExact('Tagesgeldkonto','bank'),['Tagesgeldkonto','savings']);
 assert.equal(accountExact('Tagesgeldkonto','broker'),null);
 assert.equal(accountExact('Mein Sonderkonto','broker'),null);
 assert.equal(accountSuggestions('bank','tages').length,1);
});
test('Existing provider ID resolves only from exact owned name rather than global public provider suggestions',()=>{
 const providers=[{id:'own-1',name:'Flatex'},{id:'own-2',name:'Meine Vermögensverwaltung'}];
 assert.equal(findOwnedProvider('flatex',providers).id,'own-1');
 assert.equal(findOwnedProvider('fl',providers),null);
 assert.equal(findOwnedProvider('Ledger',providers),null);
 assert.equal(findOwnedProvider('Meine Vermögensverwaltung',providers).id,'own-2');
});
