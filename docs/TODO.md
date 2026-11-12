# TODO — compartilhado (Claude, GPT/Codex, Gemini)

Uma lista só para os 3 modelos. Ninguém tem lista própria.
Regras: ler antes de começar; marcar [x] o que terminar, com commit e link de teste; acrescentar o que o dono pedir; nunca apagar item de outro modelo.

## Em andamento — nova fase do Circus (Codex)

Escopo reservado nesta tarefa: `cloud/` (perfil/motor v6/carteira), `firestore.rules`,
`ui/park/` (símbolos, defesa e retirada do acesso às atrações), Circus, catálogo/build,
testes e documentação da economia. Preservar sons, patadas e raspadinha aprovados.
Claude/Gemini: consultar este registro antes de editar os mesmos módulos; regras
compartilhadas, sem hierarquia entre agentes.

- [x] Seis pagantes: ingresso 0,4 · circo 0,8 · capa 1,2 · moeda 2,5 · diamante 5 · coroa 10.
- [x] Cedro: trinca dá 1, estoque até 5; gastar 1 para impedir uma ocorrência de Tony, Tucker OU Ray (confirmação atual do dono). Não converter ingressos antigos em cedros.
- [x] Controle de videogame: reservar asset; fora do sorteio até definir o jogo (confirmação atual do dono).
- [x] Ingresso deixa de ser recurso especial/entrada. Arquivar atrações e acessos, preservando fontes e assets.
- [x] Recalibrar/simular retorno próximo de 90%: 5 milhões por aposta e estresse, relatórios v6 compartilhados.
- [ ] Concluir regras Firestore v6 / persistência real antes de qualquer publicação oficial. Bloqueio: limite de 1.000 expressões; revisão automática rejeitou refatoração do validador central. Defesas de Tony/Tucker/Ray passaram; giros, feature e perdas sem defesa pendentes.
- [ ] Entregar lote v6 no Pages e confirmar o workflow, sem publicação oficial.

## A fazer
- [x] Dono testou e aprovou: patada nova, raspagem e moedas no fim da raspadinha — base f23d8d7 (prévia Pages).
- [x] Rolos da máquina — assets e pagamentos v6, NESTA ORDEM (menor → maior):
  ingresso 0,4 · circo 0,8 · capa 1,2 · moeda 2,5 · diamante 5 · coroa 10
- [x] Símbolos especiais além desses (v6 na prévia):
  - Vilões: Tiger (Tony), Toucan (Tucker), Ray
  - Defesa: cedro — cada trinca dá 1, junta até 5; o Ray passa a roubar cedros
  - Happeach
  - Controle de videogame reservado, fora do sorteio até definir o jogo
- [x] Refazer a economia (RTP ~90%) com a nova tabela — auditoria v6; regras reais ainda bloqueiam a publicação oficial
- [x] Engatilhamento antigo substituído na v6: padrão mostra trinca de cedros; `?demo=off` é jogo normal; `?demo=tucker` continua disponível para testar a cena, sem afetar o sorteio normal.
- [ ] Música de fundo no mesmo ritmo da abertura do Bingo Plinko (repo Ric-lab/Bingo-Plinko-Lucky-Machine), sem letra, só em alguns momentos
- [ ] Happeach → raio pêssego (borda laranja, sem texto, rosto menor) + placa igual à do ingresso no lugar da cesta, com contador e raio caindo no spin
- [x] Tirar ingressos como recurso e arquivar atrações; decisão confirmada: cedro protege dos três vilões, até 5. Ingresso comum paga 0,4×.
- [ ] Publicar no site os sons novos, depois que o dono aprovar na prévia

## Ideias soltas (não fazer sem o dono pedir)
- King Rico caindo da nuvem até a roleta

## Feito
- [x] Patada do Tony = um som só, contínuo (zuum que desce até o grave, sem 'tachi-bom') — prévia
- [x] Patada do Tony mais alta (zuum + impacto grave); raspagem bem mais alta; moedas no fim da raspadinha = mesmo tique do voo de moedas do jogo — prévia
- [x] Roleta aprovada pelo dono
- [x] Tony: véu alaranjado cobre a tela toda MENOS a faixa do anúncio (AdMob 60px + área segura, ou .park-banner) — prévia
- [x] Tony: patada = zuum de ar (sem moedas); moedas saindo só ao tocar CONTINUAR — prévia (1º giro = Tony)
- [x] Sfx da raspadinha: raspar cada casa, abrir casa (plim no prêmio, toque grave no ×), 3 iguais (fanfarra) + prêmio aparecendo, botão (mesmo do spin), moedas subindo ao fechar — prévia (abre sozinha ao carregar)
- [x] Tony Tiger: efeito alaranjado/avermelhado na tela toda durante as patadas (prévia)
- [x] Roleta: sfx na parada mostrando o valor (fanfarra, grande em ×5/×10) + sfx da ficha batendo no prêmio (baque + plim) — prévia
- [x] Roleta: moedas voavam 2× (economia v5 = prizeVersion 4 não adiava o voo do giro); agora só o voo final — prévia
- [x] Prévia oficial agora é o GitHub Pages: https://ric-lab.github.io/King-Rico/circus (Firebase da prévia estourou 10 GB/mês; workflow Firebase da prévia fica só manual)
- [x] Sons dos vilões, big win, spin igual ao turbo, volumes equalizados (prévia)
- [x] Som antigo da roleta gravado em arquivo (prévia)
- [x] Tucker com duas batidas de asa (prévia)
- [x] Prévia engatilhada: 1º giro mostra a última mudança; ?demo=off = normal
