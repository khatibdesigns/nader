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
    book_call_scheduled: '',                  // a call actually booked in Calendly ← best signal
    book_call:         '',                    // "Book a call" click → /book/ (Calendly)
    whatsapp_click:    '',                    // any WhatsApp tap
    email_click:       '',                    // "Email instead" mailto CTA
    cta_start_project: '',                    // "Start a project" click
    view_pricing:      ''                     // "See pricing" click
  };

  if (!GA_ID || GA_ID.indexOf('XXXX') !== -1) return;   // not configured yet → do nothing

  // gtag bootstrap
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  // ---- consent (GDPR) ------------------------------------------------------
  // Consent Mode v2. In the EEA/UK/CH, analytics and ads storage stay denied
  // until the visitor accepts; elsewhere they default to granted. The banner is
  // shown only when the browser's timezone is European (GCC visitors never see
  // it) and can be reopened from the privacy page via khdConsent.open().
  // The choice is kept in localStorage 'khd_consent' ('granted' | 'denied').
  var EEA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH'];
  var DENY  = { ad_storage: 'denied',  ad_user_data: 'denied',  ad_personalization: 'denied',  analytics_storage: 'denied' };
  var ALLOW = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
  var withRegion = { region: EEA, wait_for_update: 500 };
  for (var k in DENY) withRegion[k] = DENY[k];
  gtag('consent', 'default', withRegion);
  gtag('consent', 'default', ALLOW);
  var saved = null;
  try { saved = localStorage.getItem('khd_consent'); } catch (e) { /* storage blocked */ }
  if (saved === 'granted') gtag('consent', 'update', ALLOW);
  if (saved === 'denied') gtag('consent', 'update', DENY);

  function choose(v) {
    try { localStorage.setItem('khd_consent', v); } catch (e) { /* storage blocked */ }
    gtag('consent', 'update', v === 'granted' ? ALLOW : DENY);
    var b = document.getElementById('khd-consent');
    if (b) b.parentNode.removeChild(b);
  }
  function banner() {
    if (document.getElementById('khd-consent')) return;
    var ar = (document.documentElement.lang || '').indexOf('ar') === 0;
    var t = ar
      ? { msg: 'نستخدم ملفات تعريف الارتباط من Google Analytics لفهم استخدام الموقع. لن نفعّلها إلا بموافقتك.', more: 'سياسة الخصوصية', yes: 'موافق', no: 'رفض' }
      : { msg: 'We use Google Analytics cookies to understand how this site is used. They stay off unless you agree.', more: 'Privacy policy', yes: 'Accept', no: 'Reject' };
    var d = document.createElement('div');
    d.id = 'khd-consent';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', ar ? 'ملفات تعريف الارتباط' : 'Cookies');
    d.dir = ar ? 'rtl' : 'ltr';
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:640px;margin:0 auto;' +
      'background:#111;color:#f5f5f5;border:1px solid #333;border-radius:12px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.35);' +
      'font:14px/1.5 system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;display:flex;flex-wrap:wrap;gap:10px;align-items:center';
    var p = document.createElement('p');
    p.style.cssText = 'margin:0;flex:1 1 260px';
    p.appendChild(document.createTextNode(t.msg + ' '));
    var a = document.createElement('a');
    a.href = '/legal/privacy/'; a.textContent = t.more;
    a.style.cssText = 'color:#ff9a4d;text-decoration:underline';
    p.appendChild(a);
    d.appendChild(p);
    [[t.no, 'denied'], [t.yes, 'granted']].forEach(function (x) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = x[0];
      btn.style.cssText = 'font:inherit;font-weight:600;padding:8px 16px;border-radius:8px;cursor:pointer;min-height:40px;' +
        'border:1px solid #ff9a4d;' + (x[1] === 'granted' ? 'background:#ff9a4d;color:#111' : 'background:transparent;color:#f5f5f5');
      btn.addEventListener('click', function () { choose(x[1]); });
      d.appendChild(btn);
    });
    document.body.appendChild(d);
  }
  window.khdConsent = { open: banner, choose: choose };
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* old browser */ }
  var euTz = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe))/.test(tz) &&
    !/^Europe\/(Istanbul|Moscow|Minsk|Kiev|Kyiv|Simferopol|Volgograd|Samara|Ulyanovsk|Astrakhan|Saratov|Kirov)$/.test(tz);
  if (!saved && euTz) {
    if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner);
  }


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
    // First, before wa.me: book-call CTAs open /book/ (Calendly) now, but the booking dock
    // sits beside a WhatsApp link, so the specific test must win before the generic one.
    var book = t.closest && t.closest('[data-cta="book-call"]');
    if (book) { window.khdTrack('book_call', {
      transport_type: 'beacon',
      link_url: book.href,
      cta_location: book.getAttribute('data-cta-location') || (book.closest('nav, footer') ? 'nav' : 'inline') }); return; }
    var wa = t.closest && t.closest('a[href*="wa.me"]');
    if (wa) { window.khdTrack('whatsapp_click', { transport_type: 'beacon', link_url: wa.href }); return; }
    var mail = t.closest && t.closest('[data-cta="email"]');
    if (mail) { window.khdTrack('email_click', {
      link_url: mail.href,
      cta_location: mail.getAttribute('data-cta-location') || 'inline' }); return; }
    var store = t.closest && t.closest('.store, .store-row a');
    if (store && store.href) { window.khdTrack('store_click', { link_url: store.href }); return; }
    var price = t.closest && t.closest('a[href*="#offer"]');       // the missing funnel step between the landing view and book_call
    if (price) { window.khdTrack('view_pricing', {
      cta_location: price.getAttribute('data-cta-location') || (price.closest('.nav-links') ? 'nav' : 'inline'),
      link_url: price.getAttribute('href') }); return; }
    // Every #contact link that is a call to action, and none of the ones that are
    // navigation. A `btn` class means CTA wherever it sits — the header's "Start a
    // project" lives inside .nav-links and has to keep counting. Without one it only
    // counts outside <nav> and <footer>, which is where the inline prose CTAs are and
    // where the 180 "Contact" / "تواصل" nav and footer links are not.
    var cta = t.closest && t.closest('a[href*="#contact"]');
    if (cta) {
      var isBtn = cta.classList && cta.classList.contains('btn');
      if (isBtn || !cta.closest('nav, footer')) {
        window.khdTrack('cta_start_project', {
          cta_location: cta.getAttribute('data-cta-location') || (!isBtn ? 'inline' : cta.closest('.nav-links') ? 'nav' : 'button') });
      }
      return;
    }
  }, true);

  // Calendly (the /book/ embed) posts its progress to this window. Count the booking
  // itself, not only the click that led to the calendar.
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
    if (e.data.event === 'calendly.date_and_time_selected') window.khdTrack('book_call_time_selected', {});
    if (e.data.event === 'calendly.event_scheduled') {
      window.khdTrack('book_call_scheduled', { lead_source: 'calendly' });
      window.khdTrack('generate_lead', { lead_source: 'calendly' });   // so every existing lead report counts it
    }
  });
})();
