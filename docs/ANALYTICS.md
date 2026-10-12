# Medir o King Rico no plano gratuito

Objetivo inicial: descobrir se a pessoa começa, volta e encontra uma experiência estável. Os dois jogos usam moedas virtuais e têm um público piloto de terceira idade. Ainda não há dados de produção nem metas medidas.

Google Analytics 4 recebe eventos do navegador **depois do consentimento**, sem escritas de analytics no Firestore. O SDK só é inicializado quando há consentimento e `measurementId`. O UID interno do Firebase vira `user_id`; não enviar nome, e-mail ou telefone. Os emuladores nunca enviam eventos reais.

## Três indicadores para começar

| Indicador | Definição | Uso |
|---|---|---|
| Ativação | Contas elegíveis com primeiro `spin_settled` em até 30 minutos do `account_created` ÷ contas elegíveis com essa janela completa | Melhorar login, Home e primeiro giro |
| Retorno D7 | Jogadores cuja primeira jogada foi em D e jogam também no dia D+7 ÷ jogadores dessa coorte já observáveis no D+7 | Priorizar tutorial, bônus ou conteúdo |
| Jogadores ativos semanais | `user_id` distintos com pelo menos um `spin_settled` na semana | Acompanhar recorrência; separar novos e recorrentes |

Usar o fuso `America/Sao_Paulo` no GA4, semanas começando na segunda-feira, e contar a pessoa uma vez entre aparelhos e jogos. D7 significa o dia exato, não qualquer dia da semana seguinte. As métricas acima são as definições desejadas; o relatório padrão de retenção do GA4 pode usar outra população ou primeiro evento. Não renomear um relatório padrão como D7 do primeiro giro sem conferir a definição.

Contas elegíveis para ativação autorizam analytics desde a criação; o perfil guarda `analyticsFromCreation`. Usuários que consentem depois não terão `account_created` e ficam fora desse funil. Não interpretar ausência de eventos como zero: consentimento negado/revogado, bloqueadores, erros de rede e janelas incompletas afetam a cobertura. Sempre mostrar n/N com porcentagens e informar a cobertura da coleta. A contagem de contas elegíveis atuais exige leitura administrativa dos perfis; não foi criado um painel administrativo.

## Eventos implementados

Todos são emitidos pelo cliente. Os três eventos financeiros são enviados **após a transação confirmada**; o Analytics não decide nem altera saldo.

| Evento | Quando | Parâmetros específicos |
|---|---|---|
| `account_created` | Criação com consentimento | — |
| `spin_settled` | Giro persistido, com prêmio especial incluído | `game`, `bet`, `payout`, `special_round`, `operation_id` |
| `daily_bonus_claimed` | Bônus persistido com valor positivo | `amount`, `operation_id` |
| `session_started` | Primeira conexão da conta na aba | — |
| `screen_viewed` | Tela Home, Circus ou Wheel | `game` |
| `engagement` | Amostra de aba visível com interação nos últimos cinco minutos | `seconds` (30) |
| `client_error` | Falha tratada no cliente autenticado | `error_code` (`auth`, `network` ou `service`) |

Todos levam `game`, `tab_session_id` e `rules_version`. `tab_session_id` representa uma aba, não o modelo automático de sessão do GA4. Não registrar IDs de operação/sessão como dimensões personalizadas comuns: a cardinalidade é alta. `operation_id` serve para deduplicação quando houver acesso aos eventos individuais; as contagens padrão do GA4 não a fazem automaticamente. Pedidos recuperados não emitem o evento financeiro de novo.

Um resultado salvo pode ficar sem evento se a resposta se perder ou a aba fechar antes do envio. Bloqueadores também podem impedir a coleta. Portanto, GA4 mede uso observado; o histórico no Firestore é a fonte de recuperação das moedas. Sorteios no Spark são calculados no cliente e podem ser adulterados. Nem GA4 nem esse histórico provam que resultados foram sorteados honestamente.

## Ler os primeiros resultados

No GA4, configurar o fuso e conferir consentimento antes de abrir Realtime. Registrar dimensões de baixa cardinalidade `game`, `rules_version`, `error_code`, `special_round`, e métricas numéricas `bet`, `payout`, `amount`, `seconds` conforme os tipos aceitos. As definições personalizadas precisam existir antes da análise e podem levar tempo para aparecer. Para desenvolvimento com um projeto de teste real, usar a extensão oficial Google Analytics Debugger; não enviar eventos do emulador para a produção.

Começar com giros e jogadores por jogo, um funil `account_created` → `spin_settled` e erro por aba observada. Conferir as janelas, o uso de `user_id` e as limitações de identidade do GA4 antes de calcular os três indicadores. Explorações e relatórios padrão não garantem todas as definições exatas; exportação de eventos, SQL e dashboard não fazem parte desta etapa gratuita. Não habilitar BigQuery ou faturamento apenas para obter o primeiro painel.

Diagnósticos úteis: preferência entre Circus e Wheel, telas até o primeiro giro, sessões com erro e soma de prêmios ÷ soma de apostas por jogo/versão. RTP observado é incompleto e pode ser adulterado; para matemática do jogo usar simulações, não só Analytics. Giro confirmado não prova que a pessoa viu toda a animação.

Analytics começa desligado; login e menu permitem mudar o consentimento. Ao desligar ou trocar de conta, a fila em memória é descartada, a coleta é desabilitada e `user_id` é removido. Isso não apaga eventos já enviados. Google Signals e sinais de personalização de anúncios são desativados. Configurar retenção de dados e demais opções na propriedade GA4; não há TTL pago no Firestore.

Coletar duas semanas completas antes de escolher metas, acompanhando erros desde o primeiro dia. Muitos giros ou minutos não provam boa experiência; ouvir a usuária piloto continua necessário.
