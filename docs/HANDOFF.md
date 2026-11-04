# HANDOFF

Estado atual e próximo passo. Qualquer modelo: ler antes de começar; atualizar ao parar (feito + próximo passo).
Regras gerais ficam em `docs/skills/` — não repetir aqui.

## Estado (2026-11-04)
- `main` = site oficial. Prévia (`codex/penalty-clown-preview`) usa as mesmas 3 fitas da `main`, com o workflow isolado, som de chegada dos ingressos e correções de animação/áudio abaixo.
- No ar: Circus, Clown, Penalty (goleiro palhaço), Flying Clown, Fingo. Arquivados: docs/ARQUIVADOS.md.
- Histórico da prévia antiga (rolos 9 tambores, rejeitados): tag `archive/codex-penalty-clown-preview-rolos`.

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
- Dono ouvir as três notas dos ingressos na prévia e avaliar duração/timbre. Após aprovação, levar a mudança completa para `main`; não publicar no oficial sem autorização.
