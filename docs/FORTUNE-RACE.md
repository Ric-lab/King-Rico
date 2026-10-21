# Fortune Race — primeira versão

Pedido do autor: um jogo contemplativo, com uma aposta na bolinha antes da largada e uma corrida bonita para acompanhar e torcer. Público 40+: sem swipe, mira ou comandos durante a corrida. Claw Machine e Bounce permanecem preservados e com desenvolvimento pausado.

Cinco bolinhas representam King Rico, Happeach, Nick Neck, Diamante e Crazy Clown. Cada uma tem cor e número; a escolhida também ganha aro e rótulo SUA. A pista contínua tem curvas, bancos suaves, bordas douradas, pórticos, barreira de largada, bandeira quadriculada e iluminação de circo. A câmera acompanha o grupo e a bolinha escolhida automaticamente. O jogo reutiliza cabeçalho, aposta, botão e menu do projeto. A cena usa Three.js local; objetos repetidos usam instanciação e a resolução se adapta a quadros lentos.

## Matemática e animação

Uma corrida contém cinco participantes com chance igual de vitória. O aplicativo sorteia uma semente de 16 bits com Web Crypto (descarta 65.535 para evitar viés entre cinco participantes) depois de o jogador confirmar a aposta. O vencedor é `seed % 5`: as 65.535 sementes válidas contêm exatamente 13.107 vitórias para cada participante. A vitória retorna 4,8× a aposta, incluindo a aposta; a derrota perde a aposta. O retorno teórico é 96% sob o sorteio uniforme do aplicativo, sem garantia para uma sessão individual.

`cloud/race.cjs` é compartilhado entre animação e saldo. Cada bolinha tem um tempo de chegada determinístico; progresso monotônico e modulações suaves produzem mudanças reais de posição. O vencedor chega primeiro pelo trajeto: a cena não troca o resultado nem teletransporta uma peça no final. Após a chegada, os empates de progresso em 100% são ordenados pelo tempo de chegada, não pelo número da bolinha. Os testes conferem monotonicidade, cobertura de sementes e vencedor visível. São trajetórias animadas e rolamento em contato com a pista, sem alegação de uma simulação física de colisões entre bolinhas. Não há intervenção do jogador após a largada.

A apresentação dura cerca de 20 segundos, mais a contagem de largada. O tempo usa segundos ativos, sem limitar o avanço a um quadro de 100 ms: aparelhos lentos não recebem uma corrida artificialmente mais longa. Menu e aba oculta pausam esse tempo. Som e vibração obedecem ao menu compartilhado. Redução de movimento mantém a corrida legível e reduz os deslocamentos da câmera, sem acelerar a aposta ou alterar o resultado.

## Persistência e limites

A aposta e seu resultado são confirmados numa transação Firestore com UUID único, antes da animação. A operação privada é imutável. Repetir o mesmo UUID devolve o resultado salvo; mudar o conteúdo desse UUID é rejeitado. Regras verificam aposta, participante, semente, vencedor, multiplicador e alterações exatas do saldo. O saldo visível só revela o crédito na tela de resultado. Não existe outro crédito ao fechar o modal.

O aparelho guarda apenas ID e progresso de apresentação em `kingRico.race.<uid>`. Atualizar retoma a semente e a posição da corrida salva; esse armazenamento nunca importa moedas. O login Google, saldo e recarga abaixo de 1 moeda continuam compartilhados. A publicação usa o workflow existente, incluindo o publicador REST de regras. Não há Cloud Functions nem necessidade de Blaze.

Como na arquitetura Spark dos demais jogos, a semente é informada pelo navegador. As regras validam sua consistência e a contabilidade, mas não provam que o cliente usou um sorteio honesto. Trata-se da economia de moedas virtuais do projeto; não é uma implementação de apostas em dinheiro ou de resultados sorteados por um servidor confiável.

## Validação

- `tests/race-camera.test.mjs`: relevo com subidas e descidas, enquadramento de todas as escolhas em telas retrato e movimento reduzido.
- `tests/race.test.cjs`: igualdade entre participantes, valores em centavos, trajetórias contínuas e chegada correta.
- `tests/store.test.mjs`: débito/crédito único, tentativas simultâneas, outra sessão, derrota e entradas inválidas.
- `tests/integration.mjs`: regras reais, replay, privacidade, imutabilidade e rejeição de vencedor/prêmio falsificados; inclui regressões dos outros jogos.
- `tests/race_browser.py`: Home, identidade Google emulada, seleção, controles bloqueados na corrida, pausa, atualização, vitória/derrota, resultado visível, duas abas, replay e retorno ao saldo da Home.
- Build de produção depois da integração e confirmação do workflow e dos arquivos no site oficial.

É uma primeira direção jogável para avaliação do autor. Verificações funcionais não significam aprovação estética ou validação com o público 40+.

## Revisão de ritmo, pista, câmera e cinco participantes

Após o autor pedir refinamento nas três frentes e especificar pista maior, bolas mais rápidas, número ímpar e câmera acompanhando o relevo, o percurso passou de 46 para 96 unidades, com pista mais larga, subidas, descidas e cinco bolinhas. A duração permanece próxima de 20 segundos de corrida, portanto a velocidade média pelo percurso mais que dobra. Variações contínuas e monotônicas de ritmo produzem mais mudanças de liderança sem trocar o vencedor salvo. Uma modulação comum reduz o ritmo em trechos ascendentes e aumenta em descidas; a apresentação continua sendo animada, sem alegar dinâmica física de colisões.

A câmera segue pontos da pista à frente e atrás do grupo, interpolando posição e alvo para acompanhar a altura e inclinação. A preferência de movimento reduzido reduz as rotações laterais. Durante a corrida, o painel de seleção e aposta dá lugar à identificação da bolinha, posição e resumo da aposta; a área 3D ganha 185 pixels na tela de referência. As bolinhas usam acabamento marmorizado em vez dos aros dourados externos da primeira versão.

O resultado novo tem `version: 2`. Regras, cliente e engine continuam aceitando resultados antigos sem versão como quatro participantes, chance de 1 em 4 e retorno de 3,8×. Eles não são reinterpretados como apostas novas. A quinta bolinha tem a mesma chance das outras nas corridas novas: 1 em 5, retorno de 4,8×. Testes conferem cobertura uniforme das sementes, precisão da aposta em centavos, resultado imutável, compatibilidade com operações antigas e retomada no navegador.
