// ChintasMoney landing — interactions & motion
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // year
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  // mobile nav
  var tgl = $("#navToggle"), links = $("#navLinks");
  if (tgl && links) {
    tgl.addEventListener("click", function () { links.classList.toggle("open"); });
    links.addEventListener("click", function (e) { if (e.target.tagName === "A") links.classList.remove("open"); });
  }

  // ticker (mock symbols; duplicated for seamless loop)
  var syms = [
    ["NIFTY", "24,812", "+0.62%", 1], ["BANKNIFTY", "51,240", "-0.34%", 0], ["RELIANCE", "2,984", "+1.10%", 1],
    ["TCS", "3,910", "+0.20%", 1], ["HDFCBANK", "1,502", "-0.48%", 0], ["INFY", "1,648", "+0.72%", 1],
    ["TATAMOTORS", "985", "+2.05%", 1], ["ZOMATO", "168", "-1.30%", 0], ["ADANIENT", "2,988", "+0.90%", 1],
    ["SBIN", "832", "-0.22%", 0]
  ];
  var tk = $("#ticker");
  if (tk) {
    var row = syms.map(function (s) {
      return '<span class="t"><b>' + s[0] + '</b> ' + s[1] + ' <span class="' + (s[3] ? "up" : "down") + '">' + s[2] + '</span></span>';
    }).join("");
    tk.innerHTML = row + row; // duplicate for -50% scroll loop
  }

  // candles (random up/down bars)
  var cw = $("#candles");
  if (cw) {
    var html = "";
    for (var i = 0; i < 22; i++) {
      var up = Math.random() > 0.42;
      var h = 24 + Math.round(Math.random() * 52);
      html += '<span class="candle ' + (up ? "g" : "r") + '" style="height:' + h + '%;animation-delay:' + (i * 0.04) + 's"></span>';
    }
    cw.innerHTML = html;
  }

  // count-up numbers when visible
  function countUp(elm) {
    var target = parseFloat(elm.getAttribute("data-count")) || 0;
    var suffix = elm.getAttribute("data-suffix") || "";
    var dur = 1100, start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var val = Math.round((1 - Math.pow(1 - p, 3)) * target);
      elm.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // gauge draw to 42
  function drawGauge() {
    var arc = $("#gaugeArc"), num = $("#gaugeNum");
    if (!arc) return;
    var C = 389.5, score = 42, dur = 1300, start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      arc.setAttribute("stroke-dashoffset", C * (1 - (score / 100) * e));
      if (num) num.textContent = Math.round(score * e);
      // colour shifts with value
      arc.setAttribute("stroke", score < 50 ? "#f5b849" : "#22e08a");
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // reveal on scroll + trigger counters/gauge
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.querySelectorAll && en.target.querySelectorAll("[data-count]").forEach(countUp);
      if (en.target.querySelector && en.target.querySelector("#gaugeArc")) drawGauge();
      io.unobserve(en.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  // if hero already in view on load, kick gauge
  setTimeout(drawGauge, 400);
})();
