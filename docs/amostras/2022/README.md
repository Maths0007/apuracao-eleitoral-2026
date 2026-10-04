# Amostras oficiais de 2022

**Dados históricos reais do TSE — primeiro e segundo turnos de 2022. Não representam a eleição de 2026.**

Os seis ZIPs foram baixados integralmente. Para manter a pasta pequena, conservamos apenas recortes CSV com cabeçalho e linhas originais, sem reserialização, e os dicionários PDF extraídos. Os tamanhos abaixo correspondem ao ZIP completo e ao CSV completo dentro dele, não ao recorte.

Os CSVs de BU usam Latin-1, aspas e ponto e vírgula. Os históricos têm ponto e vírgula, espaços nos cabeçalhos/valores e vírgula decimal; seus bytes também foram preservados. O inventário é documentação produzida na pesquisa, não um arquivo publicado pelo TSE.

## Origem e downloads

| Recorte local | Turno | Download concluído (UTC−03:00, Brasília) | ZIP completo (bytes) | CSV completo (bytes) | Recorte (bytes) |
| --- | --- | --- | ---: | ---: | ---: |
| [bweb_1t_AC_051020221321.recorte.csv](bweb_1t_AC_051020221321.recorte.csv) | 1 | 2026-10-04T13:42:33.9061565-03:00 | 6125666 | 143132720 | 6814 |
| [bweb_1t_ZZ_051020221321.recorte.csv](bweb_1t_ZZ_051020221321.recorte.csv) | 1 | 2026-10-04T13:42:33.1182323-03:00 | 503717 | 4085687 | 5914 |
| [bweb_2t_AC_311020221535.recorte.csv](bweb_2t_AC_311020221535.recorte.csv) | 2 | 2026-10-04T13:42:34.0757382-03:00 | 538139 | 3695151 | 4421 |
| [bweb_2t_ZZ_311020221535.recorte.csv](bweb_2t_ZZ_311020221535.recorte.csv) | 2 | 2026-10-04T13:41:42.5213357-03:00 | 433558 | 1837151 | 2584 |
| [Historico_Totalizacao_Presidente_BR_1T_2022.recorte.csv](Historico_Totalizacao_Presidente_BR_1T_2022.recorte.csv) | 1 | 2026-10-04T13:42:34.3157782-03:00 | 1625754 | 13804548 | 8160 |
| [Historico_Totalizacao_Presidente_BR_2T_2022.recorte.csv](Historico_Totalizacao_Presidente_BR_2T_2022.recorte.csv) | 2 | 2026-10-04T13:42:34.6030411-03:00 | 825276 | 3700882 | 3482 |

### URLs completas para obter os arquivos inteiros

Em cada URL abaixo, efetuar GET e descompactar o ZIP. As URLs foram extraídas dos links dos catálogos oficiais. As respostas de download foram HTTP 200 com conteúdo ZIP, verificado por CRC.

- [bweb_1t_AC_051020221321.zip](https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_1t_AC_051020221321.zip)
- [bweb_1t_ZZ_051020221321.zip](https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_1t_ZZ_051020221321.zip)
- [bweb_2t_AC_311020221535.zip](https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_2t_AC_311020221535.zip)
- [bweb_2t_ZZ_311020221535.zip](https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/buweb/bweb_2t_ZZ_311020221535.zip)
- [Historico_Totalizacao_Presidente_BR_1T_2022.zip](https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/Historico_Totalizacao_Presidente_BR_1T_2022.zip)
- [Historico_Totalizacao_Presidente_BR_2T_2022.zip](https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2022/Historico_Totalizacao_Presidente_BR_2T_2022.zip)

## Critérios de recorte

- BUs: cargo `CD_CARGO_PERGUNTA = 1`; primeira seção, na ordem original do arquivo, que contém linhas explícitas de branco e nulo; primeira seção com `DS_AGREGADAS` preenchido, quando diferente da anterior. Todos os registros de Presidente dessas seções foram preservados.
- Arquivos `anuladas.recorte.csv`: todas as linhas de tipo de urna `ANULADA` nos dois ZIPs do exterior. São registros oficiais; não foram tratados como seções aguardando resultado.
- Históricos: cabeçalho e as duas primeiras e duas últimas linhas não vazias. Há um intervalo omitido entre as duas primeiras e as duas últimas; estes recortes não são uma série temporal completa.

## Dicionários, origem e integridade

- `leiame-boletimurnaweb.pdf`: membro homônimo dos ZIPs de BU; cópia extraída do ZIP do exterior do segundo turno. Tamanho original: 337455 bytes.
- `Historico_Totalizacao_Presidente_BR_1T_2022.leiame.pdf`: membro `leiame.pdf` do histórico do primeiro turno, 407908 bytes.
- `Historico_Totalizacao_Presidente_BR_2T_2022.leiame.pdf`: membro `leiame.pdf` do histórico do segundo turno, 396139 bytes.
- Os PDFs têm a mesma origem, ano, turno aplicável e horário de download dos respectivos ZIPs. Não foram editados.
- Os arquivos `*.proveniencia.json` registram URL, início/fim, tamanho e cabeçalhos HTTP da obtenção original. `ETag` e `Last-Modified` foram observados; resposta condicional 304 não foi testada.
- [inventario-recortes.json](inventario-recortes.json) registra os membros dos ZIPs, tamanhos, critérios, SHA-256 calculado localmente dos ZIPs e recortes e resumos das seções. Esses hashes não foram comparados aos arquivos SHA-512 publicados pelo TSE.
- [verificacao-amostras.json](verificacao-amostras.json) registra integridade CRC, comparação byte a byte das linhas com os originais e a checagem de votos/comparecimento nas seções selecionadas.

## Cobertura e limitações

Há seções do Acre/Rio Branco e do exterior/Artigas, com agregadas e votos nominais, brancos, nulos e comparecimento nos dois turnos. O CSV identifica o exterior por `ZZ` e localidade, mas não possui coluna de país. A associação oficial país–localidade permanece não confirmada.

Não foram baixados os CSVs específicos de votação por seção nem JSONs históricos de resultados/configuração. A primeira tentativa de configuração municipal de 2022 retornou HTTP 404, interrompendo novas consultas. Ver [lacunas](../../lacunas.md). A ausência de seção em um recorte não demonstra ausência de resultado no TSE.

A configuração comum obtida em 2026 está em [configuracao-atual](../configuracao-atual/README.md); ela não é amostra histórica de 2022.
