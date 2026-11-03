# Sombra superior dos rolos — prévia v79

Estudo e implementação de 03/11/2026. Ainda não publicado no Firebase oficial.

O topo recebia luz demais porque `HemisphereLight` ilumina mais as superfícies
voltadas para cima e não cria sombras. A cena também não tinha a proteção
superior da máquina bloqueando a luz direta nessa região. Escurecer o fundo
não resolve essa iluminação da superfície.

A revisão preserva cilindros, câmera, símbolos e paradas. Três travessas
invisíveis na imagem projetam a sombra do alojamento sobre a curva superior.
A oclusão do material reduz gradualmente a luz indireta nessa mesma região;
o centro da impressão permanece iluminado. A intensidade da sombra direta é
45%, com penumbra PCF, para evitar uma faixa opaca. O mapa continua calculado
uma vez: a fita impressa se movimenta sobre geometria fixa.

O teste `tests/circus_depth_browser.py` compara papel sem impressão no topo e
no centro, verifica símbolos nas paradas e confirma o funcionamento após perda
do contexto gráfico e sem WebGL. A conferência visual inclui o giro e três
tamanhos de tela. O teste da prévia usa Pillow para examinar a captura.

## Referências consultadas

- [Three.js: luzes](https://github.com/mrdoob/three.js/blob/r184/manual/en/lights.html): contribuição do céu e do chão na luz hemisférica.
- [Three.js: sombras](https://github.com/mrdoob/three.js/blob/r184/manual/en/shadows.html): objetos que projetam e recebem sombras, enquadramento e custo do mapa.
- [Shader de oclusão do Three.js](https://github.com/mrdoob/three.js/blob/r184/src/renderers/shaders/ShaderChunk/aomap_fragment.glsl.js): atenuação da iluminação indireta.
- [ContactShadows do Drei](https://github.com/pmndrs/drei/blob/master/src/core/ContactShadows.tsx): suavização das sombras e limitação dos quadros recalculados. Não foi adicionada dependência do Drei.
- [Exemplo GTAO do Three.js](https://github.com/mrdoob/three.js/blob/r184/examples/webgl_postprocessing_gtao.html): referência de oclusão e suavização. A implementação usa o material existente, sem pós-processamento adicional.
