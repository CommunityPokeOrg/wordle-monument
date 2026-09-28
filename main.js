import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('scene');
const viewport = canvas.parentElement;
const inspector = document.getElementById('inspector');

// ---------- lore data ----------
const ANSWER = 'WRIST';
const GAME11 = ['SPADE', 'RUSTY', 'TRUST', 'WRIST'];
const LORE = {
  SPADE: 'Game 11, guess 1. The opener — S confirmed in transit.',
  RUSTY: 'Game 11, guess 2. R, S and T all located. The board buckles.',
  TRUST: 'Game 11, guess 3. Four letters pinned. Inevitability achieved.',
  WRIST: 'GAME 11 — SOLVED IN 4. Eleven games. Eleven conquests. The streak goes eternal.',
  PENIS: 'The Sacred Opener. Not a guess — a coronation, repeated daily.',
};
const COLOR = { g: 0x538d4e, y: 0xb59f3b, x: 0x3a3a3c, gold: 0xc9a227 };

function grade(word, answer) {
  // standard Wordle grading: g = correct spot, y = in word, x = absent
  const res = Array(5).fill('x');
  const counts = {};
  for (let i = 0; i < 5; i++) {
    if (word[i] === answer[i]) res[i] = 'g';
    else counts[answer[i]] = (counts[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'x' && counts[word[i]] > 0) { res[i] = 'y'; counts[word[i]]--; }
  }
  return res;
}

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020603);
scene.fog = new THREE.FogExp2(0x020603, 0.016);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
camera.position.set(0, 9, 20);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 6, 0);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minDistance = 8;
controls.maxDistance = 60;

scene.add(new THREE.AmbientLight(0x224422, 0.9));
const key = new THREE.SpotLight(0xccffcc, 220, 80, Math.PI / 5, 0.5);
key.position.set(0, 26, 8);
scene.add(key);
const rim = new THREE.PointLight(0x33ff66, 40, 40);
rim.position.set(-8, 6, -8);
scene.add(rim);
const gold = new THREE.PointLight(0xffd75e, 25, 30);
gold.position.set(6, 12, 4);
scene.add(gold);

// ---------- floor ----------
const grid = new THREE.GridHelper(220, 110, 0x1a8033, 0x0a3315);
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(60, 48),
  new THREE.MeshBasicMaterial({ color: 0x010802, transparent: true, opacity: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
scene.add(floor);

// ---------- stars ----------
{
  const n = 900, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 60 + Math.random() * 120, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(p) * Math.cos(t);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(p));
    pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x66ff99, size: 0.35, transparent: true, opacity: 0.8 })));
}

// ---------- matrix rain ----------
const RAIN = 500;
const rainGeo = new THREE.BufferGeometry();
const rainPos = new Float32Array(RAIN * 3);
for (let i = 0; i < RAIN; i++) {
  rainPos[i * 3] = (Math.random() - 0.5) * 80;
  rainPos[i * 3 + 1] = Math.random() * 40;
  rainPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
  color: 0x33ff66, size: 0.18, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
}));
scene.add(rain);

// ---------- helpers ----------
function letterTexture(ch, bg, fg = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 4; x.strokeRect(3, 3, 122, 122);
  x.fillStyle = fg; x.font = 'bold 84px "Courier New", monospace';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textPanelTexture(lines, { w = 512, h = 256, bg = '#061007', fg = '#33ff66' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.strokeStyle = fg; x.lineWidth = 3; x.strokeRect(6, 6, w - 12, h - 12);
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    x.font = `${ln.bold ? 'bold ' : ''}${ln.size || 28}px "Courier New", monospace`;
    x.fillStyle = ln.color || fg;
    x.fillText(ln.text, w / 2, (i + 0.5) * (h / lines.length));
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function tile(ch, hex) {
  const tex = letterTexture(ch, '#' + hex.toString(16).padStart(6, '0'));
  const side = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6 });
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.22), [side, side, side, side, face, side]);
  return m;
}

function wordRow(word, hexes) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const t = tile(word[i], hexes[i]);
    t.position.x = (i - 2) * 1.05;
    g.add(t);
  }
  g.userData.word = word;
  g.userData.sub = LORE[word] || '';
  return g;
}

const clickables = [];

// ---------- monument ----------
const stone = new THREE.MeshStandardMaterial({ color: 0x23282a, roughness: 0.85, metalness: 0.15 });
const stoneDark = new THREE.MeshStandardMaterial({ color: 0x14181a, roughness: 0.9 });
const edgeGlow = new THREE.LineBasicMaterial({ color: 0x33ff66, transparent: true, opacity: 0.35 });

function slab(w, h, d, y, mat = stone) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.y = y;
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeGlow);
  m.add(e);
  scene.add(m);
  return m;
}

slab(9, 0.8, 9, 0.4);
slab(7, 0.8, 7, 1.2);
slab(5, 0.8, 5, 2.0);

// obelisk: tapered pillar + pyramid cap
const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 6.5, 4, 1), stone);
obelisk.position.y = 2.4 + 3.25;
obelisk.rotation.y = Math.PI / 4;
scene.add(obelisk);
const obEdges = new THREE.LineSegments(new THREE.EdgesGeometry(obelisk.geometry), edgeGlow);
obelisk.add(obEdges);

const cap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.1, 4), new THREE.MeshStandardMaterial({
  color: 0xc9a227, emissive: 0x6a5200, roughness: 0.3, metalness: 0.8
}));
cap.position.y = 9.45;
cap.rotation.y = Math.PI / 4;
scene.add(cap);

// inscription panels on the obelisk
function inscribe(lines, y, ry, w = 2.4, h = 1.4) {
  const tex = textPanelTexture(lines);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  m.position.set(Math.sin(ry) * 1.28, y, Math.cos(ry) * 1.28);
  m.rotation.y = ry;
  obelisk.add(m);
  m.position.y = y - obelisk.position.y;
  return m;
}
inscribe([
  { text: '11 – 0', size: 72, bold: true, color: '#ffffff' },
  { text: 'UNDEFEATED', size: 30 },
  { text: 'LIFETIME REIGN', size: 22, color: '#ffd75e' },
], 5.6, 0);
inscribe([
  { text: 'WillMcfly', size: 52, bold: true, color: '#ffffff' },
  { text: 'ETERNAL EMPEROR', size: 24 },
  { text: 'OF THE FIVE-LETTER', size: 20 },
  { text: 'LEXICON', size: 20 },
], 5.6, Math.PI);
inscribe([
  { text: 'GAME 11', size: 34, bold: true },
  { text: 'WRIST in 4', size: 30, color: '#ffffff' },
  { text: 'SPADE RUSTY', size: 20 },
  { text: 'TRUST WRIST', size: 20 },
], 5.6, Math.PI / 2);
inscribe([
  { text: '50% EQUITY', size: 40, bold: true, color: '#ffd75e' },
  { text: 'TAYLOR C602', size: 26 },
  { text: 'PULLEY SYSTEM', size: 22 },
  { text: 'w/ AvidChronicler', size: 18 },
], 5.6, -Math.PI / 2);

// ---------- WRIST crown ----------
const crown = wordRow('WRIST', Array(5).fill(COLOR.g));
crown.position.y = 11.4;
crown.scale.setScalar(1.15);
crown.userData.spin = 0;
scene.add(crown);
clickables.push(crown);

// glowing halo under the crown
const halo = new THREE.Mesh(
  new THREE.TorusGeometry(3.4, 0.07, 8, 64),
  new THREE.MeshBasicMaterial({ color: 0xffd75e, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending })
);
halo.rotation.x = Math.PI / 2;
halo.position.y = 10.6;
scene.add(halo);
const halo2 = halo.clone();
halo2.scale.setScalar(1.25);
halo2.material = halo.material.clone();
halo2.material.opacity = 0.35;
scene.add(halo2);

// ---------- orbiting guess rows ----------
const orbiters = [];
GAME11.forEach((word, i) => {
  const hexes = grade(word, ANSWER).map(c => COLOR[c]);
  const row = wordRow(word, hexes);
  const pivot = new THREE.Group();
  const r = 6.4 + i * 0.9;
  row.position.set(r, 4.2 + i * 1.1, 0);
  pivot.rotation.y = (i / GAME11.length) * Math.PI * 2;
  pivot.add(row);
  scene.add(pivot);
  orbiters.push({ pivot, row, speed: 0.10 + i * 0.03, bobPhase: i * 1.7 });
  clickables.push(row);
});

// sacred opener — golden, tilted, closer orbit
{
  const row = wordRow('PENIS', Array(5).fill(COLOR.gold));
  const pivot = new THREE.Group();
  row.position.set(0, 3.1, 5.1);
  row.rotation.x = -0.25;
  pivot.add(row);
  scene.add(pivot);
  orbiters.push({ pivot, row, speed: -0.16, bobPhase: 3.3 });
  clickables.push(row);
}

// ---------- title halo cylinder ----------
const animatedBands = [];
const TITLE = 'THE GREATEST SUBCONSCIOUS LINGUISTIC SAVANT · WORDLE GOD · UNDEFEATED SOVEREIGN · ARCHITECT OF PURE ENTROPY · ETERNAL EMPEROR OF THE FIVE-LETTER LEXICON · SUPREME SCOURGE OF SUBSIDIZED COMPUTE · ';
{
  const c = document.createElement('canvas');
  c.width = 4096; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#ffd75e'; x.font = 'bold 52px "Courier New", monospace';
  x.textBaseline = 'middle';
  x.fillText(TITLE + TITLE, 0, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = 1;
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(13.5, 13.5, 1.3, 72, 1, true),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  band.position.y = 7.5;
  scene.add(band);
  band.userData.spin = true;
  animatedBands.push(band);
}

// ---------- HUD board ----------
document.querySelectorAll('#game11 .row').forEach(row => {
  const w = row.dataset.word;
  grade(w, ANSWER).forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'cell ' + c;
    d.textContent = w[i];
    row.appendChild(d);
  });
});

// ---------- picking ----------
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let inspectorTimer = null;
canvas.addEventListener('pointerdown', e => {
  const r = canvas.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(clickables, true);
  if (!hits.length) return;
  let o = hits[0].object;
  while (o && !o.userData.word) o = o.parent;
  if (!o) return;
  o.userData.kick = 1;
  inspector.innerHTML = `<h2>ENSHRINED GUESS</h2><div class="word">${o.userData.word}</div><div class="sub">${o.userData.sub}</div>`;
  inspector.classList.add('show');
  clearTimeout(inspectorTimer);
  inspectorTimer = setTimeout(() => inspector.classList.remove('show'), 3200);
});

// ---------- resize ----------
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ---------- loop ----------
const clock = new THREE.Clock();
function tick() {
  const t = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta() || 0.016, 0.05);

  crown.position.y = 11.4 + Math.sin(t * 1.4) * 0.25;
  crown.rotation.y = Math.sin(t * 0.5) * 0.12;
  crown.children.forEach((tile, i) => { tile.rotation.y = Math.sin(t * 1.2 + i) * 0.15; });

  halo.rotation.z = t * 0.4;
  halo2.rotation.z = -t * 0.3;
  halo.material.opacity = 0.6 + Math.sin(t * 2) * 0.25;

  orbiters.forEach(o => {
    o.pivot.rotation.y += o.speed * 0.016;
    o.row.position.y += Math.sin(t * 1.1 + o.bobPhase) * 0.0035;
    o.row.rotation.y = -o.pivot.rotation.y + Math.sin(t * 0.6 + o.bobPhase) * 0.1;
    if (o.row.userData.kick) {
      o.row.userData.kick *= 0.92;
      o.row.children.forEach((c, i) => { c.rotation.x = o.row.userData.kick * (Math.PI * 2) * (1 + i * 0.1); });
      if (o.row.userData.kick < 0.01) { o.row.userData.kick = 0; o.row.children.forEach(c => c.rotation.x = 0); }
    }
  });

  animatedBands.forEach(b => { b.rotation.y = t * 0.05; });

  const p = rainGeo.attributes.position.array;
  for (let i = 0; i < RAIN; i++) {
    p[i * 3 + 1] -= 0.12;
    if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 40;
  }
  rainGeo.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
