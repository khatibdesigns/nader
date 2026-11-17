(function () {
  'use strict';
  if (!window.gtag) return;
  window.gtag('config', 'AW-940226257');
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href*="wa.me/96550003048"]');
    if (link) window.gtag('event', 'conversion', {
      send_to: 'AW-940226257/GbWLCIKDurodENHtqsAD',
      transport_type: 'beacon'
    });
  }, true);
})();
