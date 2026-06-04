/* ============================================================
   Khatib Designs — Google Analytics 4 + lead-event tracking
   To go live: paste your GA4 Measurement ID below (looks like
   "G-XXXXXXXXXX"). Until then this file is a no-op.
   ============================================================ */
(function () {
  var GA_ID = 'G-HNDZLK8C8S';                 // GA4 Measurement ID (khatibdesigns.com)
  if (!GA_ID || GA_ID.indexOf('XXXX') !== -1) return;   // not configured yet → do nothing

  // gtag bootstrap
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  // small hook other scripts can call (e.g. site.js on a successful form submit)
  window.khdTrack = function (name, params) { gtag('event', name, params || {}); };

  // delegated lead-event tracking (mark these as "key events" in GA4)
  document.addEventListener('click', function (e) {
    var t = e.target;
    var wa = t.closest && t.closest('a[href*="wa.me"]');
    if (wa) { gtag('event', 'whatsapp_click', { transport_type: 'beacon', link_url: wa.href }); return; }
    var store = t.closest && t.closest('.store, .store-row a');
    if (store && store.href) { gtag('event', 'store_click', { link_url: store.href }); return; }
    var cta = t.closest && t.closest('a.btn.solid[href*="#contact"]');
    if (cta) { gtag('event', 'cta_start_project', {}); }
  }, true);
})();
