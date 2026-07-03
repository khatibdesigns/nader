/* ============================================================
   Khatib Designs — GA4 + lead-event + Google Ads conversion tracking
   GA4 is already live (G-HNDZLK8C8S). Google Ads pings are gated:
   they stay no-ops until you paste an Ads id + labels below.

   To turn Ads conversions on (later, one paste):
     GA4 → Admin → Google Ads Links → link the account, then
     Google Ads → Tools → Conversions → new action → copy the
     "AW-XXXXXXXXXX" id into ADS_ID and each action's label into
     ADS_LABELS.  GA4 keeps working regardless.
   ============================================================ */
(function () {
  var GA_ID  = 'G-HNDZLK8C8S';                // GA4 Measurement ID (khatibdesigns.com)
  var ADS_ID = '';                            // e.g. 'AW-1234567890' ← paste when Ads is set up
  var ADS_LABELS = {                          // per-conversion labels from Google Ads
    generate_lead:     '',                    // contact-form lead   ← primary
    book_call:         '',                    // "book a call" WhatsApp CTA
    whatsapp_click:    '',                    // any WhatsApp tap
    cta_start_project: ''                     // "Start a project" click
  };

  if (!GA_ID || GA_ID.indexOf('XXXX') !== -1) return;   // not configured yet → do nothing

  // gtag bootstrap
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());

  // First-touch UTM / gclid capture — persists for the session so every event
  // and the lead-form submit is attributable to the campaign that drove it.
  var UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid'];
  var attribution = {};
  try {
    var qs = new URLSearchParams(location.search);
    var stored = JSON.parse(sessionStorage.getItem('khd_attr') || '{}');
    UTM_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) stored[k] = v;
      if (stored[k]) attribution[k] = stored[k];
    });
    sessionStorage.setItem('khd_attr', JSON.stringify(stored));
  } catch (e) { /* no storage → skip */ }
  window.khdAttribution = attribution;        // lead-form can post this along

  var cfg = { anonymize_ip: true };
  if (attribution.utm_campaign) cfg.campaign_name   = attribution.utm_campaign;
  if (attribution.utm_source)   cfg.campaign_source = attribution.utm_source;
  if (attribution.utm_medium)   cfg.campaign_medium = attribution.utm_medium;
  gtag('config', GA_ID, cfg);
  if (ADS_ID) gtag('config', ADS_ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  // Hook other scripts can call (site.js fires this on a successful form submit).
  // Sends the GA4 event AND a Google Ads conversion when a label is configured.
  window.khdTrack = function (name, params) {
    var p = params || {};
    UTM_KEYS.forEach(function (k) { if (attribution[k] && !p[k]) p[k] = attribution[k]; });
    gtag('event', name, p);
    var label = ADS_LABELS[name];
    if (ADS_ID && label) gtag('event', 'conversion', { send_to: ADS_ID + '/' + label });
  };

  // delegated lead-event tracking (mark these as "key events" in GA4)
  document.addEventListener('click', function (e) {
    var t = e.target;
    var wa = t.closest && t.closest('a[href*="wa.me"]');
    if (wa) { window.khdTrack('whatsapp_click', { transport_type: 'beacon', link_url: wa.href }); return; }
    var store = t.closest && t.closest('.store, .store-row a');
    if (store && store.href) { window.khdTrack('store_click', { link_url: store.href }); return; }
    var cta = t.closest && t.closest('a.btn.solid[href*="#contact"]');
    if (cta) { window.khdTrack('cta_start_project', {}); return; }
    var book = t.closest && t.closest('[data-cta="book-call"]');
    if (book) { window.khdTrack('book_call', { transport_type: 'beacon' }); }
  }, true);
})();
