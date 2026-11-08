#!/usr/bin/env python3
"""Khatib Designs v2 site builder.

Pages are body fragments in scripts/v2/src/<lang>/<route>.html, each starting with
<!--meta {...} --> (title, description, optional og_image, jsonld, robots).
A fragment at src/en/work/phood.html becomes /work/phood/index.html; src/ar/ai.html
becomes /ar/ai/index.html. Header, footer, head tags, hreflang and canonical are added here.

Also re-wraps every blog article (blog/<slug>/ and ar/blog/<slug>/) in the v2 chrome,
regenerates both blog indexes and rebuilds sitemap.xml. Safe to run repeatedly.

  python3 scripts/v2/build.py            # everything
  python3 scripts/v2/build.py --blog     # articles, indexes, sitemap only (used by the publisher)
"""
import html, json, os, re, sys, glob, hashlib
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'scripts', 'v2', 'src')
SITE = 'https://khatibdesigns.com'
LANGS = ['en', 'ar', 'de', 'fr']
PREFIX = {'en': '', 'ar': '/ar', 'de': '/de', 'fr': '/fr'}
LOCALE = {'en': 'en_US', 'ar': 'ar_AR', 'de': 'de_DE', 'fr': 'fr_FR'}
OG_DEFAULT = SITE + '/assets/v2/og.jpg'

T = {
 'en': dict(skip='Skip to content', home='Khatib Designs, home', menu='Menu', lang_label='Language: English',
            nav=[('AI', '/ai/'), ('Transformation', '/digital-transformation/'), ('Speaking', '/speaking/'), ('Work', '/work/'), ('Insights', '/blog/'), ('Company', '/company/')],
            cta='Book a conversation', brand='Khatib Designs',
            colophon='Khatib Designs Ltd (ХАТИБ ДИЗАЙНС ООД)<br>Registered in Sofia, Bulgaria · Est. 2015<br>AI and digital transformation consultancy, serving clients worldwide.',
            h_services='Services', services=[('AI consulting', '/ai/'), ('Digital transformation', '/digital-transformation/'), ('Speaking &amp; education', '/speaking/'), ('Product &amp; engineering', '/work/'), ('App pricing', '/apps/')],
            h_company='Company', company=[('About', '/company/'), ('Nader Alkhatib', '/nader/'), ('Insights', '/blog/'), ('Contact', '/book/')],
            h_contact='Contact', terms='Terms', privacy='Privacy', refunds='Refunds', rights='© 2015–{y} Khatib Designs Ltd',
            crumbs_home='Home', insights='Insights', read='Read', min_read='min read', more='More insights',
            all_articles='All articles', faq='Frequently asked questions'),
 'ar': dict(skip='تخطَّ إلى المحتوى', home='خطيب ديزاينز، الصفحة الرئيسية', menu='القائمة', lang_label='اللغة: العربية',
            nav=[('الذكاء الاصطناعي', '/ai/'), ('التحول الرقمي', '/digital-transformation/'), ('المحاضرات', '/speaking/'), ('أعمالنا', '/work/'), ('مقالات', '/blog/'), ('الشركة', '/company/')],
            cta='احجز مكالمة', brand='خطيب ديزاينز',
            colophon='Khatib Designs Ltd (ХАТИБ ДИЗАЙНС ООД)<br>شركة مسجّلة في صوفيا، بلغاريا · تأسست عام 2015<br>استشارات في الذكاء الاصطناعي والتحول الرقمي لعملاء حول العالم.',
            h_services='الخدمات', services=[('استشارات الذكاء الاصطناعي', '/ai/'), ('التحول الرقمي', '/digital-transformation/'), ('المحاضرات والتعليم', '/speaking/'), ('تطوير المنتجات', '/work/'), ('أسعار التطبيقات', '/apps/')],
            h_company='الشركة', company=[('من نحن', '/company/'), ('نادر الخطيب', '/nader/'), ('مقالات', '/blog/'), ('تواصل معنا', '/book/')],
            h_contact='تواصل', terms='الشروط', privacy='الخصوصية', refunds='الاسترداد', rights='© 2015–{y} Khatib Designs Ltd',
            crumbs_home='الرئيسية', insights='مقالات', read='اقرأ', min_read='دقائق قراءة', more='مقالات أخرى',
            all_articles='كل المقالات', faq='أسئلة شائعة'),
 'de': dict(skip='Zum Inhalt springen', home='Khatib Designs, Startseite', menu='Menü', lang_label='Sprache: Deutsch',
            nav=[('KI', '/ai/'), ('Transformation', '/digital-transformation/'), ('Vorträge', '/speaking/'), ('Projekte', '/work/'), ('Insights', '/blog/'), ('Unternehmen', '/company/')],
            cta='Gespräch buchen', brand='Khatib Designs',
            colophon='Khatib Designs Ltd (ХАТИБ ДИЗАЙНС ООД)<br>Eingetragen in Sofia, Bulgarien · Gegründet 2015<br>Beratung für KI und digitale Transformation, für Kunden weltweit.',
            h_services='Leistungen', services=[('KI-Beratung', '/ai/'), ('Digitale Transformation', '/digital-transformation/'), ('Vorträge &amp; Lehre', '/speaking/'), ('Produkt &amp; Engineering', '/work/'), ('App-Preise', '/apps/')],
            h_company='Unternehmen', company=[('Über uns', '/company/'), ('Nader Alkhatib', '/nader/'), ('Insights', '/blog/'), ('Kontakt', '/book/')],
            h_contact='Kontakt', terms='AGB', privacy='Datenschutz', refunds='Erstattungen', rights='© 2015–{y} Khatib Designs Ltd',
            crumbs_home='Start', insights='Insights', read='Lesen', min_read='Min. Lesezeit', more='Weitere Artikel',
            all_articles='Alle Artikel', faq='Häufige Fragen'),
 'fr': dict(skip='Aller au contenu', home='Khatib Designs, accueil', menu='Menu', lang_label='Langue : français',
            nav=[('IA', '/ai/'), ('Transformation', '/digital-transformation/'), ('Conférences', '/speaking/'), ('Réalisations', '/work/'), ('Articles', '/blog/'), ('Entreprise', '/company/')],
            cta='Réserver un échange', brand='Khatib Designs',
            colophon='Khatib Designs Ltd (ХАТИБ ДИЗАЙНС ООД)<br>Société immatriculée à Sofia, Bulgarie · Fondée en 2015<br>Conseil en IA et transformation numérique, pour des clients du monde entier.',
            h_services='Services', services=[('Conseil en IA', '/ai/'), ('Transformation numérique', '/digital-transformation/'), ('Conférences &amp; formation', '/speaking/'), ('Produit &amp; ingénierie', '/work/'), ('Tarifs des applications', '/apps/')],
            h_company='Entreprise', company=[('À propos', '/company/'), ('Nader Alkhatib', '/nader/'), ('Articles', '/blog/'), ('Contact', '/book/')],
            h_contact='Contact', terms='Conditions', privacy='Confidentialité', refunds='Remboursements', rights='© 2015–{y} Khatib Designs Ltd',
            crumbs_home='Accueil', insights='Articles', read='Lire', min_read='min de lecture', more='Autres articles',
            all_articles='Tous les articles', faq='Questions fréquentes'),
}
LANG_NAMES = [('en', 'English', 'EN'), ('ar', 'العربية', 'AR'), ('de', 'Deutsch', 'DE'), ('fr', 'Français', 'FR')]

GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>'
BURGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>'


def asset_ver():
    h = hashlib.md5()
    for f in ('assets/v2/site.css', 'assets/v2/site.js', 'assets/v2/fonts.css', 'assets/v2/price.js'):
        p = os.path.join(ROOT, f)
        if os.path.exists(p):
            h.update(open(p, 'rb').read())
    return h.hexdigest()[:8]


VER = asset_ver()
ORG_ID = SITE + '/#studio'
PERSON_ID = SITE + '/nader/#nader'


def lp(lang, path):
    """Localised path for a site route."""
    if path.startswith(('/apps/', '/legal/', '/blog/')) and lang in ('de', 'fr'):
        return path  # English-only (or EN+AR) sections
    if path.startswith('/legal/'):
        return path
    return PREFIX[lang] + path


def route_of(rel):
    rel = rel[:-5]  # .html
    if rel == 'index':
        return '/'
    if rel.endswith('/index'):
        rel = rel[:-6]
    return '/' + rel + '/'


def collect_pages():
    pages = {}
    for lang in LANGS:
        base = os.path.join(SRC, lang)
        for f in glob.glob(os.path.join(base, '**', '*.html'), recursive=True):
            rel = os.path.relpath(f, base)
            if os.path.basename(rel).startswith('_') or rel.startswith('blog-mock'):
                continue
            pages.setdefault(route_of(rel), {})[lang] = f
    return pages


def parse_fragment(path):
    s = open(path, encoding='utf-8').read()
    m = re.match(r'\s*<!--meta (.*?) -->\s*', s, re.S)
    meta = json.loads(m.group(1)) if m else {}
    body = s[m.end():] if m else s
    style = ''
    sm = re.match(r'\s*<style>(.*?)</style>\s*', body, re.S)
    if sm:
        style, body = sm.group(1), body[sm.end():]
    return meta, style, body


IMG_RE = re.compile(r'<img([^>]*?)\ssrc="/assets/v2/img/([a-z0-9_-]+)\.(?:jpg|png)"([^>]*)>')


def responsive(body):
    """Point v2 images at their WebP variants with a srcset."""
    def sub(m):
        pre, name, post = m.group(1), m.group(2), m.group(3)
        d = os.path.join(ROOT, 'assets', 'v2', 'img')
        if not os.path.exists(os.path.join(d, name + '-480.webp')):
            return m.group(0)
        src = f'/assets/v2/img/{name}-480.webp'
        srcset = f'/assets/v2/img/{name}-480.webp 480w'
        for w in (720, 960):
            if os.path.exists(os.path.join(d, f'{name}-{w}.webp')):
                srcset += f', /assets/v2/img/{name}-{w}.webp {w}w'
                if w == 720:
                    src = f'/assets/v2/img/{name}-720.webp'
        attrs = pre + post
        sizes = '' if 'sizes=' in attrs else ' sizes="(max-width: 900px) 88vw, 440px"'
        lazy = '' if ('loading=' in attrs or 'fetchpriority' in attrs) else ' loading="lazy"'
        return f'<img{pre} src="{src}" srcset="{srcset}"{sizes}{lazy}{post}>'
    return IMG_RE.sub(sub, body)


def head(lang, path, meta, alternates, style='', extra=''):
    t = meta.get('title', 'Khatib Designs')
    d = meta.get('description', '')
    og = meta.get('og_image', OG_DEFAULT)
    canonical = SITE + path
    alts = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE + p}">\n' for l, p in alternates)
    if alternates:
        xd = dict(alternates).get('en', alternates[0][1])
        alts += f'<link rel="alternate" hreflang="x-default" href="{SITE + xd}">\n'
    robots = meta.get('robots', 'index, follow, max-image-preview:large, max-snippet:-1')
    ld = ''.join('<script type="application/ld+json">' + json.dumps(o, ensure_ascii=False) + '</script>\n' for o in meta.get('jsonld', []))
    fonts_preload = '<link rel="preload" href="/assets/v2/fonts/figtree-latin-7073ac.woff2" as="font" type="font/woff2" crossorigin>\n'
    if lang == 'ar':
        fonts_preload += ('<link rel="preload" href="/assets/v2/fonts/plexar-arabic-6fbb1d.woff2" as="font" type="font/woff2" crossorigin>\n'
                         '<link rel="preload" href="/assets/v2/fonts/plexar-arabic-dbd757.woff2" as="font" type="font/woff2" crossorigin>\n')
    return f'''<!doctype html>
<html lang="{lang}"{' dir="rtl"' if lang == 'ar' else ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/assets/analytics.js" defer></script>
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{canonical}">
{alts}<meta name="robots" content="{robots}">
<meta name="theme-color" content="#f8f8fb">
<meta property="og:type" content="{meta.get('og_type', 'website')}">
<meta property="og:site_name" content="Khatib Designs">
<meta property="og:title" content="{meta.get('og_title', t)}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og}">
<meta property="og:locale" content="{LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{meta.get('og_title', t)}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
{fonts_preload}<link rel="stylesheet" href="/assets/v2/site.css?v={VER}">
{('<style>' + style + '</style>') if style.strip() else ''}
{extra}{ld}</head>
'''


def header(lang, path, alternates, active=''):
    s = T[lang]
    nav = []
    for label, p in s['nav']:
        href = lp(lang, p)
        cur = ' aria-current="page"' if active and (active == p or (p != '/' and active.startswith(p))) else ''
        nav.append(f'<a href="{href}"{cur}>{label}</a>')
    alt = dict(alternates)
    items = []
    for code, name, short in LANG_NAMES:
        href = alt.get(code, PREFIX[code] + '/')
        cur = ' aria-current="true"' if code == lang else ''
        items.append(f'<li><a href="{href}" lang="{code}" hreflang="{code}"{cur}>{name} <small>{short}</small></a></li>')
    home = PREFIX[lang] + '/'
    return f'''<body>
<a class="skip" href="#main">{s['skip']}</a>
<header class="bar">
  <div class="bar__in">
    <a class="brand" href="{home}" aria-label="{s['home']}"><img src="/assets/v2/kmark.png" alt="" width="36" height="72"><span>{s['brand']}</span></a>
    <nav class="nav" aria-label="Main">
      {''.join(nav)}
    </nav>
    <div class="bar__end">
      <details class="lang">
        <summary aria-label="{lang.upper()}, {s['lang_label']}">{GLOBE}<span>{lang.upper()}</span></summary>
        <ul>{''.join(items)}</ul>
      </details>
      <a class="btn btn--ink btn--sm" href="{lp(lang, '/book/')}">{s['cta']}</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-label="{s['menu']}">{BURGER}</button>
    </div>
  </div>
</header>
'''


def footer(lang):
    s = T[lang]
    li = lambda xs: ''.join(f'<li><a href="{lp(lang, p)}">{n}</a></li>' for n, p in xs)
    y = date.today().year
    return f'''<footer class="foot">
  <div class="foot__in">
    <div><img src="/assets/v2/wordmark-black.svg" alt="Khatib Designs" width="33" height="40" loading="lazy"><p>{s['colophon']}</p></div>
    <div><h3>{s['h_services']}</h3><ul>{li(s['services'])}</ul></div>
    <div><h3>{s['h_company']}</h3><ul>{li(s['company'])}</ul></div>
    <div><h3>{s['h_contact']}</h3><ul><li><a href="mailto:nader@khatibdesigns.com">nader@khatibdesigns.com</a></li><li><a href="tel:+359876375875" dir="ltr">+359 87 637 5875</a></li><li><a href="tel:+96550003048" dir="ltr">+965 5000 3048</a></li><li><a href="https://www.linkedin.com/in/nader-khatib/" rel="noopener">LinkedIn</a></li></ul></div>
  </div>
  <div class="foot__legal"><span>{s['rights'].format(y=y)}</span><span><a href="/legal/terms/">{s['terms']}</a> · <a href="/legal/privacy/">{s['privacy']}</a> · <a href="/legal/refunds/">{s['refunds']}</a></span></div>
</footer>
<script src="/assets/v2/site.js?v={VER}" defer></script>
</body>
</html>
'''


def write(path, html_text):
    out = os.path.join(ROOT, path.lstrip('/'), 'index.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html_text)


def build_pages():
    pages = collect_pages()
    built = []
    for route, by_lang in sorted(pages.items()):
        alternates = [(l, PREFIX[l] + route) for l in LANGS if l in by_lang]
        for lang, f in by_lang.items():
            meta, style, body = parse_fragment(f)
            path = PREFIX[lang] + route
            ld = meta.get('jsonld', [])
            if route != '/':
                crumbs = [{'@type': 'ListItem', 'position': 1, 'name': T[lang]['crumbs_home'], 'item': SITE + PREFIX[lang] + '/'},
                          {'@type': 'ListItem', 'position': 2, 'name': meta.get('crumb', meta.get('title', '').split(' · ')[0]), 'item': SITE + path}]
                ld = ld + [{'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': crumbs}]
            qa = re.findall(r'<details><summary>(.*?)<svg.*?</summary>\s*<p>(.*?)</p>', body, re.S)
            if qa:
                strip = lambda x: re.sub(r'<[^>]+>', '', x).strip()
                ld = ld + [{'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': strip(q), 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in qa]}]
            meta = dict(meta, jsonld=ld)
            rbody = responsive(body)
            if 'class="money"' in rbody:
                rbody += f'<script src="/assets/v2/price.js?v={VER}" defer></script>\n'
            pre = ''
            m = re.search(r'<img[^>]*fetchpriority="high"[^>]*>', rbody)
            if m:
                ss = re.search(r'srcset="([^"]+)"', m.group(0)); sz = re.search(r'sizes="([^"]+)"', m.group(0)); sr = re.search(r'src="([^"]+)"', m.group(0))
                pre = f'<link rel="preload" as="image" href="{sr.group(1)}"' + (f' imagesrcset="{ss.group(1)}" imagesizes="{sz.group(1)}"' if ss and sz else '') + ' fetchpriority="high">\n'
            page = head(lang, path, meta, alternates, style, extra=pre) + header(lang, path, alternates, active=route) + rbody + footer(lang)
            write(path, page)
            built.append(path)
    return built


# ---------- blog ----------

def read_article(path):
    s = open(path, encoding='utf-8').read()
    g = lambda pat: (re.search(pat, s, re.S) or [None, ''])[1] if re.search(pat, s, re.S) else ''
    title = g(r'<title>(.*?)</title>')
    desc = g(r'<meta name="description" content="(.*?)"')
    h1 = g(r'<h1[^>]*>(.*?)</h1>')
    dt = g(r'<time datetime="([0-9-]+)"')
    cat = re.sub(r'<[^>]+>', '', g(r'<span class="eyebrow">(.*?)</span>\s*<h1')).strip()
    return dict(raw=s, title=title, desc=desc, h1=h1, date=dt, cat=cat)


def wrap_article(lang, slug, path):
    """Wrap an article in the v2 chrome. Works on legacy pages and on already-wrapped ones,
    so template changes reach every article on each build."""
    a = read_article(path)
    s = a['raw']
    headpart = s[:s.index('</head>')]
    keep = []
    for pat in (r'<title>.*?</title>', r'<meta name="description"[^>]*>', r'<link rel="canonical"[^>]*>',
                r'<link rel="alternate"[^>]*>', r'<meta name="robots"[^>]*>', r'<meta property="(?:og|article):[^"]*"[^>]*>',
                r'<meta name="twitter:[^"]*"[^>]*>', r'<script type="application/ld\+json">.*?</script>'):
        keep += re.findall(pat, headpart, re.S)
    keep_s = '\n'.join(keep)
    # founder byline: no employer other than Khatib Designs (client rule, 2026-11)
    keep_s = keep_s.replace('"jobTitle":"Digital Factory Director at stc Kuwait; Enterprise AI Consultant"', '"jobTitle":"Founder & CEO, Khatib Designs"')
    body = s[s.index('</head>'):]
    if 'data-v2="article"' in s:
        art = re.search(r'(<article class="article" data-v2="article">.*?</article>)', body, re.S).group(1)
        rm = re.search(r'(<section class="section section--white related">.*?</section>)', body, re.S)
        rel_html = rm.group(1) if rm else ''
        cm = re.search(r'(<section class="wrap" aria-label="Contact">.*?</section>)', body, re.S)
        closing = cm.group(1) if cm else ''
    else:
        art = re.search(r'(<article class="article">.*?</article>)', body, re.S).group(1)
        related = re.search(r'<div class="related-grid[^"]*">(.*?)</div>\s*</section>', body, re.S)
        rel_html = ''
        if related:
            cards = re.findall(r'<a class="related-card" href="([^"]+)"><span class="rc-cat">(.*?)</span><h4>(.*?)</h4><p>(.*?)</p></a>', related.group(1), re.S)
            if cards:
                rel_html = '<section class="section section--white related"><div class="wrap"><div class="head"><h2>' + T[lang]['more'] + '</h2></div><div class="rel-grid">' + ''.join(
                    f'<a class="rel" href="{h}"><span class="rel__cat">{c}</span><b>{t}</b><span>{p}</span></a>' for h, c, t, p in cards) + '</div></div></section>'
        cta = re.search(r'<section class="case-cta-band">.*?<h2>(.*?)</h2><p>(.*?)</p>', body, re.S)
        closing = ''
        if cta:
            cta_h = re.sub(r'<br\s*/?>', ' ', cta.group(1))
            book, ctal, ctap = lp(lang, '/book/'), T[lang]['cta'], cta.group(2)
            closing = f'<section class="wrap" aria-label="Contact"><div class="closing"><div><h2>{cta_h}</h2><p>{ctap}</p></div><div class="cta"><a class="btn btn--ink" href="{book}">{ctal}</a></div></div></section>'
        art = art.replace(' reveal"', '"').replace('class="reveal"', '')
        art = art.replace('<article class="article">', '<article class="article" data-v2="article">', 1)
    # the generated hero cards carry the old dark brand; they stay as the share image (og:image) only
    art = re.sub(r'\s*<img class="article-hero"[^>]*>', '', art)
    langs_alt = re.findall(r'<link rel="alternate" hreflang="([a-z-]+)" href="https://khatibdesigns.com([^"]+)"', headpart)
    alternates = [(l, p) for l, p in langs_alt if l in LANGS]
    pagepath = PREFIX[lang] + '/blog/' + slug + '/'
    out = f'''<!doctype html>
<html lang="{lang}"{' dir="rtl"' if lang == 'ar' else ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/assets/analytics.js" defer></script>
{keep_s}
<meta name="theme-color" content="#f8f8fb">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/v2/fonts/{'plexar-arabic-6fbb1d' if lang == 'ar' else 'figtree-latin-7073ac'}.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/v2/site.css?v={VER}">
</head>
''' + header(lang, pagepath, alternates, active='/blog/') + f'<main id="main" class="post">\n{art}\n</main>\n{rel_html}\n{closing}\n' + footer(lang)
    if out != s:
        open(path, 'w', encoding='utf-8').write(out)
    return a


def rewrap_versions():
    """Bump the stylesheet version on already-converted articles."""
    for f in glob.glob(os.path.join(ROOT, 'blog', '*', 'index.html')) + glob.glob(os.path.join(ROOT, 'ar', 'blog', '*', 'index.html')):
        s = open(f, encoding='utf-8').read()
        n = re.sub(r'/assets/v2/(site\.(?:css|js))\?v=[0-9a-f]+', lambda m: f'/assets/v2/{m.group(1)}?v={VER}', s)
        if n != s:
            open(f, 'w', encoding='utf-8').write(n)


def fmt_date(d, lang):
    try:
        y, m, dd = map(int, d.split('-'))
    except Exception:
        return ''
    months = {'en': 'January February March April May June July August September October November December'.split(),
              'ar': 'يناير فبراير مارس أبريل مايو يونيو يوليو أغسطس سبتمبر أكتوبر نوفمبر ديسمبر'.split()}
    return f'{dd} {months[lang][m - 1]} {y}'


def build_blog():
    idx = {}
    for lang, base in (('en', 'blog'), ('ar', 'ar/blog')):
        items = []
        for f in sorted(glob.glob(os.path.join(ROOT, base, '*', 'index.html'))):
            slug = os.path.basename(os.path.dirname(f))
            if '<article' not in open(f, encoding='utf-8').read():
                continue  # redirect stub for a moved article
            a = wrap_article(lang, slug, f)
            a2 = read_article(f)
            items.append(dict(slug=slug, title=re.sub(r'<[^>]+>', '', a2['h1'] or a2['title']), desc=a2['desc'], date=a2['date'], cat=a2['cat']))
        items.sort(key=lambda x: (x['date'], x['slug']), reverse=True)
        idx[lang] = items
    for lang in ('en', 'ar'):
        write_blog_index(lang, idx[lang], has_other=bool(idx['ar' if lang == 'en' else 'en']))
    return idx


def write_blog_index(lang, items, has_other=True):
    s = T[lang]
    path = PREFIX[lang] + '/blog/'
    title = 'Insights · Khatib Designs' if lang == 'en' else 'مقالات · خطيب ديزاينز'
    desc = ('Practical writing on AI, digital transformation and building software: costs, timelines, governance and what works in production.'
            if lang == 'en' else 'مقالات عملية عن الذكاء الاصطناعي والتحول الرقمي وبناء البرمجيات: التكلفة والمدة والحوكمة وما ينجح فعلاً.')
    h1 = 'Insights.' if lang == 'en' else 'مقالات.'
    deck = ('Notes from the work: what AI and software cost, how long they take, and how to run them well.'
            if lang == 'en' else 'ملاحظات من واقع العمل: كم تكلّف مشاريع الذكاء الاصطناعي والبرمجيات، وكم تستغرق، وكيف تُدار جيداً.')
    alternates = [('en', '/blog/'), ('ar', '/ar/blog/')]
    cats = []
    for it in items:
        if it['cat'] and it['cat'] not in cats:
            cats.append(it['cat'])
    rows = ''.join(
        f'<li data-cat="{html.escape(it["cat"])}"><a href="{path}{it["slug"]}/"><span class="post-row__cat">{it["cat"]}</span><b>{it["title"]}</b><span class="post-row__desc">{it["desc"]}</span><time datetime="{it["date"]}">{fmt_date(it["date"], lang)}</time></a></li>'
        for it in items)
    filters = '<div class="filters" role="group" aria-label="Filter"><button type="button" aria-pressed="true" data-cat="">' + s['all_articles'] + f' <small>{len(items)}</small></button>' + ''.join(
        f'<button type="button" aria-pressed="false" data-cat="{html.escape(c)}">{c}</button>' for c in cats) + '</div>'
    ld = [{'@context': 'https://schema.org', '@type': 'Blog', 'name': title, 'url': SITE + path, 'inLanguage': lang, 'publisher': {'@id': ORG_ID},
           'blogPost': [{'@type': 'BlogPosting', 'headline': it['title'], 'url': SITE + path + it['slug'] + '/', 'datePublished': it['date']} for it in items[:30]]}]
    meta = dict(title=title, description=desc, jsonld=ld)
    body = f'''<main id="main">
  <section class="page-head" aria-labelledby="page-h">
    <h1 id="page-h">{h1}</h1>
    <p class="deck">{deck}</p>
  </section>
  <section class="section section--tight" aria-label="{s['all_articles']}">
    <div class="wrap">
      <h2 class="sr-only">{s['all_articles']}</h2>
      {filters}
      <ul class="post-list">{rows}</ul>
    </div>
  </section>
</main>
'''
    write(path, head(lang, path, meta, alternates) + header(lang, path, alternates, active='/blog/') + body + footer(lang))


# ---------- sitemap ----------

def build_sitemap(extra=()):
    """Old sitemap URLs are never dropped while their page exists; new pages and articles are added."""
    sm = os.path.join(ROOT, 'sitemap.xml')
    raw = open(sm, encoding='utf-8').read() if os.path.exists(sm) else ''
    old = re.findall(r'<loc>([^<]+)</loc>', raw)
    lastmod = dict(re.findall(r'<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>', raw))
    def exists(u):
        rel = u[len(SITE):].lstrip('/')
        p = os.path.join(ROOT, rel)
        return os.path.isfile(os.path.join(p, 'index.html')) if (u.endswith('/') or rel == '') else os.path.isfile(p)
    urls = [u for u in old if u.startswith(SITE) and exists(u)]
    for base in ('blog', 'ar/blog'):
        for f in glob.glob(os.path.join(ROOT, base, '*', 'index.html')):
            if 'data-v2="article"' not in open(f, encoding='utf-8').read():
                continue
            urls.append(SITE + '/' + os.path.relpath(os.path.dirname(f), ROOT) + '/')
    for route, by_lang in sorted(collect_pages().items()):
        for l in LANGS:
            if l in by_lang:
                robots = parse_fragment(by_lang[l])[0].get('robots', '')
                if 'noindex' not in robots:
                    urls.append(SITE + PREFIX[l] + route)
    seen, out = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u); out.append(u)
    today = date.today().isoformat()
    fresh = set(SITE + p for p in extra)
    body = ''.join(f'<url><loc>{u}</loc><lastmod>{today if (u in fresh or u not in lastmod) else lastmod[u]}</lastmod></url>\n' for u in out)
    open(sm, 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + '</urlset>\n')
    return out


if __name__ == '__main__':
    only_blog = '--blog' in sys.argv
    b = []
    if not only_blog:
        b = build_pages()
        print(f'pages: {len(b)}')
    idx = build_blog()
    print(f'articles: en {len(idx["en"])}, ar {len(idx["ar"])}')
    u = build_sitemap(b)
    print(f'sitemap: {len(u)} urls')
