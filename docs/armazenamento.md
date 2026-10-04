# Armazenamento e Persistência

Implementado em 04/10/2026. Documentação da camada de persistência para desenvolvimento local e arquitetura de produção.

## 1. Implementação Local (Windows, sem Docker)

- **Mecanismo:** SQLite embutido através do módulo nativo `node:sqlite` (`DatabaseSync`) do Node.js 24, eliminando dependências nativas binárias ou servidores de banco de dados externos.
- **Arquivo local:** `./data/eleicoes.sqlite` (ou configurável via `DATABASE_PATH`). Permite também execução em `:memory:` para testes e ambientes temporários.

## 2. Modelagem e Chaves Lógicas

A estrutura de tabelas reflete as regras de isolamento estrito de `docs/modo-ensaio.md`:

- **Identidade da Eleição:** `mode`, `year`, `round`, `cycle`, `pleito`, `election`, `contract`, `channel` compõem a chave primária lógica de cada registro eleitoral. Dados históricos e atuais nunca colidem ou se misturam.
- **Tabela `sections`:** armazena o boletim de urna por seção (`key`, `uf`, `locality`, `zone`, `section`, `revision`, `turnout`, `whites`, `nulls`, `urn_type`, `validation`, `data_json`, `updated_at`).
- **Tabela `section_candidates`:** normaliza os votos por candidato na seção (`section_key`, `mode`, `year`, `round`, `election`, `candidate_number`, `name`, `party`, `votes`).
- **Atomicidade e Substituição por Revisão:** o método `replaceCompleteSection` executa dentro de transação SQLite (`BEGIN` ... `COMMIT`). Se a revisão já existir, a operação é nula (`unchanged`). Se for nova revisão válida, remove os votos anteriores da seção e insere o novo conjunto atômico, retornando `updated` (ou `received` se primeira vez).
- **Tabela `quarantined_sections`:** registros com inconsistência de validação (`Aguardando validação da fonte`) são isolados em tabela própria, sem impactar totais nem substituir dados válidos anteriores.
- **Tabela `imports`:** trilha de auditoria de importações (`origin`, `url`, `timestamp`, `size`, `hash`, `record_count`, `status`, `error_message`, `profile_*`).

## 3. Transição para Produção na Vercel (Postgres Gerenciado)

Na Vercel, o ambiente serverless possui sistema de arquivos efêmero e somente leitura, sem persistência em disco.

- **Preservação de Domínio e Contrato:** a interface `Repository` (`src/repositories/repository.ts`) isola completamente as regras de negócio e consultas da API.
- **Substituição Transparente:**
  1. Cria-se `src/repositories/postgres.ts` implementando a mesma interface `Repository` via driver HTTP/pool (ex.: `@vercel/postgres` ou `pg`/`neon`).
  2. A fábrica `getRepository()` seleciona a implementação com base em `process.env.DATABASE_TYPE === 'postgres'` e `process.env.POSTGRES_URL`.
  3. O schema SQL correspondente (DDL equivalente compatível com Postgres) é mantido em migração isolada.
  4. Nenhum componente de domínio, parser ou rota da API requer qualquer modificação.
