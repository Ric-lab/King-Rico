# Fortune Fingo — cartela e Plinko

Uma aposta dá 30 bolas para fazer quina. Cada sorteio oferece cinco números e pelo
menos uma opção útil para a cartela. A pessoa escolhe uma entrada na cartela ou
no bucket; a bola cai no Plinko. Qualquer dourado atingido marca seu próprio
número, mesmo quando outro foi escolhido. A escolha favorece a entrada desejada,
sem garantir o número. Linha, coluna ou diagonal completa paga **2× a aposta**,
incluindo o valor apostado; aposta de 10 recebe 20.

Novas partidas usam `cardVersion:2`, com King Rico livre no centro (índice 12).
Partidas salvas com versão 1 ou com os antigos cinco alvos terminam com sua
cartela e seus pagamentos originais. A versão da cartela não muda no meio da partida.

## Apresentação e interação

O seletor inicial abre automaticamente e ocupa a largura da tela. Mantém APOSTA
no letreiro, o valor escolhido com controles grandes e, abaixo, QUINA ×2 e o
prêmio em destaque. JOGAR confirma a única cobrança e inicia o sorteio.

O suporte claro das cinco bolas é inteiro clicável para CARTELA: o mesmo toque
abre ou fecha a consulta. As bolas preservam o tamanho e têm respiro nas bordas.
A consulta funciona durante o sorteio, mas fica bloqueada no lançamento e na queda.
Enquanto a cartela está aberta, os buckets ficam ocultos e DESISTIR ocupa a base.
Fechar a seleção mantém os buckets utilizáveis sem refazer o sorteio. DESISTIR
abre confirmação: continuar mantém o progresso; encerrar descarta a cartela sem
estorno ou prêmio e abre o seletor para uma nova aposta. Fica indisponível na queda
e após uma quina. Uma confirmação antiga não encerra uma nova partida de outra aba.

A primeira fileira tem cinco espaços livres iguais, considerando os diâmetros
dos pinos. Cada espaço tem uma linha curta, centralizada e pintada no feltro.
A esfera numerada é renderizada com Three.js local. A física apresenta o resultado
já salvo, inclusive no fim da queda e na recuperação por tempo limite; não usa
um bucket visual diferente daquele que será marcado.

No acerto, o Plinko sai de cena e a cartela reaparece. O número surge em círculo
branco, fica verde ainda parado e viaja até sua casa, iniciando o preenchimento
verde. A pausa permite acompanhar a marcação; depois volta ao Plinko com GIRAR,
sem sorteio automático. Redução de movimento mostra o estado final diretamente.
Uma quina usa RECEBER e o aviso de prêmio, mantendo voo de moedas e saldo animado.

## Persistência e publicação

Identidade e saldo vêm do mesmo login Google e Firestore dos outros jogos.
Não se importam moedas do localStorage. Só o primeiro sorteio debita a aposta;
quedas e sorteios seguintes reutilizam a cartela salva. O resultado é confirmado
antes da física. Repetições, recarga da página e outra aba preservam os números,
as marcas, o contador e o saldo, sem duplicar cobranças ou prêmios.

A regra `2026-10-28-fingo-free-v11` aceita as cartelas novas e mantém clientes e
partidas antigos compatíveis. Valida a casa pelo número do bucket atingido,
preserva a versão e confere a quina e o prêmio na mesma transação. Não exige
Cloud Functions ou plano Blaze. As regras são publicadas pelo publicador REST
existente antes do Hosting no workflow da main.

O menu compartilhado oferece NOVA CARTELA com confirmação, sem devolução ou
nova cobrança. O link de teste `/fingo?nova-cartela=1` encerra apenas a cartela da
própria conta e consome esse parâmetro uma vez; a navegação normal retoma o progresso.

## Validação

- `npm test`: regras do motor, adaptadores, transações e build com dependências locais.
- `npm run test:rules`: Firestore real emulado, repetição entre dispositivos,
  versões antigas, coringa, outro dourado, marcas falsas e as 12 quinas.
- Com `npm run build:emulator` e os emuladores ligados:
  `python3 tests/browser.py --fingo-only`. Exercita Home, aposta, saldo compartilhado,
  marcação, erro, outro dourado com bucket físico correspondente, prêmio único,
  atualização durante a queda, duas abas e cancelamento.
- Gerar `npm run build:production` depois dos testes de integração e conferir o
  resultado real do workflow em `https://king-rico.web.app/fingo`.


Os sons dos pinos seguem a escala pentatônica já usada no Circus, por fileira,
com timbre suave, ataque curto e intensidade proporcional ao contato. Impactos
repetidos têm intervalo mínimo para evitar ruído. A luz nasce no contato, aquece
o pino e abre uma onda curta no feltro, com pequenos brilhos que se dissipam.
O modo de movimento reduzido mantém apenas a iluminação breve, sem onda ou raios.
VOLTAR AO PLINKO usa o mesmo acabamento vermelho e dourado de GIRAR e JOGAR.

O build identifica cada imagem do Fingo por seu conteúdo na URL. Assim uma
instalação que já guardou a arte antiga não mistura o tabuleiro anterior com
a interface nova. O Hosting também revalida os arquivos de `assets/fingo`.
Ao retomar uma partida anterior à cartela com coringa e prêmio 2×, o jogo explica
a diferença e oferece continuar ou abrir uma nova cartela. Encerrar ainda exige
confirmação, sem descartar aposta ou progresso automaticamente.

O King Rico do centro fica incorporado ao HTML de produção e posicionado acima
dos demais elementos da casa. As molduras usam WebP, reduzindo juntas de 3,6 MB
para cerca de 380 KB. A partida só é liberada depois que os assets necessários
carregam e são decodificados; em falha aparece TENTAR NOVAMENTE, sem cobrar aposta.

A moldura e o feltro são uma camada permanente; acender e apagar altera apenas
a opacidade de uma segunda imagem já montada. O sorteio e a queda não substituem
o fundo, evitando o intervalo em branco ao trocar a imagem na mesma propriedade.
