## Nova decisão — 12/11/2026, Circus v6 na prévia

Parque e atrações (Pênalti, Flying Clown, Bounce, Fingo, além dos já arquivados)
ficam guardados. Os seis registros atuais de `site/routes.json` preservam nomes
históricos, mas apenas Circus é ativo; os demais têm `archived:true` e geram
redirecionamentos sem cobrança para `/circus`, inclusive no GitHub Pages.
Recibos, APIs de retomada, fontes e assets antigos permanecem. Para reativar,
revisar a economia e remover explicitamente o `archived`, sem ressuscitar a
antiga moeda de ingresso. Testes de navegador do catálogo antigo são históricos;
o fluxo público substituto é coberto por `circus_v6_browser.py` e pelo teste Pages.

# Jogos arquivados (atualizado em 05/11/2026)

Decisão do dono: estes jogos saem do site. Os arquivos-fonte continuam no repositório (os testes de unidade os usam); só a rota pública foi removida de `site/routes.json` e `firebase.json`.

| Jogo | Rota antiga | Arquivo |
|---|---|---|
| Fortune Wheel | /wheel | Fortune Wheel.dc.html |
| Fortune Neck | /neck | Fortune Neck.dc.html |
| Fortune 33 | /33 | Fortune 33.dc.html |
| Fortune 21 | /21 | Fortune 21.dc.html |
| Fortune Clown | /clown | Fortune Clown.dc.html |
| Claw Machine | /claw | Fortune Claw.dc.html |
| Fortune Race | /race | Fortune Race.dc.html |
| Fortune Bridge | /bridge | Fortune Bridge.dc.html |

Para reativar um jogo: devolver a linha em `site/routes.json` e o rewrite/header em `firebase.json`.

## Branches arquivadas como tags
- `archive/codex-fortune-21` ← codex/fortune-21
- `archive/codex-fortune-impulso` ← codex/fortune-impulso
- `archive/codex-fortune-bounce-feel` ← codex/fortune-bounce-feel
- `archive/claude-modest-ride-28qxim` ← claude/modest-ride-28qxim
- `archive/codex-firebase-spark` ← codex/firebase-spark
- `archive/codex-fortune-neck` ← codex/fortune-neck

Recuperar: `git checkout -b <nome> archive/<tag>`.

05/11: dono pediu guardar o Fortune Clown e reativar o Bounce. Clown sai
do catálogo e da rota pública; fontes, assets e rodadas salvas são preservados.
Bounce volta como atração do parque, com entrada por ingresso ou 25 moedas.
