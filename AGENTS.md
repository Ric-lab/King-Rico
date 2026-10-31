# Manutenção do King Rico

Leia `README.md` e `docs/README.md` antes de alterar o projeto. São o ponto de
entrada atual; `docs/historico/` contém registros antigos, não tarefas aprovadas.

## Fontes e limites

- Páginas `.dc.html` e `site/routes.json` definem as telas publicadas. A Home
  destaca Circus e parque; preserve também os demais jogos, as rotas dos
  protótipos guardados e `/21`.
- `ui/` é a interface compartilhada em execução. `components/`, `tokens/`,
  `ui_kits/` e os cards HTML de `guidelines/` são referências de design.
- Nunca editar `dist/`, `runtime/` ou `cloud/client.js` como fonte. O build gera
  `/game.html` como redirecionamento; não commitar o export empacotado do editor.
- Os dois arquivos `King Rico.dc.html` e `KingRico.dc.html` têm consumidores;
  não apagar um deles apenas por terem nomes parecidos.
- Assets podem ser referenciados por nomes montados em código. Busca textual
  sem resultados não prova que uma imagem, sprite ou modelo pode ser apagado.

## Compatibilidade

Preserve login Google persistente, saldo compartilhado no Firestore, IDs de
operação e recuperação após recarga. Não importar moedas antigas do localStorage.
Crédito financeiro confirmado e animação do saldo são responsabilidades distintas:
um erro visual não pode perder nem duplicar moedas.

Mudanças na matemática exigem conferir `cloud/engine.cjs`, módulos do jogo,
`firestore.rules`, interface e testes; rodadas já pagas mantêm suas versões.
Firebase deve continuar no Spark, sem Blaze ou Cloud Functions. Preserve o
publicador REST de regras e o workflow existente. Configuração Web pública não
é chave administrativa; credenciais temporárias e arquivos de conta de serviço
nunca entram no Git.

## Trabalho e entrega

Use `docs/DESENVOLVIMENTO.md` para testes proporcionais. Builds apagam e recriam
`dist/`: não executar testes que geram build em paralelo ao navegador de integração.
Gere produção depois da integração. Quando publicar, confirme o resultado real
em Actions e no site, preservando commits que tenham chegado à main.

Para arte, leia `guidelines/asset-pipeline.md` e `DESIGN-SYSTEM.md`. Reaproveite o
padrão visual existente. Evidências locais ficam em `work/`, ignorado pelo Git.
Documente comportamento atual no guia pertinente; propostas e relatórios antigos
precisam de data e identificação clara, sem virar instruções permanentes.
