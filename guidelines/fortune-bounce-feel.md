# Fortune Bounce — peso, ritmo e decisão

Pedido de Ricardo, 16/out/2026: estudar o que faz Tiles Hop e Subway Surfers funcionarem e transformar esse repertório em uma experiência própria. O pulso de energia do Fortune Circus é a referência interna de acabamento. A estética não termina na escolha das cores: cada consequência precisa parecer causada pela ação anterior.

## Referências e transformação

- [Tiles Hop, Amanotes](https://products.amanotes.com/) e [página do jogo](https://play.google.com/store/apps/details?id=com.amanotes.beathopper): leitura limpa do próximo apoio, controle lateral contínuo e aterrissagem como unidade do ritmo. No Bounce, isso vira três faixas, marca central e notas pentatônicas por contato. Não usamos suas músicas, imagens ou código.
- [Subway Surfers City, trailer oficial de gameplay](https://www.youtube.com/watch?v=oQpRzQgBWpc): referência de percurso com três faixas e profundidade legível. No Bounce, guias discretas no chão e câmera com atraso lateral, sem guinadas que escondam a próxima placa.
- `Fortune Circus.dc.html`, `spinFx` e `lightsPulse`: a energia parte do toque e percorre a moldura; não fica tudo aceso permanentemente. No Bounce, a batida inicia um pulso que chega aos arcos pela distância.
- [Juice It or Lose It, GDC](https://www.gdcvault.com/play/1016487/juice-it-or-lose) e [Don't Juice It or Lose It](https://www.gdcvault.com/play/1020861/don-t-juice-it-or): combinar respostas visuais e sonoras, preservando a leitura. Acrescentar partículas a tudo não substitui material, peso e hierarquia.
- [Roube como um artista, Austin Kleon](https://austinkleon.com/steal/): estudar várias fontes, identificar princípios e transformá-los dentro da identidade do projeto.

A pesquisa web forneceu páginas, imagens e descrições dos trailers; não houve reprodução integral dos vídeos neste ambiente. Os parâmetros abaixo são decisões próprias, verificadas no Bounce em movimento, não medições feitas nesses vídeos.

## A sequência de uma batida

| Instante | Resposta | Motivo |
|---|---|---|
| Começo | 200 ms de antecipação; pulso e nota curta | O lançamento tem uma causa perceptível |
| Contato | Impulso vertical na mola da placa; leve inclinação oposta ao lado atingido | A bola tem peso e o apoio responde ao contato |
| Contato | Bola comprime até 24%; largura compensa a altura para conservar volume | Evitar aparência de borracha que encolhe arbitrariamente |
| Contato | Grave curto + nota; perfeito acrescenta harmônico e vibração curta | Som e tato confirmam a mesma colisão |
| Após o contato | Anel horizontal, poucas faíscas e luz que alcança os arcos | O efeito nasce no chão e deixa o próximo alvo visível |
| Recuperação | Mola amortecida, luz voltando à meia intensidade | Não manter tudo no pico e perder contraste |

Mola: rigidez 190, amortecimento 18, integração em subpassos. Salto de 670 até 430 ms conforme o avanço; apoio mínimo de 85 ms, prolongado se a confirmação do saldo ainda estiver chegando. Interpolação exponencial evita mudar a resposta do arrasto com a taxa de quadros. Sombra acompanha altura; câmera segue suavemente, com pequeno impulso no contato. Arcos próximos demais desaparecem para não atravessar a bola na imagem.

Placas têm espessura, chanfro, aro metálico e alvo central. A bola recebe acabamento dourado com brilho localizado. O roxo continua dominante; o dourado comunica bola, prêmio e placas especiais. Não usamos gerações pagas de assets.

## A aposta também precisa de acabamento

- Aposta e botão de iniciar explícitos; gesto no campo também inicia.
- Perfeito recompensa precisão visualmente e no som; não inventa um bônus financeiro.
- Pegar interrompe o risco imediatamente e recebe o valor mostrado, sem obrigar mais um salto.
- A primeira dourada fixa um valor garantido. Cair depois dela recebe essa garantia.
- Menu ou aba oculta pausam a pista; continuar exige ação. Movimento reduzido elimina deslocamento lateral da câmera e faíscas extras, mantendo a física.
- Reabrir mantém a mesma pista e a última placa confirmada, sem outra aposta. Uma queda é enviada antes da animação terminar; atualizar não apaga a operação pendente.

## Critérios para futuras revisões

Antes de acrescentar outro efeito, perguntar: de onde vem, o que comunica, quanto dura, como termina e se esconde o próximo alvo. Verificar no celular em movimento; screenshot isolado não prova o peso. Comparar impacto comum e perfeito, centro e borda, movimento normal e reduzido. Evitar balanço de câmera que altere a mira, luz permanente máxima e confete em acertos comuns.

O gosto de Ricardo continua sendo a referência para a próxima rodada de ajustes. Os testes provam comportamento e persistência; a revisão visual avalia composição e sensação.
