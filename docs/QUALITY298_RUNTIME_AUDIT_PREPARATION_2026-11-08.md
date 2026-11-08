# QUALITY298 – read-only runtime and attribution inventory preparation

Scope: candidate/main tree 7ae902f3e24b5166592a8fc35f90432817be1f3a.
No product, policy, CSP, provider, install, encryption or attribution behavior
is changed. This inventory does not constitute a legal-compliance conclusion.

| Item | Direct observation | Remaining boundary |
| --- | --- | --- |
| Delivery manifest | 151 physical files including the service worker; 151 cache descriptors include both root and index | Pages/Gitblob verification and all 152 ordinary-TLS/live hash comparisons now PASS; release evidence remains authoritative |
| JavaScript modules | All 144 shipped JS files parsed through Node SourceTextModule without execution; no bare static package imports | This says nothing by itself about copied source or dynamic network requests |
| package.json | No declared runtime dependencies | No React/Vue/chart library is inferred; test tools remain separate |
| Test tooling | Playwright, Axe and PNG tools are used by verification, outside the delivery manifest | Development licenses do not automatically imply shipped runtime notices |
| Repository license | Existing MIT license and repository copyright present | This alone does not establish ownership/provenance of every SVG/path/asset |
| Icons/assets | Four brand image assets; functional SVG paths appear in application sources | No per-file third-party license markers were found; source provenance remains unproven from path similarity alone |
| External literals | Provider/RPC/Google/documentation HTTPS literals occur in 23 source files | Static literals are not a measured request inventory or an origin allowlist |
| Google integration | Conditional external Google Identity script is referenced; it is not a copied local dependency in the delivery manifest | Real OAuth and any distribution/terms assessment remain separate |
| CSP | Existing meta policy and optional custom HTTPS endpoints remain unchanged | Actual origins, workers, frames, DOM sinks and negative security tests remain future work; no blind allowlist change |

A duplicate inventory or empty THIRD_PARTY_NOTICES file is not introduced into
the app. If actual third-party provenance/notice duties are established later,
record the original license texts and add the required notices through their
own reviewed scope. Safari/ITP copy still needs current authoritative checking
before implementation. Physical Safari/Android/OAuth/TalkBack are not claimed.

This is a safe independent read-only roadmap increment, prepared while the
single frozen UI300 release pipeline runs. Reconciled against the actually released v297 tree and its qualified delivery
evidence. Findings remain bounded preparation, not a completed trust audit.
