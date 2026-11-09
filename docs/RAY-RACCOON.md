# Ray Raccoon — arte e demonstração v1 (09/11/2026)

- [Corpo inteiro transparente](concepts/ray-raccoon/body-v1.webp)
- [Cabeça transparente](concepts/ray-raccoon/head-v1.webp)

Guaxinim cinza/creme, cauda listrada, máscara preta de tecido com nó, olhos
verde-avelã, colete ameixa e pequeno saco de estopa nas costas. Direção nova
em avaliação, não identidade final aprovada. O dono pediu máscara tipo Zorro,
um roubo simples de ingressos e saída pela esquerda. Não é modelo 3D rigado.

## Cena de avaliação

`/circus?demo=ray`: primeiro giro por toque força três rostos em diagonal com
círculos/linha vermelhos. Ray surge atrás do mostrador do prêmio, se aproxima
do contador de ingressos, pega um bilhete, guarda no saco e sai pela esquerda.
O contador muda no contato. Depois aparece o modal do total e Continuar.
Com zero ingressos ele faz a cena, mas não remove nada e o modal informa zero.

A perda de até 1 ingresso é parâmetro provisório de demonstração, não regra
econômica final. Somente carteira fictícia da prévia: recibo salvo uma vez,
reenvio/reload preservam a contagem. Sem prêmio, Happeach ou roubo de moedas
junto; a aposta normal continua sendo cobrada. Giros comuns não sorteiam Ray.
Cliente real e regras Firestore não foram alterados; não publicar no oficial
antes da avaliação de arte/cena e definição da economia real.

Fontes: prototypes/circus-preview/ray-demo.mjs, ui/park/ray.js e park.css.
Assets de execução: assets/ray/body-v1.webp e head-v1.webp. Origens PNG e
registro da geração em guidelines/asset-pipeline.md.
