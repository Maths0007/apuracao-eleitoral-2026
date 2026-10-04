'use client';

import { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { ProfileBanner } from '../../components/ProfileBanner';
import { Footer } from '../../components/Footer';

interface StatusApiResponse {
  fonte: string;
  obtidoEm?: string;
  aviso?: string | null;
  status: 'atualizado' | 'desatualizado' | 'indisponivel';
  dados?: {
    perfilAtivo: {
      mode: 'atual' | 'historico';
      year: string;
      round: string;
      cycle: string;
      pleito: string;
      election: string;
      contract: string;
      channel: string;
      source: string;
    };
    ultimaImportacao?: {
      origin: string;
      url: string;
      timestamp: string;
      size: number;
      hash: string;
      recordCount: number;
      status: string;
      errorMessage?: string | null;
    } | null;
    motivoUltimaImportacao?: string | null;
    registrosProcessados: number;
    erros: number;
  };
}

export default function SobrePage() {
  const [data, setData] = useState<StatusApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <ProfileBanner
        notice={data?.aviso}
        mode={data?.dados?.perfilAtivo.mode}
        year={data?.dados?.perfilAtivo.year}
        round={data?.dados?.perfilAtivo.round}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Sobre os dados
            </h1>

            {/* Texto obrigatório inegociável do AGENTS.md */}
            <div className="mt-4 rounded-md border-l-4 border-zinc-500 bg-zinc-50 p-4 text-sm leading-relaxed font-medium text-zinc-800 dark:border-zinc-400 dark:bg-zinc-950 dark:text-zinc-200">
              Este site não realiza apuração própria. Os números exibidos são obtidos de dados oficiais disponibilizados pelo Tribunal Superior Eleitoral (TSE).
            </div>

            <div className="mt-6 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                Todas as informações apresentadas neste portal são provenientes de arquivos e arquivos consolidados disponibilizados exclusivamente pelo Tribunal Superior Eleitoral — TSE. A plataforma segue diretrizes rigorosas de neutralidade:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>Nenhuma simulação ou interpolação de votos quando dados estiverem ausentes.</li>
                <li>Valores não publicados são exibidos estritamente como &quot;indisponível&quot;, nunca como zero.</li>
                <li>Ordem alfabética por padrão em todas as listas de candidatos.</li>
                <li>Paleta de cores neutra sem associação a legendas partidárias ou candidaturas.</li>
                <li>Navegação auditável até o nível de seção e boletim de urna (BU).</li>
              </ul>
            </div>
          </div>

          {/* Status técnico e auditoria */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Status Técnico e Auditoria da Fonte
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Métricas obtidas em tempo real a partir da infraestrutura interna de sincronização.
            </p>

            {loading ? (
              <p className="mt-4 text-sm text-zinc-500">Carregando métricas de auditoria...</p>
            ) : (
              <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                <div className="flex justify-between py-2.5">
                  <dt className="text-zinc-500 dark:text-zinc-400">Fonte Oficial</dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{data?.fonte || 'TSE'}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-zinc-500 dark:text-zinc-400">Horário da última consulta</dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {data?.obtidoEm ? `${data.obtidoEm} (Brasília)` : 'indisponível'}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-zinc-500 dark:text-zinc-400">Perfil Eleitoral Ativo</dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {data?.dados?.perfilAtivo.mode === 'historico' ? 'Histórico (Ensaio)' : 'Eleição 2026 (Atual)'} — Ano {data?.dados?.perfilAtivo.year}, Turno {data?.dados?.perfilAtivo.round}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-zinc-500 dark:text-zinc-400">Contrato de Dados</dt>
                  <dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
                    {data?.dados?.perfilAtivo.contract}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-zinc-500 dark:text-zinc-400">Registros Processados no Banco Local</dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {data?.dados?.registrosProcessados?.toLocaleString('pt-BR') ?? '0'}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-zinc-500 dark:text-zinc-400">Erros ou Quarentenas de Sincronização</dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {data?.dados?.erros ?? 0}
                  </dd>
                </div>
                {data?.dados?.ultimaImportacao && (
                  <div className="flex justify-between py-2.5">
                    <dt className="text-zinc-500 dark:text-zinc-400">Última Importação Concluída</dt>
                    <dd className="text-right text-xs text-zinc-800 dark:text-zinc-200">
                      <div>Status: <strong>{data.dados.ultimaImportacao.status}</strong></div>
                      <div>Data: {data.dados.ultimaImportacao.timestamp}</div>
                      <div>Registros: {data.dados.ultimaImportacao.recordCount}</div>
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </main>

      <Footer obtidoEm={data?.obtidoEm} />
    </div>
  );
}
