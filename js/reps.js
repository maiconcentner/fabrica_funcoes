/* Tabela, diagrama de flechas e gráfico: três jeitos de ver a mesma produção. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);
  const r1 = (v) => Math.round(v * 10) / 10;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function same(a, b) { return Math.abs(a - b) < 1e-9; }
  function uniq(list) { return list.filter((v, i) => list.findIndex((w) => same(v, w)) === i); }
  const setTxt = (vals) => '{' + vals.map((v) => FF.fmt(v)).join('; ') + '}';

  /* ---------- Tabela ---------- */
  function table() {
    const L = FF.law();
    const c = FF.ctx();
    const recs = FF.prod.records;
    const livre = c.id === 'livre';
    const hin = livre ? '<i>' + L.vin + '</i>' : '<i>' + L.vin + '</i><small>' + esc(c.inName) + (c.inUnit ? ' (' + esc(c.inUnit) + ')' : '') + '</small>';
    const hout = livre ? '<i>f</i>(<i>' + L.vin + '</i>)' : '<i>' + esc(c.vout) + '</i><small>' + esc(c.outName) + (c.outUnit ? ' (' + esc(c.outUnit) + ')' : '') + '</small>';
    const showCalc = FF.state.calc && !FF.state.black;
    let h = '<table class="ftable"><thead><tr><th>' + hin + '</th>' + (showCalc ? '<th>cálculo</th>' : '') + '<th>' + hout + '</th></tr></thead><tbody>';
    if (!recs.length) {
      h += '<tr><td colspan="' + (showCalc ? 3 : 2) + '" class="empty">Os pares aparecem aqui quando os produtos saem da fábrica.</td></tr>';
    }
    recs.forEach((r, i) => {
      const last = i === recs.length - 1;
      h += '<tr' + (last ? ' class="last"' : '') + '><td>' + FF.fmt(r.x) + '</td>' +
        (showCalc ? '<td class="calc">' + (r.calc ? FF.math.inline(r.calc, 17, L.vin) : '') + '</td>' : '') +
        '<td class="out">' + (X.isApprox(r.y) ? '≈ ' : '') + FF.fmtOutNum(r.y) + '</td></tr>';
    });
    h += '</tbody></table>';
    $('rep-table').innerHTML = h;
  }

  /* ---------- Diagrama de flechas ---------- */
  function diagram() {
    const L = FF.law();
    const recs = FF.prod.records;
    const W = 440, H = 300;
    let A = L.dom.type === 'set' ? L.dom.vals.slice() : uniq(recs.map((r) => r.x)).sort((a, b) => a - b);
    let B = L.cd.type === 'set' ? L.cd.vals.slice() : uniq(recs.map((r) => r.y)).sort((a, b) => a - b);
    const moreA = A.length > 8, moreB = B.length > 8;
    if (moreA) A = A.slice(-8);
    if (moreB) B = B.slice(-8);
    const ax = 120, bx = 320, cy = 150, rx = 66;
    const ry = Math.max(70, Math.min(122, 22 * Math.max(A.length, B.length) + 26));
    const pos = (list, i) => cy - ((list.length - 1) * Math.min(26, (ry * 1.6) / Math.max(1, list.length))) / 2 + i * Math.min(26, (ry * 1.6) / Math.max(1, list.length));
    let s = '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" class="arrowhead"/></marker></defs>';
    s += '<ellipse class="oval" cx="' + ax + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/>';
    s += '<ellipse class="oval" cx="' + bx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/>';
    s += '<circle class="setname-c" cx="' + ax + '" cy="' + (cy - ry - 2) + '" r="14"/><text class="setname" x="' + ax + '" y="' + (cy - ry + 4) + '" text-anchor="middle">A</text>';
    s += '<circle class="setname-c" cx="' + bx + '" cy="' + (cy - ry - 2) + '" r="14"/><text class="setname" x="' + bx + '" y="' + (cy - ry + 4) + '" text-anchor="middle">B</text>';
    const im = uniq(recs.map((r) => r.y));
    recs.forEach((r) => {
      const i = A.findIndex((v) => same(v, r.x)), j = B.findIndex((v) => same(v, r.y));
      if (i < 0 || j < 0) return;
      const y1 = pos(A, i), y2 = pos(B, j);
      const x1 = ax + 22, x2 = bx - 24;
      const mx = (x1 + x2) / 2;
      s += '<path class="farrow' + (r === recs[recs.length - 1] ? ' last' : '') + '" d="M' + x1 + ' ' + r1(y1) + ' C' + mx + ' ' + r1(y1) + ' ' + mx + ' ' + r1(y2) + ' ' + x2 + ' ' + r1(y2) + '" marker-end="url(#arr)"/>';
    });
    A.forEach((v, i) => {
      const y = pos(A, i);
      const done = recs.some((r) => same(r.x, v));
      s += '<circle class="pt-a' + (done ? '' : ' idle') + '" cx="' + (ax + 16) + '" cy="' + r1(y) + '" r="3.2"/>' +
        '<text class="el' + (done ? '' : ' idle') + '" x="' + (ax + 8) + '" y="' + r1(y + 5) + '" text-anchor="end">' + FF.fmt(v) + '</text>';
    });
    B.forEach((v, j) => {
      const y = pos(B, j);
      const hit = im.some((w) => same(w, v));
      s += '<circle class="pt-b' + (hit ? ' hit' : ' idle') + '" cx="' + (bx - 18) + '" cy="' + r1(y) + '" r="3.2"/>' +
        '<text class="el' + (hit ? ' hit' : ' idle') + '" x="' + (bx - 10) + '" y="' + r1(y + 5) + '">' + FF.fmtOutNum(v) + '</text>';
    });
    if (moreA) s += '<text class="el idle" x="' + ax + '" y="' + (cy + ry - 8) + '" text-anchor="middle">…</text>';
    if (moreB) s += '<text class="el idle" x="' + bx + '" y="' + (cy + ry - 8) + '" text-anchor="middle">…</text>';
    if (!recs.length && L.dom.type !== 'set') {
      s += '<text class="el idle" x="' + (W / 2) + '" y="' + (cy + ry + 30) + '" text-anchor="middle">as flechas aparecem com a produção</text>';
    }
    $('rep-diagram-svg').innerHTML = s;

    // Conjuntos
    const allDone = L.dom.type === 'set' && L.dom.vals.every((v) => recs.some((r) => same(r.x, v)));
    const vin = L.vin;
    let h = '<div><b>D</b> = ' + (L.dom.type === 'set' ? setTxt(L.dom.vals) : X.setLabel(L.dom, vin) === 'ℝ' ? 'ℝ' : '{<i>' + vin + '</i> ∈ ℝ | ' + X.setLabel(L.dom, vin) + '}') + '</div>';
    h += '<div><b>CD</b> = ' + (L.cd.type === 'set' ? setTxt(L.cd.vals) : X.setLabel(L.cd, 'y')) + '</div>';
    const imSorted = im.slice().sort((a, b) => a - b);
    h += '<div><b>Im</b> ' + (allDone ? '= ' : '<span class="muted">(até agora)</span> ⊇ ') + (imSorted.length ? '{' + imSorted.map((v) => FF.fmtOutNum(v)).join('; ') + '}' : '{ }') + '</div>';
    if (allDone && L.cd.type === 'set') h += '<div class="muted">Im ⊂ CD: ' + (im.length < L.cd.vals.length ? 'sobram elementos de B sem flecha, e tudo bem.' : 'todos os elementos de B foram usados.') + '</div>';
    $('rep-sets').innerHTML = h;
    void W; void H;
  }

  /* ---------- Gráfico ---------- */
  function niceStep(span, n) {
    const raw = span / n;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }
  function graph() {
    const L = FF.law();
    const recs = FF.prod.records;
    const W = 440, H = 300, ml = 46, mr = 16, mt = 14, mb = 34;
    const xs = recs.map((r) => r.x).concat(FF.inputList());
    let ys = recs.map((r) => r.y);
    if (L.kind !== 'error') {
      FF.inputList().forEach((x) => {
        if (!X.inSet(L.dom, x)) return;
        const r = FF.evalLaw(x, L);
        if (!r.error) ys.push(r.y);
      });
    }
    let x0 = Math.min.apply(null, xs.concat([0])), x1 = Math.max.apply(null, xs.concat([0]));
    let y0 = Math.min.apply(null, ys.concat([0])), y1 = Math.max.apply(null, ys.concat([0]));
    if (!isFinite(x0) || x1 - x0 < 1e-9) { x0 = -5; x1 = 5; }
    if (!isFinite(y0) || y1 - y0 < 1e-9) { y0 = Math.min(y0 || 0, -5); y1 = Math.max(y1 || 0, 5); }
    const padX = (x1 - x0) * 0.1, padY = (y1 - y0) * 0.1;
    x0 -= padX; x1 += padX; y0 -= padY; y1 += padY * 1.6;
    const sx = (x) => ml + ((x - x0) / (x1 - x0)) * (W - ml - mr);
    const sy = (y) => H - mb - ((y - y0) / (y1 - y0)) * (H - mt - mb);
    let s = '<rect class="plot-bg" x="' + ml + '" y="' + mt + '" width="' + (W - ml - mr) + '" height="' + (H - mt - mb) + '"/>';
    const stx = niceStep(x1 - x0, 7), sty = niceStep(y1 - y0, 6);
    for (let v = Math.ceil(x0 / stx) * stx; v <= x1; v += stx) {
      const X0 = r1(sx(v));
      s += '<line class="gridl" x1="' + X0 + '" y1="' + mt + '" x2="' + X0 + '" y2="' + (H - mb) + '"/>' +
        '<text class="tick" x="' + X0 + '" y="' + (H - mb + 16) + '" text-anchor="middle">' + FF.fmt(X.tidy(v), 3) + '</text>';
    }
    for (let v = Math.ceil(y0 / sty) * sty; v <= y1; v += sty) {
      const Y0 = r1(sy(v));
      s += '<line class="gridl" x1="' + ml + '" y1="' + Y0 + '" x2="' + (W - mr) + '" y2="' + Y0 + '"/>' +
        '<text class="tick" x="' + (ml - 5) + '" y="' + (Y0 + 4) + '" text-anchor="end">' + FF.fmt(X.tidy(v), 3) + '</text>';
    }
    if (y0 < 0 && y1 > 0) s += '<line class="axis" x1="' + ml + '" y1="' + r1(sy(0)) + '" x2="' + (W - mr) + '" y2="' + r1(sy(0)) + '"/>';
    if (x0 < 0 && x1 > 0) s += '<line class="axis" x1="' + r1(sx(0)) + '" y1="' + mt + '" x2="' + r1(sx(0)) + '" y2="' + (H - mb) + '"/>';
    const c = FF.ctx();
    s += '<text class="axname" x="' + (W - mr) + '" y="' + (H - 4) + '" text-anchor="end">' + esc(L.vin) + '</text>';
    s += '<text class="axname" x="6" y="' + (mt + 4) + '">' + esc(c.id === 'livre' ? 'f(x)' : c.vout) + '</text>';

    // Curva
    if (FF.state.curve && L.kind !== 'error' && !FF.state.black && L.dom.type !== 'set' && !L.dom.integer) {
      let d = '';
      let pen = false;
      let prevY = null;
      const N = 360;
      for (let k = 0; k <= N; k++) {
        const x = x0 + ((x1 - x0) * k) / N;
        const r = X.inSet(L.dom, x) ? FF.evalLaw(x, L) : { error: true };
        if (r.error || !isFinite(r.y) || Math.abs(sy(r.y)) > 4000 || (prevY != null && Math.abs(sy(r.y) - sy(prevY)) > H * 1.5)) {
          pen = false; prevY = null; continue;
        }
        d += (pen ? ' L' : ' M') + r1(sx(x)) + ' ' + r1(sy(r.y));
        pen = true; prevY = r.y;
      }
      s += '<clipPath id="plotclip"><rect x="' + ml + '" y="' + mt + '" width="' + (W - ml - mr) + '" height="' + (H - mt - mb) + '"/></clipPath>';
      s += '<path class="curve" clip-path="url(#plotclip)" d="' + d + '"/>';
    }
    // Pontos
    recs.forEach((r, i) => {
      const last = i === recs.length - 1;
      const X0 = r1(sx(r.x)), Y0 = r1(sy(r.y));
      if (last) {
        const bx = x0 < 0 && x1 > 0 ? sx(0) : ml;
        const by = y0 < 0 && y1 > 0 ? sy(0) : H - mb;
        s += '<path class="guide" d="M' + X0 + ' ' + r1(by) + ' V' + Y0 + ' M' + r1(bx) + ' ' + Y0 + ' H' + X0 + '"/>';
      }
      s += '<circle class="gpt' + (last ? ' last' : '') + '" cx="' + X0 + '" cy="' + Y0 + '" r="' + (last ? 6 : 5) + '"/>';
      if (recs.length <= 6 || last) {
        const label = '(' + FF.fmt(r.x) + '; ' + FF.fmt(r.y) + ')';
        const right = X0 < W - 120;
        s += '<text class="plabel" x="' + (right ? X0 + 9 : X0 - 9) + '" y="' + (Y0 - 9) + '" text-anchor="' + (right ? 'start' : 'end') + '">' + label + '</text>';
      }
    });
    $('rep-graph-svg').innerHTML = s;
  }

  /* ---------- Painéis ---------- */
  function render() {
    const S = FF.state;
    $('rep-table-p').hidden = !S.table;
    $('rep-diagram-p').hidden = !S.diagram;
    $('rep-graph-p').hidden = !S.graph;
    $('reps').hidden = !(S.table || S.diagram || S.graph);
    if (S.table) table();
    if (S.diagram) diagram();
    if (S.graph) graph();
  }

  function init() {
    document.querySelectorAll('[data-max]').forEach((b) => b.addEventListener('click', () => {
      const p = b.closest('.rep');
      const on = !p.classList.contains('max');
      document.querySelectorAll('.rep.max').forEach((o) => o.classList.remove('max'));
      p.classList.toggle('max', on);
      $('rep-scrim').hidden = !on;
      b.setAttribute('aria-pressed', on);
    }));
    $('rep-scrim').addEventListener('click', FF.reps.unmax);
    render();
  }
  FF.reps = {
    init, render,
    unmax() {
      document.querySelectorAll('.rep.max').forEach((o) => o.classList.remove('max'));
      document.querySelectorAll('[data-max]').forEach((b) => b.setAttribute('aria-pressed', false));
      $('rep-scrim').hidden = true;
    },
  };
})();
