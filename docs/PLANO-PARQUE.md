# Revisão do parque · 05/11/2026

Primeira proposta na prévia; a avaliação estética pertence ao dono. Oficial preservado.

## Problemas confirmados

- Topo próprio (`park-wallet`, Home por PNG e menu por caractere) divergia do HUD dos jogos.
- Pênalti referenciava `jump.webp`, a girafa antiga, em vez do goleiro palhaço atual.
- Protagonistas pequenos e fundos/cores distintos enfraqueciam o reconhecimento das atrações.
- Ações usavam aparência separada dos botões compartilhados.

## Direção e ordem de execução

1. Reutilizar `kr-hud-row`, placa de saldo e ícones do cabeçalho compartilhado. Preservar rolagem normal; apenas banner fixo.
2. Dar às quatro capas o mesmo cenário diurno e a mesma moldura. Cada uma mantém um protagonista: rosto do Clown, goleiro/bola, palhaço/balões, plinko/cinco bolas.
3. Usar os assets atuais dos jogos; não redesenhar personagens nem alterar regras. Compor maior, com base, sombra de contato e espaço para título/ação.
4. Reutilizar `kr-button` no Jogar/Continuar. Uma informação de preço acima da grade; contador de ingressos separado do saldo.
5. Conferir 360/390/430 px, saldo de 100.000.000,65, menu/preferências, recarga cancelada e abertura das quatro atrações sem débito antecipado.
6. Mostrar a prévia para feedback antes de publicar em produção.

## Entrega desta rodada

- Implementação: `Home.dc.html`, `ui/park/park-home.css`, contexto do menu em `ui/park/home.js`.
- Bola de futebol vetorial em `ui/park/football.svg`; demais artes reutilizadas, 0 créditos externos.
- Regressão: `tests/park_preview_browser.py`, integrada ao workflow de prévia.
- Próxima decisão: avaliar composição e leitura das capas no celular. Não tratar teste funcional como aprovação estética.
