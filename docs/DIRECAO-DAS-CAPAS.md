# Capas e abertura — outubro de 2026

O Pênalti é a referência de hierarquia: a ação é reconhecida antes da decoração.
Uma imagem pode ser rica em material sem ter dezenas de elementos competindo.
Esta é uma direção de composição, não um mapa de calor medido com pessoas.

Nas miniaturas da Home, conferir primeiro em 160–175 px:

| Jogo | Primeira leitura | Segunda leitura | Apoio discreto |
|---|---|---|---|
| Machine | Máquina 3×3 | King Rico ao fundo | Cortinas |
| Wheel | Roda e ponteira | Símbolos da roda | Palco |
| Neck | Rosto e pescoço | Uma maçã | Cortinas |
| Flying Clown | Palhaço atual vermelho e verde | Três balões | Interior do circo |
| Fingo | Cartela BINGO numerada | Bola vermelha 7 | Cortinas |
| 33 | Três cartas 10–13–10 | King Rico e diamantes | Feltro e cortinas |

Pênalti e Clown mantêm as artes anteriores, que já têm um assunto principal claro.
Wheel e Neck usam `cover-*-focus.webp`; Machine, Flying Clown, Fingo e 33 usam
respectivamente `cover-machine-reels.webp`, `cover-flying-current.webp`,
`cover-fingo-bingo.webp` e `cover-33-three.webp`, em `assets/brand/`. As versões
anteriores foram preservadas. A Machine tem nove células vazias na ilustração;
os símbolos são o atlas original `symbols-v7.webp`, posicionado sobre as células.
As legendas continuam em HTML, fora da arte, e o limite inferior da
miniatura pode receber a faixa verde. Não acrescentar chuva de moedas, confetes,
pedestais ou vários personagens de importância igual para representar diversão.
O brilho móvel vem de uma única regra `.kr-game-cover::after`, nas oito capas,
com início defasado, sem interceptar toques e desativado com movimento reduzido.

O ícone usa o rosto de King Rico em fundo simples, exportado em PNG 192/512/180.
A ilustração de abertura tem espaço para o título e a mensagem em HTML. O indicador
é indeterminado: não inventa percentuais nem espera um tempo mínimo. A abertura
desaparece quando interface e conta estão prontas, ou quando login/recuperação
precisam aparecer. Falha da arte não bloqueia o jogo; demora oferece nova tentativa.

O runtime é carregado com `defer` para a arte aparecer durante seu download. A
regra inicial `x-dc{display:none!important}` precisa estar no `<head>` para impedir
requisições às expressões `{{ ... }}` antes de o runtime interpretá-las. A ordem
React/Babel → Firebase → suporte DC permanece preservada.
O CSS da abertura e uma prévia WebP pequena vêm no próprio HTML, para aparecer
antes do download da imagem completa. A tela anterior, no app instalado, pertence
ao sistema operacional: o manifesto fornece fundo e ícone, não uma cena arbitrária.

Aceite estético do autor ainda pendente. Conferir futuros ajustes na própria Home,
com suas bordas, rótulos e tamanho de uso, além de examinar o arquivo grande.
