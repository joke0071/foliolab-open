"""Local #405 layout probe. Run with a SW332 checkout, axe.min.js and Playwright."""
import argparse
import functools
import http.server
import json
import pathlib
import threading

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("checkout", type=pathlib.Path)
parser.add_argument("axe", type=pathlib.Path)
parser.add_argument("out", type=pathlib.Path)
parser.add_argument("--chromium-executable")
parser.add_argument("--engines", nargs="+", default=["chromium", "firefox", "webkit"])
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
fixture = pathlib.Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path == "/__qa/axe.min.js":
            return str(args.axe.resolve())
        if path in ["/__qa/preview.js", "/__qa/preview.css"]:
            return str(fixture / path.split("/")[-1])
        return super().translate_path(path)

    def log_message(self, *unused):
        pass


def sample(source, value, category):
    return dict(source=source, value=value, category=category, observedAt="2026-11-19T12:00:00Z")


a = sample("CoinMarketCap", 0, "Extreme Fear")
b = sample("CNN", 100, "Extreme Greed")
fresh = dict(crypto=dict(state="fresh", observation=a), stocks=dict(state="fresh", observation=b))
scenarios = [
    ("current", fresh, ["0", "100"], ["Extreme Angst", "Extreme Gier"]),
    ("offline", dict(crypto=dict(state="offline", previous=a), stocks=dict(state="offline")),
     ["0"], ["veraltet", "nicht verfügbar"]),
    ("failed-and-loading", dict(crypto=dict(state="error"), stocks=dict(state="loading", previous=b)),
     ["100"], ["nicht verfügbar", "veraltet"]),
    ("wrong-source-and-invalid-date", dict(crypto=dict(state="fresh", observation=b),
         stocks=dict(state="fresh", observation={**b, "observedAt": "2026-02-31T12:00:00Z"})),
     [], ["nicht verfügbar", "nicht verfügbar"]),
    ("invalid-value-and-category", dict(crypto=dict(state="fresh", observation={**a, "value": 101}, previous=a),
         stocks=dict(state="fresh", observation={**b, "category": "undefined"})),
     ["0"], ["veraltet", "nicht verfügbar"]),
]
seed = """async () => {
  const {blankModel,createProvider,createAccount,createPosition}=await import('/src/model.js');
  const {executeTransaction}=await import('/src/transactions.js');
  const {PortfolioStorage}=await import('/src/browser-portfolio-storage.js');
  const model=blankModel(); model.settings.autoRefresh=false;
  model.providers.push(createProvider({id:'demo',name:'QA'}));
  model.accounts.push(createAccount({id:'account',name:'QA',type:'securities',providerId:'demo'},model));
  for(const [kind,price] of [['etf',50],['crypto',40],['cash',1]]) {
    model.positions.push(createPosition({id:kind,name:kind,kind,quantity:kind==='cash'?0:1,
       price,providerId:'demo',accountId:'account'},model));
  }
  executeTransaction(model,{id:'deposit',type:'deposit',positionId:'cash',quantity:10,unitPrice:1,date:'2026-01-01'});
  const s=new PortfolioStorage(); await s.initialize(); await s.save(model); s.close();
}"""
record = """async () => {
  const {openPortfolioDB,readPortfolioRecord}=await import('/src/atomic-storage.js');
  const db=await openPortfolioDB(); try{return await readPortfolioRecord(db)} finally{db.close()}
}"""
allocation = """() => ({
  ring:document.querySelector('#donut').innerHTML,
  total:document.querySelector('#totalValue').textContent,
  rows:[...document.querySelectorAll('#allocationLegend .alloc-legend-row')].map(e=>e.outerHTML)
})"""
ready = "() => document.querySelector('#portfolioStorageState')?.textContent.includes('IndexedDB aktiv')"
prepare = """async () => {
  const legend=document.querySelector('#allocationLegend'), host=document.createElement('div');
  legend.closest('.allocation-layout').after(host);
  const {renderSentimentPreview,renderCachedSentimentPreview}=await import('/__qa/preview.js');
  window.draw = data => renderSentimentPreview(host,data);
  window.drawCached = data => renderCachedSentimentPreview(host,data);
}"""
font_scale = """factor => {
  const nodes=[...document.querySelectorAll('#allocationLegend, #allocationLegend *, .qa-sentiment, .qa-sentiment *')].filter(e=>e instanceof HTMLElement);
  window.originalStyles ||= new WeakMap();
  for(const el of nodes) {
    if(!originalStyles.has(el)) originalStyles.set(el,el.getAttribute('style'));
    const orig=originalStyles.get(el);
    if(orig===null) el.removeAttribute('style'); else el.setAttribute('style',orig);
  }
  const sizes=nodes.map(el=>parseFloat(getComputedStyle(el).fontSize));
  if(factor!==1) nodes.forEach((el,i)=>{el.style.fontSize=sizes[i]*factor+'px'});
}"""
geometry = """() => {
  const card=document.querySelector('.dashboard-allocation').getBoundingClientRect();
  const pct=document.querySelector('.alloc-legend-row b').getBoundingClientRect();
  const rows=[...document.querySelectorAll('.qa-market')];
  const section=document.querySelector('.qa-sentiment'), host=section.parentElement;
  const positions=()=>[...document.querySelectorAll('#donut, #allocationLegend .alloc-legend-row')].map(el=>{
    const r=el.getBoundingClientRect(), origin=el.closest('.dashboard-allocation').getBoundingClientRect(); return [r.x-origin.x,r.y-origin.y,r.width,r.height];
  });
  const visible=positions(); host.hidden=true; const hidden=positions(); host.hidden=false;
  const allocationRectsUnchanged=visible.every((row,i)=>row.every((v,j)=>Math.abs(hidden[i][j]-v)<0.1));
  return {positionDelta:allocationRectsUnchanged?null:{visible,hidden}, allocationRectsUnchanged, pctHeight:pct.height, gaugeHeights:rows.flatMap(r=>[...r.querySelectorAll('svg')].map(e=>e.getBoundingClientRect().height)),
    aligned:rows.every(r=>Math.abs(r.querySelector('.qa-reading').getBoundingClientRect().right-pct.right)<1.1),
    fits:card.left>=-1 && card.right<=innerWidth+1 && document.documentElement.scrollWidth<=innerWidth+1 &&
      rows.every(r=>r.scrollWidth<=r.clientWidth+1 && r.querySelector('.qa-copy').getBoundingClientRect().right<=r.querySelector('.qa-reading').getBoundingClientRect().left+1)};
}"""


def check_cache(page, context, baseline, original):
    values = page.locator(".qa-value")
    metadata = page.locator(".qa-meta")
    dates = page.locator(".qa-date")
    newer = {**a, "value": 25, "category": "Fear", "observedAt": "2026-11-20T12:00:00Z"}
    mismatch = {**b, "observedAt": newer["observedAt"]}
    page.evaluate(prepare)
    page.evaluate("() => drawCached({})")
    assert values.count() == 0
    assert all("nicht verfügbar" in label for label in metadata.all_text_contents())

    page.evaluate("d => drawCached(d)", fresh)
    assert values.all_text_contents() == ["0", "100"]
    assert all("veraltet" not in label for label in metadata.all_text_contents())
    page.evaluate("d => drawCached(d)", {
        "crypto": {"state": "fresh", "observation": newer}, "stocks": {"state": "error"}
    })
    assert values.all_text_contents() == ["25", "100"]
    assert "veraltet" not in metadata.nth(0).text_content()
    assert "veraltet" in metadata.nth(1).text_content()

    for bad in [a, mismatch, {**newer, "value": 101}, {**newer, "value": 26}]:
        page.evaluate("d => drawCached(d)", {"crypto": {"state": "fresh", "observation": bad}})
        assert values.all_text_contents() == ["25", "100"]
        assert all("veraltet" in label for label in metadata.all_text_contents())
        assert dates.nth(0).get_attribute("datetime") == newer["observedAt"]
        assert dates.nth(1).get_attribute("datetime") == b["observedAt"]
        assert page.evaluate(record) == baseline

    page.reload()
    page.wait_for_function(ready)
    page.evaluate(prepare)
    context.set_offline(True)
    try:
        page.evaluate("() => drawCached({crypto:{state:'offline'}, stocks:{state:'offline'}})")
        assert values.all_text_contents() == ["25", "100"]
        assert all("veraltet" in label for label in metadata.all_text_contents())
        assert dates.nth(0).get_attribute("datetime") == newer["observedAt"]
        assert dates.nth(1).get_attribute("datetime") == b["observedAt"]
        assert page.evaluate(record) == baseline
        assert page.evaluate(allocation) == original
    finally:
        context.set_offline(False)
    return ["empty cache", "independent current values", "partial provider error",
            "older/wrong-provider/invalid/conflicting deliveries rejected", "offline cache read after page reload"]

server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=args.checkout.resolve()))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}/"
try:
    with sync_playwright() as pw:
        for name in args.engines:
            engine = getattr(pw, name)
            browser = engine.launch(executable_path=args.chromium_executable if name=="chromium" else None)
            try:
                context = browser.new_context(service_workers="block", viewport={"width":390, "height":850})
                context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
                page = context.new_page()
                page.goto(base)
                page.wait_for_function(ready)
                page.evaluate(seed)
                page.reload()
                page.wait_for_function(ready)
                baseline = page.evaluate(record)
                assert len(json.loads(baseline["raw"])["bookings"]) == 1
                original = page.evaluate(allocation)
                assert len(original["rows"]) == 3
                page.evaluate(prepare)
                page.add_style_tag(url=base+"__qa/preview.css")
                page.add_script_tag(url=base+"__qa/axe.min.js")
                checks = []
                for label, data, values, expected in scenarios:
                    context.set_offline(label=="offline")
                    page.evaluate("d => window.draw(d)", data)
                    assert page.locator(".qa-value").all_text_contents() == values, label
                    meta = page.locator(".qa-meta").all_text_contents()
                    assert all(w in m for w, m in zip(expected, meta, strict=True)), (label,meta)
                    for el in page.locator(".qa-date").all():
                        assert el.get_attribute("datetime") == a["observedAt"]
                    assert page.evaluate(record) == baseline
                    context.set_offline(False)
                page.evaluate("d => window.draw(d)", fresh)
                for width in [320,390,430,1024]:
                    page.set_viewport_size({"width":width,"height":850})
                    for factor in [1,2]:
                        page.evaluate(font_scale, factor)
                        size = page.evaluate(geometry)
                        assert size["fits"] and size["aligned"] and size["allocationRectsUnchanged"] and len(size["gaugeHeights"])==2, (name,width,factor,size)
                        assert max(size["gaugeHeights"]) <= size["pctHeight"]+0.05, (name,width,factor,size)
                        violations = page.evaluate("async () => (await axe.run('.qa-sentiment')).violations.map(v=>v.id)")
                        assert not violations, (name,width,factor,violations)
                        checks.append(dict(width=width,fontFactor=factor,axeViolations=violations,**size))
                        if width==390 and factor==1:
                            demo = dict(crypto=dict(state="fresh", observation=sample("CoinMarketCap", 8, "Extreme Fear")),
                                        stocks=dict(state="fresh", observation=sample("CNN", 54, "Neutral")))
                            page.evaluate("d => window.draw(d)", demo)
                            page.locator(".dashboard-allocation").evaluate("el => el.scrollIntoView({block:'center',behavior:'instant'})")
                            page.wait_for_function("""() => [...document.querySelectorAll('.qa-value')].every(el=>{
                              const r=el.getBoundingClientRect();
                              return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
                            })""")
                            page.locator(".dashboard-allocation").screenshot(path=args.out/f"{name}-390.png")
                            page.evaluate("d => window.draw(d)", fresh)
                page.evaluate(font_scale, 1)
                assert page.evaluate(allocation) == original
                assert page.evaluate(record) == baseline
                page.reload()
                page.wait_for_function(ready)
                assert page.locator(".qa-sentiment").count()==0 and page.evaluate(record)==baseline
                cache_checks = check_cache(page, context, baseline, original)
                report=dict(engine=name,version=browser.version,checks=checks,scenarios=[s[0] for s in scenarios],
                    cacheChecks=cache_checks,
                    intact=["whole canonical IndexedDB record across all scenarios and reload","three allocation rows, ring and total"],scope="Isolated fixture with synthetic inputs on SW332 main, no feed calls or production UI")
                (args.out/f"{name}.json").write_text(json.dumps(report,indent=2)+"\n")
                print(name, "PASS", len(checks), "layout/Axe cases and", len(cache_checks), "cache scenarios", flush=True)
            finally:
                browser.close()
finally:
    server.shutdown()
