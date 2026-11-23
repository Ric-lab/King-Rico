> Direção visual atual23/11: cabeça central cresce para revelar mesa de feltro
> na cor do vilão, rosto no centro e dado vermelho. Número gigante vira a
> transição de volta ao Circus/modal. Tony mantém patadas. Painel creme e voos
> de recursos foram substituídos por esse pedido explícito. Mesma carteira de
> teste, sem mudança matemática ou publicação em live.

> Atualização23/11: a demonstração isolada foi rejeitada. O dado agora faz parte
> da prévia normal do Circus, com carteira fictícia. `/Preview` volta a abrir
> o jogo. Workflow isolado arquivado; nunca usar para sobrescrever a prévia.
> Não publicar LIVE enquanto o bloqueio de aposta variável persistir.

# Dado dos vilões — amostra em desenvolvimento,23/11/2026

O dado é um objeto Three.js arredondado, com seis faces numeradas de0 a5,
física Cannon, chão e paredes. Swipe define velocidade/direção e rotação do
arremesso. O botão JOGAR DADO é uma alternativa acessível ao gesto.
A cena aguarda o usuário, sem lançamento automático. Recursos Three já
instalados são servidos localmente; não há CDN ou API paga.

A face final pertence ao recibo confirmado, não ao movimento do dedo.
O sistema usa a distribuição normal limitada existente; não prometer chances
iguais nem dizer que um gesto altera o prêmio. A acomodação final apresenta
o resultado salvo após os quiques. A interface não faz sorteio ou débito.

- Tony: resultado inteiro0–5 multiplicado pela aposta; limite adicional pelo
  saldo disponível e orçamento de controle já existentes. Zero não leva nada.
- Tucker: resultado0–5 limitado às roletas disponíveis, com ajuste proporcional
  da reserva que lastreia a roleta bônus.
- Ray: resultado0–5 limitado aos escudos disponíveis.
- A defesa atual de Tony/Tucker continua consumindo um escudo e substituindo
  o símbolo; não há dado de roubo nessa jogada protegida. Ray continua roubando
  escudos conforme a versão atual. Recibos antigos preservam sua apresentação.

Dado salvo como `event.dice={version:1,value}` nos eventos version4. Regras
validam face inteira, limites, correspondência face/perda e atualizações
atômicas. Repetir a operação usa o mesmo recibo, mesmo em outro cliente.
Falha no WebGL oferece REVELAR RESULTADO; perda de contexto durante o voo
mostra o resultado confirmado. Fechar a página cancela a cena, sem outro débito.

## Validação econômica

Apostas fixas1/10/100/1000:5 milhões de giros por aposta, retorno89,9747%.
Estresse1 milhão por política: alternada89,8391%; com proteção fixa90,0038%;
armadura por aposta90,0115%; aposta alta somente perto do fim95,9524%.
Essa última estratégia ultrapassa a faixa88,5–91,5%; publicação financeira
bloqueada. Não alterar a roleta nem os PAYS nesta tarefa só para passar no gate.
Resultados e hashes em `circus-economy-v6-audit.json` e
`circus-economy-v6-stress.json`. Oficial preservado; amostra não publicada.

## Próximo cozy

O dono definiu Bubble Shooter como segundo cozy junto do Match Three.
Referência: https://play.google.com/store/apps/details?id=com.matchgame.BubbleDrop&hl=pt_BR
Implementação e regras de recompensas ficam para outra tarefa.

## Testes realizados

- `villain_dice_browser.py`: três vilões, modos normal/reduzido, swipe, alternativa
  de teclado, seis faces, cancelamento e fallback WebGL; nenhuma nova cobrança.
- `npm run test:rules`:90 verificações passaram, incluindo zero/cinco, replay e
  faces inválidas/perdas adulteradas.
- Testes de unidade e carteira de dados passaram. `npm test` passa nos demais
  arquivos, mas a auditoria de liberação permanece falhando pela estratégia
  de aposta variável95,9524%, descrita acima. Não ignorar esse bloqueio.
- Uma repetição visual focada verifica a câmera/bandeja finais; build de produção
  gerado após a integração. A publicação oficial não foi iniciada.

## Link para avaliar o gesto

A demonstração isolada é publicada pelo workflow `dice-demo.yml` no Pages já
existente. `/Preview` aponta para ela durante a avaliação; `/circus/` permanece
no último código aprovado (`f7e8d185`, workflow45094186274 bem-sucedido).
O artefato do dado não importa carteira nem código financeiro. O resultado de
teste é escolhido explicitamente. Assim o dono testa o gesto sem liberar a
matemática ainda bloqueada. A fonte dessa demonstração está no mesmo GitHub.

## Apresentação integrada

Vilão identificado por rosto e nome. Face0–5 representada por pontos (zero
marcado), marfim brilhante e bandeja verde/dourada contínua. O resultado mostra
explicitamente quantas moedas/escudos/roletas serão levados. Tony apresenta suas
três patadas; Tucker/Ray retiram itens do contador em sequência. Estoque é
segurado visualmente desde o pedido de giro até a apresentação do roubo, nos
clientes normal e de prévia. O desconto confirmado continua único e recuperável.
