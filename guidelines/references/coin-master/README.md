# Botão de giro — Coin Master

Referência enviada pelo dono à main no commit
[38a9f0b](https://github.com/Ric-lab/King-Rico/commit/38a9f0b3f440896b45e94f74cd313b3a2d3211e2),
20/11/2026. Estudo visual por Codex; não é asset para reutilizar no produto.

- [Gravação original](spin-button.mp4): 6,830311 s, 1080×2340, H.264/AAC,
  19.225.454 bytes. Movida de assets/ sem recompressão.
- Nome enviado: `Screen_Recording_20261120_022001_Coin Master_1.mp4`.
- SHA-256: `c9aa92ffdbb35db8bc9f37f2c52e0fc24a4896dbf8a4db705acff42111369d3f`.
- [Sequência do primeiro clique](spin-button-frames.jpg): recortes a 30 quadros/s,
  tempo indicado em cada quadro. Vídeo completo também examinado a 2 quadros/s.

## O que aparece na gravação

O primeiro clique visível começa por volta de 1,33 s. Entre 1,37 e 1,40 s a tampa
vermelha baixa até quase esconder a lateral vinho. Fica baixa até perto de
1,50 s; entre 1,53 e 1,63 s volta a levantar, assentando em seguida. Essas
medidas são aproximadas; a folha foi amostrada a 30 quadros/s.

A moldura/base azul permanece no lugar. O vermelho e o texto se movem juntos.
A compressão da lateral e a cavidade mais visível atrás da tampa dão a sensação
de curso mecânico. A perspectiva encurta a superfície durante o afundamento;
não é apenas reduzir o botão inteiro com scale(). O contraste entre repouso e
pressionado é grande, mas a forma continua rígida: não se deforma como silicone.

O repouso ocupa a maior parte do vídeo. Nos momentos de giro a tela não fica
presa esperando o botão voltar: feedback do clique e começo dos rolos se
sobrepõem. Há novos cliques/giro perto de 3,63 s e 6,00 s; moedas cruzando o botão
em outros momentos podem enganar uma análise baseada só em diferença de pixels.

## Leitura inicial para o King Rico — estudo anterior à implementação

Reaproveitar a separação entre base fixa, lateral e tampa com o texto. Conferir
primeiro a geometria dos estados alto/baixo e só depois o retorno. O exemplo
explica o afundamento; não pede copiar vermelho, base azul, fonte ou arte da
marca. Nenhuma aparência, som, pagamento ou animação do King Rico foi alterada
nesta organização da referência.

Esta pasta não pertence aos assets de runtime. Não copiar o MP4 para dist/ nem
incluí-lo no preload do jogo. Preservar o original para Claude, Gemini e Codex.

## Aplicado na prévia —20/11/2026
Depois do pedido do dono, spin-v7.css e spin-tactility.js passaram a usar base
fixa, cavidade escura e tampa projetada ao afundar. Foram preservados o formato,
vinho/dourado, texto de aposta, som e háptico do King Rico. A proporção e o tempo
foram adaptados ao botão existente, sem reutilizar a arte do Coin Master.

### Refinamento posterior autorizado pelo dono —20/11/2026
A versão vinho ainda não convenceu. A proposta seguinte na prévia usa coral e
texto claro, base dourada quente, GIRAR maior e aposta secundária. Reduz o vazio
traseiro e faz a tampa parecer elevada sobre a base. Conserva a referência de
curso/retorno; não altera som nem lógica. Aguarda avaliação estética do dono.

### Pedido definitivo da iteração —20/11/2026
Dono rejeitou a releitura coral/GIRAR: copiar a FORMA do vídeo, mantendo apenas
aposta na tampa e luz no contorno para ativar auto. A prévia agora usa três SVGs
em assets/machine/spin-cm-*.svg; ver spin-cm-v1.md para dimensões e sincronismo.
A arte é vetorial reconstruída das medidas, sem recortar o bitmap comercial.
