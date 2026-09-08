# ESCALA IASD CANDIDO SALES

Sistema web para organização de escalas da IASD Candido Sales.

## Etapa Atual

### Etapa 6: Cultos

Entregue até esta etapa:

- Projeto Next.js com App Router.
- TypeScript em modo estrito.
- Tailwind CSS configurado.
- Pastas organizadas em `src/app`, `src/components`, `src/lib` e `src/config`.
- Layout principal com menu responsivo.
- Tema claro e escuro com base visual no azul `#2E6DE7`.
- Página inicial.
- PWA inicial com `manifest.json`, ícone e service worker.
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
- Página de disponibilidade em `/disponibilidade` para usuários aprovados.
- Pregadores e cantores podem marcar dias disponíveis no calendário de cultos do mês.
- Usuários com as duas funções veem seções separadas para Pregador e Cantor.
- Pregadores e cantores podem escolher as igrejas onde aceitam ser escalados.
- Calendário de disponibilidade mostra apenas um culto representativo por dia para não repetir a quantidade de igrejas.
- Página `/escalas/pregacao` permite ao ancião ou admin escalar, trocar e remover pregadores disponíveis por culto e igreja.
- Página `/escalas/louvor` permite ao líder de música ou admin escalar, trocar e remover cantores disponíveis por culto e igreja.
- Botões de salvar e excluir nas escalas são compactos, com ícones, usando verde para salvar e vermelho para excluir.
- Pregadores e cantores já escalados em um dia não aparecem como disponíveis para outro culto no mesmo dia.
- O servidor bloqueia conflito de agenda ao salvar escala, mesmo que alguém tente enviar a ação manualmente.
- Página `/agenda` permite aos usuários aprovados consultar suas escalas, notificações e solicitar permuta com pessoa da mesma função.
- Pedidos de permuta ficam pendentes para aprovação do ancião, líder de música ou admin e geram notificações no sistema.
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
```

Use somente a chave pública `anon`/`publishable` no front-end. A `SUPABASE_SERVICE_ROLE_KEY` deve existir apenas no servidor e na Vercel como variável secreta.

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
```

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
