/* ============================================================
   DIEGO URFEIG · Speaker de datos e IA
   main.js
============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');

  /* ----------------------------------------------------------
     HEADER: fondo al bajar y barra de progreso de lectura
  ---------------------------------------------------------- */
  var progressBar = document.getElementById('progressBar');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    }
    updateScrolly();
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ----------------------------------------------------------
     MENÚ MÓVIL
  ---------------------------------------------------------- */
  var menuBtn = document.getElementById('mobileMenuBtn');
  var navMenu = document.getElementById('navMenu');

  function setMenu(open) {
    navMenu.classList.toggle('open', open);
    menuBtn.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', function () {
      setMenu(!navMenu.classList.contains('open'));
    });
    navMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setMenu(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) { setMenu(false); }
    });
  }

  /* ----------------------------------------------------------
     VIDEO DEL HERO: se pausa fuera de pantalla
  ---------------------------------------------------------- */
  var heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var p = heroVideo.play();
            if (p && p.catch) { p.catch(function () {}); }
          } else {
            heroVideo.pause();
          }
        });
      }, { threshold: 0.05 }).observe(heroVideo);
    }
  }

  /* ----------------------------------------------------------
     LOGOS: duplica la tira para que el carrusel no tenga corte
  ---------------------------------------------------------- */
  var logoTrack = document.getElementById('logoTrack');
  if (logoTrack && !reduceMotion) {
    Array.prototype.slice.call(logoTrack.children).forEach(function (img) {
      var clone = img.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.alt = '';
      logoTrack.appendChild(clone);
    });
  }

  /* ----------------------------------------------------------
     CONTADORES
  ---------------------------------------------------------- */
  function countTo(el, from, to, duration) {
    if (reduceMotion || from === to) { el.textContent = to; return; }
    var start = performance.now();
    function step(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (t < 1) { requestAnimationFrame(step); }
    }
    requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------
     APARICIÓN AL HACER SCROLL
  ---------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');

  // escalona los elementos que comparten fila (tarjetas, estadísticas)
  ['.evidence-grid', '.formats', '.eps'].forEach(function (sel) {
    var group = document.querySelector(sel);
    if (!group) { return; }
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--rd', (i * 110) + 'ms');
    });
  });

  function showEl(el) {
    el.classList.add('visible');
    el.querySelectorAll('[data-count]').forEach(function (n) {
      if (n.dataset.done) { return; }
      n.dataset.done = '1';
      countTo(n, 0, parseInt(n.dataset.count, 10), 1600);
    });
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          showEl(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ----------------------------------------------------------
     EL DATO: cuadrícula de 100 empresas que cambia al bajar
  ---------------------------------------------------------- */
  var waffle = document.getElementById('waffle');
  var waffleFig = waffle ? waffle.closest('.waffle-fig') : null;
  var waffleNum = document.getElementById('waffleNum');
  var waffleLabel = document.getElementById('waffleLabel');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.scrolly .step'));
  var currentStep = -1;
  var USES = 88, IMPACT = 39, HIGH = 6;

  if (waffle) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 100; i++) {
      var dot = document.createElement('i');
      var cls = [];
      if (i < USES) { cls.push('u'); }
      if (i < IMPACT) { cls.push('m'); }
      if (i < HIGH) { cls.push('h'); }
      dot.className = cls.join(' ');
      dot.style.setProperty('--i', i);
      frag.appendChild(dot);
    }
    waffle.appendChild(frag);
  }

  function setStep(n) {
    if (n === currentStep || !waffle) { return; }
    var prevNum = parseInt(waffleNum.textContent, 10) || 0;
    currentStep = n;
    [waffle, waffleFig].forEach(function (el) {
      el.classList.toggle('s1', n >= 1);
      el.classList.toggle('s2', n >= 2);
      el.classList.toggle('s3', n >= 3);
    });
    steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === n); });
    var step = steps[n];
    if (step) {
      countTo(waffleNum, prevNum, parseInt(step.dataset.num, 10), 700);
      waffleLabel.textContent = step.dataset.label;
    }
  }

  function updateScrolly() {
    if (!steps.length) { return; }
    var mobile = window.innerWidth <= 900;
    var trigger = window.innerHeight * (mobile ? 0.82 : 0.6);
    var active = 0;
    steps.forEach(function (s, idx) {
      var r = s.getBoundingClientRect();
      var anchor = mobile ? r.bottom - r.height * 0.25 : r.top + r.height * 0.35;
      if (anchor < trigger) { active = idx; }
    });
    setStep(active);
  }

  /* ----------------------------------------------------------
     CHARLAS: acordeón (una abierta por vez)
  ---------------------------------------------------------- */
  var talks = Array.prototype.slice.call(document.querySelectorAll('.talk'));

  talks.forEach(function (talk) {
    var btn = talk.querySelector('.talk-head');
    btn.addEventListener('click', function () {
      var willOpen = !talk.classList.contains('is-open');
      talks.forEach(function (t) {
        t.classList.remove('is-open');
        t.querySelector('.talk-head').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        talk.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // "Reservar esta charla" deja el tema elegido en el formulario
  document.querySelectorAll('[data-talk]').forEach(function (link) {
    link.addEventListener('click', function () {
      var tipo = document.getElementById('tipo');
      var mensaje = document.getElementById('mensaje');
      if (tipo) { tipo.value = 'charla'; }
      if (mensaje && !mensaje.value.trim()) {
        mensaje.value = 'Me interesa la charla «' + link.dataset.talk + '». ';
      }
    });
  });

  /* ----------------------------------------------------------
     EPISODIOS: reproduce uno por vez, con sonido
  ---------------------------------------------------------- */
  var eps = Array.prototype.slice.call(document.querySelectorAll('.ep'));

  eps.forEach(function (ep) {
    var video = ep.querySelector('video');
    var playBtn = ep.querySelector('.ep-play');
    if (!video || !playBtn) { return; }

    playBtn.addEventListener('click', function () {
      eps.forEach(function (other) {
        var v = other.querySelector('video');
        if (v && v !== video) { v.pause(); }
      });
      video.controls = true;
      var p = video.play();
      if (p && p.catch) { p.catch(function () {}); }
    });
    video.addEventListener('play', function () { ep.classList.add('is-playing'); });
    video.addEventListener('ended', function () {
      ep.classList.remove('is-playing');
      video.controls = false;
      video.load(); // vuelve a mostrar la portada
    });
  });

  if ('IntersectionObserver' in window) {
    var epObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target.querySelector('video');
        if (!entry.isIntersecting && v && !v.paused) { v.pause(); }
      });
    }, { threshold: 0.1 });
    eps.forEach(function (ep) { epObserver.observe(ep); });
  }

  /* ----------------------------------------------------------
     FORMULARIO DE CONTACTO (Formsubmit AJAX)
  ---------------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');
  var formError = document.getElementById('formError');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var f = {
        nombre: form.querySelector('#nombre'),
        empresa: form.querySelector('#empresa'),
        email: form.querySelector('#email'),
        tipo: form.querySelector('#tipo'),
        mensaje: form.querySelector('#mensaje')
      };
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim());
      var invalid = [];
      if (!f.nombre.value.trim()) { invalid.push(f.nombre); }
      if (!emailOk) { invalid.push(f.email); }
      if (!f.tipo.value) { invalid.push(f.tipo); }

      [f.nombre, f.email, f.tipo].forEach(function (el) {
        var bad = invalid.indexOf(el) !== -1;
        el.classList.toggle('is-invalid', bad);
        if (bad) { el.setAttribute('aria-invalid', 'true'); } else { el.removeAttribute('aria-invalid'); }
      });
      if (invalid.length) { invalid[0].focus(); return; }

      var btn = form.querySelector('button[type="submit"]');
      var btnText = form.querySelector('.btn-text');
      var btnLoading = form.querySelector('.btn-loading');

      function setLoading(on) {
        btn.disabled = on;
        btnText.hidden = on;
        btnLoading.hidden = !on;
      }
      function done(ok) {
        setLoading(false);
        formSuccess.hidden = !ok;
        formError.hidden = ok;
        if (ok) { form.reset(); }
      }

      setLoading(true);
      formSuccess.hidden = true;
      formError.hidden = true;

      var tipoLabel = f.tipo.options[f.tipo.selectedIndex].text;

      fetch('https://formsubmit.co/ajax/elmaildediego@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          nombre: f.nombre.value.trim(),
          empresa: f.empresa.value.trim() || '—',
          email: f.email.value.trim(),
          tipo: tipoLabel,
          mensaje: f.mensaje.value.trim() || '—',
          _subject: 'Consulta desde diegourfeig.com — ' + tipoLabel
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) { done(data.success === 'true' || data.success === true); })
        .catch(function () { done(false); });
    });

    form.addEventListener('input', function (e) {
      if (e.target.classList.contains('is-invalid')) {
        e.target.classList.remove('is-invalid');
        e.target.removeAttribute('aria-invalid');
      }
    });
  }

  /* ----------------------------------------------------------
     NAV: marca la sección visible
  ---------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { navObserver.observe(s); });
  }

  /* ----------------------------------------------------------
     FOOTER: año actual
  ---------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  onScroll();
})();
