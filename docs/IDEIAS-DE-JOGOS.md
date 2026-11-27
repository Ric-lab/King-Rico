# Ideias de jogos — propostas do dono

Registro de direção, não descrição do que está implementado ou autorização de
publicação. Atualizado em 27/11/2026.

## Destino para as moedas (meta-progressão) — proposta em aberto (27/11/2026)

Provocação do dono em 27/11: hoje o jogador apenas acumula moedas, sem um
objetivo tangível para gastá-las — diferente de *Royal Match* (reformar o
castelo), *Coin Master* / *Monopoly GO* (construir a vila e viajar trocando o
tema dos assets) ou jogos de montar uma galeria de arte. **Status: estudo de
game design aguardando escolha do dono; nada implementado nem autorizado para
código.**

### Diagnóstico no Fortune Circus

- Hoje as moedas só alteram o número do saldo e o valor da aposta; falta
  sensação de conquista permanente entre sessões.
- O roubo de moedas do **Tony Tiger** ganha muito mais peso emocional quando
  existe onde gastar: moeda guardada no saldo corre risco de patada, enquanto
  **moeda investida na obra fica protegida para sempre** (mesma tensão saudável
  do *Coin Master*, sem exigir multiplayer).
- **Diferença crítica para *Coin Master* e *Royal Match*:** naqueles jogos o
  giro/fase usa energia ou estrelas, não moedas; no Circus **as moedas são o
  próprio combustível do giro**. Gastar até a última moeda na construção não
  pode travar o jogador sem saldo para girar.

### 3 caminhos ancorados no universo do Circo

| Caminho | Referência | Como funciona | Custo de arte | Impacto na tela principal |
| --- | --- | --- | --- | --- |
| **1. Turnê Mundial do Circo (Recomendado)** | *Coin Master* + *Royal Match* | Bolinha lateral de obra (`0/5`). Com moedas, ergue 5 peças do circo atual (picadeiro, tenda, roda-gigante, luzes, balão do King). Ao fechar `5/5`, abre baú de inauguração e **viaja para a próxima parada temática**, trocando o fundo `941×1672` da própria slot (Jardim → Praia → Noite de Gala → Neve → Oásis). Permite reequipar cenários já conquistados. | **Médio-baixo e reaproveitável:** 1 cenário base `941×1672` + 4–5 camadas 2D por parada, visíveis o tempo todo atrás da máquina. | **Alto:** o jogador vê sua obra viva atrás dos rolos e sente a viagem temática. |
| **2. Reforma do Grande Parque King Rico** | *Royal Match* / *Homescapes* | Pátio dedicado dividido em alas (Entrada, Praça da Pipoca, Tenda Mágica, Camarim). Ao comprar cada peça com moedas, o jogador escolhe entre **2 cores/estilos** com um toque, personalizando o parque. | **Médio-alto:** pede tela própria de passeio + 2 variações visuais por peça. | **Médio:** fica numa tela paralela; o fundo da slot muda menos. |
| **3. Galeria de Cartazes & Troféus Mágicos** | Galeria de arte / Álbum vivo | Mural de pôsteres/dioramas circenses da trupe (King, Tony, Ray). Gastam-se moedas em 4 etapas por quadro (esboço → pintura → moldura dourada → quadro animado vivo). | **Baixo (escopo mínimo):** ilustrações 2D fechadas num modal/galeria, zero mexida no palco. | **Baixo-médio:** ótimo colecionável para 3ª idade, mas não transforma o cenário do jogo. |

### Regras de ouro para qualquer caminho escolhido

1. **Zero leitura para a 3ª idade:** acesso por **bolinha circular lateral**
   (mesma família visual do vídeo `+1.000`), com barra `2/5` e brilho quando há
   compra disponível; 1 toque recolhe a máquina (ou abre a cena), mostra **um
   botão grande com preço em moedas** e anima a peça entrando com fanfarra.
2. **Reserva segura de giro:** o botão de construir só sugere/habilita a compra
   mantendo uma reserva mínima para continuar girando (ex.: `500–1.000` moedas),
   ou exige apenas o excedente do saldo. Se a aposta permanecer variável (`1` a
   `10.000`), paradas avançadas mais caras dão **motivo real para subir a
   aposta**; se a aposta virar fixa (`100`, ideia `i-aposta-fixa`), os preços
   seguem progressão suave por parada.
3. **Economia e persistência blindadas:** compras de obra são gravadas no perfil
   Firestore (`cloud/` + `firestore.rules`) com `opId` idempotente. Se o baú de
   conclusão (`5/5`) der moedas, escudos ou roleta, entra na simulação para
   manter o retorno global < 100% (~90%); se der só inauguração cosmética +
   novo tema, **não altera o RTP da slot**.

## Os três vilões do King Rico — ideia do dono (08/11)

Proposta ainda sem implementação. Surgem como símbolos/eventos da slot e
roubam recursos distintos; frequência, gatilho exato e quantidades a definir.

| Vilão | Recurso | Personalidade visual |
| --- | --- | --- |
| Tony Tiger | Parte das moedas | Tigre expansivo, assusta o King e morde a placa do saldo |
| Tucker Toucan | Alguns Happeach | Tucano que pega o conteúdo da cesta durante o voo |
| Ray Raccon | Alguns ingressos | Guaxinim sorrateiro, máscara estilo Zorro e saco de roubo nas costas |

### Tony Tiger — proposta antiga substituída em 09/11

1. Sai da slot machine e cresce na frente da tela, apresentando o personagem.
2. Volta a ficar menor e chega pelo lado direito do King Rico, assustando-o.
3. King Rico corre e sai pela esquerda.
4. Tony vai para baixo do saldo, tira a placa do lugar e a morde três vezes,
   até o valor exibido desaparecer na encenação.
5. Tony sai andando pela esquerda.
6. King Rico cai de cima para baixo, voltando ao seu lugar na nuvem.

O dono descreveu o roubo como "um tanto do dinheiro". O valor financeiro e a
reapresentação do saldo restante precisam ser definidos; sumir a placa durante
a animação não define por si só que o saldo real deva zerar.

### Tucker Toucan — sequência pedida

Voa da esquerda para a direita, passa por cima da cesta de Happeach e leva
alguns deles consigo. Tornar visível o trajeto dos itens saindo da cesta.

### Ray Raccon — sequência pedida

Aparece sorrateiramente por trás do mostrador do prêmio da rodada, com o saco
nas costas. Passa pela frente do contador de ingressos, pega alguns e os leva.
Manter máscara e silhueta de guaxinim reconhecíveis.

### Recomendações do agente para avaliar, ainda não aprovadas como regras

- Comédia de desenho animado e assinaturas próprias: mordidas, voo e furtividade.
- Exibir a quantidade retirada e depois o total restante. Cada cena corresponde
  a uma perda única confirmada; as três mordidas são etapas visuais dela.
- Definir frequência e teto de perda para preservar a diversão. Evitar sobrepor
  uma cena de roubo à revelação/recebimento de outro prêmio.
- Considerar um meio simples de reagir ou recuperar depois, caso o dono queira;
  esse recurso não faz parte do pedido atual e não deve virar implementação.
- Antes de desenvolver: resolver o tratamento dos Happeach/apostas guardadas,
  simular a economia com os roubos e preservar idempotência e retomada. Nenhum
  roubo foi aplicado à carteira, ingressos ou progresso nesta anotação.

## Dinâmica contínua inspirada no Aviator

Atualização de 07/11: dono direcionou uma aplicação concreta para a celebração
de big win do Circus, sem botão de parar: avião diagonal, King Rico salta da
nuvem e vira piloto, multiplicador cresce com a subida. A prévia implementa
essa apresentação sobre o prêmio já confirmado, sem novo sorteio/pagamento.
A ideia de mecânica independente abaixo continua proposta, não implementada.

O dono quer uma referência mais explícita à dinâmica do Aviator: uma rodada
fluida, com movimento e multiplicador crescendo continuamente, e a decisão
simples de pegar o prêmio antes de a rodada terminar em perda. O Flying Clown
atual, com andares e ações separadas, não transmite essa continuidade.

- Mostrar crescimento e risco de forma clara; evitar degraus, pausas ou cliques
  para cada avanço. Uma ação principal de receber enquanto a rodada acontece.
- Integrar à dinâmica geral do King Rico, como já proposto pelo dono, sem
  acrescentar automaticamente mais um jogo separado ao parque. O encaixe exato
  ainda precisa ser definido; não substituir o Flying sem essa decisão.
- Preservar a identidade do circo e seus personagens; a referência aqui é de
  comportamento, sem decisão de copiar nome, logo ou assets do Aviator.
- Direção de catálogo já mencionada: no máximo quatro atrações além do Circus;
  Pênalti com swipe, Flying a adaptar para mira, Race Horse contemplativo e uma
  quarta atração a definir. Isso é intenção futura, não o catálogo publicado.
- Antes de implementar: definir entrada, crescimento, encerramento e pagamento;
  simular o conjunto e garantir recebimento/retomada idempotentes. Nesta anotação
  não foram alterados RTP, regras, moedas ou jogos existentes.

Arte do Tony Tiger em avaliação: [corpo e cabeça](TONY-TIGER.md). A animação antiga acima foi substituída pela decisão de 09/11 descrita abaixo.

### Tony Tiger — decisão atual (09/11)
O dono substituiu a encenação de morder a placa por três patadas na tela,
marcas de garra, balanço e três quedas visíveis no saldo. Trinca exclusiva,
linha/círculos vermelhos e modal do total. Implementado apenas na prévia v4;
ver PARQUE.md e ECONOMIA.md. Corpo/cabeça escolhidos são os de 866e780.

### Ray Raccoon — primeira demonstração (09/11)
Arte com máscara tipo Zorro e cena curta de pegar ingresso/fugir à esquerda
feitas somente para avaliar na prévia, sem sorteio natural ou economia real.
Detalhes e próximos ajustes em [RAY-RACCOON.md](RAY-RACCOON.md).
