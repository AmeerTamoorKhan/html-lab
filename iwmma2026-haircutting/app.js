/* Deck framework: navigation, journey bar, deep-dive drawer, overview, theme */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

const SECTIONS = ['Start', 'Why', 'CNC lens', 'Model & plan', 'Control', 'Human in the loop', 'VLA & future'];
const DEMOS = {};          // name -> factory(slideEl) => {start, stop}
const live = new Map();    // slide index -> instance

let COL = {};
function readColors() {
  const cs = getComputedStyle(document.body);
  ['bg','paper','panel','panel2','line','ink','ink2','muted','accent','accent2','teal','blue','red','green','violet','hair','skin']
    .forEach(k => COL[k] = cs.getPropertyValue('--' + k).trim());
}

/* canvas helpers */
function setupCanvas(c) {
  const w = +c.dataset.w, h = +c.dataset.h, k = 2;
  c.style.width = w + 'px'; c.style.height = h + 'px';
  c.width = w * k; c.height = h * k;
  const ctx = c.getContext('2d'); ctx.setTransform(k, 0, 0, k, 0, 0);
  return { ctx, w, h };
}
function mousePos(c, e, w) {
  const r = c.getBoundingClientRect(), s = w / r.width;
  return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s };
}
function loop(fn) {
  let id = null, last = 0;
  const f = t => { const dt = Math.min(0.05, (t - last) / 1000); last = t; fn(dt, t / 1000); id = requestAnimationFrame(f); };
  return {
    start() { if (id) return; last = performance.now(); id = requestAnimationFrame(f); },
    stop() { if (id) cancelAnimationFrame(id); id = null; }
  };
}

/* ---------------- deck ---------------- */
const slides = $$('.slide');
let cur = 0;

function fit() {
  const s = Math.min(innerWidth / 1300, innerHeight / 740);
  $('#stage').style.transform = `scale(${s})`;
}

function buildJourney() {
  const j = $('#journey');
  j.innerHTML = '<span class="brand">IWMMA 2026</span>';
  SECTIONS.forEach((name, i) => {
    if (i) j.insertAdjacentHTML('beforeend', '<span class="sep"></span>');
    const el = document.createElement('span');
    el.className = 'step'; el.dataset.s = i; el.innerHTML = `<i></i>${name}`;
    el.onclick = () => go(slides.findIndex(s => +s.dataset.section === i));
    j.appendChild(el);
  });
}

function demoFor(i) {
  const name = slides[i].dataset.demo;
  if (!name || !DEMOS[name]) return null;
  if (!live.has(i)) {
    try { live.set(i, DEMOS[name](slides[i]) || {}); }
    catch (e) { console.error('demo init', name, e); live.set(i, {}); }
  }
  return live.get(i);
}

function go(i, push = true) {
  i = clamp(i, 0, slides.length - 1);
  const prev = live.get(cur); if (prev && prev.stop) prev.stop();
  slides[cur].classList.remove('active');
  cur = i;
  slides[cur].classList.add('active');
  const d = demoFor(cur); if (d && d.start) d.start();
  const sec = +slides[cur].dataset.section;
  $$('#journey .step').forEach(s => {
    const k = +s.dataset.s;
    s.classList.toggle('on', k === sec); s.classList.toggle('done', k < sec);
  });
  $('#progress').style.width = ((cur + 1) / slides.length * 100) + '%';
  $('#num').textContent = `${cur + 1} / ${slides.length}`;
  if (push) history.replaceState(null, '', '#' + (cur + 1));
  if ($('#drawer').classList.contains('on')) fillDrawer();
}
window.goSlide = go;

/* ---------------- drawer ---------------- */
let dTab = 'plain';
function fillDrawer() {
  const s = slides[cur], more = $('.more', s);
  $('#dTitle').textContent = s.dataset.title;
  $('#dKick').textContent = `Deep dive · slide ${cur + 1}`;
  const part = more && $(`[data-tab="${dTab}"]`, more);
  $('#dBody').innerHTML = part ? part.innerHTML : '<p class="muted">No extra notes for this slide.</p>';
  $$('#drawer .tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === dTab));
  $('#dBody').scrollTop = 0;
}
function openDrawer(tab) { if (tab) dTab = tab; fillDrawer(); $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); }
function closeDrawer() { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); }
function toggleDrawer() { $('#drawer').classList.contains('on') ? closeDrawer() : openDrawer(); }

/* ---------------- overview ---------------- */
function toggleOverview() {
  const o = $('#overview');
  if (o.classList.contains('on')) { o.classList.remove('on'); return; }
  $('#ovGrid').innerHTML = slides.map((s, i) =>
    `<div class="o ${i === cur ? 'cur' : ''}" data-i="${i}"><div class="n">${String(i + 1).padStart(2, '0')}</div>
     <div class="t">${s.dataset.title}</div><div class="s">${SECTIONS[+s.dataset.section]}</div></div>`).join('');
  $$('#ovGrid .o').forEach(el => el.onclick = () => { o.classList.remove('on'); go(+el.dataset.i); });
  o.classList.add('on');
}

function toggleTheme() {
  document.body.classList.toggle('light');
  try { localStorage.setItem('ath-theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch (e) {}
  readColors();
}
function toggleFS() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.();
}

/* ---------------- events ---------------- */
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') { if (e.key === 'Escape') e.target.blur(); return; }
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); go(cur + 1); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(cur - 1); }
  else if (k === 'Home') go(0);
  else if (k === 'End') go(slides.length - 1);
  else if (k === 'd' || k === 'D') toggleDrawer();
  else if (k === 'o' || k === 'O') toggleOverview();
  else if (k === 'f' || k === 'F') toggleFS();
  else if (k === 't' || k === 'T') toggleTheme();
  else if (k === 'Escape') { closeDrawer(); $('#overview').classList.remove('on'); }
});
let tx = null;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
  if ($('#drawer').classList.contains('on')) return;
  if (e.target.closest('canvas,input')) return;
  if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1));
});

window.addEventListener('DOMContentLoaded', () => {
  try { if (localStorage.getItem('ath-theme') === 'light') document.body.classList.add('light'); } catch (e) {}
  readColors(); buildJourney(); fit();
  $('#prevBtn').onclick = () => go(cur - 1);
  $('#nextBtn').onclick = () => go(cur + 1);
  $('#deepBtn').onclick = () => openDrawer();
  $('#ovBtn').onclick = toggleOverview;
  $('#thBtn').onclick = toggleTheme;
  $('#fsBtn').onclick = toggleFS;
  $('#dClose').onclick = closeDrawer;
  $('#scrim').onclick = closeDrawer;
  $$('#drawer .tabs button').forEach(b => b.onclick = () => { dTab = b.dataset.t; fillDrawer(); });
  setTimeout(() => $('#help').classList.add('hide'), 6000);
  const h = parseInt(location.hash.slice(1), 10);
  // demos.js registers on load; defer first go until then
  setTimeout(() => go(isNaN(h) ? 0 : h - 1, false), 0);
});
window.addEventListener('resize', fit);
