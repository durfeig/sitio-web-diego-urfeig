/* ============================================================
   DIEGO URFEIG · Escena 3D
   Un giroscopio con un núcleo facetado, tres anillos que giran
   en ejes distintos y una nube de puntos. Acompaña el scroll:
   en el hero rodea la pantalla del video y después se corre a
   un costado de cada sección.
============================================================ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // Reflejos tipo estudio para que el metal se lea
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const CYAN = 0x22e1ff, VIOLET = 0x8a5cff, MAGENTA = 0xff3ea5, AMBER = 0xffb238;

  const rig = new THREE.Group();
  scene.add(rig);

  // Núcleo facetado e iridiscente
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.95, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a1f38, metalness: 1, roughness: 0.16, flatShading: true,
      iridescence: 1, iridescenceIOR: 1.7, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.6
    })
  );
  rig.add(core);

  // Malla de alambre alrededor del núcleo
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.32, 1)),
    new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.28 })
  );
  rig.add(shell);

  // Tres anillos, cada uno con un "agente" que lo recorre
  const ringDefs = [
    { r: 1.95, color: CYAN, tilt: [1.2, 0, 0.3], speed: 0.55 },
    { r: 2.4, color: VIOLET, tilt: [0.4, 0.9, 0], speed: -0.4 },
    { r: 2.85, color: MAGENTA, tilt: [-0.7, 0.3, 1.1], speed: 0.3 }
  ];
  const rings = ringDefs.map((def) => {
    const holder = new THREE.Group();
    holder.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
    const spinner = new THREE.Group();
    holder.add(spinner);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(def.r, 0.022, 12, 200),
      new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 1.5, metalness: 0.6, roughness: 0.3 })
    );
    spinner.add(ring);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: def.color, emissiveIntensity: 2.4 })
    );
    dot.position.x = def.r;
    spinner.add(dot);

    const dot2 = dot.clone();
    dot2.scale.setScalar(0.6);
    dot2.position.set(-def.r * 0.5, def.r * 0.866, 0);
    spinner.add(dot2);

    rig.add(holder);
    return { holder, spinner, speed: def.speed };
  });

  // Halo detrás del núcleo
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.25, 'rgba(160,120,255,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, color: VIOLET, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  glow.scale.setScalar(7);
  rig.add(glow);

  // Nube de puntos con los colores de los flujos
  const COUNT = mobile ? 1100 : 2400;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const palette = [CYAN, VIOLET, MAGENTA, AMBER, 0xffffff].map((c) => new THREE.Color(c));
  for (let i = 0; i < COUNT; i++) {
    const radius = 3.4 + Math.pow(Math.random(), 1.6) * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
    positions[i * 3 + 2] = radius * Math.cos(phi) - 2;
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const cloudGeometry = new THREE.BufferGeometry();
  cloudGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  cloudGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const cloud = new THREE.Points(cloudGeometry, new THREE.PointsMaterial({
    size: 0.07, map: glowTexture, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  scene.add(cloud);

  // Luces de color que orbitan
  const lightA = new THREE.PointLight(CYAN, 40, 20);
  const lightB = new THREE.PointLight(MAGENTA, 40, 20);
  scene.add(lightA, lightB);

  /* --- dónde se ubica en cada sección (fracción de pantalla, escala, opacidad) --- */
  const stage = document.getElementById('stage');
  const stops = [
    { id: 'roles', nx: 0.93, ny: 0.16, s: 0.5, o: 0.42 },
    { id: 'problema', nx: 0.9, ny: 0.2, s: 0.45, o: 0.3 },
    { id: 'charlas', nx: 0.94, ny: 0.62, s: 0.62, o: 0.34 },
    { id: 'servicios', nx: 0.06, ny: 0.22, s: 0.55, o: 0.3 },
    { id: 'contenido', nx: 0.94, ny: 0.2, s: 0.5, o: 0.3 },
    { id: 'sobre-diego', nx: 0.06, ny: 0.7, s: 0.6, o: 0.32 },
    { id: 'contacto', nx: 0.3, ny: 0.62, s: 1.25, o: 0.5 }
  ].map((s) => ({ ...s, el: document.getElementById(s.id) })).filter((s) => s.el);

  const target = { x: 0, y: 0, s: 1, o: 1 };
  const state = { x: 2.4, y: 0, s: 1, o: 0 };
  let viewW = 1, viewH = 1, width = 1, height = 1;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    viewW = viewH * camera.aspect;
  }

  function toWorld(nx, ny) {
    return { x: (nx - 0.5) * viewW, y: -(ny - 0.5) * viewH };
  }

  function pickTarget() {
    const mid = height * 0.5;
    const small = width <= 900;
    // en el hero: centrado en la pantalla del video
    if (stage) {
      const r = stage.getBoundingClientRect();
      if (r.bottom > height * 0.2) {
        const p = toWorld((r.left + r.width / 2) / width, (r.top + r.height / 2) / height);
        target.x = p.x; target.y = p.y;
        target.s = small ? 0.62 : Math.min(1.05, (r.width / width) * viewW / 3.3);
        target.o = 1;
        return;
      }
    }
    let chosen = stops[stops.length - 1];
    for (const stop of stops) {
      const r = stop.el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { chosen = stop; break; }
      if (r.top > mid) { chosen = stop; break; }
    }
    const p = toWorld(small ? (chosen.nx > 0.5 ? 0.92 : 0.08) : chosen.nx, chosen.ny);
    target.x = p.x; target.y = p.y;
    target.s = chosen.s * (small ? 0.8 : 1);
    target.o = chosen.o * (small ? 0.75 : 1);
  }

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / width - 0.5;
    pointer.y = e.clientY / height - 0.5;
  }, { passive: true });

  let lastScroll = window.scrollY;
  let spinBoost = 0;
  let last = performance.now();
  let elapsed = 0;

  function render(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;

    // el scroll acelera el giro
    const scrollY = window.scrollY;
    spinBoost += Math.abs(scrollY - lastScroll) * 0.0009;
    spinBoost *= 0.92;
    lastScroll = scrollY;
    const speed = 1 + Math.min(spinBoost, 6);

    pickTarget();
    const k = 1 - Math.pow(0.02, dt);
    state.x += (target.x - state.x) * k;
    state.y += (target.y - state.y) * k;
    state.s += (target.s - state.s) * k;
    state.o += (target.o - state.o) * k;

    rig.position.set(state.x, state.y, 0);
    rig.scale.setScalar(state.s);
    rig.rotation.y = pointer.x * 0.5;
    rig.rotation.x = pointer.y * 0.35;
    canvas.style.opacity = state.o.toFixed(3);

    core.rotation.x += dt * 0.22 * speed;
    core.rotation.y += dt * 0.3 * speed;
    shell.rotation.y -= dt * 0.14 * speed;
    shell.rotation.z += dt * 0.08 * speed;
    rings.forEach((ring, i) => {
      ring.spinner.rotation.z += dt * ring.speed * speed;
      ring.holder.rotation.y += dt * 0.12 * (i % 2 ? -1 : 1) * speed;
    });
    cloud.rotation.y += dt * 0.02 * speed;
    cloud.rotation.x = pointer.y * 0.08;

    lightA.position.set(state.x + Math.cos(elapsed * 0.7) * 4, state.y + Math.sin(elapsed * 0.9) * 3, 3);
    lightB.position.set(state.x + Math.cos(elapsed * 0.5 + 2) * 4, state.y + Math.sin(elapsed * 0.6 + 1) * 3, 3);

    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener('resize', resize);
  canvas.classList.add('is-ready');

  if (reduceMotion) {
    // sin animación: un cuadro fijo que se actualiza al hacer scroll o cambiar el tamaño
    const still = () => { last = performance.now(); state.x = target.x; state.y = target.y; render(performance.now()); };
    pickTarget(); state.x = target.x; state.y = target.y; state.s = target.s; state.o = target.o;
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
  pickTarget();
  state.x = target.x; state.y = target.y; state.s = target.s;
  requestAnimationFrame(loop);
}

if (canvas) { start(); }
