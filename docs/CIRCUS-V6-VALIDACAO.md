# Circus v6 — validação da prévia (12/11/2026)

**Não liberar em live: integração Firestore ainda bloqueada.** A carteira da
prévia Pages é fictícia. Fontes e decisões compartilhadas em HANDOFF/TODO.

## Economia

`node scripts/circus-v6-audit.mjs` — 5.000.000 giros por aposta, semente 472831,
mesmo motor da carteira. Retorno = moedas normais + Happeach + roleta − Tony.
Ingressos antigos não entram no cálculo. Cedro não é dinheiro nem entrada.

| Aposta | Giros | Retorno |
|---|---:|---:|
| 1 | 5.000.000 | 89,9933568% |
| 10 | 5.000.000 | 89,99302086% |
| 100 | 5.000.000 | 89,993020852% |
| 1.000 | 5.000.000 | 89,9930208514% |

PAYS por ID estável: `[1.2,0,0.8,0,0,0,2.5,10,5,0,0.4,0,0,0,0,0]`.
Pagantes na fita/tabela: ingresso, circo, capa, moeda, diamante, coroa.
Pesos `[9,0,12,0,0,0,7,5,6,0,70,0,0,0,0,0]`, cedro 0,12, Happeach 0,005.
Os arquivos JSON incluem componentes e hashes das fontes da simulação.

Um milhão por cenário adicional: décimo giro alto **90,1011%**, cultivar cedros
com aposta baixa **89,9627%**, alternar 1/1.000 **89,9948%**, estoque artificial
sempre cheio **90,0013%**. Todos em 88,5–91,5%, nenhum acima de 100%.
As simulações históricas v4/v5 também foram reexecutadas (5 milhões por aposta)
e seus hashes de módulos comuns atualizados, com retorno na faixa original.

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
