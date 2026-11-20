# Plano v7 — Fortune Circus (estado-alvo, 20/11/2026)

Fonte única do rumo. Se algo aqui conflitar com ideia antiga no TODO, vale ESTE arquivo.
Feito por: dono + Claude. Vale para Claude, GPT/Codex e Gemini.

## 1. O que SAI do jogo
| Sai | Motivo |
|---|---|
| Happeach (símbolo, cesta, contador) | Good Luck passa para o trevo na barriga do King Rico |
| Tucker (vilão) | Ele roubava Happeach; fica sem função |
| Cedro / feitiço que troca casa | Não encaixou no jogo |
| Ingressos e atrações | Já decidido antes |
| Botões de turbo e de auto | Turbo fica fixo; auto vira "segurar o spin" |
| Raio do Good Luck na barra | Asset guardado (não apagar) |
| Dados | Cancelados (escudo ganhou formato próprio) |

## 2. O que FICA como está
- Rolos e símbolos de prêmio: ingresso 0,4 · circo 0,8 · capa 1,2 · moeda 2,5 · diamante 5 · coroa 10
- Tony (vilão da patada) e Ray (vilão que rouba)
- Barras laterais enchendo → **roleta** de multiplicador (a de hoje, com os sons aprovados)
- Raspadinha diária, big win e super win, sons aprovados

## 3. O que MUDA / ENTRA
| Peça | Estado novo |
|---|---|
| **Good Luck** | Trevo de 4 folhas na barriga do King Rico. As folhas acendem conforme joga; com as 4 acesas, ele solta 4 feitiços (efeitos do prêmio do Royal Rico) = 5 giros Good Luck |
| **Escudo** | Asset novo (formato que não confunde com a roleta). Defende dos vilões. Até 5, guardados perto do saldo. Com 0, não defende |
| **Controle** (símbolo) | Trinca de controles abre um minigame, **alternando**: Royal Rico → Bubble Rico → Royal Rico… (lembrar qual foi o último) |
| **Royal Rico** | Minigame de trinca (como está hoje). Paga em **escudos** |
| **Bubble Rico** | Minigame novo (bubble shooter). Paga em **escudos**, no mesmo formato do Royal Rico |
| **Spin** | Velocidade sempre a do turbo atual. Linha dourada pisca 40% menos |
| **Auto** | Apertar e segurar o spin (~0,6 s, com o botão "carregando") liga; tocar desliga |
| **Botão de spin** | Grande e redondo, no estilo do Coin Master |
| **Aposta** | Seletor menor, abaixo do spin |

## 4. Decisões ainda em aberto
1. **Ray:** o escudo defende dele, ou ele rouba escudos (1 a 4)?
2. **Aposta fixa em 100** (sem energia)? — Ideia, não decidido.
3. **Royal Rico v2** (capturar o tigre → canhão no cofrinho → Plinko): fica para depois do v7?
4. Quantos escudos cada minigame paga (vitória / derrota).

## 5. Ordem de execução (uma etapa por vez, cada uma testável na prévia)
1. **Tela limpa:** spin estilo Coin Master, auto ao segurar, turbo fixo, linha −40%, aposta menor, tirar botões turbo/auto
2. **Escudo:** asset do dono, contador perto do saldo, defesa do Tony (+ regra do Ray decidida)
3. **Tirar** Happeach, Tucker, cedro, ingressos e atrações
4. **Trevo na barriga** do King Rico como Good Luck
5. **Controle alternando** Royal Rico ↔ Bubble Rico; Royal Rico pagando em escudos
6. **Bubble Rico** (minigame novo)
7. **Economia v7:** refazer o RTP (~90%, nunca >100%) com todas as mudanças
8. Dono testa tudo na prévia → só então publicar na main
