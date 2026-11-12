# TODO — compartilhado (Claude, GPT/Codex, Gemini)

Uma lista só para os 3 modelos. Ninguém tem lista própria.
Regras: ler antes de começar; marcar [x] o que terminar, com commit e link de teste; acrescentar o que o dono pedir; nunca apagar item de outro modelo.

## A fazer
- [ ] Testar na prévia: zuum mais alto, háptico nas patadas/Tucker/Ray, raspagem audível
- [ ] Rolos da máquina — novos assets e pagamentos, NESTA ORDEM (menor → maior):
  ingresso 0,4 · circo 0,8 · capa 1,2 · moeda 2,5 · diamante 5 · coroa 10
- [ ] Símbolos especiais além desses:
  - Vilões: Tiger (Tony), Toucan (Tucker), Ray
  - Defesa: cedro — cada trinca dá 1, junta até 5; o Ray passa a roubar cedros
  - Happeach
  - Controle de videogame (abre um jogo ainda a definir)
- [ ] Refazer a economia (RTP ~90%) com a nova tabela antes de publicar
- [ ] Confirmar que a prévia engatilhada (dd789c1) mostra o Tucker no 1º giro sem ?demo
- [ ] Música de fundo no mesmo ritmo da abertura do Bingo Plinko (repo Ric-lab/Bingo-Plinko-Lucky-Machine), sem letra, só em alguns momentos
- [ ] Happeach → raio pêssego (borda laranja, sem texto, rosto menor) + placa igual à do ingresso no lugar da cesta, com contador e raio caindo no spin
- [ ] Tirar ingressos e atrações; no lugar: decidir entre minigames rápidos ou cedro mágico (defesa contra trinca de vilões)
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
