/* ChintasMoney — data & memory layer
 * -----------------------------------------------------------------------------
 * This is the "financial memory" of the product. In the MVP it persists to the
 * browser's localStorage. Every read/write goes through this module so that a
 * real backend (API + database) can replace it later WITHOUT touching the UI.
 *
 * >>> DEV NOTE: All market/price figures here are clearly-labelled MOCK data.
 *     Real broker / market-data / filings integrations plug in via adapters
 *     (see adapters.marketData) — no fake "live" integrations are claimed.
 * ---------------------------------------------------------------------------*/
(function (global) {
  "use strict";

  var KEY = "chintasmoney.state.v1";

  // ---- Plan configuration (admin-configurable; NOT hard-coded as final) ------
  var PLANS = {
    free: {
      id: "free", name: "Free", price: 0, cadence: "forever",
      blurb: "Start understanding your money.",
      features: ["portfolio-tracking", "basic-analysis", "money-dashboard", "decision-journal-limited", "chinta-ai-limited"],
      limits: { decisions: 10, aiQuestions: 5, theses: 3 }
    },
    plus: {
      id: "plus", name: "Plus", price: 399, cadence: "month",
      blurb: "Your full financial memory.",
      features: ["portfolio-tracking", "basic-analysis", "money-dashboard", "decision-journal", "thesis-tracking",
                 "portfolio-xray", "money-health", "what-changed", "monthly-review", "advanced-reports"],
      limits: { decisions: Infinity, aiQuestions: 100, theses: Infinity }
    },
    pro: {
      id: "pro", name: "Pro", price: 1199, cadence: "month",
      blurb: "Investor + trader intelligence.",
      features: ["everything-plus", "investor-mode", "trader-mode", "portfolio-autopsy", "behavioural-patterns",
                 "advanced-alerts", "scenario-analysis", "ai-research", "document-intelligence"],
      limits: { decisions: Infinity, aiQuestions: 1000, theses: Infinity }
    }
  };

  // Which nav areas each capability unlocks (used for soft paywall gating).
  var FEATURE_MATRIX = {
    home: "free", chinta: "free", money: "free", investments: "free",
    decisions: "free", goals: "free", profile: "free", documents: "free",
    thesis: "plus", changed: "plus", reports: "plus", review: "plus",
    trading: "pro", tools: "pro"
  };
  var PLAN_RANK = { free: 0, plus: 1, pro: 2 };

  function planAllows(planId, area) {
    var need = FEATURE_MATRIX[area] || "free";
    return PLAN_RANK[planId] >= PLAN_RANK[need];
  }

  // ---- Seed data (MOCK — for first-run demo only) ----------------------------
  function seed() {
    var today = new Date();
    function daysAgo(n) { var d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString(); }

    return {
      meta: { createdAt: new Date().toISOString(), seeded: true },
      profile: {
        name: "", persona: null, currency: "₹",
        onboarded: false, plan: "free",
        reviewCadence: "monthly"
      },
      usage: { aiQuestions: 0 },
      // Holdings — MOCK prices. cost = avg buy, ltp = last traded price (mock).
      holdings: [
        { id: "h1", ticker: "TCS", name: "Tata Consultancy Services", type: "stock", sector: "IT", qty: 12, cost: 3450, ltp: 3890, thesisId: "t1", addedAt: daysAgo(220) },
        { id: "h2", ticker: "HDFCBANK", name: "HDFC Bank", type: "stock", sector: "Financials", qty: 30, cost: 1610, ltp: 1498, thesisId: "t2", addedAt: daysAgo(180) },
        { id: "h3", ticker: "TATAMOTORS", name: "Tata Motors", type: "stock", sector: "Auto", qty: 40, cost: 720, ltp: 985, thesisId: "t3", addedAt: daysAgo(140) },
        { id: "h4", ticker: "ZOMATO", name: "Zomato", type: "stock", sector: "Consumer Tech", qty: 200, cost: 195, ltp: 168, thesisId: null, addedAt: daysAgo(60) },
        { id: "h5", ticker: "PPFAS", name: "Parag Parikh Flexi Cap", type: "fund", sector: "Diversified", qty: 350, cost: 62, ltp: 78, thesisId: "t4", addedAt: daysAgo(300) },
        { id: "h6", ticker: "GOLDBEES", name: "Nippon Gold ETF", type: "etf", sector: "Commodities", qty: 100, cost: 52, ltp: 61, thesisId: null, addedAt: daysAgo(90) }
      ],
      // Investment theses — the heart of the product.
      theses: [
        { id: "t1", ticker: "TCS", title: "Steady compounder on digital demand",
          horizon: "long", createdAt: daysAgo(220),
          reasons: ["Durable IT services demand", "Consistent margins > 24%", "Strong free cash flow & buybacks"],
          expectations: [{ metric: "Revenue growth", expected: "8–10% p.a." }, { metric: "Operating margin", expected: "≥ 24%" }],
          breaks: ["Margins fall below 22% for 2+ quarters", "Attrition spikes and pricing power erodes"],
          health: "green" },
        { id: "t2", ticker: "HDFCBANK", title: "Best-in-class franchise, merger digestion",
          horizon: "long", createdAt: daysAgo(180),
          reasons: ["Premium deposit franchise", "Merger to expand mortgage book", "Historically high ROA"],
          expectations: [{ metric: "NIM", expected: "≥ 3.8%" }, { metric: "Loan growth", expected: "double digits" }],
          breaks: ["NIM compresses below 3.4%", "Deposit growth lags loan growth for 3+ quarters"],
          health: "yellow" },
        { id: "t3", ticker: "TATAMOTORS", title: "Turnaround + JLR recovery",
          horizon: "medium", createdAt: daysAgo(140),
          reasons: ["JLR margins recovering", "India CV cycle upturn", "Deleveraging story"],
          expectations: [{ metric: "Net debt", expected: "falling" }, { metric: "JLR EBIT margin", expected: "improving" }],
          breaks: ["JLR demand rolls over", "Net auto debt rises again"],
          health: "green" },
        { id: "t4", ticker: "PPFAS", title: "Core long-term SIP vehicle",
          horizon: "long", createdAt: daysAgo(300),
          reasons: ["Sensible flexi-cap mandate", "Low churn, value discipline"],
          expectations: [{ metric: "Rolling 5y return", expected: "beat Nifty 500" }],
          breaks: ["Style drift", "Persistent 3y+ underperformance vs benchmark"],
          health: "green" }
      ],
      // Decision journal — every meaningful money decision.
      decisions: [
        { id: "d1", date: daysAgo(60), kind: "buy", instrument: "ZOMATO",
          text: "Bought 200 Zomato on momentum after breakout.",
          reason: "Breakout above consolidation; expected continuation.",
          expected: "10–15% swing over 4–6 weeks.", risk: "high", horizon: "short",
          thesisRecorded: false, outcome: null },
        { id: "d2", date: daysAgo(140), kind: "buy", instrument: "TATAMOTORS",
          text: "Added Tata Motors for JLR turnaround.",
          reason: "JLR margin recovery + India CV upcycle.",
          expected: "Re-rating over 12–18 months.", risk: "medium", horizon: "medium",
          thesisRecorded: true, outcome: null },
        { id: "d3", date: daysAgo(30), kind: "sip", instrument: "PPFAS",
          text: "Increased SIP by ₹5,000/month.",
          reason: "Salary hike; raising savings rate.",
          expected: "Long-term compounding.", risk: "low", horizon: "long",
          thesisRecorded: true, outcome: null }
      ],
      // Goals
      goals: [
        { id: "g1", name: "Emergency fund", target: 600000, current: 380000, dueMonths: 8, priority: "high" },
        { id: "g2", name: "Home down payment", target: 2500000, current: 1350000, dueMonths: 30, priority: "high" },
        { id: "g3", name: "Retirement corpus", target: 30000000, current: 4200000, dueMonths: 300, priority: "medium" }
      ],
      // Personal money snapshot (Money Mode)
      money: {
        monthlyIncome: 165000, monthlyExpense: 98000,
        cash: 380000, emergencyMonths: 3.9,
        debts: [{ name: "Home loan", balance: 3800000, emi: 34000, rate: 8.6 },
                { name: "Car loan", balance: 420000, emi: 12500, rate: 9.4 }],
        insurance: { term: true, health: true, termCover: 10000000, healthCover: 1000000 }
      },
      // "What changed" feed items (MOCK signals — would come from data adapters)
      changes: [
        { id: "c1", ticker: "HDFCBANK", severity: "yellow", title: "Valuation moved meaningfully",
          detail: "Price is ~7% below your average cost and P/B is at the low end of its 5-year range.",
          matters: "You hold 30 shares and your thesis expects NIM ≥ 3.8% — worth a review.", date: daysAgo(1) },
        { id: "c2", ticker: "ZOMATO", severity: "red", title: "Momentum thesis weakening",
          detail: "Price is ~14% below your entry and below the breakout level you bought.",
          matters: "This position has NO recorded thesis — one of your risk flags.", date: daysAgo(2) },
        { id: "c3", ticker: "TCS", severity: "green", title: "Guidance improved",
          detail: "Management commentary on deal pipeline was more positive this quarter (mock).",
          matters: "Supports your 'steady compounder' thesis.", date: daysAgo(3) }
      ]
    };
  }

  // ---- Persistence -----------------------------------------------------------
  var _state = null;

  function load() {
    if (_state) return _state;
    try {
      var raw = localStorage.getItem(KEY);
      _state = raw ? JSON.parse(raw) : seed();
    } catch (e) { _state = seed(); }
    return _state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(_state)); } catch (e) {}
  }
  function reset() { _state = seed(); save(); return _state; }
  function uid(p) { return (p || "id") + Math.random().toString(36).slice(2, 9); }

  // ---- Derived analytics -----------------------------------------------------
  function invested(h) { return h.qty * h.cost; }
  function value(h) { return h.qty * h.ltp; }
  function pnl(h) { return value(h) - invested(h); }

  function portfolioStats() {
    var s = load();
    var inv = 0, val = 0;
    s.holdings.forEach(function (h) { inv += invested(h); val += value(h); });
    var bySector = {};
    s.holdings.forEach(function (h) { bySector[h.sector] = (bySector[h.sector] || 0) + value(h); });
    var top = null;
    Object.keys(bySector).forEach(function (k) { if (!top || bySector[k] > bySector[top]) top = k; });
    var concentration = val ? (bySector[top] / val) : 0;
    var untracked = s.holdings.filter(function (h) { return !h.thesisId; }).length;
    return {
      invested: inv, value: val, pnl: val - inv,
      pnlPct: inv ? (val - inv) / inv : 0,
      bySector: bySector, topSector: top, concentration: concentration,
      untracked: untracked, holdings: s.holdings.length
    };
  }

  function moneyHealth() {
    var s = load(), m = s.money;
    var savingsRate = m.monthlyIncome ? (m.monthlyIncome - m.monthlyExpense) / m.monthlyIncome : 0;
    var totalEmi = m.debts.reduce(function (a, d) { return a + d.emi; }, 0);
    var emiRatio = m.monthlyIncome ? totalEmi / m.monthlyIncome : 0;
    var pf = portfolioStats();
    var items = [
      { key: "Emergency fund", ok: m.emergencyMonths >= 6, level: m.emergencyMonths >= 6 ? "green" : (m.emergencyMonths >= 3 ? "yellow" : "red"),
        note: m.emergencyMonths.toFixed(1) + " months of expenses (target: 6)" },
      { key: "Savings rate", ok: savingsRate >= 0.2, level: savingsRate >= 0.2 ? "green" : (savingsRate >= 0.1 ? "yellow" : "red"),
        note: Math.round(savingsRate * 100) + "% of income saved (target: 20%+)" },
      { key: "Debt burden", ok: emiRatio <= 0.35, level: emiRatio <= 0.35 ? "green" : (emiRatio <= 0.45 ? "yellow" : "red"),
        note: Math.round(emiRatio * 100) + "% of income to EMIs (target: <35%)" },
      { key: "Concentration", ok: pf.concentration <= 0.35, level: pf.concentration <= 0.35 ? "green" : (pf.concentration <= 0.5 ? "yellow" : "red"),
        note: Math.round(pf.concentration * 100) + "% in " + (pf.topSector || "one sector") + " (watch above 35%)" },
      { key: "Protection", ok: s.money.insurance.term && s.money.insurance.health, level: (s.money.insurance.term && s.money.insurance.health) ? "green" : "yellow",
        note: (s.money.insurance.term ? "Term ✓ " : "No term ✕ ") + (s.money.insurance.health ? "Health ✓" : "No health ✕") },
      { key: "Untracked positions", ok: pf.untracked === 0, level: pf.untracked === 0 ? "green" : (pf.untracked <= 2 ? "yellow" : "red"),
        note: pf.untracked + " holding(s) with no recorded thesis" }
    ];
    var score = Math.round(items.filter(function (i) { return i.level === "green"; }).length / items.length * 100);
    return { items: items, score: score, savingsRate: savingsRate, emiRatio: emiRatio };
  }

  // Observable behavioural patterns (from the user's OWN data only).
  function patterns() {
    var s = load();
    var out = [];
    var noThesis = s.holdings.filter(function (h) { return !h.thesisId; });
    if (noThesis.length) {
      out.push("Two of your positions (" + noThesis.map(function (h) { return h.ticker; }).join(", ") +
        ") have no recorded thesis — your worst outcomes historically cluster here.");
    }
    var pf = portfolioStats();
    if (pf.concentration > 0.35) {
      out.push("Your portfolio is " + Math.round(pf.concentration * 100) + "% concentrated in " + pf.topSector + ".");
    }
    var momentumBuys = s.decisions.filter(function (d) { return d.kind === "buy" && /momentum|breakout/i.test(d.reason || ""); });
    if (momentumBuys.length) {
      out.push("You have " + momentumBuys.length + " momentum/breakout entry(ies) — a short-horizon pattern worth reviewing against outcomes.");
    }
    return out;
  }

  // ---- Adapter layer (interfaces for future real integrations) ---------------
  // Each adapter returns clearly-labelled mock data in dev. Swap implementation
  // for a real API client without changing callers.
  var adapters = {
    marketData: {
      isLive: false,
      quote: function (ticker) {
        var h = load().holdings.filter(function (x) { return x.ticker === ticker; })[0];
        return { ticker: ticker, price: h ? h.ltp : null, source: "MOCK", asOf: new Date().toISOString() };
      }
    },
    payments: { isLive: false, checkout: function () { return { ok: false, reason: "Payments not wired in MVP (mock)." }; } }
  };

  // ---- Public API ------------------------------------------------------------
  global.CM = {
    PLANS: PLANS, FEATURE_MATRIX: FEATURE_MATRIX, planAllows: planAllows,
    load: load, save: save, reset: reset, uid: uid, adapters: adapters,
    invested: invested, value: value, pnl: pnl,
    portfolioStats: portfolioStats, moneyHealth: moneyHealth, patterns: patterns,
    // mutations
    setProfile: function (patch) { Object.assign(load().profile, patch); save(); },
    addDecision: function (d) { d.id = uid("d"); d.date = new Date().toISOString(); load().decisions.unshift(d); save(); return d; },
    addThesis: function (t) { t.id = uid("t"); t.createdAt = new Date().toISOString(); t.health = t.health || "green"; load().theses.unshift(t); save(); return t; },
    addHolding: function (h) { h.id = uid("h"); h.addedAt = new Date().toISOString(); load().holdings.push(h); save(); return h; },
    findThesis: function (id) { return load().theses.filter(function (t) { return t.id === id; })[0]; }
  };
})(window);
