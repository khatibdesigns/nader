/* ============================================================
   Khatib Designs — innovative dotted globe (globe.gl + three-globe)
   A custom point-matrix Earth: continents rendered as a field of
   dots, your six markets glowing warm, animated connection arcs.
   No stock photo texture — it's built from country geometry, so it
   reads as part of the brand rather than a NASA snapshot.
   ============================================================ */
window.KHDGlobe = (function () {
  let g, el, cb, selId = null, speed = 0.42, autoOn = true, ready = false;

  // Atelier palette: cool quiet field, single warm accent for markets.
  const FIELD   = 'rgba(143,150,205,0.32)';   // ordinary land dots
  const FIELD_HI= 'rgba(255,176,120,0.85)';   // dots of our six markets
  const PIN     = '#ff9a4d';
  const PIN_SEL = '#ffffff';
  const ATM     = '#5b63b0';
  const ARC     = ['rgba(255,150,90,0)', 'rgba(255,178,120,0.85)', 'rgba(120,140,255,0)'];
  const RING    = [255, 176, 120];

  const MARKET_IDS = ['Kuwait','Bulgaria','United States of America','Lebanon','United Kingdom','Algeria'];

  function pts() { return window.KHD.countryList.map(function (c) { return Object.assign({}, c); }); }

  function buildArcs() {
    const c = window.KHD.countries;
    const pairs = [
      ['bulgaria','kuwait'], ['bulgaria','uk'], ['bulgaria','lebanon'],
      ['kuwait','lebanon'], ['kuwait','algeria'], ['uk','usa'],
      ['lebanon','algeria'], ['usa','kuwait'], ['uk','lebanon'],
    ];
    return pairs.map(function (p) {
      return { startLat:c[p[0]].lat, startLng:c[p[0]].lng, endLat:c[p[1]].lat, endLng:c[p[1]].lng };
    });
  }

  function isMarket(feat) {
    const n = (feat.properties && (feat.properties.ADMIN || feat.properties.NAME)) || '';
    return MARKET_IDS.indexOf(n) !== -1;
  }

  function init(elem, opts) {
    opts = opts || {};
    el = elem; cb = opts.onSelect;
    const isMobile = window.matchMedia('(max-width:860px)').matches;

    g = Globe({ animateIn: true })(el)
      .backgroundColor('rgba(0,0,0,0)')
      .showGlobe(true)
      .showAtmosphere(true)
      .atmosphereColor(ATM)
      .atmosphereAltitude(0.16)
      // markets — glowing pins
      .pointsData(pts()).pointLat('lat').pointLng('lng')
      .pointColor(function (d) { return d.id === selId ? PIN_SEL : PIN; })
      .pointAltitude(0.02)
      .pointRadius(function (d) { return d.id === selId ? 0.85 : 0.55; })
      .pointsMerge(false)
      .pointLabel(function (d) { return '<div class="g-tip">' + d.name + ' · ' + d.count + ' apps</div>'; })
      .onPointClick(function (d) { if (d) select(d.id); })
      .onPointHover(function (d) { el.style.cursor = d ? 'pointer' : (isMobile ? 'default' : 'grab'); })
      // pulsing halo rings on each market
      .ringsData(pts()).ringLat('lat').ringLng('lng')
      .ringColor(function () { return function (t) { return 'rgba(' + RING[0] + ',' + RING[1] + ',' + RING[2] + ',' + (1 - t) + ')'; }; })
      .ringMaxRadius(3.2).ringPropagationSpeed(1.25).ringRepeatPeriod(1800)
      // connection arcs between markets
      .arcsData(buildArcs())
      .arcColor(function () { return ARC; })
      .arcStroke(0.42).arcDashLength(0.45).arcDashGap(1.7)
      .arcDashInitialGap(function () { return Math.random() * 5; })
      .arcDashAnimateTime(4200).arcAltitudeAutoScale(0.5);

    // Dark translucent sphere so dots float on a real, occluding planet.
    const mat = g.globeMaterial();
    mat.color.set('#0c0b1c');
    if (mat.emissive) mat.emissive.set('#070611');
    mat.shininess = 4;
    mat.transparent = true;
    mat.opacity = 0.92;

    // Load the dotted continents (country geometry → dot field).
    fetch('assets/countries.geojson')
      .then(function (r) { return r.json(); })
      .then(function (geo) {
        g.hexPolygonsData(geo.features)
          .hexPolygonResolution(isMobile ? 3 : 3)
          .hexPolygonMargin(0.42)
          .hexPolygonUseDots(true)
          .hexPolygonAltitude(0.006)
          .hexPolygonColor(function (f) { return isMarket(f) ? FIELD_HI : FIELD; });
        ready = true;
      })
      .catch(function () { ready = true; });

    const ctrl = g.controls();
    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = speed;
    ctrl.enableZoom = false;
    ctrl.enableRotate = !isMobile;        // no manual spin on phones (smoother)
    ctrl.enablePan = false;
    el.style.cursor = isMobile ? 'default' : 'grab';

    // Frame the markets toward the viewer (Europe / Middle East face).
    g.pointOfView({ lat: 26, lng: 26, altitude: opts.altitude || 2.3 }, 0);

    function size() { g.width(el.clientWidth).height(el.clientHeight); }
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(el);
    else window.addEventListener('resize', size);

    return api;
  }

  function select(id) {
    if (!g) return;
    selId = id;
    g.pointsData(pts());
    const c = window.KHD.countries[id];
    g.controls().autoRotate = false;
    g.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.7 }, 1000);
    if (cb) cb(id);
  }

  function reset() {
    selId = null;
    if (!g) return;
    g.pointsData(pts());
    g.controls().autoRotate = autoOn;
    g.pointOfView({ lat: 26, lng: 26, altitude: 2.3 }, 1000);
  }

  function setSpeed(s) { speed = s; if (g) g.controls().autoRotateSpeed = s; }
  function setAutoRotate(on) { autoOn = on; if (g && selId == null) g.controls().autoRotate = on; }

  const api = { init: init, select: select, reset: reset,
    setSpeed: setSpeed, setAutoRotate: setAutoRotate,
    get selected() { return selId; }, get ready() { return ready; } };
  return api;
})();
