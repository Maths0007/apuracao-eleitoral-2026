'use client';

import { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { ProfileBanner } from '../../components/ProfileBanner';
import { Footer } from '../../components/Footer';
import { CountrySelector, type ExteriorLocalityItem } from '../../components/CountrySelector';

interface ExteriorApiResponse {
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
  dados?: ExteriorLocalityItem[] | null;
}

export default function ExteriorPage() {
  const [data, setData] = useState<ExteriorApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExterior() {
      try {
        const res = await fetch('/api/exterior');
        const json: ExteriorApiResponse = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setError(json.motivo || 'Erro ao carregar dados do exterior.');
        }
      } catch {
        setError('Falha de conexão com a API interna.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchExterior();
  }, []);

  const localities = data?.dados ?? [];

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
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Votação no Exterior (UF: ZZ)
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Resultados apurados nas seções eleitorais de eleitores brasileiros no exterior.
            </p>
          </div>

          <div
            role="note"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              Critérios de conformidade oficial (TSE):
            </p>
            <p className="mt-1">
              • O vínculo entre código de localidade e país é exibido como <em>país indisponível</em> até que conste em tabela de correspondência oficial do TSE.
            </p>
            <p className="mt-0.5">
              • O quantitativo total esperado de seções em cada localidade externa é classificado como <em>total esperado indisponível</em> enquanto não houver cadastro oficial prévio consolidado. Nenhuma localidade é indicada como totalmente apurada sem homologação oficial.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-center text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
            >
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <CountrySelector localities={localities} isLoading={isLoading} />
        </div>
      </main>

      <Footer obtidoEm={data?.obtidoEm} />
    </div>
  );
}
