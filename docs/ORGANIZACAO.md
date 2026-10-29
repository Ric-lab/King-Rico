# Mapa do projeto

Organização revisada em **29/10/2026**. A estrutura de execução foi preservada
para manter imports do editor, URLs e jogos compatíveis.

| Local | Responsabilidade |
|---|---|
| `Home.dc.html`, `Fortune *.dc.html` | Fontes das telas; catálogo completo em `site/routes.json` |
| `King Rico.dc.html`, `KingRico.dc.html`, `support.js` | Componentes/loader DC com consumidores existentes |
| `ui/` | Cabeçalho, carteira visual, menu, controles, Home, abertura e PWA |
| `cloud/` | Login, transações, matemática e configuração pública Firebase |
| `games/` e renderizadores JS da raiz | Implementações específicas dos jogos |
| `assets/` | Artes, sprites, modelos e fontes visuais preservados |
| `components/`, `tokens/`, `ui_kits/`, `guidelines/*.card.html`, `styles.css` | Referências de design; não são a interface compartilhada de execução |
| `guidelines/asset-pipeline.md` | Processo e registro de produção de arte |
| `scripts/`, `.github/workflows/` | Build, auditorias, emulação e publicação |
| `tests/` | Lógica, regras, transações e navegador |
| `docs/` | Guias por assunto e relatórios identificados |
| `docs/historico/` | Planos, sincronizações e roteiros superados |
| `app/scripts/bulbs.json` | Dados auxiliares; não é um aplicativo Android completo |

`3D Library.html`, `Crown 3D Pilot.html` e `King Rico Animado.html` são estudos de
arte. Bounce, Claw, Race e Bridge permanecem guardados com suas fontes e rotas;
`/21` mantém compatibilidade com o 33. Arquivo parecido ou fora da Home não é,
por si só, lixo.

## Limpeza realizada

- Removido `game.html` da raiz: export empacotado de cerca de **11 MB** que não
  servia de fonte ao build. A URL pública continua sendo gerada como redirect.
- Removido `Canvas.dc.html`: template vazio, sem rota ou referência.
- `work/` e o export `/game.html` passaram a ser ignorados pelo Git.
- Planos antigos, manual original, QA antigo e notas de sincronização foram
  preservados no histórico. O manual da raiz agora direciona aos guias atuais.
- README, instruções de manutenção, desenvolvimento e publicação passam a
  descrever os oito jogos, a main e o workflow reais. Android nativo não é
  apresentado como implementação disponível. Documentação antiga de Fingo foi corrigida.

Não se reescreveu o histórico Git: os arquivos removidos continuam recuperáveis
nos commits antigos. Por isso a limpeza reduz a árvore atual, não elimina o
peso de blobs antigos de todos os clones.

## Evitar nova confusão

Guarde evidências de navegador e experimentos locais em `work/`. Documente o
comportamento atual no guia do assunto; registre propostas e auditorias com data
e versão. Consulte `git log origin/main` para commits, sem manter uma segunda
lista manual. Antes de apagar assets, confira imports dinâmicos, sprites, builds
e clientes antigos; uma busca textual não identifica todos os consumidores.
Não apagar dados de jogadores nem operações financeiras como limpeza de código.
