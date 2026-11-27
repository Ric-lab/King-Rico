# Rolos do Circus

Decisão do dono (04/11/2026): ficam os rolos da versão PUBLICADA (3 fitas). Não mexer sem pedido explícito.

Testado e rejeitado (branch codex/penalty-clown-preview):
- 9 tambores 3D independentes: viciam (9 paradas/hápticos) mas visual de grade.
- Híbrido 3 fitas + 9 paradas com faixa clara entre fileiras.
- Fita de ouro com brilho na linha premiada.

Se um dia retomar: casas sem curva própria + luz/sombra por coluna + emenda de 1–2 px; ver docs/HANDOFF.md (prévia).

## Padrão24/11: arte compartilhada
Usar scripts/reel-symbols.py e ui/park/reel-symbols.css; não corrigir cada
posição por um background-size avulso. Caixa óptica90%W ×82%H, centralizada pelo
alfa. Testar12 símbolos ×9 posições, parado/fita/travado, com
circus_symbols_browser.py. Uma única camada/material e câmera por linha;
normalização por porcentagem não muda desenhos ou mecânicas. Ver SIMBOLOS-ROLOS.md.

27/11: sequência nova feita SÓ pelo mapping de arte. IDs e matemática legados
ficam intactos; não recalibrar PAYS para acompanhar nomes de imagem. Mapping
10/capa, 2/moeda, 0/diamante, 6/coroa, 8/baú, 7/rosto King Rico. Ver PARQUE.md.
