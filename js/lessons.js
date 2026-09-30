/* Aulas: o capítulo 8 em sequência, usando as ferramentas do material.
   Cada aula é uma lista de momentos:
   - 'slide': tela de conversa ou explicação; os itens aparecem um por clique (perguntas, respostas, contas);
   - 'fab' | 'insp' | 'game' | 'emp': abre a ferramenta já configurada. O passador avança dentro da
     ferramenta e, quando ela termina, passa para o próximo momento.
   Nas telas, {{prefixo|lei|variável}} vira a expressão desenhada (frações, potências). */
(function () {
  'use strict';
  const FF = window.FF;
  const X = FF.expr;
  const $ = (id) => document.getElementById(id);
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ---------- Atalhos para montar os momentos ---------- */
  const ctx = (id, extra) => Object.assign({ ctx: id, law: '', dom: FF.ctx(id).dom, cd: FF.ctx(id).cd }, extra || {});
  const preset = (title, extra) => {
    const i = FF.PRESETS.findIndex((p) => p.title === title);
    const p = FF.PRESETS[i];
    return Object.assign({ ctx: 'livre', law: p.law, dom: p.dom || 'R', cd: p.cd || 'R', inputs: (p.inputs || []).join(';'), preset: i }, extra || {});
  };
  const law = (src, extra) => Object.assign({ ctx: 'livre', law: src, dom: 'R', cd: 'R', inputs: '' }, extra || {});

  /* ---------- As aulas ---------- */
  FF.LESSONS = [
    {
      id: 'a1', title: 'Uma variável pode mudar tudo', sub: 'Trocando ideias e Atividade 1: a conta de luz',
      book: 'Livro, p. 226 a 228', dur: '2 aulas de 50 min',
      goals: ['Perceber que o valor de uma conta depende do consumo (uma grandeza varia em função da outra).', 'Escrever a lei P = 9,66 + 0,66x e usá-la nos dois sentidos.', 'Organizar os valores numa tabela e calcular a média do consumo.'],
      moments: [
        { kind: 'slide', kicker: 'Trocando ideias · roda de conversa', title: 'De que depende a conta de luz?',
          body: '<div class="bill"><div class="bill-h">CONTA DE ENERGIA ELÉTRICA <span>mar/2024</span></div><div class="bill-r"><span>Consumo do mês</span><b>236 kWh</b></div><div class="bill-r"><span>Tarifa</span><b>R$ 0,66 por kWh</b></div><div class="bill-r"><span>Iluminação pública (Cosip)</span><b>R$ 9,66</b></div><div class="bill-r total"><span>TOTAL A PAGAR</span><b>R$ ?</b></div></div>',
          steps: ['Você conhece esse tipo de fatura? Já observou uma conta dessas em casa?', 'Você sabe estimar o gasto mensal de água, energia elétrica e telefone da sua casa?', 'De que dependem esses gastos?', 'Que cálculo deve ser feito para determinar o valor mensal de cada conta?'],
          note: 'Levantar conhecimentos prévios. Se possível, mostre contas reais: quanto maior o consumo em kWh (ou m³), maior o valor. Aproveite para falar da unidade quilowatt-hora.' },
        { kind: 'slide', kicker: 'Atividade 1 · item a', title: 'Escrevendo a conta com uma letra',
          body: '<p>A tarifa de energia é de <b>R$ 0,66 por kWh</b> e há uma taxa fixa de iluminação pública (Cosip) de <b>R$ 9,66</b>.</p><p>Escreva o preço <i>P</i> em função dos kWh consumidos. Use <i>x</i> para o número de kWh.</p>',
          steps: ['O que é fixo? <b>R$ 9,66</b>, todo mês.', 'O que muda? <b>0,66 para cada kWh</b>: 0,66 · <i>x</i>.', '{{P = |9,66 + 0,66x|x}}'],
          note: 'Estratégia de modelagem: separar a parte fixa da parte que depende de x.' },
        { kind: 'fab', title: 'Item b: 236 kWh', setup: ctx('luz'), run: [236, 'fwd'], until: 'run',
          prompt: 'A lei vira uma máquina: <b>× 0,66</b> (cada kWh) e depois <b>+ 9,66</b> (a taxa fixa). Avance para fabricar 236 kWh.' },
        { kind: 'fab', title: 'Item c: quem pagou R$ 135,06?', setup: ctx('luz'), run: [135.06, 'rev'], until: 'run',
          prompt: 'Agora ao contrário: a conta foi R$ 135,06. A máquina desfaz as engrenagens de trás para a frente.' },
        { kind: 'fab', title: 'Item d: o histórico de consumo', setup: ctx('luz'), until: 'all',
          prompt: 'Cada mês da tabela passa pela máquina. Acompanhe a tabela, o diagrama e o gráfico se completando.' },
        { kind: 'slide', kicker: 'Atividade 1 · item e', title: 'Consumo médio nos seis meses',
          body: '<table class="ltable"><tr><th>Mês</th><td>jan</td><td>fev</td><td>mar</td><td>abr</td><td>mai</td><td>jun</td></tr><tr><th>kWh</th><td>254</td><td>269</td><td>237</td><td>275</td><td>229</td><td>261</td></tr></table>',
          steps: ['Somamos os seis meses: 254 + 269 + 237 + 275 + 229 + 261 = <b>1 525</b>', 'Dividimos por 6: 1 525 ÷ 6 ≈ <b>254,17 kWh</b> por mês', 'Uma conta com esse consumo médio: <i>P</i> = 9,66 + 0,66 · 254,17 ≈ <b>R$ 177,41</b>'],
          note: 'Retomada de média aritmética (material do IBGE Educa sugerido no livro).' },
        { kind: 'slide', kicker: 'Você sabia? · Territórios de aprendizagem', title: 'A Cosip e a conta da sua casa',
          body: '<p>A <b>Cosip</b> financia a iluminação pública do município. Em São Paulo, o valor depende da faixa de consumo.</p>',
          steps: ['<b>Para a próxima aula:</b> traga uma conta de energia da sua casa.', 'Com o consumo dos últimos 12 meses, procure uma expressão que relacione o valor pago ao consumo.', 'Na Fábrica, é só trocar os números da lei para a tarifa da sua cidade.'],
          note: 'Consulte com a turma o site da distribuidora de energia do município.' },
      ],
    },
    {
      id: 'a2', title: 'Função: entra x, sai y', sub: 'Organizando as ideias, Atividades 2 e 3',
      book: 'Livro, p. 229 a 234', dur: '2 aulas de 50 min',
      goals: ['Definir função como relação em que cada x tem um único y.', 'Usar a notação f: A → B e a lei de formação.', 'Calcular a conta de água por faixas e reconhecer a proporcionalidade d = 80t.'],
      moments: [
        { kind: 'slide', kicker: 'Organizando as ideias', title: 'Função',
          body: '<p>Em Matemática, <b>função</b> é uma relação entre duas grandezas: quando o valor de uma varia, o da outra também varia.</p><p class="big">Uma função é uma lei que faz <b>cada</b> elemento <i>x</i> de um conjunto A corresponder a <b>um único</b> elemento <i>y</i> de um conjunto B.</p>',
          steps: ['Notação: <b><i>f</i>: A → B</b> (função <i>f</i> de A em B).', 'Lei de formação, por exemplo: {{y = |x − 2|x}}', 'Na fábrica: A é o depósito de entrada, B o de saída e a lei é a máquina.'] },
        { kind: 'fab', title: 'y = x − 2, de A em B', setup: preset('y = x − 2'), until: 'all',
          prompt: 'Fabrique todos os elementos de A = {2, 3, 4, 5} e veja o diagrama de flechas do livro se formar.' },
        { kind: 'slide', kicker: 'Atividade 2', title: 'A conta de água tem faixas',
          body: '<table class="ltable"><tr><th>Consumo (m³)</th><th>Tarifa</th></tr><tr><td>0 a 10 (mínimo)</td><td>R$ 38,34 por mês</td></tr><tr><td>11 a 20</td><td>R$ 6,01 por m³</td></tr><tr><td>21 a 50</td><td>R$ 14,98 por m³</td></tr><tr><td>acima de 50</td><td>R$ 16,50 por m³</td></tr></table>',
          steps: ['<b>a.</b> O valor a pagar depende do <b>consumo de água</b>.', '15 m³: R$ 38,34 pelos 10 primeiros + 6,01 · 5 pelos 5 que passam = <b>R$ 68,39</b>.', 'Cada faixa tem a sua conta: a máquina primeiro descobre a faixa.'],
          note: 'Atenção ao valor fixo da primeira faixa, que se repete em todas.' },
        { kind: 'fab', title: 'Item b: 25 m³', setup: ctx('agua'), run: [25, 'fwd'], until: 'run',
          prompt: '25 m³ está na faixa de 21 a 50 m³. Veja a conta do livro: 38,34 + 6,01 · 10 + 14,98 · 5.' },
        { kind: 'fab', title: 'Item b: a tabela inteira', setup: ctx('agua', { inputs: '15;20;25;30;35', curve: true }), until: 'all',
          prompt: 'Complete a tabela do item b. No gráfico, a curva fica mais inclinada a cada faixa.' },
        { kind: 'slide', kicker: 'Atividade 3', title: 'A viagem de Felipe',
          body: '<p>O carro percorre 40 km em meia hora, sempre na mesma velocidade.</p><table class="ltable"><tr><th><i>d</i> (km)</th><td>40</td><td>80</td><td>120</td><td>160</td><td>200</td><td>240</td></tr><tr><th><i>t</i> (h)</th><td>1/2</td><td>1</td><td>3/2</td><td>2</td><td>5/2</td><td>3</td></tr></table>',
          steps: ['<b>a.</b> Grandezas: distância (km) e tempo (h).', '<b>b.</b> {{d/t = |40/(1/2)|t}} = 80; 80 ÷ 1 = 80; 120 ÷ 3/2 = 80 …', '<b>c.</b> O quociente é sempre <b>80</b>.', '<b>d.</b> {{d = |80t|t}}'] },
        { kind: 'fab', title: 'Itens g e h: o gráfico', setup: ctx('viagem', { curve: true }), until: 'all',
          prompt: 'Fabrique os tempos da tabela. O gráfico dos pares (t; d) forma uma <b>reta</b> que passa pela origem.' },
        { kind: 'fab', title: 'Item e: 6 horas', setup: ctx('viagem'), run: [6, 'fwd'], until: 'run', prompt: 'Mantendo a velocidade, quantos km em 6 horas?' },
        { kind: 'fab', title: 'Item f: 640 km', setup: ctx('viagem'), run: [640, 'rev'], until: 'run', prompt: 'Quanto tempo para percorrer 640 km? A máquina ao contrário desfaz o × 80.' },
      ],
    },
    {
      id: 'a3', title: 'Funções no dia a dia', sub: 'Atividades 4 a 8: jardim, telefone, técnico, aplicativo, salário',
      book: 'Livro, p. 234 a 239', dur: '2 aulas de 50 min',
      goals: ['Modelar situações com uma parte fixa e uma parte que depende de x.', 'Resolver problemas nos dois sentidos (achar y e achar x).', 'Perceber limites do domínio no contexto (o comprimento do jardim).'],
      moments: [
        { kind: 'slide', kicker: 'Atividade 4', title: 'A cerca do jardim',
          body: '<p>Um jardineiro tem <b>40 m de tela</b> para cercar um jardim retangular.</p>',
          steps: ['<b>a e b.</b> Alguns jardins: 1 × 19, 2 × 18, 5 × 15, 10 × 10 … (comprimento + largura = 20).', '<b>c.</b> {{L = |(40 − 2c)/2|c}}', 'que também pode ser escrita {{L = |20 − c|c}}'] },
        { kind: 'fab', title: 'Itens d e e: o gráfico do jardim', setup: ctx('jardim', { curve: true }), until: 'all',
          prompt: 'Fabrique os comprimentos. O gráfico é uma <b>reta que desce</b>: quanto maior o comprimento, menor a largura.' },
        { kind: 'fab', title: 'Um jardim de 25 m?', setup: ctx('jardim'), run: [25, 'fwd'], until: 'run',
          prompt: 'Dá para o comprimento ser 25 m com 40 m de tela? Veja o que a fábrica faz.' },
        { kind: 'slide', kicker: 'Atividade 5', title: 'O plano de telefone',
          body: '<p>R$ 60,00 por mês com 300 minutos; cada minuto <b>além</b> dos 300 custa R$ 0,15.</p>',
          steps: ['<b>a.</b> {{y = |60 + 0,15x|x}} (<i>x</i> = minutos que passaram dos 300)', '<b>b.</b> 350 minutos: <i>x</i> = 50.', '<b>c.</b> A fatura foi R$ 78,00: quantos minutos?'],
          note: 'Destaque que x é o número de minutos excedentes, não o total.' },
        { kind: 'fab', title: 'Item b: 350 minutos', setup: ctx('telefone'), run: [50, 'fwd'], until: 'run', prompt: '350 minutos são 50 além do pacote.' },
        { kind: 'fab', title: 'Item c: fatura de R$ 78,00', setup: ctx('telefone'), run: [78, 'rev'], until: 'run', prompt: 'Desfazendo: 78 − 60 = 18; 18 ÷ 0,15 = 120 minutos excedentes, ou seja, 420 minutos no total.' },
        { kind: 'slide', kicker: 'Atividades 6, 7 e 8', title: 'Mesma ideia, outras situações',
          body: '<p>Em todas há uma <b>parte fixa</b> e uma <b>parte que depende de x</b>.</p>',
          steps: ['Visita técnica: {{P = |50 + 30h|h}}', 'Aplicativo de viagem: {{P = |5 + 1,55x|x}}', 'Salário com comissão: {{S = |1500 + 15x|x}}'] },
        { kind: 'fab', title: 'Atividade 6: serviço de 2 h 30 min', setup: ctx('tecnico'), run: [2.5, 'fwd'], until: 'run', prompt: '2 horas e 30 minutos = 2,5 horas.' },
        { kind: 'fab', title: 'Atividade 6: pagou R$ 140,00', setup: ctx('tecnico'), run: [140, 'rev'], until: 'run', prompt: 'Quanto tempo durou o serviço?' },
        { kind: 'fab', title: 'Atividade 7: corrida de R$ 27,50', setup: ctx('app'), run: [27.5, 'rev'], until: 'run', prompt: 'Quantos km? O resultado não é exato: arredonde (≈ 14,5 km).' },
        { kind: 'fab', title: 'Atividade 8: salário de R$ 2 460,00', setup: ctx('salario'), run: [2460, 'rev'], until: 'run', prompt: 'Quantas vendas o funcionário fez?' },
        { kind: 'game', title: 'Desafio: Adivinhe a regra', game: 'rule', level: 2,
          prompt: 'Em equipes: a máquina esconde uma lei do tipo <i>ax</i> + <i>b</i>. Cada equipe pede uma pista por vez.' },
      ],
    },
    {
      id: 'a4', title: 'Lei de formação, domínio e imagem', sub: 'Atividades 9 a 12 e Organizando as ideias',
      book: 'Livro, p. 240 a 243', dur: '2 aulas de 50 min',
      goals: ['Escrever leis de formação a partir de frases.', 'Identificar domínio, contradomínio e imagem.', 'Calcular imagens como f(5), f(10) − f(5).'],
      moments: [
        { kind: 'slide', kicker: 'Atividade 9', title: 'Da frase para a lei',
          body: '<p>Escreva a lei da função que relaciona um número real <i>x</i> com…</p>',
          steps: ['<b>a.</b> o seu triplo: {{f(x) = |3x|x}}', '<b>b.</b> a sua metade: {{f(x) = |x/2|x}}', '<b>c.</b> o seu quadrado: {{f(x) = |x²|x}}', '<b>d.</b> o seu dobro adicionado à sua terça parte: {{f(x) = |2x + x/3|x}}'] },
        { kind: 'fab', title: 'O dobro mais a terça parte', setup: preset('dobro + terça parte'), run: [3, 'fwd'], until: 'run',
          prompt: 'O <i>x</i> aparece duas vezes: a <b>copiadora</b> faz duas cópias; uma vai para × 2, a outra para ÷ 3, e a junção soma.' },
        { kind: 'slide', kicker: 'Organizando as ideias', title: 'Domínio, contradomínio e imagem',
          body: '<p>Na função <i>y</i> = <i>x</i> − 2 de A = {2, 3, 4, 5} em B = {0, 1, 2, 3, 4}:</p>',
          steps: ['<b>Domínio (D)</b>: todos os elementos de A. D = {2, 3, 4, 5}', '<b>Contradomínio (CD)</b>: todos os elementos de B. CD = {0, 1, 2, 3, 4}', '<b>Imagem (Im)</b>: os elementos de B que recebem flecha. Im = {0, 1, 2, 3}', 'Im ⊂ CD. E todo elemento do domínio tem <b>uma, e só uma</b>, imagem.'] },
        { kind: 'insp', title: 'Inspecionando y = x − 2', mode: 'diag', case: 'y = x − 2',
          prompt: 'O inspetor confere cada elemento de A e, no fim, mostra D, CD e Im.' },
        { kind: 'fab', title: 'Atividade 10: o avião', setup: ctx('aviao', { dom: '{1;2;3;4;5}' }), until: 'all',
          prompt: '<b>a.</b> <i>d</i> = 600<i>t</i>. Fabrique os tempos da tabela: <b>b.</b> D = {1, 2, 3, 4, 5}; <b>c.</b> Im = {600, 1 200, 1 800, 2 400, 3 000}.' },
        { kind: 'fab', title: 'Atividade 10 d: depois de 8 horas', setup: ctx('aviao'), run: [8, 'fwd'], until: 'run',
          prompt: 'Considerando que o avião mantém o movimento (o domínio passa a ser t ≥ 0).' },
        { kind: 'fab', title: 'Atividade 11: f(x) = x² + 2x', setup: preset('x² + 2x'), until: 'all',
          prompt: 'Complete a tabela do livro. Repare: 0 e −2 têm a mesma imagem (0), e isso pode!' },
        { kind: 'slide', kicker: 'Atividade 12', title: 'Imagens de f(x) = 2x − 0,5',
          steps: ['<b>a.</b> <i>f</i>(5) = 2 · 5 − 0,5 = <b>9,5</b>', '<b>b.</b> <i>f</i>(10) = 2 · 10 − 0,5 = <b>19,5</b>', '<b>c.</b> <i>f</i>(−2) = 2 · (−2) − 0,5 = <b>−4,5</b>', '<b>d.</b> <i>f</i>(10) − <i>f</i>(5) = 19,5 − 9,5 = <b>10</b>', '<b>e.</b> <i>f</i>(−2) + <i>f</i>(5) = −4,5 + 9,5 = <b>5</b>', '<b>f.</b> <i>f</i>(−2) · <i>f</i>(5) · <i>f</i>(10) = (−4,5) · 9,5 · 19,5 = <b>−833,625</b>'],
          body: '<p>Calcule:</p>', note: 'Retomada das operações com números racionais.' },
        { kind: 'fab', title: 'Conferindo na máquina', setup: preset('2x − 0,5'), until: 'all', prompt: 'A máquina confere <i>f</i>(5), <i>f</i>(10), <i>f</i>(−2) e <i>f</i>(0).' },
      ],
    },
    {
      id: 'a5', title: 'Domínio não dado e É função?', sub: 'Atividades 13 a 16',
      book: 'Livro, p. 243 a 246', dur: '2 aulas de 50 min',
      goals: ['Encontrar o domínio quando ele não é dado (divisão por zero, raiz de negativo).', 'Reconhecer, em tabelas e diagramas, quando uma relação é função.', 'Achar o x a partir da imagem (f(x) = x³ + 2).'],
      moments: [
        { kind: 'slide', kicker: 'Organizando as ideias', title: 'Domínio não dado',
          body: '<p>Quando o domínio não é dado, ele é o conjunto dos números reais (ℝ), <b>tirando</b> os valores para os quais as operações não fazem sentido.</p>',
          steps: ['{{f(x) = |1/x|x}} não aceita <i>x</i> = 0: D = ℝ*.', 'Denominador nunca pode ser <b>zero</b>.', 'Raiz quadrada: o que está dentro não pode ser <b>negativo</b>.'] },
        { kind: 'fab', title: 'f(x) = 1/x', setup: preset('1/x'), until: 'all',
          prompt: 'Fabrique todos: o <b>0</b> trava a engrenagem e vai para o <b>refugo</b>.' },
        { kind: 'fab', title: 'Atividade 13 a: (5x + 4)/(2x − 2)', setup: preset('(5x + 4)/(2x − 2)'), run: [1, 'fwd'], until: 'run',
          prompt: 'Com <i>x</i> = 1, a cópia de baixo chega à junção valendo 0.' },
        { kind: 'fab', title: 'Atividade 13 c: √(x − 5)', setup: preset('√(x − 5)'), until: 'all',
          prompt: 'Quais valores vão para o refugo? A partir de qual <i>x</i> a máquina funciona?' },
        { kind: 'slide', kicker: 'Atividade 13', title: 'Os domínios',
          steps: ['<b>a.</b> 2<i>x</i> − 2 ≠ 0 → <i>x</i> ≠ 1: D = ℝ − {1}', '<b>b.</b> <i>x</i>² − 16 ≠ 0 → <i>x</i> ≠ 4 e <i>x</i> ≠ −4: D = ℝ − {4, −4}', '<b>c.</b> <i>x</i> − 5 ≥ 0 → D = {<i>x</i> ∈ ℝ | <i>x</i> ≥ 5}', '<b>d.</b> <i>x</i> + 10 ≥ 0 → D = {<i>x</i> ∈ ℝ | <i>x</i> ≥ −10}'],
          body: '<p>Determine o domínio de cada função:</p>' },
        { kind: 'insp', title: 'Atividade 14: as notas', mode: 'tab', case: 'Notas de Língua Portuguesa',
          prompt: 'Votem: a tabela nome → nota é função? Rafael e José tiraram a mesma nota.' },
        { kind: 'insp', title: 'E a tabela ao contrário?', mode: 'tab', case: 'A mesma tabela, ao contrário',
          prompt: 'Agora nota → nome. O 8,5 vai para quem?' },
        { kind: 'insp', title: 'Atividade 15: Diagrama 1', mode: 'diag', case: 'Diagrama 1', prompt: 'Votem antes de inspecionar.' },
        { kind: 'insp', title: 'Atividade 15: Diagrama 2', mode: 'diag', case: 'Diagrama 2', prompt: 'Dois elementos com a mesma imagem: pode?' },
        { kind: 'insp', title: 'Atividade 15: Diagrama 3', mode: 'diag', case: 'Diagrama 3', prompt: 'Olhem o 6 com atenção.' },
        { kind: 'insp', title: 'Atividade 15: Diagrama 4', mode: 'diag', case: 'Diagrama 4', prompt: 'Todos vão para o 2: é função?' },
        { kind: 'fab', title: 'Atividade 16: f(x) = x³ + 2', setup: preset('x³ + 2'), run: [66, 'rev'], until: 'run',
          prompt: 'A imagem é 66. Desfazendo: 66 − 2 = 64 e ∛64 = 4. (Os outros itens: 3, 10 e 29.)' },
      ],
    },
    {
      id: 'a6', title: 'Gráfico de uma função', sub: 'Organizando as ideias: a reta vertical',
      book: 'Livro, p. 246 a 248', dur: '1 a 2 aulas de 50 min',
      goals: ['Entender o gráfico como o conjunto dos pares (x, f(x)).', 'Usar o teste da reta vertical para decidir se um gráfico é de função.', 'Ler domínio e imagem no gráfico.'],
      moments: [
        { kind: 'slide', kicker: 'Organizando as ideias', title: 'O gráfico de uma função',
          body: '<p>O gráfico de uma função é o conjunto dos pares ordenados (<i>x</i>, <i>y</i>) com <i>x</i> no domínio e <i>y</i> = <i>f</i>(<i>x</i>).</p>',
          steps: ['Cada produto que sai da fábrica é um <b>ponto</b> do gráfico.', 'Para saber se um gráfico é de função, trace uma <b>reta perpendicular ao eixo x</b>.', 'Se ela cortar o gráfico em <b>um único ponto</b> (em qualquer lugar), é gráfico de função.'] },
        { kind: 'fab', title: 'Pontos que viram gráfico', setup: law('2x + 1', { inputs: '-2;-1;0;1;2;3', curve: true }), until: 'all',
          prompt: 'Cada par (<i>x</i>; <i>f</i>(<i>x</i>)) marca um ponto. Com todos, a curva mostra a reta inteira.' },
        { kind: 'insp', title: 'Reta', mode: 'graf', case: 'Reta', prompt: 'Votem, arrastem a reta vermelha e deixem o inspetor varrer.' },
        { kind: 'insp', title: 'Parábola', mode: 'graf', case: 'Parábola', prompt: 'E a parábola?' },
        { kind: 'insp', title: 'Circunferência', mode: 'graf', case: 'Circunferência', prompt: 'Uma das formas sugeridas para o GeoGebra.' },
        { kind: 'insp', title: 'Coração', mode: 'graf', case: 'Coração', prompt: 'O coração do GeoGebra: é função?' },
        { kind: 'insp', title: 'Meia circunferência', mode: 'graf', case: 'Meia circunferência', prompt: 'Só a parte de cima: e agora?' },
        { kind: 'insp', title: 'Reta vertical', mode: 'graf', case: 'Reta vertical', prompt: 'x = 2: quantos pontos a reta vertical corta?' },
        { kind: 'game', title: 'Desafio: Corrida das engrenagens', game: 'race', level: 1,
          prompt: 'Em equipes, montem a máquina que produz os pares dados.' },
      ],
    },
    {
      id: 'a7', title: 'O que sei agora: minha empresa', sub: 'Funções de custo, mão de obra, faturamento e crescimento',
      book: 'Livro, p. 248', dur: '2 aulas de 50 min',
      goals: ['Criar funções para uma empresa fictícia.', 'Comparar faturamento e custo no gráfico: lucro, prejuízo e ponto de equilíbrio.', 'Revisar o capítulo com exercícios.'],
      moments: [
        { kind: 'slide', kicker: 'O que sei agora', title: 'Montem uma empresa',
          body: '<p>Em grupos de quatro, montem uma empresa fictícia (doces caseiros, camisetas, artesanato…) e criem funções para:</p>',
          steps: ['os <b>custos</b> para fabricar um produto;', 'o custo com <b>mão de obra</b>, com acréscimos como horas extras e comissão;', 'a perspectiva de <b>faturamento</b> ao longo do tempo;', 'a perspectiva de <b>crescimento</b> ao longo do tempo.'],
          note: 'Proponha produtos simples; a atividade trabalha empreendedorismo.' },
        { kind: 'emp', title: 'A empresa de doces', model: 'doces',
          prompt: 'Arrastem no gráfico: onde o faturamento passa o custo? Troquem os números da empresa no cartão ao lado.' },
        { kind: 'slide', kicker: 'Para os grupos', title: 'Perguntas sobre a empresa',
          steps: ['Qual é o <b>ponto de equilíbrio</b>? O que ele significa?', 'Quantas unidades vender para <b>lucrar R$ 500</b>?', 'Em que <b>mês</b> a empresa começa a lucrar?', 'O que acontece se o preço aumentar R$ 0,50?'] },
        { kind: 'game', title: 'Revisão: exercícios', game: 'ex', level: 2, ctx: 'luz',
          prompt: 'Exercícios com números novos. Avance para revelar a resolução, passo a passo.' },
        { kind: 'slide', kicker: 'Fechamento', title: 'O que aprendemos',
          steps: ['<b>Função</b>: cada <i>x</i> do domínio tem <b>uma única</b> imagem.', 'A <b>lei de formação</b> é a máquina: dá para ir e (quase sempre) voltar.', 'D, CD e Im: <b>Im ⊂ CD</b>; o domínio exclui divisão por zero e raiz de negativo.', 'No <b>gráfico</b>, nenhuma reta vertical corta em mais de um ponto.'] },
      ],
    },
  ];

  const LS = FF.LESSONS;
  const TOOL_VIEW = { slide: 'aula', fab: 'fab', insp: 'insp', game: 'game', emp: 'emp' };
  const KIND_NAME = { slide: 'Tela', fab: 'Fábrica', insp: 'É função?', game: 'Desafio', emp: 'Minha empresa' };

  function lesson() { return LS.find((l) => l.id === FF.state.lesson) || null; }
  function moment() { const l = lesson(); return l ? l.moments[FF.state.lm] || null : null; }
  const atEndOfLesson = () => { const l = lesson(); return l && FF.state.lm >= l.moments.length; };

  /* {{prefixo|lei|var}} → expressão desenhada */
  function rich(html, size) {
    return String(html || '').replace(/\{\{([^|]*)\|([^|]*)\|([^}]*)\}\}/g, (m, pre, src, v) => {
      try { return '<span class="lmath">' + FF.math.inline(X.parse(src, v || 'x'), size || 34, v || 'x', pre) + '</span>'; }
      catch (e) { return esc(pre + src); }
    });
  }

  /* ---------- Controle ---------- */
  const BASE_FAB = { ctx: 'livre', law: '2x + 1', dom: 'R', cd: 'R', inputs: '', preset: -1, made: '', bad: '',
    black: false, predict: false, table: true, diagram: true, graph: true, calc: true, curve: false };

  function enter(opts) {
    const mo = moment();
    if (!mo) { FF.set({ view: 'aula' }); render(); return; }
    if (mo.kind === 'slide') { FF.set({ view: 'aula' }); render(); return; }
    if (mo.kind === 'fab') {
      FF.set(Object.assign({}, BASE_FAB, mo.setup, { view: 'fab' }));
      FF.fab.clear();
      if (opts && opts.back) {
        // Voltando de um momento seguinte: a máquina aparece como terminou
        if (mo.run) setTimeout(() => FF.fab.restoreRun(mo.run[0], mo.run[1], 999), 60);
        else if (mo.until === 'all') {
          const list = FF.inputList();
          FF.set({ made: list.join(';'), bad: list.map((v) => 'f' + v).join(';') });
          FF.fab.reset();
        }
      } else if (mo.run) setTimeout(() => FF.fab.load(mo.run[0], mo.run[1]), 60);
      else if (mo.until === 'all') setTimeout(() => FF.fab.next(), 60);
    } else if (mo.kind === 'insp') {
      FF.set({ view: 'insp' });
      FF.insp.open(mo.mode, mo.case);
    } else if (mo.kind === 'game') {
      FF.set({ view: 'game' });
      FF.games.open(mo.game, mo.level, mo.ctx);
    } else if (mo.kind === 'emp') {
      FF.set({ view: 'emp' });
      FF.emp.open(mo.model);
    }
    render();
  }
  function goMoment(k, opts) {
    const l = lesson();
    if (!l) return;
    k = Math.max(0, Math.min(l.moments.length, k));
    const mo = l.moments[k];
    FF.set({ lm: k, ls: opts && opts.back && mo && mo.kind === 'slide' ? (mo.steps || []).length : 0 });
    enter(opts);
  }
  function toolDone(mo) {
    if (mo.kind === 'fab') {
      const st = FF.fab.status();
      if (mo.until === 'all') return st.atEnd && st.pending === 0;
      if (mo.until === 'run') return st.run && st.atEnd;
      return true;
    }
    if (mo.kind === 'insp') return FF.insp.atEnd();
    if (mo.kind === 'game') return FF.games.atEnd();
    return true;
  }
  /* A aula está na tela certa? (se o professor abriu outra aba, o passador volta a comandar a aba) */
  function inControl() {
    const l = lesson();
    if (!l) return false;
    const mo = moment();
    const want = mo ? TOOL_VIEW[mo.kind] : 'aula';
    return FF.state.view === want;
  }
  function next() {
    const mo = moment();
    if (!mo) return; // fim da aula
    if (mo.kind === 'slide') {
      if (FF.state.ls < (mo.steps || []).length) { FF.set({ ls: FF.state.ls + 1 }); render(); return; }
      goMoment(FF.state.lm + 1);
      return;
    }
    if (!toolDone(mo)) {
      ({ fab: FF.fab, insp: FF.insp, game: FF.games }[mo.kind]).next();
      renderBar();
      return;
    }
    goMoment(FF.state.lm + 1);
  }
  function prev() {
    const mo = moment();
    if (mo && mo.kind === 'slide' && FF.state.ls > 0) { FF.set({ ls: FF.state.ls - 1 }); render(); return; }
    if (mo && mo.kind === 'fab') { const st = FF.fab.status(); if (st.run && st.i > 0) { FF.fab.prev(); return; } }
    if (mo && mo.kind === 'insp' && FF.insp.hasBack()) { FF.insp.prev(); return; }
    if (mo && mo.kind === 'game' && FF.games.hasBack()) { FF.games.prev(); return; }
    if (FF.state.lm > 0) goMoment(FF.state.lm - 1, { back: true });
  }
  function start(id, k) {
    FF.set({ lesson: id, lm: k || 0, ls: 0 });
    enter();
  }
  function stop() {
    FF.set({ lesson: '', lm: 0, ls: 0, view: 'aula' });
    render();
  }

  /* ---------- Desenho ---------- */
  function renderBar() {
    const bar = $('lesson-bar');
    const l = lesson();
    bar.hidden = !l;
    document.body.classList.toggle('in-lesson', !!l);
    if (!l) return;
    const mo = moment();
    const n = l.moments.length;
    $('lb-where').innerHTML = '<b>Aula ' + (LS.indexOf(l) + 1) + '</b> · ' + (mo ? 'momento ' + (FF.state.lm + 1) + ' de ' + n : 'fim');
    $('lb-title').innerHTML = mo ? esc(mo.title || '') : 'Aula concluída';
    $('lb-prompt').innerHTML = mo && mo.kind !== 'slide' ? rich(mo.prompt || '', 18) : '';
    $('lb-prompt').hidden = !(mo && mo.kind !== 'slide' && mo.prompt);
    $('lb-back').hidden = inControl();
    $('lb-prev').disabled = FF.state.lm === 0 && FF.state.ls === 0 && !(mo && mo.kind !== 'slide' && ((mo.kind === 'fab' && FF.fab.status().i > 0) || (mo.kind === 'insp' && FF.insp.hasBack())));
    $('lb-next').disabled = !mo;
    const dots = l.moments.map((m, i) => '<button class="ldot k-' + m.kind + (i < FF.state.lm ? ' done' : '') + (i === FF.state.lm ? ' current' : '') + '" data-m="' + i + '" title="' + esc((i + 1) + '. ' + KIND_NAME[m.kind] + ': ' + (m.title || '')) + '"></button>').join('');
    $('lb-dots').innerHTML = dots;
    const nextHint = mo && (mo.kind === 'slide' ? FF.state.ls >= (mo.steps || []).length : toolDone(mo));
    $('lb-next').classList.toggle('pulse', !!nextHint && FF.state.lm < n - 1);
  }

  function outline(l, current) {
    return '<ol class="outline">' + l.moments.map((m, i) =>
      '<li class="ol-item k-' + m.kind + (current && i === FF.state.lm ? ' current' : '') + (current && i < FF.state.lm ? ' done' : '') + '"><button data-go="' + i + '">' +
      '<span class="ol-kind">' + KIND_NAME[m.kind] + '</span><span class="ol-title">' + esc(m.title || '') + '</span>' +
      (m.kicker ? '<span class="ol-kick">' + esc(m.kicker) + '</span>' : '') + '</button></li>').join('') + '</ol>';
  }

  function render() {
    renderBar();
    if (FF.state.view !== 'aula') return;
    const l = lesson();
    const main = $('aula-main'), side = $('aula-side');
    if (!l) {
      main.innerHTML = '<div class="aula-intro"><p class="eyebrow">Capítulo 8 · Uma variável pode mudar tudo</p><h2>Aulas prontas</h2>' +
        '<p>Cada aula segue o livro na ordem: conversa, atividades, <b>Organizando as ideias</b> e desafios, usando a Fábrica, o inspetor, os desafios e a empresa já configurados no momento certo. O passador de slides conduz tudo: avança dentro da ferramenta e, quando ela termina, passa para o próximo momento.</p>' +
        '<p class="note">As outras abas continuam livres para usar sozinhas. Habilidade da BNCC: <b>EF09MA06</b> (funções como relação de dependência unívoca entre duas variáveis e suas representações numérica, algébrica e gráfica).</p></div>' +
        '<div class="lesson-grid">' + LS.map((x, i) =>
          '<article class="lesson-card"><p class="lc-num">Aula ' + (i + 1) + '</p><h3>' + esc(x.title) + '</h3><p class="lc-sub">' + esc(x.sub) + '</p>' +
          '<p class="lc-meta">' + esc(x.book) + ' · ' + esc(x.dur) + ' · ' + x.moments.length + ' momentos</p>' +
          '<div class="lc-actions"><button class="btn" data-start="' + x.id + '">Começar</button><button class="btn btn-ghost" data-see="' + x.id + '">Ver roteiro</button></div></article>').join('') + '</div>';
      side.innerHTML = '<div class="card"><h2>Como usar</h2><ol class="howto"><li>Escolha a aula e toque em <b>Começar</b>.</li><li>Use <kbd>→</kbd>, <kbd>Espaço</kbd> ou o passador de slides para avançar.</li><li>A barra da aula mostra o momento e o que fazer, em qualquer aba.</li><li>Pode sair da sequência e usar qualquer aba; <b>Voltar à aula</b> retoma de onde parou.</li></ol></div>';
      return;
    }
    const mo = moment();
    if (!mo) {
      const i = LS.indexOf(l);
      main.innerHTML = '<div class="slide done-slide"><p class="eyebrow">Aula ' + (i + 1) + ' concluída</p><h2>' + esc(l.title) + '</h2><ul class="goals">' + l.goals.map((g) => '<li>' + esc(g) + '</li>').join('') + '</ul>' +
        '<div class="lc-actions">' + (LS[i + 1] ? '<button class="btn" data-start="' + LS[i + 1].id + '">Próxima aula: ' + esc(LS[i + 1].title) + '</button>' : '') +
        '<button class="btn btn-ghost" data-restart="1">Rever esta aula</button><button class="btn btn-ghost" data-stop="1">Voltar à lista</button></div></div>';
    } else if (mo.kind === 'slide') {
      const steps = mo.steps || [];
      main.innerHTML = '<div class="slide"><p class="eyebrow">' + esc(mo.kicker || '') + '</p><h2>' + rich(mo.title, 30) + '</h2>' +
        (mo.body ? '<div class="slide-body">' + rich(mo.body, 30) + '</div>' : '') +
        (steps.length ? '<ol class="reveal">' + steps.map((s, k) => '<li class="' + (k < FF.state.ls ? 'shown' : 'hid') + (k === FF.state.ls - 1 ? ' last' : '') + '">' + rich(s, 30) + '</li>').join('') + '</ol>' : '') +
        (steps.length && FF.state.ls < steps.length ? '<p class="slide-more">Avance para revelar (' + FF.state.ls + '/' + steps.length + ')</p>' : '') +
        (mo.note ? '<details class="tnote"><summary>Para o professor</summary><p>' + esc(mo.note) + '</p></details>' : '') + '</div>';
      // o item que acabou de aparecer nunca fica abaixo da tela (projetor com pouca altura)
      const last = main.querySelector('.reveal li.last');
      if (last) last.scrollIntoView({ block: 'nearest' });
    } else {
      main.innerHTML = '<div class="slide"><p class="eyebrow">' + KIND_NAME[mo.kind] + '</p><h2>' + esc(mo.title) + '</h2><p>' + rich(mo.prompt || '', 24) + '</p><button class="btn" data-back="1">Abrir este momento</button></div>';
    }
    side.innerHTML = '<div class="card"><p class="eyebrow">Aula ' + (LS.indexOf(l) + 1) + ' · ' + esc(l.book) + '</p><h2>' + esc(l.title) + '</h2>' + outline(l, true) +
      '<div class="lc-actions"><button class="btn btn-ghost" data-print="1">Imprimir roteiro</button><button class="btn btn-ghost" data-stop="1">Sair da aula</button></div></div>';
    printSheet(l);
  }

  /* Roteiro para imprimir: objetivos, momentos, respostas e notas. */
  function printSheet(l) {
    $('aula-print').innerHTML = '<h1>Aula ' + (LS.indexOf(l) + 1) + ': ' + esc(l.title) + '</h1><p>' + esc(l.sub) + ' · ' + esc(l.book) + ' · ' + esc(l.dur) + '</p>' +
      '<h2>Objetivos</h2><ul>' + l.goals.map((g) => '<li>' + esc(g) + '</li>').join('') + '</ul><h2>Roteiro</h2><ol>' +
      l.moments.map((m) => '<li><b>' + KIND_NAME[m.kind] + ': ' + esc(m.title || '') + '</b>' + (m.kicker ? ' <i>(' + esc(m.kicker) + ')</i>' : '') +
        (m.prompt ? '<p>' + rich(m.prompt, 16) + '</p>' : '') + (m.body ? '<div>' + rich(m.body, 16) + '</div>' : '') +
        (m.steps ? '<ul>' + m.steps.map((s) => '<li>' + rich(s, 16) + '</li>').join('') + '</ul>' : '') +
        (m.note ? '<p class="pn">Nota: ' + esc(m.note) + '</p>' : '') + '</li>').join('') + '</ol>';
  }
  function seeOutline(id) {
    const l = LS.find((x) => x.id === id);
    $('aula-side').innerHTML = '<div class="card"><p class="eyebrow">Roteiro · ' + esc(l.book) + '</p><h2>' + esc(l.title) + '</h2><ul class="goals">' + l.goals.map((g) => '<li>' + esc(g) + '</li>').join('') + '</ul>' + outline(l, false) +
      '<div class="lc-actions"><button class="btn" data-start="' + l.id + '">Começar</button><button class="btn btn-ghost" data-print-id="' + l.id + '">Imprimir roteiro</button></div></div>';
    if (FF.ui) FF.ui.openDrawer(true);
  }
  function doPrint() {
    document.body.classList.add('print-aula');
    const done = () => { document.body.classList.remove('print-aula'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }

  function bind() {
    const click = (e) => {
      const t = e.target.closest('[data-start],[data-see],[data-go],[data-stop],[data-restart],[data-back],[data-print],[data-print-id],[data-m]');
      if (!t) return;
      const d = t.dataset;
      if (d.start) start(d.start, 0);
      else if (d.see) seeOutline(d.see);
      else if (d.go != null) { if (lesson()) goMoment(Number(d.go)); else start(t.closest('.card').querySelector('[data-start]').dataset.start, Number(d.go)); }
      else if (d.m != null) goMoment(Number(d.m));
      else if (d.stop) stop();
      else if (d.restart) start(lesson().id, 0);
      else if (d.back) enter();
      else if (d.print) doPrint();
      else if (d.printId) { printSheet(LS.find((x) => x.id === d.printId)); doPrint(); }
    };
    $('aula-main').addEventListener('click', click);
    $('aula-side').addEventListener('click', click);
    $('lb-dots').addEventListener('click', click);
    $('lb-next').addEventListener('click', next);
    $('lb-prev').addEventListener('click', prev);
    // Voltar à aula: só troca para a aba do momento, sem mexer no que está nela
    $('lb-back').addEventListener('click', () => { const mo = moment(); FF.set({ view: mo ? TOOL_VIEW[mo.kind] : 'aula' }); renderBar(); });
    // No modo projetor o roteiro fica na gaveta: abre a gaveta junto
    $('lb-outline').addEventListener('click', () => { FF.set({ view: 'aula' }); if (FF.ui) FF.ui.openDrawer(true); });
    $('lb-stop').addEventListener('click', stop);
    FF.on((changed) => { if (changed.includes('view') || changed.includes('lesson')) render(); });
  }

  FF.aula = {
    init() { bind(); render(); },
    render,
    renderBar,
    inControl,
    next, prev,
    first() { if (moment() && moment().kind === 'slide') { FF.set({ ls: 0 }); render(); } },
    active() { return !!lesson(); },
    atEnd: atEndOfLesson,
  };
})();
