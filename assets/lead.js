/* Khatib Designs — lead forms (FormSubmit AJAX)
   The single lead-form implementation for the whole site: binds every
   form[data-lead-form] (homepage contact form, /ai/ and /ar/ai/ scoping-call
   form). The data-lead-form value is posted to GA4 as the generate_lead
   "method", so each surface can be told apart in the reports. */
(function () {
  // /ai/ and /ar/ai/ don't load i18n.js, so keep a copy of the three status
  // strings here — without it those pages would render the literal key.
  var FALLBACK = {
    en: {
      formSending: 'Sending…',
      formOk: 'Thanks — your enquiry is on its way. We’ll reply within one business day.',
      formErr: 'Something went wrong — please email <a href="mailto:studio@khatibdesigns.com">studio@khatibdesigns.com</a> or message us on WhatsApp.'
    },
    ar: {
      formSending: 'جارٍ الإرسال…',
      formOk: 'شكرًا — طلبك في طريقه إلينا. سنردّ خلال يوم عمل واحد.',
      formErr: 'حدث خطأ ما — يرجى مراسلتنا على <a href="mailto:studio@khatibdesigns.com">studio@khatibdesigns.com</a> أو عبر واتساب.'
    }
  };
  var L = (document.documentElement.lang === 'ar') ? 'ar' : 'en';
  function S(k) {
    var d = window.KHD_STR;
    if (d && d[L] && d[L][k]) return d[L][k];
    if (d && d.en && d.en[k]) return d.en[k];
    return FALLBACK[L][k] || FALLBACK.en[k] || k;
  }

  function bind(form) {
    var method = form.getAttribute('data-lead-form') || 'contact_form';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._honey && form._honey.value) return;             // bot trap
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('button[type=submit]');
      if (status) { status.className = 'form-status'; status.textContent = S('formSending'); }
      if (btn) btn.disabled = true;
      var data = {}; new FormData(form).forEach(function (v, k) { if (k.charAt(0) !== '_' || k === '_subject') data[k] = v; });
      data._template = 'table';
      // which page and which campaign produced the lead, in the email itself
      var attr = window.khdAttribution || {};
      Object.keys(attr).forEach(function (k) { if (attr[k]) data[k] = attr[k]; });
      data.page = location.pathname;
      fetch('https://formsubmit.co/ajax/studio@khatibdesigns.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        // success on any 2xx — first (pre-activation) submit returns a
        // non-JSON activation page, so don't depend on parsing the body
        return r.text().then(function (t) {
          var okBody = false;
          try { okBody = String(JSON.parse(t).success).toLowerCase() === 'true'; } catch (e) {}
          return r.ok || okBody;
        });
      }).then(function (ok) {
        if (!ok) throw new Error('not ok');
        form.reset();
        if (status) { status.className = 'form-status ok'; status.textContent = S('formOk'); }
        if (window.khdTrack) window.khdTrack('generate_lead', { method: method });
      }).catch(function () {
        if (status) { status.className = 'form-status err'; status.innerHTML = S('formErr'); }
      }).finally(function () { if (btn) btn.disabled = false; });
    });
  }

  function boot() {
    Array.prototype.slice.call(document.querySelectorAll('form[data-lead-form]')).forEach(bind);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
