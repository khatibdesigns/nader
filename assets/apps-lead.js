(function () {
  'use strict';
  // Inline lead form for /apps/ and /ar/apps/ (FormSubmit AJAX).
  //
  // Both pricing pages used to convert only through a Calendly booking or a
  // WhatsApp link. A visitor who won't commit to a call and won't hand over a
  // phone number had no way to become a lead at all — which is most of a
  // page aimed at "app cost". This is the written path. Self-contained on
  // purpose: these pages do NOT load site.js (it renders the homepage globe
  // and data sections and would throw here), so the handler ships alone.

  var form = document.getElementById('apps-lead-form');
  if (!form) return;

  var status = document.getElementById('apps-form-status');
  var btn = document.getElementById('apps-lead-submit');
  var L = (document.documentElement.lang === 'ar') ? 'ar' : 'en';

  // Same wording as the shared i18n strings the homepage form uses, so a
  // visitor who sees both pages gets the same promise either way.
  var COPY = {
    en: {
      sending: 'Sending…',
      ok: 'Thanks — your enquiry is on its way. We’ll reply within one business day.',
      err: 'Something went wrong — please email <a href="mailto:studio@khatibdesigns.com">studio@khatibdesigns.com</a> or message us on WhatsApp.'
    },
    ar: {
      sending: 'جارٍ الإرسال…',
      ok: 'شكرًا — طلبك في طريقه إلينا. سنردّ خلال يوم عمل واحد.',
      err: 'حدث خطأ ما — يرجى مراسلتنا على <a href="mailto:studio@khatibdesigns.com">studio@khatibdesigns.com</a> أو عبر واتساب.'
    }
  }[L];

  function track(name, params) {
    var p = params || {};
    p.page_path = location.pathname;
    p.language = L;
    window.khdTrack && window.khdTrack(name, p);
  }

  var started = false;                                        // one-shot engagement flag
  function onEngage(e) {
    if (started || e.target.name === '_honey') return;
    started = true;
    track('form_start', { method: 'apps_form' });
  }
  form.addEventListener('input', onEngage);
  form.addEventListener('change', onEngage);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form._honey && form._honey.value) return;             // bot trap
    if (!form.checkValidity()) {
      var invalid = form.querySelector(':invalid');
      track('lead_submit_blocked', { method: 'apps_form', reason: 'validation', field: (invalid && invalid.name) || 'unknown' });
      form.reportValidity(); return;
    }
    status.className = 'form-status'; status.textContent = COPY.sending;
    btn.disabled = true;
    var data = {}; new FormData(form).forEach(function (v, k) { if (k.charAt(0) !== '_' || k === '_subject') data[k] = v; });
    data._template = 'table';
    // Copy the mailbox JARVIS polls. The form's own recipient is unchanged —
    // leads keep arriving where they always have — but _cc puts a copy where
    // the reply-handler can see it, which is what turns an arriving lead into
    // an alert instead of silence.
    data._cc = 'nader@khatibdesigns.com';
    fetch('https://formsubmit.co/ajax/studio@khatibdesigns.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      // success on any 2xx — the first (pre-activation) submit returns a
      // non-JSON activation page, so don't depend on parsing the body
      return r.text().then(function (t) {
        var okBody = false;
        try { okBody = String(JSON.parse(t).success).toLowerCase() === 'true'; } catch (err) {}
        return r.ok || okBody;
      });
    }).then(function (ok) {
      if (!ok) throw new Error('not ok');
      form.reset();
      status.className = 'form-status ok';
      status.textContent = COPY.ok;
      track('generate_lead', { method: 'apps_form', plan: data.plan || 'unspecified', has_company: data.company ? 'yes' : 'no' });
    }).catch(function (err) {
      track('lead_submit_failed', { method: 'apps_form', reason: (err && err.message === 'not ok') ? 'rejected' : 'network' });
      status.className = 'form-status err';
      status.innerHTML = COPY.err;
    }).finally(function () { btn.disabled = false; });
  });
})();
