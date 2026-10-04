'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface LocalityItem {
  code: string;
  name: string | null;
  missingNameReason?: string;
}

interface LocationFiltersProps {
  onSectionSelect?: (params: { uf: string; municipio: string; zona: string; secao: string }) => void;
}

export function LocationFilters({ onSectionSelect }: LocationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [uf, setUf] = useState<string>(searchParams.get('uf') ?? '');
  const [municipio, setMunicipio] = useState<string>(searchParams.get('municipio') ?? '');
  const [zona, setZona] = useState<string>(searchParams.get('zona') ?? '');
  const [secao, setSecao] = useState<string>(searchParams.get('secao') ?? '');

  const [ufs, setUfs] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<LocalityItem[]>([]);
  const [zonas, setZonas] = useState<string[]>([]);
  const [secoes, setSecoes] = useState<string[]>([]);

  const [loadingLevel, setLoadingLevel] = useState<'ufs' | 'municipios' | 'zonas' | 'secoes' | null>(null);

  // Sync URL query params
  const updateUrl = useCallback((newParams: { uf?: string; municipio?: string; zona?: string; secao?: string }) => {
    const params = new URLSearchParams();
    if (newParams.uf) params.set('uf', newParams.uf);
    if (newParams.municipio) params.set('municipio', newParams.municipio);
    if (newParams.zona) params.set('zona', newParams.zona);
    if (newParams.secao) params.set('secao', newParams.secao);
    router.replace(`/detalhada?${params.toString()}`);
  }, [router]);

  // 1. Load UFs
  useEffect(() => {
    async function loadUfs() {
      setLoadingLevel('ufs');
      try {
        const res = await fetch('/api/localidades');
        if (res.ok) {
          const json = await res.json();
          if (json.dados?.level === 'ufs') {
            setUfs(json.dados.ufs);
          }
        }
      } finally {
        setLoadingLevel(null);
      }
    }
    loadUfs();
  }, []);

  // 2. Load Municipios when UF changes
  useEffect(() => {
    if (!uf) {
      setMunicipios([]);
      setZonas([]);
      setSecoes([]);
      return;
    }
    async function loadMunicipios() {
      setLoadingLevel('municipios');
      try {
        const res = await fetch(`/api/localidades?uf=${encodeURIComponent(uf)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.dados?.level === 'localidades') {
            setMunicipios(json.dados.localidades);
          }
        }
      } finally {
        setLoadingLevel(null);
      }
    }
    loadMunicipios();
  }, [uf]);

  // 3. Load Zonas when Municipio changes
  useEffect(() => {
    if (!uf || !municipio) {
      setZonas([]);
      setSecoes([]);
      return;
    }
    async function loadZonas() {
      setLoadingLevel('zonas');
      try {
        const res = await fetch(
          `/api/localidades?uf=${encodeURIComponent(uf)}&municipio=${encodeURIComponent(municipio)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.dados?.level === 'zonas') {
            setZonas(json.dados.zonas);
          }
        }
      } finally {
        setLoadingLevel(null);
      }
    }
    loadZonas();
  }, [uf, municipio]);

  // 4. Load Secoes when Zona changes
  useEffect(() => {
    if (!uf || !municipio || !zona) {
      setSecoes([]);
      return;
    }
    async function loadSecoes() {
      setLoadingLevel('secoes');
      try {
        const res = await fetch(
          `/api/localidades?uf=${encodeURIComponent(uf)}&municipio=${encodeURIComponent(municipio)}&zona=${encodeURIComponent(zona)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.dados?.level === 'secoes') {
            setSecoes(json.dados.secoes);
          }
        }
      } finally {
        setLoadingLevel(null);
      }
    }
    loadSecoes();
  }, [uf, municipio, zona]);

  // Trigger callback when complete
  useEffect(() => {
    if (uf && municipio && zona && secao) {
      onSectionSelect?.({ uf, municipio, zona, secao });
    }
  }, [uf, municipio, zona, secao, onSectionSelect]);

  const handleUfChange = (newUf: string) => {
    setUf(newUf);
    setMunicipio('');
    setZona('');
    setSecao('');
    updateUrl({ uf: newUf });
  };

  const handleMunicipioChange = (newMun: string) => {
    setMunicipio(newMun);
    setZona('');
    setSecao('');
    updateUrl({ uf, municipio: newMun });
  };

  const handleZonaChange = (newZona: string) => {
    setZona(newZona);
    setSecao('');
    updateUrl({ uf, municipio, zona: newZona });
  };

  const handleSecaoChange = (newSecao: string) => {
    setSecao(newSecao);
    updateUrl({ uf, municipio, zona, secao: newSecao });
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Filtros de Localidade e Seção
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Selecione sequencialmente o Estado, Município, Zona e Seção para consultar o boletim de urna oficial.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. UF */}
        <div>
          <label htmlFor="filter-uf" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Estado / UF {loadingLevel === 'ufs' && '⏳'}
          </label>
          <select
            id="filter-uf"
            value={uf}
            onChange={e => handleUfChange(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            aria-label="Selecionar Estado ou UF"
          >
            <option value="">Selecione a UF</option>
            {ufs.map(u => (
              <option key={u} value={u}>
                {u === 'ZZ' ? 'ZZ (Exterior)' : u}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Município */}
        <div>
          <label htmlFor="filter-municipio" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Município / Localidade {loadingLevel === 'municipios' && '⏳'}
          </label>
          <select
            id="filter-municipio"
            value={municipio}
            onChange={e => handleMunicipioChange(e.target.value)}
            disabled={!uf || municipios.length === 0}
            className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:disabled:bg-zinc-950"
            aria-label="Selecionar Município ou Localidade"
          >
            <option value="">
              {!uf ? 'Aguardando UF...' : municipios.length === 0 ? 'Nenhum município' : 'Selecione o Município'}
            </option>
            {municipios.map(m => (
              <option key={m.code} value={m.code}>
                {m.name ? `${m.name} (${m.code})` : `Município cód. ${m.code}`}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Zona */}
        <div>
          <label htmlFor="filter-zona" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Zona Eleitoral {loadingLevel === 'zonas' && '⏳'}
          </label>
          <select
            id="filter-zona"
            value={zona}
            onChange={e => handleZonaChange(e.target.value)}
            disabled={!municipio || zonas.length === 0}
            className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:disabled:bg-zinc-950"
            aria-label="Selecionar Zona Eleitoral"
          >
            <option value="">
              {!municipio ? 'Aguardando município...' : zonas.length === 0 ? 'Nenhuma zona' : 'Selecione a Zona'}
            </option>
            {zonas.map(z => (
              <option key={z} value={z}>
                Zona {z}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Seção */}
        <div>
          <label htmlFor="filter-secao" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Seção Eleitoral {loadingLevel === 'secoes' && '⏳'}
          </label>
          <select
            id="filter-secao"
            value={secao}
            onChange={e => handleSecaoChange(e.target.value)}
            disabled={!zona || secoes.length === 0}
            className="mt-1 block w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:disabled:bg-zinc-950"
            aria-label="Selecionar Seção Eleitoral"
          >
            <option value="">
              {!zona ? 'Aguardando zona...' : secoes.length === 0 ? 'Nenhuma seção' : 'Selecione a Seção'}
            </option>
            {secoes.map(s => (
              <option key={s} value={s}>
                Seção {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
