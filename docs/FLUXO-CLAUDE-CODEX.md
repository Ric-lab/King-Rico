# Fluxo contínuo: Claude (design) + Codex (código)

Atualizado em 03/11/2026. Vale para as duas IAs e para quem pedir trabalho a elas.

## Regra de ouro

**O GitHub é a única fonte.** Ninguém começa sem puxar o último commit e
ninguém termina sem enviar. Nada importante pode ficar só em `work/`, no
computador do Codex ou no projeto do Claude.

Branch de trabalho atual: `codex/penalty-clown-preview`. A `main` só recebe
merge quando o dono autorizar a publicação.

## Quem faz o quê

| | Claude (projeto de design) | Codex (clone local) |
|---|---|---|
| Faz bem | Visual, arte, layout, animação, assets (Meshy), cópia, prévias para o dono ver | Matemática, carteira/Firestore, testes, build, emuladores, publicação |
| Não consegue | Rodar `npm`, testes, emuladores ou build | Ver/aprovar visual com o dono em tempo real |
| Entrega | Commit com fontes `.dc.html`, `ui/`, `assets/` + nota no HANDOFF | Commit com código validado (testes passando) + nota no HANDOFF |

Mudança visual que toca economia, carteira ou regras: Claude faz o visual,
anota no HANDOFF e o Codex valida/ajusta a lógica e roda os testes.

## Ciclo de cada tarefa

1. **Puxar**: ler `docs/HANDOFF.md` e o último commit da branch.
2. **Fazer** só a parte do seu papel (tabela acima).
3. **Enviar**: commit pequeno, mensagem clara, push na branch de trabalho.
4. **Passar a vez**: acrescentar uma entrada no topo de `docs/HANDOFF.md`
   (o que mudou, o que falta, o que o outro precisa conferir).

Se as duas IAs precisarem mexer no mesmo arquivo, uma termina e envia antes
da outra começar. Sem edição simultânea do mesmo arquivo.

## O que não vai para o Git

- `dist/`, `runtime/`, bundles gerados, `work/`, credenciais.
- Prévias locais do Claude: `*previa.dc.html`, `scraps/` (já no `.gitignore`).
