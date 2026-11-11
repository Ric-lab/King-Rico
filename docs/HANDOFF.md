# HANDOFF

## Recuperação da prévia no GitHub Pages — em implantação

- Tentativa REAL enviada no merge c702acb (preservou o ajuste de áudio fbe911d do Claude). Workflow https://github.com/Ric-lab/King-Rico/actions/runs/43118758132 falhou na configuração do Pages, ANTES de build/deploy: HTTP 403 do GitHub. Não há novo link publicado. Código e navegador local do subdiretório passaram; não é uma falha do jogo nem uma nova cobrança.
- Bloqueio concreto: a credencial GITHUB_TOKEN não pode alterar a fonte do Pages existente. Solicitado ao dono abrir https://github.com/Ric-lab/King-Rico/settings/pages e selecionar Build and deployment > Source > GitHub Actions. Quando confirmar, repetir os jobs falhos do workflow 43118758132 e acompanhar até publicação e checagens HEAD aprovadas. Se ambiente github-pages negar a branch, informar a restrição real ao dono, sem contorná-la.
- Após esgotar a franquia Firebase, o dono pediu uma prévia utilizável imediatamente. Preparado GitHub Pages no MESMO repositório, sem nova conta e sem alterar produção/Firestore.
- Novo workflow `preview-pages.yml`: publica somente a branch de integração `codex/penalty-clown-preview`; usa configuração/artefatos/implantação Pages oficiais. A suíte completa continua no runner antes de publicar. Nenhum navegador completo usa Firebase ou Pages público; pós-deploy só HEAD.
- O workflow tenta configurar o Pages existente como Actions usando apenas `GITHUB_TOKEN` com `pages:write`. Domínio próprio existente bloqueia a substituição. Se o GitHub negar configuração/permissão de ambiente, informar o erro real e pedir ao dono o ajuste exato em Settings > Pages / Environments; não contornar proteção nem pedir token em chat.
- Firebase preview mudou para execução MANUAL nesta branch para evitar outra publicação no projeto com cota esgotada. Workflow de produção e seu publicador REST não foram alterados.
- `build:preview -- --base=/King-Rico` adapta SOMENTE os URLs dos arquivos gerados. Não altera produção, separadores `/`, URLs externas ou `/api/play` (API fictícia interceptada no navegador). O build de prévia sem --base mantém o comportamento anterior.
- Verificação local concluída: unitários de base path e isolamento passaram; navegador sob /King-Rico abriu Circus/parque/Penalty/Flying/Bounce/Fingo, girou com moedas de teste, repetiu requisição sem novo débito, recarregou preservando saldo e navegou pelos controles. Zero assets ausentes, erros JS ou requisições escapando do subdiretório. Não houve acesso à carteira real. Captura work/preview-pages-park.png.
- Próximo passo: conferir workflow Pages; fornecer somente a URL confirmada pelo deploy e pelas checagens HEAD. Não anunciar o endereço como pronto se a configuração ou implantação falhar. A prévia Firebase continua sujeita à cota mensal; a mudança não restaura seus GB.

## Limite de transferência da prévia — 11/11/2026

- O dono recebeu aviso de 10/10 GB de download mensal no projeto Spark **king-rico-previa-1408805633**, separado de **king-rico** (oficial). O oficial respondeu HTTP 200 em verificação HEAD; não foi modificado nem recebeu plano pago.
- O workflow executava todos os 12 navegadores DEPOIS do deploy, com `KING_RICO_TEST_URL` apontando para o Firebase. Cada novo contexto recarrega assets, consumindo transferência repetidamente. Esse fluxo contribuiu para o consumo; não temos a divisão completa da fatura por origem e não atribuímos todo o tráfego aos testes.
- Correção: a MESMA suíte completa agora roda ANTES da autenticação/deploy, com `dist/` servido no próprio runner. Após publicar, somente seis requisições HEAD verificam rotas, cliente, runtime/Three e imagem; não baixam os corpos dos assets. Nenhum teste foi retirado. Produção e publicador REST inalterados.
- Verificação proporcional: build de prévia; teste de navegador `circus_columns_browser.py` contra servidor local passou, sem erros JS/assets. Medição local sem compressão: 150 respostas, 15.537.852 bytes (~15,54 MB) nesse único teste; isso NÃO é o valor faturado pelo CDN. YAML validado, isolamento e guarda de orçamento do workflow testados. Não repetir a suíte completa contra o Hosting para validar esta correção.
- Os 10 GB já consumidos NÃO são recuperados com esse patch, novo deploy ou exclusão de releases. No Spark, o site de prévia pode ficar suspenso até renovar a franquia. Não criar projetos Firebase descartáveis para contornar o limite e não ativar Blaze sem decisão expressa do dono.
- Entrega de fontes com `[skip ci]` para não disparar outra publicação durante o incidente. Correção do workflow sincronizada nas branches main/prévia sem promover os ajustes de áudio do Claude ao oficial. Prévia hospedada NÃO foi reativada por este checkpoint.
- Próximo passo: dono decide aguardar a renovação ou conectar uma hospedagem estática gratuita para a prévia (por exemplo, Cloudflare Pages). Se usar Pages: branch `codex/penalty-clown-preview`, build `npm run build:preview`, saída `dist`, Node conforme `.nvmrc`; carteira fictícia, sem credenciais Firebase de produção. Confirmar limites atuais do plano e validar o novo endereço antes de anunciá-lo. Oficial continua https://king-rico.web.app.

## Prévia (2026-11-11 · Claude · som da roleta = tique original em arquivo)
- Dono preferiu o tique ORIGINAL gerado por código. Renderizado exatamente (mesmo envelope de fc.tone) em 5 velocidades: `assets/sfx/wheel-tick-0..4.wav`. `ui/park/wheel-sound.js` toca o arquivo da velocidade mais próxima pelo bus do Circus; se não carregar, cai no fc.tone (mesmo som). Removido o tique Kenney (wheel-tick.wav).
- Próximo passo: dono ouvir na prévia; publicar só com aprovação.

## Prévia (2026-11-11 · Claude · tique real da roleta)
- `ui/park/wheel-sound.js` agora toca um tique gravado (`assets/sfx/wheel-tick.wav`, Kenney Interface Sounds tick_002, CC0) em vez dos dois tons gerados. Velocidade muda só um pouco o tom/volume. Se o arquivo não carregar, cai no som antigo. Crédito em `assets/sfx/CREDITS.md`.

## Prévia (2026-11-11 · Claude · efeitos sonoros do Circus)
- Só som; nada de regra, tempo, saldo ou animação mudou.
- Novo `ui/park/circus-sfx.js` (instalado em index.js): sfxVillain (entrada de Tony/Tucker/Ray), sfxClaw + sfxCoinsLose (patadas do Tony e moedas saindo), sfxSnatch (Tucker leva a cesta), sfxSneak + sfxScurry (Ray pega e foge com os ingressos), sfxTakeoff + sfxEngine (voo da big win, motor sobe com a altitude) e sfxBank (saldo recebendo no fim do voo).
- Spin: tirado o sfxWhoosh do doSpin; o botão de spin agora soa igual ao turbo (só o clique) + chiado dos rolos.
- Volume equalizado por medição offline (RMS ≈ 0,04 = vitória comum). Ingresso estava 2,3× mais alto: picos 0,48/0,30/0,055 → 0,21/0,13/0,024.
- Próximo passo: dono ouvir na prévia; publicar na main só com aprovação.

## Publicação oficial autorizada e concluída — Circus v5

- O dono autorizou publicar a prévia aprovada. Código publicado: `b394d9f3346f9871c542ec17784d8a59ad71e37d`, tag `circus-economia-v5-90-20261111`; mesma revisão validada na prévia.
- Workflow oficial concluído com sucesso: https://github.com/Ric-lab/King-Rico/actions/runs/42940263606. Passaram 248 testes de código e 67 testes Firestore; regras publicadas pelo publicador REST existente e Hosting publicado em https://king-rico.web.app.
- Conferência pública após deploy: `/circus`, `/cloud/client.js`, `/ui/park/client.js` e `/ui/park/reel-tape.js` retornaram HTTP 200 e bytes iguais ao build de produção aprovado. Cliente oficial v5 e acumulador do ciclo presentes. Nenhuma aposta em conta real foi feita.
- Este checkpoint altera somente documentação de autorização/estado publicado, com `[skip ci]`; não muda o código servido nem repete deploy. Main e prévia recebem a mesma documentação.
- Próximo passo: recolher feedback do dono no oficial. Manter os limites, a tabela, os recibos antigos e a aposta livre documentados abaixo; não restaurar o bônus vulnerável a apostar alto só no décimo giro.

## Circus v5 — nova economia e aposta livre (11/11/2026 · Codex)

- Base main/prévia confirmada na API do GitHub: 21f4ed4. Um fetch do transporte Git local devolveu a ref antiga 1d730fb; a API/Actions confirmam 21f4ed4 e publicação v4 aprovada. Preservar a base atual; não restaurar assets/documentos a partir dessa ref local antiga. Atualização será fast-forward, sem force push.
- Pedido atual do dono substitui probabilidades fixas/escala v4: tabela literal, cedro fora do jogo mas arte guardada, Tony 1–25× aposta, Tucker 1–4 Happeach, Ray 5–50% dos ingressos com arredondamento inteiro; quantidades limitadas ao recurso disponível. Normal truncada dentro do intervalo efetivo, pontas raras. Nenhum prêmio simultâneo a vilão.
- Tabela v5 por índice estável: `[2.5,.4,.8,1.2,5,0,10,15,20,25]`; cedro índice 5 tem peso zero e está inativo na tabela/fita. PAYS v3/v4 e recibos já pagos preservados.
- Controle persistente em `park.economy`: moedas pagas + roleta − Tony + ingressos emitidos×25 − Ray×25; contabiliza apostas do Circus, sem recargas/diárias/outros jogos. Só sorteia perdas quando há excedente sobre 90%, respeitando saldo/estoque. Orçamento e histórico protegidos nas escritas atômicas vinculadas. Replay não debita, não aumenta contador e não paga duas vezes; falha visual não participa do crédito.
- **Decisão explícita posterior do dono:** aposta deve continuar livre. O primeiro desenho mantinha prêmio garantido sobre a aposta do décimo giro e foi REPROVADO: nove apostas 1 + décima 1000 retornavam 300,70%. Não publicar nem restaurar essa regra na v5.
- Nova roleta a cada dez giros: base = **4% da soma das apostas registradas no ciclo**, acumulador `cycleWagerUnits`. Prêmio normal do décimo giro sorteado/pago normalmente, separado da base; `prizeVersion:4` paga o valor TOTAL da base×multiplicador apenas no sorteio da roda. Fechar zera a reserva. Roda v3 antiga continua com seu crédito extra original. Migração não inventa apostas antigas. Explicação atualizada no menu.
- Auditoria FINAL: 5.000.000 giros POR aposta, seed 472831; fonte/reprodução/hashes em `docs/circus-economy-v5-audit.json` e `scripts/economy-audit.mjs --circus-v5`. V4 reexecutada com 20 milhões de giros, resultados idênticos aos aprovados (relatório anterior atualizado com hashes atuais).

| Aposta | Giros | Moedas + roleta − Tony + ingressos emitidos×25 | Também descontando Ray |
|---:|---:|---:|---:|
| 1 | 5.000.000 | 90,176344% | 89,997844% |
| 10 | 5.000.000 | 90,146887% | 89,988937% |
| 100 | 5.000.000 | 90,138050% | 89,980025% |
| 1000 | 5.000.000 | 90,156199% | 89,996197% |

- Stress aposta variável, 1.000.000 giros por política, seed 51421: alternar 1/1000 → 90,090864% bruto / 89,949900% líquido; nove apostas 1 + décima 1000 → 89,899573% / 89,897566%. `scripts/circus-control-sessions.mjs` + `docs/circus-economy-v5-stake-stress.jsonl`; gate automatizado também exige 88,5–91,5% e nenhum caso >100%.
- **Limitação que precisa ser comunicada:** perdas são mais fortes, porém a frequência efetiva NÃO aumentou. Com esses PAYS e a nova base da roleta, o controlador precisou de poucos eventos: Tony 0,059–0,113%, Tucker 0,064–0,167%, Ray 0,049–0,115% de todos os giros. Não anunciar chances fixas nem mais roubos; aumentar simplesmente a frequência faria cair o retorno. Direção para o próximo ajuste é questão de experiência, mantendo auditoria.
- Regras: mantidos limites de perda, metadados, saldo e orçamento; avaliações repetidas foram reduzidas para caber nas 1.000 expressões do Firestore. Cap exato Tony e faixa/orçamento de recursos conferidos na escrita OBRIGATÓRIA do parque, com mesma operação nova da carteira. Rejeições automáticas de uma proposta alternativa de remoção de guardas foram respeitadas; ela NÃO foi aplicada. Corrigida divisão em ponto flutuante ao arredondar a reserva proporcional do Tucker; caso 751 unidades / 3 Happeach incluído em teste.
- Testes novos/ajustados: circus-v5/control-v5/truncated-normal (tabela literal, cedro, distribuição, limites, zero, orçamento, décimo giro e reserva), circus-audit (v4/v5 e stress), circus-preview-economy (v3 explícita e equivalência v5), integration (concorrência, outro aparelho, replay, histórico adulterado, reservas, contadores, versões e resgate), browsers helpers/circus, circus_columns/payout, villains_release/prize_release para v5. Não alterar a regra para satisfazer fixture antiga.
- Validação local final concluída: `npm test` passou (45 arquivos); auditorias v4/v5 e stress passaram; 67 testes Firestore passaram, incluindo reserva fracionária do Tucker, zero, replay e falsificações. Navegadores `villains_release_browser.py` e `prize_release_browser.py` passaram com autenticação/carteira emuladas, três perdas reais, reload, catálogo e assets sem erros. Os 12 navegadores da prévia passaram na primeira revisão; depois da base financiada, `preview_motion`, `circus_columns` e `wheel_sound` foram reconferidos e passaram, incluindo liquido, ingressos, multiplicação e áudio. Capturas Tony/Tucker inspecionadas. Build final de produção gerado DEPOIS da integração; o workflow da prévia reconfere todos os 12 no canal remoto.
- Entrega de código confirmada: tag imutável `refs/tags/circus-economia-v5-90-20261111` aponta para b394d9f, aprovado na prévia e publicado oficialmente após autorização do dono; ver registro no topo.
- Próximo passo atualizado: dono avaliar o oficial. Claude: `git pull --ff-only origin codex/penalty-clown-preview`, ler o registro de publicação no topo e ECONOMIA.md; não reaplicar a economia v4.

## Auditoria da economia do Circus v4 (2026-11-10 · Codex)
- Autorização atual do dono substitui a entrega anterior apenas ao Claude: auditar/calibrar, aprovar prévia e só depois publicar a MESMA revisão na main via fast-forward. Nunca publicar fora da faixa de 88,5–91,5% ou com retorno acima de 100%.
- Base puxada: 64c4142. Auditoria final real: 5.000.000 giros POR aposta, seed 472831. Fórmula = moedas base/especial + extra da roleta − Tony + ingressos emitidos ×25. Ray líquido informado separadamente.

| Aposta | Giros | Retorno total | Após perdas de ingressos do Ray |
|---:|---:|---:|---:|
| 1 | 5,000,000 | 90.302045% | 90.147545% |
| 10 | 5,000,000 | 90.317389% | 90.175939% |
| 100 | 5,000,000 | 89.710473% | 89.562948% |
| 1000 | 5,000,000 | 89.437801% | 89.381376% |

- PAYS finais [8.576,.4,.8,4.992,1.92,11.52,17.28,32,43.52,115.2]; escala 1,28 somente nos oito permitidos. Tambor/tenda preservados. Divisor ingresso 690→40000; probabilidades Tony 5%/Tucker 2,5%/Ray 2,5% e roleta a cada 10 inalteradas. Os quatro IC95% do retorno total também ficaram inteiros na faixa.
- Fonte/reprodução e limitações: docs/ECONOMIA.md; relatório completo e hashes em docs/circus-economy-audit.json, base reprovada em circus-economy-before.json. Não reexecutar o script antigo sem --circus-v4 para validar esta tabela: ele mantém o relatório dos outros jogos por compatibilidade.
- Firestore: validação do Tony ajustada ao 1,5× que JÁ estava no motor 64c4142; teto do prêmio acompanha PAYS (9216×), sem mudar pagamentos para satisfazer teste. UI só recebeu explicação correta do limite do Tony.
- Testes atualizados: circus-economy/tony/resource-villains e integration (PAYS, metadado .80, fronteiras e limite 1,5×); circus-audit novo (5 milhões, faixa, fórmula e hashes); navegadores bigwin_flight/circus_columns/circus_payout/preview_motion/prize_release/villains_release e helper circus (valores da tabela atual e sorteios determinísticos). Não alterado o jogo para passar testes.
- Verificação local concluída: npm test passou; teste do relatório e contratos financeiros (15 casos) passou; 65 testes Firestore passaram; os 12 navegadores da prévia passaram (casos atualizados reconferidos); villains_release_browser e prize_release_browser passaram com login/carteira reais emulados, sem assets ausentes ou erros JS. Build final de produção gerado após todos os navegadores.
- Commits da prévia e main: o MESMO objeto Git identificado pela referência imutável `refs/tags/circus-economia-v4-90-20261110` (resolver SHA com `git rev-parse circus-economia-v4-90-20261110^{commit}`). A tag só será publicada após o workflow da prévia aprovar este commit. A referência identifica exatamente a revisão aprovada nas duas branches. Base de partida 64c4142; main anterior b0ffe91.
- Sequência de entrega: prévia sem [skip ci] → aguardar sucesso completo → main via fast-forward do mesmo objeto, sem [skip ci] → conferir sucesso oficial e refs/tag iguais. Nunca trocar conteúdo após aprovação da prévia nem pular testes.
- Próximo passo após essa sequência: dono avaliar o balanceamento no oficial. Se algum gate falhar, corrigir primeiro na prévia, repetir seu workflow e não publicar main.

## Prévia (2026-11-10 · Claude · economia do Circus)
- Pedido do dono: pagava demais, vilões raros, "saldo nunca cai". Meta: moedas + ingressos (25 moedas cada) = 90%.
- `cloud/circus-profile.cjs` PAYS → [6.7,.4,.8,3.9,1.5,9,13.5,25,34,90] (tambor 0,6→0,4; tenda 1→0,8; topo maior). TARGET_COIN_RTP .80.
- `cloud/park.cjs`: vilões 10% (Tony 5%, Tucker/Ray 2,5%); Tony leva até 1,5× aposta (máx. 5% do saldo); ingressos com chance min(14%, aposta/690).
- Simulação com o código real (120 mil giros): aposta 1 → 87%, 10 → 89%, 100 → 81% (topo 90× = alta variância; amostra pequena). Codex: rodar `scripts/economy-audit.mjs` com milhões de giros e ajustar testes que esperam TONY_CHANCE .01/3 ou PAYS antigos.
- Não publicado na main. Dono testa na prévia antes.

## Entrega de fontes ao Claude (2026-11-10 · sem deploy)
- Dono determinou: o Claude fará a publicação. Codex entrega o som 6c25bad à branch codex/penalty-clown-preview em checkpoint [skip ci], sem push à main e sem disparar publicação.
- Integrado o último commit do Claude d2a9918, preservando sua paleta fixa por valor e teste atualizado. Merge automático sem conflito; som da roleta em ui/park/wheel-sound.js, demais sons intactos.
- Testes do áudio já passaram (unitários, botão/swipe/silêncio); unitários reconferidos após juntar as fontes. Não houve novo build/deploy para este checkpoint.
- Próximo passo EXATO para Claude: git pull --ff-only origin codex/penalty-clown-preview; conferir o som da roleta e promover/publicar pelo workflow conforme sua autorização com o dono. O som já está integrado: não reaplicar 6c25bad nem restaurar o efeito provisório 5deec35.

## Prévia (2026-11-10 · Claude · cor fixa por número na roleta do bônus)
- Antes a cor era por POSIÇÃO (arco-íris de 13 casas), então x1 aparecia em 5 cores. Agora cor por VALOR em `ui/park/wheel-palette.js`: x1 azul, x2 verde, x3 amarelo, x5 laranja, x10 rosa. Roleta, disco-meta dos tubos, centro e ficha que voa usam a mesma cor. Sem mudança financeira.
- Som da roleta: o Claude tinha posto um som provisório (5deec35) e DESFEZ; o som original é o do Codex em `ui/park/wheel-sound.js` (commit local 6c25bad), já integrado na entrega de fontes registrada acima.
- Atenção: tests/wheel_color_browser.py pode esperar as cores antigas por índice; ajustar o teste se falhar.
- Próximo passo: dono avaliar na prévia; não publicar main sem aprovação.

Estado atual e próximo passo. Qualquer modelo: ler antes de começar; atualizar ao parar (feito + próximo passo).
Regras gerais ficam em `docs/skills/` — não repetir aqui.

## Som da roleta de bônus (2026-11-10)
- Dono relatou giro silencioso e pediu preservar o restante. Não há MP3/WAV no projeto/histórico consultado: o timbre de referência é Wheel.tick em Fortune Wheel.dc.html (dois osciladores Web Audio). A roleta de bônus não chamava um efeito de giro.
- Ligado o mesmo timbre ao ângulo real do rotor por ui/park/wheel-sound.js. Máximo um par de notas por 35 ms; desacelera com as casas, segue botão/swipe, respeita volume/silêncio, para no resultado/erro/remoção da roda. Falha de áudio não altera animação, sorteio ou recebimento.
- Som do spin, moedas, ingressos, tempo/arte da roleta e matemática intactos. Três unitários e navegador focado (botão/swipe/silêncio, contexto Web Audio ativo e parada) passaram. Build de produção após integração.
- Publicação ainda NÃO efetuada: revisão automática rejeitou o push à main/prévia por não considerar a autorização histórica suficiente para esta alteração específica de áudio. Correção pronta em commit local; solicitar confirmação do dono antes do push/deploy.
- Decisão posterior do dono: Claude fará a publicação. Entrega de fontes no topo substitui o plano anterior; Codex não envia à main nem executa deploy. Preservar feedback sonoro aprovado em ajustes visuais posteriores.

## Correção de linhas, moedas e passagem dos vilões (2026-11-10)
- Linhas nativas ficavam sob células z-index 2; todos os oito marcadores recebem data-payline e camada 6. Voo normal ainda usava origem de apenas cinco linhas, produzindo NaN nas verticais: agora deriva origem/destino dos elementos visíveis, com fallback finito. Renderer 2D é criado sob demanda se o carregamento ocioso ainda não terminou, sem duplicar na inicialização atrasada.
- Fita intermediária tinha só 12 símbolos, excluindo IDs 12/13/14. Ciclo visual de 15 inclui Tony/Tucker/Ray, mantendo símbolos iniciais/finais do recibo intactos. Não altera sorteio real (1% total dos giros elegíveis), limites de roubo, pagamentos ou regras.
- Teste de fita passou; navegador focado conferiu os oito destaques acima dos rolos, pixels reais nas moedas, coordenadas finitas e saldo final. Conferência curta adicional viu os três animais atravessando o recorte visível durante o giro. Capturas work/preview-payout-* e preview-villains-passing.png inspecionadas. Build final de produção após navegador.
- CI de 6cb7c1d detectou fixture antiga sem getBoundingClientRect no teste de centavos/chegada das moedas; atualizada com geometria do palco. Teste de adaptadores executado novamente, sem mudança de runtime.
- Próximo passo: conferir workflow oficial do commit corretivo e artefatos servidos no site; depois feedback do dono. Preservar o conjunto completo publicado anteriormente.

## Publicado (2026-11-10 · conjunto completo, correção de escopo)
- A publicação f4904b7 levou somente a cor da roleta; o dono esclareceu que quer TODAS as mudanças da prévia. Merge completo de 8bfedfc sobre main f4904b7, preservando login, carteira real, bônus diário e workflows existentes.
- Inclui fundo escolhido 151169/01-jardim, botão vinho/dourado no contorno aprovado, Tony/Tucker/Ray e refinamentos de movimento/arte da prévia. Não promover carteira fictícia ou demos ao build oficial.
- Tucker/Ray antes só tinham demos: integrados a cloud/park.cjs, transações e regras. Cliente real v4; faixa fixa de 1% total dividida entre os três vilões, fora do décimo giro. Tony até uma aposta/5% pós-aposta, Tucker até 1 Happeach com banca proporcional, Ray até 1 ingresso; zero faz cena sem perda. Sem prêmio simultâneo; recibos antigos preservados.
- Simulação e limites em ECONOMIA.md/circus-villains-audit.json. Testes de regras incluem concorrência, outro aparelho, zero e falsificação de perdas/grade/recursos. Navegador emulado confere os três eventos reais, assets, fundo, botão e reload. Build final de produção após integração.
- Validação local concluída: 65 testes Firestore/transações; suítes unitárias existentes e teste novo de recursos; navegadores villains_release_browser, prize_release_browser e park_browser passaram. Capturas dos três vilões inspecionadas, sem assets faltantes/erros JS. Build final de produção gerado depois da integração.
- Publicado código 53c4f9e. Workflow oficial https://github.com/Ric-lab/King-Rico/actions/runs/42725728715: verificar e publicar concluídos com sucesso, incluindo regras REST e Hosting. HTTP 200 e bytes iguais ao build para cliente real, interface, fundo, aro e assets dos três vilões; /circus abre HTTP 200. Sem aposta em conta real.
- main e codex/penalty-clown-preview compartilham o merge; Hosting da prévia 42725726287 também concluído, regressões online da prévia ainda em execução na conferência. Este checkpoint só documenta a entrega, não publica novo runtime.
- Próximo passo: feedback do dono no oficial; preservar este conjunto completo nas próximas publicações. Não confundir f4904b7 (parcial) com 53c4f9e.

## Prévia (2026-11-09 · cor do resultado da roleta)
- Centro expansivo e disco viajante usam a cor da casa sorteada pelo índice na paleta, inclusive após recarga. Valores repetidos não determinam a cor. Sem alteração financeira, de geometria ou de duração.
- Teste focado de navegador passou para roxo, amarelo e rosa, com movimento normal/reduzido, centro e voo. Capturas work/preview-wheel-color-*.png inspecionadas. Build de produção conferido após integração.
- Próximo passo: dono avaliar na prévia online após Hosting desta revisão; oficial inalterado. Não afirmar suíte online concluída antes de conferir Actions.

## Prévia (2026-11-09 · fundo confirmado pela imagem 151169)
- Dono enviou a imagem exata desejada: é docs/concepts/circus-background-options/01-jardim.webp, com tenda vermelha grande à esquerda, pavilhão azul à direita e gramado claro. A interpretação anterior por números estava ERRADA; não usar 03-parque como escolha do dono.
- Copiada sem editar/recomprimir para assets/scenes/circus-garden-lawn-v1.webp; referências do fundo do Circus e preload corrigidas. Cenários dos demais jogos/parque e controles preservados.
- Teste focado de abertura/toque normal e reduzido; capturas work/preview-circus-screen-*.png inspecionadas. Conferir Actions da revisão.
- Próximo passo: dono avaliar a imagem 151169 atrás da máquina na prévia. Usar a imagem enviada como referência inequívoca, sem presumir ordem/número exibido no chat. Oficial inalterado.

## Aplicação anterior por interpretação incorreta (2026-11-09)
- Interpretação incorreta do agente pela numeração: aplicou a opção 3. Aplicada sem editar/recomprimir em assets/scenes/circus-park-lawn-v1.webp, só no fundo normal do Circus; manifesto de preload atualizado. Tendas laterais, gramado aberto sem caminhos, vegetação e céu azul.
- Botões/posições/rolos e fundos dos outros jogos/parque preservados. Sem alteração financeira ou nova geração de arte. Teste focado de abertura/paleta/toque normal e reduzido, com captura de tela completa work/preview-circus-screen-*.png; conferir Actions da revisão.
- Próximo passo: dono avaliar a opção escolhida atrás da máquina na prévia. Não pedir novamente qual opção nem aplicar a versão chapada rejeitada. Oficial permanece sem mudança.

## Opções de fundo apresentadas (2026-11-09 · depois escolhida a 3)
- Pedido explícito: três imagens para escolher. Geradas a partir do fundo atual, sem caminhos: 1 jardim diurno, 2 campo ao entardecer, 3 parque verde/azul. Artes em docs/concepts/circus-background-options; PNGs preservados e origem registrada no asset-pipeline.
- Nenhuma opção aplicada ao runtime. Fundo atual preservado; sem builds/testes/deploy. Checkpoint [skip ci] para compartilhar propostas.
- Decisão posterior do dono: opção 3 aprovada; integração registrada acima.

## Fundo — tentativa rejeitada (2026-11-09)
- Dono pediu menos ruído/caminhos e cores mais sólidas, mas rejeitou a imagem circus-lawn-simple-v1 por parecer infantil. Tentativa interrompida antes da publicação; referências no CSS/manifest/teste restauradas ao estado anterior.
- Fundo atual preservado. Arte rejeitada fora do runtime em work/rejected-backgrounds e original em generated_images; não usar. Nenhum teste ou novo build necessário para este registro.
- Próximo passo: respeitar o acabamento existente ao simplificar; não continuar a direção visual rejeitada nem gerar outra versão sem nova orientação do dono.

## Prévia (2026-11-09 · contorno original do aro, só recolorido)
- Dono confirmou que quer o contorno anterior do aro iridescente, apenas dourado. Criado spin-rim-gold-contour-v1.svg a partir do SVG aprovado: apenas 12 valores de cor mudaram. Paths, strokes, abertura, espessuras, dimensões e viewBox preservados; equivalência estrutural conferida ignorando somente cores.
- Referência do botão e máscara do pulso usam esse SVG. Corpo vinho, letras douradas, posição, tamanho e clique preservados. O antigo spin-rim-v3.svg tem outro contorno e foi retirado desta montagem.
- Verificação focada de paleta/toque normal e reduzido, com captura work/preview-spin-wine-*.png; conferir Actions no commit da revisão. Próximo passo: dono avaliar aro na prévia, sem alteração do oficial.

## Prévia (2026-11-09 · spin vinho e dourado)
- Dono pediu aro/letras dourados e corpo vinho como a barra de +/−. Reaproveitado spin-rim-v3.svg e gradiente vinho da base-controls-v4. Pulso permanece na paleta vinho/dourado; barras/roletas conservam arco-íris. Profundidade, geometria, som/háptico e clique preservados.
- Teste focado do navegador (KING_RICO_PALETTE_ONLY=1) em normal/reduzido passou, com aro/texto/cor e toque/cancelamento; capturas work/preview-spin-wine-*.png inspecionadas. Regressão completa teve expectativas atualizadas para a paleta nova e será executada pelo workflow. Nenhuma mudança financeira.
- Próximo passo: dono avaliar o botão na prévia; oficial continua inalterado. Conferir Actions desta revisão antes de afirmar sucesso da suíte online.

## Prévia (2026-11-09 · Ray levando a placa inteira)
- Dono rejeitou o andar e pediu surgimento direto atrás do contador, saída carregando seu asset e retorno após modal, como Tucker. Removidos passos, aproximação e bilhete avulso; contador real clonado na mesma escala/posição, original escondido. Ray e cópia saem juntos à esquerda.
- Placa carregada mantém contagem anterior; após Continuar o original volta com a contagem confirmada. Zero ingressos também funciona. Sem nova arte ou alteração de economia/persistência.
- Teste focado de navegador normal 390 px e reduzido 320 px: surgimento ancorado/rosto no enquadramento, clone igual ao original, fuga conjunta, espaço vazio, modal, retorno/contagem e reload. Capturas work/preview-ray-*.png. Conferir Actions desta revisão.
- Próximo passo: dono avaliar /circus?demo=ray na prévia. Oficial inalterado.

## Prévia (2026-11-09 · Ray Raccoon)
- Dono pediu guaxinim com máscara tipo Zorro, roubo simples de ingressos e saída pela esquerda. Gerados corpo/cabeça v1, transparentes e provisórios; guia docs/RAY-RACCOON.md. Assets em assets/ray e conceitos preservados.
- Demo explícita /circus?demo=ray. Trinca diagonal vermelha, surge atrás do mostrador, aproxima a pata dos ingressos, bilhete vai para o saco com contador/som/háptico no contato e foge à esquerda; modal depois. Pega até 1, inclusive cena com zero/sem perda. Sem sorteio natural, promoção oficial ou mudanças no Firestore/cliente real.
- Modelo da carteira fictícia salva recibo idempotente e mantém saldo menos a aposta normal e Happeach inalterados. Testes focados: normal/zero, replay e reload; regressão da economia de prévia e Tucker. Navegador normal 390 px e reduzido 320 px confere rostos/linha, surgimento, contato/contador, direção de fuga, modal e persistência. Capturas work/preview-ray-*.png inspecionadas. Conferir Actions no commit desta revisão.
- Próximo passo: dono avaliar arte e cena no celular; ajustar só feedback aprovado. Quantidade/frequência para carteira real ainda não definidas.

## Prévia (2026-11-09 · Tucker com cesta vazia e duas garras)
- Dono pediu a mesma sequência mesmo com zero Happeach. Demo agora gera trinca/cena com roubo zero, banca zero e aviso de nenhuma perda, sem bloquear ou produzir NaN. Aposta normal preservada; nenhuma regra/cliente financeiro real alterado.
- Pose v2 gerada com os dois pés próximos/curvados; âncora entre garras alinhada ao topo da alça. Usa assets/tucker/body-grip-v2.webp; v1 preservada. Cabeça continua v1.
- Verificação focada: teste da demo vazia/replay/reload e navegador em 390 px normal, 320 px reduzido e cesta vazia; conferir capturas work/preview-tucker-perched-*.png. Conferir resultado no workflow da revisão.
- Próximo passo: dono avaliar /circus?demo=tucker; após consumir os frutos fictícios, a cena continua funcionando com zero. Arte segue provisória, sem ativação natural/oficial.

## Prévia (2026-11-09 · Tucker levando a cesta)
- Dono não gostou ainda da arte v1, mas pediu testar o rosto nos rolos e a animação: trinca vermelha, Tucker pousado na alça, voo levando a cesta, espaço vazio, modal e devolução com contagem atualizada.
- Implementação visual em ui/park/tucker.js, asas separadas por máscara vetorial/CSS. Cesta clonada do DOM para levar frutos/contador; original escondida até Continuar. Arte copiada para assets/tucker, ainda provisória. Cliente real/core/regras de Firestore não alterados.
- DEMO explícita: /circus?demo=tucker. Prepara 3 Happeach fictícios uma vez por navegador, primeiro giro leva 1; sem sorteio natural do Tucker. Quantidade é amostra para avaliar cena, não regra econômica aprovada. Carteira fictícia salva um recibo, remove a fração correspondente da banca e mantém moedas menos a aposta normal.
- Verificação focada: modelo de demo/replay/reload e ausência de Tucker em giros comuns; navegador em 390 px normal e 320 px reduzido confere três rostos/linha, alça, asas, cesta saindo, espaço vazio, modal, volta com 2 e reload. Regressão Tony também passou. Capturas work/preview-tucker-*.png inspecionadas. Conferir Actions no commit desta revisão.
- Próximo passo: dono avaliar a demo no celular e orientar arte/ritmo. Não ativar sorteio natural nem promover ao oficial sem definir/aprovar economia e validar regras reais.

## Arte (2026-11-09 · Tucker Toucan v1)
- Pedido: criar assets do Tucker. Produzidos corpo inteiro e cabeça transparente coerentes, em docs/concepts/tucker-toucan; guia docs/TUCKER-TOUCAN.md. Direção proposta: tucano azul-noite, bico amarelo/laranja/ameixa, olhos âmbar/turquesa, colete verde-petróleo/dourado e expressão malandra.
- Artes e alpha conferidos. Duas gerações de imagem, sem Meshy, testes do app ou builds. Só checkpoint de fontes [skip ci], sem atualizar URL de prévia/oficial.
- Próximo passo: dono avaliar arte v1 e pedir ajustes. Não integrar roubo/animação/sorteio antes de definir o comportamento com o dono.

## Estratégia permanente (2026-11-09)
- Dono pediu adotar sempre o fluxo econômico: alterações pequenas com teste focado e prévia cedo; agrupar ajustes aprovados para publicar; validar finanças quando afetadas; evitar releituras, testes e mensagens repetidos.
- Registrado em AGENTS.md, docs/skills/publicar.md e docs/FLUXO-CLAUDE-CODEX.md. Checkpoints `[skip ci]` preservam colaboração sem disparar deploy; URL remota só pode ser anunciada como atualizada quando realmente publicada.
- Próximo passo: aplicar essa estratégia às próximas tarefas. Esta entrega é só documentação, sem build, partidas ou publicação.

## Prévia (2026-11-09 · destaque das garras do Tony)
- Feedback: marcas anteriores feias/discretas; modal final aprovado. Cortes refeitos em preto, maiores, com desenho irregular e desfoque breve apenas na área dos rolos. Saldo e mostrador do prêmio ficam nítidos.
- Cada desconto aparece agora no mostrador original do prêmio, aos pés do King Rico; cartão flutuante removido. Modal final, tempos/som/háptico e economia/Firestore não alterados.
- Verificação focada: navegador em 390 px/normal e 320 px/movimento reduzido confere cor/tamanho visual, blur sem cobrir prêmio, três parcelas, saldo, modal, replay, reload entre patadas e falha de animação. Capturas em work/preview-tony-*.png. Build de produção após integração. Workflow da prévia deve ser conferido no commit desta revisão.
- Próximo passo: dono avaliar /circus?demo=tony no canal de prévia. Oficial permanece sem mudança; nenhuma promoção para main autorizada nesta revisão.

## Prévia (2026-11-09 · Tony Tiger, três patadas)
- Dono aprovou três rostos/linha vermelha, três patadas com riscos, balanço, som/háptico, quedas separadas do saldo e modal do total. Esclareceu que Tony é exclusivo: sem outro prêmio na rodada. Cabeça v4 de 866e780 copiada sem alteração para assets/tony/head.webp.
- Implementado slotVersion 4 só na carteira de prévia. Cliente de produção segue pedindo v3; oficial e regras publicadas não foram alterados. Core/store/regras locais preparados para o débito atômico no mesmo recibo; versão antiga preservada.
- Chance 1% fora do décimo giro, roubo até uma aposta limitado a 5% do saldo pós-aposta. Três parcelas em centavos; nenhuma aleatoriedade/débito na animação. Auto interrompido. Demo: https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus?demo=tony (primeiro giro por toque; só moedas fictícias).
- Testes de código: npm test, 37 arquivos passaram. Firestore: 63 testes passaram, incluindo envio concorrente/replay, bootstrap e quatro fraudes de Tony rejeitadas. Navegador: três impactos/som/deltas, marca vermelha, modal, reload entre impactos, erro de animação e movimento reduzido passaram; regressões de três fitas/ingressos/líquido/roleta e Big Win passaram. Capturas locais em work/preview-tony-*.png inspecionadas. Build de produção gerado após navegador; conferir resultado do workflow da prévia no commit desta entrega.
- Simulação 1 milhão/seed17843/aposta10/saldo alto: 9.004 eventos, retorno líquido em moedas 93,997% incluindo roleta/Happeach e descontando roubo. Não inclui resgate de ingressos, recargas ou variação de aposta; ver ECONOMIA.md e circus-tony-preview-audit.json.
- Próximo passo: dono avaliar demo do Tony no celular; ajustar apenas feedback aprovado. Para levar ao oficial, ativar v4 no cliente real e publicar regras/Hosting pelo workflow existente após autorização; não publicar a carteira fictícia nem promover automaticamente esta branch.

## Arte (2026-11-09 · Tony Tiger, retorno à v4 e vistas)
- Dono escolheu explicitamente os assets de 866e780: corpo/cabeça v4, sem unhas/garras. V5–v7 são tentativas descartadas, preservadas como histórico.
- Gerada prancha frente/perfil/costas a partir do corpo v4, inspecionada e salva em docs/concepts/tony-tiger/turnaround-v4.webp. Guia docs/TONY-TIGER.md atualizado.
- Próximo passo: feedback do dono na prancha; perfil e costas são interpretações novas em avaliação. Nenhuma integração/publicação no jogo; animação ainda indefinida.

## Arte (2026-11-09 · Tony Tiger, unhas largas v7)
- V6 rejeitada por ainda parecer garra. V7 troca as seis unhas não-polegares por placas largas como unhas humanas, ocupando a ponta superior dos dedos, levemente compridas/arredondadas. Dedões e cabeça v4 preservados. Imagem e alpha conferidos; versões anteriores mantidas.
- Próximo passo: feedback do dono nas unhas v7. Sem integração/publicação no jogo; animação ainda a definir pelo dono.

## Arte (2026-11-09 · Tony Tiger, unhas v6)
- Dedões da v5 aprovados; outras três unhas de cada mão refeitas para acompanhar a superfície superior dos dedos, em vez de pequenas pontas. Corpo v6 gerado e inspecionado, alpha conferido. Cabeça v4 preservada; versões anteriores mantidas.
- Próximo passo: feedback do dono nas unhas v6 e definição da animação pelo dono. Arte só em docs/concepts; nenhuma integração ou publicação no jogo.

## Arte (2026-11-09 · Tony Tiger com garras)
- Dono aprovou a direção v4 e pediu apenas garras discretas nas mãos. Corpo v5 gerado/inspecionado, alpha conferido; cabeça v4 permanece a mesma. Ver docs/TONY-TIGER.md. Versões anteriores preservadas.
- Próximo passo: feedback nas garras e definição da animação pelo dono; personagem ainda não foi integrado à slot nem publicado no jogo.

## Arte em avaliação (2026-11-09 · Tony Tiger v4)
- Dono pediu menos creme em queixo/bigode/tronco e T feito pelas listras escuras, como detalhe escondido (referência Toblerone). V3 fez essa direção; feedback seguinte pediu um pouco mais de dentes e haste do T mais longa/evidente. Corpo e cabeça v4 entregues, com alpha; ver docs/TONY-TIGER.md.
- V1–v3 preservadas. V4 aguarda feedback; não há animação, sorteio ou integração do personagem na slot. Próximo passo: ajustes visuais que o dono pedir e, depois, definição da animação pelo dono.

## Arte em avaliação (2026-11-09 · Tony Tiger v2)
- Dono pediu restaurar bigode branco do Valentão inicial, mostrar um pouco mais de dentes e abrir levemente os olhos. Corpo/head v2 feitos com esses ajustes; casaco vermelho, T e corpo forte mantidos. Ver docs/TONY-TIGER.md; v1 preservada.
- Alpha e imagens conferidos. Nenhuma animação, roubo ou alteração da slot; propostas não entram no build. Próximo passo: feedback do dono nas duas artes v2.

## Arte em avaliação (2026-11-09 · Tony Tiger)
- Dono pediu opções, escolheu B/Valentão e pediu casaco vermelho discreto, sem faixa vinho, rosto malandro e T sutil no peito. Foram produzidas exatamente uma arte de corpo inteiro e uma da cabeça, transparentes. Ver docs/TONY-TIGER.md e docs/concepts/tony-tiger/.
- Direção escolhida, mas os dois assets finais ainda aguardam feedback. Conceitos não integram o build nem foram publicados no site. O dono disse que ainda pensará na animação: não implementar roubo, animação ou novos sorteios por conta própria.
- Próximo passo: receber feedback nas duas artes e ajustar só o que o dono pedir; personagem/números ainda não entram na slot. Originais e gerações documentados no asset-pipeline.

## Entrega autorizada na main (2026-11-08 · 7e41b89)
- Dono autorizou explicitamente visual E pagamentos v3. Commit 7e41b89 enviado à main pelo workflow oficial, com carteira Google/Firestore real, oito combinações, ingressos avulsos e tabela v3; prévia continua fictícia, demos/raspadinha por abertura exclusivos do build:preview.
- Correção do espaço: sem máscara do viewport/filtros variáveis/rotação 3D da hélice; camadas isoladas/opacas e círculo mais suave. Arte decodificada antes de usar. Apresentação separada de pagamento em cloud/prize-tier.cjs.
- Testado em navegador do build real emulado: giro v3 de 40.000, fundo espacial estável, saldo preservado após reload e nenhum crédito duplicado. Suite focada de integração: 66 testes passaram; regressão da prévia cobre céu/espaço/reduzido/erro de imagem e opacidade monotônica. Capturas inspecionadas; produção gerada após navegador.
- Oficial 7e41b89: workflow https://github.com/Ric-lab/King-Rico/actions/runs/42536204755 concluído com sucesso, regras REST e Hosting. Prévia a4806d3: https://github.com/Ric-lab/King-Rico/actions/runs/42536299631 concluído com sucesso.
- Conferido no oficial: cliente v3, Firebase king-rico sem emuladores/modos de teste, assets/CSS com bytes esperados e HTTP 200. Nenhuma aposta real. Próximo passo: feedback do dono no celular; limites econômicos continuam documentados.

## Prévia (2026-11-08 · economia v3 e Big Win proporcional)
- Pedido: revisar referências Fortune Tiger e pagamentos. `cloud/circus-profile.cjs` define trincas sobre aposta TOTAL: bumbo 0,6; tenda 1; trevo 1,6; nuvem 2,5; capa 4; cetro 5; moeda 8; coroa 15; diamante 20; King 50. Oito linhas/tela cheia ×10 preservadas. Perfil v3: Happeach 0,005 por posição, especial mínima 20× na média salva.
- Voo só ≥20×; Mega ≥35×; Super ≥50×. `showPrize` recebe a aposta da rodada/especial explicitamente. Tabela, som/destaque e linhas usam o perfil correto; recibos v1/v2 continuam intactos. Produção/client-src continua pedindo v2; só carteira de prévia inicia v3. Store/regras preparados e testados, sem publicar regras.
- Cinco milhões de giros/seed17843/aposta10: 95,313% de retorno em moedas, incluindo Happeach e extra da roleta; IC por lotes aproximado 94,843–95,784%. Base paga em 42,599%; crédito maior que aposta em 16,017%; destaque de voo ~1/102. Dados em docs/circus-v3-audit.json; comparação Tiger/coeficientes por linha em docs/ECONOMIA.md.
- Limite importante: simulação de aposta constante, sem resgate dos ingressos nem políticas de mudar aposta perto da roleta. Não é RTP global e não autoriza promover a economia para live; essas duas auditorias permanecem necessárias.
- Validação: 213 testes da suíte de código passaram, além dos focados novos; 62 verificações Firestore/transações passaram, com v3, teto 4000× e reenvio idempotente. Modelo fictício comparado ao core auditado por 60 giros/roletas/reenvios. Navegador confirmou tabela/colunas, 15.000 em aposta1.000 SEM avião e demos 20×/200×; regressão de motion passou. Capturas inspecionadas; build de produção após integração.
- Runner aceita lista de testes locais e cria servidor efêmero quando não há URL, evitando portas antigas; CI continua as seis suítes completas em pares. Próximo passo: conferir workflow desta revisão e dono avaliar prévia; oficial preservado.

## Prévia (2026-11-08 · hélice em voo)
- Pás originais separadas no render por duas máscaras SVG; removidas das camadas fixas, com cubo dourado preservado. Giro no eixo do motor de 110 ms, fantasma defasado e disco translúcido dão movimento sem regenerar/trocar o avião.
- Máscaras versionadas em ui/park e incluídas no preload do Circus. Movimento reduzido usa pás/disco difusos estáticos. Trajetória, escala, círculo/prêmio, sons e pagamento não alterados.
- Quatro fluxos de navegador passaram (céu, 320 px/reduzido, imagem falhando e espaço); teste verifica máscara, mudança real da transformação das pás, período e redução de movimento. Duas fases de giro capturadas e inspecionadas. Sem erros/assets ausentes; build de produção após integração.
- Próximo passo: conferir Actions desta revisão e dono testar céu (?demo=bigwin) e espaço (?demo=spacewin). Somente prévia; oficial preservado. Um commit com documentação, sem registro extra após o workflow.

## Prévia (2026-11-08 · nariz, centro da curva e círculo do prêmio)
- Posição, inclinação e rastro agora derivam de uma curva quadrática única (`flightCurve`): nariz segue a tangente com entrada suave após embarque, linha termina na âncora central do avião. Escala menor acomoda a rotação no celular.
- Círculo dourado luminoso atrás do prêmio pulsa a cada 1,6 s; estático com movimento reduzido. Número permanece o único contador; nenhuma mudança no pagamento confirmado, carteira ou demais jogos.
- Unitário verifica continuidade de embarque/tangente/âncora. Navegador cobre 20×, 320 px/reduzido, erro de imagem e espaço 200×; exige nariz apontado para cima, alinhamento da linha a menos de 1 px e círculo redondo com redução de movimento respeitada. Capturas revisadas; build de produção após integração.
- Próximo passo: conferir Actions desta entrega e dono testar separadamente céu (?demo=bigwin) e espaço (?demo=spacewin). Prévia isolada; não publicar em live sem autorização. Um único commit com documentação.

## Prévia (2026-11-08 · referência Aviator e foco único no prêmio)
- Pedido: Aviator como referência da curva/movimento, não do ícone; Fortune Tiger como hierarquia do prêmio. Avião/King próprios preservados, escala reduz até 42% durante subida à direita e curva dourada parte da base esquerda. Removido contador × da cena; prêmio é único número, título dourado/halo/radiação suaves.
- Pesquisa: página SPRIBE, imagem pública da interface Aviator, gameplay mobile listado no Vimeo; ficha PG Soft e imagem Big Win pública. Fontes e limites em docs/PARQUE.md. Gravação antiga do dono não localizada; vídeos listados não foram assistidos. Nenhum asset/código externo integrado.
- Verificado localmente em quatro fluxos (390 px/20×, 320 px/reduzido, falha do avião e 390 px/200×): redução contínua, valor legível sem ×, avião inteiro, retomada e uma aposta/prêmio confirmados. Capturas inspecionadas; unitários e build de produção após integração passaram.
- Publicação simplificada: as mesmas seis suítes de navegador agora executam em pares isolados, com logs separados e falha propagada. Um commit/HANDOFF por entrega; resultado real de Actions comunicado ao dono sem segundo commit apenas de registro.
- Próximo passo: conferir Actions desta revisão e dono avaliar ?demo=bigwin / ?demo=spacewin na prévia. Não promover à produção; oficial preservado.

## Prévia (2026-11-08 · voo enquadrado e contagem em destaque)
- Dono pediu remover resquício da nuvem colorida, prolongar voo e priorizar valor crescente. Mascote inteiro (incluindo nuvem) oculto após embarque/restaurado em toda saída; avião enquadrado no centro superior e subida de 6,8–9,8 s conforme altitude, sem alcançar o canto cedo.
- Prêmio em moedas virou maior número, com dimensionamento pelo valor final, pulso suave e multiplicador secundário. Sem alterar prêmio confirmado, carteira ou matemática; movimento reduzido não balança/pulsa.
- Quatro cenários locais passaram: 20×, 320 px/reduzido, falha de imagem e 200×/espaço; teste confere nuvem oculta/restaurada, duração, avião inteiro, valor maior/sem corte e prêmio único. Capturas inspecionadas. Respiro final do título conferido em novo giro; build de produção gerado após integração.
- Código e4d8967 enviado à prévia; workflow https://github.com/Ric-lab/King-Rico/actions/runs/42519911793 concluído com sucesso, incluindo navegador no endereço público.
- Próximo passo: dono avaliar a nova contagem/voo na prévia (?demo=bigwin ou ?demo=spacewin). Oficial preservado; não publicar em live sem autorização.

## Prévia (2026-11-08 · cenário ilustrado do avião)
- Novo atlas de céu/espaço com nuvens volumétricas, lua e Terra; nuvens próximas/distantes com velocidades diferentes e estrelas irregulares. Centro livre para o multiplicador. Assets finais versionados e no preload.
- Sem mudança no avião, poses/proporções do King, duração, carteira ou pagamentos. Revisão exclusiva da prévia; oficial permanece em 6a7a775.
- Validação local: quatro fluxos de navegador (20×, 320 px/reduzido, imagem com falha e 200×/espaço), paralaxe, prêmio único e zero assets ausentes/erros. Capturas inspecionadas; testes do voo e build de produção após integração passaram.
- Código 8f54c22 publicado na prévia. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42517890549 concluído com sucesso, incluindo testes de navegador no endereço público.
- Próximo passo: avaliação visual do dono nos demos bigwin/spacewin. Não publicar em live sem autorização.

## Ideia registrada (2026-11-08 · três vilões)
- Dono propôs Tiger Tony (moedas, assusta King/foge e morde placa três vezes), Tucker Toucan (leva Happeach voando pela cesta) e Ray Raccon (guaxinim de máscara/saco, sai de trás do prêmio e leva ingressos). Sequências completas em docs/IDEIAS-DE-JOGOS.md.
- Apenas documentação: sem código, sorteios, perdas ou publicação. Frequência, quantidades e gatilhos ainda a definir. Recomendações do agente separadas das cenas pedidas; próximo passo é o dono avaliar a proposta e definir regras antes de implementação.

## Oficial publicado (2026-11-08 · revisão visual aprovada)
- Dono autorizou publicar. Main recebeu `6a7a775`: raspadinha diária 3×3/prêmio destacado e voo completo com King maior/de perfil, comemoração e céu/espaço; Google/Firestore reais. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42438873128 concluído com sucesso nos dois jobs; regras REST e Hosting preservados.
- Seleção financeira explícita e comunicada: oficial conserva cinco combinações, engine/park/regras anteriores. As oito combinações e ingressos avulsos desta branch continuam só na prévia, aguardando balanceamento. A repetição por abertura e giros demo também continuam exclusivos da carteira fictícia.
- Validação: 204 testes de código, 57 de regras e integração com conta emulada, incluindo saldo diário único, giro/recebimento/reload e catálogo atual. Site oficial confirmou configuração king-rico sem emuladores/demo e assets novos HTTP 200/bytes corretos; nenhuma aposta real.
- Próximo passo: feedback do dono no oficial. Matemática de oito combinações continua pendente nesta branch; não incorporar em main como parte de uma simples revisão visual.

## Prévia (2026-11-08 · proporções, comemoração e altitude)
- Código `1aafefc` publicado na prévia. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42437278106 concluído com sucesso: navegador público confirmou piloto maior, comemoração contínua, céu/estratosfera 20×, espaço 200×, carteira/aposta única e regressões do Circus/parque. Oficial preservado.
- Pedido: King maior em salto/cabine, comemorando até embarcar; subida com mais cenário e céu/espaço conforme o big win, multiplicador evidente.
- Piloto 31% → 43% da largura do avião; alvo do salto e encaixe recalculados juntos, salto começa até 12% maior. Aproximação continua o ciclo fw6 de comemoração e transfere a posição animada para o embarque.
- Camadas de céu, estratosfera e espaço, com nuvens descendo e estrelas em paralaxe. Altitude e duração dependem do multiplicador já confirmado; multiplicador central ampliado/alto contraste. Sem alterar sorteio, aposta ou pagamento.
- Prévia: ?demo=bigwin mostra 20×; ?demo=spacewin mostra 200× e espaço no primeiro giro, somente moedas de teste. Próximo passo: dono avaliar os dois percursos. Oficial e pendência de balanceamento preservados.
- Validação local: três testes de apresentação passaram. Navegador confirmou piloto ampliado, sequência de poses/continuidade, trajetória e multiplicador nos modos normal/reduzido, céu 20×, espaço 200× e fallback na falha do avião; saldo e uma única aposta preservados, sem erros/assets ausentes. Capturas de subida e espaço revisadas. Produção gerada depois da integração.

## Prévia (2026-11-08 · piloto de perfil)
- Código `4d47c5b` publicado no canal de prévia. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42436195528 concluído com sucesso, incluindo navegador público do perfil, prêmio/erro e regressões de Circus/parque. Revisar em https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus?demo=bigwin . Oficial preservado.
- Dono pediu uma pose que cai na cabine virada para a frente do avião e indicou a arte de vistas. Usados turnaround da marca e fw6/master como referências para novo perfil direito sentado (GPT Image), com coroa/capa e mãos livres, sem cetro.
- `pilotSide` entra na descida final e permanece como piloto; posição do encaixe ajustada junto da trajetória, pernas atrás da frente da fuselagem. Demais poses de impulso, avião e pagamentos preservados. Asset no preload e teste confere pose final real na cabine.
- Validação: dois testes de apresentação passaram; navegador 320/390/430 px confirmou perfil final, sequência de embarque, prêmio 20×/aposta única, recebimento e fallback na falha do avião, sem erros ou assets ausentes. Captura na cabine revisada; produção gerada após integração.
- Próximo passo: dono avaliar perfil/encaixe em /circus?demo=bigwin na prévia. Oficial preservado; não promover antes do balanceamento pendente.

## Prévia (2026-11-08 · poses do salto para o avião)
- Código `689f6a3` no canal /circus?demo=bigwin. Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42434696279 concluído com sucesso; conferência pública da sequência de poses, pagamento/erro, raspadinha e regressões de Circus/parque passou. Oficial preservado.
- Dono aprovou o avião, rejeitou King Rico parado sendo movido e pediu replicar o método das animações anteriores. Consultado o cheer/frame de KingRico.dc.html; reaproveitados desenhos fw6 existentes, sem gerar arte nova.
- ui/park/king-boarding.js alterna crouch2/cheerRise/cheer/cheerFall/land, com dissolução opaca de 110 ms e suavização 22/s/pivô 97% como o original. Copia a pose visível na partida, preserva o King durante a aproximação e amortece o pouso; piloto respira após entrar.
- Avião, percurso, pagamentos, multiplicador e carteira preservados. Poses adicionadas ao preload e teste de navegador verifica a sequência real durante um giro 20×, além do recebimento e fallback existentes.
- Dois testes de apresentação passaram. Navegador confirmou a ordem real crouch2/cheerRise/cheer/cheerFall/land nos modos normal/reduzido, carteira, aposta única e recuperação na falha do avião em 320/390/430 px; sem erros ou assets ausentes. Captura do ápice revisada; produção gerada após integração.
- Próximo passo: dono avaliar o salto no link /circus?demo=bigwin da prévia. Produção permanece intacta; balanceamento das oito combinações continua pendente.

## Prévia (2026-11-07 · revelação da raspadinha e voo do big win)
- Código `5b7cbba` na prévia, com cena principal de `fb61818`. Workflow final https://github.com/Ric-lab/King-Rico/actions/runs/42336663835 concluído com sucesso, assim como o anterior https://github.com/Ric-lab/King-Rico/actions/runs/42336415877. Navegador público confirmou os dois motions, falha do avião, crédito único e regressões de ingressos/roleta/parque. Produção gerada após integração; oficial preservado.
- Revisão rápida: https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus?demo=bigwin — receber raspadinha e tocar no spin; primeiro giro demonstra 20× com moedas fictícias.
- Pedido: substituir as nove casas por um prêmio destacado após os acertos; implementada pausa de reconhecimento, recolhimento ao centro e moeda/valor grande com PEGAR MOEDAS. Repetição de teste preservada.
- Pedido: usar a linguagem do Aviator na celebração, sem parar. Avião novo gerado pelo GPT Image, King Rico oficial salta da coordenada real para a cabine, sobe e revela multiplicador/valor; substitui o modal de prêmios monetários ≥5× a aposta.
- Assunção comunicada ao dono: revelar o prêmio já confirmado, sem novo sorteio ou pagamento extra. Nenhuma mudança de matemática, carteira, Firestore ou rodadas. Cena termina no fluxo de moedas/continuação existente; falha do asset ou timeout não duplica crédito.
- Link de revisão: /circus?demo=bigwin na prévia força apenas o primeiro giro para diamantes 20×, com moedas fictícias; transporte de produção intacto. Dono ainda toca Girar. Teste do navegador usa esse link real, sem substituir respostas ou inventar saldo.
- Validação local: 50 testes de apresentação/diário/adaptadores passaram. Navegador em 320/390/430 px confirmou a grade sumindo e prêmio único, salto/embarque, subida, ×20/200 moedas, apenas uma aposta e nenhuma transação de prêmio adicional. Falha do avião e movimento reduzido preservam saldo/continuação; sem erros ou assets ausentes. Capturas de embarque/subida/resultado revisadas.
- Próximo passo: dono avaliar motion/encaixe da cabine e a nova revelação. Continuar somente na prévia; não promover à main antes do balanceamento pendente das oito combinações. A mecânica independente do Aviator continua apenas ideia.

## Prévia (2026-11-07 · repetir raspadinha para testar)
- Código `3b809cb` no canal https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus . Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42334250457 concluído com sucesso: navegador público confirmou repetição a cada abertura em 320/390/430 px, crédito único por visita e navegação/movimentos preservados. Cinco testes de ciclo/modelo/isolamento passaram; produção gerada após a integração. Oficial preservado.
- Dono pediu reaparecer em toda abertura para conseguir testar. Somente o modelo da carteira fictícia reinicia o bônus ao carregar uma página; permite raspar e receber 50 moedas de teste novamente. Receber duas vezes na mesma visita continua bloqueado.
- Cliente, calendário, regras Firestore e bônus de produção intactos. Testes de navegação adaptados para fechar o cartão e distinguir créditos de teste das entradas dos jogos.
- Próximo passo: dono testar livremente recarregando a prévia. Não promover esta exceção para o cliente financeiro real.

## Prévia (2026-11-07 · raspadinha 3×3)
- Código `b2908dc` em https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus . Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42333637286 concluído com sucesso; navegador no endereço público confirmou nove casas, seis X vermelhos, três valores iguais, raspagem e crédito único nas três larguras. Oficial preservado.
- Dono confirmou seis X vermelhos e três casas com o valor do presente, total nove. Substituída a área única por nove coberturas raspáveis independentes, em posições embaralhadas.
- Encontrar os três valores iguais revela as casas restantes e libera PEGAR MOEDAS; REVELAR continua como alternativa acessível. Três desenhos representam um único pagamento diário; valores, transação e regras não mudaram.
- Navegador confirmou mouse, toque real via eventos de toque do Chromium, teclado, casas independentes, seis X/três valores, repetição e erro de confirmação/voo em 320/390/430 px. Sem erros ou assets ausentes. Dois testes de ciclo/layout passaram; tela de 320×568 também conferida, com botão e grade inteiros. Produção gerada após a integração.
- Próximo passo: dono avaliar a grade no celular. Somente prévia; manter a pendência de balanceamento das oito combinações antes de qualquer promoção à main. Ideia de Aviator segue apenas documentada.

## Anotação (2026-11-07 · direção Aviator)
- Dono pediu registrar uma dinâmica mais claramente inspirada no Aviator: movimento/multiplicador contínuos, sem andares como o Flying atual. Proposta em docs/IDEIAS-DE-JOGOS.md, vinculada no índice; encaixe na dinâmica geral ainda a definir, sem implementar um jogo extra.
- Naquele momento, a raspadinha tinha uma área única; substituída pela grade 3×3 registrada acima após confirmação do dono. O presente continua único/diário, inclusive ao abrir pelo Parque. Após receber não reaparece naquele dia; antes de receber pode reabrir após recarga. Oficial ainda preservado.
- Encaixe da dinâmica contínua ainda a definir. Esta anotação foi apenas documental; pendência de balanceamento da prévia continua abaixo.

## Prévia (2026-11-07 · raspadinha de retorno diário)
- Código `75ea6c9` no canal https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus . Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42332248282 concluído com sucesso; raspadinha, movimentos, colunas e parque conferidos pelo navegador no endereço público. Produção preservada.
- Pedido: receber o presente de retorno pela raspadinha na primeira abertura do dia. Fluxo compartilhado em ui/park/daily-reward.js/css, aberto depois da conta/carregamento no Circus e nas rotas do parque. Escolha de entrada aguarda a raspadinha.
- Raspar revela; botão REVELAR oferece alternativa acessível. PEGAR MOEDAS chama Cloud.bonus existente, segura a atualização visual e libera voo/contagem compartilhados após confirmar. Falha permite tentar de novo; recarga antes da confirmação reabre, depois não repete.
- Valores, ciclo de sete dias, calendário de São Paulo e regras financeiras preservados; teste de regras passa a disputar dois pedidos diferentes de bônus simultâneos. Nenhuma importação de moedas locais; carteira fictícia só na prévia.
- Corrigida recuperação de conflito do bônus: segundo pedido com ID diferente relê a transação, como já ocorria na recarga, e retorna zero após o primeiro crédito. O novo teste inicialmente mostrou permission-denied; passou após a correção. Demais 59 casos de regras passaram na execução completa; os quatro casos financeiros afetados foram reexecutados e passaram.
- Validação: 78 testes de diário/adaptadores/carteira e cinco de build/contagem passaram. Navegador em 320/390/430 px conferiu raspagem, alternativa de teclado, erro/repetição, saldo retido, animação indisponível e recarga/Parque sem repetir presente. Testes do parque em três larguras e movimentos do Circus normal/reduzido também passaram. Build de produção gerado depois da integração; sem publicar em live.
- Próximo passo: conferir a raspadinha no celular com o dono. Esta revisão continua somente na prévia; o balanceamento das oito combinações abaixo permanece pendente antes de promover à main.

## Próximo passo (2026-11-07 · ingressos avulsos e colunas, somente prévia)
- Código `b41b60f` publicado somente em https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus . Workflow https://github.com/Ric-lab/King-Rico/actions/runs/42330832504 concluído com sucesso: testes no endereço público confirmaram ingressos avulsos, coluna premiada/destaque, carteira, sons/roleta e parque em três larguras. Oficial e regras de produção não publicados.
- Implementado `slotVersion:2`: oito combinações pagam; ingressos avulsos aparecem sem crédito nem voo. Preservados pagamentos/células de prêmio, Happeach, versões antigas e repetição idempotente. Indicador vertical usa o mesmo contêiner transformado dos rolos.
- Validação local: 205 testes de código e 60 testes de regras/transações passaram. Navegador confirmou um/dois ingressos avulsos sem crédito, pagamento/destaque alinhado de coluna, carteira, três notas sequenciais, líquido e roleta nos modos normal/reduzido; sem erros ou assets ausentes.
- Auditoria reproduzível: `scripts/circus-lines-audit.cjs`, resultados em `docs/circus-lines-audit.json`. Cem mil giros por versão, incluindo bônus: retorno em moedas de 141,22% nas cinco combinações existentes e 189,92% nas oito novas. Não houve ajuste de pesos/pagamentos. Usuário informado; oficial preservado.
- Próximo passo exato: avaliar a prévia com o dono e recalibrar o Circus completo (base + Happeach + décimo giro + roleta), repetindo a auditoria e testes antes de qualquer promoção à main. Não anunciar RTP de 95/98% com esses resultados.

## Estado oficial (2026-11-05)
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
