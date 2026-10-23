# Fortune 33 e Fortune Flying Clown

Ambos abrem pela Home e usam o mesmo login Google, sessão, saldo em centavos e menu dos demais jogos. Não importam o saldo do protótipo 21 nem de outros dados antigos do aparelho. Firebase continua no Spark: Auth, Firestore e Hosting, sem Cloud Functions.

## Fortune 33

Fortune 33 substitui o 21 na Home. Cartas numeradas de 1 a 13 valem exatamente o número impresso; 1 vale apenas 1. Objetivo: ficar mais perto de 33 que a banca, sem ultrapassar. Nas novas mãos, a banca compara sua pontuação com a do jogador: compra enquanto está atrás, para quando está à frente e, em empate, compra até 26 ou preserva o empate a partir de 27. Assim, pode parar abaixo de 27 ou comprar acima de 27. Novas mãos pagam 2,08× na vitória incluindo a aposta; mãos antigas já abertas conservam 2×; empate devolve a aposta. Fazer 33 passa a vez à banca, com o mesmo pagamento normal. Não há bônus de duas cartas: duas cartas somam no máximo 26.

Cada número mantém o asset escolhido pelo autor. O botão de interrogação foi removido; as regras continuam disponíveis pelo menu. `cloud/thirty-three.cjs` implementa a regra; `target:33` é salvo e imutável durante a mão. O baralho de 52 cartas contém quatro cópias de cada número e é preparado uma vez na abertura. Na versão 2 da distribuição, um sorteio seleciona vitória, empate ou derrota para a política de referência de pedir abaixo de 28; o motor prepara um baralho legal compatível. As decisões do jogador continuam podendo mudar esse resultado. O baralho inteiro fica imutável durante a mão. Débito, cartas, turnos, resultado e crédito continuam atômicos, verificáveis pelas regras Firestore e protegidos contra repetição.

Os nomes internos `twentyOne`, `twentyOneRound` e o diretório `games/fortune21` permanecem por compatibilidade. Mãos antigas sem `target:33` terminam com a matemática original do 21, sem alterar baralho, aposta ou prêmio; a interface identifica a mão anterior. Toda nova mão iniciada pela nova interface usa 33. Clientes antigos ainda abertos continuam compatíveis, sem converter uma mão no meio. O endereço antigo redireciona para `Fortune 33.dc.html`.

A versão `dealVersion:2` usa distribuição dirigida e banca adaptável. A política de referência recebe 98% por construção: 8% de empates e probabilidade de vitória `(0,98 − 0,08) / 2,08`. Há no máximo 128 tentativas de preparar o baralho, com alternativa determinística legal para geradores degenerados. Isso não obriga o jogador a ganhar: pedir além do necessário pode estourar; parar cedo também muda o duelo. Não há consulta a saldo ou histórico para escolher cartas.

Mãos já abertas sem `dealVersion:2` conservam a banca antiga em 27 e seu fator de pagamento salvo. O novo campo é imutável e as regras Firestore verificam os turnos, a preservação do baralho e a decisão da banca. Ver `docs/ECONOMIA.md` para os limites do RTP de referência.

## Flying Clown

Mantém a arte, os dez balões, a subida, o susto/queda, a aterrissagem, o esticão e os botões PEGAR/SUBIR do export. `cloud/engine.cjs` mantém os multiplicadores 1,2 → 20 e a chance de 0,98/1,2 na primeira etapa, multiplicador anterior/próximo nas demais. Escolher um balão não altera a chance.

O ID de cada balão estourado fica na rodada, permitindo restaurar cores, ordem e quantidade. Estourar debita apenas na primeira ação; pegar ou completar a décima etapa credita uma única vez. As moedas que voam ao saldo são apenas apresentação. Sair e voltar restaura o ponto salvo, e a perda também fica confirmada antes da queda.

## Operações, compatibilidade e recarga

As operações v4 armazenam o resultado imutável sem duplicar o documento inteiro do jogador, baralhos e rodadas de outros jogos. O documento do jogador já é lido na transação; o replay retorna esse perfil atual junto do resultado salvo. Isso reduz os documentos e a validação duplicada, além de evitar reexibir um saldo antigo. As regras continuam aceitando clientes v1/v2/v3 compatíveis, inclusive sem os novos campos opcionais.

A recarga de 1.000 moedas abaixo de 1 continua disponível. Rodadas em aberto são preservadas e não bloqueiam a recarga do saldo compartilhado. Conflitos de turno e requisições pendentes antigas de outro aparelho não obrigam novo login nem criam outro débito.

A arquitetura mantém o limite já documentado do Spark: o cliente calcula o sorteio; as regras validam as transições e os valores, mas não provam que a aleatoriedade do navegador foi honesta. Apenas moedas virtuais, sem dinheiro real.

## Validação

- `npm test`: matemática, adaptadores, transações e arquivos do build.
- `npm run test:rules`: regras reais com Auth/Firestore emulados, incluindo repetição, concorrência, recarga sem duplicação e tentativas de alterar cartas/prêmios.
- `npm run test:integration`: regras e navegador com todos os jogos, incluindo `tests/new_games_browser.py` para toque real, Home, sessão salva, saldo compartilhado, centavos, retomada, duas abas e Flying x20.
- `npm run build:production` depois das integrações; publicação pelo workflow existente, com o publicador REST das regras preservado.
