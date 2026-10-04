import Link from 'next/link';

export interface CandidateCardProps {
  number: string;
  name: string | null;
  ballotName?: string | null;
  party: string | null;
  votes: number | null;
  validVotesTotal: number | null;
  photoUrl?: string | null;
}

export function CandidateCard({
  number,
  name,
  ballotName,
  party,
  votes,
  validVotesTotal,
  photoUrl,
}: CandidateCardProps) {
  const displayName = ballotName || name || `Candidato ${number}`;
  const displayParty = party ? party : 'partido indisponível';

  const formatVotes = (v: number | null) => {
    if (v === null || v === undefined) return 'indisponível';
    return v.toLocaleString('pt-BR');
  };

  const calculatePercent = () => {
    if (votes === null || validVotesTotal === null || validVotesTotal === 0) {
      return 'indisponível';
    }
    const pct = (votes / validVotesTotal) * 100;
    return `${pct.toFixed(2).replace('.', ',')}%`;
  };

  return (
    <article
      data-testid={`candidate-card-${number}`}
      className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="flex items-start gap-4">
        {/* Avatar neutro ou foto oficial verificada */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Foto oficial de ${displayName}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <svg
              className="h-7 w-7 text-zinc-400 dark:text-zinc-500"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="inline-flex items-center rounded border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              Nº {number}
            </span>
            <span className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {displayParty}
            </span>
          </div>

          <h3 className="mt-1 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <Link
              href={`/candidatos/${number}`}
              className="focus-visible:outline-none focus-visible:underline"
              aria-label={`Ver detalhes de ${displayName}`}
            >
              {displayName}
            </Link>
          </h3>

          {name && ballotName && ballotName !== name && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              Nome de registro: {name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Votos apurados</p>
            <p
              className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
              data-testid={`candidate-votes-${number}`}
            >
              {formatVotes(votes)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">% dos votos válidos</p>
            <p
              className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
              data-testid={`candidate-percent-${number}`}
            >
              {calculatePercent()}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
