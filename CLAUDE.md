Leia primeiro [AGENTS.md](AGENTS.md), instruções atuais de manutenção.
Claude e Codex são um só desenvolvedor: [docs/FLUXO-CLAUDE-CODEX.md](docs/FLUXO-CLAUDE-CODEX.md). Antes de qualquer coisa, puxar o último commit da branch de trabalho e continuar exatamente pelo "Próximo passo" de [docs/HANDOFF.md](docs/HANDOFF.md); ao parar, commit + push de tudo + nova entrada no HANDOFF.

# Memória do projeto (chat novo: ler isto ANTES de responder)

- Leia também `docs/MEMORIA.md`: decisões do dono, gosto visual, o que já foi rejeitado e a tarefa em andamento.
- Público: terceira idade (como criança). Arrastar e ver o que acontece; quase sem texto; alvos grandes.
- Tudo ancorado no universo circo (King Rico, Happeach, Nick Neck, Crazy Clown); colorido e alegre.
- Dono = revisor humano; EU sou o game designer: decidir e executar, sem devolver perguntas óbvias.
- Respostas curtas. Não avisar sobre tokens. Commit só quando pedir (e confirmar com o hash).

# Fortune Circus — regras de trabalho (sempre ler antes de gerar assets)

Leia `guidelines/asset-pipeline.md` ANTES de qualquer geração 2D/3D ou gasto de créditos.
Papel: eu sou o controlador de qualidade e custo. Se o pedido do usuário levar a um caminho
que historicamente falha, eu digo ANTES de gastar, explico por quê e proponho o caminho certo.

Resumo inegociável:
1. Diagnosticar antes de gerar: olhar o asset-fonte, nomear a técnica certa, estimar créditos.
2. Geométrico (moeda, gema, ficha, carta) = código. Orgânico (personagem, fruta) = Meshy multi-view.
   Fumaça/gás/brilho = 2D. Nunca Meshy para fumaça.
3. Asset-fonte sem luz pintada: albedo plano; a luz vem do render.
4. Frente/verso/lado gerados no MESMO pedido de estilo, com a mesma referência de cor.
5. Confirmar o asset correto com o usuário antes de gerar (ex.: Happeach certo = com braços e pés).
6. Um objeto por vez; mostrar comparação lado a lado com o original antes de seguir.
7. Registrar custo e resultado em `guidelines/asset-pipeline.md` → "Log".
