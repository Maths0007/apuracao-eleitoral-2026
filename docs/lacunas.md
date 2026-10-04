# Lacunas e impedimentos — etapa 1

## Atualização da etapa 2 — teste municipal de 2026

Em 04/10/2026 às 14:05:24 (Brasília), a única requisição HTTP de teste retornou **200**, com 534.025 bytes, em https://resultados.tse.jus.br/oficial/ele2026/6257/config/mun-e006257-cm.json. Registro em `amostras/configuracao-atual/municipios-teste.json`. A tentativa inicial no sandbox foi bloqueada por permissão de soquete antes de obter resposta; a execução autorizada fez a consulta. Não foram testadas alternativas para 2022.

O campo encontrado é **`arq`**, não `ar`: `arq[tp=cm].dir = <base>/<ambiente>/<ciclo>/<cd_eleicao>/config`. Base e ambiente vêm da origem da configuração; ciclo/eleição, da entrada federal de 2026. O nome `mun-e<ELEICA>-cm.json` e seis dígitos vêm do manual registrado em `tse-formatos.md`, §3. Esse teste confirma disponibilidade, mas o corpo não foi persistido ou analisado; o schema municipal continua não confirmado. O 404 histórico não foi resolvido nem reinterpretado.

O AGENTS.md atual já contém “Dados históricos”; os itens antigos abaixo sobre sua ausência são registros da etapa anterior, superados. A base e os testes estão descritos em `arquitetura-base.md`.

## Contratos nao confirmados

Referência estável usada por `NaoConfirmado` em `src/services/tse.ts`:

| Identificador | Item pendente |
| --- | --- |
| `municipios` | EA12: schema não analisado; 2022 sem amostra, 2026 somente teste HTTP |
| `configuracao-2022` | EA11 histórico, §3 item 1 |
| `zonas-secoes` | EA16 e cadastro completo, §2 |
| `pais-exterior` | Relação oficial país–localidade, §3 item 9 |
| `acompanhamento-ea14-ea15` | Respostas JSON não obtidas, §2 |
| `resultados-ea04` | Resultados JSON não obtidos, §2 |
| `bu-ea17` | BU JSON não obtido, §2 |
| `bu-binario-assinatura` | Binário e assinatura não obtidos, §2 |
| `votacao-secao` | Recurso específico não baixado, §2 |
| `agregados-reconciliacao` | Agregados/revisões equivalentes não obtidos, §3 item 10 |
| `secoes-sem-resultado` | Situação oficial não comprovada, §3 item 11 |
| `cronologia-secao` | Chegada/revisão por seção não comprovada, §3 item 12 |
| `eleicao-2018` | Nenhum contrato confirmado, §2 |
| `perfil-eleitoral` | Perfil não aprovado, inclusive 2026 turno 2, §3 item 4 |

---

Registro histórico da etapa 1 (situação antes desta implementação):

Atualização: 04/10/2026. **Etapa parcial, aguardando revisão.** A coleta histórica avançou, mas não há cobertura completa de todos os tipos solicitados.

## 1. Impedimento atual, com escopo preciso

GET https://resultados.tse.jus.br/oficial/ele2022/544/config/mun-e000544-cm.json retornou **HTTP 404 (Not Found)**, inclusive com execução autorizada fora do sandbox. O caminho foi derivado do padrão do manual oficial de 2022, do host de divulgação e do código 544 confirmado nos BUs.

Novas consultas externas foram interrompidas após essa resposta, conforme a regra do AGENTS.md. A análise e documentação dos arquivos já baixados continuaram. Não se testaram URLs alternativas nem os demais caminhos previstos no lote.

**Não há evidência de bloqueio geral de internet ou de todo o domínio:**

- O Portal de Dados Abertos respondeu por acesso direto após a permissão ampliada.
- Seis ZIPs de `cdn.tse.jus.br` foram baixados integralmente.
- A configuração comum atual em `resultados.tse.jus.br/oficial/comum/config/ele-c.json` retornou HTTP 200.
- O 404 é específico ao caminho histórico testado. Não se determinou se decorre de retirada, mudança de organização ou outra causa.

O primeiro acesso direto ao catálogo ainda falhou no sandbox por permissão de soquete; a repetição autorizada funcionou. O bloqueio inicial não deve ser confundido com indisponibilidade do TSE.

## 2. Cobertura da solicitação histórica

| Entrega/tipo | Confirmado | Lacuna |
| --- | --- | --- |
| 2022, primeiro/segundo turno | Pleitos 406/407, eleições federais 544/545, cargo 1, em BUs reais | Configuração histórica EA11 não obtida |
| Configuração de municípios | Nome/padrão em manual | GET histórico retornou 404; não há amostra |
| Totalização Brasil | CSVs históricos dos dois turnos, com seções e votos | EA14/EA15 JSON e acompanhamento por UF não baixados |
| Resultados Brasil | Totais nas últimas linhas dos históricos coletados | Sem confronto com agregado de divulgação/revisões posteriores |
| Resultados por UF/município | Linhas de seção do Acre/Rio Branco e links de arquivos agregados no catálogo | Agregados UF/município não baixados; não calcular total com recortes |
| Exterior | ZZ, localidades, zona, seção, agregadas e votos reais | Relação país–localidade não obtida; país de Artigas não confirmado por fonte coletada |
| Zonas/seções | Campos em BU real e leiaute EA16 | Cadastro completo de seções e resposta real EA16 não obtidos |
| BU | Quatro CSVs reais, AC/ZZ, ambos os turnos, com leiaute | JSON EA17, binário .bu e assinatura não obtidos |
| Votação por seção | URL oficial BR descoberta | ZIP, leiaute e campos desse recurso não baixados |
| Seções agregadas | DS_AGREGADAS real em AC/ZZ nos dois turnos | Cadastro completo da relação e reconciliação global pendentes |
| Seções sem resultado | Não confirmado | Urna ANULADA não foi interpretada como ausência de resultado |
| Comparação 2022/2026 | Códigos, famílias documentadas e limites registrados | Falta comparação de respostas reais de resultados |
| 2018 | Não investigado antes da interrupção | Disponibilidade, contratos e estabilidade não confirmados |
| Modo de ensaio | Proposta em modo-ensaio.md | Sem implementação; revisar após obter os contratos faltantes |

## 3. Ambiguidades e verificações técnicas pendentes

1. A configuração comum obtida em 2026 não contém `ele2022`. Falta um endereço oficial vigente ou cópia histórica verificável de EA11, EA12 e EA16.
2. O link EA11 de 2022, https://www.tse.jus.br/eleicoes/eleicoes-2022/arquivos/interessados/ea11-arquivo-de-configuracao-de-eleicoes, retornou na ferramenta web uma extração sem linhas de texto. Não se conclui que o documento esteja vazio; seu conteúdo completo não foi validado.
3. O manual de download de 2022 contém exemplos de pleito relativos a 2020. Não foram tratados como códigos de 2022; foram usados os códigos efetivos dos BUs.
4. Em 2026, `cdt2=6258` está presente na configuração do primeiro turno, mas falta entrada própria de pleito/eleição do segundo turno e validação completa do EA11.
5. A configuração atual retornou cabeçalho de rate limit diferente da orientação de 100 requisições/segundo/IP da página técnica. Não foi adotado limite maior.
6. Os ZIPs de BU têm nomes com horário diferente de `HH_GERACAO` em seu conteúdo. A semântica exata do horário no nome, além da notação do leiaute, não foi reconciliada.
7. ETag e Last-Modified foram observados, mas requisição condicional/304 e comparação dos SHA-512 oficiais não foram testadas.
8. Os quatro BUs mantêm 45 campos, mas isso não comprova estabilidade em outras UFs, anos ou formatos. Os históricos nacionais já diferem entre os dois turnos de 2022.
9. País não aparece no cabeçalho do BU; é necessário recurso oficial que relacione localidade TSE e país. Não usar conhecimento geográfico para preencher essa lacuna.
10. Falta reconciliar BU, votação por seção, agregado municipal/UF e nacional com revisões compatíveis. Não presumir equivalência entre votos nominais, votos válidos e destinação jurídica em todos os formatos.
11. Não há prova de uma seção sem resultado na amostra. É preciso cadastro completo e situação oficial; ausência de linha, votos zero ou erro HTTP não são suficientes.
12. Histórico nacional não informa por si só a sequência de chegada de cada seção. Não simular cronologia individual.
13. Na leitura desta retomada, o AGENTS.md termina em “Forma de trabalho” e não contém a seção “Dados históricos” mencionada pelo usuário. Suas regras específicas ainda precisam ser fornecidas ou salvas; as instruções históricas desta conversa foram seguidas.

## 4. Registro do bloqueio anterior

Na primeira etapa, o acesso direto à página https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados falhou por permissão de soquete e, fora do sandbox, recebeu `Access Denied`, referência `18.f0cedb17.1791131706.d51143e5`. O código HTTP daquela tentativa não foi capturado. A página pôde ser consultada pela pesquisa web. Não foi feita nova tentativa direta nessa URL nesta retomada.

## 5. Perguntas objetivas para a revisão

- Qual é o texto da seção “Dados históricos” que ainda não aparece no AGENTS.md salvo?
- Você dispõe de um link oficial vigente ou de uma cópia oficial de configuração/divulgação de 2022 para retomar após o 404?
- Você dispõe de uma referência oficial para relacionar códigos de localidade exterior a países?

Não foi enviado contato ao TSE. Nenhuma dependência ou código de aplicação foi criado. A próxima etapa não foi iniciada.
