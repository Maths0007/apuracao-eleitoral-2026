# Amostras oficiais

Retomada em 04/10/2026: foram obtidos seis ZIPs oficiais de 2022, preservados como recortes e dicionários, além da configuração comum atual. Não há arquivos fictícios nem arquivos de simulado nesta pasta.

- [2022 — amostras históricas dos dois turnos](2022/README.md): origem, horário, tamanho completo, recortes e verificações.
- [Configuração atual, coletada em 2026](configuracao-atual/README.md): arquivo integral, separado das amostras históricas.

## Registro da tentativa de acesso da etapa anterior

- Origem: https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados
- Método: GET, via PowerShell `Invoke-WebRequest`.
- No sandbox: erro de permissão de acesso a soquete.
- Fora do sandbox: resposta `Access Denied`, referência `18.f0cedb17.1791131706.d51143e5`.
- A página foi consultável pela ferramenta de pesquisa web, mas isso não equivale a baixar amostras eleitorais.
- Nenhuma amostra foi concluída naquela tentativa inicial. Os downloads posteriores estão registrados nos READMEs acima.

Uma amostra histórica não comprova o contrato de 2026. Nesta retomada, o Portal de Dados Abertos e a CDN funcionaram; uma tentativa de configuração municipal histórica em `resultados.tse.jus.br` retornou 404. Ver [lacunas](../lacunas.md).
