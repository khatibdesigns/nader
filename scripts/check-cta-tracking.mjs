#!/usr/bin/env node
// CTA tracking guard — the book_call key event has died twice already, both
// times from a merge that reordered assets/analytics.js. Every book-call CTA is
// itself a wa.me link, so if the wa.me branch is checked first it swallows the
// tap and book_call reads 0 in GA4 while the traffic is fine. This asserts:
//   1. `data-cta="book-call"` is checked BEFORE `a[href*="wa.me"]`, and
//   2. every book-call anchor carries a data-cta-location, so the GA4
//      breakdown is not one undifferentiated "inline" bucket.
// Dependency-free, no CI wiring — run it before merging anything that touches
// the click handler or a CTA:
//
//   node scripts/check-cta-tracking.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..')                          // ~/.khatib/khdrepo
const SKIP = new Set(['.git', 'node_modules', '.github'])
const errors = []

// ── 1. handler order in assets/analytics.js ─────────────────────────────────
const ANALYTICS = join(REPO, 'assets', 'analytics.js')
let analytics = ''
try {
  analytics = readFileSync(ANALYTICS, 'utf8')
} catch {
  errors.push('assets/analytics.js is missing — nothing tracks book_call')
}
if (analytics) {
  const book = analytics.indexOf('data-cta="book-call"')
  const wa = analytics.indexOf('a[href*="wa.me"]')
  if (book === -1) errors.push('assets/analytics.js: no [data-cta="book-call"] branch — book_call can never fire')
  else if (wa === -1) errors.push('assets/analytics.js: no a[href*="wa.me"] branch — whatsapp_click can never fire')
  else if (book > wa) errors.push(
    'assets/analytics.js: the a[href*="wa.me"] branch is checked BEFORE [data-cta="book-call"].\n' +
    '  Every book-call CTA is a wa.me link, so the wa.me branch returns first and every\n' +
    '  "Book a scoping call" tap logs whatsapp_click instead of the book_call key event.\n' +
    '  Move the book branch back to the top of the delegated click listener.')
}

// ── 2. every book-call anchor declares where it sits ────────────────────────
function htmlFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...htmlFiles(p))
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(p)
  }
  return out
}

for (const file of htmlFiles(REPO)) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = m[0]
    if (!/data-cta\s*=\s*"book-call"/i.test(tag)) continue
    if (/data-cta-location\s*=\s*"[^"]+"/i.test(tag)) continue
    const line = html.slice(0, m.index).split('\n').length
    errors.push(`${relative(REPO, file)}:${line}: data-cta="book-call" anchor has no data-cta-location — ` +
                'its book_call events fall back to "inline" and blur the GA4 breakdown')
  }
}

if (errors.length) {
  console.error('check-cta-tracking: ' + errors.length + ' problem(s) found\n')
  for (const e of errors) console.error('  ✗ ' + e)
  console.error('')
  process.exit(1)
}
console.log('check-cta-tracking: ok — book_call is checked before wa.me and every book-call CTA is located')
