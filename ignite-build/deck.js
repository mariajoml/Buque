/* =========================================================
   Architect Your Mind — motor de la presentación
   - Escenas: arquitectura isométrica generada en SVG.
   - Pasos: [data-step] se enciende (.on) al llegar a su paso,
     [data-at] marca un estado (.at) y [data-dim-after] se
     atenúa (.dim) cuando el paso lo supera.
   - Modos: normal · ?presenter (notas y vistas previas) ·
     ?embed (vista previa sin controles).
   ========================================================= */
(() => {
'use strict';

/* ---------- geometría ---------- */
const K = Math.cos(Math.PI / 6);
const R = n => Math.round(n * 10) / 10;
const P = (x, y, z = 0) => [R((x - y) * K), R((x + y) / 2 - z)];
const pts = a => a.map(p => P(...p).join(',')).join(' ');
const d3 = a => 'M' + a.map(p => P(...p).join(' ')).join(' L');
const d2 = a => 'M' + a.map(p => p.map(R).join(' ')).join(' L');

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const at = o => Object.entries(o)
  .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '')
  .map(([k, v]) => ` ${k}="${v}"`).join('');
const sec = n => Math.round(n * 100) / 100;

function pth(d, { cls = 'ln draw', delay, hd, step, dim, style = '' } = {}) {
  let st = style;
  if (delay != null) st += `--d:${sec(delay)};`;
  if (hd != null) st += `--hd:${sec(hd)};`;
  const pl = /\b(draw|spark)\b/.test(cls) ? 1 : null;
  return `<path${at({ class: cls, d, pathLength: pl, style: st, 'data-step': step, 'data-dim-after': dim })}/>`;
}
function g(inner, { cls, step, stepAt, dim, tr, style, role, inter } = {}) {
  return `<g${at({ class: cls, transform: tr, style, 'data-step': step, 'data-at': stepAt, 'data-dim-after': dim, 'data-role': role, 'data-interactive': inter ? '' : null })}>${inner}</g>`;
}
function poly(points, cls, style) { return `<polygon${at({ class: cls, points, style })}/>`; }
function txt(x, y, s, cls, { anchor = 'start', size, fill } = {}) {
  return `<text${at({ x: R(x), y: R(y), class: cls, 'text-anchor': anchor, 'font-size': size, style: fill ? `fill:${fill}` : null })}>${s}</text>`;
}
function dot(x, y, r, cls = 'dot', style) { return `<circle${at({ cx: R(x), cy: R(y), r, class: cls, style })}/>`; }
const T = (x, y, s = 1) => `translate(${x} ${y})${s !== 1 ? ` scale(${s})` : ''}`;

/* Caja isométrica: caras visibles (+x, +y, techo) y aristas. */
function box(o) {
  const { x = 0, y = 0, z = 0, w, d, h, faces = false, lines = true, hidden = false,
    ec = 'ln draw', fc = '', cls = '', delay = 0, dd = 0.03, hd, step, dim, fdelay, skip = [], style } = o;
  const X = x + w, Y = y + d, Z = z + h;
  let s = '';
  if (faces) {
    const fs = fdelay != null ? `--d:${sec(fdelay)}` : null;
    s += poly(pts([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]]), `fc l ${fc}`, fs);
    s += poly(pts([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]]), `fc r ${fc}`, fs);
    s += poly(pts([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]]), `fc t ${fc}`, fs);
  }
  if (hidden) {
    [[[x, y, z], [X, y, z]], [[x, y, z], [x, Y, z]], [[x, y, z], [x, y, Z]]]
      .forEach(e => { s += pth(d3(e), { cls: 'ln hid fade', delay: delay + 0.3 }); });
  }
  if (lines) {
    const E = [
      [[X, y, z], [X, y, Z]], [[X, Y, z], [X, Y, Z]], [[x, Y, z], [x, Y, Z]],
      [[X, y, z], [X, Y, z]], [[X, Y, z], [x, Y, z]],
      [[x, y, Z], [X, y, Z]], [[X, y, Z], [X, Y, Z]], [[X, Y, Z], [x, Y, Z]], [[x, Y, Z], [x, y, Z]],
    ];
    E.forEach((e, i) => { if (!skip.includes(i)) s += pth(d3(e), { cls: ec, delay: delay + i * dd, hd }); });
  }
  return g(s, { cls: `box ${cls}`.trim(), step, dim, style });
}

/* Prisma de planta libre (convexa), para piezas giradas. */
function prism(foot, z, h, { fc = '', ec = 'ln draw', delay = 0, dd = 0.03, cls = '', step, dim, faces = true } = {}) {
  const n = foot.length;
  const cx = foot.reduce((a, p) => a + p[0], 0) / n, cy = foot.reduce((a, p) => a + p[1], 0) / n;
  const sides = [];
  for (let i = 0; i < n; i++) {
    const a = foot[i], b = foot[(i + 1) % n];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
    if (nx + ny > 1e-6) sides.push({ a, b, k: mx + my, side: nx > ny ? 'r' : 'l' });
  }
  sides.sort((p, q) => p.k - q.k);
  let s = '';
  if (faces) {
    sides.forEach(({ a, b, side }) => {
      s += poly(pts([[a[0], a[1], z], [b[0], b[1], z], [b[0], b[1], z + h], [a[0], a[1], z + h]]), `fc ${side} ${fc}`);
    });
    s += poly(pts(foot.map(p => [p[0], p[1], z + h])), `fc t ${fc}`);
  }
  let i = 0;
  const E = [];
  foot.forEach((p, j) => E.push([[p[0], p[1], z + h], [foot[(j + 1) % n][0], foot[(j + 1) % n][1], z + h]]));
  const vs = new Set();
  sides.forEach(({ a, b }) => { E.push([[a[0], a[1], z], [b[0], b[1], z]]); vs.add(a); vs.add(b); });
  vs.forEach(p => E.push([[p[0], p[1], z], [p[0], p[1], z + h]]));
  E.forEach(e => { s += pth(d3(e), { cls: ec, delay: delay + (i++) * dd }); });
  return g(s, { cls, step, dim });
}

function isoCircle(cx, cy, z, r, n = 64) {
  const a = [];
  for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI * 2; a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r, z]); }
  return d3(a);
}
function floorGrid(x0, y0, x1, y1, stepU, { delay = 0, dd = 0.04, cls = 'ln faint draw' } = {}) {
  let s = '', i = 0;
  for (let x = x0; x <= x1 + 0.1; x += stepU) s += pth(d3([[x, y0, 0], [x, y1, 0]]), { cls, delay: delay + (i++) * dd });
  i = 0;
  for (let y = y0; y <= y1 + 0.1; y += stepU) s += pth(d3([[x0, y, 0], [x1, y, 0]]), { cls, delay: delay + 0.03 + (i++) * dd });
  return s;
}
function arrowHead(x, y, ang, size = 16, cls = 'dot', style) {
  const a1 = ang + Math.PI * 0.84, a2 = ang - Math.PI * 0.84;
  const p = [[x, y], [x + Math.cos(a1) * size, y + Math.sin(a1) * size], [x + Math.cos(a2) * size, y + Math.sin(a2) * size]];
  return poly(p.map(q => q.map(R).join(',')).join(' '), cls, style);
}
function person(x, y, { cls = 'dot', delay } = {}) {
  const [hx, hy] = P(x, y, 74), [bx, by] = P(x, y, 0), [tx, ty] = P(x, y, 54);
  const st = delay != null ? `--d:${sec(delay)}` : null;
  return g(`<path class="ln w2" d="M${bx} ${by} L${tx} ${ty}"/>` + dot(hx, hy, 11, cls), { cls: 'fade', style: st });
}

/* =========================================================
   ESCENAS
   ========================================================= */
const SCENES = {};

/* 03 — herramientas que se expanden / estructura inmóvil */
SCENES.paradox = () => {
  const r = rng(7);
  let s = '', links = '';
  const cells = [];
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const dist = Math.hypot(i, j);
    if (dist <= 3.3 && (dist < 1.6 || r() > 0.3)) cells.push({ i, j, dist, h: 30 + r() * 120 });
  }
  const has = (i, j) => cells.find(c => c.i === i && c.j === j);
  cells.forEach(c => {
    [[1, 0], [0, 1]].forEach(([di, dj]) => {
      const n = has(c.i + di, c.j + dj);
      if (n) links += pth(d3([[c.i * 110, c.j * 110, 0], [n.i * 110, n.j * 110, 0]]), { cls: 'ln faint draw', delay: 0.4 + c.dist * 0.35 });
    });
  });
  cells.sort((a, b) => (a.i + a.j) - (b.i + b.j));
  cells.forEach(c => {
    const hot = (c.i === 1 && c.j === -1) || (c.i === -2 && c.j === 1) || (c.i === 0 && c.j === 2);
    s += box({ x: c.i * 110 - 30, y: c.j * 110 - 30, w: 60, d: 60, h: c.h, faces: true, fc: 'fade', fdelay: 0.5 + c.dist * 0.35,
      cls: hot ? 'orf' : '', ec: hot ? 'ln draw or' : 'ln draw', delay: 0.3 + c.dist * 0.35, dd: 0.02 });
  });
  const left = g(g(links + s, { tr: T(500, 470, 0.62) }), { cls: 'drift' });
  const right = g(
    pth(d3([[-260, -260, 0], [260, -260, 0], [260, 260, 0], [-260, 260, 0], [-260, -260, 0]]), { cls: 'ln faint' }) +
    box({ x: -170, y: -170, w: 340, d: 340, h: 380, faces: true, cls: 'gyf', ec: 'ln' }),
    { tr: T(1440, 520, 0.68) });
  return pth('M960 90 V990', { cls: 'ln faint draw', delay: 0.1 }) + left + right;
};

/* 04 — dos caminos desde el mismo punto */
SCENES.twoPaths = () => {
  let s = '';
  s += pth('M250 540 H520', { cls: 'ln draw w3', delay: 0.4 });
  s += `<circle cx="250" cy="540" r="28" class="ln fade" style="--d:.1"/>` + dot(250, 540, 11, 'dot fade');
  // limitada: termina contra una pared gris
  s += pth('M520 540 L720 360 H1380', { cls: 'ln draw w3', step: 1, delay: 0.1 });
  s += g(
    poly('1390,130 1460,130 1460,480 1390,480', 'fc', 'fill:#9D9187') +
    poly('1390,130 1420,104 1490,104 1460,130', 'fc', 'fill:#B9ADA1') +
    poly('1460,130 1490,104 1490,454 1460,480', 'fc', 'fill:#857A71'),
    { cls: 'fade', step: 1, style: '--d:1.1' });
  s += g(dot(1380, 360, 9, 'dot'), { cls: 'fade', step: 1, style: '--d:1.3' });
  // builder: se abre en una estructura naranja
  s += pth('M520 540 L720 720 H1250', { cls: 'ln draw w3 or', step: 2, delay: 0.1 });
  let st = '';
  const mods = [
    { x: 0, y: 0, w: 120, d: 120, h: 120 }, { x: 120, y: 0, w: 120, d: 120, h: 60, skip: [5, 6] },
    { x: 0, y: 120, w: 120, d: 120, h: 60, skip: [3] }, { x: 0, y: 0, z: 120, w: 120, d: 120, h: 90, skip: [1, 7] },
    { x: 240, y: -60, w: 120, d: 120, h: 180, skip: [2, 4] }, { x: 120, y: 120, z: 60, w: 120, d: 120, h: 120, skip: [0, 8] },
  ];
  mods.forEach((m, i) => { st += box({ ...m, ec: 'ln draw or', delay: 1 + i * 0.12, dd: 0.025 }); });
  [[360, 0, 120, 520, -40, 240], [240, 240, 120, 360, 360, 160], [120, 0, 210, 220, -120, 330]]
    .forEach(([a, b, c, e, f, h2], i) => { st += pth(d3([[a, b, c], [e, f, h2]]), { cls: 'ln draw or', delay: 1.7 + i * 0.1 }); });
  s += g(st, { step: 2, tr: T(1430, 660, 0.82) });
  return s;
};

/* 05 — una herramienta compleja dentro de un plano sin terminar */
SCENES.tool = () => {
  let plan = '';
  plan += pth(d3([[-300, -300, 0], [300, -300, 0], [300, 300, 0], [-300, 300, 0], [-300, -300, 0]]), { cls: 'ln hid fade', delay: 0.2 });
  plan += pth(d3([[-300, 360, 0], [300, 360, 0]]), { cls: 'ln faint draw', delay: 0.4 });
  [-300, 300].forEach(x => { plan += pth(d3([[x, 340, 0], [x, 380, 0]]), { cls: 'ln faint draw', delay: 0.5 }); });
  [[[-300, -300, 0], [-300, -300, 220]], [[-300, -300, 220], [20, -300, 220]], [[300, -300, 0], [300, -300, 140]],
   [[-300, 300, 0], [-300, 300, 170]], [[-300, -300, 220], [-300, 80, 220]], [[300, -300, 140], [300, -60, 140]]]
    .forEach((e, i) => { plan += pth(d3(e), { cls: 'ln faint draw', delay: 0.5 + i * 0.12 }); });
  let t = '';
  t += box({ x: -120, y: -120, w: 240, d: 240, h: 240, faces: true, fc: 'fade', fdelay: 0.9, delay: 0.7 });
  for (let k = 1; k < 3; k++) {
    const q = -120 + k * 80, zz = k * 80;
    t += pth(d3([[120, q, 0], [120, q, 240]]), { cls: 'ln faint draw', delay: 1.1 });
    t += pth(d3([[q, 120, 0], [q, 120, 240]]), { cls: 'ln faint draw', delay: 1.1 });
    t += pth(d3([[120, -120, zz], [120, 120, zz], [-120, 120, zz]]), { cls: 'ln faint draw', delay: 1.15 });
    t += pth(d3([[q, -120, 240], [q, 120, 240]]), { cls: 'ln faint draw', delay: 1.2 });
    t += pth(d3([[-120, q, 240], [120, q, 240]]), { cls: 'ln faint draw', delay: 1.2 });
  }
  t += box({ x: 120, y: -60, z: 60, w: 70, d: 120, h: 90, faces: true, fc: 'fade', fdelay: 1.3, delay: 1.2 });
  t += box({ x: -40, y: 120, z: 140, w: 80, d: 60, h: 60, faces: true, fc: 'fade', fdelay: 1.3, delay: 1.3 });
  t += box({ x: -50, y: -50, z: 240, w: 100, d: 100, h: 80, faces: true, fc: 'fade', fdelay: 1.4, delay: 1.35 });
  t += pth(isoCircle(0, 0, 300, 220), { cls: 'ln faint draw', delay: 1.6 });
  t += pth(isoCircle(0, 0, 300, 170), { cls: 'ln faint draw', delay: 1.7 });
  t += pth(d3([[0, 0, 320], [0, 0, 420]]), { cls: 'ln draw', delay: 1.8 });
  const [ax, ay] = P(0, 0, 420);
  t += dot(ax, ay, 6, 'dot fade');
  const S = 0.85, cx = 1400, cy = 600;
  const link = `M760 905 H${cx} V${cy + 120 * S}`;
  let line = pth(link, { cls: 'ln draw or w3', step: 1, delay: 0.5 });
  line += g(dot(cx, cy + 120 * S, 10, 'dot or') + `<circle cx="${cx}" cy="${R(cy + 120 * S)}" r="22" class="ln or"/>` +
    [900, 1040, 1180].map(x => `<path class="ln or" d="M${x} 893 V917"/>`).join(''), { cls: 'fade', step: 1, style: '--d:1.4' });
  return g(plan + t, { tr: T(cx, cy, S) }) + line;
};

/* 06 — cinco niveles que se pueden reconfigurar */
SCENES.levels = () => {
  const S = 0.8, cx = 1180, cy = 640;
  const names = ['CREENCIAS', 'PREGUNTAS', 'DECISIONES', 'ACCIONES', 'RESULTADOS'];
  let s = '';
  [[-210, -210], [210, -210], [210, 210], [-210, 210]].forEach(([x, y], i) => {
    s += pth(d3([[x, y, 0], [x, y, 420]]), { cls: 'ln faint draw', delay: 0.2 + i * 0.05 });
  });
  names.forEach((n, i) => {
    const z = i * 90;
    s += box({ x: -210, y: -210, z, w: 420, d: 420, h: 60, ec: 'ln faint draw', hidden: true, delay: 0.3 + i * 0.1 });
    s += g(box({ x: -210, y: -210, z, w: 420, d: 420, h: 60, faces: true, ec: 'ln', cls: 'orf' }), { cls: 'lvl', step: i + 1, dim: i + 1 });
  });
  s += g(pth('M-410 -385 C -560 -300, -560 -120, -410 -40', { cls: 'ln draw or w3', delay: 0.2 }) +
    arrowHead(-410, -40, 0.35, 22, 'dot or fade', '--d:1.4'), { step: 6 });
  let labels = '';
  names.forEach((n, i) => {
    const y = cy - S * (i * 90 + 30), x0 = cx + S * 364;
    labels += g(`<path class="ln faint" d="M${R(x0 + 12)} ${R(y)} H${R(x0 + 70)}"/>` +
      txt(x0 + 90, y + 14, n, 'svgt'), { cls: 'lvl-lbl', step: i + 1, dim: i + 1 });
  });
  return g(s, { tr: T(cx, cy, S) }) + labels;
};

/* 08 — el hecho, la interpretación encima y los caminos al romperla */
SCENES.factWall = () => {
  let s = '';
  s += g(
    poly('420,720 1500,720 1590,650 510,650', 'fc t') +
    poly('1500,720 1590,650 1590,850 1500,920', 'fc r') +
    poly('420,720 1500,720 1500,920 420,920', 'fc l') +
    `<path class="ln" d="M420 720 H1500 V920 H420 Z M420 720 L510 650 H1590 L1500 720 M1590 650 V850 L1500 920"/>`,
    { cls: 'fade', style: '--d:.2' });
  // pared: fragmentos que encajan
  const r = rng(11), cols = 4, rows = 3, x0 = 470, y0 = 360, W = 1000, H = 330;
  const gp = [];
  for (let i = 0; i <= cols; i++) {
    gp[i] = [];
    for (let j = 0; j <= rows; j++) {
      const edgeX = i === 0 || i === cols, edgeY = j === 0 || j === rows;
      gp[i][j] = [x0 + (W / cols) * i + (edgeX ? 0 : (r() - 0.5) * 120), y0 + (H / rows) * j + (edgeY ? 0 : (r() - 0.5) * 70)];
    }
  }
  let shards = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const q = [gp[i][j], gp[i + 1][j], gp[i + 1][j + 1], gp[i][j + 1]];
    const mx = q.reduce((a, p) => a + p[0], 0) / 4, my = q.reduce((a, p) => a + p[1], 0) / 4;
    const tx = (mx - 970) * 0.45 + (r() - 0.5) * 80, ty = (my - 525) * 0.7 - 50 - r() * 90, rt = (r() - 0.5) * 50;
    const pp = q.map(p => p.map(R).join(',')).join(' ');
    shards += g(poly(pp, 'fc') + `<polygon class="ln" points="${pp}" style="fill:none"/>`,
      { cls: 'shard', style: `--tx:${R(tx)}px;--ty:${R(ty)}px;--rt:${R(rt)}deg` });
  }
  shards += g(poly('470,360 1470,360 1490,344 490,344', 'fc') + `<path class="ln" d="M470 360 L490 344 H1490 L1470 360"/>`,
    { cls: 'shard', style: '--tx:0px;--ty:-160px;--rt:-6deg' });
  shards += g(poly('1470,360 1490,344 1490,674 1470,690', 'fc') + `<path class="ln" d="M1490 344 V674 L1470 690"/>`,
    { cls: 'shard', style: '--tx:180px;--ty:-40px;--rt:14deg' });
  s += g(shards, { cls: 'shards fade', step: 1, stepAt: 2, style: '--d:.1' });
  // caminos posibles
  const ends = [[330, 270, 'Aprender'], [720, 170, 'Trabajar con alguien'], [1200, 170, 'Crear un prototipo'], [1590, 270, 'Apoyarse en herramientas']];
  let br = '';
  ends.forEach(([x, y, l], i) => {
    br += pth(`M1005 660 C1005 470, ${x} ${y + 200}, ${x} ${y}`, { cls: 'ln draw or w3', delay: 0.9 + i * 0.15 });
  });
  s += g(br, { step: 2 });
  ends.forEach(([x, y, l], i) => {
    s += g(dot(x, y, 9, 'dot or') + txt(x, y - 26, l, 'svgt', { anchor: 'middle' }), { cls: 'branch-lbl', step: 2, style: `--d:${sec(1.6 + i * 0.15)}` });
  });
  return s;
};

/* 09 / 10 — un espacio vacío esperando ser diseñado */
function room(cls, delay = 0) {
  const L = [
    'M70 70 H1850 V1010 H70 Z',
    'M560 300 H1360 V780 H560 Z',
    'M70 70 L560 300', 'M1850 70 L1360 300', 'M70 1010 L560 780', 'M1850 1010 L1360 780',
    'M760 780 L515 1010', 'M960 780 V1010', 'M1160 780 L1405 1010', 'M347 880 H1573',
  ];
  return L.map((d, i) => pth(d, { cls, delay: delay + i * 0.08 })).join('');
}
SCENES.timer = () =>
  room('ln faint draw', 0.1) +
  `<circle class="tm-ring tm-track" cx="960" cy="540" r="205"/>` +
  `<circle class="tm-ring tm-prog" cx="960" cy="540" r="205" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="0" transform="rotate(-90 960 540)" data-timer-ring/>`;
SCENES.ignite = () => {
  const L = ['M70 70 L560 300', 'M1850 70 L1360 300', 'M70 1010 L560 780', 'M1850 1010 L1360 780',
    'M70 70 H1850', 'M70 1010 H1850', 'M560 300 H1360', 'M560 780 H1360', 'M960 780 V1010'];
  return room('ln draw or w2', 0) + L.map((d, i) => pth(d, { cls: 'spark', style: `--d:${sec(0.7 + i * 0.12)};` })).join('');
};

/* 12 — del boceto al prototipo, y el circuito del builder */
SCENES.builder = () => {
  const M = {
    base: { x: -220, y: -220, w: 440, d: 440, h: 24 },
    A: { x: -220, y: -220, z: 24, w: 200, d: 440, h: 170 },
    D: { x: -220, y: -120, z: 194, w: 200, d: 200, h: 110 },
    B: { x: -20, y: -220, z: 24, w: 240, d: 200, h: 280 },
    C: { x: -20, y: -20, z: 24, w: 240, d: 240, h: 110 },
    E: { x: -20, y: -220, z: 304, w: 120, d: 120, h: 90 },
  };
  const order = ['base', 'A', 'D', 'B', 'C'];
  let sketch = '', wire = '', solid = '';
  order.forEach(k => { sketch += box({ ...M[k], ec: 'ln sketch', hidden: true }); });
  order.forEach((k, i) => { wire += box({ ...M[k], delay: 0.1 + i * 0.15, dd: 0.02 }); });
  order.forEach(k => {
    solid += k === 'D'
      ? g(box({ ...M[k], faces: true, ec: 'ln', cls: 'orf' }), { cls: 'lvl', step: 3, dim: 3 })
      : box({ ...M[k], faces: true, ec: 'ln', cls: 'cbf' });
  });
  let s = g(sketch, { cls: 'fade stg', step: 1, dim: 1 });
  s += g(wire, { step: 2 });
  s += g(solid, { cls: 'fade', step: 3 });
  s += g(box({ ...M.E, faces: true, ec: 'ln or', cls: 'orf', delay: 0.2 }), { cls: 'fade', step: 4 });
  let st = '';
  const xs = [300, 740, 1180, 1620], names = ['PROBLEMA', 'HIPÓTESIS', 'EXPERIMENTO', 'APRENDIZAJE'];
  xs.forEach((x, i) => {
    if (i) st += g(pth(`M${xs[i - 1] + 40} 880 H${x - 40}`, { cls: 'ln draw', delay: 0 }) + arrowHead(x - 40, 880, 0, 14, 'dot fade', '--d:.5'), { step: i + 1 });
    st += g(dot(x, 880, 14, 'dot or') + `<circle cx="${x}" cy="880" r="26" class="ln faint"/>` + txt(x, 945, names[i], 'svgs', { anchor: 'middle' }),
      { cls: 'fade station stg', step: i + 1, dim: i + 1 });
  });
  st += pth('M1650 880 C1790 880, 1790 1010, 1620 1010 H300 C130 1010, 130 880, 270 880', { cls: 'ln draw or', step: 4, delay: 0.6 });
  return g(s, { tr: T(1400, 500, 0.78) }) + st;
};

/* 13 — cuatro columnas que sostienen una estructura común */
SCENES.columns = () => {
  // planta girada 36°: las columnas muestran frente, costado y techo
  const PHI = Math.PI * 0.2, cf = Math.cos(PHI), sf = Math.sin(PHI);
  const rr = (u, v) => [u * cf + v * sf, -u * sf + v * cf];
  const rect = (u0, u1, v0, v1) => [rr(u0, v0), rr(u1, v0), rr(u1, v1), rr(u0, v1)];
  const S = 0.8, us = [0, 380, 760, 1140];
  const [mx, my] = P(...rr(570, 0));
  const tx = 960 - S * mx, ty = 600 - S * my;
  let s = prism(rect(-150, 1290, -100, 100), 0, 46, { delay: 0.2, dd: 0.04 });
  us.forEach((u, i) => {
    s += g(prism(rect(u - 55, u + 55, -55, 55), 46, 420, { ec: 'ln' }), { cls: 'col grow', step: i + 1, dim: i + 1 });
  });
  s += g(prism(rect(-150, 1290, -100, 100), 466, 40, { ec: 'ln' }), { cls: 'fade', step: 5 });
  let lbl = '';
  const caps = [['CURIOSIDAD', 'Hacer mejores', 'preguntas.'], ['CRITERIO', 'Evaluar antes', 'de creer.'],
    ['APRENDIZAJE', 'Avanzar sin', 'saberlo todo.'], ['EJECUCIÓN', 'Convertir ideas', 'en evidencia.']];
  us.forEach((u, i) => {
    const [px, py] = P(...rr(u, 100));
    const x = tx + S * px, y = ty + S * py;
    lbl += g(txt(x, y + 84, caps[i][0], 'svgt', { anchor: 'middle' }) +
      txt(x, y + 128, caps[i][1], 'svgb', { anchor: 'middle' }) + txt(x, y + 162, caps[i][2], 'svgb', { anchor: 'middle' }),
      { cls: 'col-lbl', step: i + 1 });
  });
  return g(g(s, { tr: T(tx, ty, S) }) + lbl, { cls: 'cam' });
};

/* 14 — el laberinto de antes / el prototipo de ahora */
SCENES.rules = () => {
  const r = rng(5), X0 = 150, Y0 = 130, C = 90, NC = 8, NR = 6;
  let m = pth(`M${X0} ${Y0} H${X0 + C * NC} V${Y0 + C * NR} H${X0} Z`, { cls: 'ln draw', delay: 0.1 });
  let k = 0;
  const walls = [];
  for (let i = 0; i < NC; i++) for (let j = 0; j < NR; j++) {
    const x = X0 + i * C, y = Y0 + j * C;
    if (i < NC - 1 && r() < 0.5) walls.push(`M${x + C} ${y} V${y + C}`);
    if (j < NR - 1 && r() < 0.5) walls.push(`M${x} ${y + C} H${x + C}`);
  }
  walls.forEach(d => { m += pth(d, { cls: 'ln draw', delay: 0.2 + (k++) * 0.012 }); });
  // puertas cerradas
  [[2, 1], [5, 0], [1, 4], [6, 3], [3, 5], [4, 2]].forEach(([i, j], n) => {
    const x = X0 + i * C + C, y = Y0 + j * C + C / 2;
    m += g(`<rect x="${x - 7}" y="${y - 24}" width="14" height="48" rx="2" class="fc" style="fill:var(--gris)"/>` +
      `<path class="ln w2" d="M${x - 16} ${y - 10} L${x + 16} ${y + 10} M${x + 16} ${y - 10} L${x - 16} ${y + 10}"/>`,
      { cls: 'fade', style: `--d:${sec(0.8 + n * 0.08)}` });
  });
  // muchos pasos
  const route = [[0, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [3, 2], [3, 3], [3, 4], [4, 4], [5, 4], [5, 3], [6, 3], [6, 2], [7, 2], [7, 3], [7, 4], [7, 5]];
  route.forEach(([i, j], n) => { m += dot(X0 + i * C + C / 2, Y0 + j * C + C / 2, 4, 'dot fade', `--d:${sec(1 + n * 0.05)}`); });
  const right = [
    { x: -170, y: -40, w: 110, d: 110, h: 80 }, { x: 0, y: -170, w: 110, d: 110, h: 130 }, { x: 20, y: 40, w: 110, d: 110, h: 60 },
  ];
  let p = '';
  p += box({ x: 190, y: -60, w: 90, d: 90, h: 90, ec: 'ln sketch', lines: true });
  right.forEach((b, i) => { p += box({ ...b, faces: true, fc: 'fade', fdelay: 0.3, delay: 0.1 + i * 0.12 }); });
  p += box({ x: 200, y: -70, z: 120, w: 90, d: 90, h: 90, faces: true, cls: 'blf', fc: 'fade', fdelay: 0.6, ec: 'ln draw bl', delay: 0.5 });
  const tops = [[-115, 15, 80], [55, -115, 130], [75, 95, 60], [245, -25, 120]];
  [[0, 1], [1, 2], [0, 2], [2, 3], [1, 3]].forEach(([a, b], i) => {
    p += pth(d3([tops[a], tops[b]]), { cls: 'ln draw bl w2', delay: 0.9 + i * 0.12 });
  });
  tops.forEach(([x, y, z], i) => { const [a, b] = P(x, y, z); p += dot(a, b, 8, 'dot bl fade', `--d:${sec(1.2 + i * 0.08)}`); });
  return pth('M960 120 V980', { cls: 'ln faint draw' }) + m + g(g(p, { tr: T(1400, 440, 1.05) }), { step: 1 });
};

/* 15 — humano → IA → humano */
SCENES.equation = () => {
  const y = 650, X = [330, 960, 1590], r = 80;
  let s = '';
  s += g(dot(X[0], y, r, 'dot') + dot(X[0], y, 14, 'dot or'), { cls: 'fade', step: 1 });
  s += g(txt(X[0], y + 150, 'TÚ DEFINES', 'svgt', { anchor: 'middle' }) + txt(X[0], y + 196, 'EL PROBLEMA.', 'svgt', { anchor: 'middle' }), { cls: 'node-lbl', step: 1 });
  s += g(pth(`M${X[0] + r + 12} ${y} H${X[1] - r - 22}`, { cls: 'ln draw w2' }) + arrowHead(X[1] - r - 16, y, 0, 18, 'dot fade', '--d:.6'), { step: 2 });
  // abanico de posibilidades
  const rr = rng(21);
  let fan = '';
  const angs = [];
  for (let i = 0; i < 17; i++) angs.push(-165 + i * (130 / 16) + (rr() - 0.5) * 6);
  [12, 28, 44].forEach(a => angs.push(a));
  angs.forEach((a, i) => {
    const t = a * Math.PI / 180, len = a > 0 ? 130 + rr() * 50 : 170 + rr() * 120;
    const x1 = X[1] + Math.cos(t) * (r + 8), y1 = y + Math.sin(t) * (r + 8), x2 = X[1] + Math.cos(t) * (r + len), y2 = y + Math.sin(t) * (r + len);
    fan += pth(`M${R(x1)} ${R(y1)} L${R(x2)} ${R(y2)}`, { cls: 'ln draw bl', delay: 0.5 + i * 0.04 }) + dot(x2, y2, 6, 'dot bl fade', `--d:${sec(0.9 + i * 0.04)}`);
  });
  const sa = -18 * Math.PI / 180, sx = X[1] + Math.cos(sa) * (r + 250), sy = y + Math.sin(sa) * (r + 250);
  fan += pth(`M${R(X[1] + Math.cos(sa) * (r + 8))} ${R(y + Math.sin(sa) * (r + 8))} L${R(sx)} ${R(sy)}`, { cls: 'ln draw bl', delay: 1.2 });
  s += g(dot(X[1], y, r, 'dot bl') + `<circle cx="${X[1]}" cy="${y}" r="${r + 22}" class="ln bl" style="opacity:.35"/>`, { cls: 'fade', step: 2 });
  s += g(fan, { step: 2 });
  s += g(txt(X[1], y + 150, 'LA IA TE AYUDA', 'svgt', { anchor: 'middle' }) + txt(X[1], y + 196, 'A EXPLORAR.', 'svgt', { anchor: 'middle' }), { cls: 'node-lbl', step: 2 });
  // la decisión vuelve a manos humanas
  s += g(pth(`M${R(sx)} ${R(sy)} C${R(sx + 160)} ${R(sy - 20)}, ${X[2] - 200} ${y}, ${X[2] - r - 22} ${y}`, { cls: 'ln draw or w3', delay: 0.3 }) +
    dot(sx, sy, 10, 'dot or fade', '--d:.1') + arrowHead(X[2] - r - 16, y, 0, 20, 'dot or fade', '--d:1.2'), { step: 3 });
  s += g(dot(X[2], y, r, 'dot') + `<circle cx="${X[2]}" cy="${y}" r="${r - 4}" class="ln or" style="stroke-width:7"/>` + dot(X[2], y, 14, 'dot or'), { cls: 'fade', step: 3, style: '--d:.9' });
  s += g(txt(X[2], y + 150, 'TÚ VALIDAS', 'svgt', { anchor: 'middle' }) + txt(X[2], y + 196, 'Y DECIDES.', 'svgt', { anchor: 'middle' }), { cls: 'node-lbl', step: 3 });
  return s;
};

/* 16 — una pregunta genérica / una pregunta con estructura */
SCENES.prompts = () => {
  let s = '';
  [[120, 486, 360], [120, 522, 270], [120, 558, 320]].forEach(([x, y, w], i) => {
    s += `<rect x="${x}" y="${y}" width="${w}" height="14" rx="7" class="fade" style="fill:var(--ink2);--d:${sec(1.1 + i * 0.12)}"/>`;
  });
  const nodes = [[1010, 'PROBLEMA'], [1330, 'HIPÓTESIS'], [1650, 'EXPERIMENTO']];
  let c = '';
  nodes.forEach(([x], i) => { c += pth(`M1330 640 C1330 720, ${x} 700, ${x} 770`, { cls: 'ln draw bl w2', delay: 0.1 + i * 0.15 }); });
  nodes.forEach(([x, l], i) => {
    c += g(g(box({ x: -40, y: -40, w: 80, d: 80, h: 50, faces: true, cls: 'blf', ec: 'ln bl' }), { tr: T(x, 800, 1) }) +
      txt(x, 900, l, 'svgs', { anchor: 'middle', size: 22 }), { cls: 'fade', style: `--d:${sec(0.7 + i * 0.15)}` });
    if (i) c += pth(`M${nodes[i - 1][0] + 100} 830 H${x - 100}`, { cls: 'ln faint draw', delay: 1.1 });
  });
  s += g(c, { step: 2 });
  return s;
};

/* 17 — cuatro espacios conectados a un núcleo */
SCENES.roles = () => {
  const cx = 960, cy = 540;
  let s = '';
  s += `<circle cx="${cx}" cy="${cy}" r="150" class="ln bl fade" style="opacity:.25"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="100" class="ln bl fade" style="opacity:.45"/>`;
  s += dot(cx, cy, 56, 'dot bl');
  const spaces = [
    [780, 330, () => [0, 1, 2, 3].map(i => box({ x: i * 45 - 90, y: -50, w: 45, d: 100, h: 30 + i * 32, faces: true, ec: 'ln' })).join('')],
    [1140, 330, () => box({ x: -90, y: -60, w: 16, d: 120, h: 130, faces: true, ec: 'ln' }) +
      box({ x: 70, y: -60, w: 16, d: 120, h: 130, faces: true, ec: 'ln' }) +
      pth(d3([[-74, 0, 70], [70, 0, 70]]), { cls: 'ln bl w2' })],
    [780, 760, () => box({ x: -80, y: -80, w: 160, d: 160, h: 24, faces: true, ec: 'ln' }) +
      box({ x: -60, y: -60, z: 24, w: 70, d: 70, h: 70, faces: true, ec: 'ln' }) +
      box({ x: 20, y: -30, z: 24, w: 50, d: 50, h: 110, faces: true, ec: 'ln' }) +
      box({ x: -60, y: 20, z: 24, w: 60, d: 60, h: 50, ec: 'ln sketch' })],
    [1140, 760, () => {
      let a = box({ x: -40, y: -90, w: 80, d: 180, h: 170, ec: 'ln' });
      [55, 110].forEach(z => { a += pth(d3([[40, -90, z], [40, 90, z], [-40, 90, z]]), { cls: 'ln' }); });
      [[-90, 0], [-30, 0], [30, 55], [-90, 110], [0, 110]].forEach(([y0, z0]) => {
        a += box({ x: -20, y: y0 + 8, z: z0, w: 40, d: 40, h: 34, faces: true, ec: 'ln' });
      });
      return a;
    }],
  ];
  spaces.forEach(([x, y, draw], i) => {
    const ang = Math.atan2(y - cy, x - cx);
    const x1 = cx + Math.cos(ang) * 62, y1 = cy + Math.sin(ang) * 62, x2 = x - Math.cos(ang) * 120, y2 = y - Math.sin(ang) * 120;
    s += g(pth(`M${R(x1)} ${R(y1)} L${R(x2)} ${R(y2)}`, { cls: 'ln bl draw' }) + dot(x2, y2, 6, 'dot bl') +
      g(draw(), { tr: T(x, y + 50, 0.95) }), { cls: 'space', step: i + 1, role: i + 1, inter: true });
  });
  return s;
};

/* 18 — movimiento vs. dirección */
SCENES.speed = () => {
  const ox = 250, oy = 570, r = rng(3);
  let a = '';
  for (let i = 0; i < 30; i++) {
    const t = (-150 + r() * 300) * Math.PI / 180;
    let len = 200 + r() * 700;
    const lim = [Math.cos(t) > 0 ? (1840 - ox) / Math.cos(t) : (ox - 70) / -Math.cos(t),
      Math.sin(t) > 0 ? (870 - oy) / Math.sin(t) : (oy - 250) / -Math.sin(t)];
    len = Math.max(110, Math.min(len, ...lim.filter(v => v > 0)));
    const x2 = ox + Math.cos(t) * len, y2 = oy + Math.sin(t) * len, d = 0.1 + i * 0.045;
    a += pth(`M${ox + Math.cos(t) * 24} ${R(oy + Math.sin(t) * 24)} L${R(x2)} ${R(y2)}`, { cls: 'ln draw fast bl w2', delay: d });
    a += arrowHead(x2, y2, t, 16, 'dot bl ahead', `--d:${sec(d)}`);
  }
  let s = g(a, { cls: 'arrows', dim: 0 });
  s += dot(ox, oy, 12, 'dot');
  s += pth(`M${ox} ${oy} C 640 ${oy}, 820 470, 1160 492 S 1540 540, 1620 540`, { cls: 'ln draw slow or w3', step: 1, delay: 0.1 });
  s += g(`<circle cx="1660" cy="540" r="40" class="ln or w2"/><circle cx="1660" cy="540" r="74" class="ln or" style="opacity:.5"/>` +
    dot(1660, 540, 12, 'dot or'), { cls: 'fade', step: 1, style: '--d:2' });
  return s;
};

/* 19 — idea → supuesto → prueba → señal → decisión */
SCENES.build = () => {
  const xs = [240, 600, 960, 1320, 1680], names = ['IDEA', 'SUPUESTO', 'PRUEBA', 'SEÑAL', 'DECISIÓN'];
  const piece = () => box({ x: -70, y: -70, w: 140, d: 140, h: 140, faces: true, ec: 'ln' });
  const probe = (cls = 'orf', ec = 'ln') => box({ x: 70, y: -30, w: 60, d: 60, h: 60, faces: true, cls, ec });
  const [mx, my] = P(100, 0, 60);
  const arcs = [34, 58, 82].map((rr, i) => pth(`M${R(mx - rr)} ${R(my - 18)} A ${rr} ${rr} 0 0 1 ${R(mx + rr)} ${R(my - 18)}`, { cls: 'ln draw or w2', delay: 0.3 + i * 0.2 })).join('');
  const glyphs = [
    box({ x: -70, y: -70, w: 140, d: 140, h: 140, ec: 'ln sketch', hidden: true }),
    piece(),
    piece() + probe(),
    piece() + probe() + arcs,
    box({ x: -70, y: -70, w: 140, d: 140, h: 140, faces: true, cls: 'cbf', ec: 'ln' }) +
      box({ x: 70, y: -30, w: 60, d: 60, h: 60, faces: true, cls: 'cbf', ec: 'ln' }) +
      box({ x: -30, y: -30, z: 140, w: 60, d: 60, h: 60, ec: 'ln sketch' }),
  ];
  let s = '';
  xs.forEach((x, i) => {
    s += g(g(glyphs[i], { tr: T(x - 20, 600, 0.95) }), { cls: 'fade', step: i + 1 });
    s += g(txt(x, 850, names[i], 'svgt', { anchor: 'middle' }), { cls: 'stage-lbl', step: i + 1 });
    if (i) s += g(pth(`M${xs[i - 1] + 110} 838 H${x - 110}`, { cls: 'ln draw' }) + arrowHead(x - 110, 838, 0, 14, 'dot fade', '--d:.5'), { step: i + 1 });
  });
  return s;
};

/* 20 — storyboard: idea, pared, puerta, prototipo */
SCENES.story = () => {
  const cxs = [300, 735, 1170, 1605], cy = 420, S = 0.82;
  let s = '';
  [517, 952, 1387].forEach(x => { s += pth(`M${x} 190 V930`, { cls: 'ln faint draw', delay: 0.2 }); });
  const wallBox = (o = {}) => box({ x: -20, y: -120, w: 40, d: 240, h: 200, faces: true, cls: 'gyf', ec: 'ln', ...o });
  const scenes = [
    pth(isoCircle(0, 0, 0, 120), { cls: 'ln sketch' }) +
      box({ x: -50, y: -50, z: 40, w: 100, d: 100, h: 100, ec: 'ln sketch', hidden: true }) +
      [[-130, 40, 150], [90, -120, 190], [120, 90, 70], [-60, -150, 110]].map(([x, y, z]) => { const [a, b] = P(x, y, z); return dot(a, b, 5, 'dot'); }).join(''),
    wallBox() + person(130, 20),
    box({ x: -20, y: -120, w: 40, d: 90, h: 200, faces: true, cls: 'gyf', ec: 'ln' }) +
      box({ x: -20, y: -30, z: 150, w: 40, d: 60, h: 50, faces: true, cls: 'gyf', ec: 'ln' }) +
      poly(pts([[20, 30, 0], [70, 72, 0], [70, 72, 150], [20, 30, 150]]), 'fc', 'fill:#FF5A00') +
      box({ x: -20, y: 30, w: 40, d: 90, h: 200, faces: true, cls: 'gyf', ec: 'ln' }) +
      `<polygon class="ln or w2" style="fill:rgba(255,90,0,.12)" points="${pts([[20, -30, 0], [20, 30, 0], [20, 30, 150], [20, -30, 150]])}"/>` +
      person(150, 0),
    (() => {
      let a = '';
      const ppl = [0, 1, 2, 3, 4].map(i => { const t = (-0.15 + i * 0.32) * Math.PI; return [Math.cos(t) * 160 + 20, Math.sin(t) * 160 + 20]; });
      ppl.forEach(([x, y]) => { a += pth(d3([[x, y, 30], [0, 0, 30]]), { cls: 'ln faint' }); });
      a += box({ x: -45, y: -45, w: 90, d: 90, h: 60, faces: true, cls: 'orf', ec: 'ln or' });
      ppl.forEach(([x, y]) => { a += person(x, y); });
      return a;
    })(),
  ];
  scenes.forEach((sc, i) => {
    s += g(g(sc, { tr: T(cxs[i], cy, S) }), { cls: 'fade', step: i ? i : null, style: i ? '--d:.1' : '--d:.4' });
  });
  return s;
};

/* 21 — el plano vacío que se llena módulo a módulo */
SCENES.challenge = () => {
  let s = floorGrid(0, 0, 480, 480, 60, { delay: 0.1, dd: 0.04 });
  const M = [
    [{ x: 60, y: 60, w: 360, d: 360, h: 40 }, 1],
    [{ x: 60, y: 60, z: 40, w: 180, d: 360, h: 140 }, 2],
    [{ x: 60, y: 60, z: 180, w: 180, d: 180, h: 100 }, 5],
    [{ x: 240, y: 60, z: 40, w: 180, d: 180, h: 220 }, 3],
    [{ x: 240, y: 240, z: 40, w: 180, d: 180, h: 80 }, 4],
  ];
  M.forEach(([b, n]) => { s += g(box({ ...b, faces: true, cls: 'orf', delay: 0.1 }), { cls: 'mod', step: n, dim: n }); });
  s += g(box({ x: 270, y: 270, z: 170, w: 120, d: 120, h: 90, ec: 'ln sketch', hidden: true }), { cls: 'fade', step: 6, style: '--d:.4' });
  const tags = [[240, 420, 40, 1], [60, 240, 180, 2], [420, 150, 260, 3], [420, 330, 120, 4], [150, 150, 280, 5]];
  tags.forEach(([x, y, z, n]) => {
    const [a, b] = P(x, y, z);
    s += g(dot(a, b, 22, 'dot') + txt(a, b + 10, n, 'svgt', { anchor: 'middle', fill: 'var(--crema)' }), { cls: 'mod-n', step: n });
  });
  const [vx, vy] = P(330, 330, 300);
  s += g(txt(vx, vy, 'v1', 'svgt', { anchor: 'middle', size: 48, fill: 'var(--naranja)' }), { cls: 'fade', step: 6, style: '--d:.8' });
  return g(s, { tr: T(1380, 360, 1) });
};

/* =========================================================
   MOTOR
   ========================================================= */
const stage = document.getElementById('stage');
const slides = [...stage.querySelectorAll('.slide')];
const params = new URLSearchParams(location.search);
const MODE = params.has('presenter') ? 'presenter' : params.has('embed') ? 'embed' : 'main';
document.body.classList.add(MODE);

slides.forEach(s => {
  s.querySelectorAll('svg[data-scene]').forEach(svg => { const f = SCENES[svg.dataset.scene]; if (f) svg.innerHTML = f(); });
  let m = 0;
  s.querySelectorAll('[data-step],[data-at]').forEach(el => { m = Math.max(m, +(el.dataset.step || 0), +(el.dataset.at || 0)); });
  s.maxStep = m;
});

let cur = -1, step = 0;
const leaving = new Map();
const onRender = [];

function reset(s) {
  s.classList.remove('is-active');
  s.querySelectorAll('.on,.at,.dim,.sel').forEach(el => el.classList.remove('on', 'at', 'dim', 'sel'));
  const cam = s.querySelector('.cam'); if (cam) cam.style.transform = '';
}

const HOOKS = {
  s13(s, k) {
    const cam = s.querySelector('.cam');
    if (cam) cam.style.transform = `translate(${-k * 16}px, ${k * 5}px) scale(${1 + k * 0.012})`;
  },
  s17(s, k) { selectRole(s, Math.min(k, 4)); },
};

function selectRole(s, n) {
  s.querySelectorAll('[data-role]').forEach(el => el.classList.toggle('sel', +el.dataset.role === n));
}

function apply() {
  slides.forEach((s, i) => {
    if (i === cur) {
      clearTimeout(leaving.get(s));
      s.classList.add('is-shown', 'is-active');
    } else if (s.classList.contains('is-shown')) {
      s.classList.remove('is-shown');
      leaving.set(s, setTimeout(() => reset(s), 900));
    }
  });
  const s = slides[cur];
  s.querySelectorAll('[data-step]').forEach(el => el.classList.toggle('on', +el.dataset.step <= step));
  s.querySelectorAll('[data-at]').forEach(el => el.classList.toggle('at', step >= +el.dataset.at));
  s.querySelectorAll('[data-dim-after]').forEach(el => el.classList.toggle('dim', step > +el.dataset.dimAfter));
  HOOKS[s.id]?.(s, step);
  onRender.forEach(f => f());
}

function go(n, k = 0, { silent = false } = {}) {
  n = Math.max(0, Math.min(slides.length - 1, n | 0));
  k = Math.max(0, Math.min(slides[n].maxStep, k | 0));
  if (n === cur && k === step) return;
  cur = n; step = k;
  apply();
  if (MODE !== 'embed') history.replaceState(null, '', `#${cur + 1}${step ? '.' + step : ''}`);
  if (!silent) send({ type: 'goto', n: cur, s: step });
}
function next() {
  if (step < slides[cur].maxStep) go(cur, step + 1);
  else if (cur < slides.length - 1) go(cur + 1, 0);
}
function prev() {
  if (step > 0) go(cur, step - 1);
  else if (cur > 0) go(cur - 1, slides[cur - 1].maxStep);
}
function nextState() {
  if (step < slides[cur].maxStep) return [cur, step + 1];
  if (cur < slides.length - 1) return [cur + 1, 0];
  return null;
}

/* ---------- escala 16:9 ---------- */
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(${-960 * k}px, ${-540 * k}px) scale(${k})`;
}
addEventListener('resize', fit);
fit();

/* ---------- mensajería entre ventanas ---------- */
const chan = MODE !== 'embed' && 'BroadcastChannel' in window ? new BroadcastChannel('ignite-build') : null;
let popup = null;
function send(msg) {
  if (MODE === 'embed') return;
  chan?.postMessage(msg);
  try { if (window.opener && !window.opener.closed) window.opener.postMessage({ ...msg, _ib: 1 }, '*'); } catch (e) {}
  try { if (popup && !popup.closed) popup.postMessage({ ...msg, _ib: 1 }, '*'); } catch (e) {}
}
function onMsg(m) {
  if (!m || typeof m !== 'object') return;
  if (m.type === 'goto') go(m.n, m.s, { silent: true });
  else if (m.type === 'timer') timerSet(m.t, true);
}
if (chan) chan.onmessage = e => onMsg(e.data);
addEventListener('message', e => {
  if (MODE === 'embed' ? e.source === window.parent : e.data?._ib) onMsg(e.data);
});

/* ---------- temporizador de 60 s (diapositiva 09) ---------- */
const TOTAL = 60000;
let TM = { running: false, remaining: TOTAL, endAt: 0 };
const tLeft = () => (TM.running ? Math.max(0, TM.endAt - Date.now()) : TM.remaining);
const s09 = document.getElementById('s09');
const tCount = s09.querySelector('[data-timer-count]');
const tRing = s09.querySelector('[data-timer-ring]');
let tRaf = 0;

function timerSet(t, remote = false) {
  TM = { ...t };
  if (!remote) send({ type: 'timer', t: TM });
  onTimer.forEach(f => f());
  timerDraw();
}
const onTimer = [];
function timerToggle() {
  if (TM.running) timerSet({ running: false, remaining: tLeft(), endAt: 0 });
  else {
    let r = tLeft(); if (r <= 0) r = TOTAL;
    timerSet({ running: true, remaining: r, endAt: Date.now() + r });
  }
}
function timerReset() { timerSet({ running: false, remaining: TOTAL, endAt: 0 }); }
function timerLabel() {
  const r = tLeft();
  return TM.running ? 'Pausar' : r <= 0 ? 'Otra vez' : r < TOTAL ? 'Seguir' : 'Iniciar';
}
function timerDraw() {
  cancelAnimationFrame(tRaf);
  const r = tLeft();
  if (TM.running && r <= 0) TM = { running: false, remaining: 0, endAt: 0 };
  tCount.textContent = Math.ceil(r / 1000);
  tRing.setAttribute('stroke-dashoffset', R((1 - r / TOTAL) * 1000) / 1000);
  s09.classList.toggle('tm-done', r <= 0);
  s09.querySelector('[data-timer="toggle"]').textContent = timerLabel();
  if (TM.running) tRaf = requestAnimationFrame(timerDraw);
}
document.querySelectorAll('[data-timer]').forEach(b => b.addEventListener('click', e => {
  e.stopPropagation();
  if (b.dataset.timer === 'toggle') timerToggle(); else timerReset();
  b.blur();
}));

/* ---------- roles clicables (diapositiva 17) ---------- */
const s17 = document.getElementById('s17');
s17.querySelectorAll('[data-role]').forEach(el => el.addEventListener('click', e => {
  e.stopPropagation();
  if (el.classList.contains('on')) selectRole(s17, +el.dataset.role);
}));

/* ---------- notas ---------- */
function notesHTML(i) {
  const s = slides[i], n = s.querySelector('.notes');
  return `<h3>${String(i + 1).padStart(2, '0')} · ${s.dataset.title}<span>${n?.dataset.time || ''}</span></h3>${n ? n.innerHTML : ''}`;
}

/* =========================================================
   MODO NORMAL
   ========================================================= */
if (MODE === 'main') {
  const bar = document.querySelector('#progress span');
  const counter = document.getElementById('counter');
  const panel = document.getElementById('notes-panel');
  onRender.push(() => {
    bar.style.width = `${((cur + (slides[cur].maxStep ? step / slides[cur].maxStep : 1)) / slides.length) * 100}%`;
    counter.textContent = `${String(cur + 1).padStart(2, '0')} / ${slides.length}`;
    if (!panel.hidden) panel.innerHTML = notesHTML(cur);
  });

  const toggleNotes = () => { panel.hidden = !panel.hidden; if (!panel.hidden) panel.innerHTML = notesHTML(cur); };
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const presenter = () => {
    popup = window.open(`${location.pathname}?presenter#${cur + 1}.${step}`, 'ignite-presenter', 'width=1400,height=860');
  };
  const cmds = { prev, next, notes: toggleNotes, fullscreen, presenter };
  document.querySelectorAll('#controls [data-cmd]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); cmds[b.dataset.cmd](); b.blur();
  }));

  stage.addEventListener('click', e => {
    if (e.target.closest('button,a,[data-interactive]')) return;
    next();
  });

  let idle;
  const wake = () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add('idle'), 2600); };
  addEventListener('mousemove', wake); wake();

  keyboard({ notes: toggleNotes, fullscreen, presenter });
}

/* =========================================================
   MODO PRESENTADORA
   ========================================================= */
let frames = [];
if (MODE === 'presenter') {
  document.title = 'Presentadora — Architect Your Mind';
  const pv = document.createElement('div');
  pv.className = 'pv';
  pv.innerHTML = `
    <header>
      <b data-pv="title"></b><span data-pv="count"></span>
      <span class="grow1"></span>
      <span>Charla <span class="clock elapsed" data-pv="elapsed">00:00</span></span>
      <span class="clock" data-pv="clock"></span>
    </header>
    <div class="pv-cur"><div class="pv-frame"><iframe title="Diapositiva actual" data-pv="cur"></iframe></div></div>
    <div class="pv-side">
      <span class="tag">Siguiente</span>
      <div class="pv-frame"><iframe title="Siguiente diapositiva" data-pv="next"></iframe></div>
      <div class="pv-notes" data-pv="notes"></div>
    </div>
    <footer>
      <button type="button" data-pv="prev">← Anterior</button>
      <button type="button" class="pri" data-pv="next">Siguiente →</button>
      <button type="button" data-pv="talk">Iniciar charla</button>
      <button type="button" data-pv="talkreset">Reiniciar reloj</button>
      <span class="sep"></span>
      <button type="button" data-pv="timer" hidden></button>
      <button type="button" data-pv="timerreset" hidden>Reiniciar 60 s</button>
      <span class="hint">← → avanzar · T temporizador · números + Enter para saltar</span>
    </footer>`;
  document.body.append(pv);
  const $ = k => pv.querySelector(`[data-pv="${k}"]`);
  const fCur = $('cur'), fNext = $('next');
  frames = [fCur, fNext];
  const src = `${location.pathname}?embed`;
  fCur.src = src; fNext.src = src;

  const post = (f, msg) => { try { f.contentWindow?.postMessage(msg, '*'); } catch (e) {} };
  const syncFrames = () => {
    if (cur < 0) return;
    post(fCur, { type: 'goto', n: cur, s: step });
    const ns = nextState();
    if (ns) post(fNext, { type: 'goto', n: ns[0], s: ns[1] });
    fNext.style.visibility = ns ? 'visible' : 'hidden';
    post(fCur, { type: 'timer', t: TM });
  };
  [fCur, fNext].forEach(f => f.addEventListener('load', syncFrames));
  onTimer.push(() => post(fCur, { type: 'timer', t: TM }));

  const tBtn = $('timer'), tRst = $('timerreset');
  onRender.push(() => {
    $('title').textContent = slides[cur].dataset.title;
    $('count').textContent = `${String(cur + 1).padStart(2, '0')} / ${slides.length}${slides[cur].maxStep ? ` · paso ${step}/${slides[cur].maxStep}` : ''}`;
    $('notes').innerHTML = notesHTML(cur);
    const onTimerSlide = slides[cur].id === 's09';
    tBtn.hidden = tRst.hidden = !onTimerSlide;
    syncFrames();
  });
  const tLabel = () => { tBtn.textContent = `${timerLabel()} 60 s · ${Math.ceil(tLeft() / 1000)}`; };
  setInterval(tLabel, 250);

  let talkStart = 0, talkAcc = 0;
  const fmt = ms => { const t = Math.floor(ms / 1000); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  setInterval(() => {
    $('elapsed').textContent = fmt(talkAcc + (talkStart ? Date.now() - talkStart : 0));
    $('clock').textContent = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }, 500);
  const talkToggle = () => {
    if (talkStart) { talkAcc += Date.now() - talkStart; talkStart = 0; $('talk').textContent = 'Seguir charla'; }
    else { talkStart = Date.now(); $('talk').textContent = 'Pausar charla'; }
  };
  $('prev').onclick = prev;
  $('next').onclick = () => { if (!talkStart && !talkAcc) talkToggle(); next(); };
  $('talk').onclick = talkToggle;
  $('talkreset').onclick = () => { talkStart = 0; talkAcc = 0; $('talk').textContent = 'Iniciar charla'; };
  tBtn.onclick = timerToggle;
  tRst.onclick = timerReset;
  pv.querySelectorAll('button').forEach(b => b.addEventListener('click', () => b.blur()));

  keyboard({ beforeNext: () => { if (!talkStart && !talkAcc) talkToggle(); } });
}

/* ---------- teclado ---------- */
function keyboard({ notes, fullscreen, presenter, beforeNext } = {}) {
  let buf = '', bufT;
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) { buf += k; clearTimeout(bufT); bufT = setTimeout(() => { buf = ''; }, 1600); return; }
    if (k === 'Enter' && buf) { go(+buf - 1, 0); buf = ''; e.preventDefault(); return; }
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); beforeNext?.(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'ArrowDown') { e.preventDefault(); go(cur + 1, 0); }
    else if (k === 'ArrowUp') { e.preventDefault(); go(cur - 1, 0); }
    else if (k === 'Home') go(0, 0);
    else if (k === 'End') go(slides.length - 1, 0);
    else if (k === 'f' || k === 'F') fullscreen?.();
    else if (k === 'n' || k === 'N') notes?.();
    else if (k === 'p' || k === 'P') presenter?.();
    else if ((k === 't' || k === 'T') && slides[cur].id === 's09') timerToggle();
    else if ((k === 'r' || k === 'R') && slides[cur].id === 's09') timerReset();
    else if (k === 'Escape') { const p = document.getElementById('notes-panel'); if (p) p.hidden = true; }
  });
}

/* ---------- arranque ---------- */
function start() {
  const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/);
  const n = m ? +m[1] - 1 : 0, k = m && m[2] ? +m[2] : 0;
  void stage.offsetWidth;
  setTimeout(() => { if (cur < 0) go(n, k, { silent: true }); timerDraw(); }, 40);   // rAF se pausa en pestañas ocultas
}
(document.fonts?.ready || Promise.resolve()).then(start);
if (MODE === 'main') addEventListener('hashchange', () => {
  const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/);
  if (m) go(+m[1] - 1, m[2] ? +m[2] : 0);
});
})();
