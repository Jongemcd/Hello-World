/* Tiny dependency-free SVG charts with hover/tap tooltips. */
(function (root) {
  const NS = 'http://www.w3.org/2000/svg';
  let tip;

  function tooltip() {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tip';
      tip.hidden = true;
      document.body.appendChild(tip);
      document.addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-tip]')) tip.hidden = true; });
    }
    return tip;
  }

  function bindTips(svg) {
    const show = (e) => {
      const t = e.target.closest('[data-tip]');
      if (!t) return;
      const el = tooltip();
      el.innerHTML = t.getAttribute('data-tip');
      el.hidden = false;
      const x = Math.min(e.clientX + 12, window.innerWidth - el.offsetWidth - 8);
      el.style.left = Math.max(x, 8) + 'px';
      el.style.top = Math.max(e.clientY - el.offsetHeight - 12, 8) + 'px';
    };
    svg.addEventListener('pointermove', show);
    svg.addEventListener('pointerdown', show);
    svg.addEventListener('pointerleave', () => { if (tip) tip.hidden = true; });
  }

  const money = (n) => '$' + Math.round(n).toLocaleString();
  function short(n) {
    const a = Math.abs(n);
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function h(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / pow;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 4 ? 4 : f <= 8 ? 8 : 10) * pow;
  }

  function legend(el, series) {
    const d = document.createElement('div');
    d.className = 'legend';
    d.innerHTML = series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('');
    el.appendChild(d);
  }

  function setup(el, w, hgt, label) {
    el.innerHTML = '';
    const svg = h('svg', { viewBox: `0 0 ${w} ${hgt}`, role: 'img', 'aria-label': label || 'chart', class: 'chart' });
    el.appendChild(svg);
    bindTips(svg);
    return svg;
  }

  function empty(el, msg) {
    el.innerHTML = `<p class="empty">${esc(msg)}</p>`;
  }

  /** Axes + gridlines shared by bar/line charts. Returns scale helpers. */
  function frame(svg, W, H, m, ymax, xlabels, fmt) {
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const y = (v) => m.t + ih - (v / ymax) * ih;
    for (let i = 0; i <= 4; i++) {
      const v = (ymax / 4) * i;
      h('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'grid' }, svg);
      const t = h('text', { x: m.l - 6, y: y(v) + 4, class: 'axis', 'text-anchor': 'end' }, svg);
      t.textContent = (fmt || short)(v);
    }
    return { iw, ih, y };
  }

  /** series: [{label,color,values[]}]; xs: category labels. stacked bars. */
  function stackedBars(el, xs, series, opt) {
    opt = opt || {};
    if (!xs.length) return empty(el, 'No data yet.');
    const W = 640, H = 280, m = { l: 48, r: 8, t: 8, b: 28 };
    const svg = setup(el, W, H, opt.label);
    const totals = xs.map((_, i) => series.reduce((s, se) => s + (se.values[i] || 0), 0));
    const ymax = niceMax(Math.max.apply(null, totals.concat([1])) * 1.05);
    const { iw, y } = frame(svg, W, H, m, ymax);
    const bw = iw / xs.length;
    const step = Math.ceil(xs.length / 12);
    xs.forEach((x, i) => {
      let acc = 0;
      const tipRows = [];
      series.forEach((se) => {
        const v = se.values[i] || 0;
        if (v <= 0) return;
        tipRows.push(`<i style="background:${se.color}"></i>${esc(se.label)}: <b>${money(v)}</b>`);
        h('rect', { x: m.l + i * bw + bw * 0.12, width: bw * 0.76, y: y(acc + v), height: Math.max(y(acc) - y(acc + v), 0), fill: se.color }, svg);
        acc += v;
      });
      const hit = h('rect', { x: m.l + i * bw, width: bw, y: m.t, height: H - m.t - m.b, fill: 'transparent', 'data-tip': `<b>${esc(opt.xTitle || '')} ${esc(x)}</b><br>${tipRows.join('<br>')}` }, svg);
      hit.style.cursor = 'crosshair';
      if (i % step === 0) {
        const t = h('text', { x: m.l + i * bw + bw / 2, y: H - 8, class: 'axis', 'text-anchor': 'middle' }, svg);
        t.textContent = x;
      }
    });
    legend(el, series);
  }

  /** Grouped bars: series values side by side. */
  function groupedBars(el, xs, series, opt) {
    opt = opt || {};
    if (!xs.length) return empty(el, 'No data yet.');
    const W = 640, H = 260, m = { l: 48, r: 8, t: 8, b: 28 };
    const svg = setup(el, W, H, opt.label);
    const ymax = niceMax(Math.max.apply(null, series.flatMap((s) => s.values).concat([1])) * 1.05);
    const { iw, y } = frame(svg, W, H, m, ymax, null, opt.fmt);
    const f = opt.fmt || money;
    const gw = iw / xs.length, bw = (gw * 0.76) / series.length;
    xs.forEach((x, i) => {
      series.forEach((se, j) => {
        const v = se.values[i] || 0;
        h('rect', { x: m.l + i * gw + gw * 0.12 + j * bw, width: bw - 1, y: y(v), height: Math.max(y(0) - y(v), 0), fill: se.color, rx: 2 }, svg);
      });
      const tipRows = series.map((se) => `<i style="background:${se.color}"></i>${esc(se.label)}: <b>${f(se.values[i] || 0)}</b>`);
      h('rect', { x: m.l + i * gw, width: gw, y: m.t, height: H - m.t - m.b, fill: 'transparent', 'data-tip': `<b>${esc(x)}</b><br>${tipRows.join('<br>')}` }, svg);
      const t = h('text', { x: m.l + i * gw + gw / 2, y: H - 8, class: 'axis', 'text-anchor': 'middle' }, svg);
      t.textContent = x;
    });
    legend(el, series);
  }

  /** Lines with light area fill. series: [{label,color,values[]}] */
  function lines(el, xs, series, opt) {
    opt = opt || {};
    if (xs.length < 2) return empty(el, 'Not enough data yet.');
    const W = 640, H = 260, m = { l: 48, r: 12, t: 8, b: 28 };
    const svg = setup(el, W, H, opt.label);
    const ymax = niceMax(Math.max.apply(null, series.flatMap((s) => s.values).concat([1])) * 1.05);
    const { iw, y } = frame(svg, W, H, m, ymax);
    const x = (i) => m.l + (i / (xs.length - 1)) * iw;
    const step = Math.ceil(xs.length / 8);
    xs.forEach((lab, i) => {
      if (i % step) return;
      const t = h('text', { x: x(i), y: H - 8, class: 'axis', 'text-anchor': 'middle' }, svg);
      t.textContent = lab;
    });
    series.forEach((se) => {
      const pts = se.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
      h('polygon', { points: `${x(0)},${y(0)} ${pts.join(' ')} ${x(xs.length - 1)},${y(0)}`, fill: se.color, opacity: 0.1 }, svg);
      h('polyline', { points: pts.join(' '), fill: 'none', stroke: se.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
    });
    const bw = iw / (xs.length - 1);
    xs.forEach((lab, i) => {
      const rows = series.map((se) => `<i style="background:${se.color}"></i>${esc(se.label)}: <b>${money(se.values[i])}</b>`);
      h('rect', { x: x(i) - bw / 2, width: bw, y: m.t, height: H - m.t - m.b, fill: 'transparent', 'data-tip': `<b>${esc(opt.xTitle || '')} ${esc(lab)}</b><br>${rows.join('<br>')}` }, svg);
    });
    legend(el, series);
  }

  /** Donut: items [{label,value,color}] */
  function donut(el, items, opt) {
    opt = opt || {};
    const total = items.reduce((s, i) => s + i.value, 0);
    if (!total) return empty(el, 'No expenses in this period.');
    const S = 220, c = S / 2, R = 92, r = 56;
    const svg = setup(el, S, S, opt.label);
    svg.classList.add('donut');
    let a0 = -Math.PI / 2;
    items.forEach((it) => {
      if (it.value <= 0) return;
      const a1 = a0 + (it.value / total) * Math.PI * 2 - (items.length > 1 ? 0.012 : 0);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const pt = (rad, a) => `${(c + rad * Math.cos(a)).toFixed(2)} ${(c + rad * Math.sin(a)).toFixed(2)}`;
      const full = it.value === total;
      const d = full
        ? `M ${c - R} ${c} A ${R} ${R} 0 1 1 ${c + R} ${c} A ${R} ${R} 0 1 1 ${c - R} ${c} M ${c - r} ${c} A ${r} ${r} 0 1 0 ${c + r} ${c} A ${r} ${r} 0 1 0 ${c - r} ${c}`
        : `M ${pt(R, a0)} A ${R} ${R} 0 ${large} 1 ${pt(R, a1)} L ${pt(r, a1)} A ${r} ${r} 0 ${large} 0 ${pt(r, a0)} Z`;
      const p = h('path', { d, fill: it.color, 'fill-rule': 'evenodd', 'data-tip': `<i style="background:${it.color}"></i>${esc(it.label)}: <b>${money(it.value)}</b> (${Math.round((it.value / total) * 100)}%)` }, svg);
      p.style.cursor = 'pointer';
      a0 += (it.value / total) * Math.PI * 2;
    });
    const t1 = h('text', { x: c, y: c - 2, class: 'donut-total', 'text-anchor': 'middle' }, svg);
    t1.textContent = short(total);
    const t2 = h('text', { x: c, y: c + 16, class: 'axis', 'text-anchor': 'middle' }, svg);
    t2.textContent = opt.caption || 'total';
    legend(el, items.filter((i) => i.value > 0));
  }

  root.Charts = { stackedBars, groupedBars, lines, donut, money, short, esc };
})(window);
