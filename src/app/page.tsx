'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { ProfileBanner } from '../components/ProfileBanner';
import { Footer } from '../components/Footer';
import { LastUpdate } from '../components/LastUpdate';
import { CountingProgress } from '../components/CountingProgress';
import { ElectionSummary } from '../components/ElectionSummary';
import { CandidateList } from '../components/CandidateList';
import { SearchBar } from '../components/SearchBar';

interface ResumoApiResponse {
  fonte: string;
  obtidoEm?: string;
  aviso?: string | null;
  status: 'atualizado' | 'desatualizado' | 'indisponivel';
  mensagem?: string | null;
  motivo?: string | null;
  perfil?: {
    mode: 'atual' | 'historico';
    year: string;
    round: string;
  };
  dados?: {
    totalSections: number;
    turnout: number | null;
    whites: number | null;
    nulls: number | null;
    candidates: {
      number: string;
      name: string | null;
      party: string | null;
      votes: number | null;
    }[];
  } | null;
}

export default function Home() {
  const [data, setData] = useState<ResumoApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async (manual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (manual) setIsRefreshing(true);

    try {
      const res = await fetch('/api/resumo');
      if (res.ok) {
        const json: ResumoApiResponse = await res.json();
        setData(json);
        setError(null);
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson?.status === 'desatualizado' || errJson?.status === 'indisponivel') {
          // If we had prior data, keep it as per AGENTS.md
          setData(prev => {
            if (prev) {
              return {
                ...prev,
                status: 'desatualizado',
                mensagem:
                  'Dados temporariamente indisponíveis para atualização. Exibindo a última informação recebida do TSE.',
              };
            }
            return errJson;
          });
        } else {
          setError(errJson?.motivo || 'Erro ao consultar dados da apuração.');
        }
      }
    } catch {
      // If network fails and we have previous data, keep it and show outdated message
      setData(prev => {
        if (prev) {
          return {
            ...prev,
            status: 'desatualizado',
            mensagem:
              'Dados temporariamente indisponíveis para atualização. Exibindo a última informação recebida do TSE.',
          };
        }
        return null;
      });
      setError('Falha de conexão com a API interna.');
    } finally {
      setIsLoading(false);
      if (manual) setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds (paused when tab is hidden, no overlapping requests)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // Valid votes total = sum of valid votes of candidates
  const candidates = data?.dados?.candidates ?? [];
  let validVotesTotal: number | null = 0;
  for (const c of candidates) {
    if (c.votes === null) {
      validVotesTotal = null;
      break;
    }
    validVotesTotal += c.votes;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <ProfileBanner
        notice={data?.aviso}
        mode={data?.perfil?.mode}
        year={data?.perfil?.year}
        round={data?.perfil?.round}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          {/* Top Title & Status */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                Apuração Eleitoral {data?.perfil?.year ?? '2026'}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Acompanhamento oficial da eleição para Presidente da República — {data?.perfil?.round ?? '1'}º Turno
              </p>
            </div>
          </div>

          {/* Last Update Banner with refresh */}
          <LastUpdate
            obtidoEm={data?.obtidoEm}
            status={data?.status}
            mensagem={data?.mensagem}
            isRefreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
          />

          {error && !data && (
            <div
              role="alert"
              className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-center text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
            >
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fetchData(true)}
                className="mt-3 inline-flex items-center rounded border border-rose-400 bg-white px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-sm hover:bg-rose-50 dark:border-rose-700 dark:bg-rose-900 dark:text-rose-100"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Counting Progress */}
          <CountingProgress
            totalizedSections={data?.dados?.totalSections ?? null}
            totalSections={data?.dados?.totalSections ?? null}
          />

          {/* General Election Summary */}
          <ElectionSummary
            validVotes={validVotesTotal}
            whites={data?.dados?.whites ?? null}
            nulls={data?.dados?.nulls ?? null}
            turnout={data?.dados?.turnout ?? null}
          />

          {/* Search bar */}
          <SearchBar />

          {/* Candidate List */}
          <CandidateList
            candidates={candidates}
            validVotesTotal={validVotesTotal}
            isLoading={isLoading && !data}
          />
        </div>
      </main>

      <Footer obtidoEm={data?.obtidoEm} />
    </div>
  );
}
