/* Self-running visuals for each slide (no interaction needed) */
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const hyp = Math.hypot;

function cycle(ms, n, fn) {
  let id = null, i = 0;
  return { start() { i = 0; fn(0); clearInterval(id); id = setInterval(() => { i = (i + 1) % n; fn(i); }, ms); },
           stop() { clearInterval(id); id = null; } };
}
function both(...xs) { return { start() { xs.forEach(x => x && x.start && x.start()); }, stop() { xs.forEach(x => x && x.stop && x.stop()); } }; }
function setPhase(el, text, cls = '') { if (!el) return; if (el.textContent !== text) el.textContent = text; const c = 'phase ' + cls; if (el.className !== c) el.className = c; }

function drawHead(ctx, x, y, r, opts = {}) {
  ctx.save();
  if (opts.body !== false) {
    ctx.fillStyle = COL.panel2;
    ctx.beginPath(); ctx.ellipse(x, y + r * 1.75, r * 1.25, r * 0.6, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = COL.skin; ctx.globalAlpha = .85;
    ctx.fillRect(x - r * 0.32, y + r * 0.7, r * 0.64, r * 0.6);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = COL.skin;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (opts.face) {
    ctx.beginPath(); ctx.moveTo(x - r * 0.97, y - r * 0.05); ctx.lineTo(x - r * 1.14, y + r * 0.16); ctx.lineTo(x - r * 0.95, y + r * 0.24); ctx.fill();
    ctx.fillStyle = COL.hair; ctx.beginPath(); ctx.arc(x - r * 0.62, y - r * 0.08, r * 0.06, 0, TAU); ctx.fill();
  }
  if (opts.cap) {
    ctx.fillStyle = COL.hair;
    ctx.beginPath(); ctx.arc(x, y, r + 3, Math.PI * 1.05, Math.PI * 1.95); ctx.arc(x, y, r * 0.86, Math.PI * 1.95, Math.PI * 1.05, true); ctx.fill();
  }
  ctx.restore();
}
function ring(ctx, x, y, r, col, w = 2, dash) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
}
function clipper(ctx, x, y, ang, s = 1, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = col || '#2b2f38'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(-18, -7, 36, 14, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.accent; ctx.fillRect(-16, 5, 32, 3);
  ctx.restore();
}
function label(ctx, t, x, y, col, size = 12, align = 'left') {
  ctx.fillStyle = col; ctx.font = `600 ${size}px Inter, sans-serif`; ctx.textAlign = align; ctx.fillText(t, x, y); ctx.textAlign = 'left';
}

/* =============== 1. HERO (happy face + trimming) =============== */
DEMOS.hero = () => {
  const cv = $('#heroCv'); const { ctx, w, h } = setupCanvas(cv);
  const C = { x: 225, y: 285 }, R = 100, target = 24;
  const strands = [];
  for (let i = 0; i < 52; i++) {
    const a = (-166 + 152 * i / 51) * Math.PI / 180;
    strands.push({ a, L: rnd(40, 70), max: rnd(58, 78), rate: rnd(1.5, 3) });
  }
  const base = { x: 480, y: 30 }, l1 = 215, l2 = 205;
  const snips = [];
  return loop((dt, t) => {
    const th = -Math.PI / 2 + 1.2 * Math.sin(t * 0.5);
    const rr = R + target + 6;
    const tool = { x: C.x + rr * Math.cos(th), y: C.y + rr * Math.sin(th) };
    strands.forEach(s => {
      s.L = Math.min(s.max, s.L + dt * s.rate);
      const da = Math.abs(((s.a - th) % TAU + TAU * 1.5) % TAU - Math.PI);
      if (da < 0.08 && s.L > target + 2) {
        const ca = Math.cos(s.a), sa = Math.sin(s.a);
        snips.push({ x: C.x + (R + target + 6) * ca, y: C.y + (R + target + 6) * sa, vx: ca * 40 + rnd(-20, 20), vy: sa * 30 - 20, a: s.a, len: Math.min(14, s.L - target), life: 1.6 });
        s.L = target;
      }
    });
    snips.forEach(p => { p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += dt * 4; p.life -= dt; });
    while (snips.length && snips[0].life <= 0) snips.shift();
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(C.x, C.y, 40, C.x, C.y, 260);
    g.addColorStop(0, 'rgba(255,106,43,.16)'); g.addColorStop(1, 'rgba(255,106,43,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    drawHead(ctx, C.x, C.y, R);
    // happy face: eyes (with blink), brows, cheeks, smile
    const blink = (t % 4.2) < 0.13;
    [-34, 34].forEach(dx => {
      ctx.fillStyle = '#2a1b14';
      if (blink) ctx.fillRect(C.x + dx - 9, C.y - 9, 18, 3);
      else { ctx.beginPath(); ctx.ellipse(C.x + dx, C.y - 8, 7.5, 10, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(C.x + dx + 2.5, C.y - 11, 2.6, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#2a1b14'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(C.x + dx, C.y - 20, 12, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
    });
    ctx.fillStyle = 'rgba(255,110,110,.38)';
    ctx.beginPath(); ctx.ellipse(C.x - 54, C.y + 18, 13, 8, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(C.x + 54, C.y + 18, 13, 8, 0, 0, TAU); ctx.fill();
    const sm = 0.85 + 0.15 * Math.sin(t * 2);
    ctx.fillStyle = '#7a2e22'; ctx.beginPath(); ctx.moveTo(C.x - 30, C.y + 22);
    ctx.quadraticCurveTo(C.x, C.y + 22 + 40 * sm, C.x + 30, C.y + 22); ctx.quadraticCurveTo(C.x, C.y + 29, C.x - 30, C.y + 22); ctx.fill();
    ctx.fillStyle = '#ff8f8f'; ctx.beginPath(); ctx.ellipse(C.x, C.y + 32 + 8 * sm, 10, 5 * sm, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a1b14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C.x - 33, C.y + 20);
    ctx.quadraticCurveTo(C.x, C.y + 22 + 40 * sm, C.x + 33, C.y + 20); ctx.stroke();
    ring(ctx, C.x, C.y, R + target, COL.accent, 1, [3, 5]);
    ctx.lineCap = 'round';
    strands.forEach(s => {
      const ca = Math.cos(s.a), sa = Math.sin(s.a);
      const rx = C.x + R * ca, ry = C.y + R * sa;
      const ta = s.a + 0.32 * ca * (s.L / 70);
      const mx = C.x + (R + s.L * 0.55) * ca, my = C.y + (R + s.L * 0.55) * sa;
      ctx.strokeStyle = COL.hair; ctx.lineWidth = 3.6;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(mx, my, rx + s.L * Math.cos(ta), ry + s.L * Math.sin(ta)); ctx.stroke();
    });
    snips.forEach(p => { ctx.globalAlpha = clamp(p.life, 0, 1); ctx.strokeStyle = COL.hair; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.len * Math.cos(p.a), p.y + p.len * Math.sin(p.a)); ctx.stroke(); });
    ctx.globalAlpha = 1;
    const ee = { x: tool.x + 16 * Math.cos(th), y: tool.y + 16 * Math.sin(th) };
    const dx = ee.x - base.x, dy = ee.y - base.y, d = clamp(hyp(dx, dy), 30, l1 + l2 - 1);
    const q2 = Math.acos(clamp((d * d - l1 * l1 - l2 * l2) / (2 * l1 * l2), -1, 1));
    const els = [q2, -q2].map(a2 => { const a1 = Math.atan2(dy, dx) - Math.atan2(l2 * Math.sin(a2), l1 + l2 * Math.cos(a2)); return { x: base.x + l1 * Math.cos(a1), y: base.y + l1 * Math.sin(a1) }; });
    const el = els[0].y < els[1].y ? els[0] : els[1];
    ctx.strokeStyle = COL.muted; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(el.x, el.y); ctx.lineTo(ee.x, ee.y); ctx.stroke();
    ctx.strokeStyle = COL.panel2; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(el.x, el.y); ctx.lineTo(ee.x, ee.y); ctx.stroke();
    [base, el, ee].forEach(p => { ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, TAU); ctx.fill(); });
    clipper(ctx, tool.x, tool.y, th + Math.PI / 2 + Math.PI, 1.1);
  });
};

/* =============== 2. ROADMAP (draws itself) =============== */
(function () {
  const road = $('#road'); if (!road) return;
  const stops = [
    { n: 1, t: 'Why', q: 'Who needs it, and why is it hard?', go: 2, x: 8, y: 66 },
    { n: 2, t: 'CNC lens', q: 'How does precision machining frame it?', go: 6, x: 25, y: 28 },
    { n: 3, t: 'Model & plan', q: 'How do we describe hair and plan the cut?', go: 9, x: 42, y: 66 },
    { n: 4, t: 'Control', q: 'How do we follow a moving head safely?', go: 11, x: 58, y: 28 },
    { n: 5, t: 'Human in the loop', q: 'What works today: remote and supervised', go: 13, x: 75, y: 66 },
    { n: 6, t: 'VLA & future', q: 'From words to cuts, and the roadmap', go: 15, x: 92, y: 28 },
  ];
  const W = 1184, H = 330;
  const P = stops.map(s => [s.x / 100 * W, s.y / 100 * H]);
  let d = `M ${P[0][0]},${P[0][1]}`;
  for (let i = 1; i < P.length; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i]; d += ` C ${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1} ${x1},${y1}`; }
  road.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <path d="${d}" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/>
    <path class="drawpath" d="${d}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-dasharray="2200" stroke-dashoffset="2200"/>
    <circle r="9" fill="var(--accent2)"><animateMotion dur="9s" repeatCount="indefinite" path="${d}"/></circle></svg>` +
    stops.map((s, i) => `<div class="stop" style="left:${s.x}%;top:${s.y}%;animation-delay:${0.3 + i * 0.5}s" data-go="${s.go}"><div class="dot">${s.n}</div><div class="t">${s.t}</div><div class="q">${s.q}</div></div>`).join('');
  $$('.stop', road).forEach(e => e.onclick = () => goSlide(+e.dataset.go));
})();

/* =============== 3. MARKET =============== */
DEMOS.market = () => {
  const tiers = [['High income', 576], ['Middle income', 216], ['Low income', 34.8]];
  $('#mkBars').innerHTML = tiers.map(([n, v]) =>
    `<div class="bar"><span>${n}</span><div class="tr" style="height:14px"><div class="fl" style="width:0" data-w="${v / 576 * 100}"></div></div><b>$${Math.round(v)}B</b></div>`).join('');
  const lp = loop((dt, t) => {
    const p = Math.round(1 + 19 * (0.5 - 0.5 * Math.cos(t * 0.5)));
    $('#mkPct').textContent = p + '%'; $('#mkVal').textContent = '$' + Math.round(826.8 * p / 100) + ' B / yr';
  });
  return both(lp, { start() { setTimeout(() => $$('#mkBars .fl').forEach((f, i) => setTimeout(() => f.style.width = f.dataset.w + '%', i * 300)), 300); },
                    stop() { $$('#mkBars .fl').forEach(f => f.style.width = 0); } });
};

/* =============== 4. HARD TABLE (auto reveal via CSS) =============== */
(function () {
  const rows = [
    ['Fixturing', 'Clamped in a vise', 'Moves constantly: breathing, talking, flinching'],
    ['Material', 'One rigid solid', '~100,000 soft strands that bend and spring back'],
    ['Variability', 'Every part identical', 'Straight to coily, fine to coarse, wet or dry'],
    ['Geometry', 'Exact CAD model', 'Estimated from cameras, partly hidden'],
    ['A mistake', 'Scrap the part', 'Irreversible, and can injure a person'],
    ['Success', 'Measured to ±0.01 mm', 'Judged by the client\'s eye'],
  ];
  const t = $('#hardTbl');
  rows.forEach(([k, a, b], i) => t.insertAdjacentHTML('beforeend',
    `<div class="c k">${k}</div><div class="c">${a}</div><div class="c hv"><span>${b}</span><div class="q" style="animation-delay:${0.8 + i * 0.85}s">?</div></div>`));
})();

/* =============== 5. TIMELINE =============== */
DEMOS.timeline = () => {
  const ev = [
    { y: '1980s', l: 'Mechanical apparatus patent', x: 5, d: '<b>US 4,602,542 "Automatic hair cutting apparatus".</b> A computer maps each scalp position to a cut length and drives an arm with an adjustable cutter, taught at key positions. Essentially open-loop CAM for hair.' },
    { y: '2010s', l: 'Automated cutting systems (patents)', x: 20, d: '<b>US 9,656,400 · 9,925,676 · 10,259,131 · 10,307,921.</b> Tracked handheld or robot-held cutter heads, style selection, and hair models using thickness, orientation, stiffness and curl to predict results.' },
    { y: '2021', l: 'Hair combing with a robot arm', x: 35, d: '<b>Hair combing with a general-purpose robotic arm</b> (arXiv:2108.01233). Off-the-shelf manipulators enter hair care.' },
    { y: '2024', l: 'Inclusion across hair types', x: 50, d: '<b>Inclusion in assistive haircare robotics</b> (arXiv:2411.05137). Systematic categorisation of hair properties, so robots work for all hair types.' },
    { y: '2025', l: 'Styling robots · market & safety', x: 64, d: '<b>Front-hair styling robot</b> with strand path planning (arXiv:2501.10991).<br><b>S. Li, "Haircutting Robots: From Theory to Practice"</b> (<i>Automation</i>): market, requirements, safety, teleoperation vs autonomy.' },
    { y: '2026', l: 'Our three surveys', x: 80, ours: 1, d: '<b>Khan & Li</b>: CNC-inspired framework (<i>JAIA</i>) and sensors/hair-modelling survey (<i>IEEE JSAS</i>).<br><b>Huang, Khan & Li</b>: mobile-robotics perspective (<i>IJSS</i>).<br>Fragmented efforts become one framework: perception → modelling → planning → control.' },
    { y: '2026', l: 'TeleHairing baseline', x: 95, d: '<b>Huang et al. (S. Li group), TeleHairing</b> (arXiv:2610.07096). Cross-continent teleoperated clipper on a UR10e with measured latency and tracking error: a quantitative baseline for autonomy.' },
  ];
  const tl = $('#tl');
  if (!$('.ev', tl)) ev.forEach((e, i) => tl.insertAdjacentHTML('beforeend', `<div class="ev ${e.ours ? 'ours' : ''}" style="left:${e.x}%" data-i="${i}"><div class="y">${e.y}</div><div class="p"></div><div class="lab">${e.l}</div></div>`));
  return cycle(4200, ev.length, i => {
    $$('.ev', tl).forEach((x, k) => x.classList.toggle('on', k === i));
    $('#tlCard').innerHTML = `<div style="display:flex;gap:10px;align-items:center;margin-bottom:6px;animation:fadein .4s"><span class="tag ${ev[i].ours ? '' : 'blue'}">${ev[i].y}</span><h3 style="margin:0">${ev[i].l}</h3></div><p style="animation:fadein .4s">${ev[i].d}</p>`;
  });
};

/* =============== 6. LENSES =============== */
DEMOS.lenses = () => {
  $$('#lenses .lens').forEach(l => l.onclick = () => goSlide(+l.dataset.go - 1));
  return cycle(4000, 3, i => $$('#lenses .lens').forEach((l, k) => l.classList.toggle('on', k === i)));
};

/* =============== 7. CNC MAP =============== */
DEMOS.cnc = () => {
  const rows = [
    ['Workpiece', 'metal blank', 'Head + hair', 'scalp surface + strand field', 'partial', 'Same role, but the "material" is alive, soft and different on every client.'],
    ['CAD model', 'design geometry', 'Target style', 'length field L*(u,v) on the scalp', 'holds', 'A hairstyle can be written as a target length per scalp location: a clean, checkable spec.'],
    ['Fixture + probing', 'clamp once, zero once', 'Head-pose tracking', 'continuous, online', 'breaks', 'You can\'t clamp a person. Registration becomes real-time estimation, which is why we need the mobile-robotics view.'],
    ['CAM toolpath', 'raster, contour, spiral', 'Coverage path', 'over the scalp surface', 'holds', 'Classical coverage patterns transfer directly; the tool must stay normal to the scalp.'],
    ['Roughing → finishing', 'remove bulk, then precise pass', 'Multi-pass trimming', 'long → near target → final', 'holds', 'Irreversibility makes conservative multi-pass cutting even more valuable than in machining.'],
    ['Machine axes', '3–5 axis', 'Robot DOF', '≈ 3 translation + 2 rotation', 'holds', 'About five DOF are enough for clipper work; redundancy helps avoid face and shoulders.'],
    ['Feeds & speeds', 'material-specific', 'Speed & force limits', 'set by safety, not throughput', 'partial', 'Limits come from human safety and comfort, scaled by distance to ears, eyes and skin.'],
    ['Metrology / QC', 'CMM, gauges', 'Style evaluation', 'geometry + aesthetics', 'breaks', 'There is no gauge for "looks good". Quality needs reconstruction, symmetry and preference models.'],
    ['Part program', 'G-code', 'Robot program', 'from planner, or learned (VLA)', 'holds', 'The program can come from a planner, or from a learned policy that reads instructions.'],
  ];
  const m = $('#cncMap');
  if (!$('.m', m)) rows.forEach((r, i) => m.insertAdjacentHTML('beforeend',
    `<div class="m" data-i="${i}">${r[0]}<small>${r[1]}</small></div><div class="arrow" data-i="${i}"></div><div class="m" data-i="${i}">${r[2]}<small>${r[3]}</small></div>`));
  const lab = { holds: ['green', 'Analogy holds'], partial: ['accent', 'Holds partially'], breaks: ['red', 'Analogy breaks: research gap'] };
  return cycle(3200, rows.length, i => {
    $$('[data-i]', m).forEach(e => { const on = +e.dataset.i === i;
      if (e.classList.contains('arrow')) e.classList.toggle('row-on', on);
      else { e.style.borderColor = on ? 'var(--accent)' : ''; e.style.background = on ? 'var(--accentBg)' : ''; } });
    const r = rows[i], [c, t] = lab[r[4]];
    $('#cncNote').innerHTML = `<div style="animation:fadein .4s"><span class="tag" style="color:var(--${c});background:var(--${c}Bg)">${t}</span><h3 style="margin-top:10px;font-size:19px">${r[0]} → ${r[2]}</h3><p style="font-size:15.5px">${r[5]}</p></div>`;
  });
};

/* =============== 8. ARCHITECTURES =============== */
DEMOS.arch = () => {
  const head = `<circle cx="260" cy="270" r="58" fill="var(--skin)"/><path d="M200 262 A60 60 0 0 1 320 262" stroke="var(--hair)" stroke-width="14" fill="none"/><path d="M190 400 Q260 320 330 400Z" fill="var(--panel)"/>`;
  const clip = (x, y, r = 0) => `<g transform="translate(${x},${y}) rotate(${r})"><rect x="-16" y="-7" width="32" height="14" rx="4" fill="#2b2f38" stroke="var(--ink)"/><rect x="-14" y="5" width="28" height="3" fill="var(--accent)"/></g>`;
  const A = [
    ['Gantry (Cartesian)', `<rect x="70" y="40" width="380" height="12" rx="3" fill="var(--muted)"/><rect x="70" y="40" width="12" height="320" fill="var(--muted)"/><rect x="438" y="40" width="12" height="320" fill="var(--muted)"/>
      <g><animateTransform attributeName="transform" type="translate" values="-90 0; 90 0; -90 0" dur="6s" repeatCount="indefinite"/>
      <rect x="235" y="34" width="50" height="24" rx="4" fill="var(--accent)"/><rect x="254" y="58" width="12" height="120" fill="var(--ink2)"><animate attributeName="height" values="110;135;110" dur="3s" repeatCount="indefinite"/></rect>
      <g>${clip(260, 190, 0)}<animateTransform attributeName="transform" type="translate" values="0 -20; 0 5; 0 -20" dur="3s" repeatCount="indefinite"/></g></g>
      ${head}<ellipse cx="260" cy="365" rx="120" ry="14" fill="none" stroke="var(--accent)" stroke-dasharray="5 5"/>`,
      ['Highest precision and stiffness', 'Simple kinematics and calibration'], ['Bulky frame around the head', 'Limited approach angles'], [9, 4, 7]],
    ['Serial manipulator (cobot)', `${head}<rect x="420" y="340" width="60" height="40" rx="6" fill="var(--muted)"/>
      <g><animateTransform attributeName="transform" type="rotate" values="0 450 340; -12 450 340; 0 450 340" dur="4s" repeatCount="indefinite"/>
      <line x1="450" y1="340" x2="430" y2="160" stroke="var(--ink2)" stroke-width="18" stroke-linecap="round"/><circle cx="450" cy="340" r="10" fill="var(--accent)"/>
      <g><animateTransform attributeName="transform" type="rotate" values="0 430 160; 18 430 160; 0 430 160" dur="4s" repeatCount="indefinite"/>
      <line x1="430" y1="160" x2="330" y2="195" stroke="var(--ink2)" stroke-width="14" stroke-linecap="round"/><circle cx="430" cy="160" r="9" fill="var(--accent)"/>${clip(318, 200, 110)}</g></g>`,
      ['Reaches any angle around the head', 'Built-in cobot force limits'], ['Accuracy varies with posture', 'Harder to certify near the face'], [6, 9, 6]],
    ['Hybrid (rail + wrist)', `${head}<ellipse cx="260" cy="250" rx="175" ry="150" fill="none" stroke="var(--muted)" stroke-width="10"/>
      <g><animateTransform attributeName="transform" type="rotate" values="-40 260 250; 40 260 250; -40 260 250" dur="7s" repeatCount="indefinite"/>
      <rect x="240" y="88" width="40" height="26" rx="5" fill="var(--accent)"/><line x1="260" y1="114" x2="260" y2="170" stroke="var(--ink2)" stroke-width="10"/><circle cx="260" cy="170" r="7" fill="var(--accent)"/>${clip(260, 186, 0)}</g>`,
      ['Large slow moves + fast small corrections', 'Good for head-motion compensation'], ['More complex and costly', 'Two subsystems to coordinate'], [8, 7, 7]],
  ];
  const L = ['Precision', 'Reach', 'Safety'];
  $('#archGrid').innerHTML = A.map(([n, svg, p, m, s]) => `<div class="card"><h3>${n}</h3><svg viewBox="0 20 520 400">${svg}</svg>
    <div class="pc">${p.map(x => `<div><span class="p">＋</span> ${x}</div>`).join('')}${m.map(x => `<div><span class="m">－</span> ${x}</div>`).join('')}</div>
    <div class="bars" style="gap:5px">${L.map((l, i) => `<div class="bar" style="grid-template-columns:80px 1fr 20px;font-size:12.5px"><span>${l}</span><div class="tr"><div class="fl" style="width:${s[i] * 10}%"></div></div><b>${s[i]}</b></div>`).join('')}</div></div>`).join('');
  return {};
};

/* =============== 9. SENSING (builds up sensor by sensor) =============== */
DEMOS.sense = () => {
  const needs = ['Head pose', 'Hair geometry', 'Contact force', 'Distance to skin/ear', 'Density & tangles'];
  const S = { vision: [.85, .75, 0, .35, .3], force: [.1, 0, .95, .1, .35], prox: [.2, 0, 0, .9, 0], tactile: [0, .3, .4, .2, .85] };
  const steps = [['vision'], ['vision', 'force'], ['vision', 'force', 'prox'], ['vision', 'force', 'prox', 'tactile'], ['vision', 'force', 'prox', 'tactile']];
  const names = ['Adding vision', 'Adding force', 'Adding proximity', 'Adding tactile', 'All sensors fused'];
  const svg = $('#senseSvg');
  const draw = on => {
    let s = `<path d="M120 420 Q230 330 340 420Z" fill="var(--panel2)"/><circle cx="230" cy="220" r="118" fill="var(--skin)"/>
      <path d="M112 215 L 96 240 L 114 248Z" fill="var(--skin)"/><circle cx="150" cy="205" r="6" fill="var(--hair)"/>
      <path d="M115 190 A120 120 0 0 1 345 205 L330 215 A105 105 0 0 0 128 195Z" fill="var(--hair)"/>
      <ellipse cx="250" cy="225" rx="16" ry="24" fill="var(--skin)" stroke="#c98d6a" stroke-width="3"/>
      <g transform="translate(350,140) rotate(55)"><rect x="-18" y="-7" width="36" height="14" rx="4" fill="#2b2f38" stroke="var(--ink)"/><rect x="-16" y="5" width="32" height="3" fill="var(--accent)"/></g>`;
    if (on.includes('vision')) s += `<g><path d="M40 60 L230 170 L130 260Z" fill="var(--blue)" opacity=".12"/><path d="M480 60 L300 170 L360 270Z" fill="var(--blue)" opacity=".12"/>
      <rect x="22" y="45" width="40" height="28" rx="5" fill="var(--blue)"/><circle cx="42" cy="59" r="8" fill="var(--paper)"/>
      <rect x="460" y="45" width="40" height="28" rx="5" fill="var(--blue)"/><circle cx="480" cy="59" r="8" fill="var(--paper)"/>
      <g stroke="var(--blue)" stroke-width="2" fill="none"><circle cx="230" cy="220" r="4" fill="var(--blue)"/><path d="M230 220 l40 0 m-40 0 l0 -40"/></g></g>`;
    if (on.includes('force')) s += `<g><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="var(--accent)"/></marker></defs><path d="M372 120 L 334 150" stroke="var(--accent)" stroke-width="4" marker-end="url(#ah)"/>
      <rect x="380" y="96" width="92" height="30" rx="6" fill="var(--accentBg)" stroke="var(--accent)"/><text x="426" y="116" font-size="13" text-anchor="middle" fill="var(--ink)">F = 1.8 N</text></g>`;
    if (on.includes('prox')) s += `<g fill="none" stroke="var(--teal)" stroke-width="2">${[18, 34, 50].map((r, i) => `<circle cx="350" cy="140" r="${r}" opacity="${.8 - i * .25}"><animate attributeName="r" values="${r};${r + 14};${r}" dur="2s" repeatCount="indefinite"/></circle>`).join('')}
      <circle cx="250" cy="225" r="36" stroke-dasharray="4 4" stroke="var(--red)"/></g><text x="250" y="280" font-size="12" text-anchor="middle" fill="var(--red)">keep-out</text>`;
    if (on.includes('tactile')) s += `<g><rect x="250" y="70" width="80" height="12" rx="3" fill="var(--violet)" transform="rotate(20 290 76)"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<line x1="${258 + i * 11}" y1="${80 + i * 4}" x2="${252 + i * 11}" y2="${104 + i * 4}" stroke="var(--violet)" stroke-width="3"/>`).join('')}</g>`;
    svg.innerHTML = s;
  };
  return cycle(3000, steps.length, i => {
    const on = steps[i]; draw(on);
    setPhase($('#sensePhase'), names[i], i === 4 ? 'green' : '');
    const key = i === 4 ? 'all' : on[on.length - 1];
    $$('#sensePts li').forEach(li => { li.classList.toggle('hl', li.dataset.k === key); li.classList.toggle('dim', li.dataset.k !== 'all' && !on.includes(li.dataset.k)); });
    const cov = needs.map((_, k) => 1 - on.reduce((p, s) => p * (1 - S[s][k]), 1));
    $('#senseBars').innerHTML = needs.map((n, k) => `<div class="bar"><span>${n}</span><div class="tr"><div class="fl" style="width:${cov[k] * 100}%"></div></div><b>${Math.round(cov[k] * 100)}</b></div>`).join('');
  });
};

/* =============== 10. HAIR SIM (auto comb + auto cut) =============== */
DEMOS.hair = () => {
  const cv = $('#hairCv'); const { ctx, w, h } = setupCanvas(cv);
  const C = { x: 359, y: 170 }, R = 100, K = 16, SEG = 10, NS = 50;
  const PRE = [['Straight', .35, 0], ['Wavy', .45, .45], ['Coily', .7, 1]];
  let removed = 0, stiff = .35, curl = 0, strands = [], falling = [], pi = -1, pt = 99, before = 0, after = 0, comb = null, combPrev = null, scis = null, scisPrev = null;
  const PER = 11, cutY = C.y - 20;
  const restOf = (a, ph) => {
    const pts = []; let x = C.x + R * Math.cos(a), y = C.y + R * Math.sin(a);
    const down = a < -Math.PI / 2 ? -Math.PI * 1.5 : Math.PI / 2; pts.push({ x, y });
    for (let i = 1; i < K; i++) { const u = i / K, sm = u * u * (3 - 2 * u), base = a + (down - a) * sm * 0.85;
      const ang = base + curl * 2.3 * Math.sin(i * (0.8 + curl * 1.6) + ph); x += SEG * Math.cos(ang); y += SEG * Math.sin(ang); pts.push({ x, y }); }
    return pts;
  };
  const build = () => { strands = []; falling = []; removed = 0;
    for (let s = 0; s < NS; s++) { const a = (-172 + 164 * s / (NS - 1)) * Math.PI / 180, ph = (s * 2.39) % TAU, rest = restOf(a, ph);
      strands.push({ a, n: K, p: rest.map(q => ({ x: q.x, y: q.y, px: q.x, py: q.y })), rest }); } };
  const segX = (a, b, c, d) => { const r = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x); if (Math.abs(r) < 1e-9) return false;
    const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / r, u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / r; return t >= 0 && t <= 1 && u >= 0 && u <= 1; };
  const cutLine = (a, b) => strands.forEach(s => { for (let j = 1; j < s.n - 1; j++) if (segX(s.p[j], s.p[j + 1], a, b)) {
    falling.push({ pts: s.p.slice(j + 1).map(q => ({ x: q.x, y: q.y })), vx: rnd(-20, 20), vy: rnd(-30, 10), life: 2.5 }); removed += s.n - j - 1; s.n = j + 1; s.cut = 1; break; } });
  const lowest = () => { let m = 0; strands.forEach(s => { let lo = -1e9; for (let i = 0; i < s.n; i++) lo = Math.max(lo, s.p[i].y); m += lo; }); return m / strands.length - C.y; };
  return loop(dt => {
    pt += dt;
    if (pt > PER) { pt = 0; pi = (pi + 1) % 3; [, stiff, curl] = PRE[pi]; build(); }
    const name = PRE[pi][0];
    comb = null; scis = null;
    if (pt > 2.2 && pt < 4.8) { const u = (pt - 2.2) / 2.6, a = -Math.PI * (1.06 - u * 1.12); comb = { x: C.x + (R + 55) * Math.cos(a), y: C.y + (R + 55) * Math.sin(a) }; }
    if (pt > 5.4 && pt < 5.5) before = lowest();
    if (pt > 5.6 && pt < 6.8) { const u = (pt - 5.6) / 1.2; scis = { x: lerp(40, w - 40, u), y: cutY }; }
    if (pt > 9) after = lowest();
    if (pt < 2.2) setPhase($('#hairPhase'), `${name} hair · settling under gravity`, 'blue');
    else if (pt < 5.2) setPhase($('#hairPhase'), `${name} hair · combing`, '');
    else if (pt < 7) setPhase($('#hairPhase'), `${name} hair · cutting along the same line`, 'red');
    else { const nc = strands.filter(s => s.cut).length; setPhase($('#hairPhase'), `${name} hair · ${nc} of ${NS} strands reached the line · ${Math.round(removed / (NS * K) * 100)}% of hair removed`, 'green'); }
    const h2 = dt / 2;
    for (let it = 0; it < 2; it++) strands.forEach(s => {
      for (let i = 1; i < s.n; i++) { const q = s.p[i], vx = (q.x - q.px) * .97, vy = (q.y - q.py) * .97;
        q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + 900 * h2 * h2;
        const r = s.rest[i], k = stiff * 0.12; q.x += (r.x - q.x) * k; q.y += (r.y - q.y) * k;
        if (comb && combPrev) { const d = hyp(q.x - comb.x, q.y - comb.y); if (d < 40) { const f = (1 - d / 40) * 0.6; q.x += (comb.x - combPrev.x) * f; q.y += (comb.y - combPrev.y) * f; } } }
      for (let pass = 0; pass < 2; pass++) for (let i = 1; i < s.n; i++) { const a = s.p[i - 1], b = s.p[i], dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy) || 1;
        b.x = a.x + dx / d * SEG; b.y = a.y + dy / d * SEG;
        const dc = hyp(b.x - C.x, b.y - C.y); if (dc < R + 2) { b.x = C.x + (b.x - C.x) / dc * (R + 2); b.y = C.y + (b.y - C.y) / dc * (R + 2); } }
    });
    if (scis && scisPrev) cutLine(scisPrev, scis);
    scisPrev = scis; combPrev = comb;
    falling.forEach(f => { f.vy += 500 * dt; f.pts.forEach(q => { q.x += f.vx * dt; q.y += f.vy * dt; }); f.life -= dt; });
    falling = falling.filter(f => f.life > 0);
    ctx.clearRect(0, 0, w, h);
    drawHead(ctx, C.x, C.y, R);
    ctx.save(); ctx.strokeStyle = COL.red; ctx.setLineDash([6, 6]); ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(30, cutY); ctx.lineTo(w - 30, cutY); ctx.stroke(); ctx.restore();
    label(ctx, 'cut line (same for every hair type)', w - 34, cutY - 6, COL.red, 11, 'right');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const drawPts = (pts, n, lw) => { ctx.strokeStyle = COL.hair; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < n - 1; i++) { const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2; ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my); }
      if (n > 1) ctx.lineTo(pts[n - 1].x, pts[n - 1].y); ctx.stroke(); };
    falling.forEach(f => { ctx.globalAlpha = clamp(f.life, 0, 1); drawPts(f.pts, f.pts.length, 2.2); }); ctx.globalAlpha = 1;
    strands.forEach(s => drawPts(s.p, s.n, 2.8));
    if (comb) { ctx.save(); ctx.translate(comb.x, comb.y); ctx.rotate(Math.atan2(comb.y - C.y, comb.x - C.x) + Math.PI / 2);
      ctx.fillStyle = COL.violet; ctx.fillRect(-36, -6, 72, 10); for (let i = 0; i < 9; i++) ctx.fillRect(-34 + i * 8.5, 4, 3, 16); ctx.restore(); }
    if (scis) { ctx.save(); ctx.translate(scis.x, scis.y); ctx.strokeStyle = COL.accent; ctx.lineWidth = 3;
      const o = 0.35 * Math.abs(Math.sin(pt * 18)); ctx.beginPath(); ctx.moveTo(-22, -10 * o - 2); ctx.lineTo(18, 0); ctx.moveTo(-22, 10 * o + 2); ctx.lineTo(18, 0); ctx.stroke();
      ring(ctx, -26, -10 * o - 5, 6, COL.accent, 3); ring(ctx, -26, 10 * o + 5, 6, COL.accent, 3); ctx.restore(); }
    // preset tracker
    PRE.forEach((p, i) => { ctx.fillStyle = i === pi ? COL.accent : COL.panel2; ctx.beginPath(); ctx.roundRect(14 + i * 86, 12, 80, 24, 12); ctx.fill();
      label(ctx, p[0], 54 + i * 86, 28, i === pi ? '#fff' : COL.muted, 12, 'center'); });
    label(ctx, `${NS} strands × ${K} particles · stiffness ${stiff} · curl ${curl}`, 14, h - 12, COL.muted, 11);
  });
};

/* =============== 11. TOOLPATH (single vs multi, side by side) =============== */
function makeCoverage(cv, multi) {
  const { ctx, w, h } = setupCanvas(cv);
  const GW = 40, GH = 30, cs = 8.2, ox = (w - GW * cs) / 2, oy = 24, cx = GW / 2, cy = GH / 2, rx = GW / 2 - .5, ry = GH / 2 - .5;
  const N = GW * GH, mask = new Uint8Array(N), Lt = new Float32Array(N), L = new Float32Array(N), visited = new Uint8Array(N);
  let total = 0;
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const k = j * GW + i, u = (i + .5 - cx) / rx, v = (j + .5 - cy) / ry, rho = Math.sqrt(u * u + v * v);
    if (rho <= 1) { mask[k] = 1; total++; Lt[k] = rho < .45 ? 30 : lerp(30, 3, (rho - .45) / .55); } }
  const toolW = 4;
  let path = [], seg = 0, segT = 0, pos = null, pass = 0, done = false, t = 0, trail = [];
  function makePath(pat) {
    const P = [], st = toolW * 0.8;
    if (pat === 'raster') { let dir = 1; for (let y = 1; y < GH - .5; y += st) { const v = (y - cy) / ry; if (Math.abs(v) >= 1) continue; const hw = rx * Math.sqrt(1 - v * v);
      const a = cx - hw + 1, b = cx + hw - 1; dir > 0 ? P.push({ x: a, y }, { x: b, y }) : P.push({ x: b, y }, { x: a, y }); dir *= -1; } }
    else if (pat === 'spiral') { const turns = ry / st, n = 700; for (let i = 0; i <= n; i++) { const s = i / n, r = 1 - s * .97, a = s * turns * TAU; P.push({ x: cx + (rx - 1) * r * Math.cos(a), y: cy + (ry - 1) * r * Math.sin(a) }); } }
    else { for (let r = 1 - st / (2 * ry); r > 0.02; r -= st / ry) for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU; P.push({ x: cx + (rx - 1) * r * Math.cos(a), y: cy + (ry - 1) * r * Math.sin(a) }); } }
    return P;
  }
  const noise = tt => .55 * Math.sin(1.7 * tt) + .3 * Math.sin(4.9 * tt + 1) + .15 * Math.sin(11.3 * tt + 2);
  function cutAt(p) { const r = toolW / 2, margin = (multi && pass === 0) ? 8 : 0;
    for (let j = Math.floor(p.y - r); j <= Math.ceil(p.y + r); j++) for (let i = Math.floor(p.x - r); i <= Math.ceil(p.x + r); i++) {
      if (i < 0 || j < 0 || i >= GW || j >= GH) continue; const k = j * GW + i; if (!mask[k] || hyp(i + .5 - p.x, j + .5 - p.y) > r) continue;
      visited[k] = 1; const level = Lt[k] + margin, rem = L[k] - level; if (rem > 0) L[k] = level + noise(t + i * .07) * 4.2 * Math.min(1, rem / 22); } }
  const col = e => { if (e < -1.5) return COL.red; const u = clamp(e / 28, 0, 1), a = [56, 209, 192], b = [255, 179, 71], c = [255, 106, 43];
    const m = u < .5 ? a.map((x, i) => lerp(x, b[i], u * 2)) : b.map((x, i) => lerp(x, c[i], (u - .5) * 2)); return `rgb(${m.map(Math.round).join(',')})`; };
  return {
    reset(pat) { for (let k = 0; k < N; k++) L[k] = mask[k] ? 55 + ((k * 7919) % 60) / 10 : 0; visited.fill(0); path = makePath(pat); seg = 0; segT = 0; pass = 0; done = false; pos = null; trail = []; t = 0; },
    step(dt, speed) { t += dt; if (done) return true; let adv = dt * speed;
      while (adv > 0 && seg < path.length - 1) { const a = path[seg], b = path[seg + 1], len = hyp(b.x - a.x, b.y - a.y) || 1e-6, left = len * (1 - segT);
        const s = Math.min(adv, left, .5); segT += s / len; adv -= s; pos = { x: lerp(a.x, b.x, segT), y: lerp(a.y, b.y, segT) }; cutAt(pos); trail.push(pos); if (segT >= 1 - 1e-6) { seg++; segT = 0; } }
      if (seg >= path.length - 1) { if (multi && pass === 0) { pass = 1; seg = 0; segT = 0; trail = []; } else { done = true; pos = null; } }
      return done; },
    stats() { let err = 0, over = 0, cov = 0; for (let k = 0; k < N; k++) if (mask[k]) { cov += visited[k]; err += Math.abs(L[k] - Lt[k]); if (L[k] < Lt[k] - 1.5) over++; }
      return { cov: cov / total, err: err / total, over: over / total }; },
    draw() { ctx.clearRect(0, 0, w, h);
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const k = j * GW + i; if (!mask[k]) continue; ctx.fillStyle = col(L[k] - Lt[k]); ctx.fillRect(ox + i * cs, oy + j * cs, cs - .5, cs - .5); }
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(ox + cx * cs, oy + cy * cs, rx * cs + 2, ry * cs + 2, 0, 0, TAU); ctx.stroke();
      if (trail.length > 1) { ctx.strokeStyle = 'rgba(20,20,20,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ox + trail[0].x * cs, oy + trail[0].y * cs); for (let i = 1; i < trail.length; i += 2) ctx.lineTo(ox + trail[i].x * cs, oy + trail[i].y * cs); ctx.stroke(); }
      if (pos) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox + pos.x * cs, oy + pos.y * cs, toolW / 2 * cs, 0, TAU); ctx.fill(); ctx.stroke(); }
      label(ctx, done ? '✓ finished' : multi ? (pass === 0 ? 'pass 1 · roughing (target + 8 mm)' : 'pass 2 · finishing to target') : 'one heavy pass to target', 8, 15, COL.ink, 12);
      label(ctx, 'FRONT', ox + cx * cs, oy + GH * cs + 16, COL.muted, 10, 'center'); }
  };
}
DEMOS.path = () => {
  const A = makeCoverage($('#pathA'), false), B = makeCoverage($('#pathB'), true);
  const pats = [['raster', 'Raster (back-and-forth) pattern'], ['spiral', 'Spiral pattern'], ['contour', 'Contour-parallel pattern']];
  let pi = 0, hold = 0, ui = 0;
  const go = () => { A.reset(pats[pi][0]); B.reset(pats[pi][0]); hold = 0; setPhase($('#pathPhase'), pats[pi][1] + ': cutting…'); };
  const show = (S, el) => { const s = S.stats(); el.innerHTML = `<span>Covered <b>${Math.round(s.cov * 100)}%</b></span><span>Mean error <b>${s.err.toFixed(1)} mm</b></span><span>Too short <b style="color:${s.over > .01 ? 'var(--red)' : 'var(--green)'}">${(s.over * 100).toFixed(0)}%</b></span>`; };
  const lp = loop(dt => {
    const da = A.step(dt, 40), db = B.step(dt, 80);
    if (da && db) { hold += dt; if (hold > .3) setPhase($('#pathPhase'), 'Result: roughing + finishing avoids cutting too short', 'green'); if (hold > 5) { pi = (pi + 1) % 3; go(); } }
    A.draw(); B.draw();
    ui += dt; if (ui > .15) { ui = 0; show(A, $('#pathAS')); show(B, $('#pathBS')); }
  });
  return { start() { pi = 0; go(); lp.start(); }, stop() { lp.stop(); } };
};

/* =============== 12. HEAD TRACKING =============== */
DEMOS.track = () => {
  const cv = $('#trkCv'); const { ctx, w, h } = setupCanvas(cv);
  const base = { x: 220, y: 140 }, R = 86, off = { x: R * Math.cos(-0.9), y: R * Math.sin(-0.9) };
  const LAT = [[0, 'No sensing delay: feedback alone keeps up'], [.08, '80 ms delay: feedback lags, prediction helps'], [.22, '220 ms delay: only prediction keeps up, flinches still hurt']];
  let A = 14, tau = 0, t = 0, fl = { x: 0, y: 0, vx: 0, vy: 0 }, nextF = 3, li = 0, lt = 0;
  const hist = [], tools = [0, 1, 2].map(() => ({ x: base.x + off.x, y: base.y + off.y })), errs = [[], [], []];
  const names = ['Ignore motion (open loop)', 'Feedback on delayed pose', 'Feedback + prediction'];
  const at = tt => { if (!hist.length) return { x: base.x, y: base.y }; if (tt <= hist[0].t) return hist[0];
    for (let i = hist.length - 1; i > 0; i--) if (hist[i - 1].t <= tt) { const a = hist[i - 1], b = hist[i], u = (tt - a.t) / ((b.t - a.t) || 1); return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) }; }
    return hist[hist.length - 1]; };
  const lp = loop(dt => {
    t += dt; lt += dt; if (lt > 8) { lt = 0; li = (li + 1) % 3; errs.forEach(e => e.length = 0); }
    tau = LAT[li][0]; setPhase($('#trkPhase'), LAT[li][1], li === 0 ? 'green' : li === 1 ? '' : 'red');
    if (t > nextF) { const a = rnd(0, TAU), m = rnd(180, 300); fl.vx += m * Math.cos(a); fl.vy += m * Math.sin(a); nextF = t + rnd(3, 5); }
    fl.vx += (-70 * fl.x - 11 * fl.vx) * dt; fl.vy += (-70 * fl.y - 11 * fl.vy) * dt; fl.x += fl.vx * dt; fl.y += fl.vy * dt;
    const hc = { x: base.x + A * (.7 * Math.sin(.9 * t) + .3 * Math.sin(2.1 * t + 1.3)) + fl.x, y: base.y + A * .55 * (.6 * Math.sin(1.3 * t + .4) + .4 * Math.sin(2.9 * t)) + fl.y };
    hist.push({ t, x: hc.x, y: hc.y }); while (hist.length && hist[0].t < t - 1.5) hist.shift();
    const m = at(t - tau), m2 = at(t - tau - .06), v = { x: (m.x - m2.x) / .06, y: (m.y - m2.y) / .06 };
    const cmd = [{ x: base.x + off.x, y: base.y + off.y }, { x: m.x + off.x, y: m.y + off.y }, { x: m.x + v.x * tau + off.x, y: m.y + v.y * tau + off.y }];
    const tgt = { x: hc.x + off.x, y: hc.y + off.y }, g = 1 - Math.exp(-dt * 18), C3 = [COL.muted, COL.blue, COL.accent];
    tools.forEach((tl, i) => { tl.x += (cmd[i].x - tl.x) * g; tl.y += (cmd[i].y - tl.y) * g; errs[i].push({ t, e: hyp(tl.x - tgt.x, tl.y - tgt.y) }); while (errs[i][0].t < t - 6) errs[i].shift(); });
    ctx.clearRect(0, 0, w, h);
    if (tau > 0) { ctx.save(); ctx.strokeStyle = COL.blue; ctx.setLineDash([5, 5]); ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, TAU); ctx.stroke(); ctx.restore(); }
    drawHead(ctx, hc.x, hc.y, R, { face: true, cap: true, body: false });
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tgt.x - 9, tgt.y); ctx.lineTo(tgt.x + 9, tgt.y); ctx.moveTo(tgt.x, tgt.y - 9); ctx.lineTo(tgt.x, tgt.y + 9); ctx.stroke();
    tools.forEach((tl, i) => { ctx.strokeStyle = C3[i]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tl.x, tl.y, 8 + i * 4, 0, TAU); ctx.stroke(); });
    errs.forEach((E, i) => { const r = E.filter(p => p.t > t - 4); const rms = Math.sqrt(r.reduce((s, p) => s + p.e * p.e, 0) / (r.length || 1));
      ctx.fillStyle = C3[i]; ctx.beginPath(); ctx.arc(420, 40 + i * 34, 7, 0, TAU); ctx.fill();
      label(ctx, names[i], 436, 45 + i * 34, COL.ink2, 13); label(ctx, rms.toFixed(1) + ' mm', w - 16, 45 + i * 34, C3[i], 15, 'right'); });
    label(ctx, '+ point to cut   ◌ dashed: what the camera reports', 414, 148, COL.muted, 11);
    label(ctx, `sensing delay: ${Math.round(tau * 1000)} ms`, 414, 172, COL.ink, 14);
    const y0 = 280, ch = 100, x0 = 40, cw = w - 60;
    ctx.fillStyle = COL.panel2; ctx.fillRect(x0, y0, cw, ch);
    label(ctx, 'tracking error (mm) · last 6 s', x0, y0 - 6, COL.muted, 11);
    [0, 20, 40].forEach(vv => { const yy = y0 + ch - vv / 40 * ch; label(ctx, vv, 14, yy + 4, COL.muted, 10); ctx.strokeStyle = COL.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + cw, yy); ctx.stroke(); });
    errs.forEach((E, i) => { ctx.strokeStyle = C3[i]; ctx.lineWidth = 2; ctx.beginPath(); E.forEach((p, k) => { const xx = x0 + (p.t - (t - 6)) / 6 * cw, yy = y0 + ch - Math.min(p.e, 40) / 40 * ch; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }); ctx.stroke(); });
  });
  return { start() { li = 0; lt = 0; errs.forEach(e => e.length = 0); lp.start(); }, stop() { lp.stop(); } };
};

/* =============== 13. SAFETY (scripted hand + flinch) =============== */
DEMOS.safe = () => {
  const cv = $('#safeCv'); const { ctx, w, h } = setupCanvas(cv);
  const H0 = { x: 260, y: 200 }, R = 120, P = { x: 282, y: 193, rx: 80, ry: 98 };
  const dslow = 70, dstop = 14;
  let s = 0, v = 0, stopped = false, stopT = 0, t = 0, hand = null, flinched = false;
  const hd = { x: 0, y: 0, vx: 0, vy: 0 };
  const tool = () => ({ x: P.x + P.rx * Math.cos(s), y: P.y + P.ry * Math.sin(s) });
  const zones = () => { const z = [{ x: H0.x + 20 + hd.x, y: H0.y + 8 + hd.y, r: 20, n: 'ear' }, { x: H0.x - 80 + hd.x, y: H0.y - 8 + hd.y, r: 14, n: 'eye' }]; if (hand) z.push({ x: hand.x, y: hand.y, r: 24, n: 'hand' }); return z; };
  const nearest = () => { const p = tool(); return zones().reduce((b, z) => { const dd = hyp(p.x - z.x, p.y - z.y) - z.r - 10; return dd < b.d ? { d: dd, n: z.n } : b; }, { d: 1e9, n: '' }); };
  const lp = loop(dt => {
    t += dt; const ct = t % 15;
    if (ct > 4 && ct < 8.5) { const u = ct < 5.5 ? (ct - 4) / 1.5 : ct < 7 ? 1 : 1 - (ct - 7) / 1.5; hand = { x: lerp(w + 40, 390, u), y: lerp(40, 110, u) }; } else hand = null;
    if (ct > 10.5 && !flinched) { flinched = true; const p = tool(), z = zones()[0], dx = p.x - z.x, dy = p.y - z.y, d = hyp(dx, dy) || 1; hd.vx += dx / d * 340; hd.vy += dy / d * 340; }
    if (ct < 1) flinched = false;
    hd.vx += (-45 * hd.x - 9 * hd.vx) * dt; hd.vy += (-45 * hd.y - 9 * hd.vy) * dt; hd.x += hd.vx * dt; hd.y += hd.vy * dt;
    const nz = nearest(), d = nz.d;
    if (d < dstop && !stopped) { stopped = true; stopT = 0; }
    if (stopped) { stopT += dt; if (stopT > 1.6 && d > dstop + 6) stopped = false; }
    const scale = stopped ? 0 : clamp((d - dstop) / (dslow - dstop), 0, 1);
    v = lerp(v, 120 * scale, 1 - Math.exp(-dt * 10)); s += v * dt / 90;
    if (stopped) setPhase($('#safePhase'), `Protective stop: ${nz.n} too close`, 'red');
    else if (scale < .98) setPhase($('#safePhase'), `Slowing down: ${nz.n} nearby`, '');
    else setPhase($('#safePhase'), 'Full speed: all protected zones clear', 'green');
    ctx.clearRect(0, 0, w, h);
    drawHead(ctx, H0.x + hd.x, H0.y + hd.y, R, { face: true, cap: true });
    zones().forEach(z => {
      ctx.fillStyle = 'rgba(255,179,71,.08)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r + dslow, 0, TAU); ctx.fill();
      ring(ctx, z.x, z.y, z.r + dslow, COL.accent2, 1, [4, 6]); ring(ctx, z.x, z.y, z.r + dstop, COL.red, 1.5, [3, 3]);
      ctx.fillStyle = z.n === 'hand' ? 'rgba(106,168,255,.65)' : 'rgba(255,90,90,.35)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
      label(ctx, z.n, z.x, z.y + 4, COL.ink, 11, 'center');
    });
    ctx.strokeStyle = COL.muted; ctx.setLineDash([2, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(P.x, P.y, P.rx, P.ry, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    const p = tool(); clipper(ctx, p.x, p.y, s + Math.PI, 1, stopped ? COL.red : '#2b2f38');
    const gx = 510, gy = 230;
    label(ctx, 'tool speed', gx, gy - 70, COL.muted, 12);
    ctx.fillStyle = COL.panel2; ctx.fillRect(gx, gy - 60, 180, 18);
    ctx.fillStyle = stopped ? COL.red : scale < .98 ? COL.accent2 : COL.green; ctx.fillRect(gx, gy - 60, 180 * v / 120, 18);
    label(ctx, Math.round(v) + ' mm/s', gx + 180, gy - 26, COL.ink, 16, 'right');
    label(ctx, 'separation', gx, gy + 4, COL.muted, 12); label(ctx, Math.max(0, d).toFixed(0) + ' mm', gx + 180, gy + 4, COL.ink, 16, 'right');
    label(ctx, '- - slow-down zone (70 mm)', gx, gy + 40, COL.accent2, 11); label(ctx, '··· stop distance (14 mm)', gx, gy + 58, COL.red, 11);
    label(ctx, 'v = v_max · clip((d − d_stop)/(d_slow − d_stop), 0, 1)', 12, h - 12, COL.muted, 11);
  });
  return { start() { t = 0; stopped = false; lp.start(); }, stop() { lp.stop(); } };
};

/* =============== 14. TELEOP (auto-traced, latency cycles) =============== */
DEMOS.tele = () => {
  const cv = $('#teleCv'); const { ctx, w, h } = setupCanvas(cv);
  const C = { x: 359, y: 205 };
  const MODES = [[.0756, 'Local network: 76 ms loop'], [.0957, 'Cloud relay: 96 ms loop'], [.1905, 'Hong Kong → Finland: 191 ms loop'], [.5, 'What if the link is bad? 500 ms loop']];
  let mi = 0, mt = 0, t = 0, op = { x: C.x + 180, y: C.y }, rob = { x: C.x + 180, y: C.y }; const vmax = 90;
  const cmds = [], rhist = [], errs = [], otrail = [], rtrail = [];
  const at = (arr, tt, d) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i].t <= tt) return arr[i]; return arr[0] || d; };
  const lp = loop(dt => {
    t += dt; mt += dt; if (mt > 7) { mt = 0; mi = (mi + 1) % MODES.length; errs.length = 0; }
    const lat = MODES[mi][0]; setPhase($('#telePhase'), MODES[mi][1], mi === 3 ? 'red' : mi === 2 ? '' : 'green');
    $$('.ntab tr').forEach((tr, k) => tr.classList.toggle('on', k === mi + 1));
    op = { x: C.x + 180 * Math.cos(.45 * t), y: C.y + 125 * Math.sin(.45 * t) + 20 * Math.sin(1.35 * t) };
    cmds.push({ t, x: op.x, y: op.y }); while (cmds.length > 2 && cmds[0].t < t - 1.2) cmds.shift();
    const c = at(cmds, t - lat / 2, op);
    let dx = (c.x - rob.x) * 8, dy = (c.y - rob.y) * 8; const sp = hyp(dx, dy); if (sp > vmax) { dx *= vmax / sp; dy *= vmax / sp; }
    rob.x += dx * dt; rob.y += dy * dt;
    rhist.push({ t, x: rob.x, y: rob.y }); while (rhist.length > 2 && rhist[0].t < t - 1.2) rhist.shift();
    const seen = at(rhist, t - lat / 2, rob);
    errs.push({ t, e: hyp(rob.x - op.x, rob.y - op.y) }); while (errs[0].t < t - 5) errs.shift();
    otrail.push({ ...op }); rtrail.push({ ...rob }); if (otrail.length > 140) otrail.shift(); if (rtrail.length > 140) rtrail.shift();
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = .75; drawHead(ctx, C.x, C.y, 78, { cap: true, body: false }); ctx.globalAlpha = 1;
    const tr = (arr, col) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); arr.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); };
    ctx.globalAlpha = .5; tr(otrail, COL.accent); tr(rtrail, COL.teal); ctx.globalAlpha = 1;
    ring(ctx, seen.x, seen.y, 16, COL.teal, 1.5, [4, 4]);
    clipper(ctx, rob.x, rob.y, Math.atan2(rob.y - C.y, rob.x - C.x) + Math.PI / 2, .9, COL.teal);
    ring(ctx, op.x, op.y, 11, COL.accent, 3);
    label(ctx, "barber's hand (intent)", op.x + 14, op.y - 12, COL.accent, 11);
    label(ctx, 'robot', rob.x + 16, rob.y + 20, COL.teal, 11);
    ctx.fillStyle = COL.panel2; ctx.beginPath(); ctx.roundRect(12, 12, 255, 92, 10); ctx.fill();
    label(ctx, `command → robot   ${Math.round(lat * 500)} ms`, 24, 34, COL.ink, 12);
    label(ctx, `video → barber      ${Math.round(lat * 500)} ms`, 24, 54, COL.ink, 12);
    const rmse = Math.sqrt(errs.reduce((s, p) => s + p.e * p.e, 0) / errs.length);
    label(ctx, `gap intent ↔ robot   ${rmse.toFixed(1)} mm`, 24, 82, rmse > 20 ? COL.red : COL.green, 13);
    label(ctx, 'dashed ring = what the barber sees on video', 12, h - 12, COL.muted, 11);
  });
  return { start() { mi = 0; mt = 0; errs.length = 0; lp.start(); }, stop() { lp.stop(); } };
};

/* =============== 15. FLEET (auto supervisor) =============== */
DEMOS.fleet = () => {
  const reasons = ['Trajectory deviation', 'Safety sensor alert', 'Blocked path', 'Customer request'];
  const MAT = [[.15, 'Low autonomy: frequent alerts, barber overloaded', 'red'], [.5, 'Medium autonomy: barber busy but coping', ''], [.92, 'High autonomy: one barber runs five robots', 'green']];
  const N = 5; let mi = 0, mt = 0, done = 0, ints = 0, waitT = 0, totT = 0, st = [], supBusy = 0, ui = 0, lam = .05;
  const build = () => { st = Array.from({ length: N }, (_, i) => ({ id: i, prog: rnd(0, 70), state: 'cut', reason: '', tt: 0 }));
    $('#stations').innerHTML = st.map(s => `<div class="st" id="st${s.id}"><div class="h"><span>Robot ${s.id + 1}</span><span class="pc">0%</span></div><div class="pb"><i></i></div><div class="s"></div></div>`).join('') +
      `<div class="st" style="border-color:var(--accent)"><div class="h"><span>Barber</span><span class="acc">supervisor</span></div><div class="s" id="barber" style="font-size:13px"></div></div>`; };
  const lp = loop(dt => {
    mt += dt; if (mt > 13) { mt = 0; mi = (mi + 1) % 3; done = ints = 0; waitT = totT = 0; }
    const [mat, txt, cls] = MAT[mi]; setPhase($('#fleetPhase'), txt, cls);
    lam = lerp(.09, .006, mat);
    st.forEach(s => {
      totT += dt; s.tt += dt;
      if (s.state === 'cut') { s.prog += dt * 100 / 14; if (Math.random() < lam * dt) { s.state = 'alert'; s.reason = reasons[Math.floor(Math.random() * 4)]; s.tt = 0; }
        if (s.prog >= 100) { s.state = 'swap'; s.tt = 0; done++; } }
      else if (s.state === 'alert') waitT += dt;
      else if (s.state === 'fix' && s.tt > 2.5) s.state = 'cut';
      else if (s.state === 'swap' && s.tt > 2) { s.state = 'cut'; s.prog = 0; }
    });
    supBusy -= dt;
    if (supBusy <= 0) { const a = st.filter(s => s.state === 'alert').sort((x, y) => y.tt - x.tt)[0]; if (a) { a.state = 'fix'; a.tt = 0; ints++; supBusy = 2.5; } }
    ui += dt; if (ui < .1) return; ui = 0;
    st.forEach(s => { const e = $(`#st${s.id}`); if (!e) return; e.classList.toggle('alert', s.state === 'alert');
      $('i', e).style.width = Math.min(100, s.prog) + '%'; $('.pc', e).textContent = Math.min(100, Math.round(s.prog)) + '%';
      $('.s', e).innerHTML = s.state === 'cut' ? 'Cutting on its own' : s.state === 'alert' ? `<b class="red">⚠ ${s.reason}</b><br>waiting ${s.tt.toFixed(0)} s` : s.state === 'fix' ? '<span class="acc">Barber resolving…</span>' : '<span class="teal">✓ Done · next client</span>'; });
    const f = st.find(s => s.state === 'fix'), q = st.filter(s => s.state === 'alert').length;
    $('#barber').innerHTML = f ? `Helping <b>Robot ${f.id + 1}</b>${q ? `<br><span class="red">${q} waiting in queue</span>` : ''}` : '<span class="muted">Monitoring all robots</span>';
    const rho = N * lam * 2.5; $('#fRho').style.width = Math.min(100, rho * 100) + '%'; $('#fRhoV').textContent = Math.round(rho * 100) + '%';
    $('#fRho').style.background = rho > .8 ? 'var(--red)' : ''; $('#fRhoTxt').textContent = rho > .8 ? '· overloaded: robots queue' : rho > .4 ? '· busy' : '· comfortable';
    $('#fDone').textContent = done; $('#fInt').textContent = ints; $('#fWait').textContent = Math.round(waitT / (totT || 1) * 100) + '%';
  });
  return { start() { mi = 0; mt = 0; done = ints = 0; waitT = totT = 0; supBusy = 0; build(); lp.start(); }, stop() { lp.stop(); } };
};

/* =============== 16. VLA (auto-typed instructions) =============== */
DEMOS.vla = () => {
  const cv = $('#vlaCv'); const { ctx, w, h } = setupCanvas(cv);
  const cur = { top: 50, fringe: 45, left: 35, right: 35, back: 35 };
  const presets = ['Short back and sides, keep 3 cm on top', 'Skin fade with 2 cm on top, keep the fringe', 'Just a trim, 1 cm off everywhere', 'Make it shorter on the left side', 'Something cool'];
  const mm = (n, u) => u === 'cm' ? n * 10 : n;
  function parse(q) {
    const s = q.toLowerCase(), z = { ...cur }; let fade = null, hit = false; const notes = [];
    const off = s.match(/(\d+(?:\.\d+)?)\s*(cm|mm)\s*off/);
    if (/trim|tidy/.test(s)) { const a = off ? mm(+off[1], off[2]) : 10; Object.keys(z).forEach(k => z[k] -= a); hit = true; notes.push(`remove ${a} mm everywhere`); }
    if (/back and sides/.test(s)) { z.left = z.right = z.back = 9; hit = true; notes.push('back & sides → 9 mm'); }
    if (/fade/.test(s)) { fade = { bottom: /skin/.test(s) ? 0.5 : 3, top: 12 }; z.left = z.right = z.back = fade.top; hit = true; notes.push(`fade ${fade.bottom} → ${fade.top} mm`); }
    const re1 = /(\d+(?:\.\d+)?)\s*(cm|mm)\s*(?:on|at|for|in)?\s*(?:the\s*)?(top|sides?|back|fringe|front|left|right)/g; let m;
    function setZ(k, v) { hit = true; if (k.startsWith('side')) z.left = z.right = v; else if (k === 'front') z.fringe = v; else z[k] = v; notes.push(`${k} → ${v} mm`); }
    while ((m = re1.exec(s))) setZ(m[3], mm(+m[1], m[2]));
    if (/keep (the )?(fringe|front)/.test(s)) { z.fringe = cur.fringe; hit = true; notes.push('fringe unchanged'); }
    const sh = s.match(/shorter on the (left|right)/); if (sh) { z[sh[1]] = Math.max(3, z[sh[1]] - 10); hit = true; notes.push(`${sh[1]} side −10 mm`); }
    Object.keys(z).forEach(k => z[k] = Math.max(0.5, Math.min(z[k], cur[k])));
    return { z, fade, hit, notes };
  }
  function lenAt(u, v, P) {
    const r = Math.sqrt(u * u + v * v), an = Math.atan2(v, u) * 180 / Math.PI;
    const k = r < .55 ? 'top' : (an < -45 && an > -135) ? 'fringe' : (an > 45 && an < 135) ? 'back' : Math.abs(an) >= 135 ? 'left' : 'right';
    if (P.fade && k !== 'top' && k !== 'fringe') return lerp(P.fade.top, P.fade.bottom, clamp((r - .6) / .4, 0, 1));
    return P.z[k];
  }
  function drawMap(P) {
    ctx.clearRect(0, 0, w, h); const cx = 130, cy = 125, rx = 92, ry = 110, st = 4;
    for (let y = cy - ry; y < cy + ry; y += st) for (let x = cx - rx; x < cx + rx; x += st) {
      const u = (x + st / 2 - cx) / rx, v = (y + st / 2 - cy) / ry; if (u * u + v * v > 1) continue;
      const q = clamp(lenAt(u, v, P) / 50, 0, 1); ctx.fillStyle = `rgb(${Math.round(lerp(56, 255, q))},${Math.round(lerp(209, 106, q))},${Math.round(lerp(192, 43, q))})`; ctx.fillRect(x, y, st, st); }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
    const lab = (t, x, y) => { ctx.fillStyle = 'rgba(255,255,255,.85)'; const wd = ctx.measureText(t).width + 8; ctx.fillRect(x - wd / 2, y - 11, wd, 15); ctx.fillStyle = '#111'; ctx.fillText(t, x, y); };
    const f = v => v < 10 ? v.toFixed(1) : Math.round(v);
    lab(`top ${f(P.z.top)}`, cx, cy + 4); lab(`fringe ${f(P.z.fringe)}`, cx, cy - ry + 26);
    lab(P.fade ? `fade→${P.fade.bottom}` : `back ${f(P.z.back)}`, cx, cy + ry - 14);
    lab(`L ${f(P.fade ? P.fade.top : P.z.left)}`, cx - rx + 24, cy + 4); lab(`R ${f(P.fade ? P.fade.top : P.z.right)}`, cx + rx - 24, cy + 4);
    ctx.textAlign = 'left'; ctx.fillStyle = COL.muted; ctx.font = '11px Inter'; ctx.fillText('mm', 268, 36);
    for (let i = 0; i <= 10; i++) { const q = i / 10; ctx.fillStyle = `rgb(${Math.round(lerp(56, 255, q))},${Math.round(lerp(209, 106, q))},${Math.round(lerp(192, 43, q))})`; ctx.fillRect(268, 210 - i * 15, 16, 15); }
    ctx.fillStyle = COL.muted; ctx.fillText('50', 290, 70); ctx.fillText('0', 290, 222); ctx.fillText('target lengths · top view', 12, h - 6);
  }
  let timers = [], pi = 0, iv = null;
  const T = (f, ms) => timers.push(setTimeout(f, ms));
  function run(q) {
    timers.forEach(clearTimeout); timers = [];
    const boxes = $$('#vlaPipe .pb'); boxes.forEach(b => b.classList.remove('lit'));
    $('#vlaPlan').textContent = ''; $('#vlaAct').textContent = ''; $('#vlaText').textContent = '';
    for (let i = 1; i <= q.length; i++) T(() => $('#vlaText').textContent = '"' + q.slice(0, i), i * 45);
    T(() => $('#vlaText').textContent = '"' + q + '"', q.length * 45 + 60);
    const t0 = q.length * 45 + 300, P = parse(q);
    boxes.forEach((b, i) => T(() => { boxes.forEach(x => x.classList.remove('lit')); b.classList.add('lit'); }, t0 + i * 300));
    T(() => {
      if (!P.hit) {
        $('#vlaPlan').innerHTML = `<b class="acc">⚠ Ambiguous instruction</b>\n\nConfidence low → do not cut.\n\nAsk the client:\n  "How short on the sides?\n   Keep the length on top?"\n\nShow 3 reference styles.`;
        $('#vlaAct').innerHTML = '<span class="muted">No actions emitted.\nSafety filter: HOLD ✋</span>'; drawMap({ z: cur }); return; }
      drawMap(P);
      const plan = { interpretation: P.notes, target_mm: Object.fromEntries(Object.entries(P.z).map(([k, v]) => [k, +v.toFixed(1)])), passes: ['rough +8 mm', 'finish'], keep_out: ['ears', 'eyes', 'neck'] };
      $('#vlaPlan').textContent = '// structured style spec\n' + JSON.stringify(plan, null, 1).replace(/\n\s+/g, '\n  ').replace(/\[\n\s+/g, '[').replace(/\n\s*\]/g, ']');
      const zs = P.fade ? ['back', 'left', 'right', 'top'] : Object.keys(P.z), lines = ['// action chunk @ 30 Hz'];
      for (let i = 0; i < 7; i++) { const zn = zs[i % zs.length]; lines.push(`<a z=${zn.padEnd(6)} Δp=(${rnd(-2, 2).toFixed(1)},${rnd(-2, 2).toFixed(1)},${rnd(-.5, .5).toFixed(1)}) guard=${(P.z[zn] ?? 9).toFixed(0)}mm>`); }
      lines.push('', '✓ keep-out zones respected', '✓ min length ≥ 0.5 mm', '✓ |v| ≤ 50 mm/s near ears');
      let k = 0; const el = $('#vlaAct');
      const typeL = () => { if (k >= lines.length) return; el.innerHTML += `<span class="${lines[k].startsWith('<a') ? 'tok' : lines[k].startsWith('✓') ? 'green' : 'muted'}">${lines[k].replace(/</g, '&lt;')}</span>\n`; k++; T(typeL, 120); };
      typeL();
    }, t0 + boxes.length * 300);
  }
  drawMap({ z: cur });
  return { start() { pi = 0; run(presets[0]); clearInterval(iv); iv = setInterval(() => { pi = (pi + 1) % presets.length; run(presets[pi]); }, 9500); },
           stop() { clearInterval(iv); timers.forEach(clearTimeout); timers = []; } };
};

/* =============== 17. FLYWHEEL =============== */
DEMOS.fly = () => {
  const nodes = [
    ['Teleoperated', 'haircuts', 'Expert barbers drive robots remotely (TeleHairing-style). A useful service today, and every stroke is an expert demonstration.'],
    ['Multimodal', 'logs', 'Synchronised multi-view video, tool pose, force/torque, clipper state, spoken instructions ("a bit shorter here") and outcome ratings.'],
    ['Learn the', 'policy', 'Behaviour cloning and VLA fine-tuning on the logs, pre-trained in hair simulation. The CNC planner stays as a verifiable scaffold.'],
    ['Supervised', 'autonomy', 'Robots execute routine cuts; one barber supervises several. Throughput rises with autonomy.'],
    ['Interventions', '= labels', 'Every correction marks exactly where the policy failed, the most valuable data there is (DAgger-style). Back to the top.'],
  ];
  const svg = $('#flySvg'), C = { x: 280, y: 225 }, R = 165;
  const pos = nodes.map((_, i) => { const a = -Math.PI / 2 + i * TAU / 5; return { x: C.x + R * Math.cos(a), y: C.y + R * Math.sin(a) }; });
  svg.innerHTML = `<circle cx="${C.x}" cy="${C.y}" r="${R}" fill="none" stroke="var(--line)" stroke-width="3"/>
    <circle cx="${C.x}" cy="${C.y}" r="${R}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="10 14" opacity=".7"><animate attributeName="stroke-dashoffset" from="0" to="-48" dur="1.4s" repeatCount="indefinite"/></circle>
    <text x="${C.x}" y="${C.y - 4}" text-anchor="middle" font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="22" fill="var(--ink)">Data</text>
    <text x="${C.x}" y="${C.y + 22}" text-anchor="middle" font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="22" fill="var(--accent)">flywheel</text>` +
    nodes.map((n, i) => `<g class="fn" data-i="${i}"><circle cx="${pos[i].x}" cy="${pos[i].y}" r="54" fill="var(--panel)" stroke="var(--line)" stroke-width="2"/>
      <text x="${pos[i].x}" y="${pos[i].y - 2}" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--ink)">${n[0]}</text><text x="${pos[i].x}" y="${pos[i].y + 15}" text-anchor="middle" font-size="13.5" font-weight="600" fill="var(--ink)">${n[1]}</text></g>`).join('') +
    `<circle id="flyDot" r="8" fill="var(--accent2)"/>`;
  const dot = $('#flyDot', svg); let cur = 0, ang = -Math.PI / 2;
  const pick = i => { cur = i; $$('.fn circle', svg).forEach((c, k) => { c.setAttribute('stroke', k === i ? 'var(--accent)' : 'var(--line)'); c.setAttribute('stroke-width', k === i ? 4 : 2); c.setAttribute('fill', k === i ? 'var(--accentBg)' : 'var(--panel)'); });
    $('#flyCard').innerHTML = `<div style="animation:fadein .4s"><span class="tag">Stage ${i + 1} of 5</span><h3 style="margin-top:10px;font-size:21px">${nodes[i][0]} ${nodes[i][1]}</h3><p style="font-size:16px">${nodes[i][2]}</p></div>`; };
  const cy = cycle(3800, 5, pick);
  const lp = loop(dt => { const ta = -Math.PI / 2 + cur * TAU / 5; const d = ((ta - ang) % TAU + TAU) % TAU; ang += Math.min(d, dt * 2.2); dot.setAttribute('cx', C.x + R * Math.cos(ang)); dot.setAttribute('cy', C.y + R * Math.sin(ang)); });
  return both(cy, lp);
};

/* =============== 18. LEVELS =============== */
DEMOS.lvl = () => {
  const L = [
    ['Smart tools', 'Guarded or length-sensing clippers; the human does everything.', 'e.g. consumer trimmers with guides', [10, 0, 15, 0]],
    ['Teleoperation', 'A barber drives the robot remotely; the robot adds precision and safety limits.', 'e.g. TeleHairing (2026): cross-continent teleoperated clipper', [40, 10, 55, 0]],
    ['Scripted autonomy', 'The robot executes a pre-planned toolpath on a fixed head; a human supervises 1:1, ready to stop.', 'Most lab prototypes on mannequins', [60, 75, 90, 10]],
    ['Supervised autonomy', 'Online head-motion compensation and routine styles; one human supervises several robots and is the fallback.', 'Near-term commercial target (salons, airports)', [85, 90, 95, 45]],
    ['Instruction-driven', 'Style from words or a photo across hair types (VLA + planner); remote support only.', 'Research frontier: data and certification needed', [95, 97, 98, 80]],
    ['Full autonomy', 'Any style, any hair, any client, no human oversight.', 'Not feasible today', [100, 100, 100, 100]],
  ];
  const B = ['Precise, safe actuation that a person can hand over to.', 'Repeatable autonomous paths and reliable head registration.', 'Robust head-motion compensation plus a certified safety case.', 'Generalising across hair types and styles: VLA + large, diverse data.', 'Open-world safety, verified learned policies, public trust.', 'This is the end of the scale.'];
  const labs = ['Perception', 'Planning', 'Execution', 'Fallback / safety'];
  $('#lvls').innerHTML = L.map((l, i) => `<div class="lvl" data-i="${i}">${i === 2 ? '<span class="flag" style="background:var(--blue);color:#fff">RESEARCH TODAY</span>' : i === 3 ? '<span class="flag" style="background:var(--accent);color:#fff">NEXT TARGET</span>' : ''}<b>L${i}</b><span>${l[0]}</span></div>`).join('');
  return cycle(4200, 6, i => { $$('#lvls .lvl').forEach((e, k) => e.classList.toggle('on', k === i));
    $('#lvlT').textContent = `L${i} · ${L[i][0]}`; $('#lvlD').textContent = L[i][1]; $('#lvlE').textContent = L[i][2]; $('#lvlB').textContent = B[i];
    $('#lvlShare').innerHTML = labs.map((n, k) => `<div class="share"><span>${n}</span><div class="tr"><div class="r" style="width:${L[i][3][k]}%">${L[i][3][k] > 12 ? L[i][3][k] + '%' : ''}</div><div class="hm" style="width:${100 - L[i][3][k]}%">${100 - L[i][3][k] > 12 ? (100 - L[i][3][k]) + '%' : ''}</div></div></div>`).join(''); });
};

/* =============== 19. CHALLENGES =============== */
DEMOS.chal = () => {
  const F = [
    ['Head motion', 'Real-time pose estimation and prediction under <b>breathing, talking and flinches</b>, while the tool blocks the camera.'],
    ['Hair variability', 'Straight to coily, fine to coarse, wet or dry. Models and data must cover <b>all hair types</b>.'],
    ['Safety certification', 'No established standard for <b>close-contact cutting robots</b> yet. Needs hazard analysis and certified stops.'],
    ['Measuring quality', 'What is a "good" haircut? <b>Geometric error + symmetry + client preference</b> as one measurable objective.'],
    ['Data scarcity', 'No large haircut datasets. Teleop logging, simulation, <b>privacy-preserving capture</b>.'],
    ['Hair sim-to-real', 'Strand physics that is <b>real-time</b> yet predicts <b>length after the cut relaxes</b>.'],
    ['Verifying learned policies', 'Certifying a VLA: <b>runtime monitors, shielding, control barrier functions</b>.'],
    ['Trust & acceptance', 'Would you let it near your ears? <b>Consent, client-approved paths</b>, visible oversight.'],
  ];
  $('#chal').innerHTML = F.map((f, i) => `<div class="c"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${f[0]}</h3><p>${f[1]}</p></div>`).join('');
  return cycle(2600, 8, i => $$('#chal .c').forEach((c, k) => c.classList.toggle('hl', k === i)));
};

/* =============== 20. FUTURE =============== */
DEMOS.future = () => {
  const ic = {
    salon: '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="var(--accent)" stroke-width="2"><rect x="5" y="8" width="24" height="20" rx="3"/><path d="M5 14h24M12 8V4M22 8V4"/><circle cx="17" cy="21" r="3"/></svg>',
    remote: '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="17" cy="17" r="12"/><path d="M5 17h24M17 5c4 4 4 20 0 24M17 5c-4 4-4 20 0 24"/></svg>',
    care: '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M17 29s-11-6.5-11-14a6 6 0 0 1 11-3.3A6 6 0 0 1 28 15c0 7.5-11 14-11 14z"/><path d="M13 16h8M17 12v8"/></svg>',
  };
  const H = [
    [['salon', 'Salon', 'Lab prototypes on mannequins with scripted paths. No commercial haircutting robots deployed yet (Li, 2025).', 20, 'Reliable head tracking on real people'],
     ['remote', 'Remote barber', 'Teleoperation baselines across continents (Hong Kong → Finland) with ~0.2 s loops, measured and logged.', 30, 'Latency-robust control and haptic feedback'],
     ['care', 'Care & assistive', 'Assistive combing and brushing research; systematic work on inclusion across hair types.', 15, 'Human trials and clinical safety cases']],
    [['salon', 'Robotic salon pods', 'Malls, airports and offices: supervised autonomy with one barber overseeing several robots.', 55, 'Certification and robust supervised autonomy'],
     ['remote', 'Remote-barber platform', 'Ride-hailing-style: book a remote expert; the robot executes locally inside a safety envelope.', 60, 'Network gating, cybersecurity, trust'],
     ['care', 'Care-home pilots', 'Grooming for bedridden or mobility-limited residents; staff supervise, robots do repetitive work.', 45, 'Gentle contact control and acceptance studies']],
    [['salon', 'Say it, show it, get it', 'Describe a style or show a photo: a VLA writes the plan, a certified controller executes, you approve the preview.', 85, 'VLA policies with verified safety shields'],
     ['remote', 'Experts teach, robots generalise', 'Barbers become teachers and supervisors; personal style profiles travel with you.', 80, 'Large, diverse, privacy-preserving datasets'],
     ['care', 'Grooming at home', 'General-purpose assistive robots with grooming skills, supporting ageing in place.', 75, 'Affordable general-purpose hardware']],
  ];
  return cycle(8000, 3, k => { $$('#horizon .chip').forEach(c => c.classList.toggle('on', +c.dataset.h === k));
    $('#scen').innerHTML = H[k].map(([i, t, d, m, n]) => `<div class="card" style="display:flex;flex-direction:column;gap:8px;animation:fadein .5s">${ic[i]}<h3 style="font-size:20px">${t}</h3><p style="font-size:15.5px">${d}</p>
      <div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--panel2)"><div class="tiny muted" style="text-transform:uppercase;letter-spacing:.1em">What it needs</div><div style="font-size:15px;margin-top:4px">${n}</div></div>
      <div style="margin-top:auto"><div class="tiny muted">Autonomy</div><div class="bar" style="grid-template-columns:1fr"><div class="tr"><div class="fl" style="width:${m}%"></div></div></div></div></div>`).join(''); });
};
