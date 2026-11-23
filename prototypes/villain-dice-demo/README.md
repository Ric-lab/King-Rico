# Dado isolado para avaliação

Usa as fontes reais `games/villain-dice/scene.js` e `ui/park/villain-dice.js`.
O formulário escolhe explicitamente uma face de teste, sem sorteio financeiro.
Não há Firebase, carteira, apostas ou débitos. O swipe controla o arremesso.

`node prototypes/villain-dice-demo/build.mjs` gera o dist local deste protótipo.
`python3 tests/dice_demo_browser.py` confere swipe e resultado sem chamadas externas.

O workflow `dice-demo.yml` recompõe a prévia aprovada em `f7e8d185` (run45094186274,
concluído com sucesso), acrescenta SOMENTE esta demonstração e aponta `/Preview`
para ela durante a avaliação. A rota `/circus/` permanece na versão aprovada.
Nenhuma matemática ou regra do checkpoint do dado é publicada por esse workflow.
Fonte financeira e seus gates de auditoria continuam intactos no fluxo normal.
