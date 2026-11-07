import {fundingFixture} from './flatex-funding-fixture.mjs';
import {nativeFlatexCSV} from './flatex-native-fixture.mjs';
import {parseFlatexNativeCSV} from '../src/flatex-native.js';
import {inspectFlatexFundingGroups} from '../src/flatex-net-settlement.js';
export function valueDateFixture({cash='21.75',tradeDate='02.01.1999',fundingDate='05.01.1999',tradeValueDate='04.01.1999',fundingValueDate='05.01.1999',quantity='2',price='10',settlement='-21,75',funding='21,75',reverse=false}={}){
 const f=fundingFixture({cash});
 f.documents=[parseFlatexNativeCSV(nativeFlatexCSV('depot',[{1:tradeDate,2:tradeValueDate,5:quantity,9:price}])),parseFlatexNativeCSV(nativeFlatexCSV('account',[{0:tradeDate,1:tradeValueDate,6:settlement},{0:fundingDate,1:fundingValueDate,4:'Kauf IE00SYNTH001 0009007199254740993',5:'SYN-FUND',6:funding}]))];
 if(reverse)f.documents.reverse();f.inspection=inspectFlatexFundingGroups(f.documents);
 f.files=f.documents.map((document,i)=>({name:'Synthetic next-day funding '+i+'.csv',document}));return f;
}
