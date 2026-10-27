# Fingo: cartela e Plinko

A nova cartela tem 25 números grandes, sem casa livre. Vence ao completar uma
linha, coluna ou diagonal de cinco casas. Cada dourado pode ajudar linhas
diferentes; cinco marcações isoladas não bastam.

## Fluxo

1. GIRAR sorteia as cinco opções nos tubos do Plinko atual.
2. Depois que os cinco números aparecem, a cartela abre com as opções e suas
   casas disponíveis destacadas. A pessoa consulta pelo tempo que precisar.
3. LANÇAR volta ao Plinko. A escolha da coluna e o lançamento continuam nele.
4. Uma marcação reabre a cartela, evidencia a casa alcançada e a linha adiantada.
   CONTINUAR prepara o próximo sorteio. Um erro fica no Plinko.
5. QUINA destaca a linha completa. RECEBER abre o aviso do prêmio; o OK mantém
   o voo de moedas e a contagem animada do saldo já existentes.

CARTELA permite consultar novamente antes de lançar. Ela não cobra, não altera
os números e não consome jogadas. As cinco bolas numeradas aparecem dentro dos buckets. O tabuleiro foi alongado e reposicionado para baixo; o medalhão ampliado mostra as bolas restantes de 30 a 0. A interface se atualiza quando outra aba muda a partida.

## Persistência e compatibilidade

Apenas o primeiro sorteio debita a aposta. As cinco bases da cartela, as marcas,
os tubos pendentes, a aposta e o contador são gravados no Firestore. Atualizar,
trocar de página, consultar a cartela ou repetir a requisição preserva esse estado.
Cada queda é confirmada antes da física; uma resposta repetida não marca nem paga
novamente. Não há importação de saldo local, novo backend ou Cloud Functions.

`cardVersion:1` usa as cinco bases para gerar 25 números por passos coprimos de
15 em cada coluna. As marcas são índices de 0 a 24. A regra usa a permutação
inversa para conferir a casa do número alcançado e uma das 12 linhas válidas,
sem ultrapassar o orçamento de avaliação do Firestore. As bases e a versão
permanecem imutáveis durante a partida.

Partidas pagas sem `cardVersion` concluem o jogo anterior de cinco alvos com as
chances e a tabela originais. As novas começam no modo 5×5.

## Pagamentos e verificação

Novas cartelas (`payoutVersion:3`) pagam **2× a aposta** por qualquer quina, da quinta à trigésima bola. Esse é o prêmio total, incluindo a aposta; por exemplo, aposta de 10 recebe 20. Cartelas já pagas (`payoutVersion:2`) mantêm suas faixas originais até terminar. As chances
da cartela são fixas; não consultam histórico ou saldo. A medição por estratégia
fica em [ECONOMIA.md](ECONOMIA.md) e nos [dados da amostra](fingo-card-audit.json).
O retorno observado não é prova de estratégia ótima ou garantia de retorno.

- `node --test tests/fingo-card.test.cjs`: 25 números distintos, correspondência
  entre geração e regra inversa, todas as quinas, escolhas diferentes e erro final.
- `npm run test:rules`: débito único, todas as faixas e 12 linhas, marcas falsas,
  cinco casas sem quina, versões antigas, retomada e repetição de operações.
- Com emuladores e build de emulador: `python3 tests/browser.py --fingo-only`.
  Exercita Home, consulta, mira, marcação, erro, quina, recebimento, atualização,
  duas abas e saldo compartilhado.
- `node scripts/fingo-card-audit.mjs`: 20 mil cartelas por política, semente fixa,
  sem bônus ou recargas.

## Nova cartela e testes

NOVA CARTELA e ENCERRAR CARTELA pedem confirmação e encerram a partida atual,
sem prêmio, devolução ou novo débito. O cancelamento é uma transação vinculada
à cartela e ao contador salvos: repetir a requisição não encerra uma cartela nova.
Funciona também nas cartelas antigas. As demais partidas e o saldo são preservados.

Nos links entregues para o autor testar mudanças, usar `/fingo?nova-cartela=1`.
Esse link encerra a cartela da própria conta ao abrir e remove o parâmetro depois
da confirmação do Firestore. Não é um reset global: não altera outras contas.
A navegação normal e recargas posteriores continuam retomando a partida salva.
A cada nova entrega de teste, fornecer esse link para não exigir terminar 30 bolas.

A composição usa um único fundo no viewport e um único elemento de tabuleiro,
sem repetir o cenário no palco interno. O Plinko fica oculto ao abrir a cartela, evitando um tabuleiro aparecendo por trás do outro. O valor de prêmio deixou de aparecer
sobre o cenário; o pagamento fixo permanece na tabela e no aviso de vitória.
