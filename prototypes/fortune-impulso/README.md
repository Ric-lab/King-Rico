# Fortune Impulso

Protótipo de jogo solo criado sobre `main` em `aedf88d`. Não altera os seis jogos, a Home, o login, as regras Firestore ou o workflow de publicação.

Uma bola, três portais visíveis, até três lançamentos. Um swipe controla direção e força. Portais estreitos pagam mais; depois de acertar, é possível receber ou arriscar o valor acumulado. O terceiro acerto recebe automaticamente. Um erro perde a aposta da rodada. Os valores de prêmio incluem o valor apostado. A distribuição econômica ainda é experimental.

O cenário é gerado antes de cada lançamento. Movimento e colisões usam passo fixo de 1/120 s, sem sorteio durante o movimento. A mira mostra só o começo da trajetória. Os pinos comprimem, os portais afundam e a energia percorre as lâmpadas a partir do gesto/impacto. Som sintetizado e menu oficial compartilhado do projeto.

## Executar

Com as dependências do projeto instaladas e Node 22:

```
node --test prototypes/fortune-impulso/physics.test.mjs
node scripts/build-impulso.mjs
python -m http.server 5097 --directory work/fortune-impulso/dist
```

Com o servidor ativo, `python prototypes/fortune-impulso/browser.test.py` executa o teste por toque com Playwright e Chromium. `IMPULSO_URL` e `IMPULSO_NODE` permitem escolher a URL e o executável Node. O teste percorre três acertos, retoma após atualização, recebe, perde, troca a aposta, abre o menu e confere telas de celular e desktop. As capturas ficam em `work/fortune-impulso/`.

O saldo de demonstração começa em 1.000 moedas e usa exclusivamente a chave `king-rico-impulso-demo-v1`. Não lê saldos antigos nem acessa Firebase. A aposta e o resultado calculado são persistidos antes da animação; uma atualização retoma o resultado sem apostar de novo. Os pagamentos locais são idempotentes. Esta carteira é apenas para testar a experiência; uma integração futura precisa usar a carteira Firestore existente.

Geometria, materiais e texturas de luz criados por código. Fontes, botão do menu e componente de menu reutilizados do projeto. Three.js, React e ReactDOM empacotados localmente com suas licenças.
