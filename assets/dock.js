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
