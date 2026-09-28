# Fábrica de Funções

Material interativo para ensinar **funções** (Capítulo 8, "Uma variável pode mudar tudo", 9º ano) com uma metáfora de fábrica: **entra um produto** (o valor de *x*), **a máquina processa** (a lei de formação) e **sai o produto transformado** (a imagem *f*(*x*)). Feito para projetar em sala e para os alunos abrirem no celular.

Segue os mesmos princípios do projeto *Relações Métricas Dinâmicas*:

- **Nada começa sozinho**: cada movimento espera o clique em avançar (setas, espaço ou passador de slides). Voltar desfaz com animação.
- **Um movimento por clique**: o produto passa por uma engrenagem de cada vez.
- A mesma ideia em várias representações ao mesmo tempo, sempre sincronizadas.
- HTML, CSS e JavaScript puros, sem etapa de build; funciona sem internet.

## O que já existe (Fase 1: a Fábrica)

### A linha de produção
- **Depósito A (entrada)** com os valores para fabricar; **depósito B (saída)** recebe os resultados.
- Toque em um valor de A, digite um número na barra (**Entrar**) ou aperte **avançar** para pegar o próximo.
- **Engrenagens**: quando a variável aparece uma só vez, a lei vira uma fila de engrenagens (`× 0,66` → `+ 9,66`). O produto passa por uma de cada vez, a engrenagem gira e o valor muda de cor (entrada azul, no meio roxo, saída laranja). O cartão ao lado explica a conta: *"A engrenagem × 0,66 multiplica por 0,66: 236 · 0,66 = 155,76"*.
- **Toda lei digitada vira engrenagens.** Quando *x* aparece mais de uma vez (ex.: *x*² + 2*x*), uma **copiadora** faz cópias do produto, cada cópia passa pelas suas engrenagens (`□²` em cima, `× 2` embaixo) e uma **junção** (`□ + □`, `□ − □`, `□ × □`, `□ ÷ □`) une os resultados. Funciona também com frações como (5*x* + 4)/(2*x* − 2) (a junção `÷` trava quando a cópia de baixo chega valendo 0) e com várias copiadoras, como *x*(*x* + 1)(*x* + 2).
- **Trilhos**: com a copiadora, o produto anda por trilhos que atravessam o centro de cada engrenagem (o rótulo fica acima). Ele sobe da porta até a linha, entra na copiadora, as cópias descem e sobem pelos ramos, e na junção os ramos se fecham. Nada corta caminho na diagonal.
- **Resolução numérica ao lado**: ao entrar, o cartão mostra a lei com *x* trocado pelo valor (`f(3) = 3² + 2 · 3`); ao sair, confere pela lei, com números (`= 9 + 6 = 15`), para ligar as engrenagens à conta.
- **Tela de cálculo**: fica para a conta de água (por faixas) e para leis raras em que *x* está no expoente (como 2^*x*).
- **Tarifa por faixas** (conta de água): a máquina primeiro descobre em que faixa o consumo está e depois faz a conta daquela faixa.
- **Máquina ao contrário**: dada a saída, a esteira anda para trás e cada engrenagem **desfaz** a sua conta (`+ 9,66` vira `− 9,66`, `× 0,66` vira `÷ 0,66`, `□³` vira `∛□`). Em *x*², o `±√□` mostra que **duas entradas** podem dar a mesma saída. Resolve as perguntas do tipo "quanto consumiu quem pagou R$ 135,06?" e a Atividade 16.
- **Domínio**: valores fora do domínio são **barrados na porta**; divisão por zero ou raiz de negativo **travam a engrenagem** (luz vermelha) e mostram por que aquele *x* fica fora do domínio (Atividade 13, *"Domínio não dado"*).
- **Contradomínio**: com B finito, um resultado que não está em B **não cabe no depósito** (não é função de A em B).
- **Refugo**: todo valor que não dá para produzir fica guardado em vermelho, com o motivo (divisão por zero, raiz de número negativo, fora do domínio, resultado fora de B, "nenhum número ao quadrado dá negativo" na máquina ao contrário). Ele aparece na bandeja **REFUGO** embaixo da máquina, no depósito A (com ✗), na **tabela**, no **diagrama** (elemento de A sem flecha e a linha "Sem imagem") e no **gráfico** (linha vermelha tracejada: nenhum ponto nesse *x*). Voltar desfaz; **Limpar** esvazia; o link compartilhável leva o refugo junto.
- Mesma entrada de novo → mesmo resultado, com o aviso: *numa função, cada entrada tem uma única saída*.
- Botões **▶** (reproduz o produto até o fim), **Rever movimento**, **Fabricar todos** e **Limpar**.

### Três representações ao vivo
- **Tabela** com a coluna **cálculo** (`9,66 + 0,66 · 236`), como nos Recursos do livro.
- **Diagrama de flechas** de A para B, com **D**, **CD** e **Im** (e "Im ⊂ CD").
- **Gráfico** com os pares ordenados, linhas-guia do último ponto e, opcionalmente, a **curva** inteira (desligada quando o domínio é discreto, como no salário por vendas).
- Cada painel pode ser **ampliado** para projetar.

### Gamificação
- **Caixa-preta** (tecla `B`): esconde a lei e as engrenagens. A turma fabrica valores, olha as saídas e dá um **palpite**; o sistema diz quantos produtos o palpite acerta e reconhece leis equivalentes escritas de outro jeito (`1 + 3x` = `3x + 1`). Se o palpite acerta tudo o que foi fabricado mas não é a lei, avisa para fabricar outros valores.
- **Prever a saída** (tecla `O`): a máquina fica **fechada** (não dá para ver as engrenagens nem as contas), só a **lei no letreiro** continua à vista. O produto sai como **?** e só é revelado no clique seguinte, para a turma calcular e apostar antes. Depois da revelação, o cartão mostra a conferência pela lei.

### Situações do livro
Cada situação muda os nomes, as unidades, o ícone dos produtos, o domínio e traz as **perguntas do livro** prontas (para frente ▶ ou ao contrário ◀):

| Situação | Lei | Atividade |
|---|---|---|
| Conta de luz | *P* = 9,66 + 0,66*x* | 1 |
| Conta de água (faixas) | tarifa por faixas | 2 |
| Viagem de carro | *d* = 80*t* | 3 |
| Cerca do jardim | *L* = (40 − 2*c*)/2, 0 < *c* < 20 | 4 |
| Plano de telefone | *y* = 60 + 0,15*x* | 5 |
| Visita técnica | *P* = 50 + 30*h* | 6 |
| Aplicativo de viagem | *P* = 5 + 1,55*x* | 7 |
| Salário com comissão | *S* = 1 500 + 15*x* | 8 |
| Decolagem do avião | *d* = 600*t* | 10 |

Os números da lei podem ser trocados (ex.: a tarifa da sua cidade, como pede o *Territórios de aprendizagem*).

**Leis do livro** (sem contexto): *y* = *x* − 2 com A = {2, 3, 4, 5} e B = {0, 1, 2, 3, 4}; triplo, metade, quadrado, dobro + terça parte (Atividade 9); *x*² + 2*x* (11); 2*x* − 0,5 (12); 1/*x*, (5*x* + 4)/(2*x* − 2), 3*x*/(*x*² − 16), √(*x* − 5), √(*x* + 10) (13); *x*³ + 2 com as perguntas da Atividade 16.

### Montar a máquina
- Digite a lei (`2x + 1`, `x² − 4`, `(40 − 2c)/2`, `raiz(x − 5)`, `1 500 + 15x`): o esquema de engrenagens aparece sozinho. Ou use **Montar com engrenagens**: adicionar, trocar o número, mudar a ordem (e ver que `(3x − 4)²` ≠ `(3x)² − 4`) ou tirar engrenagens.
- **Domínio e contradomínio**: ℝ, *x* ≥ 0, naturais ou um conjunto {…}; B = ℝ ou um conjunto. Também dá para escolher os valores que aparecem no depósito A.

### Painel do professor (tecla `P`)
Casas decimais, tema claro/escuro, tamanho do texto, velocidade da animação e **link compartilhável** (leva situação, lei, conjuntos, o que está à mostra e os valores já fabricados).

### Atalhos
| Tecla | Ação |
|---|---|
| `→` `Espaço` `PageDown` | próximo passo (funciona com passador de slides) |
| `←` `PageUp` | passo anterior |
| `Home` | volta ao começo do produto |
| `V` | digitar um valor (`Enter` entra, `Shift+Enter` ao contrário) |
| `B` | caixa-preta |
| `O` | prever a saída |
| `T` / `D` / `G` | tabela / diagrama / gráfico |
| `F` | tela cheia |
| `P` | painel do professor |

## É função? (Fase 2: o inspetor de qualidade)

Aba **É função?** (tecla `2`; a Fábrica é a tecla `1`). Cada caso chega ao **posto de inspeção** e é conferido **um passo por clique**:

- **Diagramas**: *y* = *x* − 2 do *Organizando as ideias*, os quatro diagramas da **Atividade 15** e um elemento sem flecha. A lupa passa por cada elemento de A; as flechas dele acendem (verdes se é uma só, vermelhas se são duas ou nenhuma) e o posto anota `6 → 2 e 1 ✗ duas saídas`. No fim, o carimbo **APROVADO: é função** ou **REPROVADO: não é função** e, para funções, **D**, **CD** e **Im** (com os elementos de B que sobram: Im ⊂ CD).
- **Tabelas**: as notas da **Atividade 14** (Rafael e José com a mesma nota: pode!), a mesma tabela **ao contrário** (8,5 → Rafael e José: não pode), o avião (Atividade 10), *f*(*x*) = *x*² + 2*x* (Atividade 11), um aluno com dois esportes e uma linha repetida. **Trocar colunas** inverte qualquer tabela.
- **Gráficos**: o **teste da reta vertical**. A reta pode ser **arrastada** a qualquer momento e mostra quantos pontos corta; depois o inspetor **varre** o gráfico da esquerda para a direita pintando o eixo *x* (verde: 1 ponto; vermelho: 2 ou mais; cinza: nenhum, fora do domínio) e para num lugar onde a reta corta dois pontos. Casos: reta, parábola, circunferência, o **coração** do GeoGebra, parábola deitada, meia circunferência, elipse, módulo, reta vertical, cúbica e seno. Para funções, **domínio** (sombra no eixo *x*) e **imagem** (sombra no eixo *y*).
- **Votação da turma**: antes do veredito, a turma vota *é função* ou *não é função*; o veredito diz se acertou e o **placar** soma os acertos.
- **Sortear** cria diagramas e tabelas novos (com e sem função, com as pegadinhas: mesma imagem, função constante, elemento sem flecha, duas flechas).
- **Montar o meu**: o professor escreve os elementos de A e de B e liga as flechas tocando num elemento de A e depois num de B; depois inspeciona com a turma. O diagrama vai junto no link compartilhável.

## Plano das próximas fases

### Fase 3: Desafios (jogos para a turma)
- **Adivinhe a regra** com placar por equipes: a máquina sorteia uma lei (nível 1: `x + a`; nível 2: `ax + b`; nível 3: `x²`, `ax² + b`…), cada equipe pede um valor por vez e ganha mais pontos quem descobre a lei com menos pistas.
- **Máquina ao contrário** em ritmo de jogo: "que produto entrou?".
- **Corrida das engrenagens**: montar, com engrenagens, uma máquina que produza os pares dados.
- **Gerador de exercícios** a partir das situações (números novos a cada vez), com resolução passo a passo.
- Cronômetro e placar grandes, para projetar.

### Fase 4: Minha empresa e ferramentas de aula
- **Minha empresa** (*O que sei agora*): cada grupo monta a sua fábrica com funções de custo de produção, mão de obra (com horas extras e comissão), faturamento e crescimento; compara as retas no mesmo gráfico (quando o faturamento passa o custo).
- **Anotar na tela** (caneta, marca-texto, laser), **Copiar imagem** (para listas de exercícios), **cenários salvos** e **QR code** para a turma, trazidos do projeto de Relações Métricas.

## Como publicar (GitHub Pages, gratuito)

1. Junte este branch ao `main` (abra e aceite o pull request).
2. No GitHub, vá em **Settings → Pages** e em **Source** escolha **GitHub Actions**.
3. A cada envio para o `main`, o site é publicado automaticamente em
   `https://maiconcentner.github.io/fabrica_funcoes/`.

Para usar sem internet, basta abrir o `index.html` no navegador (as fontes são trocadas pelas do sistema).

## Estrutura

```
index.html          página única
css/style.css       visual (tema claro/escuro, responsivo)
js/expr.js          leitura da lei, cálculo passo a passo, engrenagens e inversas, conjuntos
js/math.js          desenho das expressões em SVG (frações, potências, raízes)
js/contexts.js      situações do capítulo e leis prontas
js/core.js          estado, lei atual, formatação, link, animação
js/factory.js       a fábrica: depósitos, máquina, esteira e os passos de cada produto
js/reps.js          tabela, diagrama de flechas e gráfico
js/inspect.js       É função?: diagramas, tabelas, gráficos e reta vertical
js/app.js           cartões laterais, caixa-preta, painel do professor, atalhos
```
