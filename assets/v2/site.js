// Khatib Designs v2 mockup behaviours.
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // Mobile menu
  var bar = document.querySelector(".bar");
  var btn = document.querySelector(".menu-btn");
  if (bar && btn) btn.addEventListener("click", function () {
    var open = bar.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });

  // Language picker: close on outside click or Escape
  document.querySelectorAll("details.lang").forEach(function (d) {
    document.addEventListener("click", function (e) { if (!d.contains(e.target)) d.removeAttribute("open"); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") { d.removeAttribute("open"); d.querySelector("summary").focus(); } });
  });

  // The ribbon leans toward the cursor: its crest bends up to 12px, eased.
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (!reduce && fine) {
    document.querySelectorAll("svg.ribbon").forEach(function (svg) {
      var paths = svg.querySelectorAll("path[data-d]");
      if (!paths.length) return;
      var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, raf = null;
      function render() {
        cur.x += (target.x - cur.x) * 0.12;
        cur.y += (target.y - cur.y) * 0.12;
        paths.forEach(function (p) {
          p.setAttribute("d", p.dataset.d.replace(/\{(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\}/g, function (_, a, b) {
            return (+a + cur.x).toFixed(1) + " " + (+b + cur.y).toFixed(1);
          }));
        });
        if (Math.abs(target.x - cur.x) > 0.05 || Math.abs(target.y - cur.y) > 0.05) raf = requestAnimationFrame(render); else raf = null;
      }
      window.addEventListener("pointermove", function (e) {
        var r = svg.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        target.x = Math.max(-1, Math.min(1, dx)) * 12;
        target.y = Math.max(-1, Math.min(1, dy)) * 12;
        if (!raf) raf = requestAnimationFrame(render);
      }, { passive: true });
      render();
    });
  } else {
    document.querySelectorAll("svg.ribbon path[data-d]").forEach(function (p) {
      p.setAttribute("d", p.dataset.d.replace(/\{(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\}/g, "$1 $2"));
    });
  }

  // Enquiry forms: validate, then send to the studio inbox (FormSubmit).
  document.querySelectorAll("form.form").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var first = null;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var ok = input.checkValidity();
        if (field) field.toggleAttribute("data-invalid", !ok);
        if (!ok && !first) first = input;
      });
      if (first) { first.focus(); return; }
      var honey = form.querySelector("[name=_honey]");
      if (honey && honey.value) return;
      var submit = form.querySelector("[type=submit]");
      var label = submit.textContent;
      submit.setAttribute("aria-disabled", "true");
      submit.textContent = submit.dataset.sending || "Sending…";
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== "_honey") data[k] = v; });
      data._subject = (form.dataset.subject || "Website enquiry") + (data.name ? " · " + data.name : "");
      data.page = location.pathname;
      data._template = "table";
      fetch("https://formsubmit.co/ajax/studio@khatibdesigns.com", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data)
      }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function () {
        form.classList.add("is-sent");
        submit.textContent = submit.dataset.sent || "Sent";
        if (window.gtag) window.gtag("event", "generate_lead", { form: form.dataset.subject || "enquiry", page_path: location.pathname });
      }).catch(function () {
        submit.removeAttribute("aria-disabled");
        submit.textContent = label;
        var err = form.querySelector(".form-error");
        if (err) err.hidden = false;
      });
    });
    form.addEventListener("input", function (ev) {
      var field = ev.target.closest(".field");
      if (field && ev.target.checkValidity()) field.removeAttribute("data-invalid");
    });
  });

  // Calendly: load the scheduler only when the visitor gets near it
  var cal = document.querySelector(".cal[data-url]");
  if (cal) {
    var load = function () {
      if (cal.dataset.loaded) return; cal.dataset.loaded = "1";
      cal.innerHTML = '<iframe title="Book a 30-minute call" loading="lazy" src="' + cal.dataset.url + '&embed_domain=' + location.hostname + '&embed_type=Inline"></iframe>';
    };
    var btn = cal.querySelector("button");
    if (btn) btn.addEventListener("click", load);
    document.querySelectorAll('a[href="#calendar"]').forEach(function (a) { a.addEventListener("click", load); });
    if (location.hash === "#calendar") load();
    window.addEventListener("message", function (e) {
      if (/calendly\.com$/.test((e.origin || "").replace(/^https?:\/\//, "")) && e.data && e.data.event === "calendly.event_scheduled" && window.gtag) window.gtag("event", "book_call", { method: "calendly" });
    });
  }

  // Blog filters
  var filters = document.querySelector(".filters");
  if (filters) filters.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    filters.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    var cat = b.dataset.cat;
    document.querySelectorAll(".post-list li").forEach(function (li) { li.hidden = !!cat && li.dataset.cat !== cat; });
  });
})();
