// Source-independent preview for #405. No network, persistence or production import.
const markets = {
  crypto: { label: 'Krypto Fear & Greed', source: 'CoinMarketCap' },
  stocks: { label: 'Aktien Fear & Greed', source: 'CNN' }
};
const labels = {
  'extreme fear': 'Extreme Angst', fear: 'Angst', neutral: 'Neutral',
  greed: 'Gier', 'extreme greed': 'Extreme Gier'
};
const nf = new Intl.NumberFormat('de-AT', {maximumFractionDigits: 2});
const df = new Intl.DateTimeFormat('de-AT', {dateStyle: 'short', timeZone: 'UTC'});

function observation(market, sample) {
  if (!sample || sample.source !== markets[market].source) return null;
  const { value, category, observedAt } = sample;
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  const key = typeof category === 'string' && category.trim().toLowerCase();
  if (!Object.hasOwn(labels, key)) return null;
  // UTC date belongs to the source observation, never the time of the attempted download.
  if (typeof observedAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(observedAt)) return null;
  const date = new Date(observedAt);
  if (!Number.isFinite(date.valueOf()) || date.toISOString().replace('.000Z','Z') !== observedAt.replace('.000Z','Z')) return null;
  return { value, label: labels[key], date, observedAt };
}

function node(tag, className, content) {
  const el = document.createElement(tag);
  el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}

function gauge(value) {
  const ns = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    const el = document.createElementNS(ns, tag);
    for (const [name, val] of Object.entries(attrs)) el.setAttribute(name, val);
    return el;
  }
  const root = svg('svg', {viewBox:'0 0 40 23', 'aria-hidden':'true',focusable:'false'});
  const point = pct => {
    const angle = (1 - pct / 100) * Math.PI;
    return [20 + 16 * Math.cos(angle), 20 - 16 * Math.sin(angle)];
  };
  const colors = ['#ad483c','#c97c38','#c5a744','#8caa5c','#3e805b'];
  for (const [i, color] of colors.entries()) {
    const from = point(i*20), to = point((i+1)*20);
    root.append(svg('path', {d:'M '+from.join(' ')+' A 16 16 0 0 1 '+to.join(' '), fill:'none',stroke:color,'stroke-width':5}));
  }
  const [cx, cy] = point(value);
  root.append(svg('circle', {cx,cy,r:2.8,fill:'#152b20',stroke:'white','stroke-width':1.2}));
  return root;
}

// Each provider owns its data and freshness policy. Previous observations remain
// visible with their source date when the same feed is stale, fails, or is offline.
export function renderSentimentPreview(host, feeds = {}) {
  const section = node('section','qa-sentiment');
  section.setAttribute('aria-label','Marktstimmung');
  for (const [market, spec] of Object.entries(markets)) {
    const feed = feeds[market] || {};
    const current = feed.state === 'fresh' && observation(market, feed.observation);
    const saved = current || observation(market, feed.previous);
    const row = node('div','qa-market');
    const copy = node('div','qa-copy');
    copy.append(node('strong','qa-label',spec.label));
    const meta = node('small','qa-meta');
    if (saved) {
      const date = node('time','qa-date',df.format(saved.date));
      date.dateTime = saved.observedAt;
      meta.append(saved.label+' · '+spec.source+' · ',date);
      if (!current) meta.append(' · veraltet');
    } else meta.textContent = spec.source+' · nicht verfügbar';
    copy.append(meta);
    const result = node('span','qa-reading');
    if (saved) result.append(gauge(saved.value),node('b','qa-value',nf.format(saved.value)));
    else {
      result.textContent = '–';
      result.setAttribute('aria-hidden','true');
    }
    row.append(copy,result);
    section.append(row);
  }
  host.replaceChildren(section);
}
