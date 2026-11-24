> Regra24/11 — somente prévia: estoque zero não abre dado nem perde item;
> Tucker sem roletas também não consome escudo. Com N=1…5, as seis faces têm
> valores0…N. N=1: três0/três1; N=2: dois de cada; N=5: um de cada. Para3/4,
> repetições diferem no máximo1 e os valores extras variam uniformemente entre
> rodadas; todos os valores têm a mesma probabilidade ao longo das rodadas.
> Recibo novo: evento version5, dice={version:2,value,faces,index}. A face
> física é index; a quantidade exibida/roubada é faces[index]. Recibos antigos
> continuam com dice version1. Quantidade aparece como “Tirou N”, sem ×.
> Tony mantém0…5 apostas, com orçamento/saldo, preservando a regra anterior;
> Ray/Tucker debitam EXATAMENTE a quantidade do dado, sem cap posterior.
> Os presets de prévia não acrescentam estoque para obrigar o dado a aparecer.

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
As faces físicas são equiprováveis e a distribuição acompanha o estoque.
O gesto altera o lançamento, sem alterar o resultado já confirmado. Uma simetria fixa definida antes da reprodução apresenta
o resultado salvo através dos quiques, sem reorientar a parada. A interface não faz sorteio ou débito.

- Tony: resultado inteiro0–5 multiplicado pela aposta; limite adicional pelo
  saldo disponível e orçamento de controle já existentes. Zero não leva nada.
- Tucker: resultado0–5 limitado às roletas disponíveis, com ajuste proporcional
  da reserva que lastreia a roleta bônus.
- Ray: resultado0–5 limitado aos escudos disponíveis.
- A defesa atual de Tony/Tucker continua consumindo um escudo e substituindo
  o símbolo; não há dado de roubo nessa jogada protegida. Ray continua roubando
  escudos conforme a versão atual. Recibos antigos preservam sua apresentação.

Dados novos usam `event.dice={version:2,value,faces,index}` nos eventos version5;
version4/dice1 permanece legada. Regras
validam face inteira, limites, correspondência face/perda e atualizações
atômicas. Repetir a operação usa o mesmo recibo, mesmo em outro cliente.
Falha no WebGL oferece REVELAR RESULTADO; perda de contexto durante o voo
mostra o resultado confirmado. Fechar a página cancela a cena, sem outro débito.

## Validação econômica — 24/11, somente prévia

1 milhão por aposta1/10/100/1000/2500/5000/10000: **89,977739%** em todas.
Inclui moedas da slot, bônus da roleta, Royal Rico10× recebido e roubos do Tony;
perdas de escudos/roletas são aplicadas ao estoque/banco e afetam giros futuros.
Sem presentes/recargas. Políticas de aposta e proteção:1 milhão cada,
89,914204%–90,119530%. Todos abaixo100%; PAYS e chances de vilões preservados.
Dados em `circus-economy-v6-audit.json` e `circus-economy-v6-stress.json`.
Publicação desta tarefa: APENAS Pages, nunca main/Firebase oficial.

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
