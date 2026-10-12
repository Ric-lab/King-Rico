# Atualizar o site pelo GitHub

Quando a conexão inicial estiver configurada, cada atualização em `main` no repositório `Ric-lab/King-Rico` executa os testes, compila e publica o site em `https://king-rico.web.app`. Alterações em outra branch ou em um pull request executam a verificação, sem publicar. O painel Actions do GitHub mostra progresso e falhas. Uma falha nos testes impede a publicação; o site continua com a última versão publicada.

O fluxo usa Firebase Hosting estático no Spark. Não há Cloud Functions nem App Hosting. Google e GitHub mantêm suas próprias cotas gratuitas. A publicação do site não apaga os dados dos jogadores no Firestore. Novas regras ou mudanças na estrutura dos dados exigem uma implantação compatível separada; este workflow publica somente Hosting.

## Conexão inicial, uma vez

O GitHub precisa de autorização para publicar no Google. O script `scripts/setup-github-hosting.sh` configura Workload Identity Federation: a branch `main` deste repositório recebe credenciais temporárias de uma conta com a função Firebase Hosting Admin. Não cria chaves privadas ou secrets permanentes no GitHub. Executar o script não vincula faturamento.

No [Google Cloud Shell](https://shell.cloud.google.com/?project=king-rico), com a conta dona do projeto, obtenha o repositório:

```sh
git clone https://github.com/Ric-lab/King-Rico.git
cd King-Rico
git switch codex/firebase-spark
bash scripts/setup-github-hosting.sh
```

Se o repositório for privado, autorize primeiro o GitHub pelo fluxo oficial da CLI `gh auth login --web --git-protocol https` e use `gh repo clone Ric-lab/King-Rico`. Não usar senha como credencial de Git nem colar tokens no chat. Se já houver um checkout, use `git fetch origin` e selecione a branch com o script, preservando alterações locais.

Depois de revisar as alterações, incorpore a branch em `main`. O workflow inicia a primeira publicação. Para repetir sem mudar o código: GitHub → Actions → Publicar King Rico no Firebase → Run workflow → main. Uma autorização recém-criada pode levar alguns minutos para propagar; se esse for o erro confirmado, repita o job após a propagação.

Essa conexão não foi executada no projeto real por este ambiente: requer o login do dono do projeto no Google. Não considerar o site publicado até o job de publicação terminar com sucesso e testar o endereço.

## Mudanças futuras

1. Editar o jogo, testar e enviar as mudanças ao GitHub.
2. Revisar e incorporar em `main`.
3. Conferir o resultado em Actions e abrir o site atualizado.

Os dados públicos do Firebase estão em `cloud/firebase-config.production.js`, incluído no Git. A chave Web é um identificador público; a autorização continua nos tokens de login e nas regras do Firestore. O build de produção usa esse arquivo mesmo que um desenvolvedor tenha configuração local diferente. JavaScript usa validação de cache para que uma recarga obtenha a nova versão.

Para publicar manualmente, em um terminal autenticado:

```sh
npm ci
npm run deploy:hosting
```

A publicação automática e o acesso Google real precisam ser verificados depois da conexão. Os testes locais não substituem essa verificação.
