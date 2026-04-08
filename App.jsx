import { useState, useEffect, useRef, useCallback } from 'react';

// ─── DATA ────────────────────────────────────────────────────────────────────
const PANELS = [
  { id: 'P01', st: 'opt', kw: 98.2, tmp: 42, r: 0.02 },
  { id: 'P02', st: 'opt', kw: 97.8, tmp: 41, r: 0.01 },
  { id: 'P03', st: 'opt', kw: 99.1, tmp: 40, r: 0.01 },
  { id: 'P04', st: 'opt', kw: 96.5, tmp: 43, r: 0.03 },
  { id: 'P05', st: 'hlt', kw: 92.3, tmp: 44, r: 0.05 },
  { id: 'P06', st: 'hlt', kw: 91.8, tmp: 43, r: 0.06 },
  { id: 'P07', st: 'hlt', kw: 93.5, tmp: 42, r: 0.04 },
  { id: 'P08', st: 'hlt', kw: 90.2, tmp: 45, r: 0.07 },
  { id: 'P09', st: 'hlt', kw: 94.1, tmp: 41, r: 0.04 },
  { id: 'P10', st: 'hlt', kw: 88.7, tmp: 46, r: 0.08 },
  { id: 'P11', st: 'hlt', kw: 89.3, tmp: 45, r: 0.07 },
  { id: 'P12', st: 'hlt', kw: 91.0, tmp: 44, r: 0.06 },
  { id: 'P13', st: 'hlt', kw: 92.8, tmp: 43, r: 0.05 },
  { id: 'P14', st: 'hlt', kw: 87.4, tmp: 47, r: 0.09 },
  { id: 'P15', st: 'shd', kw: 65.2, tmp: 38, r: 0.31 },
  { id: 'P16', st: 'shd', kw: 62.8, tmp: 37, r: 0.35 },
  { id: 'P17', st: 'shd', kw: 68.1, tmp: 39, r: 0.28 },
  { id: 'P18', st: 'sol', kw: 74.5, tmp: 49, r: 0.22 },
  { id: 'P19', st: 'sol', kw: 71.2, tmp: 51, r: 0.25 },
  { id: 'P20', st: 'sol', kw: 76.8, tmp: 48, r: 0.20 },
  { id: 'P21', st: 'hlt', kw: 90.5, tmp: 44, r: 0.07 },
  { id: 'P22', st: 'hlt', kw: 88.9, tmp: 45, r: 0.08 },
  { id: 'P23', st: 'hlt', kw: 91.7, tmp: 43, r: 0.06 },
  { id: 'P24', st: 'crt', kw: 38.2, tmp: 58, r: 0.62 },
  { id: 'P25', st: 'crt', kw: 35.6, tmp: 61, r: 0.67 },
];

const NST = ['on','on','on','on','on','on','on','on','on','on','on','on','on','on','wr','wr','wr','wr','wr','wr','on','on','on','er','er'];

const FAULTS = [
  { type: 'TRANSIENT SHADOW', fc: '#4AA8FF', time: '14:32:07', desc: 'Sub-cycle transient at Node P15–P17. DWT D₁ coefficients exceed threshold. PSO reconfiguration initiated.', tags: ['SHADOW','DWT-DETECTED','PSO-ACTIVE'] },
  { type: 'STATIC SOILING',   fc: '#FFAA00', time: '14:28:44', desc: 'Sustained power degradation at P18–P20. RPNDD = 0.22. Cleaning cycle recommended. Soiling density: 18%.', tags: ['SOILING','RPNDD:0.22','MAINTENANCE'] },
  { type: 'CRITICAL FAULT',   fc: '#FF3860', time: '14:21:15', desc: 'Node P24–P25 severe degradation. RPNDD = 0.65. Self-healing bypass ENGAGED. RUL forecast: 12 days.', tags: ['CRITICAL','BYPASS-ON','RUL:12d'] },
  { type: 'PSO OPTIMIZED',    fc: '#00E5A0', time: '14:18:33', desc: 'Topology reconfiguration complete. 3 nodes bypassed. Power yield recovered: +8.4%. Grid efficiency restored.', tags: ['OPTIMIZED','YIELD+8.4%','RESOLVED'] },
  { type: 'SHADOW EVENT',     fc: '#4AA8FF', time: '13:55:22', desc: 'Cloud shadow transient at P08–P09. Duration: 2.3 seconds. Automatically classified by DWT forensic layer.', tags: ['SHADOW','AUTO-CLEARED','2.3s'] },
  { type: 'BLOCKCHAIN TX',    fc: '#26C6DA', time: '13:40:08', desc: 'P2P energy trade executed. 0.8 MWh sold to Grid Node B7. Smart contract confirmed. Revenue: ₹4,240.', tags: ['P2P','CONFIRMED','₹4,240'] },
];

const TXS = [
  { hash: '0x4F2A...3E2B', info: '0.8 MWh → Grid Node B7', val: '₹4,240',  en: '0.8 MWh' },
  { hash: '0xA91C...F04D', info: '1.2 MWh → Grid Node C3', val: '₹6,360',  en: '1.2 MWh' },
  { hash: '0x2B8E...19A1', info: '0.6 MWh → Grid Node A2', val: '₹3,180',  en: '0.6 MWh' },
  { hash: '0xD35F...80CC', info: '0.4 MWh → Grid Node D5', val: '₹2,120',  en: '0.4 MWh' },
];

// ─── SOUND ENGINE ─────────────────────────────────────────────────────────────
function useSnd() {
  const acRef = useRef(null);
  return useCallback((type) => {
    try {
      if (!acRef.current) acRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const C = acRef.current, o = C.createOscillator(), g = C.createGain();
      o.connect(g); g.connect(C.destination);
      const t = C.currentTime;
      if (type === 'nav') {
        o.frequency.setValueAtTime(1100, t); o.frequency.exponentialRampToValueAtTime(1600, t + 0.05);
        g.gain.setValueAtTime(0.055, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      } else if (type === 'soft') {
        o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(850, t + 0.07);
        g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      } else if (type === 'alert') {
        o.frequency.setValueAtTime(380, t); o.frequency.setValueAtTime(560, t + 0.06);
        o.frequency.setValueAtTime(360, t + 0.12);
        g.gain.setValueAtTime(0.11, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      } else if (type === 'term') {
        o.type = 'square'; o.frequency.setValueAtTime(1700, t);
        g.gain.setValueAtTime(0.022, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      }
      o.start(t); o.stop(t + 0.28);
    } catch (e) {}
  }, []);
}

// ─── CANVAS HELPERS ───────────────────────────────────────────────────────────
function drawPVChart(canvas) {
  if (!canvas) return;
  const W = canvas.parentElement?.offsetWidth || 400;
  const H = canvas.parentElement?.offsetHeight || 145;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const N = 60, P = { t: 8, r: 14, b: 24, l: 40 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;
  const min = 750, max = 920;
  const ideal  = Array.from({ length: N }, (_, i) => 820 + Math.sin(i * 0.2) * 34 + i * 0.5);
  const actual = ideal.map(v => v - Math.random() * 26 - 8);
  const px = i => P.l + (i / (N - 1)) * iW;
  const py = v => P.t + (1 - (v - min) / (max - min)) * iH;
  ctx.strokeStyle = 'rgba(255,100,20,0.065)'; ctx.lineWidth = 0.5;
  [770, 810, 850, 890].forEach(v => {
    ctx.beginPath(); ctx.moveTo(P.l, py(v)); ctx.lineTo(W - P.r, py(v)); ctx.stroke();
    ctx.fillStyle = 'rgba(180,160,130,0.3)'; ctx.font = '8.5px DM Sans';
    ctx.fillText(v, 3, py(v) + 3);
  });
  // ideal fill
  ctx.beginPath(); ideal.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)));
  ctx.lineTo(px(N - 1), H - P.b); ctx.lineTo(px(0), H - P.b); ctx.closePath();
  const ag = ctx.createLinearGradient(0, 0, 0, H);
  ag.addColorStop(0, 'rgba(255,200,0,0.09)'); ag.addColorStop(1, 'rgba(255,200,0,0)');
  ctx.fillStyle = ag; ctx.fill();
  ctx.beginPath(); ideal.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)));
  ctx.strokeStyle = 'rgba(255,200,0,0.38)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
  // actual fill
  ctx.beginPath(); actual.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)));
  ctx.lineTo(px(N - 1), H - P.b); ctx.lineTo(px(0), H - P.b); ctx.closePath();
  const ag2 = ctx.createLinearGradient(0, 0, 0, H);
  ag2.addColorStop(0, 'rgba(255,107,53,0.2)'); ag2.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.fillStyle = ag2; ctx.fill();
  ctx.beginPath(); actual.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)));
  ctx.strokeStyle = '#FF6A00'; ctx.lineWidth = 1.4; ctx.stroke();
  [[14, true], [28, false], [42, true]].forEach(([i, sh]) => {
    ctx.beginPath(); ctx.arc(px(i), py(actual[i]), 3.2, 0, Math.PI * 2);
    ctx.fillStyle = sh ? '#4AA8FF' : '#FF3860'; ctx.fill();
  });
  ctx.font = '8.5px DM Sans';
  ctx.fillStyle = 'rgba(255,200,0,0.55)'; ctx.fillRect(P.l, 2, 13, 2);
  ctx.fillStyle = 'rgba(180,160,130,0.45)'; ctx.fillText('DIGITAL TWIN', P.l + 16, 8);
  ctx.fillStyle = '#FF6A00'; ctx.fillRect(P.l + 96, 2, 13, 2);
  ctx.fillStyle = 'rgba(180,160,130,0.45)'; ctx.fillText('ACTUAL', P.l + 113, 8);
}

function drawRPNChart(canvas) {
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || 380; canvas.height = 95;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = 95, N = 42, P = { t: 6, r: 8, b: 16, l: 28 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;
  ctx.clearRect(0, 0, W, H);
  const vals = Array.from({ length: N }, (_, i) => {
    if (i === 8 || i === 9 || i === 10) return 0.31 + Math.random() * 0.06;
    if (i === 22 || i === 23) return 0.23 + Math.random() * 0.04;
    if (i === 33 || i === 34) return 0.63 + Math.random() * 0.05;
    return 0.05 + Math.random() * 0.05;
  });
  const px = i => P.l + (i / (N - 1)) * iW;
  const py = v => P.t + (1 - v / 0.8) * iH;
  ctx.strokeStyle = 'rgba(255,100,20,0.07)'; ctx.lineWidth = 0.5;
  [0.15, 0.3, 0.6].forEach(v => {
    ctx.beginPath(); ctx.moveTo(P.l, py(v)); ctx.lineTo(W - P.r, py(v)); ctx.stroke();
    ctx.fillStyle = 'rgba(180,160,130,0.3)'; ctx.font = '8px Fira Code'; ctx.fillText(v.toFixed(2), 1, py(v) + 3);
  });
  ctx.strokeStyle = 'rgba(255,80,80,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(P.l, py(0.15)); ctx.lineTo(W - P.r, py(0.15)); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); vals.forEach((v, i) => i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v)));
  ctx.strokeStyle = '#FF6A00'; ctx.lineWidth = 1.4; ctx.stroke();
}

function buildDWTSvg(svgEl) {
  if (!svgEl) return;
  let pts = '';
  for (let x = 0; x <= 500; x += 4) {
    const b = 25, s = Math.sin(x * 0.11) * 9 + Math.sin(x * 0.36) * 3.5;
    const n = (Math.random() - 0.5) * 4.5;
    const sp = (x > 145 && x < 188) || (x > 305 && x < 342) ? (Math.random() * 22 - 11) : 0;
    pts += `${x},${b + s + n + sp} `;
  }
  svgEl.innerHTML = `<defs>
    <linearGradient id="df" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF6A00" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#FF6A00" stop-opacity="0"/>
    </linearGradient></defs>
    <polygon points="${pts}500,50 0,50" fill="url(#df)"/>
    <polyline points="${pts}" fill="none" stroke="#FF6A00" stroke-width="1.1" opacity="0.82"/>
    <line x1="148" y1="0" x2="148" y2="50" stroke="rgba(74,168,255,0.42)" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="308" y1="0" x2="308" y2="50" stroke="rgba(255,56,96,0.42)" stroke-width="1" stroke-dasharray="2,2"/>
    <text x="151" y="11" fill="rgba(74,168,255,0.58)" font-size="7" font-family="Fira Code">SHADOW</text>
    <text x="311" y="11" fill="rgba(255,56,96,0.58)" font-size="7" font-family="Fira Code">SOILING</text>`;
}

// ─── INTRO ANIMATION ──────────────────────────────────────────────────────────
function IntroScreen({ onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const IC = canvasRef.current;
    if (!IC) return;
    const IX = IC.getContext('2d');
    let IW, IH, rafId, iT = 0, iDone = false;

    function resize() { IW = IC.width = innerWidth; IH = IC.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const flames = [], lfire = [], pRev = new Array(25).fill(0);
    let linesBuilt = false;
    const CELL = 62, GPAD = 7;
    const GW = 5 * CELL + 4 * GPAD, GH = 5 * CELL + 4 * GPAD;
    const gx = () => IW / 2 - GW / 2, gy = () => IH / 2 - GH / 2;
    const T_FLAME = 0, T_LINES = 1.8, T_PANELS = 3.1, T_AGNI = 4.5, T_END = 6.6;

    function mkF(x, y, intense) {
      for (let i = 0; i < (intense ? 5 : 2); i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const sp = Math.random() * 3 + 1.2;
        flames.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: Math.random() * 65 + 35, ml: 1, r: Math.random() * 18 + 7, h: Math.floor(Math.random() * 35 + 5) });
      }
    }

    function buildLines() {
      const x0 = gx(), y0 = gy();
      for (let r = 0; r <= 5; r++) {
        const y = y0 + r * (CELL + GPAD) - GPAD / 2;
        lfire.push({ fx: x0, fy: y, tx: x0 + GW, ty: y, t: 0, dl: r * 0.06, sp: 0.014 + Math.random() * 0.008, done: false });
      }
      for (let c = 0; c <= 5; c++) {
        const x = x0 + c * (CELL + GPAD) - GPAD / 2;
        lfire.push({ fx: x, fy: y0, tx: x, ty: y0 + GH, t: 0, dl: 0.44 + c * 0.06, sp: 0.014 + Math.random() * 0.008, done: false });
      }
    }

    function draw() {
      rafId = requestAnimationFrame(draw);
      iT += 0.016;
      const t = iT;

      IX.fillStyle = t < 0.5 ? 'rgba(0,0,0,0.97)' : 'rgba(0,0,0,0.14)';
      IX.fillRect(0, 0, IW, IH);

      if (t < T_LINES + 0.8) {
        const n = Math.floor(Math.min(1, t / 1.4) * 9);
        for (let i = 0; i < n; i++) mkF(IW / 2 + (Math.random() - 0.5) * 110, IH / 2 + 55 + Math.random() * 18, true);
      }

      for (let i = flames.length - 1; i >= 0; i--) {
        const f = flames[i];
        if (f.ml === 1) f.ml = f.life;
        f.x += f.vx; f.y += f.vy;
        f.vx += (Math.random() - 0.5) * 0.32; f.vy -= 0.09;
        f.r *= 0.971; f.life--;
        const p = Math.max(0, f.life / f.ml);
        const g = IX.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        g.addColorStop(0, `hsla(${f.h},100%,88%,${p * 0.92})`);
        g.addColorStop(0.42, `hsla(${f.h},100%,55%,${p * 0.62})`);
        g.addColorStop(1, 'rgba(255,30,0,0)');
        IX.fillStyle = g; IX.beginPath(); IX.arc(f.x, f.y, f.r, 0, Math.PI * 2); IX.fill();
        if (f.life <= 0 || f.r < 1) flames.splice(i, 1);
      }

      if (t >= T_LINES) {
        if (!linesBuilt) { buildLines(); linesBuilt = true; }
        const x0 = gx(), y0 = gy();
        IX.strokeStyle = 'rgba(255,130,30,0.1)'; IX.lineWidth = 0.7;
        for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++)
          IX.strokeRect(x0 + c * (CELL + GPAD), y0 + r * (CELL + GPAD), CELL, CELL);
        for (const lp of lfire) {
          const elapsed = t - T_LINES - lp.dl;
          if (elapsed < 0) continue;
          lp.t = Math.min(1, lp.t + lp.sp);
          const px = lp.fx + (lp.tx - lp.fx) * lp.t;
          const py = lp.fy + (lp.ty - lp.fy) * lp.t;
          const tg = IX.createLinearGradient(lp.fx, lp.fy, px, py);
          tg.addColorStop(0, 'rgba(255,80,0,0)');
          tg.addColorStop(0.7, 'rgba(255,130,0,0.22)');
          tg.addColorStop(1, 'rgba(255,220,60,0.75)');
          IX.strokeStyle = tg; IX.lineWidth = 1.8;
          IX.beginPath(); IX.moveTo(lp.fx, lp.fy); IX.lineTo(px, py); IX.stroke();
          mkF(px + (Math.random() - 0.5) * 4, py + (Math.random() - 0.5) * 4, false);
        }
      }

      if (t >= T_PANELS) {
        const x0 = gx(), y0 = gy(), pt = t - T_PANELS;
        for (let i = 0; i < 25; i++) {
          const row = Math.floor(i / 5), col = i % 5;
          const delay = col * 0.055 + row * 0.085;
          pRev[i] = Math.min(1, Math.max(0, (pt - delay) / 0.48));
          const p = pRev[i]; if (p <= 0) continue;
          const cx = x0 + col * (CELL + GPAD), cy = y0 + row * (CELL + GPAD);
          const pg = IX.createLinearGradient(cx, cy, cx + CELL, cy + CELL);
          pg.addColorStop(0, `rgba(255,${165 + col * 7},0,${p * 0.52})`);
          pg.addColorStop(1, `rgba(255,${75 + row * 9},0,${p * 0.28})`);
          IX.fillStyle = pg; IX.fillRect(cx, cy, CELL * p, CELL);
          IX.strokeStyle = `rgba(255,200,55,${p * 0.62})`; IX.lineWidth = 1;
          IX.strokeRect(cx, cy, CELL, CELL);
          if (p > 0.55) {
            IX.strokeStyle = `rgba(255,90,0,${(p - 0.55) * 0.42})`; IX.lineWidth = 0.4;
            IX.beginPath();
            for (let k = 1; k < 4; k++) {
              IX.moveTo(cx + k * CELL / 4, cy); IX.lineTo(cx + k * CELL / 4, cy + CELL);
              IX.moveTo(cx, cy + k * CELL / 4); IX.lineTo(cx + CELL, cy + k * CELL / 4);
            }
            IX.stroke();
          }
          if (p > 0.78) {
            const gl = IX.createRadialGradient(cx + CELL / 2, cy + CELL / 2, 0, cx + CELL / 2, cy + CELL / 2, CELL / 2);
            gl.addColorStop(0, `rgba(255,225,70,${(p - 0.78) * 0.65})`);
            gl.addColorStop(1, 'rgba(255,120,0,0)');
            IX.fillStyle = gl; IX.fillRect(cx, cy, CELL, CELL);
          }
        }
      }

      if (t >= T_AGNI) {
        const alpha = Math.min(1, (t - T_AGNI) / 0.85);
        IX.save(); IX.globalAlpha = alpha;
        const fs = Math.max(68, Math.min(155, IW * 0.125));
        const cy = IH / 2;
        IX.font = `bold ${fs}px 'Bebas Neue',sans-serif`;
        IX.textAlign = 'center'; IX.textBaseline = 'middle';
        for (let g = 5; g >= 0; g--) {
          IX.shadowColor = `rgba(255,${105 + g * 20},0,${0.22 + g * 0.065})`;
          IX.shadowBlur = g * 24;
          const gr = IX.createLinearGradient(0, cy - fs * 0.5, 0, cy + fs * 0.5);
          gr.addColorStop(0, '#FFF8E5'); gr.addColorStop(0.28, '#FFD060');
          gr.addColorStop(0.68, '#FF6A00'); gr.addColorStop(1, '#FF1A00');
          IX.fillStyle = gr; IX.fillText('AGNI', IW / 2, cy);
        }
        IX.shadowBlur = 0;
        IX.font = `300 ${Math.max(12, IW * 0.013)}px 'DM Sans',sans-serif`;
        IX.fillStyle = `rgba(255,195,95,${alpha * 0.68})`;
        IX.fillText('SOLAR MICROGRID INTELLIGENCE PLATFORM', IW / 2, cy + fs * 0.7);
        IX.font = `400 ${Math.max(10, IW * 0.009)}px 'Cormorant Garamond',serif`;
        IX.fillStyle = `rgba(200,175,130,${alpha * 0.48})`;
        IX.fillText('Physics-Informed AI  ·  DWT Fault Uncoupling  ·  PSO Self-Healing Architecture', IW / 2, cy + fs * 0.96);
        IX.restore();
      }

      if (t >= T_END && !iDone) {
        iDone = true;
        cancelAnimationFrame(rafId);
        onComplete();
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return (
    <div id="intro">
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}

// ─── PSO CANVAS ───────────────────────────────────────────────────────────────
function PSOCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const NPART = 50, gbx = 0.5, gby = 0.5;
    const parts = Array.from({ length: NPART }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.015, vy: (Math.random() - 0.5) * 0.015,
      bx: Math.random(), by: Math.random(),
    }));
    let rafId;
    function draw() {
      const W = c.offsetWidth || 300, H = c.offsetHeight || 155;
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(11,15,24,0.18)'; ctx.fillRect(0, 0, W, H);
      parts.forEach(p => {
        p.vx = 0.72 * p.vx + 1.5 * Math.random() * (p.bx - p.x) + 1.5 * Math.random() * (gbx - p.x);
        p.vy = 0.72 * p.vy + 1.5 * Math.random() * (p.by - p.y) + 1.5 * Math.random() * (gby - p.y);
        p.x = Math.max(0, Math.min(1, p.x + p.vx)); p.y = Math.max(0, Math.min(1, p.y + p.vy));
        const fit = 1 - Math.hypot(p.x - gbx, p.y - gby) / Math.SQRT2;
        const g = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, 5);
        g.addColorStop(0, `rgba(255,180,50,${0.35 + fit * 0.55})`); g.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 4.5, 0, Math.PI * 2); ctx.fill();
      });
      const gx2 = gbx * W, gy2 = gby * H;
      const gl = ctx.createRadialGradient(gx2, gy2, 0, gx2, gy2, 14);
      gl.addColorStop(0, 'rgba(0,230,160,0.85)'); gl.addColorStop(1, 'rgba(0,230,160,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(gx2, gy2, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,230,160,0.7)'; ctx.beginPath(); ctx.arc(gx2, gy2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '9px Fira Code'; ctx.fillStyle = 'rgba(0,230,160,0.55)'; ctx.fillText('GBEST', gx2 + 10, gy2 - 8);
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────
function Tooltip({ html, x, y, visible }) {
  return (
    <div
      id="tip"
      className={visible ? 'on' : ''}
      style={{ left: x + 13, top: y - 9 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── TOAST CONTAINER ─────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div id="toasts">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={t.col ? { borderLeftColor: t.col } : {}}>
          <div className="tttl">{t.title}</div>
          <div className="tbdy">{t.body}</div>
        </div>
      ))}
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { s: 'overview', label: 'Overview', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { s: 'grid',     label: 'Grid Control', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { s: 'faults',   label: 'Fault Analysis', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { s: 'twin',     label: 'Digital Twin', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  { s: 'pso',      label: 'PSO Optimizer', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  null, // separator
  { s: 'reports',  label: 'Reports', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { s: 'chain',    label: 'P2P Trading', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { s: 'contacts', label: 'Contacts', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
];

function Header({ active, onNav, onEStop, snd }) {
  return (
    <header>
      <div className="logo-wrap">
        <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
          <defs>
            <radialGradient id="fg" cx="50%" cy="78%">
              <stop offset="0%" stopColor="#FFD060"/>
              <stop offset="52%" stopColor="#FF6A00"/>
              <stop offset="100%" stopColor="#FF1A00"/>
            </radialGradient>
          </defs>
          <path d="M16 30C16 30 5 22 5 13C5 13 9 15 11 13C11 13 9 7 16 3C16 3 14 9 18 11C18 11 20 7 22 9C24 11 27 15 27 19C27 25 16 30 16 30Z" fill="url(#fg)"/>
          <ellipse cx="16" cy="21" rx="3.5" ry="4.5" fill="rgba(255,240,180,0.5)"/>
        </svg>
        <div>
          <div className="logo-name">Project AGNI</div>
          <div className="logo-sub">Solar Microgrid Command Center</div>
        </div>
        <div className="pill"><div className="dot"></div>System Nominal</div>
      </div>
      <nav className="tnav">
        {NAV_ITEMS.map((item, i) =>
          item === null
            ? <div key={i} className="tsep" />
            : <button key={item.s} className={`tnb${active === item.s ? ' act' : ''}`}
                onClick={() => { snd('nav'); onNav(item.s); }}>
                {item.icon}{item.label}
              </button>
        )}
        <div className="tsep" />
        <button className="tnb dng" onClick={() => { snd('alert'); onEStop(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          E-Stop
        </button>
      </nav>
    </header>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { s: 'overview', label: 'Overview', badge: 'LIVE', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { s: 'grid',     label: 'Grid Control', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { s: 'faults',   label: 'Fault Analysis', badge: '7', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { s: 'twin',     label: 'Digital Twin', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  { s: 'pso',      label: 'PSO Optimizer', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
];

const SIDEBAR_OPS = [
  { s: 'reports',  label: 'Reports & XAI', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { s: 'chain',    label: 'P2P Blockchain', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { s: 'contacts', label: 'Contacts', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
];

function Sidebar({ active, onNav, cpu, time, snd }) {
  return (
    <aside>
      <div className="slbl">Navigation</div>
      {SIDEBAR_ITEMS.map(item => (
        <button key={item.s} className={`snb${active === item.s ? ' act' : ''}`}
          onClick={() => { snd('nav'); onNav(item.s); }}>
          {item.icon}{item.label}
          {item.badge && <span className="baj">{item.badge}</span>}
        </button>
      ))}
      <div className="sdiv" />
      <div className="slbl">Operations</div>
      {SIDEBAR_OPS.map(item => (
        <button key={item.s} className={`snb${active === item.s ? ' act' : ''}`}
          onClick={() => { snd('nav'); onNav(item.s); }}>
          {item.icon}{item.label}
        </button>
      ))}
      <div className="ssys">
        <div className="srow"><span className="skey">Firebase RTDB</span><span className="sval" style={{ color: 'var(--grn)' }}>LIVE</span></div>
        <div className="srow"><span className="skey">Edge Nodes</span><span className="sval">25/25</span></div>
        <div className="sbar"><div className="sfil" style={{ width: '94%' }} /></div>
        <div className="srow"><span className="skey">CPU Load</span><span className="sval">{cpu}%</span></div>
        <div className="sbar"><div className="sfil" style={{ width: `${cpu}%` }} /></div>
        <div className="srow" style={{ marginTop: 3 }}><span className="skey">AGNI v2.4.1</span><span className="sval">{time}</span></div>
      </div>
    </aside>
  );
}

// ─── OVERVIEW SECTION ────────────────────────────────────────────────────────
function OverviewSection({ power, onTip }) {
  const pvRef = useRef(null);
  const dwtRef = useRef(null);

  useEffect(() => {
    drawPVChart(pvRef.current);
    buildDWTSvg(dwtRef.current);
  }, []);

  return (
    <div className="sec on" id="sec-overview">
      <div className="eyebrow">Live Dashboard</div>
      <div className="stitle">System Overview</div>
      <div className="sdesc">Real-time power output, fault detection, and system health across all 25 ESP32 edge nodes.</div>
      <div className="g4" style={{ marginBottom: 13 }}>
        <div className="card">
          <div className="ctop" />
          <div className="ctit">Active Power Output</div>
          <div className="kbig">{power}<span className="kunit">kW</span></div>
          <div className="ktag tup">↑ +3.2% vs yesterday</div>
          <svg className="spark" viewBox="0 0 120 26" preserveAspectRatio="none">
            <defs><linearGradient id="spk1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFAA00" stopOpacity="0.3"/><stop offset="100%" stopColor="#FFAA00" stopOpacity="0"/></linearGradient></defs>
            <polyline points="0,22 20,16 40,18 60,9 80,13 100,5 120,8" fill="none" stroke="#FFAA00" strokeWidth="1.5"/>
            <polygon points="0,22 20,16 40,18 60,9 80,13 100,5 120,8 120,26 0,26" fill="url(#spk1)"/>
          </svg>
        </div>
        <div className="card">
          <div className="ctop" />
          <div className="ctit">RPNDD Accuracy</div>
          <div className="kbig" style={{ color: 'var(--grn)' }}>98.2<span className="kunit" style={{ color: 'var(--grn)' }}>%</span></div>
          <div className="ktag tup">Fault Detection Active</div>
          <svg className="spark" viewBox="0 0 120 26" preserveAspectRatio="none">
            <polyline points="0,15 20,13 40,15 60,11 80,10 100,9 120,8" fill="none" stroke="var(--grn)" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="card">
          <div className="ctop" />
          <div className="ctit">Active Faults</div>
          <div className="kbig" style={{ color: 'var(--blu)' }}>7<span className="kunit" style={{ color: 'var(--blu)' }}>faults</span></div>
          <div className="ktag tdn">2 Critical · 3 Shadow · 2 Soiling</div>
          <svg className="spark" viewBox="0 0 120 26" preserveAspectRatio="none">
            <polyline points="0,21 20,19 40,17 60,22 80,15 100,18 120,13" fill="none" stroke="var(--blu)" strokeWidth="1.5"/>
          </svg>
        </div>
        <div className="card">
          <div className="ctop" />
          <div className="ctit">RUL Health Score</div>
          <div className="kbig" style={{ color: 'var(--amber)' }}>94.7<span className="kunit">%</span></div>
          <div className="ktag tnt">Remaining Useful Life</div>
          <svg className="spark" viewBox="0 0 120 26" preserveAspectRatio="none">
            <polyline points="0,12 20,13 40,11 60,14 80,12 100,10 120,11" fill="none" stroke="var(--amber)" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="ctop" />
          <div className="ctit">Solar Panel Array — 5×5 Node Map</div>
          <div className="parr">
            {PANELS.map(p => (
              <div key={p.id} className={`pc ${p.st}`}
                onMouseEnter={e => onTip(e, `<b>${p.id}</b><br>Power: ${p.kw}%<br>Temp: ${p.tmp}°C<br>RPNDD: ${p.r}<br>State: ${p.st.toUpperCase()}`)}
                onMouseLeave={() => onTip(null)}
                onMouseMove={e => onTip(e)}
              />
            ))}
          </div>
          <div className="legrow">
            {[['rgba(255,210,60,0.7)','Optimal'],['rgba(0,220,140,0.7)','Healthy'],['rgba(74,168,255,0.7)','Shadow'],['rgba(210,140,40,0.7)','Soiling'],['rgba(255,56,96,0.7)','Critical']].map(([bg, label]) => (
              <div key={label} className="legi"><div className="legd" style={{ background: bg }} />{label}</div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="ctop" />
          <div className="ctit" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Power — Digital Twin vs Actual</span>
            <span style={{ color: 'var(--t3)', fontSize: 9.5, fontFamily: 'Fira Code,monospace' }}>LAST 60 MIN</span>
          </div>
          <div className="cwrap"><canvas ref={pvRef} /></div>
          <div style={{ marginTop: 9 }}>
            <div className="ctit" style={{ marginBottom: 5 }}>DWT Wavelet · Daubechies-4 Signal</div>
            <svg ref={dwtRef} viewBox="0 0 500 50" style={{ width: '100%', height: 50, display: 'block' }} preserveAspectRatio="none" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GRID CONTROL SECTION ────────────────────────────────────────────────────
function GridSection({ onAction, onEStop, snd, onTip }) {
  return (
    <div className="sec" id="sec-grid">
      <div className="eyebrow">Operations</div>
      <div className="stitle">Grid Control</div>
      <div className="sdesc">Direct control of all 25 ESP32 edge nodes, topology management, and self-healing reconfiguration commands via Firebase RTDB.</div>
      <div className="crow">
        {[
          ['cbg', '⚡ Run PSO Reconfigure', 'PSO reconfiguration initiated — 50 particles converging on optimal topology'],
          ['',    '🔍 Manual Fault Scan',   'Full fault detection scan launched across all 25 nodes'],
          ['',    '↩ Bypass Degraded Nodes','Bypass activated on degraded nodes P24–P25 — self-healing engaged'],
          ['',    '🔄 Force Firebase Sync', 'Firebase RTDB forced sync complete — all 25 node feeds refreshed'],
          ['',    '🧹 Schedule Cleaning Cycle','Cleaning cycle scheduled for P18–P20 at 08:00 tomorrow'],
        ].map(([cls, label, msg]) => (
          <button key={label} className={`cb ${cls}`} onClick={() => { snd('soft'); onAction(msg); }}>{label}</button>
        ))}
        <button className="cb cbd" onClick={() => { snd('alert'); onEStop(); }}>⛔ Emergency Shutdown</button>
      </div>
      <div className="ctit" style={{ marginBottom: 8, fontSize: 11 }}>All 25 ESP32 Edge Nodes — Real-Time Status</div>
      <div className="ngrid">
        {PANELS.map((p, i) => {
          const s = NST[i];
          const sl = s === 'on' ? 'ONLINE' : s === 'wr' ? 'WARNING' : 'CRITICAL';
          const sc = s === 'on' ? 'non' : s === 'wr' ? 'nwr' : 'ner';
          return (
            <div key={p.id} className="nc"
              onMouseEnter={e => onTip(e, `${p.id} · ${p.kw}% · ${p.tmp}°C · RPNDD ${p.r}`)}
              onMouseLeave={() => onTip(null)}
              onMouseMove={e => onTip(e)}>
              <div className="nid">{p.id}</div>
              <div className="nkw">{Math.round(p.kw * 8.4)}<span style={{ fontSize: 9, color: 'var(--t3)' }}>W</span></div>
              <span className={`nst ${sc}`}>{sl}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FAULT ANALYSIS SECTION ───────────────────────────────────────────────────
function FaultsSection() {
  const rpnRef = useRef(null);
  useEffect(() => { setTimeout(() => drawRPNChart(rpnRef.current), 100); }, []);
  return (
    <div className="sec" id="sec-faults">
      <div className="eyebrow">AI Forensics</div>
      <div className="stitle">Fault Analysis</div>
      <div className="sdesc">Real-time fault classification using RPNDD thresholding and DWT sub-cycle transient detection. 98%+ uncoupling accuracy.</div>
      <div className="g2" style={{ height: 'calc(100% - 96px)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="ctop" />
          <div className="ctit">Live Fault Intelligence Feed</div>
          <div className="flist">
            {FAULTS.map((f, i) => (
              <div key={i} className="fi" style={{ '--fc': f.fc }}>
                <div className="fihd">
                  <span className="ftyp">{f.type}</span>
                  <span className="ftim">{f.time}</span>
                </div>
                <div className="fdsc">{f.desc}</div>
                <div className="ftags">{f.tags.map(t => <span key={t} className="ftag">{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="ctop" />
            <div className="ctit">Classification Matrix</div>
            <div className="g2" style={{ marginTop: 2, gap: 9 }}>
              {[['var(--blu)','rgba(74,168,255,','3','TRANSIENT SHADOW'],
                ['var(--amber)','rgba(210,140,40,','2','STATIC SOILING'],
                ['var(--red)','rgba(255,56,96,','2','CRITICAL NODES'],
                ['var(--grn)','rgba(0,230,160,','5','RESOLVED TODAY']].map(([col,bg,num,label]) => (
                <div key={label} style={{ textAlign:'center',padding:9,background:`${bg}0.06)`,border:`1px solid ${bg}0.2)`,borderRadius:7 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:col }}>{num}</div>
                  <div style={{ fontSize:10,color:'var(--t3)',letterSpacing:'0.1em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="ctop" />
            <div className="ctit">RPNDD Threshold Monitor</div>
            <canvas ref={rpnRef} style={{ width: '100%', height: 95, display: 'block' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DIGITAL TWIN SECTION ─────────────────────────────────────────────────────
function DigitalTwinSection() {
  const twRef = useRef(null);
  useEffect(() => { setTimeout(() => drawPVChart(twRef.current), 100); }, []);
  return (
    <div className="sec" id="sec-twin">
      <div className="eyebrow">Layer 01 — Digital Twin</div>
      <div className="stitle">PI-LSTM Engine</div>
      <div className="sdesc">Physics-Informed LSTM embeds Shockley diode equations into the loss function, preventing black-box inconsistencies in mission-critical power systems.</div>
      <div className="g3" style={{ marginBottom: 13 }}>
        {[
          { num:'Layer 01 · Digital Twin', name:'PI-LSTM', tech:'Physics-Informed LSTM', desc:'3-layer LSTM with physics constraints. Trained on 525,600 data points from Kaggle Plant 1. Models ideal P-V characteristics in real-time.', w:98, acc:'98%', bg:'01' },
          { num:'Layer 02 · Forensic Signal', name:'DWT Engine', tech:'Daubechies-4 Wavelet', desc:'Decomposes RPNDD signal using db4. D₁ detail coefficients expose sub-cycle transients — the mathematical fingerprint of shadow vs soiling.', w:96, acc:'96%', bg:'02' },
          { num:'Layer 03 · Optimization', name:'PSO Core', tech:'Particle Swarm Optimization', desc:'50 particles, 100 max iterations. Converges optimal topology in ~180ms. Triggers relay switching to bypass degraded nodes automatically.', w:94, acc:'−20%', bg:'03' },
        ].map(item => (
          <div key={item.bg} className="lcard">
            <div className="lcnum">{item.num}</div>
            <div className="lcname">{item.name}</div>
            <div className="lctech">{item.tech}</div>
            <div className="lcdesc">{item.desc}</div>
            <div className="lcbar"><div className="lcfil" style={{ width: `${item.w}%` }} /></div>
            <div className="lcacc">{item.acc}</div>
            <div className="lcbg">{item.bg}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="ctop" />
        <div className="ctit" style={{ display:'flex',justifyContent:'space-between' }}>
          <span>P-V Curve — Digital Twin (ideal) vs Real-Time Sensor Data</span>
          <span style={{ color:'var(--t3)',fontSize:9.5,fontFamily:'Fira Code,monospace' }}>LIVE · 500ms INTERVAL</span>
        </div>
        <div className="cwrap" style={{ height: 155 }}><canvas ref={twRef} /></div>
      </div>
    </div>
  );
}

// ─── PSO SECTION ──────────────────────────────────────────────────────────────
function PSOSection() {
  return (
    <div className="sec" id="sec-pso">
      <div className="eyebrow">Layer 03 — Optimization</div>
      <div className="stitle">PSO Reconfiguration</div>
      <div className="sdesc">Particle Swarm Optimization finds the optimal electrical topology upon fault detection, triggering self-healing relay bypass to maximize power yield.</div>
      <div className="g2">
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="ctop" />
            <div className="ctit">PSO Parameters</div>
            <div className="g2" style={{ gap: 9 }}>
              {[['PARTICLES','50'],['MAX ITER','100'],['INERTIA w','0.72'],['c₁ = c₂','1.5']].map(([k,v]) => (
                <div key={k} style={{ padding:9,background:'rgba(255,120,30,0.05)',border:'1px solid var(--b1)',borderRadius:7 }}>
                  <div style={{ fontSize:9.5,color:'var(--t3)',letterSpacing:'0.1em',marginBottom:3 }}>{k}</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:'var(--gold)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="ctop" />
            <div className="ctit">Last Optimization Result</div>
            <div style={{ display:'flex',alignItems:'center',gap:13,marginTop:3 }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:34,color:'var(--grn)' }}>+8.4%</div>
                <div style={{ fontSize:10.5,color:'var(--t3)' }}>Yield Recovery</div>
              </div>
              <div style={{ flex:1,borderLeft:'1px solid var(--b1)',paddingLeft:13,fontSize:12,color:'var(--t2)',lineHeight:1.7 }}>
                3 nodes bypassed · Converged in 23 iterations · 180ms total · Relay switching confirmed
              </div>
            </div>
          </div>
        </div>
        <div className="card" style={{ display:'flex',flexDirection:'column' }}>
          <div className="ctop" />
          <div className="ctit">PSO Particle Convergence — Live Simulation</div>
          <div className="psobox" style={{ flex: 1 }}><PSOCanvas /></div>
          <div style={{ marginTop:9,fontSize:12,color:'var(--t3)',fontStyle:'italic',fontFamily:"'Cormorant Garamond',serif",lineHeight:1.65 }}>
            Each particle represents a candidate electrical topology. Fitness function = maximum power yield subject to voltage balance constraints.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS SECTION ──────────────────────────────────────────────────────────
function ReportsSection({ onDownload, snd }) {
  const reports = [
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title:'Fault Uncoupling Report — Jan 2025', meta:'PI-LSTM + DWT Analysis · 30-day summary', sz:'2.4 MB', lbl:'Export PDF', name:'Fault Report Jan 2025' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title:'Power Yield Trend — Q4 2024', meta:'PSO optimization impact · CSV dataset', sz:'890 KB', lbl:'Export CSV', name:'Q4 Yield Report' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title:'RUL Forecast — All Nodes', meta:'Remaining Useful Life predictions per panel', sz:'1.1 MB', lbl:'Export PDF', name:'RUL Forecast' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, title:'Blockchain P2P Ledger — Jan 2025', meta:'All smart contract transactions', sz:'340 KB', lbl:'Export CSV', name:'P2P Ledger' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4"/></svg>, title:'XAI Decision Log — Full Session', meta:'Explainable AI directives with feature importance', sz:'5.2 MB', lbl:'Export JSON', name:'XAI Log' },
  ];
  return (
    <div className="sec" id="sec-reports">
      <div className="eyebrow">Operations</div>
      <div className="stitle">Reports & XAI</div>
      <div className="sdesc">Explainable AI directives and operational analytics exports. All AI decisions documented for mission-critical transparency and compliance.</div>
      <div className="g2">
        <div>
          {reports.map(r => (
            <div key={r.name} className="ri" onClick={() => { snd('soft'); onDownload(r.name); }}>
              <div className="rico">{r.icon}</div>
              <div><div className="rtit">{r.title}</div><div className="rmet">{r.meta}</div></div>
              <div className="rsz">{r.sz}</div>
              <button className="rdl" onClick={e => { e.stopPropagation(); snd('soft'); onDownload(r.name); }}>{r.lbl}</button>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="ctop" />
          <div className="ctit">O&amp;M Impact Summary</div>
          <div style={{ display:'flex',flexDirection:'column',gap:11,marginTop:4 }}>
            <div style={{ padding:14,background:'rgba(0,230,160,0.05)',border:'1px solid rgba(0,230,160,0.18)',borderRadius:8 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:11.5,color:'var(--t3)',letterSpacing:'0.12em',marginBottom:4 }}>O&amp;M Cost Reduction</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:'var(--grn)',lineHeight:1 }}>−20%</div>
              <div style={{ fontSize:11.5,color:'var(--t2)',marginTop:3 }}>vs. baseline without AGNI system</div>
            </div>
            <div style={{ padding:14,background:'rgba(255,120,30,0.05)',border:'1px solid var(--b1)',borderRadius:8 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:11.5,color:'var(--t3)',letterSpacing:'0.12em',marginBottom:4 }}>Unnecessary Cleaning Cycles Prevented</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:'var(--gold)',lineHeight:1 }}>68%</div>
            </div>
            <div style={{ fontSize:12.5,color:'var(--t2)',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',lineHeight:1.72 }}>
              By distinguishing transient shadowing from static soiling with 98.2% accuracy, AGNI eliminates labor-intensive cleaning cycles triggered by false positives — the primary driver of O&M savings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BLOCKCHAIN SECTION ───────────────────────────────────────────────────────
function BlockchainSection() {
  return (
    <div className="sec" id="sec-chain">
      <div className="eyebrow">Decentralized Energy Market</div>
      <div className="stitle">P2P Blockchain Trading</div>
      <div className="sdesc">Surplus energy tokenized as ERC-20 SOLAR-kWh tokens and traded via smart contracts on the microgrid peer-to-peer market.</div>
      <div className="g2">
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="ctop" />
            <div className="ctit">Today's Market Summary</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:4 }}>
              {[['3.2','MWh Traded','var(--gold)'],['₹17,280','Revenue','var(--grn)'],['8','Peer Nodes','var(--blu)']].map(([v,l,c]) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:32,color:c }}>{v}</div>
                  <div style={{ fontSize:10.5,color:'var(--t3)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="ctit" style={{ marginBottom:7,fontSize:10.5 }}>Recent Transactions</div>
          {TXS.map(tx => (
            <div key={tx.hash} className="tx">
              <div className="txico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <div>
                <div className="txh">{tx.hash}</div>
                <div className="txi">{tx.info}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="txv">{tx.val}</div>
                <div className="txe">{tx.en}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ display:'flex',flexDirection:'column',gap:11 }}>
          <div className="ctop" />
          <div className="ctit">Smart Contract Details</div>
          <div style={{ fontFamily:'Fira Code,monospace',fontSize:11,color:'rgba(0,230,160,0.68)',lineHeight:2,background:'rgba(0,10,4,0.55)',border:'1px solid rgba(0,230,160,0.11)',borderRadius:8,padding:13 }}>
            {[['Contract:   ','0x4F2A...A3E2'],['Network:    ','AGNI-CHAIN / PoA'],['Token:      ','SOLAR-kWh (ERC-20)'],['Oracle:     ','Firebase RTDB'],['Next Auction:','15:00 IST'],['Block Height:','#2,847,391']].map(([k,v]) => (
              <div key={k}><span style={{ color:'var(--t3)' }}>{k}</span>{v}</div>
            ))}
          </div>
          <div style={{ fontSize:12.5,color:'var(--t2)',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',lineHeight:1.72 }}>
            Each kilowatt-hour of surplus energy is minted as a token and auctioned in real-time — enabling decentralized, autonomous energy markets without intermediaries.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACTS SECTION ─────────────────────────────────────────────────────────
function ContactsSection() {
  const contacts = [
    { role:'Project Lead', name:'Grid Operations', email:'ops@agni-grid.io', badge:'● On Call 24/7' },
    { role:'AI / ML Engineer', name:'Model Inference', email:'ml@agni-grid.io', badge:'● Active' },
    { role:'Field Maintenance', name:'Maintenance Lead', email:'maint@agni-grid.io', badge:'● Available' },
    { role:'Blockchain', name:'Smart Contracts', email:'chain@agni-grid.io', badge:'● Active' },
    { role:'Emergency Hotline', name:'24/7 Response', email:'+91-XXXX-XXXXXX', badge:'● Emergency', danger:true },
    { role:'Cloud Dashboard', name:'Streamlit App', email:'agni.streamlit.app', badge:'● Live' },
  ];
  const endpoints = [
    ['FIREBASE RTDB','console.firebase.google.com'],
    ['STREAMLIT','agni.streamlit.app'],
    ['KAGGLE DATASET','kaggle/plant-1'],
    ['BLOCKCHAIN','0x4F2A...A3E2'],
  ];
  return (
    <div className="sec" id="sec-contacts">
      <div className="eyebrow">Team AGNI</div>
      <div className="stitle">Operations Contacts</div>
      <div className="sdesc">Maintenance crew, AI/ML engineers, and emergency protocols for the AGNI solar microgrid system.</div>
      <div className="g3" style={{ marginBottom: 13 }}>
        {contacts.map(c => (
          <div key={c.email} className="ccard">
            <div className="crole">{c.role}</div>
            <div className="cname">{c.name}</div>
            <div className="cemail">{c.email}</div>
            <div>
              <span className="cbadge" style={c.danger ? { borderColor:'rgba(255,56,96,0.38)',background:'rgba(255,56,96,0.06)',color:'var(--red)' } : {}}>
                {c.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="ctop" />
        <div className="ctit">System Endpoints</div>
        <div className="g4" style={{ marginTop: 5 }}>
          {endpoints.map(([k,v]) => (
            <div key={k} style={{ padding:10,background:'rgba(255,120,30,0.04)',border:'1px solid var(--b1)',borderRadius:7 }}>
              <div style={{ fontSize:9.5,color:'var(--t3)',letterSpacing:'0.1em',marginBottom:5 }}>{k}</div>
              <div style={{ fontFamily:'Fira Code,monospace',fontSize:10.5,color:'var(--amber)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TERMINAL ─────────────────────────────────────────────────────────────────
function Terminal({ logs, onCommand, snd }) {
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const [input, setInput] = useState('');
  const histRef = useRef([]);
  const hidxRef = useRef(-1);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [logs]);

  const handleKey = e => {
    if (e.key === 'Enter') {
      snd('term');
      const cmd = input.trim().toLowerCase();
      if (!cmd) return;
      histRef.current.push(cmd); hidxRef.current = -1;
      onCommand(cmd);
      setInput('');
    }
    if (e.key === 'ArrowUp') {
      hidxRef.current = Math.min(hidxRef.current + 1, histRef.current.length - 1);
      setInput(histRef.current[histRef.current.length - 1 - hidxRef.current] || '');
    }
    if (e.key === 'ArrowDown') {
      hidxRef.current = Math.max(hidxRef.current - 1, -1);
      setInput(hidxRef.current >= 0 ? histRef.current[histRef.current.length - 1 - hidxRef.current] : '');
    }
  };

  return (
    <div id="term">
      <div className="thdr">
        <div className="tdots"><div className="tdot"/><div className="tdot"/><div className="tdot"/></div>
        <span className="tlabel">agni@microgrid:~$ · SYSTEM LOG · FIREBASE RTDB STREAM · ESP32 MESH</span>
        <span className="tstatus">● CONNECTED · 25/25 NODES ACTIVE</span>
      </div>
      <div className="tbody" ref={bodyRef}>
        {logs.map((l, i) => (
          <div key={i} className="tl">
            <span className="tts">[{l.ts}]</span>
            <span className={`t${l.type}`}>{l.text}</span>
          </div>
        ))}
      </div>
      <div className="tinrow">
        <span className="tsym">agni@grid:~$&nbsp;</span>
        <input
          ref={inputRef}
          className="tinp"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type command... (try: help, status, scan, pso, nodes, faults, rul, clear)"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [active, setActive] = useState('overview');
  const [power, setPower] = useState(847);
  const [cpu, setCpu] = useState(38);
  const [time, setTime] = useState('--:--');
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [tip, setTip] = useState({ visible: false, html: '', x: 0, y: 0 });
  const snd = useSnd();
  const toastIdRef = useRef(0);

  // Utility: add a terminal log entry
  const tPrint = useCallback((text, type = 'to') => {
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev.slice(-200), { ts, text, type }]);
  }, []);

  // Utility: add a toast
  const addToast = useCallback((title, body, col) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, title, body, col }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4100);
  }, []);

  // Terminal commands
  const handleCommand = useCallback((cmd) => {
    tPrint(`$ ${cmd}`, 'tc');
    const CMDS = {
      help: () => {
        tPrint('Available commands:', 'ti');
        ['status  — System health overview','scan    — Run fault detection scan','pso     — Trigger PSO reconfiguration',
         'nodes   — List all edge node states','faults  — Show active fault log','rul     — Remaining Useful Life report',
         'firebase — Check RTDB connection','blockchain — P2P trading summary','clear   — Clear terminal']
          .forEach(l => tPrint('  ' + l));
      },
      status: () => {
        tPrint('AGNI v2.4.1 — System Status Report', 'ti');
        tPrint('  Power Output    : 847 kW  (+3.2%)');
        tPrint('  Active Nodes    : 25/25 online');
        tPrint('  RPNDD Engine    : ACTIVE · 98.2% accuracy');
        tPrint('  DWT Layer       : ACTIVE · Daubechies-4');
        tPrint('  PSO Optimizer   : STANDBY · 180ms response');
        tPrint('  Firebase RTDB   : CONNECTED · 12ms latency');
        tPrint('  Blockchain      : LIVE · Block #2,847,391');
      },
      scan: () => {
        tPrint('Initiating full fault detection scan...', 'tw');
        const msgs = [
          ['  Scanning P01–P10 ... NOMINAL', 'to'],
          ['  Scanning P11–P14 ... NOMINAL', 'to'],
          ['  Scanning P15–P17 ... SHADOW DETECTED  RPNDD=0.31', 'tw'],
          ['  Scanning P18–P20 ... SOILING DETECTED  RPNDD=0.22', 'tw'],
          ['  Scanning P21–P23 ... NOMINAL', 'to'],
          ['  Scanning P24–P25 ... CRITICAL  RPNDD=0.65 → BYPASS ENGAGED', 'te'],
          ['Scan complete. 7 faults found · 2 critical · PSO notified.', 'ti'],
        ];
        msgs.forEach(([m, t], i) => setTimeout(() => tPrint(m, t), (i + 1) * 420));
      },
      pso: () => {
        tPrint('Triggering PSO reconfiguration...', 'tw');
        setTimeout(() => tPrint('  Iteration 001/100 · Swarm initialized · 50 particles'), 300);
        setTimeout(() => tPrint('  Iteration 012/100 · GBest fitness: 0.7821'), 700);
        setTimeout(() => tPrint('  Iteration 023/100 · Convergence achieved', 'ti'), 1100);
        setTimeout(() => tPrint('  Optimal topology found · 3 nodes bypassed', 'ti'), 1500);
        setTimeout(() => tPrint('  Relay switching confirmed · Power yield: +8.4%', 'ti'), 1900);
        setTimeout(() => tPrint('PSO reconfiguration complete · 180ms total'), 2200);
      },
      nodes: () => {
        tPrint('ESP32 Edge Node Status:', 'ti');
        PANELS.forEach((p, i) => {
          const s = NST[i]; const tp = s === 'on' ? 'to' : s === 'wr' ? 'tw' : 'te';
          tPrint(`  ${p.id}  ${Math.round(p.kw * 8.4)}W  ${p.tmp}°C  RPNDD:${p.r}  ${s.toUpperCase()}`, tp);
        });
      },
      faults: () => {
        tPrint('Active Fault Log:', 'ti');
        FAULTS.forEach(f => tPrint(`  [${f.time}] ${f.type}: ${f.desc.substring(0, 58)}...`, 'tw'));
      },
      rul: () => {
        tPrint('Remaining Useful Life Forecast:', 'ti');
        tPrint('  P01–P14  : >2 years · No intervention required');
        tPrint('  P15–P17  : 8–14 months · Shadow pattern monitoring', 'tw');
        tPrint('  P18–P20  : 6–10 months · Cleaning recommended', 'tw');
        tPrint('  P21–P23  : >2 years · Nominal');
        tPrint('  P24–P25  : 12 days · IMMEDIATE REPLACEMENT REQUIRED', 'te');
        tPrint('System RUL Score: 94.7%', 'ti');
      },
      firebase: () => {
        tPrint('Checking Firebase RTDB connection...');
        setTimeout(() => tPrint('  Host: agni-rtdb.firebaseio.com'), 350);
        setTimeout(() => tPrint('  Status: CONNECTED · Latency: 12ms', 'ti'), 700);
        setTimeout(() => tPrint('  Auth: Service Account · SSL: Active'), 1000);
        setTimeout(() => tPrint('  Streaming: 25 node feeds · 500ms interval'), 1300);
      },
      blockchain: () => {
        tPrint('P2P Blockchain Trading Summary:', 'ti');
        tPrint('  Today Volume : 3.2 MWh');
        tPrint('  Revenue      : ₹17,280');
        tPrint('  Peer Nodes   : 8 active');
        tPrint('  Contract     : 0x4F2A...A3E2  (AGNI-CHAIN/PoA)');
        tPrint('  Next Auction : 15:00 IST');
        tPrint('  Block Height : #2,847,391');
      },
      clear: () => { setLogs([]); tPrint('Terminal cleared.'); },
    };
    const fn = CMDS[cmd];
    if (fn) fn(); else tPrint(`command not found: ${cmd}  —  type 'help'`, 'te');
  }, [tPrint]);

  // Navigation
  const nav = useCallback((s) => {
    setActive(s);
    tPrint(`cd /agni/${s}  →  section loaded`, 'ti');
  }, [tPrint]);

  // Grid action
  const gridAction = useCallback((msg) => {
    tPrint(msg, 'tw');
    addToast('Grid Control', msg);
  }, [tPrint, addToast]);

  // Download action
  const dlAction = useCallback((name) => {
    tPrint(`Exporting: ${name}`, 'ti');
    addToast('Report Export', `${name} — export queued`);
  }, [tPrint, addToast]);

  // Emergency stop
  const eStop = useCallback(() => {
    snd('alert');
    addToast('EMERGENCY STOP', 'Initiating controlled grid shutdown...', '#FF3860');
    setTimeout(() => {
      tPrint('E-STOP ACTIVATED — All inverters isolated', 'te');
      tPrint('Grid entering safe state — standby mode', 'tw');
      addToast('E-STOP', 'All inverters isolated. Grid safe.', '#FF3860');
    }, 800);
  }, [snd, tPrint, addToast]);

  // Tooltip handler
  const handleTip = useCallback((eOrNull, htmlStr) => {
    if (!eOrNull) { setTip(t => ({ ...t, visible: false })); return; }
    if (htmlStr) setTip({ visible: true, html: htmlStr, x: eOrNull.clientX, y: eOrNull.clientY });
    else setTip(t => ({ ...t, x: eOrNull.clientX, y: eOrNull.clientY }));
  }, []);

  // Ripple click effect
  useEffect(() => {
    const handler = e => {
      const r = document.createElement('div');
      r.className = 'rip';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 400);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Live data & terminal boot — starts after app is ready
  useEffect(() => {
    if (!appReady) return;

    // Boot terminal messages
    const bootMsgs = [
      { t: 'ti', m: 'AGNI System Boot · v2.4.1 · All modules initialized' },
      { t: 'to', m: 'Firebase RTDB connected · Streaming 25 edge nodes at 500ms' },
      { t: 'to', m: 'PI-LSTM model loaded · 98.2% validation accuracy' },
      { t: 'to', m: 'DWT engine ready · Daubechies-4 wavelet initialized' },
      { t: 'to', m: 'PSO optimizer on standby · 50 particles configured' },
      { t: 'tw', m: 'Node P24: RPNDD = 0.62 — threshold exceeded' },
      { t: 'te', m: 'CRITICAL: P24–P25 degradation → bypass engaged' },
      { t: 'ti', m: 'PSO reconfiguration complete · Yield +8.4%' },
      { t: 'to', m: "Blockchain P2P: 0.8 MWh traded · ₹4,240 settled" },
      { t: 'to', m: "Type 'help' for available commands" },
    ];
    const bootTimers = bootMsgs.map((m, i) => setTimeout(() => tPrint(m.m, m.t), (i + 1) * 320));

    // Live terminal stream
    const liveInterval = setInterval(() => {
      const live = [
        { t: 'to', m: `Sensor poll · P${String(Math.floor(Math.random() * 25 + 1)).padStart(2, '0')} · ${(820 + Math.random() * 55).toFixed(1)}W · ${(38 + Math.random() * 20).toFixed(1)}°C` },
        { t: 'to', m: `RPNDD computed · ${(Math.random() * 0.1).toFixed(3)} · NOMINAL` },
        { t: 'to', m: `Firebase heartbeat OK · ${(8 + Math.random() * 8).toFixed(0)}ms` },
      ];
      const p = live[Math.floor(Math.random() * live.length)];
      tPrint(p.m, p.t);
    }, 3500);

    // KPI live updates
    const kpiInterval = setInterval(() => {
      setPower(Math.floor(847 + (Math.random() - 0.5) * 28));
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }));
      setCpu(Math.floor(28 + Math.random() * 32));
    }, 2000);

    // Delayed toasts
    const t1 = setTimeout(() => addToast('PSO Optimizer', 'Reconfiguration complete — yield +8.4%', '#00E5A0'), 5500);
    const t2 = setTimeout(() => addToast('DWT Detection', 'Shadow transient @ Node P15 — 2.1s', '#4AA8FF'), 13000);

    return () => {
      bootTimers.forEach(clearTimeout);
      clearInterval(liveInterval);
      clearInterval(kpiInterval);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, [appReady, tPrint, addToast]);

  // Sync section classes for CSS transitions
  const sections = ['overview','grid','faults','twin','pso','reports','chain','contacts'];

  const handleIntroComplete = useCallback(() => {
    setAppReady(true);
  }, []);

  return (
    <>
      {!appReady && <IntroScreen onComplete={handleIntroComplete} />}

      <div id="app" className={appReady ? 'on' : ''}>
        <Header active={active} onNav={nav} onEStop={eStop} snd={snd} />
        <Sidebar active={active} onNav={nav} cpu={cpu} time={time} snd={snd} />

        <main>
          <div className="mbg" />

          {/* Each section must have class "sec" + "on" when active */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {sections.map(s => {
              const isOn = active === s;
              const style = { position: 'absolute', inset: 0, padding: '22px 26px', opacity: isOn ? 1 : 0, pointerEvents: isOn ? 'all' : 'none', transition: 'opacity 0.32s ease, transform 0.32s ease', transform: isOn ? 'translateY(0)' : 'translateY(10px)', overflow: 'hidden' };
              return (
                <div key={s} style={style}>
                  {s === 'overview'  && <OverviewSection power={power} onTip={handleTip} />}
                  {s === 'grid'      && <GridSection onAction={gridAction} onEStop={eStop} snd={snd} onTip={handleTip} />}
                  {s === 'faults'    && <FaultsSection />}
                  {s === 'twin'      && <DigitalTwinSection />}
                  {s === 'pso'       && <PSOSection />}
                  {s === 'reports'   && <ReportsSection onDownload={dlAction} snd={snd} />}
                  {s === 'chain'     && <BlockchainSection />}
                  {s === 'contacts'  && <ContactsSection />}
                </div>
              );
            })}
          </div>
        </main>

        <Terminal logs={logs} onCommand={handleCommand} snd={snd} />
      </div>

      <ToastContainer toasts={toasts} />
      <Tooltip html={tip.html} x={tip.x} y={tip.y} visible={tip.visible} />
    </>
  );
}
