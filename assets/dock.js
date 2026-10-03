// A lead that does not say which page it came from cannot be replied to properly or
// attributed, so every WhatsApp prefill carries the name of the page the visitor was reading.
(function () {
  try {
    var links = document.querySelectorAll('a[href*="wa.me"]');
    if (!links.length || typeof URL !== 'function' || typeof URLSearchParams !== 'function') return;
    var h1 = document.querySelector('h1');
    var label = (h1 ? h1.textContent : '').replace(/\s+/g, ' ').trim();
    if (!label) label = document.title.replace(/\s*[|—]\s*Khatib Designs\s*$/, '').replace(/\s+/g, ' ').trim();
    if (label.length > 80) label = label.slice(0, 79) + '…';
    var ar = document.documentElement.lang === 'ar';
    var suffix = ar
      ? '‏ — بخصوص: ' + label + ' (' + location.pathname + ')'
      : ' — re: ' + label + ' (' + location.pathname + ')';
    Array.prototype.forEach.call(links, function (a) {
      if (a.hasAttribute('data-khd-ctx')) return;
      var url = new URL(a.href);
      var text = url.searchParams.get('text');
      if (!text) return;
      url.searchParams.set('text', text + suffix);
      // WhatsApp reads the prefill as percent-encoded, so a space stays %20 and never "+".
      url.search = url.search.replace(/\+/g, '%20');
      a.href = url.toString();
      a.setAttribute('data-khd-ctx', '1');
    });
  } catch (e) {}
})();

// The floating "Book a free call" pill steps aside while an in-page booking button is on
// screen, so a page never shows two identical buttons stacked on top of each other
// (the hero, the contact section and every closing band carry their own .book-btn).
(function () {
  var pill = document.querySelector('.dock-book');
  var targets = document.querySelectorAll('.book-btn');
  if (!pill || !targets.length || !('IntersectionObserver' in window)) return;
  var onScreen = new Set();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target); });
    pill.classList.toggle('is-tucked', onScreen.size > 0);
  });
  targets.forEach(function (t) { io.observe(t); });
})();
