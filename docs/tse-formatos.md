# Dados oficiais do TSE — descoberta e amostras históricas

**Atualização da etapa 2:** parsers e contratos testados descritos em `arquitetura-base.md`. No JSON completo, algumas eleições não possuem `sqele`; algumas abrangências contêm `mu`, lista de objetos com strings `cd/cdi`. Essas variantes foram conferidas na cópia existente para construir o schema, sem interpretar campos além do confirmado. O teste municipal 2026 retornou HTTP 200 (ver `lacunas.md`); não valida equivalência histórica nem o schema EA12. O texto abaixo é o registro da descoberta original.

Pesquisa de 04/10/2026. **Etapa parcial:** seis arquivos de 2022 foram obtidos. Novas consultas foram interrompidas após HTTP 404 na configuração municipal histórica, conforme o AGENTS.md. Não há código de aplicação nesta entrega.

Segundo a orientação do responsável pelo projeto, os resultados de 2026 ainda não foram publicados. Não foram buscados votos de 2026. A configuração comum atual foi obtida, mas configuração não é resultado eleitoral. Dados históricos não representam resultados atuais.

## 1. Fontes oficiais

| Fonte | URL completa | Evidência |
| --- | --- | --- |
| Documentação 2026 | https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados | Pesquisa web da etapa anterior |
| Documentação 2022 | https://www.tse.jus.br/eleicoes/eleicoes-2022/arquivos/interessados | Página consultada via pesquisa web |
| Manual de download 2022, v1.0 de 10/05/2022 | https://www.tse.jus.br/eleicoes/eleicoes-2022/arquivos/interessados/instrucoes-para-download-dos-arquivos-da-divulgacao-1653925608839 | PDF lido via pesquisa web |
| EA16, seções de 2022 | https://www.tse.jus.br/eleicoes/eleicoes-2022/arquivos/interessados/ea16-arquivo-de-configuracao-de-secoes-eleitorais-1653934957474 | PDF lido via pesquisa web |
| Resultados 2022 | https://dadosabertos.tse.jus.br/pt_PT/dataset/resultados-2022 | GET direto funcionou; links extraídos |
| Boletins de Urna 2022 | https://dadosabertos.tse.jus.br/hr/dataset/resultados-2022-boletim-de-urna | GET direto funcionou; links extraídos |

Os segmentos de idioma são os efetivamente consultados. Resultados de busca de terceiros não fundamentam este documento. Distinguem-se fatos **observados em arquivos**, **documentados no catálogo/manual**, e **não confirmados**.

## 2. Configuração e identificadores

GET https://resultados.tse.jus.br/oficial/comum/config/ele-c.json retornou HTTP 200, JSON, 22749 bytes. Cópia integral em [configuração atual](amostras/configuracao-atual/README.md).

A cópia contém `dg=02/10/2026`, `hg=18:30:57`, `f=o`, `idg=980407`, listas `arq` e `pl`. Só foram encontrados ciclos `ele2024` e `ele2026`; **não é uma configuração histórica de 2022**.

Campos observados: `arq[].tp` e `dir` indicam tipo/padrão de diretório; `pl[].cd`, `c` e `dt` identificam pleito, ciclo e data; `pl[].e[].cd`, `t` e `nm` identificam eleição, turno e descrição; `abr[].cp[].cd` e `ds` identificam cargo e descrição. A semântica completa dos atributos adicionais depende do EA11, cuja extração web não retornou texto utilizável.

| Ano | Turno | Data | Pleito | Eleição federal | Cargo Presidente | Fonte |
| --- | --- | --- | --- | --- | --- | --- |
| 2022 | 1 | 02/10/2022 | 406 | 544 | 1 | BUs reais AC e ZZ |
| 2022 | 2 | 30/10/2022 | 407 | 545 | 1 | BUs reais AC e ZZ |
| 2026 | 1 | 04/10/2026 | 3220 | 6257 | 1 | Configuração atual |

A entrada federal de 2026 contém `cdt2=6258`, mas não há uma entrada completa de pleito do segundo turno nessa cópia. O código desse pleito e sua configuração própria continuam não confirmados. Nenhum desses valores deve ser mantido como constante permanente de produção.

## 3. Divulgação JSON de 2022

O manual documenta ciclo `ele2022`, diretórios `config`, `dados` e `dados-simplificados`; abrangências `br`, UF e `zz`; cargo `c0001` para Presidente e seis dígitos após `e`. Recomenda consumo por índice em intervalos não inferiores a 60 segundos: recomendação de 2022, não frequência garantida de geração.

| Tipo | Nome/padrão documentado | Situação |
| --- | --- | --- |
| EA11, eleições | `ele-c.json` | Só cópia atual obtida |
| EA12, municípios | `mun-e<ELEICA>-cm.json` | Tentativa histórica: 404 |
| EA09, índice | `<br\|uf>-e<ELEICA>-i.json` | Documentado, sem amostra |
| EA14/EA15, acompanhamento | `br-e<ELEICA>-ab.json` / `<uf>-e<ELEICA>-ab.json` | Documentado, sem amostra |
| EA04, resultado simplificado | `<br\|uf\|zz>-c<CCCC>-e<ELEICA>-r.json`; município/localidade: `<uf\|zz><MUNIC>-c<CCCC>-e<ELEICA>-r.json` | Documentado, sem amostra |
| EA01/EA02, fixos/variáveis | Sufixos `-<VER>-f.json` e `-v.json` | Documentado, sem amostra |
| EA16, seções | `<UF>-p<número do pleito>-cs.json` | Documento lido; diretório histórico não validado |
| EA17, BU | Página referencia especificação de BU JSON | Nome/caminho e estrutura não confirmados |

Esses contratos se referem a arquivos JSON em servidor HTTP. GET foi validado somente para a configuração comum atual; os demais não foram baixados. A primeira tentativa histórica foi:

https://resultados.tse.jus.br/oficial/ele2022/544/config/mun-e000544-cm.json

O caminho foi composto a partir do manual, host oficial e identificador confirmado, mas retornou **HTTP 404**. Não houve tentativas de caminhos alternativos por adivinhação. URLs completas e respostas de resultados Brasil/UF/município/exterior, acompanhamento e BU individuais continuam pendentes.

EA16 documenta `dg/hg` (geração), `f` (fase), `cdp` (pleito), `abr[].cd` (UF, incluindo ZZ), `mu[].cd/nm` (município ou localidade), `zon[].cd` (zona) e `sec` (lista de seções). Município tem cinco dígitos; zona/seção, quatro. Os CSVs reais de BU usam números sem esse preenchimento. Preservar o valor original; formatação depende do contrato.

## 4. Portal de Dados Abertos de 2022

### Downloads concluídos

| Tipo | Turno/abrangência | URL completa |
| --- | --- | --- |
| Histórico presidencial | 1 / Brasil | https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/Historico_Totalizacao_Presidente_BR_1T_2022.zip |
| Histórico presidencial | 2 / Brasil | https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/Historico_Totalizacao_Presidente_BR_2T_2022.zip |
| BU | 1 / Acre | https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_1t_AC_051020221321.zip |
| BU | 2 / Acre | https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_2t_AC_311020221535.zip |
| BU | 1 / Exterior | https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_1t_ZZ_051020221321.zip |
| BU | 2 / Exterior | https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_2t_ZZ_311020221535.zip |

Links extraídos dos catálogos, GET com HTTP 200, ZIP contendo CSV e PDF. O portal informa carga única após cada turno para BU e histórico. Não são um canal de atualização ao vivo. Os BUs seguem `bweb_<TURNO>_<SIGLA_UF>_<DATA_HORA_GERACAO>.zip`. A data do nome não substitui os campos internos: no BU ZZ do primeiro turno, `HH_GERACAO=16:34:13`, enquanto o nome termina em `1321`.

Todos tiveram ETag e Last-Modified; HTTP 304 não foi testado. O catálogo também oferece hashes, por exemplo https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_2t_ZZ_311020221535.zip.sha512 — descoberto, mas ainda não baixado. SHA-256 calculado localmente não substitui comparação com hash oficial.

Os tamanhos completos, horários, cabeçalhos HTTP, recortes e critérios estão no [README de 2022](amostras/2022/README.md). Os ZIPs foram conferidos e substituídos por recortes de linhas originais, preservando os PDFs.

### Links descobertos, sem download

| Conteúdo | URL completa | Periodicidade lida no catálogo |
| --- | --- | --- |
| Presidente, votação por seção | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_secao/votacao_secao_2022_BR.zip | Ao final de cada turno |
| Votação nominal por município/zona | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2022.zip | Não confirmado integralmente |
| Votação em partido por município/zona | https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_partido_munzona/votacao_partido_munzona_2022.zip | Não confirmado integralmente |
| Detalhe por município/zona | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_munzona/detalhe_votacao_munzona_2022.zip | Frequente, sem intervalo confirmado |
| Detalhe por seção | https://cdn.tse.jus.br/estatistica/sead/odsele/detalhe_votacao_secao/detalhe_votacao_secao_2022.zip | Não confirmado integralmente |

O catálogo informa que o recurso de votação por seção `BR` contém Presidente em todas as UFs e ZZ; os arquivos desse recurso separados por UF contêm outros cargos. Isso não se aplica aos ZIPs de **BU** AC analisados, que contêm Presidente.

Campos, tamanhos e conteúdo desses cinco recursos não foram validados. Tampouco foi obtido BU binário `.bu` ou assinatura. O CSV do Portal não deve ser apresentado como o binário original da urna.

## 5. Campos reais e cuidados de leitura

### Boletim de Urna em CSV

Fonte: quatro arquivos reais e `leiame-boletimurnaweb.pdf` extraído dos ZIPs.

| Campos | Significado |
| --- | --- |
| `DT_GERACAO, HH_GERACAO` | Extração; hora com base em Brasília, conforme leiaute |
| `ANO_ELEICAO, CD_TIPO_ELEICAO` | Ano de referência e tipo; ano não identifica sozinho a eleição |
| `CD_PLEITO, DT_PLEITO, NR_TURNO, CD_ELEICAO` | Pleito, data, turno e eleição |
| `SG_UF, CD_MUNICIPIO, NM_MUNICIPIO` | UF, código TSE e nome; localidade no exterior |
| `NR_ZONA, NR_SECAO, NR_LOCAL_VOTACAO` | Zona, seção e local de votação |
| `CD_CARGO_PERGUNTA, DS_CARGO_PERGUNTA` | Cargo/pergunta e descrição |
| `NR_PARTIDO, SG_PARTIDO, NM_PARTIDO, NR_VOTAVEL, NM_VOTAVEL` | Identificadores e nomes publicados |
| `CD_TIPO_VOTAVEL, DS_TIPO_VOTAVEL, QT_VOTOS` | Categoria e votos da linha |
| `QT_APTOS, QT_COMPARECIMENTO, QT_ABSTENCOES` | Eleitorado e comparecimento da seção; repetidos por votável |
| `CD_TIPO_URNA, DS_TIPO_URNA` | Observados `1/APURADA` e `4/ANULADA` |
| `DS_AGREGADAS` | Seções agregadas; observados `11`, `1051`, `561 / 713` |
| `DT_BU_RECEBIDO, DT_EMISSAO_BU` | Recebimento e emissão, distintos da extração |

O leiaute define Latin-1, aspas e separação por ponto e vírgula. Nas amostras, ausência aparece como `#NULO#`, `-1` ou campos vazios, conforme a coluna; o manual também descreve informação não registrada como `#NE`/`-3`. Nunca converter sentinelas em contagens zero.

Brancos e nulos aparecem em **linhas**, com `NR_VOTAVEL=95` e `96`; a quantidade é `QT_VOTOS`. Não há colunas `QT_BRANCOS/QT_NULOS` nesse cabeçalho. “Nominal” é categoria do BU; a destinação jurídica e o total válido de divulgação exigem validação própria. Não generalizar que toda linha nominal seja voto válido.

### Histórico de totalização

| Campo | Significado no leiaute incluído no ZIP |
| --- | --- |
| `DT_TOTALIZACAO` | Instante de totalização |
| `QT_SECOES_TOTAL` | Total de seções da abrangência |
| `QT_SECOES_TOT` | Seções totalizadas naquele instante |
| `QT_SECOES_TOT_ACUMULADO` | Total acumulado |
| `PE_SECOES_TOT_ACUMULADO` | Razão acumulado/total, seis casas decimais |
| `QT_APTOS_TOTAL, QT_APTOS_TOT_ACUMULADO` | Aptos totais e das seções totalizadas |
| `QT_VOTOS_TOTAL_ACUMULADO` | Votos acumulados, incluindo concorrentes, brancos e nulos |
| `QT_VOTOS_CONCORRENTES_ACUMULADO` | Votos excluindo brancos/nulos, segundo esse leiaute |
| `BRANCO_QT_VOTOS_TOT_ACUMULADO, NULO_QT_VOTOS_TOT_ACUMULADO` | Brancos/nulos acumulados |

Os históricos têm colunas de candidatos descobertas do cabeçalho, diferentes por turno; não fixar nomes na aplicação. Vírgula decimal e espaços estão presentes. `1,000000` representa razão integral, não 1%. Não extrapolar essa escala para JSONs.

Últimas linhas dos arquivos coletados:

| Turno | Instante | Seções acumuladas/total | Concorrentes | Brancos | Nulos | Votos totais |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 1 | 04/10/2022 10:27:34 | 472075 / 472075 | 118229719 | 1964779 | 3487874 | 123682372 |
| 2 | 31/10/2022 00:18:04 | 472075 / 472075 | 118552353 | 1769678 | 3930765 | 124252796 |

Valores históricos dessas cópias, sem confronto concluído com agregados JSON/reprocessamentos posteriores. Não há coluna explícita de comparecimento nos históricos; esse dado foi confirmado nos BUs. Não renomear automaticamente votos totais como comparecimento.

## 6. Seções reais e exterior

“Nominais” abaixo é soma local das linhas dessa categoria; demais valores foram lidos das linhas do BU.

| Turno | UF | Município/localidade (código bruto) | Zona | Seção | Agregadas | Aptos | Comparecimento | Nominais | Brancos | Nulos |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | AC | RIO BRANCO (1392) | 1 | 3 | `#NULO#` | 185 | 155 | 152 | 2 | 1 |
| 2 | AC | RIO BRANCO (1392) | 1 | 3 | `#NULO#` | 185 | 147 | 144 | 2 | 1 |
| 1 | AC | RIO BRANCO (1392) | 1 | 9 | 11 | 283 | 222 | 216 | 2 | 4 |
| 2 | AC | RIO BRANCO (1392) | 1 | 9 | 11 | 283 | 207 | 201 | 3 | 3 |
| 1 | ZZ | ARTIGAS (29319) | 1 | 7 | 1051 | 686 | 425 | 412 | 9 | 4 |
| 2 | ZZ | ARTIGAS (29319) | 1 | 7 | 1051 | 686 | 428 | 417 | 6 | 5 |

**País de Artigas: não confirmado nesta coleta.** O CSV de BU tem 45 campos e nenhum campo de país. Não inferir o país pelo nome. Foi confirmado `ZZ → localidade → zona → seção`, mas falta tabela oficial país–localidade. “Município” do CSV não significa país.

O CSV não reparte votos entre principal e agregadas. Não dividir votos nem contar novamente o mesmo BU para cada agregada. Comparecimento se repete nas linhas de candidatos/brancos/nulos: somá-lo por linha multiplicaria o total incorretamente.

Foram preservadas todas as linhas de urna `ANULADA` do exterior: quatro no primeiro turno e uma no segundo. Nos dois turnos existe `ZZ / CIUDAD GUAYANA / 29564 / zona 1 / seção 91`, com comparecimento e votos nulos iguais a zero, `NR_URNA_EFETIVADA=-1` e emissão/abertura/encerramento vazios. Os zeros são publicados, não preenchimentos da pesquisa.

**“ANULADA” não significa “aguardando resultado”.** Seção sem resultado permanece não confirmada. Ausência em recorte ou falha HTTP não demonstra ausência de resultado na fonte; falta confrontar cadastro completo e situações oficiais.

## 7. Diferenças entre 2022 e 2026

| Item | 2022 | 2026 / limite de confirmação |
| --- | --- | --- |
| Ciclo | `ele2022`, manual | `ele2026`, configuração |
| Eleição federal | `544/545`, BUs | `6257`, turno 1; `6258` em `cdt2`, sem configuração completa do turno 2 |
| Pleito | `406/407`, BUs | `3220`, turno 1; segundo não confirmado |
| Cargo | `1`, BU; `c0001`, manual | `1/Presidente`, configuração |
| Configuração comum | Cópia histórica não obtida | Configuração atual não contém `ele2022` |
| Resultado | EA01/EA02/EA04; sufixos `f/v/r`, documentação | Página referencia EA20; configuração tem tipo `u`; resultado real não obtido |
| Diretórios | Manual: `dados` e `dados-simplificados` | Configuração: tipo `u` em `<base>/<ambiente>/<ciclo>/<cd_eleicao>/dados/<uf>` |
| Acompanhamento | EA14/EA15, sufixo `ab`, documentação | Mesmas referências e tipo `ab`; equivalência de campos não confirmada |
| Detecção por índice | EA09 documentado | FAQ de 2026 diz não prever índice de atualizações |
| Seções | EA16 documenta lista `zon[].sec` | FAQ menciona `da/ha` para geração de auxiliares; resposta real não obtida |
| BU | EA17 JSON referenciado; CSV do Portal efetivamente lido | EA18 auxiliar referenciado; configuração tem tipo `aux`; equivalência não confirmada |
| Campos de resultados | JSON histórico não obtido | Nenhuma comparação campo a campo validada |
| URLs | Configuração municipal tentou caminho histórico e recebeu 404; CDN estatística funcionou | Configuração comum funcionou; não trocar apenas ano/código na URL |

As informações do FAQ vêm da [página oficial de 2026](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados). Ela informa geração conforme totalização, suporte a ETag/Last-Modified e limite de 100 requisições/segundo/IP. A resposta da configuração tem outro valor de rate limit no cabeçalho; não tratá-lo como autorização para superar a orientação publicada. Cache-Control não define frequência de geração.

**Diferença dentro de 2022:** o histórico do segundo turno adiciona `CD_PLEITO, CD_ELEICAO, CD_CARGO, SG_UE_UF`, ausentes no primeiro, além de mudar as colunas de candidatos. Os quatro BUs têm o mesmo cabeçalho de 45 campos, evidência restrita aos arquivos coletados.

## 8. Eleição de 2018

Levantamento não realizado devido à interrupção após o 404 de 2022. Disponibilidade, URLs, códigos e estabilidade entre 2018/2022 são **não confirmados**.

## 9. Domínios para avaliação da allowlist

| Host exato | Finalidade e evidência |
| --- | --- |
| `www.tse.jus.br` | Documentação via pesquisa web; acesso direto bloqueado na etapa anterior |
| `dadosabertos.tse.jus.br` | Catálogos; GET direto funcionou nesta retomada |
| `cdn.tse.jus.br` | Seis ZIPs baixados por links dos catálogos |
| `resultados.tse.jus.br` | Configuração atual acessível; caminho histórico tentado retornou 404 |

Proposta: hosts exatos e caminhos aprovados no backend, com validação de redirecionamentos. Sem curingas ou URLs determinadas pelo cliente. Allowlist não garante disponibilidade de todos os caminhos.

## 10. Verificação

CRC dos seis ZIPs, correspondência das linhas dos recortes com originais, hashes locais e votos/comparecimento nas seções selecionadas foram conferidos. Dados não foram corrigidos para fechar somas. Comparação BU versus agregados equivalentes permanece pendente.

O repositório não tem aplicação, dependências ou comandos de lint/typecheck/testes; não foram instalados. Verificação documental e das amostras não substitui futuros testes de contrato, parsing e idempotência. Ver [modo de ensaio](modo-ensaio.md) e [lacunas](lacunas.md).
