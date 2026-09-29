/* ============================================================
   Khatib Designs — /book/ embed watchdog + booking attribution

   The Calendly embed is the only place on the site where a call is
   actually booked. If the third-party script never loads, the visitor
   reads "Loading available times…" forever and we hear nothing — so we
   watch for the calendar, swap in a real CTA when it doesn't arrive,
   and stamp every booking with the page that sent the visitor here.

   The booking events themselves — the time-selected, the scheduled call
   and the lead — belong to analytics.js. Firing them here too would
   double-count the only key event we have.
   ============================================================ */
(function () {
  var widget = document.querySelector('.calendly-inline-widget');
  if (!widget) return;                          // not the booking page → nothing to do

  var ar = document.documentElement.lang === 'ar';

  // Which page funnelled them here. 153 pages link to /book/ and until now a
  // booking told us nothing about which of them did the work.
  var source = 'direct';
  try {
    var ref = new URL(document.referrer);
    if (ref.origin === location.origin) source = ref.pathname;
  } catch (e) { /* no referrer, or an off-site one → 'direct' */ }

  window.khdBookSource = {
    source_page: source,
    page_path: location.pathname,
    language: ar ? 'ar' : 'en'
  };

  // Stamp the embed synchronously, before widget.js reads data-url, so the
  // booking arrives in Calendly carrying the same attribution GA4 gets.
  var attribution = window.khdAttribution || {};
  var url = widget.getAttribute('data-url') || '';
  var utm = [
    'utm_source='   + encodeURIComponent(attribution.utm_source   || 'khatibdesigns.com'),
    'utm_medium='   + encodeURIComponent(attribution.utm_medium   || 'website'),
    'utm_campaign=' + encodeURIComponent(attribution.utm_campaign || 'book_page'),
    'utm_content='  + encodeURIComponent(source)
  ].join('&');
  widget.setAttribute('data-url', url + (url.indexOf('?') !== -1 ? '&' : '?') + utm);

  function track(name, params) {
    if (!window.khdTrack) return;               // analytics.js not configured → no-op
    window.khdTrack(name, Object.assign({}, params || {}, window.khdBookSource));
  }

  track('book_page_view', {});

  // The calendar either shows up or it doesn't, and we report whichever
  // happened exactly once.
  var BUDGET = 10000, STEP = 500, waited = 0, done = false;

  function ready() {
    if (done) return;
    done = true;
    clearInterval(poll);
    track('calendar_ready', {});
  }

  function fail() {
    if (done) return;
    done = true;
    clearInterval(poll);
    track('calendar_failed', {});
    var note = document.querySelector('.cal-loading');
    if (!note) return;
    // The WhatsApp link already exists on the page, message text and all.
    var wa = document.querySelector('.book-fallback a[href*="wa.me"]');
    note.innerHTML =
      '<span>' + (ar
        ? 'لم يتم تحميل التقويم. افتحه في نافذة جديدة، أو راسلنا وسنرتّب لك موعدًا.'
        : 'The calendar didn&rsquo;t load. Open it in a new tab, or message us and we&rsquo;ll find a time.') + '</span>' +
      '<a class="btn solid" href="https://calendly.com/khatibdesigns/30min" target="_blank" rel="noopener">' +
        (ar ? 'افتح التقويم' : 'Open the calendar') + '</a>' +
      (wa ? '<a href="' + wa.href + '" target="_blank" rel="noopener">' +
        (ar ? 'راسلنا على واتساب' : 'Message us on WhatsApp') + '</a>' : '');
    note.classList.add('cal-failed');
    widget.style.visibility = 'hidden';         // the empty embed still holds the frame open, but must not swallow the taps
  }

  var poll = setInterval(function () {
    waited += STEP;
    if (widget.querySelector('iframe')) { ready(); return; }
    if (waited >= BUDGET) { clearInterval(poll); fail(); }
  }, STEP);

  // Calendly announces itself before the iframe is fully settled — whichever
  // signal lands first wins.
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com' || !e.data || e.data.event !== 'calendly.event_type_viewed') return;
    ready();
  });

  // Confirm the booking outside the iframe too, where the visitor is already looking.
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com' || !e.data || e.data.event !== 'calendly.event_scheduled') return;
    var b = document.getElementById('booked');
    b.hidden = false;
    b.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
