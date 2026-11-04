# HANDOFF

Estado atual e próximo passo. Qualquer modelo: ler antes de começar; atualizar ao parar (feito + próximo passo).
Regras gerais ficam em `docs/skills/` — não repetir aqui.

## Estado (2026-11-04)
- `main` = site oficial. Prévia (`codex/penalty-clown-preview`) usa as mesmas 3 fitas da `main`, com o workflow isolado, som de chegada dos ingressos e correções de animação/áudio abaixo.
- No ar: Circus, Clown, Penalty (goleiro palhaço), Flying Clown, Fingo. Arquivados: docs/ARQUIVADOS.md.
- Histórico da prévia antiga (rolos 9 tambores, rejeitados): tag `archive/codex-penalty-clown-preview-rolos`.

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
- Sequência e som dos ingressos aprovados pelo dono. Avaliar na prévia o spin sem faixa vermelha ao reiniciar e o relevo traseiro com metade da altura frontal. Não levar a `main` nem publicar no oficial sem autorização.
