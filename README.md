# ESCALA IASD CANDIDO SALES

Sistema web para organização de escalas da IASD Candido Sales.

## Etapa Atual

### Etapa 2: Conexão Supabase

Entregue até agora:

- Projeto Next.js com App Router.
- TypeScript em modo estrito.
- Tailwind CSS configurado.
- Preparação inicial de PWA com manifest, ícone e service worker.
- Cliente Supabase preparado para usar PostgreSQL via variáveis de ambiente.
- Interface inicial em português do Brasil.
- Cliente Supabase para navegador usando `@supabase/ssr`.
- Cliente Supabase para servidor usando cookies do App Router.
- Tipagem inicial do banco em `src/types/database.ts`.
- Página segura de status em `/status/supabase`.

Conexão real:

- `NEXT_PUBLIC_SUPABASE_URL` configurada localmente e na Vercel.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada localmente e na Vercel.
- Status de configuração confirmado pela rota `/status/supabase`.

Funcionalidades de escala, autenticação e regras de negócio ainda não foram implementadas.

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
```

Use somente a chave pública `anon`/`publishable` no front-end. Nunca use a `service_role key` no navegador.

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

## Scripts

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy

O deploy de cada etapa deve ser feito na Vercel e confirmado como `Ready`.

Domínio futuro planejado:

```text
https://www.escalaiasd.com.br
```

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
