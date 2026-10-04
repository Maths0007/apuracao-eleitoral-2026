import { z } from 'zod';
import { csv, absent, count } from '../core/csv';
import { ContratoInesperado } from '../core/errors';
export const BU_HEADER = ['DT_GERACAO','HH_GERACAO','ANO_ELEICAO','CD_TIPO_ELEICAO','NM_TIPO_ELEICAO','CD_PLEITO','DT_PLEITO','NR_TURNO','CD_ELEICAO','DS_ELEICAO','SG_UF','CD_MUNICIPIO','NM_MUNICIPIO','NR_ZONA','NR_SECAO','NR_LOCAL_VOTACAO','CD_CARGO_PERGUNTA','DS_CARGO_PERGUNTA','NR_PARTIDO','SG_PARTIDO','NM_PARTIDO','DT_BU_RECEBIDO','QT_APTOS','QT_COMPARECIMENTO','QT_ABSTENCOES','CD_TIPO_URNA','DS_TIPO_URNA','CD_TIPO_VOTAVEL','DS_TIPO_VOTAVEL','NR_VOTAVEL','NM_VOTAVEL','QT_VOTOS','NR_URNA_EFETIVADA','CD_CARGA_1_URNA_EFETIVADA','CD_CARGA_2_URNA_EFETIVADA','CD_FLASHCARD_URNA_EFETIVADA','DT_CARGA_URNA_EFETIVADA','DS_CARGO_PERGUNTA_SECAO','DS_AGREGADAS','DT_ABERTURA','DT_ENCERRAMENTO','QT_ELEITORES_BIOMETRIA_NH','DT_EMISSAO_BU','NR_JUNTA_APURADORA','NR_TURMA_APURADORA'] as const;
export const buRowSchema = z.record(z.enum(BU_HEADER), z.string());
export type BuRaw = z.infer<typeof buRowSchema>;
export type BuRow = { raw: BuRaw; values: Record<keyof BuRaw, string | null> };
export function parseBu(bytes: Uint8Array): BuRow[] {
  const [header, ...rows] = csv(bytes);
  if (JSON.stringify(header) !== JSON.stringify(BU_HEADER)) throw new ContratoInesperado('Cabeçalho BU diferente dos 45 campos confirmados');
  if (!rows.length) throw new ContratoInesperado('BU sem linhas');
  return rows.map(cells => {
    if (cells.length !== BU_HEADER.length) throw new ContratoInesperado('Quantidade de campos BU inesperada');
    const raw = buRowSchema.parse(Object.fromEntries(BU_HEADER.map((name, i) => [name, cells[i]])));
    for (const name of ['QT_VOTOS','QT_APTOS','QT_COMPARECIMENTO','QT_ABSTENCOES','QT_ELEITORES_BIOMETRIA_NH'] as const) count(raw[name]);
    return { raw, values: Object.fromEntries(BU_HEADER.map(name => [name, absent(raw[name]) ? null : raw[name]])) as BuRow['values'] };
  });
}
