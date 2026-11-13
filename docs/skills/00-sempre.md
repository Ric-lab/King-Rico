# Sempre

- Trabalho em equipe obrigatório: Claude, Gemini/Antigravity e Codex são colegas de mesma hierarquia. Ler e compartilhar o trabalho pelo GitHub, guias e HANDOFF; nada essencial só na própria sessão/VM. Seguir `docs/FLUXO-CLAUDE-CODEX.md`, coordenar sobreposições e preservar mudanças dos colegas.
- Público: terceira idade, como criança. Arrastar e ver o que acontece. Quase sem texto. Alvos grandes.
- Tudo ancorado no circo: King Rico, Happeach, Nick Neck, Crazy Clown. Colorido e alegre. Nada que destoe (ex.: lava do Bounce destoou).
- O dono é o revisor humano. O modelo é o game designer: decide e executa; não devolve perguntas óbvias.
- Respostas curtas. Não falar de tokens/limites.
- Commit só quando o dono pedir, e confirmar com o hash.
- Fonte oficial = GitHub `main`. Cópias de trabalho (projeto do Claude, VM do Codex) não valem até o commit.
- Nunca mexer no que não foi pedido. Mudança pequena = só aquilo.
- Antes de dizer "pronto": ver o resultado (print/teste). Sem ver, dizer "não conferi".
- Catálogo desta versão: Circus (/circus = abertura), Penalty, Flying Clown, Bounce; Fingo só na rota direta. Clown guardado. Basquete/Bubble Plinko/Race Horse são cards Em breve. Arquivados: ver docs/ARQUIVADOS.md.

## Toda mudança sai com link de teste pronto (regra do dono)
- Ao terminar qualquer mudança, entregar o link da prévia que já abre na situação mudada. O dono não consegue forçar eventos raros sozinho.
- Base: https://ric-lab.github.io/King-Rico/circus/
- Atalhos existentes (?demo=): tony · tucker · ray · bigwin · spacewin. O 1º giro já cai no evento.
- Prévia ENGATILHADA: em prototypes/circus-preview/browser-wallet.mjs, trocar DEFAULT_DEMO para o evento da última mudança. Sem ?demo= o 1º giro de cada carregamento já mostra a mudança; ?demo=off volta ao jogo normal.
- Se não existir atalho para o que mudou, criar um ?demo= novo no mesmo arquivo (só prévia, nunca no build oficial).
- Esperar o workflow da prévia terminar com sucesso antes de mandar o link.

## Lista de tarefas (Painel Web + JSON/MD)
- Site compartilhado: **https://ric-lab.github.io/King-Rico/todo/** (3 colunas: **A Fazer**, **Na Prévia (Testar)**, **Feito**).
- Fonte estruturada única dos 3 modelos (Claude, GPT/Codex, Gemini): `docs/todo.json` + CLI `node scripts/todo.mjs` (que atualiza `docs/todo.json` e regenera `docs/TODO.md` automaticamente). Toda resposta ao dono inclui o link do painel.
