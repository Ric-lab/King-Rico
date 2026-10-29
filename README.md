# King Rico

Jogos casuais de moedas virtuais, com identidade de circo e interface em português.
Site oficial: **https://king-rico.web.app**. Repositório: **Ric-lab/King-Rico**;
branch de publicação: **main**. Firebase **king-rico**, plano Spark, sem Cloud Functions.

## Jogos e fontes

As páginas `.dc.html` são fontes editáveis. O catálogo de publicação é
[site/routes.json](site/routes.json); a Home escolhe quais jogos aparecem ao público.

| Na Home | Fonte | Endereço |
|---|---|---|
| Fortune Machine / Circus | [Fortune Circus.dc.html](<Fortune Circus.dc.html>) | `/circus` |
| Fortune Wheel | [Fortune Wheel.dc.html](<Fortune Wheel.dc.html>) | `/wheel` |
| Fortune Neck | [Fortune Neck.dc.html](<Fortune Neck.dc.html>) | `/neck` |
| Fortune Fingo | [Fortune Fingo.dc.html](<Fortune Fingo.dc.html>) | `/fingo` |
| Fortune Pênalti | [Fortune Penalty.dc.html](<Fortune Penalty.dc.html>) | `/penalty` |
| Fortune Clown | [Fortune Clown.dc.html](<Fortune Clown.dc.html>) | `/clown` |
| Fortune Flying Clown | [Fortune Flying Clown.dc.html](<Fortune Flying Clown.dc.html>) | `/flying-clown` |
| Fortune 33 | [Fortune 33.dc.html](<Fortune 33.dc.html>) | `/33` |

Bounce, Claw, Race e Bridge estão **guardados fora da Home**. Seus fontes e
endereços diretos continuam preservados. `/21` mantém a compatibilidade com o
Fortune 33. Não tratar esses protótipos como jogos oficiais novos.

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
