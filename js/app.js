/* Retirement Compass — UI glue. All data stays in localStorage. */
(function () {
  const { CATEGORIES, INCOME_CATEGORIES, parseReceipt } = Receipt;
  const { esc, money } = Charts;
  const KEY = 'retirementCompass.v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const catColor = (c) => (CATEGORIES.find((x) => x.id === c) || { color: '#2e9c8f' }).color;
  const today = () => new Date().toLocaleDateString('en-CA');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- state ----------
  let state = load();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.transactions)) return { plan: Object.assign({}, Engine.DEFAULT_PLAN, s.plan), transactions: s.transactions };
    } catch (e) { /* ignore corrupt / unavailable storage */ }
    return { plan: Object.assign({}, Engine.DEFAULT_PLAN), transactions: [] };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast('Could not save — browser storage is full or blocked.'); }
  }
  function toast(msg) { alert(msg); }

  // ---------- derived data ----------
  function enginePlan() {
    const p = Object.assign({}, state.plan);
    p.age = Math.min(Math.max(Math.round(p.age) || 55, 18), 94);
    p.retireAge = Math.min(Math.max(Math.round(p.retireAge) || p.age, p.age), 94);
    p.ssAge = Math.min(Math.max(Math.round(p.ssAge) || 67, 62), 70);
    return p;
  }
  function monthKey(d) { return d.slice(0, 7); }
  function lastMonths(n) {
    const out = [];
    const d = new Date();
    d.setDate(1);
    for (let i = n - 1; i >= 0; i--) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'));
    }
    return out;
  }
  function trackedSpending() {
    const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cut = cutoff.toLocaleDateString('en-CA');
    const ex = state.transactions.filter((t) => t.type === 'expense' && t.date >= cut);
    if (!ex.length) return { annual: 0, months: 0 };
    const first = ex.reduce((m, t) => (t.date < m ? t.date : m), ex[0].date);
    const fd = new Date(first + 'T00:00');
    const months = Math.min(12, Math.max(1, (new Date().getFullYear() - fd.getFullYear()) * 12 + new Date().getMonth() - fd.getMonth() + 1));
    const sum = ex.reduce((s, t) => s + t.amount, 0);
    return { annual: (sum / months) * 12, months };
  }

  // ---------- tabs ----------
  const TITLES = { dashboard: 'Dashboard', transactions: 'Activity', plan: 'Retirement plan', report: 'Report', settings: 'Settings' };
  function showTab(id) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.id === id));
    $$('.nav button').forEach((b) => { b.classList.toggle('active', b.dataset.tab === id); b.setAttribute('aria-current', b.dataset.tab === id ? 'page' : 'false'); });
    $('#title').textContent = TITLES[id];
    ({ dashboard: renderDashboard, transactions: renderTx, plan: renderPlan, report: renderReport }[id] || (() => {}))();
    window.scrollTo(0, 0);
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }
  $$('.nav button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  const current = () => $('.tab.active').id;
  const refresh = () => showTab(current());

  // ---------- dashboard ----------
  function renderDashboard() {
    const tx = state.transactions;
    $('#welcome').hidden = tx.length > 0;
    const months = lastMonths(12);
    const inc = Object.fromEntries(months.map((m) => [m, 0]));
    const exp = Object.fromEntries(months.map((m) => [m, 0]));
    tx.forEach((t) => { const k = monthKey(t.date); if (k in inc) (t.type === 'income' ? inc : exp)[k] += t.amount; });
    const thisM = months[months.length - 1];
    const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    const net12 = sum(inc) - sum(exp);
    const res = Engine.project(enginePlan());
    const lasts = res.survives ? `${Engine.END_AGE}+` : res.lastsUntilAge;

    $('#kpis').innerHTML = [
      ['Income this month', money(inc[thisM]), ''],
      ['Spending this month', money(exp[thisM]), ''],
      ['Net, last 12 months', `<span class="${net12 >= 0 ? 'pos' : 'neg'}">${net12 < 0 ? '-' : ''}${money(Math.abs(net12))}</span>`, ''],
      ['Savings last until', `age ${lasts}`, `${money(res.savingsAtRetirement)} at ${res.plan.retireAge}`],
    ].map(([l, v, s]) => `<div class="card kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s}</div></div>`).join('');

    const period = $('#periodSel').value;
    const cutoff = new Date();
    let from = '0000';
    if (period === 'month') from = thisM;
    if (period === 'year') { cutoff.setFullYear(cutoff.getFullYear() - 1); from = cutoff.toLocaleDateString('en-CA'); }
    const byCat = {};
    tx.filter((t) => t.type === 'expense' && t.date >= from).forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    Charts.donut($('#donut'), Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]).map((c) => ({ label: c, value: byCat[c], color: catColor(c) })),
      { label: 'Spending by category', caption: period === 'month' ? 'this month' : period === 'year' ? 'last 12 mo' : 'all time' });

    const lbl = months.map((m) => new Date(m + '-01T00:00').toLocaleDateString(undefined, { month: 'short' }));
    Charts.groupedBars($('#monthly'), lbl, [
      { label: 'Income', color: '#1e88e5', values: months.map((m) => inc[m]) },
      { label: 'Expense', color: '#e53935', values: months.map((m) => exp[m]) },
    ], { label: 'Monthly income versus expense' });

    const risks = Engine.assessRisks(enginePlan(), trackedSpending()).filter((r) => r.level !== 'low').slice(0, 3);
    $('#topRisks').innerHTML = risks.length ? riskHtml(risks) : '<p class="empty">No elevated risks found with your current plan. See the Report tab for details.</p>';
  }
  $('#periodSel').addEventListener('change', renderDashboard);

  function riskHtml(list) {
    return list.map((r) => `<div class="risk ${r.level}"><span class="badge">${r.level}</span><div><b>${esc(r.title)}</b>${esc(r.text)}</div></div>`).join('');
  }

  // ---------- transactions ----------
  function fillCatFilter() {
    const sel = $('#fCat');
    sel.innerHTML = '<option value="">All categories</option>' + CATEGORIES.concat(INCOME_CATEGORIES.map((id) => ({ id }))).map((c) => `<option>${esc(c.id)}</option>`).join('');
  }
  function renderTx() {
    const q = $('#search').value.trim().toLowerCase(), ft = $('#fType').value, fc = $('#fCat').value;
    const list = state.transactions
      .filter((t) => (!ft || t.type === ft) && (!fc || t.category === fc) && (!q || (t.merchant + ' ' + t.note).toLowerCase().includes(q)))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    $('#txList').innerHTML = list.length ? list.slice(0, 300).map((t) => `
      <button class="tx" data-id="${t.id}">
        ${t.thumb ? `<img src="${t.thumb}" alt="Receipt">` : `<span class="dot" style="background:${t.type === 'income' ? '#1e88e5' : catColor(t.category)}"></span>`}
        <span class="main"><span class="name">${esc(t.merchant || t.category)}</span><span class="meta">${esc(t.date)} · ${esc(t.category)}${t.note ? ' · ' + esc(t.note) : ''}</span></span>
        <span class="amt ${t.type === 'income' ? 'pos' : ''}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</span>
      </button>`).join('') + (list.length > 300 ? `<p class="muted">Showing the 300 most recent of ${list.length}. Use search to narrow.</p>` : '')
      : '<p class="empty">No transactions yet. Tap “Scan receipt” or “+ Add”.</p>';
  }
  ['search', 'fType', 'fCat'].forEach((id) => $('#' + id).addEventListener('input', renderTx));
  $('#txList').addEventListener('click', (e) => {
    const b = e.target.closest('.tx');
    if (b) openTx(state.transactions.find((t) => t.id === b.dataset.id));
  });

  // ---------- add / edit / scan dialog ----------
  const dlg = $('#txDialog'), form = $('#txForm');
  let editing = null, pendingThumb = null;

  function fillCategories(type, selected) {
    const cats = type === 'income' ? INCOME_CATEGORIES : CATEGORIES.map((c) => c.id);
    form.category.innerHTML = cats.map((c) => `<option>${esc(c)}</option>`).join('');
    if (selected && cats.includes(selected)) form.category.value = selected;
  }
  $$('input[name=type]', form).forEach((r) => r.addEventListener('change', () => fillCategories(form.type.value)));

  function openTx(tx, opts) {
    editing = tx || null; pendingThumb = tx ? tx.thumb || null : null;
    form.reset();
    $('#dlgTitle').textContent = tx ? 'Edit transaction' : opts && opts.scan ? 'Scan receipt' : 'Add transaction';
    $('#delTx').hidden = !tx;
    $('#scanBox').hidden = !(opts && opts.scan);
    $('#suggest').hidden = true;
    $('#receiptImg').hidden = true;
    $('#ocrStatus').textContent = opts && opts.scan ? 'Take a clear, well-lit photo of the receipt.' : '';
    $('#ocrProgress').hidden = true;
    const t = tx || { type: 'expense', date: today(), amount: '', merchant: '', category: 'Miscellaneous', note: '' };
    form.type.value = t.type;
    fillCategories(t.type, t.category);
    form.amount.value = t.amount; form.date.value = t.date; form.merchant.value = t.merchant || ''; form.note.value = t.note || '';
    dlg.showModal();
  }
  $('#addBtn').addEventListener('click', () => openTx(null));
  $('#scanBtn').addEventListener('click', () => { openTx(null, { scan: true }); $('#photo').click(); });
  $('#dlgClose').addEventListener('click', () => dlg.close());
  $('#cancelTx').addEventListener('click', (e) => { e.preventDefault(); dlg.close(); });
  $('#delTx').addEventListener('click', () => {
    if (editing && confirm('Delete this transaction?')) { state.transactions = state.transactions.filter((t) => t !== editing); save(); dlg.close(); refresh(); }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const rec = {
      id: editing ? editing.id : uid(), type: form.type.value, amount: Math.round(parseFloat(form.amount.value) * 100) / 100,
      date: form.date.value, merchant: form.merchant.value.trim(), category: form.category.value, note: form.note.value.trim(),
    };
    if (pendingThumb) rec.thumb = pendingThumb;
    if (editing) Object.keys(rec).forEach((k) => (editing[k] = rec[k])); else state.transactions.push(rec);
    save(); dlg.close(); refresh();
  });

  // ---- receipt OCR ----
  let tessPromise;
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    if (!tessPromise) tessPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload = res; s.onerror = () => { tessPromise = null; rej(new Error('Could not load the OCR engine (are you offline?).')); };
      document.head.appendChild(s);
    });
    return tessPromise;
  }
  function toCanvas(img, max) {
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  function loadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That file could not be read as an image.')); };
      img.src = url;
    });
  }
  $('#photo').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const status = $('#ocrStatus'), prog = $('#ocrProgress');
    try {
      status.textContent = 'Preparing image…';
      const img = await loadImage(file);
      pendingThumb = toCanvas(img, 160).toDataURL('image/jpeg', 0.6);
      $('#receiptImg').src = pendingThumb; $('#receiptImg').hidden = false;
      status.textContent = 'Loading text reader…'; prog.hidden = false; prog.value = 0;
      await loadTesseract();
      const result = await Tesseract.recognize(toCanvas(img, 1600), 'eng', {
        logger: (m) => { if (m.status === 'recognizing text') { prog.value = m.progress; status.textContent = `Reading receipt… ${Math.round(m.progress * 100)}%`; } },
      });
      applyParsed(parseReceipt(result.data.text));
    } catch (err) {
      status.textContent = (err && err.message ? err.message : 'Scan failed.') + ' You can still enter the details by hand.';
    } finally { prog.hidden = true; }
  });
  function applyParsed(r) {
    form.type.value = 'expense'; fillCategories('expense', r.category);
    if (r.total != null) form.amount.value = r.total.toFixed(2);
    if (r.date) form.date.value = r.date;
    if (r.merchant) form.merchant.value = r.merchant;
    const found = [r.total != null && 'amount', r.date && 'date', r.merchant && 'merchant'].filter(Boolean);
    $('#ocrStatus').textContent = found.length ? `Found ${found.join(', ')}. Please check the details below.` : 'Could not find details — please fill them in.';
    const box = $('#suggest');
    const top = r.suggestions.slice(0, 3);
    box.hidden = false;
    box.innerHTML = '<span class="muted">Suggested:</span>' + top.map((s) => `<button type="button" data-c="${esc(s.category)}">${esc(s.category)}</button>`).join('');
    const mark = () => $$('button', box).forEach((b) => b.classList.toggle('on', b.dataset.c === form.category.value));
    mark();
    box.onclick = (e) => { const b = e.target.closest('button'); if (b) { form.category.value = b.dataset.c; mark(); } };
    form.category.onchange = mark;
  }

  // ---------- plan ----------
  function renderPlan() {
    Object.keys(state.plan).forEach((k) => { const el = form2()[k]; if (el && document.activeElement !== el) el.value = state.plan[k]; });
    const t = trackedSpending();
    $('#spendHint').textContent = t.annual ? `Your tracked spending over the last ${t.months} month${t.months > 1 ? 's' : ''} is about ${money(t.annual)} per year.` : 'Add expenses to compare your real spending with this plan.';
    $('#useTracked').disabled = !t.annual;
  }
  const form2 = () => $('#planForm').elements;
  $('#planForm').addEventListener('input', (e) => {
    const el = e.target; if (!el.name) return;
    const v = parseFloat(el.value);
    if (Number.isFinite(v)) { state.plan[el.name] = v; save(); }
  });
  $('#planForm').addEventListener('submit', (e) => e.preventDefault());
  $('#useTracked').addEventListener('click', () => { state.plan.annualExpense = Math.round(trackedSpending().annual); save(); renderPlan(); });

  // ---------- report ----------
  function renderReport() {
    const plan = enginePlan();
    const res = Engine.project(plan), p = res.plan;
    const rows = res.rows;
    const spend = trackedSpending();
    const S = { deferred: '#0e9ac4', free: '#f59e0b', after: '#5fa800', ss: '#8b3dff', pension: '#e83e8c' };

    const sum = [
      `Projected savings at retirement (age ${p.retireAge}): <b>${money(res.savingsAtRetirement)}</b>.`,
      `Total annual contribution: <b>${money(p.contribDeferred + p.contribFree + p.contribAfter)}</b>.`,
      res.survives
        ? `Your savings are projected to last <b>past age ${Engine.END_AGE}</b>.`
        : `Your savings are projected to last until age <b>${res.lastsUntilAge}</b> (around ${new Date().getFullYear() + res.lastsUntilAge - p.age}).`,
      `Estimated spending in your first retirement year: <b>${money(res.firstYearExpense)}</b> (inflation-adjusted).`,
      `Social Security at age ${p.ssAge}: about <b>${money(res.ssAnnualToday / 12)}</b>/month in today's dollars` +
        (p.ssAge < 67 ? `, a <b>${Math.round((1 - Engine.ssFactor(p.ssAge)) * 100)}%</b> reduction versus age 67.` : p.ssAge > 67 ? `, <b>${Math.round((Engine.ssFactor(p.ssAge) - 1) * 100)}%</b> more than at 67.` : '.'),
    ];
    if (rows.some((r) => r.earlyWithdrawal && r.wDeferred > 0)) sum.push('Early withdrawals from <i>tax-deferred</i> accounts before age 59½ may incur a <b>10%</b> penalty.');
    $('#summary').innerHTML = sum.map((s) => `<li>${s}</li>`).join('');

    const ages = rows.map((r) => String(r.age));
    Charts.stackedBars($('#chSavings'), ages, [
      { label: 'After-tax', color: S.after, values: rows.map((r) => r.after) },
      { label: 'Tax-deferred', color: S.deferred, values: rows.map((r) => r.deferred) },
      { label: 'Tax-free', color: S.free, values: rows.map((r) => r.free) },
    ], { xTitle: 'Age', label: 'Savings by age' });

    const ret = rows.filter((r) => r.age >= p.retireAge);
    const ra = ret.map((r) => String(r.age));
    Charts.lines($('#chIncExp'), ra, [
      { label: 'Expense', color: '#e53935', values: ret.map((r) => r.expense) },
      { label: 'Social Security + pension', color: S.ss, values: ret.map((r) => r.ss + r.pension) },
      { label: 'Savings withdrawals', color: '#1e88e5', values: ret.map((r) => r.wAfter + r.wDeferred + r.wFree) },
    ], { xTitle: 'Age', label: 'Retirement income versus expense' });

    Charts.stackedBars($('#chSources'), ra, [
      { label: 'Social Security', color: S.ss, values: ret.map((r) => r.ss) },
      { label: 'Pension', color: S.pension, values: ret.map((r) => r.pension) },
      { label: 'After-tax', color: S.after, values: ret.map((r) => r.wAfter) },
      { label: 'Tax-deferred', color: S.deferred, values: ret.map((r) => r.wDeferred) },
      { label: 'Tax-free', color: S.free, values: ret.map((r) => r.wFree) },
    ], { xTitle: 'Age', label: 'Retirement income sources' });

    const pre = rows.filter((r) => r.age < p.retireAge);
    Charts.stackedBars($('#chContrib'), pre.map((r) => String(r.age)), [
      { label: 'After-tax', color: S.after, values: pre.map((r) => r.contribAfter) },
      { label: 'Tax-deferred', color: S.deferred, values: pre.map((r) => r.contribDeferred) },
      { label: 'Tax-free', color: S.free, values: pre.map((r) => r.contribFree) },
    ], { xTitle: 'Age', label: 'Annual contributions' });

    const sens = Engine.sensitivity(plan);
    const lbl = (d) => (d === 0 ? 'current' : (d > 0 ? '+' : '') + Math.round(d * 100) + '%');
    Charts.groupedBars($('#chAfford'), sens.map((s) => lbl(s.diff)), [
      { label: 'Savings last until age', color: '#fb6a1b', values: sens.map((s) => s.lastsUntilAge) },
    ], { label: 'Savings lifespan at different spending levels', fmt: (v) => String(Math.round(v)) });
    const yr = new Date().getFullYear();
    $('#affordTable').innerHTML = '<tr><th>Annual expense</th><th>Difference</th><th>Last until age</th><th>Last until year</th></tr>' +
      sens.map((s) => `<tr class="${s.diff === 0 ? 'cur' : ''} ${s.survives ? '' : 'bad'}"><td>${money(s.expense)}</td><td>${lbl(s.diff)}</td><td>${s.survives ? Engine.END_AGE + '+' : s.lastsUntilAge}</td><td>${s.survives ? '—' : yr + (s.lastsUntilAge - p.age)}</td></tr>`).join('');

    $('#risks').innerHTML = riskHtml(Engine.assessRisks(plan, spend));
  }

  // ---------- data tools ----------
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $('#exportBtn').addEventListener('click', () => download(`retirement-compass-${today()}.json`, JSON.stringify(state, null, 2), 'application/json'));
  $('#csvBtn').addEventListener('click', () => {
    const cell = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const lines = [['date', 'type', 'amount', 'category', 'merchant', 'note'].join(',')].concat(
      state.transactions.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).map((t) => [t.date, t.type, t.amount, t.category, t.merchant, t.note].map(cell).join(',')));
    download(`transactions-${today()}.csv`, lines.join('\n'), 'text/csv');
  });
  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!s || !Array.isArray(s.transactions)) throw new Error();
      const clean = s.transactions.filter((t) => t && typeof t.amount === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && (t.type === 'income' || t.type === 'expense'))
        .map((t) => ({ id: String(t.id || uid()), type: t.type, amount: t.amount, date: t.date, merchant: String(t.merchant || ''), category: String(t.category || 'Miscellaneous'), note: String(t.note || ''), thumb: typeof t.thumb === 'string' && t.thumb.startsWith('data:image/') ? t.thumb : undefined }));
      if (!confirm(`Replace current data with ${clean.length} transactions from this backup?`)) return;
      state = { plan: Object.assign({}, Engine.DEFAULT_PLAN, s.plan), transactions: clean };
      save(); refresh();
    } catch (err) { toast('That file is not a valid Retirement Compass backup.'); }
  });
  $('#resetBtn').addEventListener('click', () => {
    if (confirm('Delete all transactions and reset your plan? This cannot be undone.')) {
      state = { plan: Object.assign({}, Engine.DEFAULT_PLAN), transactions: [] }; save(); showTab('dashboard');
    }
  });

  // ---------- sample data ----------
  function demo() {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const items = [
      ['Housing', 'Rent / mortgage', 1450, 1], ['Housing', 'Electric & water', 190, 1], ['Housing', 'Internet', 70, 1],
      ['Food', 'Kroger', 130, 5], ['Food', 'Local diner', 38, 3], ['Transportation', 'Shell', 52, 3], ['Healthcare', 'CVS Pharmacy', 45, 2],
      ['Insurance', 'Medicare supplement', 210, 1], ['Leisure', 'Cinema', 28, 2], ['Personal Care', 'Barber', 32, 1], ['Miscellaneous', 'Gifts', 60, 1],
    ];
    const out = []; const now = new Date();
    for (let m = 0; m < 12; m++) {
      const ym = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mk = (day) => `${ym.getFullYear()}-${String(ym.getMonth() + 1).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}`;
      items.forEach(([category, merchant, base, n]) => {
        for (let i = 0; i < n; i++) out.push({ id: uid(), type: 'expense', category, merchant, note: '', amount: Math.round(base * (0.85 + rnd() * 0.3) * 100) / 100, date: mk(1 + Math.floor(rnd() * 28)) });
      });
      out.push({ id: uid(), type: 'income', category: 'Pension', merchant: 'Pension', note: '', amount: 1800, date: mk(1) });
      out.push({ id: uid(), type: 'income', category: 'Investments', merchant: 'Dividends', note: '', amount: Math.round(300 + rnd() * 200), date: mk(15) });
    }
    return out.filter((t) => t.date <= today());
  }
  $('#loadDemo').addEventListener('click', () => { state.transactions = demo(); save(); refresh(); });

  // ---------- init ----------
  fillCatFilter();
  const startTab = location.hash.slice(1);
  showTab(TITLES[startTab] ? startTab : 'dashboard');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
