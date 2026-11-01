# King Rico — Design System

Guia do produto atual, revisado em **01/11/2026** após a publicação do Circus
aprovado. Prefira o comportamento implementado e testado a uma descrição antiga.
Referências do editor em `components/`, `tokens/`, `ui_kits/` e
`guidelines/*.card.html` não substituem os componentes de execução em `ui/`.

## Produto e público

Jogos casuais de moedas virtuais em português, com identidade de circo e King
Rico, o elefante violeta coroado. Público piloto: terceira idade. Priorize números
legíveis, alvos fáceis de tocar, poucas decisões por tela e resposta imediata.
Não há dinheiro real. Não prometer vitória ou retorno garantido.

A Home destaca Circus e quatro atrações opcionais do parque: Clown, Pênalti,
Flying Clown e Fingo rápido. Os demais jogos mantêm suas rotas; protótipos
preservados fora da Home não são novas atrações oficiais. Catálogo e fontes no
[README](README.md); ingressos e pagamentos em [Parque](docs/PARQUE.md).

## Direção visual atual

Home e Circus usam o parque diurno `assets/scenes/circus-daylight-v1.webp`:
céu azul, praça dourada, vegetação e espaço para respirar. O cenário normal não
recebe escurecimento ou desfoque global. Os outros jogos conservam seus cenários;
não trocar todos os fundos como consequência de uma revisão do Circus.

Creme e dourado sustentam números, molduras e superfícies dos rolos. Spin, auto e
turbo do Circus formam uma família azul-turquesa com texto/ícones claros. O ouro
do aro é discreto, sem reflexos brancos artificiais ou brilho varrendo o texto.
Roxo continua na marca, nos personagens e em telas que ainda o usam; não é uma
regra para escurecer os novos fundos. Os tokens antigos são referências, não uma
ordem para restaurar a paleta anterior.

Use os personagens e símbolos existentes, mantendo suas proporções e recortes.
A nuvem do King Rico continua em 2D. Não substituir arte de marca por emoji ou
ícones genéricos. Efeitos devem responder a uma ação ou estado, sem disputar
atenção com aposta, prêmio e ação principal.

## Texto e números

- pt-BR; nomes de marca preservados. Frases curtas, concretas, dirigidas a você.
- Botões com ação clara e poucas palavras. Caixa alta nos controles do jogo;
  títulos e explicações seguem a interface existente.
- Valores em formato brasileiro, sem abreviações: `1.000`, `100.000.000,65`.
  Preservar centavos reais e o formatador compartilhado; não inventar precisão
  em um jogo nem arredondar valores confirmados em outro.
- O saldo comporta até `100.000.000,65` sem reduzir a fonte por quantidade de
  dígitos. Use números tabulares e os componentes compartilhados.
- Multiplicadores devem coincidir com as regras do jogo e com o valor pago.
  Não copiar uma tabela de matemática para o design system.

Baloo 2 é a fonte principal de números e controles. Rammetto One e Luckiest Guy
servem aos letreiros existentes. Preserve as fontes locais e o contraste; não
importar uma nova família para cada tela. A escala da cena ajusta a apresentação
ao aparelho, sem deformar imagens ou diminuir números longos isoladamente.

## Cabeçalho, saldo e controles comuns

[ui/CONTROLS.md](ui/CONTROLS.md) define os componentes de execução:

- `ui/header.css` e `ui/interface.js`: saldo, Home e menu com o mesmo alinhamento,
  proporções e referência de escala. Alvos de toque de pelo menos 44 px.
- `ui/banner.js` e `ui/banner.css`: faixa de teste fixa de 60 px e separador;
  a Home rola normalmente, incluindo seu cabeçalho. Não há SDK de anúncios ativo.
- `ui/controls.css`: botões e steppers compartilhados; estados normal, ativo,
  desabilitado e foco. Wheel continua sendo referência para esses controles.
- `ui/round-controls.js`: aposta antes da partida e PEGAR/SUBIR durante a rodada,
  compartilhados por Neck e Flying Clown.
- `ui/wallet.js` e `ui/wallet-value.js`: contagem e voo das moedas. Ganhos começam
  a contar quando a primeira moeda chega; descontos contam para baixo sem voo.

O saldo confirmado no Firestore é independente da apresentação. Falha de animação
não pode perder ou duplicar crédito. Ao retomar, mostrar o valor salvo. O presente
da Home é diário; a recarga atual simula 30 segundos, sem anúncio comercial real.

Reutilizar os componentes comuns antes de criar outro botão ou cabeçalho. A arte
integrada do Circus tem montagem própria; não aplicar seu relevo a todos os jogos
nem usar essa exceção para duplicar carteira, login ou menu.

## Máquina Circus aprovada

A cena de referência mede 453 × 802. A máquina atual é montada em peças separadas,
com geometria em `ui/park/cabinet.css`; não é uma placa única de fundo. Artes do
palco antigo ainda têm consumidores e não devem ser apagadas por esse motivo.

- Três rolos contínuos, com as nove posições visíveis; janela de altura
  intermediária de 320 unidades e curva suave nas linhas externas.
- Uma fita e uma parada por coluna, da esquerda para a direita. Um símbolo não
  pode mudar de identidade ao atravessar a separação entre linhas. A matemática
  continua 3 × 3; janelas travadas do bônus preservam suas posições.
- Visor alto, creme com contorno dourado, alinhado ao umbigo do King Rico.
  Ingresso e cesta Happeach menores, com bases alinhadas ao visor e sem ocupar
  a área do personagem. O contador de ingressos mostra apenas o número.
- Barras laterais com interior branco, terminais discretos e base encostando na
  área de controles. O líquido sobe em novas cores com o pulso de energia;
  máscaras de luz e sombra seguem o alpha da peça, inclusive a barra inteira,
  sem retângulos escurecendo o cenário.
- Spin azul de 373 × 88 unidades: x = 40, topo efetivo = 667, base = 755 na cena
  de referência. Auto e turbo ficam encaixados na barra da aposta.

O clique é rígido: face, lateral, sombra e aro separados. O aro e o alvo ficam
fixos. O spin percorre 3 unidades por translação, pressiona em 34 ms e retorna
em 160 ms, sem escala, deformação ou inclinação. Auto/turbo também deslocam a
face e distinguem ligado/desligado. Não restaurar os cursos de 10/14/18 px das
tentativas anteriores, o verde antigo ou a deformação de silicone.

Som de pressionar/soltar e vibração respeitam preferências. Segurar ou cancelar
não aposta; um toque completo gera uma única operação. Respeitar movimento
reduzido. O pulso da máquina permanece, mas não altera a iluminação da face e
do aro do spin para simular reflexos.

A roleta bônus pequena e grande compartilham as cores de
`ui/park/wheel-palette.js`. Números claros, centro sem “MULTIPLIQUE”, giro por
botão ou gesto. O multiplicador dourado viaja até o prêmio; depois, as moedas
viajam ao saldo. Retomar conserva o sorteio e o crédito confirmado.

Assets ativos, exportadores e histórico das tentativas estão em
[assets/machine/README.md](assets/machine/README.md). Histórico não é especificação
ativa. O build/preload usa `ui/art-manifest.json`.

## Fontes e manutenção

| Assunto | Fonte de execução / guia |
|---|---|
| Telas, rotas e catálogo | `.dc.html`, `site/routes.json`, [README](README.md) |
| Máquina e interação Circus | `ui/park/`, `Fortune Circus.dc.html`, [Parque](docs/PARQUE.md) |
| Controles, saldo e menu | `ui/`, [Controles](ui/CONTROLS.md) |
| Matemática e persistência | `cloud/`, `firestore.rules`, [Economia](docs/ECONOMIA.md) |
| Arte e proveniência | `assets/`, [Pipeline](guidelines/asset-pipeline.md) |
| Testes e publicação | [Desenvolvimento](docs/DESENVOLVIMENTO.md), [Publicação](docs/PUBLICACAO.md) |

Uma mudança aprovada deve atualizar o guia do assunto e, quando mudar um padrão,
este documento ou o guia compartilhado. Identificar propostas, protótipos e
revisões rejeitadas; não promovê-los a regras atuais. Registrar evidências e
limites reais. Documento sozinho não garante padronização: reaproveitamento de
código e verificação no navegador continuam necessários.
