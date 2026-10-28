/** Shared CSV character machine. No header, financial, network or persistence assumptions. */
export function readCSVRecords(input,{delimiter,maxRecords=5001}={}){
 const raw=String(input||'').replace(/^\uFEFF/,'');
 if(!raw.trim()||raw.length>2_000_000)throw Error('CSV leer oder größer als 2 MB.');
 if(!Number.isSafeInteger(maxRecords)||maxRecords<1||maxRecords>5021)throw Error('CSV-Zeilengrenze ungültig.');
 const head=raw.slice(0,1200),separators=delimiter?[delimiter]:[';',',','\t'];
 const sep=delimiter||separators.map(c=>({c,n:head.split('\n')[0].split(c).length})).sort((a,b)=>b.n-a.n)[0].c;
 if(![';',',','\t'].includes(sep))throw Error('CSV-Trennzeichen ungültig.');
 const records=[];let row=[],cell='',quoted=false,closedQuote=false,started=false,line=1,startLine=1;
 const retain=()=>{if(row.some(x=>x.trim())){records.push({line:startLine,cells:row});if(records.length>maxRecords)throw Error('CSV benötigt Kopfzeile und maximal 5.000 Datenzeilen.');}};
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(c==='\r'||(c==='\n'&&raw[i-1]!=='\r'))line++;
  if(c==='"'){
   if(quoted&&raw[i+1]==='"'){cell+='"';i++;}
   else if(quoted){quoted=false;closedQuote=true;}
   else if(!started){quoted=true;started=true;}
   else throw Error('CSV enthält ein ungültiges Anführungszeichen.');
  }else if(!quoted&&(c===sep||c==='\n'||c==='\r')){
   row.push(cell);cell='';started=false;closedQuote=false;
   if(c!==sep){if(c==='\r'&&raw[i+1]==='\n')i++;retain();row=[];startLine=line;}
  }else{if(closedQuote)throw Error('CSV enthält Zeichen nach einem schließenden Anführungszeichen.');cell+=c;started=true;}
 }
 if(quoted)throw Error('CSV enthält ein nicht geschlossenes Anführungszeichen.');
 row.push(cell);retain();return {delimiter:sep,records};
}
