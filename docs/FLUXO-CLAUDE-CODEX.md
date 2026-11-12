# Equipe: Claude, Gemini e Codex

Este é o acordo compartilhado para Claude, Gemini (incluindo Antigravity), Codex
e outros agentes que entrarem no projeto. O nome histórico do arquivo foi mantido
para preservar os links existentes.

## Mesma hierarquia, responsabilidade recíproca

Todos são colegas com a mesma autonomia e responsabilidade. Nenhum é chefe,
assistente ou aprovador obrigatório dos demais. O dono é a autoridade final
sobre direção, prioridades e aprovação do produto. Decisões aprovadas pelo dono
valem para toda a equipe e precisam estar nos documentos compartilhados.

Compartilhar não é só explicar ao dono o que foi feito. Cada agente deve deixar
seu trabalho acessível e compreensível aos colegas, e também consultar o que eles
produziram. Isso inclui código, assets, testes, decisões, descobertas, padrões,
ferramentas reutilizáveis, limitações conhecidas e instruções de execução.

## Antes de começar

1. Puxar os commits atuais e comparar a branch de trabalho com a integração.
2. Ler `AGENTS.md`, este fluxo, as skills aplicáveis e o topo do HANDOFF.
3. Conferir tarefas em andamento e consumir as decisões/alterações dos colegas.
4. Se houver trabalho paralelo, registrar a divisão de tarefas e arquivos no
   HANDOFF, issue ou canal compartilhado realmente disponível. Evitar editar os
   mesmos arquivos ao mesmo tempo. Não tratar uma anotação só local como aviso.
5. Usar a branch compartilhada da prévia (`codex/penalty-clown-preview`) para
   integração; isolar tarefas em branches próprias quando necessário e integrar
   preservando o trabalho dos outros. Não forçar push para apagar divergências.

## Durante o trabalho

- Reaproveitar módulos, assets e soluções existentes antes de criar outra versão.
- Compartilhar uma descoberta ou mudança de padrão no guia pertinente; o HANDOFF
  aponta para esse guia. Não criar conhecimento essencial exclusivo de uma sessão.
- Examinar evidências antes de corrigir ou desfazer uma decisão de outro agente.
- Quando houver sobreposição, coordenar a divisão pelo canal disponível; decisões
  de produto incompatíveis vão ao dono. Não transformar todo detalhe rotineiro
  em pedido de aprovação nem instituir um agente como supervisor dos outros.
- Comunicação direta só existe quando há integração disponível e autorizada.
  Sem isso, usar GitHub e documentos; não afirmar que avisou ou alinhou com um
  colega quando apenas escreveu algo na própria conversa.

## Ao encerrar ou passar o trabalho

1. Testar proporcionalmente ao risco, seguindo AGENTS.md; não repetir suítes ou
   builds completos só para compartilhar documentação.
2. Fazer commit e push de tudo que os colegas precisam executar ou continuar.
   Nada essencial somente em `work/`, na VM, em memória ou na conversa.
3. Atualizar o HANDOFF com tarefa, mudanças, decisões, testes, pendências reais,
   branch/commit e **próximo passo exato**. Identificar o que está local, na prévia
   e no oficial. Informações duráveis ficam no documento do assunto.
4. Atualizar as instruções compartilhadas quando o dono estabelecer uma regra
   permanente, para que os demais agentes possam seguir a mesma decisão.
5. Checkpoints de fontes/documentação usam `[skip ci]` quando não há publicação
   pretendida. Aprovado o escopo pelo dono, qualquer agente pode assumir a
   publicação, acompanhar o workflow e confirmar seu resultado real; evitar dois
   agentes publicando no mesmo destino simultaneamente.

## Endereço padrão de teste — decisão do dono

- Toda prévia para o dono deve apontar para **https://ric-lab.github.io/King-Rico/circus/**.
- Push à branch compartilhada usa `preview-pages.yml`; confirmar sucesso e entregar o link com `?demo=` pertinente. `?demo=off` abre o jogo normal.
- Firebase Hosting em **king-rico.web.app** continua sendo o oficial. Não oferecer links Firebase de prévia como se fossem os atualizados.
- Falha no Pages: corrigir/registrar o bloqueio; não trocar silenciosamente o link para outro host.
