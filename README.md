# ESCALA IASD CANDIDO SALES

Sistema web para organização de escalas da IASD Candido Sales.

## Etapa Atual

### Etapa 1: Fundação do Projeto

Entregue nesta etapa:

- Projeto Next.js com App Router.
- TypeScript em modo estrito.
- Tailwind CSS configurado.
- Preparação inicial de PWA com manifest, ícone e service worker.
- Cliente Supabase preparado para usar PostgreSQL via variáveis de ambiente.
- Interface inicial em português do Brasil.

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

Instale as dependências:

```bash
npm install
```

Execute em desenvolvimento:

```bash
npm run dev
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
