/* Modo apresentador, lado do projetor.
   Esta janela continua sendo a "verdadeira" (é a que a turma vê). Ela abre uma segunda janela
   (apresentador.html) para o notebook do professor, manda para lá o que está acontecendo
   (com as respostas e notas que a turma não vê) e obedece aos comandos de lá: avançar, voltar,
   ir para um momento, contar votos das placas, cortina.
   Transporte: BroadcastChannel e, de reserva, postMessage entre as janelas. Nada sai do computador. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);
  const CH = 'fabrica-funcoes-apresentador';
  let bc = null, win = null, linked = false, last = '', timer = 0, lastPing = 0;
  const seen = [];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function send(msg) {
    msg.id = uid(); msg.from = 'main';
    try { if (bc) bc.postMessage(msg); } catch (e) { /* sem canal */ }
    try { if (win && !win.closed) win.postMessage(msg, '*'); } catch (e) { /* janela fechada */ }
  }

  /* Resposta esperada de um produto na Fábrica */
  function expected(v, dir) {
    const L = FF.law();
    if (dir === 'fwd') {
      const r = FF.evalLaw(v, L);
      return r.error ? 'não dá para produzir (' + r.error + ')' : FF.fmt(r.y);
    }
    if (!FF.canReverse(L)) return '';
    let vals = [v];
    try { L.chain.slice().reverse().forEach((g) => { vals = vals.flatMap((w) => [].concat(X.gearApply(g, w, true))); }); }
    catch (e) { return 'não tem entrada possível'; }
    return L.vin + ' = ' + vals.map((w) => FF.fmt(w)).join(' ou ');
  }
  function fabSnap() {
    const st = FF.fab.status();
    const L = FF.law();
    const vin = L.vin || 'x';
    const pre = FF.ctx().id === 'livre' ? 'f(' + vin + ')' : FF.ctx().vout;
    const table = FF.inputList().slice(0, 12).map((x) => {
      const r = FF.evalLaw(x, L);
      return { x: FF.fmt(x), y: r.error ? null : FF.fmt(r.y) };
    });
    return {
      law: L.kind === 'expr' ? FF.math.inline(L.ast, 22, vin, pre + ' = ') : L.kind === 'piece' ? 'tarifa por faixas' : '',
      black: FF.state.black, predict: FF.state.predict,
      count: ($('narr-count') || {}).textContent || '', ntitle: ($('narr-title') || {}).textContent || '', nbody: ($('narr-body') || {}).innerHTML || '',
      run: st.run ? { v: FF.fmt(st.v), dir: st.dir, ans: expected(st.v, st.dir) } : null,
      vin, pre, table,
    };
  }
  function snapshot() {
    const s = FF.state;
    const out = { type: 'state', view: s.view, proj: s.proj, curtain: FF.ui.curtainOn(), turma: s.turma || '', aula: FF.aula.snapshot() };
    if (s.view === 'fab') out.fab = fabSnap();
    if (s.view === 'insp') out.insp = FF.insp.snap();
    if (s.view === 'game') out.game = FF.games.snap();
    if (s.view === 'emp') out.emp = { title: ($('emp-title') || {}).textContent || '' };
    return out;
  }
  function push(force) {
    if (!linked) return;
    let snap;
    try { snap = snapshot(); } catch (e) { return; }
    const key = JSON.stringify(snap);
    if (!force && key === last) return;
    last = key;
    send(snap);
  }
  // Depois de um comando, as ferramentas animam: manda de novo quando terminam
  function pushSoon() { push(); setTimeout(push, 160); setTimeout(push, 700); setTimeout(push, 1600); }

  function onMsg(msg) {
    if (!msg || msg.from !== 'pres' || seen.includes(msg.id)) return;
    seen.push(msg.id); if (seen.length > 60) seen.shift();
    lastPing = Date.now();
    if (msg.type === 'ping') { if (!linked) onMsg({ from: 'pres', id: uid(), type: 'hello' }); return; }
    if (msg.type === 'hello') {
      linked = true;
      document.documentElement.classList.add('pres-on');
      $('btn-pres').setAttribute('aria-pressed', 'true');
      push(true);
      clearInterval(timer);
      timer = setInterval(() => { if (Date.now() - lastPing > 6000) unlink(); else push(); }, 1200);
      return;
    }
    if (msg.type === 'bye') { unlink(); return; }
    if (msg.type !== 'cmd') return;
    switch (msg.cmd) {
      case 'next': FF.ui.curtain(false); FF.ui.advance(1); break;
      case 'prev': FF.ui.curtain(false); FF.ui.advance(-1); break;
      case 'go': FF.aula.go(Number(msg.m)); break;
      case 'vote': if (FF.state.view === 'game' && FF.state.gGame === 'hinge') FF.hinge.vote(Number(msg.i), Number(msg.d)); break;
      case 'curtain': FF.ui.curtain(); break;
      case 'proj': FF.set({ proj: !FF.state.proj }); break;
      case 'full': try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); } catch (e) { /* sem tela cheia */ } break;
      default: return;
    }
    pushSoon();
  }

  function unlink() {
    linked = false; last = '';
    clearInterval(timer);
    $('btn-pres').setAttribute('aria-pressed', 'false');
    document.documentElement.classList.remove('pres-on');
  }

  function open() {
    try {
      win = window.open('apresentador.html', 'ff-apresentador', 'width=1180,height=820');
    } catch (e) { win = null; }
    if (!win) {
      const t = $('toast');
      t.textContent = 'O navegador bloqueou a janela. Permita pop-ups para este site e tente de novo.';
      t.hidden = false; setTimeout(() => { t.hidden = true; }, 4000);
    }
  }

  function init() {
    try { bc = new BroadcastChannel(CH); bc.onmessage = (e) => onMsg(e.data); } catch (e) { bc = null; }
    window.addEventListener('message', (e) => { if (e.data && e.data.from === 'pres') { if (!win && e.source) win = e.source; onMsg(e.data); } });
    $('btn-pres').addEventListener('click', open);
    FF.on(() => pushSoon());
    ['keyup', 'click', 'input'].forEach((ev) => document.addEventListener(ev, () => { if (linked) pushSoon(); }, true));
    window.addEventListener('beforeunload', () => send({ type: 'main-bye' }));
    send({ type: 'main-hello' }); // um apresentador já aberto se reconecta
  }

  FF.pres = { init, open, _snapshot: snapshot, linked: () => linked };
})();
