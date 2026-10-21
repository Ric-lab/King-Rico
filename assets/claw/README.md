# Claw Machine — arte

As três artes GPT Imagem (gabinete, Happeach de pelúcia, Happeach coroado) da revisão `833ba5f` foram preservadas para compatibilidade com páginas antigas. As imagens do Happeach continuam no modal de resultado.

A máquina jogável atual é uma cena Three.js: o gabinete e o mecanismo são geometria, e os nove prêmios misturam modelos volumétricos de Happeach e King Rico com almofadas de diamante, moeda e cabeça da Nick Neck. Não há sprites como prêmios nem moldura ilustrada fingindo o gabinete.

O GLB deriva do modelo oficial `sym-peach-game.glb`, com simplificação por colapso de arestas que preserva os limites das ilhas UV. Reproduzir: `node scripts/prepare-claw-toy.mjs` após instalar as dependências do lockfile. Os modelos originais permanecem intactos.

A revisão de câmera próxima acrescenta quatro tipos: King Rico (`king-rico-toy.glb`, reduzido do modelo oficial) e almofadas volumétricas de diamante, moeda e cabeça da girafa. As almofadas usam arte e silhueta existentes, volume fechado e verso de tecido. A identidade depende apenas de semente e índice, inclusive na recuperação de rodadas. Os GLBs derivados usam somente o mapa de cor e não modificam os modelos originais.
