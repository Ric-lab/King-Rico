---
name: king-rico-art-direction
description: Direção de arte e acabamento dos jogos King Rico. Use ao criar ou melhorar aparência, composição, materiais Three.js, assets, swipe e animação, especialmente após feedback de que o jogo está feio, bobo ou sem impacto.
---

# Direção de arte King Rico

Use junto da skill `../frontend-design/SKILL.md`. Ela é orientação pública de
design da Anthropic; não reproduz o Claude Design e não altera o modelo.

## Contexto antes de decisões

Leia `DESIGN-SYSTEM.md` e, ao criar assets, `guidelines/asset-pipeline.md` na raiz
do repositório. Consulte [o gosto e o feedback do autor](references/taste.md).
Use o contexto já conhecido sem pedir que o usuário repita o briefing. O pedido
atual prevalece sobre todos esses documentos.

Circus, Neck e Wheel são referências positivas escolhidas pelo autor. Examine o
trecho relevante do jogo e a arte real; não substitua isso por uma descrição
genérica de cassino. Para estudar gesto, peso ou ritmo, examine movimento real
quando houver acesso. Não afirme ter assistido a gameplays a partir de textos.

## Começar pela experiência e pela composição

Defina em poucas linhas a ação principal, o objeto que deve atrair o olhar e a
sensação pretendida. Nomeie uma referência concreta para forma/material e outra
para movimento. Use primeiro as referências do projeto; evite pesquisa longa
quando elas já resolvem o pedido.

Em um jogo de bolinhas, elas e a interação precisam protagonizar a tela. Uma
moldura cara não compensa objetos pequenos e uma área de jogo sem interesse.
Planeje enquadramento, escala e espaço útil antes de partículas e acabamento.
Um ajuste localizado deve continuar localizado; não redesenhe o jogo inteiro.

Para uma mudança ampla, faça cedo uma amostra representativa: objeto, cenário,
iluminação e interação principal juntos. Para materiais, use uma cena de estudo
e também o objeto no tamanho real do jogo. A amostra serve para orientar o
trabalho e receber feedback, sem criar uma etapa obrigatória de aprovação.

## Construir uma linguagem visual coerente

Preserve Baloo 2, Rammetto One, ícones e menu existentes. A recomendação genérica
contra rótulos em caixa alta não substitui o padrão King Rico. Ouro, roxo e
vermelho devem seguir a marca; não invente outra identidade para parecer original.

Escolha um contraste de materiais que ajude a ler os objetos. Separe metal,
vidro, borracha e tecido por reflexão, rugosidade, espessura e resposta ao contato,
sem depender de brilho em tudo. Silhueta e volume devem funcionar antes dos
detalhes. Reduza enfeites que disputem atenção com a jogada.

Geometria simétrica, incluindo bolas, é adequada a Three.js. Use luz e material
para produzir volume. Não cole luz pintada sobre um objeto que será iluminado
novamente. Use geração de imagens para assets que realmente se beneficiem dela,
seguindo o pipeline e as autorizações da conversa. Registre origem e custo.

No celular, priorize uma forma e um reflexo legíveis. Muitos reflexos minúsculos
podem parecer facetas ou ruído; um material bonito ampliado ainda pode falhar em
15 pixels. Cor não deve desaparecer sob luz branca. Preserve a correspondência
entre geometria visível, colisão e gesto.

## Dar causa aos detalhes

Use uma sequência clara: ação → antecipação curta → contato → consequência →
assentamento. O pulso do Circus informa que o toque acionou a máquina. Um alvo
que recebe peso pode ceder; uma trava que abre deve liberar objetos visíveis.

Faça movimento, luz e som responderem ao mesmo evento e no lugar do contato.
Escolha deformação compatível com o material: vidro rígido não vira gelatina.
Evite celebração indiferenciada, brilho constante e partículas sem função.
Respeite as opções de som, vibração e redução de movimento.

Teste swipe no toque real, inclusive reagarre, cancelamento e inversão na borda.
Uma partida simples pode ter controle expressivo; não acrescente botões ou
planejamento só para aumentar complexidade. Habilidade deve ter influência
compreensível sobre o resultado, sem perdas inventadas depois do gesto.

## Conferir o que foi entregue

Compare antes e depois no mesmo enquadramento e tamanho de celular. Confira
repouso, ação e resultado; veja também um trecho em movimento. Identifique o
maior problema que ainda aparece e faça uma correção focada. Reuse servidor e
navegador, evitando rodadas longas de ajustes sem mudança visual relevante.

Capture erros JavaScript, recursos quebrados e erros WebGL no console. Faça as
verificações de controle e persistência pertinentes à mudança. Não declare FPS
em aparelho físico com base no renderizador de software da VM.

Testes funcionais não comprovam beleza ou diversão. Não anuncie uma versão como
esteticamente aprovada por ter passado em testes. Registre a avaliação do usuário
separadamente da hipótese do agente; ausência de reclamação não é aprovação.

## Continuidade

Preserve os outros jogos, login, sessão, menu, saldo e publicador REST de regras
quando tocar no projeto oficial. Mantenha Firebase Spark. Um pedido de estudo ou
skill não autoriza publicar mudanças no jogo. Nas tarefas de implementação,
cumpra o escopo e a autorização de publicação já estabelecidos, sem criar novas
perguntas de confirmação por causa desta skill.

Atualize `references/taste.md` somente com feedback observado, distinguindo o que
o usuário disse das conclusões do agente. Não transforme uma preferência de um
experimento em regra universal da marca.
