/* Modo apresentador, lado do professor (apresentador.html).
   Só mostra o que a janela do projetor manda e devolve comandos. Não guarda nada. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const CH = 'fabrica-funcoes-apresentador';
  const LETTERS = 'ABCDE';
  let bc = null, S = null, lastSeen = 0, lessonId = '', t0 = Date.now();
  const seen = [];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const VIEW = { aula: 'Aulas', fab: 'Fábrica', insp: 'É função?', game: 'Desafios', emp: 'Minha empresa' };
  const chip = (k, w) => '<span class="kchip k-' + k + '">' + w + '</span>';

  function send(msg) {
    msg.id = uid(); msg.from = 'pres';
    try { if (bc) bc.postMessage(msg); } catch (e) { /* sem canal */ }
    try { if (window.opener && !window.opener.closed) window.opener.postMessage(msg, '*'); } catch (e) { /* sem janela */ }
  }
  const cmd = (c, extra) => send(Object.assign({ type: 'cmd', cmd: c }, extra || {}));

  /* ---------- Partes do que está acontecendo ---------- */
  function slideHTML(mo, ls) {
    let h = '';
    if (mo.body) h += '<div class="pv-body">' + mo.body + '</div>';
    if (mo.steps.length) {
      h += '<ol class="pv-steps">' + mo.steps.map((s, i) => {
        const st = i < ls ? 'shown' : i === ls ? 'nextup' : 'later';
        return '<li class="k k-' + s.k + ' ' + st + '">' + (i === ls ? '<span class="pv-tag">Próximo clique</span>' : '') + s.html + '</li>';
      }).join('') + '</ol>';
      h += '<p class="note">' + (ls >= mo.steps.length ? 'Todos os itens já estão na tela. O próximo clique vai para o próximo momento.' : ls + ' de ' + mo.steps.length + ' itens já estão na tela da turma.') + '</p>';
    }
    return h;
  }
  function hingeHTML(hz) {
    if (!hz) return '';
    const tot = hz.counts.reduce((a, b) => a + b, 0);
    let h = '<p class="pv-sub">' + esc(hz.title) + (hz.n > 1 ? ' · pergunta ' + (hz.i + 1) + ' de ' + hz.n : '') + ' · <b>' + esc(hz.stepName) + '</b></p>';
    h += '<div class="pv-stem kbox k-q">' + chip('q', hz.self ? 'Autoavaliação' : 'Pergunta') + hz.stem + '</div>';
    h += '<ol class="pv-alts">' + hz.alts.map((a, i) => '<li class="' + (hz.self ? '' : a.ok ? 'ok' : 'no') + '"><span class="h-l">' + LETTERS[i] + '</span><div><div class="pv-alt">' + a.html + '</div>' + (hz.self ? '' : '<p class="pv-why">' + (a.ok ? '✓ Certa. ' : '✗ ') + esc(a.why) + '</p>') + '</div>' +
      '<div class="pv-vote"><button class="icon-btn sm" data-vote="' + i + '" data-d="-1" aria-label="Tirar um voto">−</button><b>' + hz.counts[i] + '</b><button class="pv-plus" data-vote="' + i + '" data-d="1" aria-label="Mais um voto em ' + LETTERS[i] + '">+</button>' +
      (tot ? '<span class="pv-pct">' + Math.round((100 * hz.counts[i]) / tot) + '%</span>' : '') + '</div></li>').join('') + '</ol>';
    h += '<p class="note">Conte os votos aqui mesmo: os números aparecem na tela da turma depois de "Placas para cima".</p>';
    if (hz.solve && hz.solve.length) h += '<ol class="solve">' + hz.solve.map((s) => '<li>' + s + '</li>').join('') + '</ol>';
    return h;
  }
  function gameHTML(g) {
    if (!g) return '';
    if (g.g === 'hinge') return hingeHTML(g.hinge);
    if (g.g === 'ex') return '<div class="pv-stem kbox k-q">' + chip('q', 'Pergunta') + '<p>' + esc(g.text) + '</p></div><ol class="solve">' + g.steps.map((s, i) => '<li class="' + (i < g.shown ? '' : 'pv-later') + '">' + s + '</li>').join('') + '</ol><p class="note">' + g.shown + ' de ' + g.steps.length + ' passos já estão na tela da turma.</p>';
    if (g.g === 'rev') return '<p class="pv-ans">Lei: ' + g.law + ' · saída ' + esc(g.y) + '</p><ol class="solve">' + g.steps.map((s) => '<li>' + s + '</li>').join('') + '</ol>';
    if (g.g === 'rule') return '<p class="pv-ans">' + chip('ok', 'Resposta') + ' A lei escondida é ' + g.law + '</p><p class="note">Pistas pedidas até agora: ' + g.clues + '.</p>';
    if (g.g === 'race') return '<p class="pv-ans">' + chip('ok', 'Resposta') + ' Uma máquina que funciona: ' + esc(g.chain) + ', ou seja, ' + g.law + '</p>';
    return '';
  }
  function fabHTML(f, mo) {
    if (!f) return '';
    let h = '<p class="pv-law">' + f.law + (f.black ? ' <span class="kchip k-warn">caixa-preta: a turma não vê a lei</span>' : '') + (f.predict ? ' <span class="kchip k-do">prever a saída</span>' : '') + '</p>';
    if (f.run) h += '<p class="pv-ans">' + chip('ok', 'Resposta') + (f.run.dir === 'fwd' ? ' Entra ' + esc(f.run.v) + ' → sai <b>' + esc(f.run.ans) + '</b>' : ' Sai ' + esc(f.run.v) + ' → entrou <b>' + esc(f.run.ans) + '</b>') + '</p>';
    if (f.ntitle) h += '<div class="pv-narr"><p class="eyebrow">' + esc(f.count) + '</p><h3>' + esc(f.ntitle) + '</h3><div>' + f.nbody + '</div></div>';
    if ((mo && mo.until === 'all') || !f.run) {
      h += '<table class="pv-table"><thead><tr><th>' + esc(f.vin) + '</th>' + f.table.map((r) => '<td>' + esc(r.x) + '</td>').join('') + '</tr></thead><tbody><tr><th>' + esc(f.pre) + '</th>' +
        f.table.map((r) => '<td' + (r.y == null ? ' class="bad">refugo' : '>' + esc(r.y)) + '</td>').join('') + '</tr></tbody></table>';
    }
    return h;
  }
  function inspHTML(i) {
    if (!i) return '';
    return '<p class="pv-ans">' + chip(i.fn ? 'ok' : 'warn', i.fn ? 'É função' : 'Não é função') + ' <b>' + esc(i.title) + '</b> · passo ' + (i.step + 1) + ' de ' + i.n + '</p>' +
      '<p class="note">Peça o voto da turma antes do veredito.</p>';
  }

  /* ---------- Desenho ---------- */
  function render() {
    if (!S) return;
    const a = S.aula;
    $('pv-where').innerHTML = a ? 'Aula ' + a.num + ': ' + esc(a.title) + ' · momento ' + (a.mo ? (a.lm + 1) + ' de ' + a.n : 'fim') : 'Sem aula em andamento · aba <b>' + esc(VIEW[S.view] || S.view) + '</b>' + (S.turma ? ' · turma ' + esc(S.turma) : '');
    if (a && a.id !== lessonId) { lessonId = a.id; t0 = Date.now(); }
    const mo = a && a.mo;
    let h = '';
    if (mo) {
      h += '<p class="pv-kind">' + esc(mo.kindName) + (mo.kicker ? ' · ' + esc(mo.kicker) : '') + '</p><h2>' + mo.title + '</h2>';
      if (mo.prompt) h += '<p class="pv-prompt">' + mo.prompt + '</p>';
    } else if (a) h += '<h2>Aula concluída</h2>';
    else h += '<p class="pv-kind">' + esc(VIEW[S.view] || '') + '</p>';
    if (mo && mo.kind === 'slide') h += slideHTML(mo, a.ls);
    else if (S.view === 'fab') h += fabHTML(S.fab, mo);
    else if (S.view === 'game') h += gameHTML(S.game);
    else if (S.view === 'insp') h += inspHTML(S.insp);
    else if (S.view === 'emp') h += '<p class="pv-ans">' + esc(S.emp && S.emp.title) + '</p>';
    if (a && mo && TOOL_VIEW_OF(mo.kind) !== S.view) h += '<p class="pv-warn kbox k-warn">A janela do projetor está em outra aba (' + esc(VIEW[S.view]) + '). O botão Avançar comanda essa aba até você voltar à aula.</p>';
    $('pv-main').innerHTML = h;
    $('pv-note').hidden = !(mo && mo.note);
    if (mo && mo.note) $('pv-note').innerHTML = '<p class="pv-kind">Para o professor</p><p>' + esc(mo.note) + '</p>';
    $('pv-next-card').hidden = !a;
    if (a) $('pv-next-card').innerHTML = '<p class="pv-kind">Depois</p>' + (a.next ? '<p><b>' + esc(a.next.kind) + ':</b> ' + esc(a.next.title) + '</p>' : '<p>Fim da aula.</p>');
    $('pv-outline').hidden = !a;
    if (a) $('pv-outline').innerHTML = '<p class="pv-kind">Roteiro · ' + esc(a.book) + '</p><ol class="pv-ol">' + a.outline.map((o, i) =>
      '<li class="' + o.st + '"><button data-go="' + i + '"><span>' + esc(o.kind) + '</span>' + esc(o.title) + '</button></li>').join('') + '</ol>';
    $('pv-curtain').classList.toggle('on', !!S.curtain);
    $('pv-curtain').textContent = S.curtain ? 'Tirar a cortina' : 'Cortina';
    $('pv-proj').setAttribute('aria-pressed', String(!!S.proj));
    const cur = $('pv-outline').querySelector('li.cur');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  const TOOL_VIEW_OF = (k) => ({ slide: 'aula', fab: 'fab', insp: 'insp', game: 'game', emp: 'emp' }[k]);

  function tick() {
    const d = new Date();
    $('pv-now').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const s = Math.floor((Date.now() - t0) / 1000);
    $('pv-el').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    const on = Date.now() - lastSeen < 4000;
    $('pv-dot').classList.toggle('on', on);
    $('pv-dot').title = on ? 'Ligado à janela do projetor' : 'Sem ligação com a janela do projetor';
    send({ type: on ? 'ping' : 'hello' }); // sinal de vida (ou pedido de ligação)
  }

  function onMsg(msg) {
    if (!msg || msg.from !== 'main' || seen.includes(msg.id)) return;
    seen.push(msg.id); if (seen.length > 60) seen.shift();
    lastSeen = Date.now();
    if (msg.type === 'main-hello') { send({ type: 'hello' }); return; }
    if (msg.type === 'main-bye') { lastSeen = 0; return; }
    if (msg.type === 'state') { S = msg; render(); }
  }

  function init() {
    try { bc = new BroadcastChannel(CH); bc.onmessage = (e) => onMsg(e.data); } catch (e) { bc = null; }
    window.addEventListener('message', (e) => onMsg(e.data));
    $('pv-next').addEventListener('click', () => cmd('next'));
    $('pv-prev').addEventListener('click', () => cmd('prev'));
    $('pv-curtain').addEventListener('click', () => cmd('curtain'));
    $('pv-proj').addEventListener('click', () => cmd('proj'));
    $('pv-full').addEventListener('click', () => cmd('full'));
    $('pv-zero').addEventListener('click', () => { t0 = Date.now(); tick(); });
    $('pv-outline').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) cmd('go', { m: b.dataset.go }); });
    $('pv-main').addEventListener('click', (e) => { const b = e.target.closest('[data-vote]'); if (b) cmd('vote', { i: b.dataset.vote, d: b.dataset.d }); });
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); cmd('next'); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); cmd('prev'); }
      else if (e.key === '.') cmd('curtain');
    });
    window.addEventListener('beforeunload', () => send({ type: 'bye' }));
    send({ type: 'hello' });
    tick();
    setInterval(tick, 1000);
  }
  init();
  window.FFP = { state: () => S };
})();
