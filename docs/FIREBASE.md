# Firebase gratuito: login Google, saldo e métricas

Esta versão usa o plano **Spark**, sem vincular faturamento. Fortune Circus, Fortune Wheel e Fortune Neck compartilham uma conta Google e saldo no Firestore. Google Analytics (GA4) recebe os eventos consentidos. O deploy inclui somente regras do Firestore e Hosting; não há Cloud Functions, TTL ou exportação BigQuery.

A tela inicial tem um único botão, **Jogar**. O primeiro acesso pode exigir escolher ou autorizar a conta no Google; o jogo não força a escolha da conta em cada entrada. O login é lembrado no mesmo navegador e o saldo continua no Firestore, inclusive após fechar e reabrir o navegador. Limpar os dados, usar uma janela privada ou sair da conta pode exigir novo login. A preferência de dados de uso é opcional e fica recolhida na tela de entrada; também pode ser alterada no menu dos jogos. Não há contas anônimas nem migração de saldos nesta mudança.

## Limite de proteção

`cloud/engine.cjs` calcula o sorteio no navegador. Transações do Firestore salvam o resultado inteiro antes da animação, com um ID que recupera pedidos repetidos. As regras restringem acesso à própria conta, saldo inicial, tipos, apostas, limites de prêmio, histórico imutável e bônus por dia do servidor.

As regras não conseguem provar que um sorteio do navegador foi honesto. Um cliente modificado pode escolher vitórias dentro dos limites. Esta arquitetura atende o cassino social com moedas virtuais; não deve servir como uma economia de prêmios de valor. Um sorteio confiável exigiria backend confiável, como Cloud Functions (que exige Blaze), ou um serviço externo. Nenhum desses serviços é necessário para ativar esta versão Spark.

## Criar o projeto gratuito

1. No [Firebase Console](https://console.firebase.google.com/), criar um projeto e **manter Spark**. Não ativar Blaze nem vincular uma conta de faturamento. Habilitar Google Analytics durante a criação ou depois nas configurações do projeto.
2. Registrar um aplicativo **Web** e copiar a configuração pública. Não usar uma chave privada de service account.
3. Authentication → Sign-in method → Google: ativar e definir e-mail de suporte. Em Authorized domains, conferir os domínios de produção. Adicionar `localhost` somente para desenvolvimento real, se necessário; projetos recentes não o adicionam automaticamente.
4. Criar Cloud Firestore, em modo de produção, na região escolhida. A região não muda depois. Publicar as regras deste repositório antes de testar o aplicativo.
5. Copiar `cloud/firebase-config.example.js` para `cloud/firebase-config.js`, preencher `apiKey`, `authDomain`, `projectId`, `appId` e `measurementId` e colocar `enabled: true`. São identificadores públicos, não credenciais administrativas. O arquivo local é ignorado pelo Git. Sem `measurementId`, login e saldo funcionam, mas os eventos não são coletados.
6. Em uma máquina autorizada, usar o fluxo oficial `firebase login`. Nunca enviar tokens, chaves privadas ou senhas no chat.
7. Após validar os emuladores, executar:

```sh
npm run build
npx firebase deploy --project SEU_PROJECT_ID --only firestore,hosting
```

8. Conferir login Google real, saldo depois de recarregar, outro navegador com a mesma conta, conta diferente, ambos os jogos, bônus diário e revogação de analytics. Esta etapa ainda exige um projeto real e acesso do dono; não foi publicada automaticamente.

Para atualizações automáticas do site a partir de `main`, seguir [PUBLICACAO.md](PUBLICACAO.md). A configuração pública real está em `cloud/firebase-config.production.js`; `npm run build:production` a utiliza explicitamente. O workflow publica primeiro regras compatíveis e depois Hosting. Índices continuam sendo implantados separadamente.

## Cotas e consumo

O Spark oferece cotas gratuitas, não capacidade ilimitada. No Firestore, a cota gratuita usual é 1 GiB de armazenamento, 50 mil leituras e 20 mil escritas por dia para um banco elegível por projeto. Conferir os valores atuais e as regras de elegibilidade na [documentação de cotas](https://firebase.google.com/docs/firestore/quotas) e no [preço oficial](https://firebase.google.com/pricing).

Um giro ou bônus concedido grava **dois documentos**: jogador e operação. Também há leituras da transação, do listener e das regras, além de retries em conflitos. Portanto, 20 mil escritas não equivalem a 20 mil giros; o máximo teórico seria menos de 10 mil giros/dia antes dos outros usos. Mudanças de ajustes gravam somente o jogador, agrupadas por 400 ms. O login de uma conta existente não cria outra operação. Analytics não grava eventos no Firestore.

O histórico cresce com as jogadas. Os índices de operações estão desativados para economizar armazenamento; elas continuam legíveis por ID. Não há remoção automática: manter os IDs permite recuperar respostas perdidas. Monitorar a aba Usage e planejar a retenção antes de crescer. Hosting também possui cotas de armazenamento e transferência; as imagens e os modelos deste jogo podem consumir transferência rapidamente. GA4 padrão é gratuito, mas tem limites e atraso nos relatórios.

Ao atingir limites de um produto no Spark, pedidos podem ser recusados ou o produto restringido. O aplicativo mostra falha de confirmação e não concede saldo offline; o comportamento exato e o período da cota dependem do produto. Permanecer no Spark evita converter esse consumo automaticamente em cobrança.

## Desenvolvimento e verificações

Usar Node 22.23.3 (`.nvmrc`), npm, Java 21 e, para o navegador, Python Playwright e Chromium em `/usr/bin/chromium`.

```sh
npm ci
npm test
npm run test:integration
```

`npm run emulators` inicia Auth (9099), Firestore (8085) e Hosting (5000), no projeto fictício `demo-king-rico`. A tela de login indica explicitamente a conta fictícia. A simulação não acessa uma conta Google verdadeira e não envia Analytics. `npm run test:integration` executa testes das regras e transações no Firestore emulado, depois um fluxo de navegador dos dois jogos, recarga e isolamento de contas.

O primeiro uso baixa o JAR oficial do Firestore de `storage.googleapis.com`; esse domínio precisa ser permitido na rede. O cache fica em `.firebase-cache/emulators/`. Testes unitários usam transações em memória. A integração executa as regras compiladas no Firestore emulado; login Google real, GA4 e persistência em produção exigem validação no projeto real.

`npm run build` gera `dist/`, com React/Babel local e os hashes SRI do projeto. `game.html` encaminha para a fonte atual para evitar um pacote antigo ignorando login. Builds de produção rejeitam configuração de emuladores e configuração ativa incompleta. Com `enabled: false`, permanece o protótipo local, sem persistência em nuvem.

## Dados e recuperação

- `players/{uid}`: saldo em centésimos inteiros de moeda, cesta Happeach, ajustes/apostas, bônus, consentimento, revisão e datas de servidor.
- `players/{uid}.neckRound`: rodada ativa do Neck, com ID, aposta, andar, Happeach e prêmio garantido. Perfis antigos sem esse campo continuam válidos. Cada início, subida ou coleta confirma uma transação antes da animação; só o início debita a aposta. Recarregar ou abrir outro aparelho retoma a mesma rodada. Coleta, queda ou andar 33 encerram a rodada e creditam o prêmio uma única vez.
- `players/{uid}/operations/{requestId}`: parâmetros, versão das regras e resultado do pedido financeiro, incluindo a Rodada Especial inteira. Uma repetição retorna o mesmo registro; parâmetros diferentes com o mesmo ID são recusados. Alteração e exclusão pelo cliente são negadas.
- GA4: eventos consentidos, sem documentos de eventos no Firestore. Ver [ANALYTICS.md](ANALYTICS.md).

Conta nova recebe 1.000 moedas. O saldo antigo do aparelho fica em `kingRico.legacyBackup`, sem importação automática. O pedido é salvo localmente antes do envio; uma resposta perdida é recuperada com o mesmo ID no próximo acesso. Sem conexão, a versão de nuvem aguarda confirmação e não inicia a animação nem aplica um crédito local. Fechar uma Rodada Especial perde a animação; seu prêmio inteiro já foi persistido. Mudanças de outro aparelho são aplicadas quando termina a animação atual.

O Neck preserva os 33 multiplicadores do design, de x1,1 a x50, sem o dígito 6. Seus prêmios são arredondados a uma casa decimal, como no protótipo; o saldo compartilhado mantém os centésimos vindos dos outros jogos. Happeach garante o prêmio do andar 6–20 onde aparece. As mesmas limitações de sorteio no cliente do Spark também se aplicam ao Neck.

O bônus mantém o ciclo 50 → 100 → 150 → 200 → 250 → 500 → 1.000, uma vez por dia em São Paulo (UTC−3), validado pelo relógio do Firestore. O navegador propõe o dia; relógios incorretos podem causar recusa, sem crédito extra. O botão de recarga usa esse bônus e não concede saldo ilimitado.

O projeto Android mencionado em `ANDROID.md` não está completo neste checkout. Esta integração cobre o Web; login nativo, certificados SHA e APK são uma etapa posterior.
