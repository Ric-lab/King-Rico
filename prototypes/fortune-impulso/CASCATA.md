# Fortune Cascata

Protótipo 03: uma chuva de 60 bolinhas passa por pinos físicos. O jogador move um coletor horizontalmente com o dedo; cada bolinha capturada pontua. Três capturas consecutivas da mesma cor estouram automaticamente e acrescentam 3 pontos. A rodada recebe o prêmio automaticamente ao terminar.

O objetivo desta versão é testar o prazer da cascata e do controle simples, seguindo as referências de bolas caindo, Plinko e Marble Run. A combinação é automática para evitar uma tarefa de planejamento durante a queda. As versões anteriores continuam em `/v1/` e `/v2/` no site privado.

## Rodada e carteira

- São 60 bolinhas de três cores. Cor e impulso inicial vêm da semente da rodada.
- A física usa Matter.js em passo fixo de 1/60 s. Pinos, bolinhas e paredes colidem; o prêmio depende do que passa pelo coletor.
- Uma bolinha vale 1 ponto; uma trinca acrescenta 3 pontos. Prêmio = `floor(aposta × pontos / 25)` e inclui o valor apostado. Exemplo: apostar 25 e fazer 32 pontos recebe 32 moedas, resultado líquido +7.
- A emissão dura aproximadamente 7 segundos; bolinhas restantes terminam o percurso em seguida. Há limite de 14 segundos de simulação para evitar que uma bola presa impeça a conclusão.
- O ensaio é gratuito e não paga moedas. A economia é experimental, ainda sujeita a avaliação por partidas humanas.
- A chave local exclusiva é `king-rico-cascade-demo-v1`. Não importa saldos antigos nem usa Firebase. Google, Firestore, Home e os jogos oficiais não são alterados.
- Checkpoints incluem posições, velocidades, bolinhas emitidas/resolvidas, pontos e coletor. Uma atualização retoma o último checkpoint. Cada bolinha é resolvida uma vez; o saldo e o encerramento são escritos juntos, impedindo repetir o prêmio ao atualizar.

## Controle

O movimento usa deltas do dedo em coordenadas reais da mesa. Trocar o ponto de contato não faz o coletor pular; inverter o movimento na borda responde imediatamente. Toques secundários são ignorados e `pointercancel` solta o gesto sem encerrar a rodada. Menu e aba oculta pausam a simulação.

## Executar e testar

```
node prototypes/fortune-impulso/cascade-state.test.mjs
node scripts/build-impulso.mjs
python -m http.server 5097 --directory work/fortune-impulso/dist
python prototypes/fortune-impulso/cascade-browser.py
```

O teste de navegador usa Playwright com Chromium. `CASCADE_URL` pode mudar o endereço. Ele verifica swipe real por CDP, bordas, cancelamento, retomada, captura, recebimento, menu, tamanhos de tela e ensaio. Capturas em `work/cascade/`.

Renderização Three.js com instâncias de esferas para bolinhas e pinos. Fontes, arte do palco e menu são os mesmos do projeto. Materiais, geometria e som são feitos por código, sem serviços de geração pagos.
