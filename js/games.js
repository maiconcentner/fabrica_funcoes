/* Desafios: jogos para a turma, com placar por equipes e cronômetro. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (l) => l[rnd(l.length)];
  const between = (a, b) => a + rnd(b - a + 1);
  const f = (v) => X.fmtNum(v, 2);
  const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  const COLORS = ['#1b6ec2', '#d1690f', '#1d8a4a', '#a3279f'];

  /* ---------- Equipes ---------- */
  function teams() {
    try {
      const t = JSON.parse(FF.state.gTeams || 'null');
      if (Array.isArray(t) && t.length) return t;
    } catch (e) { /* padrão */ }
    return [{ n: 'Equipe 1', p: 0 }, { n: 'Equipe 2', p: 0 }];
  }
  function saveTeams(t) { FF.set({ gTeams: JSON.stringify(t) }); renderTeams(); }
  let turn = 0;
  function addPoints(i, pts, why) {
    const t = teams();
    if (!t[i]) return;
    t[i].p += pts;
    saveTeams(t);
    toast('+' + pts + ' para ' + t[i].n + (why ? ': ' + why : ''));
  }
  function renderTeams() {
    const t = teams();
    if (turn >= t.length) turn = 0;
    const best = Math.max.apply(null, t.map((x) => x.p));
    $('g-teams').innerHTML = t.map((x, i) =>
      '<li class="team' + (i === turn && FF.state.gGame === 'rule' ? ' turn' : '') + '" style="--tc:' + COLORS[i % 4] + '">' +
      '<input class="team-name" data-t="' + i + '" value="' + esc(x.n) + '" aria-label="Nome da equipe ' + (i + 1) + '">' +
      '<span class="team-pts">' + x.p + (x.p === best && best > 0 ? ' ★' : '') + '</span>' +
      '<button class="icon-btn sm" data-dec="' + i + '" aria-label="Tirar 1 ponto">−</button>' +
      '<button class="icon-btn sm" data-inc="' + i + '" aria-label="Dar 1 ponto">+</button></li>').join('');
    $('g-team-add').disabled = t.length >= 4;
    $('g-team-del').disabled = t.length <= 1;
  }
  /* Botões "equipe X acertou" (jogos 2 e 3) */
  function teamButtons(act) {
    return '<div class="team-btns">' + teams().map((x, i) =>
      '<button class="btn team-btn" style="--tc:' + COLORS[i % 4] + '" data-act="' + act + '" data-team="' + i + '">' + esc(x.n) + '</button>').join('') + '</div>';
  }

  /* ---------- Cronômetro ---------- */
  let clock = { left: 60, run: false, id: 0 };
  function clockDraw() {
    const s = Math.max(0, clock.left);
    $('g-clock').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    $('g-clock').classList.toggle('end', s === 0);
    $('g-clock').classList.toggle('low', s > 0 && s <= 10);
    $('g-clock-go').textContent = clock.run ? 'Pausar' : clock.left === 0 ? 'Recomeçar' : 'Iniciar';
    document.querySelectorAll('#g-clock-len button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.v) === FF.state.gClock));
  }
  function clockReset() { clearInterval(clock.id); clock = { left: FF.state.gClock, run: false, id: 0 }; clockDraw(); }
  function clockToggle() {
    if (clock.run) { clearInterval(clock.id); clock.run = false; clockDraw(); return; }
    if (clock.left === 0) clock.left = FF.state.gClock;
    clock.run = true;
    clock.id = setInterval(() => {
      clock.left--;
      if (clock.left <= 0) { clock.left = 0; clearInterval(clock.id); clock.run = false; beep(); }
      clockDraw();
    }, 1000);
    clockDraw();
  }
  function beep() {
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      const ctx = new A();
      [0, 0.25, 0.5].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.2, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.21);
      });
    } catch (e) { /* sem som */ }
  }

  function toast(msg) {
    const el = $('g-toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { el.hidden = true; }, 2600);
  }

  /* ---------- Leis sorteadas por nível ----------
     Sempre com a variável aparecendo uma vez (dá para desfazer e montar com engrenagens). */
  function randomLaw(level) {
    const a = between(2, 9), b = between(1, 12), c = between(2, 5);
    const opts = level === 1
      ? [`x + ${b}`, `x − ${b}`, `${a}x`, `${b + 10} − x`]
      : level === 2
        ? [`${a}x + ${b}`, `${a}x − ${b}`, `${c}(x + ${b})`, `x/2 + ${b}`, `${b + 20} − ${c}x`]
        : [`x² + ${b}`, `x² − ${b}`, `${c}x²`, `(x + ${c})²`, `x³ + ${b}`];
    const src = pick(opts);
    const ast = X.parse(src, 'x');
    return { src, ast, chain: X.chain(ast), val: (x) => X.evaluate(ast, x) };
  }
  function lawHTML(law, size, prefix) { return FF.math.inline(law.ast, size || 34, 'x', prefix == null ? 'f(x) = ' : prefix); }
  function parseGuess(src) {
    const ls = X.letters(src);
    return X.parse(src, ls.length === 1 ? ls[0] : 'x');
  }
  function sameLaw(g, law) {
    for (let x = -6; x <= 9; x += 0.5) {
      let a, b;
      try { b = law.val(x); } catch (e) { continue; }
      try { a = X.evaluate(g, x); } catch (e) { return false; }
      if (!close(a, b)) return false;
    }
    return true;
  }
  function machineHTML(law, hidden, xin, yout, extra) {
    return '<div class="mini-fab">' +
      '<div class="mini-box in' + (xin == null ? ' empty' : '') + '">' + (xin == null ? '?' : esc(xin)) + '</div>' +
      '<div class="mini-arrow">→</div>' +
      '<div class="mini-machine' + (hidden ? ' dark' : '') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.4 2.1-1.9-.3a6.9 6.9 0 0 0-.8-1.9l1.1-1.6-1.6-1.6-1.6 1.1a6.9 6.9 0 0 0-1.9-.8l-.3-1.9h-2.2l-.3 1.9a6.9 6.9 0 0 0-1.9.8L7.9 5.2 6.3 6.8l1.1 1.6a6.9 6.9 0 0 0-.8 1.9l-1.9.3v2.2l1.9.3c.2.7.4 1.3.8 1.9l-1.1 1.6 1.6 1.6 1.6-1.1c.6.4 1.2.6 1.9.8l.3 1.9h2.2l.3-1.9c.7-.2 1.3-.4 1.9-.8l1.6 1.1 1.6-1.6-1.1-1.6c.4-.6.6-1.2.8-1.9l1.9-.3Z" fill="currentColor"/></svg>' +
      '<div class="mini-law">' + (hidden ? '<span class="qq">f(x) = ?</span>' : lawHTML(law, 30)) + '</div></div>' +
      '<div class="mini-arrow">→</div>' +
      '<div class="mini-box out' + (yout == null ? ' empty' : '') + '">' + (yout == null ? '?' : esc(yout)) + '</div>' +
      (extra || '') + '</div>';
  }

  /* ---------- 1. Adivinhe a regra ---------- */
  const G1 = { law: null, clues: [], asked: false, done: false, msg: '', guesses: 0 };
  function g1New() {
    Object.assign(G1, { law: randomLaw(FF.state.gLevel), clues: [], asked: false, done: false, msg: '', guesses: 0 });
    turn = rnd(teams().length);
  }
  function g1Points() { return Math.max(1, 6 - G1.clues.length); }
  function g1Render() {
    const t = teams();
    const team = t[turn] || t[0];
    const last = G1.clues[G1.clues.length - 1];
    let h = '<div class="game-head"><h2>Adivinhe a regra</h2><p class="note">Nível ' + FF.state.gLevel + ' · Vale agora: <b>' + g1Points() + ' ponto' + (g1Points() > 1 ? 's' : '') + '</b> (quanto menos pistas, mais pontos)</p></div>';
    h += machineHTML(G1.law, !G1.done, last ? f(last.x) : null, last ? f(last.y) : null);
    h += '<div class="clues"><table class="ftable big"><thead><tr><th><i>x</i></th><th><i>f</i>(<i>x</i>)</th></tr></thead><tbody>' +
      (G1.clues.length ? G1.clues.map((c, i) => '<tr' + (i === G1.clues.length - 1 ? ' class="last"' : '') + '><td>' + f(c.x) + '</td><td class="out">' + f(c.y) + '</td></tr>').join('') : '<tr><td colspan="2" class="empty">Nenhuma pista ainda</td></tr>') +
      '</tbody></table></div>';
    if (!G1.done) {
      h += '<div class="turn-box" style="--tc:' + COLORS[turn % 4] + '"><p class="turn-name">Vez da <b>' + esc(team.n) + '</b></p>' +
        '<div class="g-row"><label for="g1-x">Pedir uma pista: x =</label><input type="text" id="g1-x" inputmode="decimal" placeholder="ex.: 3"' + (G1.asked ? ' disabled' : '') + '>' +
        '<button class="btn" data-act="g1-ask"' + (G1.asked ? ' disabled' : '') + '>Colocar na máquina</button></div>' +
        '<div class="g-row"><label for="g1-guess">Palpite: f(x) =</label><input type="text" id="g1-guess" class="math-in" placeholder="ex.: 2x + 1">' +
        '<button class="btn" data-act="g1-guess">Testar palpite</button></div>' +
        '<div class="g-row end"><button class="btn btn-ghost" data-act="g1-pass">Passar a vez</button><button class="btn btn-ghost" data-act="g1-reveal">Revelar a lei</button></div>' +
        (G1.asked ? '<p class="note">Esta equipe já pediu a pista da vez. Agora pode dar um palpite ou passar.</p>' : '<p class="note">Na sua vez, a equipe pede <b>uma</b> pista e pode arriscar um palpite.</p>') + '</div>';
    } else {
      h += '<div class="g-row end"><button class="btn" data-act="new">Próxima rodada</button></div>';
    }
    if (G1.msg) h += '<div class="g-msg">' + G1.msg + '</div>';
    return h;
  }
  function g1Act(act) {
    const t = teams();
    if (act === 'g1-ask') {
      const x = X.parseNumber($('g1-x').value);
      if (isNaN(x)) { $('g1-x').classList.add('invalid'); return; }
      let y;
      try { y = G1.law.val(x); } catch (e) { G1.msg = '<p class="err">A máquina travou com x = ' + f(x) + '. Escolha outro valor.</p>'; render(); return; }
      if (!G1.clues.some((c) => close(c.x, x))) G1.clues.push({ x, y });
      G1.asked = true;
      G1.msg = '<p>Entrou <b>' + f(x) + '</b>, saiu <b>' + f(y) + '</b>.</p>';
    } else if (act === 'g1-guess') {
      let g;
      try { g = parseGuess($('g1-guess').value); } catch (e) { G1.msg = '<p class="err">' + esc(e.message) + '</p>'; render(); return; }
      G1.guesses++;
      if (sameLaw(g, G1.law)) {
        const pts = g1Points();
        G1.done = true;
        G1.msg = '<p class="ok big-msg"><b>' + esc(t[turn].n) + ' descobriu!</b> A lei é ' + lawHTML(G1.law, 26) + '</p>' +
          (X.text(g, 'x') !== X.text(G1.law.ast, 'x') ? '<p class="note">O palpite ' + FF.math.inline(g, 20, 'x', 'f(x) = ') + ' é a mesma lei escrita de outro jeito.</p>' : '');
        addPoints(turn, pts, 'descobriu a regra');
      } else {
        const bad = G1.clues.find((c) => { try { return !close(X.evaluate(g, c.x), c.y); } catch (e) { return true; } });
        G1.msg = '<p class="err"><b>Não é essa.</b> ' + (bad ? 'Para x = ' + f(bad.x) + ', a máquina deu ' + f(bad.y) + '.' : 'Acerta as pistas, mas não é a lei da máquina: faltam pistas.') + '</p>';
        nextTurn();
      }
    } else if (act === 'g1-pass') {
      G1.msg = '';
      nextTurn();
    } else if (act === 'g1-reveal') {
      G1.done = true;
      G1.msg = '<p>A lei era ' + lawHTML(G1.law, 26) + '. Ninguém pontua nesta rodada.</p>';
    }
    render();
  }
  function nextTurn() { turn = (turn + 1) % teams().length; G1.asked = false; renderTeams(); }

  /* ---------- 2. Que produto entrou? ---------- */
  const G2 = { law: null, x: 0, y: 0, shown: 0, done: false, msg: '' };
  function g2New() {
    const L = FF.state.gLevel;
    let law, x;
    do {
      law = randomLaw(L);
      x = L === 3 ? between(1, 7) : between(-4, 12);
    } while (!law.chain || !X.invertible(law.chain));
    Object.assign(G2, { law, x, y: law.val(x), shown: 0, done: false, msg: '' });
  }
  function g2Steps() {
    const out = [];
    let vals = [G2.y];
    out.push('Começamos pela saída: <b>' + f(G2.y) + '</b>. A última engrenagem é a primeira a ser desfeita.');
    G2.law.chain.slice().reverse().forEach((g) => {
      const before = vals;
      vals = vals.flatMap((v) => [].concat(X.gearApply(g, v, true)));
      out.push('Desfazer <span class="gtag">' + esc(X.gearLabel(g)) + '</span> com <span class="gtag inv">' + esc(X.gearLabel(g, true)) + '</span>: ' +
        before.map((v, i) => X.gearSentence(g, v, [].concat(X.gearApply(g, v, true)), true)).join('; ') + '.');
    });
    out.push('Entrou <b>x = ' + vals.map(f).join('</b> ou <b>x = ') + '</b>. Confira: ' + vals.map((v) => 'f(' + f(v) + ') = ' + f(G2.law.val(v))).join('; ') + '.');
    return out;
  }
  function g2Render() {
    let h = '<div class="game-head"><h2>Que produto entrou?</h2><p class="note">Nível ' + FF.state.gLevel + ' · A lei está à vista; a saída também. Qual foi a entrada? Vale <b>2 pontos</b>.</p></div>';
    h += machineHTML(G2.law, false, null, f(G2.y));
    h += '<div class="g-row"><label for="g2-ans">Resposta de uma equipe: x =</label><input type="text" id="g2-ans" inputmode="decimal" placeholder="valor"></div>';
    h += '<p class="note">Digite a resposta e toque na equipe que respondeu.</p>' + teamButtons('g2-answer');
    const steps = g2Steps();
    h += '<div class="g-row end"><button class="btn btn-ghost" data-act="g2-step"' + (G2.shown >= steps.length ? ' disabled' : '') + '>Mostrar a resolução (' + G2.shown + '/' + steps.length + ')</button><button class="btn" data-act="new">Próxima</button></div>';
    if (G2.shown) h += '<ol class="solve">' + steps.slice(0, G2.shown).map((s) => '<li>' + s + '</li>').join('') + '</ol>';
    if (G2.msg) h += '<div class="g-msg">' + G2.msg + '</div>';
    return h;
  }
  function g2Act(act, el) {
    if (act === 'g2-step') { G2.shown = Math.min(G2.shown + 1, g2Steps().length); render(); return; }
    if (act === 'g2-answer') {
      const v = X.parseNumber($('g2-ans').value);
      const i = Number(el.dataset.team);
      if (isNaN(v)) { $('g2-ans').classList.add('invalid'); return; }
      let ok = false;
      try { ok = close(G2.law.val(v), G2.y); } catch (e) { ok = false; }
      if (ok && !G2.done) {
        G2.done = true;
        G2.msg = '<p class="ok big-msg"><b>' + esc(teams()[i].n) + ' acertou!</b> f(' + f(v) + ') = ' + f(G2.y) + '.</p>' +
          (G2.law.chain.some((g) => g.op === 'sq') && v !== 0 ? '<p class="note">Repare: ' + f(-v) + ' também serve, porque o quadrado apaga o sinal.</p>' : '');
        addPoints(i, 2, 'achou a entrada');
      } else if (ok) {
        G2.msg = '<p class="ok">Também está certo, mas os pontos já foram.</p>';
      } else {
        let y2 = null;
        try { y2 = G2.law.val(v); } catch (e) { /* fora do domínio */ }
        G2.msg = '<p class="err"><b>' + esc(teams()[i].n) + ':</b> com x = ' + f(v) + ' sai ' + (y2 == null ? 'nada' : f(y2)) + ', e não ' + f(G2.y) + '.</p>';
      }
      render();
    }
  }

  /* ---------- 3. Corrida das engrenagens ---------- */
  const G3 = { law: null, pairs: [], gears: [], msg: '', done: false };
  function g3New() {
    let law;
    do { law = randomLaw(FF.state.gLevel); } while (!law.chain || !law.chain.length);
    const xs = [];
    while (xs.length < 3) { const x = between(0, 6); if (!xs.includes(x)) xs.push(x); }
    xs.sort((a, b) => a - b);
    Object.assign(G3, { law, pairs: xs.map((x) => ({ x, y: law.val(x) })), gears: [], msg: '', done: false });
  }
  function g3Run(x) {
    let v = x;
    for (const g of G3.gears) {
      try { v = X.gearApply(g, v, false); } catch (e) { return null; }
    }
    return v;
  }
  function g3Render() {
    let h = '<div class="game-head"><h2>Corrida das engrenagens</h2><p class="note">Nível ' + FF.state.gLevel + ' · Monte uma máquina que transforme cada entrada na saída pedida. Vale <b>3 pontos</b>.</p></div>';
    h += '<div class="pairs">' + G3.pairs.map((p) => {
      const got = G3.gears.length ? g3Run(p.x) : null;
      const ok = got != null && close(got, p.y);
      return '<div class="pair' + (G3.gears.length ? (ok ? ' ok' : ' no') : '') + '"><span class="mini-box in">' + f(p.x) + '</span><span class="mini-arrow">→</span><span class="mini-box out">' + f(p.y) + '</span>' +
        (G3.gears.length ? '<span class="got">' + (got == null ? 'travou' : 'sai ' + f(got)) + (ok ? ' ✓' : ' ✗') + '</span>' : '') + '</div>';
    }).join('') + '</div>';
    h += '<div class="build"><p class="flabel">Sua máquina</p><ol class="gear-chain">' +
      (G3.gears.length ? G3.gears.map((g, i) => '<li><span class="gtag">' + esc(X.gearLabel(g)) + '</span><button class="icon-btn sm" data-act="g3-del" data-i="' + i + '" aria-label="Tirar">✕</button></li>').join('<li class="arrow">→</li>') : '<li class="note">Nenhuma engrenagem. Entra x e sai x.</li>') +
      '</ol><div class="g-row"><select id="g3-op" class="select">' + X.GEAR_MENU.map((m) => '<option value="' + m.op + '">' + esc(m.label) + '</option>').join('') + '</select>' +
      '<input type="text" id="g3-k" inputmode="decimal" placeholder="nº"><button class="btn" data-act="g3-add">Adicionar engrenagem</button><button class="btn btn-ghost" data-act="g3-clear">Limpar</button></div></div>';
    const allOk = G3.gears.length && G3.pairs.every((p) => { const v = g3Run(p.x); return v != null && close(v, p.y); });
    if (allOk && !G3.done) h += '<p class="ok big-msg">A máquina funciona para todos os pares! Qual equipe montou?</p>' + teamButtons('g3-win');
    h += '<div class="g-row end"><button class="btn btn-ghost" data-act="g3-reveal">Mostrar uma solução</button><button class="btn" data-act="new">Próxima</button></div>';
    if (G3.msg) h += '<div class="g-msg">' + G3.msg + '</div>';
    return h;
  }
  function g3Act(act, el) {
    if (act === 'g3-add') {
      const op = $('g3-op').value;
      const m = X.GEAR_MENU.find((g) => g.op === op);
      const kv = m.needsK ? X.parseNumber($('g3-k').value) : 0;
      if (m.needsK && (isNaN(kv) || (op === 'div' && kv === 0))) { $('g3-k').classList.add('invalid'); return; }
      if (G3.gears.length >= 5) return;
      G3.gears.push({ op, kv });
    } else if (act === 'g3-del') G3.gears.splice(Number(el.dataset.i), 1);
    else if (act === 'g3-clear') G3.gears = [];
    else if (act === 'g3-reveal') G3.msg = '<p>Uma máquina que funciona: ' + G3.law.chain.map((g) => '<span class="gtag">' + esc(X.gearLabel(g)) + '</span>').join(' → ') + ', ou seja, ' + lawHTML(G3.law, 22) + '. Pode haver outras!</p>';
    else if (act === 'g3-win' && !G3.done) {
      G3.done = true;
      const mine = X.fromChain(G3.gears);
      G3.msg = '<p class="ok">Máquina da equipe: ' + FF.math.inline(mine, 22, 'x', 'f(x) = ') + '</p>' +
        (X.text(mine, 'x') !== X.text(G3.law.ast, 'x') ? '<p class="note">A máquina sorteada era ' + lawHTML(G3.law, 20) + ': jeitos diferentes, mesmos pares.</p>' : '');
      addPoints(Number(el.dataset.team), 3, 'máquina montada');
    }
    render();
  }

  /* ---------- 4. Exercícios ---------- */
  const G4 = { ctx: 'luz', ex: null, shown: 0 };
  function g4New() {
    const c = FF.CONTEXTS.find((k) => k.id === G4.ctx) || FF.CONTEXTS[1];
    let law, src = null, vin = c.vin;
    if (c.id === 'livre') {
      const r = randomLaw(FF.state.gLevel);
      law = { kind: 'expr', ast: r.ast, chain: r.chain, vin: 'x' };
      src = r.src;
    } else if (typeof c.law === 'string') {
      const ast = X.parse(c.law, vin);
      law = { kind: 'expr', ast, chain: X.chain(ast), vin };
      src = c.law;
    } else {
      law = { kind: 'piece', vin, pieces: c.law.pieces.map((p) => Object.assign({}, p, { ast: X.parse(p.src, vin) })) };
    }
    const ins = c.inputs && c.inputs.length ? c.inputs : [0, 10];
    const lo = Math.min.apply(null, ins), hi = Math.max.apply(null, ins);
    const half = ins.some((v) => v % 1 !== 0);
    let x = half ? Math.round((lo + Math.random() * (hi - lo + 2)) * 2) / 2 : between(Math.floor(lo), Math.ceil(hi) + Math.round((hi - lo) / 3) + 2);
    if (c.id === 'livre') x = between(-4, 10);
    const dom = X.parseSet(c.dom);
    if (!X.inSet(dom, x)) x = Math.max(1, Math.min(dom.hi != null ? dom.hi - 1 : x, Math.abs(x)));
    const canRev = law.kind === 'expr' && law.chain && X.invertible(law.chain);
    const dir = canRev && Math.random() < 0.5 ? 'rev' : 'fwd';
    const r = FF.evalLaw(x, Object.assign({ dom: dom, cd: { type: 'R' } }, law));
    G4.ex = { c, law, src, x, y: r.y, dir };
    G4.shown = 0;
  }
  function g4Text() {
    const e = G4.ex, c = e.c;
    if (c.id === 'livre') {
      return e.dir === 'fwd'
        ? 'Dada a função f(x) = ' + X.text(e.law.ast, 'x') + ', calcule f(' + f(e.x) + ').'
        : 'Dada a função f(x) = ' + X.text(e.law.ast, 'x') + ', determine x para que f(x) = ' + f(e.y) + '.';
    }
    const story = c.story.replace(/<[^>]+>/g, '');
    const art = { 'distância': 'a', 'largura': 'a' }[c.outName] || 'o';
    const unit = c.inUnit && c.inUnit !== c.inName ? ', em ' + c.inUnit : '';
    return story + ' ' + (e.dir === 'fwd'
      ? 'Qual é ' + art + ' ' + c.outName + ' para ' + e.law.vin + ' = ' + fin(c, e.x) + ' (' + c.inName + ')?'
      : 'Se ' + art + ' ' + c.outName + ' foi ' + fout(c, e.y) + ', qual é o valor de ' + e.law.vin + ' (' + c.inName + unit + ')?');
  }
  function g4Steps() {
    const e = G4.ex, c = e.c, vin = e.law.vin;
    const outName = c.id === 'livre' ? 'f(x)' : c.vout;
    const steps = [];
    if (e.law.kind === 'piece') {
      const i = X.findPiece(e.law, e.x);
      steps.push('A tarifa é por faixas. ' + fin(c, e.x) + ' está na faixa <b>' + esc(e.law.pieces[i].label) + '</b>: ' + FF.math.inline(e.law.pieces[i].ast, 20, vin, c.vout + ' = '));
      const s = X.steps(e.law.pieces[i].ast, e.x);
      s.list.forEach((n, j) => steps.push(FF.math.inline(n, 20, vin, j === 0 ? c.vout + ' = ' : '= ')));
    } else {
      steps.push('A lei: ' + FF.math.inline(e.law.ast, 22, vin, outName + ' = '));
      if (e.dir === 'fwd') {
        const s = X.steps(e.law.ast, e.x);
        s.list.forEach((n, j) => steps.push((j === 0 ? 'Trocar ' + vin + ' por ' + f(e.x) + ': ' : '') + FF.math.inline(n, 22, vin, j === 0 ? (c.id === 'livre' ? 'f(' + f(e.x) + ')' : c.vout) + ' = ' : '= ')));
      } else {
        steps.push('Trocar ' + outName + ' por ' + f(e.y) + ': ' + FF.math.inline(e.law.ast, 22, vin, f(e.y) + ' = '));
        let vals = [e.y];
        e.law.chain.slice().reverse().forEach((g) => {
          const before = vals;
          vals = vals.flatMap((v) => [].concat(X.gearApply(g, v, true)));
          steps.push('Desfazer <span class="gtag">' + esc(X.gearLabel(g)) + '</span>: ' + before.map((v) => X.gearSentence(g, v, [].concat(X.gearApply(g, v, true)), true)).join('; ') + '.');
        });
      }
    }
    const ans = e.dir === 'fwd'
      ? (c.id === 'livre' ? 'f(' + f(e.x) + ') = ' + f(e.y) : cap(c.outName) + ': ' + fout(c, e.y))
      : (c.id === 'livre' ? 'x = ' + f(e.x) : cap(c.inName) + ': ' + fin(c, e.x));
    steps.push('<b>Resposta:</b> ' + esc(ans) + (X.isApprox(e.dir === 'fwd' ? e.y : e.x) ? ' (aproximadamente)' : '') + '.');
    return steps;
  }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
  /* Unidades da situação do exercício (não da Fábrica) */
  function fin(c, v) { return f(v) + (c.inUnit ? ' ' + c.inUnit : ''); }
  function fout(c, v) {
    if (c.money) return 'R$ ' + (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
    return f(v) + (c.outUnit ? ' ' + c.outUnit : '');
  }
  function g4Render() {
    const e = G4.ex;
    let h = '<div class="game-head"><h2>Exercícios</h2><p class="note">Números novos a cada vez, com a resolução um passo por clique (setas ou passador).</p></div>';
    h += '<div class="g-row"><label for="g4-ctx">Situação</label><select id="g4-ctx" class="select">' + FF.CONTEXTS.map((c) =>
      '<option value="' + c.id + '"' + (c.id === G4.ctx ? ' selected' : '') + '>' + (c.icon ? c.icon + ' ' : '') + esc(c.id === 'livre' ? 'Sem contexto (nível ' + FF.state.gLevel + ')' : c.name) + '</option>').join('') + '</select>' +
      '<button class="btn" data-act="new">Novo exercício</button></div>';
    h += '<div class="ex-card kbox k-q"><p class="ex-tag"><span class="kchip k-q">Pergunta</span> ' + (e.dir === 'fwd' ? 'Da entrada para a saída' : 'Da saída para a entrada') + (e.c.book ? ' · como na ' + esc(e.c.book) : '') + '</p><p class="ex-text" id="g4-text">' + esc(g4Text()) + '</p></div>';
    const steps = g4Steps();
    h += '<ol class="solve">' + steps.slice(0, G4.shown).map((s) => '<li>' + s + '</li>').join('') + '</ol>';
    h += '<div class="g-row end"><button class="btn btn-ghost" data-act="g4-copy">Copiar enunciado</button><button class="btn btn-ghost" data-act="g4-fab">Abrir na Fábrica</button>' +
      '<button class="btn btn-ghost" data-act="g4-back"' + (G4.shown ? '' : ' disabled') + '>Voltar passo</button>' +
      '<button class="btn" data-act="g4-step"' + (G4.shown >= steps.length ? ' disabled' : '') + '>Próximo passo (' + G4.shown + '/' + steps.length + ')</button></div>';
    return h;
  }
  function g4Act(act) {
    const n = g4Steps().length;
    if (act === 'g4-step') G4.shown = Math.min(n, G4.shown + 1);
    else if (act === 'g4-back') G4.shown = Math.max(0, G4.shown - 1);
    else if (act === 'g4-copy') {
      const txt = g4Text();
      try { navigator.clipboard.writeText(txt).then(() => toast('Enunciado copiado'), () => toast('Não deu para copiar')); } catch (e) { toast('Não deu para copiar'); }
      return;
    } else if (act === 'g4-fab') {
      const e = G4.ex, c = e.c;
      FF.set({ view: 'fab', ctx: c.id, law: e.src || '', dom: c.dom, cd: c.cd, inputs: '', preset: -1, made: '', bad: '' });
      setTimeout(() => FF.fab.load(e.dir === 'fwd' ? e.x : e.y, e.dir), 50);
      return;
    }
    render();
  }

  /* ---------- 5. Placas A–E (perguntas-dobradiça, js/hinge.js) ---------- */
  const G5 = { tpl: 'mix' };
  function g5Render() {
    return '<div class="g-row"><label for="h-tpl">Tipo de pergunta</label><select id="h-tpl" class="select">' +
      '<option value="mix"' + (G5.tpl === 'mix' ? ' selected' : '') + '>Todos os tipos (sorteado)</option>' +
      FF.hinge.TEMPLATES.map((t) => '<option value="' + t.id + '"' + (t.id === G5.tpl ? ' selected' : '') + '>' + esc(t.code + ' · ' + t.name) + '</option>').join('') +
      '</select></div><div id="h-host"></div>';
  }

  /* ---------- Geral ---------- */
  const GAMES = {
    rule: { make: g1New, draw: g1Render, act: g1Act, has: () => G1.law,
      help: 'Cada equipe, na sua vez, pede <b>uma</b> pista (um valor para a máquina) e pode dar um palpite da lei. Quem descobrir leva os pontos: 5 com uma pista, 4 com duas… (mínimo 1). Palpite errado passa a vez.' },
    rev: { make: g2New, draw: g2Render, act: g2Act, has: () => G2.law,
      help: 'A lei e a saída estão à vista. As equipes calculam a entrada (desfazendo as engrenagens de trás para frente). Use o cronômetro; a primeira equipe que acertar leva 2 pontos.' },
    race: { make: g3New, draw: g3Render, act: g3Act, has: () => G3.law,
      help: 'Com os pares dados, cada equipe monta uma máquina de engrenagens que produza todos eles. Quando funcionar para todos, a equipe leva 3 pontos. Máquinas diferentes podem dar certo!' },
    hinge: { make: () => FF.hinge.single(G5.tpl), draw: g5Render, act: (a, el) => FF.hinge.act(a, el), has: FF.hinge.has,
      help: 'Uma pergunta no formato da AvaliaSESI, com alternativas A a E. Cada alternativa errada é um erro típico. <b>1.</b> Tempo para pensar sozinho. <b>2.</b> Placas para cima: toque nas letras para contar. <b>3.</b> Revelar: aparece o erro por trás de cada alternativa. <b>4.</b> A resolução, passo a passo. Os resultados ficam guardados neste computador.' },
    ex: { make: g4New, draw: g4Render, act: g4Act, has: () => G4.ex,
      help: 'Exercícios no estilo do livro, com números novos. Projete o enunciado, deixe a turma resolver e revele a resolução passo a passo. "Abrir na Fábrica" mostra a mesma conta nas engrenagens.' },
  };
  function game() { return GAMES[FF.state.gGame]; }
  function render() {
    if (FF.state.view !== 'game') return;
    const G = game();
    if (!G.has()) G.make();
    document.querySelectorAll('#g-game button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.g === FF.state.gGame));
    document.querySelectorAll('#g-level button').forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.v) === FF.state.gLevel));
    $('g-area').innerHTML = G.draw();
    if (FF.state.gGame === 'hinge') FF.hinge.mount($('h-host')); else FF.hinge.stop();
    $('g-level').hidden = FF.state.gGame === 'hinge';
    // Placas A–E numa aula: só a pergunta (sem escolher jogo nem tipo)
    const lessonHinge = FF.state.gGame === 'hinge' && FF.hinge.inLesson() && !!FF.state.lesson;
    $('view-game').querySelector('.figbar').hidden = lessonHinge;
    const tr = $('h-tpl'); if (tr) tr.closest('.g-row').hidden = lessonHinge;
    $('g-help').innerHTML = G.help;
    renderTeams();
    clockDraw();
  }

  function bind() {
    document.querySelectorAll('#g-game button').forEach((b) => b.addEventListener('click', () => { FF.set({ gGame: b.dataset.g }); render(); }));
    document.querySelectorAll('#g-level button').forEach((b) => b.addEventListener('click', () => {
      FF.set({ gLevel: Number(b.dataset.v) });
      game().make(); render();
    }));
    $('g-new').addEventListener('click', () => { game().make(); render(); });
    $('g-area').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      if (b.dataset.act === 'new') { game().make(); render(); return; }
      game().act(b.dataset.act, b);
    });
    $('g-area').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const id = e.target.id;
      const map = { 'g1-x': 'g1-ask', 'g1-guess': 'g1-guess', 'g3-k': 'g3-add' };
      if (map[id]) { e.preventDefault(); game().act(map[id]); }
    });
    $('g-area').addEventListener('change', (e) => {
      if (e.target.id === 'g4-ctx') { G4.ctx = e.target.value; g4New(); render(); }
      if (e.target.id === 'h-turma') FF.set({ turma: e.target.value.trim().slice(0, 20) });
      if (e.target.id === 'h-tpl') { G5.tpl = e.target.value; FF.hinge.single(G5.tpl); render(); }
    });
    $('g-teams').addEventListener('click', (e) => {
      const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
      const t = teams();
      if (inc) { t[Number(inc.dataset.inc)].p++; saveTeams(t); }
      if (dec) { t[Number(dec.dataset.dec)].p--; saveTeams(t); }
    });
    $('g-teams').addEventListener('change', (e) => {
      const i = e.target.dataset.t;
      if (i == null) return;
      const t = teams();
      t[Number(i)].n = e.target.value.trim().slice(0, 24) || 'Equipe ' + (Number(i) + 1);
      saveTeams(t);
      render();
    });
    $('g-team-add').addEventListener('click', () => { const t = teams(); if (t.length < 4) { t.push({ n: 'Equipe ' + (t.length + 1), p: 0 }); saveTeams(t); render(); } });
    $('g-team-del').addEventListener('click', () => { const t = teams(); if (t.length > 1) { t.pop(); saveTeams(t); render(); } });
    $('g-team-zero').addEventListener('click', () => { saveTeams(teams().map((x) => ({ n: x.n, p: 0 }))); });
    $('g-clock-go').addEventListener('click', clockToggle);
    $('g-clock-reset').addEventListener('click', clockReset);
    document.querySelectorAll('#g-clock-len button').forEach((b) => b.addEventListener('click', () => { FF.set({ gClock: Number(b.dataset.v) }); clockReset(); }));
  }

  FF.games = {
    init() { bind(); clock.left = FF.state.gClock; },
    render,
    next() { if (FF.state.gGame === 'ex') g4Act('g4-step'); else if (FF.state.gGame === 'rev') g2Act('g2-step'); else if (FF.state.gGame === 'hinge') FF.hinge.next(); },
    prev() { if (FF.state.gGame === 'ex') g4Act('g4-back'); else if (FF.state.gGame === 'hinge') FF.hinge.prev(); },
    first() {},
    newRound() { if (FF.state.gGame === 'hinge') { FF.hinge.act('h-new'); return; } game().make(); render(); },
    atEnd() {
      if (FF.state.gGame === 'hinge') return FF.hinge.atEnd();
      if (FF.state.gGame === 'ex') return !G4.ex || G4.shown >= g4Steps().length;
      if (FF.state.gGame === 'rev') return !G2.law || G2.shown >= g2Steps().length;
      return true;
    },
    /* Para o modo apresentador: o que só o professor deve ver (lei escondida, resolução inteira) */
    snap() {
      const g = FF.state.gGame;
      if (g === 'hinge') return { g, hinge: FF.hinge.snap() };
      if (g === 'ex' && G4.ex) return { g, text: g4Text(), steps: g4Steps(), shown: G4.shown };
      if (g === 'rev' && G2.law) return { g, law: lawHTML(G2.law, 24), y: f(G2.y), steps: g2Steps(), shown: G2.shown };
      if (g === 'rule' && G1.law) return { g, law: lawHTML(G1.law, 24), clues: G1.clues.length };
      if (g === 'race' && G3.law) return { g, law: lawHTML(G3.law, 24), chain: G3.law.chain.map((x) => X.gearLabel(x)).join(' → ') };
      return { g };
    },
    hasBack() { return (FF.state.gGame === 'ex' && G4.shown > 0) || (FF.state.gGame === 'hinge' && FF.hinge.hasBack()); },
    /* Abre um jogo num nível, com rodada nova (aulas). Em Exercícios, a situação pode vir junto. */
    open(g, level, ctx, mo) {
      FF.set({ gGame: g, gLevel: level || FF.state.gLevel });
      if (g === 'ex' && ctx) G4.ctx = ctx;
      // Placas A–E numa aula: a lista de perguntas vem do momento (aquecimento ou pergunta-dobradiça)
      if (g === 'hinge' && mo && mo.items) FF.hinge.start(mo.items, { warm: mo.warm, exit: mo.exit, title: mo.title });
      else game().make();
      render();
    },
  };
})();
