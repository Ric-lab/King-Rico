# Publicar pelo GitHub

A conexão GitHub → Firebase já está configurada. O fluxo oficial é
[Publicar King Rico no Firebase](../.github/workflows/firebase-hosting.yml), no
repositório `Ric-lab/King-Rico`. O site é **https://king-rico.web.app** e o projeto
é **king-rico**, plano **Spark**.

## Fluxo normal

1. Conferir atualizações em `main`, preservar alterações existentes e testar a mudança.
2. Gerar produção depois dos testes de integração; enviar a alteração revisada à `main`.
3. Acompanhar **verificar** e **publicar** em GitHub Actions até concluírem.
4. Conferir o site e os arquivos/fluxos afetados. Uma falha deixa a versão anterior;
   commit enviado ou build local aprovado não comprovam publicação.

Push na `main` publica. Pull request com destino à `main` verifica sem publicar.
Um push isolado em outra branch não é gatilho deste workflow. A execução manual
por Actions também existe; selecione `main` para publicar.

O job de verificação usa o lockfile, roda `npm test`, testes reais de regras e
transações emuladas com Java 21 e gera produção. O job de publicação usa esse
mesmo artefato, sem recompilar uma versão diferente.

## Regras, Hosting e credenciais

A ordem é: **regras compatíveis → limpeza controlada do Hosting → site**.
`scripts/publish-firestore-rules.mjs` compila e publica pela API REST oficial de
Firebase Rules, reutiliza regras idênticas e confirma a versão ativa. Preserve
esse publicador; não o substituir por um deploy genérico da CLI. Falha nas regras
interrompe a publicação do site.

Workload Identity Federation fornece credenciais temporárias à conta já
configurada, sem chave privada no Git. `scripts/setup-github-hosting.sh` é uma
ferramenta de configuração administrativa inicial, não uma etapa de toda release.
Não repetir configuração IAM para resolver falhas sem antes conferir o diagnóstico.

`scripts/cleanup-hosting.mjs` preserva as cinco versões recentes por canal e todas
as ativas; uploads órfãos só podem ser removidos após 24 horas. Não apaga Auth ou
Firestore. Não exige Blaze, Cloud Functions ou mudança de faturamento.

A configuração pública Web fica em `cloud/firebase-config.production.js`.
Sua apiKey identifica o app; a autorização depende de login e regras. O build de
produção usa esse arquivo mesmo com uma configuração local diferente.
Nunca enviar chaves administrativas ou tokens ao repositório.

## Cuidados de manutenção

As páginas publicadas estão em `site/routes.json`. Preservar os caminhos antigos,
o menu compartilhado, a sessão Google e o saldo ao incorporar exports de design.
Os protótipos guardados seguem no build por compatibilidade, fora da Home.
Confira versões de matemática em [Economia](ECONOMIA.md), não em instruções de deploy.

`npm run deploy:hosting` é um atalho **somente de Hosting**, para um terminal já
autenticado. Ele não publica regras; o caminho normal completo é o workflow.
Índices Firestore também não fazem parte dessa publicação automática.
