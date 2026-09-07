<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Regras de Testes e Finalização

Ao finalizar cada etapa do projeto, siga este checklist e informe claramente o resultado:

1. Rodar lint.
2. Rodar build.
3. Rodar testes unitários.
4. Rodar testes de permissões.
5. Rodar testes de banco/migrations.
6. Testar telas principais no desktop.
7. Testar telas principais no celular.
8. Testar usuário não logado.
9. Testar administrador.
10. Testar ancião.
11. Testar líder de música.
12. Testar pregador.
13. Testar cantor.
14. Informar o que foi testado.
15. Informar o que não foi possível testar.

Quando ainda não existir implementação ou ferramenta para algum item, registrar explicitamente como não testável nesta etapa, sem marcar a etapa como totalmente coberta por testes.
