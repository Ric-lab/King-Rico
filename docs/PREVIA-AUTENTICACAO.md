# Configurar a prévia isolada — 03/11/2026

O proprietário autorizou um projeto Firebase separado no Spark. O workflow
agora recusa o projeto oficial e não usa mais sua conta/provider de produção.
A VM não possui identidade Google administrativa (`projects:list` retornou
`Failed to authenticate`); por isso o provisionamento precisa ser executado
uma vez no Cloud Shell do proprietário. Não enviar tokens ou chaves às IAs.

## Executar uma vez no Cloud Shell

Abra https://shell.cloud.google.com com a conta proprietária e execute:

```sh
git clone --branch codex/penalty-clown-preview https://github.com/Ric-lab/King-Rico.git king-rico-preview-setup
cd king-rico-preview-setup
bash scripts/setup-preview-cloud.sh
```

O ID padrão é `king-rico-previa-1408805633`; se estiver indisponível, passe um
ID livre começando por `king-rico-previa-` como primeiro argumento ao script.
O script é retomável em projetos marcados com o ID deste repositório. Recusa
um projeto existente sem essa marca. Não vincula cobrança e não cria Firestore.
A conta recebe Hosting Admin **somente no projeto de prévia**; não recebe
papéis em `king-rico`. O próprio live do projeto de teste não é isolado por IAM;
o live oficial fica protegido por estar em outro projeto.

O script cria o projeto/Firebase/Hosting, a conta `king-rico-preview`, o pool
e o provider dedicados. A confiança exige IDs imutáveis do repositório e dono,
branch `codex/**` e o arquivo `preview-channel.yml`. Nenhum papel ou provider
do projeto oficial é alterado.

Ao terminar, ele mostra dois valores públicos:

- `KING_RICO_PREVIEW_PROJECT_ID`
- `KING_RICO_PREVIEW_PROVIDER`

Se `gh` já estiver autenticado, grava automaticamente essas variáveis no GitHub.
Senão, cadastre-as em Settings → Secrets and variables → Actions → Variables
do Ric-lab/King-Rico, ou envie os dois valores ao Codex. Não são credenciais.
Depois faça um push em `codex/penalty-clown-preview` (ou execute o workflow
manualmente quando disponível no GitHub). A publicação e o teste online são
automáticos. Só então registrar a URL real no HANDOFF e no guia da prévia.

## Bloqueio original e diagnóstico

Execução real: https://github.com/Ric-lab/King-Rico/actions/runs/41641476323

Checkout, Node, `npm ci --ignore-scripts` e `build:preview` passaram.
O Google recusou o token antes do deploy:
`unauthorized_client: The given credential is rejected by the attribute condition.`
Nenhum canal foi criado, nenhum live ou regra foi publicado.

## Comando de diagnóstico no Cloud Shell do proprietário

```sh
gcloud iam workload-identity-pools providers describe github \
  --project=king-rico \
  --location=global \
  --workload-identity-pool=king-rico-github \
  --format='yaml(attributeCondition,attributeMapping)'
```

Não há um comando seguro para cumprir **simultaneamente** “usar a mesma conta
`king-rico-hosting` de produção” e “dar à branch acesso somente ao canal previa”.
Alterar a condição de confiança permite assumir essa conta com as permissões
que ela já possui; não reduz essas permissões ao comando do workflow.

O Firebase Hosting não oferece papéis personalizados para separar as operações
por canal, e Hosting não consta nos recursos suportados por `resource.name`
em IAM Conditions. Não sugerir um `gcloud ... update-oidc --attribute-condition`
como se ele isolasse o canal: ele só limita **quem autentica**, não o que a conta
pode fazer depois. Um teste em YAML que impede `live` não é isolamento de IAM.

Referências oficiais consultadas:
- https://firebase.google.com/docs/projects/iam/permissions#hosting
- https://docs.cloud.google.com/iam/docs/conditions-attribute-reference
- https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines

## Próximo passo que preserva o bloqueio do live oficial

O dono já autorizou um segundo projeto Firebase no Spark; falta configurá-lo,
com uma conta de publicação exclusiva e sem papéis no projeto `king-rico`.
A identidade desse projeto pode confiar apenas neste repositório/workflow/branch.
Depois informar ID do projeto, site e provider/conta para ajustar somente
`preview-channel.yml`. Isso protege o site oficial por separação de projeto;
no projeto de prévia a conta ainda poderá publicar o próprio live de teste.

Não aplicar mudanças IAM à conta atual sem uma nova decisão explícita do dono.
O workflow foi adaptado para o projeto isolado e aguarda as variáveis geradas
pelo provisionamento no Cloud Shell. Nenhuma URL foi inventada.
