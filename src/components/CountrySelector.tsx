'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export interface ExteriorLocalityItem {
  locality: string;
  country: null;
  countryLabel: 'país indisponível';
  zones: string[];
}

interface CountrySelectorProps {
  localities: ExteriorLocalityItem[];
  isLoading?: boolean;
}

export function CountrySelector({ localities, isLoading = false }: CountrySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLocality, setExpandedLocality] = useState<string | null>(null);
  const [zoneSections, setZoneSections] = useState<Record<string, string[]>>({});
  const [loadingZone, setLoadingZone] = useState<string | null>(null);

  const filteredLocalities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return localities;
    return localities.filter(l => l.locality.toLowerCase().includes(term));
  }, [localities, searchTerm]);

  const toggleExpand = (loc: string) => {
    setExpandedLocality(expandedLocality === loc ? null : loc);
  };

  const loadSectionsForZone = async (locality: string, zone: string) => {
    const key = `${locality}_${zone}`;
    if (zoneSections[key]) return;

    setLoadingZone(key);
    try {
      const res = await fetch(
        `/api/localidades?uf=ZZ&municipio=${encodeURIComponent(locality)}&zona=${encodeURIComponent(zone)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.dados?.level === 'secoes') {
          setZoneSections(prev => ({ ...prev, [key]: json.dados.secoes }));
        }
      }
    } finally {
      setLoadingZone(null);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Carregando dados do exterior" className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-32 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div>
        <label htmlFor="search-exterior" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Buscar localidade no exterior
        </label>
        <input
          id="search-exterior"
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Ex: 29416, 29505..."
          className="mt-1 block w-full max-w-md rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>

      {filteredLocalities.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Nenhuma localidade encontrada no exterior para os termos informados.
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filteredLocalities.map(loc => {
            const isExpanded = expandedLocality === loc.locality;
            return (
              <div key={loc.locality} className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Localidade cód. {loc.locality}
                    </h3>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>País: <strong className="font-normal italic text-zinc-600 dark:text-zinc-300">{loc.countryLabel}</strong></span>
                      <span>•</span>
                      <span>Seções com resultado: <strong className="font-normal text-zinc-700 dark:text-zinc-300">total esperado indisponível</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(loc.locality)}
                    className="inline-flex items-center rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? 'Ocultar zonas ▲' : 'Ver zonas eleitorais ▼'}
                  </button>
                </div>

                {/* Sub-nível: Zonas e Seções */}
                {isExpanded && (
                  <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Zonas Eleitorais registradas nesta localidade:
                    </p>
                    <div className="mt-2 space-y-3">
                      {loc.zones.map(z => {
                        const zoneKey = `${loc.locality}_${z}`;
                        const secList = zoneSections[zoneKey];
                        const isLoadingThisZone = loadingZone === zoneKey;

                        return (
                          <div key={z} className="rounded border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                Zona {z}
                              </span>
                              {!secList && (
                                <button
                                  type="button"
                                  onClick={() => loadSectionsForZone(loc.locality, z)}
                                  disabled={isLoadingThisZone}
                                  className="rounded border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                  {isLoadingThisZone ? 'Carregando seções...' : 'Carregar seções'}
                                </button>
                              )}
                            </div>

                            {secList && (
                              <div className="mt-3">
                                <p className="font-medium text-zinc-600 dark:text-zinc-400">
                                  Seções disponíveis:
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {secList.map(s => (
                                    <Link
                                      key={s}
                                      href={`/detalhada?uf=ZZ&municipio=${loc.locality}&zona=${z}&secao=${s}`}
                                      className="inline-flex items-center rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                    >
                                      Seção {s} →
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
