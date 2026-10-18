# Fortune Impulso 02

Jogo solo de precisão, desenvolvido sobre `main` em `aedf88d` e revisado a partir do feedback da primeira versão. Não altera os seis jogos oficiais, Home, login, Firestore ou workflow Firebase.

Um gesto lança uma bola em arco até uma plataforma circular. A posição de queda define a recompensa: borda ×1,2, anel intermediário ×1,8, centro ×3. Depois de acertar, é possível receber ou arriscar o valor no próximo salto. O terceiro acerto recebe automaticamente; cair fora perde o valor da rodada. Os prêmios incluem a aposta. A economia é experimental.

O alvo varia antes de cada salto, sem desvios ou sorteios após o gesto. A animação e o prêmio usam a mesma trajetória balística. O ensaio gratuito repete a plataforma inicial, mede precisão e não movimenta moedas. Há dicas de direção/força, compressão do alvo e da bola, pequeno rebote, efeitos de impacto e som sintetizado. O menu é o componente oficial do projeto.

Leia [REFERENCIAS.md](REFERENCIAS.md) para as fontes, decisões de design e perguntas de teste humano.

## Executar

Com as dependências instaladas e Node 22:

```
node prototypes/fortune-impulso/physics.test.mjs
node scripts/build-impulso.mjs
python -m http.server 5097 --directory work/fortune-impulso/dist
```

Com o servidor ativo, `python prototypes/fortune-impulso/browser.test.py` executa o teste por toque com Playwright e Chromium. `IMPULSO_URL` e `IMPULSO_NODE` permitem escolher a URL e o executável Node. Capturas em `work/fortune-impulso/`.

O saldo de demonstração começa em 1.000 moedas e usa exclusivamente `king-rico-impulso-demo-v2`. Não importa outros saldos nem acessa Firebase. A aposta e o resultado são persistidos antes da animação; recarregar retoma o resultado sem apostar ou pagar novamente. Essa carteira é local, apenas para testar a experiência; a integração oficial futura deve usar o Firestore existente.

Modelos geométricos e texturas de iluminação feitos por código, sem serviços de geração pagos. Fontes, menu e arte `assets/brand/bg-circus-stage.webp` reutilizados do projeto, sem modificar os arquivos originais. Three.js e React empacotados localmente com licenças. O site privado mantém a primeira versão em `/v1/` para comparação.
