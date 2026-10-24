# Fortune Bridge: experimento de passarela

Prévia em `/bridge` (`Fortune Bridge.dc.html`). A Home e o Fortune Neck atual continuam iguais. A proposta substitui árvore/maçãs por uma atração circense: Nick Neck salta entre dois vidros suspensos. Uma rede ampara a queda.

## Mecânica

Uma aposta para seis pares. Antes do primeiro salto, o motor sorteia os seis lados seguros e grava o caminho em `players/{uid}.bridgeRound`. Cada par tem exatamente um vidro seguro; cada escolha tem chance de 50%. Não há sorteio adicional após escolher. O visual não revela os próximos lados.

Após acertar, pode pegar o prêmio ou continuar. Errar perde a aposta e o prêmio ainda não recolhido. O sexto acerto paga automaticamente. Multiplicadores totais: **1,9 / 3,8 / 7,5 / 15 / 30 / 60**, incluindo a aposta. Com aposta 10: **19 / 38 / 75 / 150 / 300 / 600** moedas. Retorno teórico de uma estratégia de parada fixa: 95% nas duas primeiras etapas; 93,75% nas demais, antes de arredondamentos.

## Persistência e integração

- Google e carteira Firestore compartilhados; não importa saldo do localStorage.
- START debita uma vez. JUMP usa o caminho salvo. COLLECT ou último salto pagam uma vez.
- Mesmo UUID recupera a operação imutável. Outro UUID com etapa/rodada antiga é rejeitado.
- Atualizar retoma aposta, etapa, escolhas e caminho existentes. Uma rodada encerrada não pode ser recebida novamente.
- O saldo é confirmado antes da apresentação. Nenhuma falha de animação cancela ou repete pagamento. O número exibido usa o contador animado comum e sobe a partir da chegada das moedas.
- Componentes comuns de menu, saldo, aposta e botões; build reúne as dependências React do componente para o loader DC.
- Firebase Spark, sem Functions. Como nos demais protótipos, o sorteio é calculado no cliente; a persistência impede repetições e as regras validam transições, mas não torna o cliente uma fonte confiável contra adulteração.

## Validação

`tests/bridge.test.cjs`: caminho sorteado uma vez, resultados e tabela.
`tests/store.test.mjs`: replay, duas sessões, perda, prêmio final e pedidos inválidos.
`tests/integration.mjs`: transações reais emuladas e rejeição de alteração do caminho, crédito e débito forjados.
`tests/bridge_browser.py`: toque, clique repetido, retomada, perda, seis acertos, prêmio, animação indisponível e saldo no Neck. Integrado ao runner de navegador existente.
