import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { profiles, serverProfile } from '../src/config/profiles';
import { parseBu, BU_HEADER } from '../src/parsers/bu';
import { parseConfiguration } from '../src/parsers/configuration';
import { parseHistory } from '../src/parsers/history';
import { normalizeBu } from '../src/core/normalize';
import { count, csv } from '../src/core/csv';
import { ContratoInesperado, NaoConfirmado } from '../src/core/errors';
import { ingestBu, naoConfirmado, UNCONFIRMED } from '../src/services/tse';
import { MemoryRepository } from '../src/repositories/memory';
const sample = (name: string) => readFileSync(`docs/amostras/2022/${name}`);
const files = ['bweb_1t_AC_051020221321.recorte.csv','bweb_1t_ZZ_051020221321.recorte.csv','bweb_2t_AC_311020221535.recorte.csv','bweb_2t_ZZ_311020221535.recorte.csv'];
const p1 = profiles[0]!, p2 = profiles[1]!;
const bytes = sample(files[0]!);
const coverage = { completeSectionKeys: normalizeBu(parseBu(bytes), p1).map(s => s.key), evidence: 'docs/amostras/2022/README.md: todos os registros de Presidente das seções selecionadas' };
// Synthetic mutations remain confined to tests; no fixture enters the application.
function modified(replace: (rows: string[][]) => void) {
  const rows = csv(bytes); replace(rows);
  return Buffer.from(rows.map(row => row.map(v => `"${v.replaceAll('"','""')}"`).join(';')).join('\r\n'), 'latin1');
}
describe('Contratos oficiais observados', () => {
  it.each(files)('lê Latin-1 e 45 campos: %s', file => {
    const rows = parseBu(sample(file));
    expect(Object.keys(rows[0]!.raw)).toHaveLength(45);
    expect(rows[0]!.raw.NM_TIPO_ELEICAO).toBe('Eleição Ordinária');
    expect(normalizeBu(rows, file.includes('1t') ? p1 : p2).every(s => s.validation === 'validado')).toBe(true);
  });
  it.each(['','#NULO#','-1','-3','#NE'])('preserva ausência: %s', sentinel => {
    expect(count(sentinel)).toBeNull();
    const rows = parseBu(modified(rows => { rows[1]![BU_HEADER.indexOf('NR_PARTIDO')] = sentinel; }));
    expect(rows[0]!.raw.NR_PARTIDO).toBe(sentinel); expect(rows[0]!.values.NR_PARTIDO).toBeNull();
  });
  it('preserva zeros à esquerda e zeros publicados', () => {
    const rows = parseBu(modified(rows => { rows[1]![BU_HEADER.indexOf('NR_ZONA')] = '0001'; }));
    expect(rows[0]!.values.NR_ZONA).toBe('0001'); expect(count('0')).toBe(0);
  });
  it('comparecimento único, brancos/nulos em linhas e agregadas intactas', () => {
    const sections = normalizeBu(parseBu(bytes), p1);
    expect(sections.map(s => s.turnout)).toEqual([155,222]);
    expect(sections[0]).toMatchObject({ whites: 2, nulls: 1, country: null, aggregatedRaw: '#NULO#' });
    expect(sections[0]!.candidates.reduce((n,c) => n + c.votes!, 0)).toBe(152);
    expect(sections[1]!.aggregatedRaw).toBe('11');
  });
  it.each([1,2])('preserva urnas anuladas, turno %s', round => {
    const file = round === 1 ? 'bweb_1t_ZZ_051020221321.anuladas.recorte.csv' : 'bweb_2t_ZZ_311020221535.anuladas.recorte.csv';
    const sections = normalizeBu(parseBu(sample(file)), round === 1 ? p1 : p2, vi.fn());
    expect(sections.every(s => s.urnType === 'ANULADA')).toBe(true);
    expect(sections.find(s => s.section === '91')?.turnout).toBe(0);
  });
  it('rejeita alteração do cabeçalho e largura da linha', () => {
    expect(() => parseBu(modified(rows => { rows[0]![0] = 'NOVO_CAMPO'; }))).toThrow(ContratoInesperado);
    expect(() => parseBu(modified(rows => { rows[1]!.pop(); }))).toThrow(ContratoInesperado);
  });
  it('rejeita votos inválidos, duplicatas e mistura de perfis', () => {
    expect(() => count('1.5')).toThrow(); expect(() => count('9007199254740992')).toThrow();
    expect(() => normalizeBu(parseBu(bytes), p2)).toThrow(ContratoInesperado);
    expect(() => normalizeBu(parseBu(modified(rows => { rows.push(rows[1]!); })), p1)).toThrow(ContratoInesperado);
  });
  it.each([1,2])('descobre candidatos e decimais no histórico do turno %s', round => {
    const result = parseHistory(sample(`Historico_Totalizacao_Presidente_BR_${round}T_2022.recorte.csv`), round === 1 ? p1 : p2);
    expect(result.candidates).toHaveLength(round === 1 ? 11 : 2);
    expect(result.rows.at(-1)!.values.PE_SECOES_TOT_ACUMULADO).toBe(1);
    expect(result.rows.at(-1)!.values.QT_VOTOS_TOTAL_ACUMULADO).toBe(round === 1 ? 123682372 : 124252796);
  });
  it('rejeita histórico do turno errado e coluna candidata alterada', () => {
    const b = sample('Historico_Totalizacao_Presidente_BR_2T_2022.recorte.csv');
    expect(() => parseHistory(b, p1)).toThrow(ContratoInesperado);
    expect(() => parseHistory(Buffer.from(b.toString('latin1').replace('_QT_VOTOS_TOT;', '_CAMPO_NOVO;'),'latin1'),p2)).toThrow(ContratoInesperado);
  });
  it('valida configuração real e falha se formato muda', () => {
    const raw = JSON.parse(readFileSync('docs/amostras/configuracao-atual/ele-c.json','utf8'));
    expect(parseConfiguration(raw).pl.find(p => p.cd === profiles[2]!.pleito)?.e.some(e => e.cd === profiles[2]!.election)).toBe(true);
    expect(() => parseConfiguration({ ...raw, novo: 'campo' })).toThrow(ContratoInesperado);
  });
  it('seleção somente por perfil aprovado, sem fallback', () => {
    expect(serverProfile({ ELECTION_MODE:'atual', ELECTION_YEAR:'2026', ELECTION_ROUND:'1' }).election).toBe(profiles[2]!.election);
    expect(() => serverProfile({ ELECTION_MODE:'atual', ELECTION_YEAR:'2026', ELECTION_ROUND:'2' })).toThrow(NaoConfirmado);
    for (const feature of UNCONFIRMED) expect(() => naoConfirmado(feature)).toThrow('docs/lacunas.md#contratos-nao-confirmados');
  });
});
describe('Ingestão por seção', () => {
  it('idempotência, revisão substitui e turno não colide', async () => {
    const repo = new MemoryRepository();
    expect(await ingestBu(bytes,p1,repo,coverage)).toEqual(['received','received']);
    expect(await ingestBu(bytes,p1,repo,coverage)).toEqual(['unchanged','unchanged']);
    const revision = modified(rows => { rows[1]![BU_HEADER.indexOf('QT_VOTOS')] = '0'; });
    expect(await ingestBu(revision,p1,repo,coverage)).toEqual(['updated','unchanged']);
    expect((await repo.get(coverage.completeSectionKeys[0]!))!.nulls).toBe(0);
    const b2 = sample(files[2]!); const keys2 = normalizeBu(parseBu(b2),p2).map(s=>s.key);
    expect(keys2.some(key => coverage.completeSectionKeys.includes(key))).toBe(false);
    await ingestBu(b2,p2,repo,{...coverage,completeSectionKeys:keys2});
    expect((await repo.get(keys2[0]!))!.turnout).toBe(147);
    expect((await repo.get(coverage.completeSectionKeys[0]!))!.turnout).toBe(155);
  });
  it('quarentena não corrige votos nem substitui último estado válido', async () => {
    const repo = new MemoryRepository(), log = vi.fn();
    await ingestBu(bytes,p1,repo,coverage);
    const bad = modified(rows => { rows[1]![BU_HEADER.indexOf('QT_VOTOS')] = '999'; });
    expect(await ingestBu(bad,p1,repo,coverage,log)).toEqual(['quarantined','unchanged']);
    expect(log).toHaveBeenCalledOnce();
    const key = coverage.completeSectionKeys[0]!;
    expect((await repo.getQuarantined(key))!).toMatchObject({ nulls:999, validation:'Aguardando validação da fonte' });
    expect((await repo.get(key))!.nulls).toBe(1);
  });
  it('não escolhe comparecimento arbitrário em divergência', () => {
    const sections = normalizeBu(parseBu(modified(rows => { rows[1]![BU_HEADER.indexOf('QT_COMPARECIMENTO')] = '156'; })),p1,vi.fn());
    expect(sections[0]!.turnout).toBeNull(); expect(sections[0]!.validation).toBe('Aguardando validação da fonte');
  });
  it('não publica recorte sem comprovação de completude', async () => {
    await expect(ingestBu(bytes,p1,new MemoryRepository(),{ completeSectionKeys:[], evidence:'' })).rejects.toThrow('Completude');
  });
});
