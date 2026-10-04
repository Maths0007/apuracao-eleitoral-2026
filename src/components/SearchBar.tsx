'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResultItem {
  uf: string;
  locality: string;
  zone: string;
  section: string;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/busca?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.dados ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    router.push(
      `/detalhada?uf=${item.uf}&municipio=${item.locality}&zona=${item.zone}&secao=${item.section}`
    );
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 uppercase dark:text-zinc-100">
        Buscar Zona ou Seção
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Digite o número da zona, seção ou sigla da UF para localizar no banco de dados.
      </p>

      <form onSubmit={handleSearch} className="mt-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ex: AC, 1, 38..."
          className="flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          aria-label="Buscar zona, seção ou localidade"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="rounded border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {hasSearched && (
        <div className="mt-4" aria-live="polite">
          {results && results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {results.length} resultado(s) encontrado(s):
              </p>
              <ul className="divide-y divide-zinc-100 rounded border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-700">
                {results.map((r, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => handleSelect(r)}
                      className="flex w-full items-center justify-between p-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        UF: {r.uf} | Município: {r.locality} | Zona: {r.zone} | Seção:{' '}
                        {r.section}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Ver boletim →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              Nenhum resultado encontrado para os parâmetros informados.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
