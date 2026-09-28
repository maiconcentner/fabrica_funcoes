/* A fábrica: depósito de entrada (A), máquina com engrenagens, depósito de saída (B).
   Cada produto anda um passo por clique; nada começa sozinho. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);

  const G = {
    W: 1000, H: 470,
    belt: 352, ph: 52,
    aX0: 12, aX1: 176, bX0: 824, bX1: 988, cx: 500, dY0: 60, dY1: 424,
    mX0: 280, mX1: 720, mY0: 118, mY1: 424,
    wX0: 298, wX1: 702, wY0: 138, wY1: 290,
    gearY: 196, plateY: 262,
  };
  const PY = G.belt - G.ph / 2;
  const P = {
    loadF: 228, doorF: 266, enterF: 336, screen: 500, exitF: 772, doorB: 806,
    loadR: 772, doorR: 734, enterR: 664, exitR: 228, doorA: 194,
  };

  const prod = (FF.prod = { records: [], run: null, queue: [] });
  let anim = null;       // { from, to, t }
  let tw = null;
  let playing = false;
  let playTimer = 0;
  let beltPhase = 0;

  /* ---------- Depósitos ---------- */
  function depotA() {
    const L = FF.law();
    const items = FF.inputList();
    if (L.dom.type !== 'set') {
      prod.records.forEach((r) => { if (!items.some((v) => same(v, r.x))) items.push(r.x); });
    }
    return items.slice(-12);
  }
  function depotB() {
    const L = FF.law();
    if (L.cd.type === 'set') return L.cd.vals.slice(0, 12);
    const ys = [];
    prod.records.forEach((r) => { if (!ys.some((v) => same(v, r.y))) ys.push(r.y); });
    return ys.slice(-12);
  }
  function same(a, b) { return Math.abs(a - b) < 1e-9; }
  function slot(side, i) {
    const x0 = side === 'A' ? G.aX0 : G.bX0;
    const w = G.aX1 - G.aX0;
    return { x: x0 + (i % 2 === 0 ? w / 4 : (3 * w) / 4), y: 134 + Math.floor(i / 2) * 48 };
  }
  function slotOf(side, v) {
    const items = side === 'A' ? depotA() : depotB();
    const i = items.findIndex((w) => same(w, v));
    return i < 0 ? null : slot(side, i);
  }

  /* ---------- Montagem dos passos de um produto ---------- */
  function gearXs(n) {
    const w = G.wX1 - G.wX0 - 20;
    return Array.from({ length: n }, (_, i) => G.wX0 + 10 + ((i + 0.5) * w) / n);
  }

  function buildRun(v, dir) {
    const L = FF.law();
    const S = FF.state;
    const c = FF.ctx();
    const vin = L.vin;
    const out = FF.outName();
    const st = [];
    const run = { dir, v, stages: st, i: 0 };
    const domTxt = X.setLabel(L.dom, vin);

    if (dir === 'fwd') {
      const origin = slotOf('A', v) || { x: -60, y: PY };
      st.push({ k: 'load', pos: { x: P.loadF, y: PY }, origin, vals: [v], kind: 'in',
        title: 'Produto na esteira',
        html: 'Vai entrar na fábrica <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b>' + (c.inUnit ? ' (' + (c.inName || '') + ' de ' + FF.fmtIn(v) + ')' : '') + '. Avance para a máquina trabalhar.' });
      if (!X.inSet(L.dom, v)) {
        st.push({ k: 'door', pos: { x: P.doorF, y: PY }, vals: [v], kind: 'bad', bad: true,
          title: 'Barrado na entrada!',
          html: '<b>' + FF.fmt(v) + '</b> não pertence ao <b>domínio</b> (' + domTxt + '). Só entra na máquina o que está no domínio.' });
        return run;
      }
      st.push({ k: 'enter', pos: { x: P.enterF, y: PY }, vals: [v], kind: 'in',
        check: !S.black && L.kind === 'expr' && (L.chain || L.plan) ? [X.subst(L.ast, v)] : null, checkTitle: 'Na lei, é como trocar ' + vin + ' por ' + FF.fmt(v) + ':',
        title: 'Entrou na máquina', html: 'A máquina recebe <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b>.' + (S.black ? ' Ninguém vê o que acontece lá dentro…' : '') });
      let y = null;
      if (S.black || S.predict || L.kind === 'error') {
        const r = FF.evalLaw(v, L);
        if (r.error) {
          st.push({ k: 'process', pos: { x: P.screen, y: PY }, vals: [v], kind: 'bad', bad: true,
            title: 'A máquina travou!', html: r.error + ' Então <b>' + FF.fmt(v) + '</b> não pode entrar: está fora do domínio desta lei.' });
          return run;
        }
        y = r.y;
        st.push(S.predict && !S.black
          ? { k: 'process', pos: { x: P.screen, y: PY }, vals: [y], kind: 'hid',
            title: 'A máquina está trabalhando…',
            html: 'Não dá para ver lá dentro. Use a <b>lei no letreiro</b> e calcule: quanto vai sair para <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b>?' }
          : { k: 'process', pos: { x: P.screen, y: PY }, vals: [y], kind: 'out',
            title: 'Processando…', html: 'A máquina trabalhou em segredo e o produto saiu transformado.' });
      } else if (L.kind === 'expr' && L.chain) {
        const xs = gearXs(L.chain.length);
        let cur = v;
        for (let i = 0; i < L.chain.length; i++) {
          const g = L.chain[i];
          try {
            const r = X.gearApply(g, cur, false);
            st.push({ k: 'gear', gi: i, pos: { x: xs[i], y: PY }, vals: [r], kind: i === L.chain.length - 1 ? 'out' : 'mid',
              title: 'Engrenagem ' + (i + 1) + ' de ' + L.chain.length + ':  ' + X.gearLabel(g),
              html: 'A engrenagem <b>' + X.gearLabel(g) + '</b> ' + X.gearSentence(g, cur, r) + '.' });
            cur = r;
          } catch (e) {
            if (!(e instanceof X.DomainError)) throw e;
            st.push({ k: 'gear', gi: i, pos: { x: xs[i], y: PY }, vals: [cur], kind: 'bad', bad: true,
              title: 'A engrenagem ' + X.gearLabel(g) + ' travou!',
              html: e.message + ' Por isso <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b> fica <b>fora do domínio</b>: a lei não calcula nada para ele.' });
            return run;
          }
        }
        y = cur;
      } else if (L.kind === 'expr' && L.plan) {
        layoutPlan(L);
        const tokens = { r: { x: P.enterF, y: PY, vals: [v], kind: 'in' } };
        const snap = () => Object.keys(tokens).map((id) => Object.assign({ id }, tokens[id]));
        const STOP = {};
        const who = (id) => (id.length < 2 ? '' : id.endsWith('L') ? 'Na cópia de cima, a' : 'Na cópia de baixo, a');
        const runPipe = (p, id, val) => {
          p.forEach((g) => {
            if (g.type === 'gear') {
              let r;
              try { r = X.gearApply(g, val, false); } catch (e) {
                if (!(e instanceof X.DomainError)) throw e;
                tokens[id] = { x: g.x, y: g.y, vals: [val], kind: 'bad', tiny: true };
                st.push({ k: 'gear', node: g, tokens: snap(), bad: true, vals: [val], kind: 'bad',
                  title: 'A engrenagem ' + X.gearLabel(g) + ' travou!',
                  html: e.message + ' Por isso <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b> fica <b>fora do domínio</b>: a lei não calcula nada para ele.' });
                throw STOP;
              }
              tokens[id] = { x: g.x, y: g.y, vals: [r], kind: 'mid', tiny: true };
              const w = who(id);
              st.push({ k: 'gear', node: g, tokens: snap(), vals: [r], kind: 'mid',
                title: 'Engrenagem ' + X.gearLabel(g),
                html: (w || 'A') + ' engrenagem <b>' + X.gearLabel(g) + '</b> ' + X.gearSentence(g, val, r) + '.' });
              val = r;
            } else {
              delete tokens[id];
              // As cópias saem da copiadora (via) e vão para o começo de cada ramo.
              tokens[id + 'L'] = { x: g.cx, y: g.Ly, vals: [val], kind: 'in', tiny: true, via: [[g.sx, g.sy]] };
              tokens[id + 'R'] = { x: g.cx, y: g.Ry, vals: [val], kind: 'in', tiny: true, via: [[g.sx, g.sy]] };
              st.push({ k: 'split', node: g, tokens: snap(), vals: [val], kind: 'in',
                title: 'Copiadora: duas cópias de ' + FF.fmt(val),
                html: 'Na lei, <i>' + vin + '</i> aparece mais de uma vez. A copiadora faz <b>duas cópias</b> de <b>' + FF.fmt(val) + '</b>: cada uma segue pelo seu caminho e, no fim, a junção <b>' + X.joinLabel(g.op) + '</b> une as duas.' });
              delete tokens[id + 'L'].via; delete tokens[id + 'R'].via;
              const a = runPipe(g.L, id + 'L', val);
              const b = runPipe(g.R, id + 'R', val);
              delete tokens[id + 'L']; delete tokens[id + 'R'];
              let r;
              try { r = X.joinApply(g.op, a, b); } catch (e) {
                if (!(e instanceof X.DomainError)) throw e;
                tokens[id] = { x: g.jx, y: g.jy, vals: [a, b], kind: 'bad', tiny: true };
                st.push({ k: 'gear', node: g, tokens: snap(), bad: true, vals: [a], kind: 'bad',
                  title: 'A junção ' + X.joinLabel(g.op) + ' travou!',
                  html: 'A cópia de baixo chegou valendo 0. ' + e.message + ' Por isso <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b> fica <b>fora do domínio</b>.' });
                throw STOP;
              }
              tokens[id] = { x: g.jx, y: g.jy, vals: [r], kind: 'mid', tiny: true };
              st.push({ k: 'gear', node: g, tokens: snap(), vals: [r], kind: 'mid',
                title: 'Junção ' + X.joinLabel(g.op),
                html: (who(id) || 'A') + ' junção <b>' + X.joinLabel(g.op) + '</b> ' + X.joinSentence(g.op, a, b, r) + '.' });
              val = r;
            }
          });
          return val;
        };
        try { y = runPipe(L.plan, 'r', v); } catch (e) { if (e === STOP) return run; throw e; }
        const last = st[st.length - 1];
        if (last && last.tokens) last.tokens.forEach((t) => { t.kind = 'out'; });
        if (last) last.kind = 'out';
      } else {
        let ast = L.ast;
        if (L.kind === 'piece') {
          const pi = X.findPiece(L, v);
          if (pi < 0) {
            st.push({ k: 'process', pos: { x: P.screen, y: PY }, vals: [v], kind: 'bad', bad: true, title: 'Sem faixa', html: 'Esse valor não está em nenhuma faixa da tarifa.' });
            return run;
          }
          ast = L.pieces[pi].ast;
          st.push({ k: 'faixa', piece: pi, pos: { x: P.screen, y: PY }, vals: [v], kind: 'in', node: ast,
            title: 'Qual é a faixa?',
            html: FF.fmtIn(v) + ' está na faixa <b>' + L.pieces[pi].label + '</b>. A conta dessa faixa é:' });
        }
        const s = X.steps(ast, v);
        st.push({ k: 'subst', pos: { x: P.screen, y: PY }, vals: [v], kind: 'in', node: s.list[0],
          title: 'Trocar ' + vin + ' por ' + FF.fmt(v), html: 'A máquina coloca <b>' + FF.fmt(v) + '</b> no lugar de <i>' + vin + '</i>:' });
        for (let j = 1; j < s.list.length; j++) {
          const last = j === s.list.length - 1;
          st.push({ k: 'calc', pos: { x: P.screen, y: PY }, vals: [last ? s.list[j].v : v], kind: last ? 'out' : 'in', node: s.list[j],
            title: last ? 'Resultado' : 'Calculando', html: last ? 'A conta terminou:' : 'Primeiro as potências e raízes, depois multiplicações e divisões, por fim somas e subtrações:' });
        }
        if (s.error) {
          st.push({ k: 'calc', pos: { x: P.screen, y: PY }, vals: [v], kind: 'bad', bad: true, node: s.bad,
            title: 'A máquina travou!',
            html: s.error.message + ' Por isso <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b> fica <b>fora do domínio</b>.' });
          return run;
        }
        y = s.value;
      }
      if (S.predict) {
        st.push({ k: 'guess', pos: { x: P.exitF, y: PY }, vals: [y], kind: 'hid',
          title: 'Qual é a saída?', html: 'Faça a sua previsão: que valor vai sair para <b><i>' + vin + '</i> = ' + FF.fmt(v) + '</b>? Avance para conferir.' });
      }
      if (!X.inSet(L.cd, y)) {
        st.push({ k: 'cdbad', pos: { x: P.doorB, y: PY }, vals: [y], kind: 'bad', bad: true,
          title: 'Não cabe no depósito B!',
          html: 'Saiu <b>' + FF.fmt(y) + '</b>, que não está no <b>contradomínio</b> B = ' + X.setLabel(L.cd) + '. Com esse B, a lei não define uma função de A em B: todo elemento de A precisa ter imagem em B.' });
        return run;
      }
      const again = prod.records.some((r) => same(r.x, v));
      const pair = '(' + FF.fmt(v) + '; ' + FF.fmt(y) + ')';
      const fx = c.id === 'livre' ? 'f(' + FF.fmt(v) + ') = ' + FF.fmt(y) : out + ' = ' + FF.fmtOutNum(y);
      let html = '<span class="mathline">' + fx + '</span>' +
        (c.id !== 'livre' ? cap(c.inName) + ' de ' + FF.fmtIn(v) + ' → ' + c.outName + ' de <b>' + FF.fmtOut(y) + '</b>. ' : '') +
        'Par ordenado <b>' + pair + '</b>.';
      if (again) html += ' <br><b>Esse valor já tinha entrado antes</b> e saiu o mesmo resultado: numa função, cada entrada tem <b>uma única</b> saída.';
      let check = null;
      if (!S.black && L.kind !== 'error') {
        const ast = L.kind === 'piece' ? L.pieces[X.findPiece(L, v)].ast : L.ast;
        check = X.steps(ast, v).list;
      }
      st.push({ k: 'deliver', side: 'B', vals: [y], kind: 'out', rec: [{ x: v, y }], again, check,
        title: X.isApprox(y) ? 'Saiu o produto (≈)' : 'Saiu o produto!', html });
      run.y = y;
      return run;
    }

    /* ----- Máquina ao contrário ----- */
    const origin = slotOf('B', v) || { x: 1060, y: PY };
    st.push({ k: 'load', pos: { x: P.loadR, y: PY }, origin, vals: [v], kind: 'out',
      title: 'Máquina ao contrário',
      html: 'Sabemos a saída <b>' + (c.id === 'livre' ? 'f(x)' : out) + ' = ' + FF.fmtOut(v) + '</b>. Qual entrada produz isso? A esteira anda para trás e cada engrenagem <b>desfaz</b> o que fazia.' });
    st.push({ k: 'enter', pos: { x: P.enterR, y: PY }, vals: [v], kind: 'out', title: 'Entrou pelo fim da linha', html: 'A última engrenagem é a primeira a ser desfeita.' });
    let vals = [v];
    if (S.black || S.predict) {
      try {
        vals = L.chain.slice().reverse().reduce((acc, g) => acc.flatMap((w) => [].concat(X.gearApply(g, w, true))), [v]);
      } catch (e) {
        if (!(e instanceof X.DomainError)) throw e;
        st.push({ k: 'process', pos: { x: P.screen, y: PY }, vals: [v], kind: 'bad', bad: true, title: 'Nenhuma entrada serve!',
          html: e.message + ' <b>' + FF.fmt(v) + '</b> não é imagem de nenhum valor.' });
        return run;
      }
      st.push({ k: 'process', pos: { x: P.screen, y: PY }, vals, kind: S.black ? 'in' : 'hid', title: 'Desfazendo em segredo…',
        html: S.black ? 'A máquina desfez as contas sem mostrar como.' : 'Não dá para ver lá dentro. Use a <b>lei no letreiro</b>: que entrada produz essa saída?' });
    } else {
      const xs = gearXs(L.chain.length);
      for (let i = L.chain.length - 1; i >= 0; i--) {
        const g = L.chain[i];
        try {
          const before = vals;
          vals = vals.flatMap((w) => [].concat(X.gearApply(g, w, true)));
          vals = vals.filter((w, j) => vals.findIndex((u) => same(u, w)) === j);
          const txt = before.map((w, j) => X.gearSentence(g, w, [].concat(X.gearApply(g, w, true)), true) + (j < before.length - 1 ? '; ' : '')).join('');
          st.push({ k: 'gear', gi: i, inv: true, pos: { x: xs[i], y: PY }, vals, kind: i === 0 ? 'in' : 'mid',
            title: 'Desfazendo ' + X.gearLabel(g) + ' com ' + X.gearLabel(g, true),
            html: 'Para desfazer <b>' + X.gearLabel(g) + '</b>, a engrenagem faz <b>' + X.gearLabel(g, true) + '</b>: ' + txt + '.' +
              (X.gearLabel(g) === X.gearLabel(g, true) ? ' Essa engrenagem desfaz a si mesma: repetir a conta volta ao valor anterior.' : '') +
              (vals.length > 1 ? ' <b>Dois números servem!</b> Entradas diferentes podem ter a mesma saída.' : '') });
        } catch (e) {
          if (!(e instanceof X.DomainError)) throw e;
          st.push({ k: 'gear', gi: i, inv: true, pos: { x: xs[i], y: PY }, vals, kind: 'bad', bad: true,
            title: 'Não dá para desfazer!',
            html: e.message + ' Então <b>' + FF.fmtOut(v) + '</b> não é imagem de nenhum valor: não pertence ao conjunto imagem.' });
          return run;
        }
      }
    }
    const okX = vals.filter((w) => X.inSet(L.dom, w));
    if (!okX.length) {
      st.push({ k: 'dombad', pos: { x: P.doorA, y: PY }, vals, kind: 'bad', bad: true, title: 'Fora do domínio',
        html: 'A conta dá <b>' + vals.map((w) => FF.fmt(w)).join(' ou ') + '</b>, mas isso não pertence ao domínio (' + domTxt + '). Então ' + FF.fmtOut(v) + ' não é imagem de nenhum elemento do domínio.' });
      return run;
    }
    if (S.predict) {
      st.push({ k: 'guess', pos: { x: P.exitR, y: PY }, vals: okX, kind: 'hid', title: 'Qual é a entrada?', html: 'Faça a sua previsão: que entrada produz essa saída? Avance para conferir.' });
    }
    const note = okX.length < vals.length ? ' (' + vals.filter((w) => !okX.includes(w)).map((w) => FF.fmt(w)).join(', ') + ' ficou de fora: não está no domínio)' : '';
    st.push({ k: 'deliver', side: 'A', vals: okX, kind: 'in', rec: okX.map((w) => ({ x: w, y: v })),
      title: 'Encontramos a entrada!',
      html: '<span class="mathline"><i>' + vin + '</i> = ' + okX.map((w) => FF.fmt(w)).join(' ou <i>' + vin + '</i> = ') + '</span>' +
        (c.id !== 'livre' ? cap(c.outName) + ' de ' + FF.fmtOut(v) + ' ← ' + c.inName + ' de <b>' + okX.map(FF.fmtIn).join(' ou ') + '</b>. ' : '') +
        'Confira indo para a frente: ' + okX.map((w) => (c.id === 'livre' ? 'f(' + FF.fmt(w) + ')' : out) + ' = ' + FF.fmt(FF.evalLaw(w).y)).join('; ') + '.' + note });
    return run;
  }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

  /* ---------- Registro da produção ---------- */
  function syncMade() {
    FF.set({ made: prod.records.map((r) => r.x).join(';') });
    if (FF.reps) FF.reps.render();
  }
  function enterStage(stage) {
    if (stage.k !== 'deliver') return;
    stage.added = [];
    stage.rec.forEach((r) => {
      if (prod.records.some((o) => same(o.x, r.x))) return;
      const L = FF.law();
      const rec = Object.assign({ dir: prod.run.dir }, r);
      rec.calc = calcNode(r.x, L);
      prod.records.push(rec);
      stage.added.push(rec);
    });
    syncMade();
  }
  function leaveStage(stage) {
    if (stage.k !== 'deliver' || !stage.added) return;
    stage.added.forEach((rec) => {
      const i = prod.records.indexOf(rec);
      if (i >= 0) prod.records.splice(i, 1);
    });
    stage.added = [];
    syncMade();
  }
  function calcNode(x, L) {
    if (L.kind === 'expr') return X.subst(L.ast, x);
    if (L.kind === 'piece') {
      const i = X.findPiece(L, x);
      return i < 0 ? null : X.subst(L.pieces[i].ast, x);
    }
    return null;
  }
  FF.calcNode = calcNode;

  /* Recria a produção guardada (ao abrir de novo ou por link). */
  function restore() {
    prod.records = [];
    prod.run = null;
    const L = FF.law();
    if (L.kind === 'error') return;
    FF.state.made.split(';').map(X.parseNumber).filter((v) => !isNaN(v)).forEach((x) => {
      if (prod.records.some((r) => same(r.x, x)) || !X.inSet(L.dom, x)) return;
      const r = FF.evalLaw(x, L);
      if (r.error || !X.inSet(L.cd, r.y)) return;
      prod.records.push({ x, y: r.y, dir: 'fwd', calc: calcNode(x, L) });
    });
  }

  /* ---------- Navegação ---------- */
  function dur(base) { return ((base || 700) / FF.state.speed) * (playing ? 0.7 : 1); }

  function go(to) {
    const run = prod.run;
    if (!run || to < 0 || to >= run.stages.length || to === run.i) return;
    if (tw) tw.cancel();
    const from = run.i;
    if (to < from) leaveStage(run.stages[from]);
    run.i = to;
    if (to > from) enterStage(run.stages[to]);
    anim = { from, to, t: 0 };
    const stage = run.stages[Math.max(from, to)];
    const long = stage.k === 'deliver' || stage.k === 'load' ? 900 : stage.k === 'gear' ? 1000 : 750;
    tw = FF.tween(dur(long), (t) => { anim.t = t; beltPhase += 1; draw(); }, () => { anim = null; tw = null; draw(); schedule(); });
    narrate();
  }

  FF.fab = {
    load(v, dir, keepPlay) {
      if (!keepPlay) stopPlay(true);
      if (tw) { tw.cancel(); tw = null; }
      const L = FF.law();
      if (L.kind === 'error') return;
      if (dir === 'rev' && !FF.canReverse(L)) return;
      prod.run = buildRun(v, dir || 'fwd');
      anim = { from: -1, to: 0, t: 0 };
      tw = FF.tween(dur(800), (t) => { anim.t = t; beltPhase += 1; draw(); }, () => { anim = null; tw = null; draw(); schedule(); });
      narrate();
    },
    next() {
      const run = prod.run;
      if (run && run.i < run.stages.length - 1) { go(run.i + 1); return; }
      const nxt = prod.queue.length ? prod.queue.shift() : nextInput();
      if (nxt != null) FF.fab.load(nxt, 'fwd', true);
      else stopPlay(true);
    },
    prev() {
      stopPlay(true);
      const run = prod.run;
      if (!run) return;
      if (run.i > 0) { go(run.i - 1); return; }
      if (tw) tw.cancel();
      prod.run = null; anim = null;
      draw(); narrate();
    },
    first() {
      stopPlay(true);
      const run = prod.run;
      if (!run) return;
      if (tw) tw.cancel();
      for (let i = run.i; i > 0; i--) leaveStage(run.stages[i]);
      run.i = 0; anim = null;
      draw(); narrate();
    },
    replay() {
      const run = prod.run;
      if (!run) return;
      if (tw) tw.cancel();
      const to = run.i;
      anim = { from: Math.max(-1, to - 1), to, t: 0 };
      if (to === 0) anim.from = -1;
      tw = FF.tween(dur(900), (t) => { anim.t = t; beltPhase += 1; draw(); }, () => { anim = null; tw = null; draw(); });
    },
    batch() {
      const L = FF.law();
      if (L.kind === 'error') return;
      prod.queue = FF.inputList().filter((v) => !prod.records.some((r) => same(r.x, v)));
      if (prod.run && prod.run.i < prod.run.stages.length - 1) {
        prod.queue = prod.queue.filter((v) => !same(v, prod.run.v));
      } else if (prod.queue.length) {
        FF.fab.load(prod.queue.shift(), 'fwd', true);
      }
      startPlay();
    },
    togglePlay() {
      if (playing) { stopPlay(true); return; }
      if (!prod.run || prod.run.i === prod.run.stages.length - 1) FF.fab.next();
      startPlay();
    },
    clear() {
      stopPlay(true);
      if (tw) { tw.cancel(); tw = null; }
      prod.records = []; prod.run = null; prod.queue = []; anim = null;
      syncMade();
      draw(); narrate();
    },
    reset() { // lei ou conjuntos mudaram
      stopPlay(true);
      if (tw) { tw.cancel(); tw = null; }
      anim = null; prod.queue = [];
      restore();
      draw(); narrate();
      if (FF.reps) FF.reps.render();
    },
    render() { draw(); narrate(); },
    isPlaying() { return playing; },
    init,
  };

  function nextInput() {
    const list = FF.inputList();
    const done = (v) => prod.records.some((r) => same(r.x, v));
    const cur = prod.run ? prod.run.v : null;
    let start = 0;
    if (cur != null && prod.run.dir === 'fwd') {
      const i = list.findIndex((v) => same(v, cur));
      start = i + 1;
    }
    for (let k = 0; k < list.length; k++) {
      const v = list[(start + k) % list.length];
      if (!done(v) && !(cur != null && same(v, cur))) return v;
    }
    return null;
  }

  function schedule() {
    if (!playing) return;
    clearTimeout(playTimer);
    playTimer = setTimeout(() => {
      if (!playing) return;
      const run = prod.run;
      const atEnd = !run || run.i >= run.stages.length - 1;
      if (atEnd && !prod.queue.length) { stopPlay(true); return; }
      FF.fab.next();
    }, 450 / FF.state.speed);
  }
  function startPlay() { playing = true; syncPlayBtn(); if (!tw) schedule(); }
  function stopPlay(clearQueue) {
    playing = false;
    clearTimeout(playTimer);
    if (clearQueue) prod.queue = [];
    syncPlayBtn();
  }
  function syncPlayBtn() {
    const b = $('fab-play');
    if (b) { b.classList.toggle('playing', playing); b.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir este produto até o fim'); }
  }

  /* ---------- Desenho ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const r1 = (v) => Math.round(v * 10) / 10;

  function gearPath(R, teeth) {
    const rIn = R * 0.8, pts = [];
    const n = teeth * 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = i % 4 === 0 || i % 4 === 1 ? R : rIn;
      pts.push(r1(Math.cos(a) * rr) + ' ' + r1(Math.sin(a) * rr));
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  function boxSVG(cx, cy, vals, kind, opts) {
    opts = opts || {};
    const c = FF.ctx();
    const big = !opts.small && !opts.tiny;
    const h = big ? G.ph : opts.tiny ? 32 : 40;
    const fs = big ? 21 : opts.tiny ? 15 : 16;
    const unit = !big ? '' : kind === 'in' ? c.inUnit : kind === 'out' ? (c.money ? 'R$' : c.outUnit) : '';
    const label = (v) => (kind === 'hid' ? '?' : kind === 'out' ? FF.fmtOutNum(v) : FF.fmt(v));
    const ws = vals.map((v) => Math.max(big ? 64 : opts.tiny ? 44 : 58, FF.math.textWidth(label(v), fs) + (opts.tiny ? 16 : 22)));
    const gap = 8;
    const total = ws.reduce((a, b) => a + b, 0) + gap * (vals.length - 1);
    let x = cx - total / 2;
    let out = '';
    vals.forEach((v, i) => {
      const w = ws[i];
      const cls = 'box box-' + kind + (opts.cls ? ' ' + opts.cls : '');
      out += '<g class="' + cls + '">' +
        '<rect x="' + r1(x) + '" y="' + r1(cy - h / 2) + '" width="' + r1(w) + '" height="' + h + '" rx="7"/>' +
        '<path class="box-tape" d="M' + r1(x + w / 2 - 6) + ' ' + r1(cy - h / 2) + ' h12 v6 h-12 Z"/>' +
        '<text class="box-v" x="' + r1(x + w / 2) + '" y="' + r1(cy + (unit ? 3 : 7)) + '" font-size="' + fs + '" text-anchor="middle">' + esc(label(v)) + '</text>' +
        (unit ? '<text class="box-u" x="' + r1(x + w / 2) + '" y="' + r1(cy + h / 2 - 6) + '" font-size="' + (big ? 12 : 10.5) + '" text-anchor="middle">' + esc(unit) + '</text>' : '') +
        (opts.check ? '<text class="box-check" x="' + r1(x + w - 4) + '" y="' + r1(cy - h / 2 + 2) + '" font-size="15" text-anchor="middle">✓</text>' : '') +
        (big && c.icon && kind === 'in' ? '<text x="' + r1(x - 2) + '" y="' + r1(cy - h / 2 + 6) + '" font-size="17" text-anchor="middle">' + c.icon + '</text>' : '') +
        '</g>';
      x += w + gap;
    });
    return out;
  }

  function depotSVG(side, hide) {
    const L = FF.law();
    const c = FF.ctx();
    const x0 = side === 'A' ? G.aX0 : G.bX0;
    const x1 = side === 'A' ? G.aX1 : G.bX1;
    const cx = (x0 + x1) / 2;
    const items = side === 'A' ? depotA() : depotB();
    const set = side === 'A' ? L.dom : L.cd;
    const title = side === 'A' ? 'A · Entrada' : 'B · Saída';
    const sub = side === 'A'
      ? (c.id === 'livre' ? 'valores de ' + L.vin : c.inName + (c.inUnit ? ' (' + c.inUnit + ')' : ''))
      : (c.id === 'livre' ? 'valores de f(x)' : c.outName + (c.outUnit ? ' (' + c.outUnit + ')' : ''));
    let s = '<g class="depot depot-' + side + '">' +
      '<rect class="depot-body" x="' + x0 + '" y="' + G.dY0 + '" width="' + (x1 - x0) + '" height="' + (G.dY1 - G.dY0) + '" rx="14"/>' +
      '<text class="depot-title" x="' + cx + '" y="' + (G.dY0 + 24) + '" text-anchor="middle">' + title + '</text>' +
      '<text class="depot-sub" x="' + cx + '" y="' + (G.dY0 + 43) + '" text-anchor="middle">' + esc(sub) + '</text>';
    if (!items.length) {
      s += '<text class="depot-empty" x="' + cx + '" y="' + (G.dY0 + 170) + '" text-anchor="middle">' + (side === 'A' ? 'digite um valor' : 'ainda vazio') + '</text>';
    }
    const done = side === 'A' ? (v) => prod.records.some((r) => same(r.x, v)) : (v) => prod.records.some((r) => same(r.y, v));
    items.forEach((v, i) => {
      const p = slot(side, i);
      if (hide && hide.some((w) => same(w, v))) {
        // O produto ainda está a caminho: mostra só a vaga (se ela já existia).
        const isStatic = side === 'A' ? FF.inputList().some((w) => same(w, v)) : set.type === 'set';
        if (isStatic) {
          s += '<g class="clickable" data-side="' + side + '" data-v="' + v + '">' + boxSVG(p.x, p.y, [v], side === 'A' ? 'in' : 'slot', { small: true }) + '</g>';
        }
        return;
      }
      const isDone = done(v);
      let kind;
      if (side === 'A') kind = 'in';
      else kind = set.type === 'set' && !isDone ? 'slot' : 'out';
      const fresh = prod.run && prod.run.stages[prod.run.i].k === 'deliver' && prod.run.stages[prod.run.i].vals.some((w) => same(w, v)) && prod.run.stages[prod.run.i].side === side;
      s += '<g class="clickable" data-side="' + side + '" data-v="' + v + '">' +
        boxSVG(p.x, p.y, [v], kind, { small: true, check: side === 'A' && isDone, cls: (isDone && side === 'A' ? 'done' : '') + (fresh ? ' fresh' : '') }) + '</g>';
    });
    if (set.type !== 'R') {
      s += '<text class="depot-set" x="' + cx + '" y="' + (G.dY1 - 12) + '" text-anchor="middle">' + (side === 'A' ? 'D' : 'CD') + ' = ' + esc(X.setLabel(set, L.vin).replace(/<[^>]+>/g, '')) + '</text>';
    }
    return s + '</g>';
  }

  function beltSVG(x0, x1, moving, dirSign) {
    const y = G.belt;
    const off = moving ? r1(((beltPhase * 1.6 * dirSign) % 24 + 24) % 24) : 0;
    let s = '<g class="belt"><rect class="belt-body" x="' + x0 + '" y="' + y + '" width="' + (x1 - x0) + '" height="16" rx="8"/>' +
      '<line class="belt-top" x1="' + (x0 + 6) + '" y1="' + (y + 3) + '" x2="' + (x1 - 6) + '" y2="' + (y + 3) + '" stroke-dashoffset="' + off + '"/>';
    for (let x = x0 + 12; x < x1 - 6; x += 24) s += '<circle class="roller" cx="' + x + '" cy="' + (y + 9) + '" r="4"/>';
    return s + '</g>';
  }

  function signSVG(L, S) {
    const c = FF.ctx();
    const prefix = c.id === 'livre' ? 'f(' + L.vin + ') = ' : c.vout + ' = ';
    let inner;
    let w = 300;
    if (S.black) {
      inner = '<text class="sign-text" x="' + G.cx + '" y="' + 58 + '" text-anchor="middle" font-size="30">' + esc(prefix) + '?</text>';
      w = 220;
    } else if (L.kind === 'error') {
      inner = '<text class="sign-text bad" x="' + G.cx + '" y="56" text-anchor="middle" font-size="20">lei com erro</text>';
    } else if (L.kind === 'piece') {
      inner = '<text class="sign-text" x="' + G.cx + '" y="56" text-anchor="middle" font-size="24">' + esc(prefix) + '<tspan class="sign-plain">tarifa por faixas</tspan></text>';
      w = 360;
    } else {
      let size = 30;
      let d = FF.math.draw(L.ast, size, L.vin, G.cx, 46, prefix, 'sign-math');
      if (d.w > 400) { size = Math.max(16, size * 400 / d.w); d = FF.math.draw(L.ast, size, L.vin, G.cx, 46, prefix, 'sign-math'); }
      if (d.h > 64) { size = size * 64 / d.h; d = FF.math.draw(L.ast, size, L.vin, G.cx, 46, prefix, 'sign-math'); }
      inner = d.svg;
      w = Math.max(200, d.w + 44);
    }
    return '<g class="sign"><line class="sign-post" x1="' + (G.cx - w / 2 + 30) + '" y1="84" x2="' + (G.cx - w / 2 + 30) + '" y2="' + G.mY0 + '"/>' +
      '<line class="sign-post" x1="' + (G.cx + w / 2 - 30) + '" y1="84" x2="' + (G.cx + w / 2 - 30) + '" y2="' + G.mY0 + '"/>' +
      '<rect class="sign-board" x="' + r1(G.cx - w / 2) + '" y="6" width="' + r1(w) + '" height="80" rx="12"/>' + inner + '</g>';
  }

  function machineSVG(L, S, stage, t) {
    let s = '';
    // Telhado em dente de serra
    const teeth = 4, tw = (G.mX1 - G.mX0) / teeth;
    let roof = 'M' + G.mX0 + ' ' + G.mY0;
    for (let i = 0; i < teeth; i++) roof += ' L' + (G.mX0 + i * tw) + ' ' + (G.mY0 - 26) + ' L' + (G.mX0 + (i + 1) * tw) + ' ' + G.mY0;
    s += '<path class="roof" d="' + roof + ' Z"/>';
    const shake = (S.black || S.predict) && stage && stage.k === 'process' && anim && anim.t < 0.9 ? r1(Math.sin(anim.t * 60) * 2.5) : 0;
    s += '<g transform="translate(' + shake + ' 0)">';
    s += '<rect class="machine" x="' + G.mX0 + '" y="' + G.mY0 + '" width="' + (G.mX1 - G.mX0) + '" height="' + (G.mY1 - G.mY0) + '" rx="6"/>';
    s += '<rect class="window" x="' + G.wX0 + '" y="' + G.wY0 + '" width="' + (G.wX1 - G.wX0) + '" height="' + (G.belt + 20 - G.wY0) + '" rx="10"/>';
    // Portas
    s += '<rect class="door" x="' + (G.mX0 - 2) + '" y="' + (G.belt - 66) + '" width="22" height="84" rx="4"/>';
    s += '<rect class="door" x="' + (G.mX1 - 20) + '" y="' + (G.belt - 66) + '" width="22" height="84" rx="4"/>';
    // Lâmpadas
    const bad = stage && stage.bad && (!anim || anim.t > 0.5);
    const okLamp = stage && stage.k === 'deliver' && (!anim || anim.t > 0.5);
    s += '<circle class="lamp lamp-bad' + (bad ? ' on' : '') + '" cx="' + (G.mX1 - 26) + '" cy="' + (G.mY0 + 2) + '" r="7"/>';
    s += '<circle class="lamp lamp-ok' + (okLamp ? ' on' : '') + '" cx="' + (G.mX1 - 46) + '" cy="' + (G.mY0 + 2) + '" r="7"/>';
    // Esteira interna
    if (!(L.kind === 'expr' && L.plan && !S.black && !S.predict)) s += beltSVG(G.wX0 + 4, G.wX1 - 4, !!anim, prod.run && prod.run.dir === 'rev' ? -1 : 1);

    if (S.black || S.predict) {
      s += '<rect class="cover" x="' + G.wX0 + '" y="' + G.wY0 + '" width="' + (G.wX1 - G.wX0) + '" height="' + (G.belt - 68 - G.wY0) + '" rx="10"/>' +
        '<text class="cover-q" x="' + G.cx + '" y="' + (G.wY0 + 92) + '" text-anchor="middle">?</text>' +
        '<text class="cover-sub" x="' + G.cx + '" y="' + (G.wY0 + 124) + '" text-anchor="middle">' + (S.black ? 'caixa-preta' : 'faça a sua previsão') + '</text>';
    } else if (L.kind === 'expr' && L.chain) {
      const xs = gearXs(L.chain.length);
      const R = Math.min(40, (G.wX1 - G.wX0 - 20) / L.chain.length / 2 - 6);
      const run = prod.run;
      L.chain.forEach((g, i) => {
        const active = stage && stage.k === 'gear' && stage.gi === i;
        const inv = run && run.dir === 'rev';
        let rot = 0;
        if (active && anim) rot = (inv ? -1 : 1) * 200 * FF.ease(Math.max(0, (anim.t - 0.25) / 0.75));
        const teeth = Math.max(8, Math.round(R / 3.6));
        s += '<g class="gear' + (active ? ' active' : '') + (active && stage.bad ? ' jam' : '') + '" transform="translate(' + r1(xs[i]) + ' ' + G.gearY + ') rotate(' + r1(rot + i * 9) + ')">' +
          '<path d="' + gearPath(R, teeth) + '"/><circle class="gear-hole" r="' + r1(R * 0.28) + '"/></g>';
        const lab = X.gearLabel(g, inv);
        const fs = Math.min(20, Math.max(12, (xs[1] ? xs[1] - xs[0] : 200) / Math.max(4, lab.length) * 1.5));
        const pw = Math.max(R * 2, FF.math.textWidth(lab, fs) + 16);
        s += '<g class="plate' + (active ? ' active' : '') + (inv ? ' inv' : '') + '"><rect x="' + r1(xs[i] - pw / 2) + '" y="' + (G.plateY - 17) + '" width="' + r1(pw) + '" height="30" rx="6"/>' +
          '<text x="' + r1(xs[i]) + '" y="' + (G.plateY + 4) + '" text-anchor="middle" font-size="' + r1(fs) + '">' + esc(lab) + '</text></g>';
        if (i < L.chain.length - 1) {
          s += '<path class="gear-arrow" d="M' + r1(xs[i] + R + 4) + ' ' + G.gearY + ' L' + r1(xs[i + 1] - R - 4) + ' ' + G.gearY + '"/>';
        }
      });
    } else if (L.kind === 'expr' && L.plan) {
      s += planSVG(L, stage);
    } else if (L.kind === 'expr' || L.kind === 'piece') {
      // Tela de cálculo
      s += '<rect class="screen" x="' + (G.wX0 + 8) + '" y="' + (G.wY0 + 8) + '" width="' + (G.wX1 - G.wX0 - 16) + '" height="' + (G.belt - 80 - G.wY0) + '" rx="8"/>';
      let node = null;
      let caption = '';
      const stShow = stage && anim && anim.t < 0.5 && prod.run.stages[anim.from] ? prod.run.stages[anim.from] : stage;
      if (stShow && stShow.node) {
        node = stShow.node;
        if (stShow.k === 'faixa') caption = 'faixa: ' + L.pieces[stShow.piece].label;
      } else if (L.kind === 'expr') {
        node = L.ast;
        caption = 'lei da máquina';
      } else {
        caption = 'tarifa por faixas';
      }
      const midY = (G.wY0 + 8 + G.belt - 72) / 2 + 6;
      if (node) {
        const prefix = screenPrefix(stShow && stShow.node ? stShow : null, L);
        let size = 30;
        let d = FF.math.draw(node, size, L.vin, G.cx, midY, prefix, 'screen-math');
        if (d.w > 370) { size = size * 370 / d.w; d = FF.math.draw(node, size, L.vin, G.cx, midY, prefix, 'screen-math'); }
        if (d.h > 100) { size = size * 100 / d.h; d = FF.math.draw(node, size, L.vin, G.cx, midY, prefix, 'screen-math'); }
        s += d.svg;
      } else if (L.kind === 'piece') {
        L.pieces.forEach((p, i) => {
          s += '<text class="screen-small" x="' + (G.wX0 + 16) + '" y="' + (G.wY0 + 36 + i * 24) + '">' + esc(p.label) + '</text>';
        });
      }
      if (caption) s += '<text class="screen-cap" x="' + (G.wX0 + 18) + '" y="' + (G.wY0 + 26) + '">' + esc(caption) + '</text>';
    } else {
      s += '<text class="screen-cap bad" x="' + G.cx + '" y="' + (G.wY0 + 80) + '" text-anchor="middle">Corrija a lei no cartão ao lado</text>';
    }
    s += '</g>';
    return s;
  }

  /* "f(x) = " na lei, "f(3) = " depois de trocar x, "= " nas contas seguintes. */
  function screenPrefix(st, L) {
    const livre = FF.ctx().id === 'livre';
    const out = livre ? 'f(' + L.vin + ')' : FF.ctx().vout;
    if (!st || st.k === 'faixa') return out + ' = ';
    if (st.k === 'subst') return (livre ? 'f(' + FF.fmt(prod.run.v) + ')' : out) + ' = ';
    return '= ';
  }
  FF.screenPrefix = screenPrefix;

  /* ---------- Engrenagens com ramos: posições ----------
     O trilho passa pelo centro das engrenagens (o produto atravessa a engrenagem);
     o rótulo fica acima. A copiadora abre o trilho em dois ramos e a junção fecha. */
  const EXIT_X = () => G.wX1 - 18;
  function planW(p) { return p.reduce((n, g) => n + (g.type === 'gear' ? 1 : 2 + Math.max(planW(g.L), planW(g.R))), 0); }
  function planH(p) { return Math.max(1, ...p.map((g) => (g.type === 'gear' ? 1 : planH(g.L) + planH(g.R)))); }
  function layoutPlan(L) {
    if (L.lay) return L.lay;
    const W = Math.max(1, planW(L.plan)), H = planH(L.plan);
    const x0 = P.enterF + 30, x1 = EXIT_X() - 26, y0 = G.wY0 + 4, y1 = G.belt - 2;
    const colW = (x1 - x0) / W, laneH = (y1 - y0) / H;
    const R = Math.max(12, Math.min(26, colW * 0.3, (laneH - 34) / 2));
    const railY = (top, h) => y0 + (top + h / 2) * laneH + 13;
    const assign = (p, c, top, h) => {
      p.forEach((g) => {
        const y = railY(top, h);
        if (g.type === 'gear') {
          g.x = x0 + (c + 0.5) * colW; g.y = y;
          c += 1;
        } else {
          const hL = planH(g.L), hR = planH(g.R);
          const hl = (h * hL) / (hL + hR);
          g.sx = x0 + (c + 0.5) * colW; g.sy = y;
          g.Ly = railY(top, hl); g.Ry = railY(top + hl, h - hl);
          g.cx = g.sx + Math.min(34, colW * 0.45); // onde as cópias esperam
          assign(g.L, c + 1, top, hl);
          assign(g.R, c + 1, top + hl, h - hl);
          const inner = Math.max(planW(g.L), planW(g.R));
          g.jx = x0 + (c + 1 + inner + 0.5) * colW; g.jy = y;
          c += inner + 2;
        }
      });
    };
    assign(L.plan, 0, 0, H);
    const f = L.plan[0];
    L.lay = { R, colW, trunk: f.type === 'gear' ? f.y : f.sy };
    return L.lay;
  }

  /* Caminho que o produto percorre entre dois pontos, sempre pelos trilhos. */
  const near = (a, b) => Math.abs(a - b) < 0.5;
  function railPath(a, b) {
    if (b.x < a.x - 0.5) return railPath(b, a).reverse();
    const A = [a.x, a.y], B = [b.x, b.y];
    if (near(a.y, b.y)) return [A, B];
    const inside = (q) => q.x > G.mX0 && q.x < G.mX1;
    if (inside(a) && !inside(b) && b.x > G.mX1) { // sai pela porta da direita
      const ex = EXIT_X();
      const pts = [A, [ex, a.y], [ex, PY]];
      if (!near(b.y, PY)) pts.push([P.exitF, PY]);
      return pts.concat([B]);
    }
    if (!inside(a) && !inside(b)) return [A, B];
    if (near(a.y, PY) && a.x <= P.enterF + 1) return [A, [a.x, b.y], B]; // sobe logo depois da porta
    if (b.x - a.x < 45) return [A, [a.x, b.y], B];                        // copiadora: sobe/desce primeiro
    return [A, [b.x, a.y], B];                                             // junção: anda e depois sobe/desce
  }
  /* Caminho passando por pontos intermediários (ex.: a copiadora). */
  function routed(a, b, via) {
    const stops = [a].concat((via || []).map((q) => ({ x: q[0], y: q[1] })), [b]);
    let pts = [];
    for (let i = 1; i < stops.length; i++) {
      const seg = railPath(stops[i - 1], stops[i]);
      pts = pts.concat(i > 1 ? seg.slice(1) : seg);
    }
    return pts;
  }
  function along(pts, t) {
    const segs = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(d); total += d;
    }
    if (!total) return { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] };
    let dist = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (dist <= segs[i] || i === segs.length - 1) {
        const k = segs[i] ? Math.min(1, dist / segs[i]) : 1;
        return { x: lerp(pts[i][0], pts[i + 1][0], k), y: lerp(pts[i][1], pts[i + 1][1], k) };
      }
      dist -= segs[i];
    }
    return { x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] };
  }

  function planSVG(L, stage) {
    const lay = layoutPlan(L);
    const R = lay.R;
    const moving = !!anim;
    const off = moving ? r1(((beltPhase * 1.6) % 24 + 24) % 24) : 0;
    let beds = '', lines = '', nodes = '';
    const rail = (pts, hot) => {
      const d = 'M' + pts.map((q) => r1(q[0]) + ' ' + r1(q[1])).join(' L');
      beds += '<path class="rail-bed' + (hot ? ' hot' : '') + '" d="' + d + '"/>';
      lines += '<path class="rail-line" d="' + d + '" stroke-dashoffset="' + (-off) + '"/>';
    };
    const activeNode = stage && stage.node;
    const gearNode = (x, y, label, active, join, bad) => {
      let rot = 0;
      if (active && anim) rot = (prod.run && anim.to < anim.from ? -1 : 1) * 200 * FF.ease(Math.max(0, (anim.t - 0.25) / 0.75));
      const teeth = Math.max(9, Math.round(R / 2.8));
      const Rg = join ? R * 1.08 : R;
      let out = '<g class="gear' + (join ? ' join' : '') + (active ? ' active' : '') + (active && bad ? ' jam' : '') + '" transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + r1(rot) + ')">' +
        '<path d="' + gearPath(Rg, teeth) + '"/><circle class="gear-hole" r="' + r1(Rg * 0.42) + '"/></g>';
      const fs = Math.min(17, Math.max(12, lay.colW / Math.max(3, label.length) * 1.8));
      const pw = Math.max(Rg * 1.7, FF.math.textWidth(label, fs) + 14);
      const py = y - Rg - 15;
      out += '<g class="plate' + (active ? ' active' : '') + (join ? ' join' : '') + '"><rect x="' + r1(x - pw / 2) + '" y="' + r1(py - 12) + '" width="' + r1(pw) + '" height="24" rx="6"/>' +
        '<text x="' + r1(x) + '" y="' + r1(py + 5.5) + '" text-anchor="middle" font-size="' + r1(fs) + '">' + esc(label) + '</text></g>';
      return out;
    };
    const walk = (p, from, depth) => {
      p.forEach((g) => {
        const active = activeNode === g;
        if (g.type === 'gear') {
          rail([from, [g.x, g.y]]);
          nodes += gearNode(g.x, g.y, X.gearLabel(g), active && stage.k === 'gear', false, stage && stage.bad);
          from = [g.x, g.y];
        } else {
          rail([from, [g.sx, g.sy]]);
          rail([[g.sx, g.Ly], [g.sx, g.Ry]]);
          const endL = walk(g.L, [g.sx, g.Ly], depth + 1);
          const endR = walk(g.R, [g.sx, g.Ry], depth + 1);
          rail([endL, [g.jx, endL[1]], [g.jx, g.jy]]);
          rail([endR, [g.jx, endR[1]], [g.jx, g.jy]]);
          const sa = active && stage.k === 'split';
          const bw = 34;
          nodes += '<g class="splitter' + (sa ? ' active' : '') + '"><rect x="' + r1(g.sx - bw / 2) + '" y="' + r1(g.sy - bw / 2) + '" width="' + bw + '" height="' + bw + '" rx="8"/>' +
            '<path d="M' + r1(g.sx - 9) + ' ' + r1(g.sy) + ' h5 M' + r1(g.sx - 4) + ' ' + r1(g.sy) + ' L' + r1(g.sx + 9) + ' ' + r1(g.sy - 8) + ' M' + r1(g.sx - 4) + ' ' + r1(g.sy) + ' L' + r1(g.sx + 9) + ' ' + r1(g.sy + 8) + '"/></g>' +
            (depth === 0 ? '<text class="splitter-cap" x="' + r1(g.sx - bw / 2 - 6) + '" y="' + r1(g.sy - 12) + '" text-anchor="end">copiadora</text>' : '');
          nodes += gearNode(g.jx, g.jy, X.joinLabel(g.op), active && stage.k === 'gear', true, stage && stage.bad);
          from = [g.jx, g.jy];
        }
      });
      return from;
    };
    rail([[G.mX0, PY], [P.enterF, PY], [P.enterF, lay.trunk]]);
    const end = walk(L.plan, [P.enterF, lay.trunk], 0);
    rail([end, [EXIT_X(), end[1]], [EXIT_X(), PY], [G.mX1, PY]]);
    return beds + lines + nodes;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function posOf(stage, side) {
    if (stage.k === 'deliver') {
      const p = slotOf(stage.side, stage.vals[0]);
      return p || { x: stage.side === 'B' ? (G.bX0 + G.bX1) / 2 : (G.aX0 + G.aX1) / 2, y: 200 };
    }
    return stage.pos;
  }

  function draw() {
    const svg = $('fab-svg');
    if (!svg) return;
    const S = FF.state;
    const L = FF.law();
    const run = prod.run;
    const stage = run ? run.stages[run.i] : null;
    const moving = !!anim;
    const dirSign = run && run.dir === 'rev' ? -1 : 1;

    let hideA = null, hideB = null;
    if (stage && stage.k === 'deliver' && anim && anim.t < 1) {
      if (stage.side === 'B') hideB = stage.vals; else hideA = stage.vals;
    }
    let s = '<rect class="floor" x="0" y="' + (G.dY1) + '" width="' + G.W + '" height="' + (G.H - G.dY1) + '"/>';
    s += beltSVG(G.aX1 - 4, G.mX0 + 2, moving, dirSign);
    s += beltSVG(G.mX1 - 2, G.bX0 + 4, moving, dirSign);
    s += depotSVG('A', hideA);
    s += depotSVG('B', hideB);
    s += signSVG(L, S);
    s += machineSVG(L, S, stage, anim ? anim.t : 1);

    // Produto (um ou mais "tokens": com ramos, cada cópia é um token)
    if (run && stage) {
      const toks = (st) => st.tokens || [Object.assign({ id: 'r' }, posOf(st), { vals: st.vals, kind: st.kind })];
      const settled = stage.k === 'deliver' && !anim;
      let list;
      if (anim) {
        const fromSt = anim.from >= 0 ? run.stages[anim.from] : null;
        const toSt = run.stages[anim.to];
        const fwd = anim.to > anim.from;
        const gearMove = toSt.k === 'gear' && fwd;
        const te = gearMove ? FF.ease(Math.min(1, anim.t / 0.45)) : FF.ease(anim.t);
        const flip = gearMove ? 0.7 : 0.55;
        const A = fromSt ? toks(fromSt) : [Object.assign({ id: 'r' }, stage.origin || stage.pos, { vals: stage.vals, kind: stage.kind })];
        const B = toks(toSt);
        const find = (arr, id) => arr.find((t) => t.id === id);
        list = [];
        B.forEach((b) => {
          const a = find(A, b.id);
          if (a) {
            const src = anim.t < flip ? a : b;
            const q = along(fwd ? routed(a, b, b.via) : routed(a, b, a.via && a.via.slice().reverse()), te);
            list.push({ x: q.x, y: q.y, vals: src.vals, kind: src.kind, tiny: b.tiny || a.tiny, bad: b.kind === 'bad' });
            return;
          }
          const parent = find(A, b.id.slice(0, -1));
          if (parent) { // cópia saindo da copiadora
            const q = along(routed(parent, b, b.via), te);
            list.push({ x: q.x, y: q.y, vals: b.vals, kind: b.kind, tiny: true });
            return;
          }
          if (anim.t >= flip) list.push({ x: b.x, y: b.y, vals: b.vals, kind: b.kind, tiny: b.tiny, bad: b.kind === 'bad' }); // junção pronta
        });
        A.forEach((a) => {
          if (find(B, a.id)) return;
          const target = find(B, a.id.slice(0, -1));
          if (target && anim.t < flip) { // cópias indo para a junção
            const q = along(routed(a, target, a.via && a.via.slice().reverse()), te);
            list.push({ x: q.x, y: q.y, vals: a.vals, kind: a.kind, tiny: true });
          } else if (!target && find(B, a.id + 'L') == null && anim.t < 0.5) {
            list.push(Object.assign({}, a));
          }
        });
        if (fromSt && anim.t < flip && toSt.k === 'guess' && !fwd) list = A.map((a) => Object.assign({}, a));
      } else {
        list = settled ? [] : toks(stage).map((t) => Object.assign({}, t, { bad: t.kind === 'bad' }));
      }
      if (settled) list = [];
      list.forEach((t) => {
        const showBad = t.kind === 'bad' && stage.bad && (!anim || anim.t > 0.55);
        const kind = t.kind === 'bad' && !showBad ? (run.dir === 'fwd' ? 'in' : 'out') : t.kind;
        s += boxSVG(t.x, t.y, t.vals, kind, { tiny: !!t.tiny });
        if (showBad) {
          const dy = t.tiny ? 30 : 52;
          s += '<g class="xmark"><circle cx="' + r1(t.x) + '" cy="' + r1(t.y - dy) + '" r="15"/><path d="M' + r1(t.x - 6) + ' ' + r1(t.y - dy - 6) + ' l12 12 M' + r1(t.x + 6) + ' ' + r1(t.y - dy - 6) + ' l-12 12"/></g>';
        }
      });
    }
    svg.innerHTML = s;
  }

  /* ---------- Narração e passos ---------- */
  function narrate() {
    const run = prod.run;
    const title = $('narr-title'), body = $('narr-body'), count = $('narr-count'), dots = $('fab-dots');
    if (!title) return;
    if (!run) {
      const L = FF.law();
      count.textContent = 'Linha de produção';
      title.textContent = L.kind === 'error' ? 'A lei tem um erro' : 'Escolha o que vai entrar';
      body.innerHTML = L.kind === 'error'
        ? '<p>' + esc(L.error) + '</p>'
        : '<p>Toque em um valor no depósito <b>A</b>, digite um número na barra acima da fábrica ou aperte <b>avançar</b> para pegar o próximo.</p>' +
          (FF.canReverse(L) ? '<p class="note">Também dá para dar a saída e descobrir a entrada: <b>Ao contrário</b>.</p>' : '');
      dots.innerHTML = '';
      syncButtons();
      return;
    }
    const st = run.stages[run.i];
    count.textContent = (run.dir === 'rev' ? 'Ao contrário · ' : '') + 'Passo ' + (run.i + 1) + ' de ' + run.stages.length;
    title.textContent = st.title;
    let html = '<p>' + st.html + '</p>';
    if (st.node && (st.k === 'subst' || st.k === 'calc' || st.k === 'faixa')) {
      const L = FF.law();
      html += '<p class="mathline">' + FF.math.inline(st.node, 26, L.vin, screenPrefix(st, L), 300) + '</p>';
    }
    if (st.check) {
      const L = FF.law();
      const livre = FF.ctx().id === 'livre';
      const pre = (livre ? 'f(' + FF.fmt(run.v) + ')' : FF.ctx().vout) + ' = ';
      html += '<p class="note">' + (st.checkTitle || 'Conferindo pela lei, com números:') + '</p><p class="mathline wrap">' +
        st.check.map((n, i) => FF.math.inline(n, 22, L.vin, i === 0 ? pre : '= ', 300)).join(' ') + '</p>';
    }
    body.innerHTML = html;
    dots.innerHTML = run.stages.map((s2, i) => '<button class="dot' + (i < run.i ? ' done' : '') + (i === run.i ? ' current' : '') + (s2.bad ? ' bad' : '') + '" data-i="' + i + '" aria-label="Passo ' + (i + 1) + '"></button>').join('');
    syncButtons();
  }
  function syncButtons() {
    const run = prod.run;
    $('fab-prev').disabled = !run;
    const L = FF.law();
    $('btn-rev').disabled = !FF.canReverse(L);
    $('btn-rev').title = FF.canReverse(L) ? 'Dar a saída e descobrir a entrada' : 'Só funciona quando a variável aparece uma vez na lei (engrenagens em fila)';
    $('fab-replay').disabled = !run;
  }

  /* ---------- Eventos ---------- */
  function init() {
    const svg = $('fab-svg');
    svg.addEventListener('click', (e) => {
      const g = e.target.closest('[data-side]');
      if (!g) return;
      const v = Number(g.dataset.v);
      if (g.dataset.side === 'A') FF.fab.load(v, 'fwd');
      else if (FF.canReverse()) FF.fab.load(v, 'rev');
    });
    $('fab-next').addEventListener('click', () => { stopPlay(false); FF.fab.next(); });
    $('fab-prev').addEventListener('click', () => FF.fab.prev());
    $('fab-play').addEventListener('click', () => FF.fab.togglePlay());
    $('fab-replay').addEventListener('click', () => FF.fab.replay());
    $('fab-dots').addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) { stopPlay(false); go(Number(b.dataset.i)); }
    });
    const input = $('in-value');
    const read = () => {
      const v = X.parseNumber(input.value);
      if (isNaN(v)) { input.classList.add('invalid'); input.focus(); return null; }
      input.classList.remove('invalid');
      return v;
    };
    $('btn-fwd').addEventListener('click', () => { const v = read(); if (v != null) FF.fab.load(v, 'fwd'); });
    $('btn-rev').addEventListener('click', () => { const v = read(); if (v != null) FF.fab.load(v, 'rev'); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); const v = read(); if (v != null) FF.fab.load(v, e.shiftKey ? 'rev' : 'fwd'); input.blur(); }
    });
    input.addEventListener('input', () => input.classList.remove('invalid'));
    $('btn-batch').addEventListener('click', () => FF.fab.batch());
    $('btn-clear').addEventListener('click', () => FF.fab.clear());
    restore();
    draw();
    narrate();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
  }
})();
