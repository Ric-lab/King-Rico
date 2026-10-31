# Circus e parque

O endereço principal e o atalho instalado abrem a nova Home. Ela apresenta o Fortune Circus e quatro atrações opcionais: Clown, Pênalti,
Flying Clown e Fingo rápido. Wheel, Neck, 33 e os protótipos mantêm seus endereços.

## Ingressos e entrada

Uma trinca de ingressos no Circus dá **3 ingressos**. A conta começa com zero
ingressos; nenhum saldo ou ingresso da prévia local é importado.

Cada partida do parque custa **1 ingresso ou 25 moedas**. Escolher a forma de
entrada apenas autoriza: a cobrança acontece na primeira jogada confirmada.
Recarregar a página conserva a partida e não cobra uma segunda entrada.
Rodadas antigas já pagas mantêm aposta e versão originais.

O Fingo rápido mantém tabuleiro, cartela 5×5, coringa central e física do Fingo.
A nova partida oferece **10 bolas**, com prêmio total de **2×** por quina.
Cartelas antigas conservam suas 30 bolas e pagamentos.

## Roleta bônus do Circus

Cada giro pago carrega as duas barras. No décimo, uma rodada com prêmio real
abre a roleta. O prêmio-base pertence àquela rodada; a roleta credita somente a
diferença entre o total multiplicado e a base já confirmada.

O sorteio, a aplicação visual e o fechamento são etapas recuperáveis. A mesma
operação não credita duas vezes, inclusive em outro aparelho. Reabrir uma roleta
já sorteada apresenta o mesmo multiplicador. Falha de animação não desfaz crédito.

A apresentação conserva o líquido sincronizado com o pulso, a união das roletas,
o multiplicador viajando ao prêmio e as moedas viajando ao saldo. O fundo normal
do Circus usa a mesma imagem e enquadramento do Fortune Clown.

## Persistência e publicação

`cloud/park.cjs` implementa as transições. `cloud/store.mjs` grava carteira,
registro do parque e operação imutável na mesma transação Firestore. As regras
validam a relação entre esses registros. O registro imutável valida o envelope
completo uma vez; carteira e parque exigem sua criação na mesma transação e
rejeitam um ID já existente. Não há Cloud Functions nem plano Blaze.

`ui/park/` contém somente a apresentação integrada ao cliente Google/Firestore.
As moedas de teste e o servidor da prévia não fazem parte do build publicado.

Verificações relevantes: `tests/integration.mjs`, `tests/adapters.test.cjs`,
`tests/build.test.mjs` e `tests/park_browser.py`. O navegador usa os emuladores;
`KING_RICO_TEST_URL` seleciona o Hosting local. Gere produção após essa validação,
e confirme os jobs do workflow existente antes de considerar a entrega publicada.
