import type { PollingStationResult } from '../core/normalize';

interface SectionResultProps {
  sectionData: PollingStationResult;
  obtidoEm?: string | null;
  fonte?: string;
}

export function SectionResult({
  sectionData,
  obtidoEm,
  fonte = 'Tribunal Superior Eleitoral — TSE',
}: SectionResultProps) {
  const firstRaw = sectionData.raw?.[0];

  const formatValue = (v: number | string | null | undefined) => {
    if (v === null || v === undefined || v === '') return 'indisponível';
    if (typeof v === 'number') return v.toLocaleString('pt-BR');
    return v;
  };

  // Turnout, Aptos, Abstencoes
  const aptos = firstRaw?.QT_APTOS ? Number(firstRaw.QT_APTOS) : null;
  const comparecimento = sectionData.turnout;
  const abstencoes = firstRaw?.QT_ABSTENCOES ? Number(firstRaw.QT_ABSTENCOES) : null;

  // Valid votes sum
  let validVotesSum: number | null = 0;
  for (const c of sectionData.candidates) {
    if (c.votes === null) {
      validVotesSum = null;
      break;
    }
    validVotesSum += c.votes;
  }

  const isUrnAnulada =
    sectionData.urnType.toUpperCase().includes('ANULADA') ||
    firstRaw?.DS_TIPO_URNA?.toUpperCase().includes('ANULADA');

  const isValidated = sectionData.validation === 'validado';

  return (
    <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header com identificação da seção */}
      <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Boletim de Urna Oficial
            </span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              UF: {sectionData.uf} — Zona {sectionData.zone} — Seção {sectionData.section}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status da validação */}
            {!isValidated ? (
              <span
                role="status"
                className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200"
              >
                Aguardando validação da fonte
              </span>
            ) : (
              <span className="inline-flex items-center rounded border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                Validado
              </span>
            )}

            {/* Tipo de urna (ex: ANULADA) */}
            <span
              className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold ${
                isUrnAnulada
                  ? 'border border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200'
                  : 'border border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Urna: {sectionData.urnType || 'indisponível'}
            </span>
          </div>
        </div>
      </div>

      {/* Detalhes de localização e funcionamento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-semibold text-zinc-500 uppercase dark:text-zinc-400">Localidade / Município</p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {firstRaw?.NM_MUNICIPIO
              ? `${firstRaw.NM_MUNICIPIO} (cód. ${sectionData.locality})`
              : `Município cód. ${sectionData.locality}`}
          </p>
          <p className="mt-0.5 text-zinc-500">
            País: {sectionData.uf === 'ZZ' ? 'país indisponível' : 'Brasil'}
          </p>
        </div>

        <div className="rounded border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-semibold text-zinc-500 uppercase dark:text-zinc-400">Local de Votação</p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {firstRaw?.NR_LOCAL_VOTACAO
              ? `Local nº ${firstRaw.NR_LOCAL_VOTACAO}`
              : 'indisponível'}
          </p>
          <p className="mt-0.5 text-zinc-500">
            Seções agregadas: {sectionData.aggregatedRaw || 'nenhuma'}
          </p>
        </div>

        <div className="rounded border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <p className="font-semibold text-zinc-500 uppercase dark:text-zinc-400">Horários de Funcionamento</p>
          <p className="mt-1 text-xs text-zinc-800 dark:text-zinc-200">
            Abertura: {formatValue(firstRaw?.DT_ABERTURA)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-800 dark:text-zinc-200">
            Encerramento: {formatValue(firstRaw?.DT_ENCERRAMENTO)}
          </p>
        </div>
      </div>

      {/* Estatísticas de eleitores da seção */}
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 uppercase dark:text-zinc-200">
          Estatísticas da Seção
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Eleitores Aptos</p>
            <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{formatValue(aptos)}</p>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Comparecimento</p>
            <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{formatValue(comparecimento)}</p>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Abstenções</p>
            <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{formatValue(abstencoes)}</p>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Votos Válidos</p>
            <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{formatValue(validVotesSum)}</p>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Votos Brancos</p>
            <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{formatValue(sectionData.whites)}</p>
          </div>
          <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Votos Nulos</p>
            <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100">{formatValue(sectionData.nulls)}</p>
          </div>
        </div>
      </div>

      {/* Votos por candidato na seção */}
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 uppercase dark:text-zinc-200">
          Votos Registrados na Urna por Candidato
        </h3>
        <div className="mt-2 overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Tabela de votos por candidato nesta seção eleitoral</caption>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              <tr>
                <th scope="col" className="px-4 py-3">Número</th>
                <th scope="col" className="px-4 py-3">Candidato</th>
                <th scope="col" className="px-4 py-3">Partido</th>
                <th scope="col" className="px-4 py-3 text-right">Votos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sectionData.candidates.map(c => (
                <tr key={c.number} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{c.number}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{c.name || 'nome indisponível'}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.party || 'partido indisponível'}</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                    {formatValue(c.votes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inconsistências registradas em log oficial */}
      {sectionData.issues && sectionData.issues.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-xs dark:border-amber-800 dark:bg-amber-950/50">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Observações de validação registradas pela auditoria:
          </p>
          <ul className="mt-1 list-inside list-disc text-amber-800 dark:text-amber-300">
            {sectionData.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rodapé da seção */}
      <div className="flex flex-wrap items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>Fonte: {fonte}</span>
        <span>Última obtenção: {obtidoEm ? `${obtidoEm} (horário de Brasília)` : 'indisponível'}</span>
      </div>
    </div>
  );
}
