# Manutenção do King Rico

**OBRIGATÓRIO antes de qualquer tarefa (qualquer modelo):** puxar o último commit e ler `docs/skills/README.md`, `docs/skills/00-sempre.md`, a skill da área e `docs/HANDOFF.md`. Na resposta final, citar as skills lidas. Ao parar: commit + HANDOFF.

Leia `README.md` e `docs/README.md` antes de alterar o projeto. São o ponto de
entrada atual; `docs/historico/` contém registros antigos, não tarefas aprovadas.

## Regra permanente: equipe e conhecimento compartilhado

Claude, Gemini (inclusive pelo Antigravity) e Codex têm a **mesma hierarquia,
autonomia e responsabilidade**. O dono decide a direção e aprova o produto;
nenhum agente é chefe ou aprovador obrigatório dos demais.

Antes de agir, ler também `docs/FLUXO-CLAUDE-CODEX.md`, consumir as mudanças e
pendências dos colegas e conferir se há trabalho paralelo. Compartilhar pelo
GitHub o código, assets, decisões, descobertas, padrões e ferramentas úteis —
não apenas a conclusão da tarefa. Atualizar o guia pertinente e o HANDOFF no
mesmo trabalho. Nada essencial pode ficar só na conversa, memória ou VM de um agente.

Quando houver trabalho paralelo, explicitar escopo/arquivos e coordenar a divisão
em um registro ou canal realmente compartilhado. Não sobrescrever mudanças de
outro agente nem presumir que ele viu uma mensagem. Todos têm o dever recíproco
de ler, contribuir, revisar e dar continuidade ao trabalho dos demais. Detalhes
operacionais ficam no fluxo entre agentes, sem criar regras conflitantes locais.

## Fontes e limites

- Páginas `.dc.html` e `site/routes.json` definem as telas publicadas. A Home
  abre no Circus; `/park` reúne as atrações. Jogos fora do ar: `docs/ARQUIVADOS.md`.
- `ui/` é a interface compartilhada em execução. `components/`, `tokens/`,
  `ui_kits/` e os cards HTML de `guidelines/` são referências de design.
- Nunca editar `dist/`, `runtime/` ou `cloud/client.js` como fonte. O build gera
  `/game.html` como redirecionamento; não commitar o export empacotado do editor.
- Os dois arquivos `King Rico.dc.html` e `KingRico.dc.html` têm consumidores;
  não apagar um deles apenas por terem nomes parecidos.
- Assets podem ser referenciados por nomes montados em código. Busca textual
  sem resultados não prova que uma imagem, sprite ou modelo pode ser apagado.

## Compatibilidade

Preserve login Google persistente, saldo compartilhado no Firestore, IDs de
operação e recuperação após recarga. Não importar moedas antigas do localStorage.
Crédito financeiro confirmado e animação do saldo são responsabilidades distintas:
um erro visual não pode perder nem duplicar moedas.

Mudanças na matemática exigem conferir `cloud/engine.cjs`, módulos do jogo,
`firestore.rules`, interface e testes; rodadas já pagas mantêm suas versões.
Firebase deve continuar no Spark, sem Blaze ou Cloud Functions. Preserve o
publicador REST de regras e o workflow existente. Configuração Web pública não
é chave administrativa; credenciais temporárias e arquivos de conta de serviço
nunca entram no Git.

## Trabalho e entrega

Use `docs/DESENVOLVIMENTO.md` para testes proporcionais. Builds apagam e recriam
`dist/`: não executar testes que geram build em paralelo ao navegador de integração.
Gere produção depois da integração. Quando publicar, confirme o resultado real
em Actions e no site, preservando commits que tenham chegado à main.

Para arte, leia `guidelines/asset-pipeline.md` e `DESIGN-SYSTEM.md`. Reaproveite o
padrão visual existente. Evidências locais ficam em `work/`, ignorado pelo Git.
Documente comportamento atual no guia pertinente; propostas e relatórios antigos
precisam de data e identificação clara, sem virar instruções permanentes.


## Manter os padrões documentados

Ao finalizar uma mudança aprovada, confira no mesmo commit o guia do assunto:
`DESIGN-SYSTEM.md` para direção visual, `ui/CONTROLS.md` para controles comuns,
`docs/PARQUE.md` para Circus/parque e `assets/machine/README.md` para peças da
máquina. Atualize somente o que mudou e remova orientações contraditórias.
Diferencie estado publicado, prévia, proposta e tentativa rejeitada. Geometrias
e comportamentos antigos nos registros não devem voltar por engano ao produto.
Reutilize os módulos de `ui/`; documentos e tokens do editor não substituem os
componentes ativos. Uma mudança só de documentação exige conferir coerência,
links e diff, sem repetir partidas nem publicar outro build do jogo.

## Estratégia permanente de iteração econômica (decisão do dono, 09/11/2026)

- Pequeno ajuste visual: editar só o necessário, conferir a tela e executar apenas
  o teste específico. Não repetir suítes completas, leituras extensas ou builds
  de produção em cada detalhe sem uma dependência concreta que os exija.
- Entregar a prévia para avaliação cedo. Agrupar ajustes aprovados para uma única
  publicação e conferência completa, evitando um deploy a cada refinamento.
- Commit/push de fonte para colaboração é diferente de publicar: usar `[skip ci]`
  em documentação e checkpoints que não devem disparar deploy. Não chamar uma
  URL remota antiga de prévia atualizada; informar quando a amostra é só local.
  Se o dono precisar testar no celular, publicar o lote no canal de prévia.
- Saldo, pagamentos, matemática e regras exigem os testes financeiros e de
  persistência pertinentes. Preservar as verificações obrigatórias da publicação.
- Reaproveitar o contexto já lido, limitar chamadas e saídas ao necessário e
  comunicar marcos úteis; evitar mensagens repetitivas só para dizer que aguarda.
