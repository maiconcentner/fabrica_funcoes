/* Estado compartilhado, lei atual, produção, link e animação. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;

  const DEFAULTS = {
    view: 'aula',       // 'aula' | 'fab' (Fábrica) | 'insp' (É função?) | 'game' | 'emp'
    lesson: '',         // aula em andamento ('' = nenhuma)
    lm: 0,              // momento da aula
    ls: 0,              // passo revelado dentro do momento (telas de texto)
    iMode: 'diag',      // inspetor: 'diag' | 'tab' | 'graf'
    iCase: 0,           // caso atual do inspetor
    iCustom: '',        // diagrama montado pelo professor
    gGame: 'rule',      // desafio: 'rule' | 'rev' | 'race' | 'ex'
    gLevel: 1,          // nível dos desafios (1 a 3)
    gTeams: '',         // equipes e pontos (JSON)
    gClock: 60,         // segundos do cronômetro
    emp: '',            // Minha empresa (JSON)
    ctx: 'livre',
    law: '2x + 1',      // lei digitada (vazio quando a situação tem lei por faixas)
    dom: 'R',           // domínio: R, R+, N, {2;3;4}, (0;20)
    cd: 'R',            // contradomínio
    inputs: '',         // sugestões de entrada ("-2;-1;0"); vazio = as da situação
    preset: -1,         // lei pronta escolhida (para mostrar as perguntas do livro)
    made: '',           // valores já fabricados ("2;3;4"), para reabrir a produção
    bad: '',            // refugo: valores que não deu para produzir ("f0;f1;r-4")
    black: false,       // caixa-preta: esconde a lei e as engrenagens
    predict: false,     // prever a saída antes de ver
    table: true,
    diagram: true,
    graph: true,
    calc: true,         // coluna "cálculo" na tabela
    curve: false,       // traçar a curva no gráfico
    dec: 2,
    theme: 'light',     // tema claro por padrão ('auto' segue o sistema)
    themeV: 2,          // versão da preferência de tema salva
    font: 1,
    speed: 1,
    proj: false,        // modo projetor (preferência deste computador; não vai no link)
  };
  const STORE_KEY = 'fabrica-funcoes:v1';
  const listeners = [];

  FF.DEFAULTS = DEFAULTS;
  FF.state = Object.assign({}, DEFAULTS);

  FF.on = function (fn) { listeners.push(fn); };
  FF.set = function (patch, opts) {
    const prev = Object.assign({}, FF.state);
    Object.assign(FF.state, patch);
    sanitize(FF.state);
    const changed = Object.keys(patch).filter((k) => prev[k] !== FF.state[k]);
    if (!changed.length && !(opts && opts.force)) return;
    if (changed.some((k) => ['law', 'ctx', 'dom', 'cd'].includes(k))) lawCache = null;
    save();
    listeners.forEach((fn) => fn(changed, prev, opts || {}));
  };

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  FF.clamp = clamp;
  function sanitize(s) {
    if (!FF.CONTEXTS.some((c) => c.id === s.ctx)) s.ctx = 'livre';
    s.law = String(s.law == null ? '' : s.law).slice(0, 120);
    s.dom = String(s.dom || 'R');
    s.cd = String(s.cd || 'R');
    s.inputs = String(s.inputs || '');
    s.made = String(s.made || '');
    s.bad = String(s.bad || '');
    s.preset = Math.round(Number(s.preset));
    if (!(s.preset >= -1 && s.preset < FF.PRESETS.length)) s.preset = -1;
    s.dec = clamp(Math.round(Number(s.dec)), 0, 4);
    if (isNaN(s.dec)) s.dec = 2;
    s.font = clamp(Number(s.font) || 1, 0.85, 1.6);
    s.speed = clamp(Number(s.speed) || 1, 0.25, 3);
    ['black', 'predict', 'table', 'diagram', 'graph', 'calc', 'curve', 'proj'].forEach((k) => { s[k] = !!s[k]; });
    if (!['auto', 'light', 'dark'].includes(s.theme)) s.theme = 'light';
    if (!['aula', 'fab', 'insp', 'game', 'emp'].includes(s.view)) s.view = 'aula';
    s.lesson = String(s.lesson || '');
    s.lm = Math.max(0, Math.round(Number(s.lm) || 0));
    s.ls = Math.max(0, Math.round(Number(s.ls) || 0));
    s.emp = String(s.emp || '');
    if (!['rule', 'rev', 'race', 'ex', 'hinge'].includes(s.gGame)) s.gGame = 'rule';
    s.gLevel = clamp(Math.round(Number(s.gLevel) || 1), 1, 3);
    s.gTeams = String(s.gTeams || '');
    s.gClock = [30, 60, 90, 120, 180].includes(Number(s.gClock)) ? Number(s.gClock) : 60;
    if (!['diag', 'tab', 'graf'].includes(s.iMode)) s.iMode = 'diag';
    s.iCase = Math.max(0, Math.round(Number(s.iCase) || 0));
    s.iCustom = String(s.iCustom || '').slice(0, 400);
  }

  /* ---------- Lei atual ---------- */
  let lawCache = null;
  FF.law = function () {
    if (lawCache) return lawCache;
    const s = FF.state;
    const c = FF.ctx();
    let vin = c.vin;
    if (c.id === 'livre') {
      // Sem contexto, a variável é a letra que aparecer na lei (x, t, n...).
      const ls = X.letters(s.law);
      if (ls.length === 1) vin = ls[0];
    }
    let L;
    if (c.law && c.law.kind === 'piece' && !s.law) {
      L = {
        kind: 'piece', vin,
        pieces: c.law.pieces.map((p) => Object.assign({}, p, { ast: X.parse(p.src, vin) })),
      };
    } else {
      // Link sem lei: usa a lei da situação.
      const src = s.law || (typeof c.law === 'string' ? c.law : '');
      try {
        const ast = X.parse(src, vin);
        L = { kind: 'expr', vin, ast, chain: X.chain(ast), src };
        if (!L.chain) L.plan = X.plan(ast);
      } catch (e) {
        L = { kind: 'error', vin, error: e.message, src };
      }
    }
    L.dom = X.parseSet(s.dom);
    L.cd = X.parseSet(s.cd);
    lawCache = L;
    return L;
  };
  /* Calcula f(x). Devolve { y } ou { error }. */
  FF.evalLaw = function (x, L) {
    L = L || FF.law();
    try {
      if (L.kind === 'expr') return { y: X.evaluate(L.ast, x) };
      if (L.kind === 'piece') {
        const i = X.findPiece(L, x);
        if (i < 0) return { error: 'Fora das faixas da tarifa.' };
        return { y: X.evaluate(L.pieces[i].ast, x), piece: i };
      }
      return { error: L.error };
    } catch (e) {
      if (e instanceof X.DomainError) return { error: e.message, kind: e.kind };
      throw e;
    }
  };
  FF.canReverse = function (L) {
    L = L || FF.law();
    return L.kind === 'expr' && !!L.chain && X.invertible(L.chain);
  };

  /* Texto do "nome" da saída: f(x), P, d ... */
  FF.outName = function () {
    const c = FF.ctx();
    return c.vout;
  };

  /* ---------- Sugestões de entrada ---------- */
  FF.inputList = function () {
    const s = FF.state;
    const dom = FF.law().dom;
    if (dom.type === 'set') return dom.vals.slice();
    if (s.inputs) return s.inputs.split(';').map(X.parseNumber).filter((v) => !isNaN(v));
    return (FF.ctx().inputs || []).slice();
  };

  /* ---------- Formatação ---------- */
  FF.fmt = function (v, dec) { return X.fmtNum(v, dec); };
  FF.fmtIn = function (v) {
    const c = FF.ctx();
    return X.fmtNum(v) + (c.inUnit ? ' ' + c.inUnit : '');
  };
  FF.fmtOut = function (v) {
    const c = FF.ctx();
    if (c.money) return 'R$ ' + moneyStr(v);
    return X.fmtNum(v) + (c.outUnit ? ' ' + c.outUnit : '');
  };
  FF.fmtOutNum = function (v) {
    return FF.ctx().money ? moneyStr(v) : X.fmtNum(v);
  };
  function moneyStr(v) {
    const r = Math.round(v * 100) / 100;
    const s = Math.abs(r).toFixed(2).replace('.', ',');
    const [ip, fp] = s.split(',');
    return (r < 0 ? '−' : '') + (ip.length > 3 ? ip.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ip) + ',' + fp;
  }

  /* ---------- Persistência local ---------- */
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(FF.state)); } catch (e) { /* sem armazenamento */ }
  }
  FF.loadSaved = function () {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Quem salvou antes do tema claro virar padrão passa para o claro uma vez
        if (!saved.themeV) { saved.theme = 'light'; saved.themeV = 2; }
        Object.assign(FF.state, saved);
      }
    } catch (e) { /* ignora */ }
    sanitize(FF.state);
  };

  /* ---------- Link compartilhável ----------
     #c=luz~l=9%2C66%20%2B%200%2C66x~d=R+~b=R~k=tdgc~o=bp~n=2  */
  const FLAGS = { table: 't', diagram: 'g', graph: 'r', calc: 'c', curve: 'v' };
  const MODES = { black: 'b', predict: 'p' };
  FF.encodeHash = function () {
    const s = FF.state;
    const parts = [];
    if (s.lesson) parts.push('au=' + s.lesson + ':' + s.lm + ':' + s.ls);
    if (s.view === 'aula') parts.push('v=aula');
    if (s.view === 'fab') parts.push('v=fab');
    if (s.view === 'insp') parts.push('v=insp', 'im=' + s.iMode, 'ic=' + s.iCase);
    if (s.view === 'game') parts.push('v=game', 'gg=' + s.gGame, 'gl=' + s.gLevel);
    if (s.view === 'emp') parts.push('v=emp', 'e=' + encodeURIComponent(s.emp));
    if (s.view === 'insp' && s.iCustom) parts.push('iu=' + encodeURIComponent(s.iCustom));
    parts.push('c=' + s.ctx);
    const c = FF.ctx();
    if (!(c.law && c.law.kind === 'piece' && !s.law)) parts.push('l=' + encodeURIComponent(s.law));
    parts.push('d=' + encodeURIComponent(s.dom), 'b=' + encodeURIComponent(s.cd));
    if (s.inputs) parts.push('i=' + encodeURIComponent(s.inputs));
    if (s.preset >= 0) parts.push('q=' + s.preset);
    parts.push('k=' + Object.keys(FLAGS).filter((k) => s[k]).map((k) => FLAGS[k]).join(''));
    parts.push('o=' + Object.keys(MODES).filter((k) => s[k]).map((k) => MODES[k]).join(''));
    parts.push('n=' + s.dec);
    if (s.made) parts.push('m=' + encodeURIComponent(s.made));
    if (s.bad) parts.push('x=' + encodeURIComponent(s.bad));
    // O passo também vai no link: produto na esteira ou passo da inspeção
    if (s.view === 'fab' && FF.fab && FF.fab.status().run) {
      const st = FF.fab.status();
      parts.push('fr=' + (st.dir === 'rev' ? 'r' : 'f') + encodeURIComponent(st.v) + ':' + st.i);
    }
    if (s.view === 'insp' && FF.insp) parts.push('is=' + FF.insp.step());
    return parts.join('~');
  };
  FF.decodeHash = function (hash) {
    const h = (hash || '').replace(/^#/, '');
    if (!h || h.indexOf('=') < 0) return null;
    const out = {};
    h.split('~').forEach((tok) => {
      const i = tok.indexOf('=');
      if (i < 1) return;
      const k = tok.slice(0, i);
      let v = tok.slice(i + 1);
      try { v = decodeURIComponent(v); } catch (e) { return; }
      switch (k) {
        case 'v': out.view = v; break;
        case 'au': { const [l, m, k] = v.split(':'); out.lesson = l; out.lm = parseInt(m, 10) || 0; out.ls = parseInt(k, 10) || 0; break; }
        case 'fr': out._run = v; break;
        case 'is': out._istep = parseInt(v, 10) || 0; break;
        case 'gg': out.gGame = v; break;
        case 'gl': out.gLevel = parseInt(v, 10); break;
        case 'e': out.emp = v; break;
        case 'im': out.iMode = v; break;
        case 'ic': out.iCase = parseInt(v, 10); break;
        case 'iu': out.iCustom = v; break;
        case 'c': out.ctx = v; break;
        case 'l': out.law = v; break;
        case 'd': out.dom = v; break;
        case 'b': out.cd = v; break;
        case 'i': out.inputs = v; break;
        case 'q': out.preset = parseInt(v, 10); break;
        case 'n': out.dec = parseInt(v, 10); break;
        case 'm': out.made = v; break;
        case 'x': out.bad = v; break;
        case 'k': Object.keys(FLAGS).forEach((f) => { out[f] = v.includes(FLAGS[f]); }); break;
        case 'o': Object.keys(MODES).forEach((f) => { out[f] = v.includes(MODES[f]); }); break;
      }
    });
    if (out.ctx && !('law' in out)) out.law = '';
    return Object.keys(out).length ? out : null;
  };

  /* ---------- Animação ---------- */
  FF.reducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  FF.ease = function (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  FF.tween = function (duration, onFrame, onDone) {
    let raf = 0;
    let start = 0;
    let cancelled = false;
    if (duration <= 0 || FF.reducedMotion()) {
      onFrame(1);
      if (onDone) onDone();
      return { cancel() {} };
    }
    function frame(ts) {
      if (cancelled) return;
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      onFrame(t);
      if (t < 1) raf = requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    raf = requestAnimationFrame(frame);
    return { cancel() { cancelled = true; cancelAnimationFrame(raf); } };
  };
})();
