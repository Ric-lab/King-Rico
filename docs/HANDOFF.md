# HANDOFF

Estado atual e próximo passo. Qualquer modelo: ler antes de começar; atualizar ao parar (feito + próximo passo).
Regras gerais ficam em `docs/skills/` — não repetir aqui.

## Estado (2026-11-04)
- `main` = site oficial. Prévia (`codex/penalty-clown-preview`) usa as mesmas 3 fitas da `main`, com o workflow isolado e o novo som de chegada dos ingressos.
- No ar: Circus, Clown, Penalty (goleiro palhaço), Flying Clown, Fingo. Arquivados: docs/ARQUIVADOS.md.
- Histórico da prévia antiga (rolos 9 tambores, rejeitados): tag `archive/codex-penalty-clown-preview-rolos`.

## Feito (2026-11-04 · Codex · som dos ingressos)
- `ui/park/motion.js`: cada chegada de ingresso toca `bell`, com os mesmos parâmetros usados pela moeda ao chegar ao saldo, sincronizado ao incremento do contador. Nenhum som durante o voo.
- Conferido no navegador local com carteira fictícia: três chegadas/três toques, silêncio respeitado e contagem completa mesmo com erro de áudio; sem erros de página. Build de produção conferido depois do navegador.
- Entrega somente na branch de prévia; `main` e site oficial sem mudança.

## Feito (2026-11-04 · Codex)
- Removidas do workflow da prévia a preparação do navegador e a execução de `tests/circus_depth_browser.py`, incompatíveis com as 3 fitas atuais. Build e deploy preservados.
- Conferida a `main`: não contém `.github/workflows/preview-channel.yml`; somente este registro foi atualizado lá, sem disparar publicação oficial.

## Próximo passo
- Dono ouvir a chegada dos ingressos na prévia e aprovar. Somente depois levar a mudança para `main`; não publicar no oficial sem autorização.
