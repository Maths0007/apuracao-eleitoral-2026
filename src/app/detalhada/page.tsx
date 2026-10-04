'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '../../components/Header';
import { ProfileBanner } from '../../components/ProfileBanner';
import { Footer } from '../../components/Footer';
import { LocationFilters } from '../../components/LocationFilters';
import { SectionResult } from '../../components/SectionResult';
import { SearchBar } from '../../components/SearchBar';
import type { PollingStationResult } from '../../core/normalize';

interface SecaoApiResponse {
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
  dados?: PollingStationResult | null;
}

function DetalhadaContent() {
  const searchParams = useSearchParams();
  const [sectionData, setSectionData] = useState<SecaoApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uf = searchParams.get('uf');
  const municipio = searchParams.get('municipio');
  const zona = searchParams.get('zona');
  const secao = searchParams.get('secao');

  const fetchSection = useCallback(async (u: string, m: string, z: string, s: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/secao?uf=${encodeURIComponent(u)}&municipio=${encodeURIComponent(m)}&zona=${encodeURIComponent(z)}&secao=${encodeURIComponent(s)}`
      );
      const json: SecaoApiResponse = await res.json();
      if (res.ok && json.dados) {
        setSectionData(json);
      } else {
        setSectionData(null);
        setError(json.motivo || 'Boletim da seção eleitoral não encontrado ou indisponível.');
      }
    } catch {
      setSectionData(null);
      setError('Falha de conexão com a API interna.');
    } finally {
      setLoading(false);
    }
  }, []);

  const [activeProfile, setActiveProfile] = useState<{
    aviso?: string | null;
    mode?: 'atual' | 'historico';
    year?: string;
    round?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(json => {
        if (json.dados?.perfilAtivo) {
          setActiveProfile({
            aviso: json.aviso,
            mode: json.dados.perfilAtivo.mode,
            year: json.dados.perfilAtivo.year,
            round: json.dados.perfilAtivo.round,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (uf && municipio && zona && secao) {
      fetchSection(uf, municipio, zona, secao);
    } else {
      setSectionData(null);
    }
  }, [uf, municipio, zona, secao, fetchSection]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <ProfileBanner
        notice={sectionData?.aviso ?? activeProfile?.aviso}
        mode={sectionData?.perfil?.mode ?? activeProfile?.mode}
        year={sectionData?.perfil?.year ?? activeProfile?.year}
        round={sectionData?.perfil?.round ?? activeProfile?.round}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Consulta de Votação Detalhada
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Navegue do Estado até a Seção Eleitoral para visualizar o Boletim de Urna completo.
            </p>
          </div>

          <LocationFilters />

          <SearchBar />

          {loading && (
            <div
              role="status"
              aria-busy="true"
              aria-label="Carregando boletim de urna"
              className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent dark:border-zinc-300" />
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Carregando boletim de urna oficial...
              </p>
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

          {sectionData?.dados && !loading && (
            <SectionResult
              sectionData={sectionData.dados}
              obtidoEm={sectionData.obtidoEm}
              fonte={sectionData.fonte}
            />
          )}

          {!uf && !loading && (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Selecione o Estado, Município, Zona e Seção nos filtros acima para consultar o boletim.
            </div>
          )}
        </div>
      </main>

      <Footer obtidoEm={sectionData?.obtidoEm} />
    </div>
  );
}

export default function DetalhadaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">Carregando filtros...</p>
        </div>
      }
    >
      <DetalhadaContent />
    </Suspense>
  );
}
