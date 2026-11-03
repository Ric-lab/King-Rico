# Iluminação dos rolos — prévia em desenvolvimento

Estudo e implementação de 03/11/2026. Ainda não publicado no Firebase oficial.
Base visual: prévia v79. O ajuste lateral abaixo foi validado localmente e
guardado em commit, sem atualizar nenhum site.

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

## Contato lateral

O cilindro tem eixo horizontal; sua normal não muda ao longo desse eixo.
Aumentar a iluminação curva não cria profundidade nas laterais. O ajuste usa
quatro paredes internas invisíveis nas folgas existentes para projetar sombras
de contato e uma oclusão suave nas duas extremidades de cada rolo. A transição
ocupa 17 unidades, principalmente na margem sem impressão; não desenha bordas
nem acrescenta divisórias. A oclusão reduz apenas luz indireta, preservando a
luz direta e a leitura dos símbolos. O centro, a câmera frontal e a geometria
permanecem iguais à v79.

As paredes compartilham geometria e material e usam o mapa estático existente.
São 18 chamadas de desenho na cena principal, sem novo pós-processamento ou
dependência. A sombra fica presa ao alojamento enquanto a impressão gira.
Os recursos adicionais são liberados na saída e na recuperação do contexto.

O teste `tests/circus_depth_browser.py` compara papel sem impressão no topo e
no centro, verifica símbolos nas paradas e confirma o funcionamento após perda
do contexto gráfico e sem WebGL. A conferência visual inclui o giro e três
tamanhos de tela. O teste da prévia usa Pillow para examinar a captura.
Também compara as margens laterais sem impressão dos três rolos superiores:
as extremidades ficam cerca de 4% mais escuras que o papel logo ao lado, com
transição dos dois lados. A conferência local passou em 390, 360 e 430 px,
sem erros de console nem assets ausentes. Esses resultados não medem o
desempenho de um celular físico nem representam aprovação estética do usuário.

## Referências consultadas

- [NVIDIA GPU Gems 3: High-Quality Ambient Occlusion](https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-12-high-quality-ambient-occlusion): sombras de contato nas junções e transições suaves de oclusão. É a referência técnica principal do ajuste lateral; não foi implementado o algoritmo completo do capítulo.
- [Khronos: iluminação e oclusão no glTF 2.0](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#occlusion): oclusão atenua a luz indireta, sem escurecer indiscriminadamente a iluminação direta.
- [Geometria cilíndrica do Three.js](https://github.com/mrdoob/three.js/blob/r184/src/geometries/CylinderGeometry.js): orientação das normais do corpo e distinção entre curvatura e extremidades.
- [NetEnt: Starburst](https://netent.com/games/starburst): catálogo profissional consultado como contexto de apresentação. Nenhuma arte ou lógica foi copiada.
- [Three.js: luzes](https://github.com/mrdoob/three.js/blob/r184/manual/en/lights.html): contribuição do céu e do chão na luz hemisférica.
- [Three.js: sombras](https://github.com/mrdoob/three.js/blob/r184/manual/en/shadows.html): objetos que projetam e recebem sombras, enquadramento e custo do mapa.
- [Shader de oclusão do Three.js](https://github.com/mrdoob/three.js/blob/r184/src/renderers/shaders/ShaderChunk/aomap_fragment.glsl.js): atenuação da iluminação indireta.
- [ContactShadows do Drei](https://github.com/pmndrs/drei/blob/master/src/core/ContactShadows.tsx): suavização das sombras e limitação dos quadros recalculados. Não foi adicionada dependência do Drei.
- [Exemplo GTAO do Three.js](https://github.com/mrdoob/three.js/blob/r184/examples/webgl_postprocessing_gtao.html): referência de oclusão e suavização. A implementação usa o material existente, sem pós-processamento adicional.
