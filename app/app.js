/* ChintasMoney — Trader Report Card (client-side SPA)
 * A behavioural mirror for traders: Discipline Score, personality, mistakes,
 * streaks, badges, shareable card, and an evidence-based discipline coach.
 * NOT financial advice — no buy/sell calls. Data is the trader's own.
 * ------------------------------------------------------------------------- */
(function () {
  "use strict";
  var root = document.getElementById("root");
  var CM = window.CM;

  function el(h) { var t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; }
  function money(n) { var v = Math.round(n); return (v < 0 ? "-₹" : "₹") + Math.abs(v).toLocaleString("en-IN"); }
  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function ago(iso) { var d = Math.round((Date.now() - new Date(iso)) / 86400000); return d <= 0 ? "today" : d === 1 ? "1d ago" : d + "d ago"; }

  var NAV = [
    { id: "home", label: "My Report Card", ic: "◎" },
    { id: "log", label: "Log a Trade", ic: "＋" },
    { id: "trades", label: "Trade Journal", ic: "▤" },
    { id: "analytics", label: "Analytics", ic: "📊" },
    { id: "calc", label: "Risk Calculator", ic: "🧮" },
    { sep: true, group: "Understand yourself" },
    { id: "insights", label: "Mistake Insights", ic: "🔍" },
    { id: "strategy", label: "Setup Performance", ic: "▦" },
    { id: "coach", label: "Discipline Coach", ic: "✦" },
    { sep: true, group: "Play" },
    { id: "badges", label: "Streaks & Badges", ic: "🏅" },
    { id: "leaderboard", label: "Leaderboard", ic: "🏆" },
    { id: "card", label: "Shareable Card", ic: "↗" },
    { sep: true },
    { id: "profile", label: "Profile & Plan", ic: "☰" }
  ];

  var mobileOpen = false;
  function route() { return location.hash.replace(/^#\/?/, "") || "home"; }
  function go(r) { location.hash = "#/" + r; }
  window.addEventListener("hashchange", render);

  function render() {
    if (!CM.load().profile.onboarded) { renderOnboarding(); return; }
    root.innerHTML = ""; root.appendChild(shell(route()));
  }

  function shell(r) {
    var s = CM.load(), wrap = el('<div class="app"></div>');
    var side = el('<aside class="sidebar' + (mobileOpen ? " open" : "") + '"></aside>');
    side.appendChild(el('<a class="brand" href="../index.html"><span class="brand-badge brand-logo-chip"><img src="assets/logo.png" alt="ChintasMoney"/></span><div><b>ChintasMoney</b><small>TRADER REPORT CARD</small></div></a>'));
    NAV.forEach(function (n) {
      if (n.sep) { side.appendChild(el('<div class="nav-sep"></div>')); if (n.group) side.appendChild(el('<div style="color:#6f83ab;font-size:.66rem;letter-spacing:.08em;padding:2px 10px 4px">' + n.group.toUpperCase() + '</div>')); return; }
      var locked = !CM.planAllows(s.profile.plan, n.id);
      var a = el('<a class="nav-item' + (r === n.id ? " active" : "") + '" href="#/' + n.id + '"><span class="ic">' + n.ic + '</span><span>' + n.label + '</span>' + (locked ? '<span class="lock">🔒</span>' : '') + '</a>');
      a.addEventListener("click", function () { mobileOpen = false; });
      side.appendChild(a);
    });
    side.appendChild(el('<div class="side-foot"><span class="plan-pill">● ' + CM.PLANS[s.profile.plan].name + ' plan</span></div>'));
    wrap.appendChild(side);
    if (mobileOpen) { var sc = el('<div class="scrim"></div>'); sc.addEventListener("click", function () { mobileOpen = false; render(); }); wrap.appendChild(sc); }

    var main = el('<main class="main"></main>');
    main.appendChild(!CM.planAllows(s.profile.plan, r) ? paywall(r) : (VIEWS[r] || VIEWS.home)());
    wrap.appendChild(main);
    return wrap;
  }

  function topbar(title, sub, actions) {
    var bar = el('<div class="topbar"></div>');
    var mb = el('<button class="btn btn-sm menu-btn">☰</button>'); mb.addEventListener("click", function () { mobileOpen = true; render(); }); bar.appendChild(mb);
    bar.appendChild(el('<div><h1>' + title + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>'));
    bar.appendChild(el('<div class="spacer"></div>'));
    (actions || []).forEach(function (a) { bar.appendChild(a); });
    return bar;
  }
  function logBtn() { var b = el('<button class="btn btn-primary">＋ Log a trade</button>'); b.addEventListener("click", function () { go("log"); }); return b; }

  function paywall(area) {
    var need = CM.FEATURE_MATRIX[area], plan = CM.PLANS[need];
    var w = el('<div></div>');
    w.appendChild(topbar("Locked", "Part of the " + plan.name + " plan"));
    var c = el('<div class="card paywall"><div class="lock-ic">🔒</div><h3>Unlock ' + area + '</h3><p class="hint">' + plan.blurb + ' — <b>' + (plan.price ? "₹" + plan.price + "/mo" : "Free") + '</b></p></div>');
    var b = el('<button class="btn btn-primary" style="margin-top:8px">Upgrade to ' + plan.name + '</button>'); b.addEventListener("click", function () { go("profile"); });
    c.appendChild(b); w.appendChild(c); return w;
  }

  function scoreColor(n) { return n >= 75 ? "var(--emerald)" : n >= 50 ? "var(--gold)" : "var(--red)"; }
  function scoreLabel(n) { return n >= 85 ? "Elite discipline" : n >= 75 ? "Strong" : n >= 50 ? "Leaky" : n >= 30 ? "Reckless" : "Account-killer"; }

  // Circular gauge (SVG)
  function gauge(score, size) {
    size = size || 190; var r = size / 2 - 14, c = 2 * Math.PI * r, off = c * (1 - score / 100);
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="14"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + scoreColor(score) + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '<text x="50%" y="46%" text-anchor="middle" font-size="' + (size * 0.26) + '" font-weight="800" fill="var(--ink)">' + score + '</text>' +
      '<text x="50%" y="63%" text-anchor="middle" font-size="' + (size * 0.075) + '" fill="var(--muted)">DISCIPLINE</text></svg>';
  }

  var VIEWS = {};

  // ---- SVG chart helpers ---------------------------------------------------
  function svgLine(vals, opt) {
    opt = opt || {}; var w = opt.w || 520, h = opt.h || 180, pad = 8;
    if (!vals.length) return '<div class="hint">No data yet.</div>';
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (opt.zeroBase && min > 0) min = 0; if (min === max) { max = min + 1; }
    var n = vals.length, dx = (w - pad * 2) / Math.max(1, n - 1);
    function x(i) { return pad + i * dx; } function y(v) { return h - pad - (v - min) / (max - min) * (h - pad * 2); }
    var d = vals.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
    var area = d + " L" + x(n - 1).toFixed(1) + " " + (h - pad) + " L" + x(0).toFixed(1) + " " + (h - pad) + " Z";
    var col = opt.color || "#0f9d76", zeroY = (min < 0 && max > 0) ? y(0) : null;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="g' + (opt.id || "") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      (zeroY !== null ? '<line x1="' + pad + '" y1="' + zeroY.toFixed(1) + '" x2="' + (w - pad) + '" y2="' + zeroY.toFixed(1) + '" stroke="#e6e9f0" stroke-dasharray="4 4"/>' : '') +
      '<path d="' + area + '" fill="url(#g' + (opt.id || "") + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + x(n - 1).toFixed(1) + '" cy="' + y(vals[n - 1]).toFixed(1) + '" r="3.5" fill="' + col + '"/></svg>';
  }
  function svgDonut(segs, opt) {
    opt = opt || {}; var size = opt.size || 150, r = size / 2 - 12, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
    var total = segs.reduce(function (a, s) { return a + s.value; }, 0) || 1, off = 0;
    var circles = segs.map(function (s) {
      var frac = s.value / total, seg = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="16" stroke-dasharray="' + (frac * C).toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="' + (-off * C).toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
      off += frac; return seg;
    }).join("");
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#eef1f6" stroke-width="16"/>' + circles +
      '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="' + (size * 0.2) + '" font-weight="800" fill="#0f172a">' + (opt.center || "") + '</text>' +
      (opt.sub ? '<text x="' + cx + '" y="' + (cy + size * 0.13) + '" text-anchor="middle" font-size="' + (size * 0.075) + '" fill="#7b879d">' + opt.sub + '</text>' : '') + '</svg>';
  }
  function svgHBars(items) {
    if (!items.length) return '<div class="hint">No data yet.</div>';
    var max = Math.max.apply(null, items.map(function (i) { return Math.abs(i.value); })) || 1;
    return items.map(function (i) {
      var w = Math.round(Math.abs(i.value) / max * 100), pos = i.value >= 0;
      return '<div style="margin:9px 0"><div style="display:flex;justify-content:space-between;font-size:.85rem"><span>' + esc(i.label) + '</span><span class="' + (pos ? "pos" : "neg") + '" style="font-weight:700">' + (i.fmt || i.value) + '</span></div>' +
        '<div class="bar' + (pos ? "" : " coral") + '" style="margin-top:4px"><i style="width:' + w + '%"></i></div></div>';
    }).join("");
  }
  function scoreColorHex(n) { return n >= 75 ? "#0f9d76" : n >= 50 ? "#f5b849" : "#ef4444"; }

  // ---- HOME / Report Card --------------------------------------------------
  VIEWS.home = function () {
    var s = CM.load(), st = CM.stats(), p = st.personality;
    var v = el('<div></div>');
    v.appendChild(topbar("Your Trader Report Card", "Hi " + (s.profile.name || "trader") + " — this is your honest mirror, not tips.", [logBtn()]));

    var hero = el('<div class="card" style="display:flex;gap:24px;align-items:center;flex-wrap:wrap"></div>');
    hero.appendChild(el('<div>' + gauge(st.discipline) + '</div>'));
    var right = el('<div style="flex:1;min-width:240px"></div>');
    right.appendChild(el('<div class="badge ' + (st.discipline >= 75 ? "b-green" : st.discipline >= 50 ? "b-yellow" : "b-red") + '">' + scoreLabel(st.discipline) + '</div>'));
    right.appendChild(el('<h2 style="margin:8px 0 2px;font-size:1.5rem">' + p.em + ' ' + esc(p.key) + '</h2>'));
    right.appendChild(el('<p class="hint" style="max-width:46ch">' + esc(p.line) + '</p>'));
    right.appendChild(el('<p style="margin:6px 0 0"><b>' + st.count + '</b> trades analysed · net <span class="' + (st.totalPnl >= 0 ? "pos" : "neg") + '">' + money(st.totalPnl) + '</span> <span class="mock-tag">from your logs</span></p>'));
    hero.appendChild(right);
    v.appendChild(hero);

    var g = el('<div class="grid g4" style="margin-top:16px"></div>');
    g.appendChild(tile("Win rate", st.winRate + "%", "of " + st.count + " trades"));
    g.appendChild(tile("Risk : reward", st.rr ? st.rr.toFixed(2) + "×" : "—", "avg win ÷ avg loss"));
    g.appendChild(tile("No stop-loss", String(st.noSL), "trades without a stop", st.noSL === 0));
    g.appendChild(tile("Emotional exits", String(st.emotional), "fear/greed/revenge/FOMO", st.emotional === 0));
    v.appendChild(g);

    // equity curve snapshot
    var eq = CM.equityCurve();
    if (eq.length) {
      var eqc = el('<div class="card" style="margin-top:16px"></div>');
      eqc.appendChild(el('<div class="card-hd"><h3>Equity curve</h3><span class="hint mono ' + (st.totalPnl >= 0 ? "pos" : "neg") + '">' + money(st.totalPnl) + ' net · ' + st.count + ' trades</span></div>'));
      eqc.appendChild(el(svgLine(eq.map(function (p) { return p.cum; }), { id: "home", color: st.totalPnl >= 0 ? "#0f9d76" : "#ef4444", h: 150 })));
      var moreb = el('<button class="btn btn-ghost btn-sm" style="margin-top:8px">Open full analytics →</button>');
      moreb.addEventListener("click", function () { go("analytics"); });
      eqc.appendChild(moreb);
      v.appendChild(eqc);
    }

    var cols = el('<div class="grid g2" style="margin-top:16px;align-items:start"></div>');
    // top mistakes
    var mc = el('<div class="card"><div class="card-hd"><h3>What\'s costing you</h3></div></div>');
    var ms = CM.mistakes();
    if (!ms.length) mc.appendChild(el('<p class="hint">No repeating mistakes detected yet. Keep logging.</p>'));
    ms.slice(0, 4).forEach(function (m) { mc.appendChild(el('<div class="attn"><div class="dot ' + (m.n >= 3 ? "red" : "yellow") + '"></div><div><div class="t">' + esc(m.name) + ' <span class="badge b-red">×' + m.n + '</span></div><div class="d">' + esc(m.tip) + '</div></div></div>')); });
    var mb = el('<button class="btn btn-ghost btn-sm" style="margin-top:6px">See all insights →</button>'); mb.addEventListener("click", function () { go("insights"); }); mc.appendChild(mb);
    cols.appendChild(mc);
    // share nudge
    var sh = el('<div class="card"><div class="card-hd"><h3>Flex your card</h3></div><p class="hint">Share your Trader Personality &amp; Discipline Score. (Traders love — and hate — seeing this.)</p></div>');
    var sb = el('<button class="btn btn-primary btn-sm">Open shareable card ↗</button>'); sb.addEventListener("click", function () { go("card"); }); sh.appendChild(sb);
    cols.appendChild(sh);
    v.appendChild(cols);
    return v;
  };
  function tile(l, v, note, good) {
    return el('<div class="card stat"><span class="lbl">' + l + '</span><span class="val">' + v + '</span><span class="hint' + (good === true ? " pos" : good === false ? " neg" : "") + '">' + note + '</span></div>');
  }

  // ---- ANALYTICS -----------------------------------------------------------
  VIEWS.analytics = function () {
    var st = CM.stats(), eq = CM.equityCurve(), dt = CM.disciplineTrend(), wl = CM.winLoss();
    var v = el('<div></div>');
    v.appendChild(topbar("Analytics", "The charts your broker never shows you — all from your own trades.", [logBtn()]));
    if (!st.count) { var e = el('<div class="card paywall"><div class="lock-ic">📊</div><h3>No charts yet</h3><p class="hint">Log a few trades and your analytics come alive.</p></div>'); v.appendChild(e); return v; }

    var g = el('<div class="grid g4"></div>');
    g.appendChild(tile("Net P&L", money(st.totalPnl), "from your logs", st.totalPnl >= 0));
    g.appendChild(tile("Win rate", st.winRate + "%", wl.wins + "W · " + wl.losses + "L"));
    g.appendChild(tile("Risk : reward", st.rr ? st.rr.toFixed(2) + "×" : "—", "avg win ÷ loss"));
    g.appendChild(tile("Discipline", st.discipline + "/100", scoreLabel(st.discipline), st.discipline >= 75));
    v.appendChild(g);

    var row1 = el('<div class="grid g2" style="margin-top:16px;align-items:start"></div>');
    var eqCard = el('<div class="card"><div class="card-hd"><h3>Equity curve</h3><span class="hint mono ' + (st.totalPnl >= 0 ? "pos" : "neg") + '">' + money(st.totalPnl) + '</span></div></div>');
    eqCard.appendChild(el(svgLine(eq.map(function (p) { return p.cum; }), { id: "eq", color: st.totalPnl >= 0 ? "#0f9d76" : "#ef4444", zeroBase: false, h: 190 })));
    eqCard.appendChild(el('<p class="hint" style="margin:8px 0 0">Cumulative profit &amp; loss across your ' + st.count + ' logged trades.</p>'));
    row1.appendChild(eqCard);

    var wlCard = el('<div class="card"><div class="card-hd"><h3>Wins vs losses</h3></div><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"></div></div>');
    wlCard.lastChild.appendChild(el(svgDonut([{ value: wl.wins, color: "#22c55e" }, { value: wl.losses, color: "#ef4444" }], { center: st.winRate + "%", sub: "win rate" })));
    wlCard.lastChild.appendChild(el('<div><div class="attn" style="border:0;padding:4px 0"><div class="dot green"></div><div>' + wl.wins + ' winning trades</div></div><div class="attn" style="border:0;padding:4px 0"><div class="dot red"></div><div>' + wl.losses + ' losing trades</div></div></div>'));
    row1.appendChild(wlCard);
    v.appendChild(row1);

    var row2 = el('<div class="grid g2" style="margin-top:16px;align-items:start"></div>');
    var dCard = el('<div class="card"><div class="card-hd"><h3>Discipline trend</h3><span class="hint">per trade</span></div></div>');
    dCard.appendChild(el(svgLine(dt, { id: "disc", color: scoreColorHex(st.discipline), h: 170, zeroBase: true })));
    dCard.appendChild(el('<p class="hint" style="margin:8px 0 0">Higher = you followed your plan. Watch the dips — that\'s where money leaks.</p>'));
    row2.appendChild(dCard);

    var spCard = el('<div class="card"><div class="card-hd"><h3>P&L by setup</h3></div></div>');
    spCard.appendChild(el('<div>' + svgHBars(CM.setupPerformance().map(function (s) { return { label: s.setup + " (" + s.winRate + "% · " + s.n + ")", value: s.pnl, fmt: money(s.pnl) }; })) + '</div>'));
    row2.appendChild(spCard);
    v.appendChild(row2);

    var emo = CM.emotionBreakdown();
    var eCard = el('<div class="card" style="margin-top:16px"><div class="card-hd"><h3>What you feel when you trade</h3></div></div>');
    eCard.appendChild(el('<div>' + svgHBars(emo.map(function (x) { var bad = /revenge|fomo|fear|greed|overconf/i.test(x.label); return { label: x.label, value: bad ? -x.n : x.n, fmt: x.n + " trades" }; })) + '</div>'));
    eCard.appendChild(el('<p class="hint" style="margin:6px 0 0">Red = emotional states that usually cost you. Green = calm, planned trading.</p>'));
    v.appendChild(eCard);
    return v;
  };

  // ---- LOG A TRADE ---------------------------------------------------------
  VIEWS.log = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Log a Trade", "Honesty in = honesty out. This is between you and your data."));
    var c = el('<div class="card"></div>');
    var f =
      '<div class="grid g2"><label class="fld"><span>Symbol</span><input id="sym" placeholder="NIFTY 24500 CE / RELIANCE" /></label>' +
      '<label class="fld"><span>Side</span><select id="side"><option>Buy</option><option>Sell</option></select></label></div>' +
      '<div class="grid g4"><label class="fld"><span>Qty</span><input id="qty" type="number" /></label>' +
      '<label class="fld"><span>Entry</span><input id="entry" type="number" /></label>' +
      '<label class="fld"><span>Exit</span><input id="exit" type="number" /></label>' +
      '<label class="fld"><span>Planned SL</span><input id="sl" type="number" placeholder="(be honest)" /></label></div>' +
      '<div class="grid g3"><label class="fld"><span>Setup</span><select id="setup">' + CM.SETUPS.map(function (x) { return '<option>' + x + '</option>'; }).join("") + '</select></label>' +
      '<label class="fld"><span>Why did you exit?</span><select id="xr">' + CM.EXITS.map(function (x) { return '<option>' + x + '</option>'; }).join("") + '</select></label>' +
      '<label class="fld"><span>Your emotion</span><select id="emo">' + CM.EMOTIONS.map(function (x) { return '<option>' + x + '</option>'; }).join("") + '</select></label></div>';
    c.innerHTML = f;
    var save = el('<button class="btn btn-primary btn-lg">Save trade &amp; update my score</button>');
    save.addEventListener("click", function () {
      var sym = c.querySelector("#sym").value.trim(); if (!sym) { c.querySelector("#sym").focus(); return; }
      var slv = c.querySelector("#sl").value;
      CM.addTrade({ symbol: sym, side: c.querySelector("#side").value, qty: +c.querySelector("#qty").value || 0,
        entry: +c.querySelector("#entry").value || 0, exit: +c.querySelector("#exit").value || 0,
        plannedSL: slv === "" ? null : +slv, target: null, setup: c.querySelector("#setup").value,
        exit_reason: c.querySelector("#xr").value, emotion: c.querySelector("#emo").value, date: new Date().toISOString() });
      go("home"); render();
    });
    c.appendChild(save);
    c.appendChild(el('<p class="hint" style="margin-top:10px">Tip: leaving <b>Planned SL</b> empty counts as “traded without a stop” — because that’s the truth we\'re measuring.</p>'));
    v.appendChild(c);
    return v;
  };

  // ---- TRADE JOURNAL -------------------------------------------------------
  VIEWS.trades = function () {
    var s = CM.load(), st = CM.stats();
    var v = el('<div></div>');
    var exp = el('<button class="btn btn-sm">⬇ Export CSV</button>'); exp.addEventListener("click", exportCSV);
    var imp = el('<button class="btn btn-sm">⬆ Import CSV</button>'); imp.addEventListener("click", importCSV);
    v.appendChild(topbar("Trade Journal", st.count + " trades logged", [exp, imp, logBtn()]));
    var limit = CM.PLANS[s.profile.plan].limits.history;
    var shown = st.trades;
    if (!shown.length) {
      var empty = el('<div class="card paywall"><div class="lock-ic">📓</div><h3>No trades yet</h3><p class="hint">Log your first trade to see your Discipline Score come alive.</p></div>');
      var b = el('<button class="btn btn-primary" style="margin-top:8px">＋ Log a trade</button>'); b.addEventListener("click", function () { go("log"); });
      empty.appendChild(b); v.appendChild(empty); return v;
    }
    var c = el('<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Symbol</th><th>Setup</th><th class="num">P&L</th><th>Exit reason</th><th>Emotion</th><th class="num">Disc.</th><th>When</th><th></th></tr></thead><tbody></tbody></table></div>');
    var tb = c.querySelector("tbody");
    shown.forEach(function (t) {
      var p = CM.pnl(t), d = CM.tradeDiscipline(t);
      var tr = el('<tr><td><b>' + esc(t.symbol) + '</b><div class="hint">' + t.side + ' ' + t.qty + '</div></td>' +
        '<td><span class="chip">' + esc(t.setup) + '</span></td>' +
        '<td class="num ' + (p >= 0 ? "pos" : "neg") + '">' + money(p) + '</td>' +
        '<td>' + esc(t.exit_reason) + (CM.hasSL(t) ? '' : ' <span class="badge b-red">no SL</span>') + '</td>' +
        '<td>' + esc(t.emotion) + '</td>' +
        '<td class="num"><b style="color:' + scoreColor(d) + '">' + d + '</b></td>' +
        '<td class="hint">' + ago(t.date) + '</td><td></td></tr>');
      var del = el('<button class="btn btn-sm">✕</button>'); del.addEventListener("click", function () { CM.deleteTrade(t.id); render(); });
      tr.lastChild.appendChild(del); tb.appendChild(tr);
    });
    v.appendChild(c);
    if (limit !== Infinity) v.appendChild(el('<div class="notice" style="margin-top:12px">Free plan analyses your data — full unlimited history &amp; export is in <b>Plus</b>.</div>'));
    return v;
  };

  // ---- Modal dialog --------------------------------------------------------
  function dialog(title, bodyHtml, onMount) {
    var back = el('<div style="position:fixed;inset:0;background:rgba(11,21,51,.55);z-index:120;display:grid;place-items:center;padding:18px"></div>');
    var box = el('<div style="background:#fff;border-radius:18px;max-width:620px;width:100%;max-height:88vh;overflow:auto;box-shadow:var(--shadow-lg)"></div>');
    var hd = el('<div style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff"><h3 style="margin:0;flex:1">' + title + '</h3></div>');
    var x = el('<button class="btn btn-sm">✕</button>'); x.addEventListener("click", close); hd.appendChild(x);
    var body = el('<div style="padding:20px"></div>'); body.innerHTML = bodyHtml;
    box.appendChild(hd); box.appendChild(body); back.appendChild(box); document.body.appendChild(back);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    function close() { if (back.parentNode) document.body.removeChild(back); }
    if (onMount) onMount(body, close);
    return { close: close, body: body };
  }

  // ---- RISK CALCULATOR -----------------------------------------------------
  var calcSide = "long";
  VIEWS.calc = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Risk & Position-Size Calculator", "Size every trade before you click. The #1 discipline habit."));
    var c = el('<div class="card"></div>');
    c.innerHTML =
      '<div style="display:flex;gap:8px;margin-bottom:14px">' +
        '<button class="btn btn-sm" id="kLong">▲ Long / Buy</button>' +
        '<button class="btn btn-sm" id="kShort">▼ Short / Sell</button></div>' +
      '<div class="grid g3">' +
        '<label class="fld"><span>Account capital (₹)</span><input id="kCap" type="number" value="100000"/></label>' +
        '<label class="fld"><span>Risk per trade (%)</span><input id="kRisk" type="number" value="1" step="0.1"/></label>' +
        '<label class="fld"><span>Lot / multiplier</span><input id="kLot" type="number" value="1" min="1"/></label>' +
        '<label class="fld"><span>Entry price</span><input id="kEntry" type="number" value="100" step="0.05"/></label>' +
        '<label class="fld"><span>Stop-loss</span><input id="kStop" type="number" value="95" step="0.05"/></label>' +
        '<label class="fld"><span>Target (optional)</span><input id="kTarget" type="number" value="110" step="0.05"/></label>' +
      '</div>' +
      '<div id="kOut" style="margin-top:6px"></div>';
    v.appendChild(c);

    function n(id) { var x = parseFloat(c.querySelector(id).value); return isNaN(x) ? 0 : x; }
    function inr(x) { return "₹" + Math.round(x).toLocaleString("en-IN"); }
    function run() {
      var cap = n("#kCap"), rp = n("#kRisk"), entry = n("#kEntry"), stop = n("#kStop"),
          target = n("#kTarget"), lot = Math.max(1, n("#kLot") || 1);
      var riskAmt = cap * rp / 100, perUnit = Math.abs(entry - stop);
      var units = perUnit > 0 ? Math.floor(riskAmt / perUnit / lot) * lot : 0;
      var value = units * entry;
      var stopOK = calcSide === "long" ? stop < entry : stop > entry;
      var rr = 0, reward = 0, rewUnit = 0, tOK = true;
      if (target > 0) { rewUnit = calcSide === "long" ? target - entry : entry - target; tOK = rewUnit > 0; reward = units * Math.max(0, rewUnit); rr = perUnit > 0 ? Math.max(0, rewUnit) / perUnit : 0; }
      var badge = !stopOK ? '<span class="badge b-red">⚠ stop on wrong side</span>'
        : (target > 0 && !tOK) ? '<span class="badge b-red">⚠ target on wrong side</span>'
        : rr >= 2 ? '<span class="badge b-green">▲ strong setup · R:R ' + rr.toFixed(1) + '</span>'
        : rr && rr < 1 ? '<span class="badge b-yellow">⚠ poor risk:reward</span>'
        : '<span class="badge b-navy">' + (calcSide === "long" ? "long" : "short") + ' setup</span>';
      var rows = [["You risk", inr(riskAmt), "neg"], ["Position size", units.toLocaleString("en-IN") + (lot > 1 ? " (" + (units / lot) + " lots)" : " units"), ""],
        ["Position value", inr(value), ""], ["Risk : Reward", rr ? "1 : " + rr.toFixed(2) : "—", rr >= 2 ? "pos" : ""],
        ["Potential reward", reward ? inr(reward) : "—", "pos"], ["Reward %", value && reward ? "+" + (reward / value * 100).toFixed(1) + "%" : "—", "pos"]];
      c.querySelector("#kOut").innerHTML = '<div style="margin:10px 0">' + badge + '</div><div class="grid g3">' +
        rows.map(function (r) { return '<div class="card" style="padding:12px"><div class="hint">' + r[0] + '</div><div class="mono ' + r[2] + '" style="font-size:1.2rem;font-weight:800">' + r[1] + '</div></div>'; }).join("") + '</div>';
    }
    ["#kCap", "#kRisk", "#kLot", "#kEntry", "#kStop", "#kTarget"].forEach(function (id) { c.querySelector(id).addEventListener("input", run); });
    c.querySelector("#kLong").addEventListener("click", function () { calcSide = "long"; run(); });
    c.querySelector("#kShort").addEventListener("click", function () { calcSide = "short"; run(); });
    run();
    return v;
  };

  // ---- CSV export / import -------------------------------------------------
  var CSV_COLS = ["symbol", "side", "qty", "entry", "exit", "plannedSL", "setup", "exit_reason", "emotion", "date"];
  function exportCSV() {
    var tr = CM.load().trades;
    var rows = [CSV_COLS.join(",")].concat(tr.map(function (t) {
      return CSV_COLS.map(function (k) { var val = t[k] == null ? "" : String(t[k]); return /[",\n]/.test(val) ? '"' + val.replace(/"/g, '""') + '"' : val; }).join(",");
    }));
    var blob = new Blob([rows.join("\n")], { type: "text/csv" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "chintasmoney-trades.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importCSV() {
    var body = '<p class="hint">Upload a CSV with columns:<br><code>' + CSV_COLS.join(", ") + '</code><br>Only <b>symbol</b> is required; missing stop-loss counts as “no SL”.</p>' +
      '<input type="file" id="csvf" accept=".csv,text/csv" style="margin-top:10px" /><p class="hint" id="csvnote" style="margin-top:8px"></p>';
    dialog("Import trades from CSV", body, function (b, close) {
      b.querySelector("#csvf").addEventListener("change", function (e) {
        var f = e.target.files[0]; if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          try {
            var n = parseCSV(String(rd.result));
            b.querySelector("#csvnote").innerHTML = '<span class="pos">Imported ' + n + ' trade(s).</span>';
            setTimeout(function () { close(); go("home"); render(); }, 700);
          } catch (err) { b.querySelector("#csvnote").innerHTML = '<span class="neg">Could not read that file.</span>'; }
        };
        rd.readAsText(f);
      });
    });
  }
  function parseCSV(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return 0;
    var head = splitCSVLine(lines[0]).map(function (h) { return h.trim().toLowerCase(); });
    var idx = {}; CSV_COLS.forEach(function (k) { idx[k] = head.indexOf(k.toLowerCase()); });
    var count = 0;
    for (var i = 1; i < lines.length; i++) {
      var cells = splitCSVLine(lines[i]);
      var get = function (k) { return idx[k] >= 0 ? (cells[idx[k]] || "").trim() : ""; };
      var sym = get("symbol"); if (!sym) continue;
      var sl = get("plannedSL");
      CM.addTrade({ symbol: sym, side: get("side") || "Buy", qty: +get("qty") || 0, entry: +get("entry") || 0,
        exit: +get("exit") || 0, plannedSL: sl === "" ? null : +sl, target: null,
        setup: get("setup") || "Other", exit_reason: get("exit_reason") || "Hit target",
        emotion: get("emotion") || "Calm", date: get("date") || new Date().toISOString() });
      count++;
    }
    return count;
  }
  function splitCSVLine(line) {
    var out = [], cur = "", q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else { if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch; }
    }
    out.push(cur); return out;
  }

  // ---- MISTAKE INSIGHTS ----------------------------------------------------
  VIEWS.insights = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Mistake Insights", "Your repeating leaks — ranked by how often they happen."));
    var ms = CM.mistakes();
    var c = el('<div class="card"></div>');
    if (!ms.length) c.appendChild(el('<p class="hint">Clean sheet so far. Keep logging honestly.</p>'));
    ms.forEach(function (m) {
      var max = ms[0].n || 1;
      c.appendChild(el('<div style="margin:10px 0"><div style="display:flex;justify-content:space-between"><b>' + esc(m.name) + '</b><span class="muted">×' + m.n + '</span></div><div class="bar coral" style="margin:6px 0"><i style="width:' + Math.round(m.n / max * 100) + '%"></i></div><div class="hint">' + esc(m.tip) + '</div></div>'));
    });
    v.appendChild(c);
    return v;
  };

  // ---- SETUP PERFORMANCE (Pro) ---------------------------------------------
  VIEWS.strategy = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Setup Performance", "Which of your setups actually make money?"));
    var sp = CM.setupPerformance();
    var c = el('<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>Setup</th><th class="num">Trades</th><th class="num">Win rate</th><th class="num">Net P&L</th></tr></thead><tbody></tbody></table></div>');
    var tb = c.querySelector("tbody");
    sp.forEach(function (r) { tb.appendChild(el('<tr><td><b>' + esc(r.setup) + '</b></td><td class="num">' + r.n + '</td><td class="num">' + r.winRate + '%</td><td class="num ' + (r.pnl >= 0 ? "pos" : "neg") + '">' + money(r.pnl) + '</td></tr>')); });
    v.appendChild(c);
    if (sp.length) { var best = sp[0], worst = sp[sp.length - 1]; v.appendChild(el('<div class="notice" style="margin-top:12px">Your <b>' + esc(best.setup) + '</b> setup is your money-maker. Your <b>' + esc(worst.setup) + '</b> setup is bleeding — do you even need it?</div>')); }
    return v;
  };

  // ---- DISCIPLINE COACH ----------------------------------------------------
  var chat = [];
  VIEWS.coach = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Discipline Coach", "Asks about YOUR data. Coaches behaviour — never gives buy/sell tips."));
    var c = el('<div class="card"></div>');
    var box = el('<div class="chat"></div>');
    if (!chat.length) chat.push({ r: "a", t: "I'm your discipline coach. I won't tell you what to trade — I'll show you how you trade. Ask me something." });
    chat.forEach(function (m) { box.appendChild(bubble(m)); });
    c.appendChild(box);
    var sug = el('<div class="suggest"></div>');
    ["Why is my discipline score low?", "What's my biggest mistake?", "Which setup should I drop?", "Am I overtrading?", "How do I stop revenge trading?"].forEach(function (q) { var b = el('<button>' + q + '</button>'); b.addEventListener("click", function () { ask(q, box); }); sug.appendChild(b); });
    c.appendChild(sug);
    var comp = el('<div class="composer"><input placeholder="Ask your coach…" /><button class="btn btn-primary">Ask</button></div>');
    var i = comp.querySelector("input"), b = comp.querySelector("button");
    function send() { var q = i.value.trim(); if (q) { i.value = ""; ask(q, box); } }
    b.addEventListener("click", send); i.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
    c.appendChild(comp); v.appendChild(c); return v;
  };
  function bubble(m) { var e = el('<div class="msg ' + m.r + '">' + esc(m.t).replace(/\n/g, "<br>") + '</div>'); if (m.ev) e.appendChild(el('<div class="ev"><b>From your data:</b> ' + esc(m.ev) + '</div>')); return e; }
  function ask(q, box) { chat.push({ r: "u", t: q }); box.appendChild(bubble(chat[chat.length - 1])); var a = coach(q); chat.push({ r: "a", t: a.t, ev: a.ev }); box.appendChild(bubble(chat[chat.length - 1])); box.scrollTop = box.scrollHeight; CM.load().usage.aiQuestions++; CM.save(); }
  function coach(q) {
    var st = CM.stats(), lc = q.toLowerCase(), ms = CM.mistakes();
    if (/discipline|score|low|why/.test(lc)) return { t: "Your discipline score is " + st.discipline + " (" + scoreLabel(st.discipline) + "). The biggest drags: " + (st.noSL ? st.noSL + " trades with no stop-loss, " : "") + st.emotional + " emotional exits" + (st.overtradeDays ? ", and " + st.overtradeDays + " overtrading day(s)" : "") + ". Fix stops first — it's the fastest 40-point swing.", ev: st.count + " trades analysed" };
    if (/mistake|biggest|wrong/.test(lc)) return { t: ms.length ? "Your #1 leak is “" + ms[0].name + "” (×" + ms[0].n + "). " + ms[0].tip : "No repeating mistake stands out yet.", ev: ms.length ? ms.map(function (m) { return m.name + " ×" + m.n; }).join(", ") : "clean" };
    if (/setup|drop|strategy/.test(lc)) { var sp = CM.setupPerformance(); var w = sp[sp.length - 1]; return { t: w ? "Your weakest setup is “" + w.setup + "” (" + w.winRate + "% win, " + money(w.pnl) + "). If it keeps bleeding, cut it and double down on “" + sp[0].setup + "”." : "Log more trades to compare setups.", ev: "setup P&L from your logs" }; }
    if (/overtrad/.test(lc)) return { t: st.overtradeDays ? "Yes — " + st.overtradeDays + " day(s) you took more than 3 trades. More trades ≠ more money; it usually means chasing." : "No — you're not overtrading. Good.", ev: st.overtradeDays + " overtrading days" };
    if (/revenge/.test(lc)) return { t: "Revenge trading is the account-killer. Rule: after any red trade, hands off the keyboard for 10 minutes. Set a hard daily loss limit and stop when you hit it. I'll track whether you actually followed it.", ev: null };
    return { t: "I answer from your own trades: discipline score, mistakes, setups, overtrading, revenge. Try a suggestion above.", ev: null };
  }

  // ---- BADGES & STREAKS ----------------------------------------------------
  VIEWS.badges = function () {
    var v = el('<div></div>');
    v.appendChild(topbar("Streaks & Badges", "Earn these by trading with discipline — not by winning."));
    var g = el('<div class="grid g3"></div>');
    CM.badges().forEach(function (b) {
      g.appendChild(el('<div class="card" style="text-align:center;opacity:' + (b.got ? "1" : ".45") + '"><div style="font-size:2.2rem">' + b.em + '</div><h3>' + esc(b.name) + ' ' + (b.got ? '<span class="badge b-green">earned</span>' : '<span class="badge b-navy">locked</span>') + '</h3><p class="hint">' + esc(b.desc) + '</p></div>'));
    });
    v.appendChild(g);
    return v;
  };

  // ---- LEADERBOARD (mock, discipline-based) --------------------------------
  VIEWS.leaderboard = function () {
    var s = CM.load(), st = CM.stats();
    var v = el('<div></div>');
    v.appendChild(topbar("Discipline Leaderboard", "Ranked by discipline, NOT by P&L — because P&L lies."));
    var rows = [
      { h: "@steady_sniper", d: 92 }, { h: "@nifty_ninja", d: 88 }, { h: "@calm_capital", d: 84 },
      { h: (s.profile.handle || "you"), d: st.discipline, me: true }, { h: "@yolo_options", d: 41 }, { h: "@revenge_raj", d: 29 }
    ].sort(function (a, b) { return b.d - a.d; });
    var c = el('<div class="card"></div>');
    rows.forEach(function (r, i) { c.appendChild(el('<div class="attn"' + (r.me ? ' style="background:rgba(20,184,166,.08);border-radius:10px;padding-left:8px"' : '') + '><div style="font-weight:800;width:26px;color:var(--muted)">' + (i + 1) + '</div><div style="flex:1"><b>' + esc(r.h) + '</b>' + (r.me ? ' <span class="badge b-navy">you</span>' : '') + '</div><div style="font-weight:800;color:' + scoreColor(r.d) + '">' + r.d + '</div></div>')); });
    v.appendChild(c);
    v.appendChild(el('<div class="notice" style="margin-top:12px">Other traders here are demo accounts. A real leaderboard needs the backend — but rewarding <b>discipline</b> instead of P&L is the whole point.</div>'));
    return v;
  };

  // ---- SHAREABLE CARD ------------------------------------------------------
  VIEWS.card = function () {
    var s = CM.load(), st = CM.stats(), p = st.personality;
    var v = el('<div></div>');
    v.appendChild(topbar("Your Shareable Card", "Screenshot it. Post it. Tag a trader who needs it."));
    var card = el('<div class="card" style="max-width:440px;margin:0 auto;background:linear-gradient(160deg,var(--navy),var(--navy-2));color:#fff;border:0"></div>');
    card.appendChild(el('<div style="display:flex;justify-content:space-between;align-items:center"><b style="letter-spacing:.02em">ChintasMoney</b><span style="color:#8ea3c9;font-size:.75rem">TRADER REPORT CARD</span></div>'));
    card.appendChild(el('<div style="text-align:center;margin:14px 0">' + gauge(st.discipline, 170).replace('fill="var(--ink)"', 'fill="#fff"').replace('fill="var(--line)"', 'fill="rgba(255,255,255,.15)"').replace('fill="var(--muted)"', 'fill="#8ea3c9"') + '</div>'));
    card.appendChild(el('<div style="text-align:center"><div style="font-size:1.9rem">' + p.em + '</div><h2 style="margin:2px 0;color:#fff">' + esc(p.key) + '</h2><p style="color:#b7c4dd;font-size:.9rem;margin:0 auto;max-width:34ch">' + esc(p.line) + '</p></div>'));
    function cell(l, val) { return '<div><div style="font-size:1.3rem;font-weight:800">' + val + '</div><div style="color:#8ea3c9;font-size:.72rem">' + l + '</div></div>'; }
    card.appendChild(el('<div style="display:flex;justify-content:space-around;margin-top:16px;text-align:center">' + cell("Win rate", st.winRate + "%") + cell("No-SL", st.noSL) + cell("Emo exits", st.emotional) + '</div>'));
    card.appendChild(el('<div style="text-align:center;margin-top:16px;color:#8ea3c9;font-size:.75rem">chintasmoney.com · discipline over profit</div>'));
    v.appendChild(card);
    v.appendChild(el('<p class="hint" style="text-align:center;margin-top:12px">Take a screenshot to share. (Auto image export &amp; one-tap share come with the backend.)</p>'));
    return v;
  };

  // ---- PROFILE & PLAN ------------------------------------------------------
  VIEWS.profile = function () {
    var s = CM.load();
    var v = el('<div></div>');
    v.appendChild(topbar("Profile & Plan"));
    var pc = el('<div class="card"><div class="card-hd"><h3>You</h3></div></div>');
    var h = el('<label class="fld"><span>Public handle (for your card &amp; leaderboard)</span><input placeholder="@yourname" /></label>');
    h.querySelector("input").value = s.profile.handle || "";
    h.querySelector("input").addEventListener("change", function (e) { CM.setProfile({ handle: e.target.value }); });
    pc.appendChild(el('<p>Name: <b>' + esc(s.profile.name || "—") + '</b></p>')); pc.appendChild(h);
    v.appendChild(pc);

    v.appendChild(el('<h2 style="margin:22px 0 8px;font-size:1.15rem">Subscription</h2>'));
    // 7-day Pro trial
    var trialLeft = s.profile.trialEndsAt ? Math.ceil((new Date(s.profile.trialEndsAt) - Date.now()) / 86400000) : 0;
    if (trialLeft > 0) {
      v.appendChild(el('<div class="notice" style="background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.35);color:#148a3c">🎉 Pro trial active — <b>' + trialLeft + ' day(s)</b> left. Enjoy every feature.</div>'));
    } else if (s.profile.plan === "free") {
      var tb = el('<div class="card" style="border-color:var(--emerald);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><b>Try Pro free for 7 days</b><div class="hint">Unlock everything — no card needed in this preview.</div></div></div>');
      var tbtn = el('<button class="btn btn-primary">Start 7-day trial</button>');
      tbtn.addEventListener("click", function () { CM.setProfile({ plan: "pro", trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString() }); render(); });
      tb.appendChild(tbtn); v.appendChild(tb);
    }
    var plans = el('<div class="plans"></div>');
    Object.keys(CM.PLANS).forEach(function (id) {
      var p = CM.PLANS[id], cur = s.profile.plan === id;
      var card = el('<div class="plan' + (id === "plus" ? " feat" : "") + '">' + (id === "plus" ? '<span class="badge b-green" style="align-self:flex-start;margin-bottom:8px">Most popular</span>' : '') +
        '<h3>' + p.name + '</h3><div class="amt">' + (p.price ? "₹" + p.price : "Free") + '<span class="hint" style="font-size:.9rem;font-weight:500">' + (p.price ? "/" + p.cadence : "") + '</span></div><p class="hint">' + p.blurb + '</p>' +
        '<ul>' + p.features.slice(0, 7).map(function (f) { return '<li>' + f.replace(/-/g, " ") + '</li>'; }).join("") + '</ul></div>');
      var b = el('<button class="btn ' + (cur ? "" : "btn-primary") + '"' + (cur ? " disabled" : "") + '>' + (cur ? "Current plan" : "Switch to " + p.name) + '</button>');
      b.addEventListener("click", function () { CM.setProfile({ plan: id }); render(); });
      card.appendChild(b); plans.appendChild(card);
    });
    v.appendChild(plans);
    var reset = el('<button class="btn btn-ghost" style="margin-top:20px">↺ Reset demo data</button>'); reset.addEventListener("click", function () { if (confirm("Reset all local data?")) { CM.reset(); go("home"); render(); } });
    v.appendChild(reset);
    v.appendChild(el('<div class="disclaimer"><b>Important:</b> ChintasMoney is a trading self-awareness &amp; journaling tool. It does <b>not</b> give buy/sell calls, tips, or investment advice, and makes no return claims. Trading in F&O is risky and most traders lose money. Your data stays on your device in this MVP.</div>'));
    return v;
  };

  // ---- Onboarding ----------------------------------------------------------
  var onb = { step: 0, name: "", handle: "" };
  function renderOnboarding() {
    root.innerHTML = "";
    var wrap = el('<div class="onb"></div>'), c = el('<div class="onb-card"></div>');
    c.appendChild(el('<div class="brand" style="padding:0 0 6px"><span class="brand-badge brand-logo-chip"><img src="assets/logo.png" alt="ChintasMoney"/></span><div><b style="color:var(--ink)">ChintasMoney</b><small style="color:var(--muted)">TRADER REPORT CARD</small></div></div>'));
    if (onb.step === 0) {
      c.appendChild(el('<h2 style="margin:12px 0 4px">Ready for the honest truth? 👀</h2>'));
      c.appendChild(el('<p class="hint">Most traders track P&L. You\'re about to track the thing that actually decides it — your discipline. What should we call you?</p>'));
      var nm = el('<label class="fld"><span>Your name</span><input placeholder="e.g. Basava" /></label>'); nm.querySelector("input").value = onb.name;
      c.appendChild(nm);
      var n = el('<button class="btn btn-primary">Continue →</button>'); n.addEventListener("click", function () { onb.name = nm.querySelector("input").value.trim(); onb.step = 1; renderOnboarding(); });
      c.appendChild(n);
    } else {
      c.appendChild(el('<h2 style="margin:12px 0 4px">Pick a handle</h2>'));
      c.appendChild(el('<p class="hint">Shown on your shareable card &amp; the discipline leaderboard. You can change it later.</p>'));
      var hd = el('<label class="fld"><span>Handle</span><input placeholder="@yourname" /></label>'); hd.querySelector("input").value = onb.handle;
      c.appendChild(hd);
      c.appendChild(el('<div class="notice">We\'ve loaded sample trades so your report card is alive from second one. Reset anytime in Profile.</div>'));
      var d = el('<button class="btn btn-primary" style="margin-top:8px">See my Report Card →</button>');
      d.addEventListener("click", function () { CM.setProfile({ name: onb.name, handle: hd.querySelector("input").value.trim(), onboarded: true }); go("home"); render(); });
      c.appendChild(d);
    }
    var dots = el('<div class="steps-dots"></div>'); [0, 1].forEach(function (i) { dots.appendChild(el('<i class="' + (i <= onb.step ? "on" : "") + '"></i>')); }); c.appendChild(dots);
    wrap.appendChild(c); root.appendChild(wrap);
  }

  render();
})();
