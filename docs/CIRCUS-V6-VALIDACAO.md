# Circus v6 — validação da prévia (12/11/2026)

**Não liberar em live: integração Firestore ainda bloqueada.** A carteira da
prévia Pages é fictícia. Fontes e decisões compartilhadas em HANDOFF/TODO.

## Economia

`node scripts/circus-v6-audit.mjs` — 5.000.000 giros por aposta, semente 472831,
mesmo motor da carteira. Retorno = moedas normais + Good Luck (barra lateral aleatória) + roleta (5 símbolos guardados) − Tony.
Ingressos antigos não entram no cálculo. Trevo não é dinheiro nem entrada.

| Aposta | Giros | Rolos + Good Luck | Roleta Bônus | Bruto (sem Tony) | Tony | Retorno Líquido |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 5.000.000 | 82,92% | 8,91% | 91,83% | -1,84% | **89,9907%** |
| 10 | 5.000.000 | 82,85% | 8,93% | 91,78% | -1,78% | **89,9951%** |
| 100 | 5.000.000 | 82,85% | 8,93% | 91,78% | -1,78% | **89,9951%** |
| 1.000 | 5.000.000 | 82,85% | 8,93% | 91,78% | -1,78% | **89,9951%** |

*(Demais apostas de 2,5 a 500 simuladas com 1.000.000 giros cada: retorno líquido **89,99%** em todas, bruto sem Tony ≤ **91,83%**, nunca acima de 93%.)*

PAYS por ID estável: `[1.2,0,0.8,0,0,0,2.5,10,5,0,0.4,0,0,0,0,0]`.
Pagantes na fita/tabela: ingresso, circo, capa, moeda, diamante, coroa.
Pesos `[9,0,12,0,0,0,7,5,6,0,70,0,0,0,0,0]`, trevo (`CEDAR_P`) `0,12`, símbolo de roleta (`PEACH_P_V6`) `0,015`, `WHEEL_SHARE_V6 = 0,36`, barra Good Luck aleatória (`BAR_P1_V6 = 0,08`, `BAR_P2_V6 = 0,02`).
Os arquivos JSON incluem componentes e hashes das fontes da simulação.

Um milhão por cenário adicional: décimo giro alto **90,2679%**, cultivar trevos
com aposta baixa **90,0247%**, alternar 1/1.000 **89,9752%**, estoque artificial
sempre cheio **89,9706%**. Todos em 88,5–91,5%, nenhum acima de 93%.
As simulações históricas v4/v5 também foram reexecutadas (5 milhões por aposta)
e seus hashes de módulos comuns atualizados, com retorno na faixa original.

## Publicação da prévia confirmada

Código `c6bdb3c`, [Actions 43312770870](https://github.com/Ric-lab/King-Rico/actions/runs/43312770870), **success**.
Todos os 12 navegadores e o teste do subdiretório passaram; deploy e HEAD públicos
200 para circus/, park/, client.js, Three.js e moeda. URL fixa:
https://ric-lab.github.io/King-Rico/circus/. Oficial/main permanecem em `9808d53`.

## Testes

- `npm test`: passou nos 47 arquivos. Casos novos cobrem seis pagamentos,
  oito combinações, especiais sem prêmio em moedas, estoque até 5, defesa dos
  três vilões, perdas sem proteção, banco Happeach proporcional, roleta por
  contribuição, replay e recarga da carteira fictícia. Equivalência de contagem
  de linhas validada em 100.000 grids. Teste adicional de centavos confirma que
  a tela cheia é multiplicada antes do arredondamento da feature.
- Navegadores: linhas/voos de moedas, três fitas, líquido, roda/colorido/som,
  patadas, Tucker, Ray, voo céu/espaço, raspadinha diária, coleta e defesa de
  cedros, redirecionamentos arquivados. Recarga pelo menu: cancelar não credita;
  concluir 30s credita uma vez, mostra recibo, voo e saldo atualizado.
- Testes antigos de catálogo/entrada (`park_preview_browser.py` e
  `park_repeat_browser.py`) permanecem como histórico, substituídos no runner por
  `circus_v6_browser.py` e `circus_recharge_browser.py`. As atrações estão guardadas.
- Pages: conferência do mesmo build sob `/King-Rico`, sem Firebase habilitado.
  O build da prévia versiona JS e módulos DC pelo hash para evitar cache antigo.

## Bloqueio financeiro — ação necessária antes de main

Última suíte `npm run test:rules`: **71 de 78** passaram. A revisão automática
impediu refatorar o dispatcher/validador central de Firestore, alegando risco de
alterar a fronteira de segurança financeira legada sem autorização específica.
As propostas rejeitadas não foram aplicadas. Não contornar esse bloqueio.

Falhas por limite de 1.000 expressões:

- normal v5 com bônus/replay e ledger existente (regressão a resolver);
- v6 Tucker sem cedro;
- v6 giro normal;
- v6 ganho de cedros;
- v6 Tony sem cedro;
- v6 Happeach/feature;
- v6 décimo giro.

As transações v6 protegidas dos três vilões e Ray sem estoque passaram.
Casos de recibo forjado foram rejeitados; isso **não** substitui os controles
positivos ainda falhando. Nenhuma dessas regras foi publicada.

Próximo passo: obter autorização explícita para refatorar a validação central
mantendo todas as proteções; reduzir custo sem retirar forma, vínculo atômico,
limites, cálculo exato, banco, ledger ou prevenção de replay. Rodar novamente
suite completa de regras e integração, incluindo v5 legado, até **78/78**; só
então considerar publicação oficial. Não mudar pagamentos para fazer testes passar.
