(function () {
  'use strict';
  // Local-currency hint for the front-facing price anchors.
  //
  // KWD is the price. It is written into the HTML, it is what the JSON-LD offers say,
  // and it is what a client is invoiced. This script only APPENDS an approximate local
  // equivalent so a visitor in Dubai or London is not doing mental arithmetic before
  // deciding whether to start a conversation. Nothing here is authoritative, nothing is
  // replaced, and if anything is unknown the KWD figure is simply left alone — a missing
  // conversion costs nothing, a wrong one costs trust.
  //
  // Rates checked 2026-09-02. The dinar is pegged to a currency basket and moves very
  // little, so these are good for a long while; the GCC entries are pegged to USD and
  // barely move at all. Refresh if the USD figure drifts more than a percent or two.
  var RATES = {
    USD: 3.26, EUR: 2.81, GBP: 2.38,
    AED: 11.92, SAR: 12.18, QAR: 11.87, BHD: 1.23, OMR: 1.25,
  };
  var SYMBOL = {
    USD: '$', EUR: '€', GBP: '£',
    AED: 'AED ', SAR: 'SAR ', QAR: 'QAR ', BHD: 'BHD ', OMR: 'OMR ',
  };

  // IANA zone → currency. Timezone beats navigator.language for location: a Gulf client
  // browsing in English reports en-US or en-GB and would otherwise be quoted in dollars.
  var ZONES = {
    'Asia/Kuwait': 'KWD',
    'Asia/Dubai': 'AED', 'Asia/Muscat': 'OMR', 'Asia/Riyadh': 'SAR',
    'Asia/Qatar': 'QAR', 'Asia/Bahrain': 'BHD',
    'Europe/London': 'GBP', 'Europe/Dublin': 'EUR', 'Europe/Paris': 'EUR',
    'Europe/Berlin': 'EUR', 'Europe/Madrid': 'EUR', 'Europe/Rome': 'EUR',
    'Europe/Amsterdam': 'EUR', 'Europe/Brussels': 'EUR', 'Europe/Lisbon': 'EUR',
  };

  function currency() {
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (ZONES[zone]) return ZONES[zone];
    // Unmapped Gulf zones still price in dinars locally; anything else defaults to USD,
    // the currency a cross-border client is most likely to be budgeting in anyway.
    if (zone.indexOf('America/') === 0 || zone.indexOf('Australia/') === 0) return 'USD';
    if (zone.indexOf('Europe/') === 0) return 'EUR';
    return 'USD';
  }

  // Round hard. "≈ $8,150" reads as a real quote; "≈ $8,150" for a figure that is itself
  // a starting point is false precision, so land on the nearest 50 (or 500 above 10k).
  function round(n) {
    var step = n >= 10000 ? 500 : n >= 1000 ? 50 : 5;
    return Math.round(n / step) * step;
  }

  function amount(kwd, cur) {
    return round(kwd * RATES[cur]).toLocaleString('en-US');
  }

  // The symbol leads the range once — "AED 36,000–143,000", not "AED 36,000–AED 143,000",
  // which reads as two separate prices rather than one span.
  function format(values, cur) {
    return SYMBOL[cur] + values.map(function (v) { return amount(v, cur); }).join('–');
  }

  function run() {
    var cur = currency();
    if (cur === 'KWD' || !RATES[cur]) return; // already in dinars, or nothing to say
    var nodes = document.querySelectorAll('[data-kwd]');
    for (var i = 0; i < nodes.length; i++) {
      var raw = nodes[i].getAttribute('data-kwd');
      var parts = String(raw).split('-').map(Number).filter(function (n) { return n > 0; });
      if (!parts.length) continue;
      var text = format(parts, cur);
      var span = document.createElement('span');
      span.className = 'fx';
      span.setAttribute('dir', 'ltr');
      span.textContent = ' ≈ ' + text;
      nodes[i].appendChild(span);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
