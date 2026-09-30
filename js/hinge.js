/* Perguntas-dobradiça (placas A–E) e aquecimento.
   Cada modelo imita um item real do Banco de Itens do 9º ano (pré-Avalia+), sempre com números e
   situação novos, e cada alternativa errada é um erro típico com nome ("esqueceu a taxa fixa").
   Fluxo, um clique por vez: pensar → placas para cima (o professor conta) → revelar → resolução. */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (l) => l[rnd(l.length)];
  const f = (v) => X.fmtNum(v, 2);
  const LETTERS = 'ABCDE';
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function brl(v) {
    const s = (Math.round(v * 100) / 100).toFixed(2).split('.');
    return 'R$ ' + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1];
  }
  function num(v) { // 12 000 com espaço, como no livro
    return f(v).replace(/^(-?)(\d+)/, (m, s, d) => s + d.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
  }
  const dc = (v) => String(X.tidy(v)).replace('.', ','); // número dentro de uma lei, com vírgula
  function mathHTML(src, v, pre, size) { return FF.math.inline(X.parse(src, v), size || 26, v, pre || ''); }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const distinct = (vals) => new Set(vals.map((v) => String(v))).size === vals.length;

  /* Descritores (códigos do Banco de Itens, Etapa 3) */
  const DESC = {
    D02: 'Associar funções a tabelas ou gráficos que as representam.',
    D11: 'Identificar domínio ou imagem de uma função.',
    D12: 'Identificar representações algébricas de funções polinomiais do 1º grau.',
    D22: 'Resolver problemas que envolvam a dependência entre duas variáveis.',
    D25: 'Resolver problemas que envolvam a representação gráfica de funções polinomiais de 1º grau.',
    C09: 'Determinar termos de uma sequência a partir de sua lei de formação ou padrão.',
    C20: 'Resolver problemas com números racionais que envolvam diferentes operações.',
  };

  /* ---------- Modelos ---------- */
  const T = {};

  /* Da saída para a entrada (como PA·011: C(d) = 2d + 40, custo R$ 100). */
  T.volta = {
    name: 'Da saída para a entrada', code: 'D22', src: 'PA·011',
    make() {
      const C = pick([
        { v: 'd', P: 'C', txt: (a, b) => 'Uma transportadora cobra uma taxa fixa de ' + brl(b) + ' por viagem, mais ' + brl(a) + ' por quilômetro rodado. O custo é dado por', q: (T) => 'Uma viagem custou ' + brl(T) + '. Qual foi a distância percorrida?', u: 'km', as: [2, 3, 4, 5], ms: [5, 8, 10, 12], ds: [15, 20, 25, 30, 35, 40, 45] },
        { v: 'h', P: 'P', txt: (a, b) => 'Um técnico cobra ' + brl(b) + ' pela visita e mais ' + brl(a) + ' por hora de serviço. O preço é', q: (T) => 'Um cliente pagou ' + brl(T) + '. Quantas horas durou o serviço?', u: 'h', as: [30, 40, 50, 60], ms: [1, 2], ds: [2, 3, 4, 5, 6] },
        { v: 'h', P: 'E', txt: (a, b) => 'Um estacionamento cobra ' + brl(b) + ' na entrada e mais ' + brl(a) + ' por hora. O valor é', q: (T) => 'Um motorista pagou ' + brl(T) + '. Quantas horas o carro ficou?', u: 'h', as: [4, 5, 6, 8], ms: [2, 3], ds: [3, 4, 5, 6, 7, 8, 9] },
        { v: 'x', P: 'S', txt: (a, b) => 'Um vendedor recebe salário fixo de ' + brl(b) + ' mais ' + brl(a) + ' por venda. O salário é', q: (T) => 'Num mês, ele recebeu ' + brl(T) + '. Quantas vendas fez?', u: 'vendas', as: [10, 15, 20], ms: [80, 100, 120], ds: [40, 50, 60, 70, 80, 90] },
      ]);
      let a, m, d, b, Tt, vals;
      do {
        a = pick(C.as); m = pick(C.ms); d = pick(C.ds); b = a * m; Tt = a * d + b;
        vals = [d, Tt / a, (Tt + b) / a, Tt - b, a * Tt + b];
      } while (!distinct(vals));
      const law = a + C.v + ' + ' + b;
      const pre = C.P + '(' + C.v + ') = ';
      const u = (v) => num(v) + ' ' + C.u;
      return {
        stem: '<p>' + esc(C.txt(a, b)) + ' ' + mathHTML(law, C.v, pre) + '.</p><p class="h-q">' + esc(C.q(Tt)) + '</p>',
        alts: [
          { t: u(d), ok: true, why: 'Tirou a parte fixa e depois dividiu: (' + num(Tt) + ' − ' + num(b) + ') ÷ ' + num(a) + ' = ' + num(d) + '.' },
          { t: u(Tt / a), why: 'Dividiu ' + num(Tt) + ' por ' + num(a) + ' sem tirar a parte fixa de ' + brl(b) + '.' },
          { t: u((Tt + b) / a), why: 'Somou a parte fixa em vez de tirar.' },
          { t: u(Tt - b), why: 'Tirou a parte fixa, mas esqueceu de desfazer o × ' + num(a) + '.' },
          { t: u(a * Tt + b), why: 'Fez a conta de ida: calculou ' + C.P + '(' + num(Tt) + ') em vez de voltar.' },
        ],
        solve: [
          'Trocar ' + C.P + ' por ' + num(Tt) + ': ' + mathHTML(law, C.v, num(Tt) + ' = ', 22),
          'A última engrenagem é a primeira a ser desfeita. Desfazer <span class="gtag">+ ' + num(b) + '</span>: ' + num(Tt) + ' − ' + num(b) + ' = ' + num(Tt - b) + '.',
          'Desfazer <span class="gtag">× ' + num(a) + '</span>: ' + num(Tt - b) + ' ÷ ' + num(a) + ' = <b>' + num(d) + '</b>.',
          'Conferir: ' + num(a) + ' · ' + num(d) + ' + ' + num(b) + ' = ' + num(Tt) + '. ✓',
        ],
        fab: { setup: { ctx: 'livre', law: law, dom: 'R', cd: 'R', inputs: '' }, run: [Tt, 'rev'] },
      };
    },
  };

  /* Da frase para a lei (como PA·055: terreno que valoriza R$ 5 000 por ano). */
  T.lei = {
    name: 'Qual é a lei?', code: 'D12', src: 'PA·055',
    make() {
      const C = pick([
        { P: 'p', s: +1, txt: (V, r) => 'Um terreno custava ' + brl(V) + ' e passou a valorizar ' + brl(r) + ' a cada ano, de forma linear.', q: 'A função que dá o preço p(x) do terreno, em reais, após x anos é', Vs: [80000, 100000, 120000, 150000], rs: [2000, 4000, 5000, 6000], upDown: 'valorizar' },
        { P: 'p', s: -1, txt: (V, r) => 'Um carro novo custa ' + brl(V) + ' e perde ' + brl(r) + ' de valor a cada ano, de forma linear.', q: 'A função que dá o valor p(x) do carro, em reais, após x anos é', Vs: [40000, 50000, 60000, 70000], rs: [2000, 2500, 3000, 4000], upDown: 'desvalorizar' },
        { P: 'V', s: +1, txt: (V, r) => 'Um plano de celular custa ' + brl(V) + ' por mês, mais ' + brl(r) + ' por gigabyte extra usado.', q: 'A função que dá o valor V(x) da conta, com x gigabytes extras, é', Vs: [40, 50, 60], rs: [5, 6, 8], upDown: 'aumentar' },
        { P: 'S', s: +1, txt: (V, r) => 'Um funcionário recebe ' + brl(V) + ' fixos por mês, mais ' + brl(r) + ' de comissão por venda.', q: 'A função que dá o salário S(x) com x vendas é', Vs: [1500, 1800, 2000], rs: [15, 20, 25], upDown: 'aumentar' },
      ]);
      const V = pick(C.Vs), r = pick(C.rs);
      const op = C.s > 0 ? ' + ' : ' − ', opp = C.s > 0 ? ' − ' : ' + ';
      const pre = C.P + '(x) = ';
      const m = (src) => mathHTML(src, 'x', pre, 24);
      const law = V + op + r + 'x';
      return {
        stem: '<p>' + esc(C.txt(V, r)) + '</p><p class="h-q">' + esc(C.q) + '</p>',
        alts: [
          { h: m(law), ok: true, why: 'Parte fixa ' + num(V) + ' (vale quando x = 0) e ' + num(r) + ' a cada unidade de x.' },
          { h: m(V + 'x' + op + r), why: 'Trocou a parte fixa com a parte que muda: ' + num(V) + ' não é multiplicado por x.' },
          { h: m(V + opp + r + 'x'), why: C.s > 0 ? 'Trocou o sinal: o valor aumenta, então é + ' + num(r) + 'x.' : 'Trocou o sinal: o carro perde valor, então é − ' + num(r) + 'x.' },
          { h: m('(' + V + op + r + ')x'), why: 'Juntou tudo e multiplicou por x: a parte fixa não depende de x.' },
          { h: m(r + 'x'), why: 'Esqueceu o valor inicial: em x = 0 o valor é ' + num(V) + ', e não 0.' },
        ],
        solve: [
          'O que é <b>fixo</b>? ' + num(V) + ': é o valor quando x = 0.',
          'O que <b>muda</b>? ' + num(r) + ' a cada unidade de x, ou seja, ' + (C.s > 0 ? '+ ' : '− ') + num(r) + ' · x.',
          'A lei: ' + m(law),
          'Conferir: x = 1 dá ' + num(V + C.s * r) + '; x = 2 dá ' + num(V + 2 * C.s * r) + '. ✓',
        ],
        fab: { setup: { ctx: 'livre', law: law, dom: 'R+', cd: 'R', inputs: '0;1;2;3;4;5', curve: true }, all: true },
      };
    },
  };

  /* Qual gráfico? (como PA·041: dois planos de telefone que empatam em 100 minutos) */
  function plot(lines, cross, xmax, ymax, u) {
    const W = 250, H = 170, L = 44, B = 26, R = 14, Tp = 12;
    const sx = (x) => L + (x / xmax) * (W - L - R), sy = (y) => H - B - (y / ymax) * (H - B - Tp);
    let s = '<svg class="hg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfico com duas retas">';
    s += '<line class="hg-ax" x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - 6) + '" y2="' + (H - B) + '"/><line class="hg-ax" x1="' + L + '" y1="' + (H - B) + '" x2="' + L + '" y2="4"/>';
    const yt = Array.from(new Set(lines.map((l) => l.f))).filter((v) => v > 0);
    yt.forEach((v) => { s += '<line class="hg-g" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(v) + '" y2="' + sy(v) + '"/><text class="hg-t" x="' + (L - 4) + '" y="' + (sy(v) + 4) + '" text-anchor="end">' + esc(num(v)) + '</text>'; });
    s += '<text class="hg-t" x="' + (L - 4) + '" y="' + (H - B + 4) + '" text-anchor="end">0</text>';
    if (cross != null && cross > 0 && cross < xmax) {
      s += '<line class="hg-g" x1="' + sx(cross) + '" x2="' + sx(cross) + '" y1="' + (H - B) + '" y2="' + Tp + '"/><text class="hg-t" x="' + sx(cross) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + esc(num(cross)) + '</text>';
    }
    s += '<text class="hg-u" x="' + (W - R) + '" y="' + (H - 2) + '" text-anchor="end">' + esc(u) + '</text>';
    const ends = lines.map((l) => l.f + l.p * xmax);
    lines.forEach((l, i) => {
      const y2 = ends[i];
      const above = y2 >= ends[1 - i]; // rótulo da reta de cima vai acima, o da de baixo, abaixo
      s += '<line class="hg-l hg-l' + i + '" x1="' + sx(0) + '" y1="' + sy(l.f) + '" x2="' + sx(xmax) + '" y2="' + sy(y2) + '"/>';
      s += '<text class="hg-n hg-n' + i + '" x="' + (sx(xmax) - 2) + '" y="' + (sy(y2) + (above ? -7 : 17)) + '" text-anchor="end">' + l.n + '</text>';
    });
    if (cross != null && cross > 0 && cross < xmax) s += '<circle class="hg-c" cx="' + sx(cross) + '" cy="' + sy(lines[0].f + lines[0].p * cross) + '" r="4"/>';
    return s + '</svg>';
  }
  T.grafico = {
    name: 'Qual é o gráfico?', code: 'D25', src: 'PA·041', grid: true,
    make() {
      const C = pick([
        { what: 'Dois planos de celular', a: 'mensalidade', per: 'por minuto', u: 'minutos', Xs: [50, 100], f1s: [20, 30, 40], dfs: [20, 30, 40], p2s: [0.1, 0.2] },
        { what: 'Dois aplicativos de transporte', a: 'bandeirada', per: 'por km', u: 'km', Xs: [4, 5, 6, 8], f1s: [4, 5, 6], dfs: [2, 3, 4], p2s: [1, 1.5, 2] },
      ]);
      const Xc = pick(C.Xs), f1 = pick(C.f1s), df = pick(C.dfs), p2 = pick(C.p2s);
      const f2 = f1 + df, dp = df / Xc, p1 = X.tidy(p2 + dp);
      const Yc = f1 + p1 * Xc, xmax = 2 * Xc;
      const top = Math.max(f2 + p2 * xmax, f1 + p1 * xmax);
      const ymax = top * 1.12;
      const g = (ls, cross) => plot(ls, cross, xmax, ymax, C.u);
      const p1b = X.tidy(p2 + (2 * df) / Xc); // inclinação errada: cruzariam na metade do caminho
      return {
        stem: '<p>' + esc(C.what) + ': o <b>Plano I</b> tem ' + esc(C.a) + ' de ' + brl(f1) + ' e cobra ' + brl(p1) + ' ' + esc(C.per) + '; o <b>Plano II</b> tem ' + esc(C.a) + ' de ' + brl(f2) + ' e cobra ' + brl(p2) + ' ' + esc(C.per) + '.</p><p class="h-q">Qual gráfico representa o valor a pagar (em reais) de cada plano em função dos ' + esc(C.u) + '?</p>',
        alts: [
          { h: g([{ f: f1, p: p1, n: 'I' }, { f: f2, p: p2, n: 'II' }], Xc), ok: true, why: 'I começa em ' + num(f1) + ' e sobe mais rápido; II começa em ' + num(f2) + '. Empatam em ' + num(Xc) + ' ' + C.u + '.' },
          { h: g([{ f: f2, p: p2, n: 'I' }, { f: f1, p: p1, n: 'II' }], Xc), why: 'Trocou os planos: quem começa em ' + num(f1) + ' é o Plano I.' },
          { h: g([{ f: f1, p: p2, n: 'I' }, { f: f2, p: p2, n: 'II' }], null), why: 'Usou o mesmo preço ' + C.per + ' nos dois: as retas ficaram paralelas.' },
          { h: g([{ f: 0, p: p1, n: 'I' }, { f: 0, p: p2, n: 'II' }], null), why: 'Esqueceu a parte fixa: com 0 ' + C.u + ' já se paga a ' + C.a + ', a reta não sai do zero.' },
          { h: g([{ f: f1, p: p1b, n: 'I' }, { f: f2, p: p2, n: 'II' }], Xc / 2), why: 'Inclinação errada: as retas se cruzam em ' + num(Xc / 2) + ' ' + C.u + ', mas os planos empatam em ' + num(Xc) + '.' },
        ],
        solve: [
          'Onde cada reta <b>começa</b> (0 ' + esc(C.u) + '): Plano I em ' + brl(f1) + ', Plano II em ' + brl(f2) + '.',
          'Qual <b>sobe mais rápido</b>? O Plano I: ' + brl(p1) + ' ' + esc(C.per) + ', contra ' + brl(p2) + '.',
          'Onde <b>empatam</b>: ' + mathHTML(dc(f1) + ' + ' + dc(p1) + 'x', 'x', '', 20) + ' = ' + mathHTML(dc(f2) + ' + ' + dc(p2) + 'x', 'x', '', 20) + ' → ' + num(p1 - p2) + 'x = ' + num(df) + ' → x = <b>' + num(Xc) + '</b> (' + brl(Yc) + ').',
          'O gráfico certo tem a reta I começando mais baixo, a II mais alto, e as duas se cruzando em ' + num(Xc) + ' ' + esc(C.u) + '.',
        ],
        fab: { setup: { ctx: 'livre', law: dc(f1) + ' + ' + dc(p1) + 'x', dom: 'R+', cd: 'R', inputs: [0, Xc / 2, Xc, xmax].map(X.tidy).join(';'), curve: true }, all: true },
      };
    },
  };

  /* Termo de uma sequência (como PA·040: 2, 8, 14… viagens por mês) */
  T.seq = {
    name: 'Termo de uma sequência', code: 'C09', src: 'PA·040',
    make() {
      const C = pick([
        { txt: (a, r) => 'Uma pessoa percebeu que o número de corridas de aplicativo aumenta sempre igual: em janeiro foram ' + a + ', em fevereiro ' + (a + r) + ' e em março ' + (a + 2 * r) + '.', q: (m) => 'Mantendo o padrão, quantas corridas ela fará em ' + m + '?' },
        { txt: (a, r) => 'Uma turma arrecada latinhas para reciclar: ' + a + ' kg em janeiro, ' + (a + r) + ' kg em fevereiro, ' + (a + 2 * r) + ' kg em março, sempre com o mesmo aumento.', q: (m) => 'Mantendo o padrão, quantos quilos serão arrecadados em ' + m + '?' },
      ]);
      let a, r, k, vals;
      do {
        a = 1 + rnd(6); r = 3 + rnd(6); k = 6 + rnd(7);
        vals = [a + (k - 1) * r, a + k * r, a + (k - 2) * r, k * r, a * k];
      } while (!distinct(vals));
      const mes = MONTHS[k - 1];
      return {
        stem: '<p>' + esc(C.txt(a, r)) + '</p><p class="h-q">' + esc(C.q(mes)) + '</p>',
        alts: [
          { t: num(vals[0]), ok: true, why: mes + ' é o ' + k + 'º mês: ' + a + ' + ' + (k - 1) + ' · ' + r + ' = ' + vals[0] + '.' },
          { t: num(vals[1]), why: 'Contou um mês a mais: somou ' + k + ' vezes ' + r + ', mas de janeiro a ' + mes + ' são ' + (k - 1) + ' aumentos.' },
          { t: num(vals[2]), why: 'Contou um mês a menos.' },
          { t: num(vals[3]), why: 'Só multiplicou o mês pelo aumento (' + k + ' · ' + r + '), esquecendo o valor de janeiro.' },
          { t: num(vals[4]), why: 'Multiplicou o valor de janeiro pelo número do mês.' },
        ],
        solve: [
          'De um mês para o outro, soma <b>' + r + '</b>.',
          'Lei: ' + mathHTML(a + ' + ' + r + '(n − 1)', 'n', 'v(n) = ', 22) + ', com n = número do mês.',
          mes[0].toUpperCase() + mes.slice(1) + ' é o mês <b>n = ' + k + '</b>: são ' + (k - 1) + ' aumentos depois de janeiro.',
          'v(' + k + ') = ' + a + ' + ' + r + ' · ' + (k - 1) + ' = <b>' + vals[0] + '</b>.',
        ],
        fab: { setup: { ctx: 'livre', law: a + ' + ' + r + '(n − 1)', dom: 'N', cd: 'R', inputs: '1;2;3;' + k }, run: [k, 'fwd'] },
      };
    },
  };

  /* Conjunto imagem (D11: o banco ainda não tinha item) */
  const setTxt = (vals) => '{' + Array.from(new Set(vals.map((v) => X.tidy(v)))).sort((p, q) => p - q).map(num).join('; ') + '}';
  T.imagem = {
    name: 'Qual é a imagem?', code: 'D11', src: 'autoral',
    make() {
      let A, Bset, law, alts, fx, solve;
      if (Math.random() < 0.5) {
        const b = 1 + rnd(4);
        A = [-2, -1, 0, 1, 2]; fx = (x) => x * x + b; law = 'x² + ' + b;
        const im = A.map(fx);
        Bset = Array.from(new Set(im.concat([b - 1, b + 2, b + 6]))).sort((p, q) => p - q);
        alts = [
          { t: setTxt(im), ok: true, why: 'As imagens dos elementos de A, sem repetir: ' + setTxt(im) + '.' },
          { t: setTxt(A), why: 'Deu o domínio (o conjunto A), não a imagem.' },
          { t: setTxt(Bset), why: 'Deu o contradomínio: nem todo elemento de B recebe flecha.' },
          { t: setTxt(A.map((x) => (x < 0 ? -x * x : x * x) + b)), why: 'Errou o sinal: (−2)² = 4, e não −4.' },
          { t: setTxt(A.map((x) => x * x)), why: 'Esqueceu de somar ' + b + '.' },
        ];
        solve = A.map((x) => 'f(' + num(x) + ') = (' + num(x) + ')² + ' + b + ' = ' + num(fx(x))).concat(['Sem repetir: <b>Im = ' + setTxt(im) + '</b>. Im ⊂ CD.']);
      } else {
        const a = 2 + rnd(3), b = 1 + rnd(4);
        A = [0, 1, 2, 3]; fx = (x) => a * x + b; law = a + 'x + ' + b;
        const im = A.map(fx);
        Bset = Array.from(new Set(im.concat([b + 1, 3 * a + b + 2]))).sort((p, q) => p - q);
        alts = [
          { t: setTxt(im), ok: true, why: 'Multiplica por ' + a + ' e soma ' + b + ': ' + setTxt(im) + '.' },
          { t: setTxt(A), why: 'Deu o domínio (o conjunto A), não a imagem.' },
          { t: setTxt(Bset), why: 'Deu o contradomínio: nem todo elemento de B recebe flecha.' },
          { t: setTxt(A.map((x) => a * (x + b))), why: 'Somou antes de multiplicar: a lei é ' + a + '·x + ' + b + ', e não ' + a + '·(x + ' + b + ').' },
          { t: setTxt(A.map((x) => a * x)), why: 'Esqueceu de somar ' + b + '.' },
        ];
        solve = A.map((x) => 'f(' + num(x) + ') = ' + a + ' · ' + num(x) + ' + ' + b + ' = ' + num(fx(x))).concat(['<b>Im = ' + setTxt(im) + '</b>. Im ⊂ CD.']);
      }
      if (!distinct(alts.map((x) => x.t))) return T.imagem.make();
      return {
        stem: '<p>Considere a função <i>f</i>: A → B dada por ' + mathHTML(law, 'x', 'f(x) = ') + ', com A = ' + setTxt(A) + ' e B = ' + setTxt(Bset) + '.</p><p class="h-q">Qual é o conjunto imagem de <i>f</i>?</p>',
        alts,
        solve,
        fab: { setup: { ctx: 'livre', law: law, dom: setTxt(A).replace(/ /g, ''), cd: setTxt(Bset).replace(/ /g, '') }, all: true },
      };
    },
  };

  /* Contas com decimais (a causa raiz do PAE: operações com racionais) */
  T.decimal = {
    name: 'Conta com decimais', code: 'C20', src: 'PAE',
    make() {
      const n = pick([50, 120, 150, 200, 250, 300, 350]);
      if (Math.random() < 0.5) {
        const v = X.tidy(0.66 * n);
        const vals = [v, v * 10, X.tidy(v / 10), 66 * n, n + 0.66];
        if (!distinct(vals)) return T.decimal.make();
        return {
          code: 'C20',
          stem: '<p>A tarifa de energia é de <b>R$ 0,66 por kWh</b>.</p><p class="h-q">Quanto custam ' + n + ' kWh, sem contar a taxa fixa?</p>',
          alts: [
            { t: brl(v), ok: true, why: '0,66 · ' + n + ' = ' + f(v) + '.' },
            { t: brl(v * 10), why: 'Vírgula uma casa para a direita.' },
            { t: brl(v / 10), why: 'Vírgula uma casa para a esquerda.' },
            { t: brl(66 * n), why: 'Esqueceu a vírgula: usou 66 em vez de 0,66.' },
            { t: brl(n + 0.66), why: 'Somou em vez de multiplicar.' },
          ],
          solve: ['0,66 · ' + n + ' = 66 · ' + n + ' ÷ 100', '66 · ' + n + ' = ' + num(66 * n), num(66 * n) + ' ÷ 100 = <b>' + f(v) + '</b>: ' + brl(v) + '.', 'Estimativa para conferir: 0,66 é um pouco menos que 2/3; 2/3 de ' + n + ' ≈ ' + num(Math.round(2 * n / 3)) + '. ✓'],
          fab: { setup: { ctx: 'livre', law: '0,66x', dom: 'R+', cd: 'R', inputs: '' }, run: [n, 'fwd'] },
        };
      }
      const v = X.tidy(9.66 + 0.66 * n);
      const vals = [v, X.tidy(10.32 * n), X.tidy(9.66 * n + 0.66), X.tidy(0.66 * n), X.tidy(9.66 + 66 * n)];
      if (!distinct(vals)) return T.decimal.make();
      return {
        code: 'D22',
        stem: '<p>A conta de luz é ' + mathHTML('9,66 + 0,66x', 'x', 'P = ') + ', com <i>x</i> em kWh.</p><p class="h-q">Quanto paga quem consumiu ' + n + ' kWh?</p>',
        alts: [
          { t: brl(v), ok: true, why: 'Primeiro 0,66 · ' + n + ', depois + 9,66.' },
          { t: brl(vals[1]), why: 'Somou 9,66 + 0,66 antes e multiplicou tudo por ' + n + '.' },
          { t: brl(vals[2]), why: 'Trocou a parte fixa com o preço por kWh.' },
          { t: brl(vals[3]), why: 'Esqueceu a taxa fixa de R$ 9,66.' },
          { t: brl(vals[4]), why: 'Esqueceu a vírgula: usou 66 em vez de 0,66.' },
        ],
        solve: ['Trocar x por ' + n + ': P = 9,66 + 0,66 · ' + n, 'Multiplicação primeiro: 0,66 · ' + n + ' = ' + f(0.66 * n), 'Depois a soma: 9,66 + ' + f(0.66 * n) + ' = <b>' + f(v) + '</b>.'],
        fab: { setup: { ctx: 'luz', law: '', dom: FF.ctx('luz').dom, cd: FF.ctx('luz').cd, inputs: '' }, run: [n, 'fwd'] },
      };
    },
  };

  /* ---------- Estado da rodada ---------- */
  const H = { list: [], i: 0, step: 0, warm: false, title: '', tpl: 'mix', showSolve: false, uid: 0 };
  function build(tplId) {
    const tpl = T[tplId];
    const it = tpl.make();
    it.tpl = tplId;
    it.code = it.code || tpl.code;
    it.src = tpl.src;
    it.grid = !!tpl.grid;
    it.alts = shuffle(it.alts.slice());
    it.counts = [0, 0, 0, 0, 0];
    it.uid = Date.now() + '-' + (H.uid++);
    return it;
  }
  function start(items, opts) {
    H.list = items.map(build);
    H.i = 0; H.step = 0; H.showSolve = false;
    H.warm = !!(opts && opts.warm);
    H.title = (opts && opts.title) || '';
    clearThink();
  }
  const cur = () => H.list[H.i];
  // passos de cada pergunta: 0 pensar, 1 placas, 2 revelar, 3… resolução (o aquecimento para no revelar)
  const nSteps = (it) => 3 + (H.warm ? 0 : it.solve.length);
  function atEnd() { const it = cur(); return !it || (H.i === H.list.length - 1 && H.step >= nSteps(it) - 1); }
  function next() {
    const it = cur();
    if (!it) return;
    if (H.step < nSteps(it) - 1) H.step++;
    else if (H.i < H.list.length - 1) { H.i++; H.step = 0; H.showSolve = false; }
    if (H.step === 2) record();
    draw();
  }
  function prev() {
    if (H.step > 0) H.step--;
    else if (H.i > 0) { H.i--; H.step = nSteps(cur()) - 1; }
    draw();
  }
  const hasBack = () => H.step > 0 || H.i > 0;

  /* Resultados guardados neste navegador (para o resumo por descritor) */
  const REC_KEY = 'fabrica-funcoes:placas';
  function record() {
    const it = cur();
    const total = it.counts.reduce((a, b) => a + b, 0);
    if (!total) return;
    let all = [];
    try { all = JSON.parse(localStorage.getItem(REC_KEY) || '[]'); } catch (e) { all = []; }
    const row = { uid: it.uid, when: new Date().toISOString(), lesson: FF.state.lesson || '', code: it.code, tpl: it.tpl,
      ok: it.alts.findIndex((a) => a.ok), counts: it.counts.slice(), whys: it.alts.map((a) => (a.ok ? '' : a.why)) };
    const k = all.findIndex((r) => r.uid === it.uid);
    if (k >= 0) all[k] = row; else all.push(row);
    try { localStorage.setItem(REC_KEY, JSON.stringify(all.slice(-400))); } catch (e) { /* sem armazenamento */ }
  }

  /* ---------- Tempo para pensar ---------- */
  let think = { id: 0, left: 0 };
  function clearThink() { clearInterval(think.id); think = { id: 0, left: 0 }; }
  function startThink(sec) {
    clearThink();
    think.left = sec;
    think.total = sec;
    think.id = setInterval(() => {
      think.left--;
      const el = document.getElementById('h-think');
      if (!el || think.left < 0) { clearThink(); return; }
      paintThink(el);
    }, 1000);
  }
  function paintThink(el) {
    el.style.setProperty('--p', String(Math.max(0, think.left) / think.total));
    el.querySelector('b').textContent = think.left > 0 ? think.left : '✓';
    el.classList.toggle('done', think.left <= 0);
    el.nextElementSibling.textContent = think.left > 0 ? 'Pense sozinho. Nada de placa ainda!' : 'Combine com o colega do lado.';
  }

  /* ---------- Desenho ---------- */
  let host = null;
  function draw() {
    if (!host) return;
    const it = cur();
    if (!it) { host.innerHTML = ''; return; }
    const st = H.step;
    const total = it.counts.reduce((a, b) => a + b, 0);
    const okI = it.alts.findIndex((a) => a.ok);
    // numa aula o título já está na barra da aula: aqui fica só a contagem e o descritor
    const inLesson = (H.title || H.warm) && FF.state.lesson;
    let h = '<div class="game-head h-head">' + (inLesson ? '' : '<h2>' + esc(H.title || (H.warm ? 'Aquecimento' : 'Placas A–E')) + '</h2>') +
      (H.list.length > 1 ? '<span class="h-count">' + (H.i + 1) + ' de ' + H.list.length + '</span>' : '') +
      '<span class="h-desc" title="' + esc(DESC[it.code] || '') + '"><b>' + esc(it.code) + '</b> ' + esc(DESC[it.code] || '') + '</span></div>';
    const kc = (k, w) => '<span class="kchip k-' + k + '">' + w + '</span>';
    h += '<div class="ex-card h-stem kbox k-q">' + kc('q', 'Pergunta') + it.stem + '</div>';
    if (st === 0) h += '<div class="h-cue kbox k-do">' + kc('do', 'Faça') + '<div class="h-think" id="h-think" style="--p:1"><b></b></div><p></p></div>';
    if (st === 1) h += '<div class="h-cue h-up kbox k-do">' + kc('do', 'Faça') + '<p><b>Placas para cima!</b> Toque nas letras para contar quantos alunos escolheram cada uma (opcional).</p></div>';
    h += '<ol class="h-alts' + (it.grid ? ' grid' : '') + '">' + it.alts.map((a, i) => {
      const cls = st >= 2 ? (a.ok ? ' ok' : ' no') : '';
      const pct = total ? Math.round((100 * it.counts[i]) / total) : 0;
      return '<li class="h-alt' + cls + '"><span class="h-l">' + LETTERS[i] + '</span><div class="h-body">' +
        (a.h || '<span class="h-t">' + esc(a.t) + '</span>') +
        (st >= 2 ? '<p class="h-why">' + (a.ok ? '✓ ' : '✗ ') + esc(a.why) + '</p>' : '') + '</div>' +
        (st >= 1 ? '<div class="h-tally"><button class="icon-btn sm" data-act="h-dec" data-i="' + i + '" aria-label="Tirar um voto de ' + LETTERS[i] + '">−</button><button class="h-n" data-act="h-inc" data-i="' + i + '" aria-label="Mais um voto em ' + LETTERS[i] + '">' + it.counts[i] + '</button>' +
          (total ? '<span class="h-bar"><i style="width:' + pct + '%"></i></span><span class="h-pct">' + pct + '%</span>' : '') + '</div>' : '') + '</li>';
    }).join('') + '</ol>';
    if (st >= 2 && total) {
      const wrong = it.counts.map((c, i) => ({ c, i })).filter((x) => x.i !== okI).sort((p, q) => q.c - p.c)[0];
      const pOk = Math.round((100 * it.counts[okI]) / total);
      h += '<p class="h-sum kbox ' + (pOk >= 50 ? 'k-ok' : 'k-warn') + '"><b>' + pOk + '% acertaram.</b>' + (wrong && wrong.c ? ' O erro mais escolhido foi <b>' + LETTERS[wrong.i] + '</b>: ' + esc(it.alts[wrong.i].why) : '') + '</p>';
    }
    const solveN = H.warm ? (H.showSolve ? it.solve.length : 0) : Math.max(0, st - 2);
    if (solveN) h += '<ol class="solve">' + it.solve.slice(0, solveN).map((s) => '<li>' + s + '</li>').join('') + '</ol>';
    const label = st === 0 ? 'Placas para cima' : st === 1 ? 'Revelar a resposta' : st < nSteps(it) - 1 ? 'Próximo passo da resolução' : H.i < H.list.length - 1 ? 'Próxima pergunta' : 'Fim';
    h += '<div class="g-row end">' +
      (H.warm && st >= 2 ? '<button class="btn btn-ghost" data-act="h-solve">' + (H.showSolve ? 'Esconder' : 'Ver') + ' a resolução</button>' : '') +
      (st >= 2 ? '<button class="btn btn-ghost" data-act="h-fab">Ver na Fábrica</button>' : '') +
      '<button class="btn btn-ghost" data-act="h-new">Outra pergunta</button>' +
      '<button class="btn btn-ghost" data-act="h-back"' + (hasBack() ? '' : ' disabled') + '>Voltar</button>' +
      '<button class="btn" data-act="h-next"' + (atEnd() ? ' disabled' : '') + '>' + label + '</button></div>';
    host.innerHTML = h;
    // o passo que acabou de aparecer nunca fica abaixo da tela
    const lastSolve = host.querySelector('.solve li:last-child');
    if (lastSolve && !H.warm) lastSolve.scrollIntoView({ block: 'nearest' });
    else if (st >= 1) (host.querySelector('.h-sum') || host.querySelector('.h-alts')).scrollIntoView({ block: 'nearest' });
    if (st === 0) {
      if (!think.id) startThink(H.warm ? 15 : 25);
      paintThink(document.getElementById('h-think'));
    } else clearThink();
  }
  function act(a, el) {
    const it = cur();
    if (a === 'h-next') { next(); return; }
    if (a === 'h-back') { prev(); return; }
    if (a === 'h-inc' || a === 'h-dec') {
      const i = Number(el.dataset.i);
      it.counts[i] = Math.max(0, it.counts[i] + (a === 'h-inc' ? 1 : -1));
      if (H.step >= 2) record();
      draw();
      return;
    }
    if (a === 'h-solve') { H.showSolve = !H.showSolve; draw(); return; }
    if (a === 'h-new') {
      // Desafios com "Todos os tipos": sorteia outro modelo; nas aulas, o mesmo modelo com números novos
      const id = H.title || H.warm ? it.tpl : H.tpl === 'mix' ? pick(TPL_IDS) : H.tpl;
      H.list[H.i] = build(id);
      H.step = 0; H.showSolve = false; clearThink(); draw();
      return;
    }
    if (a === 'h-fab') {
      const fb = it.fab;
      FF.set(Object.assign({ view: 'fab', preset: -1, made: '', bad: '', black: false, predict: false, table: true, diagram: true, graph: true, calc: true, curve: false }, fb.setup));
      FF.fab.clear();
      if (fb.run) setTimeout(() => FF.fab.load(fb.run[0], fb.run[1]), 60);
      else if (fb.all) setTimeout(() => FF.fab.next(), 60);
    }
  }

  const TPL_IDS = Object.keys(T);
  FF.hinge = {
    TEMPLATES: TPL_IDS.map((id) => ({ id, name: T[id].name, code: T[id].code })),
    DESC,
    /* items: lista de modelos; opts: {warm, title} */
    start(items, opts) { start(items, opts); },
    /* Desafios: uma pergunta do modelo escolhido (ou sorteado) */
    single(tpl) {
      H.tpl = tpl || 'mix';
      start([H.tpl === 'mix' ? pick(TPL_IDS) : H.tpl], {});
    },
    has: () => H.list.length > 0,
    inLesson: () => !!(H.title || H.warm),
    mount(el) { host = el; draw(); },
    draw, act, next, prev, atEnd, hasBack,
    stop: clearThink,
    results() { try { return JSON.parse(localStorage.getItem(REC_KEY) || '[]'); } catch (e) { return []; } },
    _make: (id) => build(id),
  };
})();
