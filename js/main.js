/* ============================================================
   DIEGO URFEIG · Speaker de IA, agentes y datos
   main.js (la escena 3D vive en scene.js)
============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');
  var slice = function (list) { return Array.prototype.slice.call(list); };

  /* ----------------------------------------------------------
     HEADER: fondo al bajar y barra de progreso
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
    menuBtn.addEventListener('click', function () { setMenu(!navMenu.classList.contains('open')); });
    navMenu.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) { setMenu(false); }
    });
  }

  /* ----------------------------------------------------------
     TITULAR: la frase del medio rota
  ---------------------------------------------------------- */
  var rot = document.getElementById('heroRot');
  if (rot && !reduceMotion) {
    var items = slice(rot.children);
    var current = 0;
    setInterval(function () {
      if (document.hidden) { return; }
      var prev = items[current];
      current = (current + 1) % items.length;
      prev.classList.remove('is-on');
      prev.classList.add('is-out');
      items[current].classList.remove('is-out');
      items[current].classList.add('is-on');
      setTimeout(function () { prev.classList.remove('is-out'); }, 750);
    }, 2600);
  }

  /* ----------------------------------------------------------
     VIDEO DEL HERO: se pausa fuera de pantalla
  ---------------------------------------------------------- */
  var stageVideo = document.getElementById('stageVideo');
  if (stageVideo) {
    if (reduceMotion) {
      stageVideo.removeAttribute('autoplay');
      stageVideo.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          var p = stageVideo.play();
          if (p && p.catch) { p.catch(function () {}); }
        } else {
          stageVideo.pause();
        }
      }, { threshold: 0.05 }).observe(stageVideo);
    }
  }

  /* ----------------------------------------------------------
     INCLINACIÓN 3D con el puntero
  ---------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    slice(document.querySelectorAll('.tilt')).forEach(function (el) {
      var max = parseFloat(el.dataset.tilt) || 6;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * max * 2).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ----------------------------------------------------------
     LOGOS: duplica la tira para que el carrusel no tenga corte
  ---------------------------------------------------------- */
  var logoTrack = document.getElementById('logoTrack');
  if (logoTrack && !reduceMotion) {
    slice(logoTrack.children).forEach(function (img) {
      var clone = img.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.alt = '';
      logoTrack.appendChild(clone);
    });
  }

  /* ----------------------------------------------------------
     CONTADORES y APARICIÓN AL HACER SCROLL
  ---------------------------------------------------------- */
  function countTo(el, from, to, duration) {
    if (reduceMotion || from === to) { el.textContent = to; return; }
    var t0 = performance.now();
    (function step(now) {
      var t = Math.min((now - t0) / duration, 1);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) { requestAnimationFrame(step); }
    })(t0);
  }

  ['.formats', '.eps', '.about-stats'].forEach(function (sel) {
    var group = document.querySelector(sel);
    if (!group) { return; }
    slice(group.children).forEach(function (child, i) { child.style.setProperty('--rd', (i * 110) + 'ms'); });
  });

  function showEl(el) {
    el.classList.add('visible');
    slice(el.querySelectorAll('[data-count]')).forEach(function (n) {
      if (n.dataset.done) { return; }
      n.dataset.done = '1';
      countTo(n, 0, parseInt(n.dataset.count, 10), 1600);
    });
  }
  var revealEls = slice(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { showEl(entry.target); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(showEl);
  }

  /* ----------------------------------------------------------
     EL DATO: 100 empresas, tres lecturas que se alternan
  ---------------------------------------------------------- */
  var waffle = document.getElementById('waffle');
  var datoBtns = slice(document.querySelectorAll('#datoSteps button'));
  if (waffle) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 100; i++) {
      var dot = document.createElement('i');
      dot.className = (i < 88 ? 'u ' : '') + (i < 39 ? 'm ' : '') + (i < 6 ? 'h' : '');
      dot.style.setProperty('--i', i);
      frag.appendChild(dot);
    }
    waffle.appendChild(frag);

    var datoStep = 0;
    var datoAuto = true;
    var setDato = function (n) {
      datoStep = n;
      waffle.classList.toggle('s1', n >= 1);
      waffle.classList.toggle('s2', n >= 2);
      waffle.classList.toggle('s3', n >= 3);
      datoBtns.forEach(function (b) { b.classList.toggle('is-on', parseInt(b.dataset.step, 10) === n); });
    };
    datoBtns.forEach(function (b) {
      b.addEventListener('click', function () { datoAuto = false; setDato(parseInt(b.dataset.step, 10)); });
    });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setDato(3);
    } else {
      var datoVisible = false;
      new IntersectionObserver(function (entries) { datoVisible = entries[0].isIntersecting; }, { threshold: 0.3 })
        .observe(waffle);
      setInterval(function () {
        if (datoAuto && datoVisible && !document.hidden) { setDato(datoStep % 3 + 1); }
      }, 2200);
    }
  }

  /* ----------------------------------------------------------
     ROLES: el flujo vivo
     Cada punto es un caso. En "Hoy" todos los pasos los hace la
     persona, de a uno. "Con un agente" muda pasos al carril de
     abajo y la persona se queda con las decisiones.
  ---------------------------------------------------------- */
  var ROLES = [
    {
      tab: 'Atención al cliente', exc: 0.28,
      change: 'Dejás de contestar devoluciones una por una. Pasás a definir la política y a resolver los casos que se salen de ella.',
      steps: [
        { hoy: 'Leer el pedido de devolución', ag: 'Lee el pedido de devolución', who: 'a' },
        { hoy: 'Buscar la compra', ag: 'Busca la compra', who: 'a' },
        { hoy: 'Revisar la política', ag: 'Aplica la política', who: 'a' },
        { hoy: 'Resolver los casos dudosos', ag: 'Decidís los casos dudosos', who: 'h', only: true },
        { hoy: 'Responder al cliente', ag: 'Responde al cliente', who: 'a' },
        { hoy: 'Emitir etiqueta y reembolso', ag: 'Emite etiqueta y reembolso', who: 'a' },
        { hoy: 'Anotar el motivo', ag: 'Registra el motivo', who: 'a' }
      ]
    },
    {
      tab: 'Marketing y pauta', exc: 0.3,
      change: 'Dejás de armar reportes. Pasás a decidir con ellos y a conversar la estrategia con el cliente.',
      steps: [
        { hoy: 'Bajar datos de cada plataforma', ag: 'Junta los datos', who: 'a' },
        { hoy: 'Armar el reporte', ag: 'Arma el reporte', who: 'a' },
        { hoy: 'Buscar qué campaña anda mal', ag: 'Detecta qué campaña anda mal', who: 'a' },
        { hoy: 'Pensar qué cambiar', ag: 'Propone el cambio con el dato', who: 'a' },
        { hoy: 'Decidir el cambio', ag: 'Decidís qué cambio se hace', who: 'h' },
        { hoy: 'Tocar la plataforma', ag: 'Aplica el cambio', who: 'a' },
        { hoy: 'Contarle al cliente', ag: 'Conversás la estrategia', who: 'h', only: true }
      ]
    },
    {
      tab: 'Análisis de datos', exc: 0.3,
      change: 'Dejás de escribir consultas. Pasás a elegir las preguntas y a leer las respuestas con criterio.',
      steps: [
        { hoy: 'Recibir la pregunta', ag: 'Elegís qué pregunta vale la pena', who: 'h' },
        { hoy: 'Escribir la consulta', ag: 'Escribe la consulta', who: 'a' },
        { hoy: 'Limpiar y cruzar los datos', ag: 'Limpia y cruza los datos', who: 'a' },
        { hoy: 'Armar el gráfico', ag: 'Arma el gráfico', who: 'a' },
        { hoy: 'Chequear que el número cierre', ag: 'Un juez revisa los números', who: 'a' },
        { hoy: 'Interpretar y recomendar', ag: 'Interpretás y recomendás', who: 'h' }
      ]
    },
    {
      tab: 'Ventas', exc: 0.35,
      change: 'Dejás de cargar el CRM y perseguir respuestas. Tu tiempo va a las reuniones y a cerrar.',
      steps: [
        { hoy: 'Investigar al prospecto', ag: 'Investiga al prospecto', who: 'a' },
        { hoy: 'Escribir el primer mail', ag: 'Escribe el primer mail', who: 'a' },
        { hoy: 'Hacer el seguimiento', ag: 'Hace el seguimiento', who: 'a' },
        { hoy: 'Cargar el CRM', ag: 'Carga el CRM', who: 'a' },
        { hoy: 'Tener la reunión', ag: 'Tenés la reunión', who: 'h', only: true },
        { hoy: 'Armar la propuesta', ag: 'Arma el borrador de la propuesta', who: 'a' },
        { hoy: 'Negociar y cerrar', ag: 'Negociás y cerrás', who: 'h', only: true }
      ]
    },
    {
      tab: 'Selección de personas', exc: 0.3,
      change: 'Dejás de leer cada CV y de coordinar agendas. Pasás a entrevistar mejor y a decidir.',
      steps: [
        { hoy: 'Publicar la búsqueda', ag: 'Publica la búsqueda', who: 'a' },
        { hoy: 'Leer todos los CV', ag: 'Ordena los CV contra el perfil', who: 'a' },
        { hoy: 'Coordinar las entrevistas', ag: 'Coordina las entrevistas', who: 'a' },
        { hoy: 'Entrevistar', ag: 'Entrevistás', who: 'h', only: true },
        { hoy: 'Elegir a quién contratar', ag: 'Elegís a quién contratar', who: 'h', only: true },
        { hoy: 'Armar el onboarding', ag: 'Arma el onboarding', who: 'a' }
      ]
    },
    {
      tab: 'Administración', exc: 0.25,
      change: 'Dejás de cargar y conciliar. Pasás a resolver las diferencias y a aprobar los pagos.',
      steps: [
        { hoy: 'Recibir las facturas', ag: 'Recibe las facturas', who: 'a' },
        { hoy: 'Cargar los datos', ag: 'Carga los datos', who: 'a' },
        { hoy: 'Conciliar con el banco', ag: 'Concilia con el banco', who: 'a' },
        { hoy: 'Buscar diferencias', ag: 'Detecta las diferencias', who: 'a' },
        { hoy: 'Resolver las diferencias', ag: 'Decidís qué hacer con las diferencias', who: 'h', only: true },
        { hoy: 'Aprobar los pagos', ag: 'Aprobás los pagos', who: 'h' },
        { hoy: 'Armar el cierre', ag: 'Arma el cierre', who: 'a' }
      ]
    }
  ];

  var flowEl = document.getElementById('flow');
  if (flowEl) { initFlow(); }

  function initFlow() {
    var canvas = document.getElementById('flowCanvas');
    var ctx = canvas.getContext('2d');
    var nodesEl = document.getElementById('flowNodes');
    var tabsEl = document.getElementById('roleTabs');
    var modeEl = document.querySelector('.mode');
    var modeBtns = slice(document.querySelectorAll('.mode-btn'));
    var statDone = document.getElementById('statDone');
    var statWait = document.getElementById('statWait');
    var countEl = document.getElementById('flowCount');
    var changeEl = document.getElementById('flowChange');

    var COLORS = { h: '#FFB238', a: '#22E1FF', x: '#FF3EA5' };
    var role = ROLES[0];
    var mode = 'hoy';
    var nodes = [];
    var tokens = [];
    var W = 0, H = 0, vertical = false, dpr = 1;
    var done = 0, backlog = 0, spawnClock = 0;
    var running = false, visible = false, last = 0, touched = false, autoTimer = null;
    var time = 0;

    /* --- pestañas de rol --- */
    ROLES.forEach(function (r, idx) {
      var b = document.createElement('button');
      b.className = 'role-tab';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(idx === 0));
      b.textContent = r.tab;
      b.addEventListener('click', function () { touched = true; setRole(idx); });
      tabsEl.appendChild(b);
    });

    modeBtns.forEach(function (b) {
      b.addEventListener('click', function () { touched = true; setMode(b.dataset.mode); });
    });

    function lane(i) { return mode === 'hoy' ? 'h' : role.steps[i].who; }
    function visits(tok, i) { return mode === 'hoy' || !role.steps[i].only || tok.exc; }

    /* --- geometría: horizontal en escritorio, vertical en móvil --- */
    function lanePos(who) {
      return vertical ? (who === 'h' ? W * 0.27 : W * 0.73) : (who === 'h' ? H * 0.29 : H * 0.74);
    }
    function along(i) {
      var n = role.steps.length;
      if (vertical) { return 74 + i * 92; }
      var left = 150, right = 86;
      return left + i * (W - left - right) / (n - 1);
    }
    function point(i, who) {
      return vertical ? { x: lanePos(who), y: along(i) } : { x: along(i), y: lanePos(who) };
    }
    function edgePoint(isExit) {
      var first = nodes[0], lastN = nodes[nodes.length - 1];
      if (vertical) { return isExit ? { x: lastN.x, y: H + 16 } : { x: first.x, y: 34 }; }
      return isExit ? { x: W + 16, y: lastN.y } : { x: 92, y: first.y };
    }

    function measure() {
      vertical = window.innerWidth <= 900;
      if (vertical) { flowEl.style.height = (74 + (role.steps.length - 1) * 92 + 76) + 'px'; }
      else { flowEl.style.height = ''; }
      W = flowEl.clientWidth;
      H = flowEl.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes.forEach(function (n, i) {
        var p = point(i, n.who);
        n.tx = p.x; n.ty = p.y;
        n.w = n.el.offsetWidth; n.h = n.el.offsetHeight;
      });
    }

    function place(n) {
      n.el.style.transform = 'translate(' + (n.x - n.w / 2).toFixed(1) + 'px,' + (n.y - n.h / 2).toFixed(1) + 'px)';
    }

    function buildNodes() {
      nodesEl.innerHTML = '';
      nodes = role.steps.map(function (s, i) {
        var li = document.createElement('li');
        li.className = 'fnode';
        li.innerHTML = '<span class="fnode-who"></span><span class="fnode-label"></span>';
        nodesEl.appendChild(li);
        return { el: li, who: lane(i), x: 0, y: 0, tx: 0, ty: 0, w: 138, h: 60, queue: [], busy: null };
      });
      labelNodes();
      measure();
      nodes.forEach(function (n) { n.x = n.tx; n.y = n.ty; place(n); });
    }

    function labelNodes() {
      nodes.forEach(function (n, i) {
        var s = role.steps[i];
        n.who = lane(i);
        n.el.dataset.who = n.who;
        n.el.querySelector('.fnode-who').textContent = n.who === 'h' ? (mode === 'hoy' ? 'Persona' : 'Vos') : 'Agente';
        n.el.querySelector('.fnode-label').textContent = mode === 'hoy' ? s.hoy : s.ag;
      });
    }

    function summary() {
      var total = role.steps.length;
      var mine = role.steps.filter(function (s) { return s.who === 'h'; }).length;
      if (mode === 'hoy') {
        countEl.innerHTML = '<span class="c-h">' + total + ' pasos</span>, todos a mano.';
        changeEl.textContent = 'Cada caso espera su turno. Pasá a «Con un agente» para ver qué se muda.';
      } else {
        countEl.innerHTML = '<span class="c-a">' + (total - mine) + ' pasos</span> pasan al agente. <span class="c-h">' +
          mine + (mine === 1 ? ' decisión' : ' decisiones') + '</span> ' + (mine === 1 ? 'queda' : 'quedan') + ' con vos.';
        changeEl.textContent = role.change;
      }
    }

    function resetSim() {
      tokens = [];
      nodes.forEach(function (n) { n.queue = []; n.busy = null; });
      done = 0; backlog = 0; spawnClock = 0;
      statDone.textContent = '0';
      statWait.textContent = '0';
    }

    function setRole(idx) {
      role = ROLES[idx];
      slice(tabsEl.children).forEach(function (b, i) { b.setAttribute('aria-selected', String(i === idx)); });
      buildNodes();
      resetSim();
      summary();
      if (reduceMotion) { draw(); }
    }

    function setMode(m) {
      if (m === mode) { return; }
      mode = m;
      modeEl.dataset.mode = m;
      modeBtns.forEach(function (b) {
        var on = b.dataset.mode === m;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      labelNodes();
      measure();
      // lo que estaba en cola en un paso que ahora hace el agente, sale
      nodes.forEach(function (n) {
        if (n.who === 'a') {
          n.queue.forEach(function (t) { t.state = 'serve'; t.timer = 0.12; });
          n.queue = [];
          n.busy = null;
        }
      });
      summary();
      if (reduceMotion) { nodes.forEach(function (n) { n.x = n.tx; n.y = n.ty; place(n); }); draw(); }
    }

    /* --- casos --- */
    function waypoint(tok, i) {
      if (i >= nodes.length) { return edgePoint(true); }
      if (visits(tok, i)) { return { x: nodes[i].x, y: nodes[i].y }; }
      return point(i, 'a'); // el caso sigue de largo por el carril del agente
    }

    function spawn() {
      var first = edgePoint(false);
      tokens.push({
        seg: 0, t: 0, state: 'move', timer: 0, exc: Math.random() < role.exc,
        fx: first.x, fy: first.y, x: first.x, y: first.y, dur: 0.6, trail: []
      });
    }

    function depart(tok) {
      tok.fx = tok.x; tok.fy = tok.y;
      tok.seg += 1;
      tok.t = 0;
      tok.state = 'move';
      var next = tok.seg < nodes.length ? lane(tok.seg) : 'a';
      tok.dur = (next === 'h' && tok.seg < nodes.length && visits(tok, tok.seg)) ? 0.7 : 0.44;
    }

    function pulse(n) {
      n.el.classList.add('is-pulse');
      clearTimeout(n.pt);
      n.pt = setTimeout(function () { n.el.classList.remove('is-pulse'); }, 260);
    }

    function curve(ax, ay, bx, by, t) {
      // bezier con tangentes en el sentido del flujo
      var c1x, c1y, c2x, c2y;
      if (vertical) { c1x = ax; c1y = ay + (by - ay) * 0.5; c2x = bx; c2y = by - (by - ay) * 0.5; }
      else { c1x = ax + (bx - ax) * 0.5; c1y = ay; c2x = bx - (bx - ax) * 0.5; c2y = by; }
      var u = 1 - t;
      return {
        x: u * u * u * ax + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * bx,
        y: u * u * u * ay + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * by
      };
    }

    function update(dt) {
      time += dt;
      // los nodos se mudan de carril
      nodes.forEach(function (n) {
        var k = 1 - Math.pow(0.0015, dt);
        n.x += (n.tx - n.x) * k;
        n.y += (n.ty - n.y) * k;
        place(n);
      });

      // entrada de casos
      spawnClock += dt;
      var every = mode === 'hoy' ? 0.45 : (backlog > 0 ? 0.2 : 0.42);
      if (spawnClock >= every) {
        spawnClock = 0;
        // si la persona tiene cola, los casos nuevos esperan afuera
        var jammed = nodes.some(function (n) { return n.who === 'h' && n.queue.length >= 4; });
        if (jammed) { if (mode === 'hoy') { backlog = Math.min(backlog + 1, 99); } }
        else { if (backlog > 0 && mode === 'ag') { backlog -= 1; } spawn(); }
      }

      // atención en los pasos de la persona: de a un caso
      nodes.forEach(function (n) {
        if (n.who !== 'h') { return; }
        if (!n.busy && n.queue.length) {
          n.busy = n.queue.shift();
          n.busy.state = 'serve';
          n.busy.timer = mode === 'hoy' ? 1.0 : 0.4;
        }
      });

      for (var i = tokens.length - 1; i >= 0; i--) {
        var tok = tokens[i];
        if (tok.state === 'move') {
          tok.t += dt / tok.dur;
          var target = waypoint(tok, tok.seg);
          var e = tok.t >= 1 ? 1 : tok.t * tok.t * (3 - 2 * tok.t);
          var p = curve(tok.fx, tok.fy, target.x, target.y, e);
          tok.x = p.x; tok.y = p.y;
          if (tok.t >= 1) {
            if (tok.seg >= nodes.length) { tokens.splice(i, 1); done += 1; continue; }
            var n = nodes[tok.seg];
            if (!visits(tok, tok.seg)) { depart(tok); }
            else if (n.who === 'a') { tok.state = 'serve'; tok.timer = 0.16; pulse(n); }
            else { tok.state = 'queue'; n.queue.push(tok); }
          }
        } else if (tok.state === 'serve') {
          var node = nodes[tok.seg];
          tok.x = node.x; tok.y = node.y;
          tok.timer -= dt;
          if (tok.timer <= 0) {
            if (node.busy === tok) { node.busy = null; pulse(node); }
            depart(tok);
          }
        } else if (tok.state === 'queue') {
          var qn = nodes[tok.seg];
          var k = qn.queue.indexOf(tok);
          var qx = qn.x - qn.w / 2 + 12 + k * 11;
          var qy = qn.y - qn.h / 2 - 9;
          tok.x += (qx - tok.x) * 0.25;
          tok.y += (qy - tok.y) * 0.25;
        }
      }

      tokens.forEach(function (tok) {
        tok.trail.push(tok.x, tok.y);
        if (tok.trail.length > 16) { tok.trail.splice(0, 2); }
      });

      statDone.textContent = done;
      var waiting = backlog + nodes.reduce(function (acc, n) { return acc + n.queue.length; }, 0);
      statWait.textContent = waiting;
    }

    function strokeCurve(a, b) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      if (vertical) { ctx.bezierCurveTo(a.x, a.y + (b.y - a.y) * 0.5, b.x, b.y - (b.y - a.y) * 0.5, b.x, b.y); }
      else { ctx.bezierCurveTo(a.x + (b.x - a.x) * 0.5, a.y, b.x - (b.x - a.x) * 0.5, b.y, b.x, b.y); }
      ctx.stroke();
    }

    function band(x, y, w, h) {
      if (ctx.roundRect) { ctx.roundRect(x, y, w, h, 18); } else { ctx.rect(x, y, w, h); }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.6;

      // carriles
      ['h', 'a'].forEach(function (who) {
        var c = lanePos(who);
        ctx.fillStyle = who === 'h' ? 'rgba(255,178,56,0.045)' : 'rgba(34,225,255,0.045)';
        ctx.beginPath();
        if (vertical) { band(c - W * 0.22, 46, W * 0.44, H - 60); }
        else { band(74, c - 62, W - 92, 124); }
        ctx.fill();
      });

      // conexiones: punteado que avanza
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'butt';
      ctx.setLineDash([3, 8]);
      ctx.lineDashOffset = -time * 34;
      var pts = [edgePoint(false)].concat(nodes.map(function (n) { return { x: n.x, y: n.y, who: n.who }; }), [edgePoint(true)]);
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, COLORS[a.who || b.who || 'a']);
        g.addColorStop(1, COLORS[b.who || a.who || 'a']);
        ctx.strokeStyle = g;
        ctx.globalAlpha = 0.55;
        strokeCurve(a, b);
      }
      // desvíos: los casos comunes pasan de largo por el carril del agente
      if (mode === 'ag') {
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.a;
        nodes.forEach(function (n, idx) {
          if (!role.steps[idx].only) { return; }
          var by = point(idx, 'a');
          strokeCurve(pts[idx], by);
          strokeCurve(by, pts[idx + 2]);
        });
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // casos
      tokens.forEach(function (tok) {
        var who = tok.seg < nodes.length ? nodes[tok.seg].who : 'a';
        var color = tok.exc ? COLORS.x : (who === 'h' && visits(tok, Math.min(tok.seg, nodes.length - 1)) ? COLORS.h : COLORS.a);
        // estela
        if (tok.state === 'move' && tok.trail.length >= 4) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = color;
          ctx.lineCap = 'round';
          for (var j = 0; j < tok.trail.length - 2; j += 2) {
            ctx.globalAlpha = (j / tok.trail.length) * 0.5;
            ctx.lineWidth = 1 + (j / tok.trail.length) * 3;
            ctx.beginPath();
            ctx.moveTo(tok.trail[j], tok.trail[j + 1]);
            ctx.lineTo(tok.trail[j + 2], tok.trail[j + 3]);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(tok.x, tok.y, tok.state === 'queue' ? 3.6 : 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    function frame(now) {
      if (!running) { return; }
      var dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      update(dt);
      draw();
      requestAnimationFrame(frame);
    }
    function play() {
      if (running || reduceMotion || !visible || document.hidden) { return; }
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    setRole(0);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measure();
        nodes.forEach(function (n) { n.x = n.tx; n.y = n.ty; place(n); });
        if (reduceMotion) { draw(); }
      }, 150);
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { play(); } });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); nodes.forEach(function (n) { n.x = n.tx; n.y = n.ty; place(n); }); });
    }

    if (reduceMotion) {
      setMode('ag');
      draw();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          play();
          // la primera vez muestra solo el cambio: unos segundos de "Hoy" y después el agente
          if (!touched && !autoTimer) {
            autoTimer = setTimeout(function () { if (!touched) { setMode('ag'); } }, 5200);
          }
        } else { stop(); }
      }, { threshold: 0.25 }).observe(flowEl);
    } else {
      visible = true;
      play();
    }
  }

  /* ----------------------------------------------------------
     CHARLAS: acordeón (una abierta por vez)
  ---------------------------------------------------------- */
  var talks = slice(document.querySelectorAll('.talk'));
  talks.forEach(function (talk) {
    var btn = talk.querySelector('.talk-head');
    btn.addEventListener('click', function () {
      var willOpen = !talk.classList.contains('is-open');
      talks.forEach(function (t) {
        t.classList.remove('is-open');
        t.querySelector('.talk-head').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) { talk.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  // "Reservar esta charla" deja el tema elegido en el formulario
  slice(document.querySelectorAll('[data-talk]')).forEach(function (link) {
    link.addEventListener('click', function () {
      var tipo = document.getElementById('tipo');
      var mensaje = document.getElementById('mensaje');
      if (tipo) { tipo.value = 'charla'; }
      if (mensaje && !mensaje.value.trim()) { mensaje.value = 'Me interesa la charla «' + link.dataset.talk + '». '; }
    });
  });

  /* ----------------------------------------------------------
     EPISODIOS: reproduce uno por vez, con sonido
  ---------------------------------------------------------- */
  var eps = slice(document.querySelectorAll('.ep'));
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
      video.load();
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
      function setLoading(on) { btn.disabled = on; btnText.hidden = on; btnLoading.hidden = !on; }
      function finish(ok) {
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
        .then(function (data) { finish(data.success === 'true' || data.success === true); })
        .catch(function () { finish(false); });
    });
    form.addEventListener('input', function (e) {
      if (e.target.classList.contains('is-invalid')) {
        e.target.classList.remove('is-invalid');
        e.target.removeAttribute('aria-invalid');
      }
    });
  }

  /* ----------------------------------------------------------
     DIAGNÓSTICO GRATUITO: cinco preguntas, de a una
  ---------------------------------------------------------- */
  var diagForm = document.getElementById('diagForm');
  if (diagForm) {
    var dSteps = slice(diagForm.querySelectorAll('.diag-step'));
    var dBar = document.getElementById('diagBar');
    var dStepN = document.getElementById('diagStepN');
    var dBack = document.getElementById('diagBack');
    var dSend = document.getElementById('diagSend');
    var dDone = document.getElementById('diagDone');
    var dError = document.getElementById('diagError');
    var dIndex = 0;

    var showStep = function (n, focus) {
      dIndex = Math.max(0, Math.min(n, dSteps.length - 1));
      dSteps.forEach(function (st, i) { st.classList.toggle('is-on', i === dIndex); });
      dBar.style.transform = 'scaleX(' + ((dIndex + 1) / dSteps.length) + ')';
      dStepN.textContent = 'Pregunta ' + (dIndex + 1) + ' de ' + dSteps.length;
      dBack.hidden = dIndex === 0;
      dSend.hidden = dIndex !== dSteps.length - 1;
      if (focus) {
        var first = dSteps[dIndex].querySelector('input:checked, input, textarea');
        if (first) { first.focus({ preventScroll: true }); }
      }
    };

    // al elegir una opción pasa sola a la siguiente pregunta
    diagForm.addEventListener('change', function (e) {
      if (e.target.type !== 'radio') { return; }
      var from = dIndex;
      setTimeout(function () { if (dIndex === from) { showStep(from + 1, true); } }, reduceMotion ? 0 : 320);
    });
    dBack.addEventListener('click', function () { showStep(dIndex - 1, true); });

    diagForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (name) {
        var el = diagForm.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : '';
      };
      var answers = { area: get('area'), dolor: get('dolor'), equipo: get('equipo'), ia: get('ia') };
      var missing = ['area', 'dolor', 'equipo', 'ia'].filter(function (k) { return !answers[k]; });
      if (missing.length) { showStep(['area', 'dolor', 'equipo', 'ia'].indexOf(missing[0]), true); return; }

      var nombre = diagForm.querySelector('#dNombre');
      var empresa = diagForm.querySelector('#dEmpresa');
      var email = diagForm.querySelector('#dEmail');
      var proceso = diagForm.querySelector('#dProceso');
      var bad = [];
      if (!nombre.value.trim()) { bad.push(nombre); }
      if (!empresa.value.trim()) { bad.push(empresa); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { bad.push(email); }
      [nombre, empresa, email].forEach(function (el) {
        var isBad = bad.indexOf(el) !== -1;
        el.classList.toggle('is-invalid', isBad);
        if (isBad) { el.setAttribute('aria-invalid', 'true'); } else { el.removeAttribute('aria-invalid'); }
      });
      if (bad.length) { bad[0].focus(); return; }

      var text = dSend.querySelector('.btn-text');
      var loading = dSend.querySelector('.btn-loading');
      dSend.disabled = true; text.hidden = true; loading.hidden = false; dError.hidden = true;

      fetch('https://formsubmit.co/ajax/elmaildediego@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.value.trim(),
          empresa: empresa.value.trim(),
          email: email.value.trim(),
          'area con mas dolor': answers.area,
          'que pesa mas': answers.dolor,
          'gente en el area': answers.equipo,
          'uso de IA hoy': answers.ia,
          'proceso que mas duele': proceso.value.trim() || '—',
          _subject: 'Diagnóstico gratuito — ' + empresa.value.trim()
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!(data.success === 'true' || data.success === true)) { throw new Error('envío rechazado'); }
          diagForm.classList.add('is-done');
          dDone.hidden = false;
          dDone.focus && dDone.setAttribute('tabindex', '-1');
        })
        .catch(function () {
          dSend.disabled = false; text.hidden = false; loading.hidden = true; dError.hidden = false;
        });
    });

    diagForm.addEventListener('input', function (e) {
      if (e.target.classList.contains('is-invalid')) {
        e.target.classList.remove('is-invalid');
        e.target.removeAttribute('aria-invalid');
      }
    });
    showStep(0, false);
  }

  /* ----------------------------------------------------------
     NAV: marca la sección visible · FOOTER: año
  ---------------------------------------------------------- */
  var navLinks = slice(document.querySelectorAll('.nav-link'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) { link.classList.toggle('active', link.getAttribute('href') === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    slice(document.querySelectorAll('main section[id]')).forEach(function (s) { navObserver.observe(s); });
  }
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  onScroll();
})();
