/* Resumo da turma: os votos das Placas A–E (guardados neste navegador), por descritor,
   com os erros mais escolhidos, no formato do relatório do PAE ("a alternativa X atraiu N%"). */
(function () {
  'use strict';
  const FF = window.FF;
  const $ = (id) => document.getElementById(id);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  const LETTERS = 'ABCDE';
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const V = { turma: '*', per: 'all', armed: false, listOpen: false };

  function dateBR(iso, time) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + (time ? ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) : '');
  }
  function lessonName(id) {
    const i = (FF.LESSONS || []).findIndex((l) => l.id === id);
    return i >= 0 ? 'Aula ' + (i + 1) : 'Desafios';
  }
  const total = (r) => r.counts.reduce((a, b) => a + b, 0);
  const errsOf = (r) => r.errs || r.whys || [];

  /* ---------- Dados ---------- */
  function all() { return FF.hinge.results().filter((r) => r && Array.isArray(r.counts) && total(r) > 0); }
  function filtered() {
    const now = Date.now();
    const lim = { today: 'today', d7: 7, d30: 30 }[V.per];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return all().filter((r) => {
      if (V.turma !== '*' && (r.turma || '') !== V.turma) return false;
      const t = new Date(r.when).getTime();
      if (lim === 'today') return t >= today.getTime();
      if (lim) return now - t <= lim * 864e5;
      return true;
    }).sort((a, b) => new Date(a.when) - new Date(b.when));
  }
  function byDesc(rows) {
    const m = {};
    rows.forEach((r) => {
      const d = m[r.code] || (m[r.code] = { code: r.code, n: 0, votes: 0, ok: 0, errs: {} });
      d.n++;
      const tt = total(r);
      d.votes += tt;
      d.ok += r.counts[r.ok] || 0;
      errsOf(r).forEach((e, i) => { if (i !== r.ok && e && r.counts[i]) d.errs[e] = (d.errs[e] || 0) + r.counts[i]; });
    });
    return Object.values(m).map((d) => {
      const top = Object.entries(d.errs).sort((a, b) => b[1] - a[1])[0];
      return Object.assign(d, { rate: pct(d.ok, d.votes), top: top ? { e: top[0], n: top[1], p: pct(top[1], d.votes) } : null });
    }).sort((a, b) => a.rate - b.rate);
  }
  function byErr(rows) {
    const m = {};
    let wrong = 0;
    rows.forEach((r) => errsOf(r).forEach((e, i) => {
      if (i === r.ok || !e || !r.counts[i]) return;
      const x = m[e] || (m[e] = { e, n: 0, codes: new Set() });
      x.n += r.counts[i]; x.codes.add(r.code); wrong += r.counts[i];
    }));
    return { list: Object.values(m).sort((a, b) => b.n - a.n), wrong };
  }
  function byTurma(rows) {
    const m = {};
    rows.forEach((r) => {
      const k = r.turma || '(sem turma)';
      const x = m[k] || (m[k] = { t: k, n: 0, votes: 0, ok: 0 });
      x.n++; x.votes += total(r); x.ok += r.counts[r.ok] || 0;
    });
    return Object.values(m).sort((a, b) => a.t.localeCompare(b.t));
  }
  const status = (rate) => (rate < 50 ? { k: 'warn', w: 'Retomar' } : rate < 70 ? { k: 'q', w: 'Consolidar' } : { k: 'ok', w: 'Adequado' });

  /* ---------- Texto para o relatório ---------- */
  function reportText(rows) {
    if (!rows.length) return '';
    const votes = rows.reduce((a, r) => a + total(r), 0);
    const ok = rows.reduce((a, r) => a + (r.counts[r.ok] || 0), 0);
    const ds = byDesc(rows);
    const er = byErr(rows);
    const turma = V.turma === '*' ? 'todas as turmas' : V.turma || 'sem turma';
    const d0 = dateBR(rows[0].when), d1 = dateBR(rows[rows.length - 1].when);
    const L = [];
    L.push('Perguntas-dobradiça (Placas A–E) – Funções – ' + turma + ' – ' + (d0 === d1 ? d0 : d0 + ' a ' + d1));
    L.push('');
    L.push('Foram aplicadas ' + rows.length + ' pergunta' + (rows.length > 1 ? 's' : '') + ' no formato da AvaliaSESI (alternativas A a E), com ' + votes + ' respostas registradas por placas e ' + pct(ok, votes) + '% de acerto geral.');
    L.push('');
    L.push('Resultado por descritor (do menor para o maior acerto):');
    ds.forEach((d) => {
      L.push('• ' + d.code + ' (' + (FF.hinge.DESC[d.code] || '').replace(/\.$/, '') + '): ' + d.n + ' pergunta' + (d.n > 1 ? 's' : '') + ', ' + d.votes + ' respostas, ' + d.rate + '% de acerto' +
        (d.top ? '. Erro mais escolhido: "' + d.top.e + '" (' + d.top.p + '% das respostas).' : '.'));
    });
    if (er.list.length) {
      L.push('');
      L.push('Erros mais frequentes em todas as perguntas:');
      er.list.slice(0, 5).forEach((x, i) => L.push((i + 1) + ') ' + x.e + ': ' + pct(x.n, er.wrong) + '% das respostas erradas (' + Array.from(x.codes).join(', ') + ').'));
    }
    const ret = ds.filter((d) => d.rate < 50).map((d) => d.code);
    const con = ds.filter((d) => d.rate >= 50 && d.rate < 70).map((d) => d.code);
    const ade = ds.filter((d) => d.rate >= 70).map((d) => d.code);
    L.push('');
    L.push('Encaminhamentos:' +
      (ret.length ? ' retomar ' + ret.join(', ') + ' (abaixo de 50% de acerto), com nova pergunta-dobradiça sobre o erro mais escolhido;' : '') +
      (con.length ? ' consolidar ' + con.join(', ') + ' (entre 50% e 69%) no aquecimento das próximas aulas;' : '') +
      (ade.length ? ' manter ' + ade.join(', ') + ' (70% ou mais) em revisão espaçada.' : ''));
    return L.join('\n').replace(/;$/, '.');
  }

  /* ---------- Planilha (CSV para Excel/Planilhas, separado por ;) ---------- */
  function csv(rows) {
    const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['data', 'turma', 'aula', 'descritor', 'tipo de pergunta', 'correta', 'A', 'B', 'C', 'D', 'E', 'respostas', 'acerto (%)', 'erro mais escolhido', 'erro mais escolhido (%)'];
    const lines = rows.map((r) => {
      const tt = total(r);
      const errs = errsOf(r);
      let bi = -1;
      r.counts.forEach((c, i) => { if (i !== r.ok && c > 0 && (bi < 0 || c > r.counts[bi])) bi = i; });
      return [dateBR(r.when, true), r.turma || '', lessonName(r.lesson), r.code, FF.hinge.TPL_NAME(r.tpl), LETTERS[r.ok]].concat(r.counts)
        .concat([tt, pct(r.counts[r.ok], tt), bi >= 0 ? LETTERS[bi] + ': ' + errs[bi] : '', bi >= 0 ? pct(r.counts[bi], tt) : '']).map(q).join(';');
    });
    return '﻿' + head.map(q).join(';') + '\n' + lines.join('\n');
  }
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ---------- Desenho ---------- */
  function bar(rate, k) { return '<span class="rs-bar k-' + k + '"><i style="width:' + rate + '%"></i></span>'; }
  function render() {
    const rows = filtered();
    const turmas = Array.from(new Set(all().map((r) => r.turma || ''))).sort();
    const votes = rows.reduce((a, r) => a + total(r), 0);
    const ok = rows.reduce((a, r) => a + (r.counts[r.ok] || 0), 0);
    let h = '<div class="rs-filters"><label>Turma <select id="rs-turma" class="select"><option value="*">Todas</option>' +
      turmas.map((t) => '<option value="' + esc(t) + '"' + (t === V.turma ? ' selected' : '') + '>' + esc(t || '(sem turma)') + '</option>').join('') + '</select></label>' +
      '<div class="seg seg-sm" id="rs-per" role="group" aria-label="Período">' + [['today', 'Hoje'], ['d7', '7 dias'], ['d30', '30 dias'], ['all', 'Tudo']].map(([v, w]) =>
        '<button data-v="' + v + '" aria-pressed="' + (V.per === v) + '">' + w + '</button>').join('') + '</div></div>';
    if (!rows.length) {
      h += '<div class="rs-empty"><p><b>Ainda não há respostas registradas' + (V.turma !== '*' || V.per !== 'all' ? ' com esses filtros' : '') + '.</b></p>' +
        '<p class="note">Nas Placas A–E (Desafios ou dentro das aulas), toque nas letras para contar os votos antes de revelar. Cada pergunta com votos entra aqui, com a turma escrita no alto da pergunta.</p></div>';
      $('rs-body').innerHTML = h;
      $('rs-copy').disabled = $('rs-csv').disabled = $('rs-print').disabled = $('rs-clear').disabled = true;
      return;
    }
    $('rs-copy').disabled = $('rs-csv').disabled = $('rs-print').disabled = $('rs-clear').disabled = false;
    const g = pct(ok, votes);
    h += '<div class="rs-kpis"><div class="kpi"><span>Perguntas</span><b>' + rows.length + '</b></div><div class="kpi"><span>Respostas (placas)</span><b>' + votes + '</b></div>' +
      '<div class="kpi ' + (g < 50 ? 'dn' : 'up') + '"><span>Acerto geral</span><b>' + g + '%</b></div></div>';
    // por descritor
    h += '<h3 class="rs-h">Por descritor <small>do menor para o maior acerto</small></h3><table class="rs-table"><thead><tr><th>Descritor</th><th>Perguntas</th><th>Respostas</th><th>Acerto</th><th>Erro mais escolhido</th><th></th></tr></thead><tbody>' +
      byDesc(rows).map((d) => {
        const st = status(d.rate);
        return '<tr><td><b>' + esc(d.code) + '</b><small>' + esc(FF.hinge.DESC[d.code] || '') + '</small></td><td class="num">' + d.n + '</td><td class="num">' + d.votes + '</td>' +
          '<td class="rs-rate">' + bar(d.rate, st.k) + '<b>' + d.rate + '%</b></td>' +
          '<td>' + (d.top ? esc(d.top.e) + ' <b class="rs-p">' + d.top.p + '%</b>' : '—') + '</td><td><span class="kchip k-' + st.k + '">' + st.w + '</span></td></tr>';
      }).join('') + '</tbody></table>';
    // erros mais frequentes
    const er = byErr(rows);
    if (er.list.length) {
      h += '<h3 class="rs-h">Erros mais frequentes <small>em todas as perguntas; o mesmo erro pode aparecer em descritores diferentes</small></h3><ol class="rs-errs">' +
        er.list.slice(0, 8).map((x) => { const p = pct(x.n, er.wrong); return '<li><span class="rs-e">' + esc(x.e) + '</span>' + bar(p, 'warn') + '<b>' + p + '%</b><small>' + Array.from(x.codes).join(', ') + '</small></li>'; }).join('') + '</ol>';
    }
    // comparação entre turmas
    const bt = byTurma(rows);
    if (V.turma === '*' && bt.length > 1) {
      h += '<h3 class="rs-h">Por turma</h3><table class="rs-table rs-small rs-turmas"><thead><tr><th>Turma</th><th>Perguntas</th><th>Respostas</th><th>Acerto</th></tr></thead><tbody>' +
        bt.map((x) => { const r = pct(x.ok, x.votes); return '<tr><td><b>' + esc(x.t) + '</b></td><td class="num">' + x.n + '</td><td class="num">' + x.votes + '</td><td class="rs-rate">' + bar(r, status(r).k) + '<b>' + r + '%</b></td></tr>'; }).join('') + '</tbody></table>';
    }
    // perguntas aplicadas
    h += '<details class="rs-list"' + (V.listOpen ? ' open' : '') + '><summary>Perguntas aplicadas (' + rows.length + ')</summary><table class="rs-table rs-small"><thead><tr><th>Data</th><th>Turma</th><th>Onde</th><th>Descritor</th><th>Votos A–E (certa em negrito)</th><th>Acerto</th><th></th></tr></thead><tbody>' +
      rows.slice().reverse().map((r) => '<tr><td>' + dateBR(r.when, true) + '</td><td>' + esc(r.turma || '—') + '</td><td>' + esc(lessonName(r.lesson)) + '<small>' + esc(FF.hinge.TPL_NAME(r.tpl)) + '</small></td><td>' + esc(r.code) + '</td>' +
        '<td class="rs-dist">' + r.counts.map((c, i) => (i === r.ok ? '<b class="ok">' : '<span>') + LETTERS[i] + ' ' + c + (i === r.ok ? '</b>' : '</span>')).join(' ') + '</td>' +
        '<td class="num">' + pct(r.counts[r.ok], total(r)) + '%</td><td><button class="icon-btn sm" data-del="' + esc(r.uid) + '" title="Apagar esta pergunta do resumo" aria-label="Apagar">✕</button></td></tr>').join('') +
      '</tbody></table></details>';
    $('rs-body').innerHTML = h;
    $('rs-clear').textContent = V.armed ? 'Confirmar: apagar ' + rows.length + ' pergunta' + (rows.length > 1 ? 's' : '') : 'Apagar estes resultados';
    $('rs-clear').classList.toggle('armed', V.armed);
  }

  function open(show) {
    const on = show !== false;
    $('rs-dialog').hidden = !on;
    $('rs-scrim').hidden = !on;
    V.armed = false;
    if (on) {
      if (V.turma === '*' && FF.state.turma && all().some((r) => r.turma === FF.state.turma)) V.turma = FF.state.turma;
      render();
      $('rs-close').focus();
    }
  }
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
  }
  function bind() {
    $('rs-close').addEventListener('click', () => open(false));
    $('rs-scrim').addEventListener('click', () => open(false));
    $('rs-body').addEventListener('toggle', (e) => { if (e.target.classList.contains('rs-list')) V.listOpen = e.target.open; }, true);
    $('rs-body').addEventListener('change', (e) => { if (e.target.id === 'rs-turma') { V.turma = e.target.value; V.armed = false; render(); } });
    $('rs-body').addEventListener('click', (e) => {
      const b = e.target.closest('#rs-per button');
      if (b) { V.per = b.dataset.v; V.armed = false; render(); return; }
      const d = e.target.closest('[data-del]');
      if (d) { FF.hinge.saveResults(FF.hinge.results().filter((r) => r.uid !== d.dataset.del)); render(); }
    });
    $('rs-copy').addEventListener('click', () => {
      const txt = reportText(filtered());
      try { navigator.clipboard.writeText(txt).then(() => toast('Texto copiado. Cole no relatório do PAE.'), () => { $('rs-text').hidden = false; $('rs-text').value = txt; $('rs-text').select(); }); }
      catch (e) { $('rs-text').hidden = false; $('rs-text').value = txt; $('rs-text').select(); }
    });
    $('rs-csv').addEventListener('click', () => {
      const t = V.turma === '*' ? 'todas' : (V.turma || 'sem-turma').replace(/[^\wÀ-ú]+/g, '');
      download('placas_' + t + '_' + new Date().toISOString().slice(0, 10) + '.csv', csv(filtered()));
    });
    $('rs-print').addEventListener('click', () => {
      $('rs-print-head').textContent = 'Resumo da turma – Placas A–E – ' + (V.turma === '*' ? 'todas as turmas' : V.turma || 'sem turma') + ' – ' + dateBR(new Date().toISOString());
      const det = $('rs-body').querySelector('.rs-list'); if (det) det.open = true;
      document.body.classList.add('print-sum');
      const done = () => { document.body.classList.remove('print-sum'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      window.print();
    });
    $('rs-clear').addEventListener('click', () => {
      if (!V.armed) { V.armed = true; render(); return; }
      const gone = new Set(filtered().map((r) => r.uid));
      FF.hinge.saveResults(FF.hinge.results().filter((r) => !gone.has(r.uid)));
      V.armed = false; render();
    });
    $('btn-resumo').addEventListener('click', () => { const p = $('panel-close'); if (p) p.click(); open(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('rs-dialog').hidden) { e.stopImmediatePropagation(); open(false); } }, true);
  }

  FF.resumo = {
    init: bind,
    open: () => open(true),
    close: () => open(false),
    _text: () => reportText(filtered()),
    _csv: () => csv(filtered()),
    _state: V,
  };
})();
