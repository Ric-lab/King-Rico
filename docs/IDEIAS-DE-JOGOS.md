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

### 1ª rodada de caminhos (referência inicial)

| Caminho | Referência | Como funciona | Custo de arte | Observação do dono (27/11) |
| --- | --- | --- | --- | --- |
| **1. Turnê Mundial do Circo** | *Coin Master* + *Royal Match* | Bolinha lateral (`0/5`) ergue 5 peças no fundo e viaja trocando o cenário `941×1672`. | Médio-baixo | **Boa ideia, mas pouco impacto visual real:** gabinete, botões e King Rico na nuvem já cobrem quase toda a tela, escondendo o fundo. |
| **2. Reforma do Grande Parque** | *Royal Match* / *Homescapes* | Pátio dedicado dividido em alas com escolha entre 2 estilos por peça. | Médio-alto | Exige tela paralela pesada em recortes. |
| **3. Galeria de Cartazes & Troféus** | Galeria de arte | Mural de pôsteres circenses restaurados em 4 etapas. | Baixo | **Gostou pela praticidade**, mas pediu mais opções para comparar. |

### 2ª rodada — tentativa descartada pelo dono em 27/11 ("não é isso...")

Opções exploradas e **rejeitadas** (não implementar): **4. Skins de máquina/nuvem**, **5. Máquina de garra de pelúcias**, **6. Álbum de figurinhas** e **7. Globos de neve**. Motivo do descarte na análise conjunta: soam como lojinha cosmética ou gacha paralelo, sem dar sensação real de **jornada / sair do lugar**.

### Restrições definidas pelo dono (27/11)

1. **Subir de nível pagando a própria moeda do jogo:** juntou o valor da meta → paga moedas para subir de nível, ficando progressivamente mais caro/difícil.
2. **Sem segunda moeda:** zero estrelas, gemas ou fichas paralelas.
3. **Precisa compensar gastar as moedas da slot nisso:** não pode ser só enfeite que empobrece a banca.
4. **Mudar sem perder a identidade visual (público 40+/avó) e sem trabalho pesado de arte:** os símbolos dos rolos (*Ingresso, Tenda, Capa, Moeda, Diamante, Coroa*) e o *King Rico* **não podem sumir nem virar outros objetos** ("cadê o ingresso?").
5. **Sem decoração repetitiva estilo *Royal Match*:** criar dezenas de salas/cenários dá trabalho demais e perde a graça depois do 5º cenário.

### 3ª rodada — tentativa descartada pelo dono em 27/11 ("muito complicado e muito necessário")

Opção explorada e **rejeitada** (não implementar): **Níveis de Patamar & Ligas** (subir nível escalando vídeo/raspadinha/aposta e trancando escudos/minigames em marcos). Motivo do descarte pelo dono: **complicado demais e obrigatório demais** — trancar coisas ou alterar economia cria peso num jogo que já tem muitas peças (`roleta, escudo, dado, raspadinha, spin, big win, good luck, controle`).

### Ideia formulada pelo dono (27/11 — aguardando aprovação para prototipar)

1. **Bolinha lateral direita (abaixo do `+1.000`):** abre a tela opcional de **Quebra-Cabeça**.
   - Se a avó nunca tocar nessa bolinha, o jogo segue **100% idêntico** (puro cosmético/"frufruzinho", sem alterar jogabilidade nem RTP).
2. **Comprar pacotes/peças com moedas do jogo:**
   - Começa com **9 peças (`3×3`)**, e nos próximos quebra-cabeças sobem tanto o **preço** quanto a **quantidade de peças** (`12` = `3×4`, `16` = `4×4`, `20` = `4×5`...).
   - **Recomendação de design:** sem peças repetidas (sorteia sempre posições inéditas vazias, garantindo surpresa visual sem frustrar quem pagou moedas) e encaixe com ímã forte + som/vibração seca (`CLAC!`).
3. **Recompensa ao completar (`100%`):** libera uma **Skin Temática** correspondente à imagem do quebra-cabeça (ex.: *Egito, Praia, Neve, Noite de Gala*), trocando **apenas o background (`941×1672`) e as cores dos botões** (se o jogador quiser equipar). **King Rico na nuvem e gabinete da máquina não mudam.**
4. **Por que NÃO é complexo em assets:**
   - **Zero recorte manual de peças:** o quebra-cabeça fatia **1 única imagem `.webp`** em código (máscara Canvas/SVG com curvas reais de quebra-cabeça, chanfro e sombra automáticos em qualquer grade `3×3`, `3×4`, `4×4`).
   - **Zero imagens novas de botões:** a troca de cores dos botões usa apenas variáveis CSS do tema. Custo total por tema novo = **1 única imagem `.webp` + 3 cores CSS**.
5. **Reorganização dos 6 símbolos de prêmio para ficarem universais em qualquer tema:**
   - Retirar **Ingresso** e **Tenda de Circo** (que prendiam o jogo a um único tema), descer os 4 atuais e incluir **Baú de Tesouro** e **Rosto do King Rico** no topo (fechando exatos **6 símbolos fixos**, sem alterar matemática/RTP `0,4×` a `10×`):
     `0,4× Capa` · `0,8× Moeda` · `1,2× Diamante` · `2,5× Coroa` · `5× Baú de Tesouro` · `10× Rosto do King Rico`.
   - Manter **os 6 símbolos sempre fixos** (em vez de variar os 2 menores por tema) preserva a memória visual imediata do público 40+/60+ e elimina retrabalho de símbolos a cada tema novo.

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
