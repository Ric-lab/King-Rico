# Fortune 21 e Fortune Flying Clown

Ambos abrem pela Home e usam o mesmo login Google, sessão, saldo em centavos e menu dos demais jogos. Não importam o saldo do protótipo 21 nem de outros dados antigos do aparelho. Firebase continua no Spark: Auth, Firestore e Hosting, sem Cloud Functions.

## Fortune 21

Cartas numeradas, jogador contra a banca. A carta 1 vale 1 ou 11 automaticamente. Pedir carta ou parar; a banca compra abaixo de 17 e para em qualquer 17, inclusive suave. Vitória devolve 2× a aposta; 21 com duas cartas, 2,5×; empate devolve a aposta. Os recebimentos incluem a aposta.

`cloud/twenty-one.cjs` guarda o baralho de 52 cartas, mãos, cursor, turno e resultado. Distribuir debita uma única aposta e salva o baralho; a confirmação de um 21 inicial ocorre na primeira ação automática da banca. Cada ação confirma a fase e o turno anteriores. Resultado e crédito são atômicos e vêm antes da apresentação do prêmio. A mão encerrada fica disponível para mostrar o resultado após recarregar.

As regras conferem a permutação inteira do baralho na abertura, cada carta consumida, os pontos e ases incrementais, as fases, o turno e o prêmio. Separar a abertura da confirmação da banca mantém essa validação dentro do limite de expressões do Firestore.

## Flying Clown

Mantém a arte, os dez balões, a subida, o susto/queda, a aterrissagem, o esticão e os botões PEGAR/ESTOURAR do export. `cloud/engine.cjs` mantém os multiplicadores 1,2 → 20 e a chance original: 0,95/1,2 na primeira etapa, multiplicador anterior/próximo nas demais. Escolher um balão não altera a chance.

O ID de cada balão estourado fica na rodada, permitindo restaurar cores, ordem e quantidade. Estourar debita apenas na primeira ação; pegar ou completar a décima etapa credita uma única vez. As moedas que voam ao saldo são apenas apresentação. Sair e voltar restaura o ponto salvo, e a perda também fica confirmada antes da queda.

## Operações, compatibilidade e recarga

As operações v4 armazenam o resultado imutável sem duplicar o documento inteiro do jogador, baralhos e rodadas de outros jogos. O documento do jogador já é lido na transação; o replay retorna esse perfil atual junto do resultado salvo. Isso reduz os documentos e a validação duplicada, além de evitar reexibir um saldo antigo. As regras continuam aceitando clientes v1/v2/v3 compatíveis, inclusive sem os novos campos opcionais.

A recarga de 1.000 moedas abaixo de 1 continua disponível. Não é concedida enquanto existe uma mão do 21 ou rodada do Flying em aberto. Conflitos de turno e requisições pendentes antigas de outro aparelho não obrigam novo login nem criam outro débito.

A arquitetura mantém o limite já documentado do Spark: o cliente calcula o sorteio; as regras validam as transições e os valores, mas não provam que a aleatoriedade do navegador foi honesta. Apenas moedas virtuais, sem dinheiro real.

## Validação

- `npm test`: matemática, adaptadores, transações e arquivos do build.
- `npm run test:rules`: regras reais com Auth/Firestore emulados, incluindo repetição, concorrência, recarga bloqueada e tentativas de alterar cartas/prêmios.
- `npm run test:integration`: regras e navegador com todos os jogos, incluindo `tests/new_games_browser.py` para toque real, Home, sessão salva, saldo compartilhado, centavos, retomada, duas abas e Flying x20.
- `npm run build:production` depois das integrações; publicação pelo workflow existente, com o publicador REST das regras preservado.
