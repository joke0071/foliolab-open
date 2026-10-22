# Optional public instrument lookup Worker

Standalone, **not deployed** as part of GitHub Pages. Requires an operator-owned Cloudflare account. Public OpenFIGI v3 metadata only, no market prices or personal portfolio data.

Endpoints:
- `GET /api/instruments/search?q=world%20etf` → OpenFIGI `POST /v3/search`
- `GET /api/instruments/resolve?isin=IE00BK5BQT80` → OpenFIGI `POST /v3/mapping`

Returns a versioned JSON envelope with `status`, `source` and `results`. Search is metadata-only and will not automatically confirm the right listing; results may omit ISIN or currency, and must be reviewed before use. No arbitrary target URL is accepted. CORS is restricted to `https://joke0071.github.io` and configured trusted origins.

Check from repository root:

```sh
node --test worker/tests/*.test.mjs
```

Cloudflare manual deployment requires installing `wrangler` separately and logging in. No GitHub action deploys this Worker. Only configure its URL in the frontend after real deployment, live response verification, CORS checks and a separate UI integration review.

Unauthenticated OpenFIGI v3 `/search` is limited to **5 requests per 60 seconds** and `/mapping` to **25 requests per 60 seconds** at the time of implementation. Responses are cached opportunistically using a per-location edge cache; this is NOT a global rate limiter, and upstream 429 is surfaced honestly.

Source: https://www.openfigi.com/api/documentation
