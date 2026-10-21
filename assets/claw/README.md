# Claw Machine — arte

As três artes GPT Imagem (gabinete, Happeach de pelúcia, Happeach coroado) da revisão `833ba5f` foram preservadas para compatibilidade com páginas antigas. As imagens do Happeach continuam no modal de resultado.

A máquina jogável atual é uma cena Three.js: o gabinete e o mecanismo são geometria, e os nove prêmios são o modelo volumétrico `assets/models/happeach-toy.glb`. Não há sprites como prêmios nem moldura ilustrada fingindo o gabinete.

O GLB deriva do modelo oficial `sym-peach-game.glb`, com simplificação por colapso de arestas que preserva os limites das ilhas UV. Reproduzir: `node scripts/prepare-claw-toy.mjs` após instalar as dependências do lockfile. Os modelos originais permanecem intactos.
