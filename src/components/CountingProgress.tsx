interface CountingProgressProps {
  totalizedSections: number | null;
  totalSections: number | null;
  isFullyTotalized?: boolean;
}

export function CountingProgress({
  totalizedSections,
  totalSections,
  isFullyTotalized = false,
}: CountingProgressProps) {
  const hasValidCounts =
    totalizedSections !== null &&
    totalSections !== null &&
    totalSections > 0;

  const rawPercent = hasValidCounts
    ? (totalizedSections / totalSections) * 100
    : null;

  // AGENTS.md rule: "Só exibir '100% apurado' se o TSE indicar isso."
  // If calculated is 100% but TSE has not flagged fully totalized, clamp to 99.99% or show explicit warning.
  const percent =
    rawPercent !== null
      ? rawPercent >= 100 && !isFullyTotalized
        ? 99.99
        : rawPercent
      : null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 uppercase dark:text-zinc-100">
            Progresso da Totalização
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Seções apuradas em relação ao total previsto
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span
            className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
            data-testid="counting-percentage"
          >
            {percent !== null
              ? isFullyTotalized && percent >= 100
                ? '100%'
                : `${percent.toFixed(2).replace('.', ',')}%`
              : 'indisponível'}
          </span>
          <span className="ml-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {percent !== null && isFullyTotalized ? 'apurado (oficial)' : 'apurado'}
          </span>
        </div>
      </div>

      {/* Barra de progresso neutra acessível */}
      <div className="mt-4">
        <div
          role="progressbar"
          aria-valuenow={percent !== null ? Math.round(percent) : undefined}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da apuração de seções eleitorais"
          className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        >
          <div
            className="h-full rounded-full bg-zinc-700 transition-all duration-500 dark:bg-zinc-300"
            style={{ width: `${percent !== null ? Math.min(100, Math.max(0, percent)) : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>
          Seções totalizadas:{' '}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200" data-testid="totalized-sections">
            {totalizedSections !== null ? totalizedSections.toLocaleString('pt-BR') : 'indisponível'}
          </strong>
        </span>
        <span>
          Total de seções:{' '}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200" data-testid="total-sections">
            {totalSections !== null && totalSections > 0
              ? totalSections.toLocaleString('pt-BR')
              : 'indisponível'}
          </strong>
        </span>
      </div>
    </div>
  );
}
