'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { ProfileBanner } from '../../../components/ProfileBanner';
import { Footer } from '../../../components/Footer';
import type { CandidateDetail } from '../../../repositories/repository';

interface CandidatoApiResponse {
  fonte: string;
  obtidoEm?: string;
  aviso?: string | null;
  status: 'atualizado' | 'desatualizado' | 'indisponivel';
  motivo?: string | null;
  perfil?: {
    mode: 'atual' | 'historico';
    year: string;
    round: string;
  };
  dados?: CandidateDetail | null;
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const resolvedParams = use(params);
  const candidateNumber = resolvedParams.numero;

  const [data, setData] = useState<CandidatoApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localityQuery, setLocalityQuery] = useState('');

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const res = await fetch(`/api/candidato?numero=${encodeURIComponent(candidateNumber)}`);
        const json: CandidatoApiResponse = await res.json();
        if (res.ok && json.dados) {
          setData(json);
        } else {
          setError(json.motivo || 'Candidato não encontrado para o perfil atual.');
        }
      } catch {
        setError('Falha de conexão com a API interna.');
      } finally {
        setLoading(false);
      }
    }
    fetchCandidate();
  }, [candidateNumber]);

  const candidate = data?.dados;

  const filteredLocalities = useMemo(() => {
    if (!candidate?.votesByLocality) return [];
    const q = localityQuery.trim().toLowerCase();
    if (!q) return candidate.votesByLocality;
    return candidate.votesByLocality.filter(
      l => l.locality.toLowerCase().includes(q) || l.uf.toLowerCase().includes(q)
    );
  }, [candidate?.votesByLocality, localityQuery]);

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
          <div className="flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:underline">
              ← Voltar ao painel geral
            </Link>
          </div>

          {loading && (
            <div
              role="status"
              aria-busy="true"
              aria-label="Carregando dados do candidato"
              className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent dark:border-zinc-300" />
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Carregando dados do candidato...</p>
            </div>
          )}

          {error && !loading && (
            <div
              role="alert"
              className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-center text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
            >
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {candidate && !loading && (
            <>
              {/* Header do candidato */}
              <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center space-x-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <svg
                      className="h-8 w-8 text-zinc-400 dark:text-zinc-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="rounded border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        Nº {candidate.number}
                      </span>
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {candidate.party || 'partido indisponível'}
                      </span>
                    </div>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {candidate.name || `Candidato ${candidate.number}`}
                    </h1>
                  </div>
                </div>

                <div className="flex gap-6 border-t border-zinc-100 pt-4 md:border-t-0 md:pt-0 dark:border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Total de votos apurados</p>
                    <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                      {candidate.totalVotes !== null ? candidate.totalVotes.toLocaleString('pt-BR') : 'indisponível'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">% dos votos válidos</p>
                    <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                      {candidate.votesPercent !== null
                        ? `${candidate.votesPercent.toFixed(2).replace('.', ',')}%`
                        : 'indisponível'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Votos por UF e Exterior */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900 uppercase dark:text-zinc-100">
                  Votação por Estado (UF) e Exterior
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {candidate.votesByUf.map(item => (
                    <div
                      key={item.uf}
                      className="rounded border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        {item.uf === 'ZZ' ? 'Exterior (ZZ)' : item.uf}
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                        {item.votes.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Busca por localidade do candidato */}
              <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900 uppercase dark:text-zinc-100">
                    Votos por Localidade / Município
                  </h2>
                  <input
                    type="text"
                    value={localityQuery}
                    onChange={e => setLocalityQuery(e.target.value)}
                    placeholder="Filtrar por UF ou cód. do município..."
                    className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div className="mt-4 max-h-80 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                      <tr>
                        <th scope="col" className="px-4 py-2.5">UF</th>
                        <th scope="col" className="px-4 py-2.5">Localidade / Município</th>
                        <th scope="col" className="px-4 py-2.5 text-right">Votos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {filteredLocalities.map((loc, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-100">{loc.uf}</td>
                          <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">Município cód. {loc.locality}</td>
                          <td className="px-4 py-2 text-right font-bold text-zinc-900 dark:text-zinc-100">
                            {loc.votes.toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer obtidoEm={data?.obtidoEm} />
    </div>
  );
}
