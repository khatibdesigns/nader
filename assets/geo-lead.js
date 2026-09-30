(function () {
  'use strict';
  // On-page capture for the geo landing pages (/dubai/, /ar/dubai/).
  //
  // Those pages carry the price anchors and all the intent, but until now the only
  // way to answer them was WhatsApp, mailto or Calendly — three different apps, each
  // one a place to change your mind. This posts the same FormSubmit payload the rest
  // of the site uses, so a visitor who would rather type than message can.
  //
  // Standalone by design: no dependency on site.js, case.js or i18n.js, and inert on
  // every page that does not carry #geo-lead-form.

  function run() {
    var form = document.getElementById('geo-lead-form');
    if (!form) return;

    // Same six strings as the blog form in case.js — a visitor who sees both should
    // not be told two different things about the same submission.
    var ar = document.documentElement.lang === 'ar';
    var STR = {
      sending: { en: 'Sending…', ar: 'جارٍ الإرسال…' },
      ok: { en: 'Thanks — your enquiry is on its way. We’ll reply within one business day.',
            ar: 'شكرًا — طلبك في طريقه إلينا. سنردّ خلال يوم عمل واحد.' },
      err: { en: 'Something went wrong — please email studio@khatibdesigns.com or message us on WhatsApp.',
             ar: 'حدث خطأ ما — يرجى مراسلتنا على studio@khatibdesigns.com أو عبر واتساب.' }
    };
    var t = function (k) { return STR[k][ar ? 'ar' : 'en']; };

    var status = document.getElementById('geo-form-status');
    var btn = document.getElementById('geo-lead-submit');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._honey && form._honey.value) return;             // bot trap
      if (!form.checkValidity()) { form.reportValidity(); return; }
      status.className = 'form-status'; status.textContent = t('sending');
      btn.disabled = true;
      var data = {}; new FormData(form).forEach(function (v, k) { if (k.charAt(0) !== '_') data[k] = v; });
      data._subject = 'New enquiry from ' + location.pathname + ' — khatibdesigns.com';
      data._template = 'table';
      // Without this the lead reaches the inbox and nothing else. JARVIS reads
      // nader@ over IMAP; _cc is what lets it see the enquiry, record it and
      // raise it. A lead nobody is told about is the same as no lead.
      data._cc = 'nader@khatibdesigns.com';
      data._captcha = 'false';
      fetch('https://formsubmit.co/ajax/studio@khatibdesigns.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        // success on any 2xx — the first (pre-activation) submit returns a
        // non-JSON activation page, so don't depend on parsing the body
        return r.text().then(function (txt) {
          var okBody = false;
          try { okBody = String(JSON.parse(txt).success).toLowerCase() === 'true'; } catch (err) {}
          return r.ok || okBody;
        });
      }).then(function (ok) {
        if (!ok) throw new Error('not ok');
        form.reset();
        status.className = 'form-status ok';
        status.textContent = t('ok');
        window.khdTrack && window.khdTrack('generate_lead', { method: 'geo_form', page_path: location.pathname });
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = t('err');
      }).finally(function () { btn.disabled = false; });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
