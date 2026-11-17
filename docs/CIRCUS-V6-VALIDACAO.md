# Circus v6 — validação da prévia (16/11/2026)

**Integração Firestore concluída em 17/11/2026: 81/81 casos passaram.**
Publicação oficial autorizada pelo dono. A prévia Pages continua fictícia e
separada; o build oficial usa a conta Google e o saldo do projeto king-rico.
Fontes e decisões compartilhadas em HANDOFF/TODO.

## Economia

`node scripts/circus-v6-audit.mjs` — 5.000.000 giros por aposta, semente 472831,
mesmo motor da carteira. Retorno = moedas normais + Good Luck (barra lateral aleatória) + roleta (5 símbolos guardados) − Tony.
Ingressos antigos não entram no cálculo. Trevo não é dinheiro nem entrada.

| Aposta | Giros | Rolos + Good Luck | Roleta Bônus | Bruto | Tony | Retorno Líquido |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 5.000.000 | 85.0293% | 8.9183% | 93.9475% | -3.9574% | **89.9902%** |
| 10 | 5.000.000 | 84.8753% | 8.9162% | 93.7915% | -3.8022% | **89.9893%** |
| 100 | 5.000.000 | 84.8753% | 8.9162% | 93.7915% | -3.8022% | **89.9893%** |
| 1000 | 5.000.000 | 84.8753% | 8.9162% | 93.7915% | -3.8022% | **89.9893%** |

**Garantia nova:** o giro que guarda a 5ª roleta e o giro que completa a barra
Good Luck sempre têm prêmio em moedas na grade inicial. Se já houver prêmio,
é preservado; se não, forma-se uma linha de ingressos (0,4×), escolhida entre
as oito combinações sem substituir nenhum símbolo de roleta. Prêmio, linhas,
células e crédito são recalculados juntos antes de animar o resultado.
Não muda a tabela de pagamentos, a base acumulada da roleta ou as chances dos
vilões. O adicional está incluído no ledger/RTP; o bruto é o da tabela acima,
compensado pelo controle existente do Tony, com líquido ~90%.

Nos20 milhões: 652646 aberturas, zero sem prêmio inicial.
O denominador conta só apostas debitadas; prêmios/roubos dos grátis entram.
Há 175121 Good Lucks com cinco giros e retorno menor20×
entre 226894 bônus. Os relatórios registram cada categoria.


PAYS por ID estável: `[1.2,0,0.8,0,0,0,2.5,10,5,0,0.4,0,0,0,0,0]`.
Pagantes na fita/tabela: ingresso, circo, capa, moeda, diamante, coroa.
Pesos `[9,0,12,0,0,0,7,5,6,0,70,0,0,0,0,4]`, trevo (`CEDAR_P`) `0,12`, símbolo de roleta (`PEACH_P_V6`) `0,015`, `WHEEL_SHARE_V6 = 0,36`, barra Good Luck aleatória (`BAR_P1_V6 = 0,12`, `BAR_P2_V6 = 0`, trava mínima de **25 giros**, média **~88 giros**).
Os arquivos JSON incluem componentes e hashes das fontes da simulação.

Um milhão por cenário: tenth-high=90.0693%, armor-farm=89.8868%, alternating=89.9792%, fixed/armor=90.0038%. Todos passaram.
Comando reproduzível: `node scripts/circus-v6-stress.mjs`.
As auditorias v4/v5 também foram reexecutadas (5 milhões por aposta) para
conferir que os caminhos históricos não mudaram; hashes atualizados nos JSON.

### Estado das regras

`npm run test:rules`: **67/80 passaram; 13 falharam**, incluindo casos v5/v6,
por atingir o limite Firestore de 1.000 expressões. Bloqueio já existente na
integração real; `v6Feature` agora exige o prêmio exato da grade, sem piso20×; dispatcher preservado. Novos
casos wheel-prize/bar-prize ficam registrados para validar após destravar a
integração. A publicação desta mudança é exclusivamente na prévia Pages.

## Histórico de publicação da prévia (anterior a esta revisão)

Código `c6bdb3c`, [Actions 43312770870](https://github.com/Ric-lab/King-Rico/actions/runs/43312770870), **success**.
Todos os 12 navegadores e o teste do subdiretório passaram; deploy e HEAD públicos
200 para circus/, park/, client.js, Three.js e moeda. URL fixa:
https://ric-lab.github.io/King-Rico/circus/. Oficial/main permanecem em `9808d53`.

## Testes

- `npm test`: 53 arquivos passaram na revisão de especiais. Casos novos cobrem seis pagamentos,
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

## Bloqueio financeiro anterior — resolvido em 17/11/2026

Registro histórico de 16/11: **67 de 80** passaram; os 13 casos positivos
pendentes atingem o limite de 1.000 expressões (v5 normal/bônus e casos v6,
incluindo wheel-prize/bar-prize). Recibos forjados continuam rejeitados; os testes
negativos não substituem os positivos ainda falhando. Somente v6Feature foi ajustada ao pagamento exato; nenhuma regra foi
publicada nesta revisão.

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

## Bônus baixo e estado visual gasto —16/11/2026

FEATURE_HIT_V6=0,29; removido só o piso20× da v6. Auditorias acima refeitas após
a mudança; v4/v5 seguem preservadas. Unitário força cinco rodadas por0,4× e
confere a grade/res exatos; também encontra Big/Super legítimos. Navegador
confere crédito final, ausência de Big Win no bônus pequeno, queda do asset,
cinco consumos e barra vazia através de snapshot/recarga e até o próximo spin.
Regras novamente67/80, mesmos13 bloqueios de expressão; não promover main.

## Validação oficial — 17/11/2026
As regras distribuem verificações equivalentes entre os três documentos
obrigatórios do batch: carteira (débito, recursos, aposta, envelope), estado
(transição e defesa) e recibo imutável (ledgers, prêmio da feature/roleta e
geometria da defesa). Não foi removida nenhuma validação de pagamentos.
Entraram validação do token grátis, consumo único entre aparelhos e preservação
do token durante outras ações. 81/81 casos de integração passaram; giros
normais/legados, defesa Tony/Tucker, Ray, 5ª roleta e barra cheia confirmados.
Navegador com Auth/Firestore reais emulados: saldo único e sessão persistente,
sem wallet local, seletor de resultados, erros JS ou assets ausentes.
RTP e arquivos do motor permanecem iguais aos da auditoria acima.
