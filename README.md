# Apuração Eleitoral 2026 — base de contratos

Esta etapa contém a base Next.js/TypeScript/Tailwind e a integração testada com amostras oficiais. Não contém interface de resultados, API pública nem armazenamento de produção.

Requer Node.js 22 ou superior e pnpm 11. Execute `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck` e `pnpm test`. O lockfile fixa as dependências; o único script de instalação de dependência autorizado é o do esbuild. `pnpm dev` inicia a base Next.js, ainda sem página de produto.

Copie `.env.example` para `.env.local` e escolha explicitamente um perfil aprovado. A configuração padrão é 2026/turno 1, sem resultados habilitados. Os parsers históricos são exercitados nos testes sem alterar esse perfil. Consulte [arquitetura](docs/arquitetura-base.md), [contratos](docs/tse-formatos.md) e [lacunas](docs/lacunas.md).
