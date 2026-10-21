# Fortune Race

> **Guardado (21/out/2026):** fora da Home. Pendente ao retomar: bolas mais rápidas (subir velocidade: encurtar `times` em `games/race/script.mjs` ou alongar menos a pista), ajustar `tests/race_browser.py` para v4.

Corrida contemplativa de cinco bolinhas: King Rico, Happeach, Nick Neck, Diamante e Crazy Clown. Escolha uma, aposte moedas virtuais e acompanhe a largada e a chegada. Retorno de 4,8× incluindo a aposta. Login Google, saldo, recarga e menu são os compartilhados do King Rico.

## Pista de circo e aposta 1º e 2º (version 4)

Corrida coreografada, sem física no aparelho: abre na hora e roda leve. A semente (0–639) define o par: `seed%20` → 1º e 2º (`circusPair`); o resto da semente só varia a encenação (`games/race/script.mjs`): tempos de chegada fixos por posição (~21–23 s; total ~25 s), ultrapassagens por ondulação que zera na linha, arrancada do vencedor no fim. As laterais são resolvidas a cada quadro contra pinos, tambores, paredes e outras bolinhas, então elas se esbarram sem sobrepor.

Pista (`games/race/course.mjs`, 92 m): descida, floresta de pinos dourados, três tambores, rampa de salto, funil e chegada. Visual: piso de veludo vermelho, zebra vermelho/creme, trilho dourado com lâmpadas que acendem atrás do líder, noite roxa com luzes ao longe. Câmera baixa atrás da sua bolinha; chegada apertada vira câmera lenta lateral.

Apostas: VENCEDOR ×4,8 (1 em 5) e 1º E 2º na ordem ×19,2 (1 em 20); RTP 96%. Rodadas v1–v3 pendentes mostram o resultado direto.

## Dinâmica por gravidade (version 3)

`cloud/race-physics.cjs` usa cannon-es 0.20.0 já presente no lockfile. As esferas têm massa e começam com velocidade linear e angular zero. O mundo usa gravidade de 9,81, contato com atrito, restituição, colisões entre as bolinhas e laterais. Não recebe velocidade alvo, vencedor nem tempos de chegada. A pista de 96 unidades tem declive real superior a 20 unidades, curvas e variações de inclinação. O perfil desta versão mantém descida contínua para evitar bolinhas presas em vales. As bolinhas podem mudar de posição lateral, bater, perder velocidade e ultrapassar.

A porteira segura a apresentação em repouso durante a contagem. Sua abertura libera o tempo da simulação. O motor calcula a corrida em passos fixos de 1/120 s em um Web Worker; o Three.js interpola posições e orientações a 60 amostras/s. Isso mantém o cálculo fora da interface e desacopla o resultado do FPS. A gravação determinística também permite retomar a mesma corrida após atualizar, sem novo sorteio. A câmera acompanha a altura da pista e a posição real da bolinha escolhida. Menu e aba oculta pausam o relógio de apresentação.

Existem 32 pequenas variações auditadas das posições iniciais, com cinco permutações cíclicas das cores: 160 sementes equiprováveis. A permutação dá a cada personagem exatamente a mesma cobertura de vitórias e o mesmo corpo físico. O navegador sorteia um Uint16 com rejeição acima de 65439 antes de aplicar módulo 160. Não se altera nenhuma trajetória para produzir o resultado escolhido.

Como regras Firestore não executam um motor de física, `cloud/race-physics-winners.json` registra qual corpo cruzou primeiro em cada uma das 32 simulações. `node scripts/race-physics-audit.cjs` recalcula essa tabela e sua cópia nas regras. Os testes refazem todas as simulações independentemente e exigem concordância com a tabela. O worker do navegador executa a mesma simulação: a chegada visível precisa coincidir com a operação financeira salva. A tabela não fornece comandos ao motor físico.

## Saldo e compatibilidade

Aposta e resultado são confirmados em uma transação Firestore com UUID único antes da apresentação. Repetir o UUID retorna a operação privada imutável; não há segundo crédito ao fechar o resultado. Regras verificam versão, limites da semente, vencedor auditado, aposta, multiplicador e alterações exatas do saldo. O saldo visível aguarda a revelação da chegada para mostrar o prêmio.

O armazenamento local guarda somente ID e progresso da apresentação; nunca importa moedas. Operações sem versão continuam como quatro participantes e retorno 3,8×; `version:2` mantém cinco participantes, trajetória histórica e retorno 4,8×. Nenhuma rodada antiga é reinterpretada como física nova.

A economia segue a arquitetura Spark dos outros jogos: sementes vêm do cliente, portanto as regras garantem consistência e contabilidade, mas não provam um sorteio honesto contra cliente adulterado. Não usa dinheiro real, Cloud Functions nem Blaze. Publicação pelo workflow existente, preservando o publicador REST das regras.

## Verificação

- `tests/race-physics.test.cjs`: repouso inicial, aceleração, colisões, contenção, todas as chegadas, ausência de movimento sem gravidade, repetibilidade, cobertura uniforme e concordância com as regras.
- `tests/race-camera.test.mjs`: perfil e enquadramento retrato; `tests/race.test.cjs` preserva resultados históricos.
- `tests/integration.mjs`: regras reais, resultado físico auditado, replay, privacidade e rejeição de resultado falso; regressões dos outros jogos.
- `tests/race_browser.py`: Home, identidade Google emulada, aposta, física em worker, vitória/derrota, pausa, atualização, duas abas, replay, saldo da Home e rodada antiga.
- Build de produção após integração, workflow e conferência dos arquivos reais publicados.

É uma direção jogável para avaliação do autor. Testes funcionais não representam aprovação estética nem validação com o público 40+.
