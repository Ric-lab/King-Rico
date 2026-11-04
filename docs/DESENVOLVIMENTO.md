# Desenvolvimento e testes

## Ambiente local

Use Node **22.23.3** (`.nvmrc`), npm e **Java 21** para o Firestore emulado.
O navegador da suíte usa Python, Playwright e Chromium em `/usr/bin/chromium`;
um ambiente com outra instalação precisa ajustar esse caminho antes de rodar.
Instale o pacote Python `playwright` no ambiente de testes.

```sh
nvm use
npm ci
npm run emulators
```

Abra `http://127.0.0.1:5000`. Auth usa 9099 e Firestore 8085. O projeto de
emulação é `demo-king-rico`, com identidade fictícia e sem Analytics real.
O primeiro uso baixa o emulador oficial e o guarda em `.firebase-cache/`.
Não apontar testes automatizados para contas e moedas de produção.

## Ordem das verificações

1. `npm test`: lógica, adaptadores, interface e build.
2. `npm run test:rules`: inicia seus emuladores e testa regras e transações.
3. `npm run test:integration`: gera o build emulado, inicia emuladores e executa
   a integração, incluindo navegador. Encerre instâncias que já ocupem as portas.
4. `npm run build:production`: gerar o artefato final depois da integração.

Escolha verificações proporcionais à mudança. Documentação e remoção de um
export sem uso não exigem repetir partidas de todos os jogos; contas, matemática
e persistência exigem os testes pertinentes de regras e retomada.

**Não rodar builds em paralelo com testes de navegador.** Todos escrevem no mesmo
`dist/`. `npm test` também inclui um teste que gera produção: se executado durante
a integração, pode trocar a configuração emulada por produção no meio do teste.
Depois de testes unitários, gere novamente `npm run build:emulator` antes de usar
um Hosting emulado já aberto.

Com emuladores já disponíveis e build emulado pronto:

```sh
node --test tests/integration.mjs
python3 tests/park_browser.py
```

A suíte atual do navegador é `tests/park_browser.py`; `KING_RICO_TEST_URL`
permite escolher outra porta local. Os módulos anteriores de navegador preservam
as verificações detalhadas de versões anteriores e não definem o catálogo atual.
Veja também o guia do jogo afetado, como [Fingo](FINGO-CARTELA.md). O fluxo local não comprova login
Google real ou publicação: confira esses pontos no ambiente oficial quando cabível.

## Fontes e saídas

`npm run build:emulator` sempre usa conta fictícia.
`npm run build:production` exige `cloud/firebase-config.production.js` habilitado
para `king-rico` e recusa emuladores. `npm run build` admite configuração local;
para publicar, prefira sempre o comando explícito de produção.

Não commitar `dist/`, `runtime/`, `cloud/client.js`, `cloud/firebase-config.js`,
credenciais ou evidências em `work/`. Não editar bundles para corrigir jogos:
edite os fontes `.dc.html`, `ui/`, `games/` e `cloud/`, conforme o caso.
O build gera `/game.html` como redirecionamento compatível para `/circus`.

A integração publica React, Babel, Three.js e Matter.js locais com versões
fixadas no lockfile. Novas páginas precisam de rota, build, carteira, menu e teste;
um HTML isolado não é um jogo integrado.
