# Fortune Circus

Slot game (cassino social, sem dinheiro real) com King Rico e Happeach.

- `Home.dc.html` — tela inicial
- `Fortune Circus.dc.html` — o jogo
- `King Rico.dc.html` — animações do King Rico
- `3D Library.html` — biblioteca 3D
- `DESIGN-SYSTEM.md` — guia do design system (cores, tipo, luz, animação, tabela, regras para terceira idade)
- `MANUAL.md` — manual completo do projeto (lições, geração de assets, publicação)

App Android (Capacitor), testes da matemática e APK de teste: veja `docs/ANDROID.md`.

Abra os arquivos `.dc.html` direto no navegador (precisam de `support.js` na mesma pasta). Para servir localmente: `npx serve .`

> A chave da API do Meshy foi removida dos scripts (`MESHY_API_KEY`).


## Jogos
- **Fortune Circus** — slot 3×3 (`Fortune Circus.dc.html`)
- **Fortune Wheel** — roda de 12 casas, escolha 1 símbolo e gire com swipe; paga x10 (`Fortune Wheel.dc.html`)

- **Fortune 33** — cartas numeradas, você contra a banca (`Fortune 33.dc.html`)
- **Fortune Flying Clown** — estoure balões e escolha quando pegar o prêmio (`Fortune Flying Clown.dc.html`)

## Guardados (fora da Home)
- **Fortune Bounce** (`Fortune Bounce.dc.html`)
- **Claw Machine** — máquina e prêmios 3D do Happeach (`Fortune Claw.dc.html`). Faltam os 3 modelos .glb no projeto.
- **Fortune 21** — versão antiga do Fortune 33 (`Fortune 21.dc.html`)
- **Fortune Hoop** (`Fortune Hoop.dc.html`)
- **Fortune Race** — corrida de 5 bolinhas, aposta no vencedor ou 1º e 2º (`Fortune Race.dc.html`, prévia em `Fortune Race Preview.html`). Pausado: bolas ainda lentas. Ver [docs/FORTUNE-RACE.md](docs/FORTUNE-RACE.md).

Detalhes e garantias de persistência: [Fortune 33 e Flying Clown](docs/FORTUNE-21-E-FLYING.md).

## Login e dados
Login Google, saldo/progresso no Firestore e Google Analytics usam o plano gratuito Firebase Spark. A integração está em `cloud/`. Os sorteios são calculados no navegador: esta versão usa moedas virtuais e não garante proteção contra resultados adulterados.
Preparação, emuladores e ativação real: [docs/FIREBASE.md](docs/FIREBASE.md).
Indicadores e eventos iniciais: [docs/ANALYTICS.md](docs/ANALYTICS.md).
Sem a configuração Firebase (`enabled: true`), o jogo continua sendo o protótipo local.

Atualizações do site pelo GitHub: [docs/PUBLICACAO.md](docs/PUBLICACAO.md). Depois da conexão inicial, alterações em `main` passam pelos testes e são publicadas no Firebase Hosting.

Claw Machine: [mecânica, persistência e modelo 3D](docs/CLAW-MACHINE.md).
