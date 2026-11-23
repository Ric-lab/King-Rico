> Giro e madeira23/11: corrigido backspin inicial (rotação contrária ao
> deslocamento), que freava o dado no contato com o feltro. Menos atrito e
> amortecimento inicial, arrasto progressivo preservado; lançamento padrão
> medido:1,22→2,35 voltas totais. Pickup inclina/eleva levemente e a mesma pose
> inicia a simulação, sem reset ao soltar. Hápticos:6ms pegar,16ms lançar,8ms
> impacto; áudio aprovado preservado. Mesa com quatro bordas reais de nogueira
> e base, material procedural de veios/polimento. A abertura interna coincide
> com as paredes físicas; área e textura se ajustam ao tamanho da tela.
> Fontes: games/villain-dice/table.js, scene.js, roll.mjs; nenhum asset externo.

> Câmera23/11: elevação45°, entre a mesa e a vista superior anterior (~72°).
> Mostra topo e frente do dado; posição baixa preservada. O mesmo parâmetro
> calcula câmera, projeção do arrasto e limites físicos, com margem para o
> volume do cubo. Não usar coeficiente antigo0,949 ao mudar a inclinação.

> Refinamento23/11, gesto leve: dado menor (~82px em celular390px), no terço
> inferior, acompanha o arrasto e recebe o impulso dos últimos110ms do gesto.
> Gravidade/atrito/amortecimento menores na largada, com arrasto progressivo
> do feltro para assentar. Paredes acompanham a área visível inteira da tela.
> Marcas claras monocromáticas: patas/Tony, escudos/Ray, roletas/Tucker; zero
> continua explícito. Feltro com fibras não tecidas, relevo e sheen de tecido.
> Gerador versionado `scripts/generate-dice-felt.py`; sem serviço/crédito externo.
> Trajetória física e identidade das faces resolvidas ANTES da reprodução.
> Nenhuma troca de textura, resultado ou correção de pose depois de parar.

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
iguais nem dizer que um gesto altera o prêmio. Uma simetria fixa definida antes da reprodução apresenta
o resultado salvo através dos quiques, sem reorientar a parada. A interface não faz sorteio ou débito.

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

Prévia integrada do Circus: https://ric-lab.github.io/King-Rico/Preview.
Usar ⚙→🎯→Dado do Tony/Tucker/Ray. A carteira é fictícia; a demonstração
isolada e seu workflow estão arquivados. Não os reativar.

## Apresentação integrada atual

Trinca→rosto central cresce além da tela→feltro laranja/Tony, verde/Ray,
azul/Tucker com rosto impresso→dado vermelho por swipe→número gigante como
transição→Circus/modal da perda; Tony mantém uma patada por unidade sorteada.
Arrastar e soltar responde em tempo real. Cancelar/toque curto reposiciona
sem lançar. JOGAR DADO e teclado continuam como alternativas. A face salva e
a perda são as mesmas em replay; os refinamentos de gesto não alteram economia.
