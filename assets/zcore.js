"use strict";
/* =================== TIỆN ÍCH SỐ =================== */
const $ = id => document.getElementById(id);
const EPS = 1e-9;
function fmt(v, dp = 4){
  if (v === Infinity) return '∞'; if (v === -Infinity) return '−∞';
  if (!isFinite(v)) return '?';
  if (Math.abs(v) < 5e-10) return '0';
  let s = (+v.toFixed(dp)).toString();
  if (s.includes('e')) s = v.toPrecision(4);
  return s.replace('-', '−').replace('.', ',');
}
const C = (re, im = 0) => ({re, im});
const cadd = (a, b) => C(a.re + b.re, a.im + b.im);
const csub = (a, b) => C(a.re - b.re, a.im - b.im);
const cmul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cdiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const cabs = a => Math.hypot(a.re, a.im);
const carg = a => Math.atan2(a.im, a.re);
const cscale = (a, s) => C(a.re * s, a.im * s);
function cpowi(a, n){
  const r = cabs(a);
  if (r === 0) return n === 0 ? C(1) : (n > 0 ? C(0) : C(Infinity));
  const t = carg(a), R = Math.pow(r, n);
  return C(R * Math.cos(n * t), R * Math.sin(n * t));
}
function fmtc(z, dp = 4){
  const re = Math.abs(z.re) < 5e-10 ? 0 : z.re, im = Math.abs(z.im) < 5e-10 ? 0 : z.im;
  if (im === 0) return fmt(re, dp);
  const ims = fmt(Math.abs(im), dp); const jpart = (ims === '1' ? '' : ims) + 'j';
  if (re === 0) return (im < 0 ? '−' : '') + jpart;
  return fmt(re, dp) + (im < 0 ? ' − ' : ' + ') + jpart;
}
function parseNum(s){
  s = s.trim().replace(/−/g, '-').replace(',', '.');
  if (s.includes('/')){ const [a, b] = s.split('/'); return parseFloat(a) / parseFloat(b); }
  return parseFloat(s);
}
function parseList(s){
  const out = String(s).trim().split(/[\s;]+/).filter(Boolean).map(parseNum);
  return out.some(v => !isFinite(v)) ? null : out;
}
const trimLead = c => { let i = 0; while (i < c.length - 1 && Math.abs(c[i]) < 1e-14) i++; return c.slice(i); };
function conv(a, b){ const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; }
function polyAdd(a, b){ // mảng tăng dần (cùng gốc)
  const n = Math.max(a.length, b.length), r = [];
  for (let i = 0; i < n; i++) r.push((a[i] || 0) + (b[i] || 0)); return r;
}
function polyDivDesc(N, D){ // chia đa thức (giảm dần)
  N = N.slice(); const q = [];
  while (N.length >= D.length){ const f = N[0] / D[0]; q.push(f); for (let i = 0; i < D.length; i++) N[i] -= f * D[i]; N.shift(); }
  return {q: q.length ? q : [0], r: N.length ? N : [0]};
}
function polyvalC(c, z){ let r = C(0); for (const a of c) r = cadd(cmul(r, z), C(a)); return r; } // giảm dần
/* ---------- Nghiệm đa thức ---------- */
function roots(c0){
  let c = trimLead(c0.slice()); let z0 = 0;
  while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-14){ c.pop(); z0++; }
  const n = c.length - 1; let r = [];
  if (n === 1) r = [C(-c[1] / c[0])];
  else if (n === 2){
    const [a, b, cc] = c, d = b * b - 4 * a * cc;
    if (d >= 0){ const s = Math.sqrt(d); const q = -0.5 * (b + (b >= 0 ? s : -s)); r = q === 0 ? [C(0), C(0)] : [C(q / a), C(cc / q)]; }
    else { const s = Math.sqrt(-d); r = [C(-b / (2 * a), s / (2 * a)), C(-b / (2 * a), -s / (2 * a))]; }
  } else if (n > 2){
    const a = c.map(v => v / c[0]); const R = 1 + Math.max(...a.slice(1).map(Math.abs));
    let z = []; for (let k = 0; k < n; k++){ const t = 2 * Math.PI * k / n + 0.4; z.push(C(R * 0.9 * Math.cos(t), R * 0.9 * Math.sin(t))); }
    for (let it = 0; it < 800; it++){
      let mv = 0;
      for (let k = 0; k < n; k++){
        let num = polyvalC(a, z[k]), den = C(1);
        for (let j = 0; j < n; j++) if (j !== k) den = cmul(den, csub(z[k], z[j]));
        const dz = cdiv(num, den); z[k] = csub(z[k], dz); mv = Math.max(mv, cabs(dz));
      }
      if (mv < 1e-15) break;
    }
    r = z;
  }
  for (let i = 0; i < z0; i++) r.push(C(0));
  return r.map(cleanC);
}
function cleanC(z){
  let {re, im} = z; const m = Math.max(1, cabs(z));
  if (Math.abs(im) < 1e-8 * m) im = 0;
  if (Math.abs(re) < 1e-10 * m) re = 0;
  const rr = Math.round(re * 1e8) / 1e8, ri = Math.round(im * 1e8) / 1e8;
  if (Math.abs(rr - re) < 1e-9) re = rr; if (Math.abs(ri - im) < 1e-9) im = ri;
  return C(re, im);
}
function polyDerDesc(c){ const d = c.length - 1; return c.slice(0, -1).map((v, i) => v * (d - i)); }
function groupRoots(rs, tol = 3e-3, poly = null){
  const g = [];
  rs.forEach(z => {
    const f = g.find(o => cabs(csub(cscale(o.sum, 1 / o.m), z)) < tol * Math.max(1, cabs(z)));
    if (f){ f.sum = cadd(f.sum, z); f.m++; } else g.push({sum: z, m: 1});
  });
  return g.map(o => {
    let z = cscale(o.sum, 1 / o.m);
    if (poly && o.m > 1){ // nghiệm bội m là nghiệm đơn của đạo hàm bậc m−1 → Newton cho chính xác
      let q = poly.slice(); for (let i = 0; i < o.m - 1; i++) q = polyDerDesc(q);
      const dq = polyDerDesc(q);
      for (let it = 0; it < 40; it++){ const fz = polyvalC(q, z), dz = polyvalC(dq, z); if (cabs(dz) < 1e-300) break; const st = cdiv(fz, dz); z = csub(z, st); if (cabs(st) < 1e-15) break; }
    }
    return {z: cleanC(z), m: o.m};
  });
}
const rootsG = c => groupRoots(roots(c), 3e-3, trimLead(c));
/* ---------- Khai triển Taylor & chuỗi ---------- */
function taylorAt(c, p, K){ // c giảm dần (thực), trả về hệ số tăng dần theo t tại z = p + t
  let arr = c.map(v => C(v)); const out = [];
  for (let k = 0; k <= K; k++){
    if (arr.length === 0){ out.push(C(0)); continue; }
    const b = [arr[0]]; for (let i = 1; i < arr.length; i++) b.push(cadd(arr[i], cmul(p, b[i - 1])));
    out.push(b[b.length - 1]); arr = b.slice(0, -1);
  }
  return out;
}
function smul(a, b, K){ const r = []; for (let k = 0; k <= K; k++){ let s = C(0); for (let i = 0; i <= k; i++) if (a[i] && b[k - i]) s = cadd(s, cmul(a[i], b[k - i])); r.push(s); } return r; }
function sdiv(a, b, K){ const q = []; for (let k = 0; k <= K; k++){ let s = a[k] || C(0); for (let i = 1; i <= k; i++) if (b[i]) s = csub(s, cmul(b[i], q[k - i])); q.push(cdiv(s, b[0])); } return q; }
/* Phần chính của num/den tại mọi cực: hệ số C_j của 1/(z − p)^j */
function principalParts(num, den){
  den = trimLead(den); const lead = den[0];
  const poles = rootsG(den);
  return poles.map(({z: p, m: s}) => {
    const K = s - 1;
    const nT = taylorAt(trimLead(num), p, K);
    let dS = [C(lead)];
    poles.forEach(q => { if (q.z === p) return; const f = [csub(p, q.z), C(1)]; for (let i = 0; i < q.m; i++) dS = smul(dS, f, K); });
    const G = sdiv(nT, dS, K);
    const coef = []; for (let j = 1; j <= s; j++) coef.push(G[s - j]);
    return {p, s, coef};
  });
}
/* ---------- Biến đổi Z ngược theo phương pháp X(z)/z của bài giảng ---------- */
function izt(N, D){
  N = trimLead(N); D = trimLead(D);
  let S = [], R = N;
  if (N.length > D.length){ const d = polyDivDesc(N, D); S = d.q; R = d.r; }
  const pp = principalParts(R, [...D, 0]);
  const deltas = {}; const terms = [];
  // phần nguyên S(z) = Σ s_i z^(deg−i) ↔ δ(n + k)
  S.forEach((s, i) => { const k = S.length - 1 - i; if (Math.abs(s) > 1e-12) deltas[-k] = (deltas[-k] || 0) + s; });
  pp.forEach(({p, s, coef}) => {
    coef.forEach((cj, idx) => {
      const j = idx + 1; if (cabs(cj) < 1e-10) return;
      if (cabs(p) < 1e-12){ const n = j - 1; deltas[n] = (deltas[n] || 0) + cj.re; }
      else terms.push({C: cj, p, m: j - 1});
    });
  });
  return {pp, terms, deltas, S};
}
function binomPoly(n, m){ let r = 1; for (let i = 0; i < m; i++) r *= (n - i) / (i + 1); return r; }
function izEval(res, roc, n){
  let v = C(0);
  res.terms.forEach(t => {
    const causal = cabs(t.p) <= roc.rin + 1e-9;
    if (causal && n >= 0) v = cadd(v, cscale(cmul(t.C, cpowi(t.p, n - t.m)), binomPoly(n, t.m)));
    if (!causal && n <= -1) v = csub(v, cscale(cmul(t.C, cpowi(t.p, n - t.m)), binomPoly(n, t.m)));
  });
  if (res.deltas[n]) v = cadd(v, C(res.deltas[n]));
  return v.re;
}
/* =================== CHUỖI HIỂN THỊ =================== */
const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','−':'⁻','n':'ⁿ','+':'⁺'};
const sup = s => String(s).split('').map(ch => SUP[ch] || ch).join('');
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
function polyZ(c, v = 'z'){ // giảm dần
  c = trimLead(c); const d = c.length - 1; let out = '';
  c.forEach((a, i) => {
    if (Math.abs(a) < 1e-12) return; const p = d - i, A = Math.abs(a);
    let co = (Math.abs(A - 1) < 1e-12 && p !== 0) ? '' : fmt(A);
    const mono = p === 0 ? '' : (p === 1 ? v : `${v}<sup>${p}</sup>`);
    out += (out ? (a < 0 ? ' − ' : ' + ') : (a < 0 ? '−' : '')) + co + mono;
  });
  return out || '0';
}
function polyW(b){ // tăng dần theo z^-1
  let out = '';
  b.forEach((a, k) => {
    if (Math.abs(a) < 1e-12) return; const A = Math.abs(a);
    const co = (Math.abs(A - 1) < 1e-12 && k !== 0) ? '' : fmt(A);
    const mono = k === 0 ? '' : `z<sup>−${k}</sup>`;
    out += (out ? (a < 0 ? ' − ' : ' + ') : (a < 0 ? '−' : '')) + co + mono;
  });
  return out || '0';
}
function laurent(vals, n0){ // Σ x(n) z^-n
  let out = '';
  vals.forEach((a, i) => {
    const n = n0 + i; if (Math.abs(a) < 1e-12) return; const A = Math.abs(a);
    const co = (Math.abs(A - 1) < 1e-12 && n !== 0) ? '' : fmt(A);
    const mono = n === 0 ? '' : (n === -1 ? 'z' : `z<sup>${n > 0 ? '−' + n : -n}</sup>`);
    out += (out ? (a < 0 ? ' − ' : ' + ') : (a < 0 ? '−' : '')) + co + mono;
  });
  return out || '0';
}
function zMinus(p){ // (z − p)
  if (cabs(p) < 1e-12) return 'z';
  if (Math.abs(p.im) < 1e-12) return p.re > 0 ? `(z − ${fmt(p.re)})` : `(z + ${fmt(-p.re)})`;
  return `(z − (${fmtc(p)}))`;
}
function piStr(t){
  const q = t / Math.PI; if (Math.abs(q) < 1e-9) return '0';
  for (let d = 1; d <= 12; d++){ const k = Math.round(q * d); if (Math.abs(q * d - k) < 1e-6){ const g = gcd(Math.abs(k), d); const kk = k / g, dd = d / g; return `${kk < 0 ? '−' : ''}${Math.abs(kk) === 1 ? '' : Math.abs(kk)}π${dd === 1 ? '' : '/' + dd}`; } }
  return fmt(t, 3);
}
function gcd(a, b){ return b ? gcd(b, a % b) : a; }
function powStr(p, m){ // p^(n−m) với p thực
  const e = m === 0 ? 'n' : `n−${m}`;
  if (Math.abs(p - 1) < 1e-12) return '';
  if (p > 0 && Number.isInteger(+p.toFixed(9))) return `${fmt(p)}<sup>${e}</sup>`;
  return `(${fmt(p)})<sup>${e}</sup>`;
}
const BIN = ['', 'n', 'n(n−1)/2', 'n(n−1)(n−2)/6', 'n(n−1)(n−2)(n−3)/24'];
function termsHTML(res, roc){
  const parts = []; // {neg, body}
  const keys = Object.keys(res.deltas).map(Number).sort((a, b) => a - b);
  keys.forEach(n => { const v = res.deltas[n]; if (Math.abs(v) < 1e-10) return; const d = n === 0 ? 'δ(n)' : (n > 0 ? `δ(n − ${n})` : `δ(n + ${-n})`); parts.push({neg: v < 0, body: (Math.abs(Math.abs(v) - 1) < 1e-10 ? '' : fmt(Math.abs(v)) + '·') + d}); });
  const used = new Set();
  res.terms.forEach((t, i) => {
    if (used.has(i)) return; const causal = cabs(t.p) <= roc.rin + 1e-9; const unit = causal ? 'u(n)' : 'u(−n−1)'; const sg = causal ? 1 : -1;
    const bin = BIN[t.m] !== undefined ? BIN[t.m] : `C(n,${t.m})`;
    if (Math.abs(t.p.im) < 1e-10){
      const c = sg * t.C.re; const ps = powStr(t.p.re, t.m);
      const pieces = [Math.abs(Math.abs(c) - 1) < 1e-10 ? '' : fmt(Math.abs(c)), bin ? (t.m >= 2 ? `[${bin}]` : bin) : '', ps, unit].filter(Boolean);
      parts.push({neg: c < 0, body: pieces.join('·')});
    } else {
      const j = res.terms.findIndex((u, k) => k !== i && !used.has(k) && u.m === t.m && cabs(csub(u.p, C(t.p.re, -t.p.im))) < 1e-7);
      if (j >= 0 && t.m === 0){
        used.add(j); const tt = t.p.im > 0 ? t : res.terms[j];
        const A = 2 * cabs(tt.C) * sg, r = cabs(tt.p), th = carg(tt.p), ph = carg(tt.C);
        const phs = Math.abs(ph) < 1e-9 ? '' : (ph > 0 ? ` + ${piStr(ph)}` : ` − ${piStr(-ph)}`);
        const rs = Math.abs(r - 1) < 1e-12 ? '' : `(${fmt(r)})<sup>n</sup>·`;
        parts.push({neg: A < 0, body: `${Math.abs(Math.abs(A) - 1) < 1e-10 ? '' : fmt(Math.abs(A)) + '·'}${rs}cos(${piStr(th)}·n${phs})·${unit}`});
      } else {
        const c = cscale(t.C, sg);
        parts.push({neg: false, body: `(${fmtc(c)})·${bin ? bin + '·' : ''}(${fmtc(t.p)})<sup>${t.m ? 'n−' + t.m : 'n'}</sup>·${unit}`});
      }
    }
  });
  if (!parts.length) return '0';
  return parts.map((p, i) => i === 0 ? (p.neg ? '−' : '') + p.body : (p.neg ? ' − ' : ' + ') + p.body).join('');
}
/* =================== VẼ ĐỒ THỊ =================== */
const CL = {ink:"#161616", muted:"#6B6B67", line:"#E2E2DE", grid:"#EEEEEA", red:"#C41E3A", green:"#145F39", greenT:"#E7F4EC", blue:"#1F4E8C", amber:"#9A5B00", paper:"rgba(255,255,255,0.78)"};
function niceTicks(lo, hi, n = 5){
  const span = hi - lo || 1; const step0 = span / n; const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const st = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => span / s <= n) || 10 * mag;
  const out = []; for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-12; v += st) out.push(+v.toFixed(10)); return out;
}
function stemPlot(el, cfg){
  const W = Math.max(280, el.clientWidth || 600), H = cfg.height || (W < 520 ? 210 : 240);
  const padL = 46, padR = 12, padT = 16, padB = 34; const {nmin, nmax} = cfg;
  let vs = []; cfg.series.forEach(s => s.n.forEach((n, i) => { if (n >= nmin && n <= nmax && isFinite(s.v[i])) vs.push(s.v[i]); }));
  let ymin = Math.min(0, ...vs), ymax = Math.max(0, ...vs);
  if (ymax - ymin < 1e-12){ ymax = 1; ymin = Math.min(ymin, 0); }
  const pad = (ymax - ymin) * 0.12; ymax += pad; if (ymin < 0) ymin -= pad;
  const X = n => padL + (n - nmin + 0.5) / (nmax - nmin + 1) * (W - padL - padR);
  const Y = v => padT + (ymax - v) / (ymax - ymin) * (H - padT - padB);
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cfg.label || 'Đồ thị dãy'}"><rect width="${W}" height="${H}" fill="${CL.paper}"/>`;
  niceTicks(ymin, ymax, 4).forEach(t => { s += `<line x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}" stroke="${CL.grid}"/><text x="${padL - 6}" y="${Y(t) + 4}" text-anchor="end" font-size="11.5" fill="${CL.muted}" font-family="JetBrains Mono, monospace">${fmt(t, 3)}</text>`; });
  const cnt = nmax - nmin + 1; const pxPer = (W - padL - padR) / cnt; const every = pxPer >= 24 ? 1 : pxPer >= 12 ? 2 : pxPer >= 6 ? 5 : 10;
  for (let n = nmin; n <= nmax; n++) if (((n % every) + every) % every === 0) s += `<text x="${X(n)}" y="${H - padB + 16}" text-anchor="middle" font-size="11.5" fill="${CL.muted}" font-family="JetBrains Mono, monospace">${n < 0 ? '−' + (-n) : n}</text>`;
  s += `<text x="${W - padR}" y="${H - 4}" text-anchor="end" font-size="11.5" fill="${CL.muted}">n</text>`;
  s += `<line x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}" stroke="${CL.ink}" stroke-width="1"/>`;
  if (nmin <= 0 && nmax >= 0) s += `<line x1="${X(0)}" x2="${X(0)}" y1="${padT}" y2="${H - padB}" stroke="${CL.line}" stroke-dasharray="3 3"/>`;
  const k = cfg.series.length;
  cfg.series.forEach((sr, si) => {
    const off = (si - (k - 1) / 2) * Math.min(6, pxPer * 0.22);
    sr.n.forEach((n, i) => {
      const v = sr.v[i]; if (n < nmin || n > nmax || !isFinite(v)) return;
      const x = X(n) + off, y = Y(v), col = typeof sr.color === 'function' ? sr.color(n) : sr.color;
      if (Math.abs(v) > 1e-12 || sr.showZero) s += `<line x1="${x}" x2="${x}" y1="${Y(0)}" y2="${y}" stroke="${col}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${pxPer < 9 ? 2.5 : 4}" fill="${sr.hollow ? CL.paper : col}" stroke="${col}" stroke-width="1.8"/>`;
      if (cfg.values && cnt <= 22 && Math.abs(v) > 1e-12 && k === 1) s += `<text x="${x}" y="${v >= 0 ? y - 8 : y + 16}" text-anchor="middle" font-size="11" fill="${CL.ink}" font-family="JetBrains Mono, monospace">${fmt(v, 3)}</text>`;
    });
  });
  el.innerHTML = s + '</svg>';
}
function zPlane(el, cfg){
  const Wc = el.clientWidth || 320; const S = Math.max(230, Math.min(Wc, cfg.size || 360));
  const pts = [...(cfg.poles || []), ...(cfg.zeros || [])].map(o => cabs(o.z));
  let ext = Math.max(1.35, ...pts.map(r => r * 1.25));
  if (cfg.roc && isFinite(cfg.roc.rin) && cfg.roc.rin > 0) ext = Math.max(ext, cfg.roc.rin * 1.25);
  if (cfg.roc && isFinite(cfg.roc.rout)) ext = Math.max(ext, cfg.roc.rout * 1.2);
  if (cfg.testR) ext = Math.max(ext, cfg.testR * 1.15);
  ext = Math.min(ext, 7);
  const c = S / 2, k = (S / 2 - 22) / ext, P = z => [c + z.re * k, c - z.im * k];
  const uid = 'cp' + Math.random().toString(36).slice(2, 8);
  let s = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="Mặt phẳng z"><defs><clipPath id="${uid}"><rect x="6" y="6" width="${S - 12}" height="${S - 12}" rx="8"/></clipPath></defs><rect x="6" y="6" width="${S - 12}" height="${S - 12}" rx="8" fill="${CL.paper}" stroke="${CL.line}"/>`;
  const circ = r => { const R = r * k; return `M${c + R} ${c}a${R} ${R} 0 1 0 ${-2 * R} 0a${R} ${R} 0 1 0 ${2 * R} 0z`; };
  if (cfg.roc && cfg.roc !== 'empty'){
    const {rin, rout} = cfg.roc; let d = '';
    d += isFinite(rout) ? circ(rout) : `M0 0H${S}V${S}H0z`;
    if (rin > 0) d += circ(rin);
    s += `<g clip-path="url(#${uid})"><path d="${d}" fill="${CL.greenT}" fill-rule="evenodd"/></g>`;
    if (rin > 0) s += `<path d="${circ(rin)}" fill="none" stroke="${CL.green}" stroke-width="1.3" stroke-dasharray="5 3"/>`;
    if (isFinite(rout)) s += `<path d="${circ(rout)}" fill="none" stroke="${CL.green}" stroke-width="1.3" stroke-dasharray="5 3"/>`;
  }
  s += `<line x1="12" x2="${S - 12}" y1="${c}" y2="${c}" stroke="${CL.muted}"/><line x1="${c}" x2="${c}" y1="12" y2="${S - 12}" stroke="${CL.muted}"/>`;
  s += `<path d="${circ(1)}" fill="none" stroke="${CL.ink}" stroke-width="1" stroke-dasharray="2 3"/>`;
  s += `<text x="${S - 14}" y="${c - 6}" text-anchor="end" font-size="11.5" fill="${CL.muted}">Re</text><text x="${c + 6}" y="22" font-size="11.5" fill="${CL.muted}">Im</text><text x="${c + k + 3}" y="${c + 14}" font-size="11" fill="${CL.muted}" font-family="JetBrains Mono, monospace">1</text>`;
  if (cfg.testR) s += `<path d="${circ(cfg.testR)}" fill="none" stroke="${CL.blue}" stroke-width="2"/>`;
  (cfg.zeros || []).forEach(o => { let [x, y] = P(o.z); const out = cabs(o.z) > ext; if (out) return; s += `<circle cx="${x}" cy="${y}" r="6.5" fill="${CL.paper}" stroke="${CL.green}" stroke-width="2.2"/>`; if (o.m > 1) s += `<text x="${x + 9}" y="${y + 16}" font-size="11.5" font-weight="700" fill="${CL.green}">${o.m}</text>`; });
  (cfg.poles || []).forEach(o => { let [x, y] = P(o.z); if (cabs(o.z) > ext) return; s += `<path d="M${x - 6} ${y - 6}L${x + 6} ${y + 6}M${x - 6} ${y + 6}L${x + 6} ${y - 6}" stroke="${CL.red}" stroke-width="2.4"/>`; if (o.m > 1) s += `<text x="${x + 8}" y="${y - 7}" font-size="11.5" font-weight="700" fill="${CL.red}">${o.m}</text>`; });
  const off = [...(cfg.poles || []), ...(cfg.zeros || [])].filter(o => cabs(o.z) > ext);
  if (off.length) s += `<text x="14" y="${S - 14}" font-size="11" fill="${CL.muted}">Có điểm nằm ngoài khung (|z| &gt; ${fmt(ext, 2)})</text>`;
  el.innerHTML = s + '</svg>';
}
function pzFromND(N, D){
  const z = rootsG(trimLead(N)), p = rootsG(trimLead(D));
  const cancelled = [];
  z.forEach(zz => { const pp = p.find(q => q.m > 0 && cabs(csub(q.z, zz.z)) < 1e-6); if (pp){ const m = Math.min(pp.m, zz.m); pp.m -= m; zz.m -= m; cancelled.push({z: zz.z, m}); } });
  return {zeros: z.filter(o => o.m > 0), poles: p.filter(o => o.m > 0), cancelled};
}
function rocText(r){
  if (r === 'empty') return 'không tồn tại (ROC rỗng)';
  const a = r.rin, b = r.rout;
  if (a === 0 && !isFinite(b)) return r.inclZero === false && r.inclInf === false ? '0 < |z| < ∞' : r.inclZero === false ? 'mọi z ≠ 0' : r.inclInf === false ? 'mọi z ≠ ∞' : 'toàn mặt phẳng z';
  if (a === 0) return `|z| &lt; ${fmt(b)}`;
  if (!isFinite(b)) return `|z| &gt; ${fmt(a)}`;
  return `${fmt(a)} &lt; |z| &lt; ${fmt(b)}`;
}

