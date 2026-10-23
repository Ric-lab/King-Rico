# Fortune Circus no celular

O site é instalável pelo navegador, sem loja e sem mudar o plano gratuito Firebase.
O manifesto usa o nome **Fortune Circus** e a arte oficial do King Rico. Ao instalar
como aplicativo, as páginas abrem sem a barra de endereço. O navegador e o sistema
podem manter seus próprios indicadores e barras do aparelho.

A primeira tela ao tocar no ícone é criada pelo sistema, usando o ícone e a cor
do manifesto. A ilustração completa aparece quando o HTML começa a carregar;
uma prévia já está embutida nele. O site não controla a duração da etapa do sistema.

- **Android / Chrome:** abra o site, entre no menu do jogo e toque em **Instalar no
  celular**. Se o navegador não oferecer a janela de instalação, use seu menu ⋮ →
  **Instalar app** ou **Adicionar à tela inicial**.
- **iPhone / Safari:** Compartilhar → **Adicionar à Tela de Início**. Ative
  **Abrir como App**, se aparecer.
- **Atalho antigo:** o celular pode conservar o nome e o ícone anteriores. Remova
  apenas o atalho e adicione novamente; não limpe os dados do navegador.

**Tela cheia** no menu usa a API do navegador onde há suporte. A permissão depende
de um toque e pode terminar ao mudar de página. Para manter todas as páginas sem a
barra de endereço, prefira a instalação. Quando a API não existe (como em alguns
iPhones), o botão mostra como instalar.

## Conta e moedas

A primeira entrada continua usando Google. A sessão persistente existente foi
preservada. O aplicativo instalado pode usar armazenamento separado do navegador,
especialmente no iPhone, e pedir a conta mais uma vez. Escolha a mesma conta para
recuperar o mesmo saldo. Não há transferência de saldos locais nem login nativo
nesta entrega. Nenhuma página, resposta de autenticação ou saldo é armazenado pelo
service worker; ele só apresenta uma mensagem de conexão em navegações sem rede.

## Endereços

Os links publicados usam `/home`, `/circus`, `/wheel`, `/neck`, `/fingo`, `/penalty`,
`/clown`, `/flying-clown` e `/33`. Os arquivos antigos continuam acessíveis e os
imports internos conservam seus nomes. As rotas estão em `site/routes.json` e os
rewrites correspondentes em `firebase.json`.

Um domínio próprio exige registro e acesso ao DNS. Depois pode ser conectado ao
Firebase Hosting sem trocar de plano. `fortune.circus.com.br` é um subdomínio de
`circus.com.br`: exige controlar esse domínio. `fortunecircus.com.br` seria outro
domínio, cuja disponibilidade precisa ser consultada. Ao mudar de domínio, é
necessário também autorizá-lo no Firebase Authentication; o login salvo no endereço
antigo não migra automaticamente para outro domínio.
