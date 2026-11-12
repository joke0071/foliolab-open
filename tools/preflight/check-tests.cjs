#!/usr/bin/env node
'use strict';
/** Read-only JS name/syntax preflight. Not a browser test or release approval. */
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const PIN = '5.8.3';
const NAME_ERRORS = new Set([2304,2552,2580,2662,2663,18004]);
const MAX_BYTES = 2 * 1024 * 1024;

function loadCompiler() {
  const candidates = process.env.FOLIOLAB_TYPESCRIPT ? [process.env.FOLIOLAB_TYPESCRIPT] :
    ['typescript', path.resolve(path.dirname(process.execPath),'../lib/node_modules/typescript')];
  for (const candidate of candidates) {
    let ts;
    try { ts = require(candidate); } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
      continue;
    }
    if (ts.version !== PIN) throw Error(`Expected TypeScript ${PIN}, found ${ts.version}; no automatic install or fallback.`);
    return ts;
  }
  throw Error(`TypeScript ${PIN} unavailable. Install it only in tools/preflight, or set FOLIOLAB_TYPESCRIPT to its local module. No tests were checked.`);
}
function validPath(name) {
  return typeof name === 'string' && /^(?:tests|worker\/tests)\/[A-Za-z0-9_./-]+\.mjs$/.test(name) &&
    !name.split('/').some(p => !p || p === '.' || p === '..');
}
function checkSources(sources, ts = loadCompiler()) {
  if (!(sources instanceof Map) || !sources.size) throw Error('No explicit JavaScript test inputs.');
  const root = path.resolve('/__foliolab_static_preflight__');
  const files = new Map();
  const originalNames = new Map();
  for (const [name, text] of sources) {
    if (!validPath(name) || typeof text !== 'string' || Buffer.byteLength(text) > MAX_BYTES)
      throw Error('Invalid, unsupported or oversized test input: ' + name);
    const abs = path.join(root, name);
    files.set(abs, text); originalNames.set(abs, name);
  }
  // Explicitly declared runtime globals; imported dependencies are NOT executed.
  // Browser and Node globals share one static environment. Realm capture is NOT checked.
  const globalsPath = path.join(root, 'runtime-globals.d.ts');
  files.set(globalsPath, 'declare const process: any; declare const Buffer: any; declare const global: any;\n' +
    'declare const axe: any; declare function setImmediate(...a: any[]): any; declare function clearImmediate(a: any): void;\n');
  const options = {allowJs:true,checkJs:true,noEmit:true,noResolve:true,types:[],skipLibCheck:true,
    target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,
    moduleDetection:ts.ModuleDetectionKind.Force,lib:['lib.es2022.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts']};
  const host = ts.createCompilerHost(options);
  const originalRead = host.readFile.bind(host), originalExists = host.fileExists.bind(host);
  host.readFile = name => files.has(path.resolve(name)) ? files.get(path.resolve(name)) : originalRead(name);
  host.fileExists = name => files.has(path.resolve(name)) || originalExists(name);
  host.writeFile = () => { throw Error('Preflight must never emit files.'); };
  const program = ts.createProgram([...files.keys()], options, host);
  const globalErrors = program.getGlobalDiagnostics().filter(d => d.category === ts.DiagnosticCategory.Error);
  if (globalErrors.length) throw Error('Compiler environment incomplete: ' + globalErrors.map(d => ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
  const results = [];
  for (const [abs, name] of originalNames) {
    const source = program.getSourceFile(abs);
    if (!source) throw Error('Compiler did not load ' + name);
    const text = files.get(abs), issues = [];
    // Never silently accept a source which suppresses compiler diagnostics.
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
    for (let kind=scanner.scan();kind!==ts.SyntaxKind.EndOfFileToken;kind=scanner.scan()) {
      if ((kind===ts.SyntaxKind.SingleLineCommentTrivia||kind===ts.SyntaxKind.MultiLineCommentTrivia) &&
          /@ts-(?:nocheck|ignore|expect-error)\b/.test(scanner.getTokenText())) {
        const pos = source.getLineAndCharacterOfPosition(scanner.getTokenPos());
        issues.push({code:'SUPPRESSED_CHECK',line:pos.line+1,column:pos.character+1,message:'Compiler suppression requires explicit review; not a preflight pass.'});
      }
    }
    const syntax = program.getSyntacticDiagnostics(source);
    const semantic = program.getSemanticDiagnostics(source);
    for (const d of [...syntax,...semantic.filter(d => NAME_ERRORS.has(d.code))]) {
      const pos = source.getLineAndCharacterOfPosition(d.start || 0);
      issues.push({code:d.code,line:pos.line+1,column:pos.character+1,message:ts.flattenDiagnosticMessageText(d.messageText,' ')});
    }
    results.push({path:name,sha256:createHash('sha256').update(text).digest('hex'),issues,
      otherTypeDiagnostics:semantic.filter(d => !NAME_ERRORS.has(d.code)).length});
  }
  return {scope:'STATIC_NAME_AND_SYNTAX_ONLY',compiler:ts.version,status:results.some(r=>r.issues.length)?'FAIL':'PASS',
    files:results,limitations:['No browser execution, import resolution, type correctness, timing, accessibility or release approval.','Node/browser globals are allowed together; cross-realm closure capture remains a browser-test responsibility.']};
}
function readWorktree(root, names) {
  const base=fs.realpathSync(root), sources=new Map();
  for (const name of names) {
    if (!validPath(name)) throw Error('Only explicit tests/*.mjs or worker/tests/*.mjs inputs are accepted: '+name);
    const target=path.join(base,name), real=fs.realpathSync(target);
    if (real!==target || !fs.statSync(real).isFile()) throw Error('Symlink or non-regular input: '+name);
    if (fs.statSync(real).size>MAX_BYTES) throw Error('Oversized test input: '+name);
    sources.set(name,fs.readFileSync(real,'utf8'));
  }
  return sources;
}
function readRevision(root, base, head) {
  // Local git only. Arguments are never interpolated into a shell; refs must be full SHA-1s.
  if (![base,head].every(x=>/^[a-f0-9]{40}$/.test(x))) throw Error('Both --base and --head must be exact 40-character commit SHAs.');
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']});
  git(['cat-file','-e',base+'^{commit}']);git(['cat-file','-e',head+'^{commit}']);
  const names=git(['diff','--name-only','--no-renames','--diff-filter=ACMT','-z',base,head,'--','tests','worker/tests']).split('\0').filter(Boolean);
  const sources=new Map();
  for (const name of names.filter(n=>n.endsWith('.mjs'))) {
    if (!validPath(name)) throw Error('Unsupported changed test path: '+name);
    const entry=git(['ls-tree',head,'--',name]);
    if (!entry.startsWith('100644 blob ') && !entry.startsWith('100755 blob ')) throw Error('Non-regular changed test: '+name);
    sources.set(name,git(['show',head+':'+name]));
  }
  return sources;
}
function main(argv) {
  let sources, identity;
  if(argv[0]==='--base'&&argv[2]==='--head'&&argv.length===4){
    sources=readRevision(process.cwd(),argv[1],argv[3]);identity={base:argv[1],head:argv[3],input:'COMMITTED_BYTES'};
  }else if(argv[0]==='--files'&&argv.length>1){sources=readWorktree(process.cwd(),argv.slice(1));identity={input:'WORKTREE_BYTES'};}
  else throw Error('Usage: node tools/preflight/check-tests.cjs --base <SHA> --head <SHA> | --files tests/a.mjs ...');
  if(!sources.size){console.log(JSON.stringify({status:'NOT_APPLICABLE',scope:'STATIC_NAME_AND_SYNTAX_ONLY',...identity,reason:'No changed JavaScript test files; no validation claim.'},null,2));return 0;}
  const report={...checkSources(sources),...identity};console.log(JSON.stringify(report,null,2));return report.status==='PASS'?0:1;
}
module.exports={checkSources,validPath,readWorktree,readRevision,loadCompiler,main};
if(require.main===module){try{process.exitCode=main(process.argv.slice(2));}catch(e){console.error(JSON.stringify({status:'BLOCKED',scope:'STATIC_NAME_AND_SYNTAX_ONLY',message:e.message}));process.exitCode=2;}}
