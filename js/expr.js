/* Leis de formação: leitura, cálculo passo a passo, engrenagens e máquina ao contrário.
   Árvore de expressão:
     { t: 'num', v } · { t: 'var' } · { t: 'neg', a } · { t: 'sqrt', a } · { t: 'cbrt', a }
     { t: 'add' | 'sub' | 'mul' | 'div' | 'pow', a, b }
*/
(function () {
  'use strict';
  const FF = (window.FF = window.FF || {});
  const X = (FF.expr = {});

  /* ---------- Números ---------- */
  function tidy(v) { return Math.round(v * 1e10) / 1e10 || 0; }
  X.tidy = tidy;

  /* Aceita "2,5", "2.5", "-3", "1/2", "1 500". Devolve NaN se não for número. */
  X.parseNumber = function (s) {
    let t = String(s == null ? '' : s).trim().replace(/[−–]/g, '-').replace(/[\s  ]/g, '');
    if (!t) return NaN;
    const fr = t.match(/^(-?[\d.,]+)\/(-?[\d.,]+)$/);
    if (fr) {
      const a = X.parseNumber(fr[1]), b = X.parseNumber(fr[2]);
      return b ? tidy(a / b) : NaN;
    }
    if (/,/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : NaN;
  };

  /* ---------- Leitura (parser) ---------- */
  function tokenize(src) {
    const s = String(src)
      .replace(/[−–]/g, '-')
      .replace(/[·×∙⋅*]/g, '*')
      .replace(/[÷:]/g, '/')
      .replace(/\braiz\b|\bsqrt\b/gi, '√')
      .replace(/\bcbrt\b/gi, '∛');
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[\s  ]/.test(c)) { i++; continue; }
      const num = s.slice(i).match(/^(\d{1,3}(?:[   ]\d{3})+(?![\d])|\d+)([.,]\d+)?/);
      if (num) {
        out.push({ k: 'num', v: Number(num[0].replace(/[   ]/g, '').replace(',', '.')) });
        i += num[0].length; continue;
      }
      if (/[a-zA-Z]/.test(c)) { out.push({ k: 'var', name: c }); i++; continue; }
      if ('+-*/^()√∛²³'.includes(c)) { out.push({ k: c }); i++; continue; }
      if (c === '[' || c === '{') { out.push({ k: '(' }); i++; continue; }
      if (c === ']' || c === '}') { out.push({ k: ')' }); i++; continue; }
      throw new Error('Não entendi o símbolo "' + c + '".');
    }
    return out;
  }

  /* Letras usadas na expressão (para descobrir a variável). */
  X.letters = function (src) {
    try {
      return Array.from(new Set(tokenize(src).filter((t) => t.k === 'var').map((t) => t.name)));
    } catch (e) { return []; }
  };

  X.parse = function (src, varName) {
    const toks = tokenize(src);
    const v = varName || 'x';
    let p = 0;
    const peek = () => toks[p];
    const take = (k) => {
      const t = toks[p];
      if (!t || (k && t.k !== k)) throw new Error(k === ')' ? 'Falta fechar um parêntese.' : 'A expressão está incompleta.');
      p++;
      return t;
    };
    const startsAtom = (t) => t && (t.k === 'num' || t.k === 'var' || t.k === '(' || t.k === '√' || t.k === '∛');

    function expr() {
      let n = term();
      while (peek() && (peek().k === '+' || peek().k === '-')) {
        const op = take().k;
        n = { t: op === '+' ? 'add' : 'sub', a: n, b: term() };
      }
      return n;
    }
    function term() {
      let n = unary();
      for (;;) {
        const t = peek();
        if (t && (t.k === '*' || t.k === '/')) {
          take();
          n = { t: t.k === '*' ? 'mul' : 'div', a: n, b: unary() };
        } else if (startsAtom(t)) {
          n = { t: 'mul', a: n, b: power() };
        } else break;
      }
      return n;
    }
    function unary() {
      if (peek() && peek().k === '-') {
        take();
        const a = unary();
        return a.t === 'num' ? { t: 'num', v: -a.v } : { t: 'neg', a };
      }
      if (peek() && peek().k === '+') { take(); return unary(); }
      return power();
    }
    function power() {
      let n = atom();
      for (;;) {
        const t = peek();
        if (t && t.k === '^') { take(); n = { t: 'pow', a: n, b: unary() }; }
        else if (t && t.k === '²') { take(); n = { t: 'pow', a: n, b: { t: 'num', v: 2 } }; }
        else if (t && t.k === '³') { take(); n = { t: 'pow', a: n, b: { t: 'num', v: 3 } }; }
        else break;
      }
      return n;
    }
    function atom() {
      const t = peek();
      if (!t) throw new Error('A expressão está incompleta.');
      if (t.k === 'num') { take(); return { t: 'num', v: t.v }; }
      if (t.k === 'var') {
        take();
        if (t.name !== v) throw new Error('A letra "' + t.name + '" não é a variável (use ' + v + ').');
        return { t: 'var' };
      }
      if (t.k === '(') { take(); const n = expr(); take(')'); return n; }
      if (t.k === '√' || t.k === '∛') { take(); return { t: t.k === '√' ? 'sqrt' : 'cbrt', a: power() }; }
      throw new Error('Não esperava "' + t.k + '" aí.');
    }

    if (!toks.length) throw new Error('Escreva a lei da função.');
    const n = expr();
    if (p < toks.length) throw new Error(toks[p].k === ')' ? 'Tem um parêntese sobrando.' : 'Não entendi o final da expressão.');
    return n;
  };

  /* ---------- Cálculo ---------- */
  function DomainError(kind, msg) { this.kind = kind; this.message = msg; }
  X.DomainError = DomainError;
  const MSG = {
    div0: 'Não existe divisão por zero.',
    sqrt: 'Não existe raiz quadrada de número negativo (nos números reais).',
    pow: 'Essa potência não existe nos números reais.',
  };
  X.MSG = MSG;

  function apply(t, a, b) {
    switch (t) {
      case 'add': return a + b;
      case 'sub': return a - b;
      case 'mul': return a * b;
      case 'div': if (b === 0) throw new DomainError('div0', MSG.div0); return a / b;
      case 'pow': {
        const r = Math.pow(a, b);
        if (!isFinite(r) || isNaN(r)) throw new DomainError(a === 0 ? 'div0' : 'pow', a === 0 ? MSG.div0 : MSG.pow);
        return r;
      }
      case 'neg': return -a;
      case 'sqrt': if (a < 0) throw new DomainError('sqrt', MSG.sqrt); return Math.sqrt(a);
      case 'cbrt': return Math.cbrt(a);
    }
    throw new Error('operação desconhecida');
  }
  X.evaluate = function (n, x) {
    switch (n.t) {
      case 'num': return n.v;
      case 'var': return x;
      case 'neg': case 'sqrt': case 'cbrt': return tidy(apply(n.t, X.evaluate(n.a, x)));
      default: return tidy(apply(n.t, X.evaluate(n.a, x), X.evaluate(n.b, x)));
    }
  };

  X.countVar = function (n) {
    if (n.t === 'var') return 1;
    if (n.t === 'num') return 0;
    return X.countVar(n.a) + (n.b ? X.countVar(n.b) : 0);
  };

  X.subst = function (n, x) {
    if (n.t === 'var') return { t: 'num', v: x, sub: true };
    if (n.t === 'num') return n;
    const o = { t: n.t, a: X.subst(n.a, x) };
    if (n.b) o.b = X.subst(n.b, x);
    return o;
  };

  /* Um passo de cálculo: resolve, ao mesmo tempo, toda operação cujos operandos já são números.
     Devolve { node, error } (error = DomainError, se alguma operação não existir). */
  X.reduce = function (n) {
    let error = null;
    function red(m) {
      if (m.t === 'num' || m.t === 'var') return m;
      const ready = m.a.t === 'num' && (!m.b || m.b.t === 'num');
      if (ready) {
        try {
          return { t: 'num', v: tidy(apply(m.t, m.a.v, m.b ? m.b.v : undefined)), fresh: true };
        } catch (e) {
          if (!(e instanceof DomainError)) throw e;
          if (!error) error = e;
          return Object.assign({}, m, { bad: true });
        }
      }
      const o = { t: m.t, a: red(m.a) };
      if (m.b) o.b = red(m.b);
      return o;
    }
    const node = red(n);
    return { node, error };
  };

  /* Todos os passos de f(x): [expressão com x trocado, ..., número]. */
  X.steps = function (n, x) {
    const list = [X.subst(n, x)];
    let guard = 0;
    while (list[list.length - 1].t !== 'num' && guard++ < 40) {
      const r = X.reduce(list[list.length - 1]);
      if (r.error) return { list, error: r.error, bad: r.node };
      list.push(r.node);
    }
    return { list, value: list[list.length - 1].v };
  };

  /* ---------- Engrenagens ----------
     Quando a variável aparece uma só vez, a lei é uma sequência de operações aplicadas a x.
     Cada engrenagem: { op, k (nó constante), kv (valor) }.
  */
  const OPS = {
    add: { fwd: (v, k) => v + k, inv: 'sub' },
    sub: { fwd: (v, k) => v - k, inv: 'add' },
    rsub: { fwd: (v, k) => k - v, inv: 'rsub' },
    mul: { fwd: (v, k) => v * k, inv: 'div' },
    div: { fwd: (v, k) => { if (k === 0) throw new DomainError('div0', MSG.div0); return v / k; }, inv: 'mul' },
    rdiv: { fwd: (v, k) => { if (v === 0) throw new DomainError('div0', MSG.div0); return k / v; }, inv: 'rdiv' },
    sq: { fwd: (v) => v * v, inv: 'pm' },
    cube: { fwd: (v) => v * v * v, inv: 'cbrt' },
    sqrt: { fwd: (v) => { if (v < 0) throw new DomainError('sqrt', MSG.sqrt); return Math.sqrt(v); }, inv: 'sqback' },
    cbrt: { fwd: (v) => Math.cbrt(v), inv: 'cube' },
    neg: { fwd: (v) => -v, inv: 'neg' },
    // só aparecem na máquina ao contrário
    pm: { fwd: (v) => { if (v < 0) throw new DomainError('pm', 'Nenhum número ao quadrado dá resultado negativo.'); return v === 0 ? [0] : [Math.sqrt(v), -Math.sqrt(v)]; } },
    sqback: { fwd: (v) => { if (v < 0) throw new DomainError('sqback', 'Uma raiz quadrada nunca dá resultado negativo.'); return v * v; } },
  };
  X.OPS = OPS;
  /* Operações que a máquina de montar oferece. */
  X.GEAR_MENU = [
    { op: 'add', label: '+ número', needsK: true },
    { op: 'sub', label: '− número', needsK: true },
    { op: 'mul', label: '× número', needsK: true },
    { op: 'div', label: '÷ número', needsK: true },
    { op: 'rsub', label: 'número − □', needsK: true },
    { op: 'rdiv', label: 'número ÷ □', needsK: true },
    { op: 'sq', label: '□²' },
    { op: 'cube', label: '□³' },
    { op: 'sqrt', label: '√□' },
  ];

  X.chain = function (n) {
    if (X.countVar(n) !== 1) return null;
    const ops = [];
    let cur = n;
    const k = (m) => ({ k: m, kv: X.evaluate(m, 0) });
    try {
      while (cur.t !== 'var') {
        const inA = cur.a && X.countVar(cur.a) === 1;
        switch (cur.t) {
          case 'add': ops.push(Object.assign({ op: 'add' }, k(inA ? cur.b : cur.a))); cur = inA ? cur.a : cur.b; break;
          case 'sub': ops.push(Object.assign({ op: inA ? 'sub' : 'rsub' }, k(inA ? cur.b : cur.a))); cur = inA ? cur.a : cur.b; break;
          case 'mul': ops.push(Object.assign({ op: 'mul' }, k(inA ? cur.b : cur.a))); cur = inA ? cur.a : cur.b; break;
          case 'div': ops.push(Object.assign({ op: inA ? 'div' : 'rdiv' }, k(inA ? cur.b : cur.a))); cur = inA ? cur.a : cur.b; break;
          case 'neg': ops.push({ op: 'neg' }); cur = cur.a; break;
          case 'sqrt': ops.push({ op: 'sqrt' }); cur = cur.a; break;
          case 'cbrt': ops.push({ op: 'cbrt' }); cur = cur.a; break;
          case 'pow': {
            if (!inA || cur.b.t !== 'num' || (cur.b.v !== 2 && cur.b.v !== 3)) return null;
            ops.push({ op: cur.b.v === 2 ? 'sq' : 'cube' }); cur = cur.a; break;
          }
          default: return null;
        }
      }
    } catch (e) { return null; }
    return ops.reverse();
  };

  /* Monta a árvore a partir das engrenagens (máquina de montar). */
  X.fromChain = function (ops) {
    let cur = { t: 'var' };
    ops.forEach((g) => {
      const kn = { t: 'num', v: g.kv };
      switch (g.op) {
        case 'add': cur = { t: 'add', a: cur, b: kn }; break;
        case 'sub': cur = { t: 'sub', a: cur, b: kn }; break;
        case 'rsub': cur = { t: 'sub', a: kn, b: cur }; break;
        case 'mul': cur = { t: 'mul', a: kn, b: cur }; break;
        case 'div': cur = { t: 'div', a: cur, b: kn }; break;
        case 'rdiv': cur = { t: 'div', a: kn, b: cur }; break;
        case 'sq': cur = { t: 'pow', a: cur, b: { t: 'num', v: 2 } }; break;
        case 'cube': cur = { t: 'pow', a: cur, b: { t: 'num', v: 3 } }; break;
        case 'sqrt': cur = { t: 'sqrt', a: cur }; break;
        case 'cbrt': cur = { t: 'cbrt', a: cur }; break;
        case 'neg': cur = { t: 'neg', a: cur }; break;
      }
    });
    return cur;
  };

  /* Aplica uma engrenagem (ou a inversa). Devolve um número ou uma lista (±). */
  X.gearApply = function (g, v, inverse) {
    const op = inverse ? OPS[g.op].inv : g.op;
    const r = OPS[op].fwd(v, g.kv);
    return Array.isArray(r) ? r.map(tidy) : tidy(r);
  };
  X.inverseOp = function (g) { return Object.assign({}, g, { op: OPS[g.op].inv }); };
  X.invertible = function (ops) {
    return ops.every((g) => !(g.op === 'mul' && g.kv === 0));
  };

  /* ---------- Formatação ---------- */
  X.fmtNum = function (v, dec) {
    const d = dec == null ? (FF.state ? FF.state.dec : 2) : dec;
    const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
    let s = Math.abs(r).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d, useGrouping: false });
    const [ip, fp] = s.split(',');
    const grouped = ip.length > 4 ? ip.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ip;
    s = grouped + (fp ? ',' + fp : '');
    return (r < 0 ? '−' : '') + s;
  };
  X.isApprox = function (v, dec) {
    const d = dec == null ? (FF.state ? FF.state.dec : 2) : dec;
    return Math.abs(Math.round(v * Math.pow(10, d)) / Math.pow(10, d) - v) > 1e-9;
  };

  /* Texto simples (para a caixa de digitar a lei e para rótulos). */
  const PREC = { add: 1, sub: 1, mul: 2, div: 2, neg: 2, pow: 4, sqrt: 5, cbrt: 5, num: 5, var: 5 };
  function numText(v) { return X.fmtNum(v, 4); }
  X.text = function (n, varName) {
    const vn = varName || 'x';
    function wrap(s, cond) { return cond ? '(' + s + ')' : s; }
    function go(m, ctx) {
      switch (m.t) {
        case 'num': {
          const s = numText(m.v);
          return m.v < 0 && ctx !== 'top' && ctx !== 'left' ? '(' + s + ')' : s;
        }
        case 'var': return vn;
        case 'neg': return '−' + wrap(go(m.a, 'op'), PREC[m.a.t] <= 2);
        case 'sqrt': return '√' + (m.a.t === 'num' || m.a.t === 'var' ? go(m.a, 'op') : '(' + go(m.a, 'top') + ')');
        case 'cbrt': return '∛' + (m.a.t === 'num' || m.a.t === 'var' ? go(m.a, 'op') : '(' + go(m.a, 'top') + ')');
        case 'add': case 'sub': {
          const l = go(m.a, ctx === 'top' || ctx === 'left' ? 'left' : 'op');
          const r = wrap(go(m.b, 'op'), m.t === 'sub' ? PREC[m.b.t] <= 1 : PREC[m.b.t] < 1);
          return l + (m.t === 'add' ? ' + ' : ' − ') + r;
        }
        case 'mul': {
          const l = wrap(go(m.a, ctx === 'top' || ctx === 'left' ? 'left' : 'op'), PREC[m.a.t] < 2);
          const r = wrap(go(m.b, 'op'), PREC[m.b.t] <= 2 && m.b.t !== 'pow' && m.b.t !== 'sqrt');
          return l + (implicit(m) ? '' : ' · ') + r;
        }
        case 'div': {
          const l = wrap(go(m.a, 'op'), PREC[m.a.t] < 2);
          const r = wrap(go(m.b, 'op'), PREC[m.b.t] <= 2);
          return l + '/' + r;
        }
        case 'pow': {
          const base = wrap(go(m.a, 'op'), PREC[m.a.t] < 5);
          if (m.b.t === 'num' && m.b.v === 2) return base + '²';
          if (m.b.t === 'num' && m.b.v === 3) return base + '³';
          return base + '^' + wrap(go(m.b, 'op'), PREC[m.b.t] < 5);
        }
      }
      return '?';
    }
    return go(n, 'top');
  };
  /* Multiplicação sem ponto: 2x, 0,66x, 3(x + 1), 2√x */
  function implicit(m) {
    if (m.a.t !== 'num' || m.a.sub || m.a.fresh) return false;
    const b = m.b;
    if (b.t === 'var' || b.t === 'sqrt' || b.t === 'cbrt') return true;
    if (b.t === 'pow' && b.a.t === 'var') return true;
    if (b.t === 'add' || b.t === 'sub') return true;
    return false;
  }
  X.implicit = implicit;
  X.PREC = PREC;

  /* Rótulo de uma engrenagem: "× 0,66", "40 − □", "√□" */
  X.gearLabel = function (g, inverse) {
    const op = inverse ? OPS[g.op].inv : g.op;
    const k = g.k ? X.text(g.k) : numText(g.kv);
    const kp = g.kv < 0 ? '(' + numText(g.kv) + ')' : k;
    switch (op) {
      case 'add': return '+ ' + kp;
      case 'sub': return '− ' + kp;
      case 'rsub': return k + ' − □';
      case 'mul': return '× ' + kp;
      case 'div': return '÷ ' + kp;
      case 'rdiv': return k + ' ÷ □';
      case 'sq': return '□²';
      case 'cube': return '□³';
      case 'sqrt': return '√□';
      case 'cbrt': return '∛□';
      case 'neg': return '× (−1)';
      case 'pm': return '±√□';
      case 'sqback': return '□²';
    }
    return '?';
  };

  /* Frase que explica o que a engrenagem faz com o valor v. */
  X.gearSentence = function (g, v, r, inverse) {
    const op = inverse ? OPS[g.op].inv : g.op;
    const f = (a) => (a < 0 ? '(' + X.fmtNum(a) + ')' : X.fmtNum(a));
    const k = g.kv;
    const res = Array.isArray(r) ? r.map((a) => X.fmtNum(a)).join(' ou ') : X.fmtNum(r);
    switch (op) {
      case 'add': return 'soma ' + X.fmtNum(k) + ': ' + X.fmtNum(v) + ' + ' + f(k) + ' = ' + res;
      case 'sub': return 'subtrai ' + X.fmtNum(k) + ': ' + X.fmtNum(v) + ' − ' + f(k) + ' = ' + res;
      case 'rsub': return 'calcula ' + X.fmtNum(k) + ' menos o produto: ' + X.fmtNum(k) + ' − ' + f(v) + ' = ' + res;
      case 'mul': return 'multiplica por ' + X.fmtNum(k) + ': ' + X.fmtNum(v) + ' · ' + f(k) + ' = ' + res;
      case 'div': return 'divide por ' + X.fmtNum(k) + ': ' + X.fmtNum(v) + ' ÷ ' + f(k) + ' = ' + res;
      case 'rdiv': return 'divide ' + X.fmtNum(k) + ' pelo produto: ' + X.fmtNum(k) + ' ÷ ' + f(v) + ' = ' + res;
      case 'sq': return 'eleva ao quadrado: ' + f(v) + '² = ' + res;
      case 'cube': return 'eleva ao cubo: ' + f(v) + '³ = ' + res;
      case 'sqrt': return 'tira a raiz quadrada: √' + f(v) + ' = ' + res;
      case 'cbrt': return 'tira a raiz cúbica: ∛' + f(v) + ' = ' + res;
      case 'neg': return 'troca o sinal: ' + res;
      case 'pm': return 'procura os números que, ao quadrado, dão ' + X.fmtNum(v) + ': ' + res;
      case 'sqback': return 'desfaz a raiz elevando ao quadrado: ' + f(v) + '² = ' + res;
    }
    return '';
  };

  /* ---------- Leis por faixas (conta de água) ----------
     law = { kind: 'piece', pieces: [{ lo, hi, src, ast, label }] }  — lo < x ≤ hi (a primeira inclui lo) */
  X.findPiece = function (law, x) {
    return law.pieces.findIndex((p, i) => (i === 0 ? x >= p.lo : x > p.lo) && (p.hi == null || x <= p.hi));
  };

  /* ---------- Domínio e contradomínio ----------
     'R' · 'R+' (≥ 0) · 'N' (0, 1, 2, ...) · '{2;3;4;5}' · '(0;20)' '[0;20]' '(0;20]' ... */
  X.parseSet = function (spec) {
    const s = String(spec || 'R').trim();
    if (s === 'R' || s === '') return { type: 'R' };
    if (s === 'R+') return { type: 'iv', lo: 0, hi: null, loIn: true };
    if (s === 'N') return { type: 'iv', lo: 0, hi: null, loIn: true, integer: true };
    let m = s.match(/^\{(.*)\}$/);
    if (m) {
      const vals = m[1].split(';').map((t) => X.parseNumber(t)).filter((v) => !isNaN(v));
      return { type: 'set', vals: Array.from(new Set(vals)) };
    }
    m = s.match(/^([[(])\s*([^;]*);\s*([^\])]*)([\])])(i?)$/);
    if (m) {
      const lo = m[2].trim() === '' ? null : X.parseNumber(m[2]);
      const hi = m[3].trim() === '' ? null : X.parseNumber(m[3]);
      return { type: 'iv', lo, hi, loIn: m[1] === '[', hiIn: m[4] === ']', integer: m[5] === 'i' };
    }
    return { type: 'R' };
  };
  X.setString = function (set) {
    if (set.type === 'R') return 'R';
    if (set.type === 'set') return '{' + set.vals.map((v) => String(v)).join(';') + '}';
    return (set.loIn ? '[' : '(') + (set.lo == null ? '' : set.lo) + ';' + (set.hi == null ? '' : set.hi) + (set.hiIn ? ']' : ')') + (set.integer ? 'i' : '');
  };
  X.inSet = function (set, v) {
    if (set.type === 'R') return true;
    if (set.type === 'set') return set.vals.some((w) => Math.abs(w - v) < 1e-9);
    if (set.integer && Math.abs(v - Math.round(v)) > 1e-9) return false;
    if (set.lo != null && (set.loIn ? v < set.lo : v <= set.lo)) return false;
    if (set.hi != null && (set.hiIn ? v > set.hi : v >= set.hi)) return false;
    return true;
  };
  /* Descrição do conjunto, em HTML curto: ℝ, {2, 3, 4}, x ≥ 0 */
  X.setLabel = function (set, varName) {
    const v = '<i>' + (varName || 'x') + '</i>';
    if (set.type === 'R') return 'ℝ';
    if (set.type === 'set') return '{' + set.vals.map((w) => X.fmtNum(w, 4)).join('; ') + '}';
    const parts = [];
    if (set.lo != null && set.hi != null) {
      parts.push(X.fmtNum(set.lo, 4) + (set.loIn ? ' ≤ ' : ' < ') + v + (set.hiIn ? ' ≤ ' : ' < ') + X.fmtNum(set.hi, 4));
    } else if (set.lo != null) parts.push(v + (set.loIn ? ' ≥ ' : ' > ') + X.fmtNum(set.lo, 4));
    else if (set.hi != null) parts.push(v + (set.hiIn ? ' ≤ ' : ' < ') + X.fmtNum(set.hi, 4));
    if (set.integer) parts.push(v + ' inteiro');
    return parts.join(', ');
  };
})();
