import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Profile } from '../config/profiles';
import { profiles } from '../config/profiles';
import type { Repository } from '../repositories/repository';
import { parseBu } from '../parsers/bu';
import { normalizeBu } from '../core/normalize';
import { ingestBu } from './tse';

export type ImportOutcome = {
  profile: Profile;
  filesProcessed: number;
  totalSections: number;
  outcomes: {
    received: number;
    updated: number;
    unchanged: number;
    quarantined: number;
  };
};

export function findProfileByIdentifier(identifier: string): Profile | undefined {
  const clean = identifier.trim().toLowerCase();
  return profiles.find(p => {
    const key1 = `${p.mode}-${p.year}-${p.round}`;
    const key2 = `${p.year}-${p.round}`;
    const key3 = p.round;
    return clean === key1 || clean === key2 || clean === key3;
  });
}

export function getSampleFilesForProfile(profile: Profile): string[] {
  if (profile.year === '2022' && profile.round === '1') {
    return [
      'docs/amostras/2022/bweb_1t_AC_051020221321.recorte.csv',
      'docs/amostras/2022/bweb_1t_ZZ_051020221321.recorte.csv',
      'docs/amostras/2022/bweb_1t_ZZ_051020221321.anuladas.recorte.csv',
    ];
  }
  if (profile.year === '2022' && profile.round === '2') {
    return [
      'docs/amostras/2022/bweb_2t_AC_311020221535.recorte.csv',
      'docs/amostras/2022/bweb_2t_ZZ_311020221535.recorte.csv',
      'docs/amostras/2022/bweb_2t_ZZ_311020221535.anuladas.recorte.csv',
    ];
  }
  return [];
}

export async function importProfileSamples(
  profile: Profile,
  repository: Repository
): Promise<ImportOutcome> {
  const filePaths = getSampleFilesForProfile(profile);

  const stats = {
    received: 0,
    updated: 0,
    unchanged: 0,
    quarantined: 0,
  };
  let totalSections = 0;
  let filesProcessed = 0;

  for (const filePath of filePaths) {
    if (!existsSync(filePath)) continue;
    const bytes = readFileSync(filePath);
    const hash = createHash('sha256').update(bytes).digest('hex');
    const size = bytes.byteLength;
    filesProcessed++;

    const rows = parseBu(bytes);
    const sections = normalizeBu(rows, profile);
    totalSections += sections.length;

    const coverage = {
      completeSectionKeys: sections.map(s => s.key),
      evidence: 'docs/amostras/2022/README.md: todos os registros de Presidente das seções selecionadas',
    };

    let fileStatus: 'sucesso' | 'erro' | 'quarentena' = 'sucesso';
    let errorMessage: string | null = null;

    try {
      const outcomes = await ingestBu(bytes, profile, repository, coverage);
      for (const out of outcomes) {
        if (out === 'received') stats.received++;
        else if (out === 'updated') stats.updated++;
        else if (out === 'unchanged') stats.unchanged++;
        else if (out === 'quarantined') {
          stats.quarantined++;
          fileStatus = 'quarentena';
        }
      }
    } catch (err) {
      fileStatus = 'erro';
      errorMessage = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      await repository.recordImport({
        origin: 'amostras',
        url: filePath,
        timestamp: new Date().toISOString(),
        size,
        hash,
        recordCount: sections.length,
        status: fileStatus,
        errorMessage,
        profileMode: profile.mode,
        profileYear: profile.year,
        profileRound: profile.round,
        profileElection: profile.election,
      });
    }
  }

  return {
    profile,
    filesProcessed,
    totalSections,
    outcomes: stats,
  };
}
