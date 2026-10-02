/* É função? O inspetor de qualidade confere diagramas, tabelas e gráficos, um passo por clique. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);
  const r1 = (v) => Math.round(v * 10) / 10;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const range = (n) => Array.from({ length: n }, (_, i) => i);

  /* ---------- Casos ----------
     Relação: { title, book, A, B, pairs: [[a, b]], nameA, nameB }  (rótulos em texto)
     Gráfico: { title, eq, win: [x0, x1, y0, y1], br: [{ f, a, b }], vl: [x], dom, im } */
  const all = (A, b) => A.map((a) => [a, b]);
  const DIAG = [
    { title: 'y = x − 2', book: 'Organizando as ideias', A: ['2', '3', '4', '5'], B: ['0', '1', '2', '3', '4'],
      pairs: [['2', '0'], ['3', '1'], ['4', '2'], ['5', '3']] },
    { title: 'Diagrama 1', book: 'Atividade 15', A: ['3', '4', '5'], B: ['1', '2', '3', '4', '5'],
      pairs: [['3', '1'], ['4', '3'], ['5', '5']] },
    { title: 'Diagrama 2', book: 'Atividade 15', A: ['−1', '0', '1', '2'], B: ['1', '2'],
      pairs: [['−1', '1'], ['0', '1'], ['1', '2'], ['2', '2']] },
    { title: 'Diagrama 3', book: 'Atividade 15', A: ['2', '4', '6', '9'], B: ['0', '3', '2', '1', '4', '5'],
      pairs: [['2', '0'], ['4', '3'], ['6', '2'], ['6', '1'], ['9', '5']] },
    { title: 'Diagrama 4', book: 'Atividade 15', A: ['2', '4', '6', '8', '10'], B: ['2'], pairs: all(['2', '4', '6', '8', '10'], '2') },
    { title: 'Elemento sem flecha', book: 'Organizando as ideias', A: ['1', '2', '3'], B: ['4', '5', '6'],
      pairs: [['1', '4'], ['2', '5']] },
  ];
  const TAB = [
    { title: 'Notas de Língua Portuguesa', book: 'Atividade 14', nameA: 'Nome', nameB: 'Nota',
      pairs: [['Rafael', '8,5'], ['Júlia', '9'], ['Marcelo', '7'], ['Mariana', '7,5'], ['José', '8,5']] },
    { title: 'A mesma tabela, ao contrário', book: 'Atividade 14', nameA: 'Nota', nameB: 'Nome',
      pairs: [['8,5', 'Rafael'], ['9', 'Júlia'], ['7', 'Marcelo'], ['7,5', 'Mariana'], ['8,5', 'José']] },
    { title: 'Voo do avião', book: 'Atividade 10', nameA: 'Tempo (h)', nameB: 'Distância (km)',
      pairs: [['1', '600'], ['2', '1 200'], ['3', '1 800'], ['4', '2 400'], ['5', '3 000']] },
    { title: 'f(x) = x² + 2x', book: 'Atividade 11', nameA: 'x', nameB: 'f(x)',
      pairs: [['2', '8'], ['1', '3'], ['0', '0'], ['−1', '−1'], ['−2', '0']] },
    { title: 'Esporte favorito', nameA: 'Aluno', nameB: 'Esporte',
      pairs: [['Ana', 'Vôlei'], ['Bruno', 'Futebol'], ['Caio', 'Futebol'], ['Ana', 'Natação'], ['Duda', 'Basquete']] },
    { title: 'Medições repetidas', nameA: 'x', nameB: 'y',
      pairs: [['1', '5'], ['2', '7'], ['3', '9'], ['2', '7'], ['4', '11']] },
  ];
  const sq = (v) => (v < 0 ? NaN : Math.sqrt(v));
  const K = 1.6; // tamanho do coração
  const GRAF = [
    { title: 'Reta', eq: 'y = 2x − 1', br: [{ f: (x) => 2 * x - 1 }], dom: 'ℝ', im: 'ℝ' },
    { title: 'Parábola', eq: 'y = x² − 4', br: [{ f: (x) => x * x - 4 }], dom: 'ℝ', im: '{y ∈ ℝ | y ≥ −4}' },
    { title: 'Circunferência', eq: 'x² + y² = 9', br: [{ f: (x) => sq(9 - x * x), a: -3, b: 3 }, { f: (x) => -sq(9 - x * x), a: -3, b: 3 }] },
    { title: 'Coração', eq: 'o coração do GeoGebra', win: [-5, 5, -5.6, 3],
      br: [{ f: (x) => K * sq(1 - Math.pow(Math.abs(x) / K - 1, 2)), a: -2 * K, b: 2 * K },
        { f: (x) => K * (Math.acos(Math.max(-1, 1 - Math.abs(x) / K)) - Math.PI), a: -2 * K, b: 2 * K }] },
    { title: 'Parábola deitada', eq: 'x = y²', br: [{ f: (x) => sq(x), a: 0 }, { f: (x) => -sq(x), a: 0 }] },
    { title: 'Meia circunferência', eq: 'y = √(9 − x²)', br: [{ f: (x) => sq(9 - x * x), a: -3, b: 3 }],
      dom: '{x ∈ ℝ | −3 ≤ x ≤ 3}', im: '{y ∈ ℝ | 0 ≤ y ≤ 3}' },
    { title: 'Elipse', eq: 'x²/16 + y²/4 = 1', br: [{ f: (x) => 2 * sq(1 - x * x / 16), a: -4, b: 4 }, { f: (x) => -2 * sq(1 - x * x / 16), a: -4, b: 4 }] },
    { title: 'Módulo', eq: 'y = |x|', br: [{ f: (x) => Math.abs(x) }], dom: 'ℝ', im: '{y ∈ ℝ | y ≥ 0}' },
    { title: 'Reta vertical', eq: 'x = 2', vl: [2] },
    { title: 'Cúbica', eq: 'y = x³/4 − x', br: [{ f: (x) => (x * x * x) / 4 - x }], dom: 'ℝ', im: 'ℝ' },
    { title: 'Onda', eq: 'y = sen x', win: [-7, 7, -3, 3], br: [{ f: (x) => Math.sin(x) }], dom: 'ℝ', im: '{y ∈ ℝ | −1 ≤ y ≤ 1}' },
  ];

  /* Caso sorteado (fica no fim da lista até sortear outro) e caso montado pelo professor. */
  const extra = { diag: null, tab: null };
  let editing = false;
  let selA = -1;

  function customCase() {
    const s = FF.state.iCustom;
    if (!s) return null;
    const [a, b, p] = s.split('|');
    const A = (a || '').split(';').filter(Boolean), B = (b || '').split(';').filter(Boolean);
    if (!A.length || !B.length) return null;
    const pairs = (p || '').split(',').filter(Boolean).map((t) => t.split('>').map(Number)).filter(([i, j]) => A[i] != null && B[j] != null).map(([i, j]) => [A[i], B[j]]);
    return { title: 'Meu diagrama', custom: true, A, B, pairs };
  }
  function saveCustom(c) {
    const pi = c.pairs.map(([a, b]) => c.A.indexOf(a) + '>' + c.B.indexOf(b)).join(',');
    FF.set({ iCustom: c.A.join(';') + '|' + c.B.join(';') + '|' + pi });
  }

  function cases() {
    const m = FF.state.iMode;
    if (m === 'graf') return GRAF;
    const list = (m === 'diag' ? DIAG : TAB).slice();
    if (m === 'diag') { const c = customCase(); if (c) list.push(c); }
    if (extra[m]) list.push(extra[m]);
    return list;
  }
  function current() {
    const list = cases();
    return list[Math.min(FF.state.iCase, list.length - 1)];
  }

  /* ---------- Sorteio ---------- */
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function nums(n, lo, hi) {
    const pool = shuffle(range(hi - lo + 1).map((i) => lo + i)).slice(0, n).sort((a, b) => a - b);
    return pool.map((v) => X.fmtNum(v, 0));
  }
  function randomDiag() {
    const kind = ['inj', 'many', 'const', 'missing', 'double', 'inj'][rnd(6)];
    const A = nums(3 + rnd(3), -3, 9);
    const B = nums(kind === 'const' ? 1 + rnd(3) : 3 + rnd(3), -3, 12);
    let pairs;
    if (kind === 'const') { const b = B[rnd(B.length)]; pairs = A.map((a) => [a, b]); }
    else if (kind === 'inj' && B.length >= A.length) { const bs = shuffle(B.slice()); pairs = A.map((a, i) => [a, bs[i]]); }
    else pairs = A.map((a) => [a, B[rnd(B.length)]]);
    if (kind === 'missing') pairs.splice(rnd(pairs.length), 1);
    if (kind === 'double') {
      const i = rnd(A.length);
      const other = B.filter((b) => b !== pairs.find((p) => p[0] === A[i])[1]);
      if (other.length) pairs.push([A[i], other[rnd(other.length)]]);
    }
    return { title: 'Sorteado', random: true, A, B, pairs };
  }
  function randomTab() {
    const xs = nums(4 + rnd(2), -4, 10);
    const a = 1 + rnd(3), b = rnd(7) - 3;
    let pairs = xs.map((x) => [x, X.fmtNum(a * X.parseNumber(x) + b, 0)]);
    const kind = rnd(3);
    if (kind === 1) { // repete um x com outro y
      const p = pairs[rnd(pairs.length)];
      pairs.splice(rnd(pairs.length + 1), 0, [p[0], X.fmtNum(X.parseNumber(p[1]) + 1 + rnd(4), 0)]);
    } else if (kind === 2) { // repete a mesma linha (continua função)
      const p = pairs[rnd(pairs.length)];
      pairs.splice(rnd(pairs.length + 1), 0, p.slice());
    }
    return { title: 'Sorteada', random: true, nameA: 'x', nameB: 'y', pairs };
  }
  function inverse(c) {
    return { title: 'Ao contrário: ' + c.title, random: true, nameA: c.nameB, nameB: c.nameA, pairs: c.pairs.map(([a, b]) => [b, a]) };
  }

  /* ---------- Análise de uma relação ---------- */
  const uniq = (l) => l.filter((v, i) => l.indexOf(v) === i);
  function analyze(c) {
    const A = c.A || uniq(c.pairs.map((p) => p[0]));
    const B = c.B || uniq(c.pairs.map((p) => p[1]));
    const els = A.map((a) => {
      const imgs = uniq(c.pairs.filter((p) => p[0] === a).map((p) => p[1]));
      return { a, imgs, st: imgs.length === 0 ? 'none' : imgs.length === 1 ? 'ok' : 'many' };
    });
    const fn = els.every((e) => e.st === 'ok');
    const im = B.filter((b) => c.pairs.some((p) => p[1] === b));
    return { A, B, els, fn, im };
  }

  /* ---------- Gráficos: quantos pontos a reta vertical corta ---------- */
  function win(c) { return c.win || [-5, 5, -5, 5]; }
  function hits(c, x, tol) {
    if ((c.vl || []).some((v) => Math.abs(v - x) <= tol)) return { n: Infinity, ys: [] };
    const ys = [];
    (c.br || []).forEach((b) => {
      const a = b.a == null ? -Infinity : b.a, e = b.b == null ? Infinity : b.b;
      if (x < a - 1e-9 || x > e + 1e-9) return;
      const y = b.f(Math.min(e, Math.max(a, x)));
      if (isFinite(y) && !ys.some((w) => Math.abs(w - y) < 1e-6)) ys.push(y);
    });
    return { n: ys.length, ys };
  }
  function sweepData(c) {
    if (c._sw) return c._sw;
    const [x0, x1] = win(c);
    const N = 560;
    const tol = ((x1 - x0) / N) * 0.51;
    const xs = range(N + 1).map((i) => x0 + ((x1 - x0) * i) / N);
    const counts = xs.map((x) => hits(c, x, tol).n);
    // primeira faixa "ruim": a reta para no meio dela
    let bad = null;
    for (let i = 0; i <= N; i++) {
      if (counts[i] >= 2) {
        let j = i;
        while (j + 1 <= N && counts[j + 1] >= 2) j++;
        const mid = (xs[i] + xs[j]) / 2;
        bad = counts[i] === Infinity ? xs[i] : Math.round(mid * 2) / 2;
        if (hits(c, bad, tol).n < 2) bad = mid;
        break;
      }
    }
    c._sw = { xs, counts, tol, fn: bad == null, bad };
    return c._sw;
  }

  /* ---------- Passos ---------- */
  let step = 0;
  let lineX = null;       // reta vertical (gráficos)
  let sweepT = 1;         // progresso da varredura (0..1)
  let tw = null;
  const votes = {};       // voto da turma por caso
  const scored = {};      // casos já contabilizados no placar
  const conf = {};        // certeza da turma no voto: 'alta' | 'baixa'
  let score = { ok: 0, total: 0 };

  function key(c) { return FF.state.iMode + ':' + c.title + ':' + (c.random ? JSON.stringify(c.pairs) : ''); }

  function stages() {
    const c = current();
    const out = [{ k: 'show' }];
    if (FF.state.iMode === 'graf') {
      out.push({ k: 'line' }, { k: 'sweep' }, { k: 'verdict' });
      if (sweepData(c).fn) out.push({ k: 'sets' });
      return out;
    }
    const an = analyze(c);
    an.els.forEach((e, i) => out.push({ k: 'el', i }));
    out.push({ k: 'verdict' });
    if (an.fn) out.push({ k: 'sets' });
    return out;
  }
  function isFn(c) { return FF.state.iMode === 'graf' ? sweepData(c).fn : analyze(c).fn; }

  function go(to) {
    const st = stages();
    to = Math.max(0, Math.min(st.length - 1, to));
    if (tw) { tw.cancel(); tw = null; }
    const from = step;
    step = to;
    const c = current();
    const k = st[step].k;
    if (FF.state.iMode === 'graf') {
      const [x0, x1] = win(c);
      const sw = sweepData(c);
      const si = stepIndex('sweep');
      const park = () => { lineX = sw.bad != null ? sw.bad : x1 - (x1 - x0) * 0.2; };
      if (k === 'sweep' && from < step) {
        sweepT = 0;
        tw = FF.tween(2600 / FF.state.speed, (t) => { sweepT = t; lineX = x0 + (x1 - x0) * t; draw(); }, () => {
          tw = null; sweepT = 1; park(); draw();
        });
      } else if (step >= si) {
        sweepT = 1;
        if (lineX == null) park();
      } else {
        sweepT = 0;
        if (k === 'line' && lineX == null) lineX = x0 + (x1 - x0) * 0.2;
      }
    }
    if (k === 'verdict' && !scored[key(c)] && votes[key(c)]) {
      scored[key(c)] = true;
      score.total++;
      if ((votes[key(c)] === 'yes') === isFn(c)) score.ok++;
      else if (conf[key(c)] === 'alta') score.sure = (score.sure || 0) + 1;
    }
    draw();
    narrate();
  }
  function stepIndex(k) { return stages().findIndex((s) => s.k === k); }

  function resetCase() {
    if (tw) { tw.cancel(); tw = null; }
    step = 0; lineX = null; sweepT = 0; selA = -1;
    draw(); narrate(); syncBar();
  }

  /* ---------- Desenho ---------- */
  const PX0 = 30, PX1 = 640; // área da figura
  const IX0 = 668, IX1 = 988; // posto de inspeção

  function stamp(ok, yc) {
    const txt1 = ok ? 'APROVADO' : 'REPROVADO';
    const txt2 = ok ? 'é função' : 'não é função';
    const cx = (IX0 + IX1) / 2;
    return '<g class="stamp ' + (ok ? 'ok' : 'no') + '" transform="rotate(-7 ' + cx + ' ' + yc + ')">' +
      '<rect x="' + (cx - 118) + '" y="' + (yc - 38) + '" width="236" height="76" rx="10"/>' +
      '<text class="st1" x="' + cx + '" y="' + (yc + 2) + '" text-anchor="middle">' + txt1 + '</text>' +
      '<text class="st2" x="' + cx + '" y="' + (yc + 26) + '" text-anchor="middle">' + txt2 + '</text></g>';
  }
  function panelBox(title) {
    return '<rect class="post" x="' + IX0 + '" y="18" width="' + (IX1 - IX0) + '" height="436" rx="14"/>' +
      '<text class="post-title" x="' + (IX0 + 18) + '" y="46">' + esc(title) + '</text>';
  }
  function magnifier(x, y) {
    return '<g class="lupa" transform="translate(' + r1(x) + ' ' + r1(y) + ')"><circle r="15"/><line x1="11" y1="11" x2="22" y2="22"/></g>';
  }

  function drawRelation(c, st) {
    const an = analyze(c);
    const mode = FF.state.iMode;
    const cur = st.k === 'el' ? st.i : -1;
    const checked = st.k === 'el' ? st.i : st.k === 'show' ? -1 : an.els.length - 1;
    let s = '';
    if (mode === 'diag') {
      const ax = 175, bx = 490, cy = 245;
      const n = Math.max(an.A.length, an.B.length);
      const gap = Math.min(48, 300 / Math.max(1, n));
      const ry = Math.max(95, (n - 1) * gap / 2 + 55), rx = 92;
      const yA = (i) => cy - ((an.A.length - 1) * gap) / 2 + i * gap;
      const yB = (j) => cy - ((an.B.length - 1) * gap) / 2 + j * gap;
      s += '<defs><marker id="iarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke"/></marker></defs>';
      s += '<ellipse class="oval" cx="' + ax + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/><ellipse class="oval" cx="' + bx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/>';
      s += '<circle class="setname-c" cx="' + ax + '" cy="' + (cy - ry) + '" r="18"/><text class="setname" x="' + ax + '" y="' + (cy - ry + 7) + '" text-anchor="middle">A</text>';
      s += '<circle class="setname-c" cx="' + bx + '" cy="' + (cy - ry) + '" r="18"/><text class="setname" x="' + bx + '" y="' + (cy - ry + 7) + '" text-anchor="middle">B</text>';
      c.pairs.forEach(([a, b]) => {
        const i = an.A.indexOf(a), j = an.B.indexOf(b);
        if (i < 0 || j < 0) return;
        const e = an.els[i];
        const y1 = yA(i), y2 = yB(j), x1 = ax + 30, x2 = bx - 32, mx = (x1 + x2) / 2;
        const cls = i === cur ? (e.st === 'ok' ? ' cur' : ' bad') : i <= checked && e.st !== 'ok' ? ' bad dim' : cur >= 0 ? ' dim' : '';
        s += '<path class="iarrow' + cls + '" d="M' + x1 + ' ' + r1(y1) + ' C' + mx + ' ' + r1(y1) + ' ' + mx + ' ' + r1(y2) + ' ' + x2 + ' ' + r1(y2) + '" marker-end="url(#iarr)"/>';
      });
      an.A.forEach((a, i) => {
        const e = an.els[i];
        const y = yA(i);
        const cls = i === cur ? (e.st === 'ok' ? ' cur' : ' bad') : i <= checked ? (e.st === 'ok' ? ' okd' : ' bad') : '';
        const sel = editing && selA === i ? ' sel' : '';
        s += '<g class="iel' + cls + sel + (editing ? ' clickable' : '') + '" data-a="' + i + '"><circle cx="' + (ax + 22) + '" cy="' + r1(y) + '" r="4.5"/>' +
          '<text x="' + (ax + 10) + '" y="' + r1(y + 7) + '" text-anchor="end">' + esc(a) + '</text>' +
          (editing ? '<rect class="hit" x="' + (ax - 70) + '" y="' + r1(y - gap / 2) + '" width="100" height="' + r1(gap) + '"/>' : '') + '</g>';
        if (i === cur) s += magnifier(ax - 70, y);
      });
      const showIm = st.k === 'sets';
      an.B.forEach((b, j) => {
        const y = yB(j);
        const hit = an.im.includes(b);
        const cls = showIm ? (hit ? ' im' : ' spare') : '';
        s += '<g class="iel' + cls + (editing ? ' clickable' : '') + '" data-b="' + j + '"><circle cx="' + (bx - 24) + '" cy="' + r1(y) + '" r="4.5"/>' +
          '<text x="' + (bx - 12) + '" y="' + r1(y + 7) + '">' + esc(b) + '</text>' +
          (editing ? '<rect class="hit" x="' + (bx - 40) + '" y="' + r1(y - gap / 2) + '" width="110" height="' + r1(gap) + '"/>' : '') + '</g>';
      });
      if (editing) s += '<text class="edit-hint" x="' + ((ax + bx) / 2) + '" y="452" text-anchor="middle">Toque em um elemento de A e depois em um de B para ligar ou desligar a flecha</text>';
    } else {
      // Tabela
      const rows = c.pairs;
      const x0 = 70, x1 = 590, xm = 330;
      const rh = Math.min(50, 360 / (rows.length + 1));
      const y0 = 245 - ((rows.length + 1) * rh) / 2;
      s += '<rect class="tb-head" x="' + x0 + '" y="' + r1(y0) + '" width="' + (x1 - x0) + '" height="' + r1(rh) + '" rx="8"/>';
      s += '<text class="tb-h" x="' + ((x0 + xm) / 2) + '" y="' + r1(y0 + rh / 2 + 7) + '" text-anchor="middle">' + esc(c.nameA) + '</text>';
      s += '<text class="tb-h" x="' + ((xm + x1) / 2) + '" y="' + r1(y0 + rh / 2 + 7) + '" text-anchor="middle">' + esc(c.nameB) + '</text>';
      rows.forEach(([a, b], k) => {
        const i = an.A.indexOf(a);
        const e = an.els[i];
        const y = y0 + (k + 1) * rh;
        const cls = i === cur ? (e.st === 'ok' ? ' cur' : ' bad') : i <= checked && e.st !== 'ok' ? ' bad' : cur >= 0 ? ' dim' : '';
        const imCls = st.k === 'sets' ? ' im' : '';
        s += '<g class="tb-row' + cls + '"><rect x="' + x0 + '" y="' + r1(y) + '" width="' + (x1 - x0) + '" height="' + r1(rh) + '"/>' +
          '<text x="' + ((x0 + xm) / 2) + '" y="' + r1(y + rh / 2 + 7) + '" text-anchor="middle">' + esc(a) + '</text>' +
          '<text class="tb-b' + imCls + '" x="' + ((xm + x1) / 2) + '" y="' + r1(y + rh / 2 + 7) + '" text-anchor="middle">' + esc(b) + '</text></g>';
        if (i === cur && rows.findIndex((p) => p[0] === a) === k) s += magnifier(x0 - 30, y + rh / 2);
      });
      s += '<line class="tb-mid" x1="' + xm + '" y1="' + r1(y0) + '" x2="' + xm + '" y2="' + r1(y0 + (rows.length + 1) * rh) + '"/>';
    }

    // Posto de inspeção
    s += panelBox('Posto de inspeção');
    const rowH = Math.min(40, 250 / Math.max(1, an.els.length));
    an.els.forEach((e, i) => {
      if (i > checked) return;
      const y = 78 + i * rowH;
      const txt = e.a + ' → ' + (e.imgs.length ? e.imgs.join(' e ') : 'nada');
      const ok = e.st === 'ok';
      s += '<g class="chk' + (ok ? ' ok' : ' no') + (i === cur ? ' cur' : '') + '"><text class="chk-i" x="' + (IX0 + 22) + '" y="' + r1(y + 6) + '">' + (ok ? '✓' : '✗') + '</text>' +
        '<text class="chk-t" x="' + (IX0 + 48) + '" y="' + r1(y + 6) + '">' + esc(txt) + '</text>' +
        (ok ? '' : '<text class="chk-w" x="' + (IX1 - 16) + '" y="' + r1(y + 6) + '" text-anchor="end">' + (e.st === 'none' ? 'sem flecha' : 'duas saídas') + '</text>') + '</g>';
    });
    if (checked < 0) {
      s += '<text class="post-wait" x="' + ((IX0 + IX1) / 2) + '" y="210" text-anchor="middle">Cada elemento de A</text>' +
        '<text class="post-wait" x="' + ((IX0 + IX1) / 2) + '" y="236" text-anchor="middle">precisa de exatamente</text>' +
        '<text class="post-wait" x="' + ((IX0 + IX1) / 2) + '" y="262" text-anchor="middle">uma flecha saindo.</text>';
    }
    if (st.k === 'verdict' || st.k === 'sets') s += stamp(an.fn, 392);
    return s;
  }

  function drawGraph(c, st) {
    const [x0, x1, y0, y1] = win(c);
    const W = PX1 - PX0, H = 436;
    const sc = Math.min(W / (x1 - x0), H / (y1 - y0));
    const ox = PX0 + (W - (x1 - x0) * sc) / 2, oy = 18 + (H - (y1 - y0) * sc) / 2;
    const sx = (x) => ox + (x - x0) * sc, sy = (y) => oy + (y1 - y) * sc;
    let s = '<rect class="plot-bg" x="' + r1(sx(x0)) + '" y="' + r1(sy(y1)) + '" width="' + r1((x1 - x0) * sc) + '" height="' + r1((y1 - y0) * sc) + '"/>';
    for (let v = Math.ceil(x0); v <= x1; v++) s += '<line class="gridl" x1="' + r1(sx(v)) + '" y1="' + r1(sy(y1)) + '" x2="' + r1(sx(v)) + '" y2="' + r1(sy(y0)) + '"/>';
    for (let v = Math.ceil(y0); v <= y1; v++) s += '<line class="gridl" x1="' + r1(sx(x0)) + '" y1="' + r1(sy(v)) + '" x2="' + r1(sx(x1)) + '" y2="' + r1(sy(v)) + '"/>';
    s += '<line class="axis" x1="' + r1(sx(x0)) + '" y1="' + r1(sy(0)) + '" x2="' + r1(sx(x1)) + '" y2="' + r1(sy(0)) + '"/>';
    s += '<line class="axis" x1="' + r1(sx(0)) + '" y1="' + r1(sy(y0)) + '" x2="' + r1(sx(0)) + '" y2="' + r1(sy(y1)) + '"/>';
    for (let v = Math.ceil(x0); v <= x1; v++) if (v && v % (x1 - x0 > 10 ? 2 : 1) === 0) s += '<text class="tick" x="' + r1(sx(v)) + '" y="' + r1(sy(0) + 16) + '" text-anchor="middle">' + X.fmtNum(v, 0) + '</text>';
    for (let v = Math.ceil(y0); v <= y1; v++) if (v) s += '<text class="tick" x="' + r1(sx(0) - 6) + '" y="' + r1(sy(v) + 4) + '" text-anchor="end">' + X.fmtNum(v, 0) + '</text>';
    s += '<text class="axname" x="' + r1(sx(x1) - 6) + '" y="' + r1(sy(0) - 8) + '" text-anchor="end">x</text><text class="axname" x="' + r1(sx(0) + 8) + '" y="' + r1(sy(y1) + 16) + '">y</text>';

    // Varredura: faixa no eixo x (verde = 1 ponto, vermelho = 2 ou mais)
    const sw = sweepData(c);
    const si = stepIndex('sweep');
    if (step >= si && si >= 0) {
      const lim = x0 + (x1 - x0) * sweepT;
      let seg = null;
      const flush = (xe) => {
        if (!seg) return;
        s += '<line class="strip s' + seg.k + '" x1="' + r1(sx(seg.x)) + '" y1="' + r1(sy(0)) + '" x2="' + r1(sx(Math.min(xe, lim))) + '" y2="' + r1(sy(0)) + '"/>';
        seg = null;
      };
      sw.xs.forEach((x, i) => {
        if (x > lim) return;
        const n = sw.counts[i];
        const kk = n === 0 ? 0 : n === 1 ? 1 : 2;
        if (!seg || seg.k !== kk) { flush(x); seg = { k: kk, x }; }
      });
      flush(lim);
      (c.vl || []).forEach((v) => { if (v <= lim) s += '<circle class="strip-dot" cx="' + r1(sx(v)) + '" cy="' + r1(sy(0)) + '" r="6"/>'; });
    }
    // Imagem (para funções), no eixo y
    if (st.k === 'sets') {
      const ys = [];
      sw.xs.forEach((x) => hits(c, x, sw.tol).ys.forEach((y) => { if (y >= y0 && y <= y1) ys.push(y); }));
      if (ys.length) {
        const lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
        s += '<line class="imbar" x1="' + r1(sx(0)) + '" y1="' + r1(sy(lo)) + '" x2="' + r1(sx(0)) + '" y2="' + r1(sy(hi)) + '"/>';
      }
    }
    // Curvas
    s += '<clipPath id="iclip"><rect x="' + r1(sx(x0)) + '" y="' + r1(sy(y1)) + '" width="' + r1((x1 - x0) * sc) + '" height="' + r1((y1 - y0) * sc) + '"/></clipPath><g clip-path="url(#iclip)">';
    (c.br || []).forEach((b) => {
      const a = Math.max(x0, b.a == null ? x0 : b.a), e = Math.min(x1, b.b == null ? x1 : b.b);
      let d = '', pen = false;
      const N = 400;
      for (let i = 0; i <= N; i++) {
        const x = a + ((e - a) * i) / N;
        const y = b.f(x);
        if (!isFinite(y)) { pen = false; continue; }
        d += (pen ? ' L' : ' M') + r1(sx(x)) + ' ' + r1(sy(y));
        pen = true;
      }
      s += '<path class="icurve" d="' + d + '"/>';
    });
    (c.vl || []).forEach((v) => { s += '<line class="icurve" x1="' + r1(sx(v)) + '" y1="' + r1(sy(y0)) + '" x2="' + r1(sx(v)) + '" y2="' + r1(sy(y1)) + '"/>'; });
    s += '</g>';

    // Reta vertical do inspetor
    let info = null;
    if (step >= 1 && lineX != null) {
      const hh = hits(c, lineX, sw.tol);
      info = hh;
      const bad = hh.n >= 2;
      s += '<g class="vline' + (bad ? ' bad' : hh.n === 1 ? ' ok' : '') + '"><line x1="' + r1(sx(lineX)) + '" y1="' + r1(sy(y1)) + '" x2="' + r1(sx(lineX)) + '" y2="' + r1(sy(y0)) + '"/>' +
        '<rect class="vgrip" x="' + r1(sx(lineX) - 14) + '" y="' + r1(sy(y1)) + '" width="28" height="' + r1((y1 - y0) * sc) + '"/>' +
        '<circle class="vhandle" cx="' + r1(sx(lineX)) + '" cy="' + r1(sy(y0) - 12) + '" r="10"/></g>';
      hh.ys.forEach((y) => { if (y >= y0 && y <= y1) s += '<circle class="vhit' + (bad ? ' bad' : '') + '" cx="' + r1(sx(lineX)) + '" cy="' + r1(sy(y)) + '" r="7"/>'; });
    }

    // Posto de inspeção
    s += panelBox('Posto de inspeção');
    const cx = (IX0 + IX1) / 2;
    s += '<text class="eq" x="' + cx + '" y="92" text-anchor="middle">' + esc(c.eq) + '</text>';
    if (info) {
      const n = info.n;
      const txt = n === Infinity ? 'infinitos pontos!' : n === 0 ? 'nenhum ponto' : n === 1 ? '1 ponto' : n + ' pontos';
      s += '<text class="chk-t" x="' + cx + '" y="140" text-anchor="middle">reta em x = ' + X.fmtNum(lineX, 1) + '</text>';
      s += '<text class="count ' + (n >= 2 ? 'no' : n === 1 ? 'ok' : 'zero') + '" x="' + cx + '" y="180" text-anchor="middle">' + txt + '</text>';
    } else {
      s += '<text class="post-wait" x="' + cx + '" y="160" text-anchor="middle">Uma reta vertical pode</text><text class="post-wait" x="' + cx + '" y="186" text-anchor="middle">cortar o gráfico em</text><text class="post-wait" x="' + cx + '" y="212" text-anchor="middle">mais de um ponto?</text>';
    }
    if (step >= si && si >= 0) {
      s += '<g class="legend"><line class="strip s1" x1="' + (IX0 + 24) + '" y1="232" x2="' + (IX0 + 54) + '" y2="232"/><text x="' + (IX0 + 62) + '" y="237">1 ponto: passa</text>' +
        '<line class="strip s2" x1="' + (IX0 + 24) + '" y1="258" x2="' + (IX0 + 54) + '" y2="258"/><text x="' + (IX0 + 62) + '" y="263">2 ou mais: reprova</text>' +
        '<line class="strip s0" x1="' + (IX0 + 24) + '" y1="284" x2="' + (IX0 + 54) + '" y2="284"/><text x="' + (IX0 + 62) + '" y="289">nenhum: fora do domínio</text></g>';
    }
    if (st.k === 'verdict' || st.k === 'sets') s += stamp(sw.fn, 392);
    return s;
  }

  function draw() {
    const svg = $('insp-svg');
    if (!svg || FF.state.view !== 'insp') return;
    const c = current();
    const st = stages()[step] || { k: 'show' };
    svg.classList.toggle('graf', FF.state.iMode === 'graf');
    svg.innerHTML = FF.state.iMode === 'graf' ? drawGraph(c, st) : drawRelation(c, st);
  }

  /* ---------- Narração ---------- */
  function setsHTML(c) {
    if (FF.state.iMode === 'graf') return '<p><b>D</b> = ' + esc(c.dom || '') + '<br><b>Im</b> = ' + esc(c.im || '') + '</p>';
    const an = analyze(c);
    const L = (l) => '{' + l.join('; ') + '}';
    const spare = an.B.filter((b) => !an.im.includes(b));
    return '<p class="mathline sets-line"><b>D</b> = ' + esc(L(an.A)) + '<br><b>CD</b> = ' + esc(L(an.B)) + '<br><b>Im</b> = ' + esc(L(an.im)) + '</p>' +
      (spare.length ? '<p>Sobram em B: ' + esc(spare.join(', ')) + '. Tudo bem: a imagem não precisa ser o contradomínio inteiro (Im ⊂ CD).</p>'
        : '<p>Todos os elementos de B receberam flecha: aqui Im = CD.</p>');
  }
  function narrate() {
    const c = current();
    const st = stages();
    const s = st[step];
    const mode = FF.state.iMode;
    const count = $('insp-count'), title = $('insp-title'), body = $('insp-body');
    count.textContent = 'Passo ' + (step + 1) + ' de ' + st.length;
    let t = '', h = '';
    const vote = votes[key(c)];
    const voteLine = () => {
      if (!vote) return '';
      const right = (vote === 'yes') === isFn(c);
      const cf = conf[key(c)];
      return '<p class="vote-res ' + (right ? 'ok' : 'no') + '">' + (right ? '✓' : '✗') + ' A turma votou <b>' + (vote === 'yes' ? 'é função' : 'não é função') + '</b>' + (cf ? ' com ' + (cf === 'alta' ? 'muita' : 'pouca') + ' certeza' : '') + ': ' + (right ? 'acertou!' : 'não foi dessa vez.') + '</p>' +
        (!right && cf === 'alta' ? '<p class="vote-tip">A turma errou <b>com certeza</b>: peça que alguém explique o raciocínio. Errar com certeza e ver por quê é quando mais se aprende.</p>' : '') +
        (right && cf === 'baixa' ? '<p class="vote-tip">Acertou, mas sem certeza: vale alguém explicar de novo por que é assim.</p>' : '');
    };
    if (mode !== 'graf') {
      const an = analyze(c);
      if (s.k === 'show') {
        t = 'Chegou um produto para inspeção';
        h = '<p>' + (mode === 'diag' ? 'Este diagrama' : 'Esta tabela') + ' representa uma <b>função de A em B</b>? Votem antes de inspecionar.</p>' +
          '<p class="note">Regra: <b>todo</b> elemento de A precisa ter <b>uma, e só uma</b>, imagem em B.</p>';
      } else if (s.k === 'el') {
        const e = an.els[s.i];
        t = 'Elemento ' + e.a;
        if (e.st === 'ok') h = '<p><b>' + esc(e.a) + '</b> tem <b>uma só</b> imagem: ' + esc(e.imgs[0]) + '. Passa!</p>';
        else if (e.st === 'none') h = '<p><b>' + esc(e.a) + '</b> ficou <b>sem imagem</b>: nenhuma flecha sai dele. Numa função, não pode sobrar elemento em A.</p>';
        else h = '<p><b>' + esc(e.a) + '</b> tem <b>' + e.imgs.length + ' imagens</b> (' + esc(e.imgs.join(' e ')) + '). Numa função, cada elemento tem uma única imagem.</p>';
        const same = an.els.filter((o, j) => j <= s.i && o.st === 'ok' && e.st === 'ok' && o.imgs[0] === e.imgs[0] && o !== e);
        if (same.length) h += '<p class="note">' + esc(same.map((o) => o.a).concat(e.a).join(' e ')) + ' têm a mesma imagem (' + esc(e.imgs[0]) + '): isso <b>pode</b>. O proibido é um elemento com duas imagens.</p>';
      } else if (s.k === 'verdict') {
        t = an.fn ? 'Aprovado: é função!' : 'Reprovado: não é função';
        if (an.fn) h = '<p>Todos os elementos de A têm exatamente uma imagem.</p>';
        else {
          const bad = an.els.filter((e) => e.st !== 'ok');
          h = '<p>' + bad.map((e) => '<b>' + esc(e.a) + '</b> ' + (e.st === 'none' ? 'ficou sem imagem' : 'tem ' + e.imgs.length + ' imagens')).join('; ') + '.</p>';
        }
        h += voteLine();
      } else if (s.k === 'sets') {
        t = 'Domínio, contradomínio e imagem';
        h = setsHTML(c);
      }
    } else {
      const sw = sweepData(c);
      if (s.k === 'show') {
        t = 'Chegou um gráfico para inspeção';
        h = '<p>O gráfico de <b>' + esc(c.eq) + '</b> é gráfico de uma função de <i>x</i> em <i>y</i>? Votem antes de inspecionar.</p>' +
          '<p class="note">Teste da reta vertical: se alguma reta vertical cortar o gráfico em <b>mais de um ponto</b>, não é função.</p>';
      } else if (s.k === 'line') {
        t = 'A reta vertical';
        h = '<p><b>Arraste</b> a reta vermelha pelo gráfico e veja em quantos pontos ela corta. Cada ponto cortado é uma imagem daquele <i>x</i>.</p><p class="note">Avance para o inspetor varrer o gráfico inteiro.</p>';
      } else if (s.k === 'sweep') {
        t = 'Varrendo da esquerda para a direita';
        h = sw.fn ? '<p>Em todo lugar, a reta corta <b>no máximo um ponto</b>. Faixa verde: um ponto; cinza: nenhum (fora do domínio).</p>'
          : '<p>A faixa vermelha mostra onde a reta corta <b>' + (c.vl ? 'infinitos pontos' : 'dois ou mais pontos') + '</b>. A reta parou num desses lugares: o mesmo <i>x</i> teria ' + (c.vl ? 'infinitas imagens' : 'duas imagens') + '.</p>';
      } else if (s.k === 'verdict') {
        t = sw.fn ? 'Aprovado: é função!' : 'Reprovado: não é função';
        h = (sw.fn ? '<p>Nenhuma reta vertical corta o gráfico em mais de um ponto.</p>' : '<p>Existe reta vertical que corta o gráfico em mais de um ponto.</p>') + voteLine();
      } else if (s.k === 'sets') {
        t = 'Domínio e imagem no gráfico';
        h = setsHTML(c) + '<p class="note">O domínio é a "sombra" do gráfico no eixo <i>x</i> (faixa verde); a imagem, a sombra no eixo <i>y</i> (faixa laranja).</p>';
      }
    }
    title.textContent = t;
    body.innerHTML = h;
    $('insp-dots').innerHTML = st.map((x, i) => '<button class="dot' + (i < step ? ' done' : '') + (i === step ? ' current' : '') + '" data-i="' + i + '" aria-label="Passo ' + (i + 1) + '"></button>').join('');
    $('insp-prev').disabled = step === 0;
    syncVote();
  }

  function syncVote() {
    const c = current();
    const v = votes[key(c)];
    $('vote-yes').setAttribute('aria-pressed', v === 'yes');
    $('vote-no').setAttribute('aria-pressed', v === 'no');
    $('vote-score').innerHTML = score.total ? 'Placar da turma: <b>' + score.ok + '</b> acerto' + (score.ok === 1 ? '' : 's') + ' em ' + score.total + (score.sure ? ' · erros com certeza: <b>' + score.sure + '</b>' : '') : 'Votem antes do veredito.';
    const cf = conf[key(c)];
    document.querySelectorAll('#vote-conf button').forEach((b) => { b.setAttribute('aria-pressed', b.dataset.c === cf); b.disabled = !v || !!scored[key(c)]; });
  }

  function syncBar() {
    const S = FF.state;
    const list = cases();
    const c = current();
    document.querySelectorAll('#insp-mode button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.m === S.iMode));
    $('insp-case').textContent = 'Caso ' + (Math.min(S.iCase, list.length - 1) + 1) + ' de ' + list.length + ': ' + c.title + (c.book ? ' · ' + c.book : '');
    $('insp-random').hidden = S.iMode === 'graf';
    $('insp-swap').hidden = S.iMode !== 'tab';
    $('insp-build').hidden = S.iMode !== 'diag';
    $('insp-build').setAttribute('aria-pressed', editing);
    $('insp-rule').innerHTML = S.iMode === 'graf'
      ? '<b>Teste da reta vertical.</b> Se alguma reta vertical corta o gráfico em mais de um ponto, não é função: aquele <i>x</i> teria duas imagens.'
      : '<b>É função de A em B</b> quando <b>todo</b> elemento de A tem <b>uma, e só uma</b>, imagem em B. Pode: elementos de A com a mesma imagem e elementos de B sobrando. Não pode: elemento de A sem imagem ou com duas.';
    const ed = $('insp-edit');
    ed.hidden = !(S.iMode === 'diag' && editing);
    if (!ed.hidden) {
      const cc = customCase() || { A: [], B: [] };
      if (document.activeElement !== $('in-edit-a')) $('in-edit-a').value = cc.A.join('; ');
      if (document.activeElement !== $('in-edit-b')) $('in-edit-b').value = cc.B.join('; ');
    }
  }

  /* ---------- Interação ---------- */
  function setCase(i) {
    const list = cases();
    FF.set({ iCase: (i + list.length) % list.length });
    resetCase();
  }
  function svgPoint(e) {
    const svg = $('insp-svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function bind() {
    document.querySelectorAll('#insp-mode button').forEach((b) => b.addEventListener('click', () => {
      editing = false;
      FF.set({ iMode: b.dataset.m, iCase: 0 });
      resetCase();
    }));
    $('insp-prevcase').addEventListener('click', () => setCase(FF.state.iCase - 1));
    $('insp-nextcase').addEventListener('click', () => setCase(FF.state.iCase + 1));
    $('insp-random').addEventListener('click', () => {
      const m = FF.state.iMode;
      extra[m] = m === 'diag' ? randomDiag() : randomTab();
      editing = false;
      setCase(cases().length - 1);
    });
    $('insp-swap').addEventListener('click', () => {
      extra.tab = inverse(current());
      setCase(cases().length - 1);
    });
    $('insp-build').addEventListener('click', () => {
      editing = !editing;
      if (editing) {
        if (!customCase()) saveCustom({ A: ['1', '2', '3'], B: ['a', 'b', 'c'], pairs: [] });
        const i = cases().findIndex((c) => c.custom);
        FF.set({ iCase: i });
      }
      resetCase();
    });
    const applyEdit = () => {
      const old = customCase() || { A: [], B: [], pairs: [] };
      const A = uniq($('in-edit-a').value.split(';').map((t) => t.trim()).filter(Boolean)).slice(0, 7);
      const B = uniq($('in-edit-b').value.split(';').map((t) => t.trim()).filter(Boolean)).slice(0, 7);
      if (!A.length || !B.length) return;
      saveCustom({ A, B, pairs: old.pairs.filter(([a, b]) => A.includes(a) && B.includes(b)) });
      resetCase();
    };
    $('in-edit-a').addEventListener('change', applyEdit);
    $('in-edit-b').addEventListener('change', applyEdit);
    $('insp-edit-done').addEventListener('click', () => { editing = false; resetCase(); });
    $('insp-edit-clear').addEventListener('click', () => {
      const c = customCase();
      if (c) { saveCustom(Object.assign({}, c, { pairs: [] })); resetCase(); }
    });

    $('insp-next').addEventListener('click', () => FF.insp.next());
    $('insp-prev').addEventListener('click', () => FF.insp.prev());
    $('insp-dots').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) go(Number(b.dataset.i)); });
    $('vote-yes').addEventListener('click', () => vote('yes'));
    $('vote-no').addEventListener('click', () => vote('no'));
    $('vote-conf').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-c]');
      const c = current();
      if (!b || scored[key(c)]) return;
      conf[key(c)] = conf[key(c)] === b.dataset.c ? undefined : b.dataset.c;
      syncVote();
    });

    const svg = $('insp-svg');
    svg.addEventListener('click', (e) => {
      if (!editing || FF.state.iMode !== 'diag') return;
      const ga = e.target.closest('[data-a]'), gb = e.target.closest('[data-b]');
      const c = customCase();
      if (!c) return;
      if (ga) { selA = Number(ga.dataset.a); draw(); return; }
      if (gb && selA >= 0) {
        const a = c.A[selA], b = c.B[Number(gb.dataset.b)];
        const k = c.pairs.findIndex((p) => p[0] === a && p[1] === b);
        if (k >= 0) c.pairs.splice(k, 1); else c.pairs.push([a, b]);
        saveCustom(c);
        step = 0;
        draw(); narrate();
      }
    });
    // Arrastar a reta vertical
    let dragging = false;
    const move = (e) => {
      if (FF.state.iMode !== 'graf' || step < 1) return;
      const c = current();
      const [x0, x1, y0, y1] = win(c);
      const W = PX1 - PX0, H = 436;
      const sc = Math.min(W / (x1 - x0), H / (y1 - y0));
      const ox = PX0 + (W - (x1 - x0) * sc) / 2;
      const p = svgPoint(e);
      let x = x0 + (p.x - ox) / sc;
      x = Math.max(x0, Math.min(x1, Math.round(x * 10) / 10));
      lineX = x;
      draw();
    };
    svg.addEventListener('pointerdown', (e) => {
      if (FF.state.iMode !== 'graf' || step < 1 || tw) return;
      dragging = true;
      svg.setPointerCapture(e.pointerId);
      move(e);
    });
    svg.addEventListener('pointermove', (e) => { if (dragging) move(e); });
    svg.addEventListener('pointerup', () => { dragging = false; });
    svg.addEventListener('pointercancel', () => { dragging = false; });
  }
  function vote(v) {
    const c = current();
    if (scored[key(c)]) return; // depois do veredito, o voto fica fechado
    votes[key(c)] = votes[key(c)] === v ? undefined : v;
    syncVote();
  }

  FF.insp = {
    init() { bind(); syncBar(); resetCase(); },
    render() { step = Math.min(step, stages().length - 1); syncBar(); draw(); narrate(); },
    next() {
      const st = stages();
      if (step < st.length - 1) go(step + 1);
      else if (!editing) setCase(FF.state.iCase + 1); // fim do caso: chega o próximo produto
    },
    prev() { if (step > 0) go(step - 1); },
    first() { go(0); },
    replay() { const s = step; if (s > 0) { go(s - 1); go(s); } },
    newRound() { if (FF.state.iMode !== 'graf') $('insp-random').click(); },
    atEnd() { return step === stages().length - 1; },
    hasBack() { return step > 0; },
    step() { return step; },
    /* Para o modo apresentador: o caso e o veredito certo */
    snap() { const c = current(); return c ? { title: c.title, fn: isFn(c), step, n: stages().length } : null; },
    goStep(i) { go(i); },
    /* Abre um caso pelo título (usado pelas aulas). */
    open(mode, title) {
      editing = false;
      FF.set({ iMode: mode });
      const i = Math.max(0, cases().findIndex((c) => c.title === title));
      FF.set({ iCase: i });
      resetCase();
    },
  };
})();
