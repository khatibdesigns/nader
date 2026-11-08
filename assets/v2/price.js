// Prices in the visitor's currency.
//
// Every price on the site is written once in its list currency
// (<span class="money" data-price="500" data-base="KWD">KWD 500</span>) and shown
// in the visitor's own currency: KWD in Kuwait, AED in the UAE, EUR in the euro
// area, USD as the default. Visitors can switch with any [data-currency-switch]
// control; the choice is remembered. Without JavaScript the list price shows.
//
// Rates are per 1 KWD, checked 2026-11. The dinar moves little and the Gulf
// currencies are pegged to the dollar; refresh if USD drifts more than ~2%.
(function () {
  'use strict';
  var RATES = {
    KWD: 1, USD: 3.26, EUR: 2.81, GBP: 2.45, CHF: 2.62, AUD: 4.95, CAD: 4.5, SGD: 4.24,
    AED: 11.97, SAR: 12.23, QAR: 11.87, BHD: 1.23, OMR: 1.25
  };
  var ORDER = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'BHD', 'OMR', 'KWD', 'CHF', 'AUD', 'CAD', 'SGD'];
  var ZONE = {
    'Asia/Kuwait': 'KWD', 'Asia/Dubai': 'AED', 'Asia/Riyadh': 'SAR', 'Asia/Qatar': 'QAR',
    'Asia/Bahrain': 'BHD', 'Asia/Muscat': 'OMR', 'Europe/London': 'GBP', 'Europe/Zurich': 'CHF',
    'Asia/Singapore': 'SGD', 'America/Toronto': 'CAD', 'America/Vancouver': 'CAD',
    'America/Edmonton': 'CAD', 'America/Winnipeg': 'CAD', 'America/Halifax': 'CAD'
  };
  var NON_EURO = /^Europe\/(London|Zurich|Oslo|Stockholm|Copenhagen|Warsaw|Prague|Budapest|Bucharest|Istanbul|Moscow|Kiev|Kyiv|Minsk|Belgrade|Sarajevo|Skopje|Tirane|Chisinau)$/;
  var REGION = { KW: 'KWD', AE: 'AED', SA: 'SAR', QA: 'QAR', BH: 'BHD', OM: 'OMR', GB: 'GBP', CH: 'CHF', AU: 'AUD', CA: 'CAD', SG: 'SGD', US: 'USD' };
  var EURO = 'AT BE BG CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');
  var KEY = 'khd_currency';

  function detect() {
    try {
      var q = new URLSearchParams(location.search).get('cur');
      if (q && RATES[q.toUpperCase()]) return q.toUpperCase();
    } catch (e) {}
    try { var saved = localStorage.getItem(KEY); if (saved && RATES[saved]) return saved; } catch (e) {}
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (ZONE[zone]) return ZONE[zone];
    if (zone.indexOf('Australia/') === 0) return 'AUD';
    if (zone.indexOf('Europe/') === 0 && !NON_EURO.test(zone)) return 'EUR';
    var region = ((navigator.language || '').split('-')[1] || '').toUpperCase();
    if (REGION[region]) return REGION[region];
    if (EURO.indexOf(region) > -1) return 'EUR';
    return 'USD';
  }

  // Land on numbers a person would quote: whole units under 100, then 5, 50 and 500 steps.
  // Under 100 we round up, so a converted checkout price is never understated.
  function nice(n) {
    if (n < 100) return Math.ceil(n);
    var step = n < 1000 ? 5 : n < 10000 ? 50 : 500;
    return Math.round(n / step) * step;
  }

  function convert(value, base, cur) {
    if (base === cur) return value;
    return nice(value / RATES[base] * RATES[cur]);
  }

  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  function fmt(n, cur) {
    try {
      return new Intl.NumberFormat(lang + '-u-nu-latn', {
        style: 'currency', currency: cur, currencyDisplay: lang === 'ar' ? 'narrowSymbol' : 'symbol',
        minimumFractionDigits: 0, maximumFractionDigits: 0
      }).format(n).replace(/[\u200e\u200f]/g, '').replace(/\.$/, '');
    } catch (e) {
      return cur + ' ' + n.toLocaleString('en-US');
    }
  }

  function render(cur) {
    document.querySelectorAll('.money[data-price]').forEach(function (el) {
      var base = (el.getAttribute('data-base') || 'KWD').toUpperCase();
      if (!RATES[base]) return;
      if (!el.hasAttribute('data-list')) el.setAttribute('data-list', el.textContent);
      el.textContent = base === cur ? el.getAttribute('data-list') : fmt(convert(+el.getAttribute('data-price'), base, cur), cur);
      el.setAttribute('dir', 'ltr');
      el.setAttribute('translate', 'no');
    });
    document.querySelectorAll('[data-currency-switch] select').forEach(function (s) { s.value = cur; });
    document.documentElement.setAttribute('data-currency', cur);
  }

  function names(code) {
    try { return new Intl.DisplayNames([lang], { type: 'currency' }).of(code); } catch (e) { return code; }
  }

  function switches(cur) {
    document.querySelectorAll('[data-currency-switch]').forEach(function (box) {
      if (box.querySelector('select')) return;
      var id = 'cur-' + Math.random().toString(36).slice(2, 7);
      var label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = box.getAttribute('data-label') || 'Prices in';
      var sel = document.createElement('select');
      sel.id = id;
      ORDER.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c; o.textContent = c + ' · ' + names(c);
        sel.appendChild(o);
      });
      sel.value = cur;
      sel.addEventListener('change', function () {
        try { localStorage.setItem(KEY, sel.value); } catch (e) {}
        render(sel.value);
      });
      box.appendChild(label);
      box.appendChild(sel);
      box.hidden = false;
    });
  }

  function run() {
    var cur = detect();
    switches(cur);
    render(cur);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
