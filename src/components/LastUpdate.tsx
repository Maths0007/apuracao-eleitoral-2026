'use client';

interface LastUpdateProps {
  obtidoEm?: string | null;
  status?: 'atualizado' | 'desatualizado' | 'indisponivel';
  mensagem?: string | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function LastUpdate({
  obtidoEm,
  status = 'atualizado',
  mensagem,
  isRefreshing = false,
  onRefresh,
}: LastUpdateProps) {
  const isOutdated = status === 'desatualizado';
  const isUnavailable = status === 'indisponivel';

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              isOutdated
                ? 'bg-amber-500'
                : isUnavailable
                ? 'bg-rose-500'
                : 'bg-emerald-500'
            }`}
            aria-hidden="true"
          />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Última atualização (horário de Brasília):{' '}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100" data-testid="last-update-time">
              {obtidoEm ? obtidoEm : 'indisponível'}
            </strong>
          </span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            aria-label="Atualizar dados agora"
          >
            <span
              aria-hidden="true"
              className={`inline-block text-xs ${isRefreshing ? 'animate-spin' : ''}`}
            >
              🔄
            </span>
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar agora'}</span>
          </button>
        )}
      </div>

      {isOutdated && (
        <div
          role="alert"
          className="mt-1 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
        >
          {mensagem ||
            'Dados temporariamente indisponíveis para atualização. Exibindo a última informação recebida do TSE.'}
        </div>
      )}

      {isUnavailable && (
        <div
          role="alert"
          className="mt-1 rounded border border-rose-300 bg-rose-50 p-2 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
        >
          {mensagem || 'Dados temporariamente indisponíveis para consulta junto ao TSE.'}
        </div>
      )}
    </div>
  );
}
