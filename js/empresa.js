/* Minha empresa (O que sei agora): custos, mão de obra, faturamento, lucro e crescimento. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);
  const r1 = (v) => Math.round(v * 10) / 10;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const n = (v) => X.fmtNum(v, 2);
  const money = (v) => (v < 0 ? '−' : '') + 'R$ ' + Math.abs(Math.round(v * 100) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  /* Modelos sugeridos pelo livro: doces caseiros, camisetas, artesanato. */
  const MODELS = {
    doces: { name: 'Doces da Turma', icon: '🍫', unit: 'doces', fixo: 250, custo: 1.2, salario: 400, comissao: 0.3, preco: 3.5, v0: 300, cresc: 40 },
    camisetas: { name: 'Camisetas Criativas', icon: '👕', unit: 'camisetas', fixo: 600, custo: 18, salario: 1200, comissao: 2, preco: 45, v0: 60, cresc: 8 },
    artesanato: { name: 'Arte na Mão', icon: '🧶', unit: 'peças', fixo: 150, custo: 12, salario: 500, comissao: 3, preco: 40, v0: 25, cresc: 5 },
  };
  const FIELDS = [
    ['fixo', 'Custos fixos por mês (aluguel, gás, embalagens)', 'R$'],
    ['custo', 'Custo de material por unidade', 'R$'],
    ['salario', 'Mão de obra: salário fixo', 'R$'],
    ['comissao', 'Mão de obra: comissão por unidade vendida', 'R$'],
    ['preco', 'Preço de venda por unidade', 'R$'],
    ['v0', 'Vendas no 1º mês', 'unid.'],
    ['cresc', 'Crescimento das vendas por mês', 'unid.'],
  ];

  function data() {
    let d = null;
    try { d = JSON.parse(FF.state.emp || 'null'); } catch (e) { d = null; }
    return Object.assign({}, MODELS.doces, { model: 'doces', q: 200, mode: 'qtd', meta: 500 }, d || {});
  }
  function save(patch) { FF.set({ emp: JSON.stringify(Object.assign(data(), patch)) }); render(); }

  /* Funções da empresa (x = unidades vendidas no mês; t = meses) */
  function fns(d) {
    const C = (x) => d.fixo + d.custo * x;
    const M = (x) => d.salario + d.comissao * x;
    const F = (x) => d.preco * x;
    const L = (x) => F(x) - C(x) - M(x);
    const V = (t) => d.v0 + d.cresc * t;
    const margem = X.tidy(d.preco - d.custo - d.comissao);
    const fixos = X.tidy(d.fixo + d.salario);
    return { C, M, F, L, V, margem, fixos, eq: margem > 0 ? fixos / margem : null };
  }
  const lin = (a, b, v) => { // a + b·v, escrita com cuidado
    const bs = b === 1 ? '' : X.fmtNum(Math.abs(b), 4);
    if (!a) return (b < 0 ? '−' : '') + bs + v;
    if (a < 0 && b > 0) return bs + v + ' − ' + X.fmtNum(-a, 4);
    return X.fmtNum(a, 4) + (b < 0 ? ' − ' : ' + ') + bs + v;
  };
  function laws(d) {
    const f = fns(d);
    return [
      { id: 'C', name: 'Custo de produção', src: lin(d.fixo, d.custo, 'x'), note: 'custos fixos + material de cada unidade' },
      { id: 'M', name: 'Mão de obra', src: lin(d.salario, d.comissao, 'x'), note: 'salário fixo + comissão por venda (como na Atividade 8)' },
      { id: 'F', name: 'Faturamento', src: lin(0, d.preco, 'x'), note: 'preço × unidades vendidas' },
      { id: 'L', name: 'Lucro', src: lin(-f.fixos, f.margem, 'x'), note: 'L = F − C − M: cada unidade deixa ' + money(f.margem) + ', e os fixos somam ' + money(f.fixos) },
      { id: 'V', name: 'Crescimento das vendas', src: lin(d.v0, d.cresc, 't'), note: 'unidades vendidas no mês t (t = 0 é o primeiro mês)', v: 't' },
    ];
  }

  /* ---------- Gráfico ---------- */
  const W = 1000, H = 470, ml = 84, mr = 30, mt = 24, mb = 50;
  function nice(span, k) {
    const raw = span / k, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }
  function draw() {
    const d = data(), f = fns(d);
    const months = d.mode === 'mes';
    const x1 = months ? 12 : Math.max(50, Math.ceil(((f.eq || d.q) * 2) / 10) * 10, Math.ceil(d.q * 1.2 / 10) * 10);
    const X0 = 0;
    const cost = (x) => f.C(x) + f.M(x);
    const xOf = (u) => (months ? f.V(u) : u); // unidades vendidas
    let y1 = 0, y0 = 0;
    for (let i = 0; i <= 40; i++) {
      const u = X0 + ((x1 - X0) * i) / 40, x = xOf(u);
      y1 = Math.max(y1, f.F(x), cost(x), f.L(x));
      y0 = Math.min(y0, f.L(x));
    }
    y1 *= 1.08; y0 = y0 < 0 ? y0 * 1.1 : 0;
    const sx = (u) => ml + ((u - X0) / (x1 - X0)) * (W - ml - mr);
    const sy = (y) => H - mb - ((y - y0) / (y1 - y0 || 1)) * (H - mt - mb);
    let s = '<rect class="plot-bg" x="' + ml + '" y="' + mt + '" width="' + (W - ml - mr) + '" height="' + (H - mt - mb) + '"/>';
    const stx = months ? 1 : nice(x1, 8), sty = nice(y1 - y0, 6);
    for (let v = 0; v <= x1 + 1e-9; v += stx) s += '<line class="gridl" x1="' + r1(sx(v)) + '" y1="' + mt + '" x2="' + r1(sx(v)) + '" y2="' + (H - mb) + '"/><text class="tick" x="' + r1(sx(v)) + '" y="' + (H - mb + 18) + '" text-anchor="middle">' + X.fmtNum(v, 0) + '</text>';
    for (let v = Math.ceil(y0 / sty) * sty; v <= y1; v += sty) s += '<line class="gridl" x1="' + ml + '" y1="' + r1(sy(v)) + '" x2="' + (W - mr) + '" y2="' + r1(sy(v)) + '"/><text class="tick" x="' + (ml - 8) + '" y="' + r1(sy(v) + 4) + '" text-anchor="end">' + X.fmtNum(v, 0) + '</text>';
    s += '<line class="axis" x1="' + ml + '" y1="' + r1(sy(0)) + '" x2="' + (W - mr) + '" y2="' + r1(sy(0)) + '"/>';
    s += '<text class="axname" x="' + (W - mr) + '" y="' + (H - 8) + '" text-anchor="end">' + (months ? 't (meses)' : 'x (' + esc(d.unit) + ' por mês)') + '</text>';
    s += '<text class="axname" x="12" y="' + (mt + 4) + '">R$</text>';
    // Lucro e prejuízo (área entre faturamento e custo total)
    const N = 120;
    let up = '', dn = '';
    const pts = (fn) => Array.from({ length: N + 1 }, (_, i) => { const u = X0 + ((x1 - X0) * i) / N; return [sx(u), sy(fn(xOf(u)))]; });
    const PF = pts(f.F), PC = pts(cost);
    for (let i = 0; i < N; i++) {
      const cls = f.F(xOf(X0 + ((x1 - X0) * (i + 0.5)) / N)) >= cost(xOf(X0 + ((x1 - X0) * (i + 0.5)) / N)) ? 'up' : 'dn';
      const poly = '<polygon class="area ' + cls + '" points="' + [PF[i], PF[i + 1], PC[i + 1], PC[i]].map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ') + '"/>';
      if (cls === 'up') up += poly; else dn += poly;
    }
    s += up + dn;
    const path = (P) => 'M' + P.map((p) => r1(p[0]) + ' ' + r1(p[1])).join(' L');
    if (d.parts) {
      s += '<path class="eline part c" d="' + path(pts(f.C)) + '"/><path class="eline part m" d="' + path(pts(f.M)) + '"/>';
    }
    s += '<path class="eline cost" d="' + path(PC) + '"/><path class="eline fat" d="' + path(PF) + '"/><path class="eline lucro" d="' + path(pts(f.L)) + '"/>';
    // Rótulos no fim das linhas
    const lab = (P, txt, cls) => '<text class="elab ' + cls + '" x="' + r1(P[N][0] - 6) + '" y="' + r1(P[N][1] - 8) + '" text-anchor="end">' + txt + '</text>';
    s += lab(PF, 'faturamento', 'fat') + lab(PC, 'custo total', 'cost') + lab(pts(f.L), 'lucro', 'lucro');
    // Ponto de equilíbrio
    if (f.eq != null) {
      const ue = months ? (f.eq - d.v0) / d.cresc : f.eq;
      if (ue >= X0 && ue <= x1 && isFinite(ue)) {
        const ex = sx(ue), ey = sy(f.F(f.eq));
        s += '<line class="eqline" x1="' + r1(ex) + '" y1="' + r1(ey) + '" x2="' + r1(ex) + '" y2="' + (H - mb) + '"/>' +
          '<circle class="eqpt" cx="' + r1(ex) + '" cy="' + r1(ey) + '" r="8"/>' +
          '<text class="eqtxt" x="' + r1(ex + 12) + '" y="' + r1(ey + 24) + '">empata: ' + (months ? 'mês ' + n(ue) : n(f.eq) + ' ' + esc(d.unit)) + '</text>';
      }
    }
    // Marcador da quantidade escolhida
    const uq = months ? d.t || 0 : d.q;
    const xq = xOf(uq);
    const qx = sx(Math.min(x1, uq));
    s += '<line class="qline" x1="' + r1(qx) + '" y1="' + mt + '" x2="' + r1(qx) + '" y2="' + (H - mb) + '"/>';
    [[f.F(xq), 'fat'], [cost(xq), 'cost'], [f.L(xq), 'lucro']].forEach(([y, c]) => { s += '<circle class="qpt ' + c + '" cx="' + r1(qx) + '" cy="' + r1(sy(y)) + '" r="6"/>'; });
    s += '<rect class="qgrip" data-noexport x="' + ml + '" y="' + mt + '" width="' + (W - ml - mr) + '" height="' + (H - mt - mb) + '"/>';
    $('emp-svg').innerHTML = s;
    draw.map = { x1, X0, months };
  }

  /* ---------- Cartões ---------- */
  function render() {
    if (FF.state.view !== 'emp') return;
    const d = data(), f = fns(d);
    const months = d.mode === 'mes';
    document.querySelectorAll('#emp-mode button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.m === d.mode));
    $('emp-parts').setAttribute('aria-pressed', !!d.parts);
    $('emp-title').innerHTML = '<span class="emp-icon">' + esc(d.icon) + '</span> ' + esc(d.name);
    draw();
    // Leitura da quantidade escolhida
    const uq = months ? d.t || 0 : d.q;
    const xq = months ? f.V(uq) : uq;
    const L = f.L(xq);
    $('emp-slider').max = months ? 12 : Math.max(50, Math.round(draw.map.x1));
    $('emp-slider').step = months ? 1 : Math.max(1, Math.round(draw.map.x1 / 200));
    if (document.activeElement !== $('emp-slider')) $('emp-slider').value = uq;
    $('emp-slider-lab').textContent = months ? 'Mês t = ' + uq + ' (vende ' + n(xq) + ' ' + d.unit + ')' : 'Vendendo x = ' + n(xq) + ' ' + d.unit + ' no mês';
    $('emp-read').innerHTML =
      '<div class="kpi fat"><span>Faturamento</span><b>' + money(f.F(xq)) + '</b></div>' +
      '<div class="kpi cost"><span>Custo total</span><b>' + money(f.C(xq) + f.M(xq)) + '</b><small>produção ' + money(f.C(xq)) + ' + mão de obra ' + money(f.M(xq)) + '</small></div>' +
      '<div class="kpi ' + (L >= 0 ? 'up' : 'dn') + '"><span>' + (L >= 0 ? 'Lucro' : 'Prejuízo') + '</span><b>' + money(Math.abs(L)) + '</b></div>';
    // Leis
    $('emp-laws').innerHTML = laws(d).map((l) => {
      const ast = X.parse(l.src, l.v || 'x');
      return '<li class="elaw ' + l.id + '"><div class="elaw-top"><span class="elaw-name">' + esc(l.name) + '</span>' +
        '<button class="btn btn-ghost sm" data-fab="' + l.id + '" title="Abrir esta função na Fábrica">Abrir na Fábrica</button></div>' +
        '<div class="elaw-math">' + FF.math.inline(ast, 24, l.v || 'x', l.id + '(' + (l.v || 'x') + ') = ', 330) + '</div><p class="note">' + esc(l.note) + '</p></li>';
    }).join('');
    // Ponto de equilíbrio e meta
    const eqTxt = f.eq == null
      ? '<p class="err">Cada unidade custa mais do que rende: a empresa nunca lucra. Aumente o preço ou diminua os custos.</p>'
      : '<p>O lucro é zero quando a empresa vende <b>' + n(f.eq) + ' ' + esc(d.unit) + '</b> no mês: é o <b>ponto de equilíbrio</b>. Abaixo disso, prejuízo; acima, lucro.' +
        (d.cresc > 0 ? ' Com o crescimento previsto, isso acontece ' + (f.eq <= d.v0 ? 'já no primeiro mês' : 'no mês t = ' + n(Math.ceil((f.eq - d.v0) / d.cresc))) + '.' : '') + '</p>';
    $('emp-eq').innerHTML = eqTxt;
    if (document.activeElement !== $('emp-meta')) $('emp-meta').value = X.fmtNum(d.meta, 2);
    if (f.margem > 0) {
      const need = X.tidy((d.meta + f.fixos) / f.margem);
      $('emp-meta-res').innerHTML = '<ol class="solve">' +
        '<li>' + FF.math.inline(X.parse(lin(-f.fixos, f.margem, 'x'), 'x'), 20, 'x', X.fmtNum(d.meta, 2) + ' = ') + '</li>' +
        '<li>Desfazer <span class="gtag">− ' + esc(X.fmtNum(f.fixos, 2)) + '</span>: ' + X.fmtNum(d.meta, 2) + ' + ' + X.fmtNum(f.fixos, 2) + ' = ' + X.fmtNum(d.meta + f.fixos, 2) + '</li>' +
        '<li>Desfazer <span class="gtag">× ' + esc(X.fmtNum(f.margem, 2)) + '</span>: ' + X.fmtNum(d.meta + f.fixos, 2) + ' ÷ ' + X.fmtNum(f.margem, 2) + ' = ' + n(need) + '</li>' +
        '<li><b>Precisa vender ' + Math.ceil(need - 1e-9) + ' ' + esc(d.unit) + '</b> no mês' + (need % 1 ? ' (arredondando para cima)' : '') + '.</li></ol>';
    } else $('emp-meta-res').innerHTML = '';
    // Parâmetros
    $('emp-model').value = d.model;
    if (document.activeElement !== $('emp-name')) $('emp-name').value = d.name;
    if (document.activeElement !== $('emp-unit')) $('emp-unit').value = d.unit;
    FIELDS.forEach(([k]) => { const el = $('emp-' + k); if (el && document.activeElement !== el) el.value = X.fmtNum(d[k], 2); });
  }

  function openInFactory(id) {
    const d = data();
    const l = laws(d).find((q) => q.id === id);
    const months = id === 'V';
    const step = months ? 1 : Math.max(1, Math.round(((fns(d).eq || d.q) * 2) / 6 / 10) * 10);
    const inputs = Array.from({ length: 6 }, (_, i) => i * (months ? 2 : step)).join(';');
    FF.set({ view: 'fab', ctx: 'livre', law: l.src, dom: 'N', cd: 'R', inputs, preset: -1, made: '', bad: '' });
  }

  function bind() {
    const sel = $('emp-model');
    sel.innerHTML = Object.keys(MODELS).map((k) => '<option value="' + k + '">' + MODELS[k].icon + ' ' + esc(MODELS[k].name) + ' (' + MODELS[k].unit + ')</option>').join('') + '<option value="livre">✏️ Minha própria empresa</option>';
    sel.addEventListener('change', (e) => {
      const k = e.target.value;
      if (MODELS[k]) save(Object.assign({}, MODELS[k], { model: k, q: MODELS[k].v0, t: 0 }));
      else save({ model: 'livre', name: 'Minha empresa', icon: '🏭' });
    });
    $('emp-name').addEventListener('change', (e) => save({ name: e.target.value.trim().slice(0, 40) || 'Minha empresa' }));
    $('emp-unit').addEventListener('change', (e) => save({ unit: e.target.value.trim().slice(0, 20) || 'unidades' }));
    FIELDS.forEach(([k]) => {
      $('emp-' + k).addEventListener('change', (e) => {
        const v = X.parseNumber(e.target.value);
        if (isNaN(v) || v < 0) { e.target.classList.add('invalid'); return; }
        e.target.classList.remove('invalid');
        save({ [k]: v });
      });
    });
    $('emp-meta').addEventListener('change', (e) => { const v = X.parseNumber(e.target.value); if (!isNaN(v)) save({ meta: v }); });
    $('emp-slider').addEventListener('input', (e) => {
      const v = Number(e.target.value);
      const d = data();
      save(d.mode === 'mes' ? { t: v } : { q: v });
    });
    document.querySelectorAll('#emp-mode button').forEach((b) => b.addEventListener('click', () => save({ mode: b.dataset.m })));
    $('emp-parts').addEventListener('click', () => save({ parts: !data().parts }));
    $('emp-laws').addEventListener('click', (e) => { const b = e.target.closest('[data-fab]'); if (b) openInFactory(b.dataset.fab); });
    // Arrastar no gráfico escolhe a quantidade (ou o mês)
    const svg = $('emp-svg');
    let drag = false;
    const pick = (e) => {
      const m = draw.map;
      if (!m) return;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      let u = m.X0 + ((p.x - ml) / (W - ml - mr)) * (m.x1 - m.X0);
      u = Math.max(0, Math.min(m.x1, m.months ? Math.round(u) : Math.round(u)));
      save(m.months ? { t: u } : { q: u });
    };
    svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); pick(e); });
    svg.addEventListener('pointermove', (e) => { if (drag) pick(e); });
    svg.addEventListener('pointerup', () => { drag = false; });
  }

  FF.emp = { init: bind, render, next() {}, prev() {}, first() {} };
})();
