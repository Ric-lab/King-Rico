# Atualizar o site pelo GitHub

Quando a conexão inicial estiver configurada, cada atualização em `main` no repositório `Ric-lab/King-Rico` executa os testes, compila e publica o site em `https://king-rico.web.app`. Alterações em outra branch ou em um pull request executam a verificação, sem publicar. O painel Actions do GitHub mostra progresso e falhas. Uma falha nos testes impede a publicação; o site continua com a última versão publicada.

O fluxo usa Firebase Hosting estático no Spark. Não há Cloud Functions nem App Hosting. Google e GitHub mantêm suas próprias cotas gratuitas. O workflow publica as regras do Firestore antes do site, para que o Neck e os outros jogos usem a mesma carteira. Se as regras falharem, o site novo não é publicado. A publicação não apaga os dados dos jogadores. Índices exigem implantação separada.

As regras são compiladas e publicadas pela API REST oficial de Firebase Rules, com as mesmas credenciais temporárias do workflow. O script `scripts/publish-firestore-rules.mjs` verifica a versão ativa após a atualização e reutiliza uma versão idêntica. Esse caminho usa Firebase Rules Admin diretamente e dispensa a consulta de ativação de serviços que a CLI faz antes de publicar regras. Não altera APIs habilitadas ou permissões IAM. Erros de autorização interrompem a publicação e aparecem nas anotações do GitHub, sem credenciais ou respostas completas.

## Conexão inicial, uma vez

O GitHub precisa de autorização para publicar no Google. O script `scripts/setup-github-hosting.sh` configura Workload Identity Federation: a branch `main` deste repositório recebe credenciais temporárias de uma conta com as funções Firebase Hosting Admin e Firebase Rules Admin. Não recebe acesso administrativo direto aos documentos dos jogadores e não cria chaves privadas ou secrets permanentes no GitHub. Executar o script não vincula faturamento.

Quem configurou a publicação antiga, que incluía somente Hosting, precisa executar uma vez no Google Cloud Shell:

```sh
gcloud projects add-iam-policy-binding king-rico --member=serviceAccount:king-rico-hosting@king-rico.iam.gserviceaccount.com --role=roles/firebaserules.admin --condition=None --quiet
```

Isso autoriza o workflow a publicar regras. Não habilita Blaze nem concede leitura dos saldos pela API administrativa. Após conceder, repetir o job de publicação se uma execução falhou por falta dessa permissão.

No [Google Cloud Shell](https://shell.cloud.google.com/?project=king-rico), com a conta dona do projeto, obtenha o repositório:

```sh
git clone https://github.com/Ric-lab/King-Rico.git
cd King-Rico
git switch codex/firebase-spark
bash scripts/setup-github-hosting.sh
```

Se o repositório for privado, autorize primeiro o GitHub pelo fluxo oficial da CLI `gh auth login --web --git-protocol https` e use `gh repo clone Ric-lab/King-Rico`. Não usar senha como credencial de Git nem colar tokens no chat. Se já houver um checkout, use `git fetch origin` e selecione a branch com o script, preservando alterações locais.

Se a conta de publicação acabou de ser criada, o Google pode responder que ela ainda não existe ao aplicar a permissão. O script repete apenas esse erro, com até 90 segundos de espera total. Outros erros interrompem a configuração. Para atualizar o script e retomar uma execução interrompida, no mesmo checkout da branch `codex/firebase-spark`:

```sh
git pull --ff-only
bash scripts/setup-github-hosting.sh
```

O script reutiliza a conta e a conexão já criadas. Só considere a configuração concluída quando aparecer `Conexão GitHub → Firebase configurada.`

Depois de revisar as alterações, incorpore a branch em `main`. O workflow inicia a primeira publicação. Para repetir sem mudar o código: GitHub → Actions → Publicar King Rico no Firebase → Run workflow → main. Uma autorização recém-criada pode levar alguns minutos para propagar; se esse for o erro confirmado, repita o job após a propagação.

Essa conexão não foi executada no projeto real por este ambiente: requer o login do dono do projeto no Google. Não considerar o site publicado até o job de publicação terminar com sucesso e testar o endereço.

## Mudanças futuras

1. Editar o jogo, testar e enviar as mudanças ao GitHub.
2. Revisar e incorporar em `main`.
3. Conferir o resultado em Actions e abrir o site atualizado.

Exportações do editor visual precisam preservar as ligações da Home com `KingRicoCloud` e com o menu compartilhado. Um card novo também exige incluir a página no build e integrar suas apostas, prêmios e progresso à carteira; copiar somente a tela não publica um jogo funcional na nuvem. Os testes de adaptadores e o fluxo de navegador verificam saldo, bônus, menus e retomada de sessão.

Os dados públicos do Firebase estão em `cloud/firebase-config.production.js`, incluído no Git. A chave Web é um identificador público; a autorização continua nos tokens de login e nas regras do Firestore. O build de produção usa esse arquivo mesmo que um desenvolvedor tenha configuração local diferente. JavaScript usa validação de cache para que uma recarga obtenha a nova versão.

Para publicar manualmente, em um terminal autenticado:

```sh
npm ci
npm run deploy:hosting
```

A publicação automática e o acesso Google real precisam ser verificados depois da conexão. Os testes locais não substituem essa verificação.
