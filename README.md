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
