# HANDOFF

Estado atual e próximo passo. Qualquer modelo: ler antes de começar; atualizar ao parar (feito + próximo passo).
Regras gerais ficam em `docs/skills/` — não repetir aqui.

## Publicação autorizada (2026-11-09 · cor do bônus)
- Integração sobre main fc2cb40: somente centro e disco viajante da roleta com a cor da casa sorteada, inclusive retomada. Não promove demos, carteira fictícia ou economia v4 da prévia.
- Teste focado de navegador para roxo/amarelo/rosa normal e reduzido; build final de produção após integração. Workflow oficial mantém testes, regras REST e Hosting.
- Próximo passo: conferir o resultado do workflow deste commit e o CSS/JS no oficial; feedback do dono.

## Publicado (2026-11-08 · voo estável e economia v3)
- Dono confirmou explicitamente publicar visual E pagamentos. Integração preparada sobre main 6f382aa, preservando autenticação Google, carteira Firestore real, retorno diário uma vez por dia e publicador REST. Sem carteira de teste/demo no build de produção.
- Visual atual da prévia incluído: céu/espaço ilustrados, curva/rotação do avião, hélice, prêmio único/círculo e faixas relativas de 20/35/50×. Fundo espacial sem máscara de viewport, camadas isoladas, sem filtros variáveis/rotação 3D; brilho do círculo suavizado. Captura inicial no desktop não reproduziu flash; mudanças reduzem fontes de recomposição no celular.
- Novos giros usam slotVersion 3 no cliente real: oito combinações, ingressos avulsos e tabela balanceada. Recibos/rodadas v1/v2 continuam com perfil salvo. Fonte: cloud/circus-profile.cjs; apresentação isolada em cloud/prize-tier.cjs. Probabilidades/tabela e limites em docs/ECONOMIA.md; simulação fixa de 5 milhões: 95,313% de moedas, sem resgate de ingressos/políticas de variar aposta.
- Validação: 62 testes de regras/transações já passaram com o mesmo core v3, incluindo reenvio e teto 4.000×; 213 unitários e testes focados de perfis/modelo. Nesta integração passaram 66 testes focados e navegador com Google Auth/Firestore emulados, giro real v3 de 40.000, espaço opaco e recarga sem novo crédito. Captura release-space-stable.png inspecionada. Build final de produção após integração.
- Publicado código 7e41b89. Workflow oficial https://github.com/Ric-lab/King-Rico/actions/runs/42536204755 concluído com sucesso (verificar + publicar regras REST/Hosting). Prévia a4806d3: https://github.com/Ric-lab/King-Rico/actions/runs/42536299631 também concluído com sucesso.
- Conferência no oficial: Firebase king-rico sem emuladores, cliente slotVersion 3, modos de teste ausentes, CSS/arte com bytes iguais ao build e assets/Three.js HTTP 200. Nenhuma aposta real. Próximo passo: feedback do dono no celular; limites econômicos da estimativa continuam em docs/ECONOMIA.md.

## Publicado (08/11/2026 · raspadinha e voo do big win)
- Código oficial `6a7a775`, workflow https://github.com/Ric-lab/King-Rico/actions/runs/42438873128: verificar e publicar concluídos com sucesso, preservando regras REST e Hosting existentes.
- Site https://king-rico.web.app conferido no navegador: projeto king-rico ativo, sem emuladores/carteira fictícia/demo, cliente de cinco combinações. Avião, perfil e CSS novos HTTP 200 e bytes iguais aos locais; Three.js HTTP 200. Nenhuma aposta em conta real foi feita.
- Autorizada pelo dono: publicar a revisão visual aprovada. Base conferida: main b698477. Inclui raspadinha diária 3×3, prêmio destacado, avião, King Rico de perfil/maior, comemoração e céu/espaço.
- Seleção intencional: matemática oficial permanece com cinco combinações; proposta de oito (auditoria de retorno elevado) fica na prévia. engine/park/regras inalterados. Store só recebe a recuperação de conflito do bônus diário. Login Google, saldo Firestore, outras atrações e publicador REST preservados.
- Produção não contém carteira fictícia, repetição por abertura nem giros de demonstração. Conferidos os bundles de produção; build final gerado após a integração. Próximo passo: dono avaliar a versão oficial; continuar balanceamento das oito combinações só na prévia antes de eventual promoção financeira.
- Validação local: 204 testes de código e 57 de regras passaram. Navegador com conta emulada confirmou raspadinha diária única, giro financeiro real 20×, perfil maior, cinco combinações preservadas e saldo 1.240 após recarga, sem erros ou assets ausentes. Catálogo, sessão, entradas e menus de Penalty/Flying/Bounce/Fingo conferidos. Teste antigo do parque foi corrigido para não tentar montar jogos arquivados que retornam 404 intencionalmente.

## Estado anterior (2026-11-05)
- `main` = site oficial. Publicado `87244fe` em 05/11 após autorização do dono: Clown guardado, Bounce reativado, três cards Em breve e revisões aprovadas de parque/HUD/contador. Mantidas 3 fitas, carteira real, háptico e publicador REST de regras; prévia segue em projeto isolado.
- No ar: Circus, Penalty (goleiro palhaço), Flying Clown e Bounce; Fingo só pela rota direta. Basquete/Bubble Plinko/Race Horse são cards Em breve, sem cobrança. Clown e demais arquivados: docs/ARQUIVADOS.md.
- Histórico da prévia antiga (rolos 9 tambores, rejeitados): tag `archive/codex-penalty-clown-preview-rolos`.

## Entrega concluída (2026-11-05 · catálogo e Bounce)
- Produção `87244fe`: https://github.com/Ric-lab/King-Rico/actions/runs/42062162492 com verificar/publicar concluídos com sucesso, regras REST e Hosting. Prévia https://github.com/Ric-lab/King-Rico/actions/runs/42062162645 também aprovada.
- Navegador no site oficial confirmou projeto king-rico habilitado, sem emuladores/carteira de teste, três cards sem interação, 3D do Bounce pronto, Clown HTTP 404 e assets HTTP 200; sem erros de página. Nenhuma aposta em conta real foi feita.
- Dono autorizou publicar a revisão completa e pediu guardar Clown, criar cards Basquete/Bubble Plinko/Race Horse e reviver Bounce. Confirmou explicitamente três cards Em breve, sem jogos novos/cobrança, e Bounce jogável.
- Clown preservado nos fontes/Firestore, fora do catálogo e das rotas. Bounce reativado com Three.js local, HUD/carteira/entrada do parque e retomada; matemática e física originais preservadas.
- Cards vetoriais em ui/park/covers (0 créditos externos). Catálogo atualizado em README, ARQUIVADOS, PARQUE e site/routes.json. Publicação pela main, workflow existente e publicador REST de regras preservados.
- Validação: 201 testes de código e 57 de regras/transações aprovados. Prévia nas três larguras e quatro partidas por atração; navegador nativo com conta emulada validou toque, recuperação, pagamento e navegação do Bounce, sem erros/assets ausentes. Carregamento espera o 3D real antes de liberar a tela. Produção gerada após a integração.

## Prévia (2026-11-05 · Codex · respiro no contador e controle do parque)
- Código `45b813c` na prévia. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42032243609 concluído com sucesso: layout nas três larguras, escala igual dos ícones e contagem nas partidas seguidas verificados no endereço público. Oficial preservado.
- Dono rejeitou contador pequeno/apertado e diferença visual no botão Parque. Placa dos ingressos ampliada para 142 × 44, com padding horizontal 16, intervalo 12 e número 24; arte original preservada.
- Parque agora usa exatamente a base original/escala de Home, com controle de videogame central em SVG. Casinha e menu preservados. Preload atualizado; tenda anterior substituída.
- Faixa de bolas do Clown, multiplicadores do Pênalti e proteção do Flying recebem leve ajuste vertical para deixar respiro abaixo do contador. Nenhuma mudança financeira ou de dinâmica.
- Conferidos 360/390/430 px, saldo longo, quatro partidas nas três atrações e contagem confirmada; screenshots revisados. Os 53 testes de build/carteira/adaptadores passaram, com produção gerada após o navegador.
- Apenas prévia. Próxima avaliação estética é do dono; conferir contador e os três botões no celular.

## Prévia (2026-11-05 · Codex · anúncio, ingressos e navegação)
- Código `618598c` publicado somente na prévia. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42030311399 concluído com sucesso: animações do Circus, navegação, três larguras/saldo longo e contador após cobranças nas três atrações conferidos no endereço público.
- Anúncio de +1.000 moedas movido para logo abaixo do cabeçalho, antes do título/capas. Nenhum comportamento financeiro alterado.
- Header compartilhado passa a Home · Parque · menu, com 44 px de toque. Nas atrações, contador de ingressos abaixo das moedas acompanha a cobrança confirmada. Circus conserva seu contador/voo original.
- Saldo longo conserva fonte; botões descem uma linha apenas se necessário. Parque continua rolando normalmente. Ícone de tenda SVG, zero créditos externos; assets carregados pelo manifesto comum.
- Conferidos 360/390/430 px, valor de 100.000.000,65, menu, recarga cancelada, Home → Circus → Parque e contador diminuindo nas três atrações. 52 testes de carteira/adaptadores aprovados. Só prévia.

## Prévia (2026-11-05 · Codex · três atrações e partidas contínuas)
- Código `0daca8a`; canal /park atualizado. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42026616197 terminou com sucesso: movimentos do Circus, três larguras e quatro partidas por atração (ingressos → moedas, sem modal repetido) conferidos no endereço público. Site oficial não alterado.
- Novo feedback: capas anteriores rejeitadas. Três placas horizontais com Clown, Pênalti e Flying; Fingo retirado só do catálogo, rota/partidas preservadas. Goleiro atual também na escolha inicial.
- Confirma uma vez por visita. Nas próximas partidas, autoriza 1 ingresso prioritariamente ou 25 moedas sem repetir modal; transação da primeira jogada continua cobrando uma vez. Não inicia partidas nem desconta só por terminar/perder.
- Fluxo compartilhado entre prévia e real; retomada de rodada/passe preservada. Corrigido Flying na carteira real para não debitar moedas ao usar ingresso, conforme as regras já exigiam.
- Plano e comportamento: docs/PLANO-PARQUE.md e docs/PARQUE.md. Somente prévia; avaliação estética ainda do dono.
- Conferidos navegador 360/390/430 px e quatro partidas reais da carteira de teste por atração (3 ingressos, depois moedas), replay sem nova cobrança e recarga. Regras/transações: 56 testes aprovados, incluindo Flying por ingresso; regras sem alterações. Na execução geral de 200 testes, só falhou a expectativa antiga de Fingo na Home: corrigida e teste de build reexecutado com sucesso; demais 199 passaram. Artefato de produção gerado após integração.

## Prévia (2026-11-05 · Codex · revisão visual do parque)
- Implementação `090775f` disponível em https://king-rico-previa-1408805633--previa-okw4doeq.web.app/park . Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42023037385 concluído com sucesso; testes de movimento e parque executados no endereço publicado, sem erros/assets ausentes. Capturas no artefato do workflow.
- Plano em `docs/PLANO-PARQUE.md`: HUD compartilhado, quatro capas maiores/coerentes, goleiro palhaço no Pênalti e botões Jogar/Continuar da família existente. Contexto do menu corrigido para Parque.
- Header passa a rolar normalmente, mantendo só banner fixo. Teste cobre três larguras, saldo longo sem reduzir fonte, menu/preferências, cancelamento da recarga e abertura das quatro atrações sem débito. Fluxos financeiros não alterados.
- Bola geométrica SVG; demais artes atuais reutilizadas, sem créditos externos. Apenas prévia; aguardar avaliação estética antes do oficial.
- Validação local: 48 testes de adaptadores aprovados; navegador em 360/390/430 px sem erros ou assets ausentes, cabeçalho comparado ao Circus, quatro entradas abertas sem débito e preferências preservadas. Build de produção gerado após integração.

## Entrega concluída (2026-11-05 · Codex · háptico do spin)
- Workflow https://github.com/Ric-lab/King-Rico/actions/runs/41959993457 concluído com sucesso: testes de código, regras/transações emuladas, build de produção, regras REST e Hosting.
- Site oficial conferido no navegador: HTML contém spinPress 40 ms e padrões novos das paradas; configuração king-rico real, sem emuladores/carteira de teste, rotas e assets HTTP 200, sem erros de página/arquivos. Nenhuma aposta em conta real foi feita.
- Usuário pediu háptico ao apertar spin e autorizou publicar a versão atual. Pulso de pressão reforçado de 20 para 40 ms no handler existente, junto ao afundar/aro; sem segunda chamada, sem alterar áudio ou apostas. Paradas mantêm os padrões reforçados da prévia.
- Preferências/desligado e bloqueio durante giro preservados; testes focados e evento real de pressão conferidos antes do build final. Publicação pela main no workflow existente, incluindo regras REST compatíveis e Hosting.

## Prévia (2026-11-05 · Codex · paradas hápticas com mais presença)
- Mantidos três eventos hápticos, um por coluna. Primeiros rolos: 34 ms, pausa 18 ms, retorno 16 ms. Último: 48 ms, pausa 22 ms, retorno 28 ms. Antes eram pulsos simples de 18/35 ms. Sem vibração contínua ou mudança de som.
- Preferências 50%/100%/desligado e supressão em auto/free/feature preservadas. Teste de adaptador cobre padrões, silêncio e preferências; conferência no navegador valida chamadas nas paradas. A sensação física deve ser avaliada no celular do dono. Apenas prévia.

## Prévia (2026-11-05 · Codex · encontro lateral e ingressos mais ágeis)
- Após preencher de verde, disco viaja para a direita enquanto a máquina completa entra pronta por esse lado. Trajetória lateral encontra o prêmio no fim da troca; substitui a volta separada de topo/rolos. Modo normal 1,9 s; reduzido 0,9 s. Crédito e impacto continuam no mesmo fluxo.
- Ingressos sequenciais em 620 ms (normal) / 400 ms (reduzido), antes 700/450; mesmas três notas e contato sincronizado, sem sobrepor partidas.
- Conferidos deslocamentos opostos, máquina pronta, impacto e limpeza em navegador normal/reduzido. Build final de produção depois da conferência. Apenas prévia; carteira/regras preservadas.

## Prévia (2026-11-05 · Codex · centro verde e retorno em etapas)
- Ao revelar o multiplicador, centro verde cresce até cobrir o disco em 1,1 s (reduzido: estado final direto), mantendo número legível e leitura de 3,6 s.
- Elefante/nuvem e mostrador voltam primeiro. Disco verde com número permanece no centro e voa/encolhe até o prêmio. Após impacto e contagem, outras peças e cordas descem. Topo não se move de novo.
- Conferidos estados intermediários, origem, impacto antes do retorno dos rolos e limpeza; navegador/produção após a conferência. Nada financeiro alterado; só prévia.

## Prévia (2026-11-05 · Codex · centro da roleta e viagem contínua)
- Roleta 7% maior (374 px no palco nativo). Multiplicador sorteado pulsa três vezes no centro; reduzido conserva destaque sem escala. Leitura mantém 3,6 s.
- O próprio valor é destacado do centro e fica visível enquanto a máquina desce; depois viaja desse ponto ao mostrador do prêmio. Eliminado intervalo em que sumia com a roleta. Reduzido usa viagem reta curta, preservando a explicação visual. Nenhuma mudança financeira. Apenas prévia.

## Prévia (2026-11-05 · Codex · aro no instante de apertar)
- Batida do aro começa no mesmo pointerdown que prepara/pinta a face, sem os 120 ms e sem esperar o disparo posterior. Esse disparo não reinicia a batida manual; auto mantém fallback no pulso elétrico. Cancelamento/saída limpa a associação do toque.
- Teste usa pressão real, exige cor imediata igual à face e ausência de segunda batida. Órbita e mecanismos financeiros preservados. Só prévia.

## Prévia (2026-11-05 · Codex · pulso colorido no aro)
- Mesmo disparo elétrico do spin pinta o aro por um instante na cor preparada para a face. Camada sólida recortada pela máscara v3: 520 ms (320 ms reduzido), pequeno atraso de propagação 120 ms e retorno à iridescência. Nova batida substitui a anterior.
- Órbita cromática continua por baixo sem reiniciar. Nenhuma mudança em clique, som, prêmio ou carteira. Conferência visual/temporal no navegador; build de produção depois. Só prévia.

## Prévia (2026-11-05 · Codex · equilíbrio cromático do aro)
- Paleta circulante agora distribui 12 matizes em intervalos iguais de 30°, com saturação/luminosidade equivalentes. Vermelhos e verdes ganham espaço proporcional aos azuis/violetas/rosas. Mantidos brilho, máscara, clique e volta em 40 s.
- Conferidos quadros da animação e clique no navegador; build final de produção após conferência. Apenas prévia.

## Prévia (2026-11-05 · Codex · cores circulando no aro)
- Luz iridescente percorre o contorno do spin em 40 s por volta, sem girar ou mover a moldura. Camada cônica recortada pelo SVG v3, preservando amarelo/laranja e demais cores; arte original como base. Movimento reduzido mantém o acabamento estático.
- Conferidos movimento, contorno e clique no navegador; build de produção após conferência. Apenas prévia.

## Prévia (2026-11-05 · Codex · aro quente e descida visível)
- Aro iridescente v3 acrescenta amarelo/laranja mantendo recorte e cores restantes.
- Corrigida volta instantânea com movimento reduzido: máquina e cordas agora descem em 1,1 s retos nesse modo, ou 2,4 s no normal. Multiplicador só viaja depois.
- Regressão mede deslocamento vertical real dos itens nos dois modos e verifica cordas visíveis, não só a existência de uma animação. Só prévia; oficial e carteira preservados.

## Prévia (2026-11-05 · Codex · Bonus e aro mais vivo)
- Correção solicitada: título exatamente Bonus, sem acento. Aro iridescente v2 mais brilhante e saturado, com rosa/violeta/ciano e reflexos claros. Recorte e comportamento preservados; v1 guardada.
- Conferidos repouso/clique e título no navegador; build de produção depois da conferência. Só prévia.

## Prévia (2026-11-05 · Codex · aro iridescente e título Bônus)
- Título visível reduzido a Bônus. Novo aro vetorial `spin-rim-iridescent-v1.svg` com acabamento nacarado rosa/violeta/azul; mesmo recorte do dourado, sem alterar a face, a altura ou o clique. Aro anterior preservado.
- Conferência visual em repouso/clique e abertura do bônus; build final de produção depois do navegador. Só prévia.

## Prévia (2026-11-05 · Codex · pulsação contínua e leitura 3,6 s)
- Roletinhas mantêm o mesmo pulso de escala da carga vermelha, repetindo até subir; antes do vermelho não ficam pulsando. Movimento reduzido conserva só a luz. Resultado da roleta agora exposto por 3,6 s, mantendo retorno automático e sem confetes.
- Teste público verifica pulso infinito no vermelho e intervalo de leitura medido no navegador; nenhuma mudança em carteira, prêmios, rolos ou som. Apenas prévia.

## Prévia (2026-11-05 · Codex · chegada das cordas e luz no vermelho)
- Correção do pedido: cordas não aparecem prontas; descem por 2 s e assentam por 0,5 s antes do içamento de 3,6 s. Resultado fica 4,5 s; descida da máquina mantém 2,4 s.
- Roletinhas só prendem a luz ao atingir vermelho/10 cargas, permanecendo acesas até subir. Não ficam permanentemente acesas nos níveis anteriores. Removidos os confetes de barra cheia e resultado, mantendo luzes e o retorno automático.
- Navegador cobre fase das cordas, luz apagável antes do vermelho/contínua no vermelho, ausência de confetes, leitura, giro e retorno nos modos normal/reduzido. Capturas inspecionadas; build de produção após navegador. Apenas prévia.

## Prévia (2026-11-05 · Codex · celebração e leitura da roleta)
- Pedido de mais calma/festa: subida 3,6 s com entrada da roleta ao final; descida 2,4 s; resultado permanece 5,5 s antes do retorno automático. Comemoração da barra cheia em 2,2 s, mais confetes e duas ondas no resultado, com pausa final para leitura.
- Roletinhas das barras ficam iluminadas continuamente após carregar, inclusive entre pulsos e ao retomar; brilho só reinicia com o ciclo vazio. Movimento reduzido preserva leitura sem decoração intensa.
- Navegador verifica luz persistente, gesto/botão, resultado por pelo menos 5,4 s, retomada e retorno sem Aplicar, modos normal/reduzido. Capturas inspecionadas; build de produção após navegador. Apenas prévia; matemática, regras, saldo e sons preservados.

## Prévia (2026-11-05 · Codex · retorno automático da roleta)
- Dono pediu içamento mais lento e remover Aplicar. Subida agora 2,2 s; roleta entra ao final. Multiplicador permanece por 2,2 s, depois as cordas devolvem a máquina em 1,6 s e segue a viagem do multiplicador/prêmio.
- Movimento reduzido mantém o tempo de leitura sem içamento. Fluxo recuperado também fecha sozinho; falha de rede oferece Tentar novamente, com o mesmo fechamento idempotente existente. Nenhuma regra, prêmio ou saldo alterado.
- Tempo de leitura medido no relógio do navegador entre resultado e início do retorno; independente da duração das capturas no CI.
- Conferidos gesto/botão, tempo de leitura, volta automática e controles restaurados em navegador normal/reduzido, com capturas. Build final de produção depois do navegador. Apenas prévia.

## Prévia (2026-11-04 · Codex · roleta como troca de cena)
- Novo pedido: substituir modal por içamento da máquina/barras/controles com cabos. `wheel-transition.js` mantém os elementos reais montados, suspende-os juntos, preserva HUD/cenário e apresenta roleta no palco nativo. Botão e gesto preservados.
- Aplicar devolve o conjunto antes do multiplicador viajar ao prêmio. Saída/erro de animação restaura peças e controles; movimento reduzido troca sem içamento. Sem mudança em pagamentos, carteira, Firestore ou rolos.
- Verificados giro, retorno, retomada após atualizar e ausência de modal; capturas de içamento/roleta/retorno inspecionadas, modos normal/reduzido. Build final de produção após navegador. Somente prévia; oficial permanece em `7efe7b7`.

## Feito (2026-11-04 · Codex · face elevada do spin)
- A faixa traseira anterior parecia fundo porque a face começava abaixo dela. Corrigido o sentido: face sobe 4 px acima do encaixe e sobrepõe o topo do aro; frente mantém 8 px. Ao pressionar desce ao encaixe. Sombra de contato fica atrás da peça, sem faixa escura acima da face.
- Capturas de repouso/clique inspecionadas nos modos normal/reduzido; teste exige elevação traseira negativa em relação ao encaixe, não recesso. Sons, cores, folgas laterais e jogo preservados. Build de produção depois do navegador; só prévia.

## Entrega (2026-11-04 · Codex · publicada em produção)
- Workflow https://github.com/Ric-lab/King-Rico/actions/runs/41934050883 concluído com sucesso: verificações, regras REST e Hosting. Navegador no site oficial confirmou face elevada (-4 px), encaixe, configuração king-rico sem emuladores/carteira de teste, login disponível e rotas/assets respondendo 200; nenhum erro de página ou arquivo ausente. Nenhuma aposta em conta real foi feita.
- Dono aprovou o botão após `8620bb8` e autorizou publicar. Inclui som compartilhado de spin/auto/turbo, três ingressos sequenciais com dó/mi/sol no contato, trincas nas cinco linhas, líquido/roleta e correção da cor residual no spin.
- Validação da entrega: 191 testes de código e suíte completa de regras/transações no Firestore emulado passaram; navegador da prévia aprovado nos modos normal/reduzido. Build final de produção gerado após essas verificações.
- Histórico recente da `main` integrado antes da entrega; nenhum experimento de nove tambores restaurado. Produção usa Auth Google/Firestore reais; carteira fictícia permanece exclusiva de build:preview. Workflow de produção e publicador REST preservados.

## Feito (2026-11-04 · Codex · encaixe lateral do spin)
- Fechadas as folgas laterais: corpo a 8 px do alvo, sob o limite interno do aro; face a 10 px, deixando só 2 px de lateral colorida. Cantos da face ajustados ao contorno da moldura. Profundidades traseira/frontal e clique preservados.
- Capturas em repouso e pressionado inspecionadas; retorno normal/reduzido conferidos. Regressão de navegador verifica folga lateral; build de produção depois da conferência. Apenas prévia.

## Feito (2026-11-04 · Codex · volume contínuo do spin)
- Dono rejeitou o encaixe anterior. Removida a faixa traseira móvel isolada: corpo único contorna a face com 4 px atrás/lados e 8 px na frente. Ao clicar, face ocupa o encaixe do corpo; aro permanece fixo. Cores e sons preservados.
- Capturas de repouso/clique inspecionadas, retorno e proporção conferidos em movimento normal/reduzido. Build de produção após navegador. Apenas prévia; avaliação estética ainda cabe ao dono.

## Feito (2026-11-04 · Codex · cavidade visível atrás do spin)
- O relevo traseiro anterior ficava sob o aro dourado. Face e traseira acomodadas mais abaixo dentro da abertura, mantendo os 4/8 px de profundidade e o formato externo. Vão agora neutro e escuro, com sombra interna contínua até o fundo.
- Conferidos repouso/clique/retorno normal e reduzido, capturas inspecionadas. Teste do workflow passa a exigir traseira fora da área encoberta pelo aro. Som, pulso e carteira preservados. Só prévia.

## Feito (2026-11-04 · Codex · altura proporcional do spin)
- Traseira aumentada de 2 para 4 px, metade dos 8 px da frente. Face acomodada dentro do aro para tornar o relevo traseiro visível; ambos recolhem ao clicar, sem inclinação. Cores, pulso e som preservados.
- Conferidos botão solto/pressionado/retorno e proporção 1:2 em navegador normal e com movimento reduzido; capturas inspecionadas. Build de produção após a conferência. Só prévia.

## Feito (2026-11-04 · Codex · spin sem faixa residual)
- Corrigida a base que permanecia vermelha após aplicar a roleta: o estado ocioso sincroniza a cor confirmada em todas as peças, incluindo o retorno ao roxo inicial. Pulso radial e desligamento preservados.
- Pequena borda traseira colorida (2 px na geometria nativa), recolhida ao pressionar; frente mantém os 8 px e aro fixo. Sem mudanças de som, prêmios ou ingressos.
- Navegador cobre ciclo real de enchimento/roleta/aplicação, retorno ao roxo e geometria solta/pressionada nos modos normal e reduzido. Entrega somente na prévia.

## Feito (2026-11-04 · Codex · um ingresso e uma batida por vez)
- Os ingressos agora viajam sequencialmente, sem cópias futuras visíveis: 700 ms por voo normal ou 450 ms reduzido. O próximo só parte quando o anterior termina de ser absorvido. O contato segue unindo nota, contador e impacto.
- Mantidas dó/mi/sol, uma voz por chegada e caudas de 0,9/1,0/1,15 s. Ataque elevado a 0,48, corpo 0,30 e queda para 0,055 em 240 ms: cada nota tem uma batida presente, enquanto a cauda fica mais baixa para não misturar a próxima.
- Teste de navegador exige exatamente um ingresso visível em cada som, contato alinhado e intervalos de 700/450 ms. Render de áudio verifica ataque destacado da cauda, silêncio, uma voz e ausência de clipping. Nenhuma mudança de regras, prêmios ou demais sons.
- Entrega apenas na prévia; oficial inalterado.

## Feito (2026-11-04 · Codex · contato e ritmo dos ingressos)
- O som era chamado em `animation.finished`, já após o fade. Agora o ingresso chega visível ao contador aos 80% do voo: uma marca no relógio da animação dispara incremento, nota e impacto; somente depois ele é absorvido. Fim da animação continua como fallback, sem disparo duplicado.
- Chegadas espaçadas por 220 ms (160 ms reduzido), voo normal 900 ms/reduzido 600 ms. Áudio preparado antes de sair e ataque de 6 ms; mantidas as notas dó/mi/sol e suas caudas. Segurança de contagem independe de animação/áudio.
- Teste de navegador verifica no instante de cada som: ingresso ainda visível, centro a menos de 3 px do contador, incremento correspondente e espaçamento das três chegadas. Passou nos modos normal/reduzido, incluindo diagonais, líquido e roleta. Build de produção após o navegador.
- Só prévia; nenhuma alteração na matemática, regras ou projeto oficial.

## Feito (2026-11-04 · Codex · acorde dos três ingressos)
- `sfxTicket` agora cria uma única voz por ingresso: dó/mi/sol, timbre triangular filtrado, ganho 0,24 e caudas de 0,9/1,0/1,15 s. A última sustenta mais; as três notas formam um acorde ao se sobrepor. Removida a dupla camada curta anterior.
- Mantida a sincronização da chamada na chegada/contagem, assim como silêncio, volume, diagonais e demais sons. Nenhuma mudança de matemática ou regras.
- Verificação focada no navegador inclui render de áudio das três notas: uma voz por chamada, frequências complementares, cauda audível após 500 ms, silêncio e ausência de clipping. Fluxo real de três chegadas/sons e diagonais nos modos normal/reduzido. Build de produção após o navegador.
- Entrega apenas na prévia; oficial inalterado.

## Feito (2026-11-04 · Codex · toque próprio e diagonais dos ingressos)
- `sfxTicket` usa um toque próprio mais encorpado: três notas ascendentes em registro mais baixo, ganho principal 0,24/300 ms e camada aguda 0,07/140 ms. Acionado uma vez por chegada; sem alterar moedas ou outros efeitos.
- Trincas sorteadas entre as cinco linhas de `engine.LINES`: três horizontais e duas diagonais. Grade, prêmio e destaques coerentes; regras aceitam exatamente essas cinco posições, preservando resultados antigos.
- Conferido: unitários das cinco linhas; cinco testes do parque no Firestore emulado (incluindo reenvio sem crédito duplicado); navegador com ambas as diagonais e seus três sons, movimentos normal/reduzido, roleta e líquido. Capturas inspecionadas. Render de áudio verificou RMS maior que o dobro do toque anterior, sem clipping e com silêncio respeitado.
- Build de produção conferido após navegador. Apenas prévia publicada; nenhuma regra nem Hosting do projeto oficial alterados.

## Feito (2026-11-04 · Codex · volume e linha dos ingressos)
- Toque dos ingressos mais audível: ganho de 0,035 para 0,085 e duração de 120 para 180 ms. Moedas e demais efeitos não alterados; mantém volume/silêncio do menu.
- A posição era fixada nas casas 0/1/2. Agora `cloud/park.cjs` escolhe uma das três linhas horizontais; o modelo fictício usa o mesmo helper. Prêmio e casas destacadas recalculados pela grade exibida; chance de concessão e quantidade de ingressos preservadas.
- Fontes das regras Firestore aceitam exatamente uma trinca horizontal em qualquer linha, incluindo a primeira de resultados antigos. Unitários verificam as três posições e pagamentos. Cinco testes do parque no emulador passaram, incluindo reenvio sem crédito duplicado e uso de ingresso.
- Teste do navegador cobre trinca inferior/central e três sons na chegada, nos modos normal/reduzido. Capturas e resultado no workflow da prévia.
- Regras e core preparados na branch, mas nenhuma regra nem alteração foi publicada no projeto oficial. A prévia usa apenas carteira fictícia.

## Feito (2026-11-04 · Codex · animações da prévia e som do spin)
- Corrigido `build:preview`: a interface já embutida no cliente de teste era carregada novamente por `ui/park/client.js`. Removido somente esse script duplicado das páginas geradas; produção preservada.
- Movimento reduzido agora mantém o feedback essencial simplificado: líquido sem oscilar, ingresso em linha reta e giro curto da roleta; efeitos decorativos continuam suprimidos. Som da chegada também existe no encerramento sem voo.
- Spin usa o mesmo `click(down)` de auto/turbo para pressão e soltura.
- Conferido: teste de grafo de áudio e adaptadores/park; `tests/preview_motion_browser.py` com giros reais da carteira fictícia, nos modos normal/reduzido. Um enchimento por giro, três ingressos/três sons, roleta visivelmente girando, zero erros de página/assets. Capturas locais inspecionadas. Build de produção após navegador.
- Workflow agora confere esse fluxo de 3 fitas na URL publicada e guarda capturas; não usa o teste antigo de 9 tambores. Entrega na prévia; não publicar `main` sem aprovação do dono.

## Feito (2026-11-04 · Codex · som dos ingressos)
- `ui/park/motion.js`: cada chegada de ingresso toca `bell`, com os mesmos parâmetros usados pela moeda ao chegar ao saldo, sincronizado ao incremento do contador. Nenhum som durante o voo.
- Conferido no navegador local com carteira fictícia: três chegadas/três toques, silêncio respeitado e contagem completa mesmo com erro de áudio; sem erros de página. Build de produção conferido depois do navegador.
- Entrega somente na branch de prévia; `main` e site oficial sem mudança.

## Feito (2026-11-04 · Codex)
- Removidas do workflow da prévia a preparação do navegador e a execução de `tests/circus_depth_browser.py`, incompatíveis com as 3 fitas atuais. Build e deploy preservados.
- Conferida a `main`: não contém `.github/workflows/preview-channel.yml`; somente este registro foi atualizado lá, sem disparar publicação oficial.

## Próximo passo
- Aguardar feedback do dono sobre a versão publicada. Clown permanece guardado; Basquete/Bubble Plinko/Race Horse são apenas cards Em breve. Não implementar os três jogos sem novo pedido. Preservar Bounce, Pênalti, Flying e carteira compartilhada.
