import { createHash } from 'node:crypto';
import type { Profile } from '../config/profiles';
import type { BuRaw, BuRow } from '../parsers/bu';
import { count, absent } from './csv';
import { ContratoInesperado } from './errors';
export type PollingStationResult = {
  key: string; profile: Profile; revision: string; raw: BuRaw[];
  uf: string; locality: string; zone: string; section: string; office: string;
  country: null; countryLabel: 'país indisponível'; aggregatedRaw: string;
  urnType: string; turnout: number | null; whites: number | null; nulls: number | null;
  candidates: { number: string; name: string | null; party: string | null; votes: number | null }[];
  validation: 'validado' | 'Aguardando validação da fonte'; issues: string[];
};
export type ValidationLogger = (event: { key: string; issues: string[] }) => void;
export function stationKey(row: BuRaw, profile: Profile): string {
  return JSON.stringify([profile.mode,profile.channel,profile.year,profile.cycle,profile.pleito,profile.election,profile.round,profile.contract,row.SG_UF,row.CD_MUNICIPIO,row.NR_ZONA,row.NR_SECAO,row.CD_CARGO_PERGUNTA]);
}
export function normalizeBu(rows: BuRow[], profile: Profile, log: ValidationLogger = event => console.error('Validação TSE', event)): PollingStationResult[] {
  if (profile.channel !== 'bu-csv' || profile.contract !== 'bu-csv-2022-v1') throw new ContratoInesperado('Perfil sem contrato BU confirmado');
  const groups = new Map<string, BuRaw[]>();
  for (const { raw } of rows) {
    if (raw.ANO_ELEICAO !== profile.year || raw.CD_PLEITO !== profile.pleito || raw.CD_ELEICAO !== profile.election || raw.NR_TURNO !== profile.round || raw.CD_CARGO_PERGUNTA !== profile.office) throw new ContratoInesperado('BU incompatível com perfil');
    for (const field of ['SG_UF','CD_MUNICIPIO','NR_ZONA','NR_SECAO','CD_CARGO_PERGUNTA','NR_VOTAVEL','CD_TIPO_VOTAVEL'] as const) if (absent(raw[field])) throw new ContratoInesperado(`Identidade ausente: ${field}`);
    const key = stationKey(raw, profile); const group = groups.get(key) ?? []; group.push(raw); groups.set(key, group);
  }
  return [...groups].map(([key, raw]) => {
    const first = raw[0]!; const issues: string[] = [];
    const seen = new Set<string>();
    for (const row of raw) {
      const id = JSON.stringify([row.CD_TIPO_VOTAVEL, row.NR_VOTAVEL]);
      if (seen.has(id)) throw new ContratoInesperado('Votável duplicado na mesma seção/revisão'); seen.add(id);
    }
    const consistent = (field: keyof BuRaw) => new Set(raw.map(r => r[field])).size === 1;
    for (const field of ['QT_COMPARECIMENTO','QT_APTOS','QT_ABSTENCOES','DS_TIPO_URNA','CD_TIPO_URNA','DS_AGREGADAS','DT_EMISSAO_BU'] as const) if (!consistent(field)) issues.push(`Valores divergentes: ${field}`);
    const turnout = consistent('QT_COMPARECIMENTO') ? count(first.QT_COMPARECIMENTO) : null;
    const extract = (number: string) => { const selected = raw.filter(r => r.NR_VOTAVEL === number); return selected.length === 1 ? count(selected[0]!.QT_VOTOS) : null; };
    const whites = extract('95'), nulls = extract('96');
    const candidates = raw.filter(r => !['95','96'].includes(r.NR_VOTAVEL) && r.CD_TIPO_VOTAVEL === '1').map(r => ({ number: r.NR_VOTAVEL, name: absent(r.NM_VOTAVEL) ? null : r.NM_VOTAVEL, party: absent(r.SG_PARTIDO) ? null : r.SG_PARTIDO, votes: count(r.QT_VOTOS) }));
    if (raw.some(r => !['95','96'].includes(r.NR_VOTAVEL) && r.CD_TIPO_VOTAVEL !== '1')) issues.push('Categoria de votável não confirmada');
    const quantities = [whites, nulls, ...candidates.map(c => c.votes)];
    if (turnout === null || quantities.some(v => v === null)) issues.push('Contagens indisponíveis para validação');
    else if (quantities.reduce<number>((a,b) => a + b!, 0) > turnout) issues.push('Votos de candidatos + brancos + nulos excedem comparecimento');
    if (issues.length) log({ key, issues });
    const canonical = [...raw].sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return { key, profile: structuredClone(profile), revision: createHash('sha256').update(JSON.stringify(canonical)).digest('hex'), raw: structuredClone(raw), uf: first.SG_UF, locality: first.CD_MUNICIPIO, zone: first.NR_ZONA, section: first.NR_SECAO, office: first.CD_CARGO_PERGUNTA, country: null, countryLabel: 'país indisponível', aggregatedRaw: first.DS_AGREGADAS, urnType: first.DS_TIPO_URNA, turnout, whites, nulls, candidates, validation: issues.length ? 'Aguardando validação da fonte' : 'validado', issues } satisfies PollingStationResult;
  });
}
