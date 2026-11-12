# Prévia padrão: GitHub Pages

**Abra:** https://ric-lab.github.io/King-Rico/circus/

Decisão do dono: usar SEMPRE esse host nos links de teste. O site oficial segue
https://king-rico.web.app, com login e carteira reais. A prévia usa moedas fictícias.

- Demonstração da última mudança: endereço acima, com o primeiro giro engatilhado.
- Jogo normal: https://ric-lab.github.io/King-Rico/circus/?demo=off
- Eventos específicos: `?demo=tony`, `?demo=tucker`, `?demo=ray`,
  `?demo=bigwin` e `?demo=spacewin`.
- Atualização: push na branch `codex/penalty-clown-preview` → workflow
  **Prévia no GitHub Pages** (`preview-pages.yml`). Só anunciar a revisão após sucesso.
- Os testes que verificam giros naturais precisam de `?demo=off`; não remover
  a demonstração padrão para fazê-los passar. Regressões completas ficam locais
  ao runner; no host público, apenas HEAD.
- O canal Firebase é legado/manual. Os endereços abaixo são histórico da migração;
  não devem ser usados como links atuais para o dono.

---

## Histórico da migração e do canal anterior

## Recuperação: prévia no GitHub Pages

Workflow novo: `.github/workflows/preview-pages.yml`, branch compartilhada
`codex/penalty-clown-preview`. O endereço será o `page_url` confirmado pelo
GitHub Actions; não confundir preparação com deploy concluído.

O build continua sendo a carteira fictícia, sem login/saldo de produção.
No Pages, os URLs gerados recebem o `base_path` do projeto (normalmente
`/King-Rico`). Comando local: `npm run build:preview -- --base=/King-Rico`.
A suíte completa roda no runner; um teste adicional cobre caminhos, assets,
entrada nas atrações, giro, replay e recarga sob o subdiretório.

Firebase preview fica manual nesta branch. O projeto oficial `king-rico` e
seu workflow continuam independentes. Se o Pages negar configuração, o dono
pode precisar selecionar **Settings → Pages → Source → GitHub Actions** e
permitir a branch de integração no ambiente `github-pages`. Respeitar eventuais
restrições existentes; não anunciar disponibilidade antes do sucesso real.

---

## Transferência Spark: testes locais obrigatórios

A franquia mensal do projeto de prévia atingiu 10/10 GB (aviso recebido em
11/11/2026). Isso é separado do projeto oficial king-rico. O fluxo anterior
baixava o jogo do Firebase para cada contexto dos 12 navegadores automatizados.

O workflow agora executa a suíte completa sobre `dist/` no runner do GitHub,
**antes** de publicar. Não definir `KING_RICO_TEST_URL` com o canal público para
a suíte completa. Depois do deploy, somente HEAD de rotas e arquivos confirma
a disponibilidade sem baixar os assets. Não retirar testes para economizar GB.

O patch não restaura a cota consumida. Excluir versões libera armazenamento,
não transferência do mês. Um checkpoint `[skip ci]` não reativa o canal público.
Para um link antes da renovação, é preciso outra hospedagem ou uma mudança de
plano expressamente autorizada; manter produção no Spark. Ver HANDOFF para o
estado do incidente e o próximo passo.

---

# Circus: entrega completa da prévia

Atualizado em 09/11/2026. Branch de trabalho: `codex/penalty-clown-preview`.
Prévia compartilhada em canal Firebase isolado, com três fitas contínuas.
O protótipo de nove tambores foi descartado. Tony v4 pode ser testado em
`/circus?demo=tony`: o primeiro giro por toque demonstra as três patadas.
Oficial e regras de produção permanecem sem publicação desta mudança.

## Tucker em avaliação

Demo: https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus?demo=tucker
Primeiro giro por toque. Prepara 3 Happeach fictícios apenas uma vez neste
navegador e demonstra perda de 1; recarregar preserva o restante. A arte v1
é provisória e a quantidade/frequência oficial ainda não foi definida.

## Ray em avaliação

Demo: https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus?demo=ray
Primeiro giro por toque. Pega até 1 ingresso e foge pela esquerda; com zero,
faz a cena sem perda. Sem sorteio natural ou alteração do site oficial.

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

## Canal Firebase anterior — histórico/manual

**Abra:** https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus

Publicação real confirmada em 03/11/2026, commit `2d0b14a`, pelo
[workflow concluído](https://github.com/Ric-lab/King-Rico/actions/runs/41647536617).
O teste de navegador remoto confirmou os nove tambores prontos, giro com moedas
fictícias, recuperação 2D e três tamanhos de tela, sem assets ausentes.

O workflow `.github/workflows/preview-channel.yml` atualiza o canal `previa`
do projeto isolado `king-rico-previa-1408805633` a cada push em `codex/**`.
O endereço se mantém enquanto o canal existir; cada deploy renova a validade
por 30 dias. A URL e o commit aparecem no resumo; capturas ficam nos artefatos.

Claude e dono veem a mesma versão de interface. O saldo de teste é local a cada
navegador; não compartilha nem acessa a carteira de produção. Não é preciso
executar npm no ambiente do Claude. Outros caminhos: `/park` para o parque e
`/Fortune%20Circus.dc.html` para a página direta. Assets e Three.js são locais.

Evite alterar duas branches codex simultaneamente: ambas atualizam o mesmo canal.
O projeto oficial `king-rico`, seu live e regras Firestore não são publicados
por esse workflow. Autenticação e histórico: [Configuração](PREVIA-AUTENTICACAO.md).
