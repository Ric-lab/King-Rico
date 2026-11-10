# Ideias de jogos — propostas do dono

Registro de direção, não descrição do que está implementado ou autorização de
publicação. Atualizado em 08/11/2026.

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
