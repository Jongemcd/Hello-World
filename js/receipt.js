/* Receipt helpers: category suggestion + OCR text parsing. OCR itself runs in the browser (Tesseract.js). */
(function (root) {
  const CATEGORIES = [
    { id: 'Housing', color: '#f2c200' },
    { id: 'Healthcare', color: '#4caf50' },
    { id: 'Transportation', color: '#2196f3' },
    { id: 'Food', color: '#5c6bc0' },
    { id: 'Personal Care', color: '#ab47bc' },
    { id: 'Insurance', color: '#8d6e63' },
    { id: 'Leisure', color: '#ef5350' },
    { id: 'Miscellaneous', color: '#ffa726' },
  ];
  const INCOME_CATEGORIES = ['Social Security', 'Pension', 'Salary', 'Investments', 'Other income'];

  const KEYWORDS = {
    Housing: ['rent', 'mortgage', 'hardware', 'home depot', 'lowe', 'lowes', 'electric', 'utility', 'utilities', 'water', 'gas company', 'internet', 'comcast', 'verizon', 'plumb', 'furniture', 'ikea', 'property tax', 'hoa', 'lawn', 'repair'],
    Healthcare: ['pharmacy', 'cvs', 'walgreens', 'rite aid', 'rx', 'clinic', 'dental', 'dentist', 'doctor', 'hospital', 'medical', 'optical', 'vision', 'lab', 'urgent care', 'prescription', 'copay'],
    Transportation: ['shell', 'chevron', 'exxon', 'bp', 'mobil', 'fuel', 'gasoline', 'unleaded', 'parking', 'uber', 'lyft', 'toll', 'auto', 'tire', 'oil change', 'car wash', 'transit', 'airlines', 'airline'],
    Food: ['grocery', 'market', 'supermarket', 'kroger', 'safeway', 'publix', 'walmart', 'costco', 'aldi', 'trader joe', 'whole foods', 'restaurant', 'cafe', 'coffee', 'starbucks', 'pizza', 'burger', 'diner', 'bakery', 'deli', 'mcdonald', 'subway', 'grill', 'kitchen'],
    'Personal Care': ['salon', 'barber', 'spa', 'beauty', 'sephora', 'ulta', 'cosmetic', 'haircut', 'nail', 'massage', 'gym', 'fitness'],
    Insurance: ['insurance', 'geico', 'allstate', 'state farm', 'progressive', 'premium', 'policy'],
    Leisure: ['cinema', 'theater', 'theatre', 'movie', 'netflix', 'spotify', 'golf', 'resort', 'hotel', 'travel', 'museum', 'tickets', 'bar', 'pub', 'brewery', 'books', 'hobby', 'game', 'cruise'],
  };

  /** Rank categories by keyword hits in text. Returns [{category, score}] best first (never empty). */
  function suggestCategories(text) {
    const t = ' ' + String(text || '').toLowerCase() + ' ';
    const scores = [];
    for (const cat of Object.keys(KEYWORDS)) {
      let s = 0;
      for (const kw of KEYWORDS[cat]) {
        const re = new RegExp('(^|[^a-z])' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)', 'g');
        const m = t.match(re);
        if (m) s += m.length * (kw.includes(' ') ? 2 : 1);
      }
      if (s > 0) scores.push({ category: cat, score: s });
    }
    scores.sort((a, b) => b.score - a.score);
    if (!scores.length) scores.push({ category: 'Miscellaneous', score: 0 });
    return scores;
  }

  const AMOUNT_RE = /(?:\$\s*)?(\d{1,3}(?:,\d{3})*|\d+)[.,](\d{2})\b/g;

  function amountsIn(line) {
    const out = [];
    let m;
    AMOUNT_RE.lastIndex = 0;
    while ((m = AMOUNT_RE.exec(line))) out.push(parseFloat(m[1].replace(/,/g, '') + '.' + m[2]));
    return out;
  }

  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const iso = (y, m, d) => {
    if (y < 100) y += 2000;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  function findDate(text) {
    let m = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (m) { const r = iso(+m[1], +m[2], +m[3]); if (r) return r; }
    m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
    if (m) { const r = iso(+m[3], +m[1], +m[2]); if (r) return r; }
    m = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i);
    if (m) { const r = iso(+m[3], MONTHS.indexOf(m[1].toLowerCase()) + 1, +m[2]); if (r) return r; }
    return null;
  }

  /** Extract { merchant, total, date, category suggestions } from raw OCR text. */
  function parseReceipt(text) {
    const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let total = null;
    // Prefer the last line labelled total/amount due/balance (but not subtotal / tax).
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i];
      if (/sub\s*-?\s*total|tax|change|tender|savings/i.test(l)) continue;
      if (/\b(grand\s+)?total\b|amount\s+due|balance\s+due|\bdue\b|amount\b/i.test(l)) {
        const a = amountsIn(l);
        if (a.length) { total = a[a.length - 1]; break; }
      }
    }
    if (total == null) {
      const all = lines.flatMap(amountsIn);
      if (all.length) total = Math.max.apply(null, all);
    }

    const merchantLine = lines.find((l) => /[A-Za-z]{3,}/.test(l) && !/^\W*(receipt|invoice|welcome|thank)/i.test(l) && amountsIn(l).length === 0);
    const merchant = merchantLine ? merchantLine.replace(/[^A-Za-z0-9&'.\- ]/g, '').trim().slice(0, 40) : '';

    const suggestions = suggestCategories(text);
    return { merchant, total, date: findDate(text), suggestions, category: suggestions[0].category };
  }

  const api = { CATEGORIES, INCOME_CATEGORIES, suggestCategories, parseReceipt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Receipt = api;
})(typeof window !== 'undefined' ? window : globalThis);
