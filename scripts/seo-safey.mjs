#!/usr/bin/env node
// Safey SEO engine — drafts a consumer-privacy article with the local `claude`
// CLI and renders it as a self-contained page under /safey/blog/<slug>/, with
// an App Store CTA. Decoupled from the studio (khatibdesigns) blog pipeline so
// it never touches that. Approve-first: writes into the deploy repo but does
// NOT push — review `git diff`, then commit + push (GitHub Pages serves it).
//
//   node scripts/seo-safey.mjs [--dry] [--slug <calendar-slug>]
//     --dry   render to /tmp/safey-blog-preview/ instead of the repo
//     --slug  draft a specific calendar item (default: next unpublished)
//
// Requires: `claude` CLI on PATH.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..')                          // ~/.khatib/khdrepo
const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const wantSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null
const CLAUDE_BIN = process.env.SAFEY_CLAUDE_BIN || 'claude'

const APP_URL = 'https://apps.apple.com/app/id1189852939'
const SITE = 'https://khatibdesigns.com'
const BLOG_DIR = join(REPO, 'safey', 'blog')

// ── content calendar: high-intent Safey keywords (edit / extend freely) ──────
const CALENDAR = [
  { slug: 'hide-photos-iphone',            keyword: 'how to hide photos on iphone' },
  { slug: 'best-password-manager-iphone',  keyword: 'best password manager for iphone' },
  { slug: 'private-vault-app-iphone',      keyword: 'private vault app for iphone' },
  { slug: 'store-passwords-safely',        keyword: 'how to store passwords safely' },
  { slug: 'keep-files-private-iphone',     keyword: 'how to keep files private on iphone' },
]

// already-published slugs = folders that already exist under /safey/blog/
const published = existsSync(BLOG_DIR)
  ? readdirSync(BLOG_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : []
const item = wantSlug ? CALENDAR.find((c) => c.slug === wantSlug)
                      : CALENDAR.find((c) => !published.includes(c.slug))
if (!item) { console.log('safey-seo: all calendar articles already published — nothing to do'); process.exit(0) }

const prompt = `You are the SEO content writer for Safey — a private, encrypted vault app for iPhone (store passwords, payment cards, secure notes, files and HIDDEN photos; locked with Face ID; everything encrypted on-device with AES-256; free on the App Store with optional paid extra storage).

Write ONE genuinely helpful, no-hype SEO article for a consumer searching Google for: "${item.keyword}".
The reader is a normal iPhone owner who wants privacy — write practical, specific, trustworthy content that actually answers the query. Mention Safey NATURALLY once or twice as one good way to solve the problem (never spammy; the page adds the download CTA itself, so do NOT write "download now" yourself).

Rules:
- Body = clean semantic HTML only: <h2>, <h3>, <p>, <ul>/<li>, <strong>, <a>. NO <h1>, NO <script>, NO inline styles.
- 700-1000 words, 3-5 <h2> sections, a numbered or bulleted steps section where it fits.
- Put the exact keyword "${item.keyword}" in the title, the meta description, and the first paragraph.
- Be accurate about iOS (Face ID, Hidden album, Files app, on-device encryption). No false claims.
- CRITICAL: inside the JSON, all HTML attributes MUST use SINGLE quotes (e.g. <a href='...'>), never double quotes.

Reply with ONLY JSON (no code fences):
{"title":"compelling <=60 char title containing the keyword","metaDescription":"120-155 chars incl. keyword","lead":"opening paragraph incl. keyword, plain text","bodyHtml":"<h2>..</h2><p>..</p>..","faq":[{"q":"..","a":".."},{"q":"..","a":".."},{"q":"..","a":".."}]}`

function askCli(p, tries = 2) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const c = spawn(CLAUDE_BIN, ['-p'], { stdio: ['pipe', 'pipe', 'pipe'] })
      let out = '', err = ''
      c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (err += d))
      c.on('error', (e) => (n < tries ? setTimeout(() => attempt(n + 1), 3000) : reject(e)))
      c.on('close', (code) => { if (code === 0 && out.trim()) return resolve(out.trim()); if (n < tries) return setTimeout(() => attempt(n + 1), 3000); reject(new Error(err || 'cli failed')) })
      c.stdin.write(p); c.stdin.end()
    }
    attempt(1)
  })
}

const clean = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on\w+='[^']*'/gi, '')
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')

// --from <file.json>: render pre-authored content, skip the model (used when the
// CLI isn't authenticated locally). Otherwise draft with the `claude` CLI.
const fromFile = args.includes('--from') ? args[args.indexOf('--from') + 1] : null
let a
if (fromFile) {
  a = JSON.parse(readFileSync(fromFile, 'utf8'))
  console.log(`safey-seo: rendering authored "${item.keyword}" (${item.slug})…`)
} else {
  console.log(`safey-seo: drafting "${item.keyword}" (${item.slug})…`)
  const raw = await askCli(prompt)
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) { console.error('no JSON from model:\n', raw.slice(0, 300)); process.exit(1) }
  try { a = JSON.parse(m[0]) }
  catch { try { a = JSON.parse(m[0].replace(/([a-zA-Z-]+)="([^"]*)"/g, "$1='$2'")) } catch (e) { console.error('bad JSON:', e.message); process.exit(1) } }
}
if (!a.title || !a.bodyHtml || !a.lead) { console.error('incomplete article'); process.exit(1) }
a.bodyHtml = clean(a.bodyHtml)

const url = `${SITE}/safey/blog/${item.slug}/`
const date = new Date().toISOString().slice(0, 10)
const ld = {
  '@context': 'https://schema.org', '@type': 'Article',
  headline: a.title, description: a.metaDescription, datePublished: date, dateModified: date,
  author: { '@type': 'Organization', name: 'Safey' }, publisher: { '@type': 'Organization', name: 'Khatib Designs' },
  mainEntityOfPage: url, keywords: item.keyword,
}
const faqLd = a.faq?.length ? {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
} : null

const page = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(a.title)} · Safey</title>
<meta name="description" content="${attr(a.metaDescription)}">
<link rel="canonical" href="${url}">
<meta name="keywords" content="${attr(item.keyword)}, private vault iphone, password manager, hide photos">
<meta property="og:type" content="article"><meta property="og:title" content="${attr(a.title)}">
<meta property="og:description" content="${attr(a.metaDescription)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/safey/assets/02_dashboard.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${faqLd ? `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>` : ''}
<style>
:root{--brand:#07beb8;--ink:#14201f;--muted:#5c6b6a;--bg:#f6f8f9;--line:#e6eaec}
*{box-sizing:border-box}body{margin:0;font:17px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:#fff}
.wrap{max-width:720px;margin:0 auto;padding:24px 20px 64px}
a{color:var(--brand)}nav.bc{font-size:13px;color:var(--muted);margin-bottom:24px}nav.bc a{text-decoration:none}
h1{font-size:2rem;line-height:1.25;margin:.2em 0 .1em}.meta{color:var(--muted);font-size:14px;margin-bottom:28px}
.lead{font-size:1.15rem;color:#33403f}h2{font-size:1.4rem;margin:1.8em 0 .4em}h3{font-size:1.12rem;margin:1.4em 0 .3em}
ul{padding-left:1.2em}img{max-width:100%;border-radius:14px}
.cta{margin:40px 0;padding:24px;border:1px solid var(--line);border-radius:18px;background:var(--bg);text-align:center}
.cta h3{margin:0 0 6px}.cta p{color:var(--muted);margin:0 0 16px}
.btn{display:inline-block;background:linear-gradient(135deg,#07beb8,#048a87);color:#fff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:14px}
.faq{margin-top:40px}.faq details{border-top:1px solid var(--line);padding:14px 0}.faq summary{font-weight:600;cursor:pointer}
footer{margin-top:56px;border-top:1px solid var(--line);padding-top:20px;color:var(--muted);font-size:13px}
</style></head>
<body><div class="wrap">
<nav class="bc"><a href="/safey/">Safey</a> › <a href="/safey/blog/">Blog</a> › ${esc(item.keyword)}</nav>
<h1>${esc(a.title)}</h1>
<div class="meta">${new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} · Safey</div>
<p class="lead">${esc(a.lead)}</p>
${a.bodyHtml}
<div class="cta">
  <h3>Keep it all private with Safey</h3>
  <p>Passwords, cards, notes, files and hidden photos — encrypted on your iPhone, locked with Face ID.</p>
  <a class="btn" href="${APP_URL}">Download Safey — free on the App Store</a>
</div>
${a.faq?.length ? `<div class="faq"><h2>FAQ</h2>${a.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>` : ''}
<footer>Safey by Khatib Designs · <a href="/safey/privacy/">Privacy</a> · <a href="/safey/terms/">Terms</a> · <a href="/safey/">Home</a></footer>
</div></body></html>`

const outDir = DRY ? join('/tmp', 'safey-blog-preview', item.slug) : join(BLOG_DIR, item.slug)
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'index.html'), page)
console.log(`✓ rendered ${DRY ? '(dry) ' : ''}${join(outDir, 'index.html')}`)
console.log(`  keyword: ${item.keyword}\n  title:   ${a.title}\n  words:   ~${a.bodyHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length}`)

if (!DRY) {
  // ── maintain a manifest + regenerate the /safey/blog/ index ────────────────
  const manPath = join(BLOG_DIR, 'manifest.json')
  const man = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : []
  const entry = { slug: item.slug, title: a.title, desc: a.metaDescription, keyword: item.keyword, date }
  const idx = man.findIndex((x) => x.slug === item.slug)
  if (idx >= 0) man[idx] = entry; else man.unshift(entry)
  writeFileSync(manPath, JSON.stringify(man, null, 2))

  const cards = man.map((x) => `<a class="post" href="/safey/blog/${x.slug}/"><h2>${esc(x.title)}</h2><p>${esc(x.desc)}</p><span>${new Date(x.date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</span></a>`).join('\n')
  const indexHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Safey Blog — Privacy tips for iPhone</title>
<meta name="description" content="Guides on keeping your iPhone private: hiding photos, storing passwords safely, and locking down personal files with Safey.">
<link rel="canonical" href="${SITE}/safey/blog/">
<style>:root{--brand:#07beb8;--ink:#14201f;--muted:#5c6b6a;--line:#e6eaec}*{box-sizing:border-box}body{margin:0;font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--ink)}.wrap{max-width:720px;margin:0 auto;padding:24px 20px 64px}a{color:var(--brand)}nav.bc{font-size:13px;color:var(--muted);margin-bottom:20px}nav.bc a{text-decoration:none}h1{font-size:2rem;margin:.2em 0 .6em}.post{display:block;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:14px}.post:hover{border-color:var(--brand)}.post h2{margin:0 0 6px;font-size:1.25rem;color:var(--ink)}.post p{margin:0 0 8px;color:var(--muted)}.post span{font-size:13px;color:var(--muted)}footer{margin-top:40px;border-top:1px solid var(--line);padding-top:16px;color:var(--muted);font-size:13px}</style></head>
<body><div class="wrap"><nav class="bc"><a href="/safey/">Safey</a> › Blog</nav>
<h1>Safey Blog</h1>
${cards}
<footer>Safey by Khatib Designs · <a href="/safey/">Home</a> · <a href="/safey/privacy/">Privacy</a></footer>
</div></body></html>`
  writeFileSync(join(BLOG_DIR, 'index.html'), indexHtml)
  console.log('✓ regenerated /safey/blog/ index')

  // add to sitemap.xml if not already present
  const smPath = join(REPO, 'sitemap.xml')
  if (existsSync(smPath)) {
    let sm = readFileSync(smPath, 'utf8')
    if (!sm.includes(url)) {
      sm = sm.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${date}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n</urlset>`)
      writeFileSync(smPath, sm); console.log('✓ added to sitemap.xml')
    }
  }
  console.log('\nNext: review `git -C ~/.khatib/khdrepo diff`, then commit + push to publish.')
}
