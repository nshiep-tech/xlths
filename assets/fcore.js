"use strict";
/* =====================================================================
   fcore.js – lõi dùng chung cho phần mềm Buổi 5–9 (nạp SAU zcore.js).
   1. Miền tần số: DTFT, đáp ứng tần số H(e^jω), pha, dB
   2. Đồ thị đường (linePlot) theo ω hoặc theo Hz
   3. Cửa sổ và bộ lọc FIR (cửa sổ, lấy mẫu tần số)
   4. Bộ lọc IIR: nguyên mẫu Butterworth/Chebyshev, biến đổi tần số,
      song tuyến, bất biến xung, tương đương vi phân, z thích ứng
   5. Phân tích cấu trúc: dạng nối tiếp, song song
   6. Sơ đồ khối SVG và khung điều hướng tab
   ===================================================================== */
const PI = Math.PI;
const isZ = v => Math.abs(v) < 1e-12;
const cexpj = t => C(Math.cos(t), Math.sin(t));
const cconj = a => C(a.re, -a.im);
const csqrt = a => { const r = cabs(a), t = carg(a) / 2, s = Math.sqrt(r); return C(s * Math.cos(t), s * Math.sin(t)); };
const cexp = a => cscale(cexpj(a.im), Math.exp(a.re));
const cneg = a => C(-a.re, -a.im);
const fmtPi = w => piStr(w);
const db = m => 20 * Math.log10(Math.max(m, 1e-12));

/* ---------- 1. Miền tần số ---------- */
// X(e^jω) = Σ x(n) e^{-jωn}, x bắt đầu tại n0
function dtft(x, n0, w){ let re = 0, im = 0; for (let i = 0; i < x.length; i++){ const t = w * (n0 + i); re += x[i] * Math.cos(t); im -= x[i] * Math.sin(t); } return C(re, im); }
// H(e^jω) với b, a tăng dần theo z^-1
function Hw(b, a, w){ return cdiv(dtft(b, 0, w), dtft(a, 0, w)); }
function wGrid(K = 512, whole = false){ const w = []; for (let k = 0; k < K; k++) w.push(whole ? -PI + 2 * PI * k / (K - 1) : PI * k / (K - 1)); return w; }
function freqz(b, a, K = 512, whole = false){ const w = wGrid(K, whole); return {w, H: w.map(t => Hw(b, a, t))}; }
function unwrap(ph){ const o = ph.slice(); for (let i = 1; i < o.length; i++){ let d = o[i] - o[i - 1]; while (d > PI){ o[i] -= 2 * PI; d -= 2 * PI; } while (d < -PI){ o[i] += 2 * PI; d += 2 * PI; } } return o; }
function impz(b, a, L){ // đáp ứng xung bằng đệ quy (a0 chuẩn hóa)
  const a0 = a[0], h = [];
  for (let n = 0; n < L; n++){ let s = n < b.length ? b[n] : 0; for (let k = 1; k < a.length; k++) if (n - k >= 0) s -= a[k] * h[n - k]; h.push(s / a0); }
  return h;
}
function filt(b, a, x, yi = [], xi = []){ // y(n) = Σb x(n−r) − Σa y(n−k); xi, yi: x(−1),x(−2)…, y(−1),y(−2)…
  const a0 = a[0], y = [];
  const X = n => n >= 0 ? (x[n] || 0) : (xi[-n - 1] || 0), Y = n => n >= 0 ? y[n] : (yi[-n - 1] || 0);
  for (let n = 0; n < x.length; n++){ let s = 0; for (let r = 0; r < b.length; r++) s += b[r] * X(n - r); for (let k = 1; k < a.length; k++) s -= a[k] * Y(n - k); y.push(s / a0); }
  return y;
}
function polyFromRoots(rs){ // đa thức giảm dần (hệ số thực) từ tập nghiệm
  let p = [C(1)];
  rs.forEach(r => { const q = Array(p.length + 1).fill(null).map(() => C(0)); for (let i = 0; i < p.length; i++){ q[i] = cadd(q[i], p[i]); q[i + 1] = csub(q[i + 1], cmul(p[i], r)); } p = q; });
  return p.map(c => Math.abs(c.re) < 1e-15 ? 0 : c.re);
}

/* ---------- 2. Đồ thị đường ---------- */
// cfg: {x:[], series:[{y:[], color, w, dash, name}], xmode:'pi'|'pi2'|'hz'|'num', fs, ymin, ymax, ylabel, xlabel,
//       bands:[{x0,x1,y0,y1,color}], vlines:[{x,color,label,dash}], hlines:[{y,color,label}], dots:[{x,y,color,r,label}], height}
function linePlot(el, cfg){
  const W = Math.max(280, el.clientWidth || 600), H = cfg.height || (W < 520 ? 220 : 260);
  const padL = 52, padR = 14, padT = 14, padB = 40;
  const xs = cfg.x; const xmin = cfg.xmin != null ? cfg.xmin : xs[0], xmax = cfg.xmax != null ? cfg.xmax : xs[xs.length - 1];
  let vals = []; cfg.series.forEach(s => s.y.forEach(v => { if (isFinite(v)) vals.push(v); }));
  let ymin = cfg.ymin != null ? cfg.ymin : Math.min(...vals), ymax = cfg.ymax != null ? cfg.ymax : Math.max(...vals);
  if (cfg.ymin == null && cfg.zero !== false) ymin = Math.min(ymin, 0);
  if (!(ymax - ymin > 1e-12)){ ymax = ymin + 1; }
  if (cfg.ymax == null){ const p = (ymax - ymin) * 0.08; ymax += p; if (cfg.ymin == null && ymin < 0) ymin -= p; }
  const X = v => padL + (v - xmin) / (xmax - xmin) * (W - padL - padR);
  const Y = v => padT + (ymax - Math.max(ymin - (ymax - ymin), Math.min(ymax + (ymax - ymin), v))) / (ymax - ymin) * (H - padT - padB);
  const uid = 'lp' + Math.random().toString(36).slice(2, 8);
  const mono = 'font-family="JetBrains Mono, monospace"';
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cfg.label || 'Đồ thị'}"><defs><clipPath id="${uid}"><rect x="${padL}" y="${padT}" width="${W - padL - padR}" height="${H - padT - padB}"/></clipPath></defs><rect width="${W}" height="${H}" fill="#fff"/>`;
  (cfg.bands || []).forEach(b => { const x0 = X(Math.max(xmin, b.x0)), x1 = X(Math.min(xmax, b.x1)); const y0 = Y(b.y1 != null ? b.y1 : ymax), y1 = Y(b.y0 != null ? b.y0 : ymin); s += `<rect x="${x0}" y="${y0}" width="${Math.max(0, x1 - x0)}" height="${Math.max(0, y1 - y0)}" fill="${b.color || 'rgba(4,120,87,.10)'}" clip-path="url(#${uid})"/>`; });
  niceTicks(ymin, ymax, cfg.yticks || 5).forEach(t => { s += `<line x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}" stroke="#EEF2F6"/><text x="${padL - 6}" y="${Y(t) + 4}" text-anchor="end" font-size="11.5" fill="#64748B" ${mono}>${fmt(t, 3)}</text>`; });
  // trục x
  let xt = [];
  if (cfg.xmode === 'hz'){ niceTicks(xmin, xmax, W < 520 ? 4 : 7).forEach(v => xt.push([v, fmt(v, 1)])); }
  else if (cfg.xmode === 'num'){ niceTicks(xmin, xmax, W < 520 ? 5 : 9).forEach(v => xt.push([v, fmt(v, 2)])); }
  else { const st = (xmax - xmin) / PI > 1.2 ? (W < 520 ? PI / 2 : PI / 4) : (W < 520 ? PI / 4 : PI / 8); for (let v = Math.ceil(xmin / st - 1e-9) * st; v <= xmax + 1e-9; v += st) xt.push([v, piStr(v)]); }
  xt.forEach(([v, lab]) => { s += `<line x1="${X(v)}" x2="${X(v)}" y1="${padT}" y2="${H - padB}" stroke="#F1F5F9"/><text x="${X(v)}" y="${H - padB + 16}" text-anchor="middle" font-size="11.5" fill="#64748B" ${mono}>${lab}</text>`; });
  s += `<text x="${W - padR}" y="${H - 6}" text-anchor="end" font-size="11.5" font-weight="600" fill="#64748B">${cfg.xlabel || (cfg.xmode === 'hz' ? 'f (Hz)' : 'ω (rad/mẫu)')}</text>`;
  if (cfg.ylabel) s += `<text x="6" y="${padT - 2 + 8}" font-size="11.5" font-weight="600" fill="#64748B">${cfg.ylabel}</text>`;
  if (ymin < 0 && ymax > 0) s += `<line x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}" stroke="#94A3B8"/>`;
  s += `<line x1="${padL}" x2="${padL}" y1="${padT}" y2="${H - padB}" stroke="#94A3B8"/><line x1="${padL}" x2="${W - padR}" y1="${H - padB}" y2="${H - padB}" stroke="#94A3B8"/>`;
  (cfg.hlines || []).forEach(l => { s += `<line x1="${padL}" x2="${W - padR}" y1="${Y(l.y)}" y2="${Y(l.y)}" stroke="${l.color || '#B45309'}" stroke-dasharray="${l.dash || '5 4'}" stroke-width="1.3"/>`; if (l.label) s += `<text x="${W - padR - 4}" y="${Y(l.y) - 5}" text-anchor="end" font-size="11" font-weight="600" fill="${l.color || '#B45309'}">${l.label}</text>`; });
  (cfg.vlines || []).forEach(l => { if (l.x < xmin || l.x > xmax) return; s += `<line x1="${X(l.x)}" x2="${X(l.x)}" y1="${padT}" y2="${H - padB}" stroke="${l.color || '#B45309'}" stroke-dasharray="${l.dash || '5 4'}" stroke-width="1.3"/>`; if (l.label) s += `<text x="${X(l.x) + 4}" y="${padT + 12}" font-size="11" font-weight="600" fill="${l.color || '#B45309'}">${l.label}</text>`; });
  cfg.series.forEach(sr => {
    const xx = sr.x || xs; let d = '', pen = false, prev = 0;
    for (let i = 0; i < xx.length; i++){ const v = sr.y[i]; if (!isFinite(v) || xx[i] < xmin - 1e-9 || xx[i] > xmax + 1e-9){ pen = false; continue; } if (sr.jump && pen && Math.abs(v - prev) > sr.jump) pen = false; d += (pen ? 'L' : 'M') + X(xx[i]).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; prev = v; }
    s += `<path d="${d}" fill="none" stroke="${sr.color}" stroke-width="${sr.w || 2}" ${sr.dash ? `stroke-dasharray="${sr.dash}"` : ''} stroke-linejoin="round" clip-path="url(#${uid})"/>`;
  });
  (cfg.dots || []).forEach(p => { if (p.x < xmin - 1e-9 || p.x > xmax + 1e-9) return; s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r || 4}" fill="${p.fill || p.color}" stroke="${p.color}" stroke-width="1.8"/>`; if (p.label) s += `<text x="${X(p.x) + 7}" y="${Y(p.y) - 7}" font-size="11.5" font-weight="700" fill="${p.color}" ${mono}>${p.label}</text>`; });
  el.innerHTML = s + '</svg>';
  return {X, Y};
}
function legendHTML(items){ return '<div class="legend">' + items.map(([c, t, dash]) => `<span><i style="background:${dash ? 'transparent' : c};${dash ? `border:2px dashed ${c};width:14px;height:0;border-radius:0;vertical-align:3px` : ''}"></i>${t}</span>`).join('') + '</div>'; }
const COL = {x: '#1E40AF', y: '#BE123C', g: '#047857', a: '#B45309', n: '#142B4A', m: '#64748B', p: '#7C3AED'};

/* ---------- 3. Cửa sổ và FIR ---------- */
const WIN = {
  rect:     {name: 'Chữ nhật', ml: '4π/N', mlx: 1.8, As: 21, sl: 13, coef: 0.9, Ap: 0.7416, ml1: 'rectwin', f: () => 1},
  tri:      {name: 'Tam giác', ml: '8π/N', mlx: 6.1, As: 25, sl: 26, coef: null, Ap: null, ml1: 'bartlett', f: (n, N) => N < 2 ? 1 : 1 - Math.abs(2 * n / (N - 1) - 1)},
  hann:     {name: 'Hanning', ml: '8π/N', mlx: 6.2, As: 44, sl: 32, coef: 3.1, Ap: 0.0546, ml1: 'hann', f: (n, N) => N < 2 ? 1 : 0.5 - 0.5 * Math.cos(2 * PI * n / (N - 1))},
  hamming:  {name: 'Hamming', ml: '8π/N', mlx: 6.6, As: 53, sl: 43, coef: 3.3, Ap: 0.0194, ml1: 'hamming', f: (n, N) => N < 2 ? 1 : 0.54 - 0.46 * Math.cos(2 * PI * n / (N - 1))},
  blackman: {name: 'Blackman', ml: '12π/N', mlx: 11, As: 74, sl: 57, coef: 5.5, Ap: 0.0017, ml1: 'blackman', f: (n, N) => N < 2 ? 1 : 0.42 - 0.5 * Math.cos(2 * PI * n / (N - 1)) + 0.08 * Math.cos(4 * PI * n / (N - 1))}
};
const winSeq = (key, N) => Array.from({length: N}, (_, n) => WIN[key].f(n, N));
const sincLP = (wc, m) => Math.abs(m) < 1e-12 ? wc / PI : Math.sin(wc * m) / (PI * m);
// đáp ứng xung lý tưởng (pha tuyến tính, tâm M) cho LP/HP/BP/BS
function hIdeal(type, n, M, w1, w2){
  const m = n - M, d = Math.abs(m) < 1e-12 ? 1 : 0;
  if (type === 'lp') return sincLP(w1, m);
  if (type === 'hp') return d - sincLP(w1, m);
  if (type === 'bp') return sincLP(w2, m) - sincLP(w1, m);
  return d - (sincLP(w2, m) - sincLP(w1, m));
}
function firWindow(type, N, w1, w2, win, scale = false){
  const M = (N - 1) / 2, hd = [], w = winSeq(win, N), h = [];
  for (let n = 0; n < N; n++){ hd.push(hIdeal(type, n, M, w1, w2)); h.push(hd[n] * w[n]); }
  let g = 1;
  if (scale){ const w0 = type === 'hp' ? PI : type === 'bp' ? (w1 + w2) / 2 : 0; g = 1 / cabs(dtft(h, 0, w0)); }
  return {M, hd, w, h: h.map(v => v * g), g};
}
// lấy mẫu tần số (FIR loại 1, N lẻ): Hk = 1 trong dải thông
function firFreqSamp(type, N, w1, w2){
  const M = (N - 1) / 2, K = Math.floor((N - 1) / 2), Hk = [];
  for (let k = 0; k <= K; k++){
    const wk = 2 * PI * k / N; let v;
    if (type === 'lp') v = wk <= w1 + 1e-12; else if (type === 'hp') v = wk >= w1 - 1e-12; else if (type === 'bp') v = wk >= w1 - 1e-12 && wk <= w2 + 1e-12; else v = wk <= w1 + 1e-12 || wk >= w2 - 1e-12;
    Hk.push(v ? 1 : 0);
  }
  const h = []; for (let n = 0; n < N; n++){ let s = Hk[0]; for (let k = 1; k <= K; k++) s += 2 * Hk[k] * Math.cos(2 * PI * k * (n - M) / N); h.push(s / N); }
  return {M, Hk, h};
}
// đo chất lượng bộ lọc từ |H| trên lưới dày (dải thông/chắn theo ω)
function measure(h, a, pass, stop){
  const K = 2048, w = wGrid(K), m = w.map(t => cabs(Hw(h, a || [1], t)));
  const inR = (t, R) => R.some(([x0, x1]) => t >= x0 - 1e-9 && t <= x1 + 1e-9);
  let pmax = 0, pmin = Infinity, smax = 0;
  w.forEach((t, i) => { if (inR(t, pass)){ pmax = Math.max(pmax, m[i]); pmin = Math.min(pmin, m[i]); } if (inR(t, stop)) smax = Math.max(smax, m[i]); });
  const dp = Math.max(Math.abs(pmax - 1), Math.abs(1 - pmin)); // gợn quanh mức 1 (bộ lọc đã chuẩn hóa)
  return {pmax, pmin, smax, dp, Ap: 20 * Math.log10(1 + dp), App: 20 * Math.log10(pmax / Math.max(pmin, 1e-12)), As: -20 * Math.log10(Math.max(smax, 1e-12)), w, m};
}

/* ---------- 4. IIR ---------- */
// nguyên mẫu tương tự (tần số cắt 1 rad/s), dạng zpk
function buttap(N){ const p = []; for (let k = 1; k <= N; k++) p.push(cexpj(PI * (2 * k + N - 1) / (2 * N))); return {z: [], p: p.map(cleanC), k: 1}; }
function cheb1ap(N, Rp){
  const eps = Math.sqrt(Math.pow(10, Rp / 10) - 1), mu = Math.asinh(1 / eps) / N, p = [];
  for (let k = 1; k <= N; k++){ const th = PI * (2 * k - 1) / (2 * N); p.push(C(-Math.sinh(mu) * Math.sin(th), Math.cosh(mu) * Math.cos(th))); }
  let kk = p.reduce((acc, q) => cmul(acc, cneg(q)), C(1)).re; if (N % 2 === 0) kk /= Math.sqrt(1 + eps * eps);
  return {z: [], p: p.map(cleanC), k: kk, eps};
}
const prodC = arr => arr.reduce((a, b) => cmul(a, b), C(1));
function lp2lp(f, W){ const d = f.p.length - f.z.length; return {z: f.z.map(q => cscale(q, W)), p: f.p.map(q => cscale(q, W)), k: f.k * Math.pow(W, d)}; }
function lp2hp(f, W){ const d = f.p.length - f.z.length; const z = f.z.map(q => cdiv(C(W), q)).concat(Array(d).fill(0).map(() => C(0))); const p = f.p.map(q => cdiv(C(W), q)); const k = f.k * cdiv(prodC(f.z.map(cneg)), prodC(f.p.map(cneg))).re; return {z, p, k}; }
function lp2bp(f, W0, BW){ const d = f.p.length - f.z.length; const t = q => { const a = cscale(q, BW / 2), r = csqrt(csub(cmul(a, a), C(W0 * W0))); return [cadd(a, r), csub(a, r)]; }; return {z: f.z.flatMap(t).concat(Array(d).fill(0).map(() => C(0))), p: f.p.flatMap(t), k: f.k * Math.pow(BW, d)}; }
function lp2bs(f, W0, BW){ const d = f.p.length - f.z.length; const t = q => { const a = cdiv(C(BW / 2), q), r = csqrt(csub(cmul(a, a), C(W0 * W0))); return [cadd(a, r), csub(a, r)]; }; const z = f.z.flatMap(t); for (let i = 0; i < d; i++){ z.push(C(0, W0)); z.push(C(0, -W0)); } return {z, p: f.p.flatMap(t), k: f.k * cdiv(prodC(f.z.map(cneg)), prodC(f.p.map(cneg))).re}; }
function bilinearZpk(f, fs){ const fs2 = C(2 * fs), d = f.p.length - f.z.length; const z = f.z.map(q => cdiv(cadd(fs2, q), csub(fs2, q))).concat(Array(Math.max(0, d)).fill(0).map(() => C(-1))); const p = f.p.map(q => cdiv(cadd(fs2, q), csub(fs2, q))); const k = f.k * cdiv(prodC(f.z.map(q => csub(fs2, q))), prodC(f.p.map(q => csub(fs2, q)))).re; return {z, p, k}; }
function zpk2tf(f){ const b = polyFromRoots(f.z).map(v => v * f.k), a = polyFromRoots(f.p); return {b, a}; } // tăng dần theo z^-1 (= giảm dần theo z)
// butter / cheby1 kiểu MATLAB: Wn chuẩn hóa (1 = π rad/mẫu), type 'low'|'high'|'bandpass'|'stop'
function iirDesign(kind, N, Wn, type, Rp){
  const fs = 2, warp = w => 2 * fs * Math.tan(PI * w / fs);
  const proto = kind === 'cheby1' ? cheb1ap(N, Rp) : buttap(N);
  let a;
  if (type === 'low') a = lp2lp(proto, warp(Wn[0]));
  else if (type === 'high') a = lp2hp(proto, warp(Wn[0]));
  else { const w1 = warp(Wn[0]), w2 = warp(Wn[1]), W0 = Math.sqrt(w1 * w2), BW = w2 - w1; a = type === 'bandpass' ? lp2bp(proto, W0, BW) : lp2bs(proto, W0, BW); }
  const d = bilinearZpk(a, fs); const tf = zpk2tf(d);
  return {analog: a, proto, z: d.z.map(cleanC), p: d.p.map(cleanC), k: d.k, b: tf.b, a: tf.a};
}
// buttord / cheb1ord theo MATLAB (LP, HP, BP). Wp, Ws chuẩn hóa; Rp, Rs (dB)
function iirOrder(kind, Wp, Ws, Rp, Rs){
  const type = Wp.length === 1 ? (Wp[0] < Ws[0] ? 'low' : 'high') : 'bandpass';
  const WP = Wp.map(w => Math.tan(PI * w / 2)), WS = Ws.map(w => Math.tan(PI * w / 2));
  let WA;
  if (type === 'low') WA = WS[0] / WP[0];
  else if (type === 'high') WA = WP[0] / WS[0];
  else WA = Math.min(...WS.map(s => Math.abs((s * s - WP[0] * WP[1]) / (s * (WP[0] - WP[1])))));
  const G = (Math.pow(10, 0.1 * Rs) - 1) / (Math.pow(10, 0.1 * Rp) - 1);
  let N, Wn;
  if (kind === 'cheby1'){ N = Math.max(1, Math.ceil(Math.acosh(Math.sqrt(G)) / Math.acosh(WA))); Wn = Wp.slice(); }
  else {
    N = Math.max(1, Math.ceil(Math.log10(G) / (2 * Math.log10(WA))));
    const W0 = WA / Math.pow(Math.pow(10, 0.1 * Rs) - 1, 1 / (2 * N));
    let WN;
    if (type === 'low') WN = [W0 * WP[0]];
    else if (type === 'high') WN = [WP[0] / W0];
    else { const bw = WP[1] - WP[0]; WN = [-W0, W0].map(w0 => Math.abs((-w0 * bw + Math.sqrt(w0 * w0 * bw * bw + 4 * WP[0] * WP[1])) / 2)).sort((x, y) => x - y); }
    Wn = WN.map(w => 2 / PI * Math.atan(w));
  }
  return {N, Wn, type, WA};
}
// Ha(s) = B(s)/A(s), hệ số giảm dần theo s. Thay s = c·(p0 + p1 z⁻¹)/(q0 + q1 z⁻¹) → H(z) (tăng dần theo z⁻¹)
function substS(B, A, c, P, Q){
  const L = Math.max(B.length, A.length) - 1;
  const pw = (v, k) => { let r = [1]; for (let i = 0; i < k; i++) r = conv(r, v); return r; };
  const side = X => { const asc = X.slice().reverse(); let out = [0]; asc.forEach((x, k) => { if (isZ(x)) return; const t = conv(pw(P, k), pw(Q, L - k)).map(v => v * x * Math.pow(c, k)); out = polyAdd(out, t); }); return out; };
  let b = side(B), a = side(A); const a0 = a[0]; b = b.map(v => v / a0); a = a.map(v => v / a0);
  while (b.length > 1 && isZ(b[b.length - 1])) b.pop(); while (a.length > 1 && isZ(a[a.length - 1])) a.pop();
  return {b, a};
}
const bilinearTF = (B, A, T) => substS(B, A, 2 / T, [1, -1], [1, 1]);
const backDiffTF = (B, A, T) => substS(B, A, 1 / T, [1, -1], [1, 0]);
// bất biến xung (theo bài giảng: h(n) = ha(nT), không nhân T)
function impinvarTF(B, A, T){
  B = trimLead(B); A = trimLead(A);
  if (B.length >= A.length) return {err: 'Bậc tử số phải nhỏ hơn bậc mẫu số.'};
  const ps = rootsG(A); if (ps.some(o => o.m > 1)) return {err: 'Ha(s) có cực bội, phương pháp phân thức đơn giản ở đây không áp dụng.'};
  const dA = polyDerDesc(A);
  const terms = ps.map(o => { const s = o.z; return {s, A: cdiv(polyvalC(B, s), polyvalC(dA, s)), zp: cexp(cscale(s, T))}; });
  // ghép Σ A_k/(1 − z_k z⁻¹)
  let num = [C(0)], den = [C(1)];
  terms.forEach(t => { const f = [C(1), cneg(t.zp)]; num = polyAddC(cmulPolyC(num, f), cmulPolyC(den, [t.A])); den = cmulPolyC(den, f); });
  return {terms, b: num.map(c => c.re), a: den.map(c => c.re)};
}
function cmulPolyC(a, b){ const r = Array(a.length + b.length - 1).fill(0).map(() => C(0)); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] = cadd(r[i + j], cmul(x, y)); })); return r; }
function polyAddC(a, b){ const n = Math.max(a.length, b.length), r = []; for (let i = 0; i < n; i++) r.push(cadd(a[i] || C(0), b[i] || C(0))); return r; }
// z thích ứng: (s − r) → (1 − e^{rT} z⁻¹)
function matchedZ(B, A, T){
  B = trimLead(B); A = trimLead(A); const zs = roots(B), ps = roots(A), Cc = B[0] / A[0];
  const zz = zs.map(r => cexp(cscale(r, T))), pp = ps.map(r => cexp(cscale(r, T)));
  const b = polyFromRoots(zz).map(v => v * Cc), a = polyFromRoots(pp);
  return {zs, ps, zz, pp, b, a, Cc};
}

/* ---------- 5. Nối tiếp, song song ---------- */
// b, a tăng dần theo z^-1. Trả về các khâu bậc 1/2 {b:[..], a:[..]}
function pairRoots(rs){
  const cx = rs.filter(r => r.im > 1e-9), re = rs.filter(r => Math.abs(r.im) <= 1e-9).map(r => r.re).sort((x, y) => Math.abs(y) - Math.abs(x));
  const secs = cx.map(r => [1, -2 * r.re, r.re * r.re + r.im * r.im]);
  re.forEach(r => secs.push([1, -r])); // nghiệm thực: khâu bậc 1 (7.15); cặp phức: khâu bậc 2 (7.16)
  return secs;
}
function cascadeSecs(b, a){
  b = b.slice(); a = a.slice(); while (b.length > 1 && isZ(b[b.length - 1])) b.pop(); while (a.length > 1 && isZ(a[a.length - 1])) a.pop();
  let lead = 0; while (lead < b.length - 1 && isZ(b[lead])) lead++;
  const g = b[lead] / a[0]; const bz = b.slice(lead).map(v => v / b[lead]), az = a.map(v => v / a[0]);
  const zs = bz.length > 1 ? roots(bz) : [], ps = az.length > 1 ? roots(az) : [];
  const nS = pairRoots(zs), dS = pairRoots(ps), K = Math.max(nS.length, dS.length, 1), secs = [];
  for (let i = 0; i < K; i++) secs.push({b: nS[i] || [1], a: dS[i] || [1]});
  secs[0].b = secs[0].b.map(v => v * g); if (lead) secs[0].b = Array(lead).fill(0).concat(secs[0].b);
  return {secs, g, lead};
}
function parallelSecs(b, a){
  const A = a.map(v => v / a[0]), Bn = b.map(v => v / a[0]); const N = A.length - 1;
  let direct = [], R = Bn.slice();
  if (Bn.length - 1 >= N){ const d = polyDivDesc(Bn.slice().reverse(), A.slice().reverse()); direct = d.q.slice().reverse(); R = d.r.slice().reverse(); }
  while (R.length < N) R.push(0); R = R.slice(0, N);
  const ps = roots(A); const g = groupRoots(ps); if (g.some(o => o.m > 1)) return {err: 'Mẫu số có cực bội, dạng song song bậc 1/bậc 2 đơn giản không áp dụng.'};
  const Aw = A.slice().reverse(), dAw = polyDerDesc(Aw), Rw = R.slice().reverse();
  const res = ps.map(p => { const w0 = cdiv(C(1), p); return {p, r: cdiv(cmul(cneg(p), polyvalC(Rw, w0)), polyvalC(dAw, w0))}; });
  const secs = [];
  res.filter(o => o.p.im > 1e-9).forEach(o => secs.push({b: [2 * o.r.re, -2 * (o.r.re * o.p.re + o.r.im * o.p.im)], a: [1, -2 * o.p.re, o.p.re * o.p.re + o.p.im * o.p.im], pole: o.p, r: o.r}));
  res.filter(o => Math.abs(o.p.im) <= 1e-9).forEach(o => secs.push({b: [o.r.re], a: [1, -o.p.re], pole: o.p, r: o.r}));
  return {secs, direct: direct.map(v => Math.abs(v) < 1e-13 ? 0 : v), res};
}

/* ---------- 6. Sơ đồ khối SVG ---------- */
const svgT = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" font-size="${o.s || 14}" font-family="${o.mono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif'}" font-weight="${o.w || 500}" fill="${o.c || '#172033'}">${t}</text>`;
const arrowDef = '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#334155"/></marker></defs>';
const ln = (x1, y1, x2, y2, arrow = true) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="1.6"${arrow ? ' marker-end="url(#ah)"' : ''}/>`;
const adder = (x, y, r = 15) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#172033" stroke-width="1.8"/><path d="M${x} ${y - r + 5}v${2 * r - 10}M${x - r + 5} ${y}h${2 * r - 10}" stroke="#172033" stroke-width="1.6"/>`;
const delayBox = (x, y) => `<rect x="${x - 26}" y="${y - 15}" width="52" height="30" rx="7" fill="#FFF1F3" stroke="#BE123C" stroke-width="1.6"/>` + svgT(x, y + 5, 'z⁻¹', {mono: true, c: '#9F1239', w: 700});
const gainTri = (x, y, dir, val) => { const w = 20; const pts = dir > 0 ? `${x - w},${y - 13} ${x + w},${y} ${x - w},${y + 13}` : dir < 0 ? `${x + w},${y - 13} ${x - w},${y} ${x + w},${y + 13}` : `${x - 13},${y - w} ${x + 13},${y - w} ${x},${y + w}`; return `<polygon points="${pts}" fill="#ECFDF5" stroke="#047857" stroke-width="1.6"/>` + (dir === 0 ? svgT(x + 18, y - 4, val, {a: 'start', mono: true, c: '#065F46', w: 700, s: 13}) : svgT(x, y - 19, val, {mono: true, c: '#065F46', w: 700, s: 13})); };
const dotP = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#172033"/>`;
function df2Svg(an, bn){
  const N = an.length - 1, M = bn.length - 1, K = Math.max(N, M, 0);
  const xL = 175, xW = 370, xR = 565, y0 = 60, dy = 92, W = 760, H = y0 + K * dy + 50, Y = k => y0 + k * dy;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sơ đồ trực tiếp 2">${arrowDef}`;
  s += svgT(18, y0 - 12, 'x(n)', {a: 'start', mono: true, w: 700}) + ln(20, y0, xL - 16, y0) + adder(xL, y0) + ln(xL + 15, y0, xW - 5, y0) + dotP(xW, y0) + svgT(xW + 8, y0 - 12, 'w(n)', {a: 'start', mono: true, s: 13, c: '#64748B'});
  if (!isZ(bn[0])) s += ln(xW, y0, (xW + xR) / 2 - 22, y0, false) + gainTri((xW + xR) / 2, y0, 1, fmt(bn[0])) + ln((xW + xR) / 2 + 20, y0, xR - 16, y0);
  s += adder(xR, y0) + ln(xR + 15, y0, W - 70, y0) + svgT(W - 60, y0 + 5, 'y(n)', {a: 'start', mono: true, w: 700});
  for (let k = 1; k <= K; k++){ const ym = (Y(k - 1) + Y(k)) / 2; s += ln(xW, Y(k - 1) + 4, xW, ym - 16) + delayBox(xW, ym) + ln(xW, ym + 15, xW, Y(k), false) + dotP(xW, Y(k)); }
  let lowL = 0; for (let k = 1; k <= N; k++) if (!isZ(an[k])) lowL = k;
  for (let k = 1; k <= lowL; k++){ if (!isZ(an[k])) s += ln(xW, Y(k), (xW + xL) / 2 + 22, Y(k), false) + gainTri((xW + xL) / 2, Y(k), -1, fmt(-an[k])) + ln((xW + xL) / 2 - 20, Y(k), xL + (k === lowL ? 0 : 13), Y(k), k !== lowL); if (k < lowL) s += adder(xL, Y(k), 12); }
  if (lowL) for (let k = lowL; k >= 1; k--){ const top = k === 1 ? y0 + 15 : Y(k - 1) + 12; s += ln(xL, Y(k) - (k === lowL ? 0 : 12), xL, top); }
  let lowR = 0; for (let k = 1; k <= M; k++) if (!isZ(bn[k])) lowR = k;
  for (let k = 1; k <= lowR; k++){ if (!isZ(bn[k])) s += ln(xW, Y(k), (xW + xR) / 2 - 22, Y(k), false) + gainTri((xW + xR) / 2, Y(k), 1, fmt(bn[k])) + ln((xW + xR) / 2 + 20, Y(k), xR - (k === lowR ? 0 : 13), Y(k), k !== lowR); if (k < lowR) s += adder(xR, Y(k), 12); }
  if (lowR) for (let k = lowR; k >= 1; k--){ const top = k === 1 ? y0 + 15 : Y(k - 1) + 12; s += ln(xR, Y(k) - (k === lowR ? 0 : 12), xR, top); }
  return s + '</svg>';
}
function df1Svg(an, bn){
  const N = an.length - 1, M = bn.length - 1, K = Math.max(N, M, 0);
  const xX = 120, xC = 380, xY = 640, y0 = 60, dy = 92, W = 820, H = y0 + K * dy + 50, Y = k => y0 + k * dy;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sơ đồ trực tiếp 1">${arrowDef}`;
  s += svgT(18, y0 - 12, 'x(n)', {a: 'start', mono: true, w: 700}) + ln(20, y0, xX - 4, y0, false) + dotP(xX, y0);
  for (let k = 1; k <= M; k++){ const ym = (Y(k - 1) + Y(k)) / 2; s += ln(xX, Y(k - 1) + 4, xX, ym - 16) + delayBox(xX, ym) + ln(xX, ym + 15, xX, Y(k), false) + dotP(xX, Y(k)) + svgT(xX - 10, Y(k) + 18, `x(n−${k})`, {a: 'end', mono: true, s: 12, c: '#64748B'}); }
  let lowB = 0; for (let k = 0; k <= M; k++) if (!isZ(bn[k])) lowB = k;
  let lowA = 0; for (let k = 1; k <= N; k++) if (!isZ(an[k])) lowA = k;
  const low = Math.max(lowB, lowA);
  for (let k = 0; k <= M; k++){ if (isZ(bn[k])) continue; const gx = (xX + xC) / 2; s += ln(xX, Y(k), gx - 22, Y(k), false) + gainTri(gx, Y(k), 1, fmt(bn[k])) + ln(gx + 20, Y(k), xC - (k === 0 ? 16 : (k === low ? 0 : 13)), Y(k), k !== low || k === 0); }
  for (let k = 1; k <= N; k++){ if (isZ(an[k])) continue; const gx = (xC + xY) / 2; s += ln(xY, Y(k), gx + 22, Y(k), false) + gainTri(gx, Y(k), -1, fmt(-an[k])) + ln(gx - 20, Y(k), xC + (k === low ? 0 : 13), Y(k), k !== low); }
  s += adder(xC, y0); for (let k = 1; k < low; k++) s += adder(xC, Y(k), 12);
  for (let k = low; k >= 1; k--){ const top = k === 1 ? y0 + 15 : Y(k - 1) + 12; s += ln(xC, Y(k) - (k === low ? 0 : 12), xC, top); }
  s += ln(xC + 15, y0, xY - 5, y0) + dotP(xY, y0) + ln(xY, y0, W - 70, y0) + svgT(W - 60, y0 + 5, 'y(n)', {a: 'start', mono: true, w: 700});
  for (let k = 1; k <= N; k++){ const ym = (Y(k - 1) + Y(k)) / 2; s += ln(xY, Y(k - 1) + 4, xY, ym - 16) + delayBox(xY, ym) + ln(xY, ym + 15, xY, Y(k), false) + dotP(xY, Y(k)) + svgT(xY + 10, Y(k) + 18, `y(n−${k})`, {a: 'start', mono: true, s: 12, c: '#64748B'}); }
  return s + '</svg>';
}
// FIR dạng thông thường (ngang) và dạng pha tuyến tính (gấp đôi đối xứng)
function firSvg(h, linear){
  const N = h.length, dx = 120, x0 = 90, yT = 50, yG = 130, yS = 215;
  if (!linear){
    const W = x0 + (N - 1) * dx + 140, H = 260;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bộ lọc FIR dạng thông thường">${arrowDef}` + svgT(14, yT - 12, 'x(n)', {a: 'start', mono: true, w: 700}) + ln(14, yT, x0 - 4, yT, false);
    for (let k = 0; k < N; k++){
      const x = x0 + k * dx; s += dotP(x, yT);
      if (k < N - 1) s += ln(x, yT, x + dx / 2 - 28, yT) + delayBox(x + dx / 2, yT) + ln(x + dx / 2 + 26, yT, x + dx - 4, yT, false);
      s += ln(x, yT, x, yG - 22) + gainTri(x, yG, 0, fmt(h[k], 4)) + ln(x, yG + 20, x, yS - (k === 0 ? 4 : 16), k !== 0);
      if (k === 0) s += dotP(x, yS); else s += adder(x, yS);
      if (k > 0) s += ln(x - dx + (k === 1 ? 4 : 15), yS, x - 15, yS);
    }
    const xe = x0 + (N - 1) * dx; s += ln(xe + 15, yS, xe + 80, yS) + svgT(xe + 86, yS + 5, 'y(n)', {a: 'start', mono: true, w: 700});
    return s + '</svg>';
  }
  // dạng pha tuyến tính: hàng trên x(n)…, hàng dưới quay ngược x(n−N+1)…; cộng từng cặp đối xứng rồi mới nhân
  const P = Math.floor(N / 2), odd = N % 2 === 1, cols = P + (odd ? 1 : 0), yB = 150, yA = 100, yG2 = 225, yS2 = 305, off = 22;
  const W = x0 + (cols - 1) * dx + 170, H = 350;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bộ lọc FIR dạng pha tuyến tính">${arrowDef}` + svgT(14, yT - 12, 'x(n)', {a: 'start', mono: true, w: 700}) + ln(14, yT, x0 - 4, yT, false);
  const tap = k => (odd && k === cols - 1) ? x0 + k * dx : x0 + k * dx - off; // điểm rẽ của hàng dưới
  for (let k = 0; k < cols; k++){ const x = x0 + k * dx; s += dotP(x, yT); if (k < cols - 1) s += ln(x, yT, x + dx / 2 - 28, yT) + delayBox(x + dx / 2, yT) + ln(x + dx / 2 + 26, yT, x + dx - 4, yT, false); }
  const xl = x0 + (cols - 1) * dx;
  if (odd) s += ln(xl, yT, xl, yB - 4, false);
  else s += ln(xl, yT, xl + 50, yT, false) + ln(xl + 50, yT, xl + 50, (yT + yB) / 2 - 16) + delayBox(xl + 50, (yT + yB) / 2) + ln(xl + 50, (yT + yB) / 2 + 15, xl + 50, yB, false) + ln(xl + 50, yB, tap(cols - 1) + 4, yB);
  for (let k = cols - 1; k >= 0; k--){
    s += dotP(tap(k), yB);
    if (k > 0){ const a = tap(k), b = tap(k - 1), m = (a + b) / 2; s += ln(a, yB, m + 28, yB) + delayBox(m, yB) + ln(m - 26, yB, b + 4, yB, false); }
  }
  const hop = (x, y) => `<path d="M${x} ${y - 7}A7 7 0 0 1 ${x} ${y + 7}" fill="none" stroke="#334155" stroke-width="1.6"/>`;
  for (let k = 0; k < cols; k++){
    const x = x0 + k * dx, center = odd && k === cols - 1;
    if (center) s += ln(x, yB, x, yG2 - 22);
    else {
      s += adder(x, yA, 12) + ln(x, yT, x, yA - 13) + ln(tap(k), yB, tap(k), yA, false) + ln(tap(k), yA, x - 13, yA);
      s += `<line x1="${x}" y1="${yA + 12}" x2="${x}" y2="${yB - 7}" stroke="#334155" stroke-width="1.6"/>` + hop(x, yB) + ln(x, yB + 7, x, yG2 - 22);
    }
    s += gainTri(x, yG2, 0, fmt(h[k], 4)) + ln(x, yG2 + 20, x, yS2 - (k === 0 ? 4 : 16), k !== 0);
    if (k === 0) s += dotP(x, yS2); else s += adder(x, yS2);
    if (k > 0) s += ln(x - dx + (k === 1 ? 4 : 15), yS2, x - 15, yS2);
  }
  s += ln(xl + 15, yS2, xl + 80, yS2) + svgT(xl + 86, yS2 + 5, 'y(n)', {a: 'start', mono: true, w: 700});
  return s + '</svg>';
}
// chuỗi khối nối tiếp / song song
function chainSvg(labels, mode){
  const n = labels.length, bw = 190, bh = 50;
  if (mode === 'cascade'){
    const W = 90 + n * (bw + 50) + 80, H = 110, y = 55; let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Dạng nối tiếp">${arrowDef}` + svgT(10, y - 12, 'x(n)', {a: 'start', mono: true, w: 700});
    let x = 60; s += ln(10, y, x, y);
    labels.forEach((t, i) => { s += `<rect x="${x}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="9" fill="#EEF2F8" stroke="#142B4A" stroke-width="1.6"/>` + svgT(x + bw / 2, y + 5, t, {mono: true, s: 13, w: 700, c: '#142B4A'}); x += bw; s += ln(x, y, x + 50, y); x += 50; });
    return s + svgT(x + 6, y + 5, 'y(n)', {a: 'start', mono: true, w: 700}) + '</svg>';
  }
  const W = 560, rowH = 70, H = 30 + n * rowH, xs = 60, xb = 150, xa = 470;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Dạng song song">${arrowDef}` + svgT(6, 30 + rowH / 2 - 14, 'x(n)', {a: 'start', mono: true, w: 700});
  const yc = i => 30 + i * rowH + rowH / 2 - 10, ymid = (yc(0) + yc(n - 1)) / 2;
  s += ln(6, yc(0), xs, yc(0), false) + ln(xs, yc(0), xs, yc(n - 1), false);
  labels.forEach((t, i) => { const y = yc(i); s += dotP(xs, y) + ln(xs, y, xb, y) + `<rect x="${xb}" y="${y - bh / 2 + 4}" width="${bw + 40}" height="${bh - 8}" rx="9" fill="#EEF2F8" stroke="#142B4A" stroke-width="1.6"/>` + svgT(xb + (bw + 40) / 2, y + 5, t, {mono: true, s: 13, w: 700, c: '#142B4A'}) + ln(xb + bw + 40, y, xa - 14, ymid + (y - ymid) * 0.25); });
  return s + adder(xa, ymid) + ln(xa + 15, ymid, W - 60, ymid) + svgT(W - 54, ymid + 5, 'y(n)', {a: 'start', mono: true, w: 700}) + '</svg>';
}

/* ---------- Chuỗi hiển thị ---------- */
const mvec = v => '[' + v.map(x => +(+x).toFixed(6)).join(' ') + ']';
function eqSide(c, v){ let s = ''; c.forEach((a, k) => { if (isZ(a)) return; const A = Math.abs(a); const co = Math.abs(A - 1) < 1e-12 ? '' : fmt(A); const t = `${co}${v}(n${k ? '−' + k : ''})`; s += (s ? (a < 0 ? ' − ' : ' + ') : (a < 0 ? '−' : '')) + t; }); return s || '0'; }
function readNums(id){ const v = parseList($(id).value); return v && v.length ? v : null; }
function setPressed(sel, attr, val){ document.querySelectorAll(sel).forEach(c => c.setAttribute('aria-pressed', c.dataset[attr] === String(val))); }

/* ---------- Khung điều hướng tab, bài tập, sao chép ---------- */
const Lab = {
  current: null, RENDER: {},
  init(RENDER, key, first){
    Lab.RENDER = RENDER;
    const show = t => {
      Lab.current = t;
      document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
      document.querySelectorAll('.tabpanel').forEach(p => { const on = p.id === 'p-' + t; p.hidden = !on; if (on){ p.classList.remove('reveal'); void p.offsetWidth; p.classList.add('reveal'); } });
      try { localStorage.setItem(key, t); } catch (e) {}
      const tb = $('tb-' + t); if (tb && tb.scrollIntoView) tb.scrollIntoView({block: 'nearest', inline: 'nearest'});
      RENDER[t]();
    };
    Lab.show = show;
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));
    const tg = $('toggleCtl');
    if (tg) tg.addEventListener('click', () => { const h = document.body.classList.toggle('hide-controls'); $('toggleTxt').textContent = h ? 'Hiện bảng điều khiển' : 'Ẩn bảng điều khiển'; tg.setAttribute('aria-pressed', h); RENDER[Lab.current](); });
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => RENDER[Lab.current](), 150); });
    let start = first; try { const s = localStorage.getItem(key); if (s && RENDER[s]) start = s; } catch (e) {}
    const hs = (location.hash || '').slice(1); if (RENDER[hs]) start = hs;
    addEventListener('hashchange', () => { const h = (location.hash || '').slice(1); if (RENDER[h]) show(h); });
    show(start);
  },
  exercises(EX, names, loadFn){
    let filter = 'all';
    const render = () => {
      const cls = $('ex-class').checked; let h = '';
      Object.keys(names).forEach(g => {
        if (filter !== 'all' && filter !== g) return;
        h += `<div class="card ex-group"><h2>${names[g]}</h2>`;
        EX.filter(e => e.g === g).forEach(e => {
          h += `<div class="ex"><div class="hd"><div><span class="id">${e.id}</span><b>${e.t}</b></div></div><div class="q">${e.q}</div>`;
          h += `<div class="sol">${e.s.map((st, i) => `<div ${cls ? 'hidden' : ''}><b>Bước ${i + 1}.</b> ${st}</div>`).join('')}<div ${cls ? 'hidden' : ''}><b>Đáp án:</b> ${e.a}</div>${e.m ? `<div class="mean" ${cls ? 'hidden' : ''}><b>Ý nghĩa:</b> ${e.m}</div>` : ''}</div>`;
          h += `<div class="acts">${cls ? '<button class="btn ghost" data-next="1">Hiện bước tiếp</button><button class="btn ghost" data-all="1">Hiện hết</button>' : ''}${e.load ? `<button class="btn" data-load="${e.id}">Mở trong phòng thí nghiệm</button>` : ''}</div></div>`;
        });
        h += '</div>';
      });
      $('ex-list').innerHTML = h;
    };
    $('ex-class').addEventListener('change', render);
    $('ex-filter').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; filter = b.dataset.g; setPressed('#ex-filter .chip', 'g', filter); render(); });
    $('ex-list').addEventListener('click', e => {
      const n = e.target.closest('[data-next]'), a = e.target.closest('[data-all]'), l = e.target.closest('[data-load]');
      if (n){ const hid = [...n.closest('.ex').querySelectorAll('.sol>[hidden]')]; if (hid.length) hid[0].hidden = false; }
      if (a) a.closest('.ex').querySelectorAll('.sol>[hidden]').forEach(x => x.hidden = false);
      if (l){ const ex = EX.find(o => o.id === l.dataset.load); if (ex){ loadFn(ex.load); window.scrollTo({top: 0}); } }
    });
    return render;
  },
  copy(btnId, srcId){
    const b = $(btnId); if (!b) return;
    b.addEventListener('click', () => {
      const t = $(srcId).textContent, done = () => { b.textContent = 'Đã sao chép'; setTimeout(() => b.textContent = 'Sao chép', 1600); };
      try { navigator.clipboard.writeText(t).then(done, () => { const r = document.createRange(); r.selectNodeContents($(srcId)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }); } catch (e) {}
    });
  }
};
