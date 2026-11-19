/* =========================================================
   Think Like a System — motor de la presentación
   Mismo motor que Architect Your Mind: pasos [data-step]/[data-at]/
   [data-dim-after], modos ?presenter y ?embed, y temporizadores
   por etapa para el laboratorio.
   ========================================================= */
(() => {
'use strict';

/* ---------- geometría ---------- */
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

/* 04 — caja negra / caja blanca */
SCENES.boxes = () => {
  const W = 260;
  let a = box({ x: 0, y: 0, z: 0, w: W, d: W, h: W, faces: true, cls: 'cbf', delay: 0.2 });
  const inA = P(W / 2, W + 230, W / 2), inB = P(W / 2, W, W / 2);
  const outA = P(W, W / 2, W / 2), outB = P(W + 230, W / 2, W / 2);
  a += pth(`M${inA[0]} ${inA[1]} L${inB[0]} ${inB[1]}`, { cls: 'ln w2 draw', delay: 0.6 }) + arrowHead(inB[0], inB[1], Math.atan2(inB[1] - inA[1], inB[0] - inA[0]), 18);
  a += pth(`M${outA[0]} ${outA[1]} L${outB[0]} ${outB[1]}`, { cls: 'ln w2 or draw', delay: 0.9 }) + arrowHead(outB[0], outB[1], Math.atan2(outB[1] - outA[1], outB[0] - outA[0]), 18, 'dot or');
  a += g(txt(inA[0] - 10, inA[1] + 44, 'Envío dinero', 'svgt', { anchor: 'middle', size: 28 }) + txt(outB[0] + 10, outB[1] + 44, 'Confirmación', 'svgt', { anchor: 'middle', size: 28, fill: 'var(--naranja)' }), { cls: 'fade', style: '--d:1.1' });

  let b = box({ x: 0, y: 0, z: 0, w: W, d: W, h: W, ec: 'ln hid draw', delay: 0.1, step: 1, hidden: true });
  const mods = [[22, 22], [100, 22], [178, 22], [22, 100], [100, 100], [178, 100], [100, 178]];
  mods.forEach(([x, y], i) => {
    const z = i === 6 ? 0 : 60;
    b += box({ x, y, z, w: 58, d: 58, h: 58, faces: true, cls: i === 4 ? 'orf' : '', delay: 0.4 + i * 0.12, fdelay: 0.4 + i * 0.12, step: 1 });
    const [nx, ny] = P(x + 29, y + 29, z + 58);
    b += g(txt(nx, ny - 14, String(i + 1), 'svgt', { anchor: 'middle', size: 30 }), { cls: 'fade', step: 1, style: `--d:${sec(0.6 + i * 0.12)}` });
  });
  return g(a, { tr: T(470, 540, 1) }) + g(b, { tr: T(1290, 540, 1) });
};

/* 10 — capas apiladas de un sistema digital */
SCENES.layers = () => {
  const W = 400, H = 34;
  const L = [
    { z: 0, n: 'Infraestructura', cls: 'cbf' },
    { z: 120, n: 'Datos', cls: '' },
    { z: 240, n: 'Lógica · Backend', cls: '' },
    { z: 330, n: 'Comunicación · APIs', cls: 'api', h: 14 },
    { z: 420, n: 'Interfaz · Frontend', cls: 'orf' },
  ];
  let s = '';
  L.forEach((l, i) => {
    const h = l.h || H;
    s += box({ x: 0, y: 0, z: l.z, w: W, d: W, h, faces: true, cls: l.cls, delay: 0.15 * i, fdelay: 0.15 * i + 0.2, step: i + 1 });
    const [rx, ry] = P(W, 0, l.z + h / 2);
    s += g(`<path class="ln faint" d="M${rx + 12} ${ry} H${rx + 120}"/>` + txt(rx + 136, ry + 12, l.n, 'svgt', { size: 34 }), { cls: 'fade', step: i + 1, style: `--d:${sec(0.3)}` });
  });
  const ex = box({ x: 0, y: -560, z: 240, w: 150, d: 150, h: 70, ec: 'ln sketch draw', delay: 0.2 });
  const [ax, ay] = P(75, -410, 240), [bx, by] = P(W, 0, 240 + H / 2), [tx, ty] = P(75, -485, 310);
  s += g(ex + pth(`M${ax} ${ay} L${bx} ${by}`, { cls: 'ln sketch draw', delay: 0.4 }) + g(txt(tx, ty - 50, 'Servicios externos', 'svgt', { anchor: 'middle', size: 34 }), { cls: 'fade', style: '--d:.5' }), { step: 6 });
  return g(s, { tr: T(1150, 600, 0.8) });
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
  s.querySelectorAll('.on,.at,.dim').forEach(el => el.classList.remove('on', 'at', 'dim'));
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
const chan = MODE !== 'embed' && 'BroadcastChannel' in window ? new BroadcastChannel('think-like-a-system') : null;
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
  else if (m.type === 'timer') timerSet(m.id, m.t, true);
}
if (chan) chan.onmessage = e => onMsg(e.data);
addEventListener('message', e => {
  if (MODE === 'embed' ? e.source === window.parent : e.data?._ib) onMsg(e.data);
});

/* ---------- temporizadores del laboratorio ----------
   Cada [data-timer-id] lleva su duración en data-seconds; el estado
   se sincroniza entre ventanas por id. */
const TIMERS = {};
document.querySelectorAll('[data-timer-id]').forEach(el => {
  const total = +el.dataset.seconds * 1000;
  TIMERS[el.dataset.timerId] = { el, total, st: { running: false, remaining: total, endAt: 0 }, raf: 0 };
});
const onTimer = [];
const tLeft = T => (T.st.running ? Math.max(0, T.st.endAt - Date.now()) : T.st.remaining);
const mmss = ms => { const t = Math.ceil(ms / 1000); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
function slideTimer(i = cur) { const el = slides[i]?.querySelector('[data-timer-id]'); return el ? el.dataset.timerId : null; }

function timerSet(id, st, remote = false) {
  const T = TIMERS[id]; if (!T) return;
  T.st = { ...st };
  if (!remote) send({ type: 'timer', id, t: T.st });
  onTimer.forEach(f => f(id));
  timerDraw(id);
}
function timerToggle(id) {
  const T = TIMERS[id]; if (!T) return;
  if (T.st.running) timerSet(id, { running: false, remaining: tLeft(T), endAt: 0 });
  else {
    let r = tLeft(T); if (r <= 0) r = T.total;
    timerSet(id, { running: true, remaining: r, endAt: Date.now() + r });
  }
}
function timerReset(id) { const T = TIMERS[id]; if (T) timerSet(id, { running: false, remaining: T.total, endAt: 0 }); }
function timerLabel(id) {
  const T = TIMERS[id], r = tLeft(T);
  return T.st.running ? 'Pausar' : r <= 0 ? 'Otra vez' : r < T.total ? 'Seguir' : 'Iniciar';
}
function timerDraw(id) {
  const T = TIMERS[id];
  cancelAnimationFrame(T.raf);
  const r = tLeft(T);
  if (T.st.running && r <= 0) T.st = { running: false, remaining: 0, endAt: 0 };
  T.el.querySelector('[data-timer-count]').textContent = mmss(r);
  T.el.querySelector('[data-timer-ring]')?.setAttribute('stroke-dashoffset', R((1 - r / T.total) * 1000) / 1000);
  T.el.classList.toggle('tm-done', r <= 0);
  T.el.classList.toggle('tm-run', T.st.running);
  const b = T.el.querySelector('[data-timer="toggle"]'); if (b) b.textContent = timerLabel(id);
  if (T.st.running) T.raf = requestAnimationFrame(() => timerDraw(id));
}
document.querySelectorAll('[data-timer]').forEach(b => b.addEventListener('click', e => {
  e.stopPropagation();
  const id = b.closest('[data-timer-id]').dataset.timerId;
  if (b.dataset.timer === 'toggle') timerToggle(id); else timerReset(id);
  b.blur();
}));

/* ---------- copiar el prompt maestro ---------- */
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async e => {
  e.stopPropagation();
  const text = document.querySelector(b.dataset.copy).innerText.trim();
  // primero la copia síncrona (funciona en cualquier navegador con el clic); si no, la API del portapapeles
  let ok = false;
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.append(ta); ta.select();
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  if (!ok && navigator.clipboard) {
    ok = await Promise.race([
      navigator.clipboard.writeText(text).then(() => true, () => false),
      new Promise(r => setTimeout(() => r(false), 1500)),
    ]);
  }
  const old = b.dataset.label || (b.dataset.label = b.textContent);
  b.textContent = ok ? 'Copiado ✓' : 'Selecciónalo y cópialo';
  setTimeout(() => { b.textContent = old; }, 2200);
  b.blur();
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
    popup = window.open(`${location.pathname}?presenter#${cur + 1}.${step}`, 'tlas-presenter', 'width=1400,height=860');
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
if (MODE === 'presenter') {
  document.title = 'Presentadora — Think Like a System';
  const pv = document.createElement('div');
  pv.className = 'pv';
  pv.innerHTML = `
    <header>
      <b data-pv="title"></b><span data-pv="count"></span>
      <span class="grow1"></span>
      <span>Masterclass <span class="clock elapsed" data-pv="elapsed">00:00</span></span>
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
      <button type="button" data-pv="talk">Iniciar reloj</button>
      <button type="button" data-pv="talkreset">Reiniciar reloj</button>
      <span class="sep"></span>
      <button type="button" data-pv="timer" hidden></button>
      <button type="button" data-pv="timerreset" hidden>Reiniciar etapa</button>
      <span class="hint">← → avanzar · T temporizador · números + Enter para saltar</span>
    </footer>`;
  document.body.append(pv);
  const $ = k => pv.querySelector(`[data-pv="${k}"]`);
  const fCur = $('cur'), fNext = $('next');
  const src = `${location.pathname}?embed`;
  fCur.src = src; fNext.src = src;

  const post = (f, msg) => { try { f.contentWindow?.postMessage(msg, '*'); } catch (e) {} };
  const syncFrames = () => {
    if (cur < 0) return;
    post(fCur, { type: 'goto', n: cur, s: step });
    const ns = nextState();
    if (ns) post(fNext, { type: 'goto', n: ns[0], s: ns[1] });
    fNext.style.visibility = ns ? 'visible' : 'hidden';
    Object.keys(TIMERS).forEach(id => post(fCur, { type: 'timer', id, t: TIMERS[id].st }));
  };
  [fCur, fNext].forEach(f => f.addEventListener('load', syncFrames));
  onTimer.push(id => post(fCur, { type: 'timer', id, t: TIMERS[id].st }));

  const tBtn = $('timer'), tRst = $('timerreset');
  onRender.push(() => {
    $('title').textContent = slides[cur].dataset.title;
    $('count').textContent = `${String(cur + 1).padStart(2, '0')} / ${slides.length}${slides[cur].maxStep ? ` · paso ${step}/${slides[cur].maxStep}` : ''}`;
    $('notes').innerHTML = notesHTML(cur);
    tBtn.hidden = tRst.hidden = !slideTimer();
    syncFrames();
  });
  setInterval(() => {
    const id = slideTimer();
    if (id) tBtn.textContent = `${timerLabel(id)} · ${mmss(tLeft(TIMERS[id]))}`;
  }, 250);

  let talkStart = 0, talkAcc = 0;
  const fmt = ms => { const t = Math.floor(ms / 1000); return `${String(Math.floor(t / 3600))}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  setInterval(() => {
    $('elapsed').textContent = fmt(talkAcc + (talkStart ? Date.now() - talkStart : 0));
    $('clock').textContent = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }, 500);
  const talkToggle = () => {
    if (talkStart) { talkAcc += Date.now() - talkStart; talkStart = 0; $('talk').textContent = 'Seguir reloj'; }
    else { talkStart = Date.now(); $('talk').textContent = 'Pausar reloj'; }
  };
  $('prev').onclick = prev;
  $('next').onclick = () => { if (!talkStart && !talkAcc) talkToggle(); next(); };
  $('talk').onclick = talkToggle;
  $('talkreset').onclick = () => { talkStart = 0; talkAcc = 0; $('talk').textContent = 'Iniciar reloj'; };
  tBtn.onclick = () => { const id = slideTimer(); if (id) timerToggle(id); };
  tRst.onclick = () => { const id = slideTimer(); if (id) timerReset(id); };
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
    else if ((k === 't' || k === 'T') && slideTimer()) timerToggle(slideTimer());
    else if ((k === 'r' || k === 'R') && slideTimer()) timerReset(slideTimer());
    else if (k === 'Escape') { const p = document.getElementById('notes-panel'); if (p) p.hidden = true; }
  });
}

/* ---------- arranque ---------- */
function start() {
  const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/);
  const n = m ? +m[1] - 1 : 0, k = m && m[2] ? +m[2] : 0;
  void stage.offsetWidth;
  setTimeout(() => { if (cur < 0) go(n, k, { silent: true }); Object.keys(TIMERS).forEach(timerDraw); }, 40);   // rAF se pausa en pestañas ocultas
}
(document.fonts?.ready || Promise.resolve()).then(start);
if (MODE === 'main') addEventListener('hashchange', () => {
  const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/);
  if (m) go(+m[1] - 1, m[2] ? +m[2] : 0);
});
})();
