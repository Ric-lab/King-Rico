# Benchmark — gravação de referência (vídeo 1, 41 s, 588×1146)

Análise quadro a quadro de um slot comercial 3×3 de referência (folhas em `screenshots/v1-*.jpg`).
Objetivo: aprender ritmo e feedback, **não** copiar arte, personagens ou marca.

## Giro (medido a 16 fps — `v1-spin.jpg`)
- Toque → brilho dourado em volta do botão + faíscas (~0,6 s). Botão fica **aceso**, não escuro.
- Moldura dos rolos pisca dourado no início do giro (~0,15 s).
- As 3 colunas giram juntas; param **por coluna**, esquerda → direita, ~0,33 s entre elas.
- Ciclo total toque → última parada ≈ 2,3 s.
- Aposta é descontada do saldo no meio do giro (não no toque).
- Coluna em antecipação ganha moldura dourada própria enquanto as outras já pararam.

## Vitória pequena (`v1-win.jpg`, 31,4–34,9 s)
1. Linha premiada é **desenhada progressivamente** do 1º ao 3º símbolo (~0,25 s).
2. Símbolos que não ganharam escurecem ~50 %.
3. Símbolos vencedores ganham explosão dourada + leve pulo.
4. Barra de mensagem troca para "Win 1.50" piscando.
5. Contador de ganho (centro) e saldo sobem juntos em ~0,6 s.
6. Valor aparece por cima do símbolo do meio da linha (~0,9 s depois do início).
7. Duração total ≈ 2,2 s, **sem modal** — o próximo giro já pode começar.

## Ambiente
- Mascote no topo em loop de idle contínuo, pequeno, nunca cobre os rolos.
- Barra de mensagens com dicas rotativas em letreiro ("até 2500x", "tela cheia x10", "rodada especial").
- Contador de ganho dedicado entre saldo e aposta.

## O que aplicar no Fortune Circus (proposta)
- Moldura dos rolos piscando no toque; faíscas no botão.
- Linha premiada desenhada progressivamente + escurecer perdedores (hoje só pisca).
- Valor do prêmio por cima da linha, antes do modal.
- Faixas de prêmio: pequeno = inline (≈2 s, sem modal); médio/grande = modal (regra da 3ª idade continua para prêmios ≥ 5x).
- Barra de dicas rotativas no lugar do texto fixo.
- Contador de ganho dedicado subindo junto com o saldo.

---
# Vídeo 2 (38 s, 674×1314) — `screenshots/v2-*.jpg`

## Vitória de várias linhas (22,4–26,0 s)
- Todas as linhas premiadas são desenhadas **ao mesmo tempo**; perdedores escurecem.
- **Barra de mensagem vira verde** e o valor sobe em contagem: 0,24 → 1,83 → 4,71 → 8,67 → 13,00 em ~1,3 s (aceleração no começo, desaceleração no fim).
- Mascote no topo **reage**: troca de pose (braço para cima comemorando) durante a contagem e volta depois.
- Valor final fica ~1,3 s parado, depois aparece sobre o símbolo central (≈25,7 s).
- Total ≈ 3,5 s, sem modal. Próximo giro só depois.

## Linha de cima premiada (36,2–37,9 s)
- Mesma sequência: linha acende, resto escurece, barra verde, contagem 0,15 → 12,50 em ~1,6 s.
- Mascote pula/levanta os braços no topo enquanto conta.

## Padrões confirmados nos 2 vídeos
1. **Barra de mensagem tem 3 estados de cor**: vermelho (dica), vermelho com "Win x" (prêmio pequeno), **verde** (prêmio maior que a aposta).
2. **Contagem do valor** sempre dura ~1,3–1,6 s, independente do valor.
3. **Mascote reage a toda vitória** (não fica parado); volta ao idle no próximo giro.
4. Prêmios até ~5x **nunca abrem modal**.

## Proposta atualizada para o Fortune Circus
- Barra de mensagem com estados (vermelho/verde) e contagem do valor dentro dela.
- King Rico: "Feliz" em prêmio pequeno, "Comemorar" quando a barra fica verde, "Triste" só após sequência sem prêmio.
- Todas as linhas premiadas acendem juntas; o resto escurece 50 %.
- Modal só a partir de 5x (regra da 3ª idade mantida para prêmios relevantes).

---
# Vídeo 3 (41 s) — rodada especial completa · `screenshots/v3-*.jpg`

## Entrada da rodada (12,3–14,8 s)
- Um **envelope vermelho com "?"** cai do topo sobre os rolos (~0,8 s), sobe e some → anuncia o bônus antes de tudo.
- **O cenário inteiro muda**: o topo ganha um **halo dourado radial** atrás do mascote, o mascote aparece maior e centralizado, e um **selo "x10"** fica pendurado acima dos rolos durante toda a rodada.

## Durante a rodada (15,0–26,6 s)
- Rolos ficam **vazios (fundo bege) com brilho dourado e partículas**; só caem o símbolo sorteado e curingas.
- Cada símbolo novo **trava no lugar** e o espaço vazio continua girando sozinho.
- Barra de mensagem explica a regra ("respin quando X ou curinga aparecer").

## Clímax — tela cheia (26,6–33,0 s)
- Ao completar a grade, **tudo acende em dourado**, a barra fica **verde** e conta: 0,83 → 4,77 → 12,10 → 22,56 → 33,38 → 37,50 em ~1,5 s.
- **Mascote com os dois braços para cima** a contagem inteira (27–30 s), depois volta ao idle.
- Valor final fica ~2,5 s; aí cada linha é mostrada em sequência com seu valor (12,50) antes de voltar ao jogo normal.
- O cenário volta ao normal (halo some) junto com o primeiro giro seguinte.

## O que aplicar no Fortune Circus
- **Anúncio do bônus**: algo caindo do topo antes da Rodada Especial (no nosso caso, a cesta de pêssegos já cumpre esse papel — reforçar com uma queda/destaque mais claro).
- **Cenário de rodada**: halo dourado radial atrás do King Rico + selo fixo indicando o bônus durante toda a rodada.
- **Grade da rodada**: casas vazias em bege com brilho e partículas; travar cada símbolo com destaque.
- **Clímax**: grade inteira dourada + barra verde contando + King Rico "Comemorar" (braços para cima) durante a contagem.
- **Saída**: mostrar o total por ~2,5 s, depois cada linha com seu valor, e só então voltar.
