# Bounded local JavaScript preflight

Optional developer-only check before freezing a FolioLab candidate. No app conversion to TypeScript, no transpilation, no network requests, no test execution and no replacement of any release gate. Root package, production files and workflows are unchanged.

The tool uses the existing TypeScript compiler API, pinned to 5.8.3, to report syntax errors and unresolved names in explicitly selected `.mjs` test files. It is NOT a full type check: import resolution and other type diagnostics are reported as outside scope. Node and browser globals share a static environment; serialized browser callback captures still require actual browser tests. TypeScript suppression comments produce a failure rather than a silent pass.

## Run from the repository root

Use an already installed exact compiler (local `tools/preflight/node_modules/typescript`, a matching global installation, or `FOLIOLAB_TYPESCRIPT` pointing to its module). If unavailable, the tool exits 2 with BLOCKED; it never installs dependencies on its own. A separately authorized local installation can use `npm install --prefix tools/preflight --ignore-scripts` (only dependency: TypeScript 5.8.3, outside the app package).

```sh
node tools/preflight/check-tests.cjs --files tests/browser-ui-audit-controls.mjs
node tools/preflight/check-tests.cjs --base <full-base-SHA> --head <full-head-SHA>
node --test tools/preflight/*.test.cjs
```

`--files` checks current working-tree bytes and records SHA-256. `--base/--head` reads exact committed content from LOCAL git; it never fetches GitHub. Full 40-character SHAs are required, shell interpolation is not used, and changed test symlinks are rejected. Missing input/compiler or invalid paths fail closed. No changed tests is NOT_APPLICABLE, not PASS.

Exit 0: scoped static check passed, or explicitly NOT_APPLICABLE. Exit 1: static findings. Exit 2: blocked/invalid invocation. JSON always names the limited scope. A preflight PASS is not a browser/finance/storage/accessibility/release pass.

## Historical qualification, 2026-11-12

On Node 22.16.0 with the preinstalled TypeScript 5.8.3: 21 preflight self-tests and 24 generated-output hygiene tests passed. The historical PR333 source at `72dd15cfa2913a86336a1c303207ecffae6ad861` (Git blob `ed0982bf4903dcda40c2a0a882040ee381b1dca0`) was reconstructed from the retrieved source/diff and matched the complete Git blob exactly. It fails at line 96, column 56 with TS2552: unresolved `toggle`. Corrected main source at `8ecc49f91c2c193e9391ef6f15460e6a40eb10c2` (blob `91869182776b8f7124bce6edda222fe9292a27d3`) passes this limited check. Six unrelated type diagnostics per source remain explicitly outside scope. No browser was started and neither original file was executed or edited remotely.

The environment could not resolve registry.npmjs.org. No ESLint installation or repeated setup attempt was performed; the already available compiler was reused. No runtime or CI dependency is silently added.

## Generated-output hygiene

The accompanying `.gitignore` addition covers only new root-level `artifacts/`, `_site/`, `test-results/` and `playwright-report/` output. All old private-export restrictions and all three precise synthetic fixture exceptions remain unchanged. Previously tracked evidence stays tracked and its modifications remain visible. Never use `git rm --cached` or delete existing evidence as part of this patch.

Integration belongs to the sole active HND01 owner after the in-flight release. This package starts no CI, changes no workflow triggers and does not authorize test deletion, branch deletion, retention shortening or a second writer.

## V2 correction, 2026-11-12

A synthetic local Git regression reproduced a gap in the original revision selector:
`--diff-filter=ACM` omitted a committed regular-file-to-symlink change (status T),
so the CLI could report NOT_APPLICABLE instead of blocking the unsafe input.
V2 includes T via `--diff-filter=ACMT`; the existing file-mode check then rejects
the symlink before reading its target. A symlink changed back to a regular file
is included and checked. Three new regressions cover both directions and the
CLI BLOCKED/exit-2 result. All 48 tool/output-hygiene tests passed locally on
Node 22.16.0 / TypeScript 5.8.3. This is not a browser or release approval.

Integration remains the sole owner's responsibility. No GitHub workflow, app
code, mandatory test gate or active release was changed by this correction.
