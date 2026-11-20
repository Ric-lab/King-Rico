# Botão de giro — forma da gravação Coin Master,20/11/2026

Fontes vetoriais editáveis, sem bitmap extraído do jogo comercial:
- spin-cm-base-v1.svg: base fixa277×165, azul-cinza, bisel e face inferior.
- spin-cm-side-v1.svg: apenas a parede frontal277×137, vermelha escura.
- spin-cm-cap-v1.svg: tampa277×107, topo arqueado e laterais inclinadas.

Medições/referência: guidelines/references/coin-master/spin-button.mp4. O dono
pediu copiar a forma; as versões de retângulo arredondado foram rejeitadas.
A lateral NÃO preenche o topo: a tampa deve descobrir a base cinza ao descer.
O recorte da lateral acompanha o curso para não deixar pontas vermelhas nos lados.

A tampa contém só o valor da aposta, em HTML. Não pintar letras nos SVGs.
O mesmo contorno da tampa está nos dois paths de luz em Fortune Circus.dc.html:
flash curto de100ms no contato e progresso de650ms ao segurar. Atualizar os três
contornos juntos se houver ajuste de desenho. pathLength100 normaliza o percurso;
installSpinTactility reforça esse atributo no DOM. O tempo é o mesmo do auto nativo.
A luz permanece completa com auto ativo e apaga ao parar/cancelar. Nada de barra
horizontal nem texto extra na tampa. Não alterar pagamentos junto da apresentação.

Técnicas consultadas:
- Base/lateral/tampa separadas: https://www.joshwcomeau.com/animation/3d-button/
- Progresso SVG normalizado: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dashoffset
