/* ============================================================
   DIEGO URFEIG — AI Speaker Website
   main.js
============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     HEADER: Scroll behavior
  ---------------------------------------------------------- */
  const header = document.getElementById('header');

  function handleHeaderScroll() {
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();


  /* ----------------------------------------------------------
     MOBILE MENU
  ---------------------------------------------------------- */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu       = document.getElementById('navMenu');
  const navLinks      = navMenu ? navMenu.querySelectorAll('.nav-link') : [];

  function openMenu() {
    navMenu.classList.add('open');
    mobileMenuBtn.classList.add('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    mobileMenuBtn.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = navMenu.classList.contains('open');
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on backdrop click
  document.addEventListener('click', function (e) {
    if (navMenu && navMenu.classList.contains('open')) {
      if (!navMenu.contains(e.target) && e.target !== mobileMenuBtn) {
        closeMenu();
      }
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); }
  });


  /* ----------------------------------------------------------
     SMOOTH SCROLL (for browsers that don't support it natively)
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 0;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    });
  });


  /* ----------------------------------------------------------
     SCROLL REVEAL (Intersection Observer)
  ---------------------------------------------------------- */
  const revealObserverOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve so stagger children stay visible
      }
    });
  }, revealObserverOptions);

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
    revealObserver.observe(el);
  });


  /* ----------------------------------------------------------
     COUNTER ANIMATION
     Usage: <element data-target="95" data-suffix="%" data-prefix="$" data-decimals="2">
  ---------------------------------------------------------- */
  function animateCounter(el) {
    const target   = parseFloat(el.getAttribute('data-target')) || 0;
    const suffix   = el.getAttribute('data-suffix') || '';
    const prefix   = el.getAttribute('data-prefix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals')) || 0;
    const duration = 2000; // ms
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      const current  = eased * target;

      el.textContent = prefix + current.toFixed(decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(function (el) {
    counterObserver.observe(el);
  });


  /* ----------------------------------------------------------
     GAP CHART BARS ANIMATION
  ---------------------------------------------------------- */
  const gapBarObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const bars = entry.target.querySelectorAll('.gap-bar[data-width]');
        bars.forEach(function (bar, i) {
          setTimeout(function () {
            bar.style.setProperty('--bar-width', bar.getAttribute('data-width') + '%');
          }, i * 200);
        });
        gapBarObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const gapChart = document.querySelector('.gap-chart');
  if (gapChart) {
    gapBarObserver.observe(gapChart);
  }


  /* ----------------------------------------------------------
     CONTACT FORM
  ---------------------------------------------------------- */
  const contactForm  = document.getElementById('contactForm');
  const formSuccess  = document.getElementById('formSuccess');
  const formError    = document.getElementById('formError');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nombre  = contactForm.querySelector('#nombre').value.trim();
      const email   = contactForm.querySelector('#email').value.trim();
      const tipo    = contactForm.querySelector('#tipo').value;

      // Simple validation
      if (!nombre || !email || !tipo) {
        // Highlight missing fields
        [['#nombre', nombre], ['#email', email], ['#tipo', tipo]].forEach(function ([id, val]) {
          const field = contactForm.querySelector(id);
          if (!val) {
            field.style.borderColor = 'rgba(255, 45, 139, 0.6)';
            field.addEventListener('input', function () {
              field.style.borderColor = '';
            }, { once: true });
          }
        });
        return;
      }

      // Build mailto link
      const subject = encodeURIComponent('Consulta desde diegourfeig.com — ' + tipo);
      const empresa = contactForm.querySelector('#empresa').value.trim();
      const mensaje = contactForm.querySelector('#mensaje').value.trim();

      const bodyLines = [
        'Hola Diego,',
        '',
        'Me comunico desde diegourfeig.com con la siguiente consulta:',
        '',
        'Nombre: ' + nombre,
        empresa ? 'Empresa: ' + empresa : '',
        'Email: ' + email,
        'Tipo de solicitud: ' + tipo,
        mensaje ? '\nMensaje:\n' + mensaje : '',
        '',
        'Saludos,'
      ].filter(function (l) { return l !== null; });

      const body = encodeURIComponent(bodyLines.join('\n'));
      const mailto = 'mailto:hola@diegourfeig.com?subject=' + subject + '&body=' + body;

      // Show button loading state
      const btnText    = contactForm.querySelector('.btn-text');
      const btnLoading = contactForm.querySelector('.btn-loading');
      const btnArrow   = contactForm.querySelector('.btn-arrow');

      if (btnText)    btnText.hidden    = true;
      if (btnLoading) btnLoading.hidden = false;
      if (btnArrow)   btnArrow.hidden   = true;

      // Open mailto and show success after brief delay
      setTimeout(function () {
        window.location.href = mailto;

        if (btnText)    btnText.hidden    = false;
        if (btnLoading) btnLoading.hidden = true;
        if (btnArrow)   btnArrow.hidden   = false;

        if (formSuccess) {
          formSuccess.hidden = false;
          formError.hidden   = true;
        }

        // contactForm.reset();
      }, 600);
    });
  }


  /* ----------------------------------------------------------
     ACTIVE NAV LINK (highlight current section)
  ---------------------------------------------------------- */
  const sections  = document.querySelectorAll('section[id]');
  const allLinks  = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    const scrollPos = window.scrollY + (header ? header.offsetHeight : 70) + 10;

    sections.forEach(function (section) {
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < bottom) {
        allLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();


  /* ----------------------------------------------------------
     HOVER PARALLAX on Hero (subtle mouse tracking)
  ---------------------------------------------------------- */
  const heroSection = document.querySelector('.hero');
  const orbs = heroSection ? heroSection.querySelectorAll('.orb') : [];

  if (heroSection && orbs.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroSection.addEventListener('mousemove', function (e) {
      const rect   = heroSection.getBoundingClientRect();
      const cx     = rect.width  / 2;
      const cy     = rect.height / 2;
      const dx     = (e.clientX - rect.left - cx) / cx;
      const dy     = (e.clientY - rect.top  - cy) / cy;

      orbs.forEach(function (orb, i) {
        const factor = (i + 1) * 8;
        orb.style.transform = 'translate(' + (dx * factor) + 'px, ' + (dy * factor) + 'px)';
      });
    });

    heroSection.addEventListener('mouseleave', function () {
      orbs.forEach(function (orb) {
        orb.style.transform = '';
      });
    });
  }

})();
