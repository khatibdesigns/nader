/* Khatib Designs — case-study pages (lightweight) */
(function () {
  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  var header = document.querySelector('header.nav');
  if (header) window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
  var toggle = document.getElementById('nav-toggle'), links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () { links.classList.toggle('open'); });
    Array.prototype.forEach.call(links.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  /* ---------- inline lead form on blog articles (FormSubmit AJAX) ----------
     case.js also runs on /work/* case studies — they get nothing. */
  var band = /^\/(ar\/)?blog\//.test(location.pathname) && document.querySelector('.case-cta-band > div');
  if (band) {
    var ar = document.documentElement.lang === 'ar';
    var STR = {
      intro: { en: 'Prefer not to message? Tell us about it and we’ll reply with a scope and a price within one business day.',
               ar: 'تفضّل ألا تراسلنا على واتساب؟ أخبرنا عن مشروعك وسنردّ بنطاق العمل والسعر خلال يوم عمل واحد.' },
      name: { en: 'Name', ar: 'الاسم' },
      namePh: { en: 'Your name', ar: 'اسمك' },
      email: { en: 'Email', ar: 'البريد الإلكتروني' },
      emailPh: { en: 'you@company.com', ar: 'you@company.com' },
      phone: { en: 'WhatsApp', ar: 'واتساب' },
      phonePh: { en: '+965 0000 0000', ar: '+965 0000 0000' },
      company: { en: 'Company', ar: 'الشركة' },
      companyPh: { en: 'Company (optional)', ar: 'الشركة (اختياري)' },
      message: { en: 'Project', ar: 'المشروع' },
      messagePh: { en: 'A few lines is plenty.', ar: 'بضعة أسطر تكفي.' },
      send: { en: 'Send enquiry', ar: 'أرسل طلبك' },
      sending: { en: 'Sending…', ar: 'جارٍ الإرسال…' },
      ok: { en: 'Thanks — your enquiry is on its way. We’ll reply within one business day.',
            ar: 'شكرًا — طلبك في طريقه إلينا. سنردّ خلال يوم عمل واحد.' },
      err: { en: 'Something went wrong — please email studio@khatibdesigns.com or message us on WhatsApp.',
             ar: 'حدث خطأ ما — يرجى مراسلتنا على studio@khatibdesigns.com أو عبر واتساب.' }
    };
    var t = function (k) { return STR[k][ar ? 'ar' : 'en']; };

    var intro = document.createElement('p');
    intro.textContent = t('intro');
    var form = document.createElement('form');
    form.className = 'lead-form'; form.id = 'blog-lead-form'; form.setAttribute('novalidate', '');
    form.innerHTML =
      '<div class="lf-row">' +
        '<label>' + t('name') + '<input name="name" required autocomplete="name" placeholder="' + t('namePh') + '" /></label>' +
        '<label>' + t('email') + '<input name="email" type="email" required autocomplete="email" placeholder="' + t('emailPh') + '" /></label>' +
      '</div>' +
      '<div class="lf-row">' +
        '<label>' + t('phone') + '<input name="phone" type="tel" required autocomplete="tel" dir="ltr" placeholder="' + t('phonePh') + '" /></label>' +
        '<label>' + t('company') + '<input name="company" autocomplete="organization" placeholder="' + t('companyPh') + '" /></label>' +
      '</div>' +
      '<label class="lf-full">' + t('message') +
        '<textarea name="message" rows="3" placeholder="' + t('messagePh') + '"></textarea>' +
      '</label>' +
      '<input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" class="lf-honey" />' +
      '<div class="lf-actions"><button type="submit" class="btn solid" id="blog-lead-submit">' + t('send') + '</button></div>' +
      '<p class="form-status" id="blog-form-status" role="status" aria-live="polite"></p>';
    band.appendChild(intro); band.appendChild(form);

    var status = form.querySelector('#blog-form-status'), btn = form.querySelector('#blog-lead-submit');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form._honey && form._honey.value) return;             // bot trap
      if (!form.checkValidity()) { form.reportValidity(); return; }
      status.className = 'form-status'; status.textContent = t('sending');
      btn.disabled = true;
      var data = {}; new FormData(form).forEach(function (v, k) { if (k.charAt(0) !== '_') data[k] = v; });
      data._subject = 'New enquiry from ' + location.pathname + ' — khatibdesigns.com';
      data._template = 'table';
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
        window.khdTrack && window.khdTrack('generate_lead', { method: 'blog_form', page_path: location.pathname });
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = t('err');
      }).finally(function () { btn.disabled = false; });
    });
  }

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { obs.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.add('in'); });
  }
})();
