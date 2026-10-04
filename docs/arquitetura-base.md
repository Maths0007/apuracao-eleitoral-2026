# Base de integração — etapa 2

Implementada em 04/10/2026. Escopo: infraestrutura de projeto, contratos observados e ingestão por seção. Sem interface, API pública, cache, banco real ou job de produção. O layout Next.js define somente idioma e folha Tailwind; nenhuma tela de votos foi criada.

## Fluxo e configuração

`src/services/tse.ts` é a fachada para configuração, parsers, normalização e ingestão. O caminho futuro é TSE → backend/job → Repository → frontend. `fetchOficial` rejeita execução no navegador, recebe apenas um identificador de recurso interno, valida HTTPS, porta, credenciais e hosts exatos, e verifica cada redirecionamento antes de segui-lo (máximo três). Timeout de 10 segundos cobre também leitura do corpo; limite padrão de 2 MB é conferido no cabeçalho e durante leitura. Nenhuma URL é aceita do cliente. Só a configuração comum está habilitada como recurso de rede nesta etapa.

Perfis em `src/config/profiles.json`, validados com Zod e selecionados por variáveis do servidor. Cada código tem origem documentada no arquivo. O perfil atual permite somente configuração; não existe fallback histórico. A identidade do perfil participa da chave de seção, incluindo modo, canal, ano, ciclo, pleito, eleição, turno e versão do contrato, seguida por UF, localidade, zona, seção e cargo. Votável e tipo identificam as linhas dentro do conjunto. País não participa da chave e permanece indisponível.

## Parsing e normalização

CSV é decodificado em Latin-1, com ponto e vírgula, aspas escapadas e linhas CRLF. BU exige os 45 nomes na ordem observada e a mesma quantidade de células. Valores brutos preservam sentinelas e zeros à esquerda; a representação interpretada usa `null` para ausência. Contagens rejeitam negativos não sentinela, frações e valores fora de inteiros seguros.

Históricos exigem os prefixos estruturais específicos de cada turno. Grupos de três colunas descobrem os candidatos dinamicamente; branco e nulo permanecem grupos separados. Razões com seis casas decimais e vírgula são lidas sem multiplicação por 100. O primeiro turno não contém identificação eleitoral: sua associação ao perfil depende da proveniência da entrada, que deve ser garantida pelo futuro job. Não há inferência a partir de votos ou nomes.

Configuração JSON tem schema estrito para as estruturas observadas, incluindo `sqele` opcional e `abr[].mu[]` opcional com `cd/cdi`. Isso não implementa o contrato municipal EA12 nem atribui semântica adicional a campos auxiliares.

Comparecimento é lido uma vez por seção. Divergência entre linhas não escolhe arbitrariamente um valor: a interpretação fica indisponível e os originais permanecem no registro. Brancos/nulos vêm das linhas 95/96; linha ausente nunca vira zero. Tipo de urna e agregadas permanecem como publicados. A soma usa candidatos nominais, sem equipará-los a votos juridicamente válidos.

## Revisões, completude e quarentena

`Repository.replaceCompleteSection` exige substituição atômica de toda a seção/cargo. A implementação em memória é apenas para testes. Hash SHA-256 do conjunto ordenado de linhas identifica repetição, independentemente da ordem de chegada; hash não é assinatura oficial nem comprova cronologia de revisão. O futuro job deve ordenar revisões com evidência oficial antes de submetê-las. Nenhuma ordenação temporal de revisão foi inferida nesta etapa.

O chamador interno deve fornecer as chaves de seção completas e a referência de evidência. Isso é uma declaração de proveniência, não um algoritmo capaz de provar completude usando somente CSV. Recortes sem comprovação são rejeitados. Os testes usam o README dos recortes, que registra preservação de todas as linhas de Presidente das seções selecionadas. Não somam recortes como total de UF/Brasil.

Inconsistências recebem `Aguardando validação da fonte`, são registradas pelo logger e guardadas em quarentena, preservando o último estado validado. Duplicatas de votável e incompatibilidade de identidade/cabeçalho provocam erro de contrato. Validação disponível: candidatos + brancos + nulos ≤ comparecimento. Reconciliação com agregados segue `NaoConfirmado`.

## Limites

Sem rotas públicas nesta etapa: rate limiting, cabeçalhos HTTP, UX de indisponibilidade e cache serão implementados quando essas superfícies existirem. As funções de integração não acessam as amostras do repositório em produção. Mutações artificiais existem somente nos testes, sem telas ou exports simulados. Pendências têm erro `NaoConfirmado` e referência estável em `docs/lacunas.md#contratos-nao-confirmados`.

## Verificação executada

Em 04/10/2026: ESLint sem erros, `tsc --noEmit` sem erros e Vitest com **35 testes passando em dois arquivos**. Comandos equivalentes aos scripts `lint`, `typecheck` e `test` do package.json foram executados diretamente com Node, pois este ambiente não possui npm/pnpm no PATH. Instalação concluída com pnpm 11.19.0 e lockfile congelado, usando o CLI do runtime disponível. O build Next.js não foi executado; nenhuma página de produto faz parte desta entrega.
