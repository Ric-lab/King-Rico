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
| Fingo | Cinco bolas numeradas | Plinko verde | Cortinas discretas |
| 33 | Três cartas 10–13–10 | King Rico e diamantes | Feltro e cortinas |

As oito capas são compostas em camadas. Todas usam exatamente o mesmo arquivo
`assets/brand/covers/stage.webp`, derivado do cenário da capa da Wheel. Não gerar
um novo fundo por jogo: a consistência depende de compartilhar a mesma imagem.
Os elementos de cada jogo são WebP transparentes no mesmo diretório, montados
por `.kr-cover-object` e ajustes de enquadramento em `ui/home.css`. As artes
anteriores foram preservadas. Na Machine, a máquina fica de frente, sem o elefante. Os nove símbolos continuam vindo do
atlas original `symbols-v7.webp`, sobre as células vazias da máquina.

O Fingo mantém cinco bolas acima do plinko, usando a moldura original do jogo
e a geometria atual por código: oito fileiras alternadas (49 pinos), compartilhadas com `games/fingo/layout.cjs` e quatro
separadores com topo arredondado, formando cinco saídas; o 33 mantém três cartas 10–13–10;
o Flying usa o palhaço atual vermelho/verde. O Pênalti conserva gol, goleira,
bola e uma pequena base de grama, deixando o cenário compartilhado visível.
As legendas ficam em HTML, sobre a faixa verde inferior. Conferir as camadas no
tamanho da Home, incluindo recorte pelos cantos arredondados e pela faixa.
Não acrescentar chuva de moedas, confetes ou decoração concorrendo com o jogo.
O brilho móvel vem de `.kr-game-cover::after`, nas oito capas, com início
defasado, sem interceptar toques e desativado com movimento reduzido.

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

A direção atual preserva o plinko com cinco bolas e fundo compartilhado. A cartela
como capa foi rejeitada pelo autor. Para ajustes futuros, conferir hierarquia no
tamanho real da Home e não tratar uma proposta antiga como nova pendência aprovada.
