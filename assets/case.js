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

  // reading series nav — the only in-repo reason to come back: three named,
  // numbered series with the next part one tap above the fold. Every other
  // article stays a one-off and renders exactly as before.
  function initSeries() {
    if (!/^\/(ar\/)?blog\/[^/]+\/$/.test(location.pathname)) return;   // articles only — not the hubs, not /work/*

    var SERIES = [
      { key: 'ai-buy', en: 'The AI buyer’s path', ar: 'مسار شراء الذكاء الاصطناعي', parts: [
        { slug: 'ai-readiness-assessment-gcc',
          en: 'AI Readiness Assessment: A 2-Week Plan for GCC Firms',
          ar: 'تقييم الجاهزية للذكاء الاصطناعي: خطة أسبوعين' },
        { slug: 'what-an-ai-project-costs-gcc',
          en: 'What an AI Project Costs in the GCC',
          ar: 'كم يكلّف مشروع الذكاء الاصطناعي في الخليج' },
        { slug: 'ai-automation-companies-kuwait',
          en: 'AI Automation Companies in Kuwait: How to Choose (2026)',
          ar: 'شركات الأتمتة بالذكاء الاصطناعي في الكويت: كيف تختار (2026)' },
        { slug: 'ai-running-costs-monthly-gcc',
          en: 'AI Running Costs in the GCC: The Real Monthly Bill',
          ar: 'تكاليف تشغيل الذكاء الاصطناعي: الفاتورة الشهرية' }
      ] },
      { key: 'app-build', en: 'Building an app in the Gulf', ar: 'بناء تطبيق في الخليج', parts: [
        { slug: 'what-is-an-mvp',
          en: 'What is an MVP — and why start there?',
          ar: 'ما هو المنتج الأوّلي (MVP) — ولماذا تبدأ به؟' },
        { slug: 'app-cost-kuwait',
          en: 'App Development Cost in Kuwait: Real Ranges',
          ar: 'تكلفة تطوير تطبيق في الكويت: أرقام واقعية' },
        { slug: 'how-long-to-build-an-app',
          en: 'How long does it take to build a mobile app?',
          ar: 'كم يستغرق بناء تطبيق جوال؟' },
        { slug: 'app-maintenance-cost-gcc',
          en: 'App Maintenance Cost in Kuwait & the GCC (2026)',
          ar: 'تكلفة صيانة التطبيقات في الكويت والخليج 2026' }
      ] },
      { key: 'arabic-bot', en: 'Arabic AI assistants, end to end', ar: 'مساعدو الذكاء الاصطناعي بالعربية من البداية للنهاية', parts: [
        { slug: 'how-to-build-an-arabic-chatbot-gcc',
          en: 'How to Build an Arabic Chatbot That Actually Works',
          ar: 'كيف تبني شات بوت عربي يعمل فعلياً' },
        { slug: 'arabic-chatbot-cost-gcc',
          en: 'Arabic Chatbot Cost in Kuwait and the GCC: Real Ranges',
          ar: 'تكلفة شات بوت عربي في الكويت والخليج: أرقام واقعية' },
        { slug: 'arabic-chatbot-dialects-gcc',
          en: 'Arabic Chatbot Dialects: What Breaks in the Gulf',
          ar: 'لهجات الشات بوت العربي: ما الذي يفشل في الخليج' },
        { slug: 'arabic-customer-service-chatbot-gcc',
          en: 'Arabic Customer Service Chatbot: A GCC Buyer’s Guide',
          ar: 'شات بوت خدمة عملاء عربي: دليل للشركات الخليجية' }
      ] }
    ];

    var slug = location.pathname.replace(/^\/(ar\/)?blog\//, '').replace(/\/$/, '');
    var series = null, idx = -1;
    SERIES.forEach(function (s) {
      s.parts.forEach(function (p, n) { if (p.slug === slug) { series = s; idx = n; } });
    });
    if (!series) return;                                  // the other 99 articles are one-offs
    if (document.querySelector('.khd-series')) return;    // re-entry guard

    var head = document.querySelector('article.article .article-head');
    if (!head) return;

    var ar = document.documentElement.lang === 'ar';
    var L = ar ? 'ar' : 'en';
    var href = function (s) { return (ar ? '/ar/blog/' : '/blog/') + s + '/'; };

    var nav = document.createElement('nav');
    nav.className = 'khd-series';
    nav.setAttribute('aria-label', ar ? 'سلسلة مقالات' : 'Article series');

    var eyebrow = document.createElement('p');
    eyebrow.className = 'ks-head';
    eyebrow.appendChild(document.createTextNode(
      ar ? 'الجزء ' + (idx + 1) + ' من 4 · ' : 'Part ' + (idx + 1) + ' of 4 · '));
    var name = document.createElement('strong');
    name.textContent = series[L];
    eyebrow.appendChild(name);
    nav.appendChild(eyebrow);

    var list = document.createElement('ol');
    list.className = 'ks-list';
    series.parts.forEach(function (p, n) {
      var li = document.createElement('li');
      var num = document.createElement('b');
      num.className = 'ks-n';
      num.textContent = String(n + 1);
      li.appendChild(num);
      var label;
      if (n === idx) {
        label = document.createElement('span');
        label.className = 'ks-now';
        label.setAttribute('aria-current', 'true');
      } else {
        label = document.createElement('a');
        label.href = href(p.slug);
      }
      label.textContent = p[L];
      li.appendChild(label);
      list.appendChild(li);
    });
    nav.appendChild(list);

    var next = series.parts[idx + 1];                     // omitted on part 4
    if (next) {
      var cta = document.createElement('a');
      cta.className = 'ks-next';
      cta.href = href(next.slug);
      cta.textContent = (ar ? 'اقرأ التالي: ' : 'Read next: ') + next[L];
      nav.appendChild(cta);
    }

    head.parentNode.insertBefore(nav, head.nextSibling);  // above the hero — one tap, no scroll

    nav.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a');
      if (!a || !nav.contains(a)) return;
      window.khdTrack && window.khdTrack('series_click', {
        series: series.key, from_slug: slug, link_url: a.getAttribute('href')
      });
    });
  }
  initArticleOffer();
  initSeries();
})();
