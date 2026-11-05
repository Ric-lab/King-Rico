# King Rico

Jogos casuais de moedas virtuais, com identidade de circo e interface em português.
Site oficial: **https://king-rico.web.app**. Repositório: **Ric-lab/King-Rico**;
branch de publicação: **main**. Firebase **king-rico**, plano Spark, sem Cloud Functions.

## Jogos e fontes

As páginas `.dc.html` são fontes editáveis. O catálogo de publicação é
[site/routes.json](site/routes.json); a Home escolhe quais jogos aparecem ao público.

| Jogo / rota preservada | Fonte | Endereço |
|---|---|---|
| Fortune Machine / Circus | [Fortune Circus.dc.html](<Fortune Circus.dc.html>) | `/circus` |
| Parque | [Home.dc.html](Home.dc.html) | `/park` |
| Fortune Pênalti | [Fortune Penalty.dc.html](<Fortune Penalty.dc.html>) | `/penalty` |
| Flying Clown | [Fortune Flying Clown.dc.html](<Fortune Flying Clown.dc.html>) | `/flying-clown` |
| Fortune Bounce | [Fortune Bounce.dc.html](<Fortune Bounce.dc.html>) | `/bounce` |
| Fingo (somente rota direta) | [Fortune Fingo.dc.html](<Fortune Fingo.dc.html>) | `/fingo` |

Circus é a tela inicial (`/circus`, com `/home` compatível). O **parque** em
`/park` reúne Pênalti, Flying Clown e Bounce. Basquete, Bubble Plinko e Race Horse
têm cards **Em breve**, sem interação nem cobrança. Toque nos ingressos, use o
botão Parque ou deslize para baixo a partir do cenário do Circus para abri-lo.
A entrada custa um ingresso ou 25 moedas; veja [as regras do parque](docs/PARQUE.md).

Clown foi guardado a pedido do dono em 05/11; fontes e rodadas não foram apagados.
Wheel, Neck, 33, 21, Claw, Race e Bridge continuam arquivados, sem rota pública.
O catálogo do build está em `site/routes.json`; a lista completa em
[Arquivados](docs/ARQUIVADOS.md). Fingo fica acessível diretamente, fora do parque.

## Rodar localmente

Use Node indicado em [.nvmrc](.nvmrc) e Java 21 para o Firestore emulado:

```sh
nvm use
npm ci
npm run emulators
```

Abra **http://127.0.0.1:5000**. O ambiente usa contas fictícias e o projeto
`demo-king-rico`, sem mexer nas moedas reais. Não abra o HTML diretamente como
substituto desse ambiente. Requisitos do navegador e sequência dos testes estão
em [Desenvolvimento](docs/DESENVOLVIMENTO.md).

## Onde mexer

- Interface em uso: `ui/`, páginas `.dc.html` e renderizadores em `games/`.
- Conta, carteira e matemática: `cloud/`, `firestore.rules` e `tests/`.
- Arte: `assets/`; referências de design: `components/`, `tokens/`, `guidelines/` e `ui_kits/`.
- Build e publicação: `scripts/`, `site/routes.json`, `firebase.json` e `.github/workflows/`.
- `dist/`, `runtime/` e bundles Firebase são gerados; não editar nem versionar.

Comece pelo [índice de documentação](docs/README.md), pelas
[instruções de manutenção](AGENTS.md) e pelo [mapa do projeto](docs/ORGANIZACAO.md).
A direção visual está no [Design System](DESIGN-SYSTEM.md).

## Publicar

O workflow existente testa, gera o build de produção, publica as regras pelo
publicador REST e publica o Hosting ao atualizar `main`. Confirme os dois jobs
no GitHub Actions; enviar um commit não comprova publicação.
Veja [Publicação](docs/PUBLICACAO.md). O último commit deve ser consultado no Git,
e não em um arquivo de sincronização escrito à mão.
