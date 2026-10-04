import { z } from 'zod';
import { absent, count, csv } from '../core/csv';
import { ContratoInesperado } from '../core/errors';
import type { Profile } from '../config/profiles';
const BASE = ['DT_TOTALIZACAO','QT_SECOES_TOTAL','QT_APTOS_TOTAL','QT_SECOES_TOT','QT_SECOES_TOT_ACUMULADO','PE_SECOES_TOT_ACUMULADO','QT_APTOS_TOT','QT_APTOS_TOT_ACUMULADO','QT_VOTOS_TOTAL','QT_VOTOS_TOTAL_ACUMULADO','QT_VOTOS_CONCORRENTES','QT_VOTOS_CONCORRENTES_ACUMULADO'];
const IDENTIFIERS = ['CD_PLEITO','CD_ELEICAO','CD_CARGO','SG_UE_UF'];
const SUFFIXES = ['_QT_VOTOS_TOT','_QT_VOTOS_TOT_ACUMULADO','_PE_VOTOS_TOT_ACUMULADO'];
export const historyCellSchema = z.union([z.string(), z.number().finite(), z.null()]);
export type HistoryCell = z.infer<typeof historyCellSchema>;
export function parseHistory(bytes: Uint8Array, profile: Profile) {
  if (profile.year !== '2022' || profile.mode !== 'historico') throw new ContratoInesperado('Contrato histórico restrito a 2022');
  const [originalHeader, ...rows] = csv(bytes);
  const header = originalHeader?.map(v => v.trim()) ?? [];
  const prefix = profile.round === '2' ? [...IDENTIFIERS, ...BASE] : BASE;
  if (JSON.stringify(header.slice(0, prefix.length)) !== JSON.stringify(prefix) || new Set(header).size !== header.length) throw new ContratoInesperado('Cabeçalho histórico inesperado');
  const groups: string[] = [];
  for (let i = prefix.length; i < header.length; i += 3) {
    const name = header[i]?.replace(/_QT_VOTOS_TOT$/, '');
    if (!name || SUFFIXES.some((suffix, j) => header[i+j] !== name + suffix)) throw new ContratoInesperado('Grupo de votos inesperado');
    groups.push(name);
  }
  if (groups.length < 3 || groups.at(-2) !== 'BRANCO' || groups.at(-1) !== 'NULO') throw new ContratoInesperado('Grupos de branco/nulo ausentes');
  const rowSchema = z.object(Object.fromEntries(header.map(name => [name, z.string()]))).strict();
  return { candidates: groups.slice(0, -2), rows: rows.map(cells => {
    if (cells.length !== header.length) throw new ContratoInesperado('Linha histórica incompatível');
    const raw = rowSchema.parse(Object.fromEntries(header.map((h,i) => [h,cells[i]])));
    if (profile.round === '2' && (raw.CD_PLEITO?.trim() !== profile.pleito || raw.CD_ELEICAO?.trim() !== profile.election || raw.CD_CARGO?.trim() !== profile.office || raw.SG_UE_UF?.trim() !== 'BR')) throw new ContratoInesperado('Identidade histórica incompatível');
    const values: Record<string, HistoryCell> = {};
    for (const h of header) {
      const value = raw[h]!;
      if (absent(value)) values[h] = null;
      else if (h === 'DT_TOTALIZACAO' || IDENTIFIERS.includes(h)) values[h] = value.trim();
      else if (h.startsWith('PE_') || h.includes('_PE_')) {
        if (!/^\d+,\d{6}$/.test(value.trim())) throw new ContratoInesperado('Razão decimal inesperada');
        values[h] = historyCellSchema.parse(Number(value.trim().replace(',', '.')));
      } else values[h] = count(value);
    }
    return { raw, values };
  }) };
}
