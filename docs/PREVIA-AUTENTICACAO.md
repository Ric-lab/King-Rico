# Bloqueio da autenticação da prévia — 03/11/2026

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

O dono deve autorizar/configurar um segundo projeto Firebase no Spark,
com uma conta de publicação exclusiva e sem papéis no projeto `king-rico`.
A identidade desse projeto pode confiar apenas neste repositório/workflow/branch.
Depois informar ID do projeto, site e provider/conta para ajustar somente
`preview-channel.yml`. Isso protege o site oficial por separação de projeto;
no projeto de prévia a conta ainda poderá publicar o próprio live de teste.

Não aplicar mudanças IAM à conta atual sem uma nova decisão explícita do dono.
O workflow solicitado está pronto e versionado, mas continuará bloqueado até
resolver a confiança e o requisito de isolamento. Nenhuma URL foi inventada.
