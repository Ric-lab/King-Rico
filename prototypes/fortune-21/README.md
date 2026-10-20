# Fortune 21

Prévia independente do King Rico. Jogador contra a banca, duas ações: pedir carta ou parar. Sem física, PvP ou etapas extras.

## Regras

- Baralho de 52 cartas numeradas: 1 a 9, e quatro cartas de valor 10 por símbolo. As figuras tradicionais também aparecem como 10, para que toda carta mostre seu valor.
- A carta 1 vale 1 ou 11 automaticamente. Coroa, diamante, trevo e circo são os quatro símbolos, sem alterar os pontos.
- A banca compra abaixo de 17 e para em qualquer 17 ou mais, inclusive 17 com carta 1 valendo 11.
- Vitória recebe 2× a aposta, 21 com duas cartas recebe 2,5×. Ambos incluem a aposta. Empate devolve a aposta. A banca verifica um 21 inicial antes da vez do jogador.
- Sem dobrar, dividir mãos ou seguro. Chegar a 21 passa automaticamente para a banca.

## Persistência e escopo

1.000 moedas de demonstração, em um namespace exclusivo. Nunca lê, importa ou escreve o saldo oficial ou o dos outros protótipos. Não usa Firebase. O saldo oficial, login e seis jogos publicados permanecem no projeto oficial.

Cada ação usa Web Locks, revisão e ID da rodada. Um único snapshot local inclui débito, cartas, resultado e crédito, salvo antes da animação. Recarregar retoma a mão; repetir a liquidação é inócuo. Sem servidor, este saldo de teste não é resistente à adulteração pelo próprio jogador. Falhas de leitura ou escrita bloqueiam novas ações.

## Arte

Fontes Baloo 2 e Rammetto One, ícone/menu compartilhado, símbolos, King Rico sentado, palco da Wheel, carteira e botão nativos do King Rico. Cartas e mesa são geometria/CSS, sem geração externa e sem créditos. A reutilização das artes preserva sua cor e proporção.

## Construir e conferir

Node 22 e dependências da raiz:

```sh
node --test prototypes/fortune-21/state.test.mjs
node scripts/build-21.mjs work/fortune-21/dist
```

`browser-test.py` usa Chromium/Playwright para verificar fluxos, toque, retomada e concorrência entre abas. Precisa de um servidor estático apontado para o build.
