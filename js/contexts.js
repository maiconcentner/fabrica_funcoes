/* Situações do capítulo 8 ("Uma variável pode mudar tudo") e leis prontas. */
(function () {
  'use strict';
  const FF = window.FF;

  /* Cada situação vira uma fábrica: o que entra, o que sai, a lei e as perguntas do livro.
     dir 'fwd' = dar a entrada e achar a saída; 'rev' = dar a saída e achar a entrada (máquina ao contrário). */
  FF.CONTEXTS = [
    {
      id: 'livre', name: 'Sem contexto', icon: '', vin: 'x', vout: 'f(x)',
      inName: 'x', outName: 'f(x)', law: '2x + 1', dom: 'R', cd: 'R',
      inputs: [-2, -1, 0, 1, 2, 3],
    },
    {
      id: 'luz', name: 'Conta de luz', icon: '⚡', book: 'Atividade 1',
      story: 'A tarifa de energia é de <b>R$ 0,66 por kWh</b>, mais uma taxa fixa de iluminação pública (Cosip) de <b>R$ 9,66</b>.',
      vin: 'x', vout: 'P', inName: 'consumo', inUnit: 'kWh', outName: 'valor da conta', outUnit: 'R$', money: true,
      law: '9,66 + 0,66x', dom: 'R+', cd: 'R', inputs: [254, 269, 237, 275, 229, 261],
      questions: [
        { q: 'Quanto paga quem consumiu 236 kWh?', dir: 'fwd', v: 236 },
        { q: 'Quantos kWh gastou quem pagou R$ 135,06?', dir: 'rev', v: 135.06 },
      ],
    },
    {
      id: 'agua', name: 'Conta de água', icon: '💧', book: 'Atividade 2',
      story: 'Tarifa da água por faixas de consumo (São Paulo, 2024): até 10 m³ paga o mínimo de <b>R$ 38,34</b>; de 11 a 20 m³, <b>R$ 6,01</b> por m³ a mais; de 21 a 50 m³, <b>R$ 14,98</b> por m³; acima de 50 m³, <b>R$ 16,50</b> por m³.',
      vin: 'x', vout: 'P', inName: 'consumo', inUnit: 'm³', outName: 'valor da água', outUnit: 'R$', money: true,
      law: {
        kind: 'piece',
        pieces: [
          { lo: 0, hi: 10, src: '38,34', label: '0 a 10 m³ (mínimo)' },
          { lo: 10, hi: 20, src: '38,34 + 6,01(x − 10)', label: '11 a 20 m³' },
          { lo: 20, hi: 50, src: '38,34 + 6,01 · 10 + 14,98(x − 20)', label: '21 a 50 m³' },
          { lo: 50, hi: null, src: '38,34 + 6,01 · 10 + 14,98 · 30 + 16,50(x − 50)', label: 'acima de 50 m³' },
        ],
      },
      dom: 'R+', cd: 'R', inputs: [15, 20, 25, 30, 35, 8],
      questions: [
        { q: 'Quanto paga quem usou 15 m³?', dir: 'fwd', v: 15 },
        { q: 'E quem usou 25 m³?', dir: 'fwd', v: 25 },
      ],
    },
    {
      id: 'viagem', name: 'Viagem de carro', icon: '🚗', book: 'Atividade 3',
      story: 'Felipe viaja a velocidade constante: o carro percorre <b>80 km a cada hora</b>.',
      vin: 't', vout: 'd', inName: 'tempo', inUnit: 'h', outName: 'distância', outUnit: 'km',
      law: '80t', dom: 'R+', cd: 'R', inputs: [0.5, 1, 1.5, 2, 2.5, 3],
      questions: [
        { q: 'Que distância ele percorre em 6 horas?', dir: 'fwd', v: 6 },
        { q: 'Quanto tempo leva para percorrer 640 km?', dir: 'rev', v: 640 },
      ],
    },
    {
      id: 'jardim', name: 'Cerca do jardim', icon: '🌷', book: 'Atividade 4',
      story: 'Um jardineiro tem <b>40 m de tela</b> para cercar um jardim retangular. Escolhido o comprimento, a largura fica determinada.',
      vin: 'c', vout: 'L', inName: 'comprimento', inUnit: 'm', outName: 'largura', outUnit: 'm',
      law: '(40 − 2c)/2', dom: '(0;20)', cd: 'R', inputs: [1, 2, 3, 4, 5, 6, 7, 8],
      questions: [
        { q: 'Se o comprimento for 12 m, qual é a largura?', dir: 'fwd', v: 12 },
        { q: 'Para a largura ser 5 m, qual deve ser o comprimento?', dir: 'rev', v: 5 },
      ],
    },
    {
      id: 'telefone', name: 'Plano de telefone', icon: '📱', book: 'Atividade 5',
      story: 'O plano custa <b>R$ 60,00</b> por mês com 300 minutos; cada minuto <b>além dos 300</b> custa <b>R$ 0,15</b>. A entrada é o número de minutos excedentes.',
      vin: 'x', vout: 'y', inName: 'minutos excedentes', inUnit: 'min', outName: 'valor da fatura', outUnit: 'R$', money: true,
      law: '60 + 0,15x', dom: 'R+', cd: 'R', inputs: [0, 20, 50, 100, 120, 200],
      questions: [
        { q: 'Quem usou 350 minutos (50 além do pacote) paga quanto?', dir: 'fwd', v: 50 },
        { q: 'A fatura veio R$ 78,00. Quantos minutos passaram do pacote?', dir: 'rev', v: 78 },
      ],
    },
    {
      id: 'tecnico', name: 'Visita técnica', icon: '🔧', book: 'Atividade 6',
      story: 'Uma prestadora cobra <b>R$ 50,00</b> pela visita e mais <b>R$ 30,00 por hora</b> de serviço.',
      vin: 'h', vout: 'P', inName: 'tempo de serviço', inUnit: 'h', outName: 'valor a pagar', outUnit: 'R$', money: true,
      law: '50 + 30h', dom: 'R+', cd: 'R', inputs: [1, 2, 2.5, 3, 4],
      questions: [
        { q: 'Quanto custa um serviço de 2 horas?', dir: 'fwd', v: 2 },
        { q: 'E um de 2 horas e 30 minutos?', dir: 'fwd', v: 2.5 },
        { q: 'O cliente pagou R$ 140,00. Quanto tempo durou?', dir: 'rev', v: 140 },
      ],
    },
    {
      id: 'app', name: 'Aplicativo de viagem', icon: '🚕', book: 'Atividade 7',
      story: 'O aplicativo cobra uma taxa fixa de <b>R$ 5,00</b> mais <b>R$ 1,55 por quilômetro</b> rodado.',
      vin: 'x', vout: 'P', inName: 'distância', inUnit: 'km', outName: 'valor da corrida', outUnit: 'R$', money: true,
      law: '5 + 1,55x', dom: 'R+', cd: 'R', inputs: [10, 12, 14, 16, 18, 20],
      questions: [
        { q: 'Quanto custa uma viagem de 8 km?', dir: 'fwd', v: 8 },
        { q: 'A corrida custou R$ 27,50. Quantos km?', dir: 'rev', v: 27.5 },
      ],
    },
    {
      id: 'salario', name: 'Salário com comissão', icon: '👟', book: 'Atividade 8',
      story: 'Na loja de calçados de Marcelo, o salário é <b>R$ 1 500,00</b> fixos mais <b>R$ 15,00 por venda</b>.',
      vin: 'x', vout: 'S', inName: 'vendas', inUnit: 'vendas', outName: 'salário', outUnit: 'R$', money: true,
      law: '1 500 + 15x', dom: 'N', cd: 'R', inputs: [0, 10, 20, 30, 45, 64],
      questions: [
        { q: 'Qual o salário de quem fez 45 vendas?', dir: 'fwd', v: 45 },
        { q: 'Recebeu R$ 2 460,00. Quantas vendas fez?', dir: 'rev', v: 2460 },
      ],
    },
    {
      id: 'aviao', name: 'Decolagem do avião', icon: '✈️', book: 'Atividade 10',
      story: 'Um avião voa em linha reta: <b>600 km a cada hora</b>.',
      vin: 't', vout: 'd', inName: 'tempo', inUnit: 'h', outName: 'distância', outUnit: 'km',
      law: '600t', dom: 'R+', cd: 'R', inputs: [1, 2, 3, 4, 5],
      questions: [
        { q: 'Que distância terá percorrido após 8 horas?', dir: 'fwd', v: 8 },
      ],
    },
  ];

  /* Leis prontas (sem contexto), tiradas do capítulo. */
  FF.PRESETS = [
    { group: 'Função', title: 'y = x − 2', law: 'x − 2', dom: '{2;3;4;5}', cd: '{0;1;2;3;4}', desc: 'A = {2, 3, 4, 5} e B = {0, 1, 2, 3, 4}' },
    { group: 'Atividade 9', title: 'o triplo', law: '3x' },
    { group: 'Atividade 9', title: 'a metade', law: 'x/2' },
    { group: 'Atividade 9', title: 'o quadrado', law: 'x²', inputs: [-3, -2, -1, 0, 1, 2, 3] },
    { group: 'Atividade 9', title: 'dobro + terça parte', law: '2x + x/3', inputs: [0, 3, 6, 9, 1] },
    { group: 'Atividade 11', title: 'x² + 2x', law: 'x² + 2x', dom: '{2;1;0;-1;-2}' },
    { group: 'Atividade 12', title: '2x − 0,5', law: '2x − 0,5', inputs: [5, 10, -2, 0] },
    { group: 'Domínio', title: '1/x', law: '1/x', inputs: [-2, -1, 0, 1, 2, 4], desc: 'o 0 é rejeitado' },
    { group: 'Atividade 13', title: '(5x + 4)/(2x − 2)', law: '(5x + 4)/(2x − 2)', inputs: [-1, 0, 1, 2, 3] },
    { group: 'Atividade 13', title: '3x/(x² − 16)', law: '3x/(x² − 16)', inputs: [-4, 0, 2, 4, 5] },
    { group: 'Atividade 13', title: '√(x − 5)', law: '√(x − 5)', inputs: [0, 4, 5, 6, 9, 14] },
    { group: 'Atividade 13', title: '√(x + 10)', law: '√(x + 10)', inputs: [-11, -10, -6, -1, 6] },
    {
      group: 'Atividade 16', title: 'x³ + 2', law: 'x³ + 2', inputs: [-1, 0, 1, 2, 3],
      questions: [
        { q: 'A imagem é 3. Qual é o x?', dir: 'rev', v: 3 },
        { q: 'A imagem é 10. Qual é o x?', dir: 'rev', v: 10 },
        { q: 'A imagem é 29. Qual é o x?', dir: 'rev', v: 29 },
        { q: 'A imagem é 66. Qual é o x?', dir: 'rev', v: 66 },
      ],
    },
  ];

  FF.ctx = function (id) {
    return FF.CONTEXTS.find((c) => c.id === (id || FF.state.ctx)) || FF.CONTEXTS[0];
  };
})();
