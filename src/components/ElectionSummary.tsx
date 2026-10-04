interface ElectionSummaryProps {
  validVotes: number | null;
  whites: number | null;
  nulls: number | null;
  turnout: number | null;
}

export function ElectionSummary({
  validVotes,
  whites,
  nulls,
  turnout,
}: ElectionSummaryProps) {
  // Format number or return "indisponível" when null
  const formatValue = (val: number | null) => {
    if (val === null || val === undefined) return 'indisponível';
    return val.toLocaleString('pt-BR');
  };

  const calculatePercent = (val: number | null, base: number | null) => {
    if (val === null || base === null || base === 0) return null;
    return ((val / base) * 100).toFixed(2).replace('.', ',');
  };

  // Base for percentages: turnout if present, otherwise sum of valid + white + null if all available
  const baseForPercentages = turnout;

  const items = [
    {
      id: 'validos',
      label: 'Votos Válidos',
      value: validVotes,
      description: 'Destinados a candidatos',
      percent: calculatePercent(validVotes, baseForPercentages),
    },
    {
      id: 'brancos',
      label: 'Votos Brancos',
      value: whites,
      description: 'Opção do eleitor em branco',
      percent: calculatePercent(whites, baseForPercentages),
    },
    {
      id: 'nulos',
      label: 'Votos Nulos',
      value: nulls,
      description: 'Votos invalidados',
      percent: calculatePercent(nulls, baseForPercentages),
    },
    {
      id: 'apurados',
      label: 'Total Apurado (Comparecimento)',
      value: turnout,
      description: 'Eleitores que votaram nas seções apuradas',
      percent: null,
    },
  ];

  return (
    <section aria-labelledby="summary-heading" className="space-y-3">
      <h2 id="summary-heading" className="sr-only">
        Resumo Geral da Apuração
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(item => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                {item.label}
              </p>
              <p
                className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
                data-testid={`summary-${item.id}`}
              >
                {formatValue(item.value)}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <span>{item.description}</span>
              {item.percent && (
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {item.percent}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
