'use client';

import { useState, useMemo } from 'react';
import { CandidateCard } from './CandidateCard';

export interface CandidateItem {
  number: string;
  name: string | null;
  ballotName?: string | null;
  party: string | null;
  votes?: number | null;
}

interface CandidateListProps {
  candidates: CandidateItem[];
  validVotesTotal: number | null;
  isLoading?: boolean;
}

type SortOption = 'alfabetica' | 'votos' | 'numero';

export function CandidateList({
  candidates,
  validVotesTotal,
  isLoading = false,
}: CandidateListProps) {
  const [sortOrder, setSortOrder] = useState<SortOption>('alfabetica');

  const sortedCandidates = useMemo(() => {
    const list = [...candidates];
    if (sortOrder === 'alfabetica') {
      return list.sort((a, b) =>
        (a.ballotName || a.name || a.number).localeCompare(
          b.ballotName || b.name || b.number,
          'pt-BR'
        )
      );
    }
    if (sortOrder === 'votos') {
      return list.sort((a, b) => {
        const vA = a.votes ?? -1;
        const vB = b.votes ?? -1;
        if (vB !== vA) return vB - vA;
        return (a.ballotName || a.name || a.number).localeCompare(
          b.ballotName || b.name || b.number,
          'pt-BR'
        );
      });
    }
    if (sortOrder === 'numero') {
      return list.sort((a, b) => Number(a.number) - Number(b.number));
    }
    return list;
  }, [candidates, sortOrder]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando candidatos"
        className="space-y-4"
      >
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 p-5 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          Nenhum candidato encontrado nos registros oficiais recebidos até o momento.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="candidates-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="candidates-heading"
            className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Candidatos a Presidente
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total de {candidates.length} concorrentes registrados
          </p>
        </div>

        {/* Controles de ordenação neutros */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="sort-order"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Ordenar por:
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOption)}
            className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            aria-label="Critério de ordenação de candidatos"
          >
            <option value="alfabetica">Ordem alfabética (padrão)</option>
            <option value="votos">Total de votos apurados</option>
            <option value="numero">Número na urna</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedCandidates.map(candidate => (
          <CandidateCard
            key={candidate.number}
            number={candidate.number}
            name={candidate.name}
            ballotName={candidate.ballotName}
            party={candidate.party}
            votes={candidate.votes ?? null}
            validVotesTotal={validVotesTotal}
          />
        ))}
      </div>
    </section>
  );
}
