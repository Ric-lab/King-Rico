# Circus v6 — validação da prévia (16/11/2026)

**Não liberar em live: integração Firestore ainda bloqueada.** A carteira da
prévia Pages é fictícia. Fontes e decisões compartilhadas em HANDOFF/TODO.

## Economia

`node scripts/circus-v6-audit.mjs` — 5.000.000 giros por aposta, semente 472831,
mesmo motor da carteira. Retorno = moedas normais + Good Luck (barra lateral aleatória) + roleta (5 símbolos guardados) − Tony.
Ingressos antigos não entram no cálculo. Trevo não é dinheiro nem entrada.

| Aposta | Giros | Rolos + Good Luck | Roleta Bônus | Bruto | Tony | Retorno Líquido |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 5.000.000 | 84.2046% | 8.8748% | 93.0793% | -3.0800% | **89.9993%** |
| 10 | 5.000.000 | 84.1738% | 8.8866% | 93.0604% | -3.0609% | **89.9995%** |
| 100 | 5.000.000 | 84.1948% | 8.8818% | 93.0766% | -3.0771% | **89.9995%** |
| 1000 | 5.000.000 | 84.1948% | 8.8818% | 93.0766% | -3.0771% | **89.9995%** |

**Garantia nova:** o giro que guarda a 5ª roleta e o giro que completa a barra
Good Luck sempre têm prêmio em moedas na grade inicial. Se já houver prêmio,
é preservado; se não, forma-se uma linha de ingressos (0,4×), escolhida entre
as oito combinações sem substituir nenhum símbolo de roleta. Prêmio, linhas,
células e crédito são recalculados juntos antes de animar o resultado.
Não muda a tabela de pagamentos, a base acumulada da roleta ou as chances dos
vilões. O adicional está incluído no ledger/RTP; o bruto é o da tabela acima,
compensado pelo controle existente do Tony, com líquido ~90%.

Nos 20 milhões de giros: **651.068 aberturas** de roleta/Good Luck,
**zero** sem prêmio em moedas e **324 giros grátis** por trevos cheios.
O denominador é o valor efetivamente apostado: grátis soma zero, mas seus prêmios
e roubos entram no retorno.


PAYS por ID estável: `[1.2,0,0.8,0,0,0,2.5,10,5,0,0.4,0,0,0,0,0]`.
Pagantes na fita/tabela: ingresso, circo, capa, moeda, diamante, coroa.
Pesos `[9,0,12,0,0,0,7,5,6,0,70,0,0,0,0,4]`, trevo (`CEDAR_P`) `0,12`, símbolo de roleta (`PEACH_P_V6`) `0,015`, `WHEEL_SHARE_V6 = 0,36`, barra Good Luck aleatória (`BAR_P1_V6 = 0,12`, `BAR_P2_V6 = 0`, trava mínima de **25 giros**, média **~88 giros**).
Os arquivos JSON incluem componentes e hashes das fontes da simulação.

Um milhão por cenário adicional: décimo-alto **90.0667%**, cultivar trevos **90.0073%**,
alternar apostas **89.9858%**, estoque cheio **89.9943%**. Todos passaram, zero bônus vazio.
Comando reproduzível: `node scripts/circus-v6-stress.mjs`.
As auditorias v4/v5 também foram reexecutadas (5 milhões por aposta) para
conferir que os caminhos históricos não mudaram; hashes atualizados nos JSON.

### Estado das regras

`npm run test:rules`: **67/80 passaram; 13 falharam**, incluindo casos v5/v6,
por atingir o limite Firestore de 1.000 expressões. Bloqueio já existente na
integração real; regras/dispatcher não foram modificados nesta tarefa. Novos
casos wheel-prize/bar-prize ficam registrados para validar após destravar a
integração. A publicação desta mudança é exclusivamente na prévia Pages.

## Histórico de publicação da prévia (anterior a esta revisão)

Código `c6bdb3c`, [Actions 43312770870](https://github.com/Ric-lab/King-Rico/actions/runs/43312770870), **success**.
Todos os 12 navegadores e o teste do subdiretório passaram; deploy e HEAD públicos
200 para circus/, park/, client.js, Three.js e moeda. URL fixa:
https://ric-lab.github.io/King-Rico/circus/. Oficial/main permanecem em `9808d53`.

## Testes

- `npm test`: 52 arquivos passaram na revisão de especiais. Casos novos cobrem seis pagamentos,
  oito combinações, especiais sem prêmio em moedas, estoque até 5, defesa dos
  do Tony/Tucker, Ray sem defesa, perdas sem proteção, banco de roletas proporcional, roleta por
  contribuição, replay e recarga da carteira fictícia. Equivalência de contagem
  de linhas validada em 100.000 grids. Teste adicional de centavos confirma que
  a tela cheia é multiplicada antes do arredondamento da feature.
- Navegadores: 15 arquivos passaram (transição repetida após corrigir a expectativa
  antiga da nuvem removida); linhas/voos de moedas, três fitas, líquido, roda/colorido/som,
  patadas, Tucker, Ray, voo céu/espaço, raspadinha diária, coleta e defesa de
  trevos, redirecionamentos arquivados. Recarga no cabeçalho: cancelar não credita;
  concluir 30s credita uma vez, mostra recibo, voo e saldo atualizado.
- Testes antigos de catálogo/entrada (`park_preview_browser.py` e
  `park_repeat_browser.py`) permanecem como histórico, substituídos no runner por
  `circus_v6_browser.py` e `circus_recharge_browser.py`. As atrações estão guardadas.
- Pages: conferência do mesmo build sob `/King-Rico`, sem Firebase habilitado.
  O build da prévia versiona JS e módulos DC pelo hash para evitar cache antigo.

## Bloqueio financeiro — ação necessária antes de main

Última suíte `npm run test:rules`: **67 de 80** passaram; os 13 casos positivos
pendentes atingem o limite de 1.000 expressões (v5 normal/bônus e casos v6,
incluindo wheel-prize/bar-prize). Recibos forjados continuam rejeitados; os testes
negativos não substituem os positivos ainda falhando. Nenhuma regra foi alterada
ou publicada nesta revisão.

Registro histórico: uma revisão automática anterior impediu refatorar o
validador/dispatcher financeiro central por risco de alterar a segurança legada
sem autorização específica; aquela proposta não foi aplicada. O bloqueio permanece
uma tarefa separada. Preservar cálculo exato, vínculo atômico, limites, banco,
ledger e prevenção de replay ao resolver o custo de avaliação; depois rodar os
80 casos de regras e a integração completa antes de considerar o oficial.

## Revisão de especiais — 15/11/2026

Defesa Tony/Tucker agora troca a cabeça central por símbolo pagante, com possível
linha transversal no mesmo recibo. Vilões avulsos/pares são decoração de casas
sem prêmio, sem ataques novos. As auditorias acima foram reexecutadas depois
dessas mudanças, com hashes atuais: todas as apostas e quatro estresses passaram.
Nenhuma alteração em PAYS, probabilidades de ataque, banco da roleta ou barra.
Nos 20 milhões de giros, os relatórios também registram avulsos/pares e giros grátis.
Essa revisão preserva os parâmetros e contabiliza grátis pelo custo real.

Além do limite de expressões já existente, a integração Firestore precisa
validar a nova forma de `defense` e os avulsos. Esta revisão não modifica regras
e não deve ir à main até a validação financeira completa.

## Trevos cheios — 16/11/2026

Testes novos: custo zero, aposta fixa, saldo zerado, persistência/reabertura,
renovação de um grátis, replay de ambos os recibos e token consumido rejeitado
entre aparelhos. `store.test.mjs` cobre a transação real em memória, duas
instâncias e replays concorrentes. Isso não substitui Security Rules: os campos
`cloverFreeBetUnits/cloverFreeSpinId` e o pedido `freeSpinId` precisam ser aceitos
e vinculados atomicamente pelas regras antes de main. Preview continua fictícia.

Navegador: grátis automático com uma única aposta debitada; preset 🎯 Trevos
cheios; defesa com arco/contato; contadores compactos; cinco cliques Good Luck
e nenhum raio. Testes alterados não reduzem verificações de crédito/replay.
