# Símbolos dos rolos — 24/11/2026

As 12 artes ativas usam o mesmo material em todas as 9 casas e na fita móvel.
Originais PNG/WebP permanecem intactos. A regra não altera sorteios ou pagamentos.

- Fonte única: `scripts/reel-symbols.py` (Pillow), lista de arquivos/tiles ativos.
- Área visível: até 90% da largura e 82% da altura da caixa corrigida dos rolos.
  Formatos naturais permanecem: ingresso horizontal, escudo vertical, coroa larga.
- Centralização pela caixa de alfa>100, sem usar margens transparentes como tamanho.
- `ui/park/reel-symbols.css` gerado atende `data-reel-symbol` em estático e móvel.
  Clipe do tile elimina vazamento de vizinhos; composição 3D comum mantém nitidez.
- Curvatura superior/inferior igual para qualquer símbolo; mesma geometria ao travar.
  A fita usa células 126×128 com arte 103,87435×124, como as casas paradas.
- Tipos de prêmio/roubo mantêm seus efeitos específicos. Não forçar linha dourada
  em um vilão só para padronizar: mesma regra visual para o mesmo estado válido.
- Preloads do HTML e holder de imagens seguem os 7 arquivos únicos da lista.
  Controle 15 também passa na sequência visual; resultado salvo não muda.

Após mudar uma arte: executar `python3 scripts/reel-symbols.py`, revisar CSS/JSON
produzidos e conferir `npm run build:preview` seguido de
`python3 scripts/test-preview-browsers.py circus_symbols_browser.py`.
O teste compara 108 posições, fita parada no mesmo ponto, estado travado,
carregamento, proporção e efeitos. Produz folha real de screenshots em
`work/preview-symbol-sheet-after.png` e dados em `work/preview-symbol-audit-after.json`.
O modo diagnóstico `KING_RICO_SYMBOL_BASELINE=1` captura o antes sem exigir a
normalização; nunca é usado no workflow. Não redesenhar assets para mudar margens.

Geometria normal/fita: tolerância 0,15px; travado: 0,2px. Comparação de pixels:
média absoluta < 1,5 em RGB 0…255, permitindo rasterização entre plataformas.
A medição desta implementação ficou abaixo de 0,01, com silhuetas alinhadas.
