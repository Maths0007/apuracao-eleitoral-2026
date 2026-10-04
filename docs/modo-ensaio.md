# Proposta de modo de ensaio com dados históricos

**Atualização da etapa 2:** a base de perfis, parsers e ingestão foi implementada conforme `arquitetura-base.md`. O AGENTS.md atual inclui as regras de dados históricos. A seleção implementada é exclusivamente do servidor (`ELECTION_MODE/YEAR/ROUND`); a frase antiga sobre o cliente escolher perfis não se aplica à base atual. Identificação visual e cache seguem pendentes porque não há interface/API nesta etapa. O restante abaixo preserva a proposta original.

Proposta documental de 04/10/2026, sem implementação. Baseada nas amostras reais de 2022 e nas regras do projeto. A seção “Dados históricos” mencionada na solicitação não estava no AGENTS.md lido; a proposta deve ser confrontada com seu texto quando estiver disponível.

## Seleção explícita da eleição

Configurar no servidor um perfil de dados com modo, ano de referência, ciclo, pleito, eleição, turno, cargo, versão do contrato e origem aprovada. Esses são conceitos internos propostos, não nomes de campos ou endpoints do TSE.

| Perfil proposto | Fonte permitida | Comportamento |
| --- | --- | --- |
| Atual, 2026 | Arquivos oficiais de 2026 com contrato validado | Exibir indisponível enquanto não houver resultados; nunca preencher com histórico |
| Histórico, 2022, turno 1 | Fontes reais de 2022 identificadas e validadas | Usar eleição federal 544, pleito 406, cargo 1, conforme BUs coletados |
| Histórico, 2022, turno 2 | Fontes reais de 2022 identificadas e validadas | Usar eleição federal 545, pleito 407, cargo 1, conforme BUs coletados |

O perfil de 2026 pode aproveitar a configuração comum já coletada, mas só deve habilitar funcionalidades cujas respostas e contratos foram confirmados. Não adaptar URLs históricas por substituição de ano. Os códigos da tabela são evidência desta coleta; a implementação deve lê-los de configuração validada e versionada, não mantê-los espalhados como constantes.

A mudança de perfil deve ser explícita, refletida nas URLs compartilháveis e em todas as respostas do backend. O cliente escolhe apenas entre perfis aprovados, nunca fornece uma URL ao servidor. Não alternar automaticamente para 2022 quando 2026 falhar.

## Identificação visual e limites das amostras

Aviso proposto, persistente em todas as telas, tabelas, gráficos e exportações históricas:

**ENSAIO — DADOS HISTÓRICOS OFICIAIS DO TSE — ELEIÇÃO 2022 — 1º TURNO**

Atualizar o turno conforme a seleção. Dados históricos reais não são votos simulados. Caso futuramente existam mocks de desenvolvimento, manter isolamento adicional e o aviso obrigatório do AGENTS.md: `MODO DE DESENVOLVIMENTO — DADOS SIMULADOS`.

Exibir “Fonte: Tribunal Superior Eleitoral — TSE”, data da informação original quando conhecida e horário de obtenção em Brasília, como conceitos distintos. Não mostrar “ao vivo” para arquivos históricos. Os recortes deste repositório são amostras incompletas, não uma base integral para calcular Brasil/UF/município.

O histórico nacional preserva instantes reais de totalização e pode fundamentar reprodução desses instantes após validação do arquivo completo. Ele não comprova a ordem de chegada de cada seção. Não fabricar cronologia de seção, interpolar votos nem simular progresso com BUs finais.

## Separação das chaves e do armazenamento

Cada registro deve carregar uma identidade imutável do conjunto: origem/canal, ano de referência, ciclo quando confirmado, pleito, eleição, turno e versão do contrato. Ano sozinho é insuficiente: pleitos e turnos têm identificadores próprios, e o ano de referência pode abranger eleições suplementares.

Para fatos de votação por seção, a chave lógica proposta adiciona à identidade: UF/abrangência, código TSE da localidade, zona, seção principal, cargo e identificador/tipo de votável. Confirmar unicidade contra arquivos completos antes de criar restrições no banco. Preservar campos brutos e zeros à esquerda onde o contrato os tiver.

Para o estado do BU/seção, usar chave sem votável, mantendo a revisão/hash como atributo de versão. Reprocessar uma cópia igual deve ser operação sem efeito; uma revisão válida substitui atomicamente o conjunto completo de registros daquela unidade. Não somar o conteúdo reenviado ao estado anterior. Recortes nunca devem ser tratados como revisões completas que apagam linhas ausentes.

Separar área de preparação, dados validados e quarentena de erros. Uma publicação só se torna ativa após conferência de ano, turno, identificadores, schema e completude. A troca de perfil não renomeia nem migra registros de um ano para outro.

Manter canais separados para BU, agregado divulgado e histórico temporal. São representações relacionadas, não parcelas somáveis. Reconciliar apenas a mesma eleição, cargo, abrangência e revisão comparável. Divergências recebem “Aguardando validação da fonte”, sem correção dos valores oficiais.

No exterior, a identidade observada inclui `ZZ`, código da localidade, zona e seção. País fica indisponível até obter vínculo oficial; não derivá-lo do nome nem usá-lo como requisito para importar BUs válidos. A relação principal–agregadas é própria da eleição/turno. Um BU não pode ser replicado como novos votos para cada seção agregada.

## Cache e falhas

Chaves de cache devem incluir perfil, identidade eleitoral, versão do contrato, tipo de recurso, cargo, abrangência e filtros. Aplicar a separação também a caches de navegador, consultas, páginas e CDN. Ao trocar perfil, cancelar requisições anteriores e descartar respostas cujo perfil não corresponda ao selecionado.

Manter o último dado válido **do mesmo perfil e chave**. Jamais servir cache histórico para preencher falta de resultado de 2026, nem servir primeiro turno para o segundo.

Para o modo atual, preservar TTL de resultados gerais de 30 s e de candidatos/localidades/zonas de pelo menos 30 min, com stale-while-revalidate, conforme AGENTS.md. TTL interno não é autorização para consultar o TSE nessa mesma frequência: respeitar a cadência e os limites aplicáveis a cada fonte. O manual de divulgação 2022 recomenda consultas não inferiores a 60 s; arquivos históricos podem ser importados como cópias versionadas, sem polling contínuo.

Usar ETag/Last-Modified quando suportados. Mudança de hash/revisão invalida somente o conjunto pertinente. Em falha da fonte, preservar o dado válido e mostrar o aviso de indisponibilidade exigido pelo AGENTS.md; sem cópia anterior, mostrar indisponível.

## Ingestão e validações futuras

Fluxo: TSE → backend/job → armazenamento/cache → frontend. Importação pesada por worker/job, fora de requisição do usuário, sem depender de disco persistente na Vercel. Downloads brutos devem ter origem, tamanho, horário, hash, ano e turno auditáveis.

Validar schema por família/versão e turno quando necessário. O histórico nacional de 2022 já tem cabeçalhos diferentes entre turnos. Só definir os tipos após examinar os arquivos reais. Rejeitar formato inesperado e registrar a causa, preservando a última versão válida.

Verificações a implementar na etapa de código:

- Reprocessar o mesmo BU não altera totais; revisão substitui, não acumula.
- Trocar ano/turno não reutiliza linhas, cache, resposta tardia ou agregado do perfil anterior.
- Comparecimento repetido por votável é contado uma vez por seção; soma de votos não excede comparecimento quando a estrutura permite essa validação.
- Seções agregadas não duplicam votos; dados anulados preservam sua classificação oficial.
- Campo ausente/sentinela não vira zero; país desconhecido permanece indisponível.
- Cabeçalho ou formato alterado provoca falha de contrato; nenhuma adaptação silenciosa.
- Comparação com agregado só ocorre com cobertura e revisões compatíveis; recorte nunca é confundido com cobertura integral.

Nenhum teste de aplicação foi criado nesta etapa exclusivamente documental.
