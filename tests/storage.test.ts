import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { profiles } from '../src/config/profiles';
import { parseBu } from '../src/parsers/bu';
import { normalizeBu } from '../src/core/normalize';
import { ingestBu } from '../src/services/tse';
import { SqliteRepository } from '../src/repositories/sqlite';
import { MemoryRepository } from '../src/repositories/memory';

const p1 = profiles[0]!, p2 = profiles[1]!;
const sample1 = readFileSync('docs/amostras/2022/bweb_1t_AC_051020221321.recorte.csv');

describe('Armazenamento SQLite e Memória', () => {
  it('grava, consulta e substitui seções com idempotência no SQLite', async () => {
    const repo = new SqliteRepository(':memory:');
    const sections = normalizeBu(parseBu(sample1), p1);
    const coverage = {
      completeSectionKeys: sections.map(s => s.key),
      evidence: 'docs/amostras/2022/README.md',
    };

    // 1. Ingestão inicial
    const outcomes1 = await ingestBu(sample1, p1, repo, coverage);
    expect(outcomes1).toEqual(['received', 'received']);

    // 2. Idempotência: reprocessar os mesmos dados não altera nada
    const outcomes2 = await ingestBu(sample1, p1, repo, coverage);
    expect(outcomes2).toEqual(['unchanged', 'unchanged']);

    // 3. Resumo agregado
    const summary = await repo.getSummary(p1);
    expect(summary.totalSections).toBe(2);
    expect(summary.turnout).toBe(377);
    expect(summary.whites).toBe(4);
    expect(summary.nulls).toBe(5);
    expect(summary.candidates.length).toBe(5);

    // 4. Candidatos únicos ordenados alfabeticamente
    const candidates = await repo.getCandidates(p1);
    expect(candidates.length).toBe(5);
    const names = candidates.map(c => c.name);
    const sorted = [...names].sort((a, b) => (a ?? '').localeCompare(b ?? '', 'pt-BR'));
    expect(names).toEqual(sorted);

    // 5. Localidades dependentes
    const ufs = await repo.getLocalities(p1);
    expect(ufs).toEqual({ level: 'ufs', ufs: ['AC'] });

    const locs = await repo.getLocalities(p1, { uf: 'AC' });
    expect(locs.level).toBe('localidades');
    if (locs.level === 'localidades') {
      expect(locs.localidades.map(l => l.code)).toContain('1392');
    }

    const zones = await repo.getLocalities(p1, { uf: 'AC', locality: '1392' });
    expect(zones.level).toBe('zonas');
    if (zones.level === 'zonas') {
      expect(zones.zonas).toContain('1');
    }

    const secoes = await repo.getLocalities(p1, { uf: 'AC', locality: '1392', zone: '1' });
    expect(secoes.level).toBe('secoes');
    if (secoes.level === 'secoes') {
      expect(secoes.secoes).toContain('3');
    }

    // 6. Separação por perfil: perfil do 2º turno não enxerga dados do 1º turno
    const summaryP2 = await repo.getSummary(p2);
    expect(summaryP2.totalSections).toBe(0);
    expect(summaryP2.turnout).toBeNull();
    expect(summaryP2.candidates).toHaveLength(0);

    repo.close();
  });

  it('quarentena grava erros em tabela separada sem alterar seções válidas', async () => {
    const repo = new SqliteRepository(':memory:');
    const sections = normalizeBu(parseBu(sample1), p1);
    const coverage = {
      completeSectionKeys: sections.map(s => s.key),
      evidence: 'docs/amostras/2022/README.md',
    };
    await ingestBu(sample1, p1, repo, coverage);

    // Criar item com erro de validação
    const badSection = structuredClone(sections[0]!);
    badSection.validation = 'Aguardando validação da fonte';
    badSection.issues = ['Inconsistência simulada'];
    badSection.nulls = 999;

    await repo.quarantine(badSection);

    // O dado na tabela principal continua o válido anterior
    const valid = await repo.get(badSection.key);
    expect(valid?.nulls).toBe(1);

    // O dado em quarentena está gravado
    const quarantined = await repo.getQuarantined(badSection.key);
    expect(quarantined?.nulls).toBe(999);
    expect(quarantined?.validation).toBe('Aguardando validação da fonte');

    repo.close();
  });

  it('registra e recupera auditoria de importações', async () => {
    const repo = new SqliteRepository(':memory:');
    await repo.recordImport({
      origin: 'amostras',
      url: 'docs/amostras/2022/bweb_1t_AC_051020221321.recorte.csv',
      timestamp: '2026-10-04T13:42:33-03:00',
      size: 6814,
      hash: 'sha256-abc',
      recordCount: 2,
      status: 'sucesso',
      profileMode: 'historico',
      profileYear: '2022',
      profileRound: '1',
      profileElection: '544',
    });

    const last = await repo.getLastImport(p1);
    expect(last).toBeDefined();
    expect(last?.recordCount).toBe(2);
    expect(last?.status).toBe('sucesso');

    const stats = await repo.getImportStats(p1);
    expect(stats).toEqual({ processed: 2, errors: 0 });

    repo.close();
  });

  it('MemoryRepository mantém paridade de comportamento', async () => {
    const repo = new MemoryRepository();
    const sections = normalizeBu(parseBu(sample1), p1);
    const coverage = {
      completeSectionKeys: sections.map(s => s.key),
      evidence: 'docs/amostras/2022/README.md',
    };
    await ingestBu(sample1, p1, repo, coverage);

    const summary = await repo.getSummary(p1);
    expect(summary.totalSections).toBe(2);
    expect(summary.turnout).toBe(377);

    const cands = await repo.getCandidates(p1);
    expect(cands).toHaveLength(5);
  });
});
