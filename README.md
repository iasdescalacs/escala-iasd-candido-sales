# ESCALA IASD CANDIDO SALES

Sistema web para organização de escalas da IASD Candido Sales.

## Etapa Atual

### Etapa 7: Notificações Push

Entregue até esta etapa:

- Projeto Next.js com App Router.
- TypeScript em modo estrito.
- Tailwind CSS configurado.
- Pastas organizadas em `src/app`, `src/components`, `src/lib` e `src/config`.
- Layout principal com menu responsivo.
- Menu principal no desktop/tablet reorganiza automaticamente os links excedentes no submenu `Mais`.
- Itens com nomes compostos no menu nao quebram linha; quando nao couberem, entram inteiros no submenu `Mais`.
- Tema claro e escuro com base visual no azul `#2E6DE7`.
- Página inicial.
- PWA inicial com `manifest.json`, ícone e service worker.
- PWA preparado para notificações reais em segundo plano com Web Push e VAPID.
- PWA abre em `/painel` e a página inicial redireciona usuários já logados, mantendo a sessão até o usuário tocar em `Sair`.
- Ícone do site/PWA usa uma igreja em azul e branco nos favicons e no manifest.
- Git configurado com `user.name=iasdescalacs`.
- Git configurado com `user.email=iasdescalacs@gmail.com`.
- Repositório GitHub conectado em `origin`.
- Branch `main` criada e enviada para o GitHub.
- Projeto Vercel conectado localmente pela CLI.
- Cliente Supabase para browser.
- Cliente Supabase para server.
- Cliente admin Supabase somente servidor, usando `SUPABASE_SERVICE_ROLE_KEY`.
- Variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SITE_URL` configuradas localmente e na Vercel.
- `.env.example` atualizado sem valores reais.
- Banco inicial em `supabase/migrations/20260907162000_initial_schema.sql`.
- Reforço de segurança em `supabase/migrations/20260907173000_auth_access_policies.sql`.
- Dados fictícios de teste em `supabase/seed.sql`.
- Scripts manuais de recuperação/admin em `supabase/manual/`.
- Tipos TypeScript iniciais do banco em `src/types/database.ts`.
- Login, logout, cadastro, recuperação de senha e alteração de senha.
- Cadastro novo com perfil pendente em `public.users`.
- Tela de aguardando aprovação.
- Perfil do usuário.
- Proteção de rotas com `src/proxy.ts` e validação nas páginas/actions do servidor.
- Tela administrativa inicial para aprovar, bloquear ou inativar usuários.
- Botões de status em `/admin/usuarios` aparecem somente quando a ação ainda é aplicável ao usuário.
- Cards de usuários em `/admin/usuarios` têm ícone de edição no topo direito.
- A seção de criar usuário em `/admin/usuarios` inicia recolhida e pode ser expandida pelo admin.
- Admin pode editar nome, telefone, função e status em `/admin/usuarios/[id]/editar`.
- Admin pode excluir usuários em `/admin/usuarios` com confirmação; a exclusão remove vínculos relacionados no banco.
- Tela administrativa para criar igrejas.
- Formulário de criação de igrejas mantém campos e botão dentro do card em telas pequenas e grandes.
- Admin pode criar usuários já vinculados a uma função e igreja.
- Cadastro público permite escolher tipo de usuário e igreja onde é membro.
- Login usa apenas e-mail e senha.
- Formulários exibem sucesso e erro em uma pequena janela de aviso flutuante com opção de fechar.
- Tipo de usuário/função é escolhido no cadastro público ou definido pelo administrador ao criar usuários.
- Menu `Status Supabase` aparece somente para administrador.
- Página administrativa de cultos em `/admin/cultos`.
- Admin pode gerar cultos para todas as igrejas ativas por mês, ou por intervalo de até 3 meses no mesmo ano.
- Cultos padrão gerados: quarta-feira das 19:45 às 21:00, sábado das 08:45 às 12:00 e domingo das 19:45 às 21:00.
- Calendário mensal de cultos com navegação para mês anterior e próximo mês.
- Cada culto exibe igreja, horário, pregador e cantor/grupo, mantendo pregador e música como `A definir` nesta etapa.
- Admin pode criar cultos especiais para uma igreja selecionada, como Semana de Oração, Mini Semana de Oração, Culto de Gratidão e Culto da Virada.
- Cultos especiais podem ter uma data única ou um período de vários dias.
- Admin pode excluir todos os cultos em `/admin/cultos` com confirmação; a limpeza remove também as escalas de pregação e louvor, as permutas e as disponibilidades por data, preservando usuários, igrejas e preferências de igrejas dos voluntários.
- Página de disponibilidade em `/disponibilidade` para usuários aprovados.
- Pregadores e cantores podem marcar cultos disponíveis no calendário do mês.
- Usuários com as duas funções veem seções separadas para Pregador e Cantor.
- Pregadores e cantores podem escolher as igrejas onde aceitam ser escalados.
- Calendário de disponibilidade mostra um único `Culto regular` por data e cada culto especial como uma opção separada, com nome, igreja e horário.
- Ao desmarcar uma igreja, os cultos especiais exclusivos dela desaparecem; o culto regular da data permanece quando existir em outra igreja selecionada.
- Calendários exibem lista legível no celular e grade mensal em telas maiores, evitando texto minúsculo ou cortado.
- Página `/agenda` contém largura no celular para evitar corte lateral e rolagem horizontal.
- Página `/escalas/pregacao` permite ao ancião ou admin escalar, trocar e remover pregadores disponíveis por culto e igreja.
- Página `/escalas/louvor` permite ao líder de música ou admin escalar, trocar e remover cantores disponíveis por culto e igreja.
- Para o administrador, as telas de pregação e louvor agrupam os cultos por igreja e permitem filtrar pelo pregador, cantor ou grupo; anciãos e líderes de música mantêm a visão mensal por dia.
- Escala de louvor exibe pregador e louvor no mesmo culto e, para admin, gera PDF separado por igreja.
- Botões de salvar e excluir nas escalas são pequenos e ficam lado a lado; salvar usa verde e a exclusão usa um botão vermelho compacto com ícone `X`.
- O botão `X` pede confirmação, não exige selecionar outro voluntário e, quando confirmado, deixa o pregador ou louvor como `A definir`.
- Botões de salvar, excluir, aprovar e recusar exibem um indicador de carregamento com o nome da ação até o servidor concluir.
- Pregadores e cantores já escalados em um dia não aparecem como disponíveis para outro culto no mesmo dia.
- O servidor bloqueia conflito de agenda ao salvar escala, mesmo que alguém tente enviar a ação manualmente.
- Página `/agenda` permite aos usuários aprovados consultar suas escalas, notificações e solicitar permuta com pessoa da mesma função.
- Calendário de `/agenda` permite tocar ou clicar em uma escala para atualizar as seções fixas de `Pregação` e `Louvor`.
- Seções `Pregação` e `Louvor` ficam uma abaixo da outra na página `/agenda`.
- Permutas aparecem no início da página `/agenda`.
- A seção `Permutas` em `/agenda` inicia recolhida.
- Usuário permutado também vê a solicitação de permuta em `Minha agenda`, com nomes e datas envolvidas.
- Ao escolher uma pessoa para permuta, o formulário mostra a igreja, a data e o horário da escala selecionada com tipografia responsiva e cor do tema.
- Notificações aparecem abaixo de `Louvor` e iniciam recolhidas.
- Administrador pode limpar permutas e notificações exibidas em `/agenda`, com confirmação.
- Páginas `/agenda`, `/escalas/pregacao` e `/escalas/louvor` têm botão para gerar e baixar PDF em formato de calendário, com versículo sobre serviço cristão.
- Ao tocar em `Baixar PDF`, o sistema tenta abrir o arquivo em um visualizador/leitor de PDF do navegador ou do dispositivo, mantendo download como fallback.
- Páginas `/agenda`, `/escalas/pregacao` e `/escalas/louvor` têm botão para compartilhar o PDF pelo recurso nativo do celular, WhatsApp instalado ou WhatsApp Web quando o navegador permitir.
- Página `/admin/cultos` gera PDF administrativo separado por igreja, com uma página de calendário mensal para cada igreja.
- Admin pode filtrar `/escalas/pregacao` e `/admin/cultos` por todas as igrejas ou por uma igreja específica; o PDF e o compartilhamento seguem o mesmo filtro.
- PDF das escalas prioriza igreja e pregador dentro de cada dia, com linhas do calendário em cinza claro para não cobrir o texto.
- PDF das escalas usa o logo da IASD, cores do tema do site e mostra a data com o dia da semana no cabeçalho de cada quadrado.
- Pedidos de permuta ficam pendentes para aprovação do ancião, líder de música ou admin e geram notificações no sistema.
- Notificações internas também disparam Web Push para dispositivos autorizados.
- Usuários aprovados recebem um aviso fechável para ativar notificações push.
- O sistema mostra um aviso de instalação do PWA quando o navegador permitir instalar o app.
- O manifest possui ícones PNG 192x192 e 512x512 para melhorar a instalação no Android.
- No iPhone/iPad, o aviso mostra as etapas de instalação pelo Safari e o site fornece um `apple-touch-icon` dedicado.
- No iOS, o aviso de notificações orienta instalar e abrir o app pela Tela de Início; somente então oferece a ativação do Web Push, conforme a exigência da plataforma.
- Se notificações estiverem bloqueadas, o aviso permanece orientando a liberar o site nas configurações do navegador.
- Ativação de notificações tenta recriar a inscrição e o service worker quando o Android retorna erro de serviço push.
- Ativação de notificações remove a assinatura antiga do navegador/servidor somente quando ela usa outra chave VAPID.
- Ativação reutiliza a assinatura existente quando ela usa a chave VAPID atual, evitando reinscrições desnecessárias em versões novas do Chrome Android.
- A chave VAPID é validada e enviada ao `PushManager` como `Uint8Array`; o service worker é atualizado sem cache antes de uma nova tentativa.
- Ao concluir a ativação, o aparelho recebe uma notificação nativa de confirmação com som e vibração solicitados ao Android.
- Manifest inclui `gcm_sender_id` de compatibilidade para Chrome Android aceitar inscrição Web Push em dispositivos mais sensíveis.
- Notificações Web Push usam ícone PNG, `badge`, URL de destino e TTL de 24 horas para entrega posterior quando o dispositivo voltar a ficar online.
- Service worker recebe eventos `push`, exibe notificação nativa e abre `/agenda` ou `/painel` ao tocar no aviso.
- Inscrições push são salvas em `push_subscriptions` com RLS, vinculadas ao usuário aprovado.
- Assinaturas expiradas retornando HTTP 404 ou 410 são desativadas automaticamente no envio.
- Painel exibe `Permutas pendentes` para admin, ancião e líder de música quando houver permutas aguardando decisão.
- Painel exibe `Solicitações de aprovação` para admin, ancião e líder de música conforme a igreja e a função que cada perfil pode aprovar.
- Painel organiza `Permutas pendentes` e `Solicitações de aprovação` lado a lado em telas maiores, mantendo coluna no celular.
- Botões de permutas pendentes e solicitações de aprovação no painel mostram carregamento e removem o item concluído sem recarregar a página inteira.
- Admin aprova solicitações de pregadores e cantores de qualquer igreja.
- Ancião aprova solicitações de pregadores e cantores das igrejas gerenciadas por ele.
- Líder de Música aprova somente solicitações de cantores das igrejas gerenciadas por ele.
- Painel permite que ancião cadastre pregador ou cantor nas igrejas gerenciadas, e que líder de música cadastre cantor na própria igreja.
- Ancião vê em `Escala de pregação` as permutas pendentes que envolvem qualquer igreja gerenciada por ele.
- Cadastro público permite selecionar mais de uma função para a mesma conta.
- Admin pode criar e editar usuários com múltiplas funções.
- Perfil do usuário permite adicionar ou remover funções de escala (`Pregador` e `Cantor`).
- Funções gerenciais, como `Ancião` e `Líder de Música`, ficam vinculadas à igreja principal selecionada no cadastro ou pelo administrador.
- Igrejas onde o usuário aceita ser escalado como pregador ou cantor continuam sendo definidas em `/disponibilidade`.
- Testes de permissões em `tests/auth/access-rules.test.mjs`.
- Testes de regras de múltiplas funções em `tests/auth/role-rules.test.mjs`.
- Testes de geração de cultos em `tests/cultos/schedule.test.mjs`.
- Testes de regras de disponibilidade em `tests/disponibilidade/rules.test.mjs`.
- Testes de regras de conflito de escala em `tests/escalas/rules.test.mjs`.
- Testes de estrutura de notificações push em `tests/push/notification-push.test.mjs`.

Pendente:

- Cadastrar pelo menos uma igreja real em `/admin/igrejas` antes de liberar novos cadastros públicos.
- Confirmar login real do administrador criado no Supabase Auth.
- Implementar funcionalidades completas de escala em etapas futuras autorizadas.

## Tecnologias

- Next.js
- TypeScript
- Tailwind CSS
- Supabase com PostgreSQL
- GitHub
- Vercel
- PWA

## Configuração Local

Crie um arquivo `.env.local` com base em `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

Use somente a chave pública `anon`/`publishable` no front-end. A `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no servidor e na Vercel como variável secreta.
A `NEXT_PUBLIC_VAPID_PUBLIC_KEY` pode ir para o navegador. `VAPID_PRIVATE_KEY` deve ficar somente no servidor e na Vercel como variável secreta. `VAPID_SUBJECT` deve usar um contato do responsável, por exemplo `mailto:email@dominio.com`.

Instale as dependências:

```bash
npm install
```

Execute em desenvolvimento:

```bash
npm run dev
```

Verifique a conexão local:

```text
http://localhost:3000/status/supabase
```

Essa página não exibe valores de chaves. Ela mostra apenas se as variáveis estão configuradas e se a chamada inicial ao Supabase respondeu.
A verificação usa a chave pública apenas nos headers `apikey` e `Authorization`; nenhum valor sensível é renderizado na interface.

## Estrutura do Projeto

```text
src/
  app/
    admin/usuarios/
    admin/igrejas/
    admin/cultos/
    disponibilidade/
    aguardando-aprovacao/
    alterar-senha/
    auth/callback/
    cadastro/
    login/
    painel/
    perfil/
    recuperar-senha/
    status/supabase/
    globals.css
    layout.tsx
    page.tsx
  components/
    admin/
    auth/
  config/
  lib/
    auth/
    push/
    supabase/
  types/
  proxy.ts
public/
  icons/
  manifest.json
  sw.js
supabase/
  config.toml
  migrations/
  manual/
  tests/
  seed.sql
tests/
  auth/
  push/
```

## Notificações Push

O sistema usa Web Push padrão com VAPID, sem Firebase/FCM no código da aplicação.

Fluxo implementado:

- Usuário aprovado entra no sistema.
- O componente de notificações verifica suporte a `Service Worker`, `PushManager` e `Notification API`.
- Ao tocar em `Ativar`, o navegador solicita permissão.
- Com permissão concedida, o navegador cria uma `PushSubscription`.
- A inscrição é enviada para `/api/push/subscribe` e salva em `push_subscriptions`.
- Quando o servidor cria uma notificação interna, também envia Web Push aos dispositivos ativos do destinatário.
- Se a assinatura do navegador expirar, o servidor desativa a inscrição ao receber HTTP 404 ou 410.

Compatibilidade esperada:

- Android Chrome/Edge: funciona como PWA ou site com permissão concedida.
- Android Chrome/Edge: a instalação aparece pelo botão do sistema quando o navegador dispara `beforeinstallprompt`; se o botão nativo não estiver disponível, o aviso orienta instalar pelo menu do navegador.
- Windows Chrome/Edge: funciona com navegador compatível e permissão concedida.
- iPhone/iPad: requer iOS/iPadOS com suporte a Web Push e o app adicionado à Tela de Início pelo Safari.

Instalação no iPhone/iPad:

1. Abra o sistema no Safari e toque em `Compartilhar`.
2. Escolha `Adicionar à Tela de Início`.
3. Mantenha `Abrir como App` ativado, toque em `Adicionar` e depois abra o sistema pelo novo ícone.
4. Já dentro do app instalado, toque em `Ativar` no aviso de notificações. Web Push requer iOS/iPadOS 16.4 ou superior.

Som no Android:

- O service worker solicita notificação não silenciosa e vibração.
- O Android ainda aplica o volume, o modo `Não perturbe` e o som configurado no canal de notificações do Chrome ou do PWA instalado.
- Se o aviso aparecer sem som, abra as informações do aplicativo no Android, entre em `Notificações` e habilite som no canal usado pelo site.

Para gerar chaves VAPID localmente:

```bash
npx web-push generate-vapid-keys
```

Configure os valores em `.env.local` e nas variáveis de ambiente da Vercel. Nunca publique `VAPID_PRIVATE_KEY`.

## Scripts

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Autenticação

A autenticação usa Supabase Auth e as tabelas públicas do sistema.

Fluxo inicial:

- Usuário solicita cadastro em `/cadastro`.
- O cadastro cria uma conta no Supabase Auth e um perfil em `public.users` com status `pending`.
- Usuário pendente é enviado para `/aguardando-aprovacao`.
- Administrador acessa `/admin/usuarios` para aprovar, bloquear ou inativar usuários.
- Administrador também pode criar usuários em `/admin/usuarios`, definindo uma ou mais funções, igreja, status e senha inicial.
- Administrador pode adicionar ou desmarcar funções na edição do usuário em `/admin/usuarios/[id]/editar`.
- Administrador cadastra igrejas em `/admin/igrejas` antes de liberar cadastros públicos vinculados.
- Administrador gera cultos mensais em `/admin/cultos` para todas as igrejas ativas.
- Administrador cria cultos especiais em `/admin/cultos`, vinculando o culto a uma igreja específica.
- Pregadores e cantores informam disponibilidade em `/disponibilidade`.
- O tipo de usuário é escolhido no cadastro público e validado pelo vínculo salvo no banco.
- Usuários `blocked` ou `inactive` não acessam o sistema.
- Rotas protegidas redirecionam usuário sem permissão para `/login`.

Não existe usuário admin real criado automaticamente em produção. O seed contém apenas `admin@iasd.local` para teste local e não cria conta real no Supabase Auth.

Para promover um admin real depois de criar o cadastro:

```bash
psql "$DATABASE_URL" -v admin_email='email@dominio.com' -f supabase/manual/promote-admin.sql
```

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, tokens ou senhas no front-end ou no chat.

## Banco de Dados

Migrations:

```text
supabase/migrations/20260907162000_initial_schema.sql
supabase/migrations/20260907173000_auth_access_policies.sql
supabase/migrations/20260908013500_allow_manual_admin_recovery.sql
supabase/migrations/20260908021500_seed_default_roles.sql
supabase/migrations/20260908033000_create_worship_services.sql
supabase/migrations/20260908043000_add_special_worship_services.sql
supabase/migrations/20260908043100_adjust_special_worship_uniqueness.sql
supabase/migrations/20260908120000_create_user_availability.sql
supabase/migrations/20260908143000_create_swap_requests.sql
supabase/migrations/20260909110000_add_user_approval_audit.sql
supabase/migrations/20260909143000_create_push_subscriptions.sql
supabase/migrations/20260910123000_distinguish_special_service_availability.sql
supabase/migrations/20260910150000_clear_all_worship_services.sql
```

Tabelas iniciais:

- `users`
- `roles`
- `churches`
- `user_roles`
- `user_church_links`
- `history`
- `settings`
- `notifications`
- `push_subscriptions`
- `worship_services`
- `user_availability`

O seed de teste fica em:

```text
supabase/seed.sql
```

Os scripts manuais de administração e recuperação ficam em:

```text
supabase/manual/
```

### Validar Migrations

Com Docker e Supabase CLI disponíveis:

```bash
supabase db reset
```

Para validar em PostgreSQL puro via `psql`:

```bash
docker run --rm -e POSTGRES_PASSWORD=postgres -v "$PWD/supabase:/supabase" postgres:16 \
  psql -v ON_ERROR_STOP=1 -U postgres -f /supabase/tests/validate_initial_schema.sql
```

Nesta máquina, o Docker estava instalado, mas o daemon não estava em execução. Por isso as migrations também foram validadas com PostgreSQL em WebAssembly, removendo apenas as linhas de extensões `pgcrypto` e `citext` por limitação do validador local.

Resultado validado:

- 10 tabelas com RLS e `force row level security`.
- 15 políticas.
- 1 trigger de proteção de campos sensíveis.
- 4 usuários fictícios do seed.

### Aplicar no Supabase Remoto

Depois de confirmar `SUPABASE_SERVICE_ROLE_KEY` e a conexão com o projeto Supabase:

```bash
supabase link --project-ref vqahnrifpkmhbvkgvtet
supabase db push
```

Não aplique `supabase/seed.sql` em produção sem revisar os dados fictícios.

## Deploy

O deploy de cada etapa deve ser feito na Vercel e confirmado como `Ready`.

Domínio futuro planejado:

```text
https://www.escalaiasd.com.br
```

### Como Publicar

Antes de publicar, confira o estado do Git:

```bash
git status
```

Execute as verificações disponíveis:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Faça commit pequeno e descritivo:

```bash
git add .
git commit -m "tipo: descricao curta"
```

Envie para o GitHub:

```bash
git push
```

Publique manualmente na Vercel quando necessário:

```bash
npx vercel --prod --yes
```

Confirme o status do deploy:

```bash
npx vercel inspect https://escala-iasd-candido-sales-two.vercel.app
```

### Deploy Automático

A branch principal do projeto é `main`.

O deploy automático da branch `main` deve ser habilitado conectando o projeto Vercel ao repositório GitHub `iasdescalacs/escala-iasd-candido-sales`.

Status atual:

- Branch `main` enviada para o GitHub.
- Projeto Vercel vinculado localmente.
- Conexão GitHub -> Vercel pendente porque a conta Vercel precisa adicionar uma Login Connection com GitHub.

Depois de conectar GitHub na Vercel, cada push na branch `main` deve gerar um deploy automático.

## Regras de Trabalho

- Trabalhar sempre por etapas e implementar somente a etapa solicitada.
- Não avançar para a próxima etapa sem autorização.
- Antes de alterar arquivos, examinar o projeto existente, incluindo `README.md`, `AGENTS.md` e `package.json`.
- Preservar funcionalidades existentes e seguir os padrões já usados no código.
- Usar TypeScript com tipagem clara e interface em português do Brasil.
- Manter o sistema responsivo para celular, tablet e computador.
- Não expor dados sensíveis no front-end e nunca usar `service_role` key no navegador.
- Usar variáveis de ambiente para chaves e URLs.
- Atualizar este README sempre que criar ou alterar funcionalidades.
- Executar testes antes de concluir e corrigir erros encontrados.
- Fazer commits pequenos e descritivos ao final de cada etapa.
- Publicar no Vercel ao final de cada etapa e confirmar status `Ready`.

## Regras de Git, GitHub e Vercel

- Configurar o Git com o e-mail real vinculado ao GitHub.
- Verificar `git status` antes de commitar.
- Não usar `git reset --hard`.
- Não apagar alterações do usuário sem autorização.
- Depois do commit, enviar para o GitHub.
- Depois do push, publicar ou confirmar deploy na Vercel.
- Se o deploy falhar, verificar logs antes de tentar novamente.
- Se a Vercel bloquear o deploy por e-mail, corrigir `user.email` e refazer o commit.
- Sempre confirmar aliases de produção:
  - domínio principal;
  - domínio `www`;
  - domínio `vercel.app`.

## Regras de Autenticação e Acesso

- Usuário novo deve ficar aguardando aprovação.
- Usuário bloqueado não pode acessar o sistema.
- Usuário inativo não pode acessar o sistema.
- Uma pessoa pode ter várias funções na mesma conta, como Ancião, Líder de Música, Cantor e Pregador.
- Administrador pode gerenciar todo o sistema.
- Ancião gerencia pregadores das igrejas vinculadas e pregadores que marcaram disponibilidade para serem escalados naquela igreja.
- Líder de música gerencia cantores e grupos das igrejas vinculadas e cantores que marcaram disponibilidade para serem escalados naquela igreja.
- Pregador acessa sua disponibilidade e agenda, podendo marcar outras igrejas onde aceita ser escalado.
- Cantor acessa sua disponibilidade e agenda, podendo marcar outras igrejas onde aceita ser escalado.
- O sistema não deve permitir acesso indevido por alteração direta de URL.
- Menus protegidos só devem aparecer para usuário logado e aprovado.
- Usuário não logado vê apenas início, login e cadastro.
- Logout deve estar sempre visível para usuário logado.
- Deve existir uma ação administrativa para limpar o banco de dados e manter somente o usuário Admin.

## Regras de Interface

- Toda a interface deve usar português do Brasil.
- O layout deve ser responsivo desde a primeira etapa para celular, tablet e computador.
- O menu deve funcionar bem em celular, tablet e computador.
- O menu não pode causar barra de rolagem horizontal.
- Inputs devem ocupar espaço de forma eficiente, usando colunas quando houver espaço disponível.
- Evitar formulários muito longos em uma única coluna quando houver espaço para organização lateral.
- Usar tema claro e escuro.
- A referência visual de cores deve seguir o site da ACMS (`https://www.acmsnet.org/`), com azul principal `#2E6DE7`, branco e neutros claros como base.
- Garantir contraste adequado em textos, botões, menus e estados.
- Botões importantes devem ter estados de carregamento.
- Ações destrutivas devem pedir confirmação antes da execução.
- Campos de senha devem ter botão para mostrar ou ocultar a senha.
- Campos de telefone devem usar máscara.
- Nomes devem ser formatados com inicial maiúscula por palavra.
- Textos em calendários não podem ultrapassar o quadrado do dia.
- Cards devem ser organizados por importância.
- O painel deve mostrar informações úteis ao perfil logado.

## Regras de PWA

- Criar manifest completo.
- Criar service worker.
- Não cachear dados pessoais sensíveis.
- Permitir instalação no Android.
- Explicar instalação no iPhone via Safari.
- O botão de instalar deve poder ser fechado.
- A pergunta de instalação pode aparecer novamente ao abrir o site.
- Notificação de ativar push deve ter botão fechar.
- Avisar quando o usuário estiver offline.
- Permitir consulta offline apenas de dados já carregados e seguros.
- Sincronizar quando a internet voltar.
- Atualizar service worker com segurança.
