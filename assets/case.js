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

  /* ---------- topic filter on the two Insights hubs (/blog/, /ar/blog/) ----------
     101 cards and 91 of them carry the same "AI" tag, so the tag narrows nothing —
     the bucket is derived from the slug instead. EN and AR share slugs, so one
     classifier serves both hubs. It lives here and not in the hub markup because
     both index.html files are regenerated on every auto-publish commit. */
  function initBlogFilters() {
    if (!/^\/(ar\/)?blog\/$/.test(location.pathname)) return;   // hub only, never an article
    var list = document.querySelector('.case-body > .post-list');
    if (!list || document.querySelector('.post-filters')) return;
    var ar = document.documentElement.lang === 'ar';

    var KEYS = ['all', 'pricing', 'industry', 'arabic', 'apps', 'start'];
    var LABEL = {
      all: { en: 'All', ar: 'الكل' },
      pricing: { en: 'Pricing', ar: 'التسعير' },
      industry: { en: 'By industry', ar: 'حسب القطاع' },
      arabic: { en: 'Arabic & chatbots', ar: 'العربية والمحادثة' },
      apps: { en: 'Apps & product', ar: 'التطبيقات والمنتج' },
      start: { en: 'Getting started', ar: 'البداية' }
    };

    // FIRST RULE WINS — several slugs match more than one test, and the earlier
    // rule is the one a buyer came for: arabic-chatbot-cost-gcc is pricing,
    // arabic-mobile-app-development-gcc is arabic, ai-automation-pricing-kuwait
    // is pricing rather than industry.
    function topicOf(href) {
      var slug = href.replace(/^\/(ar\/)?blog\//, '').replace(/\/$/, '');
      if (/(^|-)(cost|costs|pricing|price|charge|retainer)(s?)(-|$)/.test(slug)) return 'pricing';
      if (/arabic|chatbot|whatsapp|voice|dialect/.test(slug)) return 'arabic';
      if (slug.indexOf('ai-automation-') === 0) return 'industry';
      if (/app|mvp|ios-android|landing-page|design/.test(slug)) return 'apps';
      return 'start';
    }

    var cards = list.querySelectorAll('.post-card');
    var total = cards.length;
    var count = { all: total, pricing: 0, industry: 0, arabic: 0, apps: 0, start: 0 };
    Array.prototype.forEach.call(cards, function (card) {
      var key = topicOf(card.getAttribute('href') || '');
      card.setAttribute('data-topic', key);
      count[key]++;
    });

    var nav = document.createElement('nav');
    nav.className = 'post-filters';
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', ar ? 'تصفية المقالات حسب الموضوع' : 'Filter insights by topic');
    var note = document.createElement('p');
    note.className = 'post-count';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');

    function apply(key) {
      var shown = 0;
      Array.prototype.forEach.call(cards, function (card) {
        var on = key === 'all' || card.getAttribute('data-topic') === key;
        card.classList.toggle('pc-hidden', !on);
        // the cards are .reveal (opacity:0 until .in) and a display:none card is
        // never seen by the IntersectionObserver — without this, a card filtered
        // back in would take up its grid cell and render invisible
        if (on) { card.classList.add('in'); shown++; }
      });
      Array.prototype.forEach.call(nav.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-topic') === key ? 'true' : 'false');
      });
      note.textContent = ar ? 'عرض ' + shown + ' من ' + total : 'Showing ' + shown + ' of ' + total;
    }

    // /blog/#pricing is a shareable, linkable URL
    var hash = location.hash.slice(1);
    var start = KEYS.indexOf(hash) > 0 ? hash : 'all';

    KEYS.forEach(function (key) {
      if (!count[key]) return;                                  // empty bucket, no button
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-topic', key);
      b.setAttribute('aria-pressed', key === start ? 'true' : 'false');
      // live count, so it stays right as the generator adds articles
      b.textContent = LABEL[key][ar ? 'ar' : 'en'] + ' (' + count[key] + ')';
      b.addEventListener('click', function () {
        apply(key);
        // replaceState, not location.hash = — the latter jumps the page
        history.replaceState(null, '', location.pathname + location.search + (key === 'all' ? '' : '#' + key));
        window.khdTrack && window.khdTrack('blog_filter', { topic: key, page_path: location.pathname });
      });
      nav.appendChild(b);
    });

    list.parentNode.insertBefore(nav, list);
    list.parentNode.insertBefore(note, list);
    apply(start);
  }
  initBlogFilters();

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
})();
