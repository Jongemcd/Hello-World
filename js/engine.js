/* Retirement projection engine. Pure functions, no DOM: runs in browser and node. */
(function (root) {
  const END_AGE = 95;

  const DEFAULT_PLAN = {
    age: 55,
    retireAge: 62,
    deferred: 450000, // 401k / traditional IRA
    free: 60000, // Roth
    after: 40000, // taxable brokerage / savings
    contribDeferred: 15000,
    contribFree: 5000,
    contribAfter: 3000,
    returnPct: 5,
    inflationPct: 2.5,
    ssAge: 67,
    ssFraMonthly: 2400, // monthly benefit at full retirement age (today's $)
    pensionAnnual: 0,
    pensionAge: 65,
    annualExpense: 60000, // retirement spending, today's $
    taxDeferredPct: 12, // effective tax on tax-deferred withdrawals
  };

  /** Social Security benefit factor vs. full-retirement-age (67) benefit. */
  function ssFactor(claimAge, fra) {
    fra = fra || 67;
    if (claimAge >= fra) return 1 + Math.min(claimAge - fra, 70 - fra) * 0.08;
    const months = Math.round((fra - claimAge) * 12);
    const first = Math.min(months, 36);
    const rest = Math.max(months - 36, 0);
    return 1 - (first * 5) / 900 - (rest * 5) / 1200;
  }

  /**
   * Year-by-year projection.
   * opts: { returnPct, inflationPct, expenseMult, crash }
   * crash applies -20% then -10% returns in the first two retirement years.
   */
  function project(plan, opts) {
    opts = opts || {};
    const p = Object.assign({}, DEFAULT_PLAN, plan);
    const ret = (opts.returnPct != null ? opts.returnPct : p.returnPct) / 100;
    const infl = (opts.inflationPct != null ? opts.inflationPct : p.inflationPct) / 100;
    const mult = opts.expenseMult != null ? opts.expenseMult : 1;
    const tax = Math.min(Math.max(p.taxDeferredPct / 100, 0), 0.6);
    const ssAnnualToday = p.ssFraMonthly * 12 * ssFactor(p.ssAge);

    const b = { deferred: +p.deferred, free: +p.free, after: +p.after };
    const rows = [];
    const thisYear = new Date().getFullYear();
    let depletedAge = null;
    let firstWithdrawalAge = null;

    for (let age = p.age; age <= END_AGE; age++) {
      const yrs = age - p.age;
      const retired = age >= p.retireAge;
      let r = ret;
      if (opts.crash && retired) {
        if (age === p.retireAge) r = -0.2;
        else if (age === p.retireAge + 1) r = -0.1;
      }
      b.deferred *= 1 + r;
      b.free *= 1 + r;
      b.after *= 1 + r;

      const row = {
        age, year: thisYear + yrs,
        contribDeferred: 0, contribFree: 0, contribAfter: 0,
        expense: 0, ss: 0, pension: 0,
        wAfter: 0, wDeferred: 0, wFree: 0, penalty: 0, taxPaid: 0, shortfall: 0,
        earlyWithdrawal: false,
      };

      if (!retired) {
        row.contribDeferred = p.contribDeferred;
        row.contribFree = p.contribFree;
        row.contribAfter = p.contribAfter;
        b.deferred += row.contribDeferred;
        b.free += row.contribFree;
        b.after += row.contribAfter;
      } else {
        const inflF = Math.pow(1 + infl, yrs);
        row.expense = p.annualExpense * mult * inflF;
        if (age >= p.ssAge) row.ss = ssAnnualToday * inflF;
        if (age >= p.pensionAge) row.pension = p.pensionAnnual; // nominal, no COLA
        let need = Math.max(row.expense - row.ss - row.pension, 0);

        // 1) taxable account
        const fromAfter = Math.min(need, b.after);
        b.after -= fromAfter; row.wAfter = fromAfter; need -= fromAfter;
        // 2) tax-deferred, grossed up for tax (+10% penalty before 59.5)
        if (need > 0 && b.deferred > 0) {
          const early = age < 59.5;
          const rate = tax + (early ? 0.1 : 0);
          const gross = Math.min(need / (1 - rate), b.deferred);
          b.deferred -= gross; row.wDeferred = gross;
          row.penalty = early ? gross * 0.1 : 0;
          row.taxPaid = gross * tax;
          row.earlyWithdrawal = early;
          need -= gross * (1 - rate);
        }
        // 3) Roth, tax-free
        if (need > 0 && b.free > 0) {
          const fromFree = Math.min(need, b.free);
          b.free -= fromFree; row.wFree = fromFree; need -= fromFree;
        }
        if (need > 0.5) {
          row.shortfall = need;
          if (depletedAge == null) depletedAge = age;
        }
        if (firstWithdrawalAge == null && row.wAfter + row.wDeferred + row.wFree > 0) firstWithdrawalAge = age;
      }

      row.deferred = b.deferred; row.free = b.free; row.after = b.after;
      row.total = b.deferred + b.free + b.after;
      rows.push(row);
    }

    const atRet = rows.find((r) => r.age === p.retireAge) || rows[0];
    // balance at the start of retirement = prior row's total (before first withdrawal)
    const idx = rows.indexOf(atRet);
    const savingsAtRetirement = idx > 0 ? rows[idx - 1].total : atRet.total;

    return {
      rows, plan: p,
      savingsAtRetirement,
      depletedAge,
      lastsUntilAge: depletedAge == null ? END_AGE : depletedAge - 1,
      survives: depletedAge == null,
      firstYearExpense: p.annualExpense * mult * Math.pow(1 + infl, Math.max(p.retireAge - p.age, 0)),
      ssAnnualToday,
      firstWithdrawalAge,
    };
  }

  /** "How much can I afford?" — lasts-until age at different spending levels. */
  function sensitivity(plan, steps) {
    steps = steps || [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
    const base = Object.assign({}, DEFAULT_PLAN, plan).annualExpense;
    return steps.map((s) => {
      const res = project(plan, { expenseMult: 1 + s });
      return { diff: s, expense: base * (1 + s), lastsUntilAge: res.lastsUntilAge, survives: res.survives };
    });
  }

  /** Plain-language risk list with level: low | medium | high. */
  function assessRisks(plan, spending) {
    const base = project(plan);
    const p = base.plan;
    const out = [];
    const add = (id, title, level, text) => out.push({ id, title, level, text });
    const money = (n) => '$' + Math.round(n).toLocaleString();

    // Longevity
    if (base.survives) {
      add('longevity', 'Running out of money', 'low', `Projected savings last through age ${END_AGE}.`);
    } else {
      const lvl = base.lastsUntilAge < 85 ? 'high' : 'medium';
      add('longevity', 'Running out of money', lvl,
        `Savings are projected to run out around age ${base.lastsUntilAge}. Consider retiring later, spending less, or saving more.`);
    }

    // Withdrawal rate
    const firstRow = base.rows.find((r) => r.age === p.retireAge);
    if (firstRow) {
      const draw = firstRow.wAfter + firstRow.wDeferred + firstRow.wFree;
      const rate = base.savingsAtRetirement > 0 ? draw / base.savingsAtRetirement : 1;
      const lvl = rate > 0.05 ? 'high' : rate > 0.04 ? 'medium' : 'low';
      add('withdrawal', 'Withdrawal rate', lvl,
        `First-year withdrawals are ${(rate * 100).toFixed(1)}% of savings (${money(draw)}). A common guideline is about 4% or less.`);
    }

    // Sequence of returns
    const crash = project(plan, { crash: true });
    const lost = base.lastsUntilAge - crash.lastsUntilAge;
    add('sequence', 'Market drop early in retirement', lost >= 5 ? 'high' : lost >= 1 ? 'medium' : 'low',
      crash.survives
        ? 'A -20% then -10% market drop in your first two retirement years would not exhaust your savings.'
        : `A -20% then -10% drop in your first two retirement years would cut your savings' life to age ${crash.lastsUntilAge} (${lost} yrs sooner).`);

    // Inflation
    const hi = project(plan, { inflationPct: p.inflationPct + 1.5 });
    const il = base.lastsUntilAge - hi.lastsUntilAge;
    add('inflation', 'Higher inflation', il >= 5 ? 'high' : il >= 1 ? 'medium' : 'low',
      hi.survives ? 'Inflation 1.5 points higher than assumed would not exhaust your savings.'
        : `Inflation 1.5 points higher would shorten your savings by ${il} yrs (to age ${hi.lastsUntilAge}).`);

    // Early withdrawal penalty
    const early = base.rows.filter((r) => r.earlyWithdrawal && r.wDeferred > 0);
    if (early.length) {
      const pen = early.reduce((s, r) => s + r.penalty, 0);
      add('penalty', 'Early-withdrawal penalty', 'medium',
        `You draw from tax-deferred accounts before 59½, costing about ${money(pen)} in 10% penalties. Consider using taxable/Roth money first or retiring later.`);
    }

    // Social Security claiming
    if (p.ssAge < 67) {
      const cut = Math.round((1 - ssFactor(p.ssAge)) * 100);
      add('ss', 'Claiming Social Security early', cut >= 20 ? 'medium' : 'low',
        `Claiming at ${p.ssAge} permanently reduces your benefit by ${cut}% versus age 67.`);
    }

    // Bridge years before Social Security
    const bridge = p.ssAge - p.retireAge;
    if (bridge >= 5) {
      add('bridge', 'Gap before Social Security', 'medium',
        `You spend ${bridge} years funding all expenses from savings before Social Security begins.`);
    }

    // Tracked spending vs plan
    if (spending && spending.annual > 0) {
      const ratio = spending.annual / p.annualExpense;
      if (ratio > 1.1) {
        add('spending', 'Actual spending above plan', ratio > 1.3 ? 'high' : 'medium',
          `Your tracked spending (${money(spending.annual)}/yr) is ${Math.round((ratio - 1) * 100)}% above the ${money(p.annualExpense)} planned.`);
      } else {
        add('spending', 'Actual spending vs plan', 'low',
          `Your tracked spending (${money(spending.annual)}/yr) is within plan (${money(p.annualExpense)}).`);
      }
    }

    // Healthcare reminder
    if (p.retireAge < 65) {
      add('healthcare', 'Healthcare before Medicare', 'medium',
        `Retiring at ${p.retireAge} leaves ${65 - p.retireAge} years before Medicare. Make sure your expenses include insurance premiums.`);
    }
    return out;
  }

  const api = { END_AGE, DEFAULT_PLAN, ssFactor, project, sensitivity, assessRisks };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
