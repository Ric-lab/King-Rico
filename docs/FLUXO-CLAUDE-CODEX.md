# Fluxo contínuo: Claude + Codex trabalham como um só

Atualizado em 03/11/2026. Vale para as duas IAs.

## Regra de ouro

Não existe "a parte do Claude" e "a parte do Codex". Existe **uma tarefa em
andamento**, e quem for chamado continua exatamente de onde o outro parou,
seja design, código, matemática, testes ou documentação.

**O GitHub é a única fonte.** Branch de trabalho atual:
`codex/penalty-clown-preview`. A `main` só recebe merge quando o dono autorizar
a publicação.

## Ao começar (sempre)

1. Puxar o último commit da branch de trabalho.
2. Ler a entrada mais recente de `docs/HANDOFF.md`: ela diz **o que está em
   andamento, o próximo passo exato e o que ficou pela metade**.
3. Continuar desse ponto. Não recomeçar, não refazer, não mudar de direção sem
   o dono pedir.

## Ao parar (sempre, mesmo no meio)

1. Commit e push de **tudo** que a tarefa usa. Nada essencial só em `work/`,
   no computador local ou no projeto de design.
2. Nova entrada no topo de `docs/HANDOFF.md` com:
   - **Tarefa em andamento** (o pedido do dono, com as palavras dele);
   - **Feito** (com o commit);
   - **Próximo passo exato** (arquivo e o que mexer);
   - **Pela metade / riscos**;
   - **Como conferir**.

## Limites de cada ambiente

Não é divisão de trabalho, só o que cada ambiente consegue executar. Se o
próximo passo depende do que o seu ambiente não roda, faça todo o resto e
anote no HANDOFF exatamente o que falta rodar.

- Claude (projeto de design): edita qualquer arquivo, gera arte (Meshy), mostra
  prévias ao dono; **não** roda `npm`, testes, emuladores nem build.
- Codex (clone local): roda tudo isso; **não** mostra a prévia ao vivo no editor
  de design.

## O que não vai para o Git

`dist/`, `runtime/`, bundles gerados, `work/`, credenciais e as prévias locais
do Claude (`*previa.dc.html`, `scraps/`, já no `.gitignore`).
