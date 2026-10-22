# Fortune 33 e Fortune Flying Clown

Ambos abrem pela Home e usam o mesmo login Google, sessão, saldo em centavos e menu dos demais jogos. Não importam o saldo do protótipo 21 nem de outros dados antigos do aparelho. Firebase continua no Spark: Auth, Firestore e Hosting, sem Cloud Functions.

## Fortune 33

Fortune 33 substitui o 21 na Home. Cartas numeradas de 1 a 13 valem exatamente o número impresso; 1 vale apenas 1. Objetivo: ficar mais perto de 33 que a banca, sem ultrapassar. A banca compra abaixo de 27 e para em 27 ou mais. Vitória recebe 2× incluindo a aposta; empate devolve a aposta. Fazer 33 passa a vez à banca, com o mesmo pagamento normal. Não há bônus de duas cartas: duas cartas somam no máximo 26.

Cada número mantém o asset escolhido pelo autor. O botão de interrogação foi removido; as regras continuam disponíveis pelo menu. `cloud/thirty-three.cjs` implementa a regra; `target:33` é salvo e imutável durante a mão. O baralho de 52 cartas contém quatro cópias de cada número e é embaralhado uma vez na abertura. Débito, cartas, turnos, resultado e crédito continuam atômicos, verificáveis pelas regras Firestore e protegidos contra repetição.

Os nomes internos `twentyOne`, `twentyOneRound` e o diretório `games/fortune21` permanecem por compatibilidade. Mãos antigas sem `target:33` terminam com a matemática original do 21, sem alterar baralho, aposta ou prêmio; a interface identifica a mão anterior. Toda nova mão iniciada pela nova interface usa 33. Clientes antigos ainda abertos continuam compatíveis, sem converter uma mão no meio. O endereço antigo redireciona para `Fortune 33.dc.html`.

A banca em 27 é a configuração inicial do novo jogo. Uma simulação exploratória de 100 mil mãos por limiar de parada (24 a 29) encontrou aproximadamente 95% de retorno com paradas em 27–28; não é prova de estratégia ótima nem auditoria de RTP. O limite 33 não determina sozinho as chances: baralho, política de parada e pagamentos também contam.

## Flying Clown

Mantém a arte, os dez balões, a subida, o susto/queda, a aterrissagem, o esticão e os botões PEGAR/SUBIR do export. `cloud/engine.cjs` mantém os multiplicadores 1,2 → 20 e a chance original: 0,95/1,2 na primeira etapa, multiplicador anterior/próximo nas demais. Escolher um balão não altera a chance.

O ID de cada balão estourado fica na rodada, permitindo restaurar cores, ordem e quantidade. Estourar debita apenas na primeira ação; pegar ou completar a décima etapa credita uma única vez. As moedas que voam ao saldo são apenas apresentação. Sair e voltar restaura o ponto salvo, e a perda também fica confirmada antes da queda.

## Operações, compatibilidade e recarga

As operações v4 armazenam o resultado imutável sem duplicar o documento inteiro do jogador, baralhos e rodadas de outros jogos. O documento do jogador já é lido na transação; o replay retorna esse perfil atual junto do resultado salvo. Isso reduz os documentos e a validação duplicada, além de evitar reexibir um saldo antigo. As regras continuam aceitando clientes v1/v2/v3 compatíveis, inclusive sem os novos campos opcionais.

A recarga de 1.000 moedas abaixo de 1 continua disponível. Não é concedida enquanto existe uma mão de cartas ou rodada do Flying em aberto. Conflitos de turno e requisições pendentes antigas de outro aparelho não obrigam novo login nem criam outro débito.

A arquitetura mantém o limite já documentado do Spark: o cliente calcula o sorteio; as regras validam as transições e os valores, mas não provam que a aleatoriedade do navegador foi honesta. Apenas moedas virtuais, sem dinheiro real.

## Validação

- `npm test`: matemática, adaptadores, transações e arquivos do build.
- `npm run test:rules`: regras reais com Auth/Firestore emulados, incluindo repetição, concorrência, recarga bloqueada e tentativas de alterar cartas/prêmios.
- `npm run test:integration`: regras e navegador com todos os jogos, incluindo `tests/new_games_browser.py` para toque real, Home, sessão salva, saldo compartilhado, centavos, retomada, duas abas e Flying x20.
- `npm run build:production` depois das integrações; publicação pelo workflow existente, com o publicador REST das regras preservado.
