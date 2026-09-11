/* ChintasMoney — MVP application (client-side SPA)
 * Router + views for the core decision-intelligence loop.
 * All data flows through window.CM (store.js). Market figures are MOCK.
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";
  var root = document.getElementById("root");
  var CM = window.CM;

  // ---- helpers -------------------------------------------------------------
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function fmt(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function fmtShort(n) {
    var a = Math.abs(n);
    if (a >= 1e7) return "₹" + (n / 1e7).toFixed(2) + "Cr";
    if (a >= 1e5) return "₹" + (n / 1e5).toFixed(2) + "L";
    if (a >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "k";
    return "₹" + Math.round(n);
  }
  function pct(n) { return (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%"; }
  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function daysSince(iso) { return Math.round((Date.now() - new Date(iso)) / 86400000); }
  function ago(iso) { var d = daysSince(iso); return d <= 0 ? "today" : d === 1 ? "yesterday" : d + "d ago"; }

  // ---- navigation config ---------------------------------------------------
  var NAV = [
    { id: "home", label: "Home", ic: "◎" },
    { id: "chinta", label: "Chinta AI", ic: "✦" },
    { sep: true, group: "Understand" },
    { id: "money", label: "My Money", ic: "❤" },
    { id: "investments", label: "Investments", ic: "▤" },
    { id: "trading", label: "Trading", ic: "⇅" },
    { sep: true, group: "Remember" },
    { id: "decisions", label: "Decisions", ic: "✎" },
    { id: "thesis", label: "Thesis", ic: "◈" },
    { id: "goals", label: "Goals", ic: "◇" },
    { sep: true, group: "Observe & Review" },
    { id: "changed", label: "What Changed", ic: "⟳" },
    { id: "reports", label: "Reports", ic: "▦" },
    { id: "review", label: "Money Review", ic: "☑" },
    { id: "tools", label: "Search My Money", ic: "⌕" },
    { id: "documents", label: "Documents", ic: "▣" },
    { sep: true },
    { id: "profile", label: "Profile & Plan", ic: "☰" }
  ];

  // ---- router --------------------------------------------------------------
  var mobileOpen = false;
  function route() { return (location.hash.replace(/^#\/?/, "") || "home"); }
  function go(r) { location.hash = "#/" + r; }
  window.addEventListener("hashchange", render);

  function render() {
    var s = CM.load();
    if (!s.profile.onboarded) { renderOnboarding(); return; }
    var r = route();
    root.innerHTML = "";
    root.appendChild(shell(r));
  }

  // ---- app shell -----------------------------------------------------------
  function shell(r) {
    var s = CM.load();
    var wrap = el('<div class="app"></div>');

    // sidebar
    var side = el('<aside class="sidebar' + (mobileOpen ? " open" : "") + '"></aside>');
    side.appendChild(el(
      '<a class="brand" href="../index.html">' +
      '<span class="brand-badge">₹</span><div><b>ChintasMoney</b><small>LESS CHINTA · MORE CLARITY</small></div></a>'));
    NAV.forEach(function (n) {
      if (n.sep) { side.appendChild(el('<div class="nav-sep"></div>')); if (n.group) side.appendChild(el('<div style="color:#6f83ab;font-size:.68rem;letter-spacing:.08em;padding:2px 10px 4px">' + n.group.toUpperCase() + '</div>')); return; }
      var locked = !CM.planAllows(s.profile.plan, n.id);
      var a = el('<a class="nav-item' + (r === n.id ? " active" : "") + '" href="#/' + n.id + '">' +
        '<span class="ic">' + n.ic + '</span><span>' + n.label + '</span>' +
        (locked ? '<span class="lock">🔒</span>' : '') + '</a>');
      a.addEventListener("click", function () { mobileOpen = false; });
      side.appendChild(a);
    });
    var plan = CM.PLANS[s.profile.plan];
    side.appendChild(el('<div class="side-foot"><span class="plan-pill">● ' + plan.name + ' plan</span></div>'));
    wrap.appendChild(side);
    if (mobileOpen) { var scrim = el('<div class="scrim"></div>'); scrim.addEventListener("click", function () { mobileOpen = false; render(); }); wrap.appendChild(scrim); }

    // main
    var main = el('<main class="main"></main>');
    var view = VIEWS[r] || VIEWS.home;
    if (!CM.planAllows(s.profile.plan, r)) { main.appendChild(paywall(r)); }
    else { main.appendChild(view()); }
    wrap.appendChild(main);
    return wrap;
  }

  function topbar(title, sub, actions) {
    var bar = el('<div class="topbar"></div>');
    var mb = el('<button class="btn btn-sm menu-btn">☰</button>');
    mb.addEventListener("click", function () { mobileOpen = true; render(); });
    bar.appendChild(mb);
    bar.appendChild(el('<div><h1>' + title + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>'));
    bar.appendChild(el('<div class="spacer"></div>'));
    (actions || []).forEach(function (a) { bar.appendChild(a); });
    return bar;
  }

  function paywall(area) {
    var need = CM.FEATURE_MATRIX[area] || "plus";
    var plan = CM.PLANS[need];
    var wrap = el('<div></div>');
    wrap.appendChild(topbar("Locked feature", "This area is part of the " + plan.name + " plan"));
    var c = el('<div class="card paywall"><div class="lock-ic">🔒</div>' +
      '<h3>Unlock ' + area.charAt(0).toUpperCase() + area.slice(1) + '</h3>' +
      '<p class="hint">Included in <b>' + plan.name + '</b> — ' + plan.blurb + '</p></div>');
    var btn = el('<button class="btn btn-primary" style="margin-top:8px">Upgrade to ' + plan.name + '</button>');
    btn.addEventListener("click", function () { go("profile"); });
    c.appendChild(btn);
    wrap.appendChild(c);
    return wrap;
  }

  function levelBadge(level, label) {
    var m = { green: "b-green", yellow: "b-yellow", red: "b-red" };
    var t = label || ({ green: "Intact", yellow: "Needs review", red: "Broken" })[level];
    return '<span class="badge ' + m[level] + '">● ' + t + '</span>';
  }

  // ==========================================================================
  // VIEWS
  // ==========================================================================
  var VIEWS = {};

  // ---- HOME: "What needs your attention?" ----------------------------------
  VIEWS.home = function () {
    var s = CM.load(), pf = CM.portfolioStats(), mh = CM.moneyHealth();
    var v = el('<div></div>');
    var addBtn = el('<button class="btn btn-primary">+ Record a decision</button>');
    addBtn.addEventListener("click", function () { go("decisions"); });
    v.appendChild(topbar("What needs your attention?", "Hi " + (s.profile.name || "there") + " — here's what changed and what to review.", [addBtn]));

    // stat row
    var stats = el('<div class="grid g4"></div>');
    stats.appendChild(statCard("Portfolio value", fmtShort(pf.value), pct(pf.pnlPct), pf.pnl >= 0));
    stats.appendChild(statCard("Money health", mh.score + "/100", mh.score >= 70 ? "Healthy" : "Needs work", mh.score >= 70));
    stats.appendChild(statCard("Thesis alerts", String(s.theses.filter(function (t) { return t.health !== "green"; }).length), "need review", false, true));
    stats.appendChild(statCard("Untracked", String(pf.untracked), "no thesis recorded", pf.untracked === 0));
    v.appendChild(stats);

    var cols = el('<div class="grid g2" style="margin-top:16px; align-items:start"></div>');

    // What changed that matters to YOU
    var wc = el('<div class="card"></div>');
    wc.appendChild(el('<div class="card-hd"><h3>What changed that matters to you</h3><span class="mock-tag">MOCK SIGNALS</span></div>'));
    s.changes.forEach(function (c) {
      wc.appendChild(el('<div class="attn"><div class="dot ' + c.severity + '"></div><div>' +
        '<div class="t">' + esc(c.ticker) + ' — ' + esc(c.title) + '</div>' +
        '<div class="d">' + esc(c.detail) + '</div>' +
        '<div class="why">Why this matters: ' + esc(c.matters) + '</div></div></div>'));
    });
    var wcMore = el('<button class="btn btn-ghost btn-sm" style="margin-top:8px">See all →</button>');
    wcMore.addEventListener("click", function () { go("changed"); });
    wc.appendChild(wcMore);
    cols.appendChild(wc);

    // Right column: thesis alerts + upcoming
    var right = el('<div class="grid" style="gap:16px"></div>');
    var ta = el('<div class="card"></div>');
    ta.appendChild(el('<div class="card-hd"><h3>Thesis alerts</h3></div>'));
    s.theses.forEach(function (t) {
      ta.appendChild(el('<div class="attn"><div class="dot ' + t.health + '"></div><div>' +
        '<div class="t">' + esc(t.ticker) + ' ' + levelBadge(t.health) + '</div>' +
        '<div class="d">' + esc(t.title) + '</div></div></div>'));
    });
    right.appendChild(ta);

    var nx = el('<div class="card"></div>');
    nx.appendChild(el('<div class="card-hd"><h3>Next Money Review</h3></div>'));
    nx.appendChild(el('<p class="hint">Your <b>' + s.profile.reviewCadence + '</b> review compiles what changed, what worked, and what needs attention.</p>'));
    var nxb = el('<button class="btn btn-primary btn-sm">Generate my review</button>');
    nxb.addEventListener("click", function () { go("review"); });
    nx.appendChild(nxb);
    right.appendChild(nx);
    cols.appendChild(right);

    v.appendChild(cols);
    return v;
  };
  function statCard(lbl, val, note, good, warn) {
    var cls = warn ? "" : (good ? "pos" : "neg");
    return el('<div class="card stat"><span class="lbl">' + lbl + '</span>' +
      '<span class="val">' + val + '</span>' +
      '<span class="' + cls + '" style="font-size:.82rem;font-weight:600">' + note + '</span></div>');
  }

  // ---- INVESTMENTS: holdings + X-ray ---------------------------------------
  VIEWS.investments = function () {
    var s = CM.load(), pf = CM.portfolioStats();
    var v = el('<div></div>');
    var add = el('<button class="btn btn-primary">+ Add holding</button>');
    add.addEventListener("click", addHoldingDialog);
    v.appendChild(topbar("Investments", "“Do I still believe in what I own?”", [add]));
    v.appendChild(el('<div class="notice">Prices below are <b>mock</b> demo data. Connect a broker/market-data source later via the adapter layer.</div>'));

    var tbl = el('<div class="card" style="margin-top:16px; overflow-x:auto"><table class="tbl"><thead><tr>' +
      '<th>Holding</th><th>Type</th><th class="num">Qty</th><th class="num">Avg</th><th class="num">LTP</th>' +
      '<th class="num">Value</th><th class="num">P&L</th><th>Thesis</th><th></th></tr></thead><tbody></tbody></table></div>');
    var tb = tbl.querySelector("tbody");
    s.holdings.forEach(function (h) {
      var p = CM.pnl(h), pp = p / CM.invested(h);
      var tr = el('<tr>' +
        '<td><b>' + esc(h.ticker) + '</b><div class="hint">' + esc(h.name) + '</div></td>' +
        '<td><span class="chip">' + h.type + '</span></td>' +
        '<td class="num">' + h.qty + '</td><td class="num">' + fmt(h.cost) + '</td><td class="num">' + fmt(h.ltp) + '</td>' +
        '<td class="num">' + fmt(CM.value(h)) + '</td>' +
        '<td class="num ' + (p >= 0 ? "pos" : "neg") + '">' + fmt(p) + '<div class="hint">' + pct(pp) + '</div></td>' +
        '<td>' + (h.thesisId ? levelBadge((CM.findThesis(h.thesisId) || {}).health || "green") : '<span class="badge b-red">● none</span>') + '</td>' +
        '<td></td></tr>');
      var xb = el('<button class="btn btn-sm">X-ray</button>');
      xb.addEventListener("click", function () { xrayDialog(h); });
      tr.lastChild.appendChild(xb);
      tb.appendChild(tr);
    });
    v.appendChild(tbl);

    // Concentration
    var cc = el('<div class="card" style="margin-top:16px"></div>');
    cc.appendChild(el('<div class="card-hd"><h3>Sector concentration</h3><span class="hint">' + Math.round(pf.concentration * 100) + '% in ' + pf.topSector + '</span></div>'));
    Object.keys(pf.bySector).sort(function (a, b) { return pf.bySector[b] - pf.bySector[a]; }).forEach(function (k) {
      var w = Math.round(pf.bySector[k] / pf.value * 100);
      cc.appendChild(el('<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:.85rem"><span>' + k + '</span><span class="muted">' + w + '%</span></div><div class="bar ' + (w > 35 ? "coral" : "") + '"><i style="width:' + w + '%"></i></div></div>'));
    });
    v.appendChild(cc);
    return v;
  };

  function xrayDialog(h) {
    var t = h.thesisId ? CM.findThesis(h.thesisId) : null;
    var body =
      '<div class="grid g2">' +
        card("Business (MOCK)", ["Revenue growth: ~9% p.a.", "Operating margin: 24%", "ROE: 21%", "Net debt: low"]) +
        card("Valuation (MOCK)", ["P/E: 28×", "P/B: 12×", "vs 5-yr median: slightly rich", "Peer set: TCS, INFY, WIPRO"]) +
        card("Market (MOCK)", ["1Y trend: up", "Volatility: moderate", "Max drawdown: -18%"]) +
        card("Ownership (MOCK)", ["Promoter: 72%", "FII/DII: stable", "No disclosed pledge"]) +
      '</div>' +
      '<div class="card" style="margin-top:14px;border-color:rgba(245,184,73,.5);background:rgba(245,184,73,.06)">' +
        '<div class="card-hd"><h3>What would make this thesis wrong?</h3></div>' +
        '<ul style="margin:0;padding-left:18px;color:var(--ink-soft)">' +
        (t && t.breaks.length ? t.breaks.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join("") :
          '<li>No thesis recorded yet — add one so we can track what would break it.</li>') +
        '</ul></div>';
    dialog(h.ticker + " · Investment X-ray", body);
  }
  function card(title, items) {
    return '<div class="card"><div class="card-hd"><h3>' + title + '</h3></div><ul style="margin:0;padding-left:18px;color:var(--ink-soft);font-size:.88rem">' +
      items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join("") + '</ul></div>';
  }

  // ---- THESIS --------------------------------------------------------------
  VIEWS.thesis = function () {
    var s = CM.load();
    var v = el('<div></div>');
    var add = el('<button class="btn btn-primary">+ New thesis</button>');
    add.addEventListener("click", newThesisDialog);
    v.appendChild(topbar("Investment Thesis", "Why you own it, what you expected, and what changed.", [add]));
    var grid = el('<div class="grid g2" style="margin-top:16px"></div>');
    s.theses.forEach(function (t) {
      var c = el('<div class="card"></div>');
      c.appendChild(el('<div class="card-hd"><h3>' + esc(t.ticker) + '</h3>' + levelBadge(t.health) + '</div>'));
      c.appendChild(el('<div style="font-weight:600;margin-bottom:6px">' + esc(t.title) + '</div>'));
      c.appendChild(el('<div class="hint">Recorded ' + ago(t.createdAt) + ' · ' + t.horizon + '-term</div>'));
      c.appendChild(el('<div style="margin-top:10px;font-size:.82rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">Why I own this</div>'));
      c.appendChild(el('<ul style="margin:4px 0;padding-left:18px;color:var(--ink-soft);font-size:.9rem">' + t.reasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join("") + '</ul>'));
      c.appendChild(el('<div style="margin-top:8px;font-size:.82rem;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">What would break it</div>'));
      c.appendChild(el('<ul style="margin:4px 0;padding-left:18px;color:var(--ink-soft);font-size:.9rem">' + t.breaks.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join("") + '</ul>'));
      if (t.health !== "green") c.appendChild(el('<div class="notice" style="margin-top:8px">The conditions supporting your original thesis have changed. Review the evidence — we won’t tell you to buy or sell.</div>'));
      grid.appendChild(c);
    });
    v.appendChild(grid);
    return v;
  };

  // ---- DECISIONS -----------------------------------------------------------
  VIEWS.decisions = function () {
    var s = CM.load();
    var v = el('<div></div>');
    var add = el('<button class="btn btn-primary">+ Record decision</button>');
    add.addEventListener("click", newDecisionDialog);
    v.appendChild(topbar("Decision Journal", "Your personal financial database — decisions, reasons, expectations.", [add]));
    var wrap = el('<div class="card" style="margin-top:16px"></div>');
    if (!s.decisions.length) wrap.appendChild(el('<p class="hint">No decisions yet. Record your first one.</p>'));
    s.decisions.forEach(function (d) {
      var riskBadge = { low: "b-green", medium: "b-yellow", high: "b-red" }[d.risk] || "b-navy";
      wrap.appendChild(el('<div class="attn"><div class="dot ' + (d.thesisRecorded ? "green" : "yellow") + '"></div><div style="flex:1">' +
        '<div class="t">' + esc(d.text) + ' <span class="badge b-navy">' + d.kind + '</span> <span class="badge ' + riskBadge + '">' + d.risk + ' risk</span></div>' +
        '<div class="d"><b>Why:</b> ' + esc(d.reason) + '</div>' +
        '<div class="d"><b>Expected:</b> ' + esc(d.expected) + ' · ' + d.horizon + '-term</div>' +
        '<div class="hint">' + new Date(d.date).toLocaleDateString("en-IN") + (d.thesisRecorded ? '' : ' · ⚠ no thesis recorded') + '</div>' +
        '</div></div>'));
    });
    v.appendChild(wrap);
    return v;
  };

  // ---- WHAT CHANGED --------------------------------------------------------
  VIEWS.changed = function () {
    var s = CM.load();
    var v = el('<div></div>');
    v.appendChild(topbar("What Changed?", s.changes.length + " changes that matter to you — not a generic news feed."));
    var c = el('<div class="card" style="margin-top:16px"></div>');
    s.changes.forEach(function (x) {
      c.appendChild(el('<div class="attn"><div class="dot ' + x.severity + '"></div><div>' +
        '<div class="t">' + esc(x.ticker) + ' — ' + esc(x.title) + ' <span class="hint">· ' + ago(x.date) + '</span></div>' +
        '<div class="d">' + esc(x.detail) + '</div>' +
        '<div class="why">Why this matters to you: ' + esc(x.matters) + '</div></div></div>'));
    });
    v.appendChild(c);
    return v;
  };

  // ---- MY MONEY (Money Mode + Money Health + Risk Map) ----------------------
  VIEWS.money = function () {
    var s = CM.load(), m = s.money, mh = CM.moneyHealth();
    var v = el('<div></div>');
    v.appendChild(topbar("My Money", "“What should I focus on next?”"));

    var stats = el('<div class="grid g4"></div>');
    stats.appendChild(statCard("Net worth (approx)", fmtShort(CM.portfolioStats().value + m.cash - m.debts.reduce(function (a, d) { return a + d.balance; }, 0)), "assets − debt", true, true));
    stats.appendChild(statCard("Savings rate", Math.round(mh.savingsRate * 100) + "%", "of income", mh.savingsRate >= 0.2));
    stats.appendChild(statCard("EMI burden", Math.round(mh.emiRatio * 100) + "%", "of income", mh.emiRatio <= 0.35));
    stats.appendChild(statCard("Emergency fund", m.emergencyMonths.toFixed(1) + "m", "target 6m", m.emergencyMonths >= 6));
    v.appendChild(stats);

    var cols = el('<div class="grid g2" style="margin-top:16px;align-items:start"></div>');

    // Money Health checklist
    var hc = el('<div class="card"></div>');
    hc.appendChild(el('<div class="card-hd"><h3>Money Health</h3><span class="badge ' + (mh.score >= 70 ? "b-green" : mh.score >= 40 ? "b-yellow" : "b-red") + '">' + mh.score + '/100</span></div>'));
    mh.items.forEach(function (i) {
      hc.appendChild(el('<div class="attn"><div class="dot ' + i.level + '"></div><div><div class="t">' + i.key + '</div><div class="d">' + esc(i.note) + '</div></div></div>'));
    });
    cols.appendChild(hc);

    // Risk Map
    var rm = el('<div class="card"></div>');
    rm.appendChild(el('<div class="card-hd"><h3>Money Risk Map</h3><span class="hint">assumptions shown, not absolute truth</span></div>'));
    var risks = [
      ["Market risk", "yellow", "Equity-heavy portfolio; expect drawdowns."],
      ["Concentration risk", CM.portfolioStats().concentration > 0.35 ? "red" : "green", Math.round(CM.portfolioStats().concentration * 100) + "% in one sector."],
      ["Liquidity risk", m.emergencyMonths >= 6 ? "green" : "yellow", m.emergencyMonths.toFixed(1) + " months accessible cash."],
      ["Debt risk", mh.emiRatio > 0.45 ? "red" : mh.emiRatio > 0.35 ? "yellow" : "green", Math.round(mh.emiRatio * 100) + "% income to EMIs."],
      ["Goal risk", "yellow", "Some goals may be underfunded — see Goals."],
      ["Protection risk", (m.insurance.term && m.insurance.health) ? "green" : "red", (m.insurance.term && m.insurance.health) ? "Term + health cover present." : "Cover gap."],
      ["Behavioural risk", CM.portfolioStats().untracked ? "yellow" : "green", CM.portfolioStats().untracked + " positions without a thesis."]
    ];
    risks.forEach(function (r) {
      rm.appendChild(el('<div class="attn"><div class="dot ' + r[1] + '"></div><div><div class="t">' + r[0] + '</div><div class="d">' + esc(r[2]) + '</div></div></div>'));
    });
    cols.appendChild(rm);
    v.appendChild(cols);

    // Focus next
    var focus = el('<div class="card" style="margin-top:16px"></div>');
    focus.appendChild(el('<div class="card-hd"><h3>What should I focus on next?</h3><span class="mock-tag">DECISION SUPPORT · NOT ADVICE</span></div>'));
    var recos = [];
    if (m.emergencyMonths < 6) recos.push("Build your emergency fund toward 6 months of expenses.");
    if (mh.emiRatio > 0.35) recos.push("Reduce or refinance high-rate debt to bring EMI burden under 35%.");
    if (mh.savingsRate < 0.2) recos.push("Nudge your savings rate toward 20%+.");
    if (CM.portfolioStats().concentration > 0.35) recos.push("Review sector concentration in your portfolio.");
    if (CM.portfolioStats().untracked) recos.push("Record a thesis for holdings that don’t have one.");
    focus.appendChild(el('<ol style="margin:0;padding-left:18px;color:var(--ink-soft)">' + recos.map(function (r) { return '<li style="margin:4px 0">' + esc(r) + '</li>'; }).join("") + '</ol>'));
    v.appendChild(focus);
    return v;
  };

  // ---- TRADING (Pro) -------------------------------------------------------
  VIEWS.trading = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Trader Mode", "Trade journal & performance — only claims your own data supports."));
    v.appendChild(el('<div class="notice">Demo trading report below uses <b>mock</b> sample trades.</div>'));
    var g = el('<div class="grid g4" style="margin-top:16px"></div>');
    [["Win rate", "54%"], ["Avg win", "₹4,120"], ["Avg loss", "-₹2,760"], ["Max drawdown", "-11%"]].forEach(function (x) { g.appendChild(statCard(x[0], x[1], "last 90d", true, true)); });
    v.appendChild(g);
    var r = el('<div class="card" style="margin-top:16px"></div>');
    r.appendChild(el('<div class="card-hd"><h3>My Trading Report</h3><span class="mock-tag">MOCK</span></div>'));
    [["Strongest setup", "Breakout trades (+₹18,400 net)"],
     ["Weakest setup", "Reversal trades (-₹9,200 net)"],
     ["Biggest recurring issue", "Exiting profitable trades too early"],
     ["Best period", "Tue–Thu mornings"]].forEach(function (x) {
      r.appendChild(el('<div class="attn"><div class="dot green"></div><div><div class="t">' + x[0] + '</div><div class="d">' + x[1] + '</div></div></div>'));
    });
    v.appendChild(r);
    return v;
  };

  // ---- GOALS ---------------------------------------------------------------
  VIEWS.goals = function () {
    var s = CM.load();
    var v = el('<div></div>');
    v.appendChild(topbar("Goals", "Are your important goals on track?"));
    var g = el('<div class="grid g2" style="margin-top:16px"></div>');
    s.goals.forEach(function (goal) {
      var w = Math.min(100, Math.round(goal.current / goal.target * 100));
      var c = el('<div class="card"></div>');
      c.appendChild(el('<div class="card-hd"><h3>' + esc(goal.name) + '</h3><span class="badge ' + (goal.priority === "high" ? "b-red" : "b-yellow") + '">' + goal.priority + '</span></div>'));
      c.appendChild(el('<div style="display:flex;justify-content:space-between;font-size:.9rem"><span>' + fmtShort(goal.current) + '</span><span class="muted">of ' + fmtShort(goal.target) + '</span></div>'));
      c.appendChild(el('<div class="bar" style="margin:8px 0"><i style="width:' + w + '%"></i></div>'));
      c.appendChild(el('<div class="hint">' + w + '% funded · due in ~' + goal.dueMonths + ' months</div>'));
      g.appendChild(c);
    });
    v.appendChild(g);
    return v;
  };

  // ---- REPORTS -------------------------------------------------------------
  VIEWS.reports = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Reports", "Portfolio Autopsy & behavioural patterns."));
    var pat = CM.patterns();
    var c = el('<div class="card" style="margin-top:16px"></div>');
    c.appendChild(el('<div class="card-hd"><h3>Portfolio Autopsy</h3><span class="mock-tag">FROM YOUR DATA</span></div>'));
    c.appendChild(el('<p class="hint">Observable patterns based on your own recorded data — not psychological claims.</p>'));
    if (!pat.length) c.appendChild(el('<p>No notable patterns yet — keep recording decisions.</p>'));
    pat.forEach(function (p) { c.appendChild(el('<div class="attn"><div class="dot yellow"></div><div class="d">' + esc(p) + '</div></div>')); });
    v.appendChild(c);
    return v;
  };

  // ---- MONEY REVIEW --------------------------------------------------------
  VIEWS.review = function () {
    var s = CM.load(), pf = CM.portfolioStats(), mh = CM.moneyHealth();
    var v = el('<div></div>');
    v.appendChild(topbar("Your Money Review", "Your " + s.profile.reviewCadence + " review — a reason to check in."));
    var sec = function (title, items) {
      var c = el('<div class="card" style="margin-top:16px"></div>');
      c.appendChild(el('<div class="card-hd"><h3>' + title + '</h3></div>'));
      c.appendChild(el('<ul style="margin:0;padding-left:18px;color:var(--ink-soft)">' + items.map(function (i) { return '<li style="margin:3px 0">' + esc(i) + '</li>'; }).join("") + '</ul>'));
      return c;
    };
    v.appendChild(sec("What changed?", s.changes.map(function (c) { return c.ticker + " — " + c.title; })));
    v.appendChild(sec("What worked?", pf.pnl >= 0 ? ["Portfolio up " + pct(pf.pnlPct) + " overall (mock prices)."] : ["Some positions held up despite a soft portfolio."]));
    v.appendChild(sec("What needs attention?", mh.items.filter(function (i) { return i.level !== "green"; }).map(function (i) { return i.key + ": " + i.note; })));
    v.appendChild(sec("What should you review?", CM.patterns()));
    return v;
  };

  // ---- DOCUMENTS -----------------------------------------------------------
  VIEWS.documents = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Document Intelligence", "Upload reports & statements for structured analysis."));
    var c = el('<div class="card paywall" style="margin-top:16px"><div class="lock-ic">▣</div>' +
      '<h3>Upload a document</h3><p class="hint">Annual reports, quarterly results, factsheets, broker/portfolio statements.</p></div>');
    var inp = el('<input type="file" style="max-width:320px;margin:10px auto 0" />');
    var note = el('<p class="hint" style="margin-top:10px"></p>');
    inp.addEventListener("change", function () {
      var f = inp.files[0];
      note.innerHTML = f ? '<span class="mock-tag">MOCK</span> Received <b>' + esc(f.name) + '</b>. In production this is parsed into Business / Financials / Valuation / Risks, and any missing info is reported as “cannot confirm from the document” rather than guessed.' : "";
    });
    c.appendChild(inp); c.appendChild(note);
    v.appendChild(c);
    return v;
  };

  // ---- TOOLS: Search My Money ----------------------------------------------
  var lastSearch = "";
  VIEWS.tools = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Search My Money", "Your personal financial knowledge base — search your own history."));
    var c = el('<div class="card"></div>');
    var box = el('<div class="composer" style="margin-top:0"><input placeholder="e.g. every stock I sold at a loss, when did I first buy TCS, goals due in 12 months" /><button class="btn btn-primary">Search</button></div>');
    var input = box.querySelector("input"), btn = box.querySelector("button");
    input.value = lastSearch;
    c.appendChild(box);
    var sug = el('<div class="suggest"></div>');
    ["stocks I hold at a loss", "when did I first buy TCS", "highest profit", "invested in IT", "goals due in 12 months", "positions with no thesis"].forEach(function (q) {
      var b = el('<button>' + q + '</button>'); b.addEventListener("click", function () { input.value = q; run(); }); sug.appendChild(b);
    });
    c.appendChild(sug);
    var results = el('<div style="margin-top:14px"></div>');
    c.appendChild(results);
    function run() { lastSearch = input.value; results.innerHTML = ""; results.appendChild(searchMoney(input.value)); }
    btn.addEventListener("click", run);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") run(); });
    if (lastSearch) run();
    v.appendChild(c);
    return v;
  };
  function resultCard(title, rows) {
    if (!rows.length) return el('<p class="hint">No matches in your data.</p>');
    var c = el('<div><div style="font-weight:600;margin-bottom:6px">' + esc(title) + ' <span class="hint">· ' + rows.length + '</span></div></div>');
    rows.forEach(function (r) { c.appendChild(el('<div class="attn"><div class="dot ' + (r.level || "green") + '"></div><div><div class="t">' + esc(r.t) + '</div><div class="d">' + esc(r.d) + '</div></div></div>')); });
    return c;
  }
  function searchMoney(q) {
    var s = CM.load(), lc = (q || "").toLowerCase(), wrap = el('<div></div>');
    if (!lc.trim()) { wrap.appendChild(el('<p class="hint">Type a question about your money above.</p>')); return wrap; }
    var matched = false;
    if (/loss|losing|down|red/.test(lc)) {
      matched = true;
      var losers = s.holdings.filter(function (h) { return CM.pnl(h) < 0; });
      wrap.appendChild(resultCard("Holdings currently at a loss", losers.map(function (h) { return { level: "red", t: h.ticker + " · " + fmt(CM.pnl(h)) + " (" + pct(CM.pnl(h) / CM.invested(h)) + ")", d: h.name + " · bought " + ago(h.addedAt) }; })));
    }
    if (/first|when.*buy|bought/.test(lc)) {
      matched = true;
      var tk = (lc.match(/\b([a-z]{2,12})\b(?=[^a-z]*$)/) || [])[1];
      var hits = s.holdings.filter(function (h) { return !tk || h.ticker.toLowerCase().indexOf(tk) === 0 || h.name.toLowerCase().indexOf(tk) >= 0; })
        .sort(function (a, b) { return new Date(a.addedAt) - new Date(b.addedAt); });
      wrap.appendChild(resultCard("Purchase history (earliest first)", hits.map(function (h) { return { t: h.ticker + " · first tracked " + new Date(h.addedAt).toLocaleDateString("en-IN"), d: h.qty + " @ " + fmt(h.cost) + " (" + ago(h.addedAt) + ")" }; })));
    }
    if (/profit|gain|best|highest|winner/.test(lc)) {
      matched = true;
      var win = s.holdings.slice().sort(function (a, b) { return CM.pnl(b) - CM.pnl(a); }).slice(0, 5);
      wrap.appendChild(resultCard("Top holdings by profit", win.map(function (h) { return { level: CM.pnl(h) >= 0 ? "green" : "red", t: h.ticker + " · " + fmt(CM.pnl(h)), d: pct(CM.pnl(h) / CM.invested(h)) + " · " + h.sector }; })));
    }
    if (/invest.*in|exposure|sector|\bit\b|tech|financ|auto/.test(lc)) {
      matched = true;
      var pf = CM.portfolioStats();
      var rows = Object.keys(pf.bySector).sort(function (a, b) { return pf.bySector[b] - pf.bySector[a]; })
        .filter(function (k) { var m = lc.match(/in ([a-z ]+)/); return !m || k.toLowerCase().indexOf(m[1].trim().slice(0, 4)) >= 0 || true; })
        .map(function (k) { return { t: k + " · " + fmt(pf.bySector[k]), d: Math.round(pf.bySector[k] / pf.value * 100) + "% of portfolio" }; });
      wrap.appendChild(resultCard("Exposure by sector", rows));
    }
    if (/goal|due|deadline/.test(lc)) {
      matched = true;
      var m = lc.match(/(\d+)\s*month/); var months = m ? +m[1] : 12;
      var due = s.goals.filter(function (g) { return g.dueMonths <= months; });
      wrap.appendChild(resultCard("Goals due within " + months + " months", due.map(function (g) { return { level: g.priority === "high" ? "red" : "yellow", t: g.name + " · due ~" + g.dueMonths + "m", d: Math.round(g.current / g.target * 100) + "% funded (" + fmtShort(g.current) + " / " + fmtShort(g.target) + ")" }; })));
    }
    if (/no thesis|untracked|without/.test(lc)) {
      matched = true;
      var un = s.holdings.filter(function (h) { return !h.thesisId; });
      wrap.appendChild(resultCard("Positions with no recorded thesis", un.map(function (h) { return { level: "yellow", t: h.ticker, d: h.name + " · " + fmt(CM.value(h)) }; })));
    }
    if (/decision|journal|why did/.test(lc)) {
      matched = true;
      wrap.appendChild(resultCard("Decisions", s.decisions.map(function (d) { return { t: d.text, d: d.reason + " · " + new Date(d.date).toLocaleDateString("en-IN") }; })));
    }
    if (!matched) {
      // free-text fallback across everything
      var rows = [];
      s.holdings.forEach(function (h) { if ((h.ticker + " " + h.name + " " + h.sector).toLowerCase().indexOf(lc) >= 0) rows.push({ t: h.ticker + " (holding)", d: h.name + " · " + h.sector }); });
      s.decisions.forEach(function (d) { if ((d.text + " " + d.reason).toLowerCase().indexOf(lc) >= 0) rows.push({ t: d.text, d: d.reason }); });
      s.theses.forEach(function (t) { if ((t.ticker + " " + t.title).toLowerCase().indexOf(lc) >= 0) rows.push({ t: t.ticker + " (thesis)", d: t.title }); });
      s.goals.forEach(function (g) { if (g.name.toLowerCase().indexOf(lc) >= 0) rows.push({ t: g.name + " (goal)", d: Math.round(g.current / g.target * 100) + "% funded" }); });
      wrap.appendChild(resultCard('Matches for "' + q + '"', rows));
    }
    return wrap;
  }

  // ---- CHINTA AI -----------------------------------------------------------
  var chatLog = [];
  VIEWS.chinta = function () {
    var s = CM.load();
    var v = el('<div></div>');
    v.appendChild(topbar("Chinta AI", "Grounded in YOUR financial context — no fabricated numbers."));
    var c = el('<div class="card"></div>');
    var chat = el('<div class="chat"></div>');
    if (!chatLog.length) chatLog.push({ role: "a", text: "Ask me about your money. I answer only from your data — and show the evidence.", ev: null });
    chatLog.forEach(function (m) { chat.appendChild(msgEl(m)); });
    c.appendChild(chat);
    var sug = el('<div class="suggest"></div>');
    ["Why is my portfolio down?", "Which holdings are most concentrated?", "What happened to my thesis?", "Which goals are falling behind?", "Show my biggest mistakes"].forEach(function (q) {
      var b = el('<button>' + q + '</button>');
      b.addEventListener("click", function () { askChinta(q, chat); });
      sug.appendChild(b);
    });
    c.appendChild(sug);
    var comp = el('<div class="composer"><input placeholder="Ask Chinta AI…" /><button class="btn btn-primary">Ask</button></div>');
    var input = comp.querySelector("input"), btn = comp.querySelector("button");
    function send() { var q = input.value.trim(); if (!q) return; input.value = ""; askChinta(q, chat); }
    btn.addEventListener("click", send);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
    c.appendChild(comp);
    v.appendChild(c);
    return v;
  };
  function msgEl(m) {
    var e = el('<div class="msg ' + m.role + '">' + esc(m.text).replace(/\n/g, "<br>") + '</div>');
    if (m.ev) e.appendChild(el('<div class="ev"><b>Evidence:</b> ' + esc(m.ev) + '</div>'));
    return e;
  }
  function askChinta(q, chatEl) {
    var s = CM.load();
    chatLog.push({ role: "u", text: q }); chatEl.appendChild(msgEl(chatLog[chatLog.length - 1]));
    // usage limit (soft)
    var limit = CM.PLANS[s.profile.plan].limits.aiQuestions;
    s.usage.aiQuestions++; CM.save();
    var a = answerChinta(q);
    if (s.usage.aiQuestions > limit) a = { text: "You’ve reached your plan’s AI question limit. Upgrade for more.", ev: null };
    chatLog.push({ role: "a", text: a.text, ev: a.ev }); chatEl.appendChild(msgEl(chatLog[chatLog.length - 1]));
    chatEl.scrollTop = chatEl.scrollHeight;
  }
  // Rule-based, evidence-grounded responder (MVP stand-in for the LLM layer).
  function answerChinta(q) {
    var s = CM.load(), pf = CM.portfolioStats(), lc = q.toLowerCase();
    if (/down|loss|why.*red|falling/.test(lc)) {
      var losers = s.holdings.filter(function (h) { return CM.pnl(h) < 0; }).sort(function (a, b) { return CM.pnl(a) - CM.pnl(b); });
      if (!losers.length) return { text: "Your portfolio is up overall (mock prices). Nothing is dragging it down right now.", ev: "Total P&L " + fmt(pf.pnl) };
      return { text: "The main drag is " + losers.map(function (h) { return h.ticker + " (" + fmt(CM.pnl(h)) + ")"; }).join(", ") + ". " + (losers[0].thesisId ? "" : losers[0].ticker + " has no recorded thesis."),
        ev: "Portfolio P&L " + fmt(pf.pnl) + " · biggest loser " + losers[0].ticker };
    }
    if (/concentrat/.test(lc)) return { text: "You’re most concentrated in " + pf.topSector + " at ~" + Math.round(pf.concentration * 100) + "% of portfolio value. Watch above 35%.", ev: "Top sector value " + fmt(pf.bySector[pf.topSector]) + " of " + fmt(pf.value) };
    if (/thesis/.test(lc)) { var alert = s.theses.filter(function (t) { return t.health !== "green"; }); return { text: alert.length ? "Theses needing review: " + alert.map(function (t) { return t.ticker + " (" + t.health + ")"; }).join(", ") + ". The supporting conditions changed — I won’t tell you to buy or sell." : "All recorded theses are currently intact (🟢).", ev: s.theses.length + " theses recorded" }; }
    if (/goal/.test(lc)) { var behind = s.goals.map(function (g) { return { g: g, p: g.current / g.target }; }).filter(function (x) { return x.p < 0.6; }); return { text: behind.length ? "Falling behind: " + behind.map(function (x) { return x.g.name + " (" + Math.round(x.p * 100) + "% funded, due ~" + x.g.dueMonths + "m)"; }).join(", ") : "Your goals are broadly on track.", ev: s.goals.length + " goals tracked" }; }
    if (/mistake|autopsy|pattern/.test(lc)) { var p = CM.patterns(); return { text: p.length ? p.join(" ") : "Not enough history yet to flag patterns.", ev: "Derived from your holdings & decisions" }; }
    if (/nifty|compare|benchmark/.test(lc)) return { text: "Your portfolio is " + pct(pf.pnlPct) + " overall (mock). Live benchmark comparison needs a market-data connection (adapter not wired in MVP).", ev: "adapters.marketData.isLive = false" };
    return { text: "I can answer from your data: portfolio P&L, concentration, thesis health, goals, and behavioural patterns. Try one of the suggestions above.", ev: null };
  }

  // ---- PROFILE & PLAN ------------------------------------------------------
  VIEWS.profile = function () {
    var s = CM.load();
    var v = el('<div></div>');
    v.appendChild(topbar("Profile & Plan", "Manage your persona, review cadence and subscription."));

    var pc = el('<div class="card" style="margin-top:16px"></div>');
    pc.appendChild(el('<div class="card-hd"><h3>You</h3></div>'));
    pc.appendChild(el('<p>Name: <b>' + esc(s.profile.name || "—") + '</b> · Persona: <b>' + esc(s.profile.persona || "—") + '</b></p>'));
    var cad = el('<label class="fld"><span>Money Review cadence</span><select><option>weekly</option><option>monthly</option><option>quarterly</option></select></label>');
    cad.querySelector("select").value = s.profile.reviewCadence;
    cad.querySelector("select").addEventListener("change", function (e) { CM.setProfile({ reviewCadence: e.target.value }); });
    pc.appendChild(cad);
    v.appendChild(pc);

    // plans
    v.appendChild(el('<h2 style="margin:24px 0 8px;font-size:1.15rem">Subscription</h2>'));
    var plans = el('<div class="plans"></div>');
    Object.keys(CM.PLANS).forEach(function (id) {
      var p = CM.PLANS[id];
      var isCur = s.profile.plan === id;
      var card = el('<div class="plan' + (id === "plus" ? " feat" : "") + '">' +
        (id === "plus" ? '<span class="badge b-green" style="align-self:flex-start;margin-bottom:8px">Most popular</span>' : '') +
        '<h3>' + p.name + '</h3><div class="amt">' + (p.price ? "₹" + p.price : "Free") + '<span class="hint" style="font-size:.9rem;font-weight:500">' + (p.price ? "/" + p.cadence : "") + '</span></div>' +
        '<p class="hint">' + p.blurb + '</p>' +
        '<ul>' + p.features.slice(0, 6).map(function (f) { return '<li>' + f.replace(/-/g, " ") + '</li>'; }).join("") + '</ul></div>');
      var b = el('<button class="btn ' + (isCur ? "" : "btn-primary") + '"' + (isCur ? " disabled" : "") + '>' + (isCur ? "Current plan" : "Switch to " + p.name) + '</button>');
      b.addEventListener("click", function () { CM.setProfile({ plan: id }); render(); });
      card.appendChild(b);
      plans.appendChild(card);
    });
    v.appendChild(plans);
    v.appendChild(el('<div class="notice" style="margin-top:14px">Plan prices are <b>configuration</b>, changeable from an admin panel (not hard-coded as final). Payments are not wired in the MVP — switching plans here is a local demo only.</div>'));

    // reset
    var reset = el('<button class="btn btn-ghost" style="margin-top:20px">↺ Reset demo data</button>');
    reset.addEventListener("click", function () { if (confirm("Reset all local demo data?")) { CM.reset(); go("home"); render(); } });
    v.appendChild(reset);

    v.appendChild(el('<div class="disclaimer"><b>Important:</b> ChintasMoney is a personal financial <b>intelligence & decision-support</b> tool. It is not a SEBI-registered investment adviser and does not provide guaranteed-return claims or automated buy/sell recommendations. Data shown in this MVP is illustrative/mock. Nothing here is investment advice.</div>'));
    return v;
  };

  // ==========================================================================
  // Dialogs (modals)
  // ==========================================================================
  function dialog(title, bodyHtml, onMount) {
    var back = el('<div style="position:fixed;inset:0;background:rgba(11,21,51,.5);z-index:80;display:grid;place-items:center;padding:18px"></div>');
    var box = el('<div style="background:#fff;border-radius:18px;max-width:760px;width:100%;max-height:88vh;overflow:auto;box-shadow:var(--shadow-lg)"></div>');
    var hd = el('<div style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff"><h3 style="margin:0;flex:1">' + title + '</h3></div>');
    var x = el('<button class="btn btn-sm">✕</button>'); x.addEventListener("click", close); hd.appendChild(x);
    var body = el('<div style="padding:20px"></div>'); body.innerHTML = bodyHtml;
    box.appendChild(hd); box.appendChild(body); back.appendChild(box); document.body.appendChild(back);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    function close() { document.body.removeChild(back); }
    if (onMount) onMount(body, close);
    return { close: close, body: body };
  }

  function newDecisionDialog() {
    var s = CM.load();
    if (s.decisions.length >= CM.PLANS[s.profile.plan].limits.decisions) { dialog("Limit reached", '<p>Your plan allows ' + CM.PLANS[s.profile.plan].limits.decisions + ' journal entries. Upgrade for unlimited.</p>'); return; }
    var form =
      '<label class="fld"><span>What did you decide?</span><input id="dtext" placeholder="e.g. Bought 50 shares of Infosys" /></label>' +
      '<div class="grid g2"><label class="fld"><span>Type</span><select id="dkind"><option>buy</option><option>sell</option><option>sip</option><option>loan</option><option>reject</option><option>property</option><option>exit</option></select></label>' +
      '<label class="fld"><span>Risk</span><select id="drisk"><option>low</option><option>medium</option><option>high</option></select></label></div>' +
      '<label class="fld"><span>Why? (your reason)</span><textarea id="dreason" placeholder="Your reasoning at the time…"></textarea></label>' +
      '<div class="grid g2"><label class="fld"><span>Expected outcome</span><input id="dexp" placeholder="What you expect to happen" /></label>' +
      '<label class="fld"><span>Time horizon</span><select id="dhor"><option>short</option><option>medium</option><option>long</option></select></label></div>' +
      '<label style="display:flex;gap:8px;align-items:center;font-size:.9rem"><input type="checkbox" id="dthesis" style="width:auto" checked/> I have a recorded thesis for this</label>';
    dialog("Record a decision", form, function (body, close) {
      var save = el('<button class="btn btn-primary" style="margin-top:8px">Save decision</button>');
      save.addEventListener("click", function () {
        var text = body.querySelector("#dtext").value.trim(); if (!text) { body.querySelector("#dtext").focus(); return; }
        CM.addDecision({ kind: body.querySelector("#dkind").value, instrument: "", text: text,
          reason: body.querySelector("#dreason").value, expected: body.querySelector("#dexp").value,
          risk: body.querySelector("#drisk").value, horizon: body.querySelector("#dhor").value,
          thesisRecorded: body.querySelector("#dthesis").checked, outcome: null });
        close(); go("decisions"); render();
      });
      body.appendChild(save);
    });
  }

  function newThesisDialog() {
    var form =
      '<div class="grid g2"><label class="fld"><span>Ticker</span><input id="ttk" placeholder="e.g. INFY" /></label>' +
      '<label class="fld"><span>Horizon</span><select id="thor"><option>long</option><option>medium</option><option>short</option></select></label></div>' +
      '<label class="fld"><span>Thesis title</span><input id="ttitle" placeholder="e.g. Undervalued compounder" /></label>' +
      '<label class="fld"><span>Why I own this (one per line)</span><textarea id="treasons" placeholder="Revenue will grow because…\nMargins should improve…"></textarea></label>' +
      '<label class="fld"><span>What would make this thesis wrong? (one per line)</span><textarea id="tbreaks" placeholder="Margins fall below X\nCompetitor takes share"></textarea></label>';
    dialog("New investment thesis", form, function (body, close) {
      var save = el('<button class="btn btn-primary">Save thesis</button>');
      save.addEventListener("click", function () {
        var tk = body.querySelector("#ttk").value.trim().toUpperCase(); if (!tk) { body.querySelector("#ttk").focus(); return; }
        var lines = function (id) { return body.querySelector(id).value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); };
        CM.addThesis({ ticker: tk, title: body.querySelector("#ttitle").value || "Untitled thesis",
          horizon: body.querySelector("#thor").value, reasons: lines("#treasons"), expectations: [], breaks: lines("#tbreaks") });
        close(); go("thesis"); render();
      });
      body.appendChild(save);
    });
  }

  function addHoldingDialog() {
    var form =
      '<div class="grid g2"><label class="fld"><span>Ticker</span><input id="htk" placeholder="INFY" /></label>' +
      '<label class="fld"><span>Type</span><select id="htype"><option>stock</option><option>fund</option><option>etf</option></select></label></div>' +
      '<label class="fld"><span>Name</span><input id="hname" placeholder="Infosys Ltd" /></label>' +
      '<div class="grid g3"><label class="fld"><span>Qty</span><input id="hqty" type="number" /></label>' +
      '<label class="fld"><span>Avg cost</span><input id="hcost" type="number" /></label>' +
      '<label class="fld"><span>LTP (mock)</span><input id="hltp" type="number" /></label></div>' +
      '<label class="fld"><span>Sector</span><input id="hsec" placeholder="IT" /></label>';
    dialog("Add holding", form, function (body, close) {
      var save = el('<button class="btn btn-primary">Add</button>');
      save.addEventListener("click", function () {
        var tk = body.querySelector("#htk").value.trim().toUpperCase(); if (!tk) { body.querySelector("#htk").focus(); return; }
        CM.addHolding({ ticker: tk, name: body.querySelector("#hname").value || tk, type: body.querySelector("#htype").value,
          sector: body.querySelector("#hsec").value || "Other", qty: +body.querySelector("#hqty").value || 0,
          cost: +body.querySelector("#hcost").value || 0, ltp: +body.querySelector("#hltp").value || 0, thesisId: null });
        close(); go("investments"); render();
      });
      body.appendChild(save);
    });
  }

  // ==========================================================================
  // Onboarding
  // ==========================================================================
  var onbState = { step: 0, name: "", persona: null, cadence: "monthly" };
  var PERSONAS = [
    { id: "investor", em: "📈", t: "Long-term investor", d: "Build & track quality holdings" },
    { id: "trader", em: "⚡", t: "Trader", d: "Journal trades & setups" },
    { id: "both", em: "🧭", t: "Both", d: "Invest and trade" },
    { id: "planner", em: "🗺️", t: "Financial planner", d: "Plan goals & protection" },
    { id: "personal", em: "🏦", t: "Managing personal money", d: "Income, savings, debt, goals" }
  ];
  function renderOnboarding() {
    root.innerHTML = "";
    var wrap = el('<div class="onb"></div>');
    var c = el('<div class="onb-card"></div>');
    c.appendChild(el('<div class="brand" style="padding:0 0 6px"><span class="brand-badge">₹</span><div><b style="color:var(--ink)">ChintasMoney</b><small style="color:var(--muted)">LESS CHINTA · MORE CLARITY</small></div></div>'));

    if (onbState.step === 0) {
      c.appendChild(el('<h2 style="margin:12px 0 4px">Welcome 👋</h2>'));
      c.appendChild(el('<p class="hint">Your money is about to get a memory. First, what should we call you?</p>'));
      var nm = el('<label class="fld"><span>Your name</span><input id="onm" placeholder="e.g. Basava" /></label>');
      nm.querySelector("input").value = onbState.name;
      c.appendChild(nm);
      var next = el('<button class="btn btn-primary">Continue →</button>');
      next.addEventListener("click", function () { onbState.name = nm.querySelector("input").value.trim(); onbState.step = 1; renderOnboarding(); });
      c.appendChild(next);
    } else if (onbState.step === 1) {
      c.appendChild(el('<h2 style="margin:12px 0 4px">You are primarily…</h2>'));
      c.appendChild(el('<p class="hint">We’ll tailor your dashboard to this.</p>'));
      var pg = el('<div class="persona-grid"></div>');
      PERSONAS.forEach(function (p) {
        var b = el('<button class="persona' + (onbState.persona === p.id ? " sel" : "") + '"><span class="em">' + p.em + '</span><b>' + p.t + '</b><small>' + p.d + '</small></button>');
        b.addEventListener("click", function () { onbState.persona = p.id; renderOnboarding(); });
        pg.appendChild(b);
      });
      c.appendChild(pg);
      var next = el('<button class="btn btn-primary" style="margin-top:16px"' + (onbState.persona ? "" : " disabled") + '>Continue →</button>');
      next.addEventListener("click", function () { onbState.step = 2; renderOnboarding(); });
      c.appendChild(next);
    } else {
      c.appendChild(el('<h2 style="margin:12px 0 4px">Your review rhythm</h2>'));
      c.appendChild(el('<p class="hint">How often should we compile your Money Review?</p>'));
      var sel = el('<label class="fld"><span>Cadence</span><select><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>');
      sel.querySelector("select").value = onbState.cadence;
      sel.querySelector("select").addEventListener("change", function (e) { onbState.cadence = e.target.value; });
      c.appendChild(sel);
      c.appendChild(el('<div class="notice">We’ll start you on the <b>Free</b> plan with sample data so you can explore. You can reset anytime.</div>'));
      var done = el('<button class="btn btn-primary" style="margin-top:8px">Enter ChintasMoney →</button>');
      done.addEventListener("click", function () {
        CM.setProfile({ name: onbState.name, persona: onbState.persona, reviewCadence: onbState.cadence, onboarded: true });
        go("home"); render();
      });
      c.appendChild(done);
    }
    var dots = el('<div class="steps-dots"></div>');
    [0, 1, 2].forEach(function (i) { dots.appendChild(el('<i class="' + (i <= onbState.step ? "on" : "") + '"></i>')); });
    c.appendChild(dots);
    wrap.appendChild(c);
    root.appendChild(wrap);
  }

  // ---- boot ----------------------------------------------------------------
  render();
})();
