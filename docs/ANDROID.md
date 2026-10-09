# King Rico no Android: estratégia e roteiro

Objetivo: o mesmo código web vira **app Android na Google Play** (canal principal) e, de quebra, PWA.
Este documento substitui a ordem das fases do `MANUAL.md` §9, que foi escrita pensando em web primeiro.

## Decisão: Capacitor

| Opção | Reaproveita o jogo | Anúncio premiado (AdMob) | Funciona offline | Esforço | Veredito |
|---|---|---|---|---|---|
| **Capacitor** (WebView + plugins nativos) | 100% | Sim, SDK nativo | Sim, tudo empacotado | Baixo | **Escolhido** |
| TWA / Bubblewrap (Chrome em tela cheia) | 100% | Não: AdSense é para sites, não para apps | Depende de service worker | Muito baixo | Descartado (monetização) |
| Reescrever nativo (Kotlin) ou Unity | 0% | Sim | Sim | Meses | Descartado (joga fora o que já funciona) |

O jogo já é HTML/JS, com sons em Web Audio e animações em `transform`/`opacity`. Tudo isso roda bem
num WebView. O que o Capacitor acrescenta é o que a web não tem: anúncio premiado nativo, login Google
nativo, vibração confiável, ícone na loja e, mais tarde, Play Billing.

## O que já está pronto (pasta `app/`)

- `src/game/engine.ts`: regras e matemática puras (sem DOM), portadas 1:1 do jogo. O gerador aleatório é
  injetável, então o mesmo código roda no servidor quando o saldo for para a nuvem.
- `npm test`: simulação de 500 mil giros que **falha** se o RTP sair de 96–99%, se o acerto ficar abaixo de 20% ou
  se a Rodada Especial sair do intervalo de 1/50 a 1/100. Medição atual (2 milhões de giros): RTP **98,7%**, base 75,7%,
  acerto 24,1%, Rodada Especial a cada 69 giros com média de 15,9x.
- `npm run build:www`: empacota o protótipo atual **para rodar sem internet**. React, ReactDOM e Babel saem do npm
  (no lugar do unpkg) e as fontes vêm do @fontsource. Segue os `<dc-import>` (jogo → Home → KingRico) e
  copia só os assets usados. O build falha se faltar algum asset ou se sobrar alguma URL externa.
- `npm run smoke`: abre Home e jogo com a internet bloqueada e faz 3 giros. Falha em 404, imagem quebrada,
  erro de JS ou saldo que não muda.
- `android/`: projeto Capacitor 8 (minSdk 24 = Android 7+, targetSdk 36), travado em retrato, com permissão de
  vibração (sem ela o `navigator.vibrate` do jogo não funciona no WebView).
- Ícones e splash provisórios gerados por código a partir do King Rico mestre (`npm run icons`).
- CI (`.github/workflows/android.yml`): em todo push roda testes → build → teste de fumaça. O **APK de teste** só é
  gerado sob demanda (Actions → App Android → Run workflow) e fica no branch `apk-builds` (só o mais recente)
  para baixar e instalar no celular.

### Como instalar o APK de teste
1. GitHub → aba **Actions** → "App Android" → **Run workflow** (APK marcado); ao terminar, o arquivo fica no branch
   `apk-builds` (`king-rico-teste.apk`) e no artefato `king-rico-debug-apk` da execução.
2. Passe o `app-debug.apk` para o celular e abra. O Android pede para permitir "instalar apps desta fonte".

### Rodar localmente
```
cd app
npm ci
npm test                 # matemática
npm run build:www        # empacota o jogo offline em app/www
npm run smoke            # Home + 3 giros sem internet
npm run android:apk      # requer Android Studio/SDK + JDK 21
```

## Roteiro (ordem para Android)

### Fase 1: Validar no celular real (agora)
- Instalar o APK de teste no celular da usuária piloto e em um Android simples (2–3 GB de RAM).
- Medir o tempo de abertura até o primeiro giro. Hoje o Babel (3 MB) recompila o jogo no aparelho a cada abertura;
  se passar de ~3 s num celular simples, a Fase 2 vira urgente.
- Decidir o `appId` (hoje `com.kingrico.app`). **Ele fica permanente no primeiro envio à Play.**

### Fase 2: Portar para Vite + React + TypeScript
- Fazer tela por tela, com o jogo funcionando o tempo todo: `engine.ts` já existe; depois `audio/sfx.ts`,
  `screens/Home.tsx`, `screens/Game.tsx` e `mascot/KingRico.tsx`.
- Quando terminar, o `vite build` substitui o `build-www.mjs`. Saem o Babel (3 MB) e o `support.js`, sai a compilação
  no aparelho e sai o registro `__fcAsset` (os imports normais resolvem as imagens).
- O teste de fumaça continua valendo, porque ele testa o comportamento e não a implementação.

### Fase 3: Conta e saldo na nuvem
- Login Google **nativo** (`@capacitor-firebase/authentication`), Firestore `users/{uid}`.
- **Giro, bônus diário e recompensa de anúncio rodam no servidor** (Cloud Functions usando o mesmo `engine.ts`).
  O app só anima o resultado. Sem isso, qualquer pessoa edita o saldo.
- `localStorage` fica como cache offline.

### Fase 4: Anúncio premiado
- AdMob rewarded (`@capacitor-community/admob`) + consentimento UMP (LGPD/GDPR).
- A recompensa é validada no servidor (SSV do AdMob → Cloud Function), nunca no cliente.
- Nunca durante um giro ou a Rodada Especial; só em pausas (Home, saldo zerado).

### Fase 5: Google Play
- **Tipo de conta**: conta *pessoal* criada depois de nov/2023 precisa de **teste fechado com 12 testadores
  inscritos por 14 dias seguidos** antes de liberar produção. Conta de *organização* (exige D-U-N-S) não tem essa
  exigência. Se for pessoal, comece a juntar os 12 testadores já na Fase 1.
- Classificação IARC declarando **jogo de azar simulado**; público-alvo **18+**; fora do programa Famílias.
- App de cassino social **não pode exibir anúncios de jogos de azar reais** nem direcionar para cassino com dinheiro.
  Bloqueie a categoria "Gambling" no AdMob.
- Política de privacidade, Data Safety, aviso "sem dinheiro real, sem prêmios" na abertura e na ficha da loja.
- Publicar como **AAB assinado** (Play App Signing). Guardar a chave de upload fora do repositório (secret do CI).

### Fase 6: PWA (canal secundário)
O mesmo `www` com `manifest.webmanifest` + service worker serve como PWA para iPhone e desktop. Não é prioridade.

## Pendências conhecidas
- Ícone e splash são provisórios (corte automático do mestre). A arte final merece um ajuste manual.
- `npm run icons` recria as variações de splash em paisagem; apague `android/app/src/main/res/drawable-land-*` depois (o app é só retrato).
- O repositório pesa ~270 MB por causa de intermediários de geração (`_raw-*`, `podium2/3`, `top-layer*`). Mover para
  armazenamento externo (Drive) e tirar do git é uma decisão do dono; o histórico continua pesado de qualquer forma.

Fontes das regras da Play (conferir a versão vigente antes de publicar):
[teste fechado para contas pessoais](https://support.google.com/googleplay/android-developer/answer/14151465),
[jogos de azar e simulados](https://support.google.com/googleplay/android-developer/answer/9877032).
