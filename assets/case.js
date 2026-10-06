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

  // mid-article priced offer card — the articles are the only pages that name no price
  function initArticleOffer() {
    // English only: /ar/ai/ has no #offer section and carries no prices, so there is nothing to link to
    if (document.documentElement.lang !== 'en') return;
    var body = document.querySelector('article.article .article-body');
    if (!body || body.querySelector('.khd-inline-offer')) return;

    var card = document.createElement('aside');
    card.className = 'svc-card khd-inline-offer';
    card.setAttribute('style', 'margin:34px 0');
    card.innerHTML = '<h3>AI Readiness &amp; Governance Sprint</h3>' +
      '<p style="font-family:var(--display);font-size:26px;color:var(--accent);margin:0 0 12px">KWD 3,500 ' +
      '<span style="font-size:13px;color:var(--faint);font-family:var(--body)">fixed, 3 weeks</span></p>' +
      '<p>A governance model, a ranked roadmap and <strong>one working agent deployed</strong> before we hand over &mdash; ' +
      'smaller businesses: a single-workflow version runs <strong>KWD 1,500</strong>.</p>' +
      '<a class="btn solid" href="/ai/#offer" style="margin-top:16px">See what&rsquo;s included</a>';

    var heads = body.querySelectorAll('h2');
    if (heads.length >= 2) heads[1].parentNode.insertBefore(card, heads[1]); else body.appendChild(card);
  }
  initArticleOffer();

  /* human byline + author card on blog articles — /nader/ is the studio's
     strongest proof and the best-converting organic page, yet the articles
     were bylined to nobody and mostly never linked to it. case.js also runs
     on the two blog hubs and on /work/* case studies — they get nothing. */
  function initAuthorCredit() {
    if (!/^\/(ar\/)?blog\/[^/]+\//.test(location.pathname)) return;
    var body = document.querySelector('article.article .article-body');
    if (!body || body.querySelector('.khd-author')) return;

    var ar = document.documentElement.lang === 'ar';
    var STR = {
      studio: { en: 'Khatib Designs', ar: 'خطيب ديزاينز' },
      name: { en: 'Nader Al-Khatib', ar: 'نادر الخطيب' },
      role: { en: ' — Digital Factory Director, stc Kuwait',
              ar: ' — مدير المصنع الرقمي، stc الكويت' },
      cardRole: { en: 'Digital Factory Director, stc Kuwait · Enterprise AI consultant',
                  ar: 'مدير المصنع الرقمي في stc الكويت · استشاري ذكاء اصطناعي للشركات' },
      // verbatim from the Person JSON-LD description on /nader/ — no new claim
      bio: { en: 'Nader Al-Khatib is Digital Factory Director at stc Kuwait and an enterprise AI consultant. He runs Khatib Designs, an Arabic-first design and AI-enablement studio in Kuwait serving the GCC.',
             ar: 'نادر الخطيب مدير المصنع الرقمي في stc الكويت واستشاري ذكاء اصطناعي للشركات. يدير خطيب ديزاينز، استوديو تصميم وتمكين ذكاء اصطناعي عربي أولًا في الكويت يخدم الخليج.' },
      more: { en: 'About the author →', ar: 'عن الكاتب ←' }
    };
    var t = function (k) { return STR[k][ar ? 'ar' : 'en']; };
    var href = ar ? '/ar/nader/' : '/nader/';

    // byline: replace only the studio-name text node, keeping <time> and the separators
    var meta = document.querySelector('.article-meta');
    if (meta) {
      var old = null;
      Array.prototype.forEach.call(meta.childNodes, function (n) {
        if (!old && n.nodeType === 3 && n.nodeValue.indexOf(t('studio')) > -1) old = n;
      });
      if (!old) return;
      var txt = old.nodeValue, cut = txt.lastIndexOf('·');
      var lead = cut > -1 ? txt.slice(0, cut + 1) + ' ' : txt.slice(0, txt.indexOf(t('studio')));
      var link = document.createElement('a');
      link.setAttribute('href', href);
      link.setAttribute('rel', 'author');
      link.textContent = t('name');
      var role = document.createElement('span');
      role.textContent = t('role');
      meta.insertBefore(document.createTextNode(lead), old);
      meta.insertBefore(link, old);
      meta.insertBefore(role, old);
      meta.removeChild(old);
    }

    var card = document.createElement('aside');
    card.className = 'svc-card khd-author';
    card.setAttribute('style', 'margin:34px 0');
    card.innerHTML = '<h3>' + t('name') + '</h3>' +
      '<p style="font-family:var(--display);color:var(--faint);margin:0 0 12px">' + t('cardRole') + '</p>' +
      '<p>' + t('bio') + '</p>' +
      '<a class="btn" href="' + href + '" style="margin-top:16px">' + t('more') + '</a>';
    body.appendChild(card);
  }
  initAuthorCredit();
})();
