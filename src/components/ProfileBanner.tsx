'use client';

import { useState, useEffect } from 'react';

interface ProfileBannerProps {
  notice?: string | null;
  mode?: 'atual' | 'historico';
  year?: string;
  round?: string;
}

export function ProfileBanner({ notice, mode, year, round }: ProfileBannerProps) {
  const [profileNotice, setProfileNotice] = useState<string | null | undefined>(notice);
  const [profileMode, setProfileMode] = useState<'atual' | 'historico' | undefined>(mode);
  const [profileYear, setProfileYear] = useState<string | undefined>(year);
  const [profileRound, setProfileRound] = useState<string | undefined>(round);

  useEffect(() => {
    // Se notice ou mode já foi fornecido diretamente via props, usa diretamente
    if (notice !== undefined || mode !== undefined) {
      setProfileNotice(notice);
      setProfileMode(mode);
      setProfileYear(year);
      setProfileRound(round);
      return;
    }

    // Caso contrário, busca o perfil ativo via API interna /api/status
    let isMounted = true;
    fetch('/api/status')
      .then(res => res.json())
      .then(json => {
        if (!isMounted) return;
        setProfileNotice(json.aviso ?? null);
        setProfileMode(json.dados?.perfilAtivo?.mode);
        setProfileYear(json.dados?.perfilAtivo?.year);
        setProfileRound(json.dados?.perfilAtivo?.round);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [notice, mode, year, round]);

  const displayNotice =
    profileNotice ||
    (profileMode === 'historico'
      ? `ENSAIO — DADOS HISTÓRICOS OFICIAIS DO TSE — ELEIÇÃO ${profileYear ?? '2022'} — ${profileRound ?? '1'}º TURNO`
      : null);

  if (!displayNotice) {
    return null;
  }

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold tracking-wide text-amber-950 sm:text-sm dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center space-x-2">
        <span aria-hidden="true" className="font-bold">⚠️</span>
        <span data-testid="historical-banner-text">{displayNotice}</span>
      </div>
    </div>
  );
}
