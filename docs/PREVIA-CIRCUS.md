# Circus: entrega completa da prévia

Atualizado em 03/11/2026. Branch de trabalho: `codex/penalty-clown-preview`.
Não publicada no Firebase. A base é a prévia v79, com as sombras laterais do
commit `955e081` e agora com os fontes que ativam os nove tambores.

## Rodar a prévia visual

Requer Node 22.23.3, npm e Python 3. A partir da raiz do clone:

```sh
npm ci
npm run build:preview
python3 -m http.server 4178 --directory dist
```

Abra http://localhost:4178/Fortune%20Circus.dc.html . Para outro dispositivo,
use o endereço da máquina acessível na mesma rede. O servidor estático também
resolve as rotas do catálogo. Não é preciso usar o exportador da VM ou Sites.

Esta prévia permite testar Circus e as atrações do parque sem login: usa uma
carteira fictícia identificada como `park-preview`, salva apenas neste navegador.
O modelo local está em `prototypes/circus-preview/`; não é o cliente financeiro
de produção. Wheel, Neck, 33 e os protótipos guardados continuam no repositório;
para validar a integração nativa de todos os jogos use `npm run emulators`,
conforme [Desenvolvimento](DESENVOLVIMENTO.md).

`build:preview` gera apenas `dist/` e artefatos ignorados. O build de produção
continua usando Google e Firestore reais e não incorpora a carteira fictícia.
Depois da conferência da prévia, `npm run build:production` restaura esse build.
Não publique `dist/` gerado pelo comando de prévia.

## Onde editar

- `Fortune Circus.dc.html`: cria `.park-reel-paper`, as nove casas, sequência
  da tabela de prêmios, tempos de parada e animação de cada tambor.
- `ui/park/reel-tape.js`: `HEIGHT=146`, fita ordenada por casa, cálculo das
  paradas e projeção 2D de recuperação. Não troca símbolos no meio do trajeto.
- `ui/park/cabinet.css`: posições das nove casas, papel, moldura e espaçamento.
- `ui/park/index.js`: instala layout, óptica, profundidade e projeção parada.
  Mantém a integração financeira nativa e a entrada antecipada das atrações.
- `ui/park/reel-optics.*` e `drum-depth.js`: superfície e sombras em Three.js
  local, com recuperação 2D. Veja [Iluminação](ROLOS-ILUMINACAO.md).
- `scripts/build-preview.mjs`: monta a prévia com os mesmos fontes de interface
  e o adaptador fictício. Não contém caminhos absolutos para esta VM.

O asset do papel, atlas, ingresso e Three.js são copiados pelo build normal.
Nenhum arquivo de `work/`, `dist/`, credencial ou bundle exportado é necessário
no Git para reconstruir a prévia.

## Conferência

```sh
node --test tests/reel-tape.test.cjs tests/adapters.test.cjs
# Com build:preview e servidor estático abertos:
python3 tests/circus_depth_browser.py
```

O navegador verifica os nove tambores, símbolos confirmados, sombras, giro,
recuperação sem WebGL e telas de 360, 390 e 430 px. Testes de carteira e regras
nativas usam os emuladores; a prévia visual não comprova login real.

Enviar commits para esta branch não publica o site. O workflow de Hosting
publica ao atualizar `main`; não mesclar sem autorização para publicação.

## Prévia online

O workflow `.github/workflows/preview-channel.yml` atualiza o canal Firebase
`previa` a cada push em `codex/**`. O endereço é estável enquanto o canal existir;
cada publicação renova sua validade por 30 dias. URL: aguardando a primeira
publicação confirmada (não confundir com o site oficial king-rico.web.app).

A URL real aparece no resumo e nos logs do workflow. O mesmo job verifica
os tambores e um giro com moedas fictícias pelo navegador e guarda capturas.
Todos compartilham a mesma versão visual; o saldo de teste é local a cada
navegador. Evite editar duas branches codex ao mesmo tempo: ambas atualizam
o mesmo canal. Produção e regras do Firestore não são publicadas neste fluxo.
