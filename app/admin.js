/* ChintasMoney — Admin console (prototype)
 * A front-end admin architecture: users, subscriptions, editable plan pricing,
 * feature flags, usage, AI usage, and data-source (adapter) status.
 * Plan-price and feature-flag edits persist via CM.adminConfig and take effect
 * in the app. User/payment/analytics rows are MOCK until a backend is wired. */
(function () {
  "use strict";
  var root = document.getElementById("root");
  var CM = window.CM;
  function el(h) { var t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; }
  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function money(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

  // MOCK user base (would come from the backend). The local demo user is real.
  var MOCK_USERS = [
    { name: "Aarav Sharma", email: "aarav@example.com", plan: "pro", persona: "trader", joined: "2025-04-02", ai: 812, status: "active" },
    { name: "Diya Patel", email: "diya@example.com", plan: "plus", persona: "investor", joined: "2025-06-18", ai: 63, status: "active" },
    { name: "Kabir Rao", email: "kabir@example.com", plan: "plus", persona: "both", joined: "2025-07-30", ai: 41, status: "past_due" },
    { name: "Meera Nair", email: "meera@example.com", plan: "free", persona: "personal", joined: "2025-08-11", ai: 4, status: "active" },
    { name: "Rohan Gupta", email: "rohan@example.com", plan: "free", persona: "planner", joined: "2025-09-01", ai: 2, status: "active" }
  ];

  var TAB = "overview";
  function render() {
    var s = CM.load();
    var localUser = { name: s.profile.name || "You (local demo)", email: "you@this-device", plan: s.profile.plan, persona: s.profile.persona || "—", joined: (s.meta.createdAt || "").slice(0, 10), ai: s.usage.aiQuestions, status: "active", local: true };
    var users = [localUser].concat(MOCK_USERS);

    root.innerHTML = "";
    var wrap = el('<div class="app"></div>');

    // sidebar
    var side = el('<aside class="sidebar"></aside>');
    side.appendChild(el('<a class="brand" href="index.html"><span class="brand-badge">₹</span><div><b>ChintasMoney</b><small>ADMIN CONSOLE</small></div></a>'));
    [["overview", "▦ Overview"], ["users", "☰ Users"], ["subs", "◈ Subscriptions"], ["plans", "₹ Plans & pricing"],
     ["flags", "⚑ Feature flags"], ["usage", "▤ Usage & AI"], ["data", "⇄ Data sources"], ["support", "✉ Support"]].forEach(function (t) {
      var a = el('<a class="nav-item' + (TAB === t[0] ? " active" : "") + '" href="#">' + t[1] + '</a>');
      a.addEventListener("click", function (e) { e.preventDefault(); TAB = t[0]; render(); });
      side.appendChild(a);
    });
    side.appendChild(el('<div class="nav-sep"></div>'));
    side.appendChild(el('<a class="nav-item" href="index.html">↩ Back to app</a>'));
    side.appendChild(el('<div class="side-foot"><span class="plan-pill">● Admin (prototype)</span></div>'));
    wrap.appendChild(side);

    var main = el('<main class="main"></main>');
    main.appendChild(el('<div class="topbar"><div><h1>' + tabTitle() + '</h1><div class="sub">Admin architecture prototype — plan &amp; flag edits are live; user/payment data is mock.</div></div></div>'));
    main.appendChild(TABS[TAB](users, s));
    wrap.appendChild(main);
    root.appendChild(wrap);
  }
  function tabTitle() { return ({ overview: "Overview", users: "Users", subs: "Subscriptions", plans: "Plans & Pricing", flags: "Feature Flags", usage: "Usage & AI", data: "Data Sources", support: "Support" })[TAB]; }

  function stat(lbl, val, note) { return el('<div class="card stat"><span class="lbl">' + lbl + '</span><span class="val">' + val + '</span><span class="hint">' + (note || "") + '</span></div>'); }
  function mrr(users) { return users.reduce(function (a, u) { return a + (CM.PLANS[u.plan] ? CM.PLANS[u.plan].price : 0); }, 0); }

  var TABS = {
    overview: function (users) {
      var v = el('<div></div>');
      var g = el('<div class="grid g4"></div>');
      g.appendChild(stat("Total users", String(users.length), "incl. 1 local"));
      g.appendChild(stat("Paying users", String(users.filter(function (u) { return CM.PLANS[u.plan].price > 0; }).length), "Plus + Pro"));
      g.appendChild(stat("MRR (mock)", money(mrr(users)), "monthly recurring"));
      g.appendChild(stat("AI questions", String(users.reduce(function (a, u) { return a + u.ai; }, 0)), "all-time"));
      v.appendChild(g);
      var mix = el('<div class="card" style="margin-top:16px"><div class="card-hd"><h3>Plan mix</h3></div></div>');
      ["free", "plus", "pro"].forEach(function (id) {
        var n = users.filter(function (u) { return u.plan === id; }).length, w = Math.round(n / users.length * 100);
        mix.appendChild(el('<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:.85rem"><span>' + CM.PLANS[id].name + '</span><span class="muted">' + n + ' · ' + w + '%</span></div><div class="bar"><i style="width:' + w + '%"></i></div></div>'));
      });
      v.appendChild(mix);
      return v;
    },
    users: function (users) {
      var v = el('<div></div>');
      var c = el('<div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr><th>User</th><th>Persona</th><th>Plan</th><th>Status</th><th class="num">AI</th><th>Joined</th></tr></thead><tbody></tbody></table></div>');
      var tb = c.querySelector("tbody");
      users.forEach(function (u) {
        var pb = { free: "b-navy", plus: "b-green", pro: "b-yellow" }[u.plan];
        var sb = u.status === "active" ? "b-green" : "b-red";
        tb.appendChild(el('<tr><td><b>' + esc(u.name) + '</b>' + (u.local ? ' <span class="chip">this device</span>' : '') + '<div class="hint">' + esc(u.email) + '</div></td>' +
          '<td>' + esc(u.persona) + '</td><td><span class="badge ' + pb + '">' + CM.PLANS[u.plan].name + '</span></td>' +
          '<td><span class="badge ' + sb + '">' + u.status.replace("_", " ") + '</span></td>' +
          '<td class="num">' + u.ai + '</td><td>' + esc(u.joined) + '</td></tr>'));
      });
      v.appendChild(c);
      return v;
    },
    subs: function (users) {
      var v = el('<div></div>');
      var g = el('<div class="grid g3"></div>');
      ["free", "plus", "pro"].forEach(function (id) {
        var subs = users.filter(function (u) { return u.plan === id; });
        var rev = subs.reduce(function (a) { return a + CM.PLANS[id].price; }, 0);
        g.appendChild(el('<div class="card"><div class="card-hd"><h3>' + CM.PLANS[id].name + '</h3></div><div class="stat"><span class="val">' + subs.length + '</span><span class="hint">subscribers · ' + money(rev) + '/mo</span></div></div>'));
      });
      v.appendChild(g);
      var pd = users.filter(function (u) { return u.status === "past_due"; });
      var c = el('<div class="card" style="margin-top:16px"><div class="card-hd"><h3>Needs attention</h3></div></div>');
      if (!pd.length) c.appendChild(el('<p class="hint">No past-due accounts.</p>'));
      pd.forEach(function (u) { c.appendChild(el('<div class="attn"><div class="dot red"></div><div><div class="t">' + esc(u.name) + ' — payment past due</div><div class="d">' + CM.PLANS[u.plan].name + ' · ' + esc(u.email) + '</div></div></div>')); });
      v.appendChild(c);
      v.appendChild(el('<div class="notice" style="margin-top:14px">Billing is not wired in the MVP (<code>adapters.payments.isLive = false</code>). Connect a payment gateway to activate real subscriptions, dunning, and invoices.</div>'));
      return v;
    },
    plans: function () {
      var v = el('<div></div>');
      v.appendChild(el('<p class="hint">Edit monthly price (₹). Saved to plan configuration and reflected in the app immediately — prices are not hard-coded.</p>'));
      var g = el('<div class="plans" style="margin-top:12px"></div>');
      Object.keys(CM.PLANS).forEach(function (id) {
        var p = CM.PLANS[id];
        var card = el('<div class="plan"><h3>' + p.name + '</h3><p class="hint">' + esc(p.blurb) + '</p></div>');
        var lab = el('<label class="fld"><span>Price (₹ / ' + p.cadence + ')</span><input type="number" min="0" value="' + p.price + '"/></label>');
        var inp = lab.querySelector("input");
        card.appendChild(lab);
        var save = el('<button class="btn btn-primary btn-sm">Save price</button>');
        save.addEventListener("click", function () { CM.setPlanPrice(id, +inp.value || 0); render(); });
        card.appendChild(save);
        card.appendChild(el('<div style="margin-top:12px"><b style="font-size:.85rem">Included</b><ul style="margin:6px 0 0">' + p.features.slice(0, 8).map(function (f) { return '<li>' + f.replace(/-/g, " ") + '</li>'; }).join("") + '</ul></div>'));
        g.appendChild(card);
      });
      v.appendChild(g);
      return v;
    },
    flags: function () {
      var v = el('<div></div>');
      var cfg = CM.adminConfig();
      var c = el('<div class="card"><div class="card-hd"><h3>Feature flags</h3></div></div>');
      Object.keys(cfg.flags).forEach(function (k) {
        var row = el('<div class="attn"><div class="dot ' + (cfg.flags[k] ? "green" : "red") + '"></div><div style="flex:1"><div class="t">' + k + '</div><div class="d">' + (cfg.flags[k] ? "Enabled" : "Disabled") + '</div></div></div>');
        var btn = el('<button class="btn btn-sm">' + (cfg.flags[k] ? "Disable" : "Enable") + '</button>');
        btn.addEventListener("click", function () { CM.setFlag(k, !cfg.flags[k]); render(); });
        row.appendChild(btn);
        c.appendChild(row);
      });
      v.appendChild(c);
      v.appendChild(el('<div class="notice" style="margin-top:14px">Flags persist per device in this prototype. In production they gate features per-user / per-cohort from the backend.</div>'));
      return v;
    },
    usage: function (users, s) {
      var v = el('<div></div>');
      var g = el('<div class="grid g4"></div>');
      g.appendChild(stat("AI questions (all)", String(users.reduce(function (a, u) { return a + u.ai; }, 0)), "all-time"));
      g.appendChild(stat("This device", String(s.usage.aiQuestions), "AI questions used"));
      g.appendChild(stat("Free history", String(CM.PLANS.free.limits.history) + "d", "trade history"));
      g.appendChild(stat("Plus history", "∞", "unlimited"));
      v.appendChild(g);
      var c = el('<div class="card" style="margin-top:16px"><div class="card-hd"><h3>AI usage by user (mock)</h3></div></div>');
      users.slice().sort(function (a, b) { return b.ai - a.ai; }).forEach(function (u) {
        var max = Math.max.apply(null, users.map(function (x) { return x.ai; })) || 1;
        c.appendChild(el('<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:.85rem"><span>' + esc(u.name) + '</span><span class="muted">' + u.ai + '</span></div><div class="bar gold"><i style="width:' + Math.round(u.ai / max * 100) + '%"></i></div></div>'));
      });
      v.appendChild(c);
      return v;
    },
    data: function () {
      var v = el('<div></div>');
      var rows = [
        ["Broker / CSV import", CM.adapters.brokerImport.isLive, "Auto-import trades from broker or CSV"],
        ["Payments", false, "Gateway for subscriptions"],
        ["Notifications", CM.adapters.notifications.isLive, "Discipline nudges via push / WhatsApp / email"],
        ["Card image export", false, "Render shareable report card as an image"],
        ["Auth / accounts", false, "Real sign-up, sync across devices"]
      ];
      var c = el('<div class="card"><div class="card-hd"><h3>Integration adapters</h3></div></div>');
      rows.forEach(function (r) {
        c.appendChild(el('<div class="attn"><div class="dot ' + (r[1] ? "green" : "yellow") + '"></div><div style="flex:1"><div class="t">' + r[0] + ' ' + (r[1] ? '<span class="badge b-green">live</span>' : '<span class="badge b-yellow">mock</span>') + '</div><div class="d">' + r[2] + '</div></div></div>'));
      });
      v.appendChild(c);
      v.appendChild(el('<div class="notice" style="margin-top:14px">Every integration is behind an adapter interface (<code>store.js → adapters</code>). Swap a mock for a real client without touching the UI.</div>'));
      return v;
    },
    support: function () {
      var v = el('<div></div>');
      var tickets = [
        ["red", "Can't import my portfolio CSV", "Aarav Sharma · Pro · 2h ago"],
        ["yellow", "Question about thesis health logic", "Diya Patel · Plus · 1d ago"],
        ["green", "Feature request: crypto tracking", "Meera Nair · Free · 3d ago"]
      ];
      var c = el('<div class="card"><div class="card-hd"><h3>Recent tickets (mock)</h3></div></div>');
      tickets.forEach(function (t) { c.appendChild(el('<div class="attn"><div class="dot ' + t[0] + '"></div><div><div class="t">' + esc(t[1]) + '</div><div class="d">' + esc(t[2]) + '</div></div></div>')); });
      v.appendChild(c);
      return v;
    }
  };

  render();
})();
