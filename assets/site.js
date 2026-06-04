/* Khatib Designs — site logic (Atelier) */
(function () {
  const KHD = window.KHD;
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const EXT = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  function closeIcon() { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6 6 18"/></svg>'; }
  function phoneFrame(src, name) {
    return '<div class="phone"><div class="notch"></div><div class="glare"></div>' +
      '<div class="screen"><img src="' + src + '" alt="' + name + ' app screen" loading="lazy" /></div></div>';
  }

  /* ---------- starfield ---------- */
  function stars(n) {
    const el = $('#stars'); if (!el) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      const sz = Math.random() < 0.85 ? 1 : 2;
      s.style.cssText = 'position:absolute;border-radius:50%;background:#fff;width:' + sz + 'px;height:' + sz +
        'px;left:' + (Math.random() * 100).toFixed(2) + '%;top:' + (Math.random() * 100).toFixed(2) +
        '%;opacity:' + (0.08 + Math.random() * 0.45).toFixed(2) + ';animation:khdTwinkle ' +
        (2.5 + Math.random() * 4).toFixed(1) + 's ease-in-out ' + (Math.random() * 4).toFixed(1) + 's infinite';
      frag.appendChild(s);
    }
    el.appendChild(frag);
  }

  /* ---------- hero region chips ---------- */
  function buildChips() {
    const wrap = $('#chips'); if (!wrap) return;
    wrap.innerHTML = KHD.countryList.map(function (c) {
      return '<button class="chip" data-country="' + c.id + '"><span class="cdot"></span>' +
        c.name + ' <span class="num">' + c.count + '</span></button>';
    }).join('');
  }

  /* ---------- country drawer ---------- */
  function projectRow(p) {
    const acc = KHD.accent(p.category);
    const isHero = p.tier === 'hero';
    return '<button class="pcard" data-project="' + p.id + '" style="--pc:' + acc + '">' +
      '<span class="logo">' + p.name.charAt(0) + '</span>' +
      '<span class="pc-info"><span class="tag">' + p.category + '</span>' +
      '<h4>' + p.name + (isHero ? ' <span class="star">★ Flagship</span>' : '') + '</h4>' +
      '<p>' + (p.tagline || p.desc) + '</p></span>' +
      '<span class="arrow">' + ARROW + '</span></button>';
  }
  function openDrawer(cid) {
    const c = KHD.countries[cid];
    const list = KHD.byCountry(cid).slice().sort(function (a, b) {
      return (a.tier === 'hero' ? 0 : 1) - (b.tier === 'hero' ? 0 : 1);
    });
    $('#drawer-eyebrow').innerHTML = '<span class="dot"></span>' + c.flag + ' Made for';
    $('#drawer-title').textContent = c.name;
    $('#drawer-meta').textContent = c.count + (c.count === 1 ? ' product' : ' products') + ' · shipped from this market';
    $('#drawer-body').innerHTML = list.map(projectRow).join('');
    $('#scrim').classList.add('open');
    $('#drawer').classList.add('open');
    document.body.style.overflow = 'hidden';
    $$('.chip').forEach(function (ch) { ch.classList.toggle('active', ch.dataset.country === cid); });
  }
  function closeDrawer() {
    $('#scrim').classList.remove('open');
    $('#drawer').classList.remove('open');
    document.body.style.overflow = '';
    $$('.chip').forEach(function (ch) { ch.classList.remove('active'); });
    if (window.KHDGlobe) window.KHDGlobe.reset();
  }

  /* ---------- project detail modal ---------- */
  function metaCell(k, v) { return '<div class="m"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }
  function openModal(id) {
    const p = KHD.byId(id); if (!p) return;
    const c = KHD.countries[p.country];
    const acc = KHD.accent(p.category);
    const platforms = p.platforms || ['iOS', 'Android'];

    $('#modal').style.setProperty('--pc', acc);
    $('#modal-visual').innerHTML = p.shot
      ? phoneFrame(p.shot, p.name)
      : '<div style="font-family:var(--display);font-size:30px;letter-spacing:.06em">' + p.name + '</div>';

    let meta = metaCell('Market', c.flag + ' ' + c.name) +
      metaCell('Category', p.category) +
      metaCell('Platform', platforms.join(' · '));
    if (p.year) meta += metaCell('Launched', p.year);
    meta += metaCell('Client', p.client || p.name);

    let features = '';
    if (p.features && p.features.length) {
      features = '<ul class="feature-list">' + p.features.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>';
    }
    let stores = '<a class="store" href="' + ((p.store && p.store.ios) || '#') + '">App Store ' + EXT + '</a>' +
      '<a class="store" href="' + ((p.store && p.store.android) || '#') + '">Google Play ' + EXT + '</a>';
    if (p.store && p.store.web) stores += '<a class="store" href="' + p.store.web + '">Web App ' + EXT + '</a>';

    $('#modal-info').innerHTML =
      '<button class="x-close" id="modal-x" aria-label="Close">' + closeIcon() + '</button>' +
      '<span class="eyebrow"><span class="dot"></span>' + (p.tier === 'hero' ? 'Flagship product' : 'Product') + '</span>' +
      '<h2>' + p.name + '</h2>' +
      '<div class="tagline">' + (p.tagline || p.desc) + '</div>' +
      '<p class="desc">' + p.desc + '</p>' +
      features +
      '<div class="modal-meta">' + meta + '</div>' +
      '<div class="store-row">' + stores + '</div>';

    $('#modal-x').addEventListener('click', closeModal);
    $('#modal-scrim').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#modal-scrim').classList.remove('open');
    if (!$('#drawer').classList.contains('open')) document.body.style.overflow = '';
  }

  /* ---------- featured deep dives (real shots) ---------- */
  function buildFeatured() {
    const wrap = $('#featured-list'); if (!wrap) return;
    wrap.innerHTML = KHD.hero.map(function (p, i) {
      const c = KHD.countries[p.country];
      const acc = KHD.accent(p.category);
      const tags = p.features.map(function (f) { return '<span class="tagpill">' + f + '</span>'; }).join('');
      const visual = '<div class="feat-visual"><div class="halo"></div>' +
        (p.shot ? phoneFrame(p.shot, p.name) : '') +
        '</div>';
      return '<article class="feat-item reveal" style="--pc:' + acc + '">' +
        visual +
        '<div class="feat-body">' +
          '<div class="feat-num">0' + (i + 1) + ' — ' + c.flag + ' ' + c.name + '</div>' +
          '<h3 class="feat-name">' + p.name + '</h3>' +
          '<div class="feat-tagline">' + p.tagline + '</div>' +
          '<p class="feat-desc">' + p.desc + '</p>' +
          '<div class="feat-tags">' + tags + '</div>' +
          '<div class="feat-meta">' +
            '<div class="m"><div class="k">Category</div><div class="v">' + p.category + '</div></div>' +
            '<div class="m"><div class="k">Platform</div><div class="v">' + p.platforms.join(' · ') + '</div></div>' +
            '<div class="m"><div class="k">Launched</div><div class="v">' + p.year + '</div></div>' +
          '</div>' +
          '<div class="feat-cta"><button class="btn solid" data-project="' + p.id + '">View case ' + ARROW + '</button>' +
          '<button class="btn" data-country="' + p.country + '">More from ' + c.name + '</button></div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- others grid + filter ---------- */
  function ocard(p) {
    const c = KHD.countries[p.country];
    const acc = KHD.accent(p.category);
    return '<button class="ocard reveal" data-project="' + p.id + '" style="--pc:' + acc + '">' +
      '<span class="cat">' + p.category + '</span>' +
      '<div class="top"><span class="logo">' + p.name.charAt(0) + '</span>' +
      '<span><h4>' + p.name + '</h4><div class="loc">' + c.name + '</div></span></div>' +
      '<p>' + p.desc + '</p></button>';
  }
  function buildOthers(filter) {
    const wrap = $('#others-grid'); if (!wrap) return;
    const list = (!filter || filter === 'all') ? KHD.others : KHD.others.filter(function (p) { return p.country === filter; });
    wrap.innerHTML = list.map(ocard).join('');
    observeReveal(wrap);
  }
  function buildFilter() {
    const wrap = $('#others-filter'); if (!wrap) return;
    let html = '<button class="fbtn active" data-filter="all">All regions</button>';
    KHD.countryList.forEach(function (c) {
      const n = KHD.others.filter(function (p) { return p.country === c.id; }).length;
      if (n) html += '<button class="fbtn" data-filter="' + c.id + '">' + c.name + ' (' + n + ')</button>';
    });
    wrap.innerHTML = html;
  }

  /* ---------- contact ---------- */
  function buildContact() {
    const em = $('#contact-email');
    if (em) { em.textContent = KHD.contact.email; em.href = 'mailto:' + KHD.contact.email; }
    const ph = $('#contact-phones');
    if (ph) ph.innerHTML = KHD.contact.phones.map(function (p) {
      return '<div class="pcell"><div class="c">' + p.c + '</div><div class="num">' + p.num + '</div></div>';
    }).join('');
  }

  /* ---------- stats counters ---------- */
  function animateStats() {
    $$('.stat .n').forEach(function (el) {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const dur = 1300, t0 = performance.now();
      function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * e) + suffix;
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- reveal on scroll ---------- */
  let revObs;
  function observeReveal(root) {
    if (!revObs) {
      revObs = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            if (e.target.id === 'stats' && !e.target._done) { e.target._done = true; animateStats(); }
            revObs.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
    }
    $$('.reveal', root).forEach(function (el) { if (!el.classList.contains('in')) revObs.observe(el); });
    const st = $('#stats'); if (st) revObs.observe(st);
  }

  /* ---------- nav ---------- */
  function nav() {
    const header = $('header.nav');
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    });
    const toggle = $('#nav-toggle'), links = $('#nav-links');
    toggle.addEventListener('click', function () { links.classList.toggle('open'); });
    $$('#nav-links a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); }); });
  }

  /* ---------- click delegation ---------- */
  function delegate() {
    document.addEventListener('click', function (e) {
      const proj = e.target.closest('[data-project]');
      if (proj) { openModal(proj.getAttribute('data-project')); return; }
      const ctry = e.target.closest('[data-country]');
      if (ctry) {
        const cid = ctry.getAttribute('data-country');
        if (window.KHDGlobe) window.KHDGlobe.select(cid); else openDrawer(cid);
        return;
      }
      const fb = e.target.closest('.fbtn');
      if (fb) {
        $$('.fbtn').forEach(function (b) { b.classList.remove('active'); });
        fb.classList.add('active');
        buildOthers(fb.getAttribute('data-filter'));
        return;
      }
      if (e.target.closest('#scrim') || e.target.closest('#drawer-x')) { closeDrawer(); }
      if (e.target.id === 'modal-scrim') { closeModal(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); closeDrawer(); }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    stars(window.matchMedia('(max-width:860px)').matches ? 80 : 150);
    buildChips();
    buildFeatured();
    buildFilter();
    buildOthers('all');
    buildContact();
    nav();
    delegate();
    observeReveal(document);

    if (window.KHDGlobe) {
      window.KHDGlobe.init($('#globe'), { onSelect: function (cid) { openDrawer(cid); } });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.KHDcloseDrawer = closeDrawer;
})();
