/* Inicialização, cartões laterais, painel do professor e atalhos. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ---------- Situação e lei ---------- */
  function chooseContext(id) {
    const c = FF.ctx(id);
    FF.set({ ctx: c.id, law: typeof c.law === 'string' ? c.law : '', dom: c.dom, cd: c.cd, inputs: '', preset: -1, made: '' });
  }
  function choosePreset(i) {
    const p = FF.PRESETS[i];
    FF.set({ ctx: 'livre', law: p.law, dom: p.dom || 'R', cd: p.cd || 'R', inputs: (p.inputs || []).join(';'), preset: i, made: '' });
  }
  function applyLaw(src) {
    const c = FF.ctx();
    let vin = c.vin;
    if (c.id === 'livre') { const ls = X.letters(src); if (ls.length === 1) vin = ls[0]; }
    try {
      X.parse(src, vin);
    } catch (e) {
      $('law-msg').textContent = e.message;
      $('law-msg').classList.add('err');
      $('in-law').classList.add('invalid');
      return false;
    }
    $('law-msg').classList.remove('err');
    $('in-law').classList.remove('invalid');
    FF.set({ law: src.trim(), made: '', preset: -1 });
    return true;
  }
  function lawPrefix() {
    const c = FF.ctx();
    const L = FF.law();
    return c.id === 'livre' ? 'f(' + L.vin + ') =' : c.vout + ' =';
  }

  function renderLawView() {
    const L = FF.law();
    const S = FF.state;
    const pre = lawPrefix() + ' ';
    let h;
    if (S.black) h = '<span class="law-big">' + esc(pre) + '?</span>';
    else if (L.kind === 'expr') h = FF.math.inline(L.ast, 30, L.vin, pre, 320);
    else if (L.kind === 'piece') {
      h = '<table class="pieces">' + L.pieces.map((p) =>
        '<tr><td>' + esc(p.label) + '</td><td>' + FF.math.inline(p.ast, 16, L.vin, FF.ctx().vout + ' = ', 200) + '</td></tr>').join('') + '</table>';
    } else h = '<span class="law-big bad">' + esc(pre) + '…</span>';
    let gearsTxt = '';
    if (!S.black && L.kind === 'expr') {
      gearsTxt = L.chain
        ? '<p class="note">' + (L.chain.length ? 'Engrenagens, em ordem: ' + L.chain.map((g) => '<b class="gtag">' + esc(X.gearLabel(g)) + '</b>').join(' → ') : 'Sem engrenagens: sai o mesmo valor que entra.') + '</p>'
        : '<p class="note">A variável aparece mais de uma vez: a máquina calcula numa <b>tela</b>, trocando <i>' + L.vin + '</i> pelo valor.</p>';
    }
    $('law-view').innerHTML = h + gearsTxt;
  }

  function renderGearEditor() {
    const L = FF.law();
    const list = $('gear-list');
    if (L.kind !== 'expr' || !L.chain) {
      list.innerHTML = '<li class="note">Esta lei não é uma fila de engrenagens. Use <b>Começar do zero</b> para montar uma.</li>';
      return;
    }
    if (!L.chain.length) { list.innerHTML = '<li class="note">Nenhuma engrenagem ainda.</li>'; return; }
    list.innerHTML = L.chain.map((g, i) => {
      const needs = X.GEAR_MENU.find((m) => m.op === g.op);
      return '<li class="gear-row" data-i="' + i + '"><span class="gear-n">' + (i + 1) + '</span>' +
        '<span class="gtag">' + esc(X.gearLabel(g)) + '</span>' +
        (needs && needs.needsK ? '<input type="text" inputmode="decimal" class="gear-kin" value="' + esc(X.fmtNum(g.kv, 4)) + '" aria-label="Número da engrenagem ' + (i + 1) + '">' : '<span></span>') +
        '<button class="icon-btn sm" data-up="' + i + '" title="Mover para antes" aria-label="Mover para antes"' + (i === 0 ? ' disabled' : '') + '><svg viewBox="0 0 24 24"><path d="m6 14 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button class="icon-btn sm" data-del="' + i + '" title="Tirar esta engrenagem" aria-label="Tirar esta engrenagem"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></li>';
    }).join('');
  }
  function setChain(chain) {
    const L = FF.law();
    const ast = X.fromChain(chain);
    applyLaw(X.text(ast, L.vin));
  }
  function bindGearEditor() {
    $('gear-op').innerHTML = X.GEAR_MENU.map((m) => '<option value="' + m.op + '">' + esc(m.label) + '</option>').join('');
    const syncK = () => { const m = X.GEAR_MENU.find((g) => g.op === $('gear-op').value); $('gear-k').hidden = !m.needsK; };
    $('gear-op').addEventListener('change', syncK);
    syncK();
    $('gear-add').addEventListener('click', () => {
      const L = FF.law();
      const m = X.GEAR_MENU.find((g) => g.op === $('gear-op').value);
      const kv = m.needsK ? X.parseNumber($('gear-k').value) : 0;
      if (m.needsK && isNaN(kv)) { $('gear-k').classList.add('invalid'); $('gear-k').focus(); return; }
      if ((m.op === 'div' && kv === 0)) { $('gear-k').classList.add('invalid'); return; }
      $('gear-k').classList.remove('invalid');
      const chain = L.kind === 'expr' && L.chain ? L.chain.slice() : [];
      chain.push({ op: m.op, kv });
      setChain(chain);
      $('gear-k').value = '';
    });
    $('gear-new').addEventListener('click', () => {
      const L = FF.law();
      applyLaw(L.vin || 'x');
      $('gears-edit').open = true;
    });
    $('gear-list').addEventListener('click', (e) => {
      const L = FF.law();
      if (!L.chain) return;
      const up = e.target.closest('[data-up]');
      const del = e.target.closest('[data-del]');
      const chain = L.chain.slice();
      if (up) {
        const i = Number(up.dataset.up);
        [chain[i - 1], chain[i]] = [chain[i], chain[i - 1]];
        setChain(chain);
      } else if (del) {
        chain.splice(Number(del.dataset.del), 1);
        setChain(chain);
      }
    });
    $('gear-list').addEventListener('change', (e) => {
      const inp = e.target.closest('.gear-kin');
      if (!inp) return;
      const L = FF.law();
      const i = Number(inp.closest('[data-i]').dataset.i);
      const kv = X.parseNumber(inp.value);
      if (isNaN(kv) || (L.chain[i].op === 'div' && kv === 0)) { inp.classList.add('invalid'); return; }
      const chain = L.chain.map((g) => Object.assign({}, g));
      chain[i] = { op: chain[i].op, kv };
      setChain(chain);
    });
  }

  function renderContextCard() {
    const S = FF.state;
    const c = FF.ctx();
    $('sel-ctx').value = c.id;
    $('ctx-story').innerHTML = c.story ? (c.book ? '<span class="book">' + esc(c.book) + '</span> ' : '') + c.story : 'Uma máquina qualquer: escolha a lei ao lado ou uma das <b>Leis do livro</b>.';
    const qs = c.id === 'livre' && S.preset >= 0 ? FF.PRESETS[S.preset].questions || [] : c.questions || [];
    const canRev = FF.canReverse();
    $('ctx-questions').innerHTML = qs.length
      ? '<p class="qhead">Perguntas do livro</p>' + qs.map((q, i) =>
        '<button class="qbtn" data-q="' + i + '"' + (q.dir === 'rev' && !canRev ? ' disabled' : '') + '><span class="qdir">' + (q.dir === 'rev' ? '◀' : '▶') + '</span>' + esc(q.q) + '</button>').join('')
      : '';
    $('ctx-questions').dataset.src = c.id === 'livre' ? 'p' + S.preset : c.id;
  }

  function renderSetsCard() {
    const S = FF.state;
    const L = FF.law();
    const dom = L.dom;
    const domSel = $('sel-dom');
    const iv = $('opt-dom-iv');
    if (['R', 'R+', 'N'].includes(S.dom)) { domSel.value = S.dom; iv.hidden = true; }
    else if (dom.type === 'set') { domSel.value = 'set'; iv.hidden = true; }
    else { iv.hidden = false; iv.textContent = X.setLabel(dom, L.vin).replace(/<[^>]+>/g, ''); domSel.value = 'iv'; }
    $('in-dom-set').hidden = domSel.value !== 'set';
    if (document.activeElement !== $('in-dom-set') && dom.type === 'set') $('in-dom-set').value = dom.vals.map((v) => X.fmtNum(v, 4)).join('; ');
    $('sel-cd').value = L.cd.type === 'set' ? 'set' : 'R';
    $('in-cd-set').hidden = L.cd.type !== 'set';
    if (document.activeElement !== $('in-cd-set') && L.cd.type === 'set') $('in-cd-set').value = L.cd.vals.map((v) => X.fmtNum(v, 4)).join('; ');
    $('field-inputs').hidden = dom.type === 'set';
    if (document.activeElement !== $('in-inputs')) $('in-inputs').value = FF.inputList().map((v) => X.fmtNum(v, 4)).join('; ');
  }
  const listStr = (s) => s.split(/[;\n]|,(?=\s)/).map((t) => X.parseNumber(t)).filter((v) => !isNaN(v));
  function bindSetsCard() {
    $('sel-dom').addEventListener('change', (e) => {
      const v = e.target.value;
      if (v === 'set') {
        const vals = FF.inputList().slice(0, 6);
        FF.set({ dom: '{' + (vals.length ? vals : [1, 2, 3, 4]).join(';') + '}', made: '' });
      } else if (v !== 'iv') FF.set({ dom: v, made: '' });
    });
    $('in-dom-set').addEventListener('change', (e) => {
      const vals = listStr(e.target.value);
      if (vals.length) FF.set({ dom: '{' + vals.join(';') + '}', made: '' });
    });
    $('sel-cd').addEventListener('change', (e) => {
      if (e.target.value === 'set') {
        const ys = FF.prod.records.map((r) => r.y);
        FF.set({ cd: '{' + (ys.length ? ys : [0, 1, 2, 3, 4]).join(';') + '}', made: '' });
      } else FF.set({ cd: 'R', made: '' });
    });
    $('in-cd-set').addEventListener('change', (e) => {
      const vals = listStr(e.target.value);
      if (vals.length) FF.set({ cd: '{' + vals.join(';') + '}', made: '' });
    });
    $('in-inputs').addEventListener('change', (e) => {
      FF.set({ inputs: listStr(e.target.value).slice(0, 12).join(';') });
    });
  }

  /* ---------- Caixa-preta: palpite ---------- */
  function testGuess() {
    const L = FF.law();
    const recs = FF.prod.records;
    const out = $('guess-msg');
    let g;
    try { g = X.parse($('in-guess').value, L.vin); } catch (e) { out.innerHTML = '<p class="err">' + esc(e.message) + '</p>'; return; }
    if (!recs.length) { out.innerHTML = '<p>Fabrique alguns valores primeiro: são as pistas para testar o palpite.</p>'; return; }
    const val = (x) => { try { return X.evaluate(g, x); } catch (e) { return NaN; } };
    const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
    const wrong = recs.filter((r) => !close(val(r.x), r.y));
    const pre = FF.ctx().id === 'livre' ? 'f' : FF.ctx().vout;
    if (wrong.length) {
      out.innerHTML = '<p>Acerta <b>' + (recs.length - wrong.length) + ' de ' + recs.length + '</b> produtos.</p><ul>' + wrong.slice(0, 3).map((r) =>
        '<li>Para <i>' + L.vin + '</i> = ' + FF.fmt(r.x) + ', a máquina deu <b>' + FF.fmt(r.y) + '</b> e o palpite dá <b>' + (isNaN(val(r.x)) ? 'erro' : FF.fmt(val(r.x))) + '</b>.</li>').join('') + '</ul>';
      return;
    }
    // Acertou tudo o que foi fabricado: é a mesma lei?
    const sample = [];
    if (L.dom.type === 'set') sample.push.apply(sample, L.dom.vals);
    else for (let k = 0; k < 40; k++) sample.push(X.tidy(-7.3 + k * 0.53));
    const diff = sample.find((x) => {
      if (!X.inSet(L.dom, x)) return false;
      const r = FF.evalLaw(x, L);
      if (r.error) return false;
      return !close(val(x), r.y);
    });
    if (diff == null) {
      out.innerHTML = '<p class="ok"><b>Descobriu!</b> O palpite ' + FF.math.inline(g, 20, L.vin, pre + '(' + L.vin + ') = ') + ' dá sempre o mesmo resultado que a máquina.</p>';
    } else {
      out.innerHTML = '<p>Acerta <b>todos os ' + recs.length + '</b> produtos feitos até agora… mas não é a lei da máquina. Fabrique outros valores para achar a diferença.</p>';
    }
  }

  /* ---------- Reflete o estado na interface ---------- */
  function syncUI() {
    const S = FF.state;
    const L = FF.law();
    $('btn-black').setAttribute('aria-pressed', S.black);
    $('btn-predict').setAttribute('aria-pressed', S.predict);
    document.querySelectorAll('[data-flag]').forEach((b) => b.setAttribute('aria-pressed', !!S[b.dataset.flag]));
    document.querySelector('[data-flag="curve"]').disabled = L.dom.type === 'set' || !!L.dom.integer;
    document.querySelector('[data-flag="calc"]').hidden = !S.table;
    $('law-prefix').textContent = lawPrefix();
    $('guess-prefix').textContent = lawPrefix();
    const piece = L.kind === 'piece';
    if (document.activeElement !== $('in-law')) $('in-law').value = piece ? '' : L.src || S.law;
    $('in-law').disabled = piece;
    $('in-law').placeholder = piece ? 'tarifa por faixas (fixa)' : '';
    $('law-edit').hidden = S.black;
    $('guess-box').hidden = !S.black;
    if (L.kind === 'error') { $('law-msg').textContent = L.error; $('law-msg').classList.add('err'); }
    renderLawView();
    renderGearEditor();
    renderContextCard();
    renderSetsCard();
    segSync('seg-dec', String(S.dec));
    segSync('seg-theme', S.theme);
    segSync('seg-speed', String(S.speed));
    $('rg-font').value = S.font;
    document.documentElement.style.setProperty('--fs', S.font);
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
    $('share-url').value = shareUrl();
  }
  function segSync(id, val) {
    Array.from($(id).querySelectorAll('button')).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === val));
  }
  function segBind(id, fn) {
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (b) fn(b.dataset.v);
    });
  }
  function shareUrl() {
    const base = location.href.split('#')[0];
    return base + '#' + FF.encodeHash();
  }

  /* ---------- Painel ---------- */
  function openPanel(open) {
    $('panel').hidden = !open;
    $('scrim').hidden = !open;
    $('btn-panel').setAttribute('aria-expanded', open);
    if (open) $('panel-close').focus();
  }
  function bindPanel() {
    $('btn-panel').addEventListener('click', () => openPanel($('panel').hidden));
    $('panel-close').addEventListener('click', () => { openPanel(false); $('btn-panel').focus(); });
    $('scrim').addEventListener('click', () => openPanel(false));
    segBind('seg-dec', (v) => FF.set({ dec: Number(v) }));
    segBind('seg-theme', (v) => FF.set({ theme: v }));
    segBind('seg-speed', (v) => FF.set({ speed: Number(v) }));
    $('rg-font').addEventListener('input', (e) => FF.set({ font: Number(e.target.value) }));
    $('share-copy').addEventListener('click', () => {
      const url = shareUrl();
      const input = $('share-url');
      const done = (ok) => {
        $('share-msg').textContent = ok ? 'Link copiado. Cole no chat ou no mural da turma.' : 'Selecione o link acima e copie manualmente.';
        if (!ok) { input.focus(); input.select(); }
      };
      try { navigator.clipboard.writeText(url).then(() => done(true), () => done(false)); } catch (e) { done(false); }
    });
    $('reset-all').addEventListener('click', () => {
      FF.set(Object.assign({}, FF.DEFAULTS), { force: true });
      FF.fab.clear();
      openPanel(false);
    });
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* sem suporte */ }
  }

  /* ---------- Teclado ---------- */
  function onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key;
    const S = FF.state;
    if (key === 'Escape') {
      if (!$('panel').hidden) { openPanel(false); return; }
      FF.reps.unmax();
      return;
    }
    if (key === 'ArrowRight' || key === 'PageDown' || (key === ' ' && tag !== 'button')) { e.preventDefault(); FF.fab.next(); return; }
    if (key === 'ArrowLeft' || key === 'PageUp') { e.preventDefault(); FF.fab.prev(); return; }
    if (key === 'Home') { e.preventDefault(); FF.fab.first(); return; }
    switch (key.toLowerCase()) {
      case 'b': FF.set({ black: !S.black }); break;
      case 'o': FF.set({ predict: !S.predict }); break;
      case 't': FF.set({ table: !S.table }); break;
      case 'd': FF.set({ diagram: !S.diagram }); break;
      case 'g': FF.set({ graph: !S.graph }); break;
      case 'v': e.preventDefault(); $('in-value').focus(); $('in-value').select(); break;
      case 'f': toggleFullscreen(); break;
      case 'p': openPanel($('panel').hidden); break;
      default: return;
    }
  }

  /* ---------- Início ---------- */
  function init() {
    FF.loadSaved();
    const fromHash = FF.decodeHash(location.hash);
    if (fromHash) Object.assign(FF.state, fromHash);
    FF.set({}, { force: true });

    $('sel-ctx').innerHTML = FF.CONTEXTS.map((c) => '<option value="' + c.id + '">' + (c.icon ? c.icon + ' ' : '') + esc(c.name) + (c.book ? ' · ' + esc(c.book) : '') + '</option>').join('');
    $('sel-ctx').addEventListener('change', (e) => chooseContext(e.target.value));
    $('presets').innerHTML = FF.PRESETS.map((p, i) =>
      '<button class="preset" data-p="' + i + '"><span class="pg">' + esc(p.group) + '</span><b>' + esc(p.title) + '</b>' + (p.desc ? '<span>' + esc(p.desc) + '</span>' : '') + '</button>').join('');
    $('presets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]');
      if (b) choosePreset(Number(b.dataset.p));
    });
    $('ctx-questions').addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]');
      if (!b) return;
      const S = FF.state;
      const c = FF.ctx();
      const qs = c.id === 'livre' && S.preset >= 0 ? FF.PRESETS[S.preset].questions : c.questions;
      const q = qs[Number(b.dataset.q)];
      $('in-value').value = X.fmtNum(q.v, 4);
      FF.fab.load(q.v, q.dir);
    });
    $('law-apply').addEventListener('click', () => applyLaw($('in-law').value));
    $('in-law').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (applyLaw($('in-law').value)) $('in-law').blur(); } });
    $('btn-guess').addEventListener('click', testGuess);
    $('in-guess').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); testGuess(); } });
    $('btn-reveal').addEventListener('click', () => FF.set({ black: false }));
    $('btn-black').addEventListener('click', () => FF.set({ black: !FF.state.black }));
    $('btn-predict').addEventListener('click', () => FF.set({ predict: !FF.state.predict }));
    $('btn-full').addEventListener('click', toggleFullscreen);
    document.querySelectorAll('[data-flag]').forEach((b) => b.addEventListener('click', () => FF.set({ [b.dataset.flag]: !FF.state[b.dataset.flag] })));
    bindGearEditor();
    bindSetsCard();
    bindPanel();
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', () => {
      const h = FF.decodeHash(location.hash);
      if (h) FF.set(h);
    });

    FF.on(syncUI);
    FF.on((changed) => {
      if (changed.some((k) => ['law', 'ctx', 'dom', 'cd'].includes(k))) {
        $('guess-msg').innerHTML = '';
        FF.fab.reset();
      } else if (changed.some((k) => ['black', 'predict'].includes(k))) {
        FF.fab.reset();
      } else if (changed.some((k) => ['dec', 'inputs'].includes(k))) {
        FF.fab.render();
        FF.reps.render();
      } else if (changed.some((k) => ['table', 'diagram', 'graph', 'calc', 'curve'].includes(k))) {
        FF.reps.render();
      }
    });
    syncUI();
    FF.fab.init();
    FF.reps.init();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { syncUI(); FF.reps.render(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
