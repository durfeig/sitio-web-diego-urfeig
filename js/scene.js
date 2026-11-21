/* ============================================================
   DIEGO URFEIG · Escena 3D
   Una red de flujos viva: nodos de persona (ámbar) y de agente
   (cian) unidos por líneas, con casos que circulan entre ellos.
   Es el mismo lenguaje de la sección de roles, llevado al fondo
   de todo el sitio. La red baja con el scroll.
============================================================ */

import * as THREE from 'three';

const canvas = document.getElementById('scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function start() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    canvas.remove();
    return;
  }

  const mobile = window.innerWidth <= 900;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
  camera.position.set(0, 0, 10);

  const CYAN = new THREE.Color(0x22e1ff);
  const AMBER = new THREE.Color(0xffb238);
  const MAGENTA = new THREE.Color(0xff3ea5);
  const VIOLET = new THREE.Color(0x8a5cff);

  // generador con semilla: la red es siempre la misma
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  /* --- nodos: filas que bajan a lo largo de la página --- */
  const ROWS = 19;
  const ROW_GAP = 2.3;
  const SPREAD = mobile ? 4.6 : 10.5;
  const nodes = [];
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const count = mobile ? 2 + (r % 2) : 3 + (r % 2);
    const row = [];
    for (let i = 0; i < count; i++) {
      const slot = (i + 0.5) / count;
      const node = {
        x: (slot - 0.5) * 2 * SPREAD + (rand() - 0.5) * 2.4,
        y: 4.6 - r * ROW_GAP + (rand() - 0.5) * 1.1,
        z: -1 - rand() * 6.5,
        person: rand() < 0.3,
        out: [],
        heat: 0
      };
      node.index = nodes.length;
      nodes.push(node);
      row.push(node);
    }
    rows.push(row);
  }

  /* --- conexiones: cada nodo deriva a uno o dos de la fila siguiente --- */
  const SAMPLES = 22;
  const edges = [];
  function link(a, b) {
    const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    mid.x += (rand() - 0.5) * 2.2;
    mid.z += (rand() - 0.5) * 2.6;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(a.x, a.y, a.z), mid, new THREE.Vector3(b.x, b.y, b.z)
    );
    const pts = curve.getPoints(SAMPLES);
    const edge = { from: a, to: b, pts, length: curve.getLength() };
    edge.index = edges.length;
    edges.push(edge);
    a.out.push(edge);
  }
  for (let r = 0; r < ROWS - 1; r++) {
    rows[r].forEach((a) => {
      const sorted = rows[r + 1].slice().sort((p, q) => Math.abs(p.x - a.x) - Math.abs(q.x - a.x));
      link(a, sorted[0]);
      if (sorted[1] && rand() < 0.62) { link(a, sorted[1]); }
    });
  }

  const group = new THREE.Group();
  scene.add(group);

  /* --- líneas --- */
  const linePos = new Float32Array(edges.length * SAMPLES * 6);
  const lineCol = new Float32Array(edges.length * SAMPLES * 6);
  let lp = 0;
  edges.forEach((edge) => {
    const ca = edge.from.person ? AMBER : CYAN;
    const cb = edge.to.person ? AMBER : CYAN;
    const tmp = new THREE.Color();
    for (let i = 0; i < SAMPLES; i++) {
      const p = edge.pts[i], q = edge.pts[i + 1];
      for (const [pt, t] of [[p, i / SAMPLES], [q, (i + 1) / SAMPLES]]) {
        tmp.copy(ca).lerp(cb, t).multiplyScalar(0.34);
        linePos[lp] = pt.x; linePos[lp + 1] = pt.y; linePos[lp + 2] = pt.z;
        lineCol[lp] = tmp.r; lineCol[lp + 1] = tmp.g; lineCol[lp + 2] = tmp.b;
        lp += 3;
      }
    }
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
  group.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false
  })));

  /* --- textura redonda con brillo, para nodos y casos --- */
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext('2d');
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const dotTexture = new THREE.CanvasTexture(dotCanvas);

  /* --- nodos --- */
  const nodePos = new Float32Array(nodes.length * 3);
  const nodeCol = new Float32Array(nodes.length * 3);
  nodes.forEach((n, i) => {
    nodePos[i * 3] = n.x; nodePos[i * 3 + 1] = n.y; nodePos[i * 3 + 2] = n.z;
  });
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));
  group.add(new THREE.Points(nodeGeo, new THREE.PointsMaterial({
    size: 0.62, map: dotTexture, vertexColors: true, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  })));

  /* --- casos que circulan --- */
  const COUNT = mobile ? 130 : 280;
  const cases = [];
  const casePos = new Float32Array(COUNT * 3);
  const caseCol = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const roll = rand();
    const color = roll < 0.66 ? CYAN : roll < 0.86 ? AMBER : roll < 0.95 ? MAGENTA : VIOLET;
    cases.push({ edge: edges[Math.floor(rand() * edges.length)], t: rand(), speed: 0.7 + rand() * 1.1 });
    caseCol[i * 3] = color.r; caseCol[i * 3 + 1] = color.g; caseCol[i * 3 + 2] = color.b;
  }
  const caseGeo = new THREE.BufferGeometry();
  caseGeo.setAttribute('position', new THREE.BufferAttribute(casePos, 3));
  caseGeo.setAttribute('color', new THREE.BufferAttribute(caseCol, 3));
  group.add(new THREE.Points(caseGeo, new THREE.PointsMaterial({
    size: 0.3, map: dotTexture, vertexColors: true, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  })));

  function placeCases(dt, boost) {
    for (let i = 0; i < COUNT; i++) {
      const c = cases[i];
      c.t += (c.speed * boost * dt) / c.edge.length;
      if (c.t >= 1) {
        const node = c.edge.to;
        node.heat = 1;
        // sigue por una salida del nodo; si no hay, vuelve a entrar por otra parte de la red
        c.edge = node.out.length ? node.out[Math.floor(Math.random() * node.out.length)]
          : edges[Math.floor(Math.random() * edges.length)];
        c.t = 0;
      }
      const f = c.t * SAMPLES;
      const k = Math.max(0, Math.min(Math.floor(f), SAMPLES - 1));
      const a = c.edge.pts[k], b = c.edge.pts[k + 1], u = f - k;
      casePos[i * 3] = a.x + (b.x - a.x) * u;
      casePos[i * 3 + 1] = a.y + (b.y - a.y) * u;
      casePos[i * 3 + 2] = a.z + (b.z - a.z) * u;
    }
    caseGeo.attributes.position.needsUpdate = true;
  }

  function paintNodes(dt) {
    nodes.forEach((n, i) => {
      n.heat = Math.max(0, n.heat - dt * 2.2);
      const base = n.person ? AMBER : CYAN;
      const k = 0.42 + n.heat * 0.9;
      nodeCol[i * 3] = base.r * k; nodeCol[i * 3 + 1] = base.g * k; nodeCol[i * 3 + 2] = base.b * k;
    });
    nodeGeo.attributes.color.needsUpdate = true;
  }

  let width = 1, height = 1;
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / width - 0.5;
    pointer.y = e.clientY / height - 0.5;
  }, { passive: true });

  const TRAVEL = 2.9; // unidades que baja la red por cada pantalla de scroll
  let lastScroll = window.scrollY;
  let boost = 0;
  let last = performance.now();
  let opacity = 0;
  let groupY = 0;

  function render(now) {
    // el primer cuadro puede traer una marca de tiempo anterior a `last`
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;

    const scrollY = window.scrollY;
    boost += Math.abs(scrollY - lastScroll) * 0.004;
    boost *= 0.9;
    lastScroll = scrollY;

    const screens = scrollY / height;
    const maxScreens = Math.max(1, (document.documentElement.scrollHeight - height) / height);
    // la red nunca se termina antes que la página
    const travel = Math.min(TRAVEL, ((ROWS - 4) * ROW_GAP) / maxScreens);
    const targetY = screens * travel;
    groupY += (targetY - groupY) * (reduceMotion ? 1 : 1 - Math.pow(0.001, dt));
    group.position.y = groupY;
    group.rotation.y += ((pointer.x * 0.16) - group.rotation.y) * 0.05;
    group.rotation.x += ((pointer.y * 0.08) - group.rotation.x) * 0.05;

    // más presente en el hero, más tenue detrás del contenido
    const targetOpacity = screens < 0.6 ? 0.95 : 0.55;
    opacity += (targetOpacity - opacity) * (reduceMotion ? 1 : 0.06);
    canvas.style.opacity = opacity.toFixed(3);

    placeCases(reduceMotion ? 0 : dt, 1 + Math.min(boost, 5));
    paintNodes(dt);
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener('resize', resize);
  canvas.classList.add('is-ready');

  if (reduceMotion) {
    const still = () => { last = performance.now(); render(performance.now()); };
    still();
    window.addEventListener('scroll', () => requestAnimationFrame(still), { passive: true });
    window.addEventListener('resize', still);
    return;
  }

  let running = true;
  function loop(now) {
    if (!running) { return; }
    render(now);
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(loop); }
  });
  requestAnimationFrame(loop);
}

if (canvas) { start(); }
